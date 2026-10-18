import type { SearchCategory } from '../../api/types';

export interface SearchSkeletonProps {
  category?: SearchCategory;
  className?: string;
}

export function SearchSkeleton({ category = 'all', className = '' }: SearchSkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading search results"
      className={`space-y-6 ${className}`}
    >
      {/* Category header tabs pulse */}
      <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0] dark:border-[#2E3544]">
        {[60, 85, 75, 90, 65].map((w, i) => (
          <div
            key={i}
            className="h-8 bg-slate-200 dark:bg-[#262B36] rounded-full animate-pulse"
            style={{ width: `${w}px` }}
          />
        ))}
      </div>

      {category === 'visual' ? (
        // Masonry skeleton
        <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
          {[1.2, 0.75, 1.4, 0.9, 1.1, 0.8].map((ratio, i) => (
            <div
              key={i}
              className="break-inside-avoid mb-4 bg-white dark:bg-[#181B22] rounded-2xl border border-[#E2E8F0] dark:border-[#2E3544] p-3 animate-pulse"
            >
              <div
                className="w-full bg-slate-200 dark:bg-[#262B36] rounded-xl mb-3"
                style={{ aspectRatio: ratio }}
              />
              <div className="h-4 bg-slate-200 dark:bg-[#262B36] rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-100 dark:bg-[#1E232E] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : category === 'communities' ? (
        // Communities grid skeleton
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#181B22] border border-[#E2E8F0] dark:border-[#2E3544] rounded-2xl overflow-hidden p-4 animate-pulse"
            >
              <div className="h-16 bg-slate-200 dark:bg-[#262B36] rounded-lg mb-3" />
              <div className="h-4 bg-slate-200 dark:bg-[#262B36] rounded w-1/2 mb-2" />
              <div className="h-3 bg-slate-100 dark:bg-[#1E232E] rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : category === 'people' ? (
        // People grid skeleton
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#181B22] border border-[#E2E8F0] dark:border-[#2E3544] rounded-2xl p-4 animate-pulse flex items-start gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-[#262B36] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-[#262B36] rounded w-1/3" />
                <div className="h-3 bg-slate-100 dark:bg-[#1E232E] rounded w-1/4" />
                <div className="h-3 bg-slate-100 dark:bg-[#1E232E] rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Discussions or Mixed skeleton
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#181B22] border border-[#E2E8F0] dark:border-[#2E3544] rounded-2xl p-5 animate-pulse"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#262B36]" />
                <div className="h-3 bg-slate-200 dark:bg-[#262B36] rounded w-32" />
              </div>
              <div className="h-5 bg-slate-200 dark:bg-[#262B36] rounded w-4/5 mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 dark:bg-[#1E232E] rounded w-full" />
                <div className="h-3 bg-slate-100 dark:bg-[#1E232E] rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
