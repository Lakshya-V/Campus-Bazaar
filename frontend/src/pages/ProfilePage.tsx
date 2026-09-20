// src/pages/ProfilePage.tsx
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  MessageSquare,
  Heart,
  History,
  ShieldCheck,
  Plus,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Star,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { useCartSwipe } from '../context/CartSwipeContext';
import RatingStars from '../components/common/RatingStars';
import ListingCard from '../components/listings/ListingCard';

type TabKey = 'listings' | 'chats' | 'saved' | 'history';

export default function ProfilePage() {
  const { user } = useAuth();
  const { tab = 'listings' } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const { triggerCartSwipe } = useCartSwipe();

  const {
    items,
    chatSessions,
    messages,
    wishlist,
    getUser,
    markItemSold,
    addRating,
    ratings,
  } = useMarket();

  const [ratingInputState, setRatingInputState] = useState<Record<string, number>>({});
  const [ratedSuccess, setRatedSuccess] = useState<Record<string, boolean>>({});

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="text-sm text-ink-muted">Please sign in to view your profile.</p>
        <Link
          to="/"
          className="mt-4 inline-block rounded-xl bg-[#2F6FED] px-5 py-2.5 text-xs font-semibold text-white"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  // Active tab normalization
  const validTabs: TabKey[] = ['listings', 'chats', 'saved', 'history'];
  const activeTab: TabKey = validTabs.includes(tab as TabKey) ? (tab as TabKey) : 'listings';

  // Data filters
  const myItems = items.filter((item) => item.Seller_ID === user.User_ID);
  const mySessions = chatSessions.filter(
    (s) => s.Buyer_ID === user.User_ID || s.Seller_ID === user.User_ID
  );
  const mySavedItems = items.filter((item) =>
    wishlist.some((w) => w.User_ID === user.User_ID && w.Item_ID === item.Item_ID)
  );
  const historyItems = items.filter(
    (item) =>
      item.Status === 'SOLD' &&
      (item.Seller_ID === user.User_ID || item.WinningBuyer_ID === user.User_ID)
  );

  function handleTabChange(nextTab: TabKey) {
    navigate(`/profile/${nextTab}`);
  }

  function handleOpenItem(itemId: string) {
    triggerCartSwipe(`/item/${itemId}`, {
      message: 'Loading item details...',
      duration: 750,
    });
  }

  function handleOpenChat(sessionId: string) {
    triggerCartSwipe(`/chat/${sessionId}`, {
      message: 'Connecting to student chat...',
      duration: 750,
    });
  }

  function handleRateCounterparty(counterpartyId: string, itemId: string, score: number) {
    addRating('', counterpartyId, score, 'Smooth peer hand-off');
    setRatedSuccess((prev) => ({ ...prev, [itemId]: true }));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Back Navigation */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Bazaar
        </Link>
      </div>

      {/* Profile Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-borderline bg-surface p-6 sm:p-8 shadow-sm backdrop-blur-md">
        {/* Subtle decorative background gradient wash */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#2F6FED]/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-[#F2994A]/10 blur-3xl" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative">
              <img
                src={user.AvatarSeed}
                alt={user.Name}
                className="h-18 w-18 sm:h-20 sm:w-20 rounded-2xl object-cover ring-2 ring-[#2F6FED]/30 shadow-md"
              />
              {user.IsVerified && (
                <span
                  title="Verified Campus Student"
                  className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#2F6FED] text-white shadow-md ring-2 ring-surface"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                  {user.Name}
                </h1>
                <span className="rounded-full bg-[#2F6FED]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#2F6FED] dark:text-[#4F8CFF]">
                  Verified Student
                </span>
              </div>
              <p className="mt-0.5 text-xs text-ink-muted font-body">
                {user.InstitutionalEmail}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <RatingStars value={user.Rating} size={15} showScore count={user.RatingCount} />
              </div>
            </div>
          </div>

          {/* Quick Primary CTA: Post an Item in Amber */}
          <Link
            to="/sell/new"
            className="flex items-center gap-2 rounded-xl bg-[#F2994A] px-5 py-3 text-xs sm:text-sm font-semibold text-[#10131A] shadow-sm transition-all hover:bg-[#D97B2B] active:scale-95"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            <span>Post a Listing</span>
          </Link>
        </div>

        {/* Quick Metric Chips */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-borderline/80 pt-5">
          <div className="rounded-2xl border border-borderline/60 bg-surface-base/50 p-3.5 text-center">
            <span className="block font-display text-xl font-bold text-ink">
              {myItems.length}
            </span>
            <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wider">
              My Listings
            </span>
          </div>
          <div className="rounded-2xl border border-borderline/60 bg-surface-base/50 p-3.5 text-center">
            <span className="block font-display text-xl font-bold text-ink">
              {mySessions.length}
            </span>
            <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wider">
              Active Chats
            </span>
          </div>
          <div className="rounded-2xl border border-borderline/60 bg-surface-base/50 p-3.5 text-center">
            <span className="block font-display text-xl font-bold text-ink">
              {mySavedItems.length}
            </span>
            <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wider">
              Saved Items
            </span>
          </div>
          <div className="rounded-2xl border border-borderline/60 bg-surface-base/50 p-3.5 text-center">
            <span className="block font-display text-xl font-bold text-[#1AA260]">
              {historyItems.length}
            </span>
            <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wider">
              Deals Closed
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation Switcher */}
      <div className="flex overflow-x-auto rounded-2xl border border-borderline bg-surface p-1.5 shadow-xs">
        <button
          type="button"
          onClick={() => handleTabChange('listings')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'listings'
              ? 'bg-[#111318] text-white shadow-sm dark:bg-[#F2F3F5] dark:text-[#0D0F12]'
              : 'text-ink-muted hover:text-ink hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Package className="h-4 w-4" />
          <span>My Listings</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === 'listings'
                ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black'
                : 'bg-black/5 text-ink-muted dark:bg-white/10'
            }`}
          >
            {myItems.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('chats')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'chats'
              ? 'bg-[#111318] text-white shadow-sm dark:bg-[#F2F3F5] dark:text-[#0D0F12]'
              : 'text-ink-muted hover:text-ink hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Messages & Chats</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === 'chats'
                ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black'
                : 'bg-black/5 text-ink-muted dark:bg-white/10'
            }`}
          >
            {mySessions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('saved')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'saved'
              ? 'bg-[#111318] text-white shadow-sm dark:bg-[#F2F3F5] dark:text-[#0D0F12]'
              : 'text-ink-muted hover:text-ink hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Heart className="h-4 w-4" />
          <span>Saved Items</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === 'saved'
                ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black'
                : 'bg-black/5 text-ink-muted dark:bg-white/10'
            }`}
          >
            {mySavedItems.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('history')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'history'
              ? 'bg-[#111318] text-white shadow-sm dark:bg-[#F2F3F5] dark:text-[#0D0F12]'
              : 'text-ink-muted hover:text-ink hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Transaction History</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === 'history'
                ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black'
                : 'bg-black/5 text-ink-muted dark:bg-white/10'
            }`}
          >
            {historyItems.length}
          </span>
        </button>
      </div>

      {/* Main Tab Content Views */}
      <AnimatePresence mode="wait">
        {/* ═════════════════════════════════════════════════════════════
            1. MY LISTINGS FULL VIEW
            ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'listings' && (
          <motion.div
            key="tab-listings"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-ink">
                  My Campus Listings
                </h2>
                <p className="text-xs text-ink-muted">
                  Manage your active items and mark completed campus hand-offs.
                </p>
              </div>
              <Link
                to="/sell/new"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#F2994A] px-4 py-2 text-xs font-semibold text-[#10131A] hover:bg-[#D97B2B]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Item</span>
              </Link>
            </div>

            {myItems.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-borderline bg-surface/50 py-16 text-center">
                <Package className="mx-auto h-12 w-12 text-ink-muted opacity-40 mb-3" />
                <h3 className="font-display text-base font-bold text-ink">
                  No active listings yet
                </h3>
                <p className="mt-1 text-xs text-ink-muted max-w-sm mx-auto">
                  Have textbooks, dorm tech, or gear you no longer need? List it to peers across campus.
                </p>
                <Link
                  to="/sell/new"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#F2994A] px-5 py-2.5 text-xs font-semibold text-[#10131A] hover:bg-[#D97B2B]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Post Your First Item</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {myItems.map((item) => {
                  const isSold = item.Status === 'SOLD';
                  return (
                    <div
                      key={item.Item_ID}
                      className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-borderline bg-surface shadow-xs transition-all hover:border-[#2F6FED]/40 hover:shadow-md"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-surface-base">
                        <img
                          src={item.Images[0]}
                          alt={item.Title}
                          className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                            isSold ? 'grayscale opacity-75' : ''
                          }`}
                        />
                        <span
                          className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md ${
                            isSold
                              ? 'bg-[#E24C4B] text-white'
                              : 'bg-[#1AA260] text-white'
                          }`}
                        >
                          {item.Status}
                        </span>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <h3 className="line-clamp-2 text-sm font-semibold text-ink">
                            {item.Title}
                          </h3>
                          <div className="mt-1.5 flex items-center justify-between">
                            <span className="font-display text-lg font-bold text-ink">
                              ${item.Price}
                            </span>
                            <span className="rounded-full border border-borderline px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                              {item.Category}
                            </span>
                          </div>
                        </div>

                        {/* Seller Action Buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t border-borderline">
                          <button
                            type="button"
                            onClick={() => handleOpenItem(item.Item_ID)}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-borderline bg-surface-base py-2 text-xs font-semibold text-ink transition-colors hover:bg-surface-elevated"
                          >
                            <span>View</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>

                          {!isSold && (
                            <button
                              type="button"
                              onClick={() => markItemSold(item.Item_ID)}
                              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#F2994A] py-2 text-xs font-semibold text-[#10131A] transition-colors hover:bg-[#D97B2B]"
                            >
                              <span>Mark Sold</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ═════════════════════════════════════════════════════════════
            2. CHATS FULL VIEW
            ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'chats' && (
          <motion.div
            key="tab-chats"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div>
              <h2 className="font-display text-xl font-bold text-ink">
                Campus Inquiries & Messages
              </h2>
              <p className="text-xs text-ink-muted">
                Direct peer messages regarding meetups, item condition, and hand-offs.
              </p>
            </div>

            {mySessions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-borderline bg-surface/50 py-16 text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-ink-muted opacity-40 mb-3" />
                <h3 className="font-display text-base font-bold text-ink">
                  No active chat sessions
                </h3>
                <p className="mt-1 text-xs text-ink-muted max-w-sm mx-auto">
                  When you inquire on campus listings or buyers message your items, conversations will appear here.
                </p>
                <Link
                  to="/"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2F6FED] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#1B4FC4]"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Browse Bazaar Items</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {mySessions.map((session) => {
                  const item = items.find((i) => i.Item_ID === session.Item_ID);
                  const otherUserId =
                    session.Buyer_ID === user.User_ID ? session.Seller_ID : session.Buyer_ID;
                  const otherUser = getUser(otherUserId);
                  const sessionMsgs = messages.filter((m) => m.Session_ID === session.Session_ID);
                  const lastMsg = sessionMsgs[sessionMsgs.length - 1];

                  return (
                    <div
                      key={session.Session_ID}
                      onClick={() => handleOpenChat(session.Session_ID)}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-borderline bg-surface p-4 shadow-xs transition-all hover:border-[#2F6FED]/40 hover:bg-surface-elevated/40 cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img
                          src={otherUser?.AvatarSeed}
                          alt={otherUser?.Name || 'Student'}
                          className="h-12 w-12 rounded-xl object-cover ring-1 ring-borderline flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm text-ink truncate">
                              {otherUser?.Name}
                            </span>
                            {otherUser?.IsVerified && (
                              <ShieldCheck className="h-3.5 w-3.5 text-[#2F6FED] flex-shrink-0" />
                            )}
                            <span className="text-[11px] text-ink-muted truncate">
                              · {otherUser?.InstitutionalEmail}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-ink-muted truncate max-w-md">
                            {lastMsg ? lastMsg.Text : 'Start your conversation...'}
                          </p>
                        </div>
                      </div>

                      {/* Linked Item Badge & Action */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-borderline">
                        {item && (
                          <div className="flex items-center gap-2 rounded-xl border border-borderline bg-surface-base px-3 py-1.5">
                            <img
                              src={item.Images[0]}
                              alt={item.Title}
                              className="h-7 w-7 rounded-lg object-cover"
                            />
                            <div className="text-left">
                              <span className="block text-[11px] font-semibold text-ink max-w-[140px] truncate">
                                {item.Title}
                              </span>
                              <span className="block font-display text-[11px] font-bold text-ink">
                                ${item.Price}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-xs font-semibold text-[#2F6FED] group-hover:translate-x-0.5 transition-transform">
                          <span>Open</span>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ═════════════════════════════════════════════════════════════
            3. SAVED ITEMS FULL VIEW
            ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'saved' && (
          <motion.div
            key="tab-saved"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div>
              <h2 className="font-display text-xl font-bold text-ink">
                Saved Wishlist Items
              </h2>
              <p className="text-xs text-ink-muted">
                Items you bookmarked for later consideration or price drops.
              </p>
            </div>

            {mySavedItems.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-borderline bg-surface/50 py-16 text-center">
                <Heart className="mx-auto h-12 w-12 text-ink-muted opacity-40 mb-3" />
                <h3 className="font-display text-base font-bold text-ink">
                  Your saved items list is empty
                </h3>
                <p className="mt-1 text-xs text-ink-muted max-w-sm mx-auto">
                  Click the heart icon on any product card in the marketplace to save it to this collection.
                </p>
                <Link
                  to="/"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2F6FED] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#1B4FC4]"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Explore Listings</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {mySavedItems.map((item) => (
                  <ListingCard key={item.Item_ID} item={item} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ═════════════════════════════════════════════════════════════
            4. TRANSACTION HISTORY FULL VIEW
            ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'history' && (
          <motion.div
            key="tab-history"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div>
              <h2 className="font-display text-xl font-bold text-ink">
                Completed Campus Deals & History
              </h2>
              <p className="text-xs text-ink-muted">
                Verified in-person hand-offs and peer ratings history.
              </p>
            </div>

            {historyItems.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-borderline bg-surface/50 py-16 text-center">
                <History className="mx-auto h-12 w-12 text-ink-muted opacity-40 mb-3" />
                <h3 className="font-display text-base font-bold text-ink">
                  No completed transactions yet
                </h3>
                <p className="mt-1 text-xs text-ink-muted max-w-sm mx-auto">
                  Completed sales and hand-offs with verified peers will show up here along with rating receipts.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {historyItems.map((item) => {
                  const isSeller = item.Seller_ID === user.User_ID;
                  const otherPartyId = isSeller ? item.WinningBuyer_ID : item.Seller_ID;
                  const otherParty = otherPartyId ? getUser(otherPartyId) : null;
                  const existingRating = ratings.find(
                    (r) => r.RatedUserID === otherPartyId && r.RaterUserID === user.User_ID
                  );
                  const isRated = Boolean(existingRating || ratedSuccess[item.Item_ID]);

                  return (
                    <div
                      key={item.Item_ID}
                      className="rounded-2xl border border-borderline bg-surface p-4 sm:p-5 shadow-xs transition-all hover:border-[#2F6FED]/30"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <img
                            src={item.Images[0]}
                            alt={item.Title}
                            className="h-14 w-14 rounded-xl object-cover grayscale opacity-80 ring-1 ring-borderline flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-[#1AA260]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#1AA260]">
                                Deal Closed
                              </span>
                              <span className="text-[11px] text-ink-muted">
                                {isSeller ? 'Sold to peer' : 'Purchased from peer'}
                              </span>
                            </div>
                            <h4 className="mt-0.5 truncate text-sm font-semibold text-ink">
                              {item.Title}
                            </h4>
                            <span className="font-display text-base font-bold text-ink">
                              ${item.Price}
                            </span>
                          </div>
                        </div>

                        {/* Counterparty details */}
                        {otherParty && (
                          <div className="flex items-center gap-2.5 rounded-xl border border-borderline/60 bg-surface-base/60 p-2.5">
                            <img
                              src={otherParty.AvatarSeed}
                              alt={otherParty.Name}
                              className="h-8 w-8 rounded-lg object-cover"
                            />
                            <div className="text-left">
                              <span className="block text-xs font-semibold text-ink">
                                {otherParty.Name}
                              </span>
                              <span className="block text-[10px] text-ink-muted">
                                {otherParty.InstitutionalEmail}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Peer Review Rating Section */}
                      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-borderline pt-3">
                        <span className="text-xs font-medium text-ink-muted">
                          Peer Feedback & Rating:
                        </span>

                        {isRated ? (
                          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F2A93B]">
                            <CheckCircle2 className="h-4 w-4 text-[#1AA260]" />
                            <Star className="h-3.5 w-3.5 fill-[#F2A93B]" />
                            <span>
                              Feedback Recorded ({existingRating?.Score || ratingInputState[item.Item_ID] || 5}★)
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-ink-muted">Rate peer:</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => {
                                    setRatingInputState((prev) => ({ ...prev, [item.Item_ID]: star }));
                                    if (otherPartyId) {
                                      handleRateCounterparty(otherPartyId, item.Item_ID, star);
                                    }
                                  }}
                                  className="p-0.5 text-ink-muted hover:text-[#F2A93B] transition-colors"
                                >
                                  <Star className="h-4 w-4 hover:fill-[#F2A93B]" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}