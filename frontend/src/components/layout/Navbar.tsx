// src/components/layout/Navbar.tsx
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    navigate('/');
  }

  const initials = (user?.username ?? '??').slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-panel/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="font-display text-lg font-semibold tracking-tight text-ink">
          Campus Bazaar
        </Link>

        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <Link
              to="/listings/new"
              className="flex items-center gap-1.5 rounded-lg bg-sell px-3.5 py-2 text-sm font-medium text-sell-ink transition-transform active:scale-95"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Post a listing
            </Link>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-line bg-panel text-sm font-medium text-ink"
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-48 overflow-hidden rounded-lg border border-line bg-panel shadow-xl"
                >
                  <div className="border-b border-line px-3.5 py-2.5">
                    <p className="truncate text-sm font-medium text-ink">{user?.username}</p>
                    <p className="truncate text-xs text-ink-muted">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2.5 text-sm text-ink hover:bg-white/5"
                  >
                    <UserIcon className="h-4 w-4" />
                    My listings
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-ink hover:bg-white/5"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-ink-muted hover:text-ink"
            >
              Log in
            </Link>
            <motion.div whileTap={{ scale: 0.96 }}>
              <Link
                to="/register"
                className="block rounded-lg bg-buy px-3.5 py-2 text-sm font-medium text-surface"
              >
                Sign up
              </Link>
            </motion.div>
          </div>
        )}
      </div>
    </header>
  );
}