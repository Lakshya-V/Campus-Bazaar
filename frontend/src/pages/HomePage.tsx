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
  const { items, categories } = useMarket();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const searchQuery = searchParams.get('q') || '';
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  // Interactive budget limit: 500 = All Prices (no upper cap)
  const [maxBudget, setMaxBudget] = useState<number>(500);

  // Filter & sort items across all categories
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => item.Status === 'AVAILABLE')
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
  }, [items, searchQuery, maxBudget, sortBy]);

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
      <div className="flex flex-col items-center justify-center text-center py-3">
        <div className="inline-flex items-center rounded-full px-3.5 py-1 text-[10px] font-semibold uppercase tracking-wider bg-[#111318] text-[#FFFFFF] dark:bg-[#F2F3F5] dark:text-[#0D0F12] border border-borderline mb-3 shadow-xs">
          Campus Marketplace · Verified Students
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-6xl text-center leading-tight">
          Browse the bazaar
        </h1>
        <p className="mt-3 text-sm sm:text-base text-ink-muted max-w-xl font-body text-center mx-auto leading-relaxed">
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
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => {
            const isAll = cat.Name === 'All Categories';
            return (
              <button
                key={cat.Category_ID}
                type="button"
                onClick={() => handleCategoryPillClick(cat.Name)}
                className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  isAll
                    ? 'bg-[#2F6FED] text-white shadow-sm'
                    : 'border border-borderline bg-surface text-ink hover:bg-surface-elevated'
                }`}
              >
                {cat.Name}
              </button>
            );
          })}
        </div>

        {/* Filter Controls Bar: Interactive Budget Slider & Sort Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-borderline bg-surface/90 p-3 sm:px-5 sm:py-3 shadow-sm backdrop-blur-xl">
          {/* Draggable Budget Range Slider */}
          <BudgetRangeSlider
            value={maxBudget}
            onChange={(val) => setMaxBudget(val)}
          />

          {/* Right: Sticky Sort Segmented Control */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-ink-muted mr-1">
              <ArrowUpDown className="h-3 w-3" />
              Sort:
            </span>
            <div className="flex items-center gap-1 rounded-full border border-borderline bg-surface-base p-1">
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
                  className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                    sortBy === s.id
                      ? 'bg-[#111318] text-[#FFFFFF] dark:bg-[#F2F3F5] dark:text-[#0D0F12] font-semibold shadow-xs'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {s.label}
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