// src/components/common/BrandHeader.tsx
import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';

/**
 * Logo + wordmark lockup. Drop this into Navbar.tsx in place of the
 * current plain-text link.
 */
export default function BrandHeader() {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <BrandLogo size={40} />
      <span className="font-display text-lg font-bold tracking-tight text-[#020617] dark:text-[#f8fafc] transition-colors">
        Campus <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-fuchsia-400">Bazaar</span>
      </span>
    </Link>
  );
}