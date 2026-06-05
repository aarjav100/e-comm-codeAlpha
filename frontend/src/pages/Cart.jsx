import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { updateCartQty, removeFromCart, syncCartMetadata, clearCart, addToCart } from '../store/cartSlice';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Cart = () => {
  const dispatch = useDispatch();
  const { items, subtotal, hasFreeShipping, remainingToFreeShipping, recommendations } = useSelector(state => state.cart);

  // Sync cart metadata with backend to retrieve precise free-shipping recommendations
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const cartItemsFormatted = items.map(item => ({
          product: item.product,
          qty: item.qty
        }));
        const res = await axios.post('/api/cart/metadata', { cartItems: cartItemsFormatted });
        dispatch(syncCartMetadata(res.data));
      } catch (err) {
        console.error('Failed to sync cart metadata', err);
      }
    };
    fetchMetadata();
  }, [items, dispatch]);

  const handleQtyChange = (productId, currentQty, amount) => {
    const nextQty = currentQty + amount;
    if (nextQty >= 1) {
      dispatch(updateCartQty({ product: productId, qty: nextQty }));
    }
  };

  const handleRemove = (productId) => {
    dispatch(removeFromCart(productId));
  };

  const freeShippingPercentage = Math.min(100, (subtotal / 1000) * 100);

  if (items.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-[#121212] border border-outline-variant/30 flex flex-col items-center gap-4 max-w-xl mx-auto my-8 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-neutral-50 dark:bg-zinc-900 border border-outline-variant/30 flex items-center justify-center text-neutral-400">
          <ShoppingBag size={24} />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-800 dark:text-zinc-200">Your Selection is Empty</h2>
          <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">Explore our premium catalog collections to start shopping</p>
        </div>
        <Link to="/" className="bg-black text-white hover:bg-neutral-800 dark:bg-zinc-100 dark:text-black hover:opacity-95 text-[10px] font-bold uppercase tracking-[0.2em] py-3.5 px-8 transition-all mt-2 shadow-sm">
          EXPLORE CATALOG
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-16">
      <div className="flex flex-col gap-1 border-b border-outline-variant/35 pb-2">
        <h2 className="text-2xl font-serif text-black dark:text-white font-bold">
          Your Selection
        </h2>
        <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-widest">
          {items.length} Curated Items In Bag
        </span>
      </div>

      {/* Dynamic Free Shipping Threshold Meter */}
      <section className="bg-white dark:bg-[#121212] p-6 border border-outline-variant/30 shadow-sm flex flex-col gap-3 relative overflow-hidden">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
          <span className="flex items-center gap-1.5 text-neutral-800 dark:text-zinc-200">
            <Sparkles size={12} className="text-[#b89626]" /> Complimentary Delivery Ledger
          </span>
          <span className="text-black dark:text-white">
            {hasFreeShipping ? 'UNLOCKED' : `₹${subtotal} / ₹1,000`}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-neutral-100 dark:bg-zinc-800 rounded-none overflow-hidden relative border border-outline-variant/20">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${freeShippingPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-black dark:bg-white"
          />
        </div>

        <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-neutral-455 mt-0.5">
          <span>
            {hasFreeShipping 
              ? 'Complimentary premium courier shipping applied.' 
              : `Add ₹${remainingToFreeShipping.toLocaleString()} more to qualify for complimentary delivery.`
            }
          </span>
          {!hasFreeShipping && (
            <span className="text-[#b89626]">
              Target: ₹1,000
            </span>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Cart Items List (8 cols) */}
        <main className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.product}
                  layout
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white dark:bg-[#121212] p-6 border border-outline-variant/30 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center justify-between shadow-sm hover:shadow-md transition-shadow relative"
                >
                  {/* Product Details */}
                  <div className="flex gap-4 sm:gap-6 items-center flex-1 w-full">
                    <Link to={`/product/${item.product}`} className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-50 overflow-hidden border border-outline-variant/20 flex-shrink-0 block hover:opacity-95 transition-opacity">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400 font-bold">Image</div>
                      )}
                    </Link>

                    <div className="flex flex-col gap-1 truncate max-w-[200px] sm:max-w-xs">
                      <Link to={`/product/${item.product}`} className="text-xs font-bold text-neutral-800 dark:text-zinc-200 hover:underline truncate">
                        {item.name}
                      </Link>
                      <span className="text-[11px] text-neutral-500 dark:text-zinc-450 font-black">₹{item.price.toLocaleString()} each</span>
                    </div>
                  </div>

                  {/* Quantity & Actions Group */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-zinc-800">
                    {/* Quantity Modifier */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleQtyChange(item.product, item.qty, -1)}
                        className="w-8 h-8 border border-outline-variant/40 hover:bg-neutral-50 dark:hover:bg-zinc-800 flex items-center justify-center text-neutral-500"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="text-xs font-bold w-6 text-center text-neutral-800 dark:text-zinc-200">{item.qty}</span>
                      <button
                        onClick={() => handleQtyChange(item.product, item.qty, 1)}
                        className="w-8 h-8 border border-outline-variant/40 hover:bg-neutral-50 dark:hover:bg-zinc-800 flex items-center justify-center text-neutral-500"
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    {/* Total Price */}
                    <span className="text-xs font-black text-neutral-800 dark:text-zinc-150 w-24 text-right">
                      ₹{(item.price * item.qty).toLocaleString()}
                    </span>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemove(item.product)}
                      className="text-neutral-400 hover:text-rose-500 transition-colors p-2"
                      title="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <button onClick={() => dispatch(clearCart())} className="text-[9px] uppercase font-black tracking-widest text-neutral-400 hover:text-black dark:hover:text-white transition-colors w-fit underline mt-1">
            Clear Selection
          </button>
        </main>

        {/* Right Side: Dynamic Upsells & Cart Summary (4 cols) */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Threshold upsell items panel */}
          {!hasFreeShipping && recommendations.length > 0 && (
            <div className="bg-white dark:bg-[#121212] p-6 border border-outline-variant/30 flex flex-col gap-4 shadow-sm">
              <span className="text-[9px] font-black uppercase text-[#b89626] tracking-wider flex items-center gap-1">
                <Sparkles size={12} className="animate-pulse" /> Add These to Reach Free Shipping
              </span>
              
              <div className="flex flex-col gap-3">
                {recommendations.slice(0, 3).map(prod => (
                  <div key={prod._id} className="flex justify-between items-center bg-neutral-50 dark:bg-zinc-900/50 p-2.5 rounded-lg border border-outline-variant/20">
                    <div className="flex flex-col truncate max-w-[160px]">
                      <Link to={`/product/${prod._id}`} className="text-[11px] font-bold text-neutral-700 dark:text-zinc-355 truncate hover:underline">
                        {prod.name}
                      </Link>
                      <span className="text-[10px] font-semibold text-neutral-550">₹{prod.price.toLocaleString()}</span>
                    </div>

                    <button
                      onClick={() => {
                        dispatch(addToCart({
                          product: prod._id,
                          name: prod.name,
                          price: prod.price,
                          image: prod.image,
                          qty: 1
                        }));
                      }}
                      className="bg-black text-white hover:bg-neutral-850 p-2 rounded-lg flex items-center justify-center transition-all shadow"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Premium AI Upsell Block for high value cart (> 10k) */}
          {subtotal >= 10000 && (
            <div className="bg-white dark:bg-[#121212] p-6 border border-outline-variant/30 flex flex-col gap-4 shadow-sm bg-gradient-to-tr from-amber-500/5 to-transparent relative overflow-hidden">
              <span className="text-[9px] font-black uppercase text-[#b89626] tracking-wider flex items-center gap-1.5 animate-pulse">
                <Sparkles size={12} /> AI Premium curation recommendations
              </span>
              <p className="text-[11px] text-neutral-500 leading-normal font-semibold">
                Your Selection exceeds ₹10,000. Elevate your items with these hand-picked luxury styling pieces:
              </p>
              
              <div className="flex flex-col gap-3">
                {[
                  { id: 'upsell_sleeve', name: 'Zenith Premium Leather Laptop Sleeve', price: 2999, category: 'Accessories' },
                  { id: 'upsell_mouse', name: 'LUXE High-Precision Wireless Pro Mouse', price: 4999, category: 'Accessories' },
                  { id: 'upsell_keypad', name: 'LUXE Mechanical Backlit Keypad', price: 7499, category: 'Accessories' }
                ].map(item => {
                  const alreadyInCart = items.some(i => i.product === item.id);
                  if (alreadyInCart) return null;
                  return (
                    <div key={item.id} className="flex justify-between items-center bg-neutral-50 dark:bg-zinc-900/50 p-2.5 rounded-lg border border-outline-variant/20">
                      <div className="flex flex-col truncate max-w-[170px]">
                        <Link to={`/product/${item.id}`} className="text-[11px] font-bold text-neutral-700 dark:text-zinc-350 truncate hover:underline">
                          {item.name}
                        </Link>
                        <span className="text-[10px] font-semibold text-neutral-550">₹{item.price.toLocaleString()}</span>
                      </div>

                      <button
                        onClick={() => {
                          dispatch(addToCart({
                            product: item.id,
                            name: item.name,
                            price: item.price,
                            image: '',
                            qty: 1
                          }));
                        }}
                        className="bg-black text-white hover:bg-neutral-850 p-2 rounded-lg flex items-center justify-center transition-all shadow"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cart Summary */}
          <div className="bg-white dark:bg-[#121212] p-6 border border-outline-variant/30 flex flex-col gap-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-800 dark:text-zinc-200">
              Order Summary
            </h3>

            <div className="flex flex-col gap-3 border-b border-outline-variant/20 pb-4 text-xs font-semibold text-neutral-550 dark:text-zinc-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-black dark:text-white">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="text-black dark:text-white">
                  {hasFreeShipping ? 'Complimentary' : '₹100'}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm font-black text-black dark:text-white uppercase tracking-wider">
              <span>Total Price</span>
              <span>₹{(subtotal + (hasFreeShipping ? 0 : 100)).toLocaleString()}</span>
            </div>

            <Link
              to="/checkout"
              className="w-full bg-[#141b2b] text-white hover:bg-black py-4 text-center text-xs font-extrabold uppercase tracking-widest transition-colors shadow-md active:scale-[0.99] duration-300"
            >
              PROCEED TO CHECKOUT
            </Link>
          </div>

          {/* Secure Assurances */}
          <div className="flex flex-col gap-4 mt-2 px-1">
            <div className="flex items-center gap-3 text-neutral-600 dark:text-zinc-400">
              <ShieldCheck size={18} className="text-[#b89626]" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-wider">Secure Payment Portal</span>
                <span className="text-[9px] font-semibold text-neutral-450 leading-tight">Encrypted SSL protocol ensures financial confidentiality.</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-neutral-600 dark:text-zinc-400">
              <ShieldCheck size={18} className="text-[#b89626]" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-wider">Premium Warranty Assured</span>
                <span className="text-[9px] font-semibold text-neutral-450 leading-tight">Every selection is backed by a 2-year complimentary quality certificate.</span>
              </div>
            </div>
          </div>

        </aside>

      </div>
    </div>
  );
};

export default Cart;
