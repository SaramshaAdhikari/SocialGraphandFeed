import { describe, it, expect, beforeEach } from 'vitest';
import { Value } from '@sinclair/typebox/value';
import {
  FeedResponseSchema,
  DiscoveryResponseSchema,
  PostCardSchema,
  CommentNodeSchema,
  UserProfileSchema,
  FollowToggleResponseSchema,
  CommunitySchema,
  HealthStatusSchema,
} from '@socialgraph/shared';
import { MockAdapter } from '../api/mock/MockAdapter';
import { LiveClient, getActiveDataSource, isMockMode, ApiClientError } from '../api';

describe('Checkpoint 2.2 — Typed Mock Adapter & Schema Conformance', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter({ simulatedLatencyMs: 0 });
  });

  it('clearly distinguishes development fixtures from live backend responses', () => {
    expect(mock.dataSource).toBe('mock');
    const liveClient = new LiveClient();
    expect(liveClient.dataSource).toBe('live');
    expect(getActiveDataSource()).toBeDefined();
    expect(isMockMode()).toBe(true); // in dev/test environment
  });

  it('returns health response conforming to HealthStatusSchema', async () => {
    const health = await mock.getHealth();
    expect(Value.Check(HealthStatusSchema as any, health)).toBe(true);
    expect(health.status).toBe('ok');
    expect(health.version).toContain('mock');
  });

  it('returns feed posts strictly conforming to FeedResponseSchema', async () => {
    const feed = await mock.getFeed({ limit: 5 });
    expect(Value.Check(FeedResponseSchema as any, feed)).toBe(true);
    expect(feed.success).toBe(true);
    expect(feed.data.length).toBe(5);

    // Verify individual post contracts
    for (const post of feed.data) {
      expect(Value.Check(PostCardSchema as any, post)).toBe(true);
      expect(['discussion', 'visual']).toContain(post.post_type);
      expect(post.author.username).toBeDefined();
      expect(post.score).toBeTypeOf('number');
    }
  });

  it('returns discovery visual pins conforming to DiscoveryResponseSchema with valid aspect ratios', async () => {
    const discovery = await mock.getDiscovery({ limit: 4 });
    expect(Value.Check(DiscoveryResponseSchema as any, discovery)).toBe(true);
    expect(discovery.data.length).toBe(4);

    for (const pin of discovery.data) {
      expect(pin.post_type).toBe('visual');
      expect(pin.media.aspect_ratio).toBeGreaterThan(0.1);
      expect(pin.media.aspect_ratio).toBeLessThan(10.0);
      expect(pin.media.url).toMatch(/^https?:\/\//);
    }
  });

  it('returns user profile conforming to UserProfileSchema', async () => {
    const profile = await mock.getUserProfile('lucas_t');
    expect(Value.Check(UserProfileSchema as any, profile)).toBe(true);
    expect(profile.username).toBe('lucas_t');
    expect(profile.followers_count).toBeGreaterThan(0);
  });

  it('returns community conforming to CommunitySchema', async () => {
    const community = await mock.getCommunity('systems');
    expect(Value.Check(CommunitySchema as any, community)).toBe(true);
    expect(community.slug).toBe('systems');
    expect(community.members_count).toBeGreaterThan(0);
  });
});

describe('Checkpoint 2.2 — Pagination and Sorting Automation', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter({ simulatedLatencyMs: 0 });
  });

  it('paginates feed results deterministically with cursor advancement', async () => {
    // Page 1
    const page1 = await mock.getFeed({ limit: 3 });
    expect(page1.data.length).toBe(3);
    expect(page1.has_more).toBe(true);
    expect(page1.next_cursor).toBeTruthy();

    const lastIdPage1 = page1.data[page1.data.length - 1].id;
    expect(page1.next_cursor).toBe(lastIdPage1);

    // Page 2 using cursor
    const page2 = await mock.getFeed({ limit: 3, cursor: page1.next_cursor! });
    expect(page2.data.length).toBeGreaterThan(0);

    // Ensure no overlapping items between page 1 and page 2
    const page1Ids = new Set(page1.data.map((p) => p.id));
    for (const p of page2.data) {
      expect(page1Ids.has(p.id)).toBe(false);
    }
  });

  it('sorts feed by new (chronological descending)', async () => {
    const response = await mock.getFeed({ sort: 'new', limit: 10 });
    const dates = response.data.map((p) => new Date(p.created_at).getTime());

    for (let i = 0; i < dates.length - 1; i++) {
      expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
    }
  });

  it('sorts feed by top/hot (highest score first)', async () => {
    const response = await mock.getFeed({ sort: 'top', limit: 10 });
    const scores = response.data.map((p) => p.score);

    for (let i = 0; i < scores.length - 1; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
    }
  });

  it('filters discovery feed by category', async () => {
    const hardwareResponse = await mock.getDiscovery({ category: 'hardware' });
    for (const pin of hardwareResponse.data) {
      expect(pin.community_slug).toContain('hardware');
    }
  });
});

