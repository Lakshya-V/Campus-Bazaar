// src/pages/LoginPage.tsx
import { useState, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Mail,
  User,
  ArrowRight,
  UserCheck,
  ChevronDown,
  ShieldCheck,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import ThemeToggle from '../components/common/ThemeToggle';
import RatingStars from '../components/common/RatingStars';
import MarqueeStrip from '../components/common/MarqueeStrip';
import InteractiveGridBackground from '../components/common/InteractiveGridBackground';

// Top marquee trust & brand announcements
const MARQUEE_MESSAGES = [
  '100% Verified Students',
  'Zero Platform Fees',
  'Campus Hand-off Only',
  'No Hidden Charges',
  'Institutional .edu Authentication',
  'Direct Peer Marketplace',
];

// Abstract 3D geometric shape cluster (Option A) in outer margins
// Styled in the 5-color palette: Blue (#2F6FED), Amber (#F2994A), Gold (#F2A93B), Green (#1AA260)
const ABSTRACT_3D_SHAPES = [
  {
    id: 'shape-blue-orb',
    name: 'Layered Glass Orb',
    style: { top: '18%', left: '5%' },
    render: () => (
      <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center">
        {/* Outer ambient glow */}
        <div className="absolute inset-0 rounded-full bg-[#2F6FED]/25 blur-xl" />
        {/* 3D Glass Orb with inner specular gloss */}
        <div className="relative h-full w-full rounded-full border border-white/30 bg-gradient-to-br from-[#2F6FED] via-[#1B4FC4] to-[#10131A] shadow-[0_12px_28px_rgba(47,111,237,0.4)] backdrop-blur-md">
          {/* Specular curved highlight */}
          <div className="absolute left-2 top-2 h-4 w-6 rounded-full bg-white/40 blur-[1px] rotate-[-25deg]" />
          {/* Internal orbital core ring */}
          <div className="absolute inset-2.5 rounded-full border border-white/20 border-dashed" />
        </div>
      </div>
    ),
    duration: 8.5,
    yRange: [-7, 8, -7],
    rotateRange: [0, 180, 360],
    scaleRange: [0.96, 1.04, 0.96],
    delay: 0,
  },
  {
    id: 'shape-amber-cube',
    name: 'Isometric Amber Prism',
    style: { top: '18%', right: '5%' },
    render: () => (
      <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center">
        {/* Outer ambient amber glow */}
        <div className="absolute inset-0 rounded-2xl bg-[#F2994A]/25 blur-xl" />
        {/* 3D Isometric Rounded Cube */}
        <div className="relative h-full w-full rounded-2xl border border-white/25 bg-gradient-to-tr from-[#D97B2B] via-[#F2994A] to-[#FFD188] shadow-[0_12px_28px_rgba(242,153,74,0.4)] backdrop-blur-md transform rotate-12">
          {/* Corner facet highlight */}
          <div className="absolute right-2 top-2 h-3.5 w-3.5 rounded-md bg-white/45 blur-[0.5px]" />
          <div className="absolute inset-2 rounded-xl border border-white/25" />
        </div>
      </div>
    ),
    duration: 9.8,
    yRange: [8, -7, 8],
    rotateRange: [12, 32, 12],
    scaleRange: [1.02, 0.96, 1.02],
    delay: 0.5,
  },
  {
    id: 'shape-gold-capsule',
    name: 'Floating Gold Pill',
    style: { bottom: '18%', left: '5%' },
    render: () => (
      <div className="relative flex h-11 w-16 sm:h-12 sm:w-20 items-center justify-center">
        {/* Outer ambient gold glow */}
        <div className="absolute inset-0 rounded-full bg-[#F2A93B]/25 blur-xl" />
        {/* 3D Capsule Pill */}
        <div className="relative h-full w-full rounded-full border border-white/30 bg-gradient-to-r from-[#F2A93B] via-[#F2994A] to-[#E0912B] shadow-[0_12px_24px_rgba(242,169,59,0.35)] backdrop-blur-md">
          {/* Longitudinal specular sheen */}
          <div className="absolute inset-x-3 top-1.5 h-2 rounded-full bg-white/40 blur-[0.5px]" />
        </div>
      </div>
    ),
    duration: 8.2,
    yRange: [-6, 7, -6],
    rotateRange: [-8, 6, -8],
    scaleRange: [0.97, 1.03, 0.97],
    delay: 1.1,
  },
  {
    id: 'shape-green-crystal',
    name: 'Tactile Emerald Crystal',
    style: { bottom: '18%', right: '5%' },
    render: () => (
      <div className="relative flex h-14 w-14 sm:h-15 sm:w-15 items-center justify-center">
        {/* Outer ambient green glow */}
        <div className="absolute inset-0 rounded-2xl bg-[#1AA260]/25 blur-xl" />
        {/* 3D Rounded Crystal */}
        <div className="relative h-full w-full rounded-2xl border border-white/25 bg-gradient-to-br from-[#1AA260] via-[#12A150] to-[#10131A] shadow-[0_12px_26px_rgba(26,162,96,0.35)] backdrop-blur-md transform rotate-45">
          {/* Specular sheen */}
          <div className="absolute left-2 top-2 h-3 w-5 rounded-full bg-white/40 blur-[0.5px]" />
          <div className="absolute inset-2.5 rounded-xl border border-white/20" />
        </div>
      </div>
    ),
    duration: 10.4,
    yRange: [7, -8, 7],
    rotateRange: [45, 65, 45],
    scaleRange: [0.98, 1.04, 0.98],
    delay: 0.3,
  },
];

// Feature & trust cards for below-the-fold info section
const TRUST_HIGHLIGHTS = [
  {
    id: 'trust-email',
    icon: ShieldCheck,
    iconColor: 'text-[#2F6FED]',
    bgColor: 'bg-[#2F6FED]/10',
    title: 'Verified Institutional Emails',
    description:
      'Only authenticated students with active .edu campus accounts can list or purchase. Zero outside spam or fake accounts.',
  },
  {
    id: 'trust-handoff',
    icon: MapPin,
    iconColor: 'text-[#F2994A]',
    bgColor: 'bg-[#F2994A]/10',
    title: 'In-Person Campus Hand-offs',
    description:
      'Meet safely right on campus — at the student library, dorm quads, or dining centers. Inspect the item in person before handoff.',
  },
  {
    id: 'trust-fees',
    icon: Sparkles,
    iconColor: 'text-[#1AA260]',
    bgColor: 'bg-[#1AA260]/10',
    title: 'Zero Platform Fees',
    description:
      '100% peer-to-peer commerce. Keep every dollar you make with zero listing fees, platform cuts, or hidden student deductions.',
  },
];

export default function LoginPage() {
  const { login, signup, demoUsers } = useAuth();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingInSuccess, setIsLoggingInSuccess] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const loginSectionRef = useRef<HTMLDivElement>(null);

  // Scroll tracking across the 2-part page
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Dynamic backdrop blur and dark overlay as user scrolls down to login tab
  const backdropBlur = useTransform(
    scrollYProgress,
    [0.1, 0.45],
    ['blur(0px)', 'blur(16px)']
  );
  const overlayOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.45],
    [0, 0.65]
  );

  function scrollToLogin() {
    loginSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError('Please enter a valid campus or institutional email address (e.g., student@campus.edu).');
      return;
    }

    if (authMode === 'signup' && !fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (authMode === 'signup') {
        await signup(fullName.trim(), trimmed);
      } else {
        await login(trimmed);
      }
      setIsLoggingInSuccess(true);
      setTimeout(() => {
        navigate('/');
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }, 350);
    } catch {
      setError(authMode === 'signup' ? 'Registration failed. Please try again.' : 'Authentication failed. Please check your email.');
      setIsSubmitting(false);
    }
  }

  async function handleQuickLogin(demoEmail: string) {
    setEmail(demoEmail);
    setError(null);
    setIsSubmitting(true);
    try {
      await login(demoEmail);
      setIsLoggingInSuccess(true);
      setTimeout(() => {
        navigate('/');
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }, 350);
    } catch {
      setError('Quick login failed.');
      setIsSubmitting(false);
    }
  }

  return (
    <div ref={containerRef} className="relative min-h-[220vh] w-full max-w-full overflow-x-hidden bg-surface-base text-ink">
      {/* Fixed Theme Toggle in top-right */}
      <div className="fixed right-4 top-4 z-50 sm:right-8 sm:top-5">
        <ThemeToggle />
      </div>

      {/* Dynamic Scroll-Driven Backdrop Blur Layer (Over Hero) */}
      <motion.div
        style={{
          backdropFilter: backdropBlur,
          WebkitBackdropFilter: backdropBlur,
          opacity: overlayOpacity,
        }}
        className="pointer-events-none fixed inset-0 z-20 bg-[#10131A]"
      />

      {/* ═══════════════════════════════════════════════════════════════
          SECTION A — HERO (Full Viewport Height, Visible Before Scroll)
          ═══════════════════════════════════════════════════════════════ */}
      <section className="sticky top-0 relative flex h-screen w-full max-w-full flex-col items-center justify-between overflow-hidden">
        {/* Subtle Ambient Color Wash Gradients (Bazaar Blue top-left, Amber bottom-right) */}
        <div
          className="pointer-events-none absolute inset-0 z-10 opacity-70 dark:opacity-85"
          style={{
            background:
              'radial-gradient(circle at 10% 20%, rgba(47, 111, 237, 0.12) 0%, transparent 45%), radial-gradient(circle at 90% 80%, rgba(242, 153, 74, 0.10) 0%, transparent 45%), radial-gradient(circle at 50% 50%, rgba(242, 169, 59, 0.03) 0%, transparent 60%)',
          }}
        />

        {/* Continuous 3D Perspective Marquee Strip at Top */}
        <div className="relative z-30 w-full max-w-full">
          <MarqueeStrip items={MARQUEE_MESSAGES} speed={32} tiltAngle={5} />
        </div>

        {/* Pointer-Reactive Interactive Dot Grid Background Canvas */}
        <InteractiveGridBackground dotSpacing={28} spotlightRadius={190} />

        {/* Abstract 3D Geometric Shape Cluster in Outer Margins (Option A) */}
        {ABSTRACT_3D_SHAPES.map((item) => (
          <motion.div
            key={item.id}
            animate={{
              y: item.yRange,
              rotate: item.rotateRange,
              scale: item.scaleRange,
            }}
            transition={{
              duration: item.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: item.delay,
            }}
            style={item.style}
            className="pointer-events-none absolute z-30 select-none"
          >
            {item.render()}
          </motion.div>
        ))}

        {/* Center Container with Protected Clear-Space Bounding Box */}
        <div className="relative z-20 mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-6 text-center">
          {/* Brand Chip */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-borderline bg-[#111318] px-3.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-xs dark:bg-[#F2F3F5] dark:text-[#0D0F12]">
            <span>Campus Bazaar</span>
            <span className="opacity-60">·</span>
            <span>Student Marketplace</span>
          </div>

          {/* Tactile Bounce & Settle Cart Logo with Ambient Glow & Animated Wheels */}
          <motion.div
            className="group relative mb-4 flex flex-col items-center justify-center cursor-pointer select-none"
            whileHover="hover"
            initial="idle"
            animate="idle"
          >
            {/* Cart with Idle Subtle Bounce / Settle and Energetic Hover Response */}
            <motion.div
              variants={{
                idle: {
                  scale: [1, 0.98, 1.04, 0.99, 1, 1],
                  y: [0, 2, -5, 1, 0, 0],
                  transition: {
                    duration: 3.6,
                    repeat: Infinity,
                    times: [0, 0.12, 0.35, 0.55, 0.72, 1],
                    ease: [0.25, 1, 0.5, 1],
                  },
                },
                hover: {
                  scale: 1.08,
                  y: -8,
                  transition: {
                    type: 'spring',
                    stiffness: 450,
                    damping: 15,
                  },
                },
              }}
              className="relative flex items-center justify-center"
            >
              <Logo size={64} animateWheels={true} className="drop-shadow-md" />
            </motion.div>

            {/* Soft Ambient Bazaar Blue Radial Gradient Shadow (Reactive to bounce and hover) */}
            <motion.div
              variants={{
                idle: {
                  scale: [1, 0.95, 1.14, 0.98, 1, 1],
                  opacity: [0.35, 0.42, 0.22, 0.38, 0.35, 0.35],
                  transition: {
                    duration: 3.6,
                    repeat: Infinity,
                    times: [0, 0.12, 0.35, 0.55, 0.72, 1],
                    ease: [0.25, 1, 0.5, 1],
                  },
                },
                hover: {
                  scale: 1.25,
                  opacity: 0.20,
                  transition: {
                    type: 'spring',
                    stiffness: 450,
                    damping: 15,
                  },
                },
              }}
              className="mt-1 h-2.5 w-16 rounded-full bg-[#2F6FED] blur-md pointer-events-none"
            />
          </motion.div>

          <h1 className="font-display text-5xl font-bold tracking-tight text-ink sm:text-6xl md:text-7xl lg:text-8xl leading-none">
            Campus <span className="text-[#2F6FED]">Bazaar</span>
          </h1>

          <p className="mx-auto mt-4 max-w-md text-xs sm:text-sm md:text-base text-ink-muted leading-relaxed font-body">
            The peer-to-peer campus marketplace. Buy textbooks, dorm tech, and essentials direct from verified students across campus.
          </p>
        </div>

        {/* Bottom Scroll-Down Indicator (Bouncing Chevron) */}
        <div className="relative z-20 pb-4">
          <button
            type="button"
            onClick={scrollToLogin}
            className="group flex flex-col items-center gap-1.5 text-ink-muted transition-colors hover:text-ink focus:outline-none"
          >
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-ink-muted group-hover:text-ink">
              Scroll to Explore & Sign In
            </span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-borderline bg-surface shadow-sm group-hover:border-ink-secondary/40"
            >
              <ChevronDown className="h-3.5 w-3.5 text-ink" />
            </motion.div>
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION B — BELOW THE FOLD: TRUST INFO & SIGN IN TAB
          ═══════════════════════════════════════════════════════════════ */}
      <div ref={loginSectionRef} className="relative z-30 flex flex-col items-center px-4 py-20 sm:px-6 lg:px-8 space-y-16 bg-surface-base border-t border-borderline shadow-2xl">
        {/* Trust Highlights Section (Feature Cards on Scroll) */}
        <div className="w-full max-w-5xl">
          <div className="text-center mb-10">
            <span className="inline-block rounded-full bg-[#2F6FED]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#2F6FED]">
              Why Campus Bazaar
            </span>
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink mt-2 sm:text-4xl">
              Safe Student Commerce
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-ink-muted max-w-lg mx-auto font-body">
              Designed specifically for university ecosystems with zero platform cuts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TRUST_HIGHLIGHTS.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: idx * 0.12 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="rounded-2xl border border-borderline bg-surface/90 p-6 shadow-sm backdrop-blur-md transition-all hover:border-[#2F6FED]/40 hover:shadow-md"
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${feature.bgColor} ${feature.iconColor} mb-4`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-base font-bold text-ink">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-xs text-ink-muted leading-relaxed font-body">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Student Sign-In Tab Form Card */}
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {!isLoggingInSuccess ? (
              <motion.div
                key="login-tab-form"
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: false, amount: 0.3 }}
                exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.3 } }}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                className="relative w-full rounded-3xl border border-borderline bg-surface/95 p-8 sm:p-10 shadow-2xl backdrop-blur-xl transition-all"
              >
                {/* Segmented Toggle: Log In | Sign Up */}
                <div className="mb-6 flex rounded-full border border-borderline bg-surface-base p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setError(null);
                    }}
                    className={`relative flex-1 rounded-full py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                      authMode === 'login' ? 'text-white dark:text-[#0D0F12]' : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {authMode === 'login' && (
                      <motion.div
                        layoutId="authTabPill"
                        className="absolute inset-0 rounded-full bg-[#111318] dark:bg-[#F2F3F5] shadow-xs"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">Log In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setError(null);
                    }}
                    className={`relative flex-1 rounded-full py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                      authMode === 'signup' ? 'text-white dark:text-[#0D0F12]' : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {authMode === 'signup' && (
                      <motion.div
                        layoutId="authTabPill"
                        className="absolute inset-0 rounded-full bg-[#111318] dark:bg-[#F2F3F5] shadow-xs"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">Sign Up</span>
                  </button>
                </div>

                {/* All-Caps Label Chip & Header */}
                <div className="text-center">
                  <div className="inline-flex items-center rounded-full border border-borderline bg-[#111318] px-3.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-xs dark:bg-[#F2F3F5] dark:text-[#0D0F12] mb-4">
                    {authMode === 'login' ? 'STUDENT SIGN IN' : 'NEW STUDENT SIGN UP'}
                  </div>

                  <div className="mx-auto mb-3 flex justify-center">
                    <Logo size={48} />
                  </div>

                  <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                    {authMode === 'login' ? 'Enter Campus Bazaar' : 'Join Campus Bazaar'}
                  </h2>
                  <p className="mt-1.5 text-xs text-ink-muted leading-relaxed font-body">
                    {authMode === 'login'
                      ? 'Access your campus marketplace using your institutional email.'
                      : 'Create your verified student account with your university email.'}
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rounded-xl border border-status-danger/20 bg-status-danger/10 p-3 text-xs text-status-danger"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Form with Dynamic Name (in Sign Up) & Pill Email Input & Amber Submit Button */}
                <form onSubmit={handleFormSubmit} className="mt-6 space-y-4">
                  <AnimatePresence mode="wait">
                    {authMode === 'signup' && (
                      <motion.div
                        key="signup-fullname-field"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g. Jordan Lee"
                            className="w-full rounded-full border border-borderline bg-surface-base py-3 pl-11 pr-5 text-sm text-ink placeholder-ink-muted/60 outline-none transition focus:border-[#2F6FED] focus:ring-1 focus:ring-[#2F6FED]"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                      Institutional Email
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.name@campus.edu"
                        className="w-full rounded-full border border-borderline bg-surface-base py-3 pl-11 pr-5 text-sm text-ink placeholder-ink-muted/60 outline-none transition focus:border-[#2F6FED] focus:ring-1 focus:ring-[#2F6FED]"
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-ink-muted">
                      {authMode === 'login'
                        ? 'Instant access or automatic peer provisioning with student email.'
                        : 'Must be an active student or institutional .edu email.'}
                    </p>
                  </div>

                  {/* Primary CTA Button in AMBER #F2994A */}
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[#F2994A] py-3.5 text-sm font-semibold text-[#10131A] shadow-md transition-all hover:bg-[#D97B2B] active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#10131A] border-t-transparent" />
                        {authMode === 'login' ? 'Signing in...' : 'Creating account...'}
                      </span>
                    ) : (
                      <>
                        <span>{authMode === 'login' ? 'Enter Campus Bazaar' : 'Create Student Account'}</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Quick Demo Student Profiles with #F2A93B Rating Stars */}
                <div className="mt-7 border-t border-borderline pt-5">
                  <div className="flex items-center justify-between text-xs text-ink-muted mb-3">
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
                      <UserCheck className="h-3.5 w-3.5 text-ink-muted" />
                      1-Click Demo Profiles:
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-ink-muted font-medium">
                      Instant Access
                    </span>
                  </div>

                  <div className="space-y-2">
                    {demoUsers.slice(0, 3).map((demoUser) => (
                      <button
                        key={demoUser.User_ID}
                        type="button"
                        onClick={() => handleQuickLogin(demoUser.InstitutionalEmail)}
                        className="flex w-full items-center justify-between rounded-xl border border-borderline bg-surface-base/50 p-2.5 text-left transition-all hover:border-ink-secondary/30 hover:bg-surface-elevated cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <img
                            src={demoUser.AvatarSeed}
                            alt={demoUser.Name}
                            className="h-7 w-7 rounded-full object-cover border border-borderline"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-ink">
                              {demoUser.Name}
                            </p>
                            <p className="truncate text-[10px] text-ink-muted">
                              {demoUser.InstitutionalEmail}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <RatingStars value={demoUser.Rating} size={11} showScore />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="login-tab-success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="flex flex-col items-center gap-4 rounded-3xl border border-borderline bg-surface/95 p-10 text-center shadow-2xl backdrop-blur-xl"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1AA260]/10 text-[#1AA260]">
                  <Logo size={40} />
                </div>
                <h2 className="font-display text-2xl font-bold text-ink">
                  Welcome to Campus Bazaar
                </h2>
                <p className="text-xs text-ink-muted">
                  Entering marketplace feed...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}