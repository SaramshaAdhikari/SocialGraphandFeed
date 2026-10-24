import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.MONGODB_DB_NAME || 'socialgraph';

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const userIds = new Set((await db.collection('users').find({}, { projection: { _id: 1 } }).toArray()).map(u => u._id));
  const postIds = new Set((await db.collection('posts').find({}, { projection: { _id: 1 } }).toArray()).map(p => p._id));

  const orphanMbrs = await db.collection('community_memberships').find({ user_id: { $nin: Array.from(userIds) } }).toArray();
  console.log('Orphan memberships:', orphanMbrs);

  const orphanVotes = await db.collection('post_votes').find({
    $or: [
      { user_id: { $nin: Array.from(userIds) } },
      { post_id: { $nin: Array.from(postIds) } }
    ]
  }).toArray();
  console.log('Orphan votes:', orphanVotes);

  const orphanSaves = await db.collection('post_saves').find({
    $or: [
      { user_id: { $nin: Array.from(userIds) } },
      { post_id: { $nin: Array.from(postIds) } }
    ]
  }).toArray();
  console.log('Orphan saves:', orphanSaves);

  // Check the community member counter mismatch
  const comms = await db.collection('communities').find({}).toArray();
  for (const c of comms) {
    const actual = await db.collection('community_memberships').countDocuments({ community_id: c._id });
    if (c.members_count !== actual) {
      console.log(`Mismatch on community ${c._id} (${c.name}): members_count doc=${c.members_count}, actual in memberships=${actual}`);
    }
  }

  await client.close();
}

main().catch(console.error);
