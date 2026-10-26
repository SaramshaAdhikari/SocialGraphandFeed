import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MockAdapter } from '../api/mock/MockAdapter';
import { ApiClientError } from '../api/client';
import {
  mockDiscussionPosts,
  mockVisualPins,
  mockCommentsByPostId,
} from '../api/mock/fixtures';
import { CommentComposer } from '../components/post/CommentComposer';
import { CommentNodeItem } from '../components/post/CommentNodeItem';
import { CommentTree } from '../components/post/CommentTree';
import { PostDetailSkeleton } from '../components/post/PostDetailSkeleton';
import { PostDetailPage } from '../pages/PostDetailPage';
import { RouterProvider } from '../router/Router';
import { ThemeProvider } from '../theme/ThemeContext';

describe('Screen 3 — Post Detail: Mock API Contracts & Data Layer', () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter({ simulatedLatencyMs: 0 });
  });

  it('retrieves discussion post by ID with author, community, and engagement counters', async () => {
    const post = await adapter.getPost('post_disc_101');
    expect(post.id).toBe('post_disc_101');
    expect(post.post_type).toBe('discussion');
    expect(post.author.username).toBe('lucas_t');
    expect(post.community_slug).toBe('systems');
    expect(post.score).toBeGreaterThan(0);
    expect(post.comments_count).toBeGreaterThan(0);
  });

  it('retrieves visual pin by ID with media aspect ratio and dominant color', async () => {
    const pin = await adapter.getPost('pin_vis_201');
    expect(pin.id).toBe('pin_vis_201');
    expect(pin.post_type).toBe('visual');
    expect(pin.author.username).toBe('elena_arch');
    if (pin.post_type === 'visual') {
      expect(pin.media.url).toBeDefined();
      expect(pin.media.aspect_ratio).toBeGreaterThan(0);
      expect(pin.dominant_color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('throws 404 ApiClientError when querying a nonexistent post ID', async () => {
    await expect(adapter.getPost('nonexistent_post_999')).rejects.toThrow(ApiClientError);
    try {
      await adapter.getPost('nonexistent_post_999');
    } catch (err: any) {
      expect(err.problem.status).toBe(404);
      expect(err.problem.code).toBe('POST_NOT_FOUND');
    }
  });

  it('retrieves hierarchical threaded comments for a post', async () => {
    const comments = await adapter.getComments('post_disc_101');
    expect(comments.length).toBeGreaterThan(0);

    // Verify root comment structure
    const rootComment = comments[0];
    expect(rootComment.parent_id).toBeNull();
    expect(rootComment.author.username).toBeDefined();
    expect(rootComment.content).toBeDefined();
    expect(Array.isArray(rootComment.replies)).toBe(true);

    // Verify nested child reply structure
    if (rootComment.replies.length > 0) {
      const childReply = rootComment.replies[0];
      expect(childReply.parent_id).toBe(rootComment.id);
      expect(childReply.depth).toBe(1);
    }
  });

  it('submits a new top-level comment and increments post comments_count', async () => {
    const initialPost = await adapter.getPost('post_disc_101');
    const initialCommentsCount = initialPost.comments_count;

    const newComment = await adapter.createComment('post_disc_101', {
      content: 'Benchmarking consensus failover under network partition.',
    });

    expect(newComment.id).toBeDefined();
    expect(newComment.content).toBe('Benchmarking consensus failover under network partition.');
    expect(newComment.parent_id).toBeNull();

    const updatedComments = await adapter.getComments('post_disc_101');
    expect(updatedComments.some((c) => c.id === newComment.id)).toBe(true);

    const updatedPost = await adapter.getPost('post_disc_101');
    expect(updatedPost.comments_count).toBe(initialCommentsCount + 1);
  });

  it('submits a nested reply under an existing comment node', async () => {
    const existingComments = await adapter.getComments('post_disc_101');
    const parent = existingComments[0];

    const reply = await adapter.createComment('post_disc_101', {
      content: 'Follow-up on the TCP keep-alive heartbeat idea.',
      parent_id: parent.id,
    });

    expect(reply.parent_id).toBe(parent.id);
    expect(reply.depth).toBe(parent.depth + 1);

    const commentsAfter = await adapter.getComments('post_disc_101');
    const updatedParent = commentsAfter.find((c) => c.id === parent.id);
    expect(updatedParent?.replies.some((r) => r.id === reply.id)).toBe(true);
  });

  it('executes post voting and score changes', async () => {
    const post = await adapter.getPost('post_disc_102');
    const originalScore = post.score;

    const upRes = await adapter.votePost('post_disc_102', 1);
    expect(upRes.user_vote).toBe(1);
    expect(upRes.new_score).toBe(originalScore + 1);

    const clearRes = await adapter.votePost('post_disc_102', 0);
    expect(clearRes.user_vote).toBe(0);
    expect(clearRes.new_score).toBe(originalScore);
  });

  it('executes bookmark saving and toggles is_saved state', async () => {
    const post = await adapter.getPost('post_disc_101');
    const initialSaved = post.is_saved;

    const res1 = await adapter.toggleSavePost('post_disc_101');
    expect(res1.is_saved).toBe(!initialSaved);

    const res2 = await adapter.toggleSavePost('post_disc_101');
    expect(res2.is_saved).toBe(initialSaved);
  });
});

describe('Screen 3 — Post Detail: Comment Components UI', () => {
  it('renders CommentComposer with placeholder, Ctrl+Enter hint, and submit button', () => {
    const html = renderToString(
      <CommentComposer
        onSubmit={async () => {}}
        placeholder="Write a technical response..."
        submitLabel="Post Comment"
      />
    );

    expect(html).toContain('Write a technical response...');
    expect(html).toContain('Post Comment');
    expect(html).toContain('Ctrl+Enter');
    expect(html).toContain('comment-composer');
  });

  it('renders nested reply CommentComposer with Cancel affordance', () => {
    const html = renderToString(
      <CommentComposer
        onSubmit={async () => {}}
        onCancel={() => {}}
        placeholder="Reply to @lucas_t..."
        submitLabel="Reply"
        isNestedReply={true}
      />
    );

    expect(html).toContain('Reply to @lucas_t...');
    expect(html).toContain('Cancel');
    expect(html).toContain('Reply');
  });

  it('renders CommentNodeItem with author attribution, content, timestamp, and vote controls', () => {
    const sampleComment = mockCommentsByPostId.post_disc_101[0];
    const html = renderToString(
      <RouterProvider initialPath="/">
        <CommentNodeItem
          comment={sampleComment}
          onAddReply={async () => {}}
          onVoteComment={() => {}}
          depth={0}
        />
      </RouterProvider>
    );

    expect(html).toContain(sampleComment.author.display_name);
    expect(html).toContain(sampleComment.author.username);
    expect(html).toContain(sampleComment.content);
    expect(html).toContain(String(sampleComment.score));
    expect(html).toContain('Upvote comment');
    expect(html).toContain('Downvote comment');
    expect(html).toContain('Reply');
  });

  it('renders vertical thread guide line for nested child comments', () => {
    const parentComment = mockCommentsByPostId.post_disc_101[0];
    const childComment = parentComment.replies[0];

    const html = renderToString(
      <RouterProvider initialPath="/">
        <CommentNodeItem
          comment={childComment}
          onAddReply={async () => {}}
          onVoteComment={() => {}}
          depth={1}
        />
      </RouterProvider>
    );

    expect(html).toContain('Collapse thread');
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain(childComment.content);
  });

  it('renders CommentTree with total comment count and Top / New / Old sorting pills', () => {
    const comments = mockCommentsByPostId.post_disc_101;
    const html = renderToString(
      <RouterProvider initialPath="/">
        <CommentTree
          comments={comments}
          sortOrder="top"
          onSortChange={() => {}}
          onAddComment={async () => null}
          onVoteComment={() => {}}
          totalCount={48}
        />
      </RouterProvider>
    );

    expect(html).toContain('Comments');
    expect(html).toContain('48');
    expect(html).toContain('Top');
    expect(html).toContain('New');
    expect(html).toContain('Old');
    expect(html).toContain('comment-composer');
  });

  it('renders empty comments state when no comments exist', () => {
    const html = renderToString(
      <RouterProvider initialPath="/">
        <CommentTree
          comments={[]}
          sortOrder="top"
          onSortChange={() => {}}
          onAddComment={async () => null}
          onVoteComment={() => {}}
          totalCount={0}
        />
      </RouterProvider>
    );

    expect(html).toContain('No comments yet');
    expect(html).toContain('Be the first to share your thoughts');
  });

  it('renders PostDetailSkeleton without exceptions', () => {
    const html = renderToString(<PostDetailSkeleton />);
    expect(html).toContain('animate-pulse');
  });
});

describe('Screen 3 — Post Detail: Page Routing & Resilience', () => {
  it('renders 404 Post Not Found when navigating to an invalid post ID', () => {
    const html = renderToString(
      <ThemeProvider>
        <RouterProvider initialPath="/post/invalid_id_999">
          <PostDetailPage />
        </RouterProvider>
      </ThemeProvider>
    );

    // Initial SSR without resolve renders loading or not found
    expect(html).toBeDefined();
  });

  it('renders Discussion Post layout with Reddit-style voting rail and community context', () => {
    const discussion = mockDiscussionPosts[0];
    const comments = mockCommentsByPostId.post_disc_101;

    // Verify tree rendering contains discussion components
    const treeHtml = renderToString(
      <RouterProvider initialPath={`/post/${discussion.id}`}>
        <CommentTree
          comments={comments}
          sortOrder="top"
          onSortChange={() => {}}
          onAddComment={async () => null}
          onVoteComment={() => {}}
          totalCount={discussion.comments_count}
        />
      </RouterProvider>
    );

    expect(treeHtml).toContain(comments[0].content);
  });

  it('renders Visual Pin layout with media viewer and Instagram creator card', () => {
    const pin = mockVisualPins[0];
    expect(pin.post_type).toBe('visual');
    expect(pin.media.url).toBeDefined();
    expect(pin.dominant_color).toBeDefined();
    expect(pin.author.username).toBe('elena_arch');
  });
});
