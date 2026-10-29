import { MongoClient } from 'mongodb';

async function main() {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  const db = client.db('socialgraph');

  // Check usr_0's following list
  const follows = await db.collection('follows').find({ follower_id: 'usr_0' }).toArray();
  const followedUserIds = follows.map(f => f.target_user_id);
  console.log(`usr_0 follows (${followedUserIds.length} users):`, followedUserIds);

  const followingPosts = await db.collection('posts')
    .find({ author_id: { $in: followedUserIds } })
    .sort({ created_at: -1 })
    .toArray();
  console.log(`\nHome Feed (scope=following for usr_0) has ${followingPosts.length} posts:`);
  followingPosts.forEach(p => {
    console.log(`- [${p._id}] by ${p.author_id} in /c/${p.community_slug}: "${p.title}" (score: ${p.score}, comments: ${p.comments_count})`);
    if (p.caption) console.log(`   Caption: "${p.caption}"`);
    if (p.content) console.log(`   Content: "${p.content.slice(0, 100)}..."`);
  });

  await client.close();
}

main().catch(console.error);
