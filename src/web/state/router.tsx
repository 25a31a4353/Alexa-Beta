import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type RoutePath =
  | '/'
  | '/home'
  | '/new'
  | '/missions'
  | '/knowledge'
  | '/tools'
  | '/integrations'
  | '/activity'
  | '/settings'
  | string;

interface RouterContextType {
  path: string;
  navigate: (newPath: string) => void;
  params: Record<string, string>;
}

const RouterContext = createContext<RouterContextType>({
  path: '/home',
  navigate: () => {},
  params: {},
});

export const useRouter = () => useContext(RouterContext);

function getPathFromUrl(): string {
  const hash = window.location.hash.replace(/^#/, '');
  if (hash) return hash.startsWith('/') ? hash : `/${hash}`;
  const path = window.location.pathname;
  return path || '/home';
}

export const RouterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [path, setPath] = useState<string>(() => {
    const initial = getPathFromUrl();
    return initial === '/' ? '/home' : initial;
  });

  useEffect(() => {
    const handlePopState = () => {
      const p = getPathFromUrl();
      setPath(p === '/' ? '/home' : p);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const navigate = (newPath: string) => {
    const normalized = newPath === '/' ? '/home' : newPath;
    window.location.hash = normalized;
    setPath(normalized);
    window.scrollTo(0, 0);
  };

  // Extract parameters for dynamic paths like /missions/:id or /conversations/:id
  const params: Record<string, string> = {};
  if (path.startsWith('/missions/')) {
    params.id = path.replace('/missions/', '');
  } else if (path.startsWith('/conversations/')) {
    params.id = path.replace('/conversations/', '');
  } else if (path.startsWith('/knowledge/')) {
    params.id = path.replace('/knowledge/', '');
  }

  return (
    <RouterContext.Provider value={{ path, navigate, params }}>
      {children}
    </RouterContext.Provider>
  );
};
