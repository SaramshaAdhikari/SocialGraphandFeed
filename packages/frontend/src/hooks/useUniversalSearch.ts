import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ISocialGraphApi, SearchCategory, SearchSort, UniversalSearchResults } from '../api/types';
import { api as defaultApi } from '../api';
import { useRouter } from '../router/Router';

export interface UseUniversalSearchOptions {
  apiInstance?: ISocialGraphApi;
}

export interface UseUniversalSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  category: SearchCategory;
  setCategory: (cat: SearchCategory) => void;
  sort: SearchSort;
  setSort: (s: SearchSort) => void;
  results: UniversalSearchResults | null;
  loading: boolean;
  error: Error | null;
  hasSearched: boolean;
  counts: {
    all: number;
    discussions: number;
    visual: number;
    communities: number;
    people: number;
  };
  submitSearch: (queryOverride?: string) => void;
  clearSearch: () => void;
  votePost: (postId: string, direction: 1 | -1 | 0) => Promise<void>;
  toggleSavePost: (postId: string) => Promise<void>;
  setCommunityMembership: (communitySlug: string, isMember: boolean) => Promise<void>;
  retry: () => void;
}

const VALID_CATEGORIES: SearchCategory[] = ['all', 'discussions', 'visual', 'communities', 'people'];
const VALID_SORTS: SearchSort[] = ['relevance', 'top', 'new'];

export function useUniversalSearch(
  options: UseUniversalSearchOptions = {}
): UseUniversalSearchReturn {
  const { apiInstance = defaultApi } = options;
  const { query: routerQuery, navigate } = useRouter();

  // URL state
  const urlQuery = routerQuery.q || '';
  const urlCategory: SearchCategory = VALID_CATEGORIES.includes(routerQuery.category as SearchCategory)
    ? (routerQuery.category as SearchCategory)
    : 'all';
  const urlSort: SearchSort = VALID_SORTS.includes(routerQuery.sort as SearchSort)
    ? (routerQuery.sort as SearchSort)
    : 'relevance';

  const [inputQuery, setInputQuery] = useState(urlQuery);
  const [results, setResults] = useState<UniversalSearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Sync input query with router query if URL changes externally
  useEffect(() => {
    setInputQuery(urlQuery);
  }, [urlQuery]);

  const searchTokenRef = useRef(0);

  const executeSearch = useCallback(
    async (q: string, cat: SearchCategory, s: SearchSort) => {
      const cleanQ = q.trim();
      if (!cleanQ) {
        setResults(null);
        setLoading(false);
        setError(null);
        return;
      }

      const token = ++searchTokenRef.current;
      setLoading(true);
      setError(null);

      try {
        const searchResults = await apiInstance.search({
          q: cleanQ,
          category: cat,
          sort: s,
        });

        if (token === searchTokenRef.current) {
          setResults(searchResults);
        }
      } catch (err: any) {
        if (token === searchTokenRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setResults(null);
        }
      } finally {
        if (token === searchTokenRef.current) {
          setLoading(false);
        }
      }
    },
    [apiInstance]
  );

  // Trigger search whenever URL params change
  useEffect(() => {
    executeSearch(urlQuery, urlCategory, urlSort);
  }, [urlQuery, urlCategory, urlSort, executeSearch]);

  const updateUrl = useCallback(
    (newQ: string, newCat: SearchCategory, newSort: SearchSort) => {
      const params = new URLSearchParams();
      if (newQ.trim()) params.set('q', newQ.trim());
      if (newCat !== 'all') params.set('category', newCat);
      if (newSort !== 'relevance') params.set('sort', newSort);

      const qs = params.toString() ? `?${params.toString()}` : '';
      navigate(`/search${qs}`);
    },
    [navigate]
  );

  const setCategory = useCallback(
    (newCat: SearchCategory) => {
      updateUrl(urlQuery, newCat, urlSort);
    },
    [urlQuery, urlSort, updateUrl]
  );

  const setSort = useCallback(
    (newSort: SearchSort) => {
      updateUrl(urlQuery, urlCategory, newSort);
    },
    [urlQuery, urlCategory, updateUrl]
  );

  const submitSearch = useCallback(
    (queryOverride?: string) => {
      const targetQuery = queryOverride !== undefined ? queryOverride : inputQuery;
      updateUrl(targetQuery, urlCategory, urlSort);
    },
    [inputQuery, urlCategory, urlSort, updateUrl]
  );

  const clearSearch = useCallback(() => {
    setInputQuery('');
    updateUrl('', 'all', 'relevance');
  }, [updateUrl]);

  const retry = useCallback(() => {
    executeSearch(urlQuery, urlCategory, urlSort);
  }, [urlQuery, urlCategory, urlSort, executeSearch]);

  // Optimistic vote update for discussions and visual pins in search results
  const votePost = useCallback(
    async (postId: string, direction: 1 | -1 | 0) => {
      if (!results) return;

      const prevResults = results;
      setResults((prev) => {
        if (!prev) return prev;
        const updatePost = (p: any) => {
          if (p.id !== postId) return p;
          const currentVote = p.user_vote || 0;
          const voteDiff = direction - currentVote;
          return {
            ...p,
            score: p.score + voteDiff,
            user_vote: direction,
          };
        };

        return {
          ...prev,
          discussions: prev.discussions.map(updatePost),
          visuals: prev.visuals.map(updatePost),
        };
      });

      try {
        await apiInstance.votePost(postId, direction);
      } catch {
        // Rollback
        setResults(prevResults);
      }
    },
    [results, apiInstance]
  );

  // Optimistic bookmark / save update for posts in search results
  const toggleSavePost = useCallback(
    async (postId: string) => {
      if (!results) return;

      const prevResults = results;
      setResults((prev) => {
        if (!prev) return prev;
        const updateSave = (p: any) => {
          if (p.id !== postId) return p;
          return {
            ...p,
            is_saved: !p.is_saved,
          };
        };

        return {
          ...prev,
          discussions: prev.discussions.map(updateSave),
          visuals: prev.visuals.map(updateSave),
        };
      });

      try {
        await apiInstance.toggleSavePost(postId);
      } catch {
        // Rollback
        setResults(prevResults);
      }
    },
    [results, apiInstance]
  );

  const setCommunityMembership = useCallback(async (communitySlug: string, isMember: boolean) => {
    const membership = await apiInstance.setCommunityMembership(communitySlug, isMember);
    setResults((current) => {
      if (!current) return current;
      return {
        ...current,
        communities: current.communities.map((community) => community.id === membership.community_id
          ? {
              ...community,
              is_member: membership.is_member,
              members_count: membership.members_count,
            }
          : community),
      };
    });
  }, [apiInstance]);

  const counts = useMemo(() => {
    if (!results) {
      return { all: 0, discussions: 0, visual: 0, communities: 0, people: 0 };
    }
    return {
      all: results.total_count,
      discussions: results.discussions.length,
      visual: results.visuals.length,
      communities: results.communities.length,
      people: results.users.length,
    };
  }, [results]);

  return {
    query: inputQuery,
    setQuery: setInputQuery,
    category: urlCategory,
    setCategory,
    sort: urlSort,
    setSort,
    results,
    loading,
    error,
    hasSearched: Boolean(urlQuery.trim()),
    counts,
    submitSearch,
    clearSearch,
    votePost,
    toggleSavePost,
    setCommunityMembership,
    retry,
  };
}
