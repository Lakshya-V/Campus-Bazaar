// src/components/listings/ListingCardSkeleton.tsx
export default function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-borderline bg-surface/60">
      <div className="skeleton-shimmer aspect-[4/3]" />
      <div className="space-y-2 p-4">
        <div className="skeleton-shimmer h-4 w-3/4 rounded" />
        <div className="flex justify-between">
          <div className="skeleton-shimmer h-5 w-12 rounded" />
          <div className="skeleton-shimmer h-4 w-16 rounded" />
        </div>
      </div>
    </div>
  );
}