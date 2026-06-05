import React, { useState, useEffect } from 'react';
import { ShieldCheck, BarChart3, Users, DollarSign, Package, ShoppingBag, PlusCircle, CheckCircle, Trash2, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const Admin = () => {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  
  // States
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'inventory'
  const [loading, setLoading] = useState(true);

  // Product insertion form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Laptops');
  const [image, setImage] = useState('');
  const [stock, setStock] = useState('10');
  const [specsInput, setSpecsInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch admin dashboard figures and catalog items
  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/stats');
      setStats(res.data);

      const resProducts = await axios.get('/api/products');
      setProducts(resProducts.data);
    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchAdminStats();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Handle Product Addition
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      setSuccessMsg('');
      
      const specifications = specsInput.split(',').map(pair => {
        const [k, v] = pair.split(':');
        if (k && v) {
          return { name: k.trim(), value: v.trim() };
        }
        return null;
      }).filter(Boolean);

      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

      const res = await axios.post('/api/products', {
        name,
        description,
        price: Number(price),
        category,
        image,
        stock: Number(stock),
        specifications,
        tags
      });

      setSuccessMsg('Product added successfully!');
      setName('');
      setDescription('');
      setPrice('');
      setImage('');
      setStock('10');
      setSpecsInput('');
      setTagsInput('');
      
      // Update local listing instantly
      if (res.data && res.data.product) {
        setProducts(prev => [res.data.product, ...prev]);
      }
      
      fetchAdminStats(); // refresh database counts
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add product.');
    }
  };

  // Handle Product Deletion
  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to permanently remove this product from the catalog?')) return;
    try {
      await axios.delete(`/api/products/${id}`);
      setProducts(prev => prev.filter(p => p._id !== id));
      fetchAdminStats(); // refresh database counts
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete product.');
    }
  };

  // Handle Order Tracking Progression
  const handleUpdateTracking = async (orderId, state) => {
    try {
      const res = await axios.post('/api/seller/tracking', { orderId, state });
      
      // Sync state locally immediately
      setStats(prev => ({
        ...prev,
        recentOrders: prev.recentOrders.map(ord => 
          ord._id === orderId ? { ...ord, trackingState: state } : ord
        )
      }));
      
      alert(res.data.message || 'Tracking state updated successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update tracking status.');
    }
  };

  // Handle Order Cancellation
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      const res = await axios.post('/api/seller/cancel', { orderId });
      
      // Sync state locally immediately
      setStats(prev => ({
        ...prev,
        recentOrders: prev.recentOrders.map(ord => 
          ord._id === orderId ? { ...ord, isCancelled: true, trackingState: 'Cancelled' } : ord
        )
      }));
      
      alert(res.data.message || 'Order cancelled successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel order.');
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="text-center py-16 glass rounded-3xl flex flex-col items-center gap-4 border border-slate-100 dark:border-zinc-800 max-w-xl mx-auto my-8 shadow-sm p-8 text-slate-800 dark:text-zinc-100">
        <div className="w-16 h-16 rounded-full bg-slate-105 dark:bg-zinc-900 flex items-center justify-center text-slate-450">
          <ShieldCheck size={28} />
        </div>
        <div className="flex flex-col gap-1.5 mt-2">
          <h2 className="text-base font-extrabold text-slate-800 dark:text-zinc-200">Access Denied</h2>
          <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
            Administrator privileges are required to view dashboard statistics and manage catalog products.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse py-8">
        <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-28 bg-slate-200 dark:bg-zinc-800 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="flex flex-col gap-8 pb-16">
      
      {/* Console Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-zinc-200">
          <ShieldCheck size={18} className="text-gold-600" /> Luxe Systems Admin Console
        </h2>
        <div className="flex gap-2">
          {/* Tab Selection */}
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'orders' 
                ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 shadow-md' 
                : 'glass hover:bg-slate-105 dark:hover:bg-zinc-800 text-slate-500'
            }`}
          >
            Dashboard & Orders
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'inventory' 
                ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 shadow-md' 
                : 'glass hover:bg-slate-105 dark:hover:bg-zinc-800 text-slate-500'
            }`}
          >
            Catalog Manager
          </button>
          <button 
            onClick={fetchAdminStats}
            className="glass hover:bg-slate-105 dark:hover:bg-zinc-800 text-slate-500 p-2.5 rounded-xl flex items-center justify-center"
            title="Refresh Console Data"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Analytics counter widgets */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="glass p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm flex gap-4 items-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-500 flex items-center justify-center flex-shrink-0">
            <DollarSign size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-450 uppercase">Total Sales Revenue</span>
            <span className="text-xl font-black text-slate-850 dark:text-zinc-150">₹{stats.totalRevenue}</span>
          </div>
        </div>

        {/* Total Users */}
        <div className="glass p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm flex gap-4 items-center">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-955 text-indigo-600 dark:text-indigo-500 flex items-center justify-center flex-shrink-0">
            <Users size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-450 uppercase">Registered Customers</span>
            <span className="text-xl font-black text-slate-850 dark:text-zinc-150">{stats.totalUsers} users</span>
          </div>
        </div>

        {/* Total Products */}
        <div className="glass p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm flex gap-4 items-center">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-955 text-amber-600 dark:text-amber-500 flex items-center justify-center flex-shrink-0">
            <Package size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-450 uppercase">Active Catalog Items</span>
            <span className="text-xl font-black text-slate-850 dark:text-zinc-150">{products.length} items</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="glass p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm flex gap-4 items-center">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-955 text-rose-600 dark:text-rose-500 flex items-center justify-center flex-shrink-0">
            <ShoppingBag size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-450 uppercase">Checkouts processed</span>
            <span className="text-xl font-black text-slate-850 dark:text-zinc-150">{stats.totalOrders} orders</span>
          </div>
        </div>
      </section>

      {/* DYNAMIC CONSOLE TAB VIEWS */}
      <div className="transition-all duration-300">
        
        {/* TAB 1: Dashboard & Live Orders */}
        {activeTab === 'orders' && (
          <div className="flex flex-col gap-6 animate-[fadeIn_0.2s_ease]">
            <h3 className="text-xs font-black text-slate-850 dark:text-zinc-250 uppercase tracking-widest flex items-center gap-1.5">
              <BarChart3 size={15} className="text-gold-600 animate-pulse" /> Live Orders Tracking & Invoices Ledger
            </h3>

            <div className="glass rounded-3xl border border-slate-100 dark:border-zinc-800 overflow-hidden shadow-sm">
              {stats.recentOrders.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-8 text-center">No orders transactions logged yet in development.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-medium border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 text-[10px] text-slate-450 uppercase font-black tracking-wider">
                        <th className="p-4">Invoice ID</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Paid Total</th>
                        <th className="p-4">Payment Status</th>
                        <th className="p-4 text-right">Live Tracking progression</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentOrders.map((ord) => (
                        <tr key={ord._id} className="border-b border-slate-105/50 dark:border-zinc-800/50 hover:bg-slate-50/50">
                          <td className="p-4 font-bold text-[10px] truncate max-w-[100px] text-slate-800 dark:text-zinc-200">
                            {ord._id}
                          </td>
                          <td className="p-4 text-slate-700 dark:text-zinc-350">
                            {ord.user ? ord.user.name : 'Loyal Client'}
                          </td>
                          <td className="p-4 font-black">
                            ₹{ord.totalPrice}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              ord.isPaid 
                                ? 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-500' 
                                : 'bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-500'
                            }`}>
                              {ord.isPaid ? 'Paid' : 'Unpaid'}
                            </span>
                          </td>
                          <td className="p-4 text-right flex items-center justify-end gap-2">
                            {ord.isCancelled || ord.trackingState === 'Cancelled' ? (
                              <span className="px-2.5 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider bg-rose-105/80 dark:bg-rose-950/20 text-rose-600 dark:text-rose-500 border border-rose-200 dark:border-rose-900/30">
                                Cancelled
                              </span>
                            ) : ord.trackingState === 'Delivered' ? (
                              <span className="px-2.5 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-900/30">
                                Delivered
                              </span>
                            ) : (
                              <>
                                <select
                                  value={ord.trackingState || 'Confirmed'}
                                  onChange={(e) => handleUpdateTracking(ord._id, e.target.value)}
                                  className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl py-1.5 px-3 text-[9px] font-black uppercase tracking-wider text-slate-850 dark:text-zinc-150 outline-none focus:border-gold-500 cursor-pointer"
                                >
                                  {['Confirmed', 'Packed', 'Shipped', 'Out For Delivery', 'Delivered'].map(st => (
                                    <option key={st} value={st}>{st}</option>
                                  ))}
                                </select>

                                {(() => {
                                  const trackingStates = ['Confirmed', 'Packed', 'Shipped', 'Out For Delivery', 'Delivered'];
                                  const currentState = ord.trackingState || 'Confirmed';
                                  const currentIndex = trackingStates.indexOf(currentState);
                                  if (currentIndex < trackingStates.length - 1) {
                                    const nextState = trackingStates[currentIndex + 1];
                                    return (
                                      <button
                                        onClick={() => handleUpdateTracking(ord._id, nextState)}
                                        className="bg-black hover:bg-neutral-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-black text-white px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-1 active:translate-y-[1px]"
                                        title={`Transition status to: ${nextState}`}
                                      >
                                        Move Forward →
                                      </button>
                                    );
                                  }
                                  return null;
                                })()}

                                <button
                                  onClick={() => handleCancelOrder(ord._id)}
                                  className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all shadow-sm active:translate-y-[1px]"
                                  title="Cancel Order"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Catalog Products Manager (Add & Remove) */}
        {activeTab === 'inventory' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-[fadeIn_0.2s_ease]">
            
            {/* Left: Product Addition (5 cols) */}
            <div className="lg:col-span-5 glass p-6 rounded-3xl border border-slate-100 dark:border-zinc-800 flex flex-col gap-4">
              <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <PlusCircle size={15} className="text-gold-600" /> Insert New Catalog Product
              </h3>

              <form onSubmit={handleAddProduct} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Product Title</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g. Lumina Pro Headphones"
                    className="bg-slate-100 dark:bg-zinc-900 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-gold-500 text-slate-800 dark:text-zinc-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase">Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="3499"
                      className="bg-slate-100 dark:bg-zinc-900 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-gold-500 text-slate-850 dark:text-zinc-100"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase">Stock Inventory</label>
                    <input
                      type="number"
                      required
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="10"
                      className="bg-slate-100 dark:bg-zinc-900 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-gold-500 text-slate-850 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Product Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-slate-100 dark:bg-zinc-900 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none text-slate-800 dark:text-zinc-100"
                  >
                    {['Laptops', 'Footwear', 'Mobiles', 'Apparel', 'Accessories'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Product Image URL</label>
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="http://example.com/img.jpg"
                    className="bg-slate-100 dark:bg-zinc-900 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-gold-500 text-slate-800 dark:text-zinc-100"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Specifications (Key: Value, Comma separated)</label>
                  <input
                    type="text"
                    value={specsInput}
                    onChange={(e) => setSpecsInput(e.target.value)}
                    placeholder="Processor: Intel i7, RAM: 16GB"
                    className="bg-slate-100 dark:bg-zinc-900 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-gold-500 text-slate-800 dark:text-zinc-100"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Search Tags (Comma separated)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="gaming, wireless, sports"
                    className="bg-slate-100 dark:bg-zinc-900 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-gold-500 text-slate-800 dark:text-zinc-100"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Description</label>
                  <textarea
                    rows="2"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Briefly describe the product..."
                    className="bg-slate-100 dark:bg-zinc-900 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-gold-500 text-slate-800 dark:text-zinc-100"
                  />
                </div>

                {successMsg && <span className="text-xs font-bold text-emerald-500 flex items-center gap-1"><CheckCircle size={12} /> {successMsg}</span>}

                <button type="submit" className="w-full bg-slate-900 dark:bg-zinc-100 text-white dark:text-black py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider hover:bg-gold hover:text-black transition-all">
                  CREATE PRODUCT
                </button>
              </form>
            </div>

            {/* Right: Active Products List & Removals (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <h3 className="text-xs font-black text-slate-850 dark:text-zinc-250 uppercase tracking-widest flex items-center gap-1.5">
                <Package size={15} className="text-gold-600" /> Active Catalog Product Management
              </h3>

              <div className="glass rounded-3xl border border-slate-100 dark:border-zinc-800 overflow-hidden shadow-sm">
                <div className="max-h-[620px] overflow-y-auto">
                  <table className="w-full text-left text-xs font-medium border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 text-[10px] text-slate-450 uppercase font-black tracking-wider sticky top-0 z-10">
                        <th className="p-4">Title / Category</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Stock</th>
                        <th className="p-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="p-6 text-center text-slate-400 italic">No products listed in catalog.</td>
                        </tr>
                      ) : (
                        products.map((prod) => (
                          <tr key={prod._id} className="border-b border-slate-105/50 dark:border-zinc-800/50 hover:bg-slate-50/50">
                            <td className="p-4 flex gap-3 items-center truncate max-w-[200px]">
                              {prod.image ? (
                                <img src={prod.image} alt={prod.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400 flex-shrink-0">IMG</div>
                              )}
                              <div className="flex flex-col truncate">
                                <span className="font-bold text-slate-850 dark:text-zinc-150 truncate">{prod.name}</span>
                                <span className="text-[8px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider">{prod.category}</span>
                              </div>
                            </td>
                            <td className="p-4 font-black">
                              ₹{prod.price}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                prod.stock > 5 
                                  ? 'bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300' 
                                  : 'bg-amber-100 dark:bg-amber-955 text-amber-600 dark:text-amber-500 font-extrabold'
                              }`}>
                                {prod.stock} units
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button 
                                onClick={() => handleDeleteProduct(prod._id)}
                                className="text-slate-400 hover:text-rose-500 p-2 transition-colors duration-150"
                                title="Remove Product from Catalog"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default Admin;
