import { MongoClient } from 'mongodb';

async function main() {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  const db = client.db('socialgraph');

  const users = await db.collection('users').find({}).toArray();
  const userMap = new Map(users.map(u => [u._id, u]));

  const posts = await db.collection('posts').find({}).sort({ created_at: -1 }).toArray();
  const comments = await db.collection('comments').find({}).toArray();

  console.log(`Auditing ${posts.length} posts and ${comments.length} comments...`);

  // Let's inspect the first 45 posts in detail
  console.log('\n======================================================');
  console.log('=== DETAILED AUDIT OF FIRST 45 FEED POSTS (sort=new) ===');
  console.log('======================================================');

  const weakExamples = [];
  const goodExamples = [];

  for (let i = 0; i < Math.min(45, posts.length); i++) {
    const p = posts[i];
    const author = userMap.get(p.author_id);
    const postComments = comments.filter(c => c.post_id === p._id);
    
    // Check coherence between author bio and post topic
    const bio = author?.bio || '';
    const title = p.title || '';
    const caption = p.caption || '';
    const content = p.content || '';
    const community = p.community_slug || 'none';

    console.log(`\n--- Post #${i + 1} [${p._id}] (${p.post_type}) in /c/${community} ---`);
    console.log(`Author: @${author?.username} (${author?.display_name})`);
    console.log(`Bio: "${bio}"`);
    console.log(`Title: "${title}"`);
    if (caption) console.log(`Caption: "${caption}"`);
    if (content) console.log(`Content: "${content.slice(0, 160)}${content.length > 160 ? '...' : ''}"`);
    console.log(`Tags: [${(p.tags || []).join(', ')}] | Score: ${p.score} | Comments count in doc: ${p.comments_count} (actual DB comments: ${postComments.length})`);

    if (postComments.length > 0) {
      console.log(`  Comments (${postComments.length}):`);
      for (const c of postComments) {
        const cAuthor = userMap.get(c.author_id);
        const prefix = c.depth === 0 ? '  ↳ [Root]' : c.depth === 1 ? '    ↳ [Rep1]' : '      ↳ [Rep2]';
        console.log(`  ${prefix} @${cAuthor?.username}: "${c.content}"`);
      }
    }
  }

  await client.close();
}

main().catch(console.error);
