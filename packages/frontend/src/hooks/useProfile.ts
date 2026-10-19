import { useState, useEffect, useCallback, useRef } from 'react';
import type { UserProfile, PostCard } from '@socialgraph/shared';
import type { ISocialGraphApi } from '../api/types';
import { api as defaultApi } from '../api';
import { ApiClientError } from '../api/client';

export type ProfileTab = 'all' | 'discussions' | 'visual' | 'saved';

export interface UseProfileOptions {
  apiInstance?: ISocialGraphApi;
  currentViewerUsername?: string;
}

export interface UseProfileReturn {
  profile: UserProfile | null;
  posts: PostCard[];
  savedPosts: PostCard[];
  filteredPosts: PostCard[];
  activeTab: ProfileTab;
  setActiveTab: (tab: ProfileTab) => void;
  loading: boolean;
  error: Error | null;
  isNotFound: boolean;
  isSelf: boolean;
  isFollowing: boolean;
  toggleFollow: () => Promise<void>;
  vote: (postId: string, direction: 1 | -1 | 0) => Promise<void>;
  toggleSave: (postId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useProfile(
  username: string,
  options: UseProfileOptions = {}
): UseProfileReturn {
  const {
    apiInstance = defaultApi,
    currentViewerUsername,
  } = options;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<PostCard[]>([]);
  const [savedPosts, setSavedPosts] = useState<PostCard[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  const fetchTokenRef = useRef(0);

  const isSelf = Boolean(
    username &&
    currentViewerUsername &&
    username.toLowerCase() === currentViewerUsername.toLowerCase()
  );

  const loadData = useCallback(async (silent = false) => {
    if (!username) return;

    const token = ++fetchTokenRef.current;
    if (!silent) setLoading(true);
    setError(null);
    setIsNotFound(false);

    try {
      // Fetch profile, authored posts, and (for self) bookmarked saved posts in parallel
      const [fetchedProfile, postsResponse, savedResponse] = await Promise.all([
        apiInstance.getUserProfile(username),
        apiInstance.getUserPosts(username, { limit: 50 }),
        isSelf
          ? apiInstance.getSavedPosts({ limit: 50 }).catch(() => ({
              success: true,
              data: [],
              next_cursor: null,
              has_more: false,
            }))
          : Promise.resolve({
              success: true,
              data: [],
              next_cursor: null,
              has_more: false,
            }),
      ]);

      if (token !== fetchTokenRef.current) return;

      setProfile(fetchedProfile);
      setPosts(postsResponse.data);
      if (isSelf) {
        setSavedPosts(savedResponse.data || []);
      }
    } catch (err: any) {
      if (token !== fetchTokenRef.current) return;

      if (err instanceof ApiClientError && (err.problem.status === 404 || err.problem.code === 'USER_NOT_FOUND')) {
        setIsNotFound(true);
      } else if (err?.message?.includes('not found') || err?.status === 404) {
        setIsNotFound(true);
      }
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (token === fetchTokenRef.current && !silent) {
        setLoading(false);
      }
    }
  }, [username, isSelf, apiInstance]);

  const refresh = useCallback(() => loadData(true), [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tab filtering logic: 'saved' returns savedPosts for isSelf; otherwise standard authored post filter
  const displayPosts =
    activeTab === 'saved'
      ? isSelf
        ? savedPosts
        : []
      : posts.filter((p) => {
          if (activeTab === 'discussions') return p.post_type === 'discussion';
          if (activeTab === 'visual') return p.post_type === 'visual';
          return true; // 'all' tab
        });

  // Optimistic Follow Toggle with Rollback
  const toggleFollow = useCallback(async () => {
    if (!profile) return;

    const previousProfile = { ...profile };
    const nextIsFollowing = !profile.is_following;
    const nextFollowersCount = profile.followers_count + (nextIsFollowing ? 1 : -1);

    // Apply optimistic update immediately
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            is_following: nextIsFollowing,
            followers_count: Math.max(0, nextFollowersCount),
          }
        : null
    );

    try {
      const res = await apiInstance.toggleFollow(profile.id, nextIsFollowing);
      // Synchronize with server response
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              is_following: res.is_following,
              followers_count: res.followers_count,
            }
          : null
      );
    } catch (err) {
      // Rollback on failure
      setProfile(previousProfile);
      throw err;
    }
  }, [profile, apiInstance]);

  // Optimistic Post Voting with Rollback
  const vote = useCallback(
    async (postId: string, direction: 1 | -1 | 0) => {
      const targetPost = posts.find((p) => p.id === postId);
      if (!targetPost) return;

      const previousPost = { ...targetPost };
      let delta = 0;
      if (targetPost.user_vote === 1) delta -= 1;
      if (targetPost.user_vote === -1) delta += 1;
      if (direction === 1) delta += 1;
      if (direction === -1) delta -= 1;

      // Optimistic update
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, score: p.score + delta, user_vote: direction }
            : p
        )
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
        // Rollback
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? previousPost : p))
        );
        throw err;
      }
    },
    [posts, apiInstance]
  );

  // Optimistic Post Save/Bookmark Toggle with Rollback
  const toggleSave = useCallback(
    async (postId: string) => {
      const targetPost =
        posts.find((p) => p.id === postId) ||
        savedPosts.find((p) => p.id === postId);
      if (!targetPost) return;

      const previousSaved = targetPost.is_saved;
      const originalPosts = [...posts];
      const originalSavedPosts = [...savedPosts];

      // Optimistic update in posts
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, is_saved: !previousSaved } : p
        )
      );

      // Optimistic update in savedPosts
      setSavedPosts((prev) => {
        if (previousSaved) {
          // Unsaving: remove from savedPosts list
          return prev.filter((p) => p.id !== postId);
        } else {
          // Saving: re-add to savedPosts list
          const foundInPosts = originalPosts.find((p) => p.id === postId);
          if (foundInPosts) {
            return [{ ...foundInPosts, is_saved: true }, ...prev];
          }
          return prev;
        }
      });

      try {
        const result = await apiInstance.toggleSavePost(postId);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, is_saved: result.is_saved } : p
          )
        );
        if (!result.is_saved) {
          setSavedPosts((prev) => prev.filter((p) => p.id !== postId));
        }
      } catch (err) {
        // Rollback
        setPosts(originalPosts);
        setSavedPosts(originalSavedPosts);
        throw err;
      }
    },
    [posts, savedPosts, apiInstance]
  );

  return {
    profile,
    posts,
    savedPosts,
    filteredPosts: displayPosts,
    activeTab,
    setActiveTab,
    loading,
    error,
    isNotFound,
    isSelf,
    isFollowing: Boolean(profile?.is_following),
    toggleFollow,
    vote,
    toggleSave,
    refresh,
  };
}
