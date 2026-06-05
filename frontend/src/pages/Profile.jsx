import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Wallet, Award, RefreshCw, Share2, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

const Profile = () => {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const location = useLocation();
  
  const [walletStats, setWalletStats] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [gamification, setGamification] = useState(null);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('loyalty'); // 'loyalty' | 'orders'
  const [loading, setLoading] = useState(true);

  // Sync tab selection from query param
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam === 'orders' || tabParam === 'loyalty') {
      setActiveTab(tabParam);
    }
  }, [location]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const walletRes = await axios.get('/api/wallet/stats');
      setWalletStats(walletRes.data);

      const ledgerRes = await axios.get('/api/wallet/ledger');
      setLedger(ledgerRes.data);

      const gamRes = await axios.get('/api/gamification/stats');
      setGamification(gamRes.data);

      // Fetch user's orders
      const ordersRes = await axios.get('/api/orders/my');
      setOrders(ordersRes.data);
    } catch (err) {
      console.error('Failed to load profile dashboard details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      const res = await axios.post('/api/seller/cancel', { orderId });
      
      // Update local orders list state
      setOrders(prev => prev.map(ord => 
        ord._id === orderId ? { ...ord, isCancelled: true, trackingState: 'Cancelled' } : ord
      ));
      
      alert(res.data.message || 'Order cancelled successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel order.');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfileData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16 glass rounded-3xl flex flex-col items-center gap-4 border border-slate-100 dark:border-zinc-800 max-w-xl mx-auto my-8 shadow-sm p-8 text-slate-800 dark:text-zinc-100">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center text-slate-400">
          <Award size={28} />
        </div>
        <div className="flex flex-col gap-1.5 mt-2">
          <h2 className="text-base font-extrabold text-slate-800 dark:text-zinc-200">Exclusive Luxe Loyalty Profile</h2>
          <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
            Please sign in or register today to unlock rewards points multipliers, streak achievements, milestone track sheets, and a dedicated user wallet balance.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse py-8">
        <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-slate-200 dark:bg-zinc-800 rounded-2xl"></div>
          <div className="h-32 bg-slate-200 dark:bg-zinc-800 rounded-2xl"></div>
          <div className="h-32 bg-slate-200 dark:bg-zinc-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // Determine membership colors for dynamic visual badges
  const getTierColor = (tier) => {
    if (tier === 'Platinum') return 'from-indigo-600 to-slate-800 text-white';
    if (tier === 'Gold') return 'from-yellow-500 to-amber-600 text-white';
    return 'from-slate-400 to-slate-600 text-white';
  };

  return (
    <div className="flex flex-col gap-8 pb-16">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-zinc-200">
          <Award size={18} className="text-gold-600 animate-pulse" /> Luxe Loyalty Dashboard
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('loyalty')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'loyalty' 
                ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 shadow-md' 
                : 'glass hover:bg-slate-105 dark:hover:bg-zinc-800 text-slate-500'
            }`}
          >
            Loyalty & Ledger
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'orders' 
                ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 shadow-md' 
                : 'glass hover:bg-slate-105 dark:hover:bg-zinc-800 text-slate-500'
            }`}
          >
            My Orders
          </button>
          <button 
            onClick={fetchProfileData} 
            className="glass hover:bg-slate-105 dark:hover:bg-zinc-800 text-slate-500 p-2.5 rounded-xl flex items-center justify-center" 
            title="Sync Stats"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {activeTab === 'loyalty' && (
        <>
          {/* Core loyalty metrics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet balance */}
        <div className="glass p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm relative overflow-hidden flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-450 uppercase">Current Points Wallet</span>
            <Wallet className="text-gold-500 w-5 h-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-3xl font-black text-slate-850 dark:text-zinc-150">
              {walletStats?.currentPoints || 0} <span className="text-xs text-slate-400 font-semibold">pts</span>
            </span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-450">
              Equivalent to ₹{walletStats?.pointsValueInInr || 0} savings discount
            </span>
          </div>
        </div>

        {/* Membership tier */}
        <div className={`p-5 rounded-2xl bg-gradient-to-br ${getTierColor(walletStats?.membershipTier)} shadow flex flex-col justify-between h-36 relative overflow-hidden group`}>
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-white to-transparent"></div>
          <div className="flex justify-between items-start z-10">
            <span className="text-[10px] font-bold uppercase opacity-80">Luxe Tiers Status</span>
            <Award className="w-5 h-5" />
          </div>
          
          <div className="flex flex-col gap-1 z-10">
            <span className="text-2xl font-black tracking-wide font-serif">
              {walletStats?.membershipTier} Member
            </span>
            <span className="text-[9px] font-bold tracking-wider uppercase opacity-90 flex items-center gap-1">
              <Sparkles size={9} /> 
              {walletStats?.membershipTier === 'Platinum' ? '8% Bonus Rewards + Priority support' : 
               walletStats?.membershipTier === 'Gold' ? '5% Bonus Rewards + Early sales access' : 
               '2% Bonus Rewards base multiplier'}
            </span>
          </div>
        </div>

        {/* Streaks & refer invites */}
        <div className="glass p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm relative overflow-hidden flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-450 uppercase">Active Shopping Streak</span>
            <span className="text-rose-500 text-lg">🔥</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-3xl font-black text-slate-850 dark:text-zinc-150">
              {gamification?.streakDays || 0} <span className="text-xs text-slate-400 font-semibold">Days</span>
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              Make another purchase within 48 hours to extend your bonus multipliers!
            </span>
          </div>
        </div>
      </section>

      {/* Main ledger list and invites */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: ledger ledger logs (7 cols) */}
        <main className="lg:col-span-7 flex flex-col gap-6">
          <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-widest">
            Rewards Points Transaction Ledger
          </h3>

          <div className="glass rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden shadow-sm">
            {ledger.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-6 text-center">No rewards points transactions logged yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-105 text-[10px] text-slate-450 uppercase font-black tracking-wider">
                      <th className="p-4">Date</th>
                      <th className="p-4">Description</th>
                      <th className="p-4 text-right">Points Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((tx) => (
                      <tr key={tx._id} className="border-b border-slate-105/50 dark:border-zinc-800/50 hover:bg-slate-50/50">
                        <td className="p-4 text-slate-450 text-[10px]">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-slate-700 dark:text-zinc-350">
                          {tx.description}
                        </td>
                        <td className={`p-4 text-right font-black text-xs ${
                          tx.amount > 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-500'
                        }`}>
                          {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        {/* Right: Milestones & Referral Invites (5 cols) */}
        <aside className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Milestones list */}
          <div className="glass p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 flex flex-col gap-4 shadow-sm">
            <span className="text-[10px] font-black uppercase text-slate-550 tracking-wider flex items-center gap-1">
              <TrendingUp size={12} className="text-gold-600" /> Reward Milestones
            </span>
            
            <div className="flex flex-col gap-3">
              {gamification?.milestones && gamification.milestones.map((milestone) => (
                <div key={milestone.id} className="flex gap-3 items-center bg-slate-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-slate-100/50 relative overflow-hidden">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm border ${
                    milestone.achieved 
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-600' 
                      : 'bg-slate-100 border-slate-200 text-slate-400'
                  }`}>
                    {milestone.achieved ? '✓' : milestone.id}
                  </div>

                  <div className="flex flex-col gap-0.5 truncate flex-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-250 flex items-center gap-1.5">
                      {milestone.title}
                      {milestone.achieved && (
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Earned</span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-500 leading-normal">{milestone.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Referral Card */}
          <div className="glass p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 flex flex-col gap-4 shadow-sm relative overflow-hidden bg-gradient-to-tr from-gold-50/10 to-transparent">
            <span className="text-[10px] font-black uppercase text-slate-550 tracking-wider flex items-center gap-1.5">
              <Share2 size={12} className="text-gold-600 animate-spin" /> Referral Program
            </span>
            
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-semibold">
              Invite friends to LUXE. When they register using your code, **they get 100 extra Luxe Points**, and **you get 200 Luxe Points** instantly!
            </p>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-450 uppercase">Your Invitation Code</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={gamification?.referralCode || 'DUMMYCODE'}
                  readOnly
                  className="bg-slate-100 dark:bg-zinc-900 border border-slate-200 rounded-xl py-2 px-3 text-xs font-black text-center text-slate-800 dark:text-zinc-150 flex-1 tracking-wider outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(gamification?.referralCode || 'DUMMYCODE');
                    alert('Referral invitation code copied to clipboard!');
                  }}
                  className="btn-solid py-2 px-4 rounded-xl text-[10px] font-black tracking-wider flex items-center gap-1 shadow-sm"
                >
                  COPY
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-t border-slate-100/50 dark:border-zinc-800 pt-3">
              <span>Total referred signups:</span>
              <span className="text-gold-600 font-extrabold">{gamification?.referralsCount || 0} friends invited</span>
            </div>
          </div>

          </aside>

        </div>
        </>
      )}

      {activeTab === 'orders' && (
        <div className="flex flex-col gap-6 animate-[fadeIn_0.2s_ease]">
          <h3 className="text-xs font-black text-slate-850 dark:text-zinc-250 uppercase tracking-widest">
            Your Orders History & Tracking
          </h3>

          <div className="flex flex-col gap-6">
            {orders.length === 0 ? (
              <div className="glass text-center py-12 rounded-3xl border border-slate-100 dark:border-zinc-800">
                <p className="text-xs text-slate-400 italic">No orders found. Start shopping to create your first order!</p>
              </div>
            ) : (
              orders.map((ord) => (
                <div key={ord._id} className="glass p-6 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm flex flex-col gap-4">
                  {/* Order Header info */}
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3 flex-wrap gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-450 uppercase">Order ID</span>
                      <span className="text-xs font-black text-slate-800 dark:text-zinc-200">{ord._id}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-450 uppercase">Placed On</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-350">{new Date(ord.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-450 uppercase">Total Amount</span>
                      <span className="text-xs font-black text-slate-850 dark:text-zinc-150">₹{ord.totalPrice}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-450 uppercase">Status</span>
                      <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider w-max ${
                        ord.isCancelled || ord.trackingState === 'Cancelled'
                          ? 'bg-rose-105/80 dark:bg-rose-950/20 text-rose-600 dark:text-rose-500 border border-rose-200 dark:border-rose-900/30'
                          : ord.trackingState === 'Delivered'
                          ? 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-900/30'
                          : 'bg-indigo-100 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-500 border border-indigo-200 dark:border-indigo-900/30'
                      }`}>
                        {ord.isCancelled || ord.trackingState === 'Cancelled' ? 'Cancelled' : ord.trackingState || 'Confirmed'}
                      </span>
                    </div>
                  </div>

                  {/* Order items */}
                  <div className="flex flex-col gap-3">
                    {ord.orderItems && ord.orderItems.map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-center justify-between flex-wrap">
                        <div className="flex gap-3 items-center">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover border border-slate-100 dark:border-zinc-800" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-900 flex items-center justify-center text-[8px] font-bold text-slate-450">LUXE</div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{item.name}</span>
                            <span className="text-[10px] text-slate-500 font-semibold">Qty: {item.qty} × ₹{item.price}</span>
                          </div>
                        </div>
                        <span className="text-xs font-black text-slate-800 dark:text-zinc-200">₹{item.price * item.qty}</span>
                      </div>
                    ))}
                  </div>

                  {/* Cancel option for active user orders */}
                  {!(ord.isCancelled || ord.trackingState === 'Cancelled' || ord.trackingState === 'Delivered') && (
                    <div className="flex justify-end border-t border-slate-100 dark:border-zinc-800 pt-3">
                      <button
                        onClick={() => handleCancelOrder(ord._id)}
                        className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all shadow-sm active:translate-y-[1px]"
                        title="Request Order Cancellation"
                      >
                        Cancel Order
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
