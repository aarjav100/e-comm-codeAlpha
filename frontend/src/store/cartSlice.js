import { createSlice } from '@reduxjs/toolkit';

const loadCartFromStorage = () => {
  try {
    const data = localStorage.getItem('luxe_items');
    return data ? JSON.parse(data) : [];
  } catch (err) {
    return [];
  }
};

const initialState = {
  items: loadCartFromStorage(),
  subtotal: 0,
  hasFreeShipping: false,
  remainingToFreeShipping: 1000,
  recommendations: [],
  currency: localStorage.getItem('luxe_currency') || 'INR'
};

const calculateLocalSubtotal = (items) => {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, name, price, image, qty = 1 } = action.payload;
      const existing = state.items.find(i => i.product === product);
      if (existing) {
        existing.qty += qty;
      } else {
        state.items.push({ product, name, price, image, qty });
      }
      localStorage.setItem('luxe_items', JSON.stringify(state.items));
      state.subtotal = calculateLocalSubtotal(state.items);
      state.remainingToFreeShipping = Math.max(0, 1000 - state.subtotal);
      state.hasFreeShipping = state.subtotal >= 1000;
    },
    updateCartQty: (state, action) => {
      const { product, qty } = action.payload;
      const existing = state.items.find(i => i.product === product);
      if (existing) {
        existing.qty = Math.max(1, qty);
      }
      localStorage.setItem('luxe_items', JSON.stringify(state.items));
      state.subtotal = calculateLocalSubtotal(state.items);
      state.remainingToFreeShipping = Math.max(0, 1000 - state.subtotal);
      state.hasFreeShipping = state.subtotal >= 1000;
    },
    removeFromCart: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter(i => i.product !== productId);
      localStorage.setItem('luxe_items', JSON.stringify(state.items));
      state.subtotal = calculateLocalSubtotal(state.items);
      state.remainingToFreeShipping = Math.max(0, 1000 - state.subtotal);
      state.hasFreeShipping = state.subtotal >= 1000;
    },
    syncCartMetadata: (state, action) => {
      const { subtotal, hasFreeShipping, remainingToFreeShipping, recommendations } = action.payload;
      state.subtotal = subtotal;
      state.hasFreeShipping = hasFreeShipping;
      state.remainingToFreeShipping = remainingToFreeShipping;
      state.recommendations = recommendations || [];
    },
    clearCart: (state) => {
      state.items = [];
      localStorage.removeItem('luxe_items');
      state.subtotal = 0;
      state.remainingToFreeShipping = 1000;
      state.hasFreeShipping = false;
      state.recommendations = [];
    },
    changeCurrency: (state, action) => {
      state.currency = action.payload;
      localStorage.setItem('luxe_currency', action.payload);
    }
  }
});

export const { addToCart, updateCartQty, removeFromCart, syncCartMetadata, clearCart, changeCurrency } = cartSlice.actions;
export default cartSlice.reducer;
