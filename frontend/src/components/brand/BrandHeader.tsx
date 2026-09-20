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
      <span className="font-display text-lg font-bold tracking-tight text-ink transition-colors">
        Campus <span className="bg-gradient-to-r from-[#2F6FED] to-[#1B4FC4] bg-clip-text text-transparent dark:from-[#4F8CFF] dark:to-[#2F6FED]">Bazaar</span>
      </span>
    </Link>
  );
}