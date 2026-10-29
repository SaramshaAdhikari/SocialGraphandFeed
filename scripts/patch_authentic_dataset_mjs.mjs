import fs from 'node:fs';

const updatedExtraTechPosts = `// Extra 30 tech posts (balanced between everyday engineering reality and systems depth)
const extraTechPosts = [
  // Relatable, everyday developer stories (Indices 38..44)
  {
    title: 'Spent 3 hours tracking down a mystery 500 error: turned out to be trailing whitespace in an env var',
    content: \`Yesterday our staging auth service started intermittently rejecting valid session tokens with a cryptic 500 internal error. Checked database indexes, Redis connections, and network routes. Everything looked completely green.

Finally printed the parsed environment variables with quotes:
\`AUTH_SECRET='secret_key '\`

Someone had pasted the secret with an invisible trailing space in the deployment config, which caused HMAC signature verification to fail on rotated nodes. Lesson learned: always \\\`.trim()\\\` your configuration strings at startup!\`,
    community_id: 'comm_systems', community_slug: 'systems', flair: 'War Stories', tags: ['debugging', 'devops', 'node']
  },
  {
    title: 'My tiny 15W homelab: running Proxmox, Pi-hole, and Docker on two refurbished ThinkCentre mini PCs',
    content: \`Downsized my loud 4U rack server into two Lenovo ThinkCentre M720q tiny PCs (i5-8500T, 32GB RAM each) picked up on eBay for $110 each.

They idle at a combined 18 watts, produce almost zero noise, and run my entire home network: Pi-hole, Vaultwarden, Paperless-ngx, Home Assistant, and a local Postgres instance for side projects. Sometimes the simplest hardware setup is the most enjoyable.\`,
    community_id: 'comm_infra', community_slug: 'cloud-native', flair: 'Homelab', tags: ['homelab', 'selfhosted', 'hardware']
  },
  {
    title: 'Replaced a 200-line Redux Toolkit slice with a 25-line custom React hook and our team loves it',
    content: \`Our team had a modal checkout form managed by Redux Toolkit with five action creators, extraReducers, and loading status enums.

Refactored the entire flow into a single \\\`useCheckoutState\\\` hook with a native reducer and URL query parameters for step navigation.
- Deleted 180 lines of boilerplate.
- Eliminated state desynchronization on back-button clicks.
- New devs can understand the flow in 2 minutes.\`,
    community_id: 'comm_frontend', community_slug: 'frontend', flair: 'Refactoring', tags: ['react', 'frontend', 'state']
  },
  {
    title: 'Why our engineering team moved internal docs from Notion back to plain Markdown in Git',
    content: \`After two years in Notion, our team documentation had turned into an unsearchable sprawl of outdated nested pages and broken database views.

Three months ago, we moved all architectural decision records (ADRs) and service runbooks to a \\\`/docs\\\` folder in each service's repository.
- Docs are updated in the same pull request as the code change.
- Git blame shows exactly why an architectural decision was made.
- Fast offline search with ripgrep.\`,
    community_id: 'comm_architecture', community_slug: 'architecture', flair: 'Best Practices', tags: ['documentation', 'git', 'markdown']
  },
  {
    title: 'Setting up local HTTPS for development with mkcert: eliminating self-signed cert warnings forever',
    content: \`Tired of clicking through "Your connection is not private" warnings in Chrome and Safari when testing Web Crypto APIs and WebAuthn locally?

\\\`mkcert\\\` creates a locally-trusted development certificate authority in your system trust store in 10 seconds:
\\\`\\\`\\\`bash
mkcert -install
mkcert localhost 127.0.0.1 ::1
\\\`\\\`\\\`
Hooked it up to Fastify and Vite HTTPS options. Zero browser security friction ever since.\`,
    community_id: 'comm_frontend', community_slug: 'frontend', flair: 'Tooling', tags: ['devtools', 'https', 'webdev']
  },
  {
    title: 'Switched from zsh with 12 plugins back to plain bash with a minimal prompt: instant terminal startup',
    content: \`My terminal had gotten noticeably sluggish—every new tab took almost 800ms to open because of git prompt status parsing, nvm hooks, and plugin managers.

Stripped my \\\`~/.bashrc\\\` down to 30 lines with a clean single-line prompt showing just directory and git branch. Terminal windows now open in 15ms. Sometimes less really is more.\`,
    community_id: 'comm_linux', community_slug: 'linux-kernel', flair: 'Terminal', tags: ['bash', 'terminal', 'productivity']
  },
  {
    title: 'Running SQLite in production with Litestream: reflections after 8 months on an internal tools portal',
    content: \`Eight months ago, we built an internal company portal used by 60 teammates daily. Instead of spinning up a managed RDS database, we used SQLite with WAL mode and Litestream continuously replicating WAL frames to an S3 bucket.

- 0 maintenance incidents.
- Sub-millisecond local query latencies.
- Backups cost $0.12/month on S3.
- Restoring from backup takes literally 4 seconds.
For small to medium internal applications, SQLite is vastly underutilized.\`,
    community_id: 'comm_database', community_slug: 'database-internals', flair: 'Production SQLite', tags: ['sqlite', 'database', 'architecture']
  },
  // In-depth technical & systems engineering posts (Indices 45..67)
  {
    title: 'Benchmarking Rust async runtimes: Tokio vs Smol under millions of concurrent TCP timers',
    content: \`When managing hundreds of thousands of idle keep-alive connections, timer wheel allocations dominate heap memory. We profiled Tokio's hashed hierarchical timer wheel against Smol's intrusive timer queue under synthetic connection churn.\`,
    community_id: 'comm_systems', community_slug: 'systems', flair: 'Async Rust', tags: ['rust', 'tokio', 'concurrency']
  },
  {
    title: 'Understanding lock-free memory reclamation: Hazard Pointers vs Epoch-Based Reclamation (EBR)',
    content: \`In multi-threaded data structures where readers traverse nodes without latches, when is it safe to free a deleted node? We examine how Epoch-Based Reclamation groups retired pointers into generational bins, contrasting its throughput advantages over Hazard Pointers with its unbounded memory hazard under stalled threads.\`,
    community_id: 'comm_systems', community_slug: 'systems', flair: 'Memory Models', tags: ['concurrency', 'memory', 'algorithms']
  },
  {
    title: 'Why SIMD vectorization matters for high-throughput vector database cosine distance calculations',
    content: \`Computing cosine similarity across 1536-dimensional OpenAI embeddings in a loop requires 1536 multiply-add operations per candidate vector. Using AVX-512 FMA instructions, we pack 16 float32 operations into a single CPU cycle, achieving a 14x throughput boost over standard scalar loops.\`,
    community_id: 'comm_ai', community_slug: 'ai-systems', flair: 'Vector DB', tags: ['simd', 'vectordb', 'performance']
  },
  {
    title: 'Speculative decoding in production: pairing a 1B draft model with a 70B target model for 2.4x latency reduction',
    content: \`Because autoregressive generation is memory-bandwidth bound on single tokens, having a tiny 1B parameter draft model guess 4 tokens ahead allows the large 70B model to verify all 4 tokens in a single parallel forward pass. Here are the acceptance rate statistics across coding prompts.\`,
    community_id: 'comm_ai', community_slug: 'ai-systems', flair: 'LLM Systems', tags: ['llm', 'inference', 'optimization']
  },
  {
    title: 'RoCE v2 vs InfiniBand in 512-GPU training clusters: tuning Priority Flow Control (PFC) deadlocks',
    content: \`Ethernet-based RDMA (RoCE v2) requires lossless transmission. When buffer queues fill during all-reduce gradients, PFC pause frames can create circular wait dependencies across leaf-spine switches, freezing training runs. We outline our DCQCN congestion notification tuning strategy.\`,
    community_id: 'comm_ai', community_slug: 'ai-systems', flair: 'Networking', tags: ['rdma', 'gpu', 'datacenter']
  },
  {
    title: 'Designing high-throughput LSM-tree bloom filters: Blocked Bloom Filters vs Ribbon Filters',
    content: \`Standard bloom filters incur a CPU cache miss on every probed hash bit. Blocked Bloom filters constrain bit probes to a single 64-byte L1 cache line, doubling lookup speeds at the expense of a microscopic increase in false positive probability.\`,
    community_id: 'comm_database', community_slug: 'database-internals', flair: 'Data Structures', tags: ['bloomfilter', 'lsm', 'algorithms']
  },
  {
    title: 'Dissecting PostgreSQL MVCC vacuuming: page-level pruning vs aggressive table freeze operations',
    content: \`A deep dive into how PostgreSQL handles tuple overwrites. In-page vacuuming removes dead tuples during ordinary SELECT queries when space is available on the 8KB page, while autovacuum worker processes perform cross-page index cleaning and transaction ID wraparound prevention.\`,
    community_id: 'comm_database', community_slug: 'database-internals', flair: 'PostgreSQL', tags: ['postgres', 'mvcc', 'internals']
  },
  {
    title: 'Lock contention profiling in high-concurrency Redis clusters: key hash slot redistribution lessons',
    content: \`When a single tenant generates 40,000 requests per second to a single Redis cluster node, CPU core saturation degrades latency for all tenants sharing that cluster shard. We implemented a dynamic key salt prefixing pattern that distributes high-cardinality counters across multiple hash slots.\`,
    community_id: 'comm_database', community_slug: 'database-internals', flair: 'Caching', tags: ['redis', 'caching', 'concurrency']
  },
  {
    title: 'Linux cgroups v2 memory limits: understanding OOM killer heuristics and page cache reclaim pressure',
    content: \`When a container in Kubernetes exceeds its memory limit, the Linux kernel first attempts to aggressively reclaim inactive file-backed page caches before invoking the Out-Of-Memory (OOM) killer. Here is how monitoring memory.pressure (PSI) gives early warning signals before pods are terminated.\`,
    community_id: 'comm_linux', community_slug: 'linux-kernel', flair: 'Kernel & Cgroups', tags: ['linux', 'cgroups', 'kubernetes']
  },
  {
    title: 'Building a microkernel IPC mechanism in C: zero-copy message passing via shared virtual memory pages',
    content: \`Traditional microkernels suffer a performance penalty when copying messages between user-space driver processes and the kernel. By implementing a virtual memory remapping mechanism inspired by L4 SeL4, page table entries are flipped atomically, achieving sub-200 nanosecond message passing times.\`,
    community_id: 'comm_linux', community_slug: 'linux-kernel', flair: 'OS Design', tags: ['microkernel', 'c', 'systems']
  },
  {
    title: 'Tracing network packet drops with eBPF kprobes: pinpointing drops across bridge and iptables chains',
    content: \`When packets mysteriously vanish inside a complex Docker bridge network, debugging with tcpdump only shows that a packet never arrived. By instrumenting the kfree_skb kernel function using an eBPF tracepoint, we capture the exact kernel instruction and reason code for every dropped packet in real time.\`,
    community_id: 'comm_linux', community_slug: 'linux-kernel', flair: 'eBPF Tracing', tags: ['ebpf', 'networking', 'debugging']
  },
  {
    title: 'Dissecting V8 hidden class transitions: why object shape mutations deoptimize hot JavaScript loops',
    content: \`V8 optimizes property access on JavaScript objects through Inline Caches (ICs) by assigning hidden class shapes. Adding properties dynamically out of order or deleting properties with delete causes transition trees to branch, degrading monomorphic call sites into megamorphic dictionary lookups.\`,
    community_id: 'comm_frontend', community_slug: 'frontend', flair: 'JavaScript V8', tags: ['v8', 'javascript', 'performance']
  },
  {
    title: 'WebAssembly multi-threading with SharedArrayBuffer and Web Workers: audio DSP processing in the browser',
    content: \`Porting a professional multi-track digital audio workstation to the browser requires processing audio buffers within strict 2.9ms real-time deadlines (at 128-sample buffer sizes). We demonstrate how compiling C++ audio DSP algorithms to WebAssembly with Atomics and SharedArrayBuffer avoids main-thread UI jank.\`,
    community_id: 'comm_frontend', community_slug: 'frontend', flair: 'Wasm & Audio', tags: ['webassembly', 'audio', 'dsp']
  },
  {
    title: 'Container queries in production design systems: building intrinsically responsive component micro-layouts',
    content: \`Media queries respond to the global browser viewport, which breaks component encapsulation when the same card widget is rendered in a narrow sidebar, a central feed, or a wide dialog modal. With CSS @container, the card responds directly to its parent container width, eliminating brittle breakpoint props.\`,
    community_id: 'comm_frontend', community_slug: 'frontend', flair: 'Design Systems', tags: ['css', 'containerqueries', 'responsive']
  },
  {
    title: 'Designing high-contrast monochrome design tokens: semantic color layering and WCAG AAA compliance',
    content: \`A truly refined monochrome user interface is not simply greyscale: it relies on subtle luminance differentials across nested surfaces (background, surface-subtle, surface-card, surface-overlay). We explain our lightness curve math that guarantees 7:1 contrast for critical content.\`,
    community_id: 'comm_design', community_slug: 'design', flair: 'Design Tokens', tags: ['designsystems', 'tokens', 'accessibility']
  },
  {
    title: 'Optical alignment in UI icons: why mathematical centering often looks visually unbalanced to the human eye',
    content: \`When placing a triangular play icon or a bookmark glyph inside a circular badge, centering the SVG bounding box mathematically results in an icon that appears off-center because visual mass is concentrated toward one side. Here are the optical correction offsets we apply in our icon component library.\`,
    community_id: 'comm_design', community_slug: 'design', flair: 'Visual Design', tags: ['icons', 'svg', 'typography']
  },
  {
    title: 'Procedural terrain generation in WebGL: layering Perlin noise, erosion simulation, and normal maps',
    content: \`Generating believable mountain ranges requires more than basic fractal noise. We demonstrate a pipeline combining fractional Brownian motion (fBm) with a hydraulic particle erosion simulation pass running in a WebGL 2 float texture framebuffer.\`,
    community_id: 'comm_creative', community_slug: 'creative-coding', flair: 'Generative Art', tags: ['webgl', 'generative', 'shaders']
  },
  {
    title: 'Raymarching volumetric clouds in WebGPU compute shaders: Henyey-Greenstein phase function lighting',
    content: \`Simulating realistic light scattering through dense cloud formations requires evaluating the Henyey-Greenstein phase function for forward and backward scattering towards the sun. We share our temporal accumulation reprojection shader that stabilizes noise across frames.\`,
    community_id: 'comm_creative', community_slug: 'creative-coding', flair: 'WebGPU Shaders', tags: ['webgpu', 'volumetric', 'shaders']
  },
  {
    title: 'Graceful degradation in cloud microservices: automated circuit breakers with adaptive error rate thresholds',
    content: \`When a downstream recommendation service begins throwing timeouts, calling services should not queue requests indefinitely. Using Netflix Hystrix-style circuit breakers with sliding time windows, our API gateways fail open with cached fallbacks in sub-10ms.\`,
    community_id: 'comm_infra', community_slug: 'cloud-native', flair: 'Resilience', tags: ['resilience', 'microservices', 'sre']
  },
  {
    title: 'Chaos engineering in staging environments: automated packet corruption and latency injection pipelines',
    content: \`A service that appears reliable under clean network conditions often deadlocks when network packets arrive corrupted or delayed by 250ms. We use Linux tc (traffic control) and netem within automated GitHub Actions test matrices to verify that our gRPC clients reconnect gracefully.\`,
    community_id: 'comm_infra', community_slug: 'cloud-native', flair: 'Chaos Engineering', tags: ['chaos', 'testing', 'networking']
  },
  {
    title: 'Implementing zero-downtime database schema migrations with expand-and-contract patterns',
    content: \`Renaming a database column or changing a data type in a database processing 10,000 transactions per second without taking an outage. Step 1: Expand by adding the new column. Step 2: Write to both old and new. Step 3: Backfill legacy rows. Step 4: Contract by cutting reads to the new column.\`,
    community_id: 'comm_architecture', community_slug: 'architecture', flair: 'Database Migrations', tags: ['database', 'migrations', 'sql']
  },
  {
    title: 'Evaluating memory-mapped files (mmap) vs direct pread syscalls for database page cache managers',
    content: \`While mmap() makes reading pages as simple as dereferencing a memory pointer, the database loses control over write-back timing and can suffer uncontrollable thread stalls when page faults trigger page evictions. Why our storage engine migrated to explicit pread with user-space buffer pools.\`,
    community_id: 'comm_database', community_slug: 'database-internals', flair: 'I/O Internals', tags: ['mmap', 'storage', 'linux']
  },
  {
    title: 'Building an interactive audio synthesizer with Web Audio API AudioWorkletNode and custom DSP',
    content: \`The legacy ScriptProcessorNode ran on the browser main UI thread, resulting in catastrophic audio dropouts whenever the page scrolled. AudioWorkletNode runs in a dedicated high-priority audio rendering thread, delivering glitch-free polyphonic synthesis in pure JavaScript and WebAssembly.\`,
    community_id: 'comm_creative', community_slug: 'creative-coding', flair: 'Web Audio', tags: ['webaudio', 'dsp', 'music']
  },
];`;

