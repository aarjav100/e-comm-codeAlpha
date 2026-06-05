import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Share2, Scale, ShoppingBag, Star, SlidersHorizontal, ArrowLeft, Eye, Sparkles, ShieldCheck, X, Plus, Trash2, ThumbsUp } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/cartSlice';
import { toggleWishlistItem } from '../store/wishlistSlice';
import { toggleCompareItem } from '../store/productSlice';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Highlights = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const wishlistItems = useSelector(state => state.wishlist?.items || []);
  const compareItems = useSelector(state => state.products?.compareItems || []);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering states
  const [subCatFilter, setSubCatFilter] = useState('All');
  const [priceLimit, setPriceLimit] = useState(15000);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('featured');

  // Interactive Modals
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [zoomImage, setZoomImage] = useState(false);

  // Review states inside modal
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');

  // Share Notification state
  const [shareToast, setShareToast] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/products');
        // Season highlights correspond to brand LUXE or the first luxury curations (price under 10000)
        const highlightsOnly = res.data.filter(p => p.brand === 'LUXE' || p.price < 10000);
        setProducts(highlightsOnly);
      } catch (err) {
        setError('Failed to fetch season highlights.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Fetch reviews when details modal opens
  useEffect(() => {
    if (selectedProduct) {
      const fetchReviews = async () => {
        try {
          const res = await axios.get(`/api/products/${selectedProduct._id || selectedProduct.id}/reviews`);
          setReviews(res.data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchReviews();
    }
  }, [selectedProduct]);

  // Handle Review Submit
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      setSubmittingReview(true);
      const res = await axios.post(`/api/products/${selectedProduct._id || selectedProduct.id}/reviews`, {
        rating,
        comment
      });
      setReviewMsg('Review added successfully!');
      setComment('');
      setRating(5);
      // Refresh reviews list
      const updated = await axios.get(`/api/products/${selectedProduct._id || selectedProduct.id}/reviews`);
      setReviews(updated.data);
    } catch (err) {
      setReviewMsg(err.response?.data?.error || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
      setTimeout(() => setReviewMsg(''), 3000);
    }
  };

  // Handle Share copy link
  const handleShare = (product) => {
    const shareUrl = `${window.location.origin}/#/product/${product._id || product.id}`;
    navigator.clipboard.writeText(shareUrl);
    setShareToast(`Copied link for ${product.name}!`);
    setTimeout(() => setShareToast(''), 3000);
  };

  // Filter & Sort Operations
  const filteredProducts = products.filter(p => {
    if (subCatFilter !== 'All' && p.subcategory !== subCatFilter) return false;
    if (p.price > priceLimit) return false;
    if (p.rating < minRating) return false;
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    return 0; // Default featured
  });

  // Extract unique subcategories for filters
  const subcategories = ['All', ...new Set(products.map(p => p.subcategory).filter(Boolean))];

  return (
    <div className="flex flex-col gap-10 pb-20">
      {/* Back button */}
      <div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-black dark:hover:text-white transition-colors">
          <ArrowLeft size={13} /> Back to Curation Grid
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-outline-variant/30 pb-4">
        <span className="text-[10px] font-black tracking-[0.3em] text-[#C9A84C] uppercase">✦ VIP SELECTIONS</span>
        <h1 className="text-3xl md:text-5xl font-black font-serif tracking-tight text-neutral-900 dark:text-white">
          Season's Highlights
        </h1>
        <p className="text-xs text-neutral-500 font-semibold max-w-xl">
          Meticulously crafted items selected for the season. Each creation represents our dedication to structural purity and material permanence.
        </p>
      </div>

      {/* Share Toast */}
      <AnimatePresence>
        {shareToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-full text-xs font-bold shadow-2xl tracking-wider uppercase flex items-center gap-2"
          >
            <Sparkles size={14} className="text-[#C9A84C]" /> {shareToast}
          </motion.div>
        )}
      </AnimatePresence>

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
          {sortedProducts.length} Items Found
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Filters Ledger */}
        <aside className={`${showMobileFilters ? 'flex' : 'hidden lg:flex'} lg:col-span-3 flex-col gap-6 bg-white/40 dark:bg-[#121212]/45 p-6 border border-outline-variant/30 rounded-2xl backdrop-blur-md`}>
          <div className="flex justify-between items-center border-b pb-2 border-outline-variant/20">
            <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-zinc-200">Refine Selection</h3>
            <button 
              onClick={() => {
                setSubCatFilter('All');
                setPriceLimit(15000);
                setMinRating(0);
                setSortBy('featured');
              }}
              className="text-[9px] font-black text-[#C9A84C] uppercase hover:underline"
            >
              Reset
            </button>
          </div>

          {/* Subcategory */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Class Type</span>
            <div className="flex flex-col gap-2">
              {subcategories.map(sub => (
                <button
                  key={sub}
                  onClick={() => setSubCatFilter(sub)}
                  className={`text-left text-xs font-semibold py-1 hover:text-[#C9A84C] transition-colors flex justify-between ${
                    subCatFilter === sub ? 'text-[#C9A84C] font-black' : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  <span>{sub}</span>
                  {subCatFilter === sub && <span>✦</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Price Ceiling</span>
            <input
              type="range"
              min="200"
              max="15000"
              step="100"
              value={priceLimit}
              onChange={(e) => setPriceLimit(Number(e.target.value))}
              className="w-full accent-black dark:accent-white bg-slate-200 dark:bg-zinc-800 h-1 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-bold text-slate-500">
              <span>₹200</span>
              <span className="text-black dark:text-white font-extrabold">₹{priceLimit.toLocaleString()}</span>
            </div>
          </div>

          {/* Rating */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Customer Rating</span>
            <div className="flex flex-col gap-1.5">
              {[4.9, 4.8, 4.7].map(rating => (
                <button
                  key={rating}
                  onClick={() => setMinRating(minRating === rating ? 0 : rating)}
                  className={`text-left text-xs font-bold transition-all flex items-center gap-1.5 ${
                    minRating === rating ? 'text-[#C9A84C]' : 'text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <Star size={12} className="fill-current" />
                  <span>{rating} & Above</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Product Grid */}
        <main className="lg:col-span-9 flex flex-col gap-6">
          {/* Sorting controls */}
          <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sortedProducts.length} Highlights Found</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border border-outline-variant/30 text-[10px] font-bold uppercase tracking-wider rounded-lg p-2 focus:outline-none text-slate-800 dark:text-zinc-200"
            >
              <option value="featured">Featured Order</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Rating Breakdown</option>
              <option value="newest">New Releases</option>
            </select>
          </div>

          {/* Catalog grid list */}
          {loading ? (
            <div className="responsive-product-grid">
              {[1, 2, 3, 4, 5].map(n => (
                <div key={n} className="aspect-[3/4] bg-slate-100 dark:bg-zinc-900 animate-pulse rounded-2xl"></div>
              ))}
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-16 border border-outline-variant/20 rounded-2xl bg-white/30 dark:bg-zinc-900/30">
              <p className="text-sm font-semibold text-slate-500">No premium highlights matching these criteria.</p>
            </div>
          ) : (
            <div className="responsive-product-grid">
              {sortedProducts.map(product => {
                const isFavorited = wishlistItems.some(i => i._id === product._id || i.id === product.id);
                const isCompared = compareItems.some(i => i._id === product._id || i.id === product.id);
                const outOfStock = product.stock <= 0;

                return (
                  <motion.div
                    key={product._id || product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="product-card-responsive bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800/80 group"
                  >
                    {/* Image and actions */}
                    <div className="product-card-image-container aspect-[4/3] bg-neutral-50 dark:bg-neutral-800 overflow-hidden relative">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      />
                      {/* Selection overlay */}
                      <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-black/80 text-white px-1.5 py-0.5 sm:px-2 sm:py-0.5 text-[7px] sm:text-[8px] font-black uppercase tracking-widest z-10">
                        {product.subcategory || 'HIGHLIGHT'}
                      </span>

                      {/* Out of stock overlay */}
                      {outOfStock && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest">
                          Out of Stock
                        </div>
                      )}
                    </div>

                    {/* Information */}
                    <div className="product-card-content dark:border-zinc-800/80">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="product-card-title text-slate-800 dark:text-zinc-200 group-hover:underline truncate max-w-[160px]">
                            {product.name}
                          </h3>
                          <span className="product-card-price text-[#C9A84C]">₹{product.price.toLocaleString()}</span>
                        </div>
                        <p className="product-card-description text-slate-500 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      </div>

                      {/* Mini features & stars */}
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                        <span className="flex items-center text-gold-500 gap-0.5"><Star size={11} className="fill-current" /> {product.rating}</span>
                        <span className="text-[9px]">{product.stock} items left</span>
                      </div>

                      {/* Card actions */}
                      <div className="flex items-center gap-1.5 border-t border-outline-variant/20 pt-3">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowQuickView(true);
                          }}
                          className="product-card-button w-9 sm:w-auto sm:flex-1 h-9 border border-black dark:border-zinc-700 hover:bg-black hover:text-white dark:hover:bg-zinc-100 dark:hover:text-black font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 sm:w-3 sm:h-3" /> <span className="hidden sm:inline">Quick View</span>
                        </button>
                        
                        <button
                          onClick={() => dispatch(toggleWishlistItem(product))}
                          className={`w-9 h-9 border flex items-center justify-center transition-all ${
                            isFavorited ? 'border-rose-500 bg-rose-500/5 text-rose-500' : 'border-outline-variant hover:border-black text-slate-450 dark:hover:text-white'
                          }`}
                          title="Wishlist"
                        >
                          <Heart className={`w-3.5 h-3.5 sm:w-3 sm:h-3 ${isFavorited ? 'fill-current' : ''}`} />
                        </button>

                        <button
                          onClick={() => handleShare(product)}
                          className="w-9 h-9 border border-outline-variant hover:border-black text-slate-450 dark:hover:text-white flex items-center justify-center transition-all"
                          title="Share Link"
                        >
                          <Share2 className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           REUSABLE SYSTEM PRODUCT DETAILS MODAL (QUICK VIEW)
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showQuickView && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-4xl bg-white dark:bg-[#0a0a0a] border border-outline-variant/30 rounded-[2.5rem] shadow-2xl p-6 md:p-8 relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Close button */}
              <button
                onClick={() => {
                  setShowQuickView(false);
                  setSelectedProduct(null);
                }}
                className="absolute top-6 right-6 w-9 h-9 rounded-full border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors flex items-center justify-center text-slate-400 hover:text-black dark:hover:text-white z-10"
              >
                <X size={16} />
              </button>

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                
                {/* Image layout (5 cols) */}
                <div className="md:col-span-5 flex flex-col gap-4">
                  <div 
                    onClick={() => setZoomImage(!zoomImage)}
                    className="aspect-square bg-slate-50 dark:bg-zinc-900 rounded-3xl overflow-hidden border border-outline-variant/20 relative cursor-pointer"
                  >
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className={`w-full h-full object-cover transition-transform duration-500 ${
                        zoomImage ? 'scale-150' : 'scale-100'
                      }`}
                    />
                    <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur px-2.5 py-1 text-[8px] font-black uppercase text-white tracking-widest">
                      {zoomImage ? 'Tap to Reset' : 'Tap to Zoom'}
                    </div>
                  </div>

                  {/* Related Images gallery indicators */}
                  <div className="flex gap-2.5">
                    {[selectedProduct.image, selectedProduct.image, selectedProduct.image].map((img, i) => (
                      <div key={i} className="w-16 h-16 rounded-xl overflow-hidden border border-outline-variant/30 opacity-70 hover:opacity-100 cursor-pointer">
                        <img src={img} alt="detail swatch" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info layout (7 cols) */}
                <div className="md:col-span-7 flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#C9A84C]">{selectedProduct.category} • {selectedProduct.subcategory}</span>
                    <h2 className="text-xl md:text-2xl font-black font-serif text-black dark:text-white">{selectedProduct.name}</h2>
                    
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="flex items-center text-gold-500 gap-0.5"><Star size={12} className="fill-current" /> {selectedProduct.rating}</span>
                      <span>•</span>
                      <span>{selectedProduct.numReviews} custom verified ratings</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-zinc-450 leading-relaxed font-semibold">
                    {selectedProduct.description}
                  </p>

                  <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900/50 p-4 border border-outline-variant/20 rounded-2xl">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Premium Price</span>
                      <span className="text-xl font-black text-black dark:text-white">₹{selectedProduct.price.toLocaleString()}</span>
                    </div>
                    
                    <button
                      onClick={() => {
                        dispatch(addToCart({
                          product: selectedProduct._id || selectedProduct.id,
                          name: selectedProduct.name,
                          price: selectedProduct.price,
                          image: selectedProduct.image,
                          qty: 1
                        }));
                        setShowQuickView(false);
                      }}
                      className="bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black py-3 px-6 text-[10px] font-black uppercase tracking-widest shadow-md transition-all"
                    >
                      Add To Bag
                    </button>
                  </div>

                  {/* Specifications */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PRODUCT SPECIFICATIONS</span>
                    <div className="border border-outline-variant/25 rounded-2xl overflow-hidden text-xs">
                      {selectedProduct.specifications ? selectedProduct.specifications.map((spec, idx) => (
                        <div key={idx} className="flex justify-between p-3 border-b border-outline-variant/15 last:border-0 font-medium">
                          <span className="font-bold text-slate-700 dark:text-zinc-350">{spec.name}</span>
                          <span className="text-slate-500 text-right">{spec.value}</span>
                        </div>
                      )) : (
                        <div className="p-3 text-slate-450">Stitching Quality certificate and 2-Year warranty cards included.</div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Reviews ledger in Modal */}
              <div className="border-t border-outline-variant/20 pt-6 flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-zinc-200">Customer Feedback ledger</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Write reviews or view verified comments.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {/* Reviews Form (5 cols) */}
                  <div className="md:col-span-5 bg-slate-50 dark:bg-zinc-900/40 p-5 rounded-2xl border border-outline-variant/20 flex flex-col gap-3">
                    <h4 className="text-xs font-black uppercase text-slate-700 dark:text-zinc-300">Submit Review</h4>
                    {!user ? (
                      <p className="text-xs text-rose-500 italic font-semibold">Please sign in to rate this product.</p>
                    ) : (
                      <form onSubmit={handleReviewSubmit} className="flex flex-col gap-3">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className="text-gold-500"
                            >
                              <Star size={16} className={star <= rating ? 'fill-current' : ''} />
                            </button>
                          ))}
                        </div>

                        <textarea
                          rows="2"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Your comments..."
                          className="w-full bg-white dark:bg-zinc-900 border border-outline-variant/30 rounded-xl p-2.5 text-xs focus:outline-none focus:border-black text-slate-800 dark:text-zinc-200"
                          required
                        />

                        {reviewMsg && <span className="text-[10px] font-bold text-[#C9A84C]">{reviewMsg}</span>}

                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="w-full bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          Submit
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Reviews List (7 cols) */}
                  <div className="md:col-span-7 flex flex-col gap-3.5 max-h-60 overflow-y-auto">
                    {reviews.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No ratings yet. Be the first to review!</p>
                    ) : (
                      reviews.map(rev => (
                        <div key={rev._id || rev.id} className="p-3 border-b border-outline-variant/15 flex flex-col gap-1 last:border-0">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-slate-700 dark:text-zinc-300">{rev.userName}</span>
                            <span className="text-slate-450">{new Date(rev.createdAt).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="flex text-gold-500 gap-0.5">
                            {Array.from({ length: rev.rating }).map((_, idx) => (
                              <Star key={idx} size={8} className="fill-current" />
                            ))}
                          </div>

                          <p className="text-xs text-slate-600 dark:text-zinc-450 mt-1 font-semibold">{rev.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Highlights;
