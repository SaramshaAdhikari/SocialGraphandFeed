import http from 'http';

const BASE_URL = 'http://127.0.0.1:4000/api/v1';

async function fetchJson(endpoint) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${endpoint}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('=== Auditing First 40 Running Feed Posts across Discover & Main Feed ===\n');

  // 1. Audit Main Feed (sort=new, limit=30)
  const feedRes = await fetchJson('/feed?sort=new&limit=30');
  console.log(`Feed returned status: ${feedRes.status}, items: ${feedRes.body.data.length}`);
  
  const communityCounts = {};
  const authorSet = new Set();
  const typeCounts = { visual: 0, discussion: 0, multiMedia: 0 };

  feedRes.body.data.forEach((p, idx) => {
    const comm = p.community_slug || 'global';
    communityCounts[comm] = (communityCounts[comm] || 0) + 1;
    authorSet.add(p.author.username);

    const isMulti = Array.isArray(p.media) && p.media.length > 1;
    if (isMulti) typeCounts.multiMedia++;
    if (p.post_type === 'visual') typeCounts.visual++;
    else typeCounts.discussion++;

    if (idx < 15) {
      console.log(`[${idx + 1}] /c/${comm} by @${p.author.username} (${p.author.display_name})`);
      console.log(`    Title: "${p.title.slice(0, 80)}${p.title.length > 80 ? '...' : ''}"`);
      console.log(`    Type: ${p.post_type}${isMulti ? ` (${p.media.length} photos)` : ''} | Score: ${p.score} | Comments: ${p.comments_count}`);
      if (p.tags && p.tags.length > 0) console.log(`    Tags: #${p.tags.join(' #')}`);
      console.log('');
    }
  });

  console.log('--- Community Distribution in first 30 feed posts:');
  console.table(communityCounts);
  console.log(`Unique authors in first 30 posts: ${authorSet.size}`);
  console.log(`Post types: Visual: ${typeCounts.visual}, Discussion: ${typeCounts.discussion}, Multi-image: ${typeCounts.multiMedia}`);

  // 2. Audit Discover Masonry
  console.log('\n--- Auditing Discover Visual Masonry Feed ---');
  const discRes = await fetchJson('/discovery?limit=20');
  console.log(`Discover returned: ${discRes.body.data.length} pins`);
  const discImages = new Set();
  discRes.body.data.forEach((pin, i) => {
    const imgUrl = pin.media?.url || (Array.isArray(pin.media) ? pin.media[0]?.url : 'none');
    discImages.add(imgUrl);
    if (i < 8) {
      console.log(`Pin ${i + 1}: "${pin.title.slice(0, 50)}..." in /c/${pin.community_slug} by @${pin.author.username}`);
      console.log(`       Aspect: ${pin.media?.aspect_ratio} | Color: ${pin.dominant_color}`);
    }
  });
  console.log(`Discovery unique images: ${discImages.size} of ${discRes.body.data.length}`);
}

main().catch(console.error);
