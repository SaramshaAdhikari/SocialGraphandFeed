// Assembles the complete authentic Phase 2A.4 expanded dataset
// - Non-face vector avatars for all 110 fixture users
// - Authentic internet handles and diverse global backgrounds
// - Zero human faces in profile pictures
// - Contextually matched post authoring across all 18 communities
// - 0 zero-post fixture users
import fs from 'node:fs';
import path from 'node:path';
import { verifiedPhotos } from '../packages/backend/src/db/fixtures/verifiedPhotos.js';
import { realNewsItems, multiImagePosts } from './phase2a1_content_data.js';
import { techPosts } from './phase2a1_more_posts.js';
import { contextualRootComments } from './phase2a1_comments_data.js';
import { depth1Replies, depth2Replies } from './phase2a1_replies_data.js';
import { getVisualPin } from './phase2a1_visual_pins.js';
import { lifestylePosts, discussionQuestions } from './phase2a1_lifestyle_questions.js';

// Phase 2A.3 & 2A.4 imports
import { phase2a3Communities, phase2a3Personas } from './phase2a3_personas_communities.js';
import { phase2a3VisualPinsDefs, phase2a3DiscussionsDefs } from './phase2a3_posts_data.js';
import { phase2a3RootComments, phase2a3Depth1Replies, phase2a3Depth2Replies } from './phase2a3_comments_data.js';

