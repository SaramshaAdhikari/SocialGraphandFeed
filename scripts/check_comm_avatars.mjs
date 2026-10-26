import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb://127.0.0.1:27017');
await client.connect();
const db = client.db('socialgraph');
const comms = await db.collection('communities').find({}).toArray();
for (const c of comms) {
  console.log(`[${c._id}] /c/${c.slug.padEnd(20)} | ${c.name.padEnd(28)} | Avatar: ${c.avatar_url || 'NONE'}`);
}
await client.close();
