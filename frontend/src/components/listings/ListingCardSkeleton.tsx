// src/components/listings/ListingCardSkeleton.tsx
export default function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel/60">
      <div className="aspect-[4/3] animate-pulse bg-white/5" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-white/5" />
        <div className="flex justify-between">
          <div className="h-5 w-12 animate-pulse rounded bg-white/5" />
          <div className="h-4 w-16 animate-pulse rounded bg-white/5" />
        </div>
      </div>
    </div>
  );
}