import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';
import { POP_SPRING } from '../../lib/motion';

export default function NotificationsDropdown() {
  const { user } = useAuth();
  const { chatSessions, getUser, notifications } = useMarket();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const activeSessionId =
    location.pathname.match(/^\/chat\/([^/]+)/)?.[1] ||
    searchParams.get('conversationId');

  const recentConversations = useMemo(() => {
    if (!user) return [];
    return chatSessions
      .filter(
        (session) =>
          session.Buyer_ID === user.User_ID || session.Seller_ID === user.User_ID
      )
      .sort(
        (a, b) =>
          new Date(b.LastMessageTime || b.CreatedAt).getTime() -
          new Date(a.LastMessageTime || a.CreatedAt).getTime()
      )
      .slice(0, 5);
  }, [chatSessions, user]);

  const unreadSessionIds = new Set(
    notifications
      .filter(
        (notification) =>
          notification.unread && notification.sessionId !== activeSessionId
      )
      .map((notification) => notification.sessionId)
  );
  const unreadCount = unreadSessionIds.size;
  const badgeCount = unreadCount || recentConversations.length;

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
    navigate(`/chat?conversationId=${encodeURIComponent(sessionId)}`);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Notifications and messages"
        aria-expanded={isOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-borderline bg-surface/60 text-ink transition-colors hover:border-[#2F6FED]/40 hover:bg-surface"
      >
        <Bell className="h-4 w-4" />
        {badgeCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={POP_SPRING}
            className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-md"
          >
            {badgeCount > 99 ? '99+' : badgeCount}
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
            className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-borderline bg-surface/95 shadow-2xl backdrop-blur-2xl sm:w-96"
          >
            <div className="flex items-center justify-between border-b border-borderline px-4 py-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#2F6FED] dark:text-[#4F8CFF]" />
                <h3 className="font-display text-sm font-semibold text-ink">
                  Recent Messages
                </h3>
              </div>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-600 dark:text-red-400">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="max-h-80 divide-y divide-borderline overflow-y-auto">
              {recentConversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-ink-muted">
                  No active message threads yet.
                </div>
              ) : (
                recentConversations.map((conversation) => {
                  const otherUserId =
                    conversation.Buyer_ID === user?.User_ID
                      ? conversation.Seller_ID
                      : conversation.Buyer_ID;
                  const otherUser = getUser(otherUserId);
                  const senderName =
                    otherUser?.Name ||
                    (conversation.Buyer_ID === user?.User_ID
                      ? conversation.SellerName
                      : conversation.BuyerName) ||
                    'Campus Peer';
                  const timestamp =
                    conversation.LastMessageTime || conversation.CreatedAt;

                  return (
                    <button
                      key={conversation.Session_ID}
                      type="button"
                      onClick={() => handleSelect(conversation.Session_ID)}
                      className={`flex w-full items-start gap-3 p-3.5 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                        unreadSessionIds.has(conversation.Session_ID)
                          ? 'bg-red-500/5'
                          : 'bg-transparent'
                      }`}
                    >
                      <img
                        src={
                          otherUser?.AvatarSeed ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(senderName)}`
                        }
                        alt=""
                        className="h-9 w-9 flex-shrink-0 rounded-full object-cover ring-1 ring-[#2F6FED]/30"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-semibold text-ink">
                            {senderName}
                          </span>
                          <time
                            dateTime={timestamp}
                            className="flex-shrink-0 text-[10px] text-ink-muted"
                          >
                            {new Date(timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </time>
                        </div>
                        <p className="truncate text-[11px] font-medium text-[#2F6FED] dark:text-[#4F8CFF]">
                          {conversation.ListingTitle || 'Campus Bazaar chat'}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">
                          {conversation.LastMessageText || 'Start a conversation'}
                        </p>
                      </div>
                      {unreadSessionIds.has(conversation.Session_ID) && (
                        <span
                          aria-label="Unread messages"
                          className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-red-500"
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="border-t border-borderline bg-surface-base/50 p-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/chat');
                }}
                className="w-full rounded-xl px-3 py-2 text-xs font-semibold text-[#2F6FED] transition-colors hover:bg-black/5 hover:underline dark:text-[#4F8CFF] dark:hover:bg-white/5"
              >
                View All Messages
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
