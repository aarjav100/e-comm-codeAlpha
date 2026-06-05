const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs').promises;
const dbLocal = require('./db'); // local JSON database helper

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/luxe';

const categories = {
  'Electronics': [
    { sub: 'Gaming Laptops', brand: 'Zenith', originalPrice: 85000, discount: 15, nameSuffix: 'X1 Gaming Laptop' },
    { sub: 'Ultrabooks', brand: 'Spectre', originalPrice: 65000, discount: 10, nameSuffix: 'Pro Thin Ultrabook' },
    { sub: 'Smartphones', brand: 'Lumina', originalPrice: 55000, discount: 12, nameSuffix: 'Pro Camera Phone' },
    { sub: 'Tablets', brand: 'Aero', originalPrice: 35000, discount: 8, nameSuffix: 'Tab Elite Multi-touch' },
    { sub: 'Smart Watches', brand: 'Chronos', originalPrice: 12000, discount: 20, nameSuffix: 'Active Smart Watch' },
    { sub: 'Headphones', brand: 'SoundWave', originalPrice: 8000, discount: 15, nameSuffix: 'ANC Wireless Headphones' },
    { sub: 'Speakers', brand: 'Aura', originalPrice: 15000, discount: 25, nameSuffix: 'Studio Spatial Speaker' },
    { sub: 'Cameras', brand: 'VisiPro', originalPrice: 120000, discount: 10, nameSuffix: 'Cinematic Mirrorless Camera' },
    { sub: 'Monitors', brand: 'Nebula', originalPrice: 28000, discount: 18, nameSuffix: 'Curved UltraWide Monitor' },
    { sub: 'Keyboards', brand: 'AuraFlow', originalPrice: 6000, discount: 15, nameSuffix: 'Mechanical Gaming Keyboard' },
    { sub: 'Mice', brand: 'Veloce', originalPrice: 3500, discount: 20, nameSuffix: 'Precision Wireless Mouse' }
  ],
  'Fashion': [
    { sub: "Men's Clothing", brand: 'Heritage', originalPrice: 4500, discount: 30, nameSuffix: 'Tailored Cotton Shirt' },
    { sub: "Women's Clothing", brand: 'Luxe', originalPrice: 8500, discount: 25, nameSuffix: 'Silk Party Dress' },
    { sub: 'Shoes', brand: 'AeroStratus', originalPrice: 3500, discount: 15, nameSuffix: 'Comfort Active Runners' },
    { sub: 'Jackets', brand: 'Heritage', originalPrice: 14500, discount: 20, nameSuffix: 'Cashmere Trench Coat' },
    { sub: 'Watches', brand: 'Chronos', originalPrice: 18000, discount: 15, nameSuffix: 'Minimalist Gold Chronograph' },
    { sub: 'Sunglasses', brand: 'VisiPro', originalPrice: 4500, discount: 10, nameSuffix: 'Polarized Aviator Sunglasses' },
    { sub: 'Bags', brand: 'Apex', originalPrice: 9500, discount: 20, nameSuffix: 'RFID Premium Leather Bag' }
  ],
  'Home & Living': [
    { sub: 'Furniture', brand: 'Heritage', originalPrice: 28000, discount: 15, nameSuffix: 'Walnut Coffee Table' },
    { sub: 'Lamps', brand: 'Nebula', originalPrice: 4500, discount: 25, nameSuffix: 'Ambient Touch Lamp' },
    { sub: 'Decor Items', brand: 'Aura', originalPrice: 3500, discount: 30, nameSuffix: 'Glassmorphic Vases Set' },
    { sub: 'Kitchen Appliances', brand: 'Veloce', originalPrice: 12500, discount: 15, nameSuffix: 'Pro Smart Air Fryer' }
  ],
  'Beauty': [
    { sub: 'Perfumes', brand: 'Luxe', originalPrice: 7500, discount: 10, nameSuffix: 'Imperial Eau de Parfum' },
    { sub: 'Skincare', brand: 'Lumina', originalPrice: 3200, discount: 15, nameSuffix: 'Hydration Therapy Serum' },
    { sub: 'Makeup', brand: 'Lumina', originalPrice: 2500, discount: 20, nameSuffix: 'Matte Liquid Lipstick Kit' }
  ],
  'Sports': [
    { sub: 'Running Shoes', brand: 'AeroStratus', originalPrice: 5500, discount: 25, nameSuffix: 'Daily Jogging Trainers' },
    { sub: 'Fitness Equipment', brand: 'Apex', originalPrice: 22000, discount: 15, nameSuffix: 'Home Gym Dumbbell Set' },
    { sub: 'Gym Accessories', brand: 'Veloce', originalPrice: 1800, discount: 20, nameSuffix: 'Leakproof Smart Infuser Flask' }
  ]
};

const unsplashImages = {
  'Electronics': [
    'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80'
  ],
  'Fashion': [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80'
  ],
  'Home & Living': [
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=400&q=80'
  ],
  'Beauty': [
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=400&q=80'
  ],
  'Sports': [
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=400&q=80'
  ]
};

