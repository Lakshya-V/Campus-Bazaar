// src/pages/ChatPage.tsx
import { useState, useEffect, useRef, useMemo, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  AlertCircle,
  Paperclip,
  X,
  Video as VideoIcon,
  Maximize2,
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { useAuth } from '../context/AuthContext';
import RatingStars from '../components/common/RatingStars';
import {
  POP_SPRING,
  MODAL_BACKDROP_VARIANTS,
  MODAL_CONTENT_VARIANTS,
  HANDSHAKE_PULSE_VARIANTS,
} from '../lib/motion';

export default function ChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const {
    getSessionById,
    getMessagesForSession,
    sendMessage,
    getItem,
    getUser,
    markItemSold,
    addRating,
    hasRated,
  } = useMarket();

  const [inputMessage, setInputMessage] = useState('');
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
  const [isHandshaking, setIsHandshaking] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const session = getSessionById(sessionId || '');
  const item = session ? getItem(session.Item_ID) : undefined;
  const messages = useMemo(
    () => (session ? getMessagesForSession(session.Session_ID) : []),
    [session, getMessagesForSession]
  );

  const isSeller = session?.Seller_ID === user?.User_ID;
  const isBuyer = session?.Buyer_ID === user?.User_ID;
  const otherUserId = isSeller ? session?.Buyer_ID : session?.Seller_ID;
  const otherUser = otherUserId ? getUser(otherUserId) : undefined;

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

  // Handshake pulse on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHandshaking(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [sessionId]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isHandshaking]);

  if (!session || !item) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="rounded-3xl border border-borderline bg-surface/80 p-8 shadow-xl backdrop-blur-2xl">
          <AlertCircle className="mx-auto h-12 w-12 text-status-danger" />
          <h2 className="mt-4 font-display text-xl font-bold text-ink">
            Chat Thread Not Found
          </h2>
          <p className="mt-2 text-xs text-ink-muted">
            This message session could not be located.
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

  const currentSession = session;
  const currentItem = item;

  // Sold states
  const isSold = currentItem.Status === 'SOLD';
  const isWinningBuyer = isBuyer && (currentSession.SoldToBuyer || currentItem.WinningBuyer_ID === user?.User_ID);
  const isLostBuyer = isBuyer && isSold && !isWinningBuyer;

  const alreadyRated = user ? hasRated(currentSession.Session_ID, user.User_ID) : false;

  function handleSendMessage(e: FormEvent) {
    e.preventDefault();
    if ((!inputMessage.trim() && !pendingMedia) || isLostBuyer) return;
    sendMessage(
      currentSession.Session_ID,
      inputMessage,
      pendingMedia ? { type: pendingMedia.type, url: pendingMedia.url } : undefined
    );
    setInputMessage('');
    setPendingMedia(null);
  }

  function handleConfirmMarkSold() {
    setShowSoldConfirm(false);
    setDealClosedStamp(true);
    markItemSold(currentItem.Item_ID, currentSession.Buyer_ID);
    setTimeout(() => {
      setDealClosedStamp(false);
    }, 2400);
  }

  function handleRateSubmit(e: FormEvent) {
    e.preventDefault();
    if (!otherUserId) return;
    addRating(currentSession.Session_ID, otherUserId, ratingScore, ratingComment);
    setRatingSubmitted(true);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-12">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          to={`/item/${item.Item_ID}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-ink-muted hover:text-[#2F6FED] dark:hover:text-[#4F8CFF] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to listing
        </Link>
        <span className="text-[11px] text-ink-muted">
          Session ID: <span className="font-mono">{session.Session_ID}</span>
        </span>
      </div>

      {/* Handshake Connecting Animation if just mounting */}
      <AnimatePresence>
        {isHandshaking && (
          <motion.div
            variants={HANDSHAKE_PULSE_VARIANTS}
            animate="animate"
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center justify-center gap-2 rounded-2xl border border-[#2F6FED]/20 bg-[#2F6FED]/10 p-3 text-xs font-medium text-[#2F6FED] dark:text-[#4F8CFF]"
          >
            <Sparkles className="h-4 w-4 animate-spin" />
            <span>Establishing secure peer connection...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Container */}
      <div className="flex h-[75vh] flex-col overflow-hidden rounded-3xl border border-black/5 bg-white/70 shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/70">
        {/* Pinned Item Summary Card at Top (Compact Version of Detail Card) */}
        <div className="border-b border-borderline bg-surface-base/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Thumbnail, Title, Display Price, Condition */}
            <div className="flex items-center gap-3.5 min-w-0">
              <img
                src={item.Images[0]}
                alt={item.Title}
                className="h-14 w-14 rounded-xl object-cover flex-shrink-0 border border-borderline"
              />
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-xl font-bold tracking-tight text-ink">
                    ${item.Price}
                  </span>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-surface-elevated text-ink-secondary border border-borderline">
                    {item.Category}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      item.Status === 'AVAILABLE'
                        ? 'bg-[#12A150] text-white dark:text-[#0D0F12]'
                        : 'bg-surface-elevated text-ink-muted border border-borderline'
                    }`}
                  >
                    {item.Status}
                  </span>
                </div>
                <h3 className="truncate font-semibold text-xs sm:text-sm text-ink font-body">
                  {item.Title}
                </h3>
                <p className="text-[11px] text-ink-muted font-medium">
                  {isBuyer
                    ? `Negotiating to buy from ${otherUser?.Name || 'Seller'}`
                    : `Inquiry from ${otherUser?.Name || 'Buyer'}`}
                </p>
              </div>
            </div>

            {/* Other User Sub-Chip */}
            {otherUser && (
              <div className="flex items-center gap-2 rounded-full border border-borderline bg-surface px-3 py-1.5 text-xs">
                <img
                  src={otherUser.AvatarSeed}
                  alt={otherUser.Name}
                  className="h-5 w-5 rounded-full object-cover border border-borderline"
                />
                <span className="text-ink font-medium text-xs">{otherUser.Name}</span>
                {otherUser.IsVerified && (
                  <ShieldCheck className="h-3.5 w-3.5 text-[#2F6FED]" />
                )}
                <span className="text-[11px] text-[#F2A93B] font-semibold ml-1">
                  {otherUser.Rating}★
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Message Thread Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-surface-base/20">
          {/* Privacy Protection Banner — Strict Requirement */}
          <div className="mx-auto max-w-sm rounded-full border border-borderline bg-surface px-4 py-1.5 text-center text-[10px] uppercase tracking-wider text-ink-muted shadow-xs">
            <Lock className="inline h-3 w-3 mr-1 opacity-60" />
            Campus Peer Privacy: Direct messages are protected.
          </div>

          {/* Message Bubbles: Tail-less flat modern style */}
          {messages.map((msg) => {
            const isMe = msg.Sender_ID === user?.User_ID;

            return (
              <motion.div
                key={msg.Message_ID}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-md rounded-2xl p-3 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isMe
                      ? 'bg-[#2F6FED] text-white'
                      : 'bg-surface border border-borderline text-ink'
                  }`}
                >
                  {/* Attached Image with click-to-view lightbox */}
                  {msg.MediaType === 'image' && msg.MediaUrl && (
                    <div className="mb-2 relative group overflow-hidden rounded-xl border border-white/15 bg-black/10">
                      <img
                        src={msg.MediaUrl}
                        alt="Shared media"
                        className="max-h-64 w-full object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => setLightboxUrl(msg.MediaUrl || null)}
                      />
                      <button
                        type="button"
                        onClick={() => setLightboxUrl(msg.MediaUrl || null)}
                        className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Click to view full image"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Attached Video with native controls */}
                  {msg.MediaType === 'video' && msg.MediaUrl && (
                    <div className="mb-2 overflow-hidden rounded-xl border border-white/15 bg-black">
                      <video
                        src={msg.MediaUrl}
                        controls
                        playsInline
                        className="max-h-64 w-full rounded-xl"
                      />
                    </div>
                  )}

                  {msg.Text && <p className="font-body whitespace-pre-wrap">{msg.Text}</p>}
                  <span
                    className={`mt-1.5 block text-[10px] text-right font-mono ${
                      isMe ? 'text-white/75' : 'text-ink-muted'
                    }`}
                  >
                    {new Date(msg.Timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </motion.div>
            );
          })}

          {/* Inline "Rate this buyer" prompt if seller marked sold in this thread */}
          {isSeller && isSold && !alreadyRated && !ratingSubmitted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto max-w-md rounded-2xl border border-borderline bg-surface p-5 text-center shadow-xs"
            >
              <div className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider bg-[#1AA260] text-white dark:text-[#0D0F12] mb-2">
                Deal Closed! Rate this buyer
              </div>
              <p className="text-xs text-ink-muted font-body">
                How was your campus hand-off meetup with {otherUser?.Name}?
              </p>

              <form onSubmit={handleRateSubmit} className="mt-4 space-y-3">
                <div className="flex justify-center">
                  <RatingStars
                    value={ratingScore}
                    interactive
                    onChange={setRatingScore}
                    size={24}
                  />
                </div>
                <input
                  type="text"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Optional praise (e.g. prompt meetup, exact cash)..."
                  className="w-full rounded-full border border-borderline bg-surface-base px-4 py-2 text-xs text-ink placeholder-ink-muted/50 outline-none"
                />
                <button
                  type="submit"
                  className="rounded-full bg-[#111318] text-[#FFFFFF] dark:bg-[#F2F3F5] dark:text-[#0D0F12] px-5 py-2 text-xs font-semibold uppercase tracking-wider shadow-xs hover:opacity-90 transition-opacity"
                >
                  Submit Buyer Rating
                </button>
              </form>
            </motion.div>
          )}

          {/* Inline "Rate this seller" prompt if buyer won the item */}
          {isWinningBuyer && !alreadyRated && !ratingSubmitted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto max-w-md rounded-2xl border border-borderline bg-surface p-5 text-center shadow-xs"
            >
              <div className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider bg-[#1AA260] text-white dark:text-[#0D0F12] mb-2">
                Deal Closed! Rate this seller
              </div>
              <p className="text-xs text-ink-muted font-body">
                Share your experience meeting up with {otherUser?.Name}.
              </p>

              <form onSubmit={handleRateSubmit} className="mt-4 space-y-3">
                <div className="flex justify-center">
                  <RatingStars
                    value={ratingScore}
                    interactive
                    onChange={setRatingScore}
                    size={24}
                  />
                </div>
                <input
                  type="text"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Review condition and handoff..."
                  className="w-full rounded-full border border-borderline bg-surface-base px-4 py-2 text-xs text-ink placeholder-ink-muted/50 outline-none"
                />
                <button
                  type="submit"
                  className="rounded-full bg-[#F2994A] text-[#10131A] px-5 py-2 text-xs font-semibold uppercase tracking-wider shadow-xs hover:bg-[#D97B2B] transition-colors"
                >
                  Submit Seller Rating
                </button>
              </form>
            </motion.div>
          )}

          {/* Rating Submitted Acknowledgment */}
          {(alreadyRated || ratingSubmitted) && (
            <div className="mx-auto max-w-xs rounded-full border border-borderline bg-surface p-2 text-center text-xs font-semibold text-[#12A150]">
              ✓ Rating recorded! Thank you for supporting campus trust.
            </div>
          )}

          {/* Muted "Sold to someone else" banner for losing buyers */}
          {isLostBuyer && (
            <div className="mx-auto max-w-sm rounded-full border border-borderline bg-surface-base p-3 text-center text-xs font-medium text-ink-muted">
              This item has been sold to another student. Messages are closed.
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Seller-Only Action Bar (Mark as Sold) — Distinct Pill Button Strip in AMBER #F2994A */}
        {isSeller && !isSold && (
          <div className="border-t border-borderline bg-surface px-4 py-2.5 flex items-center justify-between">
            <span className="text-[11px] font-medium text-ink-muted">
              Ready to finalize handoff with {otherUser?.Name}?
            </span>
            <button
              type="button"
              onClick={() => setShowSoldConfirm(true)}
              className="flex items-center gap-1.5 rounded-full bg-[#F2994A] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#10131A] shadow-xs hover:bg-[#D97B2B] transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Mark as Sold to this buyer</span>
            </button>
          </div>
        )}

        {/* Input Bar with Attachment Preview */}
        <div className="border-t border-borderline bg-surface p-3 sm:p-4">
          {/* Pending Media Attachment Preview */}
          <AnimatePresence>
            {pendingMedia && (
              <motion.div
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: 5, height: 0 }}
                className="mb-3 flex items-center gap-3 rounded-xl border border-borderline bg-surface-base p-2.5"
              >
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-borderline bg-surface-elevated">
                  {pendingMedia.type === 'image' ? (
                    <img
                      src={pendingMedia.url}
                      alt="Attachment preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#10131A] text-white">
                      <VideoIcon className="h-6 w-6 text-[#2F6FED]" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-[#2F6FED]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#2F6FED]">
                      {pendingMedia.type}
                    </span>
                    <span className="truncate text-xs font-medium text-ink">
                      {pendingMedia.name}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-ink-muted">
                    Ready to send with message
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePendingMedia}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-borderline bg-surface text-ink-muted hover:text-status-danger hover:bg-surface-elevated transition-colors"
                  title="Remove attachment"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Paperclip Attachment Button */}
            <button
              type="button"
              disabled={isLostBuyer}
              onClick={() => fileInputRef.current?.click()}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-borderline bg-surface-base text-ink hover:text-[#2F6FED] hover:border-[#2F6FED] transition-colors disabled:opacity-40"
              title="Attach image or video"
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
                  : pendingMedia
                  ? 'Add a caption or note (optional)...'
                  : 'Type a message (e.g. proposing campus library meetup)...'
              }
              className="flex-1 rounded-full border border-borderline bg-surface-base px-4 py-2.5 text-xs sm:text-sm text-ink placeholder-ink-muted/50 outline-none transition focus:border-[#2F6FED] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={(!inputMessage.trim() && !pendingMedia) || isLostBuyer}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#F2994A] text-[#10131A] transition-transform active:scale-95 hover:bg-[#D97B2B] disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* CONFIRMATION MODAL: Mark as Sold to THIS buyer */}
      <AnimatePresence>
        {showSoldConfirm && (
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
              className="relative z-10 w-full max-w-md rounded-2xl border border-borderline bg-surface p-6 shadow-xl"
            >
              <h3 className="font-display text-xl font-bold text-ink">
                Sell "{item.Title}" to {otherUser?.Name}?
              </h3>
              <p className="mt-2 text-xs text-ink-muted leading-relaxed font-body">
                This will close the listing, mark {otherUser?.Name} as the winning buyer, update the item to SOLD everywhere, and open the peer review prompt.
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

      {/* DEAL CLOSED STAMP ANIMATION */}
      <AnimatePresence>
        {dealClosedStamp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={POP_SPRING}
              className="flex flex-col items-center gap-3 rounded-2xl border-2 border-[#1AA260] bg-surface/95 p-8 text-center text-ink shadow-2xl backdrop-blur-xl"
            >
              <Sparkles className="h-10 w-10 text-[#1AA260] animate-pulse" />
              <div className="rounded-full bg-[#1AA260] px-4 py-1 text-xs font-bold uppercase tracking-widest text-white">
                Deal Closed!
              </div>
              <p className="text-xs text-ink-muted">
                Sold to {otherUser?.Name}. Peer rating prompt is now active!
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
