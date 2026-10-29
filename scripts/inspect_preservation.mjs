import { MongoClient } from 'mongodb';

async function main() {
  const c = new MongoClient('mongodb://127.0.0.1:27017');
  await c.connect();
  const db = c.db('socialgraph');

  const allUsers = await db.collection('users').find({}).toArray();
  const nonFixtureUsers = allUsers.filter(u => !/^usr_[0-9]+$/.test(u._id));
  console.log(`Total users: ${allUsers.length}, Non-fixture users (${nonFixtureUsers.length}):`);
  nonFixtureUsers.forEach(u => {
    console.log(` - ID: ${u._id}, username: ${u.username}, display_name: ${u.display_name}, created: ${u.created_at}, hasPassword: ${Boolean(u.password_hash)}, role: ${u.role || 'user'}`);
  });

  const allPosts = await db.collection('posts').find({}).toArray();
  const nonFixturePosts = allPosts.filter(p => !/^post_[0-9]+$/.test(p._id) && p._id !== 'post_tie_301' && p._id !== 'post_tie_302');
  console.log(`\nTotal posts: ${allPosts.length}, Non-fixture posts (${nonFixturePosts.length}):`);
  nonFixturePosts.forEach(p => {
    console.log(` - ID: ${p._id}, author: ${p.author_id}, title: "${p.title}", created: ${p.created_at}`);
  });

  const sessions = await db.collection('sessions').find({}).toArray();
  console.log(`\nTotal sessions in DB: ${sessions.length}`);
  sessions.slice(0, 5).forEach(s => {
    console.log(` - Session ID: ${s._id}, user_id: ${s.user_id}, created: ${s.created_at}, expires: ${s.expires_at}`);
  });

  await c.close();
}

main().catch(console.error);
