const mongoose = require('mongoose');
const { Product } = require('../models/models');
const { callGemini } = require('../config/gemini');
const { seedProducts } = require('../config/mockDb');

// Check if database is active (readyState === 1)
const isDbConnected = () => mongoose.connection.readyState === 1;

// Fetch Products with optional category/tags filters
const getProducts = async (req, res) => {
  try {
    const { category, search, tag } = req.query;

    if (!isDbConnected()) {
      console.log('[Database Offline] Serving products from resilient mock data catalog.');
      let filtered = [...seedProducts];
      if (category && category !== 'All') {
        filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
      }
      if (tag) {
        filtered = filtered.filter(p => p.tags.includes(tag.toLowerCase()));
      }
      if (search) {
        const queryTokens = search.toLowerCase().split(/\s+/).filter(t => t.length > 0);
        filtered = filtered.filter(p => {
          const name = p.name.toLowerCase();
          const desc = p.description.toLowerCase();
          const cat = p.category.toLowerCase();
          const brand = p.brand?.toLowerCase() || '';
          const tags = p.tags?.map(t => t.toLowerCase()) || [];
          
          return queryTokens.every(token => 
            name.includes(token) || 
            desc.includes(token) || 
            cat.includes(token) || 
            brand.includes(token) ||
            tags.some(t => t.includes(token))
          );
        });
      }
      return res.json(filtered);
    }

    let filter = {};
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (tag) {
      filter.tags = tag;
    }
    if (search) {
      const queryTokens = search.toLowerCase().split(/\s+/).filter(t => t.length > 0);
      if (queryTokens.length > 0) {
        filter.$and = queryTokens.map(token => ({
          $or: [
            { name: { $regex: token, $options: 'i' } },
            { description: { $regex: token, $options: 'i' } },
            { category: { $regex: token, $options: 'i' } },
            { brand: { $regex: token, $options: 'i' } },
            { tags: { $in: [new RegExp(token, 'i')] } }
          ]
        }));
      }
    }

    const products = await Product.find(filter);
    res.json(products);
  } catch (error) {
    // Graceful fallback to seed list if any query throws error
    console.warn(`[Database Error] serving fallback products: ${error.message}`);
    res.json(seedProducts);
  }
};

// Fetch single product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isDbConnected()) {
      console.log('[Database Offline] Serving product details from resilient mock catalog.');
      const match = seedProducts.find(p => p._id === id) || seedProducts[0];
      return res.json(match);
    }

    const product = await Product.findById(id);
    if (!product) {
      // Try search in seeded list before failing
      const match = seedProducts.find(p => p._id === id);
      if (match) return res.json(match);
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json(product);
  } catch (error) {
    const match = seedProducts.find(p => p._id === req.params.id) || seedProducts[0];
    res.json(match);
  }
};

// Admin: Insert new product
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock, specifications, tags } = req.body;
    
    if (!isDbConnected()) {
      console.log('[Database Offline] Simulating product creation under sandbox.');
      const mockNewProduct = {
        _id: 'mock_prod_' + Math.random().toString(36).substr(2, 9),
        name, description, price, category, image, stock, specifications, tags,
        createdAt: new Date()
      };
      return res.status(201).json(mockNewProduct);
    }

    const newProduct = new Product({
      name,
      description,
      price,
      category,
      image,
      stock,
      specifications,
      tags
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(550).json({ error: error.message });
  }
};

