// src/components/listings/ListingCard.tsx
import {
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, animate } from 'framer-motion';
import { Heart } from 'lucide-react';
import type { Listing, ListingCondition } from '../../types/api';

interface ListingCardProps {
  listing: Listing;
  /** Optional — wire this to your favorites mutation once its request
   *  contract (POST/DELETE shape) is finalized. Without it, the heart
   *  still toggles locally so the interaction reads correctly in the UI. */
  onToggleFavorite?: (listingId: number) => void;
}

const CONDITION_STYLES: Record<ListingCondition, string> = {
  new: 'bg-buy/15 text-buy border-buy/30',
  good: 'bg-white/5 text-ink-muted border-white/10',
  fair: 'bg-warn/15 text-warn border-warn/30',
};

const CONDITION_LABEL: Record<ListingCondition, string> = {
  new: 'New',
  good: 'Good',
  fair: 'Fair',
};

export default function ListingCard({ listing, onToggleFavorite }: ListingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFavorited, setIsFavorited] = useState(listing.is_favorited);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    // Tilt only responds to an actual mouse — there's no cursor position
    // to track on touch, so skip it there rather than fake a jitter.
    if (event.pointerType !== 'mouse' || !cardRef.current) return;

    const bounds = cardRef.current.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;

    rotateY.set(x * 10);
    rotateX.set(y * -10);
  }

  function handlePointerLeave() {
    animate(rotateX, 0, { duration: 0.4, ease: 'easeOut' });
    animate(rotateY, 0, { duration: 0.4, ease: 'easeOut' });
  }

  function handleToggleFavorite(event: ReactMouseEvent) {
    event.preventDefault(); // don't follow the card's Link
    event.stopPropagation();
    setIsFavorited((prev) => !prev);
    onToggleFavorite?.(listing.id);
  }

  const coverImage = [...listing.images].sort((a, b) => a.order - b.order)[0];

  return (
    <Link to={`/listings/${listing.id}`} className="block [perspective:1000px]">
      <motion.div
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="group relative overflow-hidden rounded-2xl border border-line bg-panel/60 backdrop-blur-md transition-shadow duration-300 hover:border-buy/40 hover:shadow-[0_0_24px_-6px_rgba(124,156,255,0.35)]"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-panel">
          {coverImage ? (
            <img
              src={coverImage.url}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-ink-muted">
              No photo yet
            </div>
          )}

          <span
            className={`absolute left-3 top-3 rounded-full border px-2.5 py-1 text-xs font-medium ${CONDITION_STYLES[listing.condition]}`}
          >
            {CONDITION_LABEL[listing.condition]}
          </span>

          <motion.button
            type="button"
            whileTap={{ scale: 0.85 }}
            onClick={handleToggleFavorite}
            aria-pressed={isFavorited}
            aria-label={isFavorited ? 'Remove from saved items' : 'Save this listing'}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/30 backdrop-blur-md"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${isFavorited ? 'fill-buy text-buy' : 'text-white'}`}
            />
          </motion.button>
        </div>

        <div className="space-y-1 p-4">
          <h3 className="truncate font-medium text-ink">{listing.title}</h3>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-lg font-semibold tabular-nums text-sell">
              ${Number(listing.price).toFixed(0)}
            </span>
            <span className="text-xs text-ink-muted">{listing.category.name}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}