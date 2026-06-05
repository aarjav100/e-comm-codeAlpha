const path = require('path');
// Load environment variables from local .env
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { Product, User, Review } = require('./models/models');
const apiRouter = require('./routes/apiRoutes');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Diagnostics Middleware
app.use(helmet({
  contentSecurityPolicy: false // Allows dynamic scripts, fonts, and assets to render easily in dev
}));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());

// CORS Setup supporting credentials transfers
app.use(cors({
  origin: true, // Echo origin back to allow localhost dev and custom ports
  credentials: true
}));

// Apply Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per window
  message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' }
});
app.use('/api', limiter);

// Mount Modular Router
app.use('/api', apiRouter);

// Serve Static Frontend Assets
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve React routing fallbacks (Vite build serves single index.html)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Global Error Catch Handler
app.use((err, req, res, next) => {
  console.error('[System Error]', err.stack);
  res.status(500).json({ error: 'Internal Server Error. Please contact administrator.' });
});

// Seed Initial Premium Products if Collection is Empty
const autoSeedProducts = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.warn('[Seed] Database is not connected (LUXE running in resilient mock mode). Skipping seeding products.');
      return;
    }
    const count = await Product.countDocuments();
    if (count === 0) {
      console.log('[Seed] Database is empty. Seeding initial premium LUXE products...');
      
      const seedProducts = [
        {
          name: "Zenith X1 Gaming Laptop",
          description: "High performance gaming laptop equipped with latest Ryzen 9, 16GB RAM, 1TB SSD, and NVIDIA RTX 4060 graphics card.",
          price: 68900,
          category: "Laptops",
          image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=400&q=80",
          stock: 12,
          rating: 4.8,
          numReviews: 2,
          specifications: [
            { name: "Processor", value: "Ryzen 9 7940HS" },
            { name: "Graphics", value: "NVIDIA RTX 4060 (8GB)" },
            { name: "RAM", value: "16GB DDR5" },
            { name: "Storage", value: "1TB NVMe SSD" }
          ],
          tags: ["gaming", "performance", "high-speed"]
        },
        {
          name: "AeroStratus Daily Runners",
          description: "Ultra lightweight running shoes designed for ultimate speed, flexibility, and daily jogging support.",
          price: 2499,
          category: "Footwear",
          image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80",
          stock: 25,
          rating: 4.5,
          numReviews: 1,
          specifications: [
            { name: "Weight", value: "240g" },
            { name: "Sole Material", value: "Responsive Stratofoam" },
            { name: "Upper Material", value: "Breathable AeroMesh" }
          ],
          tags: ["running", "sports", "jogging", "daily"]
        },
        {
          name: "Lumina Pro Camera Phone",
          description: "Premium smartphone featuring an advanced 108MP camera array, massive 6000mAh battery, and cinematic AMOLED screen.",
          price: 54900,
          category: "Mobiles",
          image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80",
          stock: 18,
          rating: 4.9,
          numReviews: 2,
          specifications: [
            { name: "Camera", value: "108MP + 12MP + 8MP Tri-Lens" },
            { name: "Battery", value: "6000mAh Lithium-Polymer" },
            { name: "Screen", value: "6.7 inch AMOLED (120Hz)" }
          ],
          tags: ["camera", "battery", "smartphone", "flagship"]
        },
        {
          name: "Heritage Cashmere Trench Coat",
          description: "Classic double-breasted cashmere wool blend trench coat perfect for elegant and refined winter fashion.",
          price: 14500,
          category: "Apparel",
          image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=400&q=80",
          stock: 8,
          rating: 4.7,
          numReviews: 1,
          specifications: [
            { name: "Material", value: "80% Northern Cashmere, 20% Merino Wool" },
            { name: "Buttons", value: "Custom Horn Buttons" }
          ],
          tags: ["winter", "cashmere", "premium", "coat"]
        }
      ];

      const insertedProducts = await Product.insertMany(seedProducts);
      console.log(`[Seed] Seeded ${insertedProducts.length} default products.`);

      // Create a default administrator user for demo/management access
      const existingAdmin = await User.findOne({ email: 'admin@luxe.com' });
      if (!existingAdmin) {
        const hashedAdminPassword = await bcrypt.hash('admin123', 10);
        const adminUser = new User({
          name: 'LUXE Administrator',
          email: 'admin@luxe.com',
          password: hashedAdminPassword,
          role: 'admin',
          walletPoints: 1000,
          lifetimePointsEarned: 1000,
          membershipTier: 'Gold',
          badges: ['Master Creator', 'Welcome Administrator']
        });
        await adminUser.save();
        console.log('[Seed] Seeding default administrator: admin@luxe.com / admin123');
      }

      // Add dummy reviews to product 0, 1, 2 to demonstrate review summary immediately!
      const p1 = insertedProducts[0];
      const p2 = insertedProducts[1];
      const p3 = insertedProducts[2];
      
      const adminAcc = await User.findOne({ email: 'admin@luxe.com' });

      if (adminAcc) {
        await Review.create([
          { product: p1._id, user: adminAcc._id, userName: 'John Doe', rating: 5, comment: 'Excellent battery life and high performance specs. Highly recommended!', verifiedPurchase: true },
          { product: p1._id, user: adminAcc._id, userName: 'Sarah Smith', rating: 4, comment: 'Premium build quality but slight heating during extreme gaming sessions. Slow charger included.', verifiedPurchase: true },
          { product: p2._id, user: adminAcc._id, userName: 'David Warner', rating: 4, comment: 'Incredible sole comfort and lightweight jogging support. Sleek look.', verifiedPurchase: true },
          { product: p3._id, user: adminAcc._id, userName: 'Emily Watson', rating: 5, comment: 'Fantastic 108MP camera! The battery lasts for a full 2 days easily.', verifiedPurchase: true },
          { product: p3._id, user: adminAcc._id, userName: 'Chris Evans', rating: 5, comment: 'Screen displays gorgeous colors. Solid value flagship.', verifiedPurchase: true }
        ]);
        console.log('[Seed] Seeded baseline product reviews for AI summaries compilation.');
      }
    }
  } catch (seedError) {
    console.error('[Seed] Database seeding failed.', seedError);
  }
};

// Start Server and connect DB (forced reload)
connectDB().then(() => {
  autoSeedProducts();
  app.listen(PORT, () => {
    console.log(`[LUXE Server] Active and listening on port ${PORT}`);
  });
});
