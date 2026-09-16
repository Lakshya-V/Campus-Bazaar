// src/pages/ListingDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Heart,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sparkles,
  Edit3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { useAuth } from '../context/AuthContext';
import { Apple3DCard } from '../components/common/Apple3DCard';
import RatingStars from '../components/common/RatingStars';
import { POP_SPRING, MODAL_BACKDROP_VARIANTS, MODAL_CONTENT_VARIANTS } from '../lib/motion';
import { useCartSwipe } from '../context/CartSwipeContext';
import { getCategorySlug } from '../data/mockMarketData';

const CONDITION_STYLES = {
  new: 'bg-[#1AA260] text-white dark:bg-[#1AA260] dark:text-[#0D0F12]',
  good: 'bg-[#2F6FED] text-white dark:bg-[#2F6FED] dark:text-[#0D0F12]',
  fair: 'bg-[#E0912B] text-white dark:bg-[#E0912B] dark:text-[#0D0F12]',
};

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { triggerCartSwipe } = useCartSwipe();
  const { user } = useAuth();
  const {
    getItem,
    getUser,
    items,
    incrementItemView,
    recordViewedItem,
    isWishlisted,
    toggleWishlist,
    startChatSession,
    markItemSold,
  } = useMarket();

  const item = getItem(id || '');

  // Increment view count on mount & record to recently viewed
  useEffect(() => {
    if (id) {
      incrementItemView(id);
      recordViewedItem(id);
    }
  }, [id, incrementItemView, recordViewedItem]);

  const [showSoldModal, setShowSoldModal] = useState(false);
  const [dealClosedStamp, setDealClosedStamp] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [showEditStubModal, setShowEditStubModal] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [prevId, setPrevId] = useState(id);

  if (prevId !== id) {
    setPrevId(id);
    setActiveImageIndex(0);
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="rounded-3xl border border-borderline bg-surface/80 p-8 shadow-xl backdrop-blur-2xl">
          <AlertCircle className="mx-auto h-12 w-12 text-status-danger" />
          <h2 className="mt-4 font-display text-xl font-bold text-ink">
            Listing Not Found
          </h2>
          <p className="mt-2 text-xs text-ink-muted">
            This campus listing may have been completed or removed.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2F6FED] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#1B4FC4]"
          >
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  const seller = getUser(item.Seller_ID);
  const isOwnListing = user?.User_ID === item.Seller_ID;
  const isFav = isWishlisted(item.Item_ID);
  const isSold = item.Status === 'SOLD';

  const currentItem = item;

  const similarItems = items
    .filter((i) => i.Category === currentItem.Category && i.Item_ID !== currentItem.Item_ID && i.Status === 'AVAILABLE')
    .slice(0, 4);

  function handleStartChat() {
    setIsStartingChat(true);
    const session = startChatSession(currentItem.Item_ID, currentItem.Seller_ID);
    triggerCartSwipe(`/chat/${session.Session_ID}`, {
      message: 'Connecting to student chat...',
      duration: 750,
      onComplete: () => setIsStartingChat(false),
    });
  }

  function handleConfirmMarkSold() {
    setShowSoldModal(false);
    setDealClosedStamp(true);
    markItemSold(currentItem.Item_ID);
    setTimeout(() => {
      setDealClosedStamp(false);
    }, 2500);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-5xl space-y-8"
    >
      {/* Breadcrumb: Small All-Caps Label Style */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
        <Link
          to="/"
          className="hover:text-ink transition-colors"
        >
          Home
        </Link>
        <span className="opacity-40">/</span>
        <Link
          to={`/category/${getCategorySlug(item.Category)}`}
          className="hover:text-[#2F6FED] hover:underline transition-colors"
        >
          {item.Category}
        </Link>
        <span className="opacity-40">/</span>
        <span className="truncate max-w-[200px] sm:max-w-md text-ink">
          {item.Title}
        </span>
      </nav>

      {/* Main Item Detail Hero Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Left Column: Hero Image with Apple3DCard treatment (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <Apple3DCard className="w-full rounded-2xl">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-surface-elevated border border-borderline group">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImageIndex}
                  src={item.Images[activeImageIndex] || item.Images[0]}
                  alt={`${item.Title} - Photo ${activeImageIndex + 1}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`h-full w-full object-cover transition-all duration-300 ${
                    isSold ? 'grayscale contrast-125 opacity-70' : ''
                  }`}
                />
              </AnimatePresence>

              {/* Prev / Next navigation arrows if multiple images */}
              {item.Images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((prev) => (prev - 1 + item.Images.length) % item.Images.length);
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 hover:bg-black/85 transition-all shadow-md"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((prev) => (prev + 1) % item.Images.length);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 hover:bg-black/85 transition-all shadow-md"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  {/* Dot Indicators */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur-md">
                    {item.Images.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex(idx);
                        }}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === activeImageIndex
                            ? 'w-4 bg-[#2F6FED]'
                            : 'w-1.5 bg-white/60 hover:bg-white'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Animated SOLD Ribbon Stamp if sold */}
              {isSold && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                  <motion.div
                    initial={{ scale: 2, rotate: -25, opacity: 0 }}
                    animate={{ scale: 1, rotate: -15, opacity: 1 }}
                    transition={POP_SPRING}
                    className="rounded-2xl border-4 border-[#D64545] bg-[#D64545]/95 px-6 py-2 font-display text-2xl sm:text-3xl font-black uppercase tracking-widest text-white shadow-2xl drop-shadow-lg"
                  >
                    SOLD
                  </motion.div>
                </div>
              )}
            </div>
          </Apple3DCard>

          {/* Interactive Thumbnail Strip if multiple images */}
          {item.Images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
              {item.Images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 overflow-hidden rounded-xl border transition-all ${
                    idx === activeImageIndex
                      ? 'border-[#2F6FED] ring-2 ring-[#2F6FED] scale-105 shadow-sm'
                      : 'border-borderline opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${item.Title} thumbnail ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Bento-Style Info Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-borderline bg-surface p-6 sm:p-8 space-y-6 shadow-xs">
            {/* Condition & Category Chips Grouped Together */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider bg-surface-elevated text-ink-secondary border border-borderline">
                {item.Category}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider border shadow-xs ${
                  CONDITION_STYLES[item.Condition]
                }`}
              >
                {item.Condition.toUpperCase()} CONDITION
              </span>
              <span className="ml-auto flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink-muted">
                <Eye className="h-3 w-3" />
                {item.ViewCount} views
              </span>
            </div>

            {/* Title & Oversized Display Price */}
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-body leading-snug">
                {item.Title}
              </h1>

              {/* Oversized Poppins Display Price */}
              <div className="flex items-baseline gap-3 pt-1">
                <span className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-ink">
                  ${item.Price}
                </span>
                <span className="text-xs uppercase tracking-wider text-ink-muted">
                  fixed campus peer price
                </span>
              </div>
            </div>

            {/* Description & Campus Notes */}
            <div className="border-t border-borderline pt-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-2">
                Description & Campus Notes
              </h2>
              <p className="text-xs sm:text-sm text-ink leading-relaxed whitespace-pre-line font-body">
                {item.Description}
              </p>
            </div>

            {/* Seller Sub-Card with Rating & Verified Badge */}
            <div className="rounded-xl border border-borderline bg-surface-base p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={seller?.AvatarSeed || ''}
                    alt={seller?.Name}
                    className="h-10 w-10 rounded-full object-cover border border-borderline"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-ink">
                        {seller?.Name || 'Campus Peer'}
                      </span>
                      {seller?.IsVerified && (
                        <span title="Verified Student" className="text-[#2F6FED]">
                          <ShieldCheck className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-ink-muted">{seller?.Role}</p>
                  </div>
                </div>

                {seller && (
                  <div className="text-right">
                    <RatingStars value={seller.Rating} size={12} showScore count={seller.RatingCount} />
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar: AMBER #F2994A CTA Buttons */}
            <div className="pt-2">
              {isOwnListing ? (
                /* SELLER VIEW (OWN ITEM) */
                <div className="space-y-3">
                  <div className="rounded-xl border border-borderline bg-surface-base p-3 text-center text-xs font-medium text-ink-muted">
                    This is your listing. You can manage status or mark it as sold once handed off.
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {!isSold ? (
                      <button
                        type="button"
                        onClick={() => setShowSoldModal(true)}
                        className="flex items-center justify-center gap-2 rounded-full bg-[#F2994A] py-3 text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#10131A] shadow-sm hover:bg-[#D97B2B] transition-colors"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Mark Sold</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-2 rounded-full bg-[#E24C4B] py-3 text-xs font-semibold text-white">
                        Listing Sold
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowEditStubModal(true)}
                      className="flex items-center justify-center gap-2 rounded-full border border-borderline bg-surface py-3 text-xs sm:text-sm font-semibold uppercase tracking-wider text-ink hover:bg-surface-elevated"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Edit Listing</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* BUYER VIEW: Dominant AMBER #F2994A CTA Pop */
                <div className="flex items-center gap-3">
                  {!isSold ? (
                    <motion.button
                      type="button"
                      disabled={isStartingChat}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleStartChat}
                      className="flex-1 flex items-center justify-center gap-2 rounded-full bg-[#F2994A] py-3.5 text-sm font-semibold text-[#10131A] shadow-sm transition-all hover:bg-[#D97B2B] active:scale-95 disabled:opacity-50"
                    >
                      {isStartingChat ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#10131A] border-t-transparent" />
                          Connecting...
                        </span>
                      ) : (
                        <>
                          <MessageSquare className="h-4 w-4" />
                          <span>Chat with Seller</span>
                        </>
                      )}
                    </motion.button>
                  ) : (
                    <div className="w-full flex items-center justify-center gap-2 rounded-full bg-[#E24C4B] py-3.5 text-sm font-semibold text-white shadow-sm">
                      This item has been sold
                    </div>
                  )}

                  {/* Wishlist Heart Toggle Button */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.92 }}
                    transition={POP_SPRING}
                    onClick={() => toggleWishlist(item.Item_ID)}
                    aria-label={isFav ? 'Remove from saved' : 'Save item'}
                    className={`flex h-12 w-12 items-center justify-center rounded-full border transition-colors ${
                      isFav
                        ? 'border-[#2F6FED] bg-[#2F6FED]/10 text-[#2F6FED] dark:text-[#4F8CFF]'
                        : 'border-borderline bg-surface text-ink-secondary hover:text-ink'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${isFav ? 'fill-current' : ''}`} />
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Similar Items Row */}
      {similarItems.length > 0 && (
        <div className="pt-8 border-t border-borderline">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-bold text-ink">
              Similar items in {item.Category}
            </h3>
            <Link
              to={`/?category=${encodeURIComponent(item.Category)}`}
              className="text-xs font-semibold uppercase tracking-wider text-ink-muted hover:text-ink"
            >
              See all
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {similarItems.map((sim) => (
              <Link
                key={sim.Item_ID}
                to={`/item/${sim.Item_ID}`}
                className="group rounded-2xl border border-borderline bg-surface p-3 transition-all hover:border-ink-secondary/30 shadow-xs"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-xl bg-surface-elevated">
                  <img
                    src={sim.Images[0]}
                    alt={sim.Title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="mt-2.5 space-y-1">
                  <h4 className="truncate text-xs font-semibold text-ink">
                    {sim.Title}
                  </h4>
                  <span className="block font-display text-base font-bold text-ink">
                    ${sim.Price}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: Mark as Sold */}
      <AnimatePresence>
        {showSoldModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              variants={MODAL_BACKDROP_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={() => setShowSoldModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              variants={MODAL_CONTENT_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative z-10 w-full max-w-md rounded-3xl border border-borderline bg-surface p-6 shadow-2xl"
            >
              <h3 className="font-display text-lg font-bold text-ink">
                Mark "{item.Title}" as Sold?
              </h3>
              <p className="mt-2 text-xs text-ink-muted leading-relaxed">
                Marking this item as sold will update its status across Campus Bazaar, remove it from public search, and allow both you and the buyer to exchange peer ratings.
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSoldModal(false)}
                  className="rounded-xl border border-borderline px-4 py-2 text-xs font-semibold text-ink hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmMarkSold}
                  className="rounded-xl bg-[#12A150] px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-[#12A150]/90"
                >
                  Confirm Deal Closed
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DEAL CLOSED SUCCESS ANIMATION OVERLAY */}
      <AnimatePresence>
        {dealClosedStamp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={POP_SPRING}
              className="flex flex-col items-center gap-3 rounded-3xl border-2 border-[#12A150] bg-surface-base/95 p-8 text-center text-ink shadow-2xl backdrop-blur-xl"
            >
              <Sparkles className="h-12 w-12 text-[#12A150] animate-pulse" />
              <div className="rounded-xl bg-[#12A150] px-4 py-1 text-xs font-black uppercase tracking-widest text-white">
                Deal Closed!
              </div>
              <p className="text-xs text-ink-muted">
                Item marked as SOLD. Status updated across campus!
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT LISTING STUB MODAL */}
      <AnimatePresence>
        {showEditStubModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              variants={MODAL_BACKDROP_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={() => setShowEditStubModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              variants={MODAL_CONTENT_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative z-10 w-full max-w-sm rounded-3xl border border-borderline bg-surface p-6 shadow-2xl text-center"
            >
              <h3 className="font-display text-base font-bold text-ink">
                Edit Campus Listing
              </h3>
              <p className="mt-2 text-xs text-ink-muted">
                Listing editor stub. Price and description can be updated directly while item status is AVAILABLE.
              </p>
              <button
                type="button"
                onClick={() => setShowEditStubModal(false)}
                className="mt-5 w-full rounded-xl bg-[#2F6FED] py-2.5 text-xs font-semibold text-white hover:bg-[#1B4FC4]"
              >
                Close Editor
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}