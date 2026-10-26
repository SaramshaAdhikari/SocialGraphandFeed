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
import {
  expandedPersonas,
  expandedCommunities,
  expandedPosts,
  expandedComments,
  expandedFollows,
  expandedMemberships,
  expandedVotes,
  expandedSaves,
} from './fixtures/expandedDataset.js';


export const CORE_SEED_USER_IDS = ['usr_0', 'usr_1', 'usr_2', 'usr_3', 'usr_4'];

export async function seedDatabase(
  db: Db,
  options: { mode?: 'baseline' | 'expanded' } = {}
): Promise<{
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
      bio: 'distributed systems & web perf • tinkering with redis & fastify • fueled by pour-overs and good typography',
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
      bio: 'consensus protocols & distributed tracing • building acoustic guitars in my spare time',
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
      bio: 'architectural & brutalist photography • hasselblad 500c/m • berlin',
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
      bio: 'linux kernel debugging & sre • mechanical keyboards & ebpf',
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
      bio: 'design systems & web accessibility • obsessing over css tokens and tea',
      banner_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200',
      website: '/sites/sara-design/',
      followers_count: 1530,
      following_count: 380,
      posts_count: 32,
      created_at: new Date('2026-01-25T11:00:00.000Z'),
      updated_at: new Date('2026-01-25T11:00:00.000Z'),
    },
  ];

  // 15 Distinct Fictional Personas with non-face vector avatars
  const extendedPersonas: UserDoc[] = [
    {
      _id: 'usr_5',
      username: 'kenji_sys',
      display_name: 'Kenji Sato',
      avatar_url: '/avatars/code-terminal.svg',
      banner_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200',
      is_verified: true,
      bio: 'embedded linux & robotics • building rover prototypes in tokyo',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-01T00:00:00.000Z'),
      updated_at: new Date('2026-02-01T00:00:00.000Z'),
    },
    {
      _id: 'usr_6',
      username: 'maya_pixel',
      display_name: 'Maya Lin',
      avatar_url: '/avatars/abstract-bauhaus.svg',
      banner_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200',
      is_verified: true,
      bio: 'webgl shaders & interactive graphics • generative color studies',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-02T00:00:00.000Z'),
      updated_at: new Date('2026-02-02T00:00:00.000Z'),
    },
    {
      _id: 'usr_7',
      username: 'david_retro',
      display_name: 'David Okafor',
      avatar_url: '/avatars/pixel-gameboy.svg',
      banner_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200',
      is_verified: false,
      bio: 'restoring 90s workstations & writing forth interpreters • lagos',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-03T00:00:00.000Z'),
      updated_at: new Date('2026-02-03T00:00:00.000Z'),
    },
    {
      _id: 'usr_8',
      username: 'chloe_lens',
      display_name: 'Chloe Desjardins',
      avatar_url: '/avatars/gear-camera.svg',
      banner_url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200',
      is_verified: true,
      bio: 'night photography & neon reflections • montreal',
      website: 'https://chloe-photos.example.com',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-04T00:00:00.000Z'),
      updated_at: new Date('2026-02-04T00:00:00.000Z'),
    },
    {
      _id: 'usr_9',
      username: 'tariq_arch',
      display_name: 'Tariq Mansoor',
      avatar_url: '/avatars/nature-mountain.svg',
      banner_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200',
      is_verified: true,
      bio: 'event sourcing & immutable ledgers • weekend trail hiking in dubai',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-05T00:00:00.000Z'),
      updated_at: new Date('2026-02-05T00:00:00.000Z'),
    },
    {
      _id: 'usr_10',
      username: 'priya_ui',
      display_name: 'Priya Sharma',
      avatar_url: '/avatars/art-palette.svg',
      banner_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200',
      is_verified: true,
      bio: 'design tokens & screen reader accessibility • watercolor sketching • delhi',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-06T00:00:00.000Z'),
      updated_at: new Date('2026-02-06T00:00:00.000Z'),
    },
    {
      _id: 'usr_11',
      username: 'nullcat_404',
      display_name: 'Devin Bell',
      avatar_url: '/avatars/mascot-cat.svg',
      banner_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200',
      is_verified: false,
      bio: 'self-hosting on old thinkpads, cat dad, coffee addict. seattle',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-07T00:00:00.000Z'),
      updated_at: new Date('2026-02-07T00:00:00.000Z'),
    },
    {
      _id: 'usr_12',
      username: 'aoi_manga',
      display_name: 'Aoi Tanaka',
      avatar_url: '/avatars/art-manga-pen.svg',
      banner_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200',
      is_verified: false,
      bio: 'manga paneling & visual storytelling • osaka',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-08T00:00:00.000Z'),
      updated_at: new Date('2026-02-08T00:00:00.000Z'),
    },
    {
      _id: 'usr_13',
      username: 'marcus_v',
      display_name: 'Marcus Vance',
      avatar_url: '/avatars/gear-synth.svg',
      banner_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200',
      is_verified: false,
      bio: 'modular synth patches & analog sound design • atlanta',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-09T00:00:00.000Z'),
      updated_at: new Date('2026-02-09T00:00:00.000Z'),
    },
    {
      _id: 'usr_14',
      username: 'chai_exe',
      display_name: 'Chirag Mehta',
      avatar_url: '/avatars/food-chai.svg',
      banner_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200',
      is_verified: false,
      bio: 'undergrad cs @ bits pilani. tinkering with side projects & drinking ginger chai',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-10T00:00:00.000Z'),
      updated_at: new Date('2026-02-10T00:00:00.000Z'),
    },
    {
      _id: 'usr_15',
      username: 'civicafterdark',
      display_name: 'Leo Santos',
      avatar_url: '/avatars/gear-car.svg',
      banner_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200',
      is_verified: false,
      bio: 'ek9 civic hatch build, late night touge runs, track day telemetry. toronto',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-11T00:00:00.000Z'),
      updated_at: new Date('2026-02-11T00:00:00.000Z'),
    },
    {
      _id: 'usr_16',
      username: 'nina_cam',
      display_name: 'Nina Kowalski',
      avatar_url: '/avatars/gear-camera.svg',
      banner_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
      is_verified: false,
      bio: 'documentary film photography & industrial architecture • krakow',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-12T00:00:00.000Z'),
      updated_at: new Date('2026-02-12T00:00:00.000Z'),
    },
    {
      _id: 'usr_17',
      username: 'pixelmoth',
      display_name: 'Faye Zhao',
      avatar_url: '/avatars/pixel-moth.svg',
      banner_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200',
      is_verified: false,
      bio: 'pixel art & cozy games. drawing little critters and making tiny pico-8 carts. vancouver',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-13T00:00:00.000Z'),
      updated_at: new Date('2026-02-13T00:00:00.000Z'),
    },
    {
      _id: 'usr_18',
      username: 'hana_dev',
      display_name: 'Hana Park',
      avatar_url: '/avatars/mascot-frog.svg',
      banner_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200',
      is_verified: true,
      bio: 'frontend tooling & monorepos • seoul',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-14T00:00:00.000Z'),
      updated_at: new Date('2026-02-14T00:00:00.000Z'),
    },
    {
      _id: 'usr_19',
      username: 'fourthquarter',
      display_name: 'Darius Hall',
      avatar_url: '/avatars/sports-basketball.svg',
      banner_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200',
      is_verified: false,
      bio: 'rec league point guard, 90s basketball jerseys, sneaker rotation. chicago',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-15T00:00:00.000Z'),
      updated_at: new Date('2026-02-15T00:00:00.000Z'),
    },
  ];

  const allUsers = [...coreUsers, ...extendedPersonas];
  const isExpanded = (options.mode ?? process.env.SEED_MODE ?? 'expanded') === 'expanded';
  const finalUsers = isExpanded ? [...allUsers, ...expandedPersonas] : allUsers;

  // Fixture users are deterministically inserted or updated.
  // In particular, usr_0 (alex_dev) preserves custom authentication hashes,
  // admin roles, and developer profile edits across reseeds.
  for (const user of finalUsers) {
    const byId = await usersCol.findOne({ _id: user._id }, { session });
    if (!byId) {
      const usernameOwner = await usersCol.findOne({ username: user.username }, { session });
      if (usernameOwner) {
        throw new Error(`Cannot seed ${user.username}: it already belongs to ${usernameOwner._id}, not fixture id ${user._id}. No user data was changed.`);
      }
      await usersCol.insertOne(user, { session });
    } else if (user._id !== 'usr_0') {
      // Reconcile non-usr_0 seeded personas with their authentic profile attributes
      await usersCol.updateOne(
        { _id: user._id },
        {
          $set: {
            username: user.username,
            display_name: user.display_name,
            avatar_url: user.avatar_url,
            bio: user.bio,
            banner_url: user.banner_url,
            website: user.website,
            is_verified: user.is_verified,
          },
        },
        { session }
      );
    }
  }

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
  const finalComms = isExpanded ? [...communities, ...expandedCommunities] : communities;
  const allKnownCommIds = [...communities, ...expandedCommunities].map((c) => c._id);
  await commsCol.deleteMany({ _id: { $in: allKnownCommIds } }, { session });
  await commsCol.insertMany(finalComms, { session });

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
    {
      _id: 'post_105',
      post_type: 'discussion',
      author_id: 'usr_9',
      title: 'The transactional outbox pattern with MongoDB change streams in production',
      content:
        'A deep dive into dual-write hazards between relational document stores and event streams. How we guaranteed at-least-once message delivery without two-phase commit overhead.',
      community_id: 'comm_architecture',
      community_slug: 'architecture',
      score: 76,
      hot_score: calculateHotScore(76, new Date('2026-10-15T11:00:00.000Z')),
      comments_count: 2,
      flair: 'Event Sourcing',
      created_at: new Date('2026-10-15T11:00:00.000Z'),
      updated_at: new Date('2026-10-15T11:00:00.000Z'),
    },
    {
      _id: 'post_106',
      post_type: 'discussion',
      author_id: 'usr_13',
      title: 'Evaluating service mesh telemetry overhead: eBPF sidecars vs Envoy proxies',
      content:
        'Sidecar proxy resource consumption often dwarfs application memory at low traffic. Benchmarking latency jitter and CPU profiles under synthetic burst traffic.',
      community_id: 'comm_architecture',
      community_slug: 'architecture',
      score: 62,
      hot_score: calculateHotScore(62, new Date('2026-10-15T09:15:00.000Z')),
      comments_count: 0,
      flair: 'Infrastructure',
      created_at: new Date('2026-10-15T09:15:00.000Z'),
      updated_at: new Date('2026-10-15T09:15:00.000Z'),
    },
    {
      _id: 'post_107',
      post_type: 'discussion',
      author_id: 'usr_10',
      title: 'Building fully accessible composite widgets: ARIA Authoring Practices in real web apps',
      content:
        'Why simple role="tab" is not enough: managing roving tabindex, live regions for screen readers, and maintaining 60fps focus rings across deeply nested components.',
      community_id: 'comm_frontend',
      community_slug: 'frontend',
      score: 84,
      hot_score: calculateHotScore(84, new Date('2026-10-15T07:45:00.000Z')),
      comments_count: 2,
      flair: 'Accessibility',
      created_at: new Date('2026-10-15T07:45:00.000Z'),
      updated_at: new Date('2026-10-15T07:45:00.000Z'),
    },
    {
      _id: 'post_108',
      post_type: 'discussion',
      author_id: 'usr_18',
      title: 'Type-safe URL state synchronization in complex client dashboards',
      content:
        'How we replaced imperative search param manipulation with schema-validated URL sync, eliminating runtime type errors and state desynchronization on browser history navigation.',
      community_id: 'comm_frontend',
      community_slug: 'frontend',
      score: 71,
      hot_score: calculateHotScore(71, new Date('2026-10-14T19:30:00.000Z')),
      comments_count: 0,
      flair: 'TypeScript',
      created_at: new Date('2026-10-14T19:30:00.000Z'),
      updated_at: new Date('2026-10-14T19:30:00.000Z'),
    },
    {
      _id: 'post_109',
      post_type: 'visual',
      author_id: 'usr_8',
      title: 'Rain-slicked Concrete and Neon Reflections, Montreal',
      caption: 'Long exposure study of late-night architectural symmetry and wet pavement reflections.',
      community_id: 'comm_photography',
      community_slug: 'photography',
      media: {
        id: 'media_203',
        url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200',
        aspect_ratio: 0.8,
        width: 1200,
        height: 1500,
        alt_text: 'Urban night street reflections and architecture',
      },
      dominant_color: '#1e293b',
      score: 110,
      hot_score: calculateHotScore(110, new Date('2026-10-14T17:00:00.000Z')),
      comments_count: 1,
      tags: ['urban', 'night', 'reflection'],
      created_at: new Date('2026-10-14T17:00:00.000Z'),
      updated_at: new Date('2026-10-14T17:00:00.000Z'),
    },
    {
      _id: 'post_110',
      post_type: 'visual',
      author_id: 'usr_12',
      title: 'Architectural Perspective & Dynamic Paneling Study',
      caption: 'Exploration of isometric line density and directional flow across modern visual compositions.',
      community_id: 'comm_design',
      community_slug: 'design',
      media: {
        id: 'media_204',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200',
        aspect_ratio: 1.25,
        width: 1500,
        height: 1200,
        alt_text: 'Abstract geometric line composition',
      },
      dominant_color: '#0f172a',
      score: 93,
      hot_score: calculateHotScore(93, new Date('2026-10-14T16:20:00.000Z')),
      comments_count: 0,
      tags: ['composition', 'geometry', 'lineart'],
      created_at: new Date('2026-10-14T16:20:00.000Z'),
      updated_at: new Date('2026-10-14T16:20:00.000Z'),
    },
    {
      _id: 'post_111',
      post_type: 'discussion',
      author_id: 'usr_7',
      title: 'Restoring a 1989 NeXTstation: examining Mach microkernel IPC performance',
      content:
        'Benchmarking Mach message passing latencies on 25MHz Motorola 68040 hardware. What modern microkernel architectures can learn from NeXTSTEP driver kit.',
      community_id: 'comm_systems',
      community_slug: 'systems',
      score: 88,
      hot_score: calculateHotScore(88, new Date('2026-10-14T14:10:00.000Z')),
      comments_count: 1,
      flair: 'Retro Computing',
      created_at: new Date('2026-10-14T14:10:00.000Z'),
      updated_at: new Date('2026-10-14T14:10:00.000Z'),
    },
    {
      _id: 'post_112',
      post_type: 'discussion',
      author_id: 'usr_5',
      title: 'Deterministic real-time scheduling on embedded Linux with PREEMPT_RT',
      content:
        'Measuring worst-case latency jitter on CAN bus telemetry packets. Tuning CPU isolation, IRQ affinities, and memory locking for robotics rover prototypes.',
      community_id: 'comm_systems',
      community_slug: 'systems',
      score: 92,
      hot_score: calculateHotScore(92, new Date('2026-10-14T13:00:00.000Z')),
      comments_count: 0,
      flair: 'Robotics',
      created_at: new Date('2026-10-14T13:00:00.000Z'),
      updated_at: new Date('2026-10-14T13:00:00.000Z'),
    },
    {
      _id: 'post_113',
      post_type: 'visual',
      author_id: 'usr_16',
      title: 'Decommissioned Hydroelectric Turbine Hall, Ruhr Valley',
      caption: 'Monochrome medium format exposure of industrial steel arches and silent generator housings.',
      community_id: 'comm_photography',
      community_slug: 'photography',
      media: {
        id: 'media_205',
        url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200',
        aspect_ratio: 1.33,
        width: 1600,
        height: 1200,
        alt_text: 'Industrial turbine hall architecture',
      },
      dominant_color: '#334155',
      score: 115,
      hot_score: calculateHotScore(115, new Date('2026-10-14T11:45:00.000Z')),
      comments_count: 0,
      tags: ['industrial', 'monochrome', 'architecture'],
      created_at: new Date('2026-10-14T11:45:00.000Z'),
      updated_at: new Date('2026-10-14T11:45:00.000Z'),
    },
    {
      _id: 'post_114',
      post_type: 'visual',
      author_id: 'usr_6',
      title: 'Generative Canvas Shaders & Palette Interpolation',
      caption: 'Interactive color field study rendered via WebGL fragment shaders at 120fps.',
      community_id: 'comm_frontend',
      community_slug: 'frontend',
      media: {
        id: 'media_206',
        url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200',
        aspect_ratio: 1.0,
        width: 1200,
        height: 1200,
        alt_text: 'Vibrant generative color field visualization',
      },
      dominant_color: '#4f46e5',
      score: 104,
      hot_score: calculateHotScore(104, new Date('2026-10-14T10:30:00.000Z')),
      comments_count: 0,
      tags: ['webgl', 'generative', 'design'],
      created_at: new Date('2026-10-14T10:30:00.000Z'),
      updated_at: new Date('2026-10-14T10:30:00.000Z'),
    },
    // DETERMINISTIC TIE-BREAKER POSTS (Preserved for cursor boundary tests, isolated from community feeds)
    {
      _id: 'post_tie_301',
      post_type: 'discussion',
      author_id: 'usr_0',
      title: 'Memory barrier placement in lock-free ring buffers (Part 1)',
      content: 'Analyzing sequential consistency vs acquire-release semantics on ARMv8 architectures.',
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
      title: 'Memory barrier placement in lock-free ring buffers (Part 2)',
      content: 'Companion benchmark measurements across x86-64 and Apple Silicon M-series cores.',
      score: 50,
      hot_score: calculateHotScore(50, new Date('2026-10-14T12:00:00.000Z')),
      comments_count: 0,
      created_at: new Date('2026-10-14T12:00:00.000Z'),
      updated_at: new Date('2026-10-14T12:00:00.000Z'),
    },
  ];
  const finalPosts = isExpanded ? [...posts, ...expandedPosts] : posts;

  const allKnownPostIds = [...posts, ...expandedPosts].map((p) => p._id);
  await postsCol.deleteMany({ _id: { $in: allKnownPostIds } }, { session });
  await postsCol.insertMany(finalPosts, { session });

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
    {
      _id: 'cmt_005',
      post_id: 'post_105',
      parent_id: null,
      author_id: 'usr_1',
      content: 'How do you handle tombstone events when pruning the outbox collection under heavy write amplification?',
      score: 9,
      depth: 0,
      created_at: new Date('2026-10-15T11:20:00.000Z'),
      updated_at: new Date('2026-10-15T11:20:00.000Z'),
    },
    {
      _id: 'cmt_006',
      post_id: 'post_105',
      parent_id: 'cmt_005',
      author_id: 'usr_9',
      content: 'We partition outbox documents into time-bucketed collections and drop expired partitions atomically instead of issuing document-level deletes.',
      score: 7,
      depth: 1,
      created_at: new Date('2026-10-15T11:35:00.000Z'),
      updated_at: new Date('2026-10-15T11:35:00.000Z'),
    },
    {
      _id: 'cmt_007',
      post_id: 'post_107',
      parent_id: null,
      author_id: 'usr_4',
      content: 'Do you recommend using CSS :focus-visible exclusively or keeping custom focus ring state in your token context?',
      score: 8,
      depth: 0,
      created_at: new Date('2026-10-15T08:10:00.000Z'),
      updated_at: new Date('2026-10-15T08:10:00.000Z'),
    },
    {
      _id: 'cmt_008',
      post_id: 'post_107',
      parent_id: 'cmt_007',
      author_id: 'usr_10',
      content: 'We pair native :focus-visible with a high-contrast token fallback so keyboard navigation is obvious in both light and dark themes.',
      score: 6,
      depth: 1,
      created_at: new Date('2026-10-15T08:25:00.000Z'),
      updated_at: new Date('2026-10-15T08:25:00.000Z'),
    },
    {
      _id: 'cmt_009',
      post_id: 'post_109',
      parent_id: null,
      author_id: 'usr_2',
      content: 'The specular highlights off that wet asphalt frame the building geometry brilliantly.',
      score: 5,
      depth: 0,
      created_at: new Date('2026-10-14T17:30:00.000Z'),
      updated_at: new Date('2026-10-14T17:30:00.000Z'),
    },
    {
      _id: 'cmt_010',
      post_id: 'post_111',
      parent_id: null,
      author_id: 'usr_3',
      content: 'The Mach IPC design was so ahead of its time. NeXTSTEP on a 68040 felt surprisingly responsive.',
      score: 6,
      depth: 0,
      created_at: new Date('2026-10-14T14:40:00.000Z'),
      updated_at: new Date('2026-10-14T14:40:00.000Z'),
    },
  ];
  const finalComments = isExpanded ? [...comments, ...expandedComments] : comments;
  const allKnownCommentIds = [...comments, ...expandedComments].map((c) => c._id);
  await commentsCol.deleteMany({ _id: { $in: allKnownCommentIds } }, { session });
  await commentsCol.insertMany(finalComments, { session });

  // 5. Follow Edges
  const follows: FollowDoc[] = [
    { _id: 'flw_0_1', follower_id: 'usr_0', target_user_id: 'usr_1', created_at: new Date() },
    { _id: 'flw_0_2', follower_id: 'usr_0', target_user_id: 'usr_2', created_at: new Date() },
    { _id: 'flw_0_3', follower_id: 'usr_0', target_user_id: 'usr_3', created_at: new Date() },
    { _id: 'flw_1_0', follower_id: 'usr_1', target_user_id: 'usr_0', created_at: new Date() },
    { _id: 'flw_1_2', follower_id: 'usr_1', target_user_id: 'usr_2', created_at: new Date() },
    { _id: 'flw_1_5', follower_id: 'usr_1', target_user_id: 'usr_5', created_at: new Date() },
    { _id: 'flw_1_11', follower_id: 'usr_1', target_user_id: 'usr_11', created_at: new Date() },
    { _id: 'flw_2_4', follower_id: 'usr_2', target_user_id: 'usr_4', created_at: new Date() },
    { _id: 'flw_2_8', follower_id: 'usr_2', target_user_id: 'usr_8', created_at: new Date() },
    { _id: 'flw_2_16', follower_id: 'usr_2', target_user_id: 'usr_16', created_at: new Date() },
    { _id: 'flw_4_1', follower_id: 'usr_4', target_user_id: 'usr_1', created_at: new Date() },
    { _id: 'flw_3_11', follower_id: 'usr_3', target_user_id: 'usr_11', created_at: new Date() },
    { _id: 'flw_4_6', follower_id: 'usr_4', target_user_id: 'usr_6', created_at: new Date() },
    { _id: 'flw_4_10', follower_id: 'usr_4', target_user_id: 'usr_10', created_at: new Date() },
    { _id: 'flw_5_1', follower_id: 'usr_5', target_user_id: 'usr_1', created_at: new Date() },
    { _id: 'flw_5_7', follower_id: 'usr_5', target_user_id: 'usr_7', created_at: new Date() },
    { _id: 'flw_5_17', follower_id: 'usr_5', target_user_id: 'usr_17', created_at: new Date() },
    { _id: 'flw_6_12', follower_id: 'usr_6', target_user_id: 'usr_12', created_at: new Date() },
    { _id: 'flw_7_9', follower_id: 'usr_7', target_user_id: 'usr_9', created_at: new Date() },
    { _id: 'flw_7_10', follower_id: 'usr_7', target_user_id: 'usr_10', created_at: new Date() },
    { _id: 'flw_8_2', follower_id: 'usr_8', target_user_id: 'usr_2', created_at: new Date() },
    { _id: 'flw_9_13', follower_id: 'usr_9', target_user_id: 'usr_13', created_at: new Date() },
    { _id: 'flw_10_18', follower_id: 'usr_10', target_user_id: 'usr_18', created_at: new Date() },
    { _id: 'flw_12_14', follower_id: 'usr_12', target_user_id: 'usr_14', created_at: new Date() },
    { _id: 'flw_18_14', follower_id: 'usr_18', target_user_id: 'usr_14', created_at: new Date() },
  ];
  const finalFollows = isExpanded ? [...follows, ...expandedFollows] : follows;
  const allKnownFollowIds = [...follows, ...expandedFollows].map((f) => f._id);
  await followsCol.deleteMany({ _id: { $in: allKnownFollowIds } }, { session });
  await followsCol.insertMany(finalFollows, { session });

  // 6. Community Memberships
  const memberships: CommunityMembershipDoc[] = [
    // comm_systems (8 members)
    { _id: 'mbr_0_sys', user_id: 'usr_0', community_id: 'comm_systems', created_at: new Date() },
    { _id: 'mbr_1_sys', user_id: 'usr_1', community_id: 'comm_systems', created_at: new Date() },
    { _id: 'mbr_6_sys', user_id: 'usr_6', community_id: 'comm_systems', created_at: new Date() },
    { _id: 'mbr_5_sys', user_id: 'usr_5', community_id: 'comm_systems', created_at: new Date() },
    { _id: 'mbr_7_sys', user_id: 'usr_7', community_id: 'comm_systems', created_at: new Date() },
    { _id: 'mbr_11_sys', user_id: 'usr_11', community_id: 'comm_systems', created_at: new Date() },
    { _id: 'mbr_17_sys', user_id: 'usr_17', community_id: 'comm_systems', created_at: new Date() },
    { _id: 'mbr_19_sys', user_id: 'usr_19', community_id: 'comm_systems', created_at: new Date() },

    // comm_architecture (8 members)
    { _id: 'mbr_0_arch', user_id: 'usr_0', community_id: 'comm_architecture', created_at: new Date() },
    { _id: 'mbr_1_arch', user_id: 'usr_1', community_id: 'comm_architecture', created_at: new Date() },
    { _id: 'mbr_3_arch', user_id: 'usr_3', community_id: 'comm_architecture', created_at: new Date() },
    { _id: 'mbr_9_arch', user_id: 'usr_9', community_id: 'comm_architecture', created_at: new Date() },
    { _id: 'mbr_13_arch', user_id: 'usr_13', community_id: 'comm_architecture', created_at: new Date() },
    { _id: 'mbr_15_arch', user_id: 'usr_15', community_id: 'comm_architecture', created_at: new Date() },
    { _id: 'mbr_18_arch', user_id: 'usr_18', community_id: 'comm_architecture', created_at: new Date() },
    { _id: 'mbr_19_arch', user_id: 'usr_19', community_id: 'comm_architecture', created_at: new Date() },

    // comm_frontend (6 members)
    { _id: 'mbr_0_front', user_id: 'usr_0', community_id: 'comm_frontend', created_at: new Date() },
    { _id: 'mbr_4_front', user_id: 'usr_4', community_id: 'comm_frontend', created_at: new Date() },
    { _id: 'mbr_6_front', user_id: 'usr_6', community_id: 'comm_frontend', created_at: new Date() },
    { _id: 'mbr_10_front', user_id: 'usr_10', community_id: 'comm_frontend', created_at: new Date() },
    { _id: 'mbr_14_front', user_id: 'usr_14', community_id: 'comm_frontend', created_at: new Date() },
    { _id: 'mbr_18_front', user_id: 'usr_18', community_id: 'comm_frontend', created_at: new Date() },

    // comm_photography (5 members)
    { _id: 'mbr_0_pho', user_id: 'usr_0', community_id: 'comm_photography', created_at: new Date() },
    { _id: 'mbr_2_pho', user_id: 'usr_2', community_id: 'comm_photography', created_at: new Date() },
    { _id: 'mbr_8_pho', user_id: 'usr_8', community_id: 'comm_photography', created_at: new Date() },
    { _id: 'mbr_12_pho', user_id: 'usr_12', community_id: 'comm_photography', created_at: new Date() },
    { _id: 'mbr_16_pho', user_id: 'usr_16', community_id: 'comm_photography', created_at: new Date() },

    // comm_design (6 members)
    { _id: 'mbr_0_des', user_id: 'usr_0', community_id: 'comm_design', created_at: new Date() },
    { _id: 'mbr_4_des', user_id: 'usr_4', community_id: 'comm_design', created_at: new Date() },
    { _id: 'mbr_6_des', user_id: 'usr_6', community_id: 'comm_design', created_at: new Date() },
    { _id: 'mbr_10_des', user_id: 'usr_10', community_id: 'comm_design', created_at: new Date() },
    { _id: 'mbr_12_des', user_id: 'usr_12', community_id: 'comm_design', created_at: new Date() },
    { _id: 'mbr_14_des', user_id: 'usr_14', community_id: 'comm_design', created_at: new Date() },
  ];
  const finalMemberships = isExpanded ? [...memberships, ...expandedMemberships] : memberships;
  const allKnownMbrIds = [...memberships, ...expandedMemberships].map((m) => m._id);
  await mbrsCol.deleteMany({ _id: { $in: allKnownMbrIds } }, { session });
  await mbrsCol.insertMany(finalMemberships, { session });

  // 7. Votes and Saves
  const votes: PostVoteDoc[] = [
    { _id: 'vote_101_0', post_id: 'post_101', user_id: 'usr_0', direction: 1, created_at: new Date(), updated_at: new Date() },
    { _id: 'vote_101_3', post_id: 'post_101', user_id: 'usr_3', direction: 1, created_at: new Date(), updated_at: new Date() },
    { _id: 'vote_102_0', post_id: 'post_102', user_id: 'usr_0', direction: 1, created_at: new Date(), updated_at: new Date() },
    { _id: 'vote_102_4', post_id: 'post_102', user_id: 'usr_4', direction: 1, created_at: new Date(), updated_at: new Date() },
    { _id: 'vote_103_0', post_id: 'post_103', user_id: 'usr_0', direction: 1, created_at: new Date(), updated_at: new Date() },
    { _id: 'vote_105_0', post_id: 'post_105', user_id: 'usr_0', direction: 1, created_at: new Date(), updated_at: new Date() },
    { _id: 'vote_105_1', post_id: 'post_105', user_id: 'usr_1', direction: 1, created_at: new Date(), updated_at: new Date() },
    { _id: 'vote_106_0', post_id: 'post_106', user_id: 'usr_0', direction: 1, created_at: new Date(), updated_at: new Date() },
    { _id: 'vote_107_0', post_id: 'post_107', user_id: 'usr_0', direction: 1, created_at: new Date(), updated_at: new Date() },
    { _id: 'vote_107_4', post_id: 'post_107', user_id: 'usr_4', direction: 1, created_at: new Date(), updated_at: new Date() },
    { _id: 'vote_108_0', post_id: 'post_108', user_id: 'usr_0', direction: 1, created_at: new Date(), updated_at: new Date() },
    { _id: 'vote_109_0', post_id: 'post_109', user_id: 'usr_0', direction: 1, created_at: new Date(), updated_at: new Date() },
    { _id: 'vote_109_2', post_id: 'post_109', user_id: 'usr_2', direction: 1, created_at: new Date(), updated_at: new Date() },
    { _id: 'vote_110_0', post_id: 'post_110', user_id: 'usr_0', direction: 1, created_at: new Date(), updated_at: new Date() },
    { _id: 'vote_111_0', post_id: 'post_111', user_id: 'usr_0', direction: 1, created_at: new Date(), updated_at: new Date() },
    { _id: 'vote_112_0', post_id: 'post_112', user_id: 'usr_0', direction: 1, created_at: new Date(), updated_at: new Date() },
    { _id: 'vote_113_0', post_id: 'post_113', user_id: 'usr_0', direction: 1, created_at: new Date(), updated_at: new Date() },
    { _id: 'vote_114_0', post_id: 'post_114', user_id: 'usr_0', direction: 1, created_at: new Date(), updated_at: new Date() },
  ];
  const finalVotes = isExpanded ? [...votes, ...expandedVotes] : votes;
  const allKnownVoteIds = [...votes, ...expandedVotes].map((v) => v._id);
  await votesCol.deleteMany({ _id: { $in: allKnownVoteIds } }, { session });
  await votesCol.insertMany(finalVotes, { session });

  const saves: PostSaveDoc[] = [
    { _id: 'save_102_0', post_id: 'post_102', user_id: 'usr_0', created_at: new Date() },
    { _id: 'save_105_0', post_id: 'post_105', user_id: 'usr_0', created_at: new Date() },
    { _id: 'save_107_0', post_id: 'post_107', user_id: 'usr_0', created_at: new Date() },
    { _id: 'save_109_0', post_id: 'post_109', user_id: 'usr_0', created_at: new Date() },
  ];
  const finalSaves = isExpanded ? [...saves, ...expandedSaves] : saves;
  const allKnownSaveIds = [...saves, ...expandedSaves].map((s) => s._id);
  await savesCol.deleteMany({ _id: { $in: allKnownSaveIds } }, { session });
  await savesCol.insertMany(finalSaves, { session });

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
  for (const user of finalUsers) {
    await usersCol.updateOne({ _id: user._id }, { $set: {
      followers_count: followerCounts.find((item) => item._id === user._id)?.count ?? 0,
      following_count: followingCounts.find((item) => item._id === user._id)?.count ?? 0,
      posts_count: postCounts.find((item) => item._id === user._id)?.count ?? 0,
    } }, { session });
  }
  for (const community of finalComms) {
    await commsCol.updateOne({ _id: community._id }, { $set: {
      members_count: memberCounts.find((item) => item._id === community._id)?.count ?? 0,
    } }, { session });
  }
  for (const post of finalPosts) {
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
    usersCount: finalUsers.length,
    postsCount: finalPosts.length,
    commentsCount: finalComments.length,
    followsCount: finalFollows.length,
    communitiesCount: finalComms.length,
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
