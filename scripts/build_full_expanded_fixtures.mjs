import fs from 'node:fs';
import path from 'node:path';
import { verifiedPhotos } from '../packages/backend/src/db/fixtures/verifiedPhotos.js';
import { realNewsItems, multiImagePosts } from './phase2a1_content_data.js';
import { techPosts } from './phase2a1_more_posts.js';

// Pool of 100 verified photos
const allPhotos = [
  ...verifiedPhotos.architecture,
  ...verifiedPhotos.technology,
  ...verifiedPhotos.workspaces,
  ...verifiedPhotos.lifestyle,
  ...verifiedPhotos.creative_art,
];

console.log(`Verified photo pool: ${allPhotos.length} photos`);

// Extra 30 tech posts to reach 50 total tech posts
const extraTechPosts = [
  {
    title: 'Benchmarking Rust async runtimes: Tokio vs Smol under millions of concurrent TCP timers',
    content: `When managing hundreds of thousands of idle keep-alive connections, timer wheel allocations dominate heap memory. We profiled Tokio's hashed hierarchical timer wheel against Smol's intrusive timer queue under synthetic connection churn.`,
    community_id: 'comm_systems', community_slug: 'systems', flair: 'Async Rust', tags: ['rust', 'tokio', 'concurrency', 'benchmarking']
  },
  {
    title: 'Understanding lock-free memory reclamation: Hazard Pointers vs Epoch-Based Reclamation (EBR)',
    content: `In multi-threaded data structures where readers traverse nodes without latches, when is it safe to free a deleted node? We examine how Epoch-Based Reclamation groups retired pointers into generational bins, contrasting its throughput advantages over Hazard Pointers with its unbounded memory hazard under stalled threads.`,
    community_id: 'comm_systems', community_slug: 'systems', flair: 'Memory Models', tags: ['concurrency', 'memory', 'algorithms', 'cplusplus']
  },
  {
    title: 'Why SIMD vectorization matters for high-throughput vector database cosine distance calculations',
    content: `Computing cosine similarity across 1536-dimensional OpenAI embeddings in a loop requires 1536 multiply-add operations per candidate vector. Using AVX-512 FMA instructions, we pack 16 float32 operations into a single CPU cycle, achieving a 14x throughput boost over standard scalar loops.`,
    community_id: 'comm_ai', community_slug: 'ai-systems', flair: 'Vector DB', tags: ['simd', 'vectordb', 'ai', 'performance']
  },
  {
    title: 'Speculative decoding in production: pairing a 1B draft model with a 70B target model for 2.4x latency reduction',
    content: `Because autoregressive generation is memory-bandwidth bound on single tokens, having a tiny 1B parameter draft model guess 4 tokens ahead allows the large 70B model to verify all 4 tokens in a single parallel forward pass. Here are the acceptance rate statistics across coding prompts.`,
    community_id: 'comm_ai', community_slug: 'ai-systems', flair: 'LLM Systems', tags: ['llm', 'inference', 'machinelearning', 'optimization']
  },
  {
    title: 'RoCE v2 vs InfiniBand in 512-GPU training clusters: tuning Priority Flow Control (PFC) deadlocks',
    content: `Ethernet-based RDMA (RoCE v2) requires lossless transmission. When buffer queues fill during all-reduce gradients, PFC pause frames can create circular wait dependencies across leaf-spine switches, freezing training runs. We outline our DCQCN congestion notification tuning strategy.`,
    community_id: 'comm_ai', community_slug: 'ai-systems', flair: 'Networking', tags: ['rdma', 'gpu', 'datacenter', 'distributed']
  },
  {
    title: 'Designing high-throughput LSM-tree bloom filters: Blocked Bloom Filters vs Ribbon Filters',
    content: `Standard bloom filters incur a CPU cache miss on every probed hash bit. Blocked Bloom filters constrain bit probes to a single 64-byte L1 cache line, doubling lookup speeds at the expense of a microscopic increase in false positive probability.`,
    community_id: 'comm_database', community_slug: 'database-internals', flair: 'Data Structures', tags: ['bloomfilter', 'lsm', 'cache', 'algorithms']
  },
  {
    title: 'Dissecting PostgreSQL MVCC vacuuming: page-level pruning vs aggressive table freeze operations',
    content: `A deep dive into how PostgreSQL handles tuple overwrites. In-page vacuuming removes dead tuples during ordinary SELECT queries when space is available on the 8KB page, while autovacuum worker processes perform cross-page index cleaning and transaction ID wraparound prevention.`,
    community_id: 'comm_database', community_slug: 'database-internals', flair: 'PostgreSQL', tags: ['postgres', 'mvcc', 'database', 'internals']
  },
  {
    title: 'Lock contention profiling in high-concurrency Redis clusters: key hash slot redistribution lessons',
    content: `When a single tenant generates 40,000 requests per second to a single Redis cluster node, CPU core saturation degrades latency for all tenants sharing that cluster shard. We implemented a dynamic key salt prefixing pattern that distributes high-cardinality counters across multiple hash slots.`,
    community_id: 'comm_database', community_slug: 'database-internals', flair: 'Caching', tags: ['redis', 'caching', 'concurrency', 'scaling']
  },
  {
    title: 'Linux cgroups v2 memory limits: understanding OOM killer heuristics and page cache reclaim pressure',
    content: `When a container in Kubernetes exceeds its memory limit, the Linux kernel first attempts to aggressively reclaim inactive file-backed page caches before invoking the Out-Of-Memory (OOM) killer. Here is how monitoring \`memory.pressure\` (PSI) gives early warning signals before pods are terminated.`,
    community_id: 'comm_linux', community_slug: 'linux-kernel', flair: 'Kernel & Cgroups', tags: ['linux', 'cgroups', 'kubernetes', 'sre']
  },
  {
    title: 'Building a microkernel IPC mechanism in C: zero-copy message passing via shared virtual memory pages',
    content: `Traditional microkernels suffer a performance penalty when copying messages between user-space driver processes and the kernel. By implementing a virtual memory remapping mechanism inspired by L4 SeL4, page table entries are flipped atomically, achieving sub-200 nanosecond message passing times.`,
    community_id: 'comm_linux', community_slug: 'linux-kernel', flair: 'OS Design', tags: ['microkernel', 'operating-systems', 'c', 'systems']
  },
  {
    title: 'Tracing network packet drops with eBPF kprobes: pinpointing drops across bridge and iptables chains',
    content: `When packets mysteriously vanish inside a complex Docker bridge network, debugging with \`tcpdump\` only shows that a packet never arrived. By instrumenting the \`kfree_skb\` kernel function using an eBPF tracepoint, we capture the exact kernel instruction and reason code for every dropped packet in real time.`,
    community_id: 'comm_linux', community_slug: 'linux-kernel', flair: 'eBPF Tracing', tags: ['ebpf', 'networking', 'debugging', 'kernel']
  },
  {
    title: 'Dissecting V8 hidden class transitions: why object shape mutations deoptimize hot JavaScript loops',
    content: `V8 optimizes property access on JavaScript objects through Inline Caches (ICs) by assigning hidden class shapes. Adding properties dynamically out of order or deleting properties with \`delete\` causes transition trees to branch, degrading monomorphic call sites into megamorphic dictionary lookups.`,
    community_id: 'comm_frontend', community_slug: 'frontend', flair: 'JavaScript V8', tags: ['v8', 'javascript', 'compiler', 'performance']
  },
  {
    title: 'WebAssembly multi-threading with SharedArrayBuffer and Web Workers: audio DSP processing in the browser',
    content: `Porting a professional multi-track digital audio workstation to the browser requires processing audio buffers within strict 2.9ms real-time deadlines (at 128-sample buffer sizes). We demonstrate how compiling C++ audio DSP algorithms to WebAssembly with Atomics and SharedArrayBuffer avoids main-thread UI jank.`,
    community_id: 'comm_frontend', community_slug: 'frontend', flair: 'Wasm & Audio', tags: ['webassembly', 'audio', 'dsp', 'webworkers']
  },
  {
    title: 'Container queries in production design systems: building intrinsically responsive component micro-layouts',
    content: `Media queries respond to the global browser viewport, which breaks component encapsulation when the same card widget is rendered in a narrow sidebar, a central feed, or a wide dialog modal. With CSS \`@container\`, the card responds directly to its parent container width, eliminating brittle breakpoint props.`,
    community_id: 'comm_frontend', community_slug: 'frontend', flair: 'Design Systems', tags: ['css', 'containerqueries', 'responsive', 'frontend']
  },
  {
    title: 'Designing high-contrast monochrome design tokens: semantic color layering and WCAG AAA compliance',
    content: `A truly refined monochrome user interface is not simply greyscale: it relies on subtle luminance differentials across nested surfaces (background, surface-subtle, surface-card, surface-overlay). We explain our lightness curve math that guarantees 7:1 contrast for critical content.`,
    community_id: 'comm_design', community_slug: 'design', flair: 'Design Tokens', tags: ['designsystems', 'tokens', 'accessibility', 'noir']
  },
  {
    title: 'Optical alignment in UI icons: why mathematical centering often looks visually unbalanced to the human eye',
    content: `When placing a triangular play icon or a bookmark glyph inside a circular badge, centering the SVG bounding box mathematically results in an icon that appears off-center because visual mass is concentrated toward one side. Here are the optical correction offsets we apply in our icon component library.`,
    community_id: 'comm_design', community_slug: 'design', flair: 'Visual Design', tags: ['icons', 'svg', 'typography', 'design']
  },
  {
    title: 'Procedural terrain generation in WebGL: layering Perlin noise, erosion simulation, and normal maps',
    content: `Generating believable mountain ranges requires more than basic fractal noise. We demonstrate a pipeline combining fractional Brownian motion (fBm) with a hydraulic particle erosion simulation pass running in a WebGL 2 float texture framebuffer.`,
    community_id: 'comm_creative', community_slug: 'creative-coding', flair: 'Generative Art', tags: ['webgl', 'generative', 'terrain', 'shaders']
  },
  {
    title: 'Raymarching volumetric clouds in WebGPU compute shaders: Henyey-Greenstein phase function lighting',
    content: `Simulating realistic light scattering through dense cloud formations requires evaluating the Henyey-Greenstein phase function for forward and backward scattering towards the sun. We share our temporal accumulation reprojection shader that stabilizes noise across frames.`,
    community_id: 'comm_creative', community_slug: 'creative-coding', flair: 'WebGPU Shaders', tags: ['webgpu', 'volumetric', 'shaders', 'lighting']
  },
  {
    title: 'Graceful degradation in cloud microservices: automated circuit breakers with adaptive error rate thresholds',
    content: `When a downstream recommendation service begins throwing timeouts, calling services should not queue requests indefinitely. Using Netflix Hystrix-style circuit breakers with sliding time windows, our API gateways fail open with cached fallbacks in sub-10ms.`,
    community_id: 'comm_infra', community_slug: 'cloud-native', flair: 'Resilience', tags: ['resilience', 'microservices', 'sre', 'architecture']
  },
  {
    title: 'Chaos engineering in staging environments: automated packet corruption and latency injection pipelines',
    content: `A service that appears reliable under clean network conditions often deadlocks when network packets arrive corrupted or delayed by 250ms. We use Linux \`tc\` (traffic control) and netem within automated GitHub Actions test matrices to verify that our gRPC clients reconnect gracefully.`,
    community_id: 'comm_infra', community_slug: 'cloud-native', flair: 'Chaos Engineering', tags: ['chaos', 'testing', 'networking', 'grpc']
  },
  {
    title: 'Implementing zero-downtime database schema migrations with expand-and-contract patterns',
    content: `Renaming a database column or changing a data type in a database processing 10,000 transactions per second without taking an outage. Step 1: Expand by adding the new column. Step 2: Write to both old and new. Step 3: Backfill legacy rows. Step 4: Contract by cutting reads to the new column.`,
    community_id: 'comm_architecture', community_slug: 'architecture', flair: 'Database Migrations', tags: ['database', 'migrations', 'architecture', 'sql']
  },
  {
    title: 'Why we avoided GraphQL federation and stayed with schema-driven REST and OpenAPI contracts',
    content: `While GraphQL federation promised a unified schema across multiple backend teams, the operational complexity of distributed query planning, n+1 dataloader bugs, and difficult edge caching pushed us back to declarative REST APIs with TypeScript OpenAPI generation.`,
    community_id: 'comm_architecture', community_slug: 'architecture', flair: 'API Architecture', tags: ['api', 'rest', 'graphql', 'architecture']
  },
  {
    title: 'Evaluating memory-mapped files (mmap) vs direct pread syscalls for database page cache managers',
    content: `While \`mmap()\` makes reading pages as simple as dereferencing a memory pointer, the database loses control over write-back timing and can suffer uncontrollable thread stalls when page faults trigger page evictions. Why our storage engine migrated to explicit \`pread\` with user-space buffer pools.`,
    community_id: 'comm_database', community_slug: 'database-internals', flair: 'I/O Internals', tags: ['mmap', 'storage', 'cplusplus', 'linux']
  },
  {
    title: 'Formal verification of distributed commit protocols using TLA+ and TLC model checker',
    content: `Writing distributed consensus code without a mathematical specification is a recipe for undetected edge-case bugs. We modeled a two-phase commit protocol with coordinator failover in TLA+, discovering a subtle three-message deadlock scenario in under 4 minutes of TLC state exploration.`,
    community_id: 'comm_systems', community_slug: 'systems', flair: 'Formal Methods', tags: ['tla', 'formal-verification', 'distributed', 'consensus']
  },
  {
    title: 'eBPF CO-RE (Compile Once – Run Everywhere): BPF Type Format (BTF) relocations explained',
    content: `In the early days of eBPF, BPF programs had to be recompiled on the target machine using kernel headers matching the exact running kernel version. We explain how BTF relocations dynamically rewrite struct offsets at load time, allowing single binary distributions across any modern kernel.`,
    community_id: 'comm_linux', community_slug: 'linux-kernel', flair: 'eBPF Internals', tags: ['ebpf', 'kernel', 'btf', 'linux']
  },
  {
    title: 'Building a custom React virtualized list component: measuring scroll velocity and pre-rendering buffers',
    content: `Rendering 10,000 items in the DOM degrades scroll performance to 15fps. We walk through the architecture of a custom lightweight windowing hook that calculates visible row bounds and dynamically expands pre-rendering overscan buffers based on the user scroll velocity.`,
    community_id: 'comm_frontend', community_slug: 'frontend', flair: 'Virtualization', tags: ['react', 'virtualization', 'dom', 'performance']
  },
  {
    title: 'Accessible color palettes for dark mode: why pure #000000 backgrounds cause halation and eye strain',
    content: `Pure black backgrounds (#000000) with bright white text (#FFFFFF) produce extreme contrast (21:1) that causes visual halation and ghosting for users with astigmatism. Our design tokens use deep neutral greys (#121214) paired with off-white text (#E4E4E7) to maintain AAA compliance with maximum reading comfort.`,
    community_id: 'comm_design', community_slug: 'design', flair: 'Accessibility', tags: ['a11y', 'darkmode', 'design', 'contrast']
  },
  {
    title: 'Low-latency garbage collection in Go 1.23: analyzing GC pacing and write barrier overhead in memory allocators',
    content: `Go's concurrent tri-color mark-sweep collector targets sub-millisecond STW pause times. We analyze how write barrier instructions intercept pointer stores during concurrent marking phases, and provide tips on reducing heap allocations through \`sync.Pool\`.`,
    community_id: 'comm_systems', community_slug: 'systems', flair: 'Go Internals', tags: ['golang', 'gc', 'performance', 'memory']
  },
  {
    title: 'Building an interactive audio synthesizer with Web Audio API AudioWorkletNode and custom DSP',
    content: `The legacy ScriptProcessorNode ran on the browser main UI thread, resulting in catastrophic audio dropouts whenever the page scrolled. AudioWorkletNode runs in a dedicated high-priority audio rendering thread, delivering glitch-free polyphonic synthesis in pure JavaScript and WebAssembly.`,
    community_id: 'comm_creative', community_slug: 'creative-coding', flair: 'Web Audio', tags: ['webaudio', 'dsp', 'music', 'javascript']
  },
  {
    title: 'Service mesh security with SPIFFE and SPIRE: cryptographic workload identities without static credentials',
    content: `Hardcoding API tokens or TLS certificates in Kubernetes secrets is a security liability. SPIFFE issues short-lived, cryptographically verifiable X.509 SVID identities to pods based on kernel-attested attributes, enabling automated mTLS between distributed services.`,
    community_id: 'comm_infra', community_slug: 'cloud-native', flair: 'Security', tags: ['security', 'spiffe', 'kubernetes', 'mtls']
  },
];

