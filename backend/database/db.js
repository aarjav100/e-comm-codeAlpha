const fs = require('fs').promises;
const path = require('path');

const DB_DIR = path.join(__dirname);

// Write queues to prevent concurrent file write corruption
const writeQueues = {};

async function enqueueWrite(filePath, writeOperation) {
  if (!writeQueues[filePath]) {
    writeQueues[filePath] = Promise.resolve();
  }
  
  const currentQueue = writeQueues[filePath];
  const nextQueue = currentQueue.then(async () => {
    try {
      await writeOperation();
    } catch (err) {
      console.error(`Database write queue error for ${filePath}:`, err);
      throw err;
    }
  });
  
  writeQueues[filePath] = nextQueue.catch(() => {}); // catch errors so queue doesn't block forever
  return nextQueue;
}

async function initCollection(collectionName) {
  const filePath = path.join(DB_DIR, `${collectionName}.json`);
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    await fs.access(filePath);
  } catch (err) {
    // File doesn't exist, create it with empty array
    await fs.writeFile(filePath, JSON.stringify([], null, 2), 'utf8');
  }
  return filePath;
}

const db = {
  /**
   * Fetch all records matching the filter function.
   */
  async find(collectionName, filterFn = () => true) {
    const filePath = await initCollection(collectionName);
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);
      return data.filter(filterFn);
    } catch (err) {
      console.error(`Error reading collection ${collectionName}:`, err);
      return [];
    }
  },

  /**
   * Fetch a single record matching the filter function.
   */
  async findOne(collectionName, filterFn) {
    const filePath = await initCollection(collectionName);
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);
      return data.find(filterFn) || null;
    } catch (err) {
      console.error(`Error reading collection ${collectionName}:`, err);
      return null;
    }
  },

  /**
   * Insert a new record. Generates automatic string ID if not present.
   */
  async insert(collectionName, document) {
    const filePath = await initCollection(collectionName);
    const newDoc = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
      ...document
    };

    await enqueueWrite(filePath, async () => {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);
      data.push(newDoc);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    });

    return newDoc;
  },

  /**
   * Update a record by ID.
   */
  async update(collectionName, id, updates) {
    const filePath = await initCollection(collectionName);
    let updatedDoc = null;

    await enqueueWrite(filePath, async () => {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);
      const index = data.findIndex(item => item.id === id);
      
      if (index !== -1) {
        data[index] = {
          ...data[index],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        updatedDoc = data[index];
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      }
    });

    return updatedDoc;
  },

  /**
   * Delete a record by ID.
   */
  async delete(collectionName, id) {
    const filePath = await initCollection(collectionName);
    let deleted = false;

    await enqueueWrite(filePath, async () => {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);
      const filtered = data.filter(item => item.id !== id);
      
      if (filtered.length !== data.length) {
        deleted = true;
        await fs.writeFile(filePath, JSON.stringify(filtered, null, 2), 'utf8');
      }
    });

    return deleted;
  }
};

module.exports = db;
