import fs from 'node:fs';
import path from 'node:path';

const seedPath = path.resolve('packages/backend/src/db/seed.ts');
let content = fs.readFileSync(seedPath, 'utf8');

// 1. Add import for expanded dataset at top
const importStatement = `import {
  expandedPersonas,
  expandedCommunities,
  expandedPosts,
  expandedComments,
  expandedFollows,
  expandedMemberships,
  expandedVotes,
  expandedSaves,
} from './fixtures/expandedDataset.js';\n`;

if (!content.includes('expandedDataset.js')) {
  content = content.replace("import { runInTransaction } from './transaction.js';", `import { runInTransaction } from './transaction.js';\n${importStatement}`);
}

// 2. Update function signature to accept options
content = content.replace(
  'export async function seedDatabase(db: Db): Promise<{',
  `export async function seedDatabase(
  db: Db,
  options: { mode?: 'baseline' | 'expanded' } = {}
): Promise<{`
);

// 3. In follows, adjust the 4 items for core invariants
const oldFollowsBlock = `    { _id: 'flw_0_1', follower_id: 'usr_0', target_user_id: 'usr_1', created_at: new Date() },
    { _id: 'flw_0_2', follower_id: 'usr_0', target_user_id: 'usr_2', created_at: new Date() },
    { _id: 'flw_0_3', follower_id: 'usr_0', target_user_id: 'usr_3', created_at: new Date() },
    { _id: 'flw_0_4', follower_id: 'usr_0', target_user_id: 'usr_4', created_at: new Date() },
    { _id: 'flw_0_9', follower_id: 'usr_0', target_user_id: 'usr_9', created_at: new Date() },
    { _id: 'flw_0_10', follower_id: 'usr_0', target_user_id: 'usr_10', created_at: new Date() },
    { _id: 'flw_1_0', follower_id: 'usr_1', target_user_id: 'usr_0', created_at: new Date() },
    { _id: 'flw_1_2', follower_id: 'usr_1', target_user_id: 'usr_2', created_at: new Date() },
    { _id: 'flw_1_5', follower_id: 'usr_1', target_user_id: 'usr_5', created_at: new Date() },
    { _id: 'flw_1_11', follower_id: 'usr_1', target_user_id: 'usr_11', created_at: new Date() },
    { _id: 'flw_2_4', follower_id: 'usr_2', target_user_id: 'usr_4', created_at: new Date() },
    { _id: 'flw_2_8', follower_id: 'usr_2', target_user_id: 'usr_8', created_at: new Date() },
    { _id: 'flw_2_16', follower_id: 'usr_2', target_user_id: 'usr_16', created_at: new Date() },
    { _id: 'flw_3_1', follower_id: 'usr_3', target_user_id: 'usr_1', created_at: new Date() },
    { _id: 'flw_3_11', follower_id: 'usr_3', target_user_id: 'usr_11', created_at: new Date() },
    { _id: 'flw_4_6', follower_id: 'usr_4', target_user_id: 'usr_6', created_at: new Date() },
    { _id: 'flw_4_10', follower_id: 'usr_4', target_user_id: 'usr_10', created_at: new Date() },
    { _id: 'flw_5_7', follower_id: 'usr_5', target_user_id: 'usr_7', created_at: new Date() },
    { _id: 'flw_5_17', follower_id: 'usr_5', target_user_id: 'usr_17', created_at: new Date() },
    { _id: 'flw_6_12', follower_id: 'usr_6', target_user_id: 'usr_12', created_at: new Date() },
    { _id: 'flw_8_2', follower_id: 'usr_8', target_user_id: 'usr_2', created_at: new Date() },
    { _id: 'flw_9_13', follower_id: 'usr_9', target_user_id: 'usr_13', created_at: new Date() },
    { _id: 'flw_10_18', follower_id: 'usr_10', target_user_id: 'usr_18', created_at: new Date() },
    { _id: 'flw_18_14', follower_id: 'usr_18', target_user_id: 'usr_14', created_at: new Date() },`;

const newFollowsBlock = `    { _id: 'flw_0_1', follower_id: 'usr_0', target_user_id: 'usr_1', created_at: new Date() },
    { _id: 'flw_0_2', follower_id: 'usr_0', target_user_id: 'usr_2', created_at: new Date() },
    { _id: 'flw_0_3', follower_id: 'usr_0', target_user_id: 'usr_3', created_at: new Date() },
    { _id: 'flw_1_0', follower_id: 'usr_1', target_user_id: 'usr_0', created_at: new Date() },
    { _id: 'flw_1_2', follower_id: 'usr_1', target_user_id: 'usr_2', created_at: new Date() },
    { _id: 'flw_1_5', follower_id: 'usr_1', target_user_id: 'usr_5', created_at: new Date() },
    { _id: 'flw_1_11', follower_id: 'usr_1', target_user_id: 'usr_11', created_at: new Date() },
    { _id: 'flw_2_4', follower_id: 'usr_2', target_user_id: 'usr_4', created_at: new Date() },
    { _id: 'flw_2_8', follower_id: 'usr_2', target_user_id: 'usr_8', created_at: new Date() },
    { _id: 'flw_2_16', follower_id: 'usr_2', target_user_id: 'usr_16', created_at: new Date() },
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
    { _id: 'flw_18_14', follower_id: 'usr_18', target_user_id: 'usr_14', created_at: new Date() },`;

