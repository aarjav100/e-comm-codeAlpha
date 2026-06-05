import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Search, Scale, DollarSign, Plus, ShieldCheck, RefreshCw, SlidersHorizontal, Tv, Shirt, Home, Compass, Truck, RotateCcw, Lock, Headphones, ChevronLeft, ChevronRight, ShoppingBag, Eye, Heart } from 'lucide-react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { setProducts, setSearchQuery, toggleCompareItem, clearCompare, setCompareData, setBudgetPlan, setLoading, setError } from '../store/productSlice';
import { addToCart } from '../store/cartSlice';
import VoiceAssistant from '../components/VoiceAssistant';
import { Link, useSearchParams } from 'react-router-dom';
import ProductCard, { slugify } from '../components/ProductCard';
import ProductSkeleton from '../components/ProductSkeleton';

const SidebarWidget = ({ title, icon, defaultOpen = true, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="glass-card border border-slate-100 dark:border-zinc-800/80 rounded-3xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all duration-300">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center cursor-pointer md:cursor-default"
      >
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
          {icon} {title}
        </h3>
        <span className="md:hidden text-xs text-slate-400 font-bold select-none">
          {isOpen ? '−' : '+'}
        </span>
      </div>
      
      <div className={`${isOpen ? 'block' : 'hidden md:block'} transition-all`}>
        {children}
      </div>
    </div>
  );
};

