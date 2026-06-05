import { createSlice } from '@reduxjs/toolkit';

const loadWishlistFromStorage = () => {
  try {
    const data = localStorage.getItem('luxe_wishlist');
    return data ? JSON.parse(data) : [];
  } catch (err) {
    return [];
  }
};

const initialState = {
  items: loadWishlistFromStorage()
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggleWishlistItem: (state, action) => {
      const product = action.payload; // product object
      const index = state.items.findIndex(i => i._id === product._id);
      if (index >= 0) {
        state.items = state.items.filter(i => i._id !== product._id);
      } else {
        state.items.push(product);
      }
      localStorage.setItem('luxe_wishlist', JSON.stringify(state.items));
    },
    removeFromWishlist: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter(i => i._id !== productId);
      localStorage.setItem('luxe_wishlist', JSON.stringify(state.items));
    },
    clearWishlist: (state) => {
      state.items = [];
      localStorage.removeItem('luxe_wishlist');
    }
  }
});

export const { toggleWishlistItem, removeFromWishlist, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
