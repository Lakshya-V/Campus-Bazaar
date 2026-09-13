// src/pages/HomePage.tsx
import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowUpDown,
  SlidersHorizontal,
  Clock,
  RotateCcw,
  Plus,
  Eye,
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import ListingCard from '../components/listings/ListingCard';
import { PAGE_VARIANTS } from '../lib/motion';

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'views';

export default function HomePage() {
  const { items, categories, recentlyViewedIds, getItem } = useMarket();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCategory = searchParams.get('category') || 'All Categories';
  const searchQuery = searchParams.get('q') || '';

  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [priceFilter, setPriceFilter] = useState<'all' | 'under50' | '50to150' | 'over150'>('all');

  // Compute filtered & sorted items
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => item.Status === 'AVAILABLE') // Only AVAILABLE items in public grid
      .filter((item) => {
        if (selectedCategory !== 'All Categories' && selectedCategory !== 'cat_all') {
          return item.Category.toLowerCase() === selectedCategory.toLowerCase();
        }
        return true;
      })
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
        if (priceFilter === 'under50') return item.Price < 50;
        if (priceFilter === '50to150') return item.Price >= 50 && item.Price <= 150;
        if (priceFilter === 'over150') return item.Price > 150;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.Price - b.Price;
        if (sortBy === 'price_desc') return b.Price - a.Price;
        if (sortBy === 'views') return b.ViewCount - a.ViewCount;
        // Default newest
        return new Date(b.PostedAt).getTime() - new Date(a.PostedAt).getTime();
      });
  }, [items, selectedCategory, searchQuery, priceFilter, sortBy]);

  // Recently viewed items list
  const recentlyViewedItems = useMemo(() => {
    return recentlyViewedIds
      .map((id) => getItem(id))
      .filter((item): item is NonNullable<typeof item> => item !== undefined);
  }, [recentlyViewedIds, getItem]);

  function handleCategoryChange(catName: string) {
    const next = new URLSearchParams(searchParams);
    if (catName === 'All Categories') {
      next.delete('category');
    } else {
      next.set('category', catName);
    }
    setSearchParams(next, { replace: true });
  }

  function handleClearFilters() {
    setPriceFilter('all');
    setSortBy('newest');
    setSearchParams({}, { replace: true });
  }

  const hasActiveFilters =
    selectedCategory !== 'All Categories' ||
    searchQuery.trim() !== '' ||
    priceFilter !== 'all';

  return (
    <motion.div
      variants={PAGE_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-8 pb-16"
    >
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Verified Peer-to-Peer Campus Marketplace</span>
          </div>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Browse the bazaar
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Textbooks, dorm furniture, and tech essentials direct from verified students.
          </p>
        </div>

        {/* Quick Post an Item CTA in Header */}
        <Link
          to="/sell/new"
          className="inline-flex items-center gap-2 self-start rounded-2xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-purple-700 active:scale-95 dark:bg-purple-600 dark:hover:bg-purple-500 md:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Post an Item</span>
        </Link>
      </div>

      {/* Category Pills Filter Bar */}
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.Name;
          return (
            <button
              key={cat.Category_ID}
              type="button"
              onClick={() => handleCategoryChange(cat.Name)}
              className={`flex-shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-purple-600 text-white shadow-sm dark:bg-purple-600'
                  : 'border border-black/8 bg-white/70 text-ink hover:border-purple-500/30 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
              }`}
            >
              {cat.Name}
            </button>
          );
        })}
      </div>

      {/* Sticky Sort & Filter Bar */}
      <div className="sticky top-[61px] z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/8 bg-white/85 p-3 shadow-md backdrop-blur-xl dark:border-white/10 dark:bg-[#09090b]/85">
        {/* Left: Price Filter Pills */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="flex items-center gap-1 font-semibold text-ink-muted mr-1">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Budget:
          </span>
          {[
            { id: 'all', label: 'All' },
            { id: 'under50', label: '< $50' },
            { id: '50to150', label: '$50 – $150' },
            { id: 'over150', label: '> $150' },
          ].map((pf) => (
            <button
              key={pf.id}
              type="button"
              onClick={() => setPriceFilter(pf.id as typeof priceFilter)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                priceFilter === pf.id
                  ? 'bg-black/10 text-ink font-semibold dark:bg-white/15'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {pf.label}
            </button>
          ))}
        </div>

        {/* Right: Sticky Sort Bar */}
        <div className="flex items-center gap-1 text-xs">
          <span className="flex items-center gap-1 font-semibold text-ink-muted mr-1">
            <ArrowUpDown className="h-3.5 w-3.5" />
            Sort:
          </span>
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
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                sortBy === s.id
                  ? 'bg-purple-600 text-white font-semibold shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of ItemCards (with Apple3DCard treatment) */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => (
            <ListingCard key={item.Item_ID} item={item} />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty Filter State */}
      {filteredItems.length === 0 && (
        <div className="rounded-3xl border border-dashed border-black/10 bg-black/[0.01] py-16 text-center dark:border-white/15 dark:bg-white/[0.01]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <SlidersHorizontal className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-ink">
            No campus listings match your criteria
          </h3>
          <p className="mt-1 text-sm text-ink-muted">
            Try adjusting your search query, price bracket, or category filter.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* "Recently Viewed" Horizontal Row */}
      {recentlyViewedItems.length > 0 && (
        <div className="pt-6 border-t border-black/8 dark:border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <h2 className="font-display text-base font-bold text-ink">
                Recently Viewed on Campus
              </h2>
            </div>
            <span className="text-xs text-ink-muted">In this session</span>
          </div>

          <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
            {recentlyViewedItems.map((item) => (
              <Link
                key={item.Item_ID}
                to={`/item/${item.Item_ID}`}
                className="group flex w-60 flex-shrink-0 items-center gap-3 rounded-2xl border border-black/8 bg-surface-elevated p-2.5 transition-all hover:border-purple-500/40 hover:shadow-md dark:border-white/10"
              >
                <img
                  src={item.Images[0]}
                  alt={item.Title}
                  className="h-14 w-14 rounded-xl object-cover flex-shrink-0 group-hover:scale-105 transition-transform"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-xs font-semibold text-ink group-hover:text-purple-600 dark:group-hover:text-purple-400">
                    {item.Title}
                  </h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-display text-sm font-bold text-sell">
                      ${item.Price}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-ink-muted">
                      <Eye className="h-3 w-3" />
                      {item.ViewCount}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) for quick post */}
      <motion.div
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <Link
          to="/sell/new"
          aria-label="Post an item"
          className="flex items-center gap-2 rounded-full bg-purple-600 px-5 py-3 text-sm font-bold text-white shadow-2xl shadow-purple-600/50 transition-all hover:bg-purple-700"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          <span>Post an Item</span>
        </Link>
      </motion.div>
    </motion.div>
  );
}