// src/components/layout/AccountMenu.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Package,
  MessageSquare,
  Heart,
  History,
  LogOut,
  ShieldCheck,
  Star,
  Users,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';
import { DRAWER_VARIANTS } from '../../lib/motion';
import RatingStars from '../common/RatingStars';
import ThemeToggle from '../common/ThemeToggle';

interface AccountMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabKey = 'listings' | 'chats' | 'saved' | 'history';

export default function AccountMenu({ isOpen, onClose }: AccountMenuProps) {
  const { user, logout, switchUser, demoUsers } = useAuth();
  const {
    items,
    chatSessions,
    messages,
    wishlist,
    toggleWishlist,
    ratings,
    markItemSold,
  } = useMarket();
  const [activeTab, setActiveTab] = useState<TabKey>('listings');
  const navigate = useNavigate();

  if (!user) return null;

  const myItems = items.filter((item) => item.Seller_ID === user.User_ID);
  const mySessions = chatSessions.filter(
    (s) => s.Buyer_ID === user.User_ID || s.Seller_ID === user.User_ID
  );
  const mySavedItems = items.filter((item) =>
    wishlist.some((w) => w.User_ID === user.User_ID && w.Item_ID === item.Item_ID)
  );
  // Sold items involving user (as seller or winning buyer)
  const historyItems = items.filter(
    (item) =>
      item.Status === 'SOLD' &&
      (item.Seller_ID === user.User_ID || item.WinningBuyer_ID === user.User_ID)
  );

  async function handleLogout() {
    onClose();
    await logout();
    navigate('/');
  }

  function handleNavigateToItem(itemId: string) {
    onClose();
    navigate(`/item/${itemId}`);
  }

  function handleNavigateToChat(sessionId: string) {
    onClose();
    navigate(`/chat/${sessionId}`);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            variants={DRAWER_VARIANTS}
            initial="closed"
            animate="open"
            exit="closed"
            className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-[#09090b]"
          >
            {/* Drawer Header with Student Identity & Verification */}
            <div className="border-b border-black/8 p-5 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={user.AvatarSeed}
                    alt={user.Name}
                    className="h-12 w-12 rounded-2xl object-cover ring-2 ring-purple-500/30"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="font-display text-base font-bold text-ink">
                        {user.Name}
                      </h2>
                      {user.IsVerified && (
                        <span
                          title="Verified Campus Student"
                          className="flex items-center text-emerald-600 dark:text-emerald-400"
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-muted">{user.InstitutionalEmail}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <RatingStars value={user.Rating} size={13} showScore count={user.RatingCount} />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close menu"
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-ink-muted hover:bg-black/5 hover:text-ink dark:hover:bg-white/5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Demo User Switcher */}
              <div className="mt-4 rounded-xl border border-purple-500/20 bg-purple-500/5 p-2.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    Quick Role / User Switcher:
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {demoUsers.map((u) => {
                    const isSelected = u.User_ID === user.User_ID;
                    return (
                      <button
                        key={u.User_ID}
                        type="button"
                        onClick={() => switchUser(u.User_ID)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-white/80 text-ink hover:bg-purple-100 dark:bg-white/10 dark:hover:bg-white/20'
                        }`}
                      >
                        {u.Name.split(' ')[0]} {isSelected ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Amazon-style Tabs */}
            <div className="flex border-b border-black/8 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.02]">
              <button
                type="button"
                onClick={() => setActiveTab('listings')}
                className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors border-b-2 ${
                  activeTab === 'listings'
                    ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                <Package className="h-3.5 w-3.5" />
                Listings ({myItems.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('chats')}
                className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors border-b-2 ${
                  activeTab === 'chats'
                    ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Chats ({mySessions.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('saved')}
                className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors border-b-2 ${
                  activeTab === 'saved'
                    ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                <Heart className="h-3.5 w-3.5" />
                Saved ({mySavedItems.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors border-b-2 ${
                  activeTab === 'history'
                    ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                <History className="h-3.5 w-3.5" />
                History ({historyItems.length})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* LISTINGS TAB */}
              {activeTab === 'listings' && (
                <div className="space-y-2.5">
                  {myItems.length === 0 ? (
                    <div className="py-12 text-center text-xs text-ink-muted">
                      You haven't posted any items yet.
                    </div>
                  ) : (
                    myItems.map((item) => (
                      <div
                        key={item.Item_ID}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-black/8 bg-surface-elevated p-3 dark:border-white/10"
                      >
                        <img
                          src={item.Images[0]}
                          alt={item.Title}
                          className="h-12 w-12 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-xs font-semibold text-ink">
                            {item.Title}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-display text-sm font-bold text-sell">
                              ${item.Price}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                item.Status === 'AVAILABLE'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-slate-500/10 text-slate-500 line-through'
                              }`}
                            >
                              {item.Status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {item.Status === 'AVAILABLE' && (
                            <button
                              type="button"
                              onClick={() => markItemSold(item.Item_ID)}
                              className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-700"
                            >
                              Mark Sold
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleNavigateToItem(item.Item_ID)}
                            className="rounded-lg border border-black/10 p-1.5 text-ink-muted hover:text-ink dark:border-white/10"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* CHATS TAB */}
              {activeTab === 'chats' && (
                <div className="space-y-2">
                  {mySessions.length === 0 ? (
                    <div className="py-12 text-center text-xs text-ink-muted">
                      No message threads found.
                    </div>
                  ) : (
                    mySessions.map((session) => {
                      const sessionItem = items.find((i) => i.Item_ID === session.Item_ID);
                      const sessionMsgs = messages
                        .filter((m) => m.Session_ID === session.Session_ID)
                        .sort(
                          (a, b) =>
                            new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime()
                        );
                      const lastMsg = sessionMsgs[0];
                      const isSeller = session.Seller_ID === user.User_ID;

                      return (
                        <button
                          key={session.Session_ID}
                          type="button"
                          onClick={() => handleNavigateToChat(session.Session_ID)}
                          className="flex w-full items-start gap-3 rounded-2xl border border-black/8 bg-surface-elevated p-3 text-left transition-colors hover:border-purple-500/30 dark:border-white/10"
                        >
                          <img
                            src={sessionItem?.Images[0]}
                            alt={sessionItem?.Title}
                            className="h-11 w-11 rounded-xl object-cover flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="truncate text-xs font-semibold text-ink">
                                {sessionItem?.Title || 'Campus Listing'}
                              </span>
                              <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">
                                {isSeller ? 'Selling' : 'Buying'}
                              </span>
                            </div>
                            <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">
                              {lastMsg ? lastMsg.Text : 'Chat thread initiated'}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {/* SAVED ITEMS TAB */}
              {activeTab === 'saved' && (
                <div className="space-y-2">
                  {mySavedItems.length === 0 ? (
                    <div className="py-12 text-center text-xs text-ink-muted">
                      Your wishlist is empty. Tap the heart on any card to save it.
                    </div>
                  ) : (
                    mySavedItems.map((item) => (
                      <div
                        key={item.Item_ID}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-black/8 bg-surface-elevated p-3 dark:border-white/10"
                      >
                        <img
                          src={item.Images[0]}
                          alt={item.Title}
                          className="h-12 w-12 rounded-xl object-cover cursor-pointer"
                          onClick={() => handleNavigateToItem(item.Item_ID)}
                        />
                        <div
                          className="min-w-0 flex-1 cursor-pointer"
                          onClick={() => handleNavigateToItem(item.Item_ID)}
                        >
                          <h4 className="truncate text-xs font-semibold text-ink">
                            {item.Title}
                          </h4>
                          <span className="font-display text-sm font-bold text-sell">
                            ${item.Price}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleWishlist(item.Item_ID)}
                          title="Remove from saved"
                          className="rounded-lg p-2 text-ink-muted hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* HISTORY TAB */}
              {activeTab === 'history' && (
                <div className="space-y-2.5">
                  {historyItems.length === 0 ? (
                    <div className="py-12 text-center text-xs text-ink-muted">
                      No completed deals in your history yet.
                    </div>
                  ) : (
                    historyItems.map((item) => {
                      const userRatingGiven = ratings.find(
                        (r) => r.RaterUserID === user.User_ID
                      );

                      return (
                        <div
                          key={item.Item_ID}
                          className="rounded-2xl border border-black/8 bg-surface-elevated p-3 dark:border-white/10"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={item.Images[0]}
                                alt={item.Title}
                                className="h-10 w-10 rounded-xl object-cover grayscale"
                              />
                              <div>
                                <h4 className="truncate text-xs font-semibold text-ink">
                                  {item.Title}
                                </h4>
                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                  Deal Closed • ${item.Price}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center justify-between border-t border-black/5 pt-2 dark:border-white/5">
                            <span className="text-[11px] text-ink-muted">Peer Feedback:</span>
                            {userRatingGiven ? (
                              <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-500">
                                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                                <span>Rated ({userRatingGiven.Score}★)</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleNavigateToItem(item.Item_ID)}
                                className="text-[11px] font-semibold text-purple-600 hover:underline dark:text-purple-400"
                              >
                                Rate counterparty now →
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Footer with Single Theme Toggle and Logout */}
            <div className="border-t border-black/8 p-4 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-ink-muted">
                  <span>Theme:</span>
                  <ThemeToggle />
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-xl bg-black/5 px-4 py-2 text-xs font-semibold text-ink transition-colors hover:bg-red-500/10 hover:text-red-500 dark:bg-white/5 dark:hover:bg-red-500/15"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
