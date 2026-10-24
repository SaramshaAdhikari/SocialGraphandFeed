import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.MONGODB_DB_NAME || 'socialgraph';

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const comments = await db.collection('comments').find({}).toArray();
  const commentMap = new Map(comments.map(c => [c._id, c]));

  console.log(`=== Comment Tree Verification (Total: ${comments.length}) ===`);

  let maxDepth = 0;
  let hasCycles = false;

  for (const c of comments) {
    let depth = 0;
    let curr = c;
    const visited = new Set([curr._id]);

    while (curr.parent_id) {
      depth++;
      if (visited.has(curr.parent_id)) {
        console.error(`CYCLE DETECTED in comment ${c._id}`);
        hasCycles = true;
        break;
      }
      visited.add(curr.parent_id);
      curr = commentMap.get(curr.parent_id);
      if (!curr) {
        console.error(`Broken parent link: comment ${c._id} points to missing ${c.parent_id}`);
        break;
      }
    }
    if (depth > maxDepth) maxDepth = depth;
  }

  console.log(`- Has Cycles: ${hasCycles}`);
  console.log(`- Max Tree Depth: ${maxDepth}`);
  console.log(`- Root Comments (parent_id is null/undefined): ${comments.filter(c => !c.parent_id).length}`);
  console.log(`- Nested Replies: ${comments.filter(c => !!c.parent_id).length}`);

  await client.close();
}

main().catch(console.error);
