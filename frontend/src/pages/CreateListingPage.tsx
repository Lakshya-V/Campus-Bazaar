import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Upload } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import SelectMenu from '../components/common/SelectMenu';
import type { Item, ListingCondition } from '../types/market';

const CONDITIONS: { value: ListingCondition; label: string }[] = [
  { value: 'Brand New', label: 'Brand New' },
  { value: 'Like New', label: 'Like New' },
  { value: 'Good', label: 'Good' },
  { value: 'Fair Use', label: 'Fair Use' },
  { value: 'Books & Notes', label: 'Books & Notes' },
];

export default function CreateListingPage() {
  const { categories, addItem } = useMarket();
  const navigate = useNavigate();
  const availableCategories = categories.filter(
    (category) => category.Name !== 'All Categories' && /^\d+$/.test(category.Category_ID)
  );

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState<ListingCondition>('Good');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | undefined>();
  const [imagePreview, setImagePreview] = useState('');
  const imagePreviewUrl = useRef<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdItem, setCreatedItem] = useState<Item | null>(null);

  useEffect(() => () => {
    if (imagePreviewUrl.current) URL.revokeObjectURL(imagePreviewUrl.current);
  }, []);

  const selectedCategoryId = availableCategories.some(
    (category) => category.Category_ID === categoryId
  ) ? categoryId : availableCategories[0]?.Category_ID ?? '';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const selectedCategory = availableCategories.find(
      (category) => category.Category_ID === selectedCategoryId
    );
    const numericPrice = Number(price);
    if (!selectedCategory || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      setError('Choose a category and enter a valid price.');
      return;
    }

    setIsPublishing(true);
    try {
      const item = await addItem({
        Title: title.trim(),
        Category: selectedCategory.Name,
        Price: numericPrice,
        Condition: condition,
        Description: description.trim(),
        Image: image,
      });
      setCreatedItem(item);
    } catch (submitError: unknown) {
      if (
        typeof submitError === 'object' &&
        submitError !== null &&
        'response' in submitError &&
        typeof submitError.response === 'object' &&
        submitError.response !== null &&
        'data' in submitError.response
      ) {
        const responseData = submitError.response.data;
        setError(
          typeof responseData === 'string'
            ? responseData
            : JSON.stringify(responseData)
        );
      } else {
        setError(
          submitError instanceof Error
            ? submitError.message
            : 'Failed to publish listing. Please check your inputs and try again.'
        );
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
              className="rounded-full border border-borderline px-5 py-2.5 text-sm font-semibold text-ink"
            >
              Back to bazaar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
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
          Add the essentials so other students can find your item.
        </p>

        {error && (
          <div role="alert" className="mt-5 rounded-xl border border-status-danger/20 bg-status-danger/10 p-3 text-sm text-status-danger">
            {error}
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
                value={selectedCategoryId}
                onChange={setCategoryId}
                disabled={availableCategories.length === 0}
                className="w-full rounded-xl border border-borderline bg-surface-base px-4 py-3 text-sm text-ink outline-none focus:border-[#2F6FED] disabled:opacity-60"
                aria-label="Category"
                options={availableCategories.length === 0
                  ? [{ value: '', label: 'No categories available' }]
                  : availableCategories.map((category) => ({
                      value: category.Category_ID,
                      label: category.Name,
                    }))}
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
                className="w-full rounded-xl border border-borderline bg-surface-base px-4 py-3 text-sm text-ink outline-none focus:border-[#2F6FED]"
              />
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-ink">Condition</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CONDITIONS.map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-xl border px-4 py-3 text-center text-sm font-medium transition-colors ${
                    condition === option.value
                      ? 'border-[#2F6FED] bg-[#2F6FED]/10 text-[#2F6FED]'
                      : 'border-borderline bg-surface-base text-ink hover:bg-surface-elevated'
                  }`}
                >
                  <input
                    type="radio"
                    name="listing-condition"
                    value={option.value}
                    checked={condition === option.value}
                    onChange={() => setCondition(option.value)}
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
              className="w-full resize-y rounded-xl border border-borderline bg-surface-base px-4 py-3 text-sm text-ink outline-none focus:border-[#2F6FED]"
            />
          </div>

          <div>
            <label htmlFor="listing-image" className="mb-1.5 block text-xs font-semibold text-ink">
              Listing photo
            </label>
            <input
              id="listing-image"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0];
                if (imagePreviewUrl.current) URL.revokeObjectURL(imagePreviewUrl.current);
                imagePreviewUrl.current = selectedFile ? URL.createObjectURL(selectedFile) : null;
                setImage(selectedFile);
                setImagePreview(imagePreviewUrl.current || '');
              }}
              className="w-full rounded-xl border border-borderline bg-surface-base px-4 py-3 text-sm text-ink file:mr-3 file:rounded-full file:border-0 file:bg-surface-elevated file:px-3 file:py-1.5 file:text-xs file:font-semibold"
            />
            {imagePreview && (
              <img src={imagePreview} alt="Selected listing preview" className="mt-3 h-40 w-full rounded-xl object-cover" />
            )}
          </div>

          <button
            type="submit"
            disabled={isPublishing || availableCategories.length === 0}
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
