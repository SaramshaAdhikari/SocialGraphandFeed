export function CommunitySkeleton() {
  return (
    <div
      data-testid="community-skeleton"
      className="space-y-6 animate-pulse"
      aria-label="Loading community"
    >
      {/* Header skeleton */}
      <div className="rounded-2xl border border-border bg-surface-card overflow-hidden">
        <div className="h-36 sm:h-48 bg-surface-subtle w-full" />
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-end justify-between -mt-12 sm:-mt-16">
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-surface-subtle border-4 border-surface-card" />
            <div className="w-24 h-9 bg-surface-subtle rounded-full" />
          </div>
          <div className="w-48 h-6 bg-surface-subtle rounded" />
          <div className="w-3/4 h-4 bg-surface-subtle rounded" />
          <div className="w-1/3 h-3 bg-surface-subtle rounded" />
        </div>
      </div>

      {/* Grid content & sidebar skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="h-10 bg-surface-subtle rounded-xl w-full" />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 bg-surface-subtle rounded-xl border border-border"
            />
          ))}
        </div>
        <div className="hidden lg:block lg:col-span-4 space-y-4">
          <div className="h-48 bg-surface-subtle rounded-2xl border border-border" />
          <div className="h-56 bg-surface-subtle rounded-2xl border border-border" />
        </div>
      </div>
    </div>
  );
}

export default CommunitySkeleton;
