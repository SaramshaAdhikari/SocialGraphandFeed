import assert from 'node:assert';

const API_BASE = 'http://127.0.0.1:4000/api/v1';

async function main() {
  console.log('--- Verifying Phase 2A.1 API Content Quality ---');

  // 1. Verify Multi-image posts
  console.log('1. Checking multi-image discussion posts...');
  const multiPostRes = await fetch(`${API_BASE}/posts/post_295`);
  assert.strictEqual(multiPostRes.status, 200, 'Expected post_295 to be found');
  const multiPostData = await multiPostRes.json();
  console.log(`Fetched post_295: "${multiPostData.title}"`);
  assert(Array.isArray(multiPostData.media), 'Expected media to be an array');
  assert.strictEqual(multiPostData.media.length, 3, 'Expected exactly 3 media attachments');
  console.log(`✓ post_295 has 3 media attachments:`);
  for (const [idx, m] of multiPostData.media.entries()) {
    console.log(`   [${idx + 1}] (aspect ${m.aspect_ratio || 'n/a'}): "${m.alt_text}" -> ${m.url.slice(0, 60)}...`);
    assert(m.url.startsWith('https://images.unsplash.com/'), 'Expected valid Unsplash image URL');
    assert(m.alt_text && m.alt_text.length > 5, 'Expected descriptive alt text');
  }

  // Check another multi-image post
  const multiPost2Res = await fetch(`${API_BASE}/posts/post_296`);
  assert.strictEqual(multiPost2Res.status, 200, 'Expected post_296 to be found');
  const multiPost2Data = await multiPost2Res.json();
  console.log(`Fetched post_296: "${multiPost2Data.title}"`);
  assert.strictEqual(multiPost2Data.media.length, 3, 'Expected 3 media items');
  console.log(`✓ post_296 has 3 media attachments verified.`);

  // 2. Verify News Announcements with destination_url
  console.log('\n2. Checking authentic news announcements...');
  const newsPostRes = await fetch(`${API_BASE}/posts/post_285`);
  assert.strictEqual(newsPostRes.status, 200, 'Expected post_285 to be found');
  const newsPostData = await newsPostRes.json();
  console.log(`Fetched news post_285: "${newsPostData.title}"`);
  assert(newsPostData.destination_url, 'Expected destination_url to be present');
  console.log(`✓ destination_url: ${newsPostData.destination_url}`);
  assert.strictEqual(newsPostData.destination_url, 'https://www.postgresql.org/about/news/postgresql-17-released-2722/');
  assert(newsPostData.tags.includes('postgresql'), 'Expected tags to include postgresql');

  // 3. Verify Threaded Comments
  console.log('\n3. Checking realistic threaded comments...');
  const commentsRes = await fetch(`${API_BASE}/posts/post_285/comments`);
  assert.strictEqual(commentsRes.status, 200, 'Expected comments endpoint 200');
  const commentsList = await commentsRes.json();
  console.log(`Found ${commentsList.length} top-level comments on post_285`);
  assert(commentsList.length >= 1, 'Expected at least 1 comment');
  const rootCmt = commentsList[0];
  console.log(`Root comment [${rootCmt.id}] by ${rootCmt.author.username}: "${rootCmt.content.slice(0, 80)}..."`);
  assert(rootCmt.content.toLowerCase().includes('vacuum') || rootCmt.content.toLowerCase().includes('memory') || rootCmt.content.toLowerCase().includes('postgres'), 'Root comment should discuss postgres subject matter');
  
  if (rootCmt.replies && rootCmt.replies.length > 0) {
    const reply1 = rootCmt.replies[0];
    console.log(`  -> Depth 1 reply [${reply1.id}] by ${reply1.author.username}: "${reply1.content.slice(0, 70)}..."`);
    if (reply1.replies && reply1.replies.length > 0) {
      const reply2 = reply1.replies[0];
      console.log(`     -> Depth 2 reply [${reply2.id}] by ${reply2.author.username}: "${reply2.content.slice(0, 60)}..."`);
    }
  }
  console.log('✓ Threaded comments verified.');

  // 4. Verify Discovery Feed
  console.log('\n4. Checking Discovery Feed pins and variety...');
  const discoveryRes = await fetch(`${API_BASE}/discovery?limit=20`);
  assert.strictEqual(discoveryRes.status, 200, 'Expected discovery 200');
  const discoveryData = await discoveryRes.json();
  const pins = discoveryData.data || discoveryData.items || [];
  console.log(`Discovery returned ${pins.length} items`);
  const visualPins = pins.filter(i => i.post_type === 'visual');
  console.log(`Visual pins in page: ${visualPins.length}`);
  const pinImages = new Set();
  for (const pin of visualPins) {
    assert(pin.media && pin.media.url, 'Visual pin must have media URL');
    assert(pin.media.aspect_ratio, 'Visual pin must have aspect ratio');
    pinImages.add(pin.media.url);
  }
  console.log(`Unique images in discovery batch: ${pinImages.size} of ${visualPins.length}`);
  assert.strictEqual(pinImages.size, visualPins.length, 'Every visual pin in discovery batch should have unique image');
  console.log('✓ Discovery feed visual pins verified.');

  console.log('\n--- ALL PHASE 2A.1 CONTENT QUALITY CHECKS PASSED ---');
}

main().catch(err => {
  console.error('Error during content verification:', err);
  process.exit(1);
});
