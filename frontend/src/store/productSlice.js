import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  products: [],
  searchQuery: '',
  compareItems: [], // maximum 3 items
  compareData: null,
  budgetPlan: null,
  loading: false,
  error: null
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setProducts: (state, action) => {
      state.products = action.payload;
      state.loading = false;
      state.error = null;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    toggleCompareItem: (state, action) => {
      const product = action.payload;
      const index = state.compareItems.findIndex(i => i._id === product._id);
      if (index >= 0) {
        state.compareItems = state.compareItems.filter(i => i._id !== product._id);
      } else {
        if (state.compareItems.length < 3) {
          state.compareItems.push(product);
        }
      }
      state.compareData = null; // Reset comparison results to force re-fetch
    },
    clearCompare: (state) => {
      state.compareItems = [];
      state.compareData = null;
    },
    setCompareData: (state, action) => {
      state.compareData = action.payload;
    },
    setBudgetPlan: (state, action) => {
      state.budgetPlan = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    }
  }
});

export const { 
  setProducts, 
  setSearchQuery, 
  toggleCompareItem, 
  clearCompare, 
  setCompareData, 
  setBudgetPlan,
  setLoading,
  setError 
} = productSlice.actions;
export default productSlice.reducer;
