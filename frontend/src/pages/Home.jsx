import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Sparkles, Truck, Shield, RotateCcw, 
  Star, Heart, Package, ChevronDown, 
  ArrowRight, ArrowUpRight 
} from 'lucide-react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import ProductSkeleton from '../components/ProductSkeleton';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [faqOpen, setFaqOpen] = useState({});

  // Fetch products on mount to showcase featured preview
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/products');
        // Take a limited preview of 3 items
        setFeaturedProducts(res.data.slice(0, 3));
      } catch (err) {
        console.error('Failed to load featured products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const toggleFaq = (idx) => {
    setFaqOpen(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  return (
    <div className="flex flex-col gap-20 pb-20">
      
      {/* ─────────────────────────────────────────────────────────────
           1. HERO LANDING SECTION
         ───────────────────────────────────────────────────────────── */}
      <section className="relative rounded-[2.5rem] overflow-hidden bg-zinc-900 text-white min-h-[560px] flex items-center p-6 md:p-16 border border-zinc-800 shadow-2xl">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] ease-out hover:scale-105 opacity-40" 
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80')`
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
        
        <div className="relative z-10 max-w-2xl flex flex-col gap-6">
          <span className="text-[10px] font-black tracking-[0.3em] text-[#C9A84C] uppercase flex items-center gap-1.5 w-fit bg-white/5 border border-white/10 px-3 py-1 rounded-full backdrop-blur-md">
            <Sparkles size={11} className="text-[#C9A84C]" /> Premier AI E-Commerce Suite
          </span>
          
          <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.1] font-serif">
            Quiet Luxury. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A84C] via-amber-200 to-[#C9A84C]">
              Redefined.
            </span>
          </h1>
          
          <p className="text-xs md:text-sm text-zinc-350 leading-relaxed font-semibold max-w-lg">
            Welcome to Lumina Luxe. Our signature curation brings together structural purity, high-end material selection, and clean aesthetics—backed by a resilient zero-compile-risk database fallback architecture.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <Link 
              to="/shop" 
              className="bg-white text-black hover:bg-zinc-200 text-xs font-black uppercase tracking-widest py-4 px-8 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 hover:translate-y-[-1px] active:translate-y-0"
            >
              Shop Collection <ArrowRight size={14} />
            </Link>
            <Link 
              to="/highlights" 
              className="bg-transparent border border-zinc-700 hover:border-zinc-500 text-white text-xs font-black uppercase tracking-widest py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2 hover:bg-white/5"
            >
              Explore Highlights <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
           2. FEATURES SHOWCASE SECTION
         ───────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 text-center max-w-xl mx-auto">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#C9A84C]">Why Lumina Luxe</span>
          <h2 className="text-2xl md:text-3xl font-black font-serif text-slate-800 dark:text-zinc-100">
            Engineered for Excellence
          </h2>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            Every layer of our boutique platform has been optimized to provide a frictionless, secure, and luxury-first shopping experience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <Truck className="text-[#C9A84C]" size={20} />,
              title: "Express Delivery",
              desc: "Same-day boutique processing and express dispatch globally on all catalog models."
            },
            {
              icon: <Shield className="text-[#C9A84C]" size={20} />,
              title: "Secure Checkouts",
              desc: "Bank-grade transactional tokenization and encryption, supporting multiple modern checkout layers."
            },
            {
              icon: <RotateCcw className="text-[#C9A84C]" size={20} />,
              title: "Easy Returns",
              desc: "No questions asked 14-day exchange and returns ledger, fully managed in your account dashboard."
            },
            {
              icon: <Star className="text-[#C9A84C]" size={20} />,
              title: "Verified Ratings",
              desc: "100% verified purchaser reviews compiled with dynamic AI-generated feedback summaries."
            },
            {
              icon: <Heart className="text-[#C9A84C]" size={20} />,
              title: "Wishlist Collections",
              desc: "Seamless curation save states to easily filter, compare, and order your desired selections."
            },
            {
              icon: <Package className="text-[#C9A84C]" size={20} />,
              title: "Order Tracking",
              desc: "Detailed state-progression invoice tracking ledger, keeping you updated from pack to delivery."
            }
          ].map((feat, i) => (
            <div 
              key={i} 
              className="glass-card p-6 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-sm flex flex-col gap-3.5 hover:shadow-md transition-shadow hover:border-slate-200 dark:hover:border-zinc-700/80"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-zinc-850 flex items-center justify-center flex-shrink-0">
                {feat.icon}
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">{feat.title}</h3>
                <p className="text-[11px] text-slate-550 dark:text-zinc-400 leading-relaxed font-semibold">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
           3. CURATED CATEGORIES SECTION
         ───────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-8">
        <div className="flex justify-between items-end border-b border-slate-100 dark:border-zinc-800/80 pb-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-[#C9A84C]">Browse the Catalog</span>
            <h2 className="text-2xl font-black font-serif text-slate-850 dark:text-zinc-150">
              Curated Collections
            </h2>
          </div>
          <Link to="/shop" className="text-[10px] font-black uppercase tracking-widest text-[#C9A84C] hover:underline flex items-center gap-1">
            Shop All <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            {
              name: 'Fashion Wear',
              count: 'Collection Curated',
              category: 'Fashion',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8kFh8syYuP3f4WteAIwuXTZUEb71XdDZc3BTOyZ8y4ba14XyxKEt8oO2KslzHmzGLNZuRgGeaXg0qNLSMJJ3PHJCLGo8Tpg5GvwsvAmiDBU036DwJB1UER5Ns0HRfW9049knblxpcRv_Y6L7ZLR51Lf1OxSfKpVeLoRf4npanSkJ9NBe0GSPPklsCBSQcUyjNDVVYca4wDbgdzi9u_Mo8iiz_eB-J-IJm-Ql0BTPOM_0aYbhg_AeboG6h-xaCq1CJgyuKrIKfpNI'
            },
            {
              name: 'Smart Tech',
              count: 'Silicon & Display',
              category: 'Electronics',
              img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80'
            },
            {
              name: 'Living Space',
              count: 'Ambient & Decor',
              category: 'Home & Living',
              img: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=80'
            },
            {
              name: 'Beauty Therapy',
              count: 'Botanical Skincare',
              category: 'Beauty',
              img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=80'
            }
          ].map((cat) => (
            <Link 
              key={cat.name} 
              to={`/shop?category=${cat.category}`}
              className="group flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 shadow-sm relative">
                <img 
                  src={cat.img} 
                  alt={cat.name} 
                  className="w-full h-full object-cover transition-transform duration-[1s] group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex flex-col justify-end p-5">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">{cat.name}</h4>
                  <span className="text-[10px] text-zinc-300 font-semibold">{cat.count}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
           4. FEATURED PRODUCTS PREVIEW
         ───────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-8">
        <div className="flex justify-between items-end border-b border-slate-100 dark:border-zinc-800/80 pb-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-[#C9A84C]">Exclusive Selections</span>
            <h2 className="text-2xl font-black font-serif text-slate-850 dark:text-zinc-150">
              Featured Highlights
            </h2>
          </div>
          <Link to="/shop" className="text-[10px] font-black uppercase tracking-widest text-[#C9A84C] hover:underline flex items-center gap-1">
            Explore All Products <ArrowRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="responsive-product-grid">
            {[1, 2, 3, 4, 5].map(n => (
              <ProductSkeleton key={n} />
            ))}
          </div>
        ) : (
          <div className="responsive-product-grid">
            {featuredProducts.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
           5. TESTIMONIALS SECTION
         ───────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 text-center max-w-xl mx-auto">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#C9A84C]">Client Testimonials</span>
          <h2 className="text-2xl md:text-3xl font-black font-serif text-slate-800 dark:text-zinc-100">
            Trusted by Connoisseurs
          </h2>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            Discover what our premium members say about our meticulous curation, fast checkouts, and resilient platform operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote: "The Titanium Chrono is a masterpiece. It rests beautifully and the specs comparison helper really clarified my choice. Exceptional delivery.",
              author: "Charles Montgomery",
              role: "Verified Platinum Member"
            },
            {
              quote: "I am deeply impressed by Lumina's interface—it's smooth, dark, and highly premium. Placing an order with my wallet balance was incredibly easy.",
              author: "Sofia Loren",
              role: "Verified Gold Member"
            },
            {
              quote: "The cashmere coat is structurally immaculate. Finding it via the natural language AI tool saved me so much time. This is standard-setting.",
              author: "Marcus Sterling",
              role: "Collector & Client"
            }
          ].map((t, idx) => (
            <div 
              key={idx} 
              className="glass-card p-6 rounded-3xl border border-slate-100 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between gap-6 relative"
            >
              <span className="absolute top-4 right-6 text-4xl font-serif text-[#C9A84C]/25 select-none">“</span>
              <p className="text-[11.5px] leading-relaxed text-slate-655 dark:text-zinc-350 font-semibold italic">
                "{t.quote}"
              </p>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-extrabold text-slate-850 dark:text-zinc-150">{t.author}</span>
                <span className="text-[9px] uppercase tracking-wider font-bold text-[#C9A84C]">{t.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
           6. FAQ SECTION
         ───────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-8 max-w-3xl mx-auto w-full">
        <div className="flex flex-col gap-2 text-center max-w-xl mx-auto">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#C9A84C]">FAQ Ledger</span>
          <h2 className="text-2xl font-black font-serif text-slate-850 dark:text-zinc-100">
            Frequently Answered Ledger
          </h2>
          <p className="text-xs text-slate-500 font-semibold">
            Common questions regarding our premium suite services and sandbox fallbacks.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {[
            {
              q: "How does the database-offline fallback mode work?",
              a: "Lumina Luxe is built with a resilient client-server stack. If our primary database cluster goes offline, the backend routes immediately switch to a simulated mock engine loaded with pre-configured high-fidelity products, reviews, and transaction APIs. This ensures zero downtime during preview stages."
            },
            {
              q: "Can I checkout using Wallet points?",
              a: "Absolutely. Every registered customer receives welcome wallet points. These can be redeemed during checkout for deductions, and new transactions earn points automatically depending on your membership tier (Silver, Gold, or Platinum)."
            },
            {
              q: "What payment options are supported?",
              a: "We support simulated mock UPI, Credit Cards, Debit Cards, and Net Banking checkouts. You can choose any payment method during order placement to complete your mock transaction ledger."
            },
            {
              q: "How do I review a product I purchased?",
              a: "Simply navigate to the product detail page, make sure you are logged in, and submit your star rating and comment using the review submission drawer. You can even paste mock image/video URLs to attach rich media!"
            }
          ].map((faq, idx) => {
            const isOpen = !!faqOpen[idx];
            return (
              <div 
                key={idx}
                className="glass-card rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex justify-between items-center text-xs font-bold text-slate-800 dark:text-zinc-200 focus:outline-none hover:bg-slate-50/50 dark:hover:bg-zinc-850/30 transition-all"
                >
                  <span>{faq.q}</span>
                  <ChevronDown 
                    size={14} 
                    className={`text-[#C9A84C] transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`} 
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="p-5 pt-0 text-[11px] text-slate-550 dark:text-zinc-400 leading-relaxed font-semibold border-t border-slate-100/50 dark:border-zinc-850/50">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};

export default Home;