// Extra 30 tech & lifestyle posts
const extraTechPosts = [
  {
    "title": "Spent 3 hours tracking down a mystery 500 error: turned out to be trailing whitespace in an env var",
    "content": "Yesterday our staging auth service started intermittently rejecting valid session tokens with a cryptic 500 internal error. Checked database indexes, Redis connections, and network routes. Everything looked completely green.\n\nFinally printed the parsed environment variables with quotes:\n`AUTH_SECRET='secret_key '`\n\nSomeone had pasted the secret with an invisible trailing space in the deployment config, which caused HMAC signature verification to fail on rotated nodes. Lesson learned: always `.trim()` your configuration strings at startup!",
    "community_id": "comm_systems",
    "community_slug": "systems",
    "flair": "War Stories",
    "tags": [
      "debugging",
      "devops",
      "node"
    ]
  },
  {
    "title": "My tiny 15W homelab: running Proxmox, Pi-hole, and Docker on two refurbished ThinkCentre mini PCs",
    "content": "Downsized my loud 4U rack server into two Lenovo ThinkCentre M720q tiny PCs (i5-8500T, 32GB RAM each) picked up on eBay for $110 each.\n\nThey idle at a combined 18 watts, produce almost zero noise, and run my entire home network: Pi-hole, Vaultwarden, Paperless-ngx, Home Assistant, and a local Postgres instance for side projects. Sometimes the simplest hardware setup is the most enjoyable.",
    "community_id": "comm_infra",
    "community_slug": "cloud-native",
    "flair": "Homelab",
    "tags": [
      "homelab",
      "selfhosted",
      "hardware"
    ]
  },
  {
    "title": "Replaced a 200-line Redux Toolkit slice with a 25-line custom React hook and our team loves it",
    "content": "Our team had a modal checkout form managed by Redux Toolkit with five action creators, extraReducers, and loading status enums.\n\nRefactored the entire flow into a single `useCheckoutState` hook with a native reducer and URL query parameters for step navigation.\n- Deleted 180 lines of boilerplate.\n- Eliminated state desynchronization on back-button clicks.\n- New devs can understand the flow in 2 minutes.",
    "community_id": "comm_frontend",
    "community_slug": "frontend",
    "flair": "Refactoring",
    "tags": [
      "react",
      "frontend",
      "state"
    ]
  },
  {
    "title": "Why our engineering team moved internal docs from Notion back to plain Markdown in Git",
    "content": "After two years in Notion, our team documentation had turned into an unsearchable sprawl of outdated nested pages and broken database views.\n\nThree months ago, we moved all architectural decision records (ADRs) and service runbooks to a `/docs` folder in each service's repository.\n- Docs are updated in the same pull request as the code change.\n- Git blame shows exactly why an architectural decision was made.\n- Fast offline search with ripgrep.",
    "community_id": "comm_architecture",
    "community_slug": "architecture",
    "flair": "Best Practices",
    "tags": [
      "documentation",
      "git",
      "markdown"
    ]
  },
  {
    "title": "Setting up local HTTPS for development with mkcert: eliminating self-signed cert warnings forever",
    "content": "Tired of clicking through \"Your connection is not private\" warnings in Chrome and Safari when testing Web Crypto APIs and WebAuthn locally?\n\n`mkcert` creates a locally-trusted development certificate authority in your system trust store in 10 seconds:\n```bash\nmkcert -install\nmkcert localhost 127.0.0.1 ::1\n```\nHooked it up to Fastify and Vite HTTPS options. Zero browser security friction ever since.",
    "community_id": "comm_frontend",
    "community_slug": "frontend",
    "flair": "Tooling",
    "tags": [
      "devtools",
      "https",
      "webdev"
    ]
  },
  {
    "title": "Switched from zsh with 12 plugins back to plain bash with a minimal prompt: instant terminal startup",
    "content": "My terminal had gotten noticeably sluggish—every new tab took almost 800ms to open because of git prompt status parsing, nvm hooks, and plugin managers.\n\nStripped my `~/.bashrc` down to 30 lines with a clean single-line prompt showing just directory and git branch. Terminal windows now open in 15ms. Sometimes less really is more.",
    "community_id": "comm_linux",
    "community_slug": "linux-kernel",
    "flair": "Terminal",
    "tags": [
      "bash",
      "terminal",
      "productivity"
    ]
  },
  {
    "title": "Running SQLite in production with Litestream: reflections after 8 months on an internal tools portal",
    "content": "Eight months ago, we built an internal company portal used by 60 teammates daily. Instead of spinning up a managed RDS database, we used SQLite with WAL mode and Litestream continuously replicating WAL frames to an S3 bucket.\n\n- 0 maintenance incidents.\n- Sub-millisecond local query latencies.\n- Backups cost $0.12/month on S3.\n- Restoring from backup takes literally 4 seconds.\nFor small to medium internal applications, SQLite is vastly underutilized.",
    "community_id": "comm_database",
    "community_slug": "database-internals",
    "flair": "Production SQLite",
    "tags": [
      "sqlite",
      "database",
      "architecture"
    ]
  },
  {
    "title": "Benchmarking Rust async runtimes: Tokio vs Smol under millions of concurrent TCP timers",
    "content": "When managing hundreds of thousands of idle keep-alive connections, timer wheel allocations dominate heap memory. We profiled Tokio's hashed hierarchical timer wheel against Smol's intrusive timer queue under synthetic connection churn.",
    "community_id": "comm_systems",
    "community_slug": "systems",
    "flair": "Async Rust",
    "tags": [
      "rust",
      "tokio",
      "concurrency"
    ]
  },
  {
    "title": "Understanding lock-free memory reclamation: Hazard Pointers vs Epoch-Based Reclamation (EBR)",
    "content": "In multi-threaded data structures where readers traverse nodes without latches, when is it safe to free a deleted node? We examine how Epoch-Based Reclamation groups retired pointers into generational bins, contrasting its throughput advantages over Hazard Pointers with its unbounded memory hazard under stalled threads.",
    "community_id": "comm_systems",
    "community_slug": "systems",
    "flair": "Memory Models",
    "tags": [
      "concurrency",
      "memory",
      "algorithms"
    ]
  },
  {
    "title": "Why SIMD vectorization matters for high-throughput vector database cosine distance calculations",
    "content": "Computing cosine similarity across 1536-dimensional OpenAI embeddings in a loop requires 1536 multiply-add operations per candidate vector. Using AVX-512 FMA instructions, we pack 16 float32 operations into a single CPU cycle, achieving a 14x throughput boost over standard scalar loops.",
    "community_id": "comm_ai",
    "community_slug": "ai-systems",
    "flair": "Vector DB",
    "tags": [
      "simd",
      "vectordb",
      "performance"
    ]
  },
  {
    "title": "Speculative decoding in production: pairing a 1B draft model with a 70B target model for 2.4x latency reduction",
    "content": "Because autoregressive generation is memory-bandwidth bound on single tokens, having a tiny 1B parameter draft model guess 4 tokens ahead allows the large 70B model to verify all 4 tokens in a single parallel forward pass. Here are the acceptance rate statistics across coding prompts.",
    "community_id": "comm_ai",
    "community_slug": "ai-systems",
    "flair": "LLM Systems",
    "tags": [
      "llm",
      "inference",
      "optimization"
    ]
  },
  {
    "title": "RoCE v2 vs InfiniBand in 512-GPU training clusters: tuning Priority Flow Control (PFC) deadlocks",
    "content": "Ethernet-based RDMA (RoCE v2) requires lossless transmission. When buffer queues fill during all-reduce gradients, PFC pause frames can create circular wait dependencies across leaf-spine switches, freezing training runs. We outline our DCQCN congestion notification tuning strategy.",
    "community_id": "comm_ai",
    "community_slug": "ai-systems",
    "flair": "Networking",
    "tags": [
      "rdma",
      "gpu",
      "datacenter"
    ]
  },
  {
    "title": "Designing high-throughput LSM-tree bloom filters: Blocked Bloom Filters vs Ribbon Filters",
    "content": "Standard bloom filters incur a CPU cache miss on every probed hash bit. Blocked Bloom filters constrain bit probes to a single 64-byte L1 cache line, doubling lookup speeds at the expense of a microscopic increase in false positive probability.",
    "community_id": "comm_database",
    "community_slug": "database-internals",
    "flair": "Data Structures",
    "tags": [
      "bloomfilter",
      "lsm",
      "algorithms"
    ]
  },
  {
    "title": "Dissecting PostgreSQL MVCC vacuuming: page-level pruning vs aggressive table freeze operations",
    "content": "A deep dive into how PostgreSQL handles tuple overwrites. In-page vacuuming removes dead tuples during ordinary SELECT queries when space is available on the 8KB page, while autovacuum worker processes perform cross-page index cleaning and transaction ID wraparound prevention.",
    "community_id": "comm_database",
    "community_slug": "database-internals",
    "flair": "PostgreSQL",
    "tags": [
      "postgres",
      "mvcc",
      "internals"
    ]
  },
  {
    "title": "Lock contention profiling in high-concurrency Redis clusters: key hash slot redistribution lessons",
    "content": "When a single tenant generates 40,000 requests per second to a single Redis cluster node, CPU core saturation degrades latency for all tenants sharing that cluster shard. We implemented a dynamic key salt prefixing pattern that distributes high-cardinality counters across multiple hash slots.",
    "community_id": "comm_database",
    "community_slug": "database-internals",
    "flair": "Caching",
    "tags": [
      "redis",
      "caching",
      "concurrency"
    ]
  },
  {
    "title": "Linux cgroups v2 memory limits: understanding OOM killer heuristics and page cache reclaim pressure",
    "content": "When a container in Kubernetes exceeds its memory limit, the Linux kernel first attempts to aggressively reclaim inactive file-backed page caches before invoking the Out-Of-Memory (OOM) killer. Here is how monitoring memory.pressure (PSI) gives early warning signals before pods are terminated.",
    "community_id": "comm_linux",
    "community_slug": "linux-kernel",
    "flair": "Kernel & Cgroups",
    "tags": [
      "linux",
      "cgroups",
      "kubernetes"
    ]
  },
  {
    "title": "Building a microkernel IPC mechanism in C: zero-copy message passing via shared virtual memory pages",
    "content": "Traditional microkernels suffer a performance penalty when copying messages between user-space driver processes and the kernel. By implementing a virtual memory remapping mechanism inspired by L4 SeL4, page table entries are flipped atomically, achieving sub-200 nanosecond message passing times.",
    "community_id": "comm_linux",
    "community_slug": "linux-kernel",
    "flair": "OS Design",
    "tags": [
      "microkernel",
      "c",
      "systems"
    ]
  },
  {
    "title": "Tracing network packet drops with eBPF kprobes: pinpointing drops across bridge and iptables chains",
    "content": "When packets mysteriously vanish inside a complex Docker bridge network, debugging with tcpdump only shows that a packet never arrived. By instrumenting the kfree_skb kernel function using an eBPF tracepoint, we capture the exact kernel instruction and reason code for every dropped packet in real time.",
    "community_id": "comm_linux",
    "community_slug": "linux-kernel",
    "flair": "eBPF Tracing",
    "tags": [
      "ebpf",
      "networking",
      "debugging"
    ]
  },
  {
    "title": "Dissecting V8 hidden class transitions: why object shape mutations deoptimize hot JavaScript loops",
    "content": "V8 optimizes property access on JavaScript objects through Inline Caches (ICs) by assigning hidden class shapes. Adding properties dynamically out of order or deleting properties with delete causes transition trees to branch, degrading monomorphic call sites into megamorphic dictionary lookups.",
    "community_id": "comm_frontend",
    "community_slug": "frontend",
    "flair": "JavaScript V8",
    "tags": [
      "v8",
      "javascript",
      "performance"
    ]
  },
  {
    "title": "WebAssembly multi-threading with SharedArrayBuffer and Web Workers: audio DSP processing in the browser",
    "content": "Porting a professional multi-track digital audio workstation to the browser requires processing audio buffers within strict 2.9ms real-time deadlines (at 128-sample buffer sizes). We demonstrate how compiling C++ audio DSP algorithms to WebAssembly with Atomics and SharedArrayBuffer avoids main-thread UI jank.",
    "community_id": "comm_frontend",
    "community_slug": "frontend",
    "flair": "Wasm & Audio",
    "tags": [
      "webassembly",
      "audio",
      "dsp"
    ]
  },
  {
    "title": "Container queries in production design systems: building intrinsically responsive component micro-layouts",
    "content": "Media queries respond to the global browser viewport, which breaks component encapsulation when the same card widget is rendered in a narrow sidebar, a central feed, or a wide dialog modal. With CSS @container, the card responds directly to its parent container width, eliminating brittle breakpoint props.",
    "community_id": "comm_frontend",
    "community_slug": "frontend",
    "flair": "Design Systems",
    "tags": [
      "css",
      "containerqueries",
      "responsive"
    ]
  },
  {
    "title": "Designing high-contrast monochrome design tokens: semantic color layering and WCAG AAA compliance",
    "content": "A truly refined monochrome user interface is not simply greyscale: it relies on subtle luminance differentials across nested surfaces (background, surface-subtle, surface-card, surface-overlay). We explain our lightness curve math that guarantees 7:1 contrast for critical content.",
    "community_id": "comm_design",
    "community_slug": "design",
    "flair": "Design Tokens",
    "tags": [
      "designsystems",
      "tokens",
      "accessibility"
    ]
  },
  {
    "title": "Optical alignment in UI icons: why mathematical centering often looks visually unbalanced to the human eye",
    "content": "When placing a triangular play icon or a bookmark glyph inside a circular badge, centering the SVG bounding box mathematically results in an icon that appears off-center because visual mass is concentrated toward one side. Here are the optical correction offsets we apply in our icon component library.",
    "community_id": "comm_design",
    "community_slug": "design",
    "flair": "Visual Design",
    "tags": [
      "icons",
      "svg",
      "typography"
    ]
  },
  {
    "title": "Procedural terrain generation in WebGL: layering Perlin noise, erosion simulation, and normal maps",
    "content": "Generating believable mountain ranges requires more than basic fractal noise. We demonstrate a pipeline combining fractional Brownian motion (fBm) with a hydraulic particle erosion simulation pass running in a WebGL 2 float texture framebuffer.",
    "community_id": "comm_creative",
    "community_slug": "creative-coding",
    "flair": "Generative Art",
    "tags": [
      "webgl",
      "generative",
      "shaders"
    ]
  },
  {
    "title": "Raymarching volumetric clouds in WebGPU compute shaders: Henyey-Greenstein phase function lighting",
    "content": "Simulating realistic light scattering through dense cloud formations requires evaluating the Henyey-Greenstein phase function for forward and backward scattering towards the sun. We share our temporal accumulation reprojection shader that stabilizes noise across frames.",
    "community_id": "comm_creative",
    "community_slug": "creative-coding",
    "flair": "WebGPU Shaders",
    "tags": [
      "webgpu",
      "volumetric",
      "shaders"
    ]
  },
  {
    "title": "Graceful degradation in cloud microservices: automated circuit breakers with adaptive error rate thresholds",
    "content": "When a downstream recommendation service begins throwing timeouts, calling services should not queue requests indefinitely. Using Netflix Hystrix-style circuit breakers with sliding time windows, our API gateways fail open with cached fallbacks in sub-10ms.",
    "community_id": "comm_infra",
    "community_slug": "cloud-native",
    "flair": "Resilience",
    "tags": [
      "resilience",
      "microservices",
      "sre"
    ]
  },
  {
    "title": "Chaos engineering in staging environments: automated packet corruption and latency injection pipelines",
    "content": "A service that appears reliable under clean network conditions often deadlocks when network packets arrive corrupted or delayed by 250ms. We use Linux tc (traffic control) and netem within automated GitHub Actions test matrices to verify that our gRPC clients reconnect gracefully.",
    "community_id": "comm_infra",
    "community_slug": "cloud-native",
    "flair": "Chaos Engineering",
    "tags": [
      "chaos",
      "testing",
      "networking"
    ]
  },
  {
    "title": "Implementing zero-downtime database schema migrations with expand-and-contract patterns",
    "content": "Renaming a database column or changing a data type in a database processing 10,000 transactions per second without taking an outage. Step 1: Expand by adding the new column. Step 2: Write to both old and new. Step 3: Backfill legacy rows. Step 4: Contract by cutting reads to the new column.",
    "community_id": "comm_architecture",
    "community_slug": "architecture",
    "flair": "Database Migrations",
    "tags": [
      "database",
      "migrations",
      "sql"
    ]
  },
  {
    "title": "Evaluating memory-mapped files (mmap) vs direct pread syscalls for database page cache managers",
    "content": "While mmap() makes reading pages as simple as dereferencing a memory pointer, the database loses control over write-back timing and can suffer uncontrollable thread stalls when page faults trigger page evictions. Why our storage engine migrated to explicit pread with user-space buffer pools.",
    "community_id": "comm_database",
    "community_slug": "database-internals",
    "flair": "I/O Internals",
    "tags": [
      "mmap",
      "storage",
      "linux"
    ]
  },
  {
    "title": "Building an interactive audio synthesizer with Web Audio API AudioWorkletNode and custom DSP",
    "content": "The legacy ScriptProcessorNode ran on the browser main UI thread, resulting in catastrophic audio dropouts whenever the page scrolled. AudioWorkletNode runs in a dedicated high-priority audio rendering thread, delivering glitch-free polyphonic synthesis in pure JavaScript and WebAssembly.",
    "community_id": "comm_creative",
    "community_slug": "creative-coding",
    "flair": "Web Audio",
    "tags": [
      "webaudio",
      "dsp",
      "music"
    ]
  }
];

