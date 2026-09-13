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
  User,
  AlertCircle,
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
  const [showSoldConfirm, setShowSoldConfirm] = useState(false);
  const [dealClosedStamp, setDealClosedStamp] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [isHandshaking, setIsHandshaking] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        <div className="rounded-3xl border border-black/10 bg-white/80 p-8 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-[#09090b]/80">
          <AlertCircle className="mx-auto h-12 w-12 text-purple-600 dark:text-purple-400" />
          <h2 className="mt-4 font-display text-xl font-bold text-ink">
            Chat Thread Not Found
          </h2>
          <p className="mt-2 text-xs text-ink-muted">
            This message session could not be located.
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

  const currentSession = session;
  const currentItem = item;

  // Sold states
  const isSold = currentItem.Status === 'SOLD';
  const isWinningBuyer = isBuyer && (currentSession.SoldToBuyer || currentItem.WinningBuyer_ID === user?.User_ID);
  const isLostBuyer = isBuyer && isSold && !isWinningBuyer;

  const alreadyRated = user ? hasRated(currentSession.Session_ID, user.User_ID) : false;

  function handleSendMessage(e: FormEvent) {
    e.preventDefault();
    if (!inputMessage.trim() || isLostBuyer) return;
    sendMessage(currentSession.Session_ID, inputMessage);
    setInputMessage('');
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
          className="inline-flex items-center gap-2 text-xs font-semibold text-ink-muted hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
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
            className="flex items-center justify-center gap-2 rounded-2xl border border-purple-500/20 bg-purple-500/10 p-3 text-xs font-medium text-purple-700 dark:text-purple-300"
          >
            <Sparkles className="h-4 w-4 animate-spin" />
            <span>Establishing secure peer connection...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Container */}
      <div className="flex flex-col h-[75vh] overflow-hidden rounded-3xl border border-black/8 bg-white/85 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-[#09090b]/85">
        {/* Pinned Item Summary Header */}
        <div className="border-b border-black/8 bg-surface-elevated/70 p-4 dark:border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: Thumbnail & Title */}
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={item.Images[0]}
                alt={item.Title}
                className="h-12 w-12 rounded-xl object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-bold text-sell">
                    ${item.Price}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.2 text-[10px] font-semibold uppercase ${
                      item.Status === 'AVAILABLE'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-500/15 text-slate-500'
                    }`}
                  >
                    {item.Status}
                  </span>
                </div>
                <h3 className="truncate font-semibold text-xs text-ink sm:text-sm">
                  {item.Title}
                </h3>
                <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                  {isBuyer
                    ? `Negotiating to buy from ${otherUser?.Name || 'Seller'}`
                    : `Responding to student inquiry from ${otherUser?.Name || 'Buyer'}`}
                </p>
              </div>
            </div>

            {/* Right: Seller Context Action */}
            {isSeller && (
              <div className="flex items-center gap-2">
                {!isSold ? (
                  <button
                    type="button"
                    onClick={() => setShowSoldConfirm(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Mark as Sold to this buyer</span>
                  </button>
                ) : (
                  <span className="rounded-xl bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Deal Closed
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Seller view: Buyer-Context Panel */}
          {isSeller && otherUser && (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-black/5 bg-black/[0.02] p-2 dark:border-white/5 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2 text-xs">
                <User className="h-3.5 w-3.5 text-purple-500" />
                <span className="text-ink font-medium">Buyer: <strong>{otherUser.Name}</strong></span>
                {otherUser.IsVerified && (
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                )}
              </div>
              <RatingStars value={otherUser.Rating} size={11} showScore count={otherUser.RatingCount} />
            </div>
          )}
        </div>

        {/* Message Thread Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
          {/* Privacy Protection Banner — Strict Requirement */}
          <div className="mx-auto max-w-sm rounded-xl border border-black/5 bg-black/[0.02] p-2.5 text-center text-[11px] text-ink-muted dark:border-white/5 dark:bg-white/[0.02]">
            <Lock className="inline h-3 w-3 mr-1 text-purple-500" />
            Campus Peer Privacy: Direct messages are end-to-end simulated. Never share external passwords or payment cards.
          </div>

          {/* Message Bubbles */}
          {messages.map((msg) => {
            const isMe = msg.Sender_ID === user?.User_ID;

            return (
              <motion.div
                key={msg.Message_ID}
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] sm:max-w-md rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                    isMe
                      ? 'bg-purple-600 text-white rounded-br-xs'
                      : 'bg-black/5 text-ink dark:bg-white/10 rounded-bl-xs'
                  }`}
                >
                  <p>{msg.Text}</p>
                  <span
                    className={`mt-1 block text-[10px] text-right font-mono ${
                      isMe ? 'text-purple-200' : 'text-ink-muted'
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
              className="mx-auto max-w-md rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center"
            >
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <Sparkles className="h-4 w-4" />
                <span>Deal Closed! Rate this buyer</span>
              </div>
              <p className="mt-1 text-[11px] text-ink-muted">
                How was your meetup with {otherUser?.Name}?
              </p>

              <form onSubmit={handleRateSubmit} className="mt-3 space-y-2.5">
                <div className="flex justify-center">
                  <RatingStars
                    value={ratingScore}
                    interactive
                    onChange={setRatingScore}
                    size={22}
                  />
                </div>
                <input
                  type="text"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Optional praise (e.g. prompt meetup, exact cash)..."
                  className="w-full rounded-xl border border-black/10 bg-white/80 px-3 py-1.5 text-xs text-ink placeholder-ink-muted/50 outline-none dark:border-white/10 dark:bg-black/50"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-700"
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
              className="mx-auto max-w-md rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 text-center"
            >
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300">
                <Sparkles className="h-4 w-4" />
                <span>You acquired this item! Rate this seller</span>
              </div>
              <p className="mt-1 text-[11px] text-ink-muted">
                Share your review for {otherUser?.Name}.
              </p>

              <form onSubmit={handleRateSubmit} className="mt-3 space-y-2.5">
                <div className="flex justify-center">
                  <RatingStars
                    value={ratingScore}
                    interactive
                    onChange={setRatingScore}
                    size={22}
                  />
                </div>
                <input
                  type="text"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Review condition and handoff..."
                  className="w-full rounded-xl border border-black/10 bg-white/80 px-3 py-1.5 text-xs text-ink placeholder-ink-muted/50 outline-none dark:border-white/10 dark:bg-black/50"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-700"
                >
                  Submit Seller Rating
                </button>
              </form>
            </motion.div>
          )}

          {/* Rating Submitted Acknowledgment */}
          {(alreadyRated || ratingSubmitted) && (
            <div className="mx-auto max-w-xs rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              ✓ Rating submitted! Thank you for supporting campus trust.
            </div>
          )}

          {/* Muted "Sold to someone else" banner for losing buyers */}
          {isLostBuyer && (
            <div className="mx-auto max-w-sm rounded-xl border border-black/10 bg-black/5 p-3 text-center text-xs font-medium text-ink-muted dark:border-white/10 dark:bg-white/5">
              This item has been sold to another student. Messages in this thread are now closed.
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-black/8 bg-surface-elevated/80 p-3.5 dark:border-white/10">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              disabled={isLostBuyer}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                isLostBuyer
                  ? 'Listing is closed'
                  : 'Type a message (e.g. proposing library meetup)...'
              }
              className="flex-1 rounded-2xl border border-black/10 bg-white/70 px-4 py-2.5 text-xs sm:text-sm text-ink placeholder-ink-muted/50 outline-none transition focus:border-purple-600 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:focus:border-purple-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLostBuyer}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-600 text-white transition-all hover:bg-purple-700 disabled:opacity-40"
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
              className="relative z-10 w-full max-w-md rounded-3xl border border-black/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#09090b]"
            >
              <h3 className="font-display text-lg font-bold text-ink">
                Sell "{item.Title}" to {otherUser?.Name}?
              </h3>
              <p className="mt-2 text-xs text-ink-muted leading-relaxed">
                This will close the listing, mark {otherUser?.Name} as the winning buyer, update the item to SOLD everywhere, and open the peer review prompt.
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSoldConfirm(false)}
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

      {/* DEAL CLOSED STAMP ANIMATION */}
      <AnimatePresence>
        {dealClosedStamp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
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
                Sold to {otherUser?.Name}. Peer rating prompt is now active!
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