const specData = {
  'Electronics': [
    { name: 'Processor', value: 'High-performance Octa-core chip' },
    { name: 'Power Multiplier', value: 'Dynamic Power Optimization' }
  ],
  'Fashion': [
    { name: 'Material', value: 'Organic Breathable Thread Blend' },
    { name: 'Tailoring', value: 'Ergonomic Premium Cut' }
  ],
  'Home & Living': [
    { name: 'Origin', value: 'Handcrafted premium design' },
    { name: 'Energy multiplier', value: 'Resilient green rating' }
  ],
  'Beauty': [
    { name: 'Ingredients', value: 'Natural essential plant oils' },
    { name: 'Safety', value: 'Dermatologically certified clean' }
  ],
  'Sports': [
    { name: 'Grip index', value: 'Anti-skid specialized tech' },
    { name: 'Weight', value: 'Ultra lightweight' }
  ]
};

// Generate 100+ items programmatically
const generateSeedProducts = () => {
  const products = [];
  let idCounter = 1;

  for (const [mainCat, subs] of Object.entries(categories)) {
    const imagesList = unsplashImages[mainCat] || unsplashImages['Electronics'];
    const specList = specData[mainCat] || specData['Electronics'];

    // Repeat to ensure at least 100 items (32 subcategories repeated 4 times each = 128 products)
    for (let iteration = 1; iteration <= 4; iteration++) {
      for (const item of subs) {
        const originalPrice = Math.round(item.originalPrice * (0.85 + Math.random() * 0.3));
        const discountPercentage = item.discount + Math.floor(Math.random() * 10);
        const salePrice = Math.round(originalPrice * (1 - discountPercentage / 100));
        
        const skuSub = item.sub.replace(/\s+/g, '-').toUpperCase();
        const sku = `SKU-${mainCat.substring(0, 3).toUpperCase()}-${skuSub}-${iteration}${100 + idCounter}`;
        
        const mainImage = imagesList[idCounter % imagesList.length];
        const secondaryImage = imagesList[(idCounter + 1) % imagesList.length];

        const rating = (4.2 + Math.random() * 0.8).toFixed(1);
        const numReviews = 10 + Math.floor(Math.random() * 450);

        products.push({
          name: `${item.brand} ${item.sub} ${item.nameSuffix} V${iteration}`,
          description: `An premium edition of our best-selling ${item.sub}. Engineered using the finest materials and advanced ${mainCat.toLowerCase()} methods to guarantee top-tier execution, long-term durability, and outstanding luxury design value.`,
          price: salePrice,
          originalPrice: originalPrice,
          discountPercentage: discountPercentage,
          category: item.sub,
          brand: item.brand,
          sku: sku,
          image: mainImage,
          images: [mainImage, secondaryImage],
          stock: 5 + Math.floor(Math.random() * 150),
          rating: Number(rating),
          numReviews: numReviews,
          deliveryEstimate: `${2 + Math.floor(Math.random() * 3)}-${4 + Math.floor(Math.random() * 3)} business days`,
          aiSummary: `This ${item.brand} ${item.sub} offers an exceptional blend of premium quality and modern aesthetics. Reviewers highly praise its outstanding ergonomics, robust execution index, and remarkable long-term durability, making it a high-value purchase.`,
          specifications: [
            ...specList,
            { name: 'Model Ref', value: `LUXE-${skuSub}-${iteration}` },
            { name: 'Warranty', value: '2 Year Premium Warranty' }
          ],
          tags: [mainCat.toLowerCase(), item.sub.toLowerCase(), 'premium', 'luxury'],
          createdAt: new Date(Date.now() - idCounter * 24 * 60 * 60 * 1000).toISOString() // scattered dates
        });
        idCounter++;
      }
    }
  }
  return products;
};

const runSeeding = async () => {
  console.log('[Seed] Compiling 100+ premium products catalog...');
  const products = generateSeedProducts();
  console.log(`[Seed] Successfully generated ${products.length} catalog products!`);

  // 1. Write to local JSON fallback database (products.json)
  try {
    const productsFilePath = path.join(__dirname, 'products.json');
    // Clear and write fresh generated array
    await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), 'utf8');
    console.log('[Seed] Local fallback database seed complete (120+ products in products.json).');
  } catch (err) {
    console.error('[Seed] Error seeding local fallback database:', err);
  }

  // 2. Write to MongoDB Atlas / Local MongoDB if connected
  try {
    console.log('[Seed] Connecting to MongoDB MERN cluster...');
    
    // Quick connection check
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000
    });
    
    console.log('[Seed] MongoDB Connected. Removing old collection items...');
    const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}));
    await Product.deleteMany({});
    
    console.log('[Seed] Inserting 100+ premium products into MongoDB collection...');
    const ProductModel = require('../models/models').Product;
    const result = await ProductModel.insertMany(products);
    console.log(`[Seed] Successfully seeded ${result.length} products inside MongoDB database!`);
    
  } catch (err) {
    console.warn(`[Seed] MongoDB connection skipped or failed: ${err.message}`);
    console.warn('[Seed] Completed offline JSON seeding only. Falling back to Resilient Mock catalogs.');
  } finally {
    await mongoose.disconnect();
    console.log('[Seed] Database seeding process finished.');
    process.exit(0);
  }
};

runSeeding();
