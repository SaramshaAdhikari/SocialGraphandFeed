import http from 'http';
import { MongoClient } from 'mongodb';

const BASE_URL = 'http://127.0.0.1:4000/api/v1';

async function request(path, options = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  return new Promise((resolve, reject) => {
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let body;
        try {
          body = JSON.parse(data);
        } catch {
          body = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body,
        });
      });
    });
    req.on('error', reject);
    if (options.body !== undefined) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function main() {
  const mongo = new MongoClient('mongodb://127.0.0.1:27017/socialgraph');
  await mongo.connect();
  const db = mongo.db('socialgraph');

  console.log('=== Authenticated Feed Scopes Verification ===');

  // Get CSRF token
  const csrfRes = await request('/auth/csrf');
  const csrfCookie = csrfRes.headers['set-cookie']?.[0]?.split(';')?.[0] || '';
  const csrfToken = csrfRes.body.csrf_token;

  // Register a temporary test user with 0 follows and 0 community memberships
  const testId = `temp_feed_${Date.now()}`;
  const regRes = await request('/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
      Cookie: csrfCookie,
    },
    body: {
      username: testId,
      password: 'StrongPassword123!',
      password_confirmation: 'StrongPassword123!',
    },
  });

  if (regRes.status !== 200) {
    throw new Error(`Failed to register temp user: ${JSON.stringify(regRes.body)}`);
  }

  const rawCookie = regRes.headers['set-cookie']?.[0] || '';
  const authCookie = rawCookie.split(';')[0];
  const authCsrf = regRes.body.csrf_token;
  const tempUserId = regRes.body.user.id;

  try {
    // 1. With 0 follows, Following feed should be empty
    const followingEmpty = await request('/feed?scope=following', {
      headers: { Cookie: authCookie },
    });
    console.log(`Temp user (0 follows) Following feed: length=${followingEmpty.body.data.length}, has_more=${followingEmpty.body.has_more}`);
    if (followingEmpty.status !== 200 || followingEmpty.body.data.length !== 0 || followingEmpty.body.has_more !== false) {
      throw new Error(`Expected empty following feed for zero-follow user!`);
    }

    // 2. With 0 community memberships, Communities feed should be empty
    const commEmpty = await request('/feed?scope=communities', {
      headers: { Cookie: authCookie },
    });
    console.log(`Temp user (0 memberships) Communities feed: length=${commEmpty.body.data.length}, has_more=${commEmpty.body.has_more}`);
    if (commEmpty.status !== 200 || commEmpty.body.data.length !== 0 || commEmpty.body.has_more !== false) {
      throw new Error(`Expected empty communities feed for zero-membership user!`);
    }

    // 3. Now join 'systems' community
    const joinRes = await request('/communities/systems/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie, 'X-CSRF-Token': authCsrf },
      body: {},
    });
    if (joinRes.status !== 200) {
      throw new Error(`Failed to join systems community: ${JSON.stringify(joinRes.body)}`);
    }

    // 4. Communities feed should now contain posts from 'systems' community
    const commWithPosts = await request('/feed?scope=communities', {
      headers: { Cookie: authCookie },
    });
    console.log(`After joining systems: Communities feed length=${commWithPosts.body.data.length}`);
    if (commWithPosts.status !== 200 || commWithPosts.body.data.length === 0) {
      throw new Error(`Expected posts in communities feed after joining systems!`);
    }
    const allInSystems = commWithPosts.body.data.every(p => p.community_id === 'comm_systems');
    console.log(`All posts belong to comm_systems: ${allInSystems}`);
    if (!allInSystems) {
      throw new Error(`Post found that does not belong to joined community!`);
    }

    // 5. Now follow creator 'usr_1' (lucas_t)
    const followRes = await request('/users/usr_1/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie, 'X-CSRF-Token': authCsrf },
      body: {},
    });
    if (followRes.status !== 200) {
      throw new Error(`Failed to follow usr_1: ${JSON.stringify(followRes.body)}`);
    }

    // 6. Following feed should now contain posts authored by usr_1
    const followingWithPosts = await request('/feed?scope=following', {
      headers: { Cookie: authCookie },
    });
    console.log(`After following usr_1: Following feed length=${followingWithPosts.body.data.length}`);
    if (followingWithPosts.status !== 200 || followingWithPosts.body.data.length === 0) {
      throw new Error(`Expected posts in following feed after following usr_1!`);
    }
    const allByLucas = followingWithPosts.body.data.every(p => p.author?.id === 'usr_1');
    console.log(`All posts authored by usr_1: ${allByLucas}`);
    if (!allByLucas) {
      throw new Error(`Post found in following feed that does not belong to followed creator!`);
    }

    console.log('\n[PASS] All authenticated feed scope tests PASSED with 100% precision!');

  } finally {
    // Clean up temporary user and memberships
    console.log('\nCleaning up temporary test user...');
    await db.collection('users').deleteOne({ _id: tempUserId });
    await db.collection('sessions').deleteMany({ user_id: tempUserId });
    await db.collection('follows').deleteMany({ follower_id: tempUserId });
    const userMbrs = await db.collection('community_memberships').find({ user_id: tempUserId }).toArray();
    await db.collection('community_memberships').deleteMany({ user_id: tempUserId });
    for (const m of userMbrs) {
      const count = await db.collection('community_memberships').countDocuments({ community_id: m.community_id });
      await db.collection('communities').updateOne({ _id: m.community_id }, { $set: { members_count: count } });
    }
    await db.collection('notifications').deleteMany({
      $or: [{ actor_id: tempUserId }, { recipient_id: tempUserId }]
    });
    await db.collection('feed_inboxes').deleteMany({ user_id: tempUserId });
    const lucasFollowers = await db.collection('follows').countDocuments({ target_user_id: 'usr_1' });
    await db.collection('users').updateOne({ _id: 'usr_1' }, { $set: { followers_count: lucasFollowers } });
    await mongo.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
