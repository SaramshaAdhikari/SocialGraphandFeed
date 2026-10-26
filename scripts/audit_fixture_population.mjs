import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb://127.0.0.1:27017');
await client.connect();
const db = client.db('socialgraph');

const users = await db.collection('users').find({}).sort({ _id: 1 }).toArray();
console.log(`Total users in DB: ${users.length}`);

const fixtureUsers = users.filter(u => u._id.startsWith('usr_') && u._id.length <= 8);
const nonFixtureUsers = users.filter(u => !u._id.startsWith('usr_') || u._id.length > 8);

console.log(`Fixture users: ${fixtureUsers.length}`);
console.log(`Non-fixture users: ${nonFixtureUsers.length}`);

for (const u of fixtureUsers) {
  const pCount = await db.collection('posts').countDocuments({ author_id: u._id });
  const cCount = await db.collection('comments').countDocuments({ author_id: u._id });
  console.log(`[${u._id}] @${u.username.padEnd(16)} | ${u.display_name.padEnd(22)} | Posts: ${String(pCount).padStart(2)} | Cmts: ${String(cCount).padStart(2)} | Avatar: ${u.avatar_url || 'NONE'}`);
}

await client.close();
