import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  KeyRound,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../api/axios';
import Logo from '../components/Logo';
import ThemeToggle from '../components/common/ThemeToggle';
import InteractiveGridBackground from '../components/common/InteractiveGridBackground';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { requestPasswordReset, confirmPasswordReset } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleRequestCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@vitstudent\.ac\.in$/i.test(trimmedEmail)) {
      setError('Please enter a valid @vitstudent.ac.in email address.');
      return;
    }

    setIsLoading(true);
    try {
      await requestPasswordReset(trimmedEmail);
      setStep(2);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to request reset code.'));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirmReset(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (code.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await confirmPasswordReset(email.trim().toLowerCase(), code.trim(), newPassword);
      setIsSuccess(true);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to reset password.'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface-base px-4 py-12 transition-colors duration-300">
      <InteractiveGridBackground />

      {/* Top Navbar Header */}
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
        </Link>
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="overflow-hidden rounded-3xl border border-borderline bg-surface/90 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
          {/* Brand header inside card */}
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2F6FED]/10 text-[#2F6FED]">
              <KeyRound className="h-6 w-6" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
              {isSuccess
                ? 'Password Reset Complete'
                : step === 1
                ? 'Reset Your Password'
                : 'Enter Reset Code'}
            </h1>
            <p className="mt-1 text-xs text-ink-muted">
              {isSuccess
                ? 'Your password has been successfully updated.'
                : step === 1
                ? 'Enter your campus email to receive a 6-digit recovery code.'
                : `We sent a 6-digit recovery code to ${email}`}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 flex items-center gap-2 rounded-xl border border-status-danger/20 bg-status-danger/10 p-3 text-xs text-status-danger"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isSuccess ? (
            <div className="mt-6 space-y-4 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-[#1AA260]" />
              <p className="text-xs text-ink-muted">
                You can now log in to Campus Bazaar using your new credentials.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#2F6FED] py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#1B4FC4]"
              >
                Sign In Now <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : step === 1 ? (
            <form onSubmit={handleRequestCode} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="reset-email"
                  className="mb-1.5 block text-xs font-semibold text-ink"
                >
                  Campus Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.name@vitstudent.ac.in"
                    className="w-full rounded-full border border-borderline bg-surface-base py-3 pl-11 pr-4 text-sm text-ink placeholder-ink-muted/60 outline-none transition focus:border-[#2F6FED]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#2F6FED] py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#1B4FC4] disabled:opacity-50"
              >
                {isLoading ? 'Sending Code…' : 'Send Recovery Code'}{' '}
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleConfirmReset} className="mt-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="reset-code"
                    className="block text-xs font-semibold text-ink"
                  >
                    6-Digit Code
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError(null);
                    }}
                    className="text-[11px] text-[#2F6FED] hover:underline"
                  >
                    Change Email
                  </button>
                </div>
                <input
                  id="reset-code"
                  type="text"
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full tracking-widest text-center font-mono rounded-full border border-borderline bg-surface-base py-3 px-4 text-base font-bold text-ink outline-none transition focus:border-[#2F6FED]"
                />
              </div>

              <div>
                <label
                  htmlFor="new-password"
                  className="mb-1.5 block text-xs font-semibold text-ink"
                >
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                  <input
                    id="new-password"
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-full border border-borderline bg-surface-base py-3 pl-11 pr-4 text-sm text-ink outline-none transition focus:border-[#2F6FED]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-1.5 block text-xs font-semibold text-ink"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                  <input
                    id="confirm-password"
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full rounded-full border border-borderline bg-surface-base py-3 pl-11 pr-4 text-sm text-ink outline-none transition focus:border-[#2F6FED]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1AA260] py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#15824d] disabled:opacity-50"
              >
                {isLoading ? 'Updating Password…' : 'Reset Password'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Step 1
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