describe('Checkpoint 2.2 — Mutations and Optimistic Updates', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter({ simulatedLatencyMs: 0 });
  });

  it('executes post voting and adjusts scores in mock state', async () => {
    const postBefore = await mock.getPost('post_disc_102');
    const initialScore = postBefore.score;

    // Upvote
    const voteResult = await mock.votePost('post_disc_102', 1);
    expect(voteResult.user_vote).toBe(1);
    expect(voteResult.new_score).toBe(initialScore + 1);

    // Re-fetch post to verify in-memory update
    const postAfter = await mock.getPost('post_disc_102');
    expect(postAfter.score).toBe(initialScore + 1);
    expect(postAfter.user_vote).toBe(1);

    // Clear vote
    const clearResult = await mock.votePost('post_disc_102', 0);
    expect(clearResult.user_vote).toBe(0);
    expect(clearResult.new_score).toBe(initialScore);
  });

  it('submits a new top-level comment and increments post comments_count', async () => {
    const postBefore = await mock.getPost('post_disc_101');
    const initialCommentCount = postBefore.comments_count;

    const newComment = await mock.createComment('post_disc_101', {
      content: 'Testing new comment addition to mock feed.',
    });

    expect(Value.Check(CommentNodeSchema as any, newComment)).toBe(true);
    expect(newComment.content).toBe('Testing new comment addition to mock feed.');
    expect(newComment.parent_id).toBeNull();

    const postAfter = await mock.getPost('post_disc_101');
    expect(postAfter.comments_count).toBe(initialCommentCount + 1);
  });

  it('submits a nested reply under an existing comment node', async () => {
    const reply = await mock.createComment('post_disc_101', {
      content: 'Deeply nested response.',
      parent_id: 'cmt_1',
    });

    expect(reply.parent_id).toBe('cmt_1');
    expect(reply.depth).toBe(1);

    const comments = await mock.getComments('post_disc_101');
    const parent = comments.find((c) => c.id === 'cmt_1');
    expect(parent).toBeDefined();
    expect(parent?.replies.some((r) => r.id === reply.id)).toBe(true);
  });

  it('toggles user follow state and updates follower counts', async () => {
    const targetUserId = 'usr_2';
    const profileBefore = await mock.getUserProfile('elena_arch');
    const initialFollowers = profileBefore.followers_count;
    const initialFollowingState = profileBefore.is_following;

    const toggleResult = await mock.toggleFollow(targetUserId);
    expect(Value.Check(FollowToggleResponseSchema as any, toggleResult)).toBe(true);
    expect(toggleResult.is_following).toBe(!initialFollowingState);
    expect(toggleResult.followers_count).toBe(
      initialFollowingState ? initialFollowers - 1 : initialFollowers + 1
    );
  });
});

describe('Checkpoint 2.2 — Simulated Network Failures and Error Handling', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter({ simulatedLatencyMs: 0 });
  });

  it('throws ApiClientError with RFC 7807 payload when simulated failure is active', async () => {
    mock.simulateFailure('/api/v1/feed', {
      type: 'https://socialgraph.dev/errors/rate-limit',
      title: 'Rate Limit Exceeded',
      status: 429,
      detail: 'Client has exceeded 100 requests per minute quota.',
      code: 'RATE_LIMIT_EXCEEDED',
      timestamp: new Date().toISOString(),
    });

    await expect(mock.getFeed()).rejects.toThrow(ApiClientError);

    try {
      await mock.getFeed();
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiClientError);
      expect(err.problem.status).toBe(429);
      expect(err.problem.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(err.problem.title).toBe('Rate Limit Exceeded');
    }

    // Clear failure
    mock.clearSimulatedFailures();
    const successFeed = await mock.getFeed();
    expect(successFeed.success).toBe(true);
  });

  it('throws 404 ApiClientError when querying nonexistent post', async () => {
    await expect(mock.getPost('post_non_existent')).rejects.toThrow(ApiClientError);
  });
});
