import fs from 'node:fs';
import path from 'node:path';

const seedPath = path.resolve('packages/backend/src/db/seed.ts');
let content = fs.readFileSync(seedPath, 'utf8').replace(/\r\n/g, '\n');

// 1. comms
content = content.replace(
  `  await commsCol.deleteMany({ _id: { $in: communities.map((c) => c._id) } }, { session });\n  await commsCol.insertMany(communities, { session });`,
  `  const allKnownCommIds = [...communities, ...expandedCommunities].map((c) => c._id);
  await commsCol.deleteMany({ _id: { $in: allKnownCommIds } }, { session });
  await commsCol.insertMany(finalComms, { session });`
);

// 2. posts
content = content.replace(
  `  await postsCol.deleteMany({ _id: { $in: posts.map((p) => p._id) } }, { session });\n  await postsCol.insertMany(posts, { session });`,
  `  const allKnownPostIds = [...posts, ...expandedPosts].map((p) => p._id);
  await postsCol.deleteMany({ _id: { $in: allKnownPostIds } }, { session });
  await postsCol.insertMany(finalPosts, { session });`
);

// 3. comments
content = content.replace(
  `  await commentsCol.deleteMany({ _id: { $in: comments.map((c) => c._id) } }, { session });\n  await commentsCol.insertMany(comments, { session });`,
  `  const allKnownCommentIds = [...comments, ...expandedComments].map((c) => c._id);
  await commentsCol.deleteMany({ _id: { $in: allKnownCommentIds } }, { session });
  await commentsCol.insertMany(finalComments, { session });`
);

// 4. follows
content = content.replace(
  `  await followsCol.deleteMany({ _id: { $in: follows.map((f) => f._id) } }, { session });\n  await followsCol.insertMany(follows, { session });`,
  `  const allKnownFollowIds = [...follows, ...expandedFollows].map((f) => f._id);
  await followsCol.deleteMany({ _id: { $in: allKnownFollowIds } }, { session });
  await followsCol.insertMany(finalFollows, { session });`
);

// 5. memberships
content = content.replace(
  `  await mbrsCol.deleteMany({ _id: { $in: memberships.map((m) => m._id) } }, { session });\n  await mbrsCol.insertMany(memberships, { session });`,
  `  const allKnownMbrIds = [...memberships, ...expandedMemberships].map((m) => m._id);
  await mbrsCol.deleteMany({ _id: { $in: allKnownMbrIds } }, { session });
  await mbrsCol.insertMany(finalMemberships, { session });`
);

// 6. votes
content = content.replace(
  `  await votesCol.deleteMany({ _id: { $in: votes.map((v) => v._id) } }, { session });\n  await votesCol.insertMany(votes, { session });`,
  `  const allKnownVoteIds = [...votes, ...expandedVotes].map((v) => v._id);
  await votesCol.deleteMany({ _id: { $in: allKnownVoteIds } }, { session });
  await votesCol.insertMany(finalVotes, { session });`
);

// 7. saves
content = content.replace(
  `  await savesCol.deleteMany({ _id: { $in: saves.map((s) => s._id) } }, { session });\n  await savesCol.insertMany(saves, { session });`,
  `  const allKnownSaveIds = [...saves, ...expandedSaves].map((s) => s._id);
  await savesCol.deleteMany({ _id: { $in: allKnownSaveIds } }, { session });
  await savesCol.insertMany(finalSaves, { session });`
);

// 8. return stats
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

// Write back with CRLF
fs.writeFileSync(seedPath, content.replace(/\n/g, '\r\n'), 'utf8');
console.log('Successfully completed normalized replacements in seed.ts');
