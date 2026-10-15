import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

export interface RouteMatch {
  matched: boolean;
  params: Record<string, string>;
}

export interface RouterContextValue {
  currentPath: string;
  search: string;
  params: Record<string, string>;
  query: Record<string, string>;
  navigate: (to: string, options?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

export function matchPath(pattern: string, path: string): RouteMatch {
  const [cleanPath] = path.split('?');
  const patternSegments = pattern.split('/').filter(Boolean);
  const pathSegments = cleanPath.split('/').filter(Boolean);

  if (patternSegments.length !== pathSegments.length) {
    return { matched: false, params: {} };
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternSegments.length; i++) {
    const patternSeg = patternSegments[i];
    const pathSeg = pathSegments[i];

    if (patternSeg.startsWith(':')) {
      const paramName = patternSeg.slice(1);
      params[paramName] = decodeURIComponent(pathSeg);
    } else if (patternSeg.toLowerCase() !== pathSeg.toLowerCase()) {
      return { matched: false, params: {} };
    }
  }

  return { matched: true, params };
}

export function parseQuery(queryString: string): Record<string, string> {
  const query: Record<string, string> = {};
  const cleaned = queryString.startsWith('?') ? queryString.slice(1) : queryString;
  if (!cleaned) return query;

  const pairs = cleaned.split('&');
  for (const pair of pairs) {
    const [key, val] = pair.split('=');
    if (key) {
      query[decodeURIComponent(key)] = val ? decodeURIComponent(val.replace(/\+/g, ' ')) : '';
    }
  }
  return query;
}

export interface RouterProviderProps {
  initialPath?: string;
  children: React.ReactNode;
}

export function RouterProvider({ initialPath, children }: RouterProviderProps) {
  const [locationState, setLocationState] = useState(() => {
    if (initialPath) {
      const [path, search] = initialPath.split('?');
      return { path: path || '/', search: search ? `?${search}` : '' };
    }
    if (typeof window !== 'undefined') {
      return {
        path: window.location.pathname || '/',
        search: window.location.search || '',
      };
    }
    return { path: '/', search: '' };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      setLocationState({
        path: window.location.pathname || '/',
        search: window.location.search || '',
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    const [pathPart, searchPart] = to.split('?');
    const path = pathPart || '/';
    const search = searchPart ? `?${searchPart}` : '';

    if (typeof window !== 'undefined') {
      if (options?.replace) {
        window.history.replaceState({}, '', to);
      } else {
        window.history.pushState({}, '', to);
      }
    }

    setLocationState({ path, search });
  }, []);

  const query = useMemo(() => parseQuery(locationState.search), [locationState.search]);

  const value = useMemo<RouterContextValue>(
    () => ({
      currentPath: locationState.path,
      search: locationState.search,
      params: {},
      query,
      navigate,
    }),
    [locationState.path, locationState.search, query, navigate]
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterContextValue {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return ctx;
}

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  replace?: boolean;
  className?: string;
  activeClassName?: string;
  exact?: boolean;
}

export function Link({
  to,
  replace,
  className = '',
  activeClassName = '',
  exact = false,
  children,
  onClick,
  ...rest
}: LinkProps) {
  const { currentPath, navigate } = useRouter();
  const [targetPath] = to.split('?');

  const isActive = exact
    ? currentPath === targetPath
    : targetPath === '/'
    ? currentPath === '/'
    : currentPath.startsWith(targetPath);

  const combinedClass = `${className} ${isActive ? activeClassName : ''}`.trim();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      e.preventDefault();
      navigate(to, { replace });
    }
  };

  return (
    <a
      href={to}
      onClick={handleClick}
      className={combinedClass}
      aria-current={isActive ? 'page' : undefined}
      {...rest}
    >
      {children}
    </a>
  );
}

export interface RouteProps {
  path: string;
  element: React.ReactNode;
}

export function Route({ path, element }: RouteProps) {
  const { currentPath, query, search, navigate } = useRouter();
  const match = matchPath(path, currentPath);

  if (!match.matched) return null;

  const scopedValue: RouterContextValue = {
    currentPath,
    search,
    params: match.params,
    query,
    navigate,
  };

  return <RouterContext.Provider value={scopedValue}>{element}</RouterContext.Provider>;
}

export interface RoutesProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Routes({ children, fallback = null }: RoutesProps) {
  const { currentPath } = useRouter();

  let matchedElement: React.ReactNode = null;

  React.Children.forEach(children, (child) => {
    if (matchedElement) return;
    if (React.isValidElement<RouteProps>(child) && child.props.path) {
      const match = matchPath(child.props.path, currentPath);
      if (match.matched) {
        matchedElement = child;
      }
    }
  });

  return matchedElement || fallback;
}
