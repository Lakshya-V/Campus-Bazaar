// src/components/common/InteractiveGridBackground.tsx
import { useEffect, useRef } from 'react';

interface InteractiveGridBackgroundProps {
  className?: string;
  dotSpacing?: number;
  spotlightRadius?: number;
}

export default function InteractiveGridBackground({
  className = '',
  dotSpacing = 28,
  spotlightRadius = 200,
}: InteractiveGridBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouseX = -1000;
    let mouseY = -1000;
    let targetMouseX = -1000;
    let targetMouseY = -1000;

    function handleResize() {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    function handlePointerMove(e: PointerEvent) {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    }

    function handlePointerLeave() {
      targetMouseX = -1000;
      targetMouseY = -1000;
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerleave', handlePointerLeave);

    function render() {
      if (!ctx || !canvas) return;

      // Smooth mouse coordinates (lerp)
      mouseX += (targetMouseX - mouseX) * 0.15;
      mouseY += (targetMouseY - mouseY) * 0.15;

      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains('dark');
      const baseAlpha = isDark ? 0.22 : 0.16;

      const startX = 0;
      const startY = 0;

      for (let x = startX; x < width; x += dotSpacing) {
        // Normalized progress from top-left (0) to bottom-right (1)
        const progressX = width > 0 ? x / width : 0;

        for (let y = startY; y < height; y += dotSpacing) {
          const progressY = height > 0 ? y / height : 0;
          const progress = Math.min(Math.max(progressX * 0.6 + progressY * 0.4, 0), 1);

          // Interpolate between Bazaar Blue (#2F6FED -> 47, 111, 237) and Amber (#F2994A -> 242, 153, 74)
          const r = Math.round(47 + (242 - 47) * progress);
          const g = Math.round(111 + (153 - 111) * progress);
          const b = Math.round(237 + (74 - 237) * progress);

          const dx = x - mouseX;
          const dy = y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < spotlightRadius) {
            // Proximity intensity from 0 to 1
            const intensity = 1 - dist / spotlightRadius;
            const radius = 1.2 + intensity * 1.8;
            const alpha = Math.min(baseAlpha + intensity * (isDark ? 0.65 : 0.55), 0.95);

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(x, y, 1.1, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${baseAlpha})`;
            ctx.fill();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    }

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [dotSpacing, spotlightRadius]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="h-full w-full opacity-90 transition-opacity duration-300"
      />
    </div>
  );
}
