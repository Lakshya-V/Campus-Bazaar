// src/components/layout/MarketplaceFooter.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Info, Quote, Mail } from 'lucide-react';
import MarqueeStrip from '../common/MarqueeStrip';

const FOOTER_RULES = [
  'Campus Bazaar facilitates direct connections between students — we are not a party to any transaction and do not guarantee item condition, authenticity, or delivery.',
  'All exchanges must occur in person on campus in well-lit public zones at the buyer and seller’s own discretion and risk.',
  'Listings marked SOLD or removed by a seller carry no refund, chargeback, or recovery guarantee through the platform.',
  'Report suspicious listings, impersonation, or academic policy violations to campus safety or contact the student moderation desk.',
];

const ROTATING_QUOTES = [
  {
    quote: '“Pass it forward — the textbook or equipment that powered your semester can kickstart someone else’s journey.”',
    attribution: 'Campus Circular Economy Initiative',
  },
  {
    quote: '“True campus community thrives when sustainable resourcefulness and student trust become second nature.”',
    attribution: 'Student Sustainability Coalition',
  },
  {
    quote: '“Trade peer-to-peer, reduce dorm move-out landfill waste, and keep valuable academic tools in active use.”',
    attribution: 'Green Campus Project',
  },
];

const DEFAULT_MARQUEE_MESSAGES = [
  '⚡ New Campus Listings Added Daily',
  '🔒 100% Verified Student Guarantee',
  '📚 Textbooks & Course Equipment',
  '💻 Dorm Electronics & Appliances',
  '🤝 Safe In-Person Campus Hand-offs',
  '✨ Zero Platform Fees & No Hidden Cuts',
];

interface MarketplaceFooterProps {
  marqueeMessages?: string[];
}

export default function MarketplaceFooter({
  marqueeMessages = DEFAULT_MARQUEE_MESSAGES,
}: MarketplaceFooterProps) {
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Rotate quotes every 7s
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % ROTATING_QUOTES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const currentQuote = ROTATING_QUOTES[quoteIndex];

  return (
    <footer aria-label="Campus Bazaar Footer" className="mt-16 space-y-6 pt-6">
      {/* ═══════════════════════════════════════════════════════════════
          TIER 1: MARKETPLACE RULES & DISCLAIMER BLOCK (Static, Readable)
          ═══════════════════════════════════════════════════════════════ */}
      <section
        aria-label="Marketplace Rules and Disclaimer"
        className="rounded-2xl border border-borderline bg-surface/60 p-5 sm:p-6 backdrop-blur-md transition-colors"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#2F6FED]/10 text-[#2F6FED] dark:text-[#4F8CFF]">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink">
            Marketplace Rules & Campus Safety
          </h2>
          <span className="rounded-full bg-surface-elevated border border-borderline px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-ink-muted">
            Legal & Policy
          </span>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-ink-muted/90 font-body leading-relaxed">
          {FOOTER_RULES.map((rule, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#2F6FED]/70" />
              <span>{rule}</span>
            </li>
          ))}
        </ul>

        <div className="mt-3.5 pt-3 border-t border-borderline/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-muted">
          <span>Need assistance or safety mediation?</span>
          <a
            href="mailto:campus-bazaar-support@campus.edu"
            className="inline-flex items-center gap-1.5 text-[#2F6FED] hover:underline font-medium"
          >
            <Mail className="h-3 w-3" />
            campus-bazaar-support@campus.edu (Student Moderation)
          </a>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TIER 2: ABOUT / CREDITS SECTION (Static Readable Text)
          ═══════════════════════════════════════════════════════════════ */}
      <section
        aria-label="About and Project Credits"
        className="rounded-2xl border border-borderline bg-surface/40 p-5 sm:p-6 backdrop-blur-md transition-colors"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-[#F2994A]" />
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink">
                About Campus Bazaar
              </h3>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed font-body">
              A student-built peer-to-peer marketplace project for{' '}
              <span className="font-medium text-ink">[Institution / CSE Software Capstone 2026]</span>
              . Designed to make university life more affordable, sustainable, and connected by connecting campus peers directly.
            </p>
            <p className="text-[11px] text-ink-muted">
              Built by{' '}
              <span className="font-medium text-ink">
                [Project Team: Alex Rivera, Sarah Chen &amp; Jordan Taylor]
              </span>
              .
            </p>
          </div>

          <div className="flex flex-col sm:items-end justify-center border-t md:border-t-0 md:border-l border-borderline/60 pt-3 md:pt-0 md:pl-6 text-[11px] text-ink-muted">
            <span className="font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              Tech Stack
            </span>
            <span>React 18 · TypeScript · Tailwind CSS</span>
            <span>Framer Motion · Django REST Framework</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TIER 3: ROTATING QUOTES STRIP (Subtle 7s Fade Transition)
          ═══════════════════════════════════════════════════════════════ */}
      <section
        aria-label="Campus Community Quote"
        className="flex items-center justify-center py-2 text-center min-h-[50px] px-4"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={quoteIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex flex-col items-center gap-1 max-w-xl"
          >
            <div className="flex items-center gap-2 text-xs italic text-ink-muted/90 font-body">
              <Quote className="h-3 w-3 text-[#2F6FED]/60 flex-shrink-0" />
              <span>{currentQuote.quote}</span>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-muted/60">
              — {currentQuote.attribution}
            </span>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TIER 4: EXISTING BOTTOM MARQUEE TICKER (Unchanged Edge Ticker)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="pt-2">
        <MarqueeStrip
          items={marqueeMessages}
          speed={36}
          tiltAngle={4}
          className="rounded-2xl shadow-sm"
        />
      </div>
    </footer>
  );
}
