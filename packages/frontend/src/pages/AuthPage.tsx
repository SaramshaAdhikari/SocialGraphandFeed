import { useState } from 'react';
import { useRouter } from '../router/Router';
import { useAuth } from '../auth/AuthContext';
import { AlertCircle, User, ArrowRight, Info } from 'lucide-react';
import { api } from '../api';
import { mockUsers } from '../api/mock/fixtures';
import { BrandLogo } from '../components/brand/BrandLogo';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { navigate } = useRouter();
  const { acceptSession, user, status, logoutError } = useAuth();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const username = String(form.get('username') || '');
    const password = String(form.get('password') || '');

    if (api.dataSource === 'mock') {
      if (!username.trim()) {
        setError('Username is required.');
        setBusy(false);
        return;
      }
      if (!password.trim()) {
        setError('Password is required.');
        setBusy(false);
        return;
      }
      const matched = Object.values(mockUsers).find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase()
      );
      acceptSession({
        id: matched?.id || `usr_${username.trim().toLowerCase()}`,
        username: matched?.username || username.trim(),
        display_name: matched?.display_name || (username.trim().toLowerCase() === 'admin' ? 'Administrator' : username.trim()),
        avatar_url: matched?.avatar_url || '',
        role: username.trim().toLowerCase() === 'admin' ? 'admin' : 'user',
      }, 'mock-dev-csrf-token');
      navigate('/');
      setBusy(false);
      return;
    }

    try {
      const csrfRes = await fetch('/api/v1/auth/csrf', { credentials: 'include' });
      const csrfData = csrfRes.ok ? await csrfRes.json() : null;
      const csrfToken = csrfData?.csrf_token;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await fetch(`/api/v1/auth/${mode}`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          username,
          password,
          ...(mode === 'register'
            ? { password_confirmation: form.get('password_confirmation') }
            : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || 'Unable to authenticate.');
      acceptSession(result.user, result.csrf_token);
      navigate('/');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to authenticate.');
    } finally {
      setBusy(false);
    }
  }

  if (status === 'loading') {
    return (
      <main
        role="status"
        className="mx-auto mt-16 w-full max-w-md p-8 text-center text-sm text-text-muted"
      >
        Checking your session…
      </main>
    );
  }

  if (user) {
    return (
      <main className="mx-auto mt-12 sm:mt-16 w-full max-w-md rounded-2xl border border-border bg-surface-card p-8 shadow-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <User size={24} />
        </div>
        <h1 className="text-xl font-bold text-text-primary mb-1">
          Already Signed In
        </h1>
        <p className="text-sm text-text-muted mb-6">
          Signed in as <strong className="text-text-primary">u/{user.username}</strong> ({user.display_name}).
        </p>
        <button
          type="button"
          className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-primary hover:bg-primary-hover text-white transition-colors cursor-pointer shadow-xs"
          onClick={() => navigate('/')}
        >
          Continue to Feed
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto mt-8 sm:mt-14 w-full max-w-md rounded-2xl border border-border bg-surface-card p-6 sm:p-8 shadow-sm transition-colors">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-6">
        <BrandLogo variant="symbol" size="md" />
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">
            {mode === 'login' ? 'Sign in to SocialGraph' : 'Create your account'}
          </h1>
          <p className="text-xs text-text-muted">
            {mode === 'login'
              ? 'Access your feeds, communities, and saved collections'
              : 'Join the community of systems engineers and designers'}
          </p>
        </div>
      </div>

      {logoutError && (
        <div role="alert" className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{logoutError}</span>
        </div>
      )}

      {api.dataSource === 'mock' && (
        <div className="mb-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
          <Info size={16} className="shrink-0 mt-0.5 text-blue-500" />
          <div>
            <p className="font-semibold mb-0.5">Mock Mode Active</p>
            <p className="text-[11px] text-blue-600/90 dark:text-blue-400/90">
              Sign in with any mock account (e.g. <code className="font-mono font-bold">admin</code>, <code className="font-mono font-bold">alex_dev</code>, or <code className="font-mono font-bold">elena_arch</code>) with any password to test authenticated routes.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
            Username
          </label>
          <input
            name="username"
            required
            minLength={3}
            maxLength={30}
            autoComplete="username"
            placeholder="e.g. alex_dev"
            className="w-full h-10 px-3.5 text-sm rounded-xl border border-border bg-surface-subtle text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
            Password
          </label>
          <input
            name="password"
            type="password"
            required
            minLength={mode === 'register' ? 8 : 1}
            maxLength={128}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder="••••••••"
            className="w-full h-10 px-3.5 text-sm rounded-xl border border-border bg-surface-subtle text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

        {mode === 'register' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
              Confirm password
            </label>
            <input
              name="password_confirmation"
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              placeholder="••••••••"
              className="w-full h-10 px-3.5 text-sm rounded-xl border border-border bg-surface-subtle text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full h-11 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary text-white font-semibold text-sm transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-2"
        >
          {busy ? (
            <span>Please wait…</span>
          ) : (
            <>
              <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-border text-center">
        <button
          type="button"
          className="text-xs sm:text-sm font-semibold text-primary hover:underline cursor-pointer"
          onClick={() => navigate(mode === 'login' ? '/register' : '/login')}
        >
          {mode === 'login'
            ? "Don't have an account? Sign up"
            : 'Already registered? Sign in'}
        </button>
      </div>
    </main>
  );
}
export default AuthPage;
