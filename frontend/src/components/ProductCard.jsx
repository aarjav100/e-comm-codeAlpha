import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShieldCheck, ShoppingBag, Eye, Heart } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/cartSlice';
import { toggleWishlistItem } from '../store/wishlistSlice';

// Helper to convert product name to SEO-friendly URL slug
export const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const wishlistItems = useSelector(state => state.wishlist?.items || []);
  const isWishlisted = wishlistItems.some(i => i._id === product._id || i.id === product._id);
  const outOfStock = product.stock <= 0;

  const handleAddToBag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart({
      product: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      qty: 1
    }));
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleWishlistItem(product));
  };

  const productUrl = `/product/${slugify(product.name)}`;

  return (
    <div className="product-card-responsive bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800/80 group">
      {/* Category/Status Badge */}
      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 bg-black/85 dark:bg-white/95 backdrop-blur text-white dark:text-black px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[7px] sm:text-[8px] font-black uppercase tracking-widest flex items-center gap-0.5 sm:gap-1 rounded-md shadow-sm">
        <ShieldCheck size={8} className="text-[#C9A84C] sm:scale-110" /> {product.subcategory || product.category || 'LUXE'}
      </div>

      {/* Like / Wishlist Button */}
      <button
        onClick={handleToggleWishlist}
        className={`absolute top-2 right-2 sm:top-4 sm:right-4 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-all duration-300 backdrop-blur-md ${
          isWishlisted 
            ? 'border-rose-500 bg-rose-500 text-white shadow-rose-500/20' 
            : 'border-slate-200/50 bg-white/70 dark:bg-black/50 text-slate-500 dark:text-zinc-455 hover:text-rose-500 hover:bg-white'
        } shadow-sm active:scale-90`}
        title="Toggle Wishlist"
      >
        <Heart className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${isWishlisted ? 'fill-current' : ''}`} />
      </button>

      {/* Image Container */}
      <Link to={productUrl} className="product-card-image-container w-full bg-slate-50 dark:bg-zinc-800 block">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name} 
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">No Image</div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center text-white text-[10px] font-black uppercase tracking-[0.2em]">
            Out of Stock
          </div>
        )}
      </Link>

      {/* Information and actions */}
      <div className="product-card-content dark:border-zinc-800/80">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-start gap-3">
            <Link to={productUrl} className="product-card-title text-slate-800 dark:text-zinc-200 hover:text-[#C9A84C] dark:hover:text-[#C9A84C] transition-colors line-clamp-1">
              {product.name}
            </Link>
            <span className="product-card-price text-slate-900 dark:text-zinc-100 flex-shrink-0">
              ₹{product.price.toLocaleString()}
            </span>
          </div>
          
          <p className="product-card-description text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed font-medium">
            {product.description}
          </p>
        </div>

        {/* Rating and Details buttons */}
        <div className="flex flex-col gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
          <div className="flex items-center justify-between text-[10px] font-bold">
            <div className="flex items-center text-amber-500 gap-0.5" title={`${product.rating} stars`}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star 
                  key={s} 
                  size={10} 
                  className={s <= Math.floor(product.rating || 5) ? 'fill-current' : 'text-slate-200 dark:text-zinc-700'} 
                />
              ))}
              <span className="ml-1 text-slate-600 dark:text-zinc-450">{product.rating || 5.0}</span>
            </div>
            
            <span className={`text-[9px] uppercase tracking-wider ${
              outOfStock ? 'text-rose-500' : 'text-emerald-600'
            }`}>
              {outOfStock ? 'Unavailable' : `${product.stock} in stock`}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
            <Link 
              to={productUrl}
              className="product-card-button flex-1 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/40 font-black uppercase tracking-widest transition-all rounded-lg text-center flex items-center justify-center gap-1"
            >
              <Eye size={10} /> Details
            </Link>

            <button
              onClick={handleAddToBag}
              disabled={outOfStock}
              className="product-card-button flex-1 bg-black dark:bg-zinc-100 text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-zinc-200 disabled:bg-slate-200 dark:disabled:bg-zinc-800 disabled:text-slate-400 dark:disabled:text-zinc-650 font-black uppercase tracking-widest transition-all rounded-lg flex items-center justify-center gap-1 shadow-sm active:translate-y-[1px]"
            >
              <ShoppingBag size={10} /> Add to Bag
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
