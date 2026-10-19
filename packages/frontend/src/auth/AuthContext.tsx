import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setCsrfToken } from '../api/LiveClient';

export interface AuthUser { id: string; username: string; display_name: string; avatar_url: string; role: 'user' | 'admin' }
type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  logoutError: string;
  refresh: () => Promise<void>;
  acceptSession: (user: AuthUser, csrf: string) => void;
  logout: () => Promise<boolean>;
}
const AuthContext = createContext<AuthContextValue>({ user: null, status: 'loading', logoutError: '', refresh: async () => {}, acceptSession: () => {}, logout: async () => false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [logoutError, setLogoutError] = useState('');
  const refresh = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await fetch('/api/v1/auth/session', { credentials: 'include' });
      if (!response.ok) { setCsrfToken(undefined); setUser(null); setStatus('unauthenticated'); return; }
      const result = await response.json();
      if (!result.user || typeof result.csrf_token !== 'string') throw new Error('Invalid session response');
      setCsrfToken(result.csrf_token); setUser(result.user); setStatus('authenticated');
    } catch {
      setCsrfToken(undefined); setUser(null); setStatus('unauthenticated');
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    const clearInvalidSession = () => { setCsrfToken(undefined); setUser(null); setStatus('unauthenticated'); };
    window.addEventListener('socialgraph:unauthorized', clearInvalidSession);
    return () => window.removeEventListener('socialgraph:unauthorized', clearInvalidSession);
  }, []);
  const acceptSession = useCallback((nextUser: AuthUser, csrf: string) => {
    // Replacing user state also invalidates any component-local account-specific views by remounting the tree key.
    setLogoutError(''); setCsrfToken(csrf); setUser(nextUser); setStatus('authenticated');
  }, []);
  const logout = useCallback(async () => {
    setLogoutError('');
    try {
      const current = await fetch('/api/v1/auth/session', { credentials: 'include' });
      if (current.status === 401) {
        setCsrfToken(undefined); setUser(null); setStatus('unauthenticated'); return true;
      }
      if (!current.ok) throw new Error('Could not verify the current session.');
      const csrf = (await current.json()).csrf_token;
      if (typeof csrf !== 'string' || !csrf) throw new Error('The server returned an invalid CSRF token.');
      const response = await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: '{}' });
      if (!response.ok) throw new Error('The server did not confirm sign out.');
      setCsrfToken(undefined); setUser(null); setStatus('unauthenticated');
      return true;
    } catch {
      setLogoutError('The server could not confirm sign out. Check your connection and try again.');
      return false;
    }
  }, []);
  const value = useMemo(() => ({ user, status, logoutError, refresh, acceptSession, logout }), [user, status, logoutError, refresh, acceptSession, logout]);
  return <AuthContext.Provider value={value}><React.Fragment key={user?.id ?? 'anonymous'}>{children}</React.Fragment></AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
