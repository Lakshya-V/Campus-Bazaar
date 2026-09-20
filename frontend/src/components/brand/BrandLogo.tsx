// src/components/brand/BrandLogo.tsx
import Logo from '../Logo';

export default function BrandLogo({
  size = 40,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return <Logo size={size} className={className} />;
}