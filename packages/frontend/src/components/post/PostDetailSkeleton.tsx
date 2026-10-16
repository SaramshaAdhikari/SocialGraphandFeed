
export function PostDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6 animate-pulse">
      {/* Back button skeleton */}
      <div className="w-28 h-6 bg-slate-200 dark:bg-slate-800 rounded-md" />

      {/* Main post card skeleton */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181B22] p-5 sm:p-6 space-y-4">
        {/* Header: avatar + community + author */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-1.5">
            <div className="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="w-20 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="ml-auto w-16 h-7 bg-slate-200 dark:bg-slate-800 rounded-full" />
        </div>

        {/* Title skeleton */}
        <div className="w-3/4 h-7 bg-slate-200 dark:bg-slate-800 rounded" />

        {/* Content paragraphs */}
        <div className="space-y-2 pt-2">
          <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="w-4/5 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>

        {/* Actions bar */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between">
          <div className="flex gap-2">
            <div className="w-20 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="w-24 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>
          <div className="w-16 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
      </div>

      {/* Comment section skeleton */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181B22] p-5 sm:p-6 space-y-4">
        <div className="w-32 h-5 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="w-full h-20 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
        <div className="space-y-3 pt-2">
          <div className="w-full h-12 bg-slate-100 dark:bg-slate-800/40 rounded-lg" />
          <div className="w-full h-12 bg-slate-100 dark:bg-slate-800/40 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
