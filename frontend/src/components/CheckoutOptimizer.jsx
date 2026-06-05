import React, { useState, useEffect } from 'react';
import { Sparkles, HelpCircle, TrendingUp } from 'lucide-react';
import axios from 'axios';

const CheckoutOptimizer = ({ cartTotal }) => {
  const [recommendation, setRecommendation] = useState('');
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOptimization = async () => {
      if (!cartTotal || cartTotal <= 0) return;
      try {
        setLoading(true);
        const res = await axios.post('/api/wallet/optimizer/ai', { cartTotal });
        setRecommendation(res.data.recommendation);
        setPoints(res.data.points);
      } catch (err) {
        console.error('Failed to load AI optimization advice', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOptimization();
  }, [cartTotal]);

  if (loading) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-gold-500/30 bg-gold-50/10 dark:bg-gold-950/5 animate-pulse flex flex-col gap-2">
        <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/3"></div>
        <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-3/4"></div>
      </div>
    );
  }

  if (!recommendation) return null;

  return (
    <div className="p-4 rounded-xl border border-gold-500/20 bg-gradient-to-r from-gold-50/20 to-transparent dark:from-gold-950/10 dark:to-transparent flex flex-col gap-2 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
        <TrendingUp size={64} className="text-gold-500" />
      </div>
      
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-gold-500 animate-pulse" />
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-gold-600 dark:text-gold-500">
          AI Cashback Optimizer
        </h4>
      </div>

      <p className="text-xs leading-relaxed text-slate-700 dark:text-zinc-350 font-medium">
        {recommendation}
      </p>

      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 dark:text-zinc-500 font-semibold">
        <HelpCircle size={10} />
        <span>Calculated dynamically based on your available Luxe Points: {points}</span>
      </div>
    </div>
  );
};

export default CheckoutOptimizer;
