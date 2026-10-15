import { useState, useEffect, useCallback, useRef } from 'react';
import type { PostCard, FeedSort } from '@socialgraph/shared';
import type { ISocialGraphApi } from '../api/types';
import { api as defaultApi } from '../api';

export type FeedScope = 'all' | 'following' | 'communities';

export interface UseFeedOptions {
  initialScope?: FeedScope;
  initialSort?: FeedSort;
  pageSize?: number;
  apiInstance?: ISocialGraphApi;
}

export interface UseFeedReturn {
  posts: PostCard[];
  scope: FeedScope;
  sort: FeedSort;
  loading: boolean;
  loadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  nextCursor: string | null;
  setScope: (newScope: FeedScope) => void;
  setSort: (newSort: FeedSort) => void;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  vote: (postId: string, direction: 1 | -1 | 0) => Promise<void>;
  toggleSave: (postId: string) => Promise<void>;
}

export function useFeed(options: UseFeedOptions = {}): UseFeedReturn {
  const {
    initialScope = 'all',
    initialSort = 'hot',
    pageSize = 10,
    apiInstance = defaultApi,
  } = options;

  const [scope, setScopeState] = useState<FeedScope>(initialScope);
  const [sort, setSortState] = useState<FeedSort>(initialSort);
  const [posts, setPosts] = useState<PostCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Guards against concurrent / stale fetches
  const fetchTokenRef = useRef(0);
  const loadingMoreRef = useRef(false);

  const fetchInitialPage = useCallback(
    async (targetScope: FeedScope, targetSort: FeedSort) => {
      const currentToken = ++fetchTokenRef.current;
      setLoading(true);
      setError(null);

      try {
        const response = await apiInstance.getFeed({
          scope: targetScope,
          sort: targetSort,
          limit: pageSize,
        });

        // Ignore stale requests
        if (currentToken !== fetchTokenRef.current) return;

        setPosts(response.data);
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

  // Re-fetch whenever scope or sort changes
  useEffect(() => {
    fetchInitialPage(scope, sort);
  }, [scope, sort, fetchInitialPage]);

  const setScope = useCallback((newScope: FeedScope) => {
    setScopeState((prev) => {
      if (prev === newScope) return prev;
      return newScope;
    });
  }, []);

  const setSort = useCallback((newSort: FeedSort) => {
    setSortState((prev) => {
      if (prev === newSort) return prev;
      return newSort;
    });
  }, []);

  const refresh = useCallback(async () => {
    await fetchInitialPage(scope, sort);
  }, [fetchInitialPage, scope, sort]);

  const loadMore = useCallback(async () => {
    // Guards against duplicate / concurrent requests and end of feed
    if (loading || loadingMoreRef.current || !hasMore || !nextCursor) {
      return;
    }

    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const response = await apiInstance.getFeed({
        scope,
        sort,
        limit: pageSize,
        cursor: nextCursor,
      });

      // Deduplicate posts by ID before appending
      setPosts((prev) => {
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
  }, [loading, hasMore, nextCursor, apiInstance, scope, sort, pageSize]);

  const vote = useCallback(
    async (postId: string, direction: 1 | -1 | 0) => {
      let originalPost: PostCard | undefined;

      // Optimistic update
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          originalPost = { ...p };

          let scoreDelta = 0;
          if (p.user_vote === 1) scoreDelta -= 1;
          if (p.user_vote === -1) scoreDelta += 1;
          if (direction === 1) scoreDelta += 1;
          if (direction === -1) scoreDelta -= 1;

          return {
            ...p,
            score: p.score + scoreDelta,
            user_vote: direction,
          };
        })
      );

      try {
        const result = await apiInstance.votePost(postId, direction);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, score: result.new_score, user_vote: result.user_vote }
              : p
          )
        );
      } catch (err) {
        // Rollback on failure
        if (originalPost) {
          const rollbackSnapshot = originalPost;
          setPosts((prev) =>
            prev.map((p) => (p.id === postId ? rollbackSnapshot : p))
          );
        }
        throw err;
      }
    },
    [apiInstance]
  );

  const toggleSave = useCallback(
    async (postId: string) => {
      let originalSaved = false;

      // Optimistic toggle
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          originalSaved = p.is_saved;
          return {
            ...p,
            is_saved: !originalSaved,
          };
        })
      );

      try {
        const result = await apiInstance.toggleSavePost(postId);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, is_saved: result.is_saved } : p
          )
        );
      } catch (err) {
        // Rollback on failure
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, is_saved: originalSaved } : p
          )
        );
        throw err;
      }
    },
    [apiInstance]
  );

  return {
    posts,
    scope,
    sort,
    loading,
    loadingMore,
    error,
    hasMore,
    nextCursor,
    setScope,
    setSort,
    refresh,
    loadMore,
    vote,
    toggleSave,
  };
}