// 45 Everyday Personal, College, Hobbies & Lifestyle Posts
const lifestylePosts = [
  {
    title: 'First snow of the season in Montreal: quiet morning walk through Mile End with coffee',
    content: `Woke up to 10 centimeters of fresh powder blanketing the rooftops. The city gets so peacefully quiet during the first snowfall before the plows start running. Grabbed a warm cappuccino from Café Olimpico and just wandered through the side alleys enjoying the crisp morning air.`,
    community_id: 'comm_photography', community_slug: 'photography', flair: 'Morning Journal', tags: ['montreal', 'winter', 'coffee', 'citylife']
  },
  {
    title: 'Adopted a rescue cat this weekend: meet Jasper!',
    content: `After months of searching shelters, we brought Jasper home on Saturday. He spent the first three hours hiding behind the bookshelf, but by Sunday evening he was purring loudly on my lap while I was reading on the couch. Best decision of the year.`,
    community_id: 'comm_photography', community_slug: 'photography', flair: 'Pets', tags: ['cats', 'pets', 'home', 'daily']
  },
  {
    title: 'Weekend trail run through Mount Royal park: autumnal trees and misty scenic views',
    content: `Logged 12km through the dirt trails on Mount Royal this morning. The leaves are in full golden orange mode right now. The elevation gain on the wooden stairs always humbles me, but looking out over the St. Lawrence river at the summit makes every stride worth it.`,
    community_id: 'comm_photography', community_slug: 'photography', flair: 'Trail Running', tags: ['running', 'fitness', 'nature', 'outdoors']
  },
  {
    title: 'Learning to play the acoustic guitar as an adult: month three progress and blistered fingers',
    content: `Decided at age 28 that I finally wanted to learn guitar. The F major barre chord felt anatomically impossible for the first six weeks, but yesterday it suddenly clicked clean on all six strings. Practicing acoustic fingerpicking for 30 minutes every evening has become my favorite way to unplug from screens.`,
    community_id: 'comm_creative', community_slug: 'creative-coding', flair: 'Music', tags: ['guitar', 'music', 'hobbies', 'learning']
  },
  {
    title: 'Sunday homemade ramen experiment: 12-hour simmered pork broth, soft egg, and handmade noodles',
    content: `Spent all of Sunday making a proper bowl of shoyu tonkotsu ramen from scratch. Rolled the noodles through an Atlas pasta machine with sodium carbonate water for that authentic bouncy chew. The broth was rich, emulsified, and deeply savory.`,
    community_id: 'comm_creative', community_slug: 'creative-coding', flair: 'Cooking', tags: ['ramen', 'cooking', 'food', 'weekend']
  },
  {
    title: 'Balcony garden harvest: first batch of homegrown Genovese basil and sweet cherry tomatoes',
    content: `You don't need a backyard to grow your own food! My small third-floor apartment balcony produced enough basil this month for two jars of fresh pine-nut pesto and sweet tomatoes that taste a hundred times better than grocery store produce.`,
    community_id: 'comm_creative', community_slug: 'creative-coding', flair: 'Gardening', tags: ['gardening', 'balcony', 'plants', 'food']
  },
  {
    title: 'Late night study session at the university campus library before systems programming finals',
    content: `Engineering library is packed with students fueled by yerba mate, drip coffee, and whiteboard markers. We have been tracing virtual memory address translation diagrams on the whiteboard for three hours straight. There is something comforting about everyone grinding together late at night.`,
    community_id: 'comm_systems', community_slug: 'systems', flair: 'College Life', tags: ['study', 'college', 'university', 'finals']
  },
  {
    title: 'Found a pristine 1974 Olympus OM-1 film SLR camera at a neighborhood flea market',
    content: `Browsing a weekend flea market and spotted this beauty tucked in a leather case for $40. Fully mechanical shutter, bright 0.92x optical viewfinder, and the Zuiko 50mm f/1.8 lens has zero fungus or haze. Loaded a roll of Tri-X 400 immediately to test the shutter speeds.`,
    community_id: 'comm_photography', community_slug: 'photography', flair: 'Film Gear', tags: ['filmphotography', 'vintage', 'cameras', 'analog']
  },
  {
    title: 'My journey from self-taught hobbyist to landing my first software engineering internship',
    content: `A year ago, I didn't know what a Git rebase was and was overwhelmed by command line terminals. After building small personal projects, asking questions, and reading open-source codebases, I accepted my first internship offer today. Don't let imposter syndrome hold you back from starting!`,
    community_id: 'comm_systems', community_slug: 'systems', flair: 'Milestone', tags: ['career', 'learning', 'internship', 'motivation']
  },
  {
    title: 'Four science-fiction book recommendations that changed how I think about computation and consciousness',
    content: `Looking for winter reading? Here are four books I keep returning to:
1. *Permutation City* by Greg Egan (cellular automata and copies of mind)
2. *Blindsight* by Peter Watts (evolutionary cognition and alien consciousness)
3. *Stories of Your Life and Others* by Ted Chiang (linguistic determinism)
4. *A Deepness in the Sky* by Vernor Vinge (deep-time system archaeology and programmer-linguists).`,
    community_id: 'comm_systems', community_slug: 'systems', flair: 'Books', tags: ['books', 'scifi', 'reading', 'recommendations']
  },
  {
    title: 'Exploring local specialty coffee roasters: tasting a naturally processed Ethiopian anaerobic lot',
    content: `Visited a local micro-roaster this morning that was featuring an anaerobic fermented Ethiopian bean from the Yirgacheffe region. Brewed on a V60 with a 1:16 ratio at 92°C. The floral jasmine aroma and strawberry jam fruit notes were unbelievable—tasted almost like blueberry wine.`,
    community_id: 'comm_design', community_slug: 'design', flair: 'Coffee', tags: ['coffee', 'specialtycoffee', 'pourover', 'lifestyle']
  },
  {
    title: 'Why taking long walks without headphones or podcasts has improved my problem-solving clarity',
    content: `I used to fill every minute of walking, commuting, or chores with tech podcasts or audiobooks. For the past month, I started taking 45-minute evening walks in complete silence with just my thoughts. It is astonishing how often stubborn code bugs untangle themselves when you give your brain space to daydream.`,
    community_id: 'comm_design', community_slug: 'design', flair: 'Reflections', tags: ['mindfulness', 'habits', 'productivity', 'health']
  },
  {
    title: 'Building an ultralight bikepacking setup for weekend gravel camping trips',
    content: `Transitioned my steel gravel bike into a weekend bikepacking rig. Fitted a half-frame bag for tools and food, a dry bag strapped to the handlebars with a one-person tent, and an oversized saddle bag for clothing and a sleeping bag. Total base weight is under 18 pounds.`,
    community_id: 'comm_photography', community_slug: 'photography', flair: 'Bikepacking', tags: ['cycling', 'bikepacking', 'outdoors', 'adventure']
  },
  {
    title: 'Restoring an old solid-oak mid-century student desk: sanding, oiling, and new brass hardware',
    content: `Rescued a beat-up mid-century oak desk from an estate sale. Spent two weekends stripping layers of peeling varnish, sanding it down to bare wood with 220 grit, and applying three coats of hand-rubbed Danish oil. The natural grain figure came back to life beautifully.`,
    community_id: 'comm_design', community_slug: 'design', flair: 'Woodworking', tags: ['woodworking', 'diy', 'restoration', 'furniture']
  },
  {
    title: 'Golden hour architectural photography along the city canals: concrete bridges and calm reflections',
    content: `Caught the last 20 minutes of golden light along the old industrial canal basin. The water was like glass, reflecting the steel railway lift-bridge against the dusty pink sky. Shot on Kodak Portra 160 at f/8 on a sturdy tripod.`,
    community_id: 'comm_photography', community_slug: 'photography', flair: 'Golden Hour', tags: ['photography', 'reflections', 'urban', 'architecture']
  },
  {
    title: 'My experience switching to a split ortholinear keyboard: three weeks of typing retraining',
    content: `Day 1: Typing speed plummeted from 110 WPM to 18 WPM. I questioned every life choice. Day 10: Muscles started finding the inner columns without looking. Day 21: Back up to 85 WPM, and the chronic right wrist strain that bothered me for months is completely gone.`,
    community_id: 'comm_design', community_slug: 'design', flair: 'Ergonomics', tags: ['ergonomics', 'mechanicalkeyboards', 'hardware', 'health']
  },
  {
    title: 'Cooking with seasonal farmers market vegetables: roasting kabocha squash with browned butter and sage',
    content: `The autumn produce stalls are full of heirloom root vegetables and winter squashes. Roasted a sliced kabocha with flaky sea salt and topped it with foaming browned butter, crispy fried sage leaves, and toasted pumpkin seeds. Warm, comforting, and simple.`,
    community_id: 'comm_creative', community_slug: 'creative-coding', flair: 'Food & Cooking', tags: ['cooking', 'seasonal', 'autumn', 'food']
  },
  {
    title: 'Morning workout routine: how 20 minutes of kettlebell swings and mobility work replaced my sluggish mornings',
    content: `Replaced groggy morning phone scrolling with a simple circuit: 100 kettlebell swings, 3 sets of Turkish get-ups, and 10 minutes of hip mobility stretching. My lower back feels bulletproof during long sitting sessions, and my energy is dialed in before standup.`,
    community_id: 'comm_design', community_slug: 'design', flair: 'Fitness', tags: ['fitness', 'habits', 'health', 'morning']
  },
  {
    title: 'Documenting Brutalist university campus buildings in winter: concrete textures in overcast flat light',
    content: `Most people prefer sunny days for photography, but for raw architectural concrete, a uniform overcast grey sky provides the most honest, diffused illumination. It eliminates harsh distracting specular highlights and lets the aggregate grain and formwork seams take center stage.`,
    community_id: 'comm_photography', community_slug: 'photography', flair: 'Architecture', tags: ['brutalism', 'concrete', 'monochrome', 'photography']
  },
  {
    title: 'Setting up a local paperless document management system with Paperless-ngx on a Raspberry Pi',
    content: `Finally shredded three filing cabinets full of utility bills, tax documents, and receipts. Every piece of paper is scanned through an automatic document feeder, OCR processed by Paperless-ngx on a quiet Pi 4, and tagged automatically with full-text search.`,
    community_id: 'comm_infra', community_slug: 'cloud-native', flair: 'Self-Hosting', tags: ['selfhosted', 'raspberrypi', 'homelab', 'productivity']
  },
  {
    title: 'Night city bike commute: passing glowing neon signs and quiet industrial waterfront piers',
    content: `Riding home at 10 PM along the dedicated bike paths by the river. The air is cool, the streets are empty, and the rhythmic sound of tires on asphalt is meditative after a long day of debugging complex code.`,
    community_id: 'comm_photography', community_slug: 'photography', flair: 'Commute', tags: ['cycling', 'night', 'urban', 'commute']
  },
  {
    title: 'Visiting the national science museum: standing beneath an Apollo-era rocket turbine engine',
    content: `Spent three hours staring at the plumbing on an Apollo F-1 rocket engine. The density of stainless steel piping, high-pressure turbopump volutes, and hand-brazed regenerative cooling tubes is a reminder of what human engineering can accomplish with analog slide rules.`,
    community_id: 'comm_systems', community_slug: 'systems', flair: 'Engineering History', tags: ['engineering', 'space', 'history', 'museum']
  },
  {
    title: 'Experimenting with cyanotype sun printing: botanical ferns and architectural negative transparencies',
    content: `Mixed potassium ferricyanide with ferric ammonium citrate in a dim bathroom, coated heavy cotton watercolor paper, and exposed botanical leaves under the midday sun for 8 minutes. Washing in running water brought out that deep, gorgeous Prussian blue.`,
    community_id: 'comm_creative', community_slug: 'creative-coding', flair: 'Alternative Process', tags: ['cyanotype', 'art', 'printmaking', 'analog']
  },
  {
    title: 'The joy of building small, single-purpose software tools that do exactly one thing well',
    content: `Not every personal project needs to be a venture-backed SaaS platform. Built a tiny 150-line CLI tool in Go that converts my camera raw filenames to ISO date timestamps. It took 45 minutes to write, has zero external dependencies, and I use it three times a week.`,
    community_id: 'comm_systems', community_slug: 'systems', flair: 'Tools', tags: ['golang', 'cli', 'software', 'productivity']
  },
  {
    title: 'Campus coding sprint: team build session for the university hackathon project',
    content: `Our 4-person team has been camped in the engineering lounge for 24 hours. Whiteboard covered in API endpoints, empty pizza boxes stacked in the corner, and our WebSockets demo just passed its first multi-client test. Exhausted but loving the energy.`,
    community_id: 'comm_frontend', community_slug: 'frontend', flair: 'Hackathon', tags: ['hackathon', 'college', 'coding', 'teamwork']
  },
  {
    title: 'Sourdough focaccia with rosemary, flaked Maldon sea salt, and caramelized shallots',
    content: `Used leftover sourdough discard to make a high-hydration dimpled focaccia. Drizzled generously with cold-pressed olive oil, fresh garden rosemary, and slow-roasted sweet shallots. The bottom crust was super crunchy while the interior stayed pillowy soft.`,
    community_id: 'comm_creative', community_slug: 'creative-coding', flair: 'Baking', tags: ['baking', 'focaccia', 'sourdough', 'food']
  },
  {
    title: 'Cleaning and organizing my digital photo archives: organizing 50,000 raw files into year/month directories',
    content: `Finally consolidated 8 years of scattered external hard drives into a single RAID-1 ZFS pool. Used an open-source command line tool to catalog EXIF metadata, deduplicate 4,000 accidental copies, and verify cryptographic SHA256 checksums across the entire archive.`,
    community_id: 'comm_infra', community_slug: 'cloud-native', flair: 'Data Archiving', tags: ['photography', 'storage', 'archival', 'homelab']
  },
  {
    title: 'Brewing loose leaf Taiwanese High Mountain Oolong tea: gongfu brewing session notes',
    content: `Enjoying an afternoon gongfu tea session with an Alishan High Mountain oolong. Using a 100ml clay gaiwan with 6 grams of leaf and 90°C spring water. The initial steeps delivered buttery orchid sweetness, evolving into clean lingering mineral notes by steep seven.`,
    community_id: 'comm_design', community_slug: 'design', flair: 'Tea', tags: ['tea', 'gongfutea', 'lifestyle', 'mindfulness']
  },
  {
    title: 'Repairing a squeaky mechanical office chair with marine silicone grease and replacement skate wheels',
    content: `Before you replace an expensive ergonomic chair, check the hardware. Swapped out the brittle plastic casters for rollerblade-style polyurethane wheels and greased the pneumatic tilt pivot with silicone lubricant. Now it glides silently across hardwood without scratches.`,
    community_id: 'comm_design', community_slug: 'design', flair: 'DIY Repair', tags: ['diy', 'repair', 'ergonomics', 'maintenance']
  },
  {
    title: 'Cold morning trail walk with my border collie: frosted spiderwebs and autumn river mist',
    content: `Took Luna out at 6:45 AM along the river bluffs. The temperature dropped below freezing overnight, leaving every spiderweb along the briars encrusted with sparkling ice crystals. Watching your dog sprint joyfully through frosted tall grass is the best start to any morning.`,
    community_id: 'comm_photography', community_slug: 'photography', flair: 'Dog Life', tags: ['dogs', 'pets', 'morning', 'nature']
  },
  {
    title: 'Listening to Steve Reich Electric Counterpoint on vinyl through open-back planar magnetic headphones',
    content: `Nothing resets my focus like minimalist phase-shifting music. Listening to Jonny Greenwood perform Steve Reich's Electric Counterpoint on 180g vinyl through a pair of Hifiman planar headphones. The layered guitar counter-melodies create an incredible soundstage.`,
    community_id: 'comm_creative', community_slug: 'creative-coding', flair: 'Audio & Music', tags: ['vinyl', 'music', 'audiophile', 'headphones']
  },
  {
    title: 'Reflections on two years of remote pair programming: what actually makes pair sessions effective',
    content: `Pair programming can either be a deeply energizing collaborative flow or an exhausting micromanagement session. The key difference in our team has been switching roles every 25 minutes (strict Pomodoro driver/navigator rotation) and normalizing taking breaks to think quietly.`,
    community_id: 'comm_systems', community_slug: 'systems', flair: 'Engineering Culture', tags: ['pairprogramming', 'collaboration', 'remote', 'culture']
  },
  {
    title: 'Making homemade spicy kimchi from scratch: salting napa cabbage and fermenting with gochugaru',
    content: `Prepped 5 heads of napa cabbage for winter kimchi. Massaged with coarse sea salt, washed thoroughly, and layered with a paste of Korean chili powder, garlic, ginger, daikon radish, and fermented fish sauce. It is currently bubbling happily in glass crocks on the pantry counter.`,
    community_id: 'comm_creative', community_slug: 'creative-coding', flair: 'Fermentation', tags: ['fermentation', 'kimchi', 'cooking', 'food']
  },
  {
    title: 'Weekend hardware hacking: flashing custom open-source QMK firmware onto a macro pad',
    content: `Built a 9-key rotary macro pad for video editing and Git commands. Programmed custom rotary encoder layers: dial turns scrub timeline frames in DaVinci Resolve, while clicking the encoder toggles audio mute. Flashed in seconds with the QMK CLI.`,
    community_id: 'comm_systems', community_slug: 'systems', flair: 'Hardware Hacking', tags: ['qmk', 'keyboards', 'firmware', 'diy']
  },
  {
    title: 'The satisfying ritual of fountain pen maintenance: flushing nibs and refilling with archival black ink',
    content: `Taking 15 minutes on Sunday to flush my daily carry fountain pens with distilled water and refilling with Pilot Iroshizuku Take-sumi ink. There is an intentional tactile tactile pleasure in writing notes with a fountain pen that digital typing can never replicate.`,
    community_id: 'comm_design', community_slug: 'design', flair: 'Stationery', tags: ['fountainpens', 'stationery', 'analog', 'writing']
  },
  {
    title: 'Sunrise kayak paddle along the quiet marshlands: herons, mist, and glassy morning waters',
    content: `Put the kayak into the water at dawn before any motorboats were out. Glided quietly through the reeds within twenty feet of a great blue heron fishing in the shallows. The water was so still you couldn't tell where the morning reflection ended and the sky began.`,
    community_id: 'comm_photography', community_slug: 'photography', flair: 'Kayaking', tags: ['kayaking', 'nature', 'outdoors', 'photography']
  },
  {
    title: 'Building a simple wooden monitor stand with mortise and tenon joinery',
    content: `Instead of buying a cheap particle board monitor shelf, I practiced traditional wood joinery on walnut scraps. Cut the mortises with a Japanese chisel and hand-sawed the tenons. Finished with beeswax. It is rock solid and holds my 32-inch display perfectly.`,
    community_id: 'comm_design', community_slug: 'design', flair: 'Woodworking', tags: ['woodworking', 'craft', 'maker', 'diy']
  },
  {
    title: 'Learning Go concurrency primitives: implementing a worker pool with select timeout channels',
    content: `Coming from Python, Go's lightweight goroutines and channels felt almost magical. Built a small concurrent URL status checker that processes 5,000 URLs with a 50-worker pool and context cancellation timeouts. The simplicity of channel synchronization is addictive.`,
    community_id: 'comm_systems', community_slug: 'systems', flair: 'Learning Go', tags: ['golang', 'concurrency', 'programming', 'learning']
  },
  {
    title: 'Late autumn forest hike: tracking deer trails and photographing colorful bracket fungi',
    content: `Hiked 8 miles through the deciduous woods after a night of gentle rain. The wet moss on fallen logs was vibrant green, and ancient beech trees were covered in delicate ruffled bracket shelf fungi. Perfect afternoon to recharge creative batteries.`,
    community_id: 'comm_photography', community_slug: 'photography', flair: 'Nature Walk', tags: ['hiking', 'forest', 'nature', 'autumn']
  },
  {
    title: 'Experimenting with pour-over coffee water chemistry: remineralizing distilled water with magnesium and calcium',
    content: `Tap water in my city is extremely hard, which mutes delicate floral acidity in light roast coffees. Started remineralizing distilled water with Epsom salts (magnesium sulfate) and baking soda (sodium bicarbonate) according to Barista Hustle recipes. The flavor clarity difference was night and day.`,
    community_id: 'comm_design', community_slug: 'design', flair: 'Coffee Science', tags: ['coffee', 'waterchemistry', 'pourover', 'science']
  },
  {
    title: 'Weekend decluttering: simplifying my everyday carry and desk tools down to the absolute essentials',
    content: `Donated 4 boxes of old cables, duplicate dongles, and notebooks I will never use. Kept one reliable pen, one field notes notebook, one pair of headphones, and my laptop. The psychological lightness of an uncluttered physical space immediately translates into calmer coding sessions.`,
    community_id: 'comm_design', community_slug: 'design', flair: 'Minimalism', tags: ['minimalism', 'organization', 'productivity', 'lifestyle']
  },
  {
    title: 'Home barista latte art practice: finally pouring consistent heart and tulip patterns',
    content: `Steaming milk to glossy microfoam (paint-like texture) took months of practice on my home espresso machine. Today I finally poured three clean symmetrical tulips in a row for my roommates. Consistency in milk vortex swirling is 90% of the battle!`,
    community_id: 'comm_design', community_slug: 'design', flair: 'Latte Art', tags: ['coffee', 'latteart', 'espresso', 'barista']
  },
  {
    title: 'Exploring generative art with paper and mechanical pen plotters: AxiDraw geometric line drawings',
    content: `There is a magical tactile thrill in watching a mechanical AxiDraw pen plotter draw thousands of algorithmically generated lines with a black gel pen on textured cotton paper. The micro-imperfections where the pen stops make each physical print unique.`,
    community_id: 'comm_creative', community_slug: 'creative-coding', flair: 'Pen Plotter', tags: ['penplotter', 'generativeart', 'creativecoding', 'art']
  },
  {
    title: 'Why I still carry a pocket paper notebook everywhere: capturing fleeting ideas without phone distraction',
    content: `Every time I unlocked my phone to jot down a quick thought, I inevitably got sidetracked by notifications or messages. Carrying a pocket Field Notes notebook and a ballpoint pen keeps ideation immediate, tangible, and completely distraction-free.`,
    community_id: 'comm_design', community_slug: 'design', flair: 'Analog Habits', tags: ['notebook', 'habits', 'writing', 'analog']
  },
  {
    title: 'Sunset over the industrial railway yards: silhouette of grain silos and passing freight cars',
    content: `Walked down to the railway viaduct right as the sun touched the horizon. The massive concrete grain elevators cast long dramatic shadows across the switching tracks, and the evening sky turned a dusty amber. A quiet end to a productive week.`,
    community_id: 'comm_photography', community_slug: 'photography', flair: 'Sunset', tags: ['photography', 'railway', 'industrial', 'sunset']
  },
];