const updatedExtraUsers = `// Personas (usr_20 to usr_64) with authentic human bios, locations, and hobbies
const extraUsers = [
  { id: 'usr_20', username: 'vikram_db', name: 'Vikram Patel', bio: 'database engineer in sf. sourdough baker, cycling, and tinkering with zig on weekends', verified: true, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200' },
  { id: 'usr_21', username: 'clara_s', name: 'Clara Schmidt', bio: 'distributed systems researcher in berlin | coffee enthusiast ☕ & 35mm film', verified: true, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200', banner: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200' },
  { id: 'usr_22', username: 'torsten_l', name: 'Torsten Lind', bio: 'systems perf nerd, copenhagen. usually out cycling or trying new pour-overs', verified: false, avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200', banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200' },
  { id: 'usr_23', username: 'meizhang', name: 'Mei Zhang', bio: 'building storage engines @ a startup. plants, climbing, bouldering', verified: false, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200', banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200' },
  { id: 'usr_24', username: 'devin_v', name: 'Devin Vance', bio: 'ml infrastructure, hardware tinkering. trail running in the pnw', verified: true, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200' },
  { id: 'usr_25', username: 'zara_m', name: 'Zara Al-Mansoor', bio: 'compilers & runtime systems. tea snob, mechanical keyboards', verified: true, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200', banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200' },
  { id: 'usr_26', username: 'arjun_r', name: 'Arjun Rao', bio: 'engineer in toronto. building search engines, reading scifi, learning guitar', verified: false, avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200', banner: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200' },
  { id: 'usr_27', username: 'selena_g', name: 'Selena Gomez-Cruz', bio: 'backend dev & open source contributor. austin, tx', verified: false, avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200', banner: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200' },
  { id: 'usr_28', username: 'nathan_d', name: 'Nathan Drake', bio: 'security engineer, hardware enthusiast, dog dad', verified: true, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200', banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200' },
  { id: 'usr_29', username: 'roxana_p', name: 'Roxana Petrescu', bio: 'applied cryptography & privacy. bucharest / remote', verified: true, avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200', banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200' },
  { id: 'usr_30', username: 'klaus_w', name: 'Klaus Weber', bio: 'infrastructure architect & vintage analog synth collector. munich', verified: false, avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200', banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200' },
  { id: 'usr_31', username: 'leila_m', name: 'Leila Moradi', bio: 'identity & security standards. passionate about UX, typography, and pastry', verified: false, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200', banner: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200' },
  { id: 'usr_32', username: 'omar_f', name: 'Omar Farooq', bio: 'distributed infrastructure lead. road cycling & landscape photography', verified: true, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200', banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200' },
  { id: 'usr_33', username: 'brigitte_m', name: 'Brigitte Moreau', bio: 'sre manager, community gardener, book lover. montreal', verified: true, avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200', banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200' },
  { id: 'usr_34', username: 'dmitri_s', name: 'Dmitri Sokolov', bio: 'cloud native systems hacker. go & rust, hiking in the cascades', verified: false, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', banner: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200' },
  { id: 'usr_35', username: 'tessa_vd', name: 'Tessa van Dijk', bio: 'amsterdam. distributed systems researcher & beginner ceramicist', verified: true, avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=200', banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200' },
  { id: 'usr_36', username: 'gabriel_c', name: 'Gabriel Costa', bio: 'web audio, dsp & wasm in lisbon. surfing when the swell is up', verified: true, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', banner: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200' },
  { id: 'usr_37', username: 'yuki_t', name: 'Yuki Takahashi', bio: 'frontend engineering in tokyo. typography, ramen, and browser rendering', verified: false, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200', banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200' },
  { id: 'usr_38', username: 'anika_r', name: 'Anika Roy', bio: 'design systems lead & css enthusiast. bangalore. watercolor painter', verified: true, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200', banner: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200' },
  { id: 'usr_39', username: 'callum_m', name: 'Callum MacLeod', bio: 'compilers, v8, and espresso extraction. edinburgh', verified: false, avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200', banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200' },
  { id: 'usr_40', username: 'simon_g', name: 'Simon Gauthier', bio: 'generative artist & creative coder. glsl shaders & visual music. montreal', verified: true, avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200', banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200' },
  { id: 'usr_41', username: 'nadia_b', name: 'Nadia Benali', bio: 'interactive graphics, webgl, and sound design. paris', verified: false, avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200', banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200' },
  { id: 'usr_42', username: 'orion_v', name: 'Orion Vance', bio: 'graphics programmer, real-time rendering, scifi reader', verified: false, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200' },
  { id: 'usr_43', username: 'freja_n', name: 'Freja Nielsen', bio: 'graphics dev & webgpu explorer. copenhagen', verified: true, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200', banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200' },
  { id: 'usr_44', username: 'mateo_m', name: 'Mateo Morales', bio: 'architectural photographer. chasing light on concrete. cdmx', verified: true, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200', banner: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200' },
  { id: 'usr_45', username: 'ingrid_b', name: 'Ingrid Bergman', bio: 'monochrome architectural photography & 35mm film. stockholm', verified: true, avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200', banner: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200' },
  { id: 'usr_46', username: 'samir_k', name: 'Samir Kassam', bio: 'urban photographer & cyclist. nairobi / london', verified: false, avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200', banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200' },
  { id: 'usr_47', username: 'zoe_l', name: 'Zoe Laurent', bio: 'architecture student & brutalism enthusiast. montreal', verified: false, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200', banner: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200' },
  { id: 'usr_48', username: 'hassan_h', name: 'Hassan Al-Husseini', bio: 'embedded linux & kernel hacker. vintage hifi audio fan', verified: true, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200', banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200' },
  { id: 'usr_49', username: 'olga_v', name: 'Olga Voronova', bio: 'linux kernel engineer, bpf enthusiast, bouldering', verified: true, avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200', banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200' },
  { id: 'usr_50', username: 'piotr_w', name: 'Piotr Wisniewski', bio: 'hardware hacker, fpga tinkering, mechanical keyboards. krakow', verified: false, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', banner: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200' },
  { id: 'usr_51', username: 'brenda_oc', name: 'Brenda O’Connor', bio: 'hardware design & electronics. dublin. cats & coffee', verified: false, avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=200', banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200' },
  { id: 'usr_52', username: 'linus_h', name: 'Linus Hallberg', bio: 'retrocomputing, vintage workstations & home server enthusiast', verified: false, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', banner: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200' },
  { id: 'usr_53', username: 'astrid_l', name: 'Astrid Lindgren-Smith', bio: 'compiler dev, rustacean, winter swimmer. stockholm', verified: true, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200', banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200' },
  { id: 'usr_54', username: 'diego_r', name: 'Diego Ramirez', bio: 'demoscene archivist & vintage hardware lover. santiago', verified: false, avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200', banner: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200' },
  { id: 'usr_55', username: 'valerie_d', name: 'Valerie Dupuis', bio: 'museum curator & vintage workstation restoration. lyon', verified: false, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200', banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200' },
  { id: 'usr_56', username: 'thierry_l', name: 'Thierry Laurent', bio: 'programming languages researcher, brussels. jazz piano', verified: true, avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200', banner: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200' },
  { id: 'usr_57', username: 'sujin_p', name: 'Sujin Park', bio: 'formal methods engineer, seoul. urban sketching & matcha', verified: true, avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200', banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200' },
  { id: 'usr_58', username: 'ronan_ob', name: 'Ronan O’Brien', bio: 'software engineer, galway. open source, traditional music, hiking', verified: false, avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200', banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200' },
  { id: 'usr_59', username: 'fatima_z', name: 'Fatima Zahra', bio: 'systems engineer in casablanca. rust, distributed systems, marathon runner', verified: true, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200', banner: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200' },
  { id: 'usr_60', username: 'axel_n', name: 'Axel Nordstrom', bio: 'datacenter infrastructure, oslo. cross-country skiing & woodworking', verified: false, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200' },
  { id: 'usr_61', username: 'linnea_e', name: 'Linnea Ekstrom', bio: 'graphic designer & creative coder. typography & risograph printing', verified: false, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200', banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200' },
  { id: 'usr_62', username: 'dante_r', name: 'Dante Rossi', bio: 'cs lecturer, milan. teaching operating systems, espresso lover', verified: false, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200' },
  { id: 'usr_63', username: 'chiara_e', name: 'Chiara Esposito', bio: 'architecture historian & photographer. rome', verified: true, avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200', banner: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200' },
  { id: 'usr_64', username: 'sergei_m', name: 'Sergei Morozov', bio: 'network engineer & amateur radio operator. prague', verified: false, avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200', banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200' },
];`;

let content = fs.readFileSync('scripts/assemble_authentic_dataset.mjs', 'utf8');

// Replace extraTechPosts
const techStart = content.indexOf('// Extra 30 tech posts');
const techEnd = content.indexOf('// Combine all 140 discussion items');
if (techStart === -1 || techEnd === -1) throw new Error('Could not find extraTechPosts boundaries');
content = content.slice(0, techStart) + updatedExtraTechPosts + '\n\n' + content.slice(techEnd);

// Replace extraUsers
const usersStart = content.indexOf('// Personas (usr_20 to usr_64)');
const usersEnd = content.indexOf('const extraCommunities = [');
if (usersStart === -1 || usersEnd === -1) throw new Error('Could not find extraUsers boundaries');
content = content.slice(0, usersStart) + updatedExtraUsers + '\n\n' + content.slice(usersEnd);

fs.writeFileSync('scripts/assemble_authentic_dataset.mjs', content, 'utf8');
console.log('Successfully patched scripts/assemble_authentic_dataset.mjs with authentic personas & posts!');
