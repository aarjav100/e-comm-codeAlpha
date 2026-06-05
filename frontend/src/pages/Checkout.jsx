import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CreditCard, ShieldCheck, CheckCircle, Gift, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { clearCart } from '../store/cartSlice';
import CheckoutOptimizer from '../components/CheckoutOptimizer';
import { Link } from 'react-router-dom';

const Checkout = () => {
  const dispatch = useDispatch();
  const { items, subtotal, hasFreeShipping } = useSelector(state => state.cart);
  const { user } = useSelector(state => state.auth);

  // Form Fields
  const [address, setAddress] = useState('123 Luxury Avenue');
  const [city, setCity] = useState('Mumbai');
  const [zipcode, setZipcode] = useState('400001');
  const [phone, setPhone] = useState('+91 9876543210');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [deliveryMethod, setDeliveryMethod] = useState('standard');

  // Points redemption
  const [pointsInput, setPointsInput] = useState(0);
  const [redeemedPoints, setRedeemedPoints] = useState(0);

  // Checkout states
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  // Spin wheel states
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [wheelDegree, setWheelDegree] = useState(0);

  const cartTotal = subtotal + (hasFreeShipping ? 0 : 100);

  // Maximum allowed points to redeem (cannot exceed user points or cart total)
  const maxRedeemablePoints = user ? Math.min(user.walletPoints, subtotal) : 0;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to complete checkout.');
      return;
    }

    try {
      setIsPlacingOrder(true);
      
      const orderItems = items.map(item => ({
        product: item.product,
        name: item.name,
        qty: item.qty,
        price: item.price,
        image: item.image
      }));

      // Create Order on backend
      const orderRes = await axios.post('/api/orders', {
        orderItems,
        shippingAddress: { address, city, zipcode, phone },
        paymentMethod,
        pointsToRedeem: Number(pointsInput)
      }, { withCredentials: true });

      const orderObj = orderRes.data.order;

      // Verify payment (auto-verify in our offline sandbox simulation!)
      const verifyRes = await axios.post('/api/orders/verify', {
        orderId: orderObj._id
      }, { withCredentials: true });

      setCreatedOrder(verifyRes.data.order);
      setRedeemedPoints(Number(pointsInput));
      setCheckoutSuccess(true);
      dispatch(clearCart());
      
      // Auto-launch the gamified Spin Wheel after a brief celebration delay!
      setTimeout(() => {
        setShowSpinWheel(true);
      }, 1500);

    } catch (err) {
      alert(err.response?.data?.error || 'Checkout transaction failed.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Perform Lucky Spin wheel trigger
  const handleSpinWheel = async () => {
    if (spinning || !createdOrder) return;

    try {
      setSpinning(true);
      
      // Dynamic visual spin degree calculation
      const extraDegrees = 1440 + Math.floor(Math.random() * 360); // 4 full spins + random offset
      setWheelDegree(extraDegrees);

      // Trigger backend gamification award
      const res = await axios.post('/api/gamification/spin', {
        orderId: createdOrder._id
      }, { withCredentials: true });

      setTimeout(() => {
        setSpinResult(res.data);
        setSpinning(false);
      }, 3000); // 3 seconds spinning animation

    } catch (err) {
      alert('Gamification lucky spin error.');
      setSpinning(false);
    }
  };

  if (items.length === 0 && !checkoutSuccess) {
    return (
      <div className="text-center py-16 flex flex-col gap-3">
        <h2 className="text-lg font-bold text-slate-800">No items to checkout.</h2>
        <Link to="/" className="text-gold-600 font-bold hover:underline">Explore Products</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-16 max-w-4xl mx-auto">
      {/* Minimalism Progress Steps Bar */}
      <div className="flex justify-between items-center max-w-lg mx-auto py-4 px-2 w-full">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full border border-neutral-350 dark:border-zinc-700 bg-neutral-100 dark:bg-zinc-800 text-[10px] font-black flex items-center justify-center text-neutral-500">✓</span>
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500">01 Bag</span>
        </div>
        <div className="flex-grow h-[1px] bg-neutral-200 dark:bg-zinc-800 mx-4"></div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-black dark:bg-white text-white dark:text-black text-[10px] font-black flex items-center justify-center">02</span>
          <span className="text-[10px] font-black uppercase tracking-wider text-black dark:text-white">02 Dispatch</span>
        </div>
        <div className="flex-grow h-[1px] bg-neutral-200 dark:bg-zinc-800 mx-4"></div>
        <div className="flex items-center gap-2 font-medium">
          <span className="w-5 h-5 rounded-full border border-neutral-200 dark:border-zinc-800 text-[10px] font-black flex items-center justify-center text-neutral-400">03</span>
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">03 Payment</span>
        </div>
      </div>

      <div className="flex flex-col gap-1 border-b border-outline-variant/35 pb-2">
        <h2 className="text-2xl font-serif text-black dark:text-white font-bold">
          Secure Checkout
        </h2>
        <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-widest">
          Complete Your Luxury Selection Order
        </span>
      </div>

      {/* Success Screens */}
      {checkoutSuccess && (
        <div className="flex flex-col gap-6 text-center py-8 bg-white dark:bg-[#121212] p-8 border border-outline-variant/30 max-w-xl mx-auto my-4 shadow-md">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-2 border border-emerald-500/20">
            <CheckCircle size={28} />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <h1 className="text-xl font-extrabold font-serif text-black dark:text-white">
              Order Confirmed & Settled
            </h1>
            <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider leading-relaxed">
              Your transaction has successfully completed security verifications. A complimentary delivery dispatch has been initialized.
            </p>
          </div>

          <div className="bg-neutral-50 dark:bg-zinc-900/50 p-4 border border-outline-variant/20 flex flex-col gap-2 text-xs font-semibold text-neutral-700 dark:text-zinc-300">
            <div className="flex justify-between">
              <span>Order Reference:</span>
              <span className="font-bold">{createdOrder?._id}</span>
            </div>
            <div className="flex justify-between">
              <span>Loyalty Points Redeemed:</span>
              <span className="text-rose-500 font-bold">-{redeemedPoints} pts</span>
            </div>
            <div className="flex justify-between">
              <span>Loyalty Points Earned:</span>
              <span className="text-emerald-500 font-bold">+{createdOrder?.pointsEarned} pts</span>
            </div>
          </div>

          <Link to="/" className="bg-black text-white hover:bg-neutral-850 dark:bg-zinc-100 dark:text-black py-4 text-xs font-extrabold uppercase tracking-widest transition-all w-full shadow-md text-center">
            CONTINUE SHOPPING
          </Link>
        </div>
      )}

      {/* Regular Checkout Form */}
      {!checkoutSuccess && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left: Input Sheets Form (7 cols) */}
          <form onSubmit={handlePlaceOrder} className="md:col-span-7 flex flex-col gap-6">
            
            {/* Shipping addresses */}
            <div className="bg-white dark:bg-[#121212] p-6 border border-outline-variant/30 flex flex-col gap-4 shadow-sm">
              <span className="text-[10px] font-black uppercase text-neutral-800 dark:text-zinc-200 tracking-wider">
                1. Delivery Dispatch Address
              </span>
              
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-wider">Street Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-neutral-55 dark:bg-zinc-900 border border-outline-variant/30 rounded-none py-3 px-4 text-xs font-semibold focus:outline-none focus:border-black dark:focus:border-white text-neutral-800 dark:text-zinc-100"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-wider">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-neutral-55 dark:bg-zinc-900 border border-outline-variant/30 rounded-none py-3 px-4 text-xs font-semibold focus:outline-none focus:border-black dark:focus:border-white text-neutral-800 dark:text-zinc-100"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-wider">Zipcode</label>
                    <input
                      type="text"
                      value={zipcode}
                      onChange={(e) => setZipcode(e.target.value)}
                      className="w-full bg-neutral-55 dark:bg-zinc-900 border border-outline-variant/30 rounded-none py-3 px-4 text-xs font-semibold focus:outline-none focus:border-black dark:focus:border-white text-neutral-800 dark:text-zinc-100"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-wider">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-neutral-55 dark:bg-zinc-900 border border-outline-variant/30 rounded-none py-3 px-4 text-xs font-semibold focus:outline-none focus:border-black dark:focus:border-white text-neutral-800 dark:text-zinc-100"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Delivery option card */}
            <div className="bg-white dark:bg-[#121212] p-6 border border-outline-variant/30 flex flex-col gap-4 shadow-sm">
              <span className="text-[10px] font-black uppercase text-neutral-800 dark:text-zinc-200 tracking-wider">
                2. Select Delivery Speed
              </span>
              
              <div className="flex flex-col gap-3">
                {[
                  { id: 'standard', name: 'Standard Courier', desc: 'Secure transit with signature release (2-4 business days)', price: hasFreeShipping ? 'Complimentary' : '₹100' },
                  { id: 'express', name: 'Express Direct Dispatch', desc: 'Premium white-glove immediate shipping priority (Next Day)', price: '₹250' }
                ].map(method => (
                  <label
                    key={method.id}
                    onClick={() => setDeliveryMethod(method.id)}
                    className={`p-4 border cursor-pointer flex gap-3 items-start transition-all ${
                      deliveryMethod === method.id
                        ? 'border-black bg-neutral-55 dark:border-white dark:bg-zinc-900/50'
                        : 'border-outline-variant/40 bg-transparent hover:bg-neutral-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryMethod"
                      checked={deliveryMethod === method.id}
                      onChange={() => setDeliveryMethod(method.id)}
                      className="w-3.5 h-3.5 mt-0.5 accent-black cursor-pointer"
                    />
                    <div className="flex flex-col flex-grow text-left">
                      <span className="text-xs font-bold text-neutral-800 dark:text-zinc-200">{method.name}</span>
                      <span className="text-[10px] text-neutral-550 leading-normal">{method.desc}</span>
                    </div>
                    <span className="text-xs font-black text-neutral-800 dark:text-zinc-150">{method.price}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment options */}
            <div className="bg-white dark:bg-[#121212] p-6 border border-outline-variant/30 flex flex-col gap-4 shadow-sm">
              <span className="text-[10px] font-black uppercase text-neutral-800 dark:text-zinc-200 tracking-wider">
                3. Select Payment Gate
              </span>
              
              <div className="grid grid-cols-2 gap-3">
                {['UPI', 'Credit Card', 'Debit Card', 'Net Banking'].map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`p-3 border text-xs font-extrabold uppercase tracking-wider flex items-center justify-center transition-all ${
                      paymentMethod === method
                        ? 'border-black bg-neutral-55 dark:border-white dark:bg-zinc-900/50 text-neutral-900 dark:text-zinc-100 font-extrabold'
                        : 'border-outline-variant/40 bg-transparent text-neutral-500 hover:bg-neutral-50 dark:hover:bg-zinc-900'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Loyalty points rewards wallet usage */}
            <div className="bg-white dark:bg-[#121212] p-6 border border-outline-variant/30 flex flex-col gap-4 shadow-sm">
              <span className="text-[10px] font-black uppercase text-neutral-800 dark:text-zinc-200 tracking-wider flex items-center gap-1.5">
                <Gift size={12} className="text-[#b89626]" /> 4. Luxe Wallet Points Redemption
              </span>

              {user ? (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-neutral-500">
                    <span>Available points: <strong className="text-black dark:text-white">{user.walletPoints} pts</strong></span>
                    <span>Max allowed redeemable today: <strong className="text-black dark:text-white">{maxRedeemablePoints} pts</strong></span>
                  </div>

                  <div className="flex gap-3">
                    <input
                      type="number"
                      max={maxRedeemablePoints}
                      min={0}
                      value={pointsInput}
                      onChange={(e) => setPointsInput(Math.min(maxRedeemablePoints, Math.max(0, Number(e.target.value))))}
                      placeholder="Redeem points..."
                      className="bg-neutral-55 dark:bg-zinc-900 border border-outline-variant/30 rounded-none py-2.5 px-3.5 text-xs font-bold focus:outline-none focus:border-black dark:focus:border-white text-neutral-800 dark:text-zinc-100 flex-grow"
                    />
                    <button
                      type="button"
                      onClick={() => setPointsInput(maxRedeemablePoints)}
                      className="border border-black dark:border-zinc-700 hover:bg-black hover:text-white dark:hover:bg-zinc-100 dark:hover:text-black px-4 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                      MAX REDEEM
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-rose-500 font-semibold italic">Please sign in to redeem Luxe Wallet points.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPlacingOrder}
              className="w-full bg-[#141b2b] text-white hover:bg-black py-4 text-center text-xs font-extrabold uppercase tracking-widest transition-all shadow-md active:scale-[0.99] duration-300"
            >
              {isPlacingOrder ? 'COMPLETING ENCRYPTED SALE...' : `PLACE SECURE ORDER (₹${(cartTotal + (deliveryMethod === 'express' ? (hasFreeShipping ? 250 : 150) : 0) - pointsInput).toLocaleString()})`}
            </button>
          </form>

          {/* Right: Checkout Summaries (5 cols) */}
          <aside className="md:col-span-5 flex flex-col gap-6">
            
            {/* AI Cashback Optimizer box */}
            {user && <CheckoutOptimizer cartTotal={cartTotal} />}

            {/* Checkout Invoice Balance */}
            <div className="bg-white dark:bg-[#121212] p-6 border border-outline-variant/30 flex flex-col gap-6 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-800 dark:text-zinc-200 border-b border-outline-variant/20 pb-2">
                Order Review
              </h3>

              {/* Items list with thumbnails */}
              <div className="flex flex-col gap-4 max-h-60 overflow-y-auto pr-1">
                {items.map(item => (
                  <div key={item.product} className="flex gap-4 items-center justify-between text-xs">
                    <div className="flex gap-3 items-center truncate">
                      <div className="w-12 h-12 bg-neutral-50 overflow-hidden border border-outline-variant/20 flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-450 font-bold">Image</div>
                        )}
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="font-bold text-neutral-800 dark:text-zinc-200 truncate">{item.name}</span>
                        <span className="text-[10px] text-neutral-455">Qty: {item.qty}</span>
                      </div>
                    </div>
                    <span className="font-black text-neutral-850 dark:text-zinc-150">₹{(item.price * item.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2.5 border-t border-b border-outline-variant/20 py-4 text-xs font-semibold text-neutral-550 dark:text-zinc-400">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-bold text-neutral-800 dark:text-zinc-200">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Speed:</span>
                  <span className="font-bold text-neutral-800 dark:text-zinc-200">
                    {deliveryMethod === 'express' ? 'Express Dispatch' : 'Standard Courier'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Fee:</span>
                  <span className="font-bold text-neutral-800 dark:text-zinc-200">
                    {deliveryMethod === 'express' ? '₹250' : (hasFreeShipping ? 'Complimentary' : '₹100')}
                  </span>
                </div>
                {pointsInput > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>LuxePoints Wallet Discount:</span>
                    <span>-₹{pointsInput.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-sm font-black text-black dark:text-white uppercase tracking-wider">
                <span>Final amount due</span>
                <span>₹{(cartTotal + (deliveryMethod === 'express' ? (hasFreeShipping ? 250 : 150) : 0) - pointsInput).toLocaleString()}</span>
              </div>
            </div>

            {/* Secure Assurances */}
            <div className="flex flex-col gap-4 mt-2 px-1">
              <div className="flex items-center gap-3 text-neutral-600 dark:text-zinc-400">
                <ShieldCheck size={18} className="text-[#b89626]" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-wider">Encrypted Transactions</span>
                  <span className="text-[9px] font-semibold text-neutral-455 leading-tight">Every transaction uses premium cryptographic keys.</span>
                </div>
              </div>
            </div>

          </aside>
        </div>
      )}

      {/* Gamified Lucky Spin Modal Wheel */}
      <AnimatePresence>
        {showSpinWheel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-[#121212] p-8 border border-outline-variant/30 max-w-md w-full flex flex-col gap-6 shadow-2xl relative text-center text-slate-800 dark:text-zinc-100"
            >
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black tracking-widest text-[#b89626] uppercase flex items-center gap-1 justify-center animate-pulse">
                  <Sparkles size={12} /> Post-Purchase Lucky Spin
                </span>
                <h2 className="text-xl md:text-2xl font-extrabold font-serif">Spin the Lucky Wheel!</h2>
                <p className="text-xs text-neutral-500 font-semibold leading-relaxed">
                  Every LUXE transaction qualifies for a lucky spin wheel payout. Turn the wheel to earn dynamic bonus Luxe Points in your wallet!
                </p>
              </div>

              {/* Graphical Rotating Wheel */}
              <div className="relative w-48 h-48 mx-auto my-4 border-[6px] border-neutral-900 rounded-full flex items-center justify-center shadow-lg bg-neutral-50 overflow-hidden">
                {/* Pointer indicator */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#b89626] rounded-b-md z-20 shadow"></div>

                <motion.div
                  style={{ rotate: wheelDegree }}
                  transition={{ duration: 3, ease: 'easeOut' }}
                  className="w-full h-full rounded-full flex items-center justify-center relative bg-gradient-to-tr from-[#b89626] via-[#d4af37] to-[#fbf7ed]"
                >
                  {/* Visual segments */}
                  <div className="absolute w-full h-full flex items-center justify-center text-[11px] font-black text-slate-900">
                    <span className="absolute rotate-0 translate-y-[-60px]">50</span>
                    <span className="absolute rotate-72 translate-y-[-60px]">100</span>
                    <span className="absolute rotate-144 translate-y-[-60px]">200</span>
                    <span className="absolute rotate-216 translate-y-[-60px]">500</span>
                    <span className="absolute rotate-288 translate-y-[-60px]">1000</span>
                  </div>
                </motion.div>
                
                {/* Spin Trigger Center */}
                <button
                  onClick={handleSpinWheel}
                  disabled={spinning || spinResult}
                  className="absolute w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-black uppercase hover:scale-105 transition-transform z-10 border border-white/20 shadow-md"
                >
                  {spinning ? 'SPINNING' : 'SPIN'}
                </button>
              </div>

              {/* Spin result outputs */}
              <AnimatePresence>
                {spinResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-emerald-500/5 border border-emerald-500/20 flex flex-col gap-1 items-center"
                  >
                    <CheckCircle size={24} className="text-emerald-500 mb-1" />
                    <span className="text-xs font-extrabold text-[#b89626]">
                      You won {spinResult.pointsWon} Luxe Points!
                    </span>
                    <span className="text-[9px] text-neutral-550">
                      Points have been credited successfully to your wallet balance.
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {spinResult ? (
                <button
                  onClick={() => setShowSpinWheel(false)}
                  className="w-full bg-black text-white hover:bg-neutral-850 dark:bg-zinc-100 dark:text-black py-3 rounded-none text-xs font-black uppercase tracking-wider"
                >
                  CLOSE & RETRIEVE STATUS
                </button>
              ) : (
                <button
                  onClick={() => setShowSpinWheel(false)}
                  disabled={spinning}
                  className="text-xs text-neutral-500 hover:underline disabled:opacity-50"
                >
                  Skip Spin
                </button>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Checkout;
