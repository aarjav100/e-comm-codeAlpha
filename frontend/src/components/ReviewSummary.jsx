import React, { useState, useEffect } from 'react';
import { Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react';
import axios from 'axios';

const ReviewSummary = ({ productId }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!productId) return;
      try {
        setLoading(true);
        const res = await axios.post(`/api/products/${productId}/reviews/summary`);
        setSummary(res.data);
      } catch (err) {
        console.error('Failed to load review summaries', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [productId]);

  if (loading) {
    return (
      <div className="p-5 rounded-2xl glass animate-pulse flex flex-col gap-4">
        <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/4"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-slate-200 dark:bg-zinc-800 rounded"></div>
          <div className="h-20 bg-slate-200 dark:bg-zinc-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (!summary || (!summary.pros && !summary.cons)) return null;

  return (
    <div className="p-5 rounded-2xl glass border border-slate-100 dark:border-zinc-800 flex flex-col gap-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-gold-500 animate-spin" />
        <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
          AI Smart Sentiment Summary
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pros card */}
        <div className="p-4 rounded-xl bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-500/10 flex flex-col gap-2">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500 flex items-center gap-1.5">
            <ThumbsUp size={12} /> WHAT CUSTOMERS LOVE
          </span>
          <ul className="flex flex-col gap-1.5 text-xs text-slate-600 dark:text-zinc-400 font-medium">
            {summary.pros && summary.pros.map((pro, index) => (
              <li key={index} className="flex items-start gap-1">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cons card */}
        <div className="p-4 rounded-xl bg-rose-50/20 dark:bg-rose-950/5 border border-rose-500/10 flex flex-col gap-2">
          <span className="text-xs font-bold text-rose-600 dark:text-rose-500 flex items-center gap-1.5">
            <ThumbsDown size={12} /> CONCERNS / DISLIKES
          </span>
          <ul className="flex flex-col gap-1.5 text-xs text-slate-600 dark:text-zinc-400 font-medium">
            {summary.cons && summary.cons.map((con, index) => (
              <li key={index} className="flex items-start gap-1">
                <span className="text-rose-500 font-bold">✗</span>
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReviewSummary;
