import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CATEGORIES = [
  'Textbooks',
  'Electronics & Gadgets',
  'Bicycles & Mobility',
  'Hostel & Room Essentials',
  'Clothing & Uniforms',
  'Other',
];

export default function CreateListingPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await axios.post('/api/listings/', {
        title,
        description,
        price: parseFloat(price),
        category,
      });
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to publish listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-2xl border border-line bg-panel/70 p-6 shadow-xl backdrop-blur-sm sm:p-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Sell an Item</h1>
        <p className="mt-1 text-sm text-ink-muted">List your items for other students across campus</p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-ink-muted">
              Item Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Engineering Mathematics II (Kreyszig)"
              className="mt-1.5 w-full rounded-xl border border-line bg-white/5 px-4 py-2.5 text-sm text-ink placeholder-white/20 outline-none transition focus:border-buy focus:ring-1 focus:ring-buy"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink-muted">
                Price (INR)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="450"
                className="mt-1.5 w-full rounded-xl border border-line bg-white/5 px-4 py-2.5 text-sm text-ink placeholder-white/20 outline-none transition focus:border-buy focus:ring-1 focus:ring-buy"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink-muted">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-line bg-panel px-4 py-2.5 text-sm text-ink outline-none transition focus:border-buy focus:ring-1 focus:ring-buy"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-surface text-ink">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-ink-muted">
              Description & Condition
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe condition, pickup location (block/hostel), or other details..."
              className="mt-1.5 w-full rounded-xl border border-line bg-white/5 px-4 py-2.5 text-sm text-ink placeholder-white/20 outline-none transition focus:border-buy focus:ring-1 focus:ring-buy"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-buy px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Post Listing'}
          </button>
        </form>
      </div>
    </div>
  );
}