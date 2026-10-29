import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb://127.0.0.1:27017');
await client.connect();
const db = client.db('socialgraph');

const posts = await db.collection('posts').find({}).sort({ created_at: -1 }).toArray();
console.log(`Total posts in DB: ${posts.length}`);

const communities = await db.collection('communities').find({}).toArray();
console.log(`Total communities: ${communities.length}`);

// Check posts without author or with invalid author
let invalidAuthors = 0;
for (const p of posts) {
  const author = await db.collection('users').findOne({ _id: p.author_id });
  if (!author) {
    console.error(`Post ${p._id} has invalid author ${p.author_id}`);
    invalidAuthors++;
  }
}
console.log(`Invalid post authors: ${invalidAuthors}`);

// Check comments without author or with invalid author or invalid parent
const comments = await db.collection('comments').find({}).toArray();
console.log(`Total comments: ${comments.length}`);
let invalidCommentAuthors = 0;
let invalidCommentPosts = 0;
let invalidCommentParents = 0;

for (const c of comments) {
  const author = await db.collection('users').findOne({ _id: c.author_id });
  if (!author) invalidCommentAuthors++;
  const post = await db.collection('posts').findOne({ _id: c.post_id });
  if (!post) invalidCommentPosts++;
  if (c.parent_id) {
    const parent = await db.collection('comments').findOne({ _id: c.parent_id });
    if (!parent) invalidCommentParents++;
  }
}
console.log(`Invalid comment authors: ${invalidCommentAuthors}, invalid comment posts: ${invalidCommentPosts}, invalid comment parents: ${invalidCommentParents}`);

// Check author post distribution
const userPostCounts = {};
for (const p of posts) {
  userPostCounts[p.author_id] = (userPostCounts[p.author_id] || 0) + 1;
}

const activeUsers = Object.keys(userPostCounts).length;
console.log(`Users with at least 1 post: ${activeUsers} / 114`);

// List users with 0 posts
const allUsers = await db.collection('users').find({}).toArray();
const fixtureUsers = allUsers.filter(u => u._id.startsWith('usr_') && u._id.length <= 8);
const zeroPostUsers = fixtureUsers.filter(u => !userPostCounts[u._id]);
console.log(`Fixture users with 0 posts: ${zeroPostUsers.length}`);
if (zeroPostUsers.length > 0) {
  console.log('Zero post users:', zeroPostUsers.map(u => `${u._id} (@${u.username})`).join(', '));
}

await client.close();
