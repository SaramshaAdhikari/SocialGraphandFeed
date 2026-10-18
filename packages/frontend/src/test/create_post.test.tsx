import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MockAdapter } from '../api/mock/MockAdapter';
import { ApiClientError } from '../api/client';
import { mockCommunities } from '../api/mock/fixtures';
import {
  PostTypeSelector,
  MarkdownEditor,
  VisualPinUploader,
  CommunitySelect,
  TagInput,
} from '../components/composer';
import { CreatePostPage } from '../pages/CreatePostPage';
import { RouterProvider } from '../router/Router';
import { ThemeProvider } from '../theme/ThemeContext';
import { SidebarNav } from '../components/layout/SidebarNav';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';

describe('Screen 7 — Create Post: API Contracts & In-Memory Persistence', () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter({ simulatedLatencyMs: 0 });
  });

  it('1. lists available communities via getCommunities()', async () => {
    const communities = await adapter.getCommunities();
    expect(communities).toBeInstanceOf(Array);
    expect(communities.length).toBeGreaterThan(0);
    expect(communities.some((c) => c.slug === 'systems')).toBe(true);
    expect(communities.some((c) => c.slug === 'algorithms')).toBe(true);
  });

  it('2. validates required fields on discussion creation and throws VALIDATION_ERROR on missing content', async () => {
    // Missing title
    await expect(
      adapter.createPost({
        post_type: 'discussion',
        title: '',
        content: 'Valid content here',
      })
    ).rejects.toThrow(ApiClientError);

    // Title too short (< 3 chars)
    await expect(
      adapter.createPost({
        post_type: 'discussion',
        title: 'ab',
        content: 'Valid content here',
      })
    ).rejects.toThrow(/Discussion title must be at least 3 characters/);

    // Missing body content
    await expect(
      adapter.createPost({
        post_type: 'discussion',
        title: 'Valid Discussion Title',
        content: '',
      })
    ).rejects.toThrow(/Discussion body content is required/);
  });

  it('3. validates required fields on visual pin creation and throws VALIDATION_ERROR on missing media', async () => {
    // Missing media
    await expect(
      adapter.createPost({
        post_type: 'visual',
        title: 'Valid Pin Title',
      })
    ).rejects.toThrow(/Visual pin requires a media URL/);

    // Empty media URL
    await expect(
      adapter.createPost({
        post_type: 'visual',
        title: 'Valid Pin Title',
        media: [{ id: 'm1', url: '', aspect_ratio: 1.0 }],
      })
    ).rejects.toThrow(/Visual pin requires a media URL/);
  });

  it('4. successfully creates a discussion post with author alex_dev and persists it in-memory', async () => {
    const created = await adapter.createPost({
      post_type: 'discussion',
      title: 'Evaluating Memory Reclamation in Multi-Tenant RocksDB Clusters',
      content: 'Here are benchmark results on memory reclamation and block cache fragmentation under 50k QPS.',
      community_id: 'c_systems',
      tags: ['systems', 'rocksdb', 'benchmarks'],
      flair: 'Architecture',
    });

    expect(created.id).toMatch(/^post_disc_/);
    expect(created.post_type).toBe('discussion');
    expect(created.title).toBe('Evaluating Memory Reclamation in Multi-Tenant RocksDB Clusters');
    expect(created.author.username).toBe('alex_dev');
    expect(created.score).toBe(1);
    expect(created.user_vote).toBe(1);
    expect(created.comments_count).toBe(0);
    expect(created.community_id).toBe('c_systems');
    expect(created.community_slug).toBe('systems');

    // Verify it is retrievable by ID
    const retrieved = await adapter.getPost(created.id);
    expect(retrieved.id).toBe(created.id);
    expect(retrieved.title).toBe(created.title);

    // Verify it appears in global feed at top when sorted by newest
    const feed = await adapter.getFeed({ sort: 'new', limit: 10 });
    expect(feed.data[0].id).toBe(created.id);

    // Verify it appears in community feed
    const commFeed = await adapter.getCommunityFeed('systems');
    expect(commFeed.data.some((p) => p.id === created.id)).toBe(true);

    // Verify it appears in author profile posts
    const userPosts = await adapter.getUserPosts('alex_dev');
    expect(userPosts.data.some((p) => p.id === created.id)).toBe(true);
  });

  it('5. successfully creates a visual pin with aspect ratio and persists it in-memory', async () => {
    const created = await adapter.createPost({
      post_type: 'visual',
      title: 'Custom High-Density 2U Immersion Chassis',
      caption: 'Direct-to-chip dual-phase dielectric cooling with manifold telemetry.',
      community_id: 'c_hardware',
      tags: ['hardware', 'datacenter'],
      media: [
        {
          id: 'm_test_1',
          url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
          aspect_ratio: 1.333,
          alt_text: 'Immersion chassis test photo',
        },
      ],
    });

    expect(created.id).toMatch(/^pin_vis_/);
    expect(created.post_type).toBe('visual');
    expect(created.author.username).toBe('alex_dev');
    expect((created as any).media.url).toContain('images.unsplash.com');
    expect((created as any).media.aspect_ratio).toBe(1.333);

    // Verify retrieval by ID
    const retrieved = await adapter.getPost(created.id);
    expect(retrieved.id).toBe(created.id);

    // Verify it appears in discovery feed
    const discovery = await adapter.getDiscovery({ limit: 10 });
    expect(discovery.data.some((p) => p.id === created.id)).toBe(true);
  });

  it('6. handles simulated failure and preserves data integrity without corrupted state', async () => {
    adapter.simulateFailure('/api/v1/posts', {
      type: 'https://socialgraph.dev/errors/server',
      title: 'Database Timeout',
      status: 500,
      detail: 'Simulated connection failure during post commit',
      code: 'DB_TIMEOUT',
      timestamp: new Date().toISOString(),
    });

    await expect(
      adapter.createPost({
        post_type: 'discussion',
        title: 'Title that fails',
        content: 'Content that fails',
      })
    ).rejects.toThrow(ApiClientError);

    // Clear failure and verify normal operation resumes
    adapter.clearSimulatedFailures();
    const successPost = await adapter.createPost({
      post_type: 'discussion',
      title: 'Resumed title after recovery',
      content: 'Resumed content after recovery',
    });
    expect(successPost.id).toBeDefined();
  });
});

