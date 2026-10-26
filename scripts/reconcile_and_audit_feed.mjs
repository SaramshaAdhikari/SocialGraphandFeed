import { MongoClient } from 'mongodb';
import fs from 'node:fs';

async function main() {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  const db = client.db('socialgraph');

  console.log('=== 1. DATABASE ENTITY INVENTORY ===');
  const collections = ['users', 'posts', 'comments', 'follows', 'communities', 'community_memberships', 'post_votes', 'post_saves', 'sessions'];
  const dbCounts = {};
  for (const col of collections) {
    dbCounts[col] = await db.collection(col).countDocuments();
    console.log(`- ${col}: ${dbCounts[col]} documents`);
  }

  // User breakdown
  const users = await db.collection('users').find({}).toArray();
  const baselineUsers = users.filter(u => /^usr_([0-9]|1[0-9])$/.test(u._id)); // usr_0 to usr_19
  const expandedUsers = users.filter(u => /^usr_(2[0-9]|3[0-9]|4[0-9]|5[0-9]|6[0-4])$/.test(u._id)); // usr_20 to usr_64
  const nonFixtureUsers = users.filter(u => !/^usr_[0-9]+$/.test(u._id));

  console.log('\n=== USER RECONCILIATION ===');
  console.log(`Baseline fixture users (usr_0..usr_19): ${baselineUsers.length}`);
  console.log(`Expanded fixture users (usr_20..usr_64): ${expandedUsers.length}`);
  console.log(`Total fixture users: ${baselineUsers.length + expandedUsers.length}`);
  console.log(`User-created non-fixture accounts: ${nonFixtureUsers.length}`);
  nonFixtureUsers.forEach(u => console.log(`  * ${u._id} (@${u.username}) role=${u.role || 'user'}`));
  console.log(`Total users in DB: ${users.length}`);

  // Post breakdown
  const posts = await db.collection('posts').find({}).toArray();
  const baselinePosts = posts.filter(p => {
    // post_101 to post_200, post_tie_301, post_tie_302
    return /^post_1[0-9]{2}$/.test(p._id) || p._id === 'post_tie_301' || p._id === 'post_tie_302';
  });
  const expandedPosts = posts.filter(p => /^post_(2[0-9]{2}|3[0-9]{2}|4[0-2][0-4])$/.test(p._id)); // post_201 to post_424
  const userCreatedPosts = posts.filter(p => !/^post_[0-9]+$/.test(p._id) && p._id !== 'post_tie_301' && p._id !== 'post_tie_302');

  console.log('\n=== POST RECONCILIATION ===');
  console.log(`Baseline fixture posts: ${baselinePosts.length} (including post_tie_301 & post_tie_302)`);
  console.log(`Expanded fixture posts: ${expandedPosts.length}`);
  console.log(`Total fixture posts: ${baselinePosts.length + expandedPosts.length}`);
  console.log(`User-created non-fixture posts: ${userCreatedPosts.length}`);
  userCreatedPosts.forEach(p => console.log(`  * ${p._id} author=${p.author_id} title="${p.title}"`));
  console.log(`Total posts in DB: ${posts.length}`);

  // Comments breakdown
  const comments = await db.collection('comments').find({}).toArray();
  const rootComments = comments.filter(c => !c.parent_id);
  const replies = comments.filter(c => Boolean(c.parent_id));
  const depth1Replies = replies.filter(r => {
    const parent = comments.find(c => c._id === r.parent_id);
    return parent && !parent.parent_id;
  });
  const depth2Replies = replies.filter(r => {
    const parent = comments.find(c => c._id === r.parent_id);
    return parent && Boolean(parent.parent_id);
  });
  console.log('\n=== COMMENT RECONCILIATION ===');
  console.log(`Total comments in DB: ${comments.length}`);
  console.log(`- Root comments (parent_id: null): ${rootComments.length}`);
  console.log(`- Total replies: ${replies.length}`);
  console.log(`  • Depth-1 replies: ${depth1Replies.length}`);
  console.log(`  • Depth-2 replies: ${depth2Replies.length}`);

  // Communities breakdown
  const comms = await db.collection('communities').find({}).toArray();
  console.log('\n=== COMMUNITY RECONCILIATION ===');
  console.log(`Total communities in DB: ${comms.length}`);
  comms.forEach(c => console.log(`  * ${c._id} (/c/${c.slug}): "${c.name}"`));

  // Inspect the first 50 posts sorted by new (as users encounter in feed)
  console.log('\n=== FIRST 40 POSTS IN CHRONOLOGICAL FEED (sort=new) ===');
  const feedPosts = await db.collection('posts').find({}).sort({ created_at: -1 }).limit(40).toArray();
  feedPosts.forEach((p, idx) => {
    const mediaCount = p.media ? (Array.isArray(p.media) ? p.media.length : 1) : 0;
    const author = users.find(u => u._id === p.author_id);
    const authorHandle = author ? `@${author.username}` : p.author_id;
    console.log(`[#${idx + 1}] [${p._id}] type=${p.post_type} by=${authorHandle} in=/c/${p.community_slug || 'none'}`);
    console.log(`     Title: "${p.title}"`);
    if (p.caption) console.log(`     Caption: "${p.caption}"`);
    if (p.content) console.log(`     Content: "${p.content.slice(0, 120)}${p.content.length > 120 ? '...' : ''}"`);
    console.log(`     Media: ${mediaCount} items | Tags: [${(p.tags || []).join(', ')}] | Score: ${p.score} | Comments: ${p.comments_count}`);
  });

  await client.close();
}

main().catch(console.error);
