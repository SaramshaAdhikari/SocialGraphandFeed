import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MockAdapter } from '../api/mock/MockAdapter';
import { mockDiscussionPosts, mockVisualPins } from '../api/mock/fixtures';
import { DiscussionPostCard } from '../components/feed/DiscussionPostCard';
import { VisualPinCard } from '../components/feed/VisualPinCard';
import { FeedSortBar } from '../components/feed/FeedSortBar';
import { FeedList } from '../components/feed/FeedList';
import { HomePage } from '../pages/HomePage';
import { RouterProvider } from '../router/Router';
import { formatRelativeTime } from '../utils/date';
import type { DiscussionPostCard as IDiscussionPostCard, VisualPinCard as IVisualPinCard, PostCard } from '@socialgraph/shared';

describe('Screen 1 — Home Feed: Data Contract & Scope/Sort Logic', () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter({ simulatedLatencyMs: 0 });
  });

  it('fetches initial feed with default scope (all) and sort (hot)', async () => {
    const response = await adapter.getFeed({ limit: 5 });
    expect(response.success).toBe(true);
    expect(response.data.length).toBe(5);
    expect(response.has_more).toBe(true);
    expect(response.next_cursor).toBeDefined();

    // Verify sorted by score descending (hot default)
    for (let i = 0; i < response.data.length - 1; i++) {
      expect(response.data[i].score).toBeGreaterThanOrEqual(response.data[i + 1].score);
    }
  });

  it('filters feed by scope="following" (only followed authors)', async () => {
    const response = await adapter.getFeed({ scope: 'following', limit: 20 });
    expect(response.success).toBe(true);
    expect(response.data.length).toBeGreaterThan(0);

    // In mock fixtures, usr_1 (Linus) and usr_3 (Alec) have is_following: true
    const allowedAuthors = new Set(['usr_1', 'usr_3']);
    for (const post of response.data) {
      expect(allowedAuthors.has(post.author.id)).toBe(true);
    }
  });

  it('filters feed by scope="communities" (only posts with community_id)', async () => {
    const response = await adapter.getFeed({ scope: 'communities', limit: 20 });
    expect(response.success).toBe(true);
    expect(response.data.length).toBeGreaterThan(0);

    for (const post of response.data) {
      expect(post.community_id).toBeDefined();
      expect(post.community_slug).toBeDefined();
    }
  });

  it('sorts feed by sort="new" (created_at descending)', async () => {
    const response = await adapter.getFeed({ sort: 'new', limit: 10 });
    expect(response.success).toBe(true);

    for (let i = 0; i < response.data.length - 1; i++) {
      const timeA = new Date(response.data[i].created_at).getTime();
      const timeB = new Date(response.data[i + 1].created_at).getTime();
      expect(timeA).toBeGreaterThanOrEqual(timeB);
    }
  });

  it('sorts feed by sort="top" (highest net score)', async () => {
    const response = await adapter.getFeed({ sort: 'top', limit: 10 });
    expect(response.success).toBe(true);

    for (let i = 0; i < response.data.length - 1; i++) {
      expect(response.data[i].score).toBeGreaterThanOrEqual(response.data[i + 1].score);
    }
  });

  it('advances cursor pagination and detects end-of-feed cleanly', async () => {
    const page1 = await adapter.getFeed({ limit: 4 });
    expect(page1.data.length).toBe(4);
    expect(page1.has_more).toBe(true);
    expect(page1.next_cursor).toBe(page1.data[3].id);

    const page2 = await adapter.getFeed({ limit: 4, cursor: page1.next_cursor! });
    expect(page2.data.length).toBe(4);

    // Verify zero ID overlap between consecutive pages
    const page1Ids = new Set(page1.data.map((p) => p.id));
    for (const post of page2.data) {
      expect(page1Ids.has(post.id)).toBe(false);
    }

    // Advance to end of feed
    let currentCursor = page2.next_cursor;
    let iterations = 0;
    while (currentCursor && iterations < 10) {
      iterations++;
      const next = await adapter.getFeed({ limit: 5, cursor: currentCursor });
      currentCursor = next.next_cursor;
      if (!next.has_more) {
        expect(next.next_cursor).toBeNull();
        break;
      }
    }
  });

  it('toggles post save/bookmark state deterministically', async () => {
    const post = mockDiscussionPosts[0];
    const initialSaved = post.is_saved;

    const res1 = await adapter.toggleSavePost(post.id);
    expect(res1.post_id).toBe(post.id);
    expect(res1.is_saved).toBe(!initialSaved);

    const res2 = await adapter.toggleSavePost(post.id);
    expect(res2.is_saved).toBe(initialSaved);
  });

  it('updates post score and user_vote on upvote and downvote', async () => {
    // post_disc_102 has initial user_vote: 0 and score: 189
    const post = mockDiscussionPosts.find((p) => p.user_vote === 0) || mockDiscussionPosts[1];
    const initialScore = post.score;

    // Upvote
    const upRes = await adapter.votePost(post.id, 1);
    expect(upRes.user_vote).toBe(1);
    expect(upRes.new_score).toBe(initialScore + 1);

    // Remove vote (direction: 0)
    const neutralRes = await adapter.votePost(post.id, 0);
    expect(neutralRes.user_vote).toBe(0);
    expect(neutralRes.new_score).toBe(initialScore);

    // Downvote
    const downRes = await adapter.votePost(post.id, -1);
    expect(downRes.user_vote).toBe(-1);
    expect(downRes.new_score).toBe(initialScore - 1);
  });
});

