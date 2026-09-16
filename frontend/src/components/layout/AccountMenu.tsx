// src/components/layout/AccountMenu.tsx
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
  ChevronRight,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';
import { DRAWER_VARIANTS } from '../../lib/motion';
import RatingStars from '../common/RatingStars';

interface AccountMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountMenu({ isOpen, onClose }: AccountMenuProps) {
  const { user, logout } = useAuth();
  const { items, chatSessions, wishlist } = useMarket();
  const navigate = useNavigate();

  if (!user) return null;

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

  async function handleLogout() {
    onClose();
    await logout();
    navigate('/');
  }

  function handleNavigate(route: string) {
    onClose();
    navigate(route);
  }

  const MENU_ITEMS = [
    {
      id: 'listings',
      label: 'My Listings',
      count: myItems.length,
      icon: Package,
      path: '/profile/listings',
    },
    {
      id: 'chats',
      label: 'Messages & Chats',
      count: mySessions.length,
      icon: MessageSquare,
      path: '/profile/chats',
    },
    {
      id: 'saved',
      label: 'Saved Items',
      count: mySavedItems.length,
      icon: Heart,
      path: '/profile/saved',
    },
    {
      id: 'history',
      label: 'Transaction History',
      count: historyItems.length,
      icon: History,
      path: '/profile/history',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Lightweight Launcher Drawer Panel */}
          <motion.div
            variants={DRAWER_VARIANTS}
            initial="closed"
            animate="open"
            exit="closed"
            className="relative z-10 flex h-full w-full max-w-sm flex-col justify-between border-l border-borderline bg-surface shadow-2xl"
          >
            {/* Top Section */}
            <div>
              {/* Drawer Header with Student Identity */}
              <div className="border-b border-borderline p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.AvatarSeed}
                      alt={user.Name}
                      className="h-12 w-12 rounded-2xl object-cover ring-2 ring-[#2F6FED]/30"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h2 className="font-display text-base font-bold text-ink">
                          {user.Name}
                        </h2>
                        {user.IsVerified && (
                          <span
                            title="Verified Campus Student"
                            className="flex items-center text-[#2F6FED]"
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
              </div>

              {/* Launcher Navigation Links */}
              <div className="p-4 space-y-2">
                <span className="block px-2 text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-2">
                  Marketplace Launcher
                </span>

                {MENU_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavigate(item.path)}
                      className="group flex w-full items-center justify-between rounded-2xl border border-borderline bg-surface-base/60 p-3.5 text-left transition-all hover:border-[#2F6FED]/40 hover:bg-surface-elevated hover:shadow-xs active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface border border-borderline text-[#2F6FED] group-hover:scale-105 transition-transform">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-semibold text-ink group-hover:text-[#2F6FED] transition-colors">
                          {item.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-surface border border-borderline px-2 py-0.5 text-[10px] font-bold text-ink-muted">
                          {item.count}
                        </span>
                        <ChevronRight className="h-4 w-4 text-ink-muted group-hover:translate-x-0.5 group-hover:text-ink transition-all" />
                      </div>
                    </button>
                  );
                })}

                {/* Primary Quick CTA: Post an Item in Amber */}
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => handleNavigate('/sell/new')}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F2994A] py-3 text-xs font-semibold text-[#10131A] shadow-sm transition-all hover:bg-[#D97B2B] active:scale-95"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                    <span>Post a New Item</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer with Sign Out */}
            <div className="border-t border-borderline p-5">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-black/5 px-4 py-2.5 text-xs font-semibold text-ink transition-colors hover:bg-red-500/10 hover:text-red-500 dark:bg-white/5 dark:hover:bg-red-500/15"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
