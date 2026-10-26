import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialgraph?replicaSet=rs0';

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('socialgraph');

  const postsCol = db.collection('posts');
  const commentsCol = db.collection('comments');
  const usersCol = db.collection('users');
  const communitiesCol = db.collection('communities');

  const allPosts = await postsCol.find().toArray();
  const allComments = await commentsCol.find().toArray();
  const allUsers = await usersCol.find().toArray();
  const allCommunities = await communitiesCol.find().toArray();

  console.log(`Total Posts: ${allPosts.length}`);
  console.log(`Total Comments: ${allComments.length}`);
  console.log(`Total Users: ${allUsers.length}`);
  console.log(`Total Communities: ${allCommunities.length}`);

  // 1. Post types distribution
  const typeCounts = {};
  for (const p of allPosts) {
    typeCounts[p.post_type] = (typeCounts[p.post_type] || 0) + 1;
  }
  console.log('\nPost Types Distribution:', typeCounts);

  // 2. Image URL reuse
  const imageUrlMap = new Map();
  for (const p of allPosts) {
    const mediaList = Array.isArray(p.media) ? p.media : (p.media ? [p.media] : []);
    for (const m of mediaList) {
      if (m && m.url) {
        if (!imageUrlMap.has(m.url)) imageUrlMap.set(m.url, []);
        imageUrlMap.get(m.url).push(p._id);
      }
    }
  }

  const reusedImages = [];
  for (const [url, postIds] of imageUrlMap.entries()) {
    if (postIds.length > 1) {
      reusedImages.push({ url, count: postIds.length, postIds: postIds.slice(0, 5) });
    }
  }
  console.log(`\nUnique Image URLs: ${imageUrlMap.size}`);
  console.log(`Reused Image URLs across posts: ${reusedImages.length}`);
  if (reusedImages.length > 0) {
    console.log('Top Reused Images:', reusedImages.slice(0, 10));
  }

  // 3. Caption / Title repetition or patterns
  const titleMap = new Map();
  const patternMap = new Map();
  for (const p of allPosts) {
    const t = (p.title || '').trim().toLowerCase();
    if (!titleMap.has(t)) titleMap.set(t, []);
    titleMap.get(t).push(p._id);

    // check patterns like "Deep dive into...", "Notes on...", "Exploring..."
    const prefix = t.split(' ').slice(0, 3).join(' ');
    if (!patternMap.has(prefix)) patternMap.set(prefix, 0);
    patternMap.set(prefix, patternMap.get(prefix) + 1);
  }

  const duplicateTitles = [];
  for (const [t, pids] of titleMap.entries()) {
    if (pids.length > 1) duplicateTitles.push({ title: t, count: pids.length });
  }
  console.log(`\nExact Duplicate Titles: ${duplicateTitles.length}`);
  if (duplicateTitles.length > 0) {
    console.log('Sample Duplicate Titles:', duplicateTitles.slice(0, 5));
  }

  const frequentPrefixes = [...patternMap.entries()].filter(([k, v]) => v >= 5).sort((a, b) => b[1] - a[1]);
  console.log('Frequent Title Prefixes (>=5):', frequentPrefixes);

  // 4. Multi-image posts count
  let multiImagePostsCount = 0;
  for (const p of allPosts) {
    if (Array.isArray(p.media) && p.media.length > 1) {
      multiImagePostsCount++;
    }
  }
  console.log(`\nMulti-image posts currently: ${multiImagePostsCount}`);

  // 5. Posts per community
  const commCounts = {};
  for (const p of allPosts) {
    const cid = p.community_id || 'no_community';
    commCounts[cid] = (commCounts[cid] || 0) + 1;
  }
  console.log('\nPosts per Community:', commCounts);

  // 6. Comment content analysis
  const commentTextMap = new Map();
  for (const c of allComments) {
    const text = (c.content || '').trim().toLowerCase();
    if (!commentTextMap.has(text)) commentTextMap.set(text, 0);
    commentTextMap.set(text, commentTextMap.get(text) + 1);
  }
  const duplicateComments = [...commentTextMap.entries()].filter(([k, v]) => v > 1).sort((a, b) => b[1] - a[1]);
  console.log(`\nDuplicate Comments count: ${duplicateComments.length}`);
  if (duplicateComments.length > 0) {
    console.log('Sample repeated comments:', duplicateComments.slice(0, 10));
  }

  // 7. Check image domains
  const domainCounts = {};
  for (const url of imageUrlMap.keys()) {
    try {
      const u = new URL(url);
      domainCounts[u.hostname] = (domainCounts[u.hostname] || 0) + 1;
    } catch {
      domainCounts['invalid_url'] = (domainCounts['invalid_url'] || 0) + 1;
    }
  }
  console.log('\nImage Domains:', domainCounts);

  await client.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
