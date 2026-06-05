import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, ShieldCheck, ThumbsUp, Sparkles, Plus, CheckCircle, ArrowLeft, ShoppingBag, CreditCard, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/cartSlice';
import ReviewSummary from '../components/ReviewSummary';
import ProductCard, { slugify } from '../components/ProductCard';
import ProductSkeleton from '../components/ProductSkeleton';

const ProductDetails = () => {
  const { idOrSlug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);

  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  
  // Swatches and Image swapper states
  const [activeImage, setActiveImage] = useState('');
  const [imageSwatches, setImageSwatches] = useState([]);

  // Submit review form states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [imagesInput, setImagesInput] = useState('');
  const [videosInput, setVideosInput] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Fetch product data and reviews
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all products to resolve slug/id and populate related products
        const prodListRes = await axios.get('/api/products');
        const list = prodListRes.data;
        setAllProducts(list);

        // Find product by matching _id OR slugified name
        const match = list.find(p => p._id === idOrSlug || slugify(p.name) === idOrSlug);
        
        if (match) {
          setProduct(match);
          setActiveImage(match.image);
          
          // Generate auxiliary swatches (using main image with filter overlays to simulate multiple angles/colors)
          const swatches = [
            match.image,
            match.image ? `${match.image}&sat=-50` : '', // desaturated
            match.image ? `${match.image}&hue=90` : '',   // shifted hue
            match.image ? `${match.image}&contrast=150` : '' // high contrast
          ].filter(Boolean);
          setImageSwatches(swatches);

          // Fetch reviews using the actual product _id
          const revRes = await axios.get(`/api/products/${match._id}/reviews?sortBy=${sortBy}`);
          setReviews(revRes.data);
        } else {
          // If not found, check if it's an ID we can try fetching directly
          try {
            const directRes = await axios.get(`/api/products/${idOrSlug}`);
            if (directRes.data) {
              setProduct(directRes.data);
              setActiveImage(directRes.data.image);
              setImageSwatches([directRes.data.image]);
              
              const revRes = await axios.get(`/api/products/${directRes.data._id}/reviews?sortBy=${sortBy}`);
              setReviews(revRes.data);
            }
          } catch (e) {
            console.error('Direct fetch failed too', e);
          }
        }
      } catch (err) {
        console.error('Failed to load product information', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [idOrSlug, sortBy]);

  // Track Recently Viewed
  useEffect(() => {
    if (product) {
      const currentVal = localStorage.getItem('luxe_recently_viewed');
      let viewedList = [];
      if (currentVal) {
        try {
          viewedList = JSON.parse(currentVal);
        } catch (e) {
          viewedList = [];
        }
      }
      viewedList = viewedList.filter(p => p._id !== product._id);
      viewedList.unshift({
        _id: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        rating: product.rating
      });
      viewedList = viewedList.slice(0, 5);
      localStorage.setItem('luxe_recently_viewed', JSON.stringify(viewedList));
    }
  }, [product]);

  // Handle Review Submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !product) return;

    try {
      setSubmittingReview(true);
      setSubmitSuccess('');
      setSubmitError('');

      const parsedImages = imagesInput.split(',').map(img => img.trim()).filter(Boolean);
      const parsedVideos = videosInput.split(',').map(vid => vid.trim()).filter(Boolean);

      const res = await axios.post(`/api/products/${product._id}/reviews`, {
        rating,
        comment,
        images: parsedImages,
        videos: parsedVideos
      });

      setSubmitSuccess(res.data.message);
      setComment('');
      setImagesInput('');
      setVideosInput('');
      
      // Update local reviews list
      const updatedRevs = await axios.get(`/api/products/${product._id}/reviews?sortBy=${sortBy}`);
      setReviews(updatedRevs.data);
      
      // Update rating counts
      setProduct(prev => ({
        ...prev,
        rating: res.data.productRating,
        numReviews: res.data.productNumReviews
      }));
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Review submission failed.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Upvote Review
  const handleVote = async (reviewId, voteType) => {
    try {
      const res = await axios.post(`/api/reviews/${reviewId}/helpful`, { type: voteType });
      
      setReviews(prev => prev.map(rev => {
        if (rev._id === reviewId) {
          return {
            ...rev,
            helpfulVotes: res.data.helpfulVotes,
            unhelpfulVotes: res.data.unhelpfulVotes
          };
        }
        return rev;
      }));
    } catch (err) {
      alert(err.response?.data?.error || 'Already voted or unauthorized.');
    }
  };

  // Handle Buy Now Action
  const handleBuyNow = () => {
    if (!product) return;
    dispatch(addToCart({
      product: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      qty: 1
    }));
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8 py-8 animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-zinc-800 rounded w-1/6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="flex flex-col gap-4">
            <div className="aspect-square bg-slate-200 dark:bg-zinc-800 rounded-3xl"></div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="w-16 h-16 bg-slate-200 dark:bg-zinc-800 rounded-xl"></div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="h-10 bg-slate-200 dark:bg-zinc-800 rounded w-3/4"></div>
            <div className="h-5 bg-slate-200 dark:bg-zinc-800 rounded w-1/3"></div>
            <div className="h-28 bg-slate-200 dark:bg-zinc-800 rounded-2xl"></div>
            <div className="h-14 bg-slate-200 dark:bg-zinc-800 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  // Handle product not found -> redirects to 404
  if (!product) {
    navigate('/404', { replace: true });
    return null;
  }

  // Get related products from the same category (excluding current product)
  const relatedProducts = allProducts
    .filter(p => p.category === product.category && p._id !== product._id)
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-12 pb-16">
      
      {/* Breadcrumb / Back Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-450 dark:text-zinc-500">
        <Link to="/shop" className="hover:text-[#C9A84C] transition-colors flex items-center gap-1">
          <ArrowLeft size={13} /> Shop
        </Link>
        <ChevronRight size={10} />
        <span className="text-slate-400 capitalize">{product.category.toLowerCase()}</span>
        <ChevronRight size={10} />
        <span className="text-slate-800 dark:text-zinc-250 truncate max-w-[200px]">{product.name}</span>
      </div>

      {/* Main product presentation */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        
        {/* Left Side: Images Swatches Gallery */}
        <div className="flex flex-col gap-4">
          <div className="glass p-4 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-zinc-800/80 aspect-square flex items-center justify-center bg-slate-50/50 max-h-[500px]">
            {activeImage ? (
              <img 
                src={activeImage} 
                alt={product.name} 
                className="w-full h-full object-cover rounded-2xl shadow-sm transition-all duration-350" 
              />
            ) : (
              <span className="text-slate-400">No Image Available</span>
            )}
          </div>

          {/* Swatches selector indicators */}
          {imageSwatches.length > 1 && (
            <div className="flex gap-3 overflow-x-auto py-1">
              {imageSwatches.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border transition-all duration-200 flex-shrink-0 bg-slate-50 dark:bg-zinc-850 ${
                    activeImage === img 
                      ? 'border-[#C9A84C] ring-2 ring-[#C9A84C]/25 scale-105 shadow-md' 
                      : 'border-slate-200 dark:border-zinc-800 hover:border-slate-350 opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`swatch ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Product Details & Add to Cart / Buy Now */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="bg-black dark:bg-white text-white dark:text-black px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider w-fit">
              {product.subcategory || product.category}
            </span>
            <h1 className="text-2xl md:text-4xl font-extrabold font-serif text-slate-800 dark:text-zinc-150 leading-tight">
              {product.name}
            </h1>
            
            {/* Star ratings */}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center text-amber-500 font-black text-xs gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star 
                    key={s} 
                    size={12} 
                    className={s <= Math.floor(product.rating || 5) ? 'fill-current' : 'text-slate-200 dark:text-zinc-700'} 
                  />
                ))}
                <span className="ml-1 text-slate-700 dark:text-zinc-300 font-extrabold">{product.rating || 5.0}</span>
              </div>
              <span className="text-xs text-slate-400 dark:text-zinc-550">
                ({product.numReviews || 0} customer reviews)
              </span>
            </div>
          </div>

          <p className="text-xs md:text-sm text-slate-655 dark:text-zinc-350 leading-relaxed font-semibold">
            {product.description}
          </p>

          {/* Pricing & Stock Banner */}
          <div className="flex flex-col gap-2 bg-slate-50 dark:bg-zinc-900/50 p-5 border border-slate-100 dark:border-zinc-800 rounded-2xl">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Premium Price</span>
                <span className="text-2xl font-black text-slate-850 dark:text-zinc-100">₹{product.price.toLocaleString()}</span>
              </div>
              
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Availability</span>
                <span className={`text-xs font-black uppercase tracking-wider ${
                  product.stock > 0 ? 'text-emerald-600' : 'text-rose-500'
                }`}>
                  {product.stock > 0 ? `${product.stock} units in stock` : 'Out of Stock'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button
                onClick={() => {
                  dispatch(addToCart({
                    product: product._id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    qty: 1
                  }));
                }}
                disabled={product.stock <= 0}
                className="flex-1 bg-transparent border border-black dark:border-zinc-700 text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-zinc-100 dark:hover:text-black disabled:bg-slate-105 disabled:text-slate-400 disabled:border-slate-205 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <ShoppingBag size={13} /> Add to Bag
              </button>

              <button
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="flex-1 bg-black dark:bg-zinc-100 text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-zinc-200 disabled:bg-slate-200 disabled:text-slate-400 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md hover:translate-y-[-1px] active:translate-y-0"
              >
                <CreditCard size={13} /> Buy Now
              </button>
            </div>
          </div>

          {/* Specifications Grid */}
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">PRODUCT SPECIFICATIONS</span>
            <div className="border border-slate-100 dark:border-zinc-800/80 rounded-2xl overflow-hidden text-xs bg-white/40 dark:bg-zinc-900/10">
              {product.specifications && product.specifications.length > 0 ? (
                product.specifications.map((spec, i) => (
                  <div key={i} className="flex justify-between p-3.5 border-b border-slate-100/50 dark:border-zinc-850 last:border-b-0 font-medium">
                    <span className="font-bold text-slate-700 dark:text-zinc-350">{spec.name}</span>
                    <span className="text-slate-600 dark:text-zinc-400 text-right">{spec.value}</span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-slate-400 italic text-center font-medium">No detailed specifications loaded for this item.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="flex flex-col gap-6 border-t border-slate-100 dark:border-zinc-800/80 pt-10">
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-[#C9A84C]">Recommended for You</span>
            <h2 className="text-xl font-black font-serif text-slate-800 dark:text-zinc-100">Related Products</h2>
          </div>
          <div className="responsive-product-grid">
            {relatedProducts.map(p => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* AI pros/cons summary */}
      <section className="flex flex-col gap-4 border-t border-slate-100 dark:border-zinc-800/80 pt-10">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AI Feedback summary</span>
        <ReviewSummary productId={product._id} />
      </section>

      {/* Reviews ledger and submissions */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-t border-slate-100 dark:border-zinc-800/80 pt-10">
        {/* Left Side: Submit review form (5 cols) */}
        <div className="lg:col-span-5 glass p-6 rounded-3xl border border-slate-100 dark:border-zinc-800 flex flex-col gap-4">
          <h3 className="text-xs font-black uppercase text-slate-800 dark:text-zinc-200 tracking-wider">
            Submit Customer Review
          </h3>

          {!user ? (
            <p className="text-xs text-rose-500 font-semibold italic">
              Please sign in to submit a verified purchase review.
            </p>
          ) : (
            <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-455 uppercase">Star Rating</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="text-gold-500 focus:outline-none transition-transform active:scale-95"
                    >
                      <Star size={20} className={star <= rating ? 'fill-current' : ''} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-455 uppercase">Written Comment</label>
                <textarea
                  rows="3"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Review comment..."
                  className="w-full bg-slate-100 dark:bg-zinc-900 border border-slate-200/55 dark:border-zinc-800 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-gold-500 text-slate-800 dark:text-zinc-100"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-455 uppercase">Image Attachments (Comma separated)</label>
                <input
                  type="text"
                  placeholder="Image URLs..."
                  value={imagesInput}
                  onChange={(e) => setImagesInput(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-zinc-900 border border-slate-200/55 dark:border-zinc-800 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-gold-500 text-slate-800 dark:text-zinc-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-455 uppercase">Video Attachments (Comma separated)</label>
                <input
                  type="text"
                  placeholder="Video URLs..."
                  value={videosInput}
                  onChange={(e) => setVideosInput(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-zinc-900 border border-slate-200/55 dark:border-zinc-800 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-gold-500 text-slate-800 dark:text-zinc-100"
                />
              </div>

              {submitError && <span className="text-[11px] text-rose-500 font-bold">{submitError}</span>}
              {submitSuccess && <span className="text-[11px] text-emerald-500 font-bold flex items-center gap-1"><CheckCircle size={12} /> {submitSuccess}</span>}

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles size={14} /> {submittingReview ? 'SUBMITTING...' : 'SUBMIT REVIEW'}
              </button>
            </form>
          )}
        </div>

        {/* Right Side: Reviews Display Listing (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
              Verified Customer Ledger ({reviews.length})
            </h3>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border border-slate-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider rounded-lg p-1.5 focus:outline-none text-slate-700 dark:text-zinc-300 cursor-pointer"
            >
              <option value="newest">Newest Reviews</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>

          <div className="flex flex-col gap-4">
            {reviews.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No reviews submitted yet for this product.</p>
            ) : (
              reviews.map((rev) => (
                <div key={rev._id} className="glass p-5 rounded-2xl border border-slate-100/60 dark:border-zinc-800 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{rev.userName}</span>
                      <div className="flex items-center gap-1">
                        <div className="flex text-amber-500">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} size={10} className="fill-current" />
                          ))}
                        </div>
                        {rev.verifiedPurchase && (
                          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wide flex items-center gap-0.5">
                            <ShieldCheck size={10} /> Verified Purchase
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-semibold">
                    {rev.comment}
                  </p>

                  {rev.images && rev.images.length > 0 && (
                    <div className="flex gap-2.5 mt-1 overflow-x-auto py-1">
                      {rev.images.map((img, idx) => (
                        <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden border border-slate-100/50 flex-shrink-0">
                          <img src={img} alt="attachment" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  {rev.videos && rev.videos.length > 0 && (
                    <div className="flex gap-2.5 mt-1 overflow-x-auto py-1">
                      {rev.videos.map((vid, idx) => (
                        <div key={idx} className="px-3 py-2 bg-slate-50 dark:bg-zinc-850 border border-slate-100 dark:border-zinc-800 rounded-lg flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-700 transition-colors font-bold uppercase tracking-wider flex-shrink-0">
                          Video Review #{idx + 1}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-1 border-t border-slate-100/50 dark:border-zinc-800/80 pt-3">
                    <button
                      onClick={() => handleVote(rev._id, 'helpful')}
                      className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-450 hover:text-[#C9A84C] transition-colors"
                    >
                      <ThumbsUp size={11} /> Helpful ({rev.helpfulVotes || 0})
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductDetails;
