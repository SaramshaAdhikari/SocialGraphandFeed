import { realNewsItems, multiImagePosts } from './phase2a1_content_data.js';
import { techPosts } from './phase2a1_more_posts.js';
import { lifestylePosts, discussionQuestions } from './phase2a1_lifestyle_questions.js';

console.log('--- 1. Real News Items (10 items) ---');
realNewsItems.forEach((item, i) => {
  console.log(`[News #${i}] "${item.title}" -> ${item.destination_url}`);
});

console.log('\n--- 2. Multi-Image Posts (8 items) ---');
multiImagePosts.forEach((item, i) => {
  console.log(`[Multi #${i}] "${item.title}" -> ${item.photoKeys?.length} photos`);
});

console.log('\n--- 3. Tech Posts (20 items) ---');
techPosts.forEach((item, i) => {
  console.log(`[Tech #${i}] "${item.title}" (/c/${item.community_slug})`);
  const hasExactNumbers = /\b\d+(\.\d+)?(x|%|Mpps|fps|µs|ms|GB|TFLOPS)\b/i.test(item.content);
  if (hasExactNumbers) {
    console.log(`   * Contains heavy synthetic benchmark stats`);
  }
});

console.log('\n--- 4. Lifestyle Posts (45 items) ---');
lifestylePosts.slice(0, 10).forEach((item, i) => {
  console.log(`[Lifestyle #${i}] "${item.title}" (/c/${item.community_slug})`);
});

console.log('\n--- 5. Discussion Questions (27 items) ---');
discussionQuestions.slice(0, 10).forEach((item, i) => {
  console.log(`[Question #${i}] "${item.title}" (/c/${item.community_slug})`);
});
