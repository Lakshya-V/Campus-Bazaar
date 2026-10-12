// src/components/listings/ListingCardSkeleton.tsx
export default function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-borderline bg-surface/60">
      <div className="skeleton-shimmer aspect-[4/3]" />
      <div className="space-y-2.5 p-4">
        <div className="skeleton-shimmer h-4 w-3/4 rounded" />
        <div className="flex h-5 items-center justify-between">
          <div className="skeleton-shimmer h-4 w-2/5 rounded" />
          <div className="skeleton-shimmer h-4 w-1/4 rounded" />
        </div>
        <div className="flex h-7 items-center justify-between border-t border-borderline pt-2">
          <div className="skeleton-shimmer h-5 w-16 rounded" />
          <div className="skeleton-shimmer h-5 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}