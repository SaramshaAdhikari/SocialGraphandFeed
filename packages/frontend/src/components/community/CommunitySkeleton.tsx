export function CommunitySkeleton() {
  return (
    <div
      data-testid="community-skeleton"
      className="space-y-6 animate-pulse"
      aria-label="Loading community"
    >
      {/* Header skeleton */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181B22] overflow-hidden">
        <div className="h-36 sm:h-48 bg-slate-200 dark:bg-slate-800 w-full" />
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-end justify-between -mt-12 sm:-mt-16">
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-slate-300 dark:bg-slate-700 border-4 border-white dark:border-[#181B22]" />
            <div className="w-24 h-9 bg-slate-200 dark:bg-slate-800 rounded-full" />
          </div>
          <div className="w-48 h-6 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="w-3/4 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="w-1/3 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </div>

      {/* Grid content & sidebar skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
        <div className="hidden lg:block lg:col-span-4 space-y-4">
          <div className="h-48 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800" />
          <div className="h-56 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800" />
        </div>
      </div>
    </div>
  );
}