describe('Screen 1 — Home Feed: Post Deduplication & Optimistic Logic', () => {
  it('deduplicates overlapping posts correctly by ID', () => {
    const existingPosts: Partial<PostCard>[] = [
      { id: 'post_1', score: 10 },
      { id: 'post_2', score: 8 },
    ];
    const incomingPosts: Partial<PostCard>[] = [
      { id: 'post_2', score: 8 }, // Duplicate
      { id: 'post_3', score: 6 }, // New
    ];

    const existingIds = new Set(existingPosts.map((p) => p.id));
    const uniqueIncoming = incomingPosts.filter((p) => !existingIds.has(p.id!));
    const merged = [...existingPosts, ...uniqueIncoming];

    expect(merged.length).toBe(3);
    expect(merged.map((p) => p.id)).toEqual(['post_1', 'post_2', 'post_3']);
  });

  it('calculates optimistic score delta accurately across vote transitions', () => {
    const calcDelta = (prevVote: 1 | -1 | 0, newVote: 1 | -1 | 0): number => {
      let delta = 0;
      if (prevVote === 1) delta -= 1;
      if (prevVote === -1) delta += 1;
      if (newVote === 1) delta += 1;
      if (newVote === -1) delta -= 1;
      return delta;
    };

    // Unvoted -> Upvoted: 0 -> 1 = +1
    expect(calcDelta(0, 1)).toBe(1);
    // Upvoted -> Unvoted (toggle off): 1 -> 0 = -1
    expect(calcDelta(1, 0)).toBe(-1);
    // Unvoted -> Downvoted: 0 -> -1 = -1
    expect(calcDelta(0, -1)).toBe(-1);
    // Upvoted -> Downvoted: 1 -> -1 = -2
    expect(calcDelta(1, -1)).toBe(-2);
    // Downvoted -> Upvoted: -1 -> 1 = +2
    expect(calcDelta(-1, 1)).toBe(2);
    // Downvoted -> Unvoted: -1 -> 0 = +1
    expect(calcDelta(-1, 0)).toBe(1);
  });
});

