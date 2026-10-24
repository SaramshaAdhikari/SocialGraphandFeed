import type { Db } from 'mongodb';
import {
  type SearchQuery,
  type UniversalSearchResults,
  type DiscussionPostCard,
  type VisualPinCard,
  type Community,
  type UserProfile,
} from '@socialgraph/shared';
import { getDb } from '../db/mongo.js';
import { COLLECTIONS } from '../db/collections.js';
import type {
  PostDoc,
  UserDoc,
  CommunityDoc,
  CommunityMembershipDoc,
  FollowDoc,
  PostVoteDoc,
  PostSaveDoc,
} from '../db/types.js';
import {
  toUserSummary,
  toUserProfile,
  toPostCard,
  toCommunity,
} from '../db/serialization.js';

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class SearchService {
  private get db(): Db {
    return getDb();
  }

  public async search(
    query: SearchQuery,
    currentUserId?: string
  ): Promise<UniversalSearchResults> {
    const rawQ = query.q || '';
    const q = rawQ.trim().toLowerCase();
    const category = query.category || 'all';
    const sort = query.sort || 'relevance';
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);

    if (!q) {
      return {
        query: rawQ,
        discussions: [],
        visuals: [],
        communities: [],
        users: [],
        total_count: 0,
      };
    }

    const terms = q.split(/\s+/).filter(Boolean);
    const searchRegex = new RegExp(terms.map(escapeRegex).join('|'), 'i');

    const matchesTerm = (text?: string): boolean => {
      if (!text) return false;
      const lower = text.toLowerCase();
      return terms.some((t) => lower.includes(t));
    };

    const calculateRelevance = (primaryText?: string, secondaryText?: string): number => {
      let score = 0;
      const lowerPrimary = primaryText ? primaryText.toLowerCase() : '';
      const lowerSecondary = secondaryText ? secondaryText.toLowerCase() : '';

      if (lowerPrimary && lowerPrimary === q) score += 100;
      else if (lowerPrimary && lowerPrimary.startsWith(q)) score += 50;
      else if (lowerPrimary && lowerPrimary.includes(q)) score += 30;

      for (const t of terms) {
        if (lowerPrimary && lowerPrimary.includes(t)) score += 15;
        if (lowerSecondary && lowerSecondary.includes(t)) score += 5;
      }
      return score;
    };

    const postsCol = this.db.collection<PostDoc>(COLLECTIONS.POSTS);
    const usersCol = this.db.collection<UserDoc>(COLLECTIONS.USERS);
    const commsCol = this.db.collection<CommunityDoc>(COLLECTIONS.COMMUNITIES);
    const followsCol = this.db.collection<FollowDoc>(COLLECTIONS.FOLLOWS);
    const mbrsCol = this.db.collection<CommunityMembershipDoc>(COLLECTIONS.COMMUNITY_MEMBERSHIPS);
    const votesCol = this.db.collection<PostVoteDoc>(COLLECTIONS.POST_VOTES);
    const savesCol = this.db.collection<PostSaveDoc>(COLLECTIONS.POST_SAVES);

    // Pre-resolve authors whose username or display_name match terms to enable indexed post author searches
    const matchingAuthors = await usersCol
      .find(
        {
          $or: [
            { username: { $regex: searchRegex } },
            { display_name: { $regex: searchRegex } },
          ],
        },
        { projection: { _id: 1, username: 1, display_name: 1 } }
      )
      .limit(50)
      .toArray();
    const matchingAuthorIds = matchingAuthors.map((u) => u._id);

    // 1. Discussions (bounded query with limit 200)
    let matchingDiscussions: DiscussionPostCard[] = [];
    if (category === 'all' || category === 'discussions') {
      const discOrConditions: any[] = [
        { title: { $regex: searchRegex } },
        { content: { $regex: searchRegex } },
        { flair: { $regex: searchRegex } },
        { community_slug: { $regex: searchRegex } },
        { tags: { $in: terms } },
      ];
      if (matchingAuthorIds.length > 0) {
        discOrConditions.push({ author_id: { $in: matchingAuthorIds } });
      }

      let discSort: any = { created_at: -1, _id: -1 };
      if (sort === 'top') {
        discSort = { score: -1, created_at: -1, _id: -1 };
      }

      const discussionDocs = await postsCol
        .find({
          post_type: 'discussion',
          $or: discOrConditions,
        })
        .sort(discSort)
        .limit(200)
        .toArray();

      const authorIds = [...new Set(discussionDocs.map((p) => p.author_id))];
      const authorDocs = authorIds.length
        ? await usersCol.find({ _id: { $in: authorIds } }).toArray()
        : [];
      const discussionUserMap = new Map<string, UserDoc>(authorDocs.map((u) => [u._id, u]));

      const filtered = discussionDocs.filter((post) => {
        const author = discussionUserMap.get(post.author_id);
        const tagsStr = post.tags ? post.tags.join(' ') : '';
        return (
          matchesTerm(post.title) ||
          matchesTerm(post.content) ||
          matchesTerm(post.flair) ||
          matchesTerm(post.community_slug) ||
          matchesTerm(tagsStr) ||
          matchesTerm(author?.username) ||
          matchesTerm(author?.display_name)
        );
      });

      if (sort === 'relevance') {
        filtered.sort((a, b) => {
          const relA = calculateRelevance(a.title, `${a.content || ''} ${a.flair || ''} ${a.community_slug || ''}`);
          const relB = calculateRelevance(b.title, `${b.content || ''} ${b.flair || ''} ${b.community_slug || ''}`);
          return relB !== relA ? relB - relA : (b.score || 0) - (a.score || 0);
        });
      } else if (sort === 'top') {
        filtered.sort((a, b) => (b.score || 0) - (a.score || 0));
      } else if (sort === 'new') {
        filtered.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
      }

      const paged = filtered.slice(0, limit);
      const postIds = paged.map((p) => p._id);
      let voteMap = new Map<string, 1 | -1 | 0>();
      let saveSet = new Set<string>();

      if (currentUserId && postIds.length > 0) {
        const [votes, saves] = await Promise.all([
          votesCol.find({ user_id: currentUserId, post_id: { $in: postIds } }).toArray(),
          savesCol.find({ user_id: currentUserId, post_id: { $in: postIds } }).toArray(),
        ]);
        for (const v of votes) voteMap.set(v.post_id, v.direction);
        for (const s of saves) saveSet.add(s.post_id);
      }

      matchingDiscussions = paged.map((post) => {
        const authorDoc = discussionUserMap.get(post.author_id);
        const author = authorDoc ? toUserSummary(authorDoc) : {
          id: post.author_id,
          username: 'unknown',
          display_name: 'Unknown User',
          avatar_url: '/avatars/alex-dev.svg',
          is_verified: false,
        };
        return toPostCard(post, author, voteMap.get(post._id) ?? 0, saveSet.has(post._id)) as DiscussionPostCard;
      });
    }

    // 2. Visuals (bounded query with limit 200)
    let matchingVisuals: VisualPinCard[] = [];
    if (category === 'all' || category === 'visual') {
      const visualOrConditions: any[] = [
        { title: { $regex: searchRegex } },
        { caption: { $regex: searchRegex } },
        { content: { $regex: searchRegex } },
        { community_slug: { $regex: searchRegex } },
        { 'media.alt_text': { $regex: searchRegex } },
        { tags: { $in: terms } },
      ];
      if (matchingAuthorIds.length > 0) {
        visualOrConditions.push({ author_id: { $in: matchingAuthorIds } });
      }

      let visualSort: any = { created_at: -1, _id: -1 };
      if (sort === 'top') {
        visualSort = { score: -1, created_at: -1, _id: -1 };
      }

      const visualDocs = await postsCol
        .find({
          post_type: 'visual',
          $or: visualOrConditions,
        })
        .sort(visualSort)
        .limit(200)
        .toArray();

      const authorIds = [...new Set(visualDocs.map((p) => p.author_id))];
      const authorDocs = authorIds.length
        ? await usersCol.find({ _id: { $in: authorIds } }).toArray()
        : [];
      const visualUserMap = new Map<string, UserDoc>(authorDocs.map((u) => [u._id, u]));

      const filtered = visualDocs.filter((pin) => {
        const author = visualUserMap.get(pin.author_id);
        const rawMedia = Array.isArray(pin.media) ? pin.media[0] : pin.media;
        const tagsStr = pin.tags ? pin.tags.join(' ') : '';
        return (
          matchesTerm(pin.title) ||
          matchesTerm(pin.caption) ||
          matchesTerm(pin.content) ||
          matchesTerm(pin.community_slug) ||
          matchesTerm(rawMedia?.alt_text) ||
          matchesTerm(tagsStr) ||
          matchesTerm(author?.username) ||
          matchesTerm(author?.display_name)
        );
      });

      if (sort === 'relevance') {
        filtered.sort((a, b) => {
          const rawMediaA = Array.isArray(a.media) ? a.media[0] : a.media;
          const rawMediaB = Array.isArray(b.media) ? b.media[0] : b.media;
          const relA = calculateRelevance(a.title, `${a.caption || a.content || ''} ${rawMediaA?.alt_text || ''} ${a.community_slug || ''}`);
          const relB = calculateRelevance(b.title, `${b.caption || b.content || ''} ${rawMediaB?.alt_text || ''} ${b.community_slug || ''}`);
          return relB !== relA ? relB - relA : (b.score || 0) - (a.score || 0);
        });
      } else if (sort === 'top') {
        filtered.sort((a, b) => (b.score || 0) - (a.score || 0));
      } else if (sort === 'new') {
        filtered.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
      }

      const paged = filtered.slice(0, limit);
      const postIds = paged.map((p) => p._id);
      let voteMap = new Map<string, 1 | -1 | 0>();
      let saveSet = new Set<string>();

      if (currentUserId && postIds.length > 0) {
        const [votes, saves] = await Promise.all([
          votesCol.find({ user_id: currentUserId, post_id: { $in: postIds } }).toArray(),
          savesCol.find({ user_id: currentUserId, post_id: { $in: postIds } }).toArray(),
        ]);
        for (const v of votes) voteMap.set(v.post_id, v.direction);
        for (const s of saves) saveSet.add(s.post_id);
      }

      matchingVisuals = paged.map((post) => {
        const authorDoc = visualUserMap.get(post.author_id);
        const author = authorDoc ? toUserSummary(authorDoc) : {
          id: post.author_id,
          username: 'unknown',
          display_name: 'Unknown User',
          avatar_url: '/avatars/alex-dev.svg',
          is_verified: false,
        };
        return toPostCard(post, author, voteMap.get(post._id) ?? 0, saveSet.has(post._id)) as VisualPinCard;
      });
    }

    // 3. Communities (bounded query with limit 100)
    let matchingCommunities: Community[] = [];
    if (category === 'all' || category === 'communities') {
      let commSort: any = { created_at: -1 };
      if (sort === 'top') {
        commSort = { members_count: -1, created_at: -1 };
      }

      const commDocs = await commsCol
        .find({
          $or: [
            { name: { $regex: searchRegex } },
            { slug: { $regex: searchRegex } },
            { description: { $regex: searchRegex } },
          ],
        })
        .sort(commSort)
        .limit(100)
        .toArray();

      const commIds = commDocs.map((c) => c._id);
      const membershipCounts = commIds.length
        ? await mbrsCol.aggregate<{ _id: string; count: number }>([
            { $match: { community_id: { $in: commIds } } },
            { $group: { _id: '$community_id', count: { $sum: 1 } } },
          ]).toArray()
        : [];
      const memberCountByCommunityId = new Map(membershipCounts.map((item) => [item._id, item.count]));
      const communitiesWithCounts = commDocs.map((comm) => ({
        ...comm,
        members_count: memberCountByCommunityId.get(comm._id) ?? 0,
      }));
      const filtered = communitiesWithCounts.filter((comm) => {
        return (
          matchesTerm(comm.name) ||
          matchesTerm(comm.slug) ||
          matchesTerm(comm.description)
        );
      });

      if (sort === 'relevance') {
        filtered.sort((a, b) => {
          const relA = calculateRelevance(a.name, `${a.slug} ${a.description}`);
          const relB = calculateRelevance(b.name, `${b.slug} ${b.description}`);
          return relB !== relA ? relB - relA : (b.members_count || 0) - (a.members_count || 0);
        });
      } else if (sort === 'top') {
        filtered.sort((a, b) => (b.members_count || 0) - (a.members_count || 0));
      } else if (sort === 'new') {
        filtered.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
      }

      const paged = filtered.slice(0, limit);
      let memberSet = new Set<string>();

      if (currentUserId && paged.length > 0) {
        const pagedCommIds = paged.map((c) => c._id);
        const memberships = await mbrsCol
          .find({ user_id: currentUserId, community_id: { $in: pagedCommIds } })
          .toArray();
        memberSet = new Set(memberships.map((m) => m.community_id));
      }

      matchingCommunities = paged.map((comm) => toCommunity(comm, memberSet.has(comm._id)));
    }

    // 4. Users (People) (bounded query with limit 100)
    let matchingUsers: UserProfile[] = [];
    if (category === 'all' || category === 'people') {
      let userSort: any = { created_at: -1 };
      if (sort === 'top') {
        userSort = { followers_count: -1, created_at: -1 };
      }

      const userDocs = await usersCol
        .find({
          $or: [
            { username: { $regex: searchRegex } },
            { display_name: { $regex: searchRegex } },
            { bio: { $regex: searchRegex } },
          ],
        })
        .sort(userSort)
        .limit(100)
        .toArray();

      const filtered = userDocs.filter((u) => {
        return (
          matchesTerm(u.username) ||
          matchesTerm(u.display_name) ||
          matchesTerm(u.bio)
        );
      });

      const idsForCounts = filtered.map((u) => u._id);
      const [incomingCounts, outgoingCounts, postCounts] = idsForCounts.length ? await Promise.all([
        followsCol.aggregate<{ _id: string; count: number }>([{ $match: { target_user_id: { $in: idsForCounts } } }, { $group: { _id: '$target_user_id', count: { $sum: 1 } } }]).toArray(),
        followsCol.aggregate<{ _id: string; count: number }>([{ $match: { follower_id: { $in: idsForCounts } } }, { $group: { _id: '$follower_id', count: { $sum: 1 } } }]).toArray(),
        postsCol.aggregate<{ _id: string; count: number }>([{ $match: { author_id: { $in: idsForCounts } } }, { $group: { _id: '$author_id', count: { $sum: 1 } } }]).toArray(),
      ]) : [[], [], []];
      const followerCount = new Map(incomingCounts.map((c) => [c._id, c.count]));
      const followingCount = new Map(outgoingCounts.map((c) => [c._id, c.count]));
      const postCount = new Map(postCounts.map((c) => [c._id, c.count]));

      if (sort === 'relevance') {
        filtered.sort((a, b) => {
          const relA = calculateRelevance(a.username, `${a.display_name} ${a.bio || ''}`);
          const relB = calculateRelevance(b.username, `${b.display_name} ${b.bio || ''}`);
          return relB !== relA ? relB - relA : (followerCount.get(b._id) ?? 0) - (followerCount.get(a._id) ?? 0);
        });
      } else if (sort === 'top') {
        filtered.sort((a, b) => (followerCount.get(b._id) ?? 0) - (followerCount.get(a._id) ?? 0));
      } else if (sort === 'new') {
        filtered.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
      }

      const paged = filtered.slice(0, limit);
      let followingSet = new Set<string>();

      if (currentUserId && paged.length > 0) {
        const userIds = paged.map((u) => u._id);
        const follows = await followsCol
          .find({ follower_id: currentUserId, target_user_id: { $in: userIds } })
          .toArray();
        followingSet = new Set(follows.map((f) => f.target_user_id));
      }

      matchingUsers = paged.map((u) => ({ ...toUserProfile(u, followingSet.has(u._id)), followers_count: followerCount.get(u._id) ?? 0, following_count: followingCount.get(u._id) ?? 0, posts_count: postCount.get(u._id) ?? 0 }));
    }

    const total_count =
      matchingDiscussions.length +
      matchingVisuals.length +
      matchingCommunities.length +
      matchingUsers.length;

    return {
      query: rawQ,
      discussions: matchingDiscussions,
      visuals: matchingVisuals,
      communities: matchingCommunities,
      users: matchingUsers,
      total_count,
    };
  }
}
