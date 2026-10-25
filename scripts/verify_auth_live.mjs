import http from 'http';
import { MongoClient } from 'mongodb';
import { Redis } from 'ioredis';

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
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function run() {
  const redis = new Redis('redis://127.0.0.1:6379');
  await redis.del('rl:login:ip:127.0.0.1');

  console.log('--- Step 1: Health Check ---');
  const health = await request('/health');
  console.log('Health status:', health.status, JSON.stringify(health.body.services));
  if (health.status !== 200) throw new Error('Health check failed');

  console.log('\n--- Step 2: CSRF Token Retrieval ---');
  const csrfRes = await request('/auth/csrf');
  console.log('CSRF status:', csrfRes.status, 'hasToken:', Boolean(csrfRes.body.csrf_token));
  const setCookie = csrfRes.headers['set-cookie'] ? csrfRes.headers['set-cookie'][0] : null;
  console.log('Got cookie header:', Boolean(setCookie));
  const cookie = setCookie ? setCookie.split(';')[0] : '';
  const csrfToken = csrfRes.body.csrf_token;

  console.log('\n--- Step 3: Invalid Credentials Login ---');
  const invalidRes = await request('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
      'Cookie': cookie,
    },
    body: {
      username: 'non_existent_user_xyz',
      password: 'wrong_password_123',
    },
  });
  console.log('Invalid login status:', invalidRes.status, 'code:', invalidRes.body.code, 'detail:', invalidRes.body.detail);
  if (invalidRes.status !== 401) throw new Error(`Expected 401 on invalid login, got ${invalidRes.status}`);

  console.log('\n--- Step 4: Verify Redis Rate Limit Key ---');
  const keys = await redis.keys('rl:login:*');
  console.log('Redis rl:login keys found:', keys.length, keys);
  if (keys.length > 0) {
    const ttl = await redis.ttl(keys[0]);
    console.log(`Key ${keys[0]} has TTL: ${ttl}s`);
  }

  console.log('\n--- Step 5: Test Safe Registration, Login, Session, and Logout ---');
  const timestamp = Date.now();
  const testUsername = `testuser_${timestamp}`;
  const testPassword = `TestPass_${timestamp}!`;

  // Registration
  const regRes = await request('/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
      'Cookie': cookie,
    },
    body: {
      username: testUsername,
      password: testPassword,
      password_confirmation: testPassword,
    },
  });
  console.log('Register status:', regRes.status, 'hasUser:', Boolean(regRes.body.user));
  if (regRes.status !== 200) throw new Error(`Registration failed with status ${regRes.status}: ${JSON.stringify(regRes.body)}`);
  const registeredUserId = regRes.body.user.id;
  const authCookie = regRes.headers['set-cookie'] ? regRes.headers['set-cookie'][0].split(';')[0] : cookie;
  const newCsrfToken = regRes.body.csrf_token;

  // Session check
  const sessionRes = await request('/auth/session', {
    headers: {
      'Cookie': authCookie,
    },
  });
  console.log('Session status:', sessionRes.status, 'username matches:', sessionRes.body.user?.username === testUsername);
  if (sessionRes.status !== 200) throw new Error('Session restoration failed');

  // Logout
  const logoutRes = await request('/auth/logout', {
    method: 'POST',
    headers: {
      'Cookie': authCookie,
      'X-CSRF-Token': newCsrfToken,
    },
  });
  console.log('Logout status:', logoutRes.status, 'success:', logoutRes.body.success);
  if (logoutRes.status !== 200) throw new Error('Logout failed');

  // Verify session is invalidated
  const postLogoutSession = await request('/auth/session', {
    headers: {
      'Cookie': authCookie,
    },
  });
  console.log('Post-logout session status:', postLogoutSession.status, 'user:', postLogoutSession.body.user);
  if (postLogoutSession.status !== 401) throw new Error('Session should be 401 after logout');

  // Cleanup disposable test user from MongoDB
  console.log('\n--- Step 6: Cleaning up disposable test user ---');
  const mongo = new MongoClient('mongodb://127.0.0.1:27017/socialgraph?replicaSet=rs0&directConnection=true');
  await mongo.connect();
  const db = mongo.db('socialgraph');
  const delRes = await db.collection('users').deleteOne({ _id: registeredUserId });
  const delSessions = await db.collection('sessions').deleteMany({ user_id: registeredUserId });
  console.log('Cleaned up test user doc:', delRes.deletedCount, 'sessions:', delSessions.deletedCount);
  await mongo.close();

  // Test Rate Limit 429 Trigger
  console.log('\n--- Step 7: Rate Limit 429 Enforcement Test ---');
  await redis.del('rl:login:ip:127.0.0.1');
  const targetUser = `rl_test_${Date.now()}`;

  for (let i = 1; i <= 5; i++) {
    const res = await request('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        'Cookie': cookie,
      },
      body: { username: targetUser, password: 'wrongPassword' },
    });
    console.log(`Attempt ${i} status:`, res.status);
    if (res.status !== 401) throw new Error(`Expected 401 on attempt ${i}, got ${res.status}`);
  }

  // 6th attempt MUST trigger 429
  const blockedRes = await request('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
      'Cookie': cookie,
    },
    body: { username: targetUser, password: 'wrongPassword' },
  });
  console.log('6th attempt status:', blockedRes.status, 'code:', blockedRes.body.code, 'retry-after:', blockedRes.headers['retry-after']);
  if (blockedRes.status !== 429) throw new Error(`Expected 429 on 6th attempt, got ${blockedRes.status}`);

  // Clean up redis test keys
  await redis.del('rl:login:ip:127.0.0.1');
  await redis.del(`rl:login:user:${targetUser}`);
  await redis.quit();

  console.log('\n✅ All authentication, CSRF, Redis rate limiting (401, 429, reset), session, and cleanup tests PASSED!');
}

run().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
