import { useEffect } from 'react';
import { useRouter } from '../router/Router';
import { useAuth } from '../auth/AuthContext';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { navigate } = useRouter(); const { status } = useAuth();
  useEffect(() => { if (status === 'unauthenticated') navigate('/login', { replace: true }); }, [status, navigate]);
  if (status === 'unauthenticated') return <div role="status" className="p-8 text-center">Redirecting to sign in…</div>;
  if (status === 'loading') return <div role="status" className="p-8 text-center">Restoring your session…</div>;
  if (status !== 'authenticated') return null;
  return <>{children}</>;
}
