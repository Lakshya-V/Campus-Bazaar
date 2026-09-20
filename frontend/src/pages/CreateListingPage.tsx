// src/pages/CreateListingPage.tsx
import { useState, useRef, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Upload,
  CheckCircle2,
  ArrowRight,
  Plus,
  X,
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
  const { categories, addItem, addCategory } = useMarket();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[1]?.Name || 'Electronics & Tech');
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState<ListingCondition>('good');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([PRESET_IMAGES[0].url]);
  const [customUrl, setCustomUrl] = useState('');

  const [isPublishing, setIsPublishing] = useState(false);
  const [createdItem, setCreatedItem] = useState<Item | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAddPreset(url: string) {
    if (images.length >= 8) return;
    if (!images.includes(url)) {
      setImages((prev) => [...prev, url]);
    }
  }

  function handleAddCustomUrl() {
    const trimmed = customUrl.trim();
    if (!trimmed || images.length >= 8) return;
    setImages((prev) => [...prev, trimmed]);
    setCustomUrl('');
  }

  function handleRemoveImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleFilesUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const newUrls: string[] = [];
    for (let i = 0; i < e.target.files.length; i++) {
      if (images.length + newUrls.length >= 8) break;
      const file = e.target.files[i];
      if (file.type.startsWith('image/')) {
        newUrls.push(URL.createObjectURL(file));
      }
    }
    if (newUrls.length > 0) {
      setImages((prev) => [...prev, ...newUrls].slice(0, 8));
    }
    e.target.value = '';
  }

  function handleSaveCustomCategory() {
    const trimmed = customCategoryName.trim();
    if (!trimmed) return;
    const newCat = addCategory(trimmed);
    setCategory(newCat.Name);
    setIsAddingCustomCategory(false);
    setCustomCategoryName('');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !price || !description.trim() || images.length === 0) return;

    let finalCategory = category;
    if (isAddingCustomCategory && customCategoryName.trim()) {
      const newCat = addCategory(customCategoryName.trim());
      finalCategory = newCat.Name;
      setCategory(newCat.Name);
      setIsAddingCustomCategory(false);
      setCustomCategoryName('');
    }

    setIsPublishing(true);

    // Simulate snappy creation morph
    setTimeout(() => {
      const newItem = addItem({
        Title: title.trim(),
        Category: finalCategory,
        Price: Math.max(1, parseFloat(price) || 10),
        Condition: condition,
        Description: description.trim(),
        Images: images.length > 0 ? images : [PRESET_IMAGES[0].url],
      });

      setCreatedItem(newItem);
      setIsPublishing(false);
    }, 600);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Browse
        </Link>
      </div>

      <AnimatePresence mode="wait">
        {!createdItem ? (
          /* TWO-COLUMN FORM + LIVE PREVIEW VIEW */
          <motion.div
            key="form-view"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Form Card (Spans 7 cols on lg) */}
            <div className="lg:col-span-7 rounded-2xl border border-borderline bg-surface p-7 sm:p-8 shadow-xs">
              <div className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider bg-[#111318] text-[#FFFFFF] dark:bg-[#F2F3F5] dark:text-[#0D0F12] border border-borderline mb-4">
                Seller Flow · Post Item
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                List an Item
              </h1>
              <p className="mt-1 text-xs text-ink-muted font-body">
                Peer pickup across campus libraries, student unions, and dorms with zero fees.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                    Item Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Sony WH-1000XM5 Noise Canceling Headphones"
                    className="w-full rounded-full border border-borderline bg-surface-base px-4 py-2.5 text-sm text-ink placeholder-ink-muted/50 outline-none transition focus:border-[#2F6FED]"
                  />
                </div>

                {/* Price + Category Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                      Price (USD $)
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-ink-muted">
                        $
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="240"
                        className="w-full rounded-full border border-borderline bg-surface-base py-2.5 pl-8 pr-4 text-sm text-ink placeholder-ink-muted/50 outline-none transition focus:border-[#2F6FED]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                      Category
                    </label>
                    <select
                      value={isAddingCustomCategory ? '__custom__' : category}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsAddingCustomCategory(true);
                        } else {
                          setIsAddingCustomCategory(false);
                          setCategory(e.target.value);
                        }
                      }}
                      className="w-full rounded-full border border-borderline bg-surface-base px-4 py-2.5 text-sm text-ink outline-none transition focus:border-[#2F6FED]"
                    >
                      {categories
                        .filter((c) => c.Name !== 'All Categories')
                        .map((cat) => (
                          <option key={cat.Category_ID} value={cat.Name}>
                            {cat.Name}
                          </option>
                        ))}
                      <option value="__custom__">+ Add custom category</option>
                    </select>

                    {/* Inline Custom Category Creator */}
                    {isAddingCustomCategory && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={customCategoryName}
                          onChange={(e) => setCustomCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveCustomCategory();
                            }
                          }}
                          placeholder="Type custom category name..."
                          autoFocus
                          className="flex-1 rounded-full border border-borderline bg-surface-base px-3.5 py-2 text-xs text-ink placeholder-ink-muted/50 outline-none transition focus:border-[#2F6FED]"
                        />
                        <button
                          type="button"
                          onClick={handleSaveCustomCategory}
                          className="rounded-full bg-[#2F6FED] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1B4FC4] transition cursor-pointer"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingCustomCategory(false);
                            setCustomCategoryName('');
                          }}
                          className="rounded-full border border-borderline bg-surface-base px-3 py-2 text-xs text-ink-muted hover:text-ink transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Condition Selector */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-2">
                    Condition
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'new', label: 'New', desc: 'Unopened or mint' },
                        { id: 'good', label: 'Good', desc: 'Minor wear' },
                        { id: 'fair', label: 'Fair', desc: 'Signs of use' },
                      ] as const
                    ).map((cond) => {
                      const isSel = condition === cond.id;
                      return (
                        <button
                          key={cond.id}
                          type="button"
                          onClick={() => setCondition(cond.id)}
                          className={`rounded-xl border p-3 text-left transition-all ${
                            isSel
                              ? 'border-[#111318] bg-[#111318] text-white dark:border-[#F2F3F5] dark:bg-[#F2F3F5] dark:text-[#0D0F12] shadow-xs'
                              : 'border-borderline bg-surface-base hover:bg-surface-elevated text-ink'
                          }`}
                        >
                          <span className="block font-semibold text-xs">{cond.label}</span>
                          <span className="mt-0.5 block text-[10px] opacity-75 leading-tight">
                            {cond.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Multi-Image Gallery & Uploader (Up to 8 Photos) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                      Item Photos ({images.length}/8)
                    </label>
                    <span className="text-[10px] text-ink-muted">First photo is cover</span>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*"
                    onChange={handleFilesUpload}
                    className="hidden"
                  />

                  {/* Thumbnail Row / Grid */}
                  <div className="grid grid-cols-4 gap-2.5 mb-3">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className="group relative aspect-square overflow-hidden rounded-xl border border-borderline bg-surface-elevated"
                      >
                        <img
                          src={img}
                          alt={`Listing photo ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                        {idx === 0 && (
                          <span className="absolute left-1.5 top-1.5 rounded-full bg-[#10131A]/85 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 hover:bg-[#E24C4B] transition-all"
                          title="Remove photo"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    {/* "+ Add Photo" dashed tile if under 8 */}
                    {images.length < 8 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-borderline bg-surface-base/50 p-2 text-ink-muted hover:border-[#2F6FED] hover:text-[#2F6FED] hover:bg-surface-elevated transition-colors"
                      >
                        <Plus className="h-5 w-5 mb-1" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">
                          Add Photo
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Presets + Custom URL input */}
                  <div className="rounded-2xl border border-borderline bg-surface-base/50 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                        Sample Presets
                      </span>
                      <span className="text-[10px] text-ink-muted">Click to add</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_IMAGES.map((preset) => {
                        const isAdded = images.includes(preset.url);
                        return (
                          <button
                            key={preset.name}
                            type="button"
                            disabled={images.length >= 8 || isAdded}
                            onClick={() => handleAddPreset(preset.url)}
                            className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider transition-colors ${
                              isAdded
                                ? 'bg-[#1AA260]/15 text-[#1AA260] border border-[#1AA260]/30 cursor-default'
                                : 'bg-surface border border-borderline text-ink hover:bg-surface-elevated disabled:opacity-40'
                            }`}
                          >
                            {preset.name} {isAdded && '✓'}
                          </button>
                        );
                      })}
                    </div>

                    {/* Direct Image URL input */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="url"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        placeholder="Or paste an image URL (https://...)"
                        className="flex-1 rounded-full border border-borderline bg-surface px-3.5 py-1.5 text-xs text-ink placeholder-ink-muted/50 outline-none focus:border-[#2F6FED]"
                      />
                      <button
                        type="button"
                        disabled={!customUrl.trim() || images.length >= 8}
                        onClick={handleAddCustomUrl}
                        className="rounded-full bg-surface-elevated border border-borderline px-3 py-1.5 text-[11px] font-semibold text-ink hover:bg-surface hover:border-[#2F6FED] transition-colors disabled:opacity-40"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                    Description & Pickup Notes
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Include edition, accessories, cables, and preferred campus pickup spots..."
                    className="w-full rounded-2xl border border-borderline bg-surface-base p-3.5 text-sm text-ink placeholder-ink-muted/50 outline-none transition focus:border-[#2F6FED]"
                  />
                </div>

                {/* Single Dominant Accent Pop: Primary Submit Button in AMBER #F2994A */}
                <motion.button
                  type="submit"
                  disabled={isPublishing}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#F2994A] py-3 text-sm font-semibold text-[#10131A] shadow-sm transition-all hover:bg-[#D97B2B] active:scale-95 disabled:opacity-50"
                >
                  {isPublishing ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#10131A] border-t-transparent" />
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
            </div>

            {/* Sticky Live Preview Panel (Spans 5 cols on lg) */}
            <div className="lg:col-span-5 sticky top-[80px] space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                  Live Marketplace Preview
                </span>
                <span className="text-[10px] text-ink-muted">Updates in real-time</span>
              </div>

              <div className="rounded-2xl border border-borderline bg-surface overflow-hidden shadow-xs">
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-elevated">
                  <img
                    src={images[0] || PRESET_IMAGES[0].url}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute left-3 top-3 flex items-center gap-1.5">
                    <span className="rounded-full border border-borderline bg-[#111318] text-[#FFFFFF] dark:bg-[#F2F3F5] dark:text-[#0D0F12] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md">
                      YOUR LISTING
                    </span>
                    {images.length > 1 && (
                      <span className="rounded-full bg-[#10131A]/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                        📷 {images.length} photos
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-2.5">
                  <h3 className="truncate font-semibold text-ink text-sm">
                    {title.trim() || 'Your Item Title'}
                  </h3>

                  <p className="text-xs text-ink-muted line-clamp-2">
                    {description.trim() || 'Item description and details will appear here.'}
                  </p>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-borderline">
                    <span className="font-display text-xl font-bold tracking-tight text-ink">
                      ${price ? price : '45'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-surface-elevated text-ink-secondary border border-borderline">
                        {category}
                      </span>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-[#12A150] text-white dark:text-[#0D0F12]">
                        {condition.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* COHESIVE CREATION ANIMATION: Form morphs into 3D Card Preview */
          <motion.div
            key="success-preview"
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="space-y-6 text-center max-w-md mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={POP_SPRING}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#12A150]/15 text-[#12A150]"
            >
              <CheckCircle2 className="h-9 w-9" />
            </motion.div>

            <div>
              <h2 className="font-display text-2xl font-bold text-ink">
                Listing Live on Campus Bazaar!
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-ink-muted font-body">
                Your item is now discoverable by peer students across campus.
              </p>
            </div>

            {/* Rendered Apple3DCard of the new item */}
            <div className="mx-auto max-w-sm text-left">
              <Apple3DCard className="rounded-2xl">
                <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-surface-elevated">
                  <img
                    src={createdItem.Images[0]}
                    alt={createdItem.Title}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute left-3 top-3 rounded-full border border-borderline bg-[#111318] text-[#FFFFFF] dark:bg-[#F2F3F5] dark:text-[#0D0F12] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md">
                    YOUR LISTING
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="truncate font-semibold text-ink text-sm">{createdItem.Title}</h3>
                  <div className="flex items-center justify-between pt-1 border-t border-borderline">
                    <span className="font-display text-xl font-bold text-ink">
                      ${createdItem.Price}
                    </span>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-surface-elevated text-ink-secondary border border-borderline">
                      {createdItem.Category}
                    </span>
                  </div>
                </div>
              </Apple3DCard>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(`/item/${createdItem.Item_ID}`)}
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-[#2F6FED] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1B4FC4]"
              >
                <span>View Listing Details</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex w-full sm:w-auto items-center justify-center rounded-full border border-borderline bg-surface px-6 py-3 text-sm font-semibold text-ink hover:bg-surface-elevated"
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