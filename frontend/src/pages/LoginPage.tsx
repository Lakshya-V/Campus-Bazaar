// src/pages/LoginPage.tsx
import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { AUTH_GATE_VARIANTS } from '../lib/motion';
import ThemeToggle from '../components/common/ThemeToggle';

export default function LoginPage() {
  const { login, demoUsers } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError('Please enter a valid campus or institutional email address (e.g., student@campus.edu).');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(trimmed);
    } catch {
      setError('Authentication failed. Please check your email.');
      setIsSubmitting(false);
    }
  }

  async function handleQuickLogin(demoEmail: string) {
    setEmail(demoEmail);
    setError(null);
    setIsSubmitting(true);
    await login(demoEmail);
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Floating Theme Toggle in top-right corner of auth gate */}
      <div className="absolute right-4 top-4 z-20 sm:right-8 sm:top-8">
        <ThemeToggle />
      </div>

      <motion.div
        variants={AUTH_GATE_VARIANTS}
        initial="initial"
        animate="animate"
        exit="exit"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-black/10 bg-white/80 p-6 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-[#09090b]/80 sm:p-8"
      >
        {/* Top ambient highlight specular rim */}
        <div className="pointer-events-none absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

        {/* Brand Hero */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <Logo size={68} className="drop-shadow-lg" />
          </div>

          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Campus <span className="text-purple-600 dark:text-purple-400">Bazaar</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed">
            The peer-to-peer campus marketplace. Buy textbooks, dorm tech, and essentials from verified campus peers.
          </p>
        </div>

        {/* Verification badge pill */}
        <div className="mt-5 flex items-center justify-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Institutional Student Auth Gate</span>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400"
          >
            {error}
          </motion.div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Institutional Email
            </label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@campus.edu"
                className="w-full rounded-2xl border border-black/10 bg-black/[0.03] py-2.5 pl-10 pr-4 text-sm text-ink placeholder-ink-muted/50 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-white/5 dark:focus:border-purple-400"
              />
            </div>
            <p className="mt-1 text-[11px] text-ink-muted">
              Enter any university or institutional email to access or auto-provision an account.
            </p>
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 transition-all hover:bg-purple-700 disabled:opacity-50 dark:bg-purple-600 dark:hover:bg-purple-500"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Signing in...
              </span>
            ) : (
              <>
                <span>Enter Campus Bazaar</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Quick Demo Student Profiles */}
        <div className="mt-8 border-t border-black/8 pt-5 dark:border-white/10">
          <div className="flex items-center justify-between text-xs text-ink-muted mb-3">
            <span className="flex items-center gap-1 font-semibold uppercase tracking-wider">
              <UserCheck className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              1-Click Demo Profiles:
            </span>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Instant Access</span>
          </div>

          <div className="space-y-2">
            {demoUsers.slice(0, 3).map((demoUser) => (
              <button
                key={demoUser.User_ID}
                type="button"
                onClick={() => handleQuickLogin(demoUser.InstitutionalEmail)}
                className="flex w-full items-center justify-between rounded-xl border border-black/8 bg-black/[0.02] p-2.5 text-left transition-all hover:border-purple-500/40 hover:bg-purple-500/5 dark:border-white/10 dark:bg-white/[0.02] dark:hover:bg-purple-500/10"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <img
                    src={demoUser.AvatarSeed}
                    alt={demoUser.Name}
                    className="h-7 w-7 rounded-lg object-cover ring-1 ring-purple-500/30"
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
                  <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                    {demoUser.Rating}★
                  </span>
                  <Sparkles className="h-3 w-3 text-purple-500" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}