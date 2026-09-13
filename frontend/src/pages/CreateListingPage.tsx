// src/pages/CreateListingPage.tsx
import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Upload,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import type { ListingCondition, Item } from '../types/market';
import { Apple3DCard } from '../components/common/Apple3DCard';
import { POP_SPRING } from '../lib/motion';

const PRESET_IMAGES = [
  {
    name: 'Textbook',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80',
  },
  {
    name: 'Electronics / Audio',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
  },
  {
    name: 'Dorm Furniture / Desk',
    url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&q=80',
  },
  {
    name: 'Tablet / Laptop',
    url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',
  },
  {
    name: 'Campus Bicycle',
    url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80',
  },
];

export default function CreateListingPage() {
  const { categories, addItem } = useMarket();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[1]?.Name || 'Electronics & Tech');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState<ListingCondition>('good');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);

  const [isPublishing, setIsPublishing] = useState(false);
  const [createdItem, setCreatedItem] = useState<Item | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !price || !description.trim()) return;

    setIsPublishing(true);

    // Simulate snappy creation morph
    setTimeout(() => {
      const newItem = addItem({
        Title: title.trim(),
        Category: category,
        Price: Math.max(1, parseFloat(price) || 10),
        Condition: condition,
        Description: description.trim(),
        Images: [imageUrl || PRESET_IMAGES[0].url],
      });

      setCreatedItem(newItem);
      setIsPublishing(false);
    }, 600);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-ink-muted transition-colors hover:text-purple-600 dark:hover:text-purple-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Browse
        </Link>
      </div>

      <AnimatePresence mode="wait">
        {!createdItem ? (
          /* FORM VIEW */
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.3 }}
            className="rounded-3xl border border-black/8 bg-white/80 p-6 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-[#09090b]/80 sm:p-8"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
                Post an Item
              </h1>
            </div>
            <p className="mt-1.5 text-xs text-ink-muted">
              List textbooks, dorm gear, or electronics for peer pickup across campus.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Item Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., TI-84 Plus CE Graphing Calculator"
                  className="mt-1.5 w-full rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-2.5 text-sm text-ink placeholder-ink-muted/50 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-white/5 dark:focus:border-purple-400"
                />
              </div>

              {/* Price + Category Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Price (USD $)
                  </label>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-ink-muted">
                      $
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="45"
                      className="w-full rounded-2xl border border-black/10 bg-black/[0.03] py-2.5 pl-8 pr-4 text-sm text-ink placeholder-ink-muted/50 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-white/5 dark:focus:border-purple-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-black/10 bg-surface-elevated px-4 py-2.5 text-sm text-ink outline-none transition focus:border-purple-600 dark:border-white/10"
                  >
                    {categories
                      .filter((c) => c.Name !== 'All Categories')
                      .map((cat) => (
                        <option key={cat.Category_ID} value={cat.Name}>
                          {cat.Name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Condition Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
                  Condition
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {(
                    [
                      { id: 'new', label: 'New', desc: 'Unopened or flawless' },
                      { id: 'good', label: 'Good', desc: 'Minor cosmetic wear' },
                      { id: 'fair', label: 'Fair', desc: 'Functional, signs of use' },
                    ] as const
                  ).map((cond) => {
                    const isSel = condition === cond.id;
                    return (
                      <button
                        key={cond.id}
                        type="button"
                        onClick={() => setCondition(cond.id)}
                        className={`rounded-2xl border p-3 text-left transition-all ${
                          isSel
                            ? 'border-purple-600 bg-purple-500/10 shadow-sm dark:border-purple-400 dark:bg-purple-500/15'
                            : 'border-black/8 bg-black/[0.02] hover:border-purple-500/30 dark:border-white/10 dark:bg-white/[0.02]'
                        }`}
                      >
                        <span className="block font-semibold text-xs text-ink">{cond.label}</span>
                        <span className="mt-0.5 block text-[10px] text-ink-muted leading-tight">
                          {cond.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Photo Selector with Live Preview */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                  Item Photo
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-2 text-xs text-ink placeholder-ink-muted/50 outline-none dark:border-white/10 dark:bg-white/5"
                    />
                  </div>

                  {/* Preset quick photo pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-ink-muted mr-1 font-semibold">Presets:</span>
                    {PRESET_IMAGES.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setImageUrl(preset.url)}
                        className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-colors ${
                          imageUrl === preset.url
                            ? 'bg-purple-600 text-white font-semibold shadow-sm'
                            : 'bg-black/5 text-ink hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>

                  {/* Live local preview thumbnail */}
                  {imageUrl && (
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-black/10 bg-surface-elevated dark:border-white/10">
                      <img
                        src={imageUrl}
                        alt="Listing Preview"
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-md">
                        Photo preview
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Description & Pickup Details
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe condition, include what cables/accessories are included, and preferred campus pickup spots (e.g. library or campus center)..."
                  className="mt-1.5 w-full rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-2.5 text-sm text-ink placeholder-ink-muted/50 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-white/5 dark:focus:border-purple-400"
                />
              </div>

              {/* Submit CTA */}
              <motion.button
                type="submit"
                disabled={isPublishing}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 transition-all hover:bg-purple-700 disabled:opacity-50 dark:bg-purple-600 dark:hover:bg-purple-500"
              >
                {isPublishing ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Publishing to Campus...
                  </span>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Publish Campus Listing</span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        ) : (
          /* COHESIVE CREATION ANIMATION: Form morphs into 3D Card Preview */
          <motion.div
            key="success-preview"
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="space-y-6 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={POP_SPRING}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            >
              <CheckCircle2 className="h-9 w-9" />
            </motion.div>

            <div>
              <h2 className="font-display text-2xl font-bold text-ink">
                Listing Live on Campus Bazaar!
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-ink-muted">
                Your item is now discoverable by peer students across campus.
              </p>
            </div>

            {/* Rendered Apple3DCard of the new item */}
            <div className="mx-auto max-w-sm text-left">
              <Apple3DCard>
                <div className="relative aspect-[4/3] overflow-hidden rounded-t-3xl bg-surface-elevated">
                  <img
                    src={createdItem.Images[0]}
                    alt={createdItem.Title}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute left-3 top-3 rounded-full border border-purple-500/30 bg-purple-900/80 px-2.5 py-1 text-[11px] font-bold text-purple-200 backdrop-blur-md">
                    Your new listing
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="truncate font-semibold text-ink">{createdItem.Title}</h3>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-display text-xl font-bold text-sell">
                      ${createdItem.Price}
                    </span>
                    <span className="text-xs text-ink-muted">{createdItem.Category}</span>
                  </div>
                </div>
              </Apple3DCard>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(`/item/${createdItem.Item_ID}`)}
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-purple-700"
              >
                <span>View Listing Details</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex w-full sm:w-auto items-center justify-center rounded-2xl border border-black/10 bg-white/70 px-6 py-3 text-sm font-semibold text-ink hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                Return to Home Grid
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}