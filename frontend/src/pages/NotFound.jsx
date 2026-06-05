import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, HelpCircle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="text-center py-20 px-6 glass rounded-[2.5rem] flex flex-col items-center gap-6 border border-slate-100 dark:border-zinc-800/80 max-w-xl mx-auto my-12 shadow-2xl p-10 text-slate-800 dark:text-zinc-100 backdrop-blur-xl">
      <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 flex items-center justify-center text-slate-450 text-[#C9A84C] shadow-inner">
        <HelpCircle size={40} className="animate-bounce" />
      </div>
      
      <div className="flex flex-col gap-2.5">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C9A84C]">Error Code 404</span>
        <h1 className="text-2xl md:text-3xl font-black font-serif text-slate-850 dark:text-zinc-150">Curation Not Found</h1>
        <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-sm mx-auto">
          The premium listing, product slug, or client resource you requested could not be resolved in our database collections.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3.5 mt-4 w-full justify-center">
        <Link 
          to="/shop" 
          className="bg-black dark:bg-zinc-100 text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-zinc-200 text-xs font-black uppercase tracking-widest py-3.5 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
        >
          Explore Shop
        </Link>
        <Link 
          to="/" 
          className="bg-transparent border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-350 hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-xs font-black uppercase tracking-widest py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft size={13} /> Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
