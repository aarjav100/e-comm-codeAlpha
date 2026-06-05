import React, { useState, useEffect, useRef, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// Slices
import { setUser, logout } from './store/authSlice';
import { toggleWishlistItem, removeFromWishlist, clearWishlist } from './store/wishlistSlice';
import { addToCart, updateCartQty, removeFromCart, clearCart, changeCurrency } from './store/cartSlice';

// Lazy-Loaded Page Components for Code-Splitting Optimization
const Home = React.lazy(() => import('./pages/Home'));
const Highlights = React.lazy(() => import('./pages/Highlights'));
const Cart = React.lazy(() => import('./pages/Cart'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Admin = React.lazy(() => import('./pages/Admin'));
const ProductDetails = React.lazy(() => import('./pages/ProductDetails'));
const Shop = React.lazy(() => import('./pages/Shop'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// Premium Fallback Loading Component
const SuspenseLoading = () => (
  <div className="flex flex-col items-center justify-center min-h-[45vh] gap-3">
    <div className="w-10 h-10 rounded-full border-[3px] border-slate-200 dark:border-zinc-800 border-t-[#C9A84C] animate-spin"></div>
    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#C9A84C] animate-pulse">✦ Loading LUXE Modules...</span>
  </div>
);

// Shared Layout Component
const AppLayout = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const { items, subtotal, hasFreeShipping, remainingToFreeShipping, currency } = useSelector(state => state.cart);
  const wishlistItems = useSelector(state => state.wishlist?.items || []);

  const formatPrice = (priceInINR) => {
    if (currency === 'USD') {
      return '$' + (priceInINR / 85).toFixed(0);
    }
    if (currency === 'EUR') {
      return '€' + (priceInINR / 92).toFixed(0);
    }
    return '₹' + priceInINR.toLocaleString();
  };

  const [theme, setTheme] = useState(() => localStorage.getItem('luxe_theme') || 'light');
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showWishlistDrawer, setShowWishlistDrawer] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Add-to-cart Pop-up Modal state
  const [addedCartItem, setAddedCartItem] = useState(null);
  const prevItemsRef = useRef(items);
  const previousCartQty = useRef(items.reduce((s, i) => s + i.qty, 0));

  // Sync added to cart pop-up modal dynamically
  useEffect(() => {
    const currentQty = items.reduce((s, i) => s + i.qty, 0);
    if (currentQty > previousCartQty.current) {
      // Find the item that was added or incremented
      let addedItem = null;
      for (const item of items) {
        const prev = prevItemsRef.current.find(i => i.product === item.product);
        if (!prev || item.qty > prev.qty) {
          addedItem = {
            ...item,
            addedQty: prev ? (item.qty - prev.qty) : item.qty
          };
          break;
        }
      }
      if (addedItem) {
        setAddedCartItem(addedItem);
      }
    }
    previousCartQty.current = currentQty;
    prevItemsRef.current = items;
  }, [items]);
  
  // Auth Form Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // Dropdowns & Toggles
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Welcome to LUXE!', message: 'Registration bonus +100 Luxe Points successfully added to your wallet!', type: 'reward', read: false, date: 'Just now' },
    { id: 2, title: 'Daily Login Reward', message: 'Streaks tracking initialized. Return daily to claim +10 bonus points!', type: 'info', read: false, date: '1 hour ago' },
    { id: 3, title: 'Flash Spec Comparison', message: 'Select laptops or footwear models in catalog grid to synthesize dynamic spec comparisons.', type: 'info', read: true, date: '2 hours ago' }
  ]);

  // Synchronize layout theme
  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.setAttribute('data-theme', 'dark');
      html.classList.add('dark');
    } else {
      html.setAttribute('data-theme', 'light');
      html.classList.remove('dark');
    }
    localStorage.setItem('luxe_theme', theme);
  }, [theme]);

  // Sync session on mount & automatically hide vanilla container
  useEffect(() => {
    const hideVanillaAndCheckSession = async () => {
      // Hide the vanilla app fallback container smoothly
      const vanillaContainer = document.getElementById('vanilla-app-container');
      if (vanillaContainer) {
        vanillaContainer.style.display = 'none';
      }

      try {
        const res = await axios.get('/api/auth/me');
        if (res.data && res.data.user) {
          dispatch(setUser(res.data.user));
          // If the user has custom badges or streaks, add a custom real-time notification
          if (res.data.user.streakDays > 0) {
            setNotifications(prev => [
              { id: Date.now(), title: '🔥 Active Login Streak!', message: `You are on a ${res.data.user.streakDays}-day streak! Keep returning to protect your rewards.`, type: 'reward', read: false, date: 'Just now' },
              ...prev
            ]);
          }
        }
      } catch (err) {
        // Run under guest session silently
        dispatch(setUser(null));
      }
    };
    hideVanillaAndCheckSession();
  }, [dispatch]);

  // Theme Swapper
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Auth Operations
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = authMode === 'login' ? { email, password } : { name, email, password, referralCode };
      
      const res = await axios.post(url, payload);
      dispatch(setUser(res.data.user));
      if (authMode === 'register') {
        dispatch(clearCart());
        dispatch(clearWishlist());
      }
      setShowAuth(false);
      resetAuthFields();
      
      // Add custom visual alert
      const welcomeTitle = authMode === 'login' ? 'Secure Login Successful' : 'Loyalty Account Initialized';
      const welcomeMsg = authMode === 'login' 
        ? `Welcome back, ${res.data.user.name.split(' ')[0]}! Wallet synced.` 
        : 'Welcome to the LUXE VIP Club. Points activated!';
        
      setNotifications(prev => [
        { id: Date.now(), title: welcomeTitle, message: welcomeMsg, type: 'reward', read: false, date: 'Just now' },
        ...prev
      ]);
    } catch (err) {
      alert(err.response?.data?.error || 'Authentication verification failed.');
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    alert(`A secure password reset link has been dispatched to ${email}. Check your inbox.`);
    setAuthMode('login');
    resetAuthFields();
  };

  const handleGoogleSandboxAuth = async () => {
    try {
      const mockGooglePayload = {
        email: 'google_' + Math.random().toString(36).substr(2, 5) + '@luxe.com',
        name: 'Sandbox Google VIP Client',
        sub: 'mock_google_id_' + Math.random().toString(36).substr(2, 9)
      };
      const res = await axios.post('/api/auth/google', mockGooglePayload);
      dispatch(setUser(res.data.user));
      setShowAuth(false);
      resetAuthFields();
      setNotifications(prev => [
        { id: Date.now(), title: 'Google VIP Sandbox Active', message: 'Authorized using emulated security keys.', type: 'reward', read: false, date: 'Just now' },
        ...prev
      ]);
    } catch (err) {
      alert('Google single-sign-on simulator failed.');
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      dispatch(logout());
      dispatch(clearCart());
      dispatch(clearWishlist());
      setNotifications(prev => [
        { id: Date.now(), title: 'Session Cleared', message: 'Logged out successfully from secure portal.', type: 'info', read: false, date: 'Just now' },
        ...prev
      ]);
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  const resetAuthFields = () => {
    setEmail('');
    setPassword('');
    setName('');
    setReferralCode('');
  };

  // Notification Mark as Read
  const handleMarkNotificationRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // Cart Badge Item Counts
  const cartItemsCount = items.reduce((sum, item) => sum + item.qty, 0);
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  const queryParams = new URLSearchParams(location.search);
  const activeCategory = queryParams.get('category');

  const getLinkClass = (catName) => {
    const isActive = location.pathname === '/shop' && activeCategory === catName;
    return `hover:text-black dark:hover:text-white transition-colors pb-1 ${
      isActive 
        ? 'text-black dark:text-white font-extrabold border-b-2 border-[#C9A84C]' 
        : 'text-on-surface-variant/80 dark:text-zinc-400'
    }`;
  };

  const getBackgroundStyle = () => {
    if (theme === 'dark') return {};
    if (location.pathname === '/cart') {
      return {
        backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBaSM_G0r0GfpuihMGcKVcBHVLJv2edKJdCfOXQcsF_DT-GczfpbxLtiEshrruZtuo76egod_d2j0WopUqQQGcsia3HhGlX7EJNPD9LyAjy4ztz7r75kS6vnYnPVuZzV-m1TPuf44J_cJwmy4XA48OMxdOpmUn8uLjcL3P6qwoF892dOehU4Y_zOnev3XCfICDGhoLS598_xwwxjdhuuF31J_9o5uOA5FBXoVDhFOxF4Y3yPE6cO0FiR8oCImAc-hq_5SwQsNnxHEM")',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center center'
      };
    } else if (location.pathname === '/checkout') {
      return {
        backgroundImage: 'linear-gradient(rgba(252, 248, 250, 0.9), rgba(252, 248, 250, 0.9)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuDDl6P-YvVRUdRlnUxXH_6vKoX50gSibsA9k76lfs3pRFqJSFARg7ux_z3EkbaPPzxKU_Gh0ErLbvloF8l3cNS4KWDIyIXxoTxh6_NBR_2ef5dlEIMqk-CYXU7JyXo_w8kU-paMZBD7v4Rry1F5VHi4T6fJiYRcAvuLIpn6n4y3F4tAJQ5Jzk9HcIBwCUQt8_Z_cVMuu36qV7Nln0b8OGf2uR2xmVq9ti8tVk2Z4EtS4HQEE8CcTCKncx7EhGKKmiGrr89YIIO0CNQ")',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center center'
      };
    } else {
      return {
        backgroundImage: 'linear-gradient(rgba(252, 248, 250, 0.7), rgba(252, 248, 250, 0.7)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuCoesPx5nvv2bEH_Ee29jmpPp5DQbr0nO78G27RtaAzd-zpUKdAGvh89wwDJ-X9fbyNMS0E0ewQ0R5OPeUEpugy9DW98I8ce2WsqzdLiJCfPC8VWe6oNovJiSzHNIGdHc2UQBoJhBGR44YpEUSyeBv3Cl4joeSqsoxCa173UkMGzLKRBgJQlIntsfjb3V4ZFrk3gzwANXaHpMKbSZmiZpPuW-NJHJvsms8REm1_hAfzaj_iRAMtHGeQqHdin6u5_OzJIcfNjA6MgW0")',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center center'
      };
    }
  };

  return (
    <div 
      style={getBackgroundStyle()}
      className={`min-h-screen flex flex-col font-sans transition-all duration-300 ${
        theme === 'dark' ? 'bg-[#0a0a0a] text-zinc-100' : 'bg-surface text-on-surface'
      }`}
    >
      {/* ─────────────────────────────────────────────────────────────
           NAVBAR Layout (Quiet Luxury Glassmorphic Header)
         ───────────────────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-40 px-6 md:px-16 py-4 flex items-center justify-between backdrop-blur-xl border-b transition-all duration-300 ${
        theme === 'dark' ? 'bg-[#0a0a0a]/80 border-zinc-800' : 'bg-white/80 border-outline-variant/30 shadow-sm'
      }`}>
        <div className="flex items-center gap-4 md:gap-16">
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="block md:hidden text-slate-800 dark:text-zinc-200 focus:outline-none"
            title="Toggle Menu"
          >
            <i className="fa-solid fa-bars text-lg"></i>
          </button>

          {/* Logo Brand */}
          <Link to="/" className="text-2xl font-black font-serif tracking-widest hover:opacity-80 transition-opacity text-black dark:text-white uppercase">
            LUXE
          </Link>

          {/* Navigation Links (Categories Filters) */}
          <nav className="hidden md:flex items-center gap-6 text-[10px] font-bold uppercase tracking-[0.2em]">
            <Link to="/shop" className={`hover:text-black dark:hover:text-white transition-colors pb-1 ${
              location.pathname === '/shop' && !activeCategory ? 'text-black dark:text-white font-extrabold border-b-2 border-[#C9A84C]' : 'text-on-surface-variant/80 dark:text-zinc-400'
            }`}>
              Shop
            </Link>
            <Link to="/shop?category=Electronics" className={getLinkClass('Electronics')}>
              Mechanicals
            </Link>
            <Link to="/shop?category=Fashion" className={getLinkClass('Fashion')}>
              Fashion
            </Link>
            <Link to="/shop?category=Home%20%26%20Living" className={getLinkClass('Home & Living')}>
              Home
            </Link>
            <Link to="/shop?category=Beauty" className={getLinkClass('Beauty')}>
              Beauty
            </Link>
            <Link to="/shop?category=Sports" className={getLinkClass('Sports')}>
              Travel
            </Link>
            <Link to="/highlights" className={`hover:text-black dark:hover:text-white transition-colors pb-1 ${
              location.pathname === '/highlights' ? 'text-black dark:text-white font-extrabold border-b-2 border-[#C9A84C]' : 'text-on-surface-variant/80 dark:text-zinc-400'
            }`}>
              Highlights
            </Link>
          </nav>
        </div>

        {/* Right Nav Options */}
        <div className="flex items-center gap-2 sm:gap-6">
          
          {/* Theme Switcher */}
          <button 
            onClick={toggleTheme} 
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
              theme === 'dark' ? 'border-zinc-800 hover:bg-zinc-900 text-gold-500' : 'border-outline-variant/50 hover:bg-neutral-50 text-neutral-500'
            }`}
            title="Toggle theme"
          >
            {theme === 'dark' ? <i className="fa-solid fa-sun text-sm"></i> : <i className="fa-solid fa-moon text-sm"></i>}
          </button>

          {/* Notifications Bell Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all relative ${
                theme === 'dark' ? 'border-zinc-800 hover:bg-zinc-900 text-zinc-300' : 'border-outline-variant/50 hover:bg-neutral-50 text-neutral-600'
              }`}
              title="Real-Time Alerts"
            >
              <i className="fa-solid fa-bell text-sm"></i>
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-rose-500 w-4 h-4 rounded-full text-[8px] font-black text-white flex items-center justify-center animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Drawer */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className={`absolute right-0 mt-3 w-80 rounded-2xl shadow-2xl border p-4 flex flex-col gap-3.5 z-50 ${
                    theme === 'dark' ? 'bg-[#121212] border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center border-b pb-2 border-slate-100 dark:border-zinc-800">
                    <span className="text-[10px] font-black tracking-wider uppercase text-slate-500 dark:text-zinc-400">LOYALTY ALERTS LEDGER</span>
                    {unreadNotificationsCount > 0 && (
                      <button 
                        onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))} 
                        className="text-[9px] font-black text-[#C9A84C] hover:underline uppercase"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-2.5 max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => handleMarkNotificationRead(n.id)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer relative ${
                          n.read 
                            ? 'bg-transparent border-transparent opacity-60' 
                            : theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/60' : 'bg-slate-50 border-slate-150 hover:bg-slate-100/50'
                        }`}
                      >
                        {!n.read && <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-[#C9A84C]"></span>}
                        <h5 className="text-xs font-bold flex items-center gap-1.5 text-slate-800 dark:text-zinc-200 pr-4">
                          {n.type === 'reward' ? '✦' : '⚡'} {n.title}
                        </h5>
                        <p className="text-[10px] text-slate-500 leading-normal mt-0.5">{n.message}</p>
                        <span className="text-[8px] text-slate-400 font-medium block mt-1">{n.date}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Wishlist Button */}
          <button 
            onClick={() => setShowWishlistDrawer(true)} 
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all relative ${
              theme === 'dark' ? 'border-zinc-800 hover:bg-zinc-900 text-zinc-300' : 'border-outline-variant/50 hover:bg-neutral-50 text-neutral-600'
            }`}
            title="Wishlist Selection"
          >
            <i className="fa-solid fa-heart text-sm"></i>
            {wishlistItems.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#C9A84C] text-white w-4 h-4 rounded-full text-[8px] font-black flex items-center justify-center">
                {wishlistItems.length}
              </span>
            )}
          </button>

          {/* Shopping Bag Button */}
          <button 
            onClick={() => setShowCartDrawer(true)} 
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all relative ${
              theme === 'dark' ? 'border-zinc-800 hover:bg-zinc-900 text-zinc-300' : 'border-outline-variant/50 hover:bg-neutral-50 text-neutral-600'
            }`}
            title="Shopping Bag"
          >
            <i className="fa-solid fa-shopping-bag text-sm"></i>
            {cartItemsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-black dark:bg-white text-white dark:text-black w-4 h-4 rounded-full text-[8px] font-black flex items-center justify-center">
                {cartItemsCount}
              </span>
            )}
          </button>

          {/* Account Member Profile Badge */}
          {isAuthenticated ? (
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-9 h-9 rounded-full bg-black dark:bg-white hover:brightness-105 transition-all text-white dark:text-black flex items-center justify-center text-xs font-black shadow-md uppercase"
              >
                {user?.name ? user.name[0] : 'U'}
              </button>
              
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className={`absolute right-0 mt-3 w-48 rounded-2xl shadow-2xl border p-4 flex flex-col gap-2.5 z-50 ${
                      theme === 'dark' ? 'bg-[#121212] border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="border-b pb-1.5 border-slate-100 dark:border-zinc-800">
                      <span className="text-[10px] font-black tracking-wider uppercase text-[#C9A84C]">Member Profile</span>
                      <p className="text-[11px] font-bold truncate mt-0.5">{user.name}</p>
                    </div>
                    <Link 
                      to="/profile?tab=loyalty" 
                      onClick={() => setShowProfileMenu(false)}
                      className="text-[11px] font-semibold hover:text-[#C9A84C] text-left transition-colors"
                    >
                      My Account
                    </Link>
                    <Link 
                      to="/profile?tab=orders" 
                      onClick={() => setShowProfileMenu(false)}
                      className="text-[11px] font-semibold hover:text-[#C9A84C] text-left transition-colors"
                    >
                      Orders
                    </Link>
                    <button 
                      onClick={() => { setShowProfileMenu(false); setShowWishlistDrawer(true); }}
                      className="text-[11px] font-semibold hover:text-[#C9A84C] text-left transition-colors"
                    >
                      Wishlist ({wishlistItems.length})
                    </button>
                    <button 
                      onClick={() => { setShowProfileMenu(false); setShowSettingsModal(true); }}
                      className="text-[11px] font-semibold hover:text-[#C9A84C] text-left transition-colors"
                    >
                      Settings
                    </button>
                    <button 
                      onClick={() => { setShowProfileMenu(false); handleLogout(); }}
                      className="text-[11px] font-semibold text-rose-500 hover:underline text-left"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button 
              onClick={() => { setAuthMode('login'); setShowAuth(true); }}
              className="bg-black dark:bg-zinc-100 hover:bg-neutral-900 dark:hover:bg-zinc-200 text-white dark:text-black rounded-none text-[10px] font-bold uppercase tracking-[0.2em] py-2 px-5 hover:translate-y-[-1px] transition-all shadow-sm"
            >
              Sign In
            </button>
          )}

        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
           AUTHENTICATION INTEGRATION MODAL OVERLAY
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAuth && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.93, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.93, y: 15 }}
              className={`p-6 rounded-3xl max-w-sm w-full border shadow-2xl relative flex flex-col gap-5 ${
                theme === 'dark' ? 'bg-[#111111] border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
               <div className="flex flex-col gap-1">
                <h3 className="text-lg font-black font-serif">
                  {authMode === 'login' ? 'Secure Account Login' : authMode === 'register' ? 'Join LUXE Program' : 'Reset Wallet Password'}
                </h3>
                <p className="text-[10px] text-slate-500 font-bold leading-normal">
                  {authMode === 'login' 
                    ? 'Sign in to access Luxe Wallet points, streaks milestones, and AI budget optimizers.' 
                    : authMode === 'register'
                    ? 'Register today to unlock 100 bonus Luxe Points in your user wallet.'
                    : 'Enter your registered email below to receive a secure credentials reset token.'}
                </p>
               </div>

               {authMode === 'forgot' ? (
                 <form onSubmit={handleForgotSubmit} className="flex flex-col gap-3">
                   <input 
                     type="email" 
                     placeholder="Email Address" 
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     required
                     className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-[#C9A84C] text-slate-800 dark:text-zinc-100" 
                   />
                   <button 
                     type="submit" 
                     className="w-full bg-black dark:bg-zinc-100 text-white dark:text-black py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider hover:bg-[#C9A84C] hover:text-black transition-colors mt-1 shadow-md"
                   >
                     SEND SECURE RESET LINK
                   </button>
                 </form>
               ) : (
                 <form onSubmit={handleAuthSubmit} className="flex flex-col gap-3">
                   {authMode === 'register' && (
                     <input 
                       type="text" 
                       placeholder="Full Name" 
                       value={name}
                       onChange={(e) => setName(e.target.value)}
                       required
                       className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-[#C9A84C] text-slate-800 dark:text-zinc-100" 
                     />
                   )}
                   <input 
                     type="email" 
                     placeholder="Email Address" 
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     required
                     className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-[#C9A84C] text-slate-800 dark:text-zinc-100" 
                   />
                   <input 
                     type="password" 
                     placeholder="Password" 
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     required
                     className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-[#C9A84C] text-slate-800 dark:text-zinc-100" 
                   />
                   {authMode === 'register' && (
                     <input 
                       type="text" 
                       placeholder="Referral Code (Optional)" 
                       value={referralCode}
                       onChange={(e) => setReferralCode(e.target.value)}
                       className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-[#C9A84C] text-slate-800 dark:text-zinc-100" 
                     />
                   )}
                   {authMode === 'login' && (
                     <button 
                       type="button"
                       onClick={() => setAuthMode('forgot')}
                       className="text-[10px] text-neutral-450 hover:text-black dark:hover:text-white text-right font-semibold -mt-1 hover:underline"
                     >
                       Forgot Password?
                     </button>
                   )}

                   <button 
                     type="submit" 
                     className="w-full bg-black dark:bg-zinc-100 text-white dark:text-black py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider hover:bg-[#C9A84C] hover:text-black transition-colors mt-1 shadow-md"
                   >
                     {authMode === 'login' ? 'ENTER SECURE PORTAL' : 'INITIALIZE MEMBERSHIP'}
                   </button>
                 </form>
               )}

               {/* Emulated sandbox Google sign-in */}
               <div className="flex flex-col gap-3.5 border-t border-slate-100 dark:border-zinc-800 pt-4">
                 {authMode !== 'forgot' && (
                   <button 
                     onClick={handleGoogleSandboxAuth} 
                     className="w-full bg-slate-50 dark:bg-zinc-900/50 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 border border-slate-200 dark:border-zinc-800 transition-colors"
                   >
                     <i className="fa-brands fa-google text-rose-500"></i> Continue with Google (Sandbox)
                   </button>
                 )}

                 <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider">
                   <button 
                     onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} 
                     className="hover:underline text-[#C9A84C]"
                   >
                     {authMode === 'login' ? 'New User? Join' : 'Existing User? Sign In'}
                   </button>
                   <button 
                     onClick={() => { setShowAuth(false); resetAuthFields(); }} 
                     className="hover:underline text-slate-400"
                   >
                     Cancel
                   </button>
                 </div>
               </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
           MOBILE MENU DRAWER OVERLAY
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showMobileMenu && (
          <div className="fixed inset-0 z-50 overflow-hidden md:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs" 
            />
            
            <div className="absolute inset-y-0 left-0 max-w-full flex pr-10">
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`w-screen max-w-xs border-r flex flex-col shadow-2xl relative ${
                  theme === 'dark' ? 'bg-[#111111] border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex-1 h-full flex flex-col p-6 overflow-y-auto">
                  <div className="flex items-start justify-between border-b pb-4 border-slate-100 dark:border-zinc-800">
                    <h2 className="text-sm font-black font-serif uppercase tracking-widest text-[#C9A84C]">LUXE NAVIGATOR</h2>
                    <button 
                      onClick={() => setShowMobileMenu(false)}
                      className="text-slate-400 hover:text-black dark:hover:text-white"
                    >
                      <i className="fa-solid fa-times text-lg"></i>
                    </button>
                  </div>

                  <nav className="flex flex-col gap-6 mt-8 text-xs font-bold uppercase tracking-[0.2em]">
                    <Link 
                      to="/shop" 
                      onClick={() => setShowMobileMenu(false)}
                      className={`hover:text-[#C9A84C] transition-colors pb-1 border-b border-transparent ${
                        location.pathname === '/shop' && !activeCategory ? 'text-[#C9A84C] font-extrabold' : ''
                      }`}
                    >
                      Shop All
                    </Link>
                    <Link 
                      to="/shop?category=Electronics" 
                      onClick={() => setShowMobileMenu(false)}
                      className={`hover:text-[#C9A84C] transition-colors pb-1 border-b border-transparent ${
                        location.pathname === '/shop' && activeCategory === 'Electronics' ? 'text-[#C9A84C] font-extrabold' : ''
                      }`}
                    >
                      Mechanicals
                    </Link>
                    <Link 
                      to="/shop?category=Fashion" 
                      onClick={() => setShowMobileMenu(false)}
                      className={`hover:text-[#C9A84C] transition-colors pb-1 border-b border-transparent ${
                        location.pathname === '/shop' && activeCategory === 'Fashion' ? 'text-[#C9A84C] font-extrabold' : ''
                      }`}
                    >
                      Fashion
                    </Link>
                    <Link 
                      to="/shop?category=Home%20%26%20Living" 
                      onClick={() => setShowMobileMenu(false)}
                      className={`hover:text-[#C9A84C] transition-colors pb-1 border-b border-transparent ${
                        location.pathname === '/shop' && activeCategory === 'Home & Living' ? 'text-[#C9A84C] font-extrabold' : ''
                      }`}
                    >
                      Home
                    </Link>
                    <Link 
                      to="/shop?category=Beauty" 
                      onClick={() => setShowMobileMenu(false)}
                      className={`hover:text-[#C9A84C] transition-colors pb-1 border-b border-transparent ${
                        location.pathname === '/shop' && activeCategory === 'Beauty' ? 'text-[#C9A84C] font-extrabold' : ''
                      }`}
                    >
                      Beauty
                    </Link>
                    <Link 
                      to="/shop?category=Sports" 
                      onClick={() => setShowMobileMenu(false)}
                      className={`hover:text-[#C9A84C] transition-colors pb-1 border-b border-transparent ${
                        location.pathname === '/shop' && activeCategory === 'Sports' ? 'text-[#C9A84C] font-extrabold' : ''
                      }`}
                    >
                      Travel
                    </Link>
                    <Link 
                      to="/highlights" 
                      onClick={() => setShowMobileMenu(false)}
                      className={`hover:text-[#C9A84C] transition-colors pb-1 border-b border-transparent ${
                        location.pathname === '/highlights' ? 'text-[#C9A84C] font-extrabold' : ''
                      }`}
                    >
                      Highlights
                    </Link>
                  </nav>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
           PAGE CONTENT CONTAINER ROUTER BOUNDARIES
         ───────────────────────────────────────────────────────────── */}
      <main className="flex-grow max-w-7xl mx-auto px-6 md:px-12 py-8 w-full">
        {children}
      </main>

      {/* ─────────────────────────────────────────────────────────────
           CART DRAWER OVERLAY
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCartDrawer && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCartDrawer(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs" 
            />
            
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`w-screen max-w-md border-l flex flex-col justify-between shadow-2xl relative ${
                  theme === 'dark' ? 'bg-[#111111] border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex-1 h-full flex flex-col p-6 overflow-y-auto">
                  <div className="flex items-start justify-between border-b pb-4 border-slate-100 dark:border-zinc-800">
                    <h2 className="text-sm font-black font-serif uppercase tracking-widest text-[#C9A84C]">YOUR BAG</h2>
                    <button 
                      onClick={() => setShowCartDrawer(false)}
                      className="text-slate-400 hover:text-black dark:hover:text-white"
                    >
                      <i className="fa-solid fa-times text-lg"></i>
                    </button>
                  </div>

                  {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3">
                      <i className="fa-solid fa-shopping-bag text-3xl text-slate-300"></i>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Selection Bag is Empty</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 mt-6">
                      {items.map((item) => (
                        <div key={item.product} className="flex gap-4 items-center justify-between border-b pb-4 border-slate-100/50 dark:border-zinc-800/50">
                          <div className="w-14 h-14 bg-slate-50 dark:bg-zinc-900 border border-slate-250/20 rounded-xl overflow-hidden flex-shrink-0">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400">Image</div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold truncate text-slate-800 dark:text-zinc-200">{item.name}</h4>
                            <span className="text-[10px] text-[#C9A84C] font-black">{formatPrice(item.price)} each</span>
                          </div>

                          <div className="flex items-center gap-2 border border-slate-200/80 dark:border-zinc-805 rounded px-1.5 py-0.5">
                            <button 
                              onClick={() => dispatch(updateCartQty({ product: item.product, qty: item.qty - 1 }))}
                              className="text-slate-400 hover:text-black dark:hover:text-white text-xs px-1"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                            <button 
                              onClick={() => dispatch(updateCartQty({ product: item.product, qty: item.qty + 1 }))}
                              className="text-slate-400 hover:text-black dark:hover:text-white text-xs px-1"
                            >
                              +
                            </button>
                          </div>

                          <button 
                            onClick={() => dispatch(removeFromCart(item.product))}
                            className="text-slate-450 hover:text-rose-500 text-xs px-1.5"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {items.length > 0 && (
                  <div className="border-t border-slate-150 dark:border-zinc-800 p-6 flex flex-col gap-4 bg-slate-50/55 dark:bg-zinc-950/20">
                    <div className="flex flex-col gap-2 text-xs font-semibold text-slate-550 dark:text-zinc-400">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="text-black dark:text-white font-extrabold">{formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST Tax (18%)</span>
                        <span className="text-black dark:text-white font-extrabold">{formatPrice(subtotal * 0.18)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery</span>
                        <span className="text-black dark:text-white font-extrabold">
                          {hasFreeShipping ? 'Complimentary' : formatPrice(100)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm font-black border-t pt-3 border-slate-200 dark:border-zinc-800 uppercase tracking-widest text-black dark:text-white">
                      <span>Grand Total</span>
                      <span>{formatPrice(subtotal + (subtotal * 0.18) + (hasFreeShipping ? 0 : 100))}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <button 
                        onClick={() => dispatch(clearCart())}
                        className="w-full border border-slate-250 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-colors"
                      >
                        EMPTY BAG
                      </button>
                      
                      <Link 
                        to="/checkout"
                        onClick={() => setShowCartDrawer(false)}
                        className="w-full bg-[#141b2b] dark:bg-white text-white dark:text-black text-center py-3.5 text-xs font-black uppercase tracking-widest hover:bg-[#C9A84C] dark:hover:bg-[#C9A84C] hover:text-black dark:hover:text-black transition-colors"
                      >
                        CHECKOUT
                      </Link>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
           WISHLIST DRAWER OVERLAY
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showWishlistDrawer && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWishlistDrawer(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs" 
            />
            
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`w-screen max-w-md border-l flex flex-col justify-between shadow-2xl relative ${
                  theme === 'dark' ? 'bg-[#111111] border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex-1 h-full flex flex-col p-6 overflow-y-auto">
                  <div className="flex items-start justify-between border-b pb-4 border-slate-100 dark:border-zinc-800">
                    <h2 className="text-sm font-black font-serif uppercase tracking-widest text-[#C9A84C]">YOUR FAVORITES</h2>
                    <button 
                      onClick={() => setShowWishlistDrawer(false)}
                      className="text-slate-400 hover:text-black dark:hover:text-white"
                    >
                      <i className="fa-solid fa-times text-lg"></i>
                    </button>
                  </div>

                  {wishlistItems.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3">
                      <i className="fa-solid fa-heart text-3xl text-slate-300"></i>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No favorites saved.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 mt-6">
                      {wishlistItems.map((item) => (
                        <div key={item._id || item.id} className="flex gap-4 items-center justify-between border-b pb-4 border-slate-100/50 dark:border-zinc-800/50">
                          <div className="w-14 h-14 bg-slate-50 dark:bg-zinc-900 border border-slate-250/20 rounded-xl overflow-hidden flex-shrink-0">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400">Image</div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold truncate text-slate-800 dark:text-zinc-200">{item.name}</h4>
                            <span className="text-[10px] text-[#C9A84C] font-black">{formatPrice(item.price)}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                dispatch(addToCart({
                                  product: item._id || item.id,
                                  name: item.name,
                                  price: item.price,
                                  image: item.image,
                                  qty: 1
                                }));
                                dispatch(removeFromWishlist(item._id || item.id));
                              }}
                              className="bg-black dark:bg-white text-white dark:text-black px-2.5 py-1.5 text-[8px] font-black uppercase tracking-widest hover:bg-[#C9A84C] dark:hover:bg-[#C9A84C] hover:text-black dark:hover:text-black transition-colors"
                              title="Move to bag"
                            >
                              MOVE TO BAG
                            </button>
                            
                            <button 
                              onClick={() => dispatch(removeFromWishlist(item._id || item.id))}
                              className="text-slate-400 hover:text-rose-500 text-xs px-2 py-1.5 border border-slate-200 dark:border-zinc-800 hover:border-rose-500 rounded"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
           SETTINGS MODAL OVERLAY
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.93, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.93, y: 15 }}
              className={`p-6 rounded-3xl max-w-sm w-full border shadow-2xl relative flex flex-col gap-5 ${
                theme === 'dark' ? 'bg-[#111111] border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-zinc-800">
                <h3 className="text-sm font-black font-serif uppercase tracking-widest text-[#C9A84C]">LUXE SYSTEM CONFIG</h3>
                <button 
                  onClick={() => setShowSettingsModal(false)}
                  className="text-slate-400 hover:text-black dark:hover:text-white"
                >
                  <i className="fa-solid fa-times text-md"></i>
                </button>
              </div>

              {/* Currency Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Preferred Currency</label>
                <select 
                  value={currency} 
                  onChange={(e) => {
                    dispatch(changeCurrency(e.target.value));
                  }}
                  className="bg-slate-50 dark:bg-zinc-900 border border-slate-250/60 dark:border-zinc-800 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-[#C9A84C] text-slate-800 dark:text-zinc-150"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

              {/* Theme Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Visual Interface</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setTheme('light')}
                    className={`flex-1 py-2 text-xs font-bold border rounded-xl transition-all ${
                      theme === 'light' 
                        ? 'border-black bg-black text-white dark:border-white' 
                        : 'border-slate-200 dark:border-zinc-800 text-slate-500'
                    }`}
                  >
                    Light Mode
                  </button>
                  <button 
                    onClick={() => setTheme('dark')}
                    className={`flex-1 py-2 text-xs font-bold border rounded-xl transition-all ${
                      theme === 'dark' 
                        ? 'border-white bg-white text-black' 
                        : 'border-slate-200 dark:border-zinc-800 text-slate-500'
                    }`}
                  >
                    Dark Mode
                  </button>
                </div>
              </div>

              {/* Mock Alerts config */}
              <div className="flex justify-between items-center py-2 border-t border-slate-100 dark:border-zinc-800 mt-2">
                <div className="flex flex-col">
                  <span className="text-xs font-bold">Email Notifications</span>
                  <span className="text-[9px] text-slate-450">Simulate order dispatch triggers</span>
                </div>
                <input 
                  type="checkbox" 
                  defaultChecked 
                  className="w-4 h-4 rounded text-black focus:ring-black accent-black" 
                />
              </div>

              <button 
                onClick={() => setShowSettingsModal(false)}
                className="w-full bg-black dark:bg-zinc-100 text-white dark:text-black py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider hover:bg-[#C9A84C] hover:text-black transition-colors"
              >
                APPLY PREFERENCES
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
           GLOBAL ADD-TO-CART MODAL POP-UP SYSTEM
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {addedCartItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className={`w-full max-w-md rounded-[2.5rem] border shadow-[0_25px_60px_rgba(0,0,0,0.5)] p-6 md:p-8 relative flex flex-col gap-6 text-center ${
                theme === 'dark' 
                  ? 'bg-[#0f0f0f]/95 border-[#C9A84C]/30 text-zinc-100' 
                  : 'bg-white/95 border-slate-200/80 text-slate-800'
              }`}
            >
              {/* Close Button */}
              <button 
                onClick={() => setAddedCartItem(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors flex items-center justify-center text-slate-400 hover:text-slate-650 dark:hover:text-zinc-200"
                title="Close"
              >
                <i className="fa-solid fa-times text-sm"></i>
              </button>

              {/* Title & Success Animation */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center animate-pulse border border-emerald-500/30">
                  <i className="fa-solid fa-circle-check text-2xl"></i>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#C9A84C] mt-2">✦ Luxury Selection Added ✦</span>
                <h3 className="text-lg md:text-xl font-black font-serif tracking-tight mt-0.5">
                  Added to Luxe Bag
                </h3>
              </div>

              {/* Product Preview Card */}
              <div className={`flex items-center gap-4 p-4 rounded-2xl border text-left ${
                theme === 'dark' ? 'bg-[#161616] border-zinc-800' : 'bg-slate-50 border-slate-100'
              }`}>
                {/* Product Image */}
                <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-zinc-900 overflow-hidden border border-slate-200 dark:border-zinc-850 flex-shrink-0">
                  {addedCartItem.image ? (
                    <img src={addedCartItem.image} alt={addedCartItem.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-450 font-bold text-center p-1">No Image</div>
                  )}
                </div>
                
                {/* Product Details */}
                <div className="flex flex-col gap-1 pr-2 truncate">
                  <h4 className="text-xs md:text-sm font-bold text-slate-800 dark:text-zinc-200 truncate">
                    {addedCartItem.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#C9A84C] font-black">{formatPrice(addedCartItem.price)}</span>
                    <span className="text-slate-400 dark:text-zinc-550">•</span>
                    <span className="text-slate-550 dark:text-zinc-450 font-semibold">Qty: {addedCartItem.addedQty || addedCartItem.qty}</span>
                  </div>
                </div>
              </div>

              {/* Free Shipping Progress Indicator */}
              <div className="flex flex-col gap-2 bg-[#C9A84C]/5 border border-[#C9A84C]/10 p-4 rounded-2xl">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                  <span className="text-slate-500 dark:text-zinc-400">Bag Subtotal</span>
                  <span className="text-[#C9A84C]">{formatPrice(subtotal)}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (subtotal / 1000) * 100)}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full bg-[#C9A84C] rounded-full"
                  />
                </div>

                <p className="text-[10px] font-bold text-slate-550 dark:text-zinc-400 text-left mt-0.5 leading-relaxed">
                  {hasFreeShipping ? (
                    <span className="text-emerald-500 flex items-center gap-1">
                      <i className="fa-solid fa-gift"></i> 🎉 You've unlocked FREE Premium Shipping!
                    </span>
                  ) : (
                    <span>
                      Add <strong className="text-[#C9A84C]">{formatPrice(remainingToFreeShipping)}</strong> more to unlock free shipping.
                    </span>
                  )}
                </p>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  onClick={() => setAddedCartItem(null)}
                  className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                    theme === 'dark' 
                      ? 'border-zinc-800 text-zinc-350 hover:bg-zinc-900/50' 
                      : 'border-slate-255 text-slate-655 hover:bg-slate-50'
                  }`}
                >
                  Continue Shopping
                </button>
                <Link
                  to="/cart"
                  onClick={() => setAddedCartItem(null)}
                  className="w-full bg-[#C9A84C] hover:brightness-110 text-slate-900 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center shadow-md hover:translate-y-[-1px]"
                >
                  View Bag
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
           FOOTER
         ───────────────────────────────────────────────────────────── */}
      <footer className={`py-12 border-t mt-auto text-xs ${
        theme === 'dark' ? 'border-zinc-900 bg-zinc-950/40 text-zinc-400' : 'border-slate-200/60 bg-slate-50/50 text-slate-600'
      }`}>
        <div className="max-w-6xl mx-auto px-6 md:px-16 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-black font-serif uppercase tracking-widest text-black dark:text-white">Lumina Luxe</h4>
            <p className="text-[11px] leading-relaxed">
              Quiet luxury e-commerce suite engineered for structural purity and transactional resilience.
            </p>
          </div>
          {/* Contact Details */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-black dark:text-white">Contact Ledger</span>
            <ul className="flex flex-col gap-1.5 text-[11px] font-semibold">
              <li>Email: support@luminaluxe.com</li>
              <li>Phone: +1 (800) LUXE-LINE</li>
              <li>Address: Suite 2026, Obsidian Tower, NY</li>
            </ul>
          </div>
          {/* Policy Links */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-black dark:text-white">Legal Suite</span>
            <ul className="flex flex-col gap-1.5 text-[11px] font-semibold">
              <li><Link to="/404" className="hover:text-[#C9A84C] transition-colors">Privacy Policy</Link></li>
              <li><Link to="/404" className="hover:text-[#C9A84C] transition-colors">Terms of Service</Link></li>
              <li><Link to="/404" className="hover:text-[#C9A84C] transition-colors">Sitemap</Link></li>
            </ul>
          </div>
          {/* Social Links */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-black dark:text-white">Social Stream</span>
            <ul className="flex flex-col gap-1.5 text-[11px] font-semibold">
              <li><a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-[#C9A84C] transition-colors">Instagram</a></li>
              <li><a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-[#C9A84C] transition-colors">Twitter</a></li>
              <li><a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-[#C9A84C] transition-colors">LinkedIn</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 md:px-16 border-t border-slate-200/50 dark:border-zinc-900/50 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-wider font-bold">
          <span>&copy; 2026 LUXE Premium AI Systems.</span>
          <span>Powered by local resilient database fallbacks.</span>
        </div>
      </footer>
    </div>
  );
};

// Main App Container Mounting Routes
export default function App() {
  return (
    <Router>
      <AppLayout>
        <Suspense fallback={<SuspenseLoading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/highlights" element={<Highlights />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/product/:idOrSlug" element={<ProductDetails />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AppLayout>
    </Router>
  );
}
