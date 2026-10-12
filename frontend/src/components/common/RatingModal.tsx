import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, CheckCircle2, Sparkles } from 'lucide-react';
import { useMarket } from '../../context/MarketContext';
import { getApiErrorMessage } from '../../api/axios';
import { MODAL_BACKDROP_VARIANTS, MODAL_CONTENT_VARIANTS } from '../../lib/motion';

export interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: number | string;
  sellerName: string;
  sellerId: string;
  onSuccess?: () => void;
}

export default function RatingModal({
  isOpen,
  onClose,
  conversationId,
  sellerName,
  sellerId,
  onSuccess,
}: RatingModalProps) {
  const { addRating } = useMarket();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await addRating(String(conversationId), sellerId, rating, comment.trim());
      setIsSuccess(true);
      onSuccess?.();

      setTimeout(() => {
        setIsSuccess(false);
        setComment('');
        setRating(5);
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to submit review.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          variants={MODAL_BACKDROP_VARIANTS}
          initial="closed"
          animate="open"
          exit="closed"
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Dialog */}
        <motion.div
          variants={MODAL_CONTENT_VARIANTS}
          initial="closed"
          animate="open"
          exit="closed"
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-borderline bg-surface/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close review modal"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-elevated hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>

          {isSuccess ? (
            <div className="py-6 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-[#1AA260]" />
              <h3 className="mt-3 font-display text-xl font-bold text-ink">
                Review Submitted!
              </h3>
              <p className="mt-1 text-xs text-ink-muted">
                Thank you for rating {sellerName}. Your feedback helps keep Campus Bazaar trustworthy.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2F6FED]/10 text-[#2F6FED]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h2 className="font-display text-lg font-bold text-ink">
                  Rate Seller: {sellerName}
                </h2>
                <p className="mt-1 text-xs text-ink-muted">
                  Share your experience with this campus student hand-off.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-status-danger/20 bg-status-danger/10 p-3 text-xs text-status-danger"
                >
                  {error}
                </div>
              )}

              {/* Star Rating Selector */}
              <div className="flex flex-col items-center justify-center gap-1.5 py-2">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const activeScore = hoverRating ?? rating;
                    const isFilled = starValue <= activeScore;

                    return (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() => setRating(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 transition-transform hover:scale-125 focus:outline-none"
                        aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
                      >
                        <Star
                          className={`h-7 w-7 transition-colors ${
                            isFilled
                              ? 'fill-[#F2A93B] text-[#F2A93B]'
                              : 'text-ink-muted/30 hover:text-ink-muted'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs font-semibold text-ink-secondary">
                  {rating === 5 && 'Outstanding peer (5/5)'}
                  {rating === 4 && 'Great experience (4/5)'}
                  {rating === 3 && 'Average exchange (3/5)'}
                  {rating === 2 && 'Below expectations (2/5)'}
                  {rating === 1 && 'Poor experience (1/5)'}
                </span>
              </div>

              {/* Review Comment */}
              <div>
                <label
                  htmlFor="rating-comment"
                  className="mb-1.5 block text-xs font-semibold text-ink"
                >
                  Feedback & Comments
                </label>
                <textarea
                  id="rating-comment"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Fast meetup, item matched description, friendly..."
                  className="w-full resize-none rounded-xl border border-borderline bg-surface-base px-4 py-2.5 text-xs text-ink outline-none transition focus:border-[#2F6FED]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-full border border-borderline py-2.5 text-xs font-semibold text-ink transition hover:bg-surface-elevated"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-full bg-[#2F6FED] py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1B4FC4] disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting…' : 'Submit Rating'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
