import { lifestylePosts, discussionQuestions } from './phase2a1_lifestyle_questions.js';

console.log('--- Lifestyle Posts (offset starts at 68) ---');
lifestylePosts.forEach((p, idx) => {
  console.log(`[${68 + idx}] "${p.title}"`);
});

console.log('\n--- Discussion Questions (offset starts at 113) ---');
discussionQuestions.forEach((p, idx) => {
  console.log(`[${113 + idx}] "${p.title}"`);
});
