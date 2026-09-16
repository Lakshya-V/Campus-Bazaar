// src/components/listings/ListingCard.tsx
import { type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShieldCheck } from 'lucide-react';
import type { Item, ListingCondition } from '../../types/market';
import { Apple3DCard } from '../common/Apple3DCard';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';
import { POP_SPRING } from '../../lib/motion';
import RatingStars from '../common/RatingStars';
import { useCartSwipe } from '../../context/CartSwipeContext';

interface ListingCardProps {
  item: Item;
}

const CONDITION_STYLES: Record<ListingCondition, string> = {
  new: 'bg-[#1AA260] text-white border-[#15824d]',
  good: 'bg-[#2F6FED] text-white border-[#2358c2]',
  fair: 'bg-[#E0912B] text-white border-[#b8731d]',
};

const CONDITION_LABEL: Record<ListingCondition, string> = {
  new: 'New',
  good: 'Good',
  fair: 'Fair',
};

export default function ListingCard({ item }: ListingCardProps) {
  const { user } = useAuth();
  const { getUser, isWishlisted, toggleWishlist } = useMarket();
  const { triggerCartSwipe } = useCartSwipe();

  const isFavorited = isWishlisted(item.Item_ID);
  const isOwnListing = user?.User_ID === item.Seller_ID;
  const seller = getUser(item.Seller_ID);

  function handleToggleFavorite(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(item.Item_ID);
  }

  function handleCardClick(e: MouseEvent) {
    e.preventDefault();
    triggerCartSwipe(`/item/${item.Item_ID}`);
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
        onClick={handleCardClick}
        className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-[#2F6FED] rounded-2xl cursor-pointer"
      >
        <Apple3DCard className="h-full rounded-2xl">
          {/* Layer 1: Background & image layer — translateZ(0) */}
          <div
            className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-surface-elevated"
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
                className="absolute left-3 top-3 z-30 rounded-full border border-borderline bg-[#111318] text-[#FFFFFF] dark:bg-[#F2F3F5] dark:text-[#0D0F12] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md shadow-sm"
                style={{ transform: 'translateZ(30px)' }}
              >
                YOUR LISTING
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
              className="absolute right-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-full border border-borderline bg-surface/85 backdrop-blur-md transition-colors"
              style={{ transform: 'translateZ(30px)' }}
            >
              <Heart
                className={`h-4 w-4 transition-colors ${
                  isFavorited
                    ? 'fill-[#2F6FED] text-[#2F6FED] dark:fill-[#4F8CFF] dark:text-[#4F8CFF]'
                    : 'text-ink-secondary'
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
              className="truncate font-semibold text-ink transition-colors group-hover:text-ink-primary text-sm"
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
                  <ShieldCheck className="h-3.5 w-3.5 text-[#2F6FED] flex-shrink-0" />
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
              className="flex items-center justify-between gap-2 pt-2 border-t border-[#E7E9EC] dark:border-[#2A2D33]"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Layer 3: Price tag — translateZ(55px) (floating highest) */}
              <span
                className="font-display text-xl font-bold tracking-tight tabular-nums text-ink"
                style={{ transform: 'translateZ(55px)' }}
              >
                ${item.Price}
              </span>

              {/* Category label, photo count, and condition/sold badge flush directly adjacent to each other */}
              <div
                className="flex items-center gap-1.5"
                style={{ transform: 'translateZ(35px)' }}
              >
                {item.Images.length > 1 && (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-surface-elevated text-ink-muted border border-borderline">
                    📷 {item.Images.length}
                  </span>
                )}
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-surface-elevated text-ink-secondary border border-borderline">
                  {item.Category}
                </span>
                {item.Status === 'SOLD' ? (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-[#E24C4B] text-white border border-[#b83332] shadow-sm">
                    SOLD
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border shadow-sm ${CONDITION_STYLES[item.Condition]}`}
                  >
                    {CONDITION_LABEL[item.Condition]}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Apple3DCard>
      </Link>
    </motion.div>
  );
}