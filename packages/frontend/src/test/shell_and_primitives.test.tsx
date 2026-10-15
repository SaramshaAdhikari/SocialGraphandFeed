import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { matchPath, parseQuery, RouterProvider, Route, Routes } from '../router/Router';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { Avatar } from '../components/ui/Avatar';
import { Badge, Pill } from '../components/ui/Badge';
import { Input, SearchBar } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { VoteControl } from '../components/ui/VoteControl';
import { AppLayout } from '../components/layout/AppLayout';

describe('Checkpoint 2.1 — Router & Path Matching', () => {
  it('correctly matches static routes', () => {
    expect(matchPath('/', '/').matched).toBe(true);
    expect(matchPath('/explore', '/explore').matched).toBe(true);
    expect(matchPath('/explore', '/explore?category=systems').matched).toBe(true);
    expect(matchPath('/explore', '/settings').matched).toBe(false);
  });

  it('extracts route parameters correctly', () => {
    const postMatch = matchPath('/post/:postId', '/post/post_123');
    expect(postMatch.matched).toBe(true);
    expect(postMatch.params.postId).toBe('post_123');

    const userMatch = matchPath('/u/:username', '/u/alex_dev');
    expect(userMatch.matched).toBe(true);
    expect(userMatch.params.username).toBe('alex_dev');

    const commMatch = matchPath('/c/:communityId', '/c/distributed-systems');
    expect(commMatch.matched).toBe(true);
    expect(commMatch.params.communityId).toBe('distributed-systems');
  });

  it('correctly parses URL query strings', () => {
    const query = parseQuery('?q=cache+invalidation&type=posts&page=2');
    expect(query.q).toBe('cache invalidation');
    expect(query.type).toBe('posts');
    expect(query.page).toBe('2');
  });

  it('renders matching Route element in RouterProvider', () => {
    const html = renderToString(
      <RouterProvider initialPath="/explore">
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route path="/explore" element={<div>Explore Surface</div>} />
        </Routes>
      </RouterProvider>
    );
    expect(html).toContain('Explore Surface');
    expect(html).not.toContain('Home');
  });
});

describe('Checkpoint 2.1 — Shared UI Primitives', () => {
  it('Button renders variants and handles disabled/loading states', () => {
    const primaryHtml = renderToString(<Button variant="primary">Click Me</Button>);
    expect(primaryHtml).toContain('bg-[#2563EB]');
    expect(primaryHtml).toContain('Click Me');

    const disabledHtml = renderToString(<Button disabled>Disabled</Button>);
    expect(disabledHtml).toContain('disabled');
    expect(disabledHtml).toContain('disabled:opacity-50');

    const loadingHtml = renderToString(<Button isLoading>Loading</Button>);
    expect(loadingHtml).toContain('aria-busy="true"');
    expect(loadingHtml).toContain('animate-spin');
  });

  it('IconButton enforces accessible aria-label and touch hit target', () => {
    const html = renderToString(
      <IconButton aria-label="Bookmark post" active={true}>
        <span>★</span>
      </IconButton>
    );
    expect(html).toContain('aria-label="Bookmark post"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('min-w-[40px]');
    expect(html).toContain('min-h-[40px]');
  });

  it('Avatar renders circular initials fallback and accessible role', () => {
    const html = renderToString(<Avatar alt="Linus Torvalds" size="md" />);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Linus Torvalds"');
    expect(html).toContain('LT');
    expect(html).toContain('rounded-full');
  });

  it('Badge and Pill support active selection and aria-pressed', () => {
    const badgeHtml = renderToString(<Badge variant="brand">Hot</Badge>);
    expect(badgeHtml).toContain('bg-[#EFF6FF]');
    expect(badgeHtml).toContain('text-[#2563EB]');

    const pillHtml = renderToString(
      <Pill selected={true} size="md">
        Architecture
      </Pill>
    );
    expect(pillHtml).toContain('aria-pressed="true"');
    expect(pillHtml).toContain('bg-[#0F172A]');
    expect(pillHtml).toContain('text-white');
  });

  it('Input and SearchBar render labels, placeholder and clear trigger', () => {
    const inputHtml = renderToString(
      <Input label="Username" placeholder="Enter username" error="Required field" />
    );
    expect(inputHtml).toContain('Username');
    expect(inputHtml).toContain('Required field');
    expect(inputHtml).toContain('border-red-500');

    const searchHtml = renderToString(
      <SearchBar value="TAO cache" onChange={() => {}} />
    );
    expect(searchHtml).toContain('aria-label="Search across the platform"');
    expect(searchHtml).toContain('value="TAO cache"');
    expect(searchHtml).toContain('aria-label="Clear search query"');
  });

  it('VoteControl renders vertical and horizontal variants with accessibility', () => {
    const verticalHtml = renderToString(
      <VoteControl
        score={342}
        userVote={1}
        onVote={() => {}}
        orientation="vertical"
      />
    );
    expect(verticalHtml).toContain('role="group"');
    expect(verticalHtml).toContain('aria-label="Upvote"');
    expect(verticalHtml).toContain('aria-pressed="true"');
    expect(verticalHtml).toContain('342');
    expect(verticalHtml).toContain('text-[#F97316]'); // Ember Orange on upvote

    const horizontalHtml = renderToString(
      <VoteControl
        score={1200}
        userVote={-1}
        onVote={() => {}}
        orientation="horizontal"
      />
    );
    expect(horizontalHtml).toContain('aria-label="Downvote"');
    expect(horizontalHtml).toContain('aria-pressed="true"');
    expect(horizontalHtml).toContain('1.2k');
    expect(horizontalHtml).toContain('text-[#6366F1]'); // Periwinkle Indigo on downvote
  });

  it('Skeleton renders pulse animation and style dimensions', () => {
    const html = renderToString(<Skeleton variant="media" aspectRatio="16/9" />);
    expect(html).toContain('animate-pulse');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('aspect-ratio:16/9');
  });
});

describe('Checkpoint 2.1 — Application Shell Layout', () => {
  it('AppLayout renders navigation, header, content and bottom bar', () => {
    const html = renderToString(
      <RouterProvider initialPath="/">
        <AppLayout showRightRail={true}>
          <div data-testid="main-content">Home Feed Content</div>
        </AppLayout>
      </RouterProvider>
    );

    // Sidebar navigation links
    expect(html).toContain('Home Feed');
    expect(html).toContain('Discover');
    expect(html).toContain('Communities');
    expect(html).toContain('Diagnostics');

    // Right rail content
    expect(html).toContain('Recommended Hubs');
    expect(html).toContain('Trending Discussions');

    // Main content
    expect(html).toContain('Home Feed Content');

    // Overflow protection
    expect(html).toContain('overflow-x-hidden');
  });
});
