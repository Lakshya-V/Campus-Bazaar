// src/components/Logo.tsx
//
// Modern shopping cart icon with "CB" lettering embedded directly inside the cart basket.
// Highly scalable SVG component with specular gradients, suitable for both compact navbar
// and large hero login displays.

interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 36, className = '' }: LogoProps) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center select-none ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full overflow-visible drop-shadow-md"
      >
        <defs>
          {/* Cart basket background gradient */}
          <linearGradient id="cbCartBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="50%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>

          {/* Cart wire outline metallic gradient */}
          <linearGradient id="cbWireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>

          {/* Specular highlight on top basket edge */}
          <linearGradient id="cbSpecular" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0.8" />
            <stop offset="100%" stopColor="white" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Shopping Cart Wheel 1 */}
        <circle cx="38" cy="85" r="7" className="fill-slate-900 dark:fill-white" />
        <circle cx="38" cy="85" r="3.5" fill="#a855f7" />

        {/* Shopping Cart Wheel 2 */}
        <circle cx="76" cy="85" r="7" className="fill-slate-900 dark:fill-white" />
        <circle cx="76" cy="85" r="3.5" fill="#a855f7" />

        {/* Bottom wheel connecting chassis bar */}
        <path
          d="M 28 73 L 80 73"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="text-slate-800 dark:text-slate-200"
        />

        {/* Cart Handle + Back Spine */}
        <path
          d="M 12 22 H 24 L 32 68 H 82"
          stroke="url(#cbWireGrad)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Cart Basket Body */}
        <path
          d="M 26 30 H 88 L 78 68 H 32 Z"
          fill="url(#cbCartBg)"
          stroke="url(#cbWireGrad)"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Basket Top Specular Rim */}
        <path
          d="M 27 31 H 87"
          stroke="url(#cbSpecular)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* "CB" Monogram embedded directly inside the basket */}
        <g transform="translate(56, 50)">
          {/* C */}
          <text
            x="-16"
            y="6"
            fill="#ffffff"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontWeight="900"
            fontSize="23"
            letterSpacing="-0.5px"
            textAnchor="middle"
          >
            C
          </text>
          {/* B */}
          <text
            x="4"
            y="6"
            fill="#f5d0fe"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontWeight="900"
            fontSize="23"
            letterSpacing="-0.5px"
            textAnchor="middle"
          >
            B
          </text>
        </g>
      </svg>
    </div>
  );
}
