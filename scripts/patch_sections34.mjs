import fs from 'node:fs';

let code = fs.readFileSync('scripts/assemble_authentic_dataset.mjs', 'utf8');

const s3Start = code.indexOf('// 3. Generate 56 Phase 2A.3 Visual Pins');
const s4End = code.indexOf('console.log(`Generated ${expandedPosts.length} posts');

if (s3Start === -1 || s4End === -1) {
  console.error('Boundaries not found', s3Start, s4End);
  process.exit(1);
}

const newSections = `// 3. Generate 56 Phase 2A.3 Visual Pins (post_425 to post_480)
for (let i = 0; i < phase2a3VisualPinsDefs.length; i++) {
  const pin = phase2a3VisualPinsDefs[i];
  const authorUser = getPhase2A3VisualPinAuthor(i, pin);
  const daysAgo = (i * 3) % 21 + 1;
  const hour = (i * 11) % 24;
  const min = (i * 19) % 60;
  const createdDate = new Date('2026-10-25T00:00:00.000Z');
  createdDate.setUTCDate(createdDate.getUTCDate() - daysAgo);
  createdDate.setUTCHours(hour, min, 0, 0);

  const postId = \`post_\${postIdx++}\`;
  expandedPosts.push({
    _id: postId,
    post_type: 'visual',
    author_id: authorUser.id,
    title: pin.title,
    caption: pin.caption,
    community_id: pin.comm_id,
    community_slug: pin.slug,
    media: {
      id: \`media_\${postIdx}\`,
      url: \`https://images.unsplash.com/\${pin.photo.id}?w=1200&auto=format&fit=crop&q=80\`,
      aspect_ratio: pin.photo.ratio,
      width: pin.photo.width,
      height: pin.photo.height,
      alt_text: pin.photo.alt,
    },
    dominant_color: pin.dominant_color,
    tags: pin.tags,
    score: 0,
    hot_score: 0,
    comments_count: 0,
    created_at: createdDate,
    updated_at: createdDate,
  });
}

// 4. Generate 204 Phase 2A.3 Discussion Posts (post_481 to post_684)
for (let i = 0; i < phase2a3DiscussionsDefs.length; i++) {
  const disc = phase2a3DiscussionsDefs[i];
  const authorUser = getPhase2A3DiscussionAuthor(i, disc);
  const daysAgo = (i * 2) % 20 + 1;
  const hour = (i * 9) % 24;
  const min = (i * 23) % 60;
  const createdDate = new Date('2026-10-25T06:00:00.000Z');
  createdDate.setUTCDate(createdDate.getUTCDate() - daysAgo);
  createdDate.setUTCHours(hour, min, 0, 0);

  const postId = \`post_\${postIdx++}\`;
  const postObj = {
    _id: postId,
    post_type: 'discussion',
    author_id: authorUser.id,
    title: disc.title,
    content: disc.content,
    community_id: disc.community_id,
    community_slug: disc.community_slug,
    flair: disc.flair,
    tags: disc.tags,
    score: 0,
    hot_score: 0,
    comments_count: 0,
    created_at: createdDate,
    updated_at: createdDate,
  };

  if (disc.photoKeys && disc.photoKeys.length > 0) {
    postObj.media = disc.photoKeys.map((k, mIdx) => ({
      id: \`media_\${postIdx}_\${mIdx}\`,
      url: \`https://images.unsplash.com/\${k.id}?w=1200&auto=format&fit=crop&q=80\`,
      aspect_ratio: k.ratio,
      width: k.width,
      height: k.height,
      alt_text: k.alt,
    }));
  }

  expandedPosts.push(postObj);
}

`;

code = code.slice(0, s3Start) + newSections + code.slice(s4End);
fs.writeFileSync('scripts/assemble_authentic_dataset.mjs', code, 'utf8');
console.log('Successfully updated sections 3 & 4 in assemble_authentic_dataset.mjs!');
