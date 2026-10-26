import { MongoClient } from 'mongodb';
import { connectMongo, disconnectMongo } from '../packages/backend/dist/db/mongo.js';
import { AuthService } from '../packages/backend/dist/services/AuthService.js';

async function verifyLive() {
  console.log('=== Phase 2B.1 Live Backend & Unified Composer Verification ===');

  await connectMongo();
  const authService = new AuthService();
  const createdSession = await authService.createSession('usr_0');
  const sessionCookie = `sg_session=${createdSession.token}`;
  const activeCsrf = createdSession.csrf;
  console.log(`Direct session created for usr_0 (cookie: ${sessionCookie.slice(0, 25)}..., csrf: ${activeCsrf.slice(0, 10)}...)`);

  const headers = {
    Cookie: sessionCookie,
    'x-csrf-token': activeCsrf,
    Origin: 'http://localhost:3000',
  };

  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  const db = client.db('socialgraph');

  const createdPostIds = [];

  try {
    // 1. Test Media Upload (POST /api/v1/media/upload)
    console.log('\n--- 1. Testing Live Multipart Media Upload ---');
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const formData = new FormData();
    const blob = new Blob([pngBuffer], { type: 'image/png' });
    formData.append('files', blob, 'test_pixel.png');

    const uploadRes = await fetch('http://localhost:4000/api/v1/media/upload', {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Upload failed (${uploadRes.status}): ${errText}`);
    }

    const uploadJson = await uploadRes.json();
    console.log('Upload response status:', uploadRes.status);
    console.log('Upload result:', JSON.stringify(uploadJson, null, 2));

    if (!uploadJson.success || !Array.isArray(uploadJson.media) || uploadJson.media.length === 0) {
      throw new Error('Upload response does not contain valid media array');
    }

    const uploadedMediaItem = uploadJson.media[0];
    console.log(`Uploaded media URL: ${uploadedMediaItem.url}`);

    // Verify static serving of uploaded file
    const staticRes = await fetch(`http://localhost:4000${uploadedMediaItem.url}`);
    console.log(`Static file fetch status (${uploadedMediaItem.url}): ${staticRes.status}`);
    if (staticRes.status !== 200) {
      throw new Error(`Static file serving failed with status ${staticRes.status}`);
    }

    // 2. Test Text-Only Post Creation (Unified Composer -> inferred as discussion)
    console.log('\n--- 2. Testing Text-Only Post (Inferred Discussion) ---');
    const textPostRes = await fetch('http://localhost:4000/api/v1/posts', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'Verification text-only post for Phase 2B.1 unified composer testing.',
        community_id: 'comm_systems',
        tags: ['verification', 'systems'],
      }),
    });

    if (!textPostRes.ok) {
      throw new Error(`Text post failed (${textPostRes.status}): ${await textPostRes.text()}`);
    }
    const textPost = await textPostRes.json();
    console.log(`Created text post: id=${textPost.id}, type=${textPost.post_type}, title="${textPost.title}"`);
    if (textPost.post_type !== 'discussion') {
      throw new Error(`Expected post_type 'discussion', got '${textPost.post_type}'`);
    }
    createdPostIds.push(textPost.id);

    // 3. Test Image-Only Post Creation (Unified Composer -> inferred as visual, fallback title)
    console.log('\n--- 3. Testing Image-Only Post (Inferred Visual, Optional Title) ---');
    const imageOnlyRes = await fetch('http://localhost:4000/api/v1/posts', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        media: [uploadedMediaItem],
        tags: ['photography'],
      }),
    });

    if (!imageOnlyRes.ok) {
      throw new Error(`Image-only post failed (${imageOnlyRes.status}): ${await imageOnlyRes.text()}`);
    }
    const imageOnlyPost = await imageOnlyRes.json();
    console.log(`Created image-only post: id=${imageOnlyPost.id}, type=${imageOnlyPost.post_type}, title="${imageOnlyPost.title}"`);
    if (imageOnlyPost.post_type !== 'visual') {
      throw new Error(`Expected post_type 'visual', got '${imageOnlyPost.post_type}'`);
    }
    createdPostIds.push(imageOnlyPost.id);

    // 4. Test Text + Multiple Images Post (Album, media_list)
    console.log('\n--- 4. Testing Multi-Image Album Post (Inferred Visual + media_list) ---');
    const albumRes = await fetch('http://localhost:4000/api/v1/posts', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Phase 2B.1 Verification 2-Image Album',
        content: 'Walkthrough testing multi-image attachments in unified composer.',
        media: [
          uploadedMediaItem,
          {
            id: 'm_album_second',
            url: uploadedMediaItem.url,
            aspect_ratio: 1.0,
            alt_text: 'Second album photo',
          },
        ],
        tags: ['album', 'test'],
      }),
    });

    if (!albumRes.ok) {
      throw new Error(`Album post failed (${albumRes.status}): ${await albumRes.text()}`);
    }
    const albumPost = await albumRes.json();
    console.log(`Created album post: id=${albumPost.id}, type=${albumPost.post_type}, media_list count=${albumPost.media_list?.length}`);
    if (albumPost.post_type !== 'visual') {
      throw new Error(`Expected post_type 'visual', got '${albumPost.post_type}'`);
    }
    if (!albumPost.media_list || albumPost.media_list.length !== 2) {
      throw new Error(`Expected media_list of length 2, got ${albumPost.media_list?.length}`);
    }
    createdPostIds.push(albumPost.id);

    // 5. Test 10-Image Limit Rejection on Live API
    console.log('\n--- 5. Testing 10-Image Limit Rejection ---');
    const elevenImages = Array.from({ length: 11 }, (_, i) => ({
      id: `m_eleven_${i}`,
      url: uploadedMediaItem.url,
      aspect_ratio: 1.0,
      alt_text: `Image ${i + 1}`,
    }));

    const rejectRes = await fetch('http://localhost:4000/api/v1/posts', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'Post with 11 images that should be rejected',
        media: elevenImages,
      }),
    });

    console.log(`11-image post rejection status: ${rejectRes.status} (expected 400)`);
    if (rejectRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request, got ${rejectRes.status}`);
    }

    // 6. Verify Feed Query with New Posts
    console.log('\n--- 6. Verifying Feed Retrieval ---');
    const feedRes = await fetch('http://localhost:4000/api/v1/feed?sort=new&limit=5', {
      headers,
    });
    if (!feedRes.ok) {
      throw new Error(`Feed retrieval failed (${feedRes.status})`);
    }
    const feedJson = await feedRes.json();
    console.log(`Retrieved feed items count: ${feedJson.data?.length}`);
    console.log(`Latest feed item id: ${feedJson.data?.[0]?.id}, type: ${feedJson.data?.[0]?.post_type}`);

    console.log('\nALL LIVE VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  } finally {
    // Clean up created test posts
    if (createdPostIds.length > 0) {
      console.log(`\nCleaning up ${createdPostIds.length} verification posts...`);
      await db.collection('posts').deleteMany({ _id: { $in: createdPostIds } });
      await db.collection('users').updateOne({ _id: 'usr_0' }, { $inc: { posts_count: -createdPostIds.length } });
      console.log('Cleanup completed.');
    }
    await client.close();
    await disconnectMongo();
  }
}

verifyLive().catch((err) => {
  console.error('Live verification failed:', err);
  process.exit(1);
});