// Combine baseline discussion items
const allBaselineDiscussions = [
  ...realNewsItems,       // 10 items (indices 0..9)
  ...multiImagePosts,     // 8 items (indices 10..17)
  ...techPosts,           // 20 items (indices 18..37)
  ...extraTechPosts,      // 18 items (indices 38..55)
  ...lifestylePosts,      // 45 items (indices 56..100)
  ...discussionQuestions, // 39 items (indices 101..139)
];

// 45 Revamped Phase 2A.1 Personas (usr_20 to usr_64) with non-face vector avatars & authentic handles
const extraUsers = [
  { id: 'usr_20', username: 'vikram_db', name: 'Vikram Patel', bio: 'databases & sourdough baking. sf', verified: true, avatar: '/avatars/food-sourdough.svg', banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200' },
  { id: 'usr_21', username: 'clara_s', name: 'Clara Schmidt', bio: 'distributed systems & 35mm film. berlin', verified: true, avatar: '/avatars/gear-camera.svg', banner: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200' },
  { id: 'usr_22', username: 'torsten_l', name: 'Torsten Lind', bio: 'gravel cycling & single-origin pour-overs. copenhagen', verified: false, avatar: '/avatars/gear-running.svg', banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200' },
  { id: 'usr_23', username: 'meizhang', name: 'Mei Zhang', bio: 'storage engines, indoor bouldering & hoya plants. shanghai', verified: false, avatar: '/avatars/gear-boulder.svg', banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200' },
  { id: 'usr_24', username: 'devin_v', name: 'Devin Vance', bio: 'ml hardware tinkering & pnw trail running. seattle', verified: true, avatar: '/avatars/code-terminal.svg', banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200' },
  { id: 'usr_25', username: 'zara_m', name: 'Zara Al-Mansoor', bio: 'compiler passes, mechanical keyboards & loose leaf oolong. dubai', verified: true, avatar: '/avatars/gear-keyboard.svg', banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200' },
  { id: 'usr_26', username: 'arjun_r', name: 'Arjun Rao', bio: 'search algorithms, hard sci-fi & acoustic guitar. toronto', verified: false, avatar: '/avatars/books-reading.svg', banner: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200' },
  { id: 'usr_27', username: 'selena_g', name: 'Selena Gomez-Cruz', bio: 'open source dev & pixel art experiments. austin', verified: false, avatar: '/avatars/pixel-potion.svg', banner: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200' },
  { id: 'usr_28', username: 'nathan_d', name: 'Nathan Drake', bio: 'hardware security, shiba inu walks & espresso. boston', verified: true, avatar: '/avatars/mascot-shiba.svg', banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200' },
  { id: 'usr_29', username: 'trashypanda', name: 'Samir Roy', bio: 'snack connoisseur, late-night keyboard warrior, raccoon enthusiast. austin', verified: true, avatar: '/avatars/mascot-raccoon.svg', banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200' },
  { id: 'usr_30', username: 'klaus_w', name: 'Klaus Weber', bio: 'vintage analog synths, eurorack patches & sound design. munich', verified: false, avatar: '/avatars/gear-synth.svg', banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200' },
  { id: 'usr_31', username: 'mika_mp4', name: 'Mikaela Cruz', bio: 'short videos, analog tape artifacts, bedroom synth loops. manila', verified: false, avatar: '/avatars/gear-headphones.svg', banner: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200' },
  { id: 'usr_32', username: 'slowshutter', name: 'Omar Farooq', bio: '35mm black & white film, darkroom prints, long exposures. london', verified: true, avatar: '/avatars/gear-camera.svg', banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200' },
  { id: 'usr_33', username: 'brigitte_m', name: 'Brigitte Moreau', bio: 'sre, community gardening & urban trails. montreal', verified: true, avatar: '/avatars/nature-monstera.svg', banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200' },
  { id: 'usr_34', username: 'dmitri_s', name: 'Dmitri Sokolov', bio: 'go & rust systems, cascade mountain hikes. vancouver', verified: false, avatar: '/avatars/nature-mountain.svg', banner: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200' },
  { id: 'usr_35', username: 'tessa_vd', name: 'Tessa van Dijk', bio: 'distributed consensus & beginner wheel-thrown ceramics. amsterdam', verified: true, avatar: '/avatars/art-palette.svg', banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200' },
  { id: 'usr_36', username: 'gabriel_c', name: 'Gabriel Costa', bio: 'web audio, dsp & wasm in lisbon. surfing when the swell is up', verified: true, avatar: '/avatars/gear-headphones.svg', banner: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200' },
  { id: 'usr_37', username: 'ramenrespawn', name: 'Yuki Takahashi', bio: 'hunting the best tonkotsu in tokyo. fighting game locals on fridays', verified: false, avatar: '/avatars/food-ramen.svg', banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200' },
  { id: 'usr_38', username: 'anika_r', name: 'Anika Roy', bio: 'design systems & css layout tricks. watercolor painter in bangalore', verified: true, avatar: '/avatars/art-palette.svg', banner: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200' },
  { id: 'usr_39', username: 'callum_m', name: 'Callum MacLeod', bio: 'jit compilers, v8 bytecode & manual lever espresso. edinburgh', verified: false, avatar: '/avatars/food-coffee.svg', banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200' },
  { id: 'usr_40', username: 'simon_g', name: 'Simon Gauthier', bio: 'generative art, glsl shaders & pen plotters. montreal', verified: true, avatar: '/avatars/abstract-bauhaus.svg', banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200' },
  { id: 'usr_41', username: 'vinylstatic', name: 'Nadia Benali', bio: 'crate digging in montreal, funk 45s & dusty jazz records', verified: false, avatar: '/avatars/gear-vinyl.svg', banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200' },
  { id: 'usr_42', username: 'orion_v', name: 'Orion Vance', bio: 'real-time graphics, cyberpunk scifi & late-night code', verified: false, avatar: '/avatars/abstract-cyber.svg', banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200' },
  { id: 'usr_43', username: 'freja_n', name: 'Freja Nielsen', bio: 'webgpu compute shaders & generative line art. copenhagen', verified: true, avatar: '/avatars/abstract-bauhaus.svg', banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200' },
  { id: 'usr_44', username: 'mateo_m', name: 'Mateo Morales', bio: 'brutalist architecture & architectural shadows. cdmx', verified: true, avatar: '/avatars/gear-camera.svg', banner: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200' },
  { id: 'usr_45', username: 'ingrid_b', name: 'Ingrid Bergman', bio: 'monochrome film photography & nordic architecture. stockholm', verified: true, avatar: '/avatars/nature-mountain.svg', banner: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200' },
  { id: 'usr_46', username: 'samir_k', name: 'Samir Kassam', bio: 'urban street photography & road cycling. london', verified: false, avatar: '/avatars/gear-camera.svg', banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200' },
  { id: 'usr_47', username: 'zoe_l', name: 'Zoe Laurent', bio: 'architecture student & miniature bonsai cultivator. montreal', verified: false, avatar: '/avatars/nature-bonsai.svg', banner: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200' },
  { id: 'usr_48', username: 'hassan_h', name: 'Hassan Al-Husseini', bio: 'embedded linux & vintage tube amplifier restoration. beirut', verified: true, avatar: '/avatars/code-terminal.svg', banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200' },
  { id: 'usr_49', username: 'olga_v', name: 'Olga Voronova', bio: 'bpf kernel tracing & outdoor bouldering. helsinki', verified: true, avatar: '/avatars/gear-boulder.svg', banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200' },
  { id: 'usr_50', username: 'piotr_w', name: 'Piotr Wisniewski', bio: 'fpga hacking & custom split keyboards. krakow', verified: false, avatar: '/avatars/gear-keyboard.svg', banner: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200' },
  { id: 'usr_51', username: 'brenda_oc', name: 'Brenda O’Connor', bio: 'pcb design, microcontrollers & adopted tabby cats. dublin', verified: false, avatar: '/avatars/mascot-cat.svg', banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200' },
  { id: 'usr_52', username: 'linus_h', name: 'Linus Hallberg', bio: 'vintage workstation preservation & unix history. gothenburg', verified: false, avatar: '/avatars/pixel-gameboy.svg', banner: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200' },
  { id: 'usr_53', username: 'botanical_kai', name: 'Kai Lindqvist', bio: 'urban jungle apartment, rare hoyas & monsteras, plant propagation. oslo', verified: true, avatar: '/avatars/nature-monstera.svg', banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200' },
  { id: 'usr_54', username: 'diego_r', name: 'Diego Ramirez', bio: 'demoscene retro graphics & tracker music. santiago', verified: false, avatar: '/avatars/pixel-ghost.svg', banner: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200' },
  { id: 'usr_55', username: 'valerie_d', name: 'Valerie Dupuis', bio: 'vintage computing archive curator & speculative fiction. lyon', verified: false, avatar: '/avatars/books-reading.svg', banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200' },
  { id: 'usr_56', username: 'route_scout', name: 'Thierry Laurent', bio: 'bikepacking across the ardennes, gravel tires & campfire coffee. brussels', verified: true, avatar: '/avatars/gear-running.svg', banner: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200' },
  { id: 'usr_57', username: 'sujin_p', name: 'Sujin Park', bio: 'formal systems verification, sketchbook journaling & matcha. seoul', verified: true, avatar: '/avatars/food-matcha.svg', banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200' },
  { id: 'usr_58', username: 'ronan_ob', name: 'Ronan O’Brien', bio: 'open source software, traditional fiddle music & coastal hikes. galway', verified: false, avatar: '/avatars/gear-headphones.svg', banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200' },
  { id: 'usr_59', username: 'fatima_z', name: 'Fatima Zahra', bio: 'distributed systems, marathon running & mint tea. casablanca', verified: true, avatar: '/avatars/gear-running.svg', banner: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200' },
  { id: 'usr_60', username: 'axel_n', name: 'Axel Nordstrom', bio: 'server hardware, mid-century woodworking & cross-country skiing. oslo', verified: false, avatar: '/avatars/nature-mountain.svg', banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200' },
  { id: 'usr_61', username: 'linnea_e', name: 'Linnea Ekstrom', bio: 'risograph printing, bookbinding & typography. stockholm', verified: false, avatar: '/avatars/art-palette.svg', banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200' },
  { id: 'usr_62', username: 'dante_r', name: 'Dante Rossi', bio: 'operating systems lecturer & moka pot coffee obsessive. milan', verified: false, avatar: '/avatars/food-coffee.svg', banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200' },
  { id: 'usr_63', username: 'chiara_e', name: 'Chiara Esposito', bio: 'architectural history & sunny terrace reading. rome', verified: true, avatar: '/avatars/nature-mountain.svg', banner: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200' },
  { id: 'usr_64', username: 'sergei_m', name: 'Sergei Morozov', bio: 'homelab networking, sdr radio & electronics repair. prague', verified: false, avatar: '/avatars/gear-synth.svg', banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200' },
];

// Baseline users usr_0 to usr_19 for domain mapping and authoring
const baselineUsers = [
  { id: 'usr_0', username: 'alex_dev', name: 'Alex Rivera' },
  { id: 'usr_1', username: 'lucas_t', name: 'Lucas Thorne' },
  { id: 'usr_2', username: 'elena_arch', name: 'Elena Rostova' },
  { id: 'usr_3', username: 'alec_m', name: 'Alec Mercer' },
  { id: 'usr_4', username: 'sara_code', name: 'Sara Chen' },
  { id: 'usr_5', username: 'kenji_sys', name: 'Kenji Sato' },
  { id: 'usr_6', username: 'maya_pixel', name: 'Maya Lin' },
  { id: 'usr_7', username: 'david_retro', name: 'David Okafor' },
  { id: 'usr_8', username: 'chloe_lens', name: 'Chloe Desjardins' },
  { id: 'usr_9', username: 'tariq_arch', name: 'Tariq Mansoor' },
  { id: 'usr_10', username: 'priya_ui', name: 'Priya Sharma' },
  { id: 'usr_11', username: 'nullcat_404', name: 'Devin Bell' },
  { id: 'usr_12', username: 'aoi_manga', name: 'Aoi Tanaka' },
  { id: 'usr_13', username: 'marcus_v', name: 'Marcus Vance' },
  { id: 'usr_14', username: 'chai.exe', name: 'Chirag Mehta' },
  { id: 'usr_15', username: 'civicafterdark', name: 'Leo Santos' },
  { id: 'usr_16', username: 'nina_cam', name: 'Nina Kowalski' },
  { id: 'usr_17', username: 'pixelmoth', name: 'Faye Zhao' },
  { id: 'usr_18', username: 'hana_dev', name: 'Hana Park' },
  { id: 'usr_19', username: 'fourthquarter', name: 'Darius Hall' },
];

// Combine all 90 expanded personas (usr_20 to usr_109)
const allExpandedUsers = [...extraUsers, ...phase2a3Personas];
const allPlatformUsers = [...baselineUsers, ...allExpandedUsers];
const userById = new Map(allPlatformUsers.map(u => [u.id, u]));

// Base 5 expanded communities
const baseExtraCommunities = [
  {
    id: 'comm_database',
    name: 'Database Internals',
    slug: 'database-internals',
    description: 'B-tree indexing, LSM compaction heuristics, write-ahead logging, and ACID concurrency control.',
    avatar_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=200',
    rules: [
      { id: 'r1', title: 'Include storage media', description: 'Specify NVMe, SSD, or memory-backed storage assumptions.' },
      { id: 'r2', title: 'Benchmark conditions', description: 'Cite page sizes, cache hit ratios, and write amplification.' },
    ],
  },
  {
    id: 'comm_linux',
    name: 'Linux Kernel & Systems',
    slug: 'linux-kernel',
    description: 'eBPF tracing, io_uring asynchronous I/O, device drivers, and low-latency scheduling.',
    avatar_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200',
    rules: [
      { id: 'r1', title: 'Kernel version', description: 'State target kernel versions and hardware architecture.' },
      { id: 'r2', title: 'Safe kernel code', description: 'Zero undefined behavior or unverified BPF programs.' },
    ],
  },
  {
    id: 'comm_creative',
    name: 'Creative Coding & Shaders',
    slug: 'creative-coding',
    description: 'WebGL, WebGPU compute shaders, generative geometry, procedural art, and GLSL visual explorations.',
    avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200',
    rules: [
      { id: 'r1', title: 'Share shader code', description: 'Include fragment/compute shader source or Shadertoy links.' },
      { id: 'r2', title: 'Respect performance', description: 'State target framerates and GPU power consumption.' },
    ],
  },
  {
    id: 'comm_infra',
    name: 'Cloud Native & SRE',
    slug: 'cloud-native',
    description: 'Site reliability engineering, Kubernetes operators, distributed telemetry, and zero-downtime deployments.',
    avatar_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=200',
    rules: [
      { id: 'r1', title: 'Blameless retrospectives', description: 'Focus on systemic improvements and telemetry signals.' },
    ],
  },
  {
    id: 'comm_ai',
    name: 'Machine Learning Systems',
    slug: 'ai-systems',
    description: 'High-throughput model serving, GPU cluster networking, quantization, and vector indexing at scale.',
    avatar_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=200',
    rules: [
      { id: 'r1', title: 'Hardware specifications', description: 'Specify accelerator architecture, batch size, and precision.' },
    ],
  },
];

// Combine all 13 expanded communities (total: 5 baseline + 13 expanded = 18 communities)
const allExpandedCommunities = [...baseExtraCommunities, ...phase2a3Communities];

// Persona groups for domain-aware authoring encompassing all users usr_5 to usr_109
const photographers = ['usr_2', 'usr_8', 'usr_16', 'usr_32', 'usr_44', 'usr_45', 'usr_46', 'usr_63', 'usr_85', 'usr_86', 'usr_89'].map(id => userById.get(id)).filter(Boolean);
const creativeCoders = ['usr_6', 'usr_17', 'usr_31', 'usr_36', 'usr_40', 'usr_42', 'usr_43', 'usr_54', 'usr_55'].map(id => userById.get(id)).filter(Boolean);
const designers = ['usr_4', 'usr_10', 'usr_27', 'usr_38', 'usr_61', 'usr_87', 'usr_88'].map(id => userById.get(id)).filter(Boolean);
const hardwareEngineers = ['usr_3', 'usr_7', 'usr_11', 'usr_48', 'usr_50', 'usr_51', 'usr_52', 'usr_64', 'usr_108'].map(id => userById.get(id)).filter(Boolean);
const dbEngineers = ['usr_9', 'usr_20', 'usr_23', 'usr_57'].map(id => userById.get(id)).filter(Boolean);
const systemsEngineers = ['usr_1', 'usr_5', 'usr_18', 'usr_21', 'usr_22', 'usr_24', 'usr_25', 'usr_28', 'usr_33', 'usr_34', 'usr_35', 'usr_59', 'usr_60', 'usr_62'].map(id => userById.get(id)).filter(Boolean);

const gamers = ['usr_17', 'usr_29', 'usr_37', 'usr_65', 'usr_66', 'usr_67', 'usr_68', 'usr_69'].map(id => userById.get(id)).filter(Boolean);
const animeArtists = ['usr_12', 'usr_70', 'usr_71', 'usr_72', 'usr_73', 'usr_74'].map(id => userById.get(id)).filter(Boolean);
const carEnthusiasts = ['usr_15', 'usr_75', 'usr_76', 'usr_77', 'usr_78', 'usr_79'].map(id => userById.get(id)).filter(Boolean);
const athletes = ['usr_19', 'usr_22', 'usr_23', 'usr_49', 'usr_56', 'usr_59', 'usr_80', 'usr_81', 'usr_82', 'usr_83', 'usr_84', 'usr_109'].map(id => userById.get(id)).filter(Boolean);
const students = ['usr_14', 'usr_47', 'usr_90', 'usr_91', 'usr_92', 'usr_93', 'usr_94'].map(id => userById.get(id)).filter(Boolean);
const foodLovers = ['usr_20', 'usr_39', 'usr_53', 'usr_95', 'usr_96', 'usr_97', 'usr_98', 'usr_99', 'usr_100', 'usr_101'].map(id => userById.get(id)).filter(Boolean);
const readersMusicians = ['usr_1', 'usr_13', 'usr_26', 'usr_30', 'usr_41', 'usr_58', 'usr_102', 'usr_103', 'usr_104', 'usr_105', 'usr_106', 'usr_107'].map(id => userById.get(id)).filter(Boolean);

// Signature overrides for discussions by index (Phase 2A.1/2A.2)
const signatureDiscussionAuthors = {
  10: userById.get('usr_25'), // 65% keyboard -> zara_m
  11: userById.get('usr_64'), // 12U rack -> sergei_m
  12: userById.get('usr_24'), // Adirondack backpacking -> devin_v
  13: userById.get('usr_60'), // Minimalist desk -> axel_n
  14: userById.get('usr_45'), // Barbican walk -> ingrid_b
  15: userById.get('usr_96'), // Sourdough -> sourdough_sid
  16: userById.get('usr_52'), // SGI Indy -> linus_h
  17: userById.get('usr_39'), // Gaggia PID -> callum_m
  38: userById.get('usr_11'), // Homelab -> nullcat_404
  40: userById.get('usr_14'), // Local https / student dev -> chai.exe
  41: userById.get('usr_15'), // Car tuning -> civicafterdark
  42: userById.get('usr_17'), // Pixel cart -> pixelmoth
  43: userById.get('usr_19'), // Pickup basketball -> fourthquarter
  68: userById.get('usr_33'), // First snow Montreal -> brigitte_m
  69: userById.get('usr_51'), // Rescue cat Jasper -> brenda_oc
  70: userById.get('usr_33'), // Trail run Mount Royal -> brigitte_m
  71: userById.get('usr_26'), // Learning guitar -> arjun_r
  72: userById.get('usr_37'), // Homemade ramen -> ramenrespawn
  73: userById.get('usr_53'), // Balcony garden / plants -> botanical_kai
  74: userById.get('usr_62'), // Study session library -> dante_r
  75: userById.get('usr_45'), // Olympus OM-1 -> ingrid_b
  76: userById.get('usr_58'), // Software engineering internship -> ronan_ob
  77: userById.get('usr_26'), // Sci-fi books -> arjun_r
  78: userById.get('usr_21'), // Ethiopian coffee -> clara_s
  79: userById.get('usr_32'), // Evening walks -> slowshutter
  80: userById.get('usr_56'), // Ultralight bikepacking -> route_scout
  81: userById.get('usr_60'), // Mid-century oak desk -> axel_n
  82: userById.get('usr_46'), // Golden hour canals -> samir_k
  83: userById.get('usr_50'), // Split ortholinear keyboard -> piotr_w
  90: userById.get('usr_61'), // Cyanotype sun printing -> linnea_e
  93: userById.get('usr_96'), // Sourdough focaccia -> sourdough_sid
  95: userById.get('usr_25'), // Gongfu tea session -> zara_m
  98: userById.get('usr_41'), // Steve Reich vinyl -> vinylstatic
  101: userById.get('usr_50'), // QMK rotary macropad -> piotr_w
  102: userById.get('usr_57'), // Fountain pen notes -> sujin_p
  104: userById.get('usr_60'), // Walnut monitor stand -> axel_n
  110: userById.get('usr_40'), // AxiDraw pen plotter -> simon_g
  57: userById.get('usr_36'), // Wasm audio DSP -> gabriel_c
  62: userById.get('usr_43'), // WebGPU raymarching clouds -> freja_n
  67: userById.get('usr_31'), // Audio synthesizer -> mika.mp4
};

function getBaselineDiscussionAuthor(i, disc) {
  if (signatureDiscussionAuthors[i]) {
    return signatureDiscussionAuthors[i];
  }
  const comm = disc.community_slug;
  if (comm === 'database-internals') return dbEngineers[i % dbEngineers.length];
  if (comm === 'creative-coding') return creativeCoders[i % creativeCoders.length];
  if (comm === 'photography') return photographers[i % photographers.length];
  if (comm === 'architecture') return systemsEngineers[i % systemsEngineers.length];
  if (comm === 'design') return designers[i % designers.length];
  if (comm === 'linux-kernel') return hardwareEngineers[i % hardwareEngineers.length];
  if (comm === 'frontend') return designers[i % designers.length];
  if (comm === 'cloud-native') return hardwareEngineers[i % hardwareEngineers.length];
  return systemsEngineers[i % systemsEngineers.length];
}

function getPhase2A3DiscussionAuthor(i, disc) {
  // Direct topic-to-persona matching
  const title = (disc.title || '').toLowerCase();
  if (title.includes('western ghats') || title.includes('himalayan')) return userById.get('usr_76'); // revmatch_raj
  if (title.includes('kabocha') || title.includes('cast iron')) return userById.get('usr_97'); // plantdad_percy
  if (title.includes('porsche') || title.includes('brake rotors')) return userById.get('usr_75'); // trackday_dan
  if (title.includes('civic') || title.includes('touge')) return userById.get('usr_15'); // civicafterdark
  if (title.includes('steely dan') || title.includes('vinyl')) return userById.get('usr_102'); // vinyl_vibes_ian
  if (title.includes('sourdough')) return userById.get('usr_96'); // sourdough_sid
  if (title.includes('ramen')) return userById.get('usr_37'); // ramenrespawn
  if (title.includes('pico-8') || title.includes('pixel')) return userById.get('usr_17'); // pixelmoth
  if (title.includes('chai')) return userById.get('usr_14'); // chai.exe
  if (title.includes('thinkpad') || title.includes('homelab')) return userById.get('usr_11'); // nullcat_404
  if (title.includes('basketball') || title.includes('sneaker')) return userById.get('usr_19'); // fourthquarter

  const comm = disc.community_slug;
  if (comm === 'gaming-esports') return gamers[i % gamers.length];
  if (comm === 'anime-manga') return animeArtists[i % animeArtists.length];
  if (comm === 'cars-motorsport') return carEnthusiasts[i % carEnthusiasts.length];
  if (comm === 'sports-fitness') return athletes[i % athletes.length];
  if (comm === 'campus-life') return students[i % students.length];
  if (comm === 'food-cooking') return foodLovers[i % foodLovers.length];
  if (comm === 'books-reading') return readersMusicians[i % readersMusicians.length];
  if (comm === 'music-production') return readersMusicians[i % readersMusicians.length];
  if (comm === 'frontend' || comm === 'design') return designers[i % designers.length];
  if (comm === 'linux-kernel' || comm === 'cloud-native') return hardwareEngineers[i % hardwareEngineers.length];
  if (comm === 'database-internals') return dbEngineers[i % dbEngineers.length];
  if (comm === 'creative-coding') return creativeCoders[i % creativeCoders.length];
  return allPlatformUsers[(i * 3 + 17) % allPlatformUsers.length];
}

function getPhase2A3VisualPinAuthor(i, pin) {
  const comm = pin.slug;
  if (comm === 'gaming-esports') return gamers[i % gamers.length];
  if (comm === 'anime-manga') return animeArtists[i % animeArtists.length];
  if (comm === 'cars-motorsport') return carEnthusiasts[i % carEnthusiasts.length];
  if (comm === 'sports-fitness') return athletes[i % athletes.length];
  if (comm === 'music-production') return readersMusicians[i % readersMusicians.length];
  if (comm === 'campus-life') return students[i % students.length];
  if (comm === 'food-cooking') return foodLovers[i % foodLovers.length];
  if (comm === 'books-reading') return readersMusicians[i % readersMusicians.length];
  return photographers[i % photographers.length];
}

console.log('Assembling 484 expanded posts...');
const expandedPosts = [];
let postIdx = 201;

// 1. Generate 84 Baseline Visual Pins (post_201 to post_284)
for (let i = 0; i < 84; i++) {
  const pin = getVisualPin(i);
  const comm = pin.community_slug;
  let authorUser = photographers[i % photographers.length];
  if (comm === 'creative-coding') authorUser = creativeCoders[i % creativeCoders.length];
  else if (comm === 'design') authorUser = designers[i % designers.length];
  else if (comm === 'systems') authorUser = systemsEngineers[i % systemsEngineers.length];

  const daysAgo = (i * 7) % 28 + 1;
  const hour = (i * 5) % 24;
  const min = (i * 13) % 60;
  const createdDate = new Date('2026-10-24T12:00:00.000Z');
  createdDate.setUTCDate(createdDate.getUTCDate() - daysAgo);
  createdDate.setUTCHours(hour, min, 0, 0);

  const postId = `post_${postIdx++}`;
  expandedPosts.push({
    _id: postId,
    post_type: 'visual',
    author_id: authorUser.id,
    title: pin.title,
    caption: pin.caption,
    community_id: pin.community_id,
    community_slug: pin.community_slug,
    media: {
      id: `media_${postIdx}`,
      ...pin.media,
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

// 2. Generate 140 Baseline Discussion Posts (post_285 to post_424)
for (let i = 0; i < 140; i++) {
  const disc = allBaselineDiscussions[i];
  const authorUser = getBaselineDiscussionAuthor(i, disc);
  const daysAgo = (i * 5) % 28 + 1;
  const hour = (i * 7) % 24;
  const min = (i * 17) % 60;
  const createdDate = new Date('2026-10-24T12:00:00.000Z');
  createdDate.setUTCDate(createdDate.getUTCDate() - daysAgo);
  createdDate.setUTCHours(hour, min, 0, 0);

  const postId = `post_${postIdx++}`;
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

  if (disc.destination_url) {
    postObj.destination_url = disc.destination_url;
  }
  if (disc.media_attachments) {
    postObj.media_attachments = disc.media_attachments;
  }
  if (disc.photoKeys && disc.photoKeys.length > 0) {
    postObj.media = disc.photoKeys.map((k, mIdx) => ({
      id: `media_${postIdx}_${mIdx}`,
      url: `https://images.unsplash.com/${k.id}?w=1200&auto=format&fit=crop&q=80`,
      aspect_ratio: k.ratio || 1.33,
      width: k.width || 1200,
      height: k.height || Math.round(1200 / (k.ratio || 1.33)),
      alt_text: k.alt,
    }));
  }

  expandedPosts.push(postObj);
}

// 3. Generate 56 Phase 2A.3 Visual Pins (post_425 to post_480)
for (let i = 0; i < phase2a3VisualPinsDefs.length; i++) {
  const pin = phase2a3VisualPinsDefs[i];
  const authorUser = getPhase2A3VisualPinAuthor(i, pin);
  const daysAgo = (i * 3) % 21 + 1;
  const hour = (i * 11) % 24;
  const min = (i * 19) % 60;
  const createdDate = new Date('2026-10-25T00:00:00.000Z');
  createdDate.setUTCDate(createdDate.getUTCDate() - daysAgo);
  createdDate.setUTCHours(hour, min, 0, 0);

  const postId = `post_${postIdx++}`;
  expandedPosts.push({
    _id: postId,
    post_type: 'visual',
    author_id: authorUser.id,
    title: pin.title,
    caption: pin.caption,
    community_id: pin.comm_id,
    community_slug: pin.slug,
    media: {
      id: `media_${postIdx}`,
      url: `https://images.unsplash.com/${pin.photo.id}?w=1200&auto=format&fit=crop&q=80`,
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

  const postId = `post_${postIdx++}`;
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
      id: `media_${postIdx}_${mIdx}`,
      url: `https://images.unsplash.com/${k.id}?w=1200&auto=format&fit=crop&q=80`,
      aspect_ratio: k.ratio || 1.33,
      width: k.width || 1200,
      height: k.height || Math.round(1200 / (k.ratio || 1.33)),
      alt_text: k.alt,
    }));
  }

  expandedPosts.push(postObj);
}

console.log(`Generated ${expandedPosts.length} posts (from ${expandedPosts[0]._id} to ${expandedPosts[expandedPosts.length - 1]._id})`);

// 5. Assemble Realistic Comments (cmt_011 to cmt_300)
console.log('Assembling 290 expanded comments...');
const expandedComments = [];
let commentIdx = 11;

// Candidate comment authors drawn from active platform personas
const commentAuthors = allPlatformUsers.filter(u => u.id !== 'usr_0');

// 5a. 35 Phase 2A.1 Root Comments
const baselineRootList = [];
for (let i = 0; i < contextualRootComments.length; i++) {
  const cDef = contextualRootComments[i];
  const targetPost = expandedPosts[84 + (cDef.targetIndex !== undefined ? cDef.targetIndex : (cDef.targetPostIndex || 0))];
  const author = commentAuthors[(i * 3 + 5) % commentAuthors.length];
  const cmtId = `cmt_${String(commentIdx++).padStart(3, '0')}`;
  const cDate = new Date(targetPost.created_at.getTime() + 1000 * 60 * (15 + (i % 45)));

  const cmt = {
    _id: cmtId,
    post_id: targetPost._id,
    parent_id: null,
    author_id: author.id,
    content: cDef.content,
    score: (i % 5) + 1,
    depth: 0,
    created_at: cDate,
    updated_at: cDate,
  };
  baselineRootList.push(cmt);
  expandedComments.push(cmt);
}

// 5b. 35 Phase 2A.1 Depth-1 Replies
const baselineDepth1List = [];
for (let i = 0; i < depth1Replies.length; i++) {
  const repDef = depth1Replies[i];
  const parent = baselineRootList[repDef.parentIdx % baselineRootList.length];
  const author = commentAuthors[(i * 7 + 11) % commentAuthors.length];
  const cmtId = `cmt_${String(commentIdx++).padStart(3, '0')}`;
  const cDate = new Date(parent.created_at.getTime() + 1000 * 60 * (10 + (i % 30)));

  const cmt = {
    _id: cmtId,
    post_id: parent.post_id,
    parent_id: parent._id,
    author_id: author.id,
    content: repDef.content,
    score: (i % 4) + 1,
    depth: 1,
    created_at: cDate,
    updated_at: cDate,
  };
  baselineDepth1List.push(cmt);
  expandedComments.push(cmt);
}

// 5c. 30 Phase 2A.1 Depth-2 Replies
for (let i = 0; i < depth2Replies.length; i++) {
  const rep2Def = depth2Replies[i];
  const parent = baselineDepth1List[rep2Def.parentIdx % baselineDepth1List.length];
  const author = commentAuthors[(i * 11 + 17) % commentAuthors.length];
  const cmtId = `cmt_${String(commentIdx++).padStart(3, '0')}`;
  const cDate = new Date(parent.created_at.getTime() + 1000 * 60 * (8 + (i % 25)));

  const cmt = {
    _id: cmtId,
    post_id: parent.post_id,
    parent_id: parent._id,
    author_id: author.id,
    content: rep2Def.content,
    score: (i % 3) + 1,
    depth: 2,
    created_at: cDate,
    updated_at: cDate,
  };
  expandedComments.push(cmt);
}

// 5d. 80 Phase 2A.3 Root Comments
const phase2a3RootList = [];
for (let i = 0; i < phase2a3RootComments.length; i++) {
  const cDef = phase2a3RootComments[i];
  const targetPost = expandedPosts[280 + (cDef.targetIndex !== undefined ? cDef.targetIndex : (cDef.targetPostIndex || 0))];
  const author = commentAuthors[(i * 5 + 13) % commentAuthors.length];
  const cmtId = `cmt_${String(commentIdx++).padStart(3, '0')}`;
  const cDate = new Date(targetPost.created_at.getTime() + 1000 * 60 * (12 + (i % 40)));

  const cmt = {
    _id: cmtId,
    post_id: targetPost._id,
    parent_id: null,
    author_id: author.id,
    content: cDef.content,
    score: (i % 5) + 1,
    depth: 0,
    created_at: cDate,
    updated_at: cDate,
  };
  phase2a3RootList.push(cmt);
  expandedComments.push(cmt);
}

// 5e. 55 Phase 2A.3 Depth-1 Replies
const phase2a3Depth1List = [];
for (let i = 0; i < phase2a3Depth1Replies.length; i++) {
  const repDef = phase2a3Depth1Replies[i];
  const parent = phase2a3RootList[repDef.parentIdx % phase2a3RootList.length];
  const author = commentAuthors[(i * 7 + 19) % commentAuthors.length];
  const cmtId = `cmt_${String(commentIdx++).padStart(3, '0')}`;
  const cDate = new Date(parent.created_at.getTime() + 1000 * 60 * (5 + (i % 15)));

  const cmt = {
    _id: cmtId,
    post_id: parent.post_id,
    parent_id: parent._id,
    author_id: author.id,
    content: repDef.content,
    score: (i % 4) + 1,
    depth: 1,
    created_at: cDate,
    updated_at: cDate,
  };
  phase2a3Depth1List.push(cmt);
  expandedComments.push(cmt);
}

// 5f. 25 Phase 2A.3 Depth-2 Replies
for (let i = 0; i < phase2a3Depth2Replies.length; i++) {
  const rep2Def = phase2a3Depth2Replies[i];
  const parent = phase2a3Depth1List[rep2Def.parentIdx % phase2a3Depth1List.length];
  const author = commentAuthors[(i * 13 + 23) % commentAuthors.length];
  const cmtId = `cmt_${String(commentIdx++).padStart(3, '0')}`;
  const cDate = new Date(parent.created_at.getTime() + 1000 * 60 * (4 + (i % 12)));

  const cmt = {
    _id: cmtId,
    post_id: parent.post_id,
    parent_id: parent._id,
    author_id: author.id,
    content: rep2Def.content,
    score: (i % 3) + 1,
    depth: 2,
    created_at: cDate,
    updated_at: cDate,
  };
  expandedComments.push(cmt);
}

console.log(`Assembled ${expandedComments.length} comments (from ${expandedComments[0]._id} to ${expandedComments[expandedComments.length - 1]._id})`);

// 6. Assemble Follows (preserving all test invariants!)
console.log('Assembling follows with strict invariants...');
const expandedFollows = [];
const followPairs = new Set();

// Add core seed follows to set to prevent duplicate keys
[
  'usr_0_usr_1', 'usr_0_usr_2', 'usr_0_usr_3',
  'usr_1_usr_0', 'usr_1_usr_2', 'usr_1_usr_5', 'usr_1_usr_11',
  'usr_2_usr_4', 'usr_2_usr_8', 'usr_2_usr_16',
  'usr_3_usr_11',
  'usr_4_usr_6', 'usr_4_usr_10',
  'usr_5_usr_1', 'usr_5_usr_7', 'usr_5_usr_17',
  'usr_6_usr_12',
  'usr_7_usr_9', 'usr_7_usr_10',
  'usr_8_usr_2',
  'usr_9_usr_13',
  'usr_10_usr_18',
  'usr_12_usr_14',
  'usr_18_usr_14',
].forEach(p => followPairs.add(p));

const hubUsers = [
  'usr_5', 'usr_6', 'usr_9', 'usr_20', 'usr_24', 'usr_28', 'usr_32',
  'usr_40', 'usr_44', 'usr_48', 'usr_65', 'usr_70', 'usr_75', 'usr_80',
  'usr_85', 'usr_90', 'usr_95', 'usr_102'
];

const allCandidateUsers = [];
for (let i = 5; i <= 109; i++) {
  allCandidateUsers.push(`usr_${i}`);
}

allCandidateUsers.forEach((user, idx) => {
  // Everyone follows 2 to 4 hubs
  const numHubs = 2 + (idx % 3);
  for (let h = 0; h < numHubs; h++) {
    const hub = hubUsers[(idx + h) % hubUsers.length];
    if (user !== hub) {
      const pair = `${user}_${hub}`;
      if (!followPairs.has(pair)) {
        followPairs.add(pair);
        expandedFollows.push({
          _id: `flw_${user}_${hub}`,
          follower_id: user,
          target_user_id: hub,
          created_at: new Date('2026-02-15T00:00:00.000Z'),
        });
      }
    }
  }

  // Everyone follows 1 to 2 peer neighbors
  const peer1 = allCandidateUsers[(idx + 1) % allCandidateUsers.length];
  if (user !== peer1) {
    const pair = `${user}_${peer1}`;
    if (!followPairs.has(pair)) {
      followPairs.add(pair);
      expandedFollows.push({
        _id: `flw_${user}_${peer1}`,
        follower_id: user,
        target_user_id: peer1,
        created_at: new Date('2026-02-16T00:00:00.000Z'),
      });
    }
  }
});

console.log(`Generated ${expandedFollows.length} expanded follows (total: ${24 + expandedFollows.length})`);

// 7. Assemble Memberships across all 18 communities
console.log('Assembling memberships...');
const expandedMemberships = [];
const membershipPairs = new Set();

[
  'usr_0_comm_systems', 'usr_1_comm_systems', 'usr_6_comm_systems', 'usr_5_comm_systems', 'usr_7_comm_systems', 'usr_11_comm_systems',
  'usr_0_comm_architecture', 'usr_1_comm_architecture', 'usr_3_comm_architecture', 'usr_9_comm_architecture', 'usr_13_comm_architecture', 'usr_15_comm_architecture', 'usr_18_comm_architecture',
  'usr_0_comm_frontend', 'usr_4_comm_frontend', 'usr_6_comm_frontend', 'usr_10_comm_frontend', 'usr_14_comm_frontend', 'usr_18_comm_frontend',
  'usr_0_comm_photography', 'usr_2_comm_photography', 'usr_8_comm_photography', 'usr_12_comm_photography', 'usr_16_comm_photography',
  'usr_0_comm_design', 'usr_4_comm_design', 'usr_6_comm_design', 'usr_10_comm_design', 'usr_12_comm_design', 'usr_14_comm_design',
  'usr_11_comm_linux', 'usr_14_comm_campus', 'usr_15_comm_motorsport', 'usr_17_comm_gaming', 'usr_19_comm_sports',
].forEach(p => membershipPairs.add(p));

// Map all 18 communities
const allCommsList = [
  // 5 Baseline
  { id: 'comm_systems', slug: 'systems' },
  { id: 'comm_photography', slug: 'photography' },
  { id: 'comm_design', slug: 'design' },
  { id: 'comm_architecture', slug: 'architecture' },
  { id: 'comm_frontend', slug: 'frontend' },
  // 5 Phase 2A.1
  { id: 'comm_database', slug: 'database-internals' },
  { id: 'comm_linux', slug: 'linux-kernel' },
  { id: 'comm_creative', slug: 'creative-coding' },
  { id: 'comm_infra', slug: 'cloud-native' },
  { id: 'comm_ai', slug: 'ai-systems' },
  // 8 Phase 2A.3
  { id: 'comm_gaming', slug: 'gaming-esports' },
  { id: 'comm_anime', slug: 'anime-manga' },
  { id: 'comm_motorsport', slug: 'cars-motorsport' },
  { id: 'comm_sports', slug: 'sports-fitness' },
  { id: 'comm_music', slug: 'music-production' },
  { id: 'comm_campus', slug: 'campus-life' },
  { id: 'comm_food', slug: 'food-cooking' },
  { id: 'comm_books', slug: 'books-reading' },
];

allCommsList.forEach((comm) => {
  allCandidateUsers.forEach((user, uIdx) => {
    // Invariant: usr_3 and usr_4 NOT in comm_systems
    if (comm.id === 'comm_systems' && (user === 'usr_3' || user === 'usr_4')) {
      return;
    }
    // Interest-aware membership distribution
    if ((uIdx + comm.slug.length) % 5 === 0 || (uIdx % allCommsList.length === allCommsList.indexOf(comm))) {
      const pair = `${user}_${comm.id}`;
      if (!membershipPairs.has(pair)) {
        membershipPairs.add(pair);
        const shortComm = comm.slug.slice(0, 4);
        expandedMemberships.push({
          _id: `mbr_${user}_${shortComm}`,
          user_id: user,
          community_id: comm.id,
          created_at: new Date('2026-02-18T00:00:00.000Z'),
        });
      }
    }
  });
});

console.log(`Generated ${expandedMemberships.length} expanded memberships (total: ${37 + expandedMemberships.length})`);

// 8. Assemble Votes
console.log('Assembling votes...');
const expandedVotes = [];
expandedPosts.forEach((post, pIdx) => {
  const numVotes = 1 + (pIdx % 4);
  for (let v = 0; v < numVotes; v++) {
    const voter = allCandidateUsers[(pIdx * 3 + v * 7) % allCandidateUsers.length];
    expandedVotes.push({
      _id: `vote_${post._id}_${voter}`,
      post_id: post._id,
      user_id: voter,
      direction: 1,
      created_at: new Date(post.created_at.getTime() + 1000 * 60 * 30),
      updated_at: new Date(post.created_at.getTime() + 1000 * 60 * 30),
    });
  }
});
console.log(`Generated ${expandedVotes.length} expanded votes.`);

// 9. Assemble Saves
console.log('Assembling saves...');
const expandedSaves = [];
for (let s = 0; s < 120; s++) {
  const post = expandedPosts[(s * 4) % expandedPosts.length];
  const saver = allCandidateUsers[(s * 5) % allCandidateUsers.length];
  expandedSaves.push({
    _id: `save_${post._id}_${saver}`,
    post_id: post._id,
    user_id: saver,
    created_at: new Date(post.created_at.getTime() + 1000 * 60 * 60),
  });
}
console.log(`Generated ${expandedSaves.length} expanded saves.`);

// 10. Output TypeScript File
const outPath = path.resolve('packages/backend/src/db/fixtures/expandedDataset.ts');

function serializeDates(obj) {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"(2026-[^"]+)"/g, 'new Date("$1")');
}

const fileContent = `// Automatically generated expanded fixtures for SocialGraph Noir Phase 2A.4
import type {
  UserDoc,
  PostDoc,
  CommentDoc,
  FollowDoc,
  CommunityDoc,
  CommunityMembershipDoc,
  PostVoteDoc,
  PostSaveDoc,
} from '../types.js';

export const expandedPersonas: UserDoc[] = ${serializeDates(allExpandedUsers.map(u => ({
  _id: u.id,
  username: u.username,
  display_name: u.name,
  avatar_url: u.avatar,
  banner_url: u.banner,
  bio: u.bio,
  is_verified: u.verified,
  followers_count: 0,
  following_count: 0,
  posts_count: 0,
  created_at: new Date('2026-02-15T00:00:00.000Z'),
  updated_at: new Date('2026-02-15T00:00:00.000Z'),
})))};

export const expandedCommunities: CommunityDoc[] = ${serializeDates(allExpandedCommunities.map(c => ({
  _id: c.id,
  name: c.name,
  slug: c.slug,
  description: c.description,
  avatar_url: c.avatar_url,
  members_count: 0,
  rules: c.rules,
  created_at: new Date('2026-02-10T00:00:00.000Z'),
  updated_at: new Date('2026-02-10T00:00:00.000Z'),
})))};

export const expandedPosts: PostDoc[] = ${serializeDates(expandedPosts)};

export const expandedComments: CommentDoc[] = ${serializeDates(expandedComments)};

export const expandedFollows: FollowDoc[] = ${serializeDates(expandedFollows)};

export const expandedMemberships: CommunityMembershipDoc[] = ${serializeDates(expandedMemberships)};

export const expandedVotes: PostVoteDoc[] = ${serializeDates(expandedVotes)};

export const expandedSaves: PostSaveDoc[] = ${serializeDates(expandedSaves)};
`;

fs.writeFileSync(outPath, fileContent, 'utf-8');
console.log(`Wrote ${outPath} (${(Buffer.byteLength(fileContent) / 1024).toFixed(1)} KB) successfully!`);
