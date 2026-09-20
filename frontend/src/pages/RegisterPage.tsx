import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/brand/BrandLogo';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email);
      navigate('/');
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-line bg-panel/70 p-8 shadow-xl backdrop-blur-sm">
        <div className="text-center">
            <BrandLogo size={44} className="mx-auto mb-3" />
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Create an account</h1>
          <p className="mt-1 text-sm text-ink-muted">Join Campus-Bazaar to buy and sell on campus</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-ink-muted">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mt-1.5 w-full rounded-xl border border-line/15 bg-black/[0.03] dark:bg-white/5 px-4 py-2.5 text-sm text-ink placeholder-ink-muted/50 outline-none transition focus:border-buy focus:ring-1 focus:ring-buy"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-ink-muted">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@vitstudent.ac.in"
              className="mt-1.5 w-full rounded-xl border border-line/15 bg-black/[0.03] dark:bg-white/5 px-4 py-2.5 text-sm text-ink placeholder-ink-muted/50 outline-none transition focus:border-buy focus:ring-1 focus:ring-buy"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-ink-muted">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-xl border border-line/15 bg-black/[0.03] dark:bg-white/5 px-4 py-2.5 text-sm text-ink placeholder-ink-muted/50 outline-none transition focus:border-buy focus:ring-1 focus:ring-buy"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-buy px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-xs text-ink-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-buy hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}