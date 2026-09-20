// src/pages/CategoryPage.tsx
import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowUpDown,
  RotateCcw,
  SlidersHorizontal,
  Layers,
  Laptop,
  BookOpen,
  Armchair,
  Coffee,
  Bike,
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import ListingCard from '../components/listings/ListingCard';
import BudgetRangeSlider from '../components/home/BudgetRangeSlider';
import MarketplaceFooter from '../components/layout/MarketplaceFooter';
import { findCategoryMeta, getCategorySlug } from '../data/mockMarketData';
import { PAGE_VARIANTS } from '../lib/motion';

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'views';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'electronics-tech': Laptop,
  textbooks: BookOpen,
  'dorm-furniture': Armchair,
  appliances: Coffee,
  'transport-sports': Bike,
};

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { items, categories, fetchListings } = useMarket();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [categoryId]);

  const matchedCustomCat = useMemo(() => {
    return categories.find(
      (c) =>
        getCategorySlug(c.Name) === categoryId ||
        c.Name.toLowerCase() === (categoryId || '').toLowerCase() ||
        c.Category_ID === categoryId
    );
  }, [categories, categoryId]);

  const categoryMeta = findCategoryMeta(categoryId || '');
  const targetCategoryName = categoryMeta
    ? categoryMeta.name
    : matchedCustomCat
    ? matchedCustomCat.Name
    : categoryId || '';
  const currentSlug = categoryMeta
    ? categoryMeta.slug
    : matchedCustomCat
    ? getCategorySlug(matchedCustomCat.Name)
    : getCategorySlug(targetCategoryName);
  const conditionFilter = searchParams.get('condition') || '';

  useEffect(() => {
    const categoryIdForApi = matchedCustomCat?.Category_ID;
    void fetchListings({
      search: searchParams.get('q') || undefined,
      condition: conditionFilter || undefined,
      category: categoryIdForApi && /^\d+$/.test(categoryIdForApi) ? categoryIdForApi : undefined,
    });
  }, [conditionFilter, fetchListings, matchedCustomCat, searchParams]);

  const searchQuery = searchParams.get('q') || '';
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [maxBudget, setMaxBudget] = useState<number>(500);

  const CategoryIcon = CATEGORY_ICONS[currentSlug] || Layers;

  // Filter & sort scoped specifically to this category
  const categoryItems = useMemo(() => {
    return items
      .filter((item) => item.Status === 'AVAILABLE')
      .filter((item) => !conditionFilter || item.Condition === conditionFilter)
      .filter((item) => {
        // Match category name or slug
        const itemCatLower = item.Category.toLowerCase();
        const targetLower = targetCategoryName.toLowerCase();
        if (categoryMeta) {
          return (
            itemCatLower === categoryMeta.name.toLowerCase() ||
            itemCatLower.includes(categoryMeta.slug.replace('-', ' '))
          );
        }
        return (
          itemCatLower === targetLower ||
          getCategorySlug(item.Category) === currentSlug
        );
      })
      .filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.Title.toLowerCase().includes(q) ||
          item.Description.toLowerCase().includes(q)
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
  }, [items, targetCategoryName, categoryMeta, currentSlug, searchQuery, conditionFilter, maxBudget, sortBy]);

  function handleCategoryPillClick(catName: string) {
    if (catName === 'All Categories' || catName === 'cat_all') {
      navigate('/');
    } else {
      navigate(`/category/${getCategorySlug(catName)}`);
    }
  }

  function handleClearFilters() {
    setMaxBudget(500);
    setSortBy('newest');
    setSearchParams({}, { replace: true });
  }

  return (
    <motion.div
      variants={PAGE_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-8 pb-12"
    >
      {/* Top Breadcrumb / Back Navigation */}
      <div className="flex items-center justify-between border-b border-borderline pb-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted hover:text-ink transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to All Categories</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-ink-muted">
          <span className="hover:text-ink cursor-pointer" onClick={() => navigate('/')}>
            Bazaar
          </span>
          <span>/</span>
          <span className="text-ink font-semibold">{targetCategoryName}</span>
        </div>
      </div>

      {/* Category Header */}
      <div className="rounded-3xl border border-borderline bg-surface/70 p-6 sm:p-8 backdrop-blur-xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[#2F6FED]/10 text-[#2F6FED] dark:text-[#4F8CFF] border border-[#2F6FED]/20">
              <CategoryIcon className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                  {targetCategoryName}
                </h1>
                <span className="rounded-full bg-[#2F6FED]/10 px-2.5 py-0.5 text-xs font-semibold text-[#2F6FED] dark:text-[#4F8CFF] border border-[#2F6FED]/20">
                  {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-ink-muted max-w-xl leading-relaxed">
                {categoryMeta?.description ||
                  `Browse peer-to-peer student listings for ${targetCategoryName}.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Navigation Pills */}
      <div className="space-y-4">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => {
            const isAll = cat.Name === 'All Categories';
            const catSlug = getCategorySlug(cat.Name);
            const isSelected = !isAll && catSlug === currentSlug;

            return (
              <button
                key={cat.Category_ID}
                type="button"
                onClick={() => handleCategoryPillClick(cat.Name)}
                className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#2F6FED] text-white shadow-sm'
                    : 'border border-borderline bg-surface text-ink hover:bg-surface-elevated'
                }`}
              >
                {cat.Name}
              </button>
            );
          })}
        </div>

        {/* Scoped Filter Controls: Interactive Budget Slider & Sort Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-borderline bg-surface/90 p-3 sm:px-5 sm:py-3 shadow-sm backdrop-blur-xl">
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

      {/* Full Category Grid */}
      <motion.div
        key={`${currentSlug}-${maxBudget}-${sortBy}-${searchQuery}`}
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 },
          },
        }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <AnimatePresence mode="popLayout">
          {categoryItems.map((item) => (
            <motion.div
              key={item.Item_ID}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    type: 'spring',
                    stiffness: 280,
                    damping: 24,
                  },
                },
              }}
              className="h-full"
            >
              <ListingCard item={item} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty Filter State */}
      {categoryItems.length === 0 && (
        <div className="rounded-3xl border border-dashed border-borderline bg-black/[0.01] py-16 text-center dark:bg-white/[0.01]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2F6FED]/10 text-[#2F6FED] dark:text-[#4F8CFF]">
            <SlidersHorizontal className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-ink">
            No listings found in {targetCategoryName}
          </h3>
          <p className="mt-1 text-sm text-ink-muted">
            Try adjusting your budget range or clearing active search keywords.
          </p>
          <button
            type="button"
            onClick={handleClearFilters}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-borderline bg-surface px-4 py-2 text-xs font-semibold text-ink shadow-xs transition-colors hover:bg-surface-elevated cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset category filters
          </button>
        </div>
      )}

      {/* Multi-Tier Footer */}
      <MarketplaceFooter />
    </motion.div>
  );
}
