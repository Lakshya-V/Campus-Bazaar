// src/components/layout/NotificationsDropdown.tsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MessageSquare, ArrowRight } from 'lucide-react';
import { useMarket } from '../../context/MarketContext';
import { POP_SPRING } from '../../lib/motion';

export default function NotificationsDropdown() {
  const { notifications, unreadNotificationCount } = useMarket();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(sessionId: string) {
    setIsOpen(false);
    navigate(`/chat/${sessionId}`);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white/60 text-ink transition-colors hover:border-purple-500/40 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:border-purple-400/40 dark:hover:bg-white/10"
      >
        <Bell className="h-4 w-4" />
        {unreadNotificationCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={POP_SPRING}
            className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-600 px-1 text-[10px] font-bold text-white shadow-md"
          >
            {unreadNotificationCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-black/10 bg-white/95 shadow-2xl backdrop-blur-2xl dark:border-white/15 dark:bg-[#09090b]/95 sm:w-96"
          >
            <div className="flex items-center justify-between border-b border-black/8 px-4 py-3 dark:border-white/10">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <h3 className="font-display text-sm font-semibold text-ink">
                  Recent Messages
                </h3>
              </div>
              {unreadNotificationCount > 0 && (
                <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[11px] font-medium text-purple-600 dark:text-purple-400">
                  {unreadNotificationCount} new
                </span>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-black/5 dark:divide-white/5">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-ink-muted">
                  No active message threads yet.
                </div>
              ) : (
                notifications.slice(0, 5).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleSelect(n.sessionId)}
                    className={`flex w-full items-start gap-3 p-3.5 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                      n.unread
                        ? 'bg-purple-500/5 dark:bg-purple-500/10'
                        : 'bg-transparent'
                    }`}
                  >
                    <img
                      src={n.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&q=80'}
                      alt={n.senderName}
                      className="h-8 w-8 flex-shrink-0 rounded-full object-cover ring-1 ring-purple-500/30"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate text-xs font-semibold text-ink">
                          {n.senderName}
                        </span>
                        <span className="text-[10px] text-ink-muted flex-shrink-0">
                          {new Date(n.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="truncate text-[11px] font-medium text-purple-600 dark:text-purple-400">
                        {n.itemTitle}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">
                        {n.previewText}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="border-t border-black/8 bg-black/[0.02] p-2 text-center dark:border-white/10 dark:bg-white/[0.02]">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (notifications.length > 0) {
                    navigate(`/chat/${notifications[0].sessionId}`);
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:underline dark:text-purple-400"
              >
                Open active chat thread <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
