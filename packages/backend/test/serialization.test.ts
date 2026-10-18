import { describe, it, expect } from 'vitest';
import { Value } from '@sinclair/typebox/value';
import {
  UserSummarySchema,
  UserProfileSchema,
  PostCardSchema,
  CommentNodeSchema,
  CommunitySchema,
} from '@socialgraph/shared';
import {
  toUserSummary,
  toUserProfile,
  toPostCard,
  toCommunity,
  buildCommentTree,
} from '../src/db/serialization.js';
import type { UserDoc, PostDoc, CommentDoc, CommunityDoc } from '../src/db/types.js';

describe('Serialization Mappers & TypeBox Schema Adherence', () => {
  const mockUser: UserDoc = {
    _id: 'usr_0',
    username: 'alex_dev',
    display_name: 'Alex Rivera',
    avatar_url: '/avatars/alex-dev.svg',
    bio: 'Systems engineer',
    website: '/sites/alex-dev/',
    is_verified: true,
    followers_count: 418,
    following_count: 285,
    posts_count: 10,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
  };

  it('serializes UserDoc to UserSummary conforming to UserSummarySchema', () => {
    const summary = toUserSummary(mockUser);
    expect(Value.Check(UserSummarySchema, summary)).toBe(true);
    expect(summary.id).toBe('usr_0');
    expect(summary.username).toBe('alex_dev');
  });

  it('serializes UserDoc to UserProfile conforming to UserProfileSchema', () => {
    const profile = toUserProfile(mockUser, true);
    expect(Value.Check(UserProfileSchema, profile)).toBe(true);
    expect(profile.is_following).toBe(true);
    expect(profile.followers_count).toBe(418);
  });

  it('serializes Visual PostDoc to PostCard conforming to PostCardSchema', () => {
    const mockPost: PostDoc = {
      _id: 'post_pin_1',
      post_type: 'visual',
      author_id: 'usr_0',
      title: 'Brutalist Concrete',
      caption: 'Substation architecture in monochrome',
      destination_url: 'https://example.com/gallery',
      tags: ['architecture', 'berlin'],
      media: {
        id: 'media_1',
        url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200',
        aspect_ratio: 0.75,
      },
      score: 42,
      hot_score: 1200,
      comments_count: 3,
      created_at: new Date('2026-10-15T12:00:00.000Z'),
      updated_at: new Date('2026-10-15T12:00:00.000Z'),
    };

    const card = toPostCard(mockPost, toUserSummary(mockUser), 1, true);
    expect(Value.Check(PostCardSchema, card)).toBe(true);
    expect(card.post_type).toBe('visual');
    expect(card.user_vote).toBe(1);
    expect(card.is_saved).toBe(true);
    if (card.post_type === 'visual') {
      expect(card.destination_url).toBe('https://example.com/gallery');
      expect(card.tags).toEqual(['architecture', 'berlin']);
    }
  });

  it('serializes Discussion PostDoc to PostCard conforming to PostCardSchema', () => {
    const mockPost: PostDoc = {
      _id: 'post_disc_1',
      post_type: 'discussion',
      author_id: 'usr_0',
      title: 'Deep dive into cursor pagination in MongoDB',
      content: 'Here are the details on multi-key index boundary optimization...',
      flair: 'Database',
      tags: ['mongodb', 'architecture'],
      score: 110,
      hot_score: 1350,
      comments_count: 5,
      created_at: new Date('2026-10-15T12:00:00.000Z'),
      updated_at: new Date('2026-10-15T12:00:00.000Z'),
    };

    const card = toPostCard(mockPost, toUserSummary(mockUser), 0, false);
    expect(Value.Check(PostCardSchema, card)).toBe(true);
    expect(card.post_type).toBe('discussion');
    if (card.post_type === 'discussion') {
      expect(card.flair).toBe('Database');
      expect(card.tags).toEqual(['mongodb', 'architecture']);
    }
  });

  it('serializes CommunityDoc conforming to CommunitySchema', () => {
    const commDoc: CommunityDoc = {
      _id: 'comm_systems',
      name: 'Distributed Systems',
      slug: 'systems',
      description: 'Systems discussion hub',
      members_count: 500,
      rules: [{ id: 'r1', title: 'Rule 1', description: 'Be kind' }],
      created_at: new Date('2026-01-01T00:00:00.000Z'),
      updated_at: new Date('2026-01-01T00:00:00.000Z'),
    };

    const comm = toCommunity(commDoc, true);
    expect(Value.Check(CommunitySchema, comm)).toBe(true);
    expect(comm.is_member).toBe(true);
  });

  it('buildCommentTree correctly nests hierarchical replies into CommentNode[]', () => {
    const authorSummary = toUserSummary(mockUser);
    const authorMap = new Map([[mockUser._id, authorSummary]]);

    const comments: CommentDoc[] = [
      {
        _id: 'c1',
        post_id: 'p1',
        parent_id: null,
        author_id: 'usr_0',
        content: 'Root comment',
        score: 5,
        depth: 0,
        created_at: new Date('2026-10-15T12:00:00.000Z'),
        updated_at: new Date('2026-10-15T12:00:00.000Z'),
      },
      {
        _id: 'c2',
        post_id: 'p1',
        parent_id: 'c1',
        author_id: 'usr_0',
        content: 'Child reply',
        score: 2,
        depth: 1,
        created_at: new Date('2026-10-15T12:05:00.000Z'),
        updated_at: new Date('2026-10-15T12:05:00.000Z'),
      },
    ];

    const tree = buildCommentTree(comments, authorMap);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('c1');
    expect(tree[0].replies).toHaveLength(1);
    expect(tree[0].replies[0].id).toBe('c2');
    expect(Value.Check(CommentNodeSchema, tree[0])).toBe(true);
  });
});
