// src/components/listings/SearchAutocomplete.tsx
import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Tag, ArrowRight } from 'lucide-react';
import { useItems } from '../../context/MarketContext';

interface SearchAutocompleteProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSelectCategory?: (cat: string) => void;
  className?: string;
}

export default function SearchAutocomplete({
  query,
  onQueryChange,
  onSelectCategory,
  className = '',
}: SearchAutocompleteProps) {
  const { items } = useItems();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Compute suggestions: match titles + categories
  const cleanQ = query.trim().toLowerCase();

  const titleSuggestions = cleanQ
    ? items
        .filter((item) => item.Status === 'AVAILABLE')
        .filter((item) => item.Title.toLowerCase().includes(cleanQ))
        .slice(0, 5)
    : [];

  const categorySuggestions = cleanQ
    ? Array.from(new Set(items.map((i) => i.Category)))
        .filter((cat) => cat.toLowerCase().includes(cleanQ))
        .slice(0, 3)
    : [];

  const allSuggestions = [
    ...categorySuggestions.map((cat) => ({ type: 'category' as const, value: cat })),
    ...titleSuggestions.map((item) => ({
      type: 'item' as const,
      value: item.Title,
      item,
    })),
  ];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || allSuggestions.length === 0) {
      if (e.key === 'ArrowDown' && cleanQ) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < allSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : allSuggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < allSuggestions.length) {
        const sel = allSuggestions[activeIndex];
        if (sel.type === 'category') {
          onSelectCategory?.(sel.value);
          onQueryChange('');
        } else {
          navigate(`/item/${sel.item.Item_ID}`);
        }
        setIsOpen(false);
        inputRef.current?.blur();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-ink-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            if (cleanQ) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search textbooks, calculators, dorm gear..."
          className="w-full rounded-2xl border border-black/10 bg-white/70 py-2 pl-10 pr-9 text-sm text-ink placeholder-ink-muted/60 backdrop-blur-md transition-all duration-200 focus:border-purple-500 focus:bg-white focus:shadow-[0_0_16px_rgba(168,85,247,0.15)] focus:outline-none dark:border-white/10 dark:bg-black/40 dark:focus:border-purple-400 dark:focus:bg-black/80"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              onQueryChange('');
              setIsOpen(false);
            }}
            className="absolute right-3 p-0.5 text-ink-muted hover:text-ink"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && cleanQ && allSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-black/10 bg-white/95 p-1.5 shadow-2xl backdrop-blur-2xl dark:border-white/15 dark:bg-[#09090b]/95">
          <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            Suggestions (↑↓ navigate, ↵ select)
          </div>

          <ul className="space-y-0.5">
            {allSuggestions.map((sug, idx) => {
              const isSelected = idx === activeIndex;

              if (sug.type === 'category') {
                return (
                  <li key={`cat_${sug.value}`}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCategory?.(sug.value);
                        onQueryChange('');
                        setIsOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                        isSelected
                          ? 'bg-purple-600 text-white dark:bg-purple-600'
                          : 'text-ink hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 opacity-70" />
                        <span>
                          Category: <strong>{sug.value}</strong>
                        </span>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider opacity-70">
                        Filter
                      </span>
                    </button>
                  </li>
                );
              }

              return (
                <li key={`item_${sug.item.Item_ID}`}>
                  <button
                    type="button"
                    onClick={() => {
                      navigate(`/item/${sug.item.Item_ID}`);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-purple-600 text-white dark:bg-purple-600'
                        : 'text-ink hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <img
                        src={sug.item.Images[0]}
                        alt={sug.item.Title}
                        className="h-7 w-7 flex-shrink-0 rounded-lg object-cover"
                      />
                      <span className="truncate font-medium">{sug.item.Title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold tabular-nums text-sell">
                        ${sug.item.Price}
                      </span>
                      <ArrowRight className="h-3 w-3 opacity-60" />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
