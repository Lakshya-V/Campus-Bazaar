// src/components/Logo.tsx
//
// Modern shopping cart icon with "CB" lettering embedded directly inside the cart basket.
// Colored in Bazaar Blue (#2F6FED) and Blue Deep (#1B4FC4) with high-contrast text.

interface LogoProps {
  size?: number;
  className?: string;
  animateWheels?: boolean;
}

export default function Logo({ size = 36, className = '', animateWheels = false }: LogoProps) {
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
          {/* Cart basket background gradient — Bazaar Blue to Blue Deep */}
          <linearGradient id="cbCartBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2F6FED" />
            <stop offset="100%" stopColor="#1B4FC4" />
          </linearGradient>

          {/* Cart wire outline metallic gradient */}
          <linearGradient id="cbWireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F8CFF" />
            <stop offset="100%" stopColor="#2F6FED" />
          </linearGradient>

          {/* Specular highlight on top basket edge */}
          <linearGradient id="cbSpecular" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0.85" />
            <stop offset="100%" stopColor="white" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* Shopping Cart Wheel 1 */}
        <g>
          {animateWheels && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 38 85"
              to="360 38 85"
              dur="4s"
              repeatCount="indefinite"
            />
          )}
          <circle cx="38" cy="85" r="7" className="fill-[#111318] dark:fill-[#F2F3F5]" />
          <circle cx="38" cy="85" r="3.5" fill="#2F6FED" />
          <line x1="38" y1="80" x2="38" y2="90" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
          <line x1="33" y1="85" x2="43" y2="85" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
          <circle cx="38" cy="85" r="1.5" fill="#1B4FC4" />
        </g>

        {/* Shopping Cart Wheel 2 */}
        <g>
          {animateWheels && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 76 85"
              to="360 76 85"
              dur="4s"
              repeatCount="indefinite"
            />
          )}
          <circle cx="76" cy="85" r="7" className="fill-[#111318] dark:fill-[#F2F3F5]" />
          <circle cx="76" cy="85" r="3.5" fill="#2F6FED" />
          <line x1="76" y1="80" x2="76" y2="90" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
          <line x1="71" y1="85" x2="81" y2="85" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
          <circle cx="76" cy="85" r="1.5" fill="#1B4FC4" />
        </g>

        {/* Bottom wheel connecting chassis bar */}
        <path
          d="M 28 73 L 80 73"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="text-[#E7E9EC] dark:text-[#2A2D33]"
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
            fill="#FFFFFF"
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
            fill="#EAF1FF"
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
