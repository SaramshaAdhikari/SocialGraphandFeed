import { Skeleton } from '../ui/Skeleton';

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" data-testid="profile-skeleton">
      {/* Profile Header Skeleton */}
      <div className="bg-surface-card rounded-3xl border border-border overflow-hidden shadow-xs">
        <Skeleton className="w-full h-36 sm:h-48 rounded-none" />

        <div className="px-4 sm:px-8 pb-6 sm:pb-8 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 mb-4">
            <Skeleton className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-surface-card" />
            <Skeleton className="w-28 h-9 rounded-xl self-start sm:self-end" />
          </div>

          <div className="space-y-3">
            <div>
              <Skeleton className="w-48 h-7 mb-1.5" />
              <Skeleton className="w-24 h-4" />
            </div>

            <div className="space-y-1.5 max-w-xl">
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-3/4 h-4" />
            </div>

            <div className="flex items-center gap-6 pt-3 border-t border-border">
              <Skeleton className="w-16 h-4" />
              <Skeleton className="w-20 h-4" />
              <Skeleton className="w-20 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex items-center gap-2 p-1.5 bg-surface-card rounded-2xl border border-border">
        <Skeleton className="w-24 h-9 rounded-xl" />
        <Skeleton className="w-28 h-9 rounded-xl" />
        <Skeleton className="w-28 h-9 rounded-xl" />
      </div>

      {/* Content Feed Cards Skeleton */}
      <div className="space-y-4">
        <div className="p-4 bg-surface-card rounded-2xl border border-border space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-32 h-4" />
          </div>
          <Skeleton className="w-3/4 h-6" />
          <Skeleton className="w-full h-16" />
        </div>

        <div className="p-4 bg-surface-card rounded-2xl border border-border space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-32 h-4" />
          </div>
          <Skeleton className="w-2/3 h-6" />
          <Skeleton className="w-full h-16" />
        </div>
      </div>
    </div>
  );
}

export default ProfileSkeleton;
