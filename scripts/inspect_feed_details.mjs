import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb://127.0.0.1:27017');
await client.connect();
const db = client.db('socialgraph');

// Fetch first 50 posts sorted by created_at desc (what users see in 'new' feed)
const posts = await db.collection('posts').find({}).sort({ created_at: -1 }).limit(50).toArray();

console.log('=== First 50 Posts in Feed (Newest First) ===');
for (let i = 0; i < posts.length; i++) {
  const p = posts[i];
  const author = await db.collection('users').findOne({ _id: p.author_id });
  const comm = await db.collection('communities').findOne({ _id: p.community_id });
  console.log(`\n[${i + 1}] Post ${p._id} by @${author?.username || 'UNKNOWN'} (${author?.display_name}) in /c/${comm?.slug || p.community_slug}`);
  console.log(`    Title: "${p.title?.slice(0, 75)}"`);
  console.log(`    Type: ${p.post_type} | Avatar: ${author?.avatar_url?.slice(0, 45)}`);
  if (p.media_attachments?.length) {
    console.log(`    Media: ${p.media_attachments.length} attachment(s) -> ${p.media_attachments[0].url.slice(0, 50)}... [alt: "${p.media_attachments[0].alt?.slice(0, 40)}"]`);
  }
}

await client.close();