describe('Screen 1 — Component Rendering & Accessibility', () => {
  const sampleDiscussion: IDiscussionPostCard = {
    ...mockDiscussionPosts[0],
    flair: 'Architecture',
    is_saved: false,
  };

  const sampleVisualPin: IVisualPinCard = {
    ...mockVisualPins[0],
    is_saved: true,
  };

  it('renders DiscussionPostCard with Reddit layout, metadata, and vote rails', () => {
    const html = renderToString(
      <RouterProvider>
        <DiscussionPostCard
          post={sampleDiscussion}
          onVote={() => {}}
          onToggleSave={() => {}}
        />
      </RouterProvider>
    );

    // Title and excerpt
    expect(html).toContain(sampleDiscussion.title);
    expect(html).toContain(sampleDiscussion.author.username);
    expect(html).toContain(`c/${sampleDiscussion.community_slug}`);
    expect(html).toContain('Architecture'); // Flair badge
    expect(html).toContain('Comments');
    expect(html).toContain('Save');

    // Vertical vote control on desktop
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="Vote on post"');
  });

  it('renders VisualPinCard with Pinterest/Instagram layout and preserved aspect ratio', () => {
    const html = renderToString(
      <RouterProvider>
        <VisualPinCard
          post={sampleVisualPin}
          onVote={() => {}}
          onToggleSave={() => {}}
        />
      </RouterProvider>
    );

    // Author and image
    expect(html).toContain(sampleVisualPin.author.display_name);
    expect(html).toContain(sampleVisualPin.author.username);
    expect(html).toContain(sampleVisualPin.media.url);
    expect(html).toContain('aspect-ratio:'); // CLS prevention style
    expect(html).toContain('Saved'); // is_saved: true
  });

  it('renders FeedSortBar with distinct scope tabs and sort pills', () => {
    const html = renderToString(
      <FeedSortBar
        scope="following"
        sort="new"
        onScopeChange={() => {}}
        onSortChange={() => {}}
      />
    );

    // Scopes tablist
    expect(html).toContain('role="tablist"');
    expect(html).toContain('For You');
    expect(html).toContain('Following');
    expect(html).toContain('Communities');
    expect(html).toContain('aria-selected="true"'); // Following tab selected

    // Sort toolbar
    expect(html).toContain('role="toolbar"');
    expect(html).toContain('Hot');
    expect(html).toContain('New');
    expect(html).toContain('Top');
    expect(html).toContain('aria-pressed="true"'); // New sort selected
  });

  it('renders FeedList loading skeleton state when loading with empty posts', () => {
    const html = renderToString(
      <FeedList
        posts={[]}
        scope="all"
        loading={true}
        loadingMore={false}
        hasMore={true}
        error={null}
        onLoadMore={() => {}}
        onRetry={() => {}}
        onVote={() => {}}
        onToggleSave={() => {}}
      />
    );

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('animate-pulse');
  });

  it('renders FeedList error state with retry button upon failure', () => {
    const testError = new Error('Gateway Connection Timeout');
    const html = renderToString(
      <FeedList
        posts={[]}
        scope="all"
        loading={false}
        loadingMore={false}
        hasMore={true}
        error={testError}
        onLoadMore={() => {}}
        onRetry={() => {}}
        onVote={() => {}}
        onToggleSave={() => {}}
      />
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain('Failed to load feed');
    expect(html).toContain('Gateway Connection Timeout');
    expect(html).toContain('Try Again');
  });

  it('renders FeedList contextual empty state for scope="following"', () => {
    const html = renderToString(
      <RouterProvider>
        <FeedList
          posts={[]}
          scope="following"
          loading={false}
          loadingMore={false}
          hasMore={false}
          error={null}
          onLoadMore={() => {}}
          onRetry={() => {}}
          onVote={() => {}}
          onToggleSave={() => {}}
        />
      </RouterProvider>
    );

    expect(html).toContain('No posts from creators you follow');
    expect(html).toContain('Explore Creators');
  });

  it('renders FeedList contextual empty state for scope="communities"', () => {
    const html = renderToString(
      <RouterProvider>
        <FeedList
          posts={[]}
          scope="communities"
          loading={false}
          loadingMore={false}
          hasMore={false}
          error={null}
          onLoadMore={() => {}}
          onRetry={() => {}}
          onVote={() => {}}
          onToggleSave={() => {}}
        />
      </RouterProvider>
    );

    expect(html).toContain('No community posts in this feed');
    expect(html).toContain('Browse Communities');
  });

  it('renders mixed feed with both discussion and visual pin cards', () => {
    const mixedPosts: PostCard[] = [sampleDiscussion, sampleVisualPin];

    const html = renderToString(
      <RouterProvider>
        <FeedList
          posts={mixedPosts}
          scope="all"
          loading={false}
          loadingMore={false}
          hasMore={false}
          error={null}
          onLoadMore={() => {}}
          onRetry={() => {}}
          onVote={() => {}}
          onToggleSave={() => {}}
        />
      </RouterProvider>
    );

    // Discussion post content
    expect(html).toContain(sampleDiscussion.title);
    // Visual pin content
    expect(html).toContain(sampleVisualPin.media.url);
    // End of feed caught-up banner
    expect(html).toContain('You&#x27;re all caught up!');
  });

  it('renders manual "Load More Posts" button when hasMore is true', () => {
    const html = renderToString(
      <RouterProvider>
        <FeedList
          posts={[sampleDiscussion]}
          scope="all"
          loading={false}
          loadingMore={false}
          hasMore={true}
          error={null}
          onLoadMore={() => {}}
          onRetry={() => {}}
          onVote={() => {}}
          onToggleSave={() => {}}
        />
      </RouterProvider>
    );

    expect(html).toContain('Load More Posts');
  });

  it('renders full HomePage inside RouterProvider', () => {
    const html = renderToString(
      <RouterProvider initialPath="/">
        <HomePage />
      </RouterProvider>
    );

    expect(html).toContain('For You');
    expect(html).toContain('Following');
    expect(html).toContain('Communities');
    expect(html).toContain('Hot');
    expect(html).toContain('New');
    expect(html).toContain('Top');
  });
});

describe('Screen 1 — Date Utility Formatting', () => {
  it('formats recent timestamps into relative times', () => {
    const now = new Date();
    const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    const threeHoursAgo = new Date(now.getTime() - 3 * 3600 * 1000).toISOString();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString();

    expect(formatRelativeTime(tenMinAgo)).toBe('10m ago');
    expect(formatRelativeTime(threeHoursAgo)).toBe('3h ago');
    expect(formatRelativeTime(twoDaysAgo)).toBe('2d ago');
  });
});
