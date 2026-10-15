import { useState, useEffect, useCallback, useRef } from 'react';
import type { VisualPinCard } from '@socialgraph/shared';
import type { ISocialGraphApi } from '../api/types';
import { api as defaultApi } from '../api';

export interface UseDiscoveryOptions {
  initialCategory?: string;
  pageSize?: number;
  apiInstance?: ISocialGraphApi;
}

export interface UseDiscoveryReturn {
  pins: VisualPinCard[];
  category: string;
  loading: boolean;
  loadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  nextCursor: string | null;
  setCategory: (category: string) => void;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  vote: (pinId: string, direction: 1 | -1 | 0) => Promise<void>;
  toggleSave: (pinId: string) => Promise<void>;
}

export function useDiscovery(options: UseDiscoveryOptions = {}): UseDiscoveryReturn {
  const {
    initialCategory = 'all',
    pageSize = 12,
    apiInstance = defaultApi,
  } = options;

  const [category, setCategoryState] = useState<string>(initialCategory);
  const [pins, setPins] = useState<VisualPinCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchTokenRef = useRef(0);
  const loadingMoreRef = useRef(false);

  const fetchInitialPage = useCallback(
    async (targetCategory: string) => {
      const currentToken = ++fetchTokenRef.current;
      setLoading(true);
      setError(null);

      try {
        const response = await apiInstance.getDiscovery({
          category: targetCategory === 'all' ? undefined : targetCategory,
          limit: pageSize,
        });

        if (currentToken !== fetchTokenRef.current) return;

        setPins(response.data);
        setNextCursor(response.next_cursor);
        setHasMore(response.has_more);
      } catch (err) {
        if (currentToken !== fetchTokenRef.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (currentToken === fetchTokenRef.current) {
          setLoading(false);
        }
      }
    },
    [apiInstance, pageSize]
  );

  useEffect(() => {
    fetchInitialPage(category);
  }, [category, fetchInitialPage]);

  const setCategory = useCallback((newCategory: string) => {
    setCategoryState((prev) => (prev === newCategory ? prev : newCategory));
  }, []);

  const refresh = useCallback(async () => {
    await fetchInitialPage(category);
  }, [category, fetchInitialPage]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMoreRef.current || !hasMore || !nextCursor) {
      return;
    }

    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const response = await apiInstance.getDiscovery({
        category: category === 'all' ? undefined : category,
        limit: pageSize,
        cursor: nextCursor,
      });

      setPins((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const uniqueIncoming = response.data.filter((p) => !existingIds.has(p.id));
        return [...prev, ...uniqueIncoming];
      });

      setNextCursor(response.next_cursor);
      setHasMore(response.has_more);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [loading, hasMore, nextCursor, apiInstance, category, pageSize]);

  const vote = useCallback(
    async (pinId: string, direction: 1 | -1 | 0) => {
      let originalPin: VisualPinCard | undefined;

      setPins((prev) =>
        prev.map((p) => {
          if (p.id !== pinId) return p;
          originalPin = { ...p };

          let delta = 0;
          if (p.user_vote === 1) delta -= 1;
          if (p.user_vote === -1) delta += 1;
          if (direction === 1) delta += 1;
          if (direction === -1) delta -= 1;

          return {
            ...p,
            score: p.score + delta,
            user_vote: direction,
          };
        })
      );

      try {
        const result = await apiInstance.votePost(pinId, direction);
        setPins((prev) =>
          prev.map((p) =>
            p.id === pinId
              ? { ...p, score: result.new_score, user_vote: result.user_vote }
              : p
          )
        );
      } catch (err) {
        if (originalPin) {
          const rollbackSnapshot = originalPin;
          setPins((prev) =>
            prev.map((p) => (p.id === pinId ? rollbackSnapshot : p))
          );
        }
        throw err;
      }
    },
    [apiInstance]
  );

  const toggleSave = useCallback(
    async (pinId: string) => {
      let originalSaved = false;

      setPins((prev) =>
        prev.map((p) => {
          if (p.id !== pinId) return p;
          originalSaved = p.is_saved;
          return { ...p, is_saved: !originalSaved };
        })
      );

      try {
        const result = await apiInstance.toggleSavePost(pinId);
        setPins((prev) =>
          prev.map((p) =>
            p.id === pinId ? { ...p, is_saved: result.is_saved } : p
          )
        );
      } catch (err) {
        setPins((prev) =>
          prev.map((p) =>
            p.id === pinId ? { ...p, is_saved: originalSaved } : p
          )
        );
        throw err;
      }
    },
    [apiInstance]
  );

  return {
    pins,
    category,
    loading,
    loadingMore,
    error,
    hasMore,
    nextCursor,
    setCategory,
    refresh,
    loadMore,
    vote,
    toggleSave,
  };
}
