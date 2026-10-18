import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { PostCard, DiscussionPostCard, VisualPinCard } from '@socialgraph/shared';
import type { ISocialGraphApi, SavedPostTypeFilter, SavedPostSort } from '../api/types';
import { api as defaultApi } from '../api';

export interface UseSavedPostsOptions {
  apiInstance?: ISocialGraphApi;
  initialType?: SavedPostTypeFilter;
  initialSort?: SavedPostSort;
}

export interface SavedCommunityTopic {
  slug: string;
  name: string;
  count: number;
}

export interface UseSavedPostsReturn {
  posts: PostCard[];
  discussions: DiscussionPostCard[];
  visualPins: VisualPinCard[];
  loading: boolean;
  error: Error | null;
  typeFilter: SavedPostTypeFilter;
  setTypeFilter: (type: SavedPostTypeFilter) => void;
  communityFilter: string;
  setCommunityFilter: (community: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sort: SavedPostSort;
  setSort: (sort: SavedPostSort) => void;
  totalCount: number;
  counts: {
    all: number;
    discussions: number;
    visual: number;
  };
  availableCommunities: SavedCommunityTopic[];
  vote: (postId: string, direction: 1 | -1 | 0) => Promise<void>;
  toggleSave: (postId: string) => Promise<void>;
  undoLastUnsave: () => Promise<void>;
  lastUnsavedPost: PostCard | null;
  toastMessage: string | null;
  canUndo: boolean;
  dismissToast: () => void;
  refresh: () => Promise<void>;
}

export function useSavedPosts(options: UseSavedPostsOptions = {}): UseSavedPostsReturn {
  const {
    apiInstance = defaultApi,
    initialType = 'all',
    initialSort = 'new',
  } = options;

  const [allSavedItems, setAllSavedItems] = useState<PostCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [typeFilter, setTypeFilter] = useState<SavedPostTypeFilter>(initialType);
  const [communityFilter, setCommunityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sort, setSort] = useState<SavedPostSort>(initialSort);

  const [lastUnsavedPost, setLastUnsavedPost] = useState<PostCard | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTokenRef = useRef(0);

  const loadSavedPosts = useCallback(async () => {
    const token = ++fetchTokenRef.current;
    setLoading(true);
    setError(null);

    try {
      // Query raw saved posts from API
      const response = await apiInstance.getSavedPosts({
        limit: 100,
        sort: 'new',
      });

      if (token !== fetchTokenRef.current) return;

      setAllSavedItems(response.data || []);
    } catch (err: any) {
      if (token !== fetchTokenRef.current) return;
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (token === fetchTokenRef.current) {
        setLoading(false);
      }
    }
  }, [apiInstance]);

  useEffect(() => {
    loadSavedPosts();
  }, [loadSavedPosts]);

  // Total library counts across all bookmarked items
  const counts = useMemo(() => {
    const discussions = allSavedItems.filter((p) => p.post_type === 'discussion').length;
    const visual = allSavedItems.filter((p) => p.post_type === 'visual').length;
    return {
      all: allSavedItems.length,
      discussions,
      visual,
    };
  }, [allSavedItems]);

  // Extract community/topics grounded in real metadata of saved posts
  const availableCommunities = useMemo((): SavedCommunityTopic[] => {
    const map = new Map<string, number>();
    for (const post of allSavedItems) {
      if (post.community_slug) {
        const slug = post.community_slug.toLowerCase();
        map.set(slug, (map.get(slug) || 0) + 1);
      }
    }

    const topics: SavedCommunityTopic[] = [
      { slug: 'all', name: 'All Communities', count: allSavedItems.length },
    ];

    for (const [slug, count] of map.entries()) {
      let displayName = `c/${slug}`;
      if (slug === 'systems') displayName = 'Distributed Systems';
      else if (slug === 'hardware') displayName = 'Datacenter & Hardware';
      else if (slug === 'algorithms') displayName = 'Algorithms';
      else if (slug === 'visuals') displayName = 'Visual Design';

      topics.push({
        slug,
        name: displayName,
        count,
      });
    }

    return topics;
  }, [allSavedItems]);

  // Client-side filtering & sorting for instant responsiveness
  const filteredAndSortedPosts = useMemo(() => {
    let items = [...allSavedItems];

    // 1. Type Filter
    if (typeFilter === 'discussions') {
      items = items.filter((p) => p.post_type === 'discussion');
    } else if (typeFilter === 'visual') {
      items = items.filter((p) => p.post_type === 'visual');
    }

    // 2. Community Filter
    if (communityFilter !== 'all') {
      items = items.filter((p) => p.community_slug?.toLowerCase() === communityFilter.toLowerCase());
    }

    // 3. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter((p) => {
        const titleMatch = p.title?.toLowerCase().includes(q) ?? false;
        const contentMatch =
          p.post_type === 'discussion'
            ? p.content?.toLowerCase().includes(q) ?? false
            : p.caption?.toLowerCase().includes(q) ?? false;
        const tagMatch = p.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
        const authorMatch =
          p.author.username.toLowerCase().includes(q) ||
          p.author.display_name.toLowerCase().includes(q);
        const communityMatch = p.community_slug?.toLowerCase().includes(q) ?? false;
        return titleMatch || contentMatch || tagMatch || authorMatch || communityMatch;
      });
    }