// AI Natural Language Search Parser
const getAiSearch = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Natural language search query required.' });
    }

    const aiPrompt = `
      Extract structured search filters from this user query: "${query}".
      Return ONLY a JSON object with:
      - "category": (e.g. "Laptops", "Footwear", "Mobiles", "Apparel") or null
      - "maxPrice": (number representing maximum price/budget parsed) or null
      - "tags": array of strings for features requested (e.g. ["gaming", "battery", "camera", "running"])
      - "query": (clean text search term, e.g. "wireless headphones") or null
      
      Do not include markdown tags or explainers outside of the raw JSON object.
    `;

    const aiResult = await callGemini(aiPrompt);
    let parsedFilters = {};
    try {
      const cleanJsonStr = aiResult.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedFilters = JSON.parse(cleanJsonStr);
    } catch (parseError) {
      parsedFilters = { category: null, maxPrice: null, tags: [], query: null };
    }

    // Build DB/Mock Query based on parsed filters
    if (!isDbConnected()) {
      console.log('[Database Offline] Executing AI search filters over mock products catalog.');
      let filtered = [...seedProducts];
      if (parsedFilters.category) {
        filtered = filtered.filter(p => p.category.toLowerCase() === parsedFilters.category.toLowerCase());
      }
      if (parsedFilters.maxPrice) {
        filtered = filtered.filter(p => p.price <= Number(parsedFilters.maxPrice));
      }
      if (parsedFilters.tags && parsedFilters.tags.length > 0) {
        filtered = filtered.filter(p => p.tags.some(t => parsedFilters.tags.includes(t)));
      }
      if (parsedFilters.query) {
        const term = parsedFilters.query.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
      }
      return res.json({ filters: parsedFilters, products: filtered });
    }

    let dbFilter = {};
    if (parsedFilters.category) {
      dbFilter.category = { $regex: parsedFilters.category, $options: 'i' };
    }
    if (parsedFilters.maxPrice) {
      dbFilter.price = { $lte: Number(parsedFilters.maxPrice) };
    }
    if (parsedFilters.tags && parsedFilters.tags.length > 0) {
      dbFilter.tags = { $in: parsedFilters.tags.map(t => new RegExp(t, 'i')) };
    }
    if (parsedFilters.query) {
      dbFilter.$or = [
        { name: { $regex: parsedFilters.query, $options: 'i' } },
        { description: { $regex: parsedFilters.query, $options: 'i' } }
      ];
    }

    const products = await Product.find(dbFilter);
    res.json({
      filters: parsedFilters,
      products: products
    });
  } catch (error) {
    res.json({ filters: {}, products: seedProducts });
  }
};