// 27 Community Questions & Open Discussion Starters
const discussionQuestions = [
  {
    title: 'What is your favorite underappreciated Linux CLI tool that you immediately install on every new server?',
    content: `We all know the standard tools like \`htop\`, \`curl\`, and \`tmux\`. But what is that one lesser-known CLI utility (like \`ripgrep\`, \`fd\`, \`ncdu\`, \`jq\`, or \`bat\`) that significantly speeds up your terminal workflow or debugging sessions? Share how you use it!`,
    community_id: 'comm_linux', community_slug: 'linux-kernel', flair: 'Discussion', tags: ['linux', 'cli', 'tools', 'terminal']
  },
  {
    title: 'How does your engineering team handle database migrations when zero downtime is an absolute requirement?',
    content: `Do you rely on automated expand-and-contract schema migrations, tools like gh-ost / pt-online-schema-change, or custom application-level feature flags? What has been your biggest horror story or hard-earned lesson when running migrations on multi-terabyte production tables?`,
    community_id: 'comm_database', community_slug: 'database-internals', flair: 'Ask Community', tags: ['database', 'migrations', 'devops', 'architecture']
  },
  {
    title: 'For those who work from home full-time: what is the single desk upgrade that most improved your ergonomics?',
    content: `Between standing desks, monitor arms, ergonomic chairs, split keyboards, footrests, and vertical mice, which specific piece of equipment made the biggest measurable difference for your posture or reduced physical fatigue at the end of the day?`,
    community_id: 'comm_design', community_slug: 'design', flair: 'Ergonomics', tags: ['wfh', 'ergonomics', 'desksetup', 'productivity']
  },
  {
    title: 'What was the most challenging or perplexing production bug you ever investigated, and how did you solve it?',
    content: `The kind of bug that kept you awake at night—a rare race condition, an exotic kernel page fault, memory corruption under load, or a silent network packet drop. What was the mystery, what debugging tools cracked it open, and what did you learn?`,
    community_id: 'comm_systems', community_slug: 'systems', flair: 'War Stories', tags: ['debugging', 'systems', 'warstories', 'engineering']
  },
  {
    title: 'Film photographers of SocialGraph: what is your go-to black-and-white film stock for moody, overcast days?',
    content: `Do you prefer the fine grain and deep tonal range of Ilford HP5 Plus, the high micro-contrast of Kodak Tri-X 400, or modern tabular grain emulsions like T-Max 400? How do you rate and push/pull your development when the light is completely flat?`,
    community_id: 'comm_photography', community_slug: 'photography', flair: 'Film Talk', tags: ['filmphotography', 'monochrome', 'analog', 'cameras']
  },
  {
    title: 'How do you organize CSS custom properties and design tokens across large multi-package codebases?',
    content: `Do you structure tokens into primitive, semantic, and component-specific tiers? How do you prevent token bloat while supporting multi-theme capabilities (dark mode, high contrast, brand accents)? What tooling has worked best in your design system pipeline?`,
    community_id: 'comm_design', community_slug: 'design', flair: 'Design Tokens', tags: ['designsystems', 'css', 'tokens', 'frontend']
  },
  {
    title: 'Self-hosters: what service did you start self-hosting that ended up being surprisingly reliable and indispensable?',
    content: `Whether it is Vaultwarden for passwords, Nextcloud for file sync, Jellyfin for media, Pi-hole for DNS ad-blocking, or Home Assistant for local automation: what self-hosted tool has earned a permanent spot on your homelab server?`,
    community_id: 'comm_infra', community_slug: 'cloud-native', flair: 'Self-Hosting', tags: ['selfhosted', 'homelab', 'linux', 'privacy']
  },
  {
    title: 'What programming language feature or paradigm initially felt unintuitive, but became indispensable once it clicked?',
    content: `Could be Rust's borrow checker and non-lexical lifetimes, Haskell's monads, Go's channel select statements, Lisp macros, or Elixir's actor model pattern matching. What was the mental shift that made it click for you?`,
    community_id: 'comm_systems', community_slug: 'systems', flair: 'Programming', tags: ['languages', 'paradigms', 'learning', 'coding']
  },
  {
    title: 'What are your favorite shaders or creative coding projects that push the visual limits of the modern web?',
    content: `Shadertoy experiments, WebGPU generative canvases, interactive audio visualizers, or portfolio experiences. What is an interactive piece of web graphics that genuinely inspired you with its mathematics and artistry?`,
    community_id: 'comm_creative', community_slug: 'creative-coding', flair: 'Inspiration', tags: ['creativecoding', 'shaders', 'webgl', 'webgpu']
  },
  {
    title: 'How do you handle secrets and environment variables in local development without committing .env files?',
    content: `Do you use 1Password CLI, Doppler, AWS Secrets Manager with local proxying, or SOPS with age encryption? What workflow keeps secrets out of Git while keeping onboarding frictionless for new developers?`,
    community_id: 'comm_infra', community_slug: 'cloud-native', flair: 'Security', tags: ['security', 'devops', 'secrets', 'tooling']
  },
  {
    title: 'Mechanical keyboard enthusiasts: linear, tactile, or clicky switches for long programming sessions?',
    content: `What switch weighting (e.g. 45g vs 62g vs 67g) and stem mechanism has proven most comfortable for typing thousands of lines of code without finger fatigue? Do you lube your switches manually or prefer stock factory-lubed?`,
    community_id: 'comm_design', community_slug: 'design', flair: 'Keyboards', tags: ['mechanicalkeyboards', 'hardware', 'switches', 'desksetup']
  },
  {
    title: 'What is your approach to managing state in React applications in 2026? Has it simplified over time?',
    content: `Between React 19 Actions, URL search params, lightweight stores like Zustand, and server caching libraries like TanStack Query: how much global state management do your applications actually need today compared to the Redux boilerplate era?`,
    community_id: 'comm_frontend', community_slug: 'frontend', flair: 'React Architecture', tags: ['react', 'state', 'frontend', 'architecture']
  },
  {
    title: 'What is the most effective mental model or analogy you use when explaining distributed consensus to newcomers?',
    content: `Explaining Paxos, Raft, or vector clocks can quickly overwhelm junior engineers with abstract terminology. What visual analogy or real-world example has made the concept of consensus and split-brain resolution click most effectively in your mentoring?`,
    community_id: 'comm_systems', community_slug: 'systems', flair: 'Mentorship', tags: ['distributed', 'consensus', 'education', 'architecture']
  },
  {
    title: 'Coffee enthusiasts: what is your standard daily brewing routine and preferred grinder setting?',
    content: `Are you a precision pour-over purist with an Acaia scale, an Aeropress inverted method fan, a French press lover, or a home espresso tinkerer with a lever machine? What beans are currently in your hopper?`,
    community_id: 'comm_design', community_slug: 'design', flair: 'Coffee Talk', tags: ['coffee', 'pourover', 'espresso', 'lifestyle']
  },
  {
    title: 'When should a team transition from single-node PostgreSQL to a distributed SQL engine like CockroachDB or TiDB?',
    content: `Many teams prematurely adopt distributed SQL and pay heavy latency and operational penalties for cross-node transactions when a well-tuned single primary with read replicas and table partitioning could have scaled for years. Where is the real inflection point?`,
    community_id: 'comm_database', community_slug: 'database-internals', flair: 'Scale Architecture', tags: ['database', 'distributed-sql', 'postgresql', 'scaling']
  },
  {
    title: 'What monitor setup has worked best for your coding workflow: single ultrawide vs dual separate monitors?',
    content: `Do you prefer an immersive 34-inch or 49-inch curved ultrawide with tiling window management, or two independent 27-inch 4K panels (one vertical for reading logs/code and one horizontal)? What are the pros and cons you have experienced?`,
    community_id: 'comm_design', community_slug: 'design', flair: 'Workspace', tags: ['monitors', 'desksetup', 'workspace', 'productivity']
  },
  {
    title: 'How do you structure integration tests to run fast without compromising real database verification?',
    content: `Do you spin up ephemeral Docker containers with Testcontainers, run against a persistent local database with transaction rollbacks, or rely on SQLite in-memory mocks? How do you balance test realism with sub-30-second CI runtimes?`,
    community_id: 'comm_infra', community_slug: 'cloud-native', flair: 'Testing', tags: ['testing', 'ci', 'database', 'quality']
  },
  {
    title: 'What is your favorite retro computing system or vintage operating system to experiment with in an emulator?',
    content: `BeOS, AmigaOS Workbench, NeXTSTEP 3.3, Classic Mac OS 9, SGI IRIX, or OS/2 Warp. What design ideas from vintage systems do you wish modern desktop operating systems had kept?`,
    community_id: 'comm_systems', community_slug: 'systems', flair: 'Retrocomputing', tags: ['retrocomputing', 'unix', 'amiga', 'history']
  },
  {
    title: 'What camera lens focal length do you find yourself reaching for most often when shooting street photography?',
    content: `Are you in the classic 28mm wide environmental camp (like Garry Winogrand), the versatile 35mm documentary storytelling camp (Henri Cartier-Bresson), or the tight 50mm natural perspective camp? How does your lens choice shape how you approach subjects in the city?`,
    community_id: 'comm_photography', community_slug: 'photography', flair: 'Street Photography', tags: ['photography', 'lenses', 'street', 'composition']
  },
  {
    title: 'What techniques have helped you maintain code quality and test coverage without slowing down feature velocity?',
    content: `Strict static typing, pre-commit lint hooks, automated PR previews, mutation testing, or pair programming on complex modules. What practices provide the highest return on investment for keeping technical debt manageable?`,
    community_id: 'comm_systems', community_slug: 'systems', flair: 'Best Practices', tags: ['engineering', 'testing', 'codequality', 'velocity']
  },
  {
    title: 'How do you handle client-side form validation and error recovery with accessibility (ARIA) in mind?',
    content: `When a form submission fails with multiple validation errors, how do you announce errors to screen reader users without disorienting keyboard focus? Do you use inline field descriptions with \`aria-describedby\` or top-level error summary alerts?`,
    community_id: 'comm_frontend', community_slug: 'frontend', flair: 'Accessibility', tags: ['a11y', 'forms', 'frontend', 'accessibility']
  },
  {
    title: 'What are your go-to techniques for profiling memory leaks and heap bloat in production Node.js services?',
    content: `Do you take V8 heap snapshots via Chrome DevTools, inspect \`process.memoryUsage()\` allocations in Prometheus, or use Clinic.js Flame graphs? What has been your most frequent memory leak culprit (e.g. unclosed event listeners, unbounded Map caches)?`,
    community_id: 'comm_frontend', community_slug: 'frontend', flair: 'Node.js', tags: ['nodejs', 'memory', 'debugging', 'performance']
  },
  {
    title: 'How do you design REST APIs to be easily versioned and evolved without breaking third-party client integrations?',
    content: `URI path versioning (/v1 vs /v2), header-based versioning, date-based versioning (like Stripe), or strictly additive non-breaking schema evolution. What approach has proven most maintainable in your experience?`,
    community_id: 'comm_architecture', community_slug: 'architecture', flair: 'API Design', tags: ['api', 'rest', 'architecture', 'contracts']
  },
  {
    title: 'What is your favorite local hiking trail or natural escape when you need to disconnect from tech entirely?',
    content: `Where do you go when you need fresh mountain air, quiet forest trails, or coastal shores to clear your mind? Tell us about your favorite trail, the best season to hike it, and what makes it special.`,
    community_id: 'comm_photography', community_slug: 'photography', flair: 'Outdoors', tags: ['hiking', 'outdoors', 'nature', 'travel']
  },
  {
    title: 'How do you approach learning complex new technical domains (e.g. compilers, kernel internals, distributed systems)?',
    content: `Do you read academic papers, write toy implementations from scratch, trace existing open-source codebases, or watch conference talks? What learning workflow helps you move past surface-level tutorials into genuine deep understanding?`,
    community_id: 'comm_systems', community_slug: 'systems', flair: 'Learning', tags: ['learning', 'career', 'engineering', 'systems']
  },
  {
    title: 'What is your philosophy on dark mode design: pure black backgrounds (#000000) or dark tinted grey surfaces?',
    content: `Many mobile OLED users love true black for battery savings, while desktop users often find true black too harsh with visual eye strain and smear. How does your design system balance contrast, surface depth, and aesthetics in dark themes?`,
    community_id: 'comm_design', community_slug: 'design', flair: 'UI Design', tags: ['darkmode', 'design', 'ui', 'color']
  },
  {
    title: 'What book, article, or talk most fundamentally changed how you think about software engineering architecture?',
    content: `Was it Martin Fowler's Refactoring, Designing Data-Intensive Applications by Martin Kleppmann, Rich Hickey's Simple Made Easy, or a specific post-mortem from an engineering team? Share the resource and the core insight you took away from it!`,
    community_id: 'comm_architecture', community_slug: 'architecture', flair: 'Inspiration', tags: ['books', 'architecture', 'career', 'mentorship']
  },
];

console.log(`Loaded content pools:
- Real News: ${realNewsItems.length}
- Multi-Image: ${multiImagePosts.length}
- Tech Posts: ${techPosts.length + extraTechPosts.length} (50 total)
- Lifestyle Posts: ${lifestylePosts.length} (45 total)
- Community Questions: ${discussionQuestions.length} (27 total)
Total Discussion Posts: ${realNewsItems.length + multiImagePosts.length + techPosts.length + extraTechPosts.length + lifestylePosts.length + discussionQuestions.length} (140 total)`);