    // 4. Sorting
    if (sort === 'new') {
      items.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sort === 'top') {
      items.sort((a, b) => b.score - a.score);
    } else if (sort === 'comments') {
      items.sort((a, b) => b.comments_count - a.comments_count);
    }

    return items;
  }, [allSavedItems, typeFilter, communityFilter, searchQuery, sort]);

  const discussions = useMemo(
    () => filteredAndSortedPosts.filter((p): p is DiscussionPostCard => p.post_type === 'discussion'),
    [filteredAndSortedPosts]
  );

  const visualPins = useMemo(
    () => filteredAndSortedPosts.filter((p): p is VisualPinCard => p.post_type === 'visual'),
    [filteredAndSortedPosts]
  );

  const showToast = useCallback((msg: string, autoDismissMs = 5000) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    if (autoDismissMs > 0) {
      toastTimeoutRef.current = setTimeout(() => {
        setToastMessage(null);
      }, autoDismissMs);
    }
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(null);
  }, []);

  const vote = useCallback(
    async (postId: string, direction: 1 | -1 | 0) => {
      let originalPost: PostCard | undefined;

      setAllSavedItems((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          originalPost = { ...p };

          let delta = 0;
          if (p.user_vote === 1) delta -= 1;
          if (p.user_vote === -1) delta += 1;
          if (direction === 1) delta += 1;
          if (direction === -1) delta += 1;

          return {
            ...p,
            score: p.score + delta,
            user_vote: direction,
          };
        })
      );

      try {
        const res = await apiInstance.votePost(postId, direction);
        setAllSavedItems((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, score: res.new_score, user_vote: res.user_vote }
              : p
          )
        );
      } catch (err) {
        if (originalPost) {
          const rollback = originalPost;
          setAllSavedItems((prev) =>
            prev.map((p) => (p.id === postId ? rollback : p))
          );
        }
        throw err;
      }
    },
    [apiInstance]
  );

  // Un-save mutation with optimistic removal and Undo capability
  const toggleSave = useCallback(
    async (postId: string) => {
      const target = allSavedItems.find((p) => p.id === postId);
      if (!target) return;

      const originalItems = [...allSavedItems];

      // Optimistic removal
      setAllSavedItems((prev) => prev.filter((p) => p.id !== postId));
      setLastUnsavedPost(target);
      showToast(`Removed "${target.title?.slice(0, 36) || 'post'}" from saved collection.`);

      try {
        const res = await apiInstance.toggleSavePost(postId);
        if (res.is_saved) {
          // If the backend toggle unexpectedly resulted in saved=true, re-insert
          setAllSavedItems((prev) => [target, ...prev]);
        }
      } catch (err) {
        // Rollback on failure
        setAllSavedItems(originalItems);
        setLastUnsavedPost(null);
        showToast('Failed to remove bookmark. Action rolled back.', 4000);
        throw err;
      }
    },
    [allSavedItems, apiInstance, showToast]
  );

  // Genuine Undo action that re-saves the post via toggleSavePost
  const undoLastUnsave = useCallback(async () => {
    if (!lastUnsavedPost) return;

    const postToRestore = { ...lastUnsavedPost, is_saved: true };
    const originalItems = [...allSavedItems];

    // Optimistically re-insert
    setAllSavedItems((prev) => [postToRestore, ...prev]);
    setLastUnsavedPost(null);
    showToast(`Restored "${postToRestore.title?.slice(0, 36) || 'post'}" to saved collection.`, 3000);

    try {
      const res = await apiInstance.toggleSavePost(postToRestore.id);
      if (!res.is_saved) {
        // If toggleSavePost toggled it back to unsaved, re-apply toggle
        await apiInstance.toggleSavePost(postToRestore.id);
      }
    } catch (err) {
      // Rollback
      setAllSavedItems(originalItems);
      showToast('Failed to restore bookmark. Action rolled back.', 4000);
      throw err;
    }
  }, [lastUnsavedPost, allSavedItems, apiInstance, showToast]);

  return {
    posts: filteredAndSortedPosts,
    discussions,
    visualPins,
    loading,
    error,
    typeFilter,
    setTypeFilter,
    communityFilter,
    setCommunityFilter,
    searchQuery,
    setSearchQuery,
    sort,
    setSort,
    totalCount: allSavedItems.length,
    counts,
    availableCommunities,
    vote,
    toggleSave,
    undoLastUnsave,
    lastUnsavedPost,
    toastMessage,
    canUndo: Boolean(lastUnsavedPost),
    dismissToast,
    refresh: loadSavedPosts,
  };
}
