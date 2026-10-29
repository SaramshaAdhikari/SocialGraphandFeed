import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { PostActionMenu } from '../components/feed/PostActionMenu';
import { RouterProvider } from '../router/Router';
import { ThemeProvider } from '../theme/ThemeContext';
import { AuthProvider, type AuthUser } from '../auth/AuthContext';
import { MockAdapter } from '../api/mock/MockAdapter';
import type { DiscussionPostCard } from '@socialgraph/shared';

const testAuthor: AuthUser = {
  id: 'usr_author_1',
  username: 'author_dev',
  display_name: 'Author Dev',
  avatar_url: '/avatars/alex-dev.svg',
  role: 'user',
};

const otherUser: AuthUser = {
  id: 'usr_other_2',
  username: 'other_dev',
  display_name: 'Other Dev',
  avatar_url: '/avatars/alex-dev.svg',
  role: 'user',
};

const samplePost: DiscussionPostCard = {
  id: 'post_sample_123',
  post_type: 'discussion',
  title: 'Test Post Title for Action Menu',
  content: 'Prose content of the post to be edited.',
  author: {
    id: 'usr_author_1',
    username: 'author_dev',
    display_name: 'Author Dev',
    avatar_url: '/avatars/alex-dev.svg',
    is_verified: true,
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  score: 10,
  user_vote: 0,
  comments_count: 2,
  is_saved: false,
};

function renderWithUser(ui: React.ReactElement, user: AuthUser | null) {
  return renderToString(
    <AuthProvider initialUser={user}>
      <ThemeProvider>
        <RouterProvider initialPath="/">{ui}</RouterProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

describe('Phase E4: Post Editing & Deletion Action Menu', () => {
  let mockApi: MockAdapter;

  beforeEach(() => {
    mockApi = new MockAdapter({ simulatedLatencyMs: 0 });
  });

  it('renders PostActionMenu button when logged-in viewer is the author', () => {
    const html = renderWithUser(<PostActionMenu post={samplePost} />, testAuthor);
    expect(html).toContain('data-testid="post-options-menu-post_sample_123"');
    expect(html).toContain('aria-label="Post actions"');
  });

  it('does NOT render PostActionMenu when logged-in viewer is NOT the author', () => {
    const html = renderWithUser(<PostActionMenu post={samplePost} />, otherUser);
    expect(html).not.toContain('data-testid="post-options-menu-post_sample_123"');
    expect(html).toBe('');
  });

  it('does NOT render PostActionMenu when viewer is unauthenticated', () => {
    const html = renderWithUser(<PostActionMenu post={samplePost} />, null);
    expect(html).not.toContain('data-testid="post-options-menu-post_sample_123"');
    expect(html).toBe('');
  });

  it('renders PostActionMenu for admin users even if not author', () => {
    const adminUser: AuthUser = { ...otherUser, role: 'admin' };
    const html = renderWithUser(<PostActionMenu post={samplePost} />, adminUser);
    expect(html).toContain('data-testid="post-options-menu-post_sample_123"');
  });

  it('MockAdapter supports editPost and deletePost', async () => {
    const feed = await mockApi.getFeed();
    const firstPost = feed.data[0];
    const edited = await mockApi.editPost(firstPost.id, { title: 'Updated Mock Title' });
    expect(edited.title).toBe('Updated Mock Title');

    const del = await mockApi.deletePost(firstPost.id);
    expect(del.success).toBe(true);
    expect(del.post_id).toBe(firstPost.id);
  });
});
