import React from 'react';

const ProductSkeleton = () => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl flex flex-col overflow-hidden relative shadow-sm animate-pulse">
      {/* Badge placeholder */}
      <div className="absolute top-4 left-4 z-10 w-16 h-4 bg-slate-200 dark:bg-zinc-800 rounded"></div>
      
      {/* Heart placeholder */}
      <div className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800"></div>

      {/* Image placeholder */}
      <div className="aspect-[4/3] w-full bg-slate-200 dark:bg-zinc-800"></div>

      {/* Details placeholder */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-start gap-3">
            <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-2/3"></div>
            <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/4"></div>
          </div>
          <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-full mt-1"></div>
          <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-5/6"></div>
        </div>

        <div className="flex flex-col gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
          <div className="flex justify-between items-center">
            <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-1/3"></div>
            <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-1/4"></div>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1 h-9 bg-slate-200 dark:bg-zinc-800 rounded-lg"></div>
            <div className="flex-1 h-9 bg-slate-200 dark:bg-zinc-800 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSkeleton;
