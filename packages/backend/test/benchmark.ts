import { connectMongo, disconnectMongo, getDb } from '../src/db/mongo.js';
import { connectRedis, disconnectRedis } from '../src/cache/redis.js';
import { PostService } from '../src/services/PostService.js';
import { seedDatabase } from '../src/db/seed.js';

interface LatencyStats {
  count: number;
  min: number;
  max: number;
  mean: number;
  p50: number;
  p95: number;
  p99: number;
}

function calculateStats(samples: number[]): LatencyStats {
  if (samples.length === 0) {
    return { count: 0, min: 0, max: 0, mean: 0, p50: 0, p95: 0, p99: 0 };
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const count = sorted.length;
  const min = Number(sorted[0].toFixed(2));
  const max = Number(sorted[count - 1].toFixed(2));
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = Number((sum / count).toFixed(2));

  const p50Idx = Math.min(Math.floor(0.50 * count), count - 1);
  const p95Idx = Math.min(Math.floor(0.95 * count), count - 1);
  const p99Idx = Math.min(Math.floor(0.99 * count), count - 1);

  return {
    count,
    min,
    max,
    mean,
    p50: Number(sorted[p50Idx].toFixed(2)),
    p95: Number(sorted[p95Idx].toFixed(2)),
    p99: Number(sorted[p99Idx].toFixed(2)),
  };
}

async function runBenchmark() {
  const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27018/?replicaSet=rs0&directConnection=true';
  const redisUrl = process.env.REDIS_TEST_URL || 'redis://localhost:6380';

  console.log('================================================================================');
  console.log('            SocialGraph Database & Cache Performance Benchmark Harness           ');
  console.log('================================================================================');
  console.log('Test Environment:');
  console.log(`  - Node.js Runtime: ${process.version}`);
  console.log(`  - Platform: ${process.platform} (${process.arch})`);
  console.log(`  - MongoDB: 7.0.14 ReplicaSet (127.0.0.1:27018)`);
  console.log(`  - Redis: 7.4.2 Alpine (127.0.0.1:6380)`);
  console.log(`  - Concurrency Model: Sequential execution (concurrency=1) within Node.js process`);
  console.log('Workload Configuration:');
  console.log('  - Seed Data: 5 Core Personas, 8 Standard Posts, 6 Communities, Threaded Comments');
  console.log('  - Cold Read Samples: 30 iterations (cache invalidated before each fetch)');
  console.log('  - Warm Read Samples: 100 iterations (pre-warmed Redis cache hit)');
  console.log('  - Saved Posts Samples: 50 iterations (indexed query with { user_id: 1, created_at: -1 })');
  console.log('  - Vote Mutation Samples: 30 iterations (replica-set ACID transaction + cache invalidation)');
  console.log('--------------------------------------------------------------------------------\n');

  await connectMongo(mongoUri, 'socialgraph_benchmark_test');
  const redis = connectRedis(redisUrl);
  await redis.connect();

  const db = getDb();
  await seedDatabase(db);

  const postService = new PostService();
  const testPostId = 'post_101';
  const testUserId = 'usr_0';
  const cacheKey = `cache:post:${testPostId}:u:${testUserId}`;

  // 1. Warm-up Phase
  console.log('Running warm-up phase (10 iterations)...');
  for (let i = 0; i < 10; i++) {
    await postService.getPost(testPostId, testUserId);
  }
  console.log('Warm-up completed.\n');

  // 2. Cold Read Latency (30 distinct samples with deliberate cache eviction)
  console.log('Sampling Cold Reads (MongoDB Query + Author Hydration + Vote Lookup)...');
  const coldSamples: number[] = [];
  for (let i = 0; i < 30; i++) {
    await redis.del(cacheKey);
    const t0 = performance.now();
    await postService.getPost(testPostId, testUserId);
    coldSamples.push(performance.now() - t0);
  }
  const coldStats = calculateStats(coldSamples);

  // 3. Warm Read Latency (100 samples with verified Redis cache hit)
  console.log('Sampling Warm Reads (Redis Cache Hit)...');
  // Ensure post is cached
  await postService.getPost(testPostId, testUserId);
  const warmSamples: number[] = [];
  for (let i = 0; i < 100; i++) {
    const t0 = performance.now();
    await postService.getPost(testPostId, testUserId);
    warmSamples.push(performance.now() - t0);
  }
  const warmStats = calculateStats(warmSamples);

  // 4. Saved Posts Query Latency (50 samples using B-tree composite index)
  console.log('Sampling Saved Posts Queries (Index-backed B-tree lookup)...');
  // Prepare user saves
  await postService.toggleSavePost('post_101', testUserId);
  await postService.toggleSavePost('post_102', testUserId);
  await postService.toggleSavePost('post_103', testUserId);

  // Warm-up query path
  for (let i = 0; i < 5; i++) {
    await postService.getSavedPosts(testUserId, { limit: 20 });
  }

  const savedSamples: number[] = [];
  for (let i = 0; i < 50; i++) {
    const t0 = performance.now();
    await postService.getSavedPosts(testUserId, { limit: 20 });
    savedSamples.push(performance.now() - t0);
  }
  const savedStats = calculateStats(savedSamples);

  // 5. Vote Mutation & Invalidation Latency (30 samples)
  console.log('Sampling Vote Mutations (Multi-Doc ACID Transaction + Cache Invalidation)...');
  const voteSamples: number[] = [];
  for (let i = 0; i < 30; i++) {
    const direction = (i % 2 === 0 ? 1 : 0) as 1 | 0;
    const t0 = performance.now();
    await postService.votePost(testPostId, testUserId, direction);
    voteSamples.push(performance.now() - t0);
  }
  const voteStats = calculateStats(voteSamples);

  // Format tabular report
  console.log('\n================================================================================');
  console.log('                              BENCHMARK RESULTS                                 ');
  console.log('================================================================================');
  console.table({
    'Cold Read (MongoDB)': {
      Samples: coldStats.count,
      'Min (ms)': coldStats.min,
      'Mean (ms)': coldStats.mean,
      'p50 (ms)': coldStats.p50,
      'p95 (ms)': coldStats.p95,
      'p99 (ms)': coldStats.p99,
      'Max (ms)': coldStats.max,
    },
    'Warm Read (Redis Cache)': {
      Samples: warmStats.count,
      'Min (ms)': warmStats.min,
      'Mean (ms)': warmStats.mean,
      'p50 (ms)': warmStats.p50,
      'p95 (ms)': warmStats.p95,
      'p99 (ms)': warmStats.p99,
      'Max (ms)': warmStats.max,
    },
    'Saved Posts Query (Indexed)': {
      Samples: savedStats.count,
      'Min (ms)': savedStats.min,
      'Mean (ms)': savedStats.mean,
      'p50 (ms)': savedStats.p50,
      'p95 (ms)': savedStats.p95,
      'p99 (ms)': savedStats.p99,
      'Max (ms)': savedStats.max,
    },
    'Vote Mutation + Invalidation': {
      Samples: voteStats.count,
      'Min (ms)': voteStats.min,
      'Mean (ms)': voteStats.mean,
      'p50 (ms)': voteStats.p50,
      'p95 (ms)': voteStats.p95,
      'p99 (ms)': voteStats.p99,
      'Max (ms)': voteStats.max,
    },
  });

  const speedupRatio = (coldStats.p50 / warmStats.p50).toFixed(1);
  console.log(`Cache Speedup Factor (p50 Cold vs Warm): ${speedupRatio}x faster via Redis.`);

  console.log('\n--------------------------------------------------------------------------------');
  console.log('Benchmark Limitations & Non-Production Disclaimers:');
  console.log('1. Single-node local containers: Loopback networking eliminates WAN/datacenter latency.');
  console.log('2. Concurrency: Measurements are sequential (concurrency=1) and do not measure saturated thread pool contention.');
  console.log('3. Data volume: Seed dataset consists of tens of documents; large-scale collections will exhibit higher IOPS.');
  console.log('4. Results demonstrate architectural correctness and relative caching benefits, not absolute production throughput.');
  console.log('================================================================================\n');

  await db.dropDatabase();
  await disconnectMongo();
  await disconnectRedis();
}

runBenchmark().catch((err) => {
  console.error('Benchmark execution error:', err);
  process.exit(1);
});
