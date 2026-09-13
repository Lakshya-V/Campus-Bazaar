// src/pages/ListingDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ShieldCheck,
  Heart,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Eye,
  Calendar,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { useAuth } from '../context/AuthContext';
import { Apple3DCard } from '../components/common/Apple3DCard';
import RatingStars from '../components/common/RatingStars';
import { POP_SPRING, MODAL_BACKDROP_VARIANTS, MODAL_CONTENT_VARIANTS } from '../lib/motion';

const CONDITION_STYLES = {
  new: 'bg-emerald-700 text-white border-emerald-800 dark:bg-emerald-500 dark:text-emerald-950 dark:border-emerald-400',
  good: 'bg-slate-700 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:border-slate-300',
  fair: 'bg-amber-700 text-white border-amber-800 dark:bg-amber-400 dark:text-amber-950 dark:border-amber-300',
};

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  if (!item) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="rounded-3xl border border-black/10 bg-white/80 p-8 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-[#09090b]/80">
          <AlertCircle className="mx-auto h-12 w-12 text-purple-600 dark:text-purple-400" />
          <h2 className="mt-4 font-display text-xl font-bold text-ink">
            Listing Not Found
          </h2>
          <p className="mt-2 text-xs text-ink-muted">
            This campus listing may have been completed or removed.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-700"
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

  // Similar items in the same category excluding this item
  const similarItems = items
    .filter((i) => i.Category === currentItem.Category && i.Item_ID !== currentItem.Item_ID && i.Status === 'AVAILABLE')
    .slice(0, 4);

  function handleStartChat() {
    setIsStartingChat(true);
    setTimeout(() => {
      const session = startChatSession(currentItem.Item_ID, currentItem.Seller_ID);
      setIsStartingChat(false);
      navigate(`/chat/${session.Session_ID}`);
    }, 500);
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
      {/* Breadcrumb: Home > [Category] > [Item Title] */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-muted">
        <Link
          to="/"
          className="hover:text-purple-600 transition-colors font-medium dark:hover:text-purple-400"
        >
          Home
        </Link>
        <ChevronRight className="h-3 w-3 opacity-50" />
        <Link
          to={`/?category=${encodeURIComponent(item.Category)}`}
          className="hover:text-purple-600 transition-colors font-medium dark:hover:text-purple-400"
        >
          {item.Category}
        </Link>
        <ChevronRight className="h-3 w-3 opacity-50" />
        <span className="truncate max-w-[200px] sm:max-w-md font-semibold text-ink">
          {item.Title}
        </span>
      </nav>

      {/* Main Item Detail Hero Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Left Column: Hero Image with Apple3DCard treatment (7 cols) */}
        <div className="lg:col-span-7">
          <Apple3DCard className="w-full">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-surface-elevated">
              <img
                src={item.Images[0]}
                alt={item.Title}
                className={`h-full w-full object-cover transition-all duration-300 ${
                  isSold ? 'grayscale contrast-125 opacity-70' : ''
                }`}
              />

              {/* Animated SOLD Ribbon Stamp if sold */}
              {isSold && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                  <motion.div
                    initial={{ scale: 2, rotate: -25, opacity: 0 }}
                    animate={{ scale: 1, rotate: -15, opacity: 1 }}
                    transition={POP_SPRING}
                    className="rounded-2xl border-4 border-red-500 bg-red-600/90 px-6 py-2 font-display text-2xl sm:text-3xl font-black uppercase tracking-widest text-white shadow-2xl drop-shadow-lg"
                  >
                    SOLD
                  </motion.div>
                </div>
              )}

              {/* Condition Badge in Image Corner */}
              <span
                className={`absolute bottom-4 left-4 rounded-full px-3 py-1 text-xs font-semibold uppercase shadow-md backdrop-blur-md ${
                  CONDITION_STYLES[item.Condition]
                }`}
              >
                {item.Condition} Condition
              </span>

              {/* Views badge */}
              <span className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                <Eye className="h-3 w-3" />
                {item.ViewCount} views
              </span>
            </div>
          </Apple3DCard>
        </div>

        {/* Right Column: Details & Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-black/8 bg-white/80 p-6 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-[#09090b]/80 space-y-5">
            {/* Category & Status */}
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
                {item.Category}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-ink-muted">
                <Calendar className="h-3 w-3" />
                {new Date(item.PostedAt).toLocaleDateString()}
              </span>
            </div>

            {/* Title & Price */}
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                {item.Title}
              </h1>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="font-display text-3xl font-extrabold tabular-nums text-sell">
                  ${item.Price}
                </span>
                <span className="text-xs text-ink-muted">Fixed campus peer price</span>
              </div>
            </div>

            {/* Description */}
            <div className="border-t border-black/8 pt-4 dark:border-white/10">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                Description & Campus Notes
              </h2>
              <p className="text-xs sm:text-sm text-ink leading-relaxed whitespace-pre-line">
                {item.Description}
              </p>
            </div>

            {/* Seller Information Block */}
            <div className="rounded-2xl border border-black/8 bg-surface-elevated p-3.5 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={seller?.AvatarSeed || ''}
                    alt={seller?.Name}
                    className="h-10 w-10 rounded-xl object-cover ring-1 ring-purple-500/30"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-ink">
                        {seller?.Name || 'Campus Peer'}
                      </span>
                      {seller?.IsVerified && (
                        <span title="Verified Student" className="text-emerald-500">
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

            {/* Action Bar (Buyer vs Seller Contextual Awareness) */}
            <div className="pt-2">
              {isOwnListing ? (
                /* SELLER VIEW (OWN ITEM) */
                <div className="space-y-3">
                  <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-2.5 text-center text-xs font-medium text-purple-700 dark:text-purple-300">
                    This is your listing. You can manage status or mark it as sold once you hand it off.
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {!isSold ? (
                      <button
                        type="button"
                        onClick={() => setShowSoldModal(true)}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs sm:text-sm font-semibold text-white shadow-md hover:bg-emerald-700 transition-colors"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Mark as Sold</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-2 rounded-2xl bg-slate-500/20 py-3 text-xs font-semibold text-slate-500">
                        Listing Closed (Sold)
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowEditStubModal(true)}
                      className="flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white/70 py-3 text-xs sm:text-sm font-semibold text-ink hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Edit Listing</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* BUYER VIEW (ANOTHER STUDENT'S ITEM) */
                <div className="flex items-center gap-3">
                  {!isSold ? (
                    <motion.button
                      type="button"
                      disabled={isStartingChat}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleStartChat}
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-purple-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 transition-all hover:bg-purple-700 disabled:opacity-50"
                    >
                      {isStartingChat ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
                    <div className="flex-1 rounded-2xl border border-black/10 bg-black/5 py-3 text-center text-xs font-semibold text-ink-muted dark:border-white/10 dark:bg-white/5">
                      This item has been sold to another peer.
                    </div>
                  )}

                  {/* Wishlist Heart Toggle Button */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.9 }}
                    transition={POP_SPRING}
                    onClick={() => toggleWishlist(item.Item_ID)}
                    aria-label={isFav ? 'Remove from saved' : 'Save item'}
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors ${
                      isFav
                        ? 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                        : 'border-black/10 bg-white/70 text-ink hover:bg-white dark:border-white/10 dark:bg-white/5'
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
        <div className="pt-8 border-t border-black/8 dark:border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-bold text-ink">
              Similar items in {item.Category}
            </h3>
            <Link
              to={`/?category=${encodeURIComponent(item.Category)}`}
              className="text-xs font-semibold text-purple-600 hover:underline dark:text-purple-400"
            >
              See all
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {similarItems.map((sim) => (
              <Link
                key={sim.Item_ID}
                to={`/item/${sim.Item_ID}`}
                className="group rounded-2xl border border-black/8 bg-surface-elevated p-3 transition-all hover:border-purple-500/30 hover:shadow-md dark:border-white/10"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-xl bg-black/5 dark:bg-white/5">
                  <img
                    src={sim.Images[0]}
                    alt={sim.Title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="mt-2.5">
                  <h4 className="truncate text-xs font-semibold text-ink group-hover:text-purple-600 dark:group-hover:text-purple-400">
                    {sim.Title}
                  </h4>
                  <span className="mt-1 block font-display text-sm font-bold text-sell">
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
              className="relative z-10 w-full max-w-md rounded-3xl border border-black/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#09090b]"
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
                  className="rounded-xl border border-black/10 px-4 py-2 text-xs font-semibold text-ink hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmMarkSold}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-emerald-700"
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
              className="flex flex-col items-center gap-3 rounded-3xl border-2 border-emerald-500 bg-black/90 p-8 text-center text-white shadow-2xl backdrop-blur-xl"
            >
              <Sparkles className="h-12 w-12 text-emerald-400 animate-pulse" />
              <div className="rounded-xl bg-emerald-600 px-4 py-1 text-xs font-black uppercase tracking-widest text-white">
                Deal Closed!
              </div>
              <p className="text-xs text-slate-300">
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
              className="relative z-10 w-full max-w-sm rounded-3xl border border-black/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#09090b] text-center"
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
                className="mt-5 w-full rounded-xl bg-purple-600 py-2.5 text-xs font-semibold text-white hover:bg-purple-700"
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