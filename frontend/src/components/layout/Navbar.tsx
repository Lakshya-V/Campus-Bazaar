// src/components/layout/Navbar.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, MoreVertical, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../Logo';
import SearchAutocomplete from '../listings/SearchAutocomplete';
import NotificationsDropdown from './NotificationsDropdown';
import AccountMenu from './AccountMenu';

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const navigate = useNavigate();

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 10);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isAuthenticated) {
    return null; // When logged out, Phase 1 Auth Gate rules state: "Route '/' when logged out renders ONLY the login page — no navbar/app chrome."
  }

  function handleSelectCategory(catName: string) {
    navigate(`/?category=${encodeURIComponent(catName)}`);
  }

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b border-black/5 bg-white/70 backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/70 ${
          isScrolled
            ? 'shadow-[0_12px_32px_rgba(0,0,0,0.06)]'
            : 'shadow-none'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo with Cart + CB lettering */}
          <Link
            to="/"
            className="group flex items-center gap-3 transition-transform active:scale-95 flex-shrink-0"
          >
            <Logo size={40} className="transition-transform group-hover:scale-105" />
            <span className="hidden sm:inline font-display text-lg font-bold tracking-tight">
              <span className="text-ink transition-colors duration-300">
                Campus
              </span>{' '}
              <span className="bg-gradient-to-r from-[#2F6FED] to-[#1B4FC4] bg-clip-text text-transparent dark:from-[#4F8CFF] dark:to-[#2F6FED]">
                Bazaar
              </span>
            </span>
          </Link>

          {/* Autocomplete Search Bar */}
          <div id="navbar-search-bar" className="flex-1 max-w-lg mx-2">
            <SearchAutocomplete
              query={searchQuery}
              onQueryChange={setSearchQuery}
              onSelectCategory={handleSelectCategory}
            />
          </div>

          {/* Right Action Chrome */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
            {/* Post an Item CTA — AMBER #F2994A per Mandatory Palette */}
            <Link
              to="/sell/new"
              className="flex items-center gap-1.5 rounded-2xl bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition-transform active:scale-95 dark:bg-zinc-100 dark:text-zinc-950"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              <span className="hidden sm:inline">Post an Item</span>
              <span className="sm:hidden">Sell</span>
            </Link>

            {/* Notification Bell with Badge */}
            <NotificationsDropdown />

            {/* Standalone Theme Toggle — Moon in light mode, Sun in dark mode */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="relative flex h-9 w-9 items-center justify-center rounded-2xl border border-black/5 bg-white/60 text-ink transition-transform hover:scale-[1.04] dark:border-white/10 dark:bg-zinc-800/60 cursor-pointer"
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-zinc-300" />
              ) : (
                <Moon className="h-4 w-4 text-ink-muted hover:text-ink transition-colors" />
              )}
            </button>

            {/* Amazon-style Account 3-Dot / Profile Avatar Trigger */}
            <button
              type="button"
              onClick={() => setAccountMenuOpen(true)}
              aria-label="Account & Settings menu"
              className="flex items-center gap-1.5 rounded-2xl border border-black/5 bg-white/60 p-1 pr-1.5 text-ink transition-transform hover:scale-[1.03] dark:border-white/10 dark:bg-zinc-800/60"
            >
              <img
                src={user?.AvatarSeed}
                alt={user?.Name || 'User'}
                className="h-7 w-7 rounded-xl object-cover ring-1 ring-black/10 dark:ring-white/15"
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