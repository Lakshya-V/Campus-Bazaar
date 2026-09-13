// src/components/layout/Navbar.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, MoreVertical } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../Logo';
import SearchAutocomplete from '../listings/SearchAutocomplete';
import NotificationsDropdown from './NotificationsDropdown';
import AccountMenu from './AccountMenu';

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return null; // When logged out, Phase 1 Auth Gate rules state: "Route '/' when logged out renders ONLY the login page — no navbar/app chrome."
  }

  function handleSelectCategory(catName: string) {
    navigate(`/?category=${encodeURIComponent(catName)}`);
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-black/8 bg-white/80 backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-[#030712]/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo with Cart + CB lettering */}
          <Link
            to="/"
            className="group flex items-center gap-3 transition-transform active:scale-95 flex-shrink-0"
          >
            <Logo size={40} className="transition-transform group-hover:scale-105" />
            <span className="hidden sm:inline font-display text-lg font-bold tracking-tight">
              <span className="text-slate-900 transition-colors duration-300 dark:text-white">
                Campus
              </span>{' '}
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-fuchsia-400">
                Bazaar
              </span>
            </span>
          </Link>

          {/* Autocomplete Search Bar */}
          <div className="flex-1 max-w-lg mx-2">
            <SearchAutocomplete
              query={searchQuery}
              onQueryChange={setSearchQuery}
              onSelectCategory={handleSelectCategory}
            />
          </div>

          {/* Right Action Chrome */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
            {/* Post an Item CTA */}
            <Link
              to="/sell/new"
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:bg-purple-700 active:scale-95 dark:bg-purple-600 dark:hover:bg-purple-500"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              <span className="hidden sm:inline">Post an Item</span>
              <span className="sm:hidden">Sell</span>
            </Link>

            {/* Notification Bell with Badge */}
            <NotificationsDropdown />

            {/* Amazon-style Account 3-Dot / Profile Avatar Trigger */}
            <button
              type="button"
              onClick={() => setAccountMenuOpen(true)}
              aria-label="Account & Settings menu"
              className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-white/60 p-1 pr-1.5 text-ink transition-all hover:border-purple-500/40 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:border-purple-400/40"
            >
              <img
                src={user?.AvatarSeed}
                alt={user?.Name || 'User'}
                className="h-7 w-7 rounded-lg object-cover ring-1 ring-purple-500/30"
              />
              <MoreVertical className="h-3.5 w-3.5 text-ink-muted" />
            </button>
          </div>
        </div>
      </header>

      {/* Slide-over Profile / Account Drawer */}
      <AccountMenu
        isOpen={accountMenuOpen}
        onClose={() => setAccountMenuOpen(false)}
      />
    </>
  );
}