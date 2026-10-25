import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Community } from '@socialgraph/shared';
import type { ISocialGraphApi } from '../api/types';
import { api as defaultApi } from '../api';

export type CommunityDirectorySort = 'members' | 'name' | 'newest';
export type CommunityDirectoryFilter = 'all' | 'joined';

export interface UseCommunitiesOptions {
  apiInstance?: ISocialGraphApi;
  initialSort?: CommunityDirectorySort;
  initialFilter?: CommunityDirectoryFilter;
}

export interface UseCommunitiesReturn {
  communities: Community[];
  filteredCommunities: Community[];
  loading: boolean;
  error: Error | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filter: CommunityDirectoryFilter;
  setFilter: (f: CommunityDirectoryFilter) => void;
  sort: CommunityDirectorySort;
  setSort: (s: CommunityDirectorySort) => void;
  totalCount: number;
  joinedCount: number;
  pendingSlug: string | null;
  toggleMembership: (community: Community) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useCommunities(options: UseCommunitiesOptions = {}): UseCommunitiesReturn {
  const {
    apiInstance = defaultApi,
    initialSort = 'members',
    initialFilter = 'all',
  } = options;

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<CommunityDirectorySort>(initialSort);
  const [filter, setFilter] = useState<CommunityDirectoryFilter>(initialFilter);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);

  const fetchTokenRef = useRef(0);

  const loadCommunities = useCallback(async () => {
    const token = ++fetchTokenRef.current;
    setLoading(true);
    setError(null);

    try {
      const items = await apiInstance.getCommunities();
      if (token !== fetchTokenRef.current) return;
      setCommunities(items);
    } catch (err: unknown) {
      if (token !== fetchTokenRef.current) return;
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (token === fetchTokenRef.current) {
        setLoading(false);
      }
    }
  }, [apiInstance]);

  useEffect(() => {
    void loadCommunities();
  }, [loadCommunities]);

  const toggleMembership = useCallback(
    async (community: Community) => {
      if (pendingSlug) return;
      setPendingSlug(community.slug);

      const previousCommunities = [...communities];
      const targetIsMember = !community.is_member;
      const targetMembersCount = Math.max(
        0,
        community.members_count + (targetIsMember ? 1 : -1)
      );

      // Optimistic update
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === community.id
            ? { ...c, is_member: targetIsMember, members_count: targetMembersCount }
            : c
        )
      );

      try {
        const result = await apiInstance.setCommunityMembership(
          community.slug,
          targetIsMember
        );
        setCommunities((prev) =>
          prev.map((c) =>
            c.id === result.community_id
              ? { ...c, is_member: result.is_member, members_count: result.members_count }
              : c
          )
        );
      } catch (err) {
        // Rollback on error
        setCommunities(previousCommunities);
        throw err;
      } finally {
        setPendingSlug(null);
      }
    },
    [communities, pendingSlug, apiInstance]
  );

  const totalCount = communities.length;
  const joinedCount = useMemo(
    () => communities.filter((c) => c.is_member).length,
    [communities]
  );

  const filteredCommunities = useMemo(() => {
    let list = [...communities];

    // Search query filter
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }

    // Filter by membership
    if (filter === 'joined') {
      list = list.filter((c) => c.is_member);
    }

    // Sort
    if (sort === 'members') {
      list.sort((a, b) => b.members_count - a.members_count);
    } else if (sort === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'newest') {
      list.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return list;
  }, [communities, searchQuery, filter, sort]);

  return {
    communities,
    filteredCommunities,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    sort,
    setSort,
    totalCount,
    joinedCount,
    pendingSlug,
    toggleMembership,
    refresh: loadCommunities,
  };
}
