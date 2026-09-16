// src/components/home/FeaturedSpotlightCarousel.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import type { Item, User } from '../../types/market';
import { useMarket } from '../../context/MarketContext';
import RatingStars from '../common/RatingStars';
import { useCartSwipe } from '../../context/CartSwipeContext';

interface FeaturedSpotlightCarouselProps {
  items: Item[];
  autoAdvanceSeconds?: number;
  onItemClick?: (itemId: string) => void;
}

const CONDITION_BADGES: Record<string, { bg: string; text: string }> = {
  new: { bg: 'bg-[#1AA260]', text: 'text-white' },
  good: { bg: 'bg-[#2F6FED]', text: 'text-white' },
  fair: { bg: 'bg-[#E0912B]', text: 'text-white' },
};

function SpotlightCard({
  item,
  onItemClick,
  triggerCartSwipe,
  getUser,
}: {
  item: Item;
  onItemClick?: (id: string) => void;
  triggerCartSwipe: (path: string) => void;
  getUser: (id: string) => User | undefined;
}) {
  const seller = getUser(item.Seller_ID);
  const conditionInfo =
    CONDITION_BADGES[item.Condition.toLowerCase()] || {
      bg: 'bg-surface-elevated',
      text: 'text-ink-muted',
    };

  return (
    <div className="flex flex-col h-full overflow-hidden rounded-2xl border border-borderline bg-surface shadow-sm transition-colors">
      {/* Image Banner */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-elevated">
        <img
          src={item.Images[0]}
          alt={item.Title}
          className="h-full w-full object-cover"
        />
        <span className="absolute left-3 top-3 rounded-full border border-borderline bg-[#111318] px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white shadow-xs dark:bg-[#F2F3F5] dark:text-[#0D0F12]">
          FEATURED PICK
        </span>
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider shadow-xs ${conditionInfo.bg} ${conditionInfo.text}`}
        >
          {item.Condition.toUpperCase()}
        </span>
      </div>

      {/* Info Block */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5 space-y-3">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center rounded-full border border-borderline bg-surface-elevated px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-secondary">
              {item.Category}
            </span>
            {seller && (
              <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                <span className="font-medium text-ink truncate max-w-[100px]">
                  {seller.Name}
                </span>
                {seller.IsVerified && (
                  <ShieldCheck className="h-3.5 w-3.5 text-[#2F6FED]" />
                )}
                <RatingStars value={seller.Rating} size={11} showScore />
              </div>
            )}
          </div>

          <h3 className="truncate font-semibold text-sm sm:text-base text-ink font-body">
            {item.Title}
          </h3>

          <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed">
            {item.Description}
          </p>
        </div>

        {/* Price & Action Row */}
        <div className="flex items-center justify-between pt-2 border-t border-borderline mt-auto">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              ${item.Price}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-ink-muted">
              peer price
            </span>
          </div>

          {/* Direct "View listing" action with Cart Swipe wipe */}
          <button
            type="button"
            onClick={() => {
              if (onItemClick) {
                onItemClick(item.Item_ID);
              } else {
                triggerCartSwipe(`/item/${item.Item_ID}`);
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#F2994A] px-4 py-2 text-xs font-semibold text-[#10131A] shadow-xs transition-all hover:bg-[#D97B2B] active:scale-95 cursor-pointer"
          >
            <span>View listing</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FeaturedSpotlightCarousel({
  items,
  autoAdvanceSeconds = 13,
  onItemClick,
}: FeaturedSpotlightCarouselProps) {
  const { getUser } = useMarket();
  const { triggerCartSwipe } = useCartSwipe();

  // Responsive state for mobile vs desktop
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Pick top 6 featured available items with images
  const featuredList = useMemo(() => {
    return items
      .filter((i) => i.Status === 'AVAILABLE' && i.Images.length > 0)
      .slice(0, 6);
  }, [items]);

  // Group into pairs for desktop, or singles for mobile
  const slides = useMemo(() => {
    if (isMobile) {
      return featuredList.map((item) => [item]);
    }
    const chunked: Item[][] = [];
    for (let i = 0; i < featuredList.length; i += 2) {
      chunked.push(featuredList.slice(i, i + 2));
    }
    return chunked;
  }, [featuredList, isMobile]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(true);

  const totalSlides = slides.length;
  const safeIndex = totalSlides > 0 ? currentIndex % totalSlides : 0;

  const nextSlide = useCallback(() => {
    if (totalSlides === 0) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    if (totalSlides === 0) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Dynamic timing: Observe #navbar-search-bar visibility
  // Default ~12-14s (13s) when in view; 6.5s when scrolled out of view
  useEffect(() => {
    const searchEl = document.getElementById('navbar-search-bar');
    if (!searchEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSearchBarVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(searchEl);
    return () => observer.disconnect();
  }, []);

  const currentInterval = isSearchBarVisible ? autoAdvanceSeconds : 6.5;

  // Auto-advance timer: switches interval dynamically and cleans up on unmount
  useEffect(() => {
    if (totalSlides <= 1) return;

    const timer = setInterval(() => {
      nextSlide();
    }, currentInterval * 1000);

    return () => clearInterval(timer);
  }, [nextSlide, currentInterval, totalSlides]);

  if (totalSlides === 0) return null;

  const currentPair = slides[safeIndex] || [];

  // Horizontal slide animation variants (clean slide + fade, applied to the pair as one unit)
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 120 : -120,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring' as const, stiffness: 320, damping: 28 },
        opacity: { duration: 0.25 },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -120 : 120,
      opacity: 0,
      transition: {
        x: { type: 'spring' as const, stiffness: 320, damping: 28 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  return (
    <section
      aria-label="Featured Campus Spotlight"
      className="my-6 flex flex-col items-center justify-center w-full"
    >
      {/* Small Header Tag — strictly 'CAMPUS SPOTLIGHT' without auto-rotating suffix */}
      <div className="mb-2.5 flex items-center gap-1.5 text-center">
        <Sparkles className="h-3.5 w-3.5 text-[#F2994A]" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          Campus Spotlight
        </span>
      </div>

      {/* Widened Spotlight Container: up to 1040px on desktop, ~480px on mobile */}
      <div
        className={`relative w-full transition-all duration-300 ${
          isMobile ? 'max-w-[480px]' : 'max-w-[1040px]'
        }`}
      >
        {/* Navigation Arrow Left */}
        {totalSlides > 1 && (
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous featured pair"
            className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-borderline bg-surface/90 text-ink shadow-md backdrop-blur-md transition-all hover:scale-110 active:scale-95 focus:outline-none cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {/* Navigation Arrow Right */}
        {totalSlides > 1 && (
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next featured pair"
            className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-borderline bg-surface/90 text-ink shadow-md backdrop-blur-md transition-all hover:scale-110 active:scale-95 focus:outline-none cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Card Body with AnimatePresence slide — both cards move together as one unit */}
        <div className="overflow-hidden rounded-2xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`slide-${safeIndex}-${isMobile ? 'm' : 'd'}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className={`grid gap-4 sm:gap-6 ${
                isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
              }`}
            >
              {currentPair.map((item) => (
                <SpotlightCard
                  key={item.Item_ID}
                  item={item}
                  onItemClick={onItemClick}
                  triggerCartSwipe={triggerCartSwipe}
                  getUser={getUser}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dot & Progress Indicators (reflects position by PAIR, e.g. 3 dots for 6 items) */}
        {totalSlides > 1 && (
          <div className="mt-3.5 flex items-center justify-center gap-2">
            {slides.map((_, index) => {
              const isActive = index === safeIndex;
              return (
                <button
                  key={`dot-${index}`}
                  type="button"
                  onClick={() => {
                    setDirection(index > safeIndex ? 1 : -1);
                    setCurrentIndex(index);
                  }}
                  aria-label={`Go to slide ${index + 1}`}
                  className="group relative flex h-4 items-center focus:outline-none cursor-pointer"
                >
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isActive
                        ? 'w-7 bg-surface-elevated border border-borderline overflow-hidden'
                        : 'w-2 bg-ink-muted/30 group-hover:bg-ink-muted/60'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        key={`progress-${safeIndex}-${currentInterval}`}
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{
                          duration: currentInterval,
                          ease: 'linear',
                        }}
                        className="h-full bg-[#2F6FED] rounded-full"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
