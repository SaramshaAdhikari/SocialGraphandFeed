import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export interface PostModalContextValue {
  activeModalPostId: string | null;
  openPostModal: (postId: string) => void;
  closePostModal: () => void;
}

const PostModalContext = createContext<PostModalContextValue | null>(null);

export function PostModalProvider({ children }: { children: React.ReactNode }) {
  const [activeModalPostId, setActiveModalPostId] = useState<string | null>(null);
  const previousUrlRef = useRef<string | null>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  const openPostModal = useCallback((postId: string) => {
    if (typeof window !== 'undefined') {
      lastActiveElementRef.current = document.activeElement as HTMLElement | null;
      previousUrlRef.current = window.location.pathname + window.location.search;
      
      // Push history entry for back/forward navigation support
      window.history.pushState(
        { modalPostId: postId, fromUrl: previousUrlRef.current },
        '',
        `/post/${postId}`
      );
    }
    setActiveModalPostId(postId);
  }, []);

  const closePostModal = useCallback(() => {
    setActiveModalPostId((prev) => {
      if (!prev) return null;
      if (typeof window !== 'undefined') {
        // If history state has our modal, navigate back; otherwise replace with previousUrl
        if (window.history.state?.modalPostId) {
          window.history.back();
        } else if (previousUrlRef.current) {
          window.history.replaceState({}, '', previousUrlRef.current);
        }
      }
      return null;
    });

    // Restore focus
    setTimeout(() => {
      lastActiveElementRef.current?.focus();
    }, 50);
  }, []);

  // Listen for browser popstate (back/forward navigation)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.modalPostId) {
        setActiveModalPostId(e.state.modalPostId);
      } else {
        setActiveModalPostId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Lock background scroll when modal is active
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (activeModalPostId) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [activeModalPostId]);

  return (
    <PostModalContext.Provider value={{ activeModalPostId, openPostModal, closePostModal }}>
      {children}
    </PostModalContext.Provider>
  );
}

export function usePostModal(): PostModalContextValue {
  const ctx = useContext(PostModalContext);
  if (!ctx) {
    // Graceful fallback if rendered outside provider (e.g. in standalone unit tests)
    return {
      activeModalPostId: null,
      openPostModal: () => {},
      closePostModal: () => {},
    };
  }
  return ctx;
}
