import { connectMongo, disconnectMongo, getDb } from '../packages/backend/dist/db/mongo.js';
import { AuthService } from '../packages/backend/dist/services/AuthService.js';

const BASE_URL = 'http://127.0.0.1:4000';

async function main() {
  console.log('=== Social Exploration Live API Verification ===');
  await connectMongo();
  const authService = new AuthService();
  const session = await authService.createSession('usr_0');
  const authHeaders = {
    'Cookie': `sg_session=${session.token}`,
    'x-csrf-token': session.csrf_token,
  };

  // 1. Discover Feed
  console.log('\n--- 1. Testing Discover (Visual & Discussion) ---');
  const discRes = await fetch(`${BASE_URL}/api/v1/discovery?limit=12`);
  if (!discRes.ok) throw new Error(`Discover failed: ${discRes.status}`);
  const discData = await discRes.json();
  console.log(`Discover returned ${discData.data.length} posts, has_more=${discData.has_more}`);
  if (discData.data.length !== 12) throw new Error('Expected 12 posts from discover');

  // 1b. Main Feed
  console.log('\n--- 1b. Testing Main Feed ---');
  const feedRes = await fetch(`${BASE_URL}/api/v1/feed?limit=12&sort=hot`);
  if (!feedRes.ok) throw new Error(`Main feed failed: ${feedRes.status}`);
  const feedData = await feedRes.json();
  console.log(`Feed returned ${feedData.data.length} posts, has_more=${feedData.has_more}`);

  // 2. Search
  console.log('\n--- 2. Testing Universal Search ---');
  const searchQueries = ['systems', 'database', 'Elena', 'shader'];
  for (const q of searchQueries) {
    const sRes = await fetch(`${BASE_URL}/api/v1/search?q=${encodeURIComponent(q)}`);
    if (!sRes.ok) throw new Error(`Search failed for ${q}: ${sRes.status}`);
    const sData = await sRes.json();
    const uCount = sData.users?.length ?? 0;
    const pCount = sData.posts?.length ?? 0;
    const cCount = sData.communities?.length ?? 0;
    console.log(`Query "${q}": found ${uCount} users, ${pCount} posts, ${cCount} communities`);
    if (uCount + pCount + cCount === 0) {
      throw new Error(`Expected results for query "${q}" but got 0`);
    }
  }

  // 3. User Profiles & Social Graph
  console.log('\n--- 3. Testing User Profiles & Social Graph ---');
  const testProfiles = ['alex_dev', 'vikram_db', 'elena_arch', 'kenji_sys'];
  for (const username of testProfiles) {
    const uRes = await fetch(`${BASE_URL}/api/v1/users/${username}`, { headers: authHeaders });
    if (!uRes.ok) throw new Error(`User profile failed for ${username}: ${uRes.status}`);
    const uData = await uRes.json();
    console.log(`User @${uData.username} (${uData.display_name}): ${uData.followers_count} followers, ${uData.following_count} following, ${uData.posts_count} posts`);
    if (typeof uData.followers_count !== 'number' || typeof uData.posts_count !== 'number') {
      throw new Error(`Invalid profile structure for @${username}`);
    }
  }

  // 4. Communities & Memberships
  console.log('\n--- 4. Testing Communities ---');
  const cListRes = await fetch(`${BASE_URL}/api/v1/communities`, { headers: authHeaders });
  if (!cListRes.ok) throw new Error(`Community listing failed: ${cListRes.status}`);
  const cListData = await cListRes.json();
  console.log(`Total communities retrieved: ${cListData.length}`);
  if (cListData.length < 15 || cListData.length > 20) throw new Error(`Expected 15-20 communities, got ${cListData.length}`);

  for (const comm of cListData.slice(0, 3)) {
    console.log(` - Community /c/${comm.slug}: "${comm.name}" (${comm.members_count} members, is_member=${comm.is_member})`);
  }

  // 5. Post Details & Hierarchical Comment Threads
  console.log('\n--- 5. Testing Post Details & Comments ---');
  const postDetailRes = await fetch(`${BASE_URL}/api/v1/posts/post_101`, { headers: authHeaders });
  if (!postDetailRes.ok) throw new Error(`Post detail failed: ${postDetailRes.status}`);
  const postDetail = await postDetailRes.json();
  console.log(`Post [post_101] title: "${postDetail.title}" (score: ${postDetail.score}, comments: ${postDetail.comments_count})`);

  const commentsRes = await fetch(`${BASE_URL}/api/v1/posts/post_101/comments`, { headers: authHeaders });
  if (!commentsRes.ok) throw new Error(`Comments failed: ${commentsRes.status}`);
  const commentsData = await commentsRes.json();
  console.log(`Post [post_101] comments tree count: ${commentsData.length} root items`);
  if (commentsData.length === 0) throw new Error('Expected comments for post_101');

  // 6. Saved Posts
  console.log('\n--- 6. Testing Saved Posts ---');
  const savedRes = await fetch(`${BASE_URL}/api/v1/posts/saved?limit=10`, { headers: authHeaders });
  if (!savedRes.ok) throw new Error(`Saved posts failed: ${savedRes.status}`);
  const savedData = await savedRes.json();
  console.log(`usr_0 saved posts retrieved: ${savedData.data.length} items`);
  if (savedData.data.length === 0) throw new Error('Expected saved posts for usr_0');

  // Clean up test session
  await getDb().collection('sessions').deleteOne({ _id: session.token });
  await disconnectMongo();
  console.log('\n[PASS] All Social Exploration live API checks passed successfully!');
}

main().catch((err) => {
  console.error('[FAIL]', err);
  process.exit(1);
});
