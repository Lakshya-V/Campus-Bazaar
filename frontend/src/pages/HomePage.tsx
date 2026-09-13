// src/pages/HomePage.tsx
import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../api/axios';
import type { Listing, PaginatedResponse } from '../types/api';
import ListingCard from '../components/listings/ListingCard';
import ListingCardSkeleton from '../components/listings/ListingCardSkeleton';

export default function HomePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['listings', { page: 1 }],
    queryFn: async () => {
      const res = await axiosInstance.get<PaginatedResponse<Listing>>('/listings/', {
        params: { page: 1, page_size: 20, ordering: '-created_at' },
      });
      return res.data;
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Browse the bazaar</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Textbooks, furniture, and gear from students on campus.
        </p>
      </div>

      {isError && (
        <div className="mb-6 rounded-lg border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
          Couldn't load listings. Try refreshing the page.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading &&
          Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)}

        {!isLoading &&
          data?.results.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
      </div>

      {!isLoading && data?.results.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line py-16 text-center">
          <p className="text-ink-muted">No listings yet — be the first to post one.</p>
        </div>
      )}
    </div>
  );
}