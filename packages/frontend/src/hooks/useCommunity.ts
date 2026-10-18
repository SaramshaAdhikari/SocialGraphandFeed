import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Community, PostCard, FeedSort } from '@socialgraph/shared';
import type { ISocialGraphApi } from '../api/types';
import { api as defaultApi } from '../api';
import { ApiClientError } from '../api/client';

export type CommunityTab = 'all' | 'discussions' | 'visual';

export interface UseCommunityOptions {
  apiInstance?: ISocialGraphApi;
}

export interface UseCommunityReturn {
  community: Community | null;
  posts: PostCard[];
  filteredPosts: PostCard[];
  activeTab: CommunityTab;
  setActiveTab: (tab: CommunityTab) => void;
  sort: FeedSort;
  setSort: (sort: FeedSort) => void;
  loading: boolean;
  postsLoading: boolean;
  error: Error | null;
  isNotFound: boolean;
  membershipPending: boolean;
  membershipError: Error | null;
  toggleMembership: () => Promise<void>;
  vote: (postId: string, direction: 1 | -1 | 0) => Promise<void>;
  toggleSave: (postId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useCommunity(
  communitySlug: string,
  options: UseCommunityOptions = {}
): UseCommunityReturn {
  const { apiInstance = defaultApi } = options;

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<PostCard[]>([]);
  const [activeTab, setActiveTab] = useState<CommunityTab>('all');
  const [sort, setSort] = useState<FeedSort>('hot');
  const [loading, setLoading] = useState<boolean>(true);
  const [postsLoading, setPostsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  const [membershipPending, setMembershipPending] = useState(false);
  const [membershipError, setMembershipError] = useState<Error | null>(null);

  const fetchTokenRef = useRef(0);

  // 1. Load Community Metadata
  const loadCommunityAndFeed = useCallback(async () => {
    if (!communitySlug) {
      setIsNotFound(true);
      setLoading(false);
      return;
    }

    const token = ++fetchTokenRef.current;
    setLoading(true);
    setPostsLoading(true);
    setError(null);
    setIsNotFound(false);

    try {
      // Fetch community metadata
      const fetchedCommunity = await apiInstance.getCommunity(communitySlug);
      if (token !== fetchTokenRef.current) return;

      setCommunity(fetchedCommunity);
      setLoading(false);

      // Fetch scoped feed with selected sort
      try {
        const feedResponse = await apiInstance.getCommunityFeed(fetchedCommunity.slug, {
          sort,
          limit: 30,
        });
        if (token === fetchTokenRef.current) {
          setPosts(feedResponse.data);
        }
      } catch {
        if (token === fetchTokenRef.current) {
          setPosts([]);
        }
      } finally {
        if (token === fetchTokenRef.current) {
          setPostsLoading(false);
        }
      }
    } catch (err: any) {
      if (token !== fetchTokenRef.current) return;

      if (
        (err instanceof ApiClientError &&
          (err.problem.status === 404 || err.problem.code === 'COMMUNITY_NOT_FOUND')) ||
        err?.message?.includes('not found') ||
        err?.status === 404
      ) {
        setIsNotFound(true);
      }
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
      setPostsLoading(false);
    }
  }, [communitySlug, sort, apiInstance]);

  useEffect(() => {
    loadCommunityAndFeed();
  }, [loadCommunityAndFeed]);

  // Content Filtering (All / Discussions / Visual Pins)
  const filteredPosts = useMemo(() => {
    if (activeTab === 'discussions') {
      return posts.filter((p) => p.post_type === 'discussion');
    }
    if (activeTab === 'visual') {
      return posts.filter((p) => p.post_type === 'visual');
    }
    return posts;
  }, [posts, activeTab]);

  // Membership state is rendered from the community API response. Mutations
  // update the view only after the data source confirms the requested state.
  const toggleMembership = useCallback(async () => {
    if (!community || membershipPending) return;
    setMembershipPending(true);
    setMembershipError(null);
    try {
      const result = await apiInstance.setCommunityMembership(community.slug, !community.is_member);
      setCommunity((current) => current && current.id === result.community_id
        ? { ...current, is_member: result.is_member, members_count: result.members_count }
        : current);
    } catch (err) {
      setMembershipError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setMembershipPending(false);
    }
  }, [apiInstance, community, membershipPending]);

  // Optimistic post voting with rollback
  const vote = useCallback(
    async (postId: string, direction: 1 | -1 | 0) => {
      const target = posts.find((p) => p.id === postId);
      if (!target) return;

      const previous = { ...target };
      let delta = 0;
      if (target.user_vote === 1) delta -= 1;
      if (target.user_vote === -1) delta += 1;
      if (direction === 1) delta += 1;
      if (direction === -1) delta -= 1;

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, score: p.score + delta, user_vote: direction } : p
        )
      );

      try {
        const res = await apiInstance.votePost(postId, direction);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, score: res.new_score, user_vote: res.user_vote } : p
          )
        );
      } catch (err) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? previous : p)));
        throw err;
      }
    },
    [posts, apiInstance]
  );

  // Optimistic post save toggle with rollback
  const toggleSave = useCallback(
    async (postId: string) => {
      const target = posts.find((p) => p.id === postId);
      if (!target) return;

      const previousSaved = target.is_saved;
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, is_saved: !previousSaved } : p))
      );

      try {
        const res = await apiInstance.toggleSavePost(postId);
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, is_saved: res.is_saved } : p))
        );
      } catch (err) {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, is_saved: previousSaved } : p))
        );
        throw err;
      }
    },
    [posts, apiInstance]
  );

  return {
    community,
    posts,
    filteredPosts,
    activeTab,
    setActiveTab,
    sort,
    setSort,
    loading,
    postsLoading,
    error,
    isNotFound,
    membershipPending,
    membershipError,
    toggleMembership,
    vote,
    toggleSave,
    refresh: loadCommunityAndFeed,
  };
}
