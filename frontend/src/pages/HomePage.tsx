// src/pages/HomePage.tsx
import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowUpDown,
  ArrowRight,
  RotateCcw,
  SlidersHorizontal,
  Laptop,
  BookOpen,
  Armchair,
  Coffee,
  Bike,
  Layers,
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import ListingCard from '../components/listings/ListingCard';
import FeaturedSpotlightCarousel from '../components/home/FeaturedSpotlightCarousel';
import BudgetRangeSlider from '../components/home/BudgetRangeSlider';
import MarketplaceFooter from '../components/layout/MarketplaceFooter';
import { CATEGORY_METAS, getCategorySlug } from '../data/mockMarketData';
import { PAGE_VARIANTS } from '../lib/motion';

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'views';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'electronics-tech': Laptop,
  textbooks: BookOpen,
  'dorm-furniture': Armchair,
  appliances: Coffee,
  'transport-sports': Bike,
};

export default function HomePage() {
  const navigate = useNavigate();
  const { items, categories, fetchListings } = useMarket();
  const [searchParams, setSearchParams] = useSearchParams();
  const conditionFilter = searchParams.get('condition') || '';

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    void fetchListings({
      search: searchParams.get('q') || undefined,
      condition: conditionFilter || undefined,
    });
  }, [conditionFilter, fetchListings, searchParams]);

  const searchQuery = searchParams.get('q') || '';
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  // Interactive budget limit: 500 = All Prices (no upper cap)
  const [maxBudget, setMaxBudget] = useState<number>(500);

  // Filter & sort items across all categories
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => item.Status === 'AVAILABLE')
      .filter((item) => !conditionFilter || item.Condition === conditionFilter)
      .filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.Title.toLowerCase().includes(q) ||
          item.Description.toLowerCase().includes(q) ||
          item.Category.toLowerCase().includes(q)
        );
      })
      .filter((item) => {
        if (maxBudget < 500) {
          return item.Price <= maxBudget;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.Price - b.Price;
        if (sortBy === 'price_desc') return b.Price - a.Price;
        if (sortBy === 'views') return b.ViewCount - a.ViewCount;
        return new Date(b.PostedAt).getTime() - new Date(a.PostedAt).getTime();
      });
  }, [items, searchQuery, conditionFilter, maxBudget, sortBy]);

  // Group filtered items by category, capped at 4 items per category row
  const categorySections = useMemo(() => {
    return categories
      .filter((cat) => cat.Name !== 'All Categories')
      .map((cat) => {
        const foundMeta = CATEGORY_METAS.find(
          (m) => m.name.toLowerCase() === cat.Name.toLowerCase() || m.id === cat.Category_ID
        );
        const meta = foundMeta || {
          id: cat.Category_ID,
          slug: getCategorySlug(cat.Name),
          name: cat.Name,
          description: `Browse student listings in ${cat.Name}.`,
        };

        const allAvailableInCat = items.filter(
          (item) =>
            item.Status === 'AVAILABLE' &&
            item.Category.toLowerCase() === cat.Name.toLowerCase()
        );

        const matchingFiltered = filteredItems.filter(
          (item) => item.Category.toLowerCase() === cat.Name.toLowerCase()
        );

        return {
          meta,
          totalAvailable: allAvailableInCat.length,
          items: matchingFiltered.slice(0, 4), // Capped preview row: max 4 items
          hasMatches: matchingFiltered.length > 0,
        };
      });
  }, [categories, items, filteredItems]);

  function handleCategoryPillClick(catName: string) {
    if (catName === 'All Categories' || catName === 'cat_all') {
      // Stay on HomePage discovery preview
      navigate('/');
    } else {
      // Direct navigation to dedicated /category/:categoryId full view
      const slug = getCategorySlug(catName);
      navigate(`/category/${slug}`);
    }
  }

  function handleClearFilters() {
    setMaxBudget(500);
    setSortBy('newest');
    setSearchParams({}, { replace: true });
  }

  const hasActiveFilters = searchQuery.trim() !== '' || maxBudget < 500;
  const hasAnyMatches = categorySections.some((sec) => sec.hasMatches);

  return (
    <motion.div
      variants={PAGE_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-10 pb-12"
    >
      {/* ═══════════════════════════════════════════════════════════════
          1. HERO HEADING — CENTER-ALIGNED
          ═══════════════════════════════════════════════════════════════ */}
      <div className="relative flex flex-col items-center justify-center py-8 text-center sm:py-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between px-2 text-left sm:px-10">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="hidden items-center gap-2 rounded-full border border-black/5 bg-white/65 px-3 py-2 text-[10px] font-medium text-zinc-500 shadow-[0_12px_30px_rgba(0,0,0,0.06)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/65 dark:text-zinc-400 sm:flex"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500" />
            Live campus feed
          </motion.div>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
            className="hidden items-center gap-2 rounded-full border border-black/5 bg-white/65 px-3 py-2 text-[10px] font-medium text-zinc-500 shadow-[0_12px_30px_rgba(0,0,0,0.06)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/65 dark:text-zinc-400 sm:flex"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400" />
            Verified students only
          </motion.div>
        </div>
        <div className="mb-4 inline-flex items-center rounded-full border border-black/5 bg-white/70 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/70 dark:text-zinc-400">
          Campus marketplace
        </div>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-6xl leading-tight">
          Browse the bazaar
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-base">
          Textbooks, dorm furniture, and tech essentials direct from verified students across campus.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          2. CAMPUS SPOTLIGHT CAROUSEL (Directly below hero heading)
          ═══════════════════════════════════════════════════════════════ */}
      {!hasActiveFilters && items.length > 0 && (
        <FeaturedSpotlightCarousel items={items} autoAdvanceSeconds={13} />
      )}

      {/* ═══════════════════════════════════════════════════════════════
          3. CATEGORY PILLS & FILTERS
          ═══════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        {/* Category Navigation Pills */}
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto rounded-3xl border border-black/5 bg-white/60 p-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.05)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/60 pb-1">
          {categories.map((cat) => {
            const isAll = cat.Name === 'All Categories';
            return (
              <button
                key={cat.Category_ID}
                type="button"
                onClick={() => handleCategoryPillClick(cat.Name)}
                className={`relative flex-shrink-0 rounded-2xl px-4 py-2 text-xs font-semibold tracking-tight transition-transform cursor-pointer ${
                  isAll
                    ? 'text-white dark:text-zinc-950'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
              >
                {isAll && (
                  <motion.span
                    layoutId="active-category"
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                    className="absolute inset-0 -z-0 rounded-2xl bg-zinc-900 shadow-sm dark:bg-zinc-100"
                  />
                )}
                <span className="relative z-10">{cat.Name}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Controls Bar: Interactive Budget Slider & Sort Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-black/5 bg-white/65 p-3 shadow-[0_20px_50px_rgba(0,0,0,0.06)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/65 sm:px-5 sm:py-3">
          {/* Draggable Budget Range Slider */}
          <BudgetRangeSlider
            value={maxBudget}
            onChange={(val) => setMaxBudget(val)}
          />
          <select
            value={conditionFilter}
            onChange={(event) => {
              const next = new URLSearchParams(searchParams);
              if (event.target.value) next.set('condition', event.target.value);
              else next.delete('condition');
              setSearchParams(next, { replace: true });
            }}
            className="rounded-full border border-borderline bg-surface-base px-3 py-2 text-xs text-ink outline-none"
            aria-label="Filter by condition"
          >
            <option value="">All conditions</option>
            <option value="new">New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
          </select>

          {/* Right: Sticky Sort Segmented Control */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-ink-muted mr-1">
              <ArrowUpDown className="h-3 w-3" />
              Sort:
            </span>
            <div className="flex items-center gap-1 rounded-2xl bg-zinc-100/80 p-1 dark:bg-zinc-800/80">
              {[
                { id: 'newest', label: 'Newest' },
                { id: 'price_asc', label: 'Price: Low-High' },
                { id: 'price_desc', label: 'Price: High-Low' },
                { id: 'views', label: 'Most Viewed' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSortBy(s.id as SortOption)}
                  className={`relative rounded-xl px-3 py-1 text-[11px] font-medium transition-transform cursor-pointer ${
                    sortBy === s.id
                      ? 'text-white dark:text-zinc-950 font-semibold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                  }`}
                >
                  {sortBy === s.id && (
                    <motion.span
                      layoutId="active-sort"
                      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                      className="absolute inset-0 -z-0 rounded-xl bg-zinc-900 dark:bg-zinc-100"
                    />
                  )}
                  <span className="relative z-10">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          4. CAPPED PREVIEW ROWS PER CATEGORY (Replaces single long grid)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="space-y-12">
        {categorySections.map(({ meta, totalAvailable, items: catItems, hasMatches }) => {
          if (!hasMatches) return null;
          const Icon = CATEGORY_ICONS[meta.slug] || Layers;

          return (
            <section
              key={meta.id}
              aria-label={`${meta.name} listings preview`}
              className="space-y-4"
            >
              {/* Category Section Header with "View all" action */}
              <div className="flex items-center justify-between border-b border-borderline pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2F6FED]/10 text-[#2F6FED] dark:text-[#4F8CFF]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h2 className="font-display text-lg font-bold text-ink sm:text-xl">
                    {meta.name}
                  </h2>
                  <span className="rounded-full bg-surface-elevated border border-borderline px-2.5 py-0.5 text-[11px] font-semibold text-ink-muted">
                    {totalAvailable} {totalAvailable === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/category/${meta.slug}`)}
                  className="group inline-flex items-center gap-1.5 text-xs font-semibold text-[#2F6FED] hover:text-[#1A54D4] dark:text-[#4F8CFF] dark:hover:text-[#70A5FF] transition-colors cursor-pointer"
                >
                  <span>View all in {meta.name}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              {/* Capped 4-Item Preview Grid */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {catItems.map((item) => (
                  <div key={item.Item_ID} className="h-full">
                    <ListingCard item={item} />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Empty Filter State (if no categories match criteria) */}
      {!hasAnyMatches && (
        <div className="rounded-3xl border border-dashed border-borderline bg-black/[0.01] py-16 text-center dark:bg-white/[0.01]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2F6FED]/10 text-[#2F6FED] dark:text-[#4F8CFF]">
            <SlidersHorizontal className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-ink">
            No campus listings match your criteria
          </h3>
          <p className="mt-1 text-sm text-ink-muted">
            Try adjusting your search query, budget slider, or category filter.
          </p>
          <button
            type="button"
            onClick={handleClearFilters}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-borderline bg-surface px-4 py-2 text-xs font-semibold text-ink shadow-xs transition-colors hover:bg-surface-elevated cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset all filters
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          5. BOTTOM FOOTER SEQUENCE (Rules -> About/Credits -> Quotes -> Marquee)
          ═══════════════════════════════════════════════════════════════ */}
      <MarketplaceFooter />
    </motion.div>
  );
}