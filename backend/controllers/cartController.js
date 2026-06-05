const mongoose = require('mongoose');
const { Product } = require('../models/models');
const { seedProducts } = require('../config/mockDb');

const isDbConnected = () => mongoose.connection.readyState === 1;

const getCartMetadata = async (req, res) => {
  try {
    const { cartItems } = req.body;
    if (!cartItems || !Array.isArray(cartItems)) {
      return res.status(400).json({ error: 'Cart items array required.' });
    }

    let subtotal = 0;
    
    // Process items totals
    if (!isDbConnected()) {
      for (const item of cartItems) {
        const prod = seedProducts.find(p => p._id === item.product);
        if (prod) {
          subtotal += prod.price * item.qty;
        } else {
          // fallback mock pricing
          subtotal += 1000 * item.qty;
        }
      }
    } else {
      for (const item of cartItems) {
        const prod = await Product.findById(item.product);
        if (prod) {
          subtotal += prod.price * item.qty;
        }
      }
    }

    const freeShippingLimit = 1000;
    const remainingToFreeShipping = Math.max(0, freeShippingLimit - subtotal);
    const hasFreeShipping = subtotal >= freeShippingLimit;

    // Recommend products matching the threshold gap
    let recommendations = [];
    if (remainingToFreeShipping > 0) {
      if (!isDbConnected()) {
        recommendations = seedProducts.filter(p => 
          p.price >= remainingToFreeShipping * 0.8 && 
          p.price <= remainingToFreeShipping * 1.5
        ).slice(0, 3);
        
        if (recommendations.length === 0) {
          recommendations = [...seedProducts].sort((a, b) => a.price - b.price).slice(0, 3);
        }
      } else {
        recommendations = await Product.find({
          price: { $gte: remainingToFreeShipping * 0.8, $lte: remainingToFreeShipping * 1.5 },
          stock: { $gt: 0 }
        }).limit(3);

        if (recommendations.length === 0) {
          recommendations = await Product.find({ stock: { $gt: 0 } })
            .sort({ price: 1 })
            .limit(3);
        }
      }
    }

    res.json({
      subtotal,
      hasFreeShipping,
      remainingToFreeShipping,
      recommendations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getCartMetadata
};
