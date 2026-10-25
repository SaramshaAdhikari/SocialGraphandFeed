import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.MONGODB_DB_NAME || 'socialgraph';

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const userIds = new Set((await db.collection('users').find({}, { projection: { _id: 1 } }).toArray()).map(u => u._id));
  const postIds = new Set((await db.collection('posts').find({}, { projection: { _id: 1 } }).toArray()).map(p => p._id));

  // Remove orphan memberships where user does not exist
  const delMbrs = await db.collection('community_memberships').deleteMany({
    user_id: { $nin: Array.from(userIds) }
  });
  console.log(`Deleted orphan memberships: ${delMbrs.deletedCount}`);

  // Remove orphan votes where user or post does not exist
  const delVotes = await db.collection('post_votes').deleteMany({
    $or: [
      { user_id: { $nin: Array.from(userIds) } },
      { post_id: { $nin: Array.from(postIds) } }
    ]
  });
  console.log(`Deleted orphan votes: ${delVotes.deletedCount}`);

  // Remove orphan saves where user or post does not exist
  const delSaves = await db.collection('post_saves').deleteMany({
    $or: [
      { user_id: { $nin: Array.from(userIds) } },
      { post_id: { $nin: Array.from(postIds) } }
    ]
  });
  console.log(`Deleted orphan saves: ${delSaves.deletedCount}`);

  // Remove orphan notifications where actor or recipient does not exist
  const delNotifs = await db.collection('notifications').deleteMany({
    $or: [
      { actor_id: { $nin: Array.from(userIds) } },
      { recipient_id: { $nin: Array.from(userIds) } }
    ]
  });
  console.log(`Deleted orphan notifications: ${delNotifs.deletedCount}`);

  // Remove orphan feed inboxes where user or author does not exist
  const delInboxes = await db.collection('feed_inboxes').deleteMany({
    $or: [
      { user_id: { $nin: Array.from(userIds) } },
      { author_id: { $nin: Array.from(userIds) } }
    ]
  });
  console.log(`Deleted orphan inboxes: ${delInboxes.deletedCount}`);

  // Reconcile community member counts
  const comms = await db.collection('communities').find({}).toArray();
  for (const c of comms) {
    const actual = await db.collection('community_memberships').countDocuments({ community_id: c._id });
    if (c.members_count !== actual) {
      await db.collection('communities').updateOne({ _id: c._id }, { $set: { members_count: actual } });
      console.log(`Reconciled community ${c._id}: ${c.members_count} -> ${actual}`);
    }
  }

  await client.close();
}

main().catch(console.error);
