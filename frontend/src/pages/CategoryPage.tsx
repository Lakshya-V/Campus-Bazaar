// src/pages/CategoryPage.tsx
import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowUpDown,
  Layers,
  Laptop,
  BookOpen,
  Armchair,
  Coffee,
  Bike,
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import ListingCard from '../components/listings/ListingCard';
import ListingCardSkeleton from '../components/listings/ListingCardSkeleton';
import BudgetRangeSlider from '../components/home/BudgetRangeSlider';
import SelectMenu from '../components/common/SelectMenu';
import MarketplaceFooter from '../components/layout/MarketplaceFooter';
import { findCategoryMeta, getCategorySlug } from '../data/mockMarketData';
import { PAGE_VARIANTS } from '../lib/motion';

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'views';

function conditionKey(value: string): string {
  const key = value.toLowerCase().trim().replace(/[\s-]+/g, '_');
  if (key === 'brand_new') return 'new';
  if (key === 'fair_use') return 'fair';
  if (key === 'books_&_notes' || key === 'books_and_notes') return 'used';
  return key;
}

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
  const {
    items,
    categories,
    fetchListings,
    isLoadingListings,
    listingFetchError,
  } = useMarket();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedCategory = categoryId || searchParams.get('category') || '';
  const searchQuery = searchParams.get('q') || '';
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [resolvedRequestKey, setResolvedRequestKey] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [requestedCategory]);

  const matchedCustomCat = useMemo(() => {
    if (!requestedCategory) return undefined;
    return categories.find(
      (c) =>
        (c.Slug || getCategorySlug(c.Name)) === requestedCategory ||
        c.Name.toLowerCase() === requestedCategory.toLowerCase() ||
        c.Category_ID === requestedCategory
    );
  }, [categories, requestedCategory]);

  const categoryMeta = requestedCategory ? findCategoryMeta(requestedCategory) : undefined;
  const targetCategoryName = !requestedCategory
    ? 'All Categories'
    : matchedCustomCat
    ? matchedCustomCat.Name
    : categoryMeta
    ? categoryMeta.name
    : requestedCategory;
  const currentSlug = matchedCustomCat
    ? matchedCustomCat.Slug || getCategorySlug(matchedCustomCat.Name)
    : categoryMeta
    ? categoryMeta.slug
    : getCategorySlug(targetCategoryName);
  const conditionFilter = searchParams.get('condition') || '';

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const filters = {
      search: debouncedSearch || undefined,
      condition: conditionFilter || undefined,
      category: requestedCategory ? currentSlug : undefined,
    };
    const requestKey = JSON.stringify(filters);
    let cancelled = false;
    void fetchListings(filters)
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setResolvedRequestKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [
    conditionFilter,
    currentSlug,
    debouncedSearch,
    fetchListings,
    requestedCategory,
  ]);
  const listingRequestKey = JSON.stringify({
    search: debouncedSearch || undefined,
    condition: conditionFilter || undefined,
    category: requestedCategory ? currentSlug : undefined,
  });
  const isLoadingCategory = isLoadingListings || resolvedRequestKey !== listingRequestKey;

  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [maxBudget, setMaxBudget] = useState<number>(10000);
  const [settledBudget, setSettledBudget] = useState<number>(10000);

  useEffect(() => {
    const timer = window.setTimeout(() => setSettledBudget(maxBudget), 300);
    return () => window.clearTimeout(timer);
  }, [maxBudget]);

  const CategoryIcon = CATEGORY_ICONS[currentSlug] || Layers;

  // Filter & sort scoped specifically to this category
  const categoryItems = useMemo(() => {
    return items
      .filter((item) => item.Status === 'AVAILABLE')
      .filter((item) => !conditionFilter || conditionKey(item.Condition) === conditionKey(conditionFilter))
      .filter((item) => {
        if (!requestedCategory) return true;
        if (matchedCustomCat) {
          return item.Category.toLowerCase() === matchedCustomCat.Name.toLowerCase();
        }
        // Match category name or slug
        const itemCatLower = item.Category.toLowerCase();
        const targetLower = targetCategoryName.toLowerCase();
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
        if (settledBudget < 10000) {
          return item.Price <= settledBudget;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.Price - b.Price;
        if (sortBy === 'price_desc') return b.Price - a.Price;
        if (sortBy === 'views') return b.ViewCount - a.ViewCount;
        return new Date(b.PostedAt).getTime() - new Date(a.PostedAt).getTime();
      });
  }, [items, requestedCategory, matchedCustomCat, targetCategoryName, currentSlug, searchQuery, conditionFilter, settledBudget, sortBy]);

  function handleCategoryPillClick(catName: string, categorySlug?: string) {
    if (catName === 'All Categories' || catName === 'cat_all') {
      navigate('/browse');
    } else {
      const slug = categorySlug || getCategorySlug(catName);
      navigate(`/browse?category=${encodeURIComponent(slug)}`);
    }
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
            const catSlug = cat.Slug || getCategorySlug(cat.Name);
            const isSelected = !isAll && catSlug === currentSlug;

            return (
              <button
                key={cat.Category_ID}
                type="button"
                onClick={() => handleCategoryPillClick(cat.Name, cat.Slug)}
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
          <SelectMenu
            value={conditionFilter}
            onChange={(value) => {
              const next = new URLSearchParams(searchParams);
              if (value) next.set('condition', value);
              else next.delete('condition');
              setSearchParams(next, { replace: true });
            }}
            className="rounded-full border border-borderline bg-surface-base px-3 py-2 text-xs text-ink outline-none"
            aria-label="Filter by condition"
            options={[
              { value: '', label: 'All conditions' },
              { value: 'new', label: 'New' },
              { value: 'like_new', label: 'Like New' },
              { value: 'good', label: 'Good' },
              { value: 'fair', label: 'Fair' },
              { value: 'used', label: 'Used' },
            ]}
          />

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
      {isLoadingCategory ? (
        <div
          role="status"
          aria-label="Loading listings"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
        >
          {Array.from({ length: 8 }, (_, index) => (
            <ListingCardSkeleton key={`category-skeleton-${index}`} />
          ))}
        </div>
      ) : listingFetchError ? (
        <div role="alert" className="py-12 text-center text-status-danger">
          <p className="text-lg font-medium">Listings could not be loaded.</p>
          <p className="mt-2 text-sm">{listingFetchError}</p>
        </div>
      ) : categoryItems.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <p className="text-lg font-medium">
            No items found in this category yet.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Be the first to post something in this category!
          </p>
        </div>
      ) : (
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
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
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
      )}

      {/* Multi-Tier Footer */}
      <MarketplaceFooter />
    </motion.div>
  );
}
