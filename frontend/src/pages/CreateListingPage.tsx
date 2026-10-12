import { useEffect, useRef, useState, type FormEvent, type ClipboardEvent, type DragEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { ArrowLeft, CheckCircle2, Upload, Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import SelectMenu from '../components/common/SelectMenu';
import type { Item, ListingCondition } from '../types/market';

export const CATEGORY_OPTIONS = [
  { value: 'books', label: 'Books' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'cycles', label: 'Cycles' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'hostel', label: 'Hostel Essentials' },
  { value: 'others', label: 'Others' },
];

export const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'used', label: 'Used' },
];

export default function CreateListingPage() {
  const { addItem } = useMarket();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [categoryKey, setCategoryKey] = useState('books');
  const [price, setPrice] = useState('');
  const [conditionKey, setConditionKey] = useState('good');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | undefined>();
  const [imagePreview, setImagePreview] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const imagePreviewUrl = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdItem, setCreatedItem] = useState<Item | null>(null);

  useEffect(() => () => {
    if (imagePreviewUrl.current) URL.revokeObjectURL(imagePreviewUrl.current);
  }, []);

  function processImageFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Only image files (PNG, JPG, WEBP, etc.) are supported.');
      return;
    }
    setError(null);
    if (imagePreviewUrl.current) URL.revokeObjectURL(imagePreviewUrl.current);
    imagePreviewUrl.current = URL.createObjectURL(file);
    setImage(file);
    setImagePreview(imagePreviewUrl.current);
  }

  function handlePaste(e: ClipboardEvent) {
    const files = e.clipboardData?.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          e.preventDefault();
          processImageFile(files[i]);
          return;
        }
      }
    }
    const items = e.clipboardData?.items;
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            processImageFile(file);
            return;
          }
        }
      }
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          processImageFile(files[i]);
          return;
        }
      }
    }
  }

  function removeImage() {
    if (imagePreviewUrl.current) URL.revokeObjectURL(imagePreviewUrl.current);
    imagePreviewUrl.current = null;
    setImage(undefined);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const numericPrice = Number(price);
    if (!categoryKey || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      setError('Please choose a valid category and price.');
      return;
    }

    setIsPublishing(true);
    try {
      const item = await addItem({
        Title: title.trim(),
        Category: categoryKey, // passes exact matching key value e.g. 'hostel', 'books'
        Price: numericPrice,
        Condition: conditionKey as ListingCondition, // passes exact matching key value e.g. 'like_new', 'good'
        Description: description.trim(),
        Image: image,
      });
      setCreatedItem(item);
    } catch (submitError: unknown) {
      if (isAxiosError(submitError) && submitError.response?.data) {
        const responseData: unknown = submitError.response.data;
        if (typeof responseData === 'object' && responseData !== null) {
          const fieldErrors = Object.entries(responseData)
            .map(([field, err]) => {
              const text = Array.isArray(err)
                ? err.map(String).join(', ')
                : typeof err === 'object' && err !== null
                ? Object.values(err).flatMap((value) =>
                    Array.isArray(value) ? value.map(String) : [String(value)]
                  ).join(', ')
                : String(err);
              const fieldName = field.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
              return `${fieldName}: ${text}`;
            })
            .join(' | ');
          setError(fieldErrors || 'Validation failed. Please check your inputs.');
        } else {
          setError(String(responseData));
        }
      } else if (submitError instanceof Error) {
        setError(
          submitError.message || 'Failed to publish listing. Please try again.'
        );
      } else {
        setError('Failed to publish listing. Please check your inputs and try again.');
      }
    } finally {
      setIsPublishing(false);
    }
  }

  if (createdItem) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-3xl border border-borderline bg-surface p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-[#1AA260]" />
          <h1 className="mt-4 font-display text-2xl font-bold text-ink">
            Listing published
          </h1>
          <p className="mt-2 text-sm text-ink-muted">{createdItem.Title}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate(`/item/${createdItem.Item_ID}`)}
              className="rounded-full bg-[#2F6FED] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1B4FC4]"
            >
              View listing
            </button>
            <Link
              to="/"
              className="rounded-full border border-borderline px-5 py-2.5 text-sm font-semibold text-ink hover:bg-surface-elevated"
            >
              Back to bazaar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onPaste={handlePaste}
      className="mx-auto max-w-2xl px-4 py-8"
    >
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Bazaar
      </Link>

      <div className="rounded-2xl border border-borderline bg-surface p-6 shadow-xs sm:p-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
          Create a Listing
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Add the essentials so other students can find your item. (Paste images with Ctrl+V)
        </p>

        {error && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2 rounded-xl border border-status-danger/20 bg-status-danger/10 p-3 text-xs text-status-danger"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="listing-title" className="mb-1.5 block text-xs font-semibold text-ink">
              Title
            </label>
            <input
              id="listing-title"
              type="text"
              required
              maxLength={150}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Engineering Mathematics Textbook 4th Ed"
              className="w-full rounded-xl border border-borderline bg-surface-base px-4 py-3 text-sm text-ink outline-none focus:border-[#2F6FED]"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="listing-category" className="mb-1.5 block text-xs font-semibold text-ink">
                Category
              </label>
              <SelectMenu
                id="listing-category"
                value={categoryKey}
                onChange={setCategoryKey}
                className="w-full rounded-xl border border-borderline bg-surface-base px-4 py-3 text-sm text-ink outline-none focus:border-[#2F6FED]"
                aria-label="Category"
                options={CATEGORY_OPTIONS}
              />
            </div>

            <div>
              <label htmlFor="listing-price" className="mb-1.5 block text-xs font-semibold text-ink">
                Price (₹)
              </label>
              <input
                id="listing-price"
                type="number"
                required
                min="0.01"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-borderline bg-surface-base px-4 py-3 text-sm text-ink outline-none focus:border-[#2F6FED]"
              />
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-ink">Condition</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {CONDITION_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center text-xs font-medium transition-colors ${
                    conditionKey === option.value
                      ? 'border-[#2F6FED] bg-[#2F6FED]/10 text-[#2F6FED]'
                      : 'border-borderline bg-surface-base text-ink hover:bg-surface-elevated'
                  }`}
                >
                  <input
                    type="radio"
                    name="listing-condition"
                    value={option.value}
                    checked={conditionKey === option.value}
                    onChange={() => setConditionKey(option.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="listing-description" className="mb-1.5 block text-xs font-semibold text-ink">
              Description
            </label>
            <textarea
              id="listing-description"
              required
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe condition, pickup location (e.g. Mens Hostel Block D), accessories included..."
              className="w-full resize-y rounded-xl border border-borderline bg-surface-base px-4 py-3 text-sm text-ink outline-none focus:border-[#2F6FED]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">
              Listing photo (Upload, drag & drop, or paste with Ctrl+V)
            </label>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => {
                if (!imagePreview) fileInputRef.current?.click();
              }}
              className={`relative flex min-h-[160px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-center transition-colors ${
                isDragging
                  ? 'border-[#2F6FED] bg-[#2F6FED]/5'
                  : imagePreview
                  ? 'border-borderline bg-surface-base'
                  : 'cursor-pointer border-borderline hover:border-ink-muted/50 bg-surface-base'
              }`}
            >
              {imagePreview ? (
                <div className="relative group w-full flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Selected listing preview"
                    className="max-h-56 max-w-full rounded-xl object-contain bg-slate-900/60 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage();
                    }}
                    className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-md transition hover:bg-black"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-4 text-ink-muted">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-elevated text-ink-secondary">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#2F6FED] hover:underline">
                      Click to upload
                    </span>{' '}
                    <span className="text-xs">or drag and drop</span>
                  </div>
                  <p className="text-[11px] text-ink-muted/80">
                    PNG, JPG, WEBP, or paste from clipboard (Ctrl+V)
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                id="listing-image"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0];
                  if (selectedFile) processImageFile(selectedFile);
                }}
                className="hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPublishing}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#F2994A] py-3 text-sm font-semibold text-[#10131A] transition-colors hover:bg-[#D97B2B] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {isPublishing ? 'Publishing…' : 'Publish listing'}
          </button>
        </form>
      </div>
    </div>
  );
}
