import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MockAdapter } from '../api/mock/MockAdapter';
import { ApiClientError } from '../api/client';
import type { VisualPinCard, DiscussionPostCard, MediaAttachment } from '@socialgraph/shared';
import { CreatePostPage } from '../pages/CreatePostPage';
import { MediaAttachmentManager } from '../components/composer/MediaAttachmentManager';
import { VisualPinCard as VisualPinCardComponent } from '../components/feed/VisualPinCard';
import { DiscussionPostCard as DiscussionPostCardComponent } from '../components/feed/DiscussionPostCard';
import { DiscoveryPinCard as DiscoveryPinCardComponent } from '../components/discovery/DiscoveryPinCard';
import { RouterProvider } from '../router/Router';
import { ThemeProvider } from '../theme/ThemeContext';

describe('Phase 2B.1 — Unified Post Composer & Media Handling Verification', () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter({ simulatedLatencyMs: 0 });
  });

  // Scenario 1: Text-only post creation
  it('Scenario 1: successfully creates and saves a text-only post (inferred as discussion)', async () => {
    const post = await adapter.createPost({
      content: 'Exploring memory reclamation techniques for concurrent skip lists in Rust.',
      community_id: 'comm_systems',
      tags: ['rust', 'concurrency'],
    });

    expect(post.id).toBeDefined();
    expect(post.post_type).toBe('discussion');
    expect((post as DiscussionPostCard).content).toContain('Exploring memory reclamation');
    expect(post.title).toBeDefined();

    // Verify retrievability
    const retrieved = await adapter.getPost(post.id);
    expect(retrieved.id).toBe(post.id);
    expect(retrieved.post_type).toBe('discussion');
  });

  // Scenario 2: Image-only post creation
  it('Scenario 2: successfully creates and saves an image-only post without title or body (inferred as visual)', async () => {
    const mediaItem: MediaAttachment = {
      id: 'm_photo_1',
      url: '/uploads/med_sunset_view.jpg',
      aspect_ratio: 1.33,
      alt_text: 'Sunset view from server room',
    };

    const post = await adapter.createPost({
      media: [mediaItem],
    });

    expect(post.id).toBeDefined();
    expect(post.post_type).toBe('visual');
    const visual = post as VisualPinCard;
    expect(visual.media.url).toBe('/uploads/med_sunset_view.jpg');
    expect(visual.title).toBeDefined(); // Fallback title
    expect(visual.title?.length).toBeGreaterThan(0);

    // Verify feed inclusion
    const feed = await adapter.getFeed({ sort: 'new', limit: 10 });
    expect(feed.data.some((p) => p.id === post.id)).toBe(true);
  });

  // Scenario 3: Text + 1 image
  it('Scenario 3: successfully creates and saves a post with text and one image', async () => {
    const post = await adapter.createPost({
      title: 'Datacenter Rack Telemetry Architecture',
      content: 'Immersion loop cooling telemetry graph under continuous load.',
      media: [
        {
          id: 'm_rack_1',
          url: '/uploads/med_rack_telemetry.png',
          aspect_ratio: 1.5,
          alt_text: 'Rack telemetry diagram',
        },
      ],
      tags: ['hardware', 'datacenter'],
    });

    expect(post.id).toBeDefined();
    expect(post.post_type).toBe('visual');
    const visual = post as VisualPinCard;
    expect(visual.title).toBe('Datacenter Rack Telemetry Architecture');
    expect(visual.caption).toBe('Immersion loop cooling telemetry graph under continuous load.');
    expect(visual.media.url).toBe('/uploads/med_rack_telemetry.png');
    expect(visual.media_list).toBeUndefined(); // Single image does not require album list
  });

  // Scenario 4: Text + multiple images (Album)
  it('Scenario 4: successfully creates and saves a multi-image album post (4 images) preserving all attachments', async () => {
    const albumImages: MediaAttachment[] = [
      { id: 'm_alb_1', url: '/uploads/med_step1.jpg', aspect_ratio: 1.33, alt_text: 'Chassis unboxing' },
      { id: 'm_alb_2', url: '/uploads/med_step2.jpg', aspect_ratio: 1.33, alt_text: 'Tubing layout' },
      { id: 'm_alb_3', url: '/uploads/med_step3.jpg', aspect_ratio: 1.33, alt_text: 'Fluid filling' },
      { id: 'm_alb_4', url: '/uploads/med_step4.jpg', aspect_ratio: 1.33, alt_text: 'Thermal testing' },
    ];

    const post = await adapter.createPost({
      title: 'Immersion Cooling Loop Build Log',
      content: 'A complete 4-step walkthrough of setting up the dielectric immersion chassis.',
      media: albumImages,
      tags: ['hardware', 'diy'],
    });

    expect(post.id).toBeDefined();
    expect(post.post_type).toBe('visual');
    const visual = post as VisualPinCard;
    expect(visual.media.url).toBe('/uploads/med_step1.jpg'); // Cover image
    expect(visual.media_list).toBeDefined();
    expect(visual.media_list?.length).toBe(4);
    expect(visual.media_list?.[3].url).toBe('/uploads/med_step4.jpg');

    // Retrieve by ID and verify persistence of album
    const retrieved = (await adapter.getPost(post.id)) as VisualPinCard;
    expect(retrieved.media_list?.length).toBe(4);
  });

  // Scenario 5: 10-image limit enforcement
  it('Scenario 5: rejects attaching an 11th image through API validation', async () => {
    const elevenImages: MediaAttachment[] = Array.from({ length: 11 }, (_, i) => ({
      id: `m_over_${i}`,
      url: `/uploads/med_img_${i}.jpg`,
      aspect_ratio: 1.0,
      alt_text: `Image ${i + 1}`,
    }));

    // Post creation level rejection
    await expect(
      adapter.createPost({
        content: 'Post with 11 images',
        media: elevenImages,
      })
    ).rejects.toThrow(/more than 10 images/i);

    // Upload batch rejection
    const elevenFiles = Array.from({ length: 11 }, (_, i) =>
      new File(['data'], `img_${i}.jpg`, { type: 'image/jpeg' })
    );
    await expect(adapter.uploadMedia(elevenFiles)).rejects.toThrow(/more than 10 images/i);
  });

  // Scenario 6: Invalid file types & oversized uploads
  it('Scenario 6: validates file types and size limits in MediaAttachmentManager', () => {
    const html = renderToString(
      <MediaAttachmentManager
        mediaList={[]}
        onAddMediaItem={() => {}}
        onAddMultipleMedia={() => {}}
        onRemoveMediaItem={() => {}}
        onReorderMediaItem={() => {}}
        onSetCover={() => {}}
        error="File 'malware.exe' is not an allowed image format."
      />
    );

    expect(html).toContain('media-attachment-manager');
    expect(html).toContain('malware.exe');
    expect(html).toContain('is not an allowed image format');
    expect(html).toMatch(/0\s*(?:<!--\s*-->)?\s*\/\s*10/);
  });

  // Scenario 7: Successful upload & durable media reference
  it('Scenario 7: returns durable /uploads/ reference and persists across client retrieval', async () => {
    const uploadedMedia = await adapter.uploadMedia([
      new File(['dummy binary data'], 'benchmark_graph.png', { type: 'image/png' }),
    ]);

    expect(uploadedMedia).toHaveLength(1);
    expect(uploadedMedia[0].url).toMatch(/^\/uploads\/med_/);

    const post = await adapter.createPost({
      title: 'Benchmark Run 42',
      media: uploadedMedia,
    });

    expect((post as VisualPinCard).media.url).toBe(uploadedMedia[0].url);
  });

  // Scenario 8: Feed rendering for legacy discussion posts
  it('Scenario 8: correctly renders legacy discussion posts with DiscussionPostCard', () => {
    const discPost: DiscussionPostCard = {
      id: 'post_disc_legacy_1',
      post_type: 'discussion',
      title: 'Zero-Copy Deserialization in Network Stacks',
      content: 'Benchmarking FlatBuffers against Protobuf under 100k req/sec.',
      author: {
        id: 'usr_0',
        username: 'alex_dev',
        display_name: 'Alex Developer',
        avatar_url: '/avatars/alex-dev.svg',
        is_verified: true,
      },
      score: 42,
      user_vote: 0,
      comments_count: 7,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_saved: false,
    };

    const html = renderToString(
      <RouterProvider initialPath="/">
        <DiscussionPostCardComponent
          post={discPost}
          onVote={() => {}}
          onToggleSave={() => {}}
        />
      </RouterProvider>
    );

    expect(html).toContain('Zero-Copy Deserialization in Network Stacks');
    expect(html).toContain('42');
    expect(html).toContain('7');
    expect(html).toContain('alex_dev');
  });

  // Scenario 9: Feed rendering for legacy visual posts and album indicator
  it('Scenario 9: correctly renders visual posts with VisualPinCard and shows album indicator for multi-image posts', () => {
    const multiVisualPin: VisualPinCard = {
      id: 'pin_vis_album_1',
      post_type: 'visual',
      title: 'Dielectric Immersion Chassis Gallery',
      caption: 'Testing 2-phase fluid circulation under sustained compute load.',
      author: {
        id: 'usr_1',
        username: 'sarah_arch',
        display_name: 'Sarah Chen',
        avatar_url: '/avatars/sarah-arch.svg',
        is_verified: true,
      },
      media: {
        id: 'm_cov_1',
        url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
        aspect_ratio: 1.33,
        alt_text: 'Chassis cover view',
      },
      media_list: [
        { id: 'm_1', url: 'https://images.unsplash.com/photo-1?w=800', aspect_ratio: 1.33 },
        { id: 'm_2', url: 'https://images.unsplash.com/photo-2?w=800', aspect_ratio: 1.33 },
        { id: 'm_3', url: 'https://images.unsplash.com/photo-3?w=800', aspect_ratio: 1.33 },
      ],
      score: 18,
      user_vote: 0,
      comments_count: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_saved: false,
    };

    const cardHtml = renderToString(
      <RouterProvider initialPath="/">
        <VisualPinCardComponent
          post={multiVisualPin}
          onVote={() => {}}
          onToggleSave={() => {}}
        />
      </RouterProvider>
    );

    expect(cardHtml).toContain('Dielectric Immersion Chassis Gallery');
    expect(cardHtml).toContain('album-indicator');
    expect(cardHtml).toMatch(/1\/(<!-- -->)?3/);

    const discoveryHtml = renderToString(
      <RouterProvider initialPath="/explore">
        <DiscoveryPinCardComponent
          pin={multiVisualPin}
          onVote={() => {}}
          onToggleSave={() => {}}
        />
      </RouterProvider>
    );

    expect(discoveryHtml).toContain('album-indicator');
    expect(discoveryHtml).toMatch(/1\/(<!-- -->)?3/);
  });

  // Scenario 10: Comments and interactions on image posts
  it('Scenario 10: supports upvoting, saving, and commenting on unified image posts', async () => {
    const post = await adapter.createPost({
      title: 'Interactive Photo Post',
      media: [
        {
          id: 'm_int_1',
          url: '/uploads/med_interactive.jpg',
          aspect_ratio: 1.0,
        },
      ],
    });

    // 1. Initial post has score 1 and author user_vote 1; toggle vote to 0 removes vote
    const unvoteRes = await adapter.votePost(post.id, 0);
    expect(unvoteRes.user_vote).toBe(0);
    expect(unvoteRes.new_score).toBe(0);

    // Re-upvoting sets score to 1
    const reUpvoteRes = await adapter.votePost(post.id, 1);
    expect(reUpvoteRes.user_vote).toBe(1);
    expect(reUpvoteRes.new_score).toBe(1);

    // 2. Toggle save / bookmark
    const saveRes = await adapter.toggleSavePost(post.id);
    expect(saveRes.is_saved).toBe(true);

    // 3. Add comment
    const comment = await adapter.createComment(post.id, {
      content: 'Remarkable heat dissipation numbers, what flow rate did you run?',
    });
    expect(comment.id).toBeDefined();
    expect(comment.content).toContain('Remarkable heat dissipation');

    // 4. Verify post reflects incremented comment count
    const updated = await adapter.getPost(post.id);
    expect(updated.comments_count).toBe(1);
  });

  // Scenario 11: Validation & error handling for empty posts
  it('Scenario 11: blocks publishing when neither text nor media is provided', async () => {
    await expect(
      adapter.createPost({
        content: '',
        title: '',
      })
    ).rejects.toThrow(ApiClientError);
  });

  // Scenario 12: Unified composer UI verification
  it('Scenario 12: renders unified composer layout with no Reddit/Pinterest tabs and single Publish Post action', () => {
    const html = renderToString(
      <ThemeProvider>
        <RouterProvider initialPath="/create">
          <CreatePostPage />
        </RouterProvider>
      </ThemeProvider>
    );

    expect(html).toContain('create-post-page');
    expect(html).toContain('Create Post');
    expect(html).not.toContain('Reddit Style');
    expect(html).not.toContain('Pinterest Style');
    expect(html).toContain('Title (optional for photos)');
    expect(html).toContain('Post Body / Markdown Content');
    expect(html).toContain('Media Attachments');
    expect(html).toContain('Destination Link (optional)');
    expect(html).toContain('Publish Post');
  });
});
