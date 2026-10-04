// src/pages/ChatPage.tsx
import { useState, useEffect, useRef, useMemo, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  ShieldCheck,
  Lock,
  Sparkles,
  Paperclip,
  X,
  MessageSquare,
  ShoppingBag,
  ExternalLink,
  Search,
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { useAuth } from '../context/AuthContext';
import RatingStars from '../components/common/RatingStars';
import {
  POP_SPRING,
  MODAL_BACKDROP_VARIANTS,
  MODAL_CONTENT_VARIANTS,
} from '../lib/motion';

export default function ChatPage() {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    chatSessions,
    getSessionById,
    getMessagesForSession,
    fetchSessionMessages,
    loadingMessagesFor,
    sendMessage,
    getItem,
    getUser,
    markItemSold,
    addRating,
    hasRated,
    markNotificationsRead,
  } = useMarket();

  const [searchFilter, setSearchFilter] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [messageError, setMessageError] = useState<string | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<{
    file: File;
    url: string;
    type: 'image' | 'video';
    name: string;
  } | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showSoldConfirm, setShowSoldConfirm] = useState(false);
  const [dealClosedStamp, setDealClosedStamp] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User's conversations
  const mySessions = useMemo(() => {
    if (!user) return [];
    return chatSessions.filter(
      (s) => s.Buyer_ID === user.User_ID || s.Seller_ID === user.User_ID
    );
  }, [chatSessions, user]);

  // Selected session: from route param or fallback to first session if on desktop
  const activeSession = useMemo(() => {
    if (sessionId) {
      return getSessionById(sessionId) || mySessions.find((s) => s.Session_ID === sessionId);
    }
    return undefined;
  }, [sessionId, getSessionById, mySessions]);

  // If a session is active, fetch its messages from backend
  useEffect(() => {
    const activeSessionId = activeSession?.Session_ID;
    if (activeSessionId) {
      void fetchSessionMessages(activeSessionId);
      void markNotificationsRead(activeSessionId).catch((error) => {
        console.error('Failed to mark chat notifications as read:', error);
      });
    }
  }, [activeSession?.Session_ID, fetchSessionMessages, markNotificationsRead]);

  const activeItem = activeSession ? getItem(activeSession.Item_ID) : undefined;
  const messages = useMemo(
    () => (activeSession ? getMessagesForSession(activeSession.Session_ID) : []),
    [activeSession, getMessagesForSession]
  );

  const isSeller = activeSession?.Seller_ID === user?.User_ID;
  const isBuyer = activeSession?.Buyer_ID === user?.User_ID;
  const otherUserId = isSeller ? activeSession?.Buyer_ID : activeSession?.Seller_ID;
  const otherUser = otherUserId ? getUser(otherUserId) : undefined;
  const otherUserName =
    otherUser?.Name ||
    (isSeller ? activeSession?.BuyerName : activeSession?.SellerName) ||
    'Campus Peer';

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sessionId]);

  // Filtered session list for left sidebar
  const filteredSessions = useMemo(() => {
    if (!searchFilter.trim()) return mySessions;
    const q = searchFilter.toLowerCase();
    return mySessions.filter((s) => {
      const item = getItem(s.Item_ID);
      const isS = s.Seller_ID === user?.User_ID;
      const oId = isS ? s.Buyer_ID : s.Seller_ID;
      const oUser = getUser(oId);
      const oName = oUser?.Name || (isS ? s.BuyerName : s.SellerName) || '';
      const title = item?.Title || s.ListingTitle || '';
      return oName.toLowerCase().includes(q) || title.toLowerCase().includes(q);
    });
  }, [mySessions, searchFilter, getItem, getUser, user]);

  function handleSelectSession(sid: string) {
    navigate(`/chat/${sid}`);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(file.name);
    const mediaType: 'image' | 'video' = isVideo ? 'video' : 'image';
    const url = URL.createObjectURL(file);
    setPendingMedia({
      file,
      url,
      type: mediaType,
      name: file.name,
    });
    e.target.value = '';
  }

  function handleRemovePendingMedia() {
    if (pendingMedia) {
      URL.revokeObjectURL(pendingMedia.url);
      setPendingMedia(null);
    }
  }

  const isSold = activeItem?.Status === 'SOLD';
  const isWinningBuyer =
    isBuyer && (activeSession?.SoldToBuyer || activeItem?.WinningBuyer_ID === user?.User_ID);
  const isLostBuyer = isBuyer && isSold && !isWinningBuyer;
  const alreadyRated = user && activeSession ? hasRated(activeSession.Session_ID, user.User_ID) : false;

  async function handleSendMessage(e: FormEvent) {
    e.preventDefault();
    if (
      !activeSession ||
      (!inputMessage.trim() && !pendingMedia) ||
      isLostBuyer ||
      isSendingMessage
    ) return;
    const textToSend = inputMessage;
    const mediaToSend = pendingMedia
      ? { type: pendingMedia.type, url: pendingMedia.url, file: pendingMedia.file }
      : undefined;
    setMessageError(null);
    setIsSendingMessage(true);
    try {
      await sendMessage(activeSession.Session_ID, textToSend, mediaToSend);
      setInputMessage('');
      setPendingMedia(null);
    } catch {
      setMessageError('Message could not be sent. Please try again.');
    } finally {
      setIsSendingMessage(false);
    }
  }

  async function handleConfirmMarkSold() {
    if (!activeItem || !activeSession) return;
    setShowSoldConfirm(false);
    try {
      await markItemSold(activeItem.Item_ID, activeSession.Buyer_ID);
      setDealClosedStamp(true);
      setTimeout(() => setDealClosedStamp(false), 2400);
    } catch (error) {
      setMessageError(error instanceof Error ? error.message : 'Could not update listing status.');
    }
  }

  async function handleRateSubmit(e: FormEvent) {
    e.preventDefault();
    if (!activeSession || !otherUserId) return;
    setRatingError(null);
    try {
      await addRating(activeSession.Session_ID, otherUserId, ratingScore, ratingComment);
      setRatingSubmitted(true);
    } catch (error) {
      setRatingError(error instanceof Error ? error.message : 'Could not submit your rating.');
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Top Breadcrumb / Back Link */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Bazaar
        </Link>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          Campus Direct Messaging
        </span>
      </div>

      {/* Main Split-Screen Container */}
      <div className="flex h-[78vh] sm:h-[82vh] overflow-hidden rounded-3xl border border-borderline bg-surface shadow-lg backdrop-blur-xl">
        {/* ════════════════════════════════════════════════════════════════
            LEFT COLUMN: THREAD LIST (Active on mobile if no session)
            ════════════════════════════════════════════════════════════════ */}
        <div
          className={`${
            activeSession ? 'hidden md:flex' : 'flex'
          } w-full md:w-80 lg:w-96 flex-col border-r border-borderline bg-surface-base/60 backdrop-blur-md`}
        >
          {/* Header */}
          <div className="p-4 border-b border-borderline">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold tracking-tight text-ink">
                  Messages
                </h1>
                <span className="rounded-full bg-[#2F6FED]/15 px-2 py-0.5 text-[11px] font-bold text-[#2F6FED] dark:text-[#4F8CFF]">
                  {mySessions.length}
                </span>
              </div>
            </div>

            {/* Thread Search Bar */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-muted" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search peers or listings..."
                className="w-full rounded-full border border-borderline bg-surface px-8 py-1.5 text-xs text-ink placeholder-ink-muted/50 outline-none transition focus:border-[#2F6FED]"
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink text-xs"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Thread List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-borderline/50 p-2 space-y-1">
            {filteredSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center text-ink-muted">
                <MessageSquare className="h-10 w-10 opacity-30 mb-2" />
                <p className="text-xs font-semibold text-ink">No conversations yet</p>
                <p className="text-[11px] mt-1 text-ink-muted max-w-[200px]">
                  When you inquire on campus listings or buyers message you, chats will appear here.
                </p>
                <Link
                  to="/"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#2F6FED] px-4 py-2 text-[11px] font-semibold text-white shadow-xs hover:bg-[#1B4FC4]"
                >
                  <ShoppingBag className="h-3 w-3" />
                  Browse Listings
                </Link>
              </div>
            ) : (
              filteredSessions.map((session) => {
                const sItem = getItem(session.Item_ID);
                const sIsSeller = session.Seller_ID === user?.User_ID;
                const sOtherId = sIsSeller ? session.Buyer_ID : session.Seller_ID;
                const sOtherUser = getUser(sOtherId);
                const sOtherName =
                  sOtherUser?.Name ||
                  (sIsSeller ? session.BuyerName : session.SellerName) ||
                  'Campus Peer';
                const sOtherAvatar =
                  sOtherUser?.AvatarSeed ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(sOtherName)}`;
                const isSelected = activeSession?.Session_ID === session.Session_ID;
                const sMessages = getMessagesForSession(session.Session_ID);
                const lastMsg = sMessages[sMessages.length - 1];
                const previewText =
                  lastMsg?.Text || session.LastMessageText || 'Tap to open conversation...';
                const itemTitle = sItem?.Title || session.ListingTitle || 'Campus Listing';
                const itemPrice = sItem?.Price ?? session.ListingPrice;

                return (
                  <button
                    key={session.Session_ID}
                    type="button"
                    onClick={() => handleSelectSession(session.Session_ID)}
                    className={`w-full text-left rounded-2xl p-3 transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-[#2F6FED]/10 border border-[#2F6FED]/30 text-ink dark:bg-[#2F6FED]/20'
                        : 'hover:bg-surface-elevated/80 border border-transparent'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={sOtherAvatar}
                        alt={sOtherName}
                        className="h-11 w-11 rounded-xl object-cover ring-1 ring-borderline"
                      />
                      {(sOtherUser?.IsVerified ?? false) && (
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#2F6FED] text-white ring-1 ring-surface text-[9px]">
                          ✓
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs text-ink truncate">
                          {sOtherName}
                        </span>
                        {sIsSeller ? (
                          <span className="text-[9px] uppercase tracking-wider font-semibold text-ink-muted bg-surface px-1.5 py-0.5 rounded-md border border-borderline flex-shrink-0">
                            Buyer
                          </span>
                        ) : (
                          <span className="text-[9px] uppercase tracking-wider font-semibold text-[#2F6FED] bg-[#2F6FED]/10 px-1.5 py-0.5 rounded-md flex-shrink-0">
                            Seller
                          </span>
                        )}
                      </div>

                      {/* Linked item snippet */}
                      <p className="text-[11px] font-medium text-ink-muted truncate mt-0.5 flex items-center gap-1">
                        <span className="truncate">{itemTitle}</span>
                        {itemPrice !== undefined && (
                          <span className="text-ink font-semibold flex-shrink-0">
                            · ₹{Number(itemPrice).toLocaleString('en-IN')}
                          </span>
                        )}
                      </p>

                      {/* Last message preview */}
                      <p className="text-[11px] text-ink-muted/80 truncate mt-1 line-clamp-1">
                        {previewText}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            RIGHT COLUMN: ACTIVE CHAT CONVERSATION VIEW
            ════════════════════════════════════════════════════════════════ */}
        <div
          className={`${
            activeSession ? 'flex' : 'hidden md:flex'
          } flex-1 flex-col h-full bg-surface relative`}
        >
          {activeSession ? (
            <>
              {/* Active Conversation Top Bar */}
              <div className="flex items-center justify-between border-b border-borderline px-4 py-3 bg-surface/90 backdrop-blur-md">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => navigate('/chat')}
                    className="md:hidden flex h-8 w-8 items-center justify-center rounded-full bg-surface-elevated text-ink hover:bg-borderline transition-colors mr-1"
                    title="Back to conversation list"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  <div className="relative flex-shrink-0">
                    <img
                      src={
                        otherUser?.AvatarSeed ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          otherUserName
                        )}`
                      }
                      alt={otherUserName}
                      className="h-10 w-10 rounded-xl object-cover ring-1 ring-borderline"
                    />
                    {(otherUser?.IsVerified ?? false) && (
                      <ShieldCheck className="absolute -bottom-1 -right-1 h-4 w-4 text-[#2F6FED]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h2 className="font-semibold text-sm text-ink truncate">
                        {otherUserName}
                      </h2>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                        · {isSeller ? 'Prospective Buyer' : 'Listing Seller'}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-muted truncate">
                      {otherUser?.InstitutionalEmail || 'Verified Student Peer'}
                    </p>
                    {otherUser?.HostelBuilding && (
                      <p className="text-[11px] text-ink-muted truncate">{otherUser.HostelBuilding}</p>
                    )}
                    {otherUser && (
                      <RatingStars
                        value={otherUser.Rating}
                        count={otherUser.RatingCount}
                        size={10}
                        showScore
                      />
                    )}
                  </div>
                </div>

                {/* Linked Listing Pill Badge */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {activeItem ? (
                    <div className="flex items-center gap-2 rounded-2xl border border-borderline bg-surface-base px-3 py-1.5">
                      {activeItem.Images[0] && (
                        <img
                          src={activeItem.Images[0]}
                          alt={activeItem.Title}
                          className="h-7 w-7 rounded-lg object-cover"
                        />
                      )}
                      <div className="text-left hidden sm:block">
                        <span className="block text-[11px] font-semibold text-ink max-w-[130px] truncate">
                          {activeItem.Title}
                        </span>
                        <span className="block font-display text-[11px] font-bold text-ink">
                          ₹{activeItem.Price.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <Link
                        to={`/item/${activeItem.Item_ID}`}
                        className="rounded-lg p-1 text-ink-muted hover:text-[#2F6FED] transition-colors"
                        title="Open Listing Page"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  ) : activeSession.ListingTitle ? (
                    <div className="flex items-center gap-2 rounded-2xl border border-borderline bg-surface-base px-3 py-1.5">
                      <span className="text-xs font-semibold text-ink max-w-[140px] truncate">
                        {activeSession.ListingTitle}
                      </span>
                      {activeSession.ListingPrice !== undefined && (
                        <span className="text-xs font-bold text-ink">
                          ₹{activeSession.ListingPrice?.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  ) : null}

                  {/* Mark as Sold button if user is seller and item active */}
                  {isSeller && activeItem && activeItem.Status !== 'SOLD' && (
                    <button
                      type="button"
                      onClick={() => setShowSoldConfirm(true)}
                      className="rounded-xl bg-[#F2994A] px-3 py-1.5 text-xs font-semibold text-[#10131A] hover:bg-[#D97B2B] transition-colors cursor-pointer"
                    >
                      Mark Sold
                    </button>
                  )}
                </div>
              </div>

              {/* Status Banner (if Sold or Deal Handshake) */}
              {isSold && (
                <div
                  className={`px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2 border-b ${
                    isWinningBuyer || isSeller
                      ? 'bg-[#1AA260]/10 border-[#1AA260]/20 text-[#1AA260]'
                      : 'bg-zinc-100 dark:bg-zinc-800 border-borderline text-ink-muted'
                  }`}
                >
                  <Lock className="h-3.5 w-3.5" />
                  {isWinningBuyer
                    ? '🎉 Congratulations! You purchased this campus item. Complete the peer rating below!'
                    : isSeller
                    ? '✓ Deal closed! You marked this item as sold.'
                    : 'This item was marked as sold to another campus student.'}
                </div>
              )}

              {/* Message History Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-surface-base/30">
                {/* Handshake greeting pill */}
                <div className="text-center py-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-borderline bg-surface/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-muted backdrop-blur-md">
                    <ShieldCheck className="h-3 w-3 text-[#2F6FED]" />
                    End-to-End Verified Campus Handshake
                  </span>
                </div>

                {loadingMessagesFor === activeSession?.Session_ID && messages.length === 0 ? (
                  <div className="space-y-4 py-5" aria-label="Loading chat messages">
                    <div className="skeleton-shimmer h-12 w-2/3 rounded-2xl" />
                    <div className="skeleton-shimmer ml-auto h-12 w-3/5 rounded-2xl" />
                    <div className="skeleton-shimmer h-16 w-3/4 rounded-2xl" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center text-ink-muted">
                    <p className="text-xs font-medium">No messages yet.</p>
                    <p className="text-[11px] text-ink-muted/70 mt-1">
                      Say hello to {otherUserName} to arrange meetup locations or ask questions!
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isMe = message.Sender_ID === user?.User_ID;
                    const timeFormatted = message.Timestamp
                      ? new Date(message.Timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '';

                    return (
                      <motion.div
                        key={message.Message_ID}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[82%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-xs ${
                            isMe
                              ? 'bg-[#2F6FED] text-white rounded-br-xs'
                              : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 rounded-bl-xs border border-borderline'
                          }`}
                        >
                          {/* Optional media attachment */}
                          {message.MediaUrl && (
                            <div className="mb-2 overflow-hidden rounded-xl">
                              {message.MediaType === 'video' ? (
                                <video
                                  src={message.MediaUrl}
                                  controls
                                  className="max-h-56 w-full rounded-xl object-cover"
                                />
                              ) : (
                                <img
                                  src={message.MediaUrl}
                                  alt="Attachment"
                                  onClick={() => setLightboxUrl(message.MediaUrl || null)}
                                  className="max-h-56 w-full rounded-xl object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                />
                              )}
                            </div>
                          )}

                          <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {message.Text}
                          </p>
                        </div>

                        <span className="text-[9px] text-ink-muted/60 mt-1 px-1">
                          {timeFormatted}
                        </span>
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Peer Rating Prompt (if sold and buyer hasn't rated) */}
              {isWinningBuyer && !alreadyRated && !ratingSubmitted && (
                <div className="border-t border-borderline bg-surface p-4">
                  <form onSubmit={handleRateSubmit} className="space-y-3">
                    {ratingError && <p role="alert" className="text-xs text-status-danger">{ratingError}</p>}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink">
                        Rate your peer hand-off with {otherUserName}
                      </span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRatingScore(star)}
                            className="text-amber-400 hover:scale-110 transition-transform"
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        placeholder="Leave feedback on item condition and punctuality..."
                        className="flex-1 rounded-full border border-borderline bg-surface-base px-3.5 py-1.5 text-xs text-ink outline-none"
                      />
                      <button
                        type="submit"
                        className="rounded-full bg-[#1AA260] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#15824d]"
                      >
                        Submit
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Message Composer Input Bar (Apple iMessage Pill Design) */}
              <div className="border-t border-borderline p-3 sm:p-4 bg-surface/90 backdrop-blur-md">
                {/* Media preview tag if selected */}
                {pendingMedia && (
                  <div className="mb-2 flex items-center justify-between rounded-xl border border-borderline bg-surface-base p-2">
                    <span className="text-xs text-ink truncate max-w-xs">
                      📎 {pendingMedia.name}
                    </span>
                    <button
                      type="button"
                      onClick={handleRemovePendingMedia}
                      className="text-ink-muted hover:text-ink"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {messageError && (
                  <p role="alert" className="mb-2 text-xs text-status-danger">
                    {messageError}
                  </p>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* Attachment button */}
                  <button
                    type="button"
                    disabled={isLostBuyer}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-borderline bg-surface-base text-ink-muted hover:text-[#2F6FED] hover:border-[#2F6FED] transition-colors disabled:opacity-40"
                    title="Attach photo"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>

                  <input
                    type="text"
                    disabled={isLostBuyer}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={
                      isLostBuyer
                        ? 'Listing is closed'
                        : `Message ${otherUserName}...`
                    }
                    className="flex-1 rounded-full border border-borderline bg-surface-base px-4 py-2.5 text-xs sm:text-sm text-ink placeholder-ink-muted/50 outline-none transition focus:border-[#2F6FED] disabled:opacity-50"
                  />

                  <button
                    type="submit"
                    disabled={(!inputMessage.trim() && !pendingMedia) || isLostBuyer || isSendingMessage}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#2F6FED] text-white transition-transform active:scale-95 hover:bg-[#1B4FC4] disabled:opacity-30 cursor-pointer shadow-xs"
                    title={isSendingMessage ? 'Sending message' : 'Send message'}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* Empty State when no conversation selected */
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-ink-muted">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#2F6FED]/10 text-[#2F6FED] mb-4">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h2 className="font-display text-lg font-bold text-ink">
                Select a Conversation
              </h2>
              <p className="mt-1 text-xs text-ink-muted max-w-sm font-body">
                Choose a conversation from the sidebar to chat with students, confirm meetups, or negotiate prices.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CONFIRMATION MODAL: Mark as Sold to THIS buyer */}
      <AnimatePresence>
        {showSoldConfirm && activeItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              variants={MODAL_BACKDROP_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={() => setShowSoldConfirm(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              variants={MODAL_CONTENT_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative z-10 w-full max-w-md rounded-3xl border border-borderline bg-surface p-6 shadow-2xl"
            >
              <h3 className="font-display text-xl font-bold text-ink">
                Sell "{activeItem.Title}" to {otherUserName}?
              </h3>
              <p className="mt-2 text-xs text-ink-muted leading-relaxed font-body">
                This will close the listing, mark {otherUserName} as the winning buyer, update the status to SOLD across the bazaar, and open peer ratings.
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSoldConfirm(false)}
                  className="rounded-full border border-borderline px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ink hover:bg-surface-elevated"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmMarkSold}
                  className="rounded-full bg-[#F2994A] px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[#10131A] shadow-xs hover:bg-[#D97B2B] transition-colors"
                >
                  Confirm Deal Closed
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DEAL CLOSED CELEBRATION STAMP */}
      <AnimatePresence>
        {dealClosedStamp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={POP_SPRING}
              className="flex flex-col items-center gap-3 rounded-3xl border-2 border-[#1AA260] bg-surface/95 p-8 text-center text-ink shadow-2xl backdrop-blur-xl"
            >
              <Sparkles className="h-10 w-10 text-[#1AA260] animate-pulse" />
              <div className="rounded-full bg-[#1AA260] px-4 py-1 text-xs font-bold uppercase tracking-widest text-white">
                Deal Closed!
              </div>
              <p className="text-xs text-ink-muted">
                Item marked sold to {otherUserName}.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* IMAGE LIGHTBOX MODAL */}
      <AnimatePresence>
        {lightboxUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxUrl(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl border border-white/20 bg-[#10131A] p-2 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setLightboxUrl(null)}
                className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-sm hover:bg-black/90 transition-colors"
                title="Close full view"
              >
                <X className="h-5 w-5" />
              </button>
              <img
                src={lightboxUrl}
                alt="Full preview"
                className="max-h-[85vh] max-w-full rounded-xl object-contain"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
