// src/components/listings/ListingCard.tsx
import { type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShieldCheck, Tag } from 'lucide-react';
import type { Item, ListingCondition } from '../../types/market';
import { Apple3DCard } from '../common/Apple3DCard';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';
import { POP_SPRING } from '../../lib/motion';
import RatingStars from '../common/RatingStars';

interface ListingCardProps {
  item: Item;
}

const CONDITION_STYLES: Record<ListingCondition, string> = {
  new: 'bg-emerald-700 text-white border-emerald-800 dark:bg-emerald-500 dark:text-emerald-950 dark:border-emerald-400',
  good: 'bg-slate-700 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:border-slate-300',
  fair: 'bg-amber-700 text-white border-amber-800 dark:bg-amber-400 dark:text-amber-950 dark:border-amber-300',
};

const CONDITION_LABEL: Record<ListingCondition, string> = {
  new: 'New',
  good: 'Good',
  fair: 'Fair',
};

export default function ListingCard({ item }: ListingCardProps) {
  const { user } = useAuth();
  const { getUser, isWishlisted, toggleWishlist } = useMarket();

  const isFavorited = isWishlisted(item.Item_ID);
  const isOwnListing = user?.User_ID === item.Seller_ID;
  const seller = getUser(item.Seller_ID);

  function handleToggleFavorite(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(item.Item_ID);
  }

  const coverImage = item.Images[0];

  return (
    <motion.div
      layout
      layoutId={`item-card-${item.Item_ID}`}
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      className="h-full"
    >
      <Link
        to={`/item/${item.Item_ID}`}
        className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-3xl"
      >
        <Apple3DCard className="h-full">
          {/* Layer 1: Background & image layer — translateZ(0) */}
          <div
            className="relative aspect-[4/3] overflow-hidden rounded-t-3xl bg-surface-elevated"
            style={{ transform: 'translateZ(0px)', transformStyle: 'preserve-3d' }}
          >
            {coverImage ? (
              <img
                src={coverImage}
                alt={item.Title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-ink-muted">
                No photo available
              </div>
            )}

            {/* "Your listing" indicator pill */}
            {isOwnListing && (
              <span
                className="absolute left-3 top-3 z-30 rounded-full border border-purple-500/30 bg-purple-900/80 px-2.5 py-1 text-[11px] font-bold text-purple-200 backdrop-blur-md shadow-md"
                style={{ transform: 'translateZ(30px)' }}
              >
                Your listing
              </span>
            )}

            {/* Wishlist Heart Button with Scale-Bounce micro-interaction */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.82 }}
              transition={POP_SPRING}
              onClick={handleToggleFavorite}
              aria-pressed={isFavorited}
              aria-label={isFavorited ? 'Remove from saved' : 'Save item'}
              className="absolute right-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-full border border-black/10 dark:border-white/15 bg-white/80 dark:bg-black/60 backdrop-blur-md transition-colors"
              style={{ transform: 'translateZ(30px)' }}
            >
              <Heart
                className={`h-4 w-4 transition-colors ${
                  isFavorited
                    ? 'fill-purple-600 text-purple-600 dark:fill-purple-400 dark:text-purple-400'
                    : 'text-slate-700 dark:text-white'
                }`}
              />
            </motion.button>
          </div>

          {/* Layer 2: Title and metadata layer — translateZ(35px) */}
          <div
            className="space-y-2.5 p-4"
            style={{ transform: 'translateZ(35px)', transformStyle: 'preserve-3d' }}
          >
            <h3
              className="truncate font-semibold text-ink group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"
              style={{ transform: 'translateZ(35px)' }}
            >
              {item.Title}
            </h3>

            {/* Seller info row with rating */}
            <div
              className="flex items-center justify-between text-xs text-ink-muted"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="flex items-center gap-1.5 overflow-hidden">
                <img
                  src={seller?.AvatarSeed || ''}
                  alt={seller?.Name}
                  className="h-4 w-4 rounded-full object-cover flex-shrink-0"
                />
                <span className="truncate">{seller?.Name || 'Campus Peer'}</span>
                {seller?.IsVerified && (
                  <ShieldCheck className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                )}
              </div>
              {seller && (
                <div className="flex-shrink-0">
                  <RatingStars value={seller.Rating} size={11} showScore />
                </div>
              )}
            </div>

            {/* Bottom metadata row */}
            <div
              className="flex items-center justify-between gap-2 pt-1 border-t border-black/5 dark:border-white/5"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Layer 3: Price tag — translateZ(55px) (floating highest) */}
              <span
                className="font-display text-xl font-bold tabular-nums text-sell"
                style={{ transform: 'translateZ(55px)' }}
              >
                ${item.Price}
              </span>

              {/* Category label and condition badge flush directly adjacent to each other */}
              <div
                className="flex items-center gap-1.5"
                style={{ transform: 'translateZ(35px)' }}
              >
                <span className="text-xs font-medium text-ink-muted flex items-center gap-1">
                  <Tag className="h-3 w-3 opacity-60" />
                  {item.Category}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border shadow-sm ${CONDITION_STYLES[item.Condition]}`}
                >
                  {CONDITION_LABEL[item.Condition]}
                </span>
              </div>
            </div>
          </div>
        </Apple3DCard>
      </Link>
    </motion.div>
  );
}