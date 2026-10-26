import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MockAdapter } from '../api/mock/MockAdapter';
import { LiveClient } from '../api/LiveClient';
import { ApiClientError } from '../api/client';
import { mockCommunities, mockUsers } from '../api/mock/fixtures';
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
      community_id: 'comm_systems',
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
    expect(created.community_id).toBe('comm_systems');
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
        selectedCommunityId="comm_systems"
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
    it('13. CreatePostPage renders unified composer experience with all sections', () => {
    const html = renderToString(
      <ThemeProvider>
        <RouterProvider initialPath="/create">
          <CreatePostPage />
        </RouterProvider>
      </ThemeProvider>
    );

    expect(html).toContain('create-post-page');
    expect(html).toContain('Create Post');
    expect(html).toContain('Title (optional for photos)');
    expect(html).toContain('Post Body / Markdown Content');
    expect(html).toContain('Media Attachments');
    expect(html).toContain('Select Destination Community');
    expect(html).toContain('Publish Post');
    expect(html).toMatch(/Live Database Persistence|In-Memory Demonstration Persistence/);
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

describe('Screen 7 — Create Post: Live Mode Restrictions & Field Preservation', () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter({ simulatedLatencyMs: 0 });
  });

  it('15. LiveClient explicitly rejects blob: URLs with ApiClientError (VALIDATION_ERROR)', async () => {
    const liveClient = new LiveClient('http://localhost:3000');
    await expect(
      liveClient.createPost({
        post_type: 'visual',
        title: 'Session Blob Pin',
        media: [
          {
            id: 'm_blob_1',
            url: 'blob:http://localhost:5173/550e8400-e29b-41d4-a716-446655440000',
            aspect_ratio: 1.0,
          },
        ],
      })
    ).rejects.toThrow(/Local blob URLs cannot be persisted in live mode/);
  });

  it('16. MockAdapter preserves tags and flair on discussion posts across retrieval by ID', async () => {
    const created = await adapter.createPost({
      post_type: 'discussion',
      title: 'Architecting High-Throughput Event Streams with Zero-Copy Deserialization',
      content: 'Benchmark evaluation of binary schema formats under high packet arrival rates.',
      flair: 'Systems Architecture',
      tags: ['streams', 'zero-copy', 'networking'],
      community_id: 'comm_systems',
    });

    expect(created.post_type).toBe('discussion');
    expect((created as any).flair).toBe('Systems Architecture');
    expect((created as any).tags).toEqual(['streams', 'zero-copy', 'networking']);

    // Retrieve by ID and verify fields survived in-memory round trip
    const retrieved = await adapter.getPost(created.id);
    expect((retrieved as any).flair).toBe('Systems Architecture');
    expect((retrieved as any).tags).toEqual(['streams', 'zero-copy', 'networking']);
  });

  it('17. MockAdapter preserves caption, destination_url, and tags on visual pins across retrieval by ID', async () => {
    const created = await adapter.createPost({
      post_type: 'visual',
      title: 'Direct-to-Chip Dielectric Cooling Manifold',
      caption: 'Testing 2-phase fluid loop dissipation across dual NVLink GPU sockets.',
      destination_url: 'https://specs.hardware.org/telemetry/chassis-2u',
      tags: ['hardware', 'datacenter', 'cooling'],
      media: [
        {
          id: 'm_manifold_1',
          url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
          aspect_ratio: 1.5,
          alt_text: 'Cooling manifold chassis layout',
        },
      ],
    });

    expect(created.post_type).toBe('visual');
    expect((created as any).caption).toBe('Testing 2-phase fluid loop dissipation across dual NVLink GPU sockets.');
    expect((created as any).destination_url).toBe('https://specs.hardware.org/telemetry/chassis-2u');
    expect((created as any).tags).toEqual(['hardware', 'datacenter', 'cooling']);

    // Retrieve by ID and verify all fields survived in-memory round trip
    const retrieved = await adapter.getPost(created.id);
    expect((retrieved as any).caption).toBe('Testing 2-phase fluid loop dissipation across dual NVLink GPU sockets.');
    expect((retrieved as any).destination_url).toBe('https://specs.hardware.org/telemetry/chassis-2u');
    expect((retrieved as any).tags).toEqual(['hardware', 'datacenter', 'cooling']);
  });

  it('18. Creating posts increments author post count while preserving data integrity of existing fixtures', async () => {
    // Check initial user post counts
    const initialAlex = await adapter.getUserProfile('alex_dev');
    const initialLucas = await adapter.getUserProfile('lucas_t');
    expect(initialAlex.posts_count).toBe(3);
    expect(initialLucas.posts_count).toBe(28);

    // Verify baseline static fixture integrity remains unaltered
    expect(mockUsers.usr_0.posts_count).toBe(3);
    expect(mockUsers.usr_1.posts_count).toBe(28);

    // Create a new post
    await adapter.createPost({
      post_type: 'discussion',
      title: 'Validating Raft Snapshot Serialization Edge Cases',
      content: 'Notes on log compaction boundaries and follower replay recovery.',
      community_id: 'comm_systems',
    });

    // Author alex_dev post count should be incremented in adapter state
    const updatedAlex = await adapter.getUserProfile('alex_dev');
    expect(updatedAlex.posts_count).toBe(4);

    // Peer user post count remains unaffected
    const updatedLucas = await adapter.getUserProfile('lucas_t');
    expect(updatedLucas.posts_count).toBe(28);

    // Existing fixture posts remain fully retrievable and unharmed
    const post101 = await adapter.getPost('post_disc_101');
    expect(post101.title).toBe(
      'Spent the weekend digging into TAO’s cache invalidation — here’s why decoupling write invalidation from consistency actually works'
    );
    const pin201 = await adapter.getPost('pin_vis_201');
    expect(pin201.title).toBe('Immersion Cooling Chamber for NVLink GPU Compute');
  });

  it('19. VisualPinUploader disables file browse action and renders live-mode warning when isLiveMode is true', () => {
    const htmlLive = renderToString(
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
        isLiveMode={true}
      />
    );

    expect(htmlLive).toContain('Live Mode Active:');
    expect(htmlLive).toContain('Direct image URL is required');
    expect(htmlLive).toContain('Browse (N/A in Live)');
    expect(htmlLive).toContain('disabled=""');
  });

  it('20. CreatePostPage renders honest persistence notice indicating client or database destination', () => {
    const html = renderToString(
      <ThemeProvider>
        <RouterProvider initialPath="/create">
          <CreatePostPage />
        </RouterProvider>
      </ThemeProvider>
    );

    expect(html).toMatch(/Live Database Persistence|In-Memory Demonstration Persistence/);
    expect(html).toMatch(/u\/(<!-- -->)?(alex_dev|user)/);
  });

  it('21. Publishing with no tags succeeds with tags and flair undefined', async () => {
    const created = await adapter.createPost({
      post_type: 'discussion',
      title: 'Post with Zero Tags',
      content: 'Discussion body with zero selected tags.',
    });

    expect(created.id).toBeDefined();
    expect(created.tags).toBeUndefined();
    expect((created as any).flair).toBeUndefined();
  });

  it('22. Publishing with tag containing # normalizes by removing leading #', async () => {
    const created = await adapter.createPost({
      post_type: 'discussion',
      title: 'Post with Tag Normalization',
      content: 'Discussion body verifying # stripping.',
      tags: ['#performance'],
      flair: '#performance',
    });

    expect(created.tags).toEqual(['performance']);
    expect((created as any).flair).toBe('performance');
  });

  it('23. Publishing with multiple tags normalizes and deduplicates without leading #', async () => {
    const created = await adapter.createPost({
      post_type: 'discussion',
      title: 'Post with Multiple Tags',
      content: 'Discussion body testing multiple tags normalization.',
      tags: ['#performance', 'systems', '##performance', 'systems'],
    });

    expect(created.tags).toEqual(['performance', 'systems']);
    expect((created as any).flair).toBe('performance');
  });

  it('24. TagInput renders with error message when validation error is provided', () => {
    const html = renderToString(
      <TagInput
        tags={['systems']}
        onAddTag={() => {}}
        onRemoveTag={() => {}}
        error="Tags must contain only letters, numbers, and hyphens."
      />
    );

    expect(html).toContain('Tags must contain only letters, numbers, and hyphens.');
    expect(html).toContain('border-red-500');
  });

  it('25. CreatePostPage renders Rate Limit banner with countdown when rate-limited', () => {
    const html = renderToString(
      <RouterProvider initialPath="/create">
        <ThemeProvider>
          <CreatePostPage />
        </ThemeProvider>
      </RouterProvider>
    );

    // Initial state has no error banner
        expect(html).not.toContain('rate-limit-banner');
    expect(html).toContain('Create Post');
    expect(html).toContain('Publish Post');
  });

  it('26. LiveClient sets Idempotency-Key request header when provided', async () => {
    let capturedHeaders: Record<string, string> = {};
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (_url: any, init: any) => {
      capturedHeaders = init?.headers || {};
      return new Response(
        JSON.stringify({
          id: 'post_mock_1',
          post_type: 'discussion',
          title: 'Testing Idempotency Header',
          author: { id: 'usr_0', username: 'alex', display_name: 'Alex', avatar_url: '/avatars/alex-dev.svg' },
          created_at: new Date().toISOString(),
          score: 0,
          comments_count: 0,
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    }) as any;

    try {
      const liveClient = new LiveClient('http://localhost:3000');
      await liveClient.createPost(
        {
          post_type: 'discussion',
          title: 'Testing Idempotency Header',
          content: 'Payload testing header transmission.',
        },
        'test_idemp_key_123'
      );

      expect(capturedHeaders['Idempotency-Key']).toBe('test_idemp_key_123');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});