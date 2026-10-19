import { useState } from 'react';
import { useRouter } from '../router/Router';
import { useAuth } from '../auth/AuthContext';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { navigate } = useRouter();
  const { acceptSession, user, status, logoutError } = useAuth();
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    const form = new FormData(event.currentTarget);
    const username = String(form.get('username') || ''); const password = String(form.get('password') || '');
    try {
      const response = await fetch(`/api/v1/auth/${mode}`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password, ...(mode === 'register' ? { password_confirmation: form.get('password_confirmation') } : {}) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || 'Unable to authenticate.');
      acceptSession(result.user, result.csrf_token); navigate('/');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to authenticate.'); }
    finally { setBusy(false); }
  }
  if (status === 'loading') return <main role="status" className="mx-auto mt-16 w-full max-w-md p-8 text-center">Checking your session…</main>;
  if (user) return <main className="mx-auto mt-16 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><p>Signed in as <strong>{user.display_name}</strong>.</p><button className="mt-4 text-sm text-indigo-700" onClick={() => navigate('/')}>Continue</button></main>;
  return <main className="mx-auto mt-16 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><h1 className="mb-6 text-2xl font-bold">{mode === 'login' ? 'Sign in' : 'Create your account'}</h1>{logoutError && <p role="alert" className="mb-4 text-sm text-red-600">{logoutError}</p>}<form onSubmit={submit} className="space-y-4"><label className="block">Username<input name="username" required minLength={3} maxLength={30} autoComplete="username" className="mt-1 w-full rounded-lg border p-3" /></label><label className="block">Password<input name="password" type="password" required minLength={mode === 'register' ? 8 : 1} maxLength={128} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="mt-1 w-full rounded-lg border p-3" /></label>{mode === 'register' && <label className="block">Confirm password<input name="password_confirmation" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="mt-1 w-full rounded-lg border p-3" /></label>}{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<button disabled={busy} className="w-full rounded-lg bg-indigo-600 p-3 font-semibold text-white disabled:opacity-50">{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Register'}</button></form><button className="mt-5 text-sm text-indigo-700" onClick={() => navigate(mode === 'login' ? '/register' : '/login')}>{mode === 'login' ? 'Create an account' : 'Already registered? Sign in'}</button></main>;
}