const Shop = () => {
  const dispatch = useDispatch();
  const { products, searchQuery, compareItems, compareData, budgetPlan, loading } = useSelector(state => state.products);
  const cart = useSelector(state => state.cart || { items: [], subtotal: 0 });
  const { items: cartItems, subtotal: cartSubtotal } = cart;
  const [naturalQuery, setNaturalQuery] = useState('');
  const [budgetInput, setBudgetInput] = useState('');
  
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category') || '';
  const setCategoryFilter = (val) => {
    if (val) {
      setSearchParams({ category: val });
    } else {
      setSearchParams({});
    }
  };

  const [priceLimit, setPriceLimit] = useState(90000);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [minRating, setMinRating] = useState(0);

  const [comparing, setComparing] = useState(false);
  const [generatingBudget, setGeneratingBudget] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Additional Sidebar States & Carousel Config
  const [currentBanner, setCurrentBanner] = useState(0);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  const banners = [
    {
      title: "Seasonal Sale",
      description: "Elevate Your Style — Up to 30% Off",
      tag: "Limited Curation",
      bg: "from-amber-600 to-amber-800",
      link: "Fashion"
    },
    {
      title: "New Arrivals",
      description: "The Avant-Garde Collection — Just Landed",
      tag: "New Season",
      bg: "from-zinc-800 to-zinc-950",
      link: ""
    },
    {
      title: "Limited Offers",
      description: "Flash bundle deals & specification upgrades",
      tag: "Flash Event",
      bg: "from-emerald-700 to-teal-900",
      link: "Electronics"
    },
    {
      title: "Free Shipping",
      description: "Complimentary express courier service worldwide",
      tag: "Exclusive Privilege",
      bg: "from-indigo-650 to-violet-850",
      link: ""
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    const loaded = localStorage.getItem('luxe_recently_viewed');
    if (loaded) {
      try {
        setRecentlyViewed(JSON.parse(loaded));
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  // Fetch initial products
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        dispatch(setLoading(true));
        const res = await axios.get(`/api/products${categoryFilter ? `?category=${categoryFilter}` : ''}`);
        dispatch(setProducts(res.data));
      } catch (err) {
        dispatch(setError('Failed to load products.'));
      }
    };
    fetchInitial();
  }, [categoryFilter, dispatch]);

  // Handle AI Search Submission
  const handleAiSearch = async (e) => {
    e.preventDefault();
    if (!naturalQuery.trim()) return;
    try {
      dispatch(setLoading(true));
      const res = await axios.post('/api/products/search/ai', { query: naturalQuery });
      dispatch(setProducts(res.data.products));
      dispatch(setSearchQuery(naturalQuery));
    } catch (err) {
      dispatch(setError('AI search parser failed.'));
    }
  };

  // Reset Search Filters
  const handleReset = async () => {
    setNaturalQuery('');
    setCategoryFilter('');
    setPriceLimit(90000);
    setSelectedColor('');
    setSelectedSize('');
    setMinRating(0);
    dispatch(setSearchQuery(''));
    try {
      dispatch(setLoading(true));
      const res = await axios.get('/api/products');
      dispatch(setProducts(res.data));
    } catch (err) {
      dispatch(setError('Failed to reset filters.'));
    }
  };

  // Run AI Product Comparison
  const handleCompare = async () => {
    if (compareItems.length < 2) return;
    try {
      setComparing(true);
      const ids = compareItems.map(item => item._id);
      const res = await axios.post('/api/products/compare/ai', { productIds: ids });
      dispatch(setCompareData(res.data));
    } catch (err) {
      console.error(err);
    } finally {
      setComparing(false);
    }
  };

  // Run Smart Budget Plan Optimizer
  const handleBudgetPlan = async (e) => {
    e.preventDefault();
    if (!budgetInput || isNaN(budgetInput)) return;
    try {
      setGeneratingBudget(true);
      const res = await axios.post('/api/products/budget/ai', { budget: Number(budgetInput) });
      dispatch(setBudgetPlan(res.data));
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingBudget(false);
    }
  };

  // Filter products client-side based on price range, rating, color, and size
  const filteredProducts = products.filter(product => {
    if (product.price > priceLimit) return false;
    if (product.rating < minRating) return false;

    if (selectedColor) {
      const colorQuery = selectedColor.toLowerCase();
      const matchTag = product.tags?.some(t => t.toLowerCase() === colorQuery);
      const matchDesc = product.description?.toLowerCase().includes(colorQuery) || product.name?.toLowerCase().includes(colorQuery);
      if (!matchTag && !matchDesc) return false;
    }

    if (selectedSize) {
      if (selectedSize === 'OS') {
        const isApparel = ['Outerwear', 'Knitwear'].includes(product.subcategory) || (product.category === 'Fashion' && !['Bags', 'Shoes', 'Watches'].includes(product.subcategory));
        if (isApparel) return false;
      } else {
        const isApparel = ['Outerwear', 'Knitwear'].includes(product.subcategory) || (product.category === 'Fashion' && !['Bags', 'Shoes', 'Watches'].includes(product.subcategory));
        if (!isApparel) return false;
      }
    }

    return true;
  });

  // Derive displayedRecentlyViewed and displayedRecommendations for widgets and catalog in-grid
  const displayedRecentlyViewed = recentlyViewed.length > 0 
    ? recentlyViewed 
    : products.slice(0, 3);

  const recommendedItems = products
    .filter(p => {
      const isAlreadyViewed = recentlyViewed.some(rv => rv._id === p._id);
      if (isAlreadyViewed) return false;
      const viewedCategories = recentlyViewed.map(rv => rv.category);
      const matchesCategory = categoryFilter 
        ? p.category === categoryFilter 
        : (viewedCategories.length > 0 ? viewedCategories.includes(p.category) : true);
      return matchesCategory && p.price <= priceLimit && p.rating >= 4.7;
    })
    .slice(0, 3);
  const displayedRecommendations = recommendedItems.length > 0 
    ? recommendedItems 
    : products.filter(p => p.rating >= 4.8).slice(0, 3);

  return (
    <div className="flex flex-col gap-10 pb-24">
      {/* Search and Voice Assistant Header */}
      <section className="glass-card p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-lg w-full z-10 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-black tracking-[0.25em] text-[#C9A84C] uppercase flex items-center gap-1">
            <Sparkles size={12} className="animate-pulse" /> Ask Lumina AI Assistant
          </span>
          <h1 className="text-xl md:text-2xl font-serif font-black text-slate-800 dark:text-zinc-100">
            Interactive AI Shopping
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Search our boutique natural language model (e.g. "Find running shoes under 3000" or "cashmere coat").
          </p>
        </div>

        <form onSubmit={handleAiSearch} className="flex flex-col md:flex-row gap-3 w-full">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder='Try typing: "Show me designer handbags" or "espresso leather coat"'
              value={naturalQuery}
              onChange={(e) => setNaturalQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl py-3.5 pl-12 pr-4 text-xs font-semibold focus:outline-none focus:border-black dark:focus:border-zinc-300 text-black dark:text-zinc-100 placeholder-slate-400"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" className="bg-black hover:bg-neutral-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-black text-white px-6 py-3.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 w-full md:w-auto shadow-md">
              <Sparkles size={13} /> ASK AI
            </button>
            <VoiceAssistant onSearchComplete={(prods, spokenText) => setNaturalQuery(spokenText)} />
          </div>
        </form>

        {searchQuery && (
          <div className="flex items-center gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
            <span className="text-[11px] text-slate-500 font-semibold">
              AI Query Active: <strong className="text-black dark:text-white">"{searchQuery}"</strong>
            </span>
            <button onClick={handleReset} className="text-[9px] uppercase font-black tracking-widest text-[#C9A84C] hover:underline">
              Clear Filter
            </button>
          </div>
        )}
      </section>

      {/* Mobile Filters Toggle Button */}
      <div className="lg:hidden flex justify-between items-center bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200"
        >
          <SlidersHorizontal size={14} className="text-[#C9A84C]" />
          {showMobileFilters ? 'Hide Filters' : 'Show Filters & Refinements'}
        </button>
        <span className="text-[10px] font-bold text-slate-450 uppercase">
          {filteredProducts.length} Items Found
        </span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Filters Ledger */}
        <aside className={`${showMobileFilters ? 'flex' : 'hidden lg:flex'} lg:col-span-3 flex-col gap-6 bg-white/40 dark:bg-[#121212]/45 p-6 border border-slate-100 dark:border-zinc-800 rounded-3xl backdrop-blur-md lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto pr-1`}>
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800/80 pb-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
              <SlidersHorizontal size={12} /> Refine Selections
            </h3>
            {(categoryFilter || priceLimit < 90000 || selectedColor || selectedSize || minRating > 0) && (
              <button 
                onClick={handleReset} 
                className="text-[9px] font-bold text-[#C9A84C] hover:underline uppercase tracking-wider"
              >
                Reset
              </button>
            )}
          </div>
          
          {/* Category checklist */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-zinc-550">
              Category
            </span>
            <div className="flex flex-col gap-2">
              {[
                { label: 'All Selections', value: '' },
                { label: 'Fashion & Wearables', value: 'Fashion' },
                { label: 'Premium Electronics', value: 'Electronics' },
                { label: 'Home & Ambient Decor', value: 'Home & Living' },
                { label: 'Skin Care & Beauty', value: 'Beauty' }
              ].map((cat) => (
                <label 
                  key={cat.label} 
                  className="flex items-center gap-2.5 text-xs font-semibold cursor-pointer text-slate-655 dark:text-zinc-300 hover:text-[#C9A84C] dark:hover:text-[#C9A84C] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={categoryFilter === cat.value}
                    onChange={() => setCategoryFilter(cat.value)}
                    className="w-3.5 h-3.5 border-slate-300 dark:border-zinc-700 rounded text-black focus:ring-black accent-black cursor-pointer"
                  />
                  <span>{cat.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Ceiling */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-zinc-550">
              Price Ceiling
            </span>
            <div className="flex flex-col gap-1.5">
              <input
                type="range"
                min="0"
                max="90000"
                step="100"
                value={priceLimit}
                onChange={(e) => setPriceLimit(Number(e.target.value))}
                className="w-full accent-black dark:accent-white bg-slate-200 dark:bg-zinc-800 h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-505">
                <span>₹0</span>
                <span className="text-black dark:text-white font-extrabold">₹{priceLimit.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Color Palette */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-zinc-550">
              Color Palette
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { name: 'Black', hex: '#000000' },
                { name: 'White', hex: '#ffffff', border: true },
                { name: 'Beige', hex: '#E6DCC4' },
                { name: 'Espresso', hex: '#4B3621' },
                { name: 'Grey', hex: '#708090' },
                { name: 'Mahogany', hex: '#C04000' }
              ].map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(selectedColor === color.name ? '' : color.name)}
                  className={`w-6 h-6 rounded-full border transition-all relative ${
                    selectedColor === color.name ? 'ring-2 ring-black dark:ring-white scale-110' : 'hover:scale-105'
                  } ${color.border ? 'border-slate-300' : 'border-transparent'}`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  {selectedColor === color.name && (
                    <span className={`absolute inset-0 flex items-center justify-center text-[10px] ${
                      color.name === 'White' || color.name === 'Beige' ? 'text-black' : 'text-white'
                    }`}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-zinc-550">
              Apparel Size
            </span>
            <div className="flex gap-2">
              {['S', 'M', 'L', 'OS'].map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all ${
                    selectedSize === size
                      ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                      : 'border-slate-200 dark:border-zinc-800 text-slate-655 dark:text-zinc-450 hover:bg-slate-50 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-zinc-550">
              Min Rating
            </span>
            <div className="flex flex-col gap-2">
              {[4.9, 4.8, 4.7].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setMinRating(minRating === rating ? 0 : rating)}
                  className={`flex items-center gap-1.5 text-xs text-left font-bold transition-all ${
                    minRating === rating ? 'text-[#C9A84C]' : 'text-slate-655 dark:text-zinc-455 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={star <= Math.floor(rating) ? 'text-amber-500' : 'text-slate-200 dark:text-zinc-850'}>★</span>
                    ))}
                  </div>
                  <span>{rating} & Up</span>
                </button>
              ))}
            </div>
          </div>

          {/* Smart Compare Panel (Relocated from Right sidebar to Left Filters sidebar) */}
          <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-4 flex flex-col gap-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Scale size={12} className="text-[#C9A84C]" /> AI Specs Compare
            </h3>

            {compareItems.length === 0 ? (
              <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                Compare 2 or 3 items from details pages to construct an AI-powered matrix.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  {compareItems.map(item => (
                    <div key={item._id} className="flex justify-between items-center bg-slate-50 dark:bg-zinc-900/50 p-2 rounded-xl border border-slate-100 dark:border-zinc-800">
                      <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 truncate max-w-[140px]">{item.name}</span>
                      <button onClick={() => dispatch(toggleCompareItem(item))} className="text-[9px] font-black uppercase tracking-wider text-rose-500 hover:underline">Remove</button>
                    </div>
                  ))}
                </div>

                {compareItems.length >= 2 ? (
                  <button
                    onClick={handleCompare}
                    disabled={comparing}
                    className="w-full bg-black text-white hover:bg-neutral-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-black py-2.5 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {comparing ? 'COMPARING...' : 'RUN AI COMPARE'}
                  </button>
                ) : (
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Select 1 more product.</p>
                )}
              </div>
            )}

            <AnimatePresence>
              {compareData && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 border-t border-slate-100 dark:border-zinc-800/80 pt-4 flex flex-col gap-3 overflow-hidden"
                >
                  <span className="text-[8px] font-black uppercase text-[#C9A84C] tracking-[0.2em]">AI Verdict:</span>
                  <p className="text-[10px] leading-relaxed text-slate-655 dark:text-zinc-350 bg-amber-500/5 p-3 rounded-2xl border border-[#C9A84C]/20 font-medium">
                    {compareData.recommendation}
                  </p>

                  <div className="flex flex-col gap-2">
                    <span className="text-[8px] font-black text-slate-450 uppercase tracking-wider">Specifications Grid</span>
                    <div className="flex flex-col gap-1 text-[10px] font-semibold text-slate-500">
                      {compareData.specifications && compareData.specifications.map((spec, i) => (
                        <div key={i} className="flex justify-between border-b border-slate-100/50 dark:border-zinc-800/50 py-1.5">
                          <span className="font-bold text-slate-700 dark:text-zinc-300">{spec.feature}</span>
                          <span className="text-right text-[9px] text-slate-400">{spec.itemA} vs {spec.itemB}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <button onClick={() => dispatch(clearCompare())} className="text-[9px] font-black text-slate-400 hover:text-black dark:hover:text-white uppercase tracking-widest underline text-center">Clear</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Smart Budget Planner (Relocated from Right sidebar to Left Filters sidebar) */}
          <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-4 flex flex-col gap-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
              <DollarSign size={12} className="text-[#C9A84C]" /> AI Budget Planner
            </h3>

            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
              Enter your budget to construct a cohesive shopping bundle strategy.
            </p>

            <form onSubmit={handleBudgetPlan} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  placeholder="E.g. 5000"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl py-2 pl-6 pr-2 text-xs font-bold focus:outline-none focus:border-black dark:focus:border-zinc-350 text-neutral-800 dark:text-zinc-100"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-black">₹</span>
              </div>
              <button
                type="submit"
                disabled={generatingBudget}
                className="bg-black text-white hover:bg-neutral-800 dark:bg-zinc-100 dark:text-black px-3 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center gap-1"
              >
                {generatingBudget ? 'FITTING...' : 'GO'}
              </button>
            </form>

            <AnimatePresence>
              {budgetPlan && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-slate-100 dark:border-zinc-800/80 pt-4 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black uppercase text-[#C9A84C] tracking-[0.2em]">Strategy:</span>
                    <span className="text-[10px] font-black text-slate-800 dark:text-zinc-200">Total: ₹{budgetPlan.totalEstimate}</span>
                  </div>
                  
                  <p className="text-[10px] leading-relaxed text-slate-655 dark:text-zinc-350 italic bg-amber-500/5 p-3 rounded-2xl border border-[#C9A84C]/20 font-medium">
                    "{budgetPlan.strategy}"
                  </p>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[8px] font-black text-slate-450 uppercase tracking-wider">Recommended Bundle Items</span>
                    <div className="flex flex-col gap-2">
                      {budgetPlan.itemsToSelect && budgetPlan.itemsToSelect.map((item, i) => (
                        <div key={i} className="flex justify-between items-center bg-slate-50 dark:bg-zinc-900/50 p-2 rounded-xl border border-slate-100 dark:border-zinc-800">
                          <div className="flex flex-col truncate max-w-[130px]">
                            {item._id ? (
                              <Link to={`/product/${slugify(item.name)}`} className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 truncate hover:underline">
                                {item.name}
                              </Link>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 truncate">{item.name}</span>
                            )}
                            <span className="text-[9px] font-semibold text-slate-400">₹{item.price || item.estimatePrice}</span>
                          </div>
                          
                          <button
                            onClick={() => {
                              dispatch(addToCart({
                                product: item._id || 'mock_accessor_' + i,
                                name: item.name,
                                price: item.price || item.estimatePrice,
                                image: '',
                                qty: 1
                              }));
                            }}
                            className="bg-[#C9A84C] hover:brightness-110 text-white p-1 rounded-lg flex items-center justify-center transition-all shadow"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>

        {/* Center Product Grid (Increased to col-span-6 for better widescreen balance) */}
        <main className="lg:col-span-6 flex flex-col gap-6">
          <div className="flex justify-between items-end border-b border-slate-100 dark:border-zinc-800/80 pb-2">
            <h2 className="text-xl font-serif text-slate-800 dark:text-zinc-150 font-bold">
              Boutique Catalog
            </h2>
            <span className="text-[10px] font-bold text-slate-450 uppercase">
              {filteredProducts.length} Items Found
            </span>
          </div>

          {loading ? (
            <div className="responsive-product-grid">
              {[1, 2, 3, 4, 5].map(n => (
                <ProductSkeleton key={n} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="glass-card p-12 rounded-3xl text-center flex flex-col items-center gap-4 border border-slate-100 dark:border-zinc-800">
              <Sparkles size={48} className="text-slate-300 dark:text-zinc-700 animate-pulse" />
              <p className="text-sm font-semibold text-slate-500 leading-relaxed">
                No matching premium products found. Try resetting your search filters!
              </p>
              <button onClick={handleReset} className="bg-black text-white hover:bg-neutral-800 text-[10px] font-bold uppercase tracking-[0.2em] py-3 px-6 transition-all rounded-lg">
                RESET FILTERS
              </button>
            </div>
          ) : (
            <div className="responsive-product-grid">
              {filteredProducts.map((product, index) => (
                <React.Fragment key={product._id}>
                  <ProductCard product={product} />
                  
                  {/* Mobile-only In-Grid Recommendation Slot (Requirement 10) */}
                  {(index + 1) % 8 === 0 && displayedRecommendations.length > 0 && (
                    <div className="col-span-2 block md:hidden bg-slate-50 dark:bg-zinc-900/50 p-4 border border-slate-100 dark:border-zinc-800 rounded-2xl flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase text-[#C9A84C] tracking-[0.2em]">Recommended For You</span>
                        <span className="text-[8px] bg-[#C9A84C] text-white px-1.5 py-0.5 rounded font-bold">SPONSORED</span>
                      </div>
                      
                      {(() => {
                        const recIndex = Math.floor(index / 8) % displayedRecommendations.length;
                        const recProd = displayedRecommendations[recIndex];
                        if (!recProd) return null;
                        return (
                          <div className="flex gap-3 items-center">
                            <img 
                              src={recProd.image} 
                              alt={recProd.name} 
                              className="w-16 h-16 object-cover rounded-xl border border-slate-100 dark:border-zinc-800" 
                              loading="lazy"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">{recProd.name}</h4>
                              <span className="text-[10px] font-black text-slate-900 dark:text-zinc-100">₹{recProd.price.toLocaleString()}</span>
                              <div className="flex items-center gap-0.5 text-amber-500 text-[8px] mt-0.5">★ {recProd.rating}</div>
                            </div>
                            <button 
                              onClick={() => dispatch(addToCart({
                                product: recProd._id,
                                name: recProd.name,
                                price: recProd.price,
                                image: recProd.image,
                                qty: 1
                              }))}
                              className="bg-black dark:bg-zinc-100 text-white dark:text-black hover:bg-neutral-800 p-2.5 rounded-xl flex items-center justify-center transition-all shadow"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </main>

        {/* Right Sticky Sidebar (Col-span-3, grid layout on tablet, collapsible widgets on mobile) */}
        <aside className="w-full lg:col-span-3 flex flex-col gap-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto pr-1 md:grid md:grid-cols-2 lg:flex lg:flex-col">
          
          {/* 1. Compact Cart Summary */}
          <SidebarWidget title="Bag Summary" icon={<ShoppingBag size={13} className="text-[#C9A84C]" />} defaultOpen={true}>
            <div className="flex flex-col gap-3.5">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-655 dark:text-zinc-350">
                <span>Total Items:</span>
                <span className="font-extrabold text-black dark:text-white">{cartItems.reduce((sum, item) => sum + item.qty, 0)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-655 dark:text-zinc-350">
                <span>Subtotal:</span>
                <span className="font-extrabold text-black dark:text-white">₹{cartSubtotal.toLocaleString()}</span>
              </div>

              {/* Free Shipping Progress Indicator */}
              <div className="flex flex-col gap-1.5 mt-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                  {cartSubtotal >= 10000 ? (
                    <span className="text-[#C9A84C] font-black">🎉 FREE SHIPPING ELIGIBLE!</span>
                  ) : (
                    <span>Add ₹{(10000 - cartSubtotal).toLocaleString()} more for Free Shipping</span>
                  )}
                  <span>10K limit</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#C9A84C] h-full transition-all duration-500" 
                    style={{ width: `${Math.min((cartSubtotal / 10000) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {cartItems.length > 0 ? (
                <Link 
                  to="/checkout" 
                  className="w-full bg-black text-white dark:bg-zinc-150 dark:text-black py-3 rounded-xl text-center text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-800 dark:hover:bg-zinc-200 transition-all shadow-md block mt-2"
                >
                  Secure Checkout
                </Link>
              ) : (
                <p className="text-[10px] text-slate-400 italic text-center font-medium mt-1">Your luxury shopping bag is empty.</p>
              )}
            </div>
          </SidebarWidget>

          {/* 2. Promo Banner Carousel */}
          <SidebarWidget title="Exclusive Offers" icon={<Sparkles size={13} className="text-[#C9A84C]" />} defaultOpen={true}>
            <div className="relative w-full overflow-hidden rounded-2xl h-28 flex items-center shadow-sm">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentBanner}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className={`absolute inset-0 bg-gradient-to-br ${banners[currentBanner].bg} p-4 flex flex-col justify-between text-white`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[8px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">{banners[currentBanner].tag}</span>
                    <div className="flex gap-1">
                      {banners.map((_, idx) => (
                        <span 
                          key={idx} 
                          className={`w-1 h-1 rounded-full ${idx === currentBanner ? 'bg-white w-2' : 'bg-white/40'} transition-all`} 
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-xs font-black uppercase tracking-wider">{banners[currentBanner].title}</h4>
                    <p className="text-[10px] opacity-90 mt-0.5 leading-tight font-medium">{banners[currentBanner].description}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </SidebarWidget>

          {/* 3. Featured Products */}
          <SidebarWidget title="Featured Pieces" icon={<ShieldCheck size={13} className="text-[#C9A84C]" />} defaultOpen={true}>
            <div className="flex flex-col gap-3">
              {(() => {
                const featuredSideItems = products.filter(p => p.rating >= 4.8).slice(0, 2);
                if (featuredSideItems.length === 0) {
                  return <p className="text-[10px] text-slate-400 italic">No featured products loaded.</p>;
                }
                return featuredSideItems.map(prod => {
                  const discPercent = prod.originalPrice && prod.originalPrice > prod.price
                    ? Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100)
                    : 15;
                  return (
                    <div key={prod._id} className="flex gap-3 items-center group/feat relative">
                      <Link to={`/product/${slugify(prod.name)}`} className="w-14 h-14 bg-slate-50 dark:bg-zinc-800 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100 dark:border-zinc-800 block">
                        <img 
                          src={prod.image} 
                          alt={prod.name} 
                          className="w-full h-full object-cover group-hover/feat:scale-105 transition-transform duration-500" 
                          loading="lazy"
                        />
                      </Link>
                      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                        <Link to={`/product/${slugify(prod.name)}`} className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate hover:underline">
                          {prod.name}
                        </Link>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-900 dark:text-zinc-100">₹{prod.price.toLocaleString()}</span>
                          <span className="text-[8px] font-black text-[#C9A84C] uppercase tracking-wider">{discPercent}% OFF</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => dispatch(addToCart({
                          product: prod._id,
                          name: prod.name,
                          price: prod.price,
                          image: prod.image,
                          qty: 1
                        }))}
                        className="bg-black dark:bg-zinc-100 text-white dark:text-black hover:bg-neutral-800 p-2.5 rounded-xl flex items-center justify-center transition-all shadow"
                        title="Add to Bag"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          </SidebarWidget>

          {/* 4. Trending Categories */}
          <SidebarWidget title="Trending Markets" icon={<Compass size={13} className="text-[#C9A84C]" />} defaultOpen={true}>
            <div className="flex flex-col gap-2.5">
              {[
                { name: 'Fashion', label: 'Fashion & Apparel', icon: <Shirt size={12} /> },
                { name: 'Electronics', label: 'Tech & Audio', icon: <Tv size={12} /> },
                { name: 'Home & Living', label: 'Home Curation', icon: <Home size={12} /> },
                { name: 'Beauty', label: 'Beauty & Skincare', icon: <Sparkles size={12} /> }
              ].map(cat => {
                const count = products.filter(p => p.category === cat.name).length;
                const isActive = categoryFilter === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setCategoryFilter(isActive ? '' : cat.name)}
                    className={`flex justify-between items-center p-2 rounded-xl text-left text-xs font-bold border transition-all ${
                      isActive 
                        ? 'border-[#C9A84C] bg-amber-500/5 text-[#C9A84C]' 
                        : 'border-slate-100 dark:border-zinc-800/40 text-slate-655 dark:text-zinc-400 hover:border-slate-200 dark:hover:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {cat.icon}
                      <span>{cat.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 bg-slate-50 dark:bg-zinc-800/50 px-2 py-0.5 rounded-md">{count} items</span>
                  </button>
                );
              })}
            </div>
          </SidebarWidget>

          {/* 5. Recently Viewed */}
          <SidebarWidget title="Recently Viewed" icon={<Eye size={13} className="text-[#C9A84C]" />} defaultOpen={false}>
            <div className="flex flex-col gap-3">
              {displayedRecentlyViewed.length === 0 ? (
                <p className="text-[10px] text-slate-455 italic">No products viewed yet.</p>
              ) : (
                displayedRecentlyViewed.slice(0, 3).map(prod => (
                  <div key={prod._id} className="flex gap-3 items-center group/rv">
                    <Link to={`/product/${slugify(prod.name)}`} className="w-11 h-11 bg-slate-50 dark:bg-zinc-800 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100 dark:border-zinc-800 block">
                      <img 
                        src={prod.image} 
                        alt={prod.name} 
                        className="w-full h-full object-cover group-hover/rv:scale-105 transition-transform duration-500" 
                        loading="lazy"
                      />
                    </Link>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <Link to={`/product/${slugify(prod.name)}`} className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate hover:underline">
                        {prod.name}
                      </Link>
                      <span className="text-[11px] font-black text-slate-900 dark:text-zinc-100">₹{prod.price.toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SidebarWidget>

          {/* 6. Recommended For You */}
          <SidebarWidget title="Curated Matches" icon={<Heart size={13} className="text-[#C9A84C]" />} defaultOpen={false}>
            <div className="flex flex-col gap-3">
              {displayedRecommendations.length === 0 ? (
                <p className="text-[10px] text-slate-455 italic">No recommendations found.</p>
              ) : (
                displayedRecommendations.slice(0, 2).map(prod => (
                  <div key={prod._id} className="flex gap-3 items-center group/rec">
                    <Link to={`/product/${slugify(prod.name)}`} className="w-11 h-11 bg-slate-50 dark:bg-zinc-800 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100 dark:border-zinc-800 block">
                      <img 
                        src={prod.image} 
                        alt={prod.name} 
                        className="w-full h-full object-cover group-hover/rec:scale-105 transition-transform duration-500" 
                        loading="lazy"
                      />
                    </Link>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <Link to={`/product/${slugify(prod.name)}`} className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate hover:underline">
                        {prod.name}
                      </Link>
                      <span className="text-[11px] font-black text-[#C9A84C]">₹{prod.price.toLocaleString()}</span>
                    </div>
                    <button 
                      onClick={() => dispatch(addToCart({
                        product: prod._id,
                        name: prod.name,
                        price: prod.price,
                        image: prod.image,
                        qty: 1
                      }))}
                      className="bg-black dark:bg-zinc-100 text-white dark:text-black hover:bg-neutral-800 p-2 rounded-xl flex items-center justify-center transition-all shadow"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </SidebarWidget>

          {/* 7. Trust Elements */}
          <div className="grid grid-cols-2 gap-2 text-center text-slate-500 font-bold text-[9px] uppercase tracking-wider md:col-span-2 lg:col-span-1">
            <div className="border border-slate-100 dark:border-zinc-800/80 p-3 rounded-2xl flex flex-col items-center gap-1.5 bg-white/30 dark:bg-zinc-900/30">
              <Truck size={14} className="text-[#C9A84C]" />
              <span>Free Shipping</span>
            </div>
            <div className="border border-slate-100 dark:border-zinc-800/80 p-3 rounded-2xl flex flex-col items-center gap-1.5 bg-white/30 dark:bg-zinc-900/30">
              <RotateCcw size={14} className="text-[#C9A84C]" />
              <span>Easy Returns</span>
            </div>
            <div className="border border-slate-100 dark:border-zinc-800/80 p-3 rounded-2xl flex flex-col items-center gap-1.5 bg-white/30 dark:bg-zinc-900/30">
              <Lock size={14} className="text-[#C9A84C]" />
              <span>Secure Pay</span>
            </div>
            <div className="border border-slate-100 dark:border-zinc-800/80 p-3 rounded-2xl flex flex-col items-center gap-1.5 bg-white/30 dark:bg-zinc-900/30">
              <Headphones size={14} className="text-[#C9A84C]" />
              <span>24/7 Concierge</span>
            </div>
          </div>

        </aside>

      </div>
    </div>
  );
};

export default Shop;
