import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.MONGODB_DB_NAME || 'socialgraph';

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const collections = [
    'users',
    'posts',
    'comments',
    'follows',
    'communities',
    'community_memberships',
    'post_votes',
    'post_saves',
    'sessions',
    'notifications',
    'reports',
    'feed_inboxes'
  ];

  console.log(`=== DB Audit for [${dbName}] ===`);
  const counts = {};
  for (const colName of collections) {
    try {
      const c = await db.collection(colName).countDocuments();
      counts[colName] = c;
      console.log(`- ${colName}: ${c}`);
    } catch (e) {
      counts[colName] = `Error: ${e.message}`;
      console.log(`- ${colName}: Error: ${e.message}`);
    }
  }

  // Integrity checks
  console.log('\n--- Integrity Checks ---');

  // 1. Follows referential integrity
  const follows = await db.collection('follows').find({}).toArray();
  const userIds = new Set((await db.collection('users').find({}, { projection: { _id: 1 } }).toArray()).map(u => u._id));
  let orphanFollowers = 0;
  let orphanTargets = 0;
  for (const f of follows) {
    if (!userIds.has(f.follower_id)) orphanFollowers++;
    if (!userIds.has(f.target_user_id)) orphanTargets++;
  }
  console.log(`Follows integrity: total=${follows.length}, orphanFollowers=${orphanFollowers}, orphanTargets=${orphanTargets}`);

  // 2. Posts referential integrity
  const posts = await db.collection('posts').find({}).toArray();
  const commIds = new Set((await db.collection('communities').find({}, { projection: { _id: 1 } }).toArray()).map(c => c._id));
  let orphanPostAuthors = 0;
  let orphanPostCommunities = 0;
  for (const p of posts) {
    if (!userIds.has(p.author_id)) orphanPostAuthors++;
    if (p.community_id && !commIds.has(p.community_id)) orphanPostCommunities++;
  }
  console.log(`Posts integrity: total=${posts.length}, orphanAuthors=${orphanPostAuthors}, orphanCommunities=${orphanPostCommunities}`);

  // 3. Comments referential integrity & tree validation
  const comments = await db.collection('comments').find({}).toArray();
  const postIds = new Set(posts.map(p => p._id));
  const commentIds = new Set(comments.map(c => c._id));
  let orphanCommentAuthors = 0;
  let orphanCommentPosts = 0;
  let orphanCommentParents = 0;
  for (const c of comments) {
    if (!userIds.has(c.author_id)) orphanCommentAuthors++;
    if (!postIds.has(c.post_id)) orphanCommentPosts++;
    if (c.parent_id && !commentIds.has(c.parent_id)) orphanCommentParents++;
  }
  console.log(`Comments integrity: total=${comments.length}, orphanAuthors=${orphanCommentAuthors}, orphanPosts=${orphanCommentPosts}, orphanParents=${orphanCommentParents}`);

  // 4. Community memberships referential integrity
  const memberships = await db.collection('community_memberships').find({}).toArray();
  let orphanMemberUsers = 0;
  let orphanMemberCommunities = 0;
  for (const m of memberships) {
    if (!userIds.has(m.user_id)) orphanMemberUsers++;
    if (!commIds.has(m.community_id)) orphanMemberCommunities++;
  }
  console.log(`Memberships integrity: total=${memberships.length}, orphanUsers=${orphanMemberUsers}, orphanCommunities=${orphanMemberCommunities}`);

  // 5. Votes and Saves referential integrity
  const votes = await db.collection('post_votes').find({}).toArray();
  let orphanVoteUsers = 0;
  let orphanVotePosts = 0;
  for (const v of votes) {
    if (!userIds.has(v.user_id)) orphanVoteUsers++;
    if (!postIds.has(v.post_id)) orphanVotePosts++;
  }
  console.log(`Votes integrity: total=${votes.length}, orphanUsers=${orphanVoteUsers}, orphanPosts=${orphanVotePosts}`);

  const saves = await db.collection('post_saves').find({}).toArray();
  let orphanSaveUsers = 0;
  let orphanSavePosts = 0;
  for (const s of saves) {
    if (!userIds.has(s.user_id)) orphanSaveUsers++;
    if (!postIds.has(s.post_id)) orphanSavePosts++;
  }
  console.log(`Saves integrity: total=${saves.length}, orphanUsers=${orphanSaveUsers}, orphanPosts=${orphanSavePosts}`);

  // 6. Counter accuracy
  console.log('\n--- Counter Consistency ---');
  const users = await db.collection('users').find({}).toArray();
  let followerCountMismatches = 0;
  let followingCountMismatches = 0;
  let postCountMismatches = 0;
  for (const u of users) {
    const actualFollowers = follows.filter(f => f.target_user_id === u._id).length;
    const actualFollowing = follows.filter(f => f.follower_id === u._id).length;
    const actualPosts = posts.filter(p => p.author_id === u._id).length;
    if (u.followers_count !== actualFollowers) followerCountMismatches++;
    if (u.following_count !== actualFollowing) followingCountMismatches++;
    if (u.posts_count !== actualPosts) postCountMismatches++;
  }
  console.log(`User counter mismatches: followers=${followerCountMismatches}, following=${followingCountMismatches}, posts=${postCountMismatches}`);

  const communities = await db.collection('communities').find({}).toArray();
  let memberCountMismatches = 0;
  for (const c of communities) {
    const actualMembers = memberships.filter(m => m.community_id === c._id).length;
    if (c.members_count !== actualMembers) memberCountMismatches++;
  }
  console.log(`Community member counter mismatches: ${memberCountMismatches}`);

  let postScoreMismatches = 0;
  let postCommentCountMismatches = 0;
  for (const p of posts) {
    const actualScore = votes.filter(v => v.post_id === p._id).reduce((sum, v) => sum + v.direction, 0);
    const actualComments = comments.filter(c => c.post_id === p._id).length;
    if (p.score !== actualScore) postScoreMismatches++;
    if (p.comments_count !== actualComments) postCommentCountMismatches++;
  }
  console.log(`Post counter mismatches: score=${postScoreMismatches}, comments_count=${postCommentCountMismatches}`);

  await client.close();
  return counts;
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
