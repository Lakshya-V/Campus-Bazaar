// src/pages/ListingDetailPage.tsx
import { useParams } from 'react-router-dom';

// Placeholder — image gallery, seller info, and the "Chat with Seller"
// CTA belong here in a later step.
export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="rounded-2xl border border-line bg-panel/60 p-6">
      <h1 className="font-display text-xl font-semibold text-ink">Listing #{id}</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Full detail view goes here — image gallery, seller info, and chat CTA.
      </p>
    </div>
  );
}