describe('Screen 7 — Create Post: UI Components & Authoring Workflow', () => {
  it('7. PostTypeSelector renders discussion and visual tabs with active states', () => {
    const htmlDiscussion = renderToString(
      <PostTypeSelector activeType="discussion" onChange={() => {}} />
    );
    expect(htmlDiscussion).toContain('Discussion Post');
    expect(htmlDiscussion).toContain('Visual Pin');
    expect(htmlDiscussion).toContain('Reddit Style');
    expect(htmlDiscussion).toContain('Pinterest Style');
    expect(htmlDiscussion).toContain('aria-selected="true"');

    const htmlVisual = renderToString(
      <PostTypeSelector activeType="visual" onChange={() => {}} />
    );
    expect(htmlVisual).toContain('Visual Pin');
    expect(htmlVisual).toContain('aria-selected="true"');
  });

  it('8. MarkdownEditor renders formatting toolbar, character count, and write/preview tabs', () => {
    const markdownContent = '# Engineering RFC\n\n**Bold claim** and *italic note*.\n\n```typescript\nconst qps = 50000;\n```\n\n> Quote block\n\n- Point 1\n- Point 2';

    const html = renderToString(
      <MarkdownEditor
        value={markdownContent}
        onChange={() => {}}
      />
    );

    // Toolbar buttons
    expect(html).toContain('aria-label="Bold"');
    expect(html).toContain('aria-label="Italic"');
    expect(html).toContain('aria-label="Heading"');
    expect(html).toContain('aria-label="Inline Code"');
    expect(html).toContain('aria-label="Code Block"');
    expect(html).toContain('aria-label="Quote"');
    expect(html).toContain('aria-label="Bullet List"');
    expect(html).toContain('aria-label="Link"');

    // Tabs
    expect(html).toContain('Write');
    expect(html).toContain('Preview');
    expect(html).toContain('Markdown syntax supported');
  });

  it('9. VisualPinUploader renders image URL input, browse file action, and preview', () => {
    const htmlEmpty = renderToString(
      <VisualPinUploader
        imageUrl=""
        onImageUrlChange={() => {}}
        aspectRatio={1.0}
        onAspectRatioChange={() => {}}
        imageAlt=""
        onImageAltChange={() => {}}
        destinationUrl=""
        onDestinationUrlChange={() => {}}
        caption=""
        onCaptionChange={() => {}}
        isLocalFile={false}
        onLocalFileSelect={() => {}}
        onClearImage={() => {}}
        imageError={false}
        onImageErrorChange={() => {}}
        imageLoaded={false}
        onImageLoadedChange={() => {}}
      />
    );

    expect(htmlEmpty).toContain('Visual Media');
    expect(htmlEmpty).toContain('Browse File');
    expect(htmlEmpty).toContain('Accessibility Alt Text');
    expect(htmlEmpty).toContain('Destination Link');

    // Render with preview URL and loaded image
    const htmlWithPreview = renderToString(
      <VisualPinUploader
        imageUrl="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800"
        onImageUrlChange={() => {}}
        aspectRatio={1.333}
        onAspectRatioChange={() => {}}
        imageAlt="Server blades"
        onImageAltChange={() => {}}
        destinationUrl="https://example.com"
        onDestinationUrlChange={() => {}}
        caption="Manifold cooling"
        onCaptionChange={() => {}}
        isLocalFile={true}
        onLocalFileSelect={() => {}}
        onClearImage={() => {}}
        imageError={false}
        onImageErrorChange={() => {}}
        imageLoaded={true}
        onImageLoadedChange={() => {}}
      />
    );

    expect(htmlWithPreview).toContain('visual-pin-preview-card');
    expect(htmlWithPreview).toContain('Natural Aspect Ratio Preview');
    expect(htmlWithPreview).toContain('1.333 : 1');
    expect(htmlWithPreview).toContain('Local browser preview loaded');
  });

  it('10. VisualPinUploader shows error alert when image fails to load', () => {
    const html = renderToString(
      <VisualPinUploader
        imageUrl="https://invalid-domain-xyz123.com/broken.jpg"
        onImageUrlChange={() => {}}
        aspectRatio={1.0}
        onAspectRatioChange={() => {}}
        imageAlt=""
        onImageAltChange={() => {}}
        destinationUrl=""
        onDestinationUrlChange={() => {}}
        caption=""
        onCaptionChange={() => {}}
        isLocalFile={false}
        onLocalFileSelect={() => {}}
        onClearImage={() => {}}
        imageError={true}
        onImageErrorChange={() => {}}
        imageLoaded={false}
        onImageLoadedChange={() => {}}
      />
    );

    expect(html).toContain('image-error-alert');
    expect(html).toContain('Could not load image from this URL');
  });

  it('11. CommunitySelect renders community dropdown options', () => {
    const html = renderToString(
      <CommunitySelect
        communities={Object.values(mockCommunities)}
        selectedCommunityId="c_systems"
        onSelect={() => {}}
      />
    );

    expect(html).toContain('community-select');
    expect(html).toContain('Distributed Systems');
    expect(html).toContain('c/systems');
    expect(html).toContain('c/algorithms');
    expect(html).toContain('Post to personal profile only');
  });

  it('12. TagInput renders tag pills, removal triggers, and suggestions', () => {
    const html = renderToString(
      <TagInput
        tags={['systems', 'performance']}
        onAddTag={() => {}}
        onRemoveTag={() => {}}
      />
    );

    expect(html).toContain('#systems');
    expect(html).toContain('#performance');
    expect(html).toContain('Remove tag systems');
    expect(html).toContain('Remove tag performance');
    expect(html).toContain('Suggestions:');
  });
});