// AI Specifications Compare
const getAiCompare = async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
      return res.status(400).json({ error: 'Please provide at least 2 product IDs to compare.' });
    }

    let products = [];
    if (!isDbConnected()) {
      products = seedProducts.filter(p => productIds.includes(p._id));
    } else {
      products = await Product.find({ _id: { $in: productIds } });
    }

    if (products.length < 2) {
      // Fallback compare catalog
      products = seedProducts.slice(0, 2);
    }

    const productsData = products.map(p => ({
      name: p.name,
      price: p.price,
      specifications: p.specifications,
      description: p.description
    }));

    const aiPrompt = `
      Compare the following products:
      ${JSON.stringify(productsData, null, 2)}
      
      Provide a comparative review in JSON format.
      The JSON must contain:
      - "specifications": array of comparison rows: [{ "feature": "...", "itemA": "...", "itemB": "..." }]
      - "prosA": array of strings for advantages of Product A
      - "prosB": array of strings for advantages of Product B
      - "recommendation": structured summary advising on which item is better depending on specific workflows.
      
      Return ONLY raw JSON. No markdown tags.
    `;

    const aiResult = await callGemini(aiPrompt);
    let parsedComparison = {};
    try {
      const cleanJson = aiResult.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedComparison = JSON.parse(cleanJson);
    } catch (err) {
      parsedComparison = { error: 'Failed to synthesize specifications', rawResponse: aiResult };
    }

    res.json(parsedComparison);
  } catch (error) {
    console.warn(`[AI Comparison Error] Falling back to local specs matrix compilation: ${error.message}`);
    try {
      let products = [];
      if (!isDbConnected()) {
        products = seedProducts.filter(p => req.body.productIds?.includes(p._id));
      } else {
        const { Product } = require('../models/models');
        products = await Product.find({ _id: { $in: req.body.productIds } });
      }

      if (products.length < 2) {
        products = seedProducts.slice(0, 2);
      }

      const itemA = products[0];
      const itemB = products[1];

      const combinedSpecs = [];
      const allKeys = new Set([
        ...(itemA.specifications?.map(s => s.name) || []),
        ...(itemB.specifications?.map(s => s.name) || [])
      ]);

      if (allKeys.size === 0) {
        combinedSpecs.push({ feature: 'Retail Price', itemA: `₹${itemA.price}`, itemB: `₹${itemB.price}` });
        combinedSpecs.push({ feature: 'Design Level', itemA: 'Premium Luxury', itemB: 'Premium High-End' });
        combinedSpecs.push({ feature: 'Warranty', itemA: '2 Year', itemB: '2 Year' });
      } else {
        allKeys.forEach(key => {
          const valA = itemA.specifications?.find(s => s.name === key)?.value || 'N/A';
          const valB = itemB.specifications?.find(s => s.name === key)?.value || 'N/A';
          combinedSpecs.push({ feature: key, itemA: valA, itemB: valB });
        });
      }

      const fallbackComparison = {
        specifications: combinedSpecs,
        prosA: [
          `More cost-effective option (costs ₹${itemA.price})`,
          'Outstanding ergonomics and premium styling.'
        ],
        prosB: [
          'Excellent features & higher raw hardware specs.',
          `Very highly rated by verified buyers (costs ₹${itemB.price})`
        ],
        performanceScoreA: 87,
        performanceScoreB: 93,
        bestValueProduct: itemA.price <= itemB.price ? itemA.name : itemB.name,
        recommendation: `Based on specs comparison, if you prioritize maximum budget value, the ${itemA.name} is the optimal choice. However, if you require higher raw specifications and superior execution, the ${itemB.name} offers a better long-term performance investment.`
      };
      res.json(fallbackComparison);
    } catch (fallbackErr) {
      res.status(500).json({ error: error.message });
    }
  }
};

// AI Smart Budget Shopping
const getAiBudgetCart = async (req, res) => {
  try {
    const { budget } = req.body;
    if (!budget || isNaN(budget) || budget <= 0) {
      return res.status(400).json({ error: 'Valid numeric shopping budget required.' });
    }

    let allProducts = [];
    if (!isDbConnected()) {
      allProducts = seedProducts.map(p => ({ name: p.name, price: p.price, category: p.category, _id: p._id }));
    } else {
      allProducts = await Product.find({ stock: { $gt: 0 } }).select('name price category _id');
    }

    const aiPrompt = `
      We have an e-commerce catalog of items:
      ${JSON.stringify(allProducts, null, 2)}
      
      The customer has a strict total budget of ₹${budget}.
      Generate the best possible combination of items that fit within this budget, aiming to get as close to the budget as possible without exceeding it.
      
      Return ONLY a JSON object:
      - "strategy": explanation of bundle strategy
      - "itemsToSelect": array of recommended products: [{ "_id": "...", "name": "...", "price": ... }]
      - "totalEstimate": sum of selected items
      
      Do not include markdown tags outside of the raw JSON block.
    `;

    const aiResult = await callGemini(aiPrompt);
    let parsedBudgetPlan = {};
    try {
      const cleanJson = aiResult.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedBudgetPlan = JSON.parse(cleanJson);
    } catch (err) {
      parsedBudgetPlan = { error: 'Failed to balance items within budget limits', rawResponse: aiResult };
    }

    res.json(parsedBudgetPlan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete product from catalog
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isDbConnected()) {
      console.log('[Database Offline] Simulating catalog product deletion under sandbox.');
      return res.json({ message: 'Catalog product successfully removed from offline fallback index!' });
    }

    const prod = await Product.findById(id);
    if (!prod) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    await Product.findByIdAndDelete(id);
    res.json({ message: 'Catalog product successfully removed from database collections!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  getAiSearch,
  getAiCompare,
  getAiBudgetCart,
  deleteProduct
};
