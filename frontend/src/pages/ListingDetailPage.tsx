import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface ListingDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  seller_name?: string;
  created_at?: string;
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: listing, isLoading, isError } = useQuery<ListingDetail>({
    queryKey: ['listing', id],
    queryFn: async () => {
      const res = await axios.get(`/api/listings/${id}/`);
      return res.data;
    },
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse space-y-6 px-4 py-10">
        <div className="h-8 w-1/3 rounded bg-white/5" />
        <div className="h-64 rounded-2xl bg-white/5" />
        <div className="space-y-3">
          <div className="h-4 w-3/4 rounded bg-white/5" />
          <div className="h-4 w-1/2 rounded bg-white/5" />
        </div>
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-line bg-panel/60 p-8">
          <h2 className="text-lg font-semibold text-ink">Listing Not Found</h2>
          <p className="mt-2 text-sm text-ink-muted">
            The item you are looking for has been removed or is unavailable.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-ink transition hover:bg-white/20"
          >
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/" className="text-xs font-medium text-ink-muted transition hover:text-ink">
        &larr; Back to all listings
      </Link>

      <div className="mt-6 rounded-2xl border border-line bg-panel/70 p-6 shadow-xl backdrop-blur-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-block rounded-full bg-buy/10 px-3 py-1 text-xs font-medium text-buy">
              {listing.category}
            </span>
            <h1 className="mt-3 font-display text-2xl font-bold text-ink sm:text-3xl">
              {listing.title}
            </h1>
          </div>
          <div className="text-right">
            <span className="font-display text-3xl font-bold text-buy">
              ₹{listing.price}
            </span>
          </div>
        </div>

        <div className="mt-6 border-t border-line pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Description
          </h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink/90">
            {listing.description}
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-ink-muted">
            Posted by: <span className="font-medium text-ink">{listing.seller_name || 'Campus Student'}</span>
          </div>
          <button
            type="button"
            className="rounded-xl bg-buy px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Contact Seller
          </button>
        </div>
      </div>
    </div>
  );
}