describe('Screen 7 — Create Post: Page & Navigation Integration', () => {
  it('13. CreatePostPage renders full composer experience with all sections', () => {
    const html = renderToString(
      <ThemeProvider>
        <RouterProvider initialPath="/create">
          <CreatePostPage />
        </RouterProvider>
      </ThemeProvider>
    );

    expect(html).toContain('create-post-page');
    expect(html).toContain('Create Post');
    expect(html).toContain('Discussion Post');
    expect(html).toContain('Visual Pin');
    expect(html).toContain('Discussion Title');
    expect(html).toContain('Discussion Body');
    expect(html).toContain('Select Destination Community');
    expect(html).toContain('Publish Discussion');
    expect(html).toContain('In-Memory Demonstration Persistence');
  });

  it('14. SidebarNav and MobileBottomNav contain active navigation entry points for /create', () => {
    const sidebarHtml = renderToString(
      <RouterProvider initialPath="/create">
        <SidebarNav />
      </RouterProvider>
    );
    expect(sidebarHtml).toContain('href="/create"');
    expect(sidebarHtml).toContain('Create');

    const mobileHtml = renderToString(
      <RouterProvider initialPath="/create">
        <MobileBottomNav />
      </RouterProvider>
    );
    expect(mobileHtml).toContain('href="/create"');
    expect(mobileHtml).toContain('aria-label="Create"');
  });
});