content = content.replace(oldFollowsBlock.replace(/\r?\n/g, '\r\n'), newFollowsBlock.replace(/\r?\n/g, '\r\n'));
content = content.replace(
  "{ _id: 'mbr_3_sys', user_id: 'usr_3', community_id: 'comm_systems', created_at: new Date() },",
  "{ _id: 'mbr_6_sys', user_id: 'usr_6', community_id: 'comm_systems', created_at: new Date() },"
);

// 4. Incorporate expanded data depending on mode
// Determine mode
const modeLogic = `    const isExpanded = (options.mode ?? process.env.SEED_MODE ?? 'expanded') === 'expanded';

    const finalUsers = isExpanded ? [...allUsers, ...expandedPersonas] : allUsers;
    const finalComms = isExpanded ? [...communities, ...expandedCommunities] : communities;
    const finalPosts = isExpanded ? [...posts, ...expandedPosts] : posts;
    const finalComments = isExpanded ? [...comments, ...expandedComments] : comments;
    const finalFollows = isExpanded ? [...follows, ...expandedFollows] : follows;
    const finalMemberships = isExpanded ? [...memberships, ...expandedMemberships] : memberships;
    const finalVotes = isExpanded ? [...votes, ...expandedVotes] : votes;
    const finalSaves = isExpanded ? [...saves, ...expandedSaves] : saves;
`;

// Insert mode logic right before users insertion
content = content.replace(
  '  const allUsers = [...coreUsers, ...extendedPersonas];',
  `  const allUsers = [...coreUsers, ...extendedPersonas];\n${modeLogic}`
);

// Replace user iteration
content = content.replace('for (const user of allUsers) {', 'for (const user of finalUsers) {');

// Replace deletes and inserts to use final* collections
// and clean up all known fixture IDs (both baseline and expanded) to ensure clean idempotency
content = content.replace(
  'await commsCol.deleteMany({ _id: { $in: communities.map((c) => c._id) } }, { session });\n  await commsCol.insertMany(communities, { session });',
  `const allKnownCommIds = [...communities, ...expandedCommunities].map((c) => c._id);
  await commsCol.deleteMany({ _id: { $in: allKnownCommIds } }, { session });
  await commsCol.insertMany(finalComms, { session });`
);

content = content.replace(
  'await postsCol.deleteMany({ _id: { $in: posts.map((p) => p._id) } }, { session });\n  await postsCol.insertMany(posts, { session });',
  `const allKnownPostIds = [...posts, ...expandedPosts].map((p) => p._id);
  await postsCol.deleteMany({ _id: { $in: allKnownPostIds } }, { session });
  await postsCol.insertMany(finalPosts, { session });`
);

content = content.replace(
  'await commentsCol.deleteMany({ _id: { $in: comments.map((c) => c._id) } }, { session });\n  await commentsCol.insertMany(comments, { session });',
  `const allKnownCommentIds = [...comments, ...expandedComments].map((c) => c._id);
  await commentsCol.deleteMany({ _id: { $in: allKnownCommentIds } }, { session });
  await commentsCol.insertMany(finalComments, { session });`
);

content = content.replace(
  'await followsCol.deleteMany({ _id: { $in: follows.map((f) => f._id) } }, { session });\n  await followsCol.insertMany(follows, { session });',
  `const allKnownFollowIds = [...follows, ...expandedFollows].map((f) => f._id);
  await followsCol.deleteMany({ _id: { $in: allKnownFollowIds } }, { session });
  await followsCol.insertMany(finalFollows, { session });`
);

content = content.replace(
  'await mbrsCol.deleteMany({ _id: { $in: memberships.map((m) => m._id) } }, { session });\n  await mbrsCol.insertMany(memberships, { session });',
  `const allKnownMbrIds = [...memberships, ...expandedMemberships].map((m) => m._id);
  await mbrsCol.deleteMany({ _id: { $in: allKnownMbrIds } }, { session });
  await mbrsCol.insertMany(finalMemberships, { session });`
);

content = content.replace(
  'await votesCol.deleteMany({ _id: { $in: votes.map((v) => v._id) } }, { session });\n  await votesCol.insertMany(votes, { session });',
  `const allKnownVoteIds = [...votes, ...expandedVotes].map((v) => v._id);
  await votesCol.deleteMany({ _id: { $in: allKnownVoteIds } }, { session });
  await votesCol.insertMany(finalVotes, { session });`
);

content = content.replace(
  'await savesCol.deleteMany({ _id: { $in: saves.map((s) => s._id) } }, { session });\n  await savesCol.insertMany(saves, { session });',
  `const allKnownSaveIds = [...saves, ...expandedSaves].map((s) => s._id);
  await savesCol.deleteMany({ _id: { $in: allKnownSaveIds } }, { session });
  await savesCol.insertMany(finalSaves, { session });`
);

// Update aggregation loop targets
content = content.replace('for (const user of allUsers) {', 'for (const user of finalUsers) {');
content = content.replace('for (const community of communities) {', 'for (const community of finalComms) {');
content = content.replace('for (const post of posts) {', 'for (const post of finalPosts) {');

// Update return stats
content = content.replace(
  `    usersCount: allUsers.length,
    postsCount: posts.length,
    commentsCount: comments.length,
    followsCount: follows.length,
    communitiesCount: communities.length,`,
  `    usersCount: finalUsers.length,
    postsCount: finalPosts.length,
    commentsCount: finalComments.length,
    followsCount: finalFollows.length,
    communitiesCount: finalComms.length,`
);

fs.writeFileSync(seedPath, content, 'utf8');
console.log('Successfully patched packages/backend/src/db/seed.ts');
