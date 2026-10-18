import type { Db } from 'mongodb';
import { COLLECTIONS } from './collections.js';
import type {
  UserDoc,
  PostDoc,
  CommentDoc,
  FollowDoc,
  CommunityDoc,
  CommunityMembershipDoc,
  PostVoteDoc,
  PostSaveDoc,
} from './types.js';
import { calculateHotScore } from '../utils/pagination.js';
import { connectMongo, disconnectMongo, getDb } from './mongo.js';
import { ensureIndexes } from './indexes.js';
import { runInTransaction } from './transaction.js';

export const CORE_SEED_USER_IDS = ['usr_0', 'usr_1', 'usr_2', 'usr_3', 'usr_4'];

export async function seedDatabase(db: Db): Promise<{
  usersCount: number;
  postsCount: number;
  commentsCount: number;
  followsCount: number;
  communitiesCount: number;
}> {
  await ensureIndexes(db);

  const usersCol = db.collection<UserDoc>(COLLECTIONS.USERS);
  const postsCol = db.collection<PostDoc>(COLLECTIONS.POSTS);
  const commentsCol = db.collection<CommentDoc>(COLLECTIONS.COMMENTS);
  const followsCol = db.collection<FollowDoc>(COLLECTIONS.FOLLOWS);
  const commsCol = db.collection<CommunityDoc>(COLLECTIONS.COMMUNITIES);
  const mbrsCol = db.collection<CommunityMembershipDoc>(COLLECTIONS.COMMUNITY_MEMBERSHIPS);
  const votesCol = db.collection<PostVoteDoc>(COLLECTIONS.POST_VOTES);
  const savesCol = db.collection<PostSaveDoc>(COLLECTIONS.POST_SAVES);

  return runInTransaction(async (session) => {

  // Scoped seed cleanup is performed per collection using deterministic fixture IDs
  // to guarantee that developer-created or non-seed user data is preserved.

  // 1. Core Personas
  const coreUsers: UserDoc[] = [
    {
      _id: 'usr_0',
      username: 'alex_dev',
      display_name: 'Alex Rivera',
      avatar_url: '/avatars/alex-dev.svg',
      is_verified: true,
      bio: 'feed engineering & distributed graph nerd • tinkering with fastify and redis • fueled by pour-over coffee and good typography',
      banner_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200',
      website: '/sites/alex-dev/',
      followers_count: 418,
      following_count: 285,
      posts_count: 4,
      created_at: new Date('2026-01-01T00:00:00.000Z'),
      updated_at: new Date('2026-01-01T00:00:00.000Z'),
    },
    {
      _id: 'usr_1',
      username: 'lucas_t',
      display_name: 'Lucas Thorne',
      avatar_url: '/avatars/lucas-t.svg',
      is_verified: true,
      bio: 'Distributed systems researcher & systems engineer • trying to build consensus protocols so my pager doesn’t wake me at 3am • occasionally building acoustic guitars',
      banner_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200',
      followers_count: 862,
      following_count: 314,
      posts_count: 28,
      created_at: new Date('2026-01-10T12:00:00.000Z'),
      updated_at: new Date('2026-01-10T12:00:00.000Z'),
    },
    {
      _id: 'usr_2',
      username: 'elena_arch',
      display_name: 'Elena Rostova',
      avatar_url: '/avatars/elena-arch.svg',
      is_verified: true,
      bio: 'architectural & industrial photographer roaming around brutalist structures, concrete halls, and compute clusters • hasselblad 500c/m • berlin',
      banner_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200',
      website: '/sites/elena-photo/',
      followers_count: 1245,
      following_count: 402,
      posts_count: 45,
      created_at: new Date('2026-01-15T09:30:00.000Z'),
      updated_at: new Date('2026-01-15T09:30:00.000Z'),
    },
    {
      _id: 'usr_3',
      username: 'alec_m',
      display_name: 'Alec Mercer',
      avatar_url: '/avatars/alec-m.svg',
      is_verified: true,
      bio: 'Staff SRE & Linux kernel aficionado • writing postmortems so you don’t have to • ebpf, cache invalidation, and mechanical keyboards',
      banner_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200',
      followers_count: 673,
      following_count: 198,
      posts_count: 19,
      created_at: new Date('2026-01-20T14:15:00.000Z'),
      updated_at: new Date('2026-01-20T14:15:00.000Z'),
    },
    {
      _id: 'usr_4',
      username: 'sara_code',
      display_name: 'Sara Chen',
      avatar_url: '/avatars/sara-code.svg',
      is_verified: true,
      bio: 'Design systems architect & UI engineering lead • obsessing over CSS tokens, subgrid alignments, and web accessibility • tea enthusiast',
      banner_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200',
      website: '/sites/sara-design/',
      followers_count: 1530,
      following_count: 380,
      posts_count: 32,
      created_at: new Date('2026-01-25T11:00:00.000Z'),
      updated_at: new Date('2026-01-25T11:00:00.000Z'),
    },
  ];

  // 15 Synthetic graph users to simulate realistic Zipfian follow distribution
  const syntheticUsers: UserDoc[] = [];
  for (let i = 5; i < 20; i++) {
    syntheticUsers.push({
      _id: `usr_${i}`,
      username: `synth_dev_${i}`,
      display_name: `Engineer ${i}`,
      avatar_url: '/avatars/alex-dev.svg',
      is_verified: false,
      bio: `Software engineer exploring modern web scale. Node ${i}.`,
      followers_count: Math.floor(200 / (i - 3)),
      following_count: 5 + i * 2,
      posts_count: 2,
      created_at: new Date('2026-02-01T00:00:00.000Z'),
      updated_at: new Date('2026-02-01T00:00:00.000Z'),
    });
  }

  const allUsers = [...coreUsers, ...syntheticUsers];
  await usersCol.deleteMany({ _id: { $in: allUsers.map((u) => u._id) } }, { session });
  await usersCol.insertMany(allUsers, { session });

  // 2. Communities
  const communities: CommunityDoc[] = [
    {
      _id: 'comm_systems',
      name: 'Distributed Systems',
      slug: 'systems',
      description: 'Consensus protocols, Raft, Paxos, and multi-region storage systems.',
      avatar_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200',
      members_count: 1420,
      rules: [
        { id: 'r1', title: 'Be rigorous', description: 'Cite formal papers and benchmarks.' },
        { id: 'r2', title: 'No flame wars', description: 'Keep debates focused on system trade-offs.' },
      ],
      created_at: new Date('2026-01-05T00:00:00.000Z'),
      updated_at: new Date('2026-01-05T00:00:00.000Z'),
    },
    {
      _id: 'comm_architecture',
      name: 'Software Architecture',
      slug: 'architecture',
      description: 'Domain driven design, event streaming, and resilient backend microservices.',
      avatar_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=200',
      members_count: 980,
      rules: [
        { id: 'r1', title: 'Context matters', description: 'Include scale and business requirements.' },
      ],
      created_at: new Date('2026-01-06T00:00:00.000Z'),
      updated_at: new Date('2026-01-06T00:00:00.000Z'),
    },
    {
      _id: 'comm_frontend',
      name: 'Frontend Engineering',
      slug: 'frontend',
      description: 'React, TypeScript, CSS architecture, and high performance client rendering.',
      avatar_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=200',
      members_count: 2150,
      rules: [
        { id: 'r1', title: 'Accessibility first', description: 'Semantic HTML and keyboard navigation are required.' },
      ],
      created_at: new Date('2026-01-07T00:00:00.000Z'),
      updated_at: new Date('2026-01-07T00:00:00.000Z'),
    },
    {
      _id: 'comm_photography',
      name: 'Architectural Photography',
      slug: 'photography',
      description: 'Brutalism, industrial lines, geometric perspectives, and visual storytelling.',
      avatar_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200',
      members_count: 840,
      rules: [
        { id: 'r1', title: 'High resolution', description: 'Upload original camera aspect ratios.' },
      ],
      created_at: new Date('2026-01-08T00:00:00.000Z'),
      updated_at: new Date('2026-01-08T00:00:00.000Z'),
    },
    {
      _id: 'comm_design',
      name: 'Design Systems',
      slug: 'design',
      description: 'Design tokens, Figma synchronization, component libraries, and visual harmony.',
      avatar_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=200',
      members_count: 1100,
      rules: [
        { id: 'r1', title: 'Token consistency', description: 'Reference design system primitives.' },
      ],
      created_at: new Date('2026-01-09T00:00:00.000Z'),
      updated_at: new Date('2026-01-09T00:00:00.000Z'),
    },
  ];
  await commsCol.deleteMany({ _id: { $in: communities.map((c) => c._id) } }, { session });
  await commsCol.insertMany(communities, { session });

  // 3. Posts (Discussions and Visual Pins)
  const posts: PostDoc[] = [
    {
      _id: 'post_101',
      post_type: 'discussion',
      author_id: 'usr_1',
      title: 'Why we migrated from distributed locks to event versioning in multi-region feeds',
      content:
        'Over the past 6 months, our team wrestled with cross-datacenter Redis lock contention. Here is how vector clocks and causal read-repair stabilized p99 tail latency.',
      community_id: 'comm_systems',
      community_slug: 'systems',
      score: 142,
      hot_score: calculateHotScore(142, new Date('2026-10-15T10:00:00.000Z')),
      comments_count: 3,
      flair: 'Architecture',
      created_at: new Date('2026-10-15T10:00:00.000Z'),
      updated_at: new Date('2026-10-15T10:00:00.000Z'),
    },
    {
      _id: 'post_102',
      post_type: 'visual',
      author_id: 'usr_2',
      title: 'Brutalist Concrete Pavilion, Berlin',
      caption: 'Medium format scan on Kodak Tri-X 400. The light falling across the raw concrete ridges.',
      community_id: 'comm_photography',
      community_slug: 'photography',
      media: {
        id: 'media_201',
        url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200',
        aspect_ratio: 0.75,
        width: 1200,
        height: 1600,
        alt_text: 'Monochrome brutalist architecture pavilion',
      },
      dominant_color: '#343a40',
      score: 285,
      hot_score: calculateHotScore(285, new Date('2026-10-15T08:30:00.000Z')),
      comments_count: 1,
      tags: ['architecture', 'monochrome'],
      created_at: new Date('2026-10-15T08:30:00.000Z'),
      updated_at: new Date('2026-10-15T08:30:00.000Z'),
    },
    {
      _id: 'post_103',
      post_type: 'discussion',
      author_id: 'usr_4',
      title: 'Managing Design Tokens across Tailwind v4 and React CSS Subgrid',
      content:
        'With CSS subgrid support landing everywhere, how do you structure token hierarchies when coordinating between Figma variables and Tailwind CSS variables?',
      community_id: 'comm_design',
      community_slug: 'design',
      score: 89,
      hot_score: calculateHotScore(89, new Date('2026-10-14T18:00:00.000Z')),
      comments_count: 2,
      flair: 'Design Tokens',
      created_at: new Date('2026-10-14T18:00:00.000Z'),
      updated_at: new Date('2026-10-14T18:00:00.000Z'),
    },
    {
      _id: 'post_104',
      post_type: 'visual',
      author_id: 'usr_2',
      title: 'Industrial Substation Grid Matrix',
      caption: 'Steel framework and high tension towers during golden hour.',
      community_id: 'comm_photography',
      community_slug: 'photography',
      media: {
        id: 'media_202',
        url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
        aspect_ratio: 1.33,
        width: 1600,
        height: 1200,
        alt_text: 'Industrial steel substation framework',
      },
      dominant_color: '#212529',
      score: 95,
      hot_score: calculateHotScore(95, new Date('2026-10-14T15:00:00.000Z')),
      comments_count: 0,
      tags: ['industrial', 'geometry'],
      created_at: new Date('2026-10-14T15:00:00.000Z'),
      updated_at: new Date('2026-10-14T15:00:00.000Z'),
    },
    // DETERMINISTIC TIE-BREAKER POSTS (Identical timestamps to verify cursor ordering)
    {
      _id: 'post_tie_301',
      post_type: 'discussion',
      author_id: 'usr_0',
      title: 'Deterministic Cursor Boundary Verification Post A',
      content: 'This post shares an exact millisecond timestamp with Post B to test cursor tie-breakers.',
      community_id: 'comm_systems',
      community_slug: 'systems',
      score: 50,
      hot_score: calculateHotScore(50, new Date('2026-10-14T12:00:00.000Z')),
      comments_count: 0,
      created_at: new Date('2026-10-14T12:00:00.000Z'),
      updated_at: new Date('2026-10-14T12:00:00.000Z'),
    },
    {
      _id: 'post_tie_302',
      post_type: 'discussion',
      author_id: 'usr_3',
      title: 'Deterministic Cursor Boundary Verification Post B',
      content: 'Identical timestamp companion post to post_tie_301.',
      community_id: 'comm_systems',
      community_slug: 'systems',
      score: 50,
      hot_score: calculateHotScore(50, new Date('2026-10-14T12:00:00.000Z')),
      comments_count: 0,
      created_at: new Date('2026-10-14T12:00:00.000Z'),
      updated_at: new Date('2026-10-14T12:00:00.000Z'),
    },
  ];

  await postsCol.deleteMany({ _id: { $in: posts.map((p) => p._id) } }, { session });
  await postsCol.insertMany(posts, { session });

  // 4. Comments (Hierarchical)
  const comments: CommentDoc[] = [
    {
      _id: 'cmt_001',
      post_id: 'post_101',
      parent_id: null,
      author_id: 'usr_3',
      content: 'What did the fallback strategy look like when cross-region replication lagged beyond 200ms?',
      score: 12,
      depth: 0,
      created_at: new Date('2026-10-15T10:15:00.000Z'),
      updated_at: new Date('2026-10-15T10:15:00.000Z'),
    },
    {
      _id: 'cmt_002',
      post_id: 'post_101',
      parent_id: 'cmt_001',
      author_id: 'usr_1',
      content: 'We used local write-ahead logs with an in-flight quorum check before acknowledging to the client.',
      score: 8,
      depth: 1,
      created_at: new Date('2026-10-15T10:25:00.000Z'),
      updated_at: new Date('2026-10-15T10:25:00.000Z'),
    },
    {
      _id: 'cmt_003',
      post_id: 'post_101',
      parent_id: 'cmt_002',
      author_id: 'usr_0',
      content: 'That completely avoids the two-phase commit overhead on the read path. Clean solution.',
      score: 4,
      depth: 2,
      created_at: new Date('2026-10-15T10:35:00.000Z'),
      updated_at: new Date('2026-10-15T10:35:00.000Z'),
    },
    {
      _id: 'cmt_004',
      post_id: 'post_102',
      parent_id: null,
      author_id: 'usr_4',
      content: 'The depth of texture in that concrete shadow gradient is gorgeous.',
      score: 6,
      depth: 0,
      created_at: new Date('2026-10-15T09:00:00.000Z'),
      updated_at: new Date('2026-10-15T09:00:00.000Z'),
    },
  ];
  await commentsCol.deleteMany({ _id: { $in: comments.map((c) => c._id) } }, { session });
  await commentsCol.insertMany(comments, { session });

  // 5. Follow Edges
  const follows: FollowDoc[] = [
    { _id: 'flw_0_1', follower_id: 'usr_0', target_user_id: 'usr_1', created_at: new Date() },
    { _id: 'flw_0_2', follower_id: 'usr_0', target_user_id: 'usr_2', created_at: new Date() },
    { _id: 'flw_0_3', follower_id: 'usr_0', target_user_id: 'usr_3', created_at: new Date() },
    { _id: 'flw_1_2', follower_id: 'usr_1', target_user_id: 'usr_2', created_at: new Date() },
    { _id: 'flw_2_4', follower_id: 'usr_2', target_user_id: 'usr_4', created_at: new Date() },
  ];
  await followsCol.deleteMany({ _id: { $in: follows.map((f) => f._id) } }, { session });
  await followsCol.insertMany(follows, { session });

  // 6. Community Memberships
  const memberships: CommunityMembershipDoc[] = [
    { _id: 'mbr_0_sys', user_id: 'usr_0', community_id: 'comm_systems', created_at: new Date() },
    { _id: 'mbr_0_pho', user_id: 'usr_0', community_id: 'comm_photography', created_at: new Date() },
    { _id: 'mbr_1_sys', user_id: 'usr_1', community_id: 'comm_systems', created_at: new Date() },
    { _id: 'mbr_2_pho', user_id: 'usr_2', community_id: 'comm_photography', created_at: new Date() },
    { _id: 'mbr_4_des', user_id: 'usr_4', community_id: 'comm_design', created_at: new Date() },
  ];
  await mbrsCol.deleteMany({ _id: { $in: memberships.map((m) => m._id) } }, { session });
  await mbrsCol.insertMany(memberships, { session });

  // 7. Votes and Saves
  const votes: PostVoteDoc[] = [
    { _id: 'vote_101_0', post_id: 'post_101', user_id: 'usr_0', direction: 1, created_at: new Date(), updated_at: new Date() },
    { _id: 'vote_102_0', post_id: 'post_102', user_id: 'usr_0', direction: 1, created_at: new Date(), updated_at: new Date() },
  ];
  await votesCol.deleteMany({ _id: { $in: votes.map((v) => v._id) } }, { session });
  await votesCol.insertMany(votes, { session });

  const saves: PostSaveDoc[] = [
    { _id: 'save_102_0', post_id: 'post_102', user_id: 'usr_0', created_at: new Date() },
  ];
  await savesCol.deleteMany({ _id: { $in: saves.map((s) => s._id) } }, { session });
  await savesCol.insertMany(saves, { session });

  // Fixture aggregates are derived from durable edges and records so displayed
  // counters and ranking scores never claim data that is absent from MongoDB.
  const followerCounts = await followsCol.aggregate<{ _id: string; count: number }>([
    { $group: { _id: '$target_user_id', count: { $sum: 1 } } },
  ], { session }).toArray();
  const followingCounts = await followsCol.aggregate<{ _id: string; count: number }>([
    { $group: { _id: '$follower_id', count: { $sum: 1 } } },
  ], { session }).toArray();
  const postCounts = await postsCol.aggregate<{ _id: string; count: number }>([
    { $group: { _id: '$author_id', count: { $sum: 1 } } },
  ], { session }).toArray();
  const memberCounts = await mbrsCol.aggregate<{ _id: string; count: number }>([
    { $group: { _id: '$community_id', count: { $sum: 1 } } },
  ], { session }).toArray();
  for (const user of allUsers) {
    await usersCol.updateOne({ _id: user._id }, { $set: {
      followers_count: followerCounts.find((item) => item._id === user._id)?.count ?? 0,
      following_count: followingCounts.find((item) => item._id === user._id)?.count ?? 0,
      posts_count: postCounts.find((item) => item._id === user._id)?.count ?? 0,
    } }, { session });
  }
  for (const community of communities) {
    await commsCol.updateOne({ _id: community._id }, { $set: {
      members_count: memberCounts.find((item) => item._id === community._id)?.count ?? 0,
    } }, { session });
  }
  for (const post of posts) {
    const postVotes = await votesCol.find({ post_id: post._id }, { session }).toArray();
    const score = postVotes.reduce((total, vote) => total + vote.direction, 0);
    const commentsCount = await commentsCol.countDocuments({ post_id: post._id }, { session });
    await postsCol.updateOne({ _id: post._id }, { $set: {
      score,
      hot_score: calculateHotScore(score, post.created_at),
      comments_count: commentsCount,
    } }, { session });
  }

  return {
    usersCount: allUsers.length,
    postsCount: posts.length,
    commentsCount: comments.length,
    followsCount: follows.length,
    communitiesCount: communities.length,
  };
  });
}

// CLI standalone runner
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  (async () => {
    try {
      console.log('Connecting to MongoDB for database seeding...');
      const { db } = await connectMongo();
      const stats = await seedDatabase(db);
      console.log('Database seeded successfully:', stats);
      await disconnectMongo();
      process.exit(0);
    } catch (err) {
      console.error('Database seeding failed:', err);
      process.exit(1);
    }
  })();
}
