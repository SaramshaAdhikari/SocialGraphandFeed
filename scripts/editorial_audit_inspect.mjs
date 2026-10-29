import { MongoClient } from 'mongodb';

async function main() {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  const db = client.db('socialgraph');

  console.log('=== 1. SAMPLE USER PERSONAS (usr_20 to usr_34) ===');
  const users = await db.collection('users').find({ _id: { $gte: 'usr_20', $lte: 'usr_34' } }).toArray();
  for (const u of users) {
    console.log(`- ${u.username} (@${u.display_name}): "${u.bio}"`);
  }

  console.log('\n=== 2. SAMPLE VISUAL PINS (Discover Feed) ===');
  const pins = await db.collection('posts').find({ post_type: 'visual' }).limit(8).toArray();
  for (const p of pins) {
    console.log(`[${p._id}] (${p.community_slug || 'none'}) Title: "${p.title}"`);
    console.log(`     Caption: "${p.caption}"`);
    console.log(`     Tags: [${(p.tags || []).join(', ')}] | Dominant: ${p.dominant_color}`);
  }

  console.log('\n=== 3. SAMPLE DISCUSSION POSTS (Home / Community Feeds) ===');
  const discs = await db.collection('posts').find({ post_type: 'discussion', _id: { $gte: 'post_303', $lte: 'post_315' } }).toArray();
  for (const p of discs) {
    console.log(`[${p._id}] (${p.community_slug}) "${p.title}"`);
    console.log(`     Excerpt: "${p.content.slice(0, 120).replace(/\n/g, ' ')}..."`);
    console.log(`     Flair: ${p.flair} | Tags: [${(p.tags || []).join(', ')}]`);
  }

  console.log('\n=== 4. SAMPLE COMMENT THREADS ===');
  const threads = await db.collection('comments').find({ parent_id: null, _id: { $gte: 'cmt_011', $lte: 'cmt_020' } }).toArray();
  for (const root of threads) {
    const post = await db.collection('posts').findOne({ _id: root.post_id });
    const author = await db.collection('users').findOne({ _id: root.author_id });
    console.log(`\nThread on [${post._id}] "${post?.title?.slice(0, 60)}...":`);
    console.log(`  Root by ${author?.username}: "${root.content}"`);
    
    // Check replies
    const r1List = await db.collection('comments').find({ parent_id: root._id }).toArray();
    for (const r1 of r1List) {
      const a1 = await db.collection('users').findOne({ _id: r1.author_id });
      console.log(`    ↳ Reply 1 by ${a1?.username}: "${r1.content}"`);
      const r2List = await db.collection('comments').find({ parent_id: r1._id }).toArray();
      for (const r2 of r2List) {
        const a2 = await db.collection('users').findOne({ _id: r2.author_id });
        console.log(`        ↳ Reply 2 by ${a2?.username}: "${r2.content}"`);
      }
    }
  }

  await client.close();
}

main().catch(console.error);
