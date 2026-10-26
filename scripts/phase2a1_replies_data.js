// 45 Contextual Depth-1 Replies and 20 Depth-2 Replies with natural, varied conversational tone
export const depth1Replies = [
  // 1-10: Replies to tech news / multi-image comments
  {
    parentIdx: 0, // PG 17 vacuum
    content: `Wait, does the new radix tree structure impact CPU cache misses during vacuuming as well, or is the improvement purely about memory allocation size?`,
  },
  {
    parentIdx: 1, // Linux PREEMPT_RT
    content: `Not having to maintain custom out-of-tree EtherCAT patches after every security advisory will save our team easily hundreds of hours a year.`,
  },
  {
    parentIdx: 2, // Rust use<..>
    content: `Same here. Previously you had to write awkward dummy lifetime hacks just to make the borrow checker happy when returning traits in async functions.`,
  },
  {
    parentIdx: 3, // Python free-threading
    content: `That scaling is wild. Were your worker threads using standard C extensions like NumPy, or was it pure Python code? The C-API compatibility was what worried us most.`,
  },
  {
    parentIdx: 4, // WebGPU compute
    content: `The WGSL language server in VS Code with instant type checking and diagnostics makes shader development feel almost as modern as TypeScript now.`,
  },
  {
    parentIdx: 5, // SQLite JSONB
    content: `Did you see any file size inflation on disk with JSONB vs raw text strings? In our tests the binary overhead was tiny compared to the query speed gain.`,
  },
  {
    parentIdx: 6, // Node 22 WebSockets
    content: `Having native WebSockets adhering to the WHATWG spec is great because we can share our client connection wrappers between browser and Node server code directly.`,
  },
  {
    parentIdx: 7, // TS 5.6 regex
    content: `We had a stray \`if (/^[0-9]+$/)\` regex check that was evaluating truthy unconditionally for almost two years before 5.6 flagged it! Huge catch.`,
  },
  {
    parentIdx: 8, // React 19 Actions
    content: `Are you using useActionState with server actions or client-side mutations? We paired it with our Fastify API client and it cut out so much state boilerplate.`,
  },
  {
    parentIdx: 9, // Go 1.23 iterators
    content: `I love how clean the type signature looks. Having the compiler handle loop closure unwinding without stack frame allocations makes range loops super fast.`,
  },
  {
    parentIdx: 10, // Keyboard BDZ
    content: `Good call on the BDZ! I put a tiny dab on the stabilizer wire elbows and 205g0 on the stems. Zero ticking even after a month of daily typing.`,
  },
  {
    parentIdx: 11, // Homelab Cat6A
    content: `I bought pre-terminated 6-inch Monoprice slim Cat6A patch cords in bulk. Punching down 48 keystones took an entire Saturday afternoon, but the result is so clean.`,
  },
  {
    parentIdx: 12, // Marcy Pad R-value
    content: `Brought a Therm-a-Rest XTherm with a 7.3 R-value! Cold ground is definitely the real danger in late autumn in the High Peaks.`,
  },
  {
    parentIdx: 13, // Minimal Desk cables
    content: `Used split braided cable sleeving zip-tied behind the monitor arm column down through the desk grommet. From the front you can't see a single wire.`,
  },
  {
    parentIdx: 14, // Barbican Light
    content: `Thanks! Caught that shot right as the clouds broke for about 15 minutes before sunset. That bush-hammered concrete takes on an almost metallic sheen in wet weather.`,
  },
  {
    parentIdx: 15, // Sourdough steam
    content: `Challenger bread pan with two ice cubes tossed under the dough right before dropping the lid! Gives that blistering and high spring every time.`,
  },
  {
    parentIdx: 16, // SGI Octane power supply
    content: `Surprisingly the power supply caps were totally fine! The only thing I had to replace was the Dallas DS1687 real-time clock chip because the internal lithium cell died in 2008.`,
  },
  {
    parentIdx: 17, // Gaggia 9-bar spring
    content: `Yes! Swapped the factory 15-bar spring for the Shades of Coffee 9-bar spring first thing. Channeling dropped immediately and extractions are sweet and repeatable.`,
  },

  // 18-35: Developer & Systems Discussions
  {
    parentIdx: 18, // LSM Compaction
    content: `Counter-point: if your read workload has a high proportion of point lookups on cold keys, tiered compaction can increase read amplification quite a bit compared to pure leveled.`,
  },
  {
    parentIdx: 19, // B-link Lehman-Yao
    content: `Did you implement the root page split top-down or bottom-up? Handling parent pointers during concurrent splits can get tricky when root height increases.`,
  },
  {
    parentIdx: 20, // io_uring core burning
    content: `Good point on \`sq_thread_idle\`. We set our idle timeout to 2000ms. Gives us zero syscall overhead during traffic bursts, but lets the core sleep during overnight quiet periods.`,
  },
  {
    parentIdx: 21, // eBPF XDP
    content: `Are you running XDP in native driver mode or generic mode? Native mode on Mellanox ConnectX-5 gave us almost 4x higher packet rates than generic mode.`,
  },
  {
    parentIdx: 22, // Distributed locks
    content: `How did you handle idempotency during network partitions when switching away from distributed locks? Did you rely on vector clocks or Lamport timestamps?`,
  },
  {
    parentIdx: 23, // V8 memory leak
    content: `Event emitter listeners without cleanup are definitely the #1 cause of Node.js memory leaks in our experience too. Now we enforce maxListeners=15 in tests.`,
  },
  {
    parentIdx: 24, // SIMD JSON
    content: `simdjson is incredible engineering. Parsing 2GB of JSON per second per core by identifying string quotes and structural brackets with vector bitmasks is mindblowing.`,
  },
  {
    parentIdx: 25, // Microkernels
    content: `seL4's formal verification proofs are the gold standard here. Proving absence of buffer overflows and null pointer dereferences at the binary level is remarkable.`,
  },
  {
    parentIdx: 26, // K8s graceful shutdown
    content: `Adding \`sleep 5\` to \`lifecycle.preStop\` solved 99% of our random 502 errors during rolling deployments. Such a simple fix that isn't documented clearly enough.`,
  },
  {
    parentIdx: 27, // Container Queries
    content: `Combined with \`@container (min-width: ...)\`, fluid typography with \`clamp()\` makes layouts adapt smoothly without abrupt breakpoint jumps.`,
  },
  {
    parentIdx: 28, // Sum types
    content: `Coming to TypeScript from Rust, I really miss pattern matching with exhaustiveness checks. \`switch (action.type)\` with a \`never\` default case works, but it's much more verbose.`,
  },
  {
    parentIdx: 29, // SPIFFE
    content: `How do you handle federating SPIFFE IDs across multiple Kubernetes clusters or cloud providers? SPIRE server federation works, but the trust bundle sync requires careful setup.`,
  },
  {
    parentIdx: 30, // Timer wheels
    content: `Tokio's timer wheel implementation is inspired by George Varghese's classic paper on hashed timer wheels. Great read for anyone writing network servers.`,
  },
  {
    parentIdx: 31, // Memory reclamation
    content: `In our high-frequency trading engine, we use hazard pointers specifically because we cannot afford unbounded memory growth if an external thread stalls.`,
  },
  {
    parentIdx: 32, // SIMD vector search
    content: `Are you using AVX-512 directly with compiler intrinsics or through a library like USearch / FAISS? The compiler auto-vectorizer often misses horizontal add reductions.`,
  },
  {
    parentIdx: 33, // Speculative decoding
    content: `What was the acceptance rate of the draft tokens? We saw roughly 68% acceptance on Python/TypeScript code completion, but only 45% on creative writing.`,
  },
  {
    parentIdx: 34, // RoCE v2 deadlocks
    content: `Did you end up configuring DCQCN congestion notification on the leaf switches, or did you increase the ECN marking threshold?`,
  },
  {
    parentIdx: 35, // Blocked bloom filters
    content: `Ribbon filters from RocksDB are another interesting alternative—they reduce space by roughly 30% compared to standard bloom filters for the same false positive rate.`,
  },

  // 36-44: Relatable & Everyday Discussions
  {
    parentIdx: 38, // Env var typo
    content: `Once spent an entire Friday afternoon debugging an API endpoint because I named the variable \`AUTH_TOKEN\` in development and \`AUTHORIZATION_TOKEN\` in production. We have all been there!`,
  },
  {
    parentIdx: 39, // ThinkCentre homelab
    content: `I run Proxmox on three of those M720q nodes in a cluster. Migrating VMs between nodes while consuming less total power than a single lightbulb is so satisfying.`,
  },
  {
    parentIdx: 40, // Redux to hook
    content: `Hot take, but I still like Redux Toolkit for complex offline apps with optimistic undo/redo queues. But for ordinary CRUD dashboards, lightweight hooks are 100% the right call.`,
  },
  {
    parentIdx: 41, // Notion to Markdown
    content: `Git blame on documentation is an underrated superpower. You can see exactly which PR and context introduced an architecture decision from 2 years ago.`,
  },
  {
    parentIdx: 42, // mkcert
    content: `Pairing mkcert with a local \`.test\` domain using dnsmasq or \`/etc/hosts\` gives you a production-identical setup on localhost. Zero friction.`,
  },
  {
    parentIdx: 43, // Bash prompt
    content: `I used to have a Starship prompt that ran 8 git queries and slowed my terminal down by 300ms on every newline. Went back to a clean single-line prompt and never looked back.`,
  },
  {
    parentIdx: 44, // SQLite in prod
    content: `Litestream for continuous streaming replication to an S3 bucket turns SQLite into an essentially zero-maintenance, crash-safe database for small web services.`,
  },
];

// 20 Contextual Depth-2 Replies forming realistic 3-turn conversations
export const depth2Replies = [
  {
    parentIdx: 0, // PG 17 vacuum follow up
    content: `The radix tree structure keeps vacuum memory flat under 64MB regardless of dead tuple count, which directly reduces shared buffer pool thrashing during heavy write workloads.`,
  },
  {
    parentIdx: 1, // Linux PREEMPT_RT follow up
    content: `100%. Having deterministic sub-millisecond interrupt latency in stock LTS kernels is going to transform medical devices and robotics hardware.`,
  },
  {
    parentIdx: 3, // Python free-threading follow up
    content: `We tested with pure Python mathematical algorithms first, then linked against NumPy compiled with the experimental free-threaded flags. Both scaled across all cores cleanly!`,
  },
  {
    parentIdx: 4, // WebGPU WGSL tooling
    content: `The VS Code WGSL extension by Greg Bowman is what we use. Having syntax highlighting and instant type validation in the editor makes shader programming feel like ordinary frontend dev.`,
  },
  {
    parentIdx: 5, // SQLite JSONB disk overhead
    content: `Our database file grew by roughly 8% on disk with JSONB, but p99 query latency dropped from 14ms down to 4.5ms because SQLite no longer re-parses JSON string tokens on every row evaluation.`,
  },
  {
    parentIdx: 6, // Node WebSockets WHATWG
    content: `Eliminating an external npm dependency for core network transport also reduces our dependency vulnerability surface significantly. Win-win.`,
  },
  {
    parentIdx: 7, // TS 5.6 regex typo
    content: `It's subtle syntax bugs like that which can sit undetected in a codebase for years. Compiler static analysis catching them before tests run is priceless.`,
  },
  {
    parentIdx: 8, // React 19 Actions Fastify
    content: `We paired useActionState with our Fastify backend API using optimistic updates. If the server responds with a 409 or 500, the form rolls back cleanly without jank.`,
  },
  {
    parentIdx: 9, // Go 1.23 inlining
    content: `And because the iteration closure function is inlined by the Go compiler, benchmarks show near-zero divergence compared to standard indexed for-loops.`,
  },
  {
    parentIdx: 10, // Keyboard BDZ feedback
    content: `That's the exact setup I use on all my custom builds now. Krytox 205g0 for switch stems, XHT-BDZ on the wire corners. Stays quiet for years.`,
  },
  {
    parentIdx: 11, // Homelab punchdown
    content: `Punching down 48 keystones is a great forearm workout! Color-coding by VLAN saves so much headache when diagnosing connection drops months later.`,
  },
  {
    parentIdx: 12, // Marcy Thermarest
    content: `The XTherm is a beast. Packed down to the size of a Nalgene bottle and kept me toasty warm even when frost covered the tent vestibule.`,
  },
  {
    parentIdx: 13, // Minimal Desk routing
    content: `That's the trick—keeping everything tucked tightly behind the gas spring strut. Makes cleaning dust off the desk surface so much easier too.`,
  },
  {
    parentIdx: 14, // Barbican sunset
    content: `The Barbican in wet weather is the best time to shoot concrete. The reflections off the terrace tiles give it that cinematic cyberpunk aesthetic.`,
  },
  {
    parentIdx: 15, // Challenger pan ice
    content: `Ice cubes under the parchment paper in a screaming hot Challenger pan is the cheat code for sourdough blistering! That thermal shock creates micro-bubbles instantly.`,
  },
  {
    parentIdx: 16, // SGI Dallas clock
    content: `Classic Dallas RTC issue! I dremeled into the top of the chip on mine to solder in a coin cell holder for CR2032s. Works like a charm now.`,
  },
  {
    parentIdx: 17, // Gaggia OPV 9 bar
    content: `9 bar extraction makes medium and light roasts taste sweet instead of harsh and astringent. Best $15 upgrade anyone can make to a Gaggia Classic.`,
  },
  {
    parentIdx: 18, // LSM leveled tradeoff
    content: `Agreed on the read tradeoff. That's why our hybrid strategy keeps Level 2+ strictly leveled so point lookups never have to search multiple sstables in the lower tiers.`,
  },
  {
    parentIdx: 26, // K8s preStop sleep
    content: `Exactly. It takes time for iptables rules to propagate across all worker nodes after an endpoint terminates. That 5 second grace period prevents dropped packets completely.`,
  },
  {
    parentIdx: 44, // SQLite Litestream
    content: `Litestream streaming WAL frames to Cloudflare R2 has been running in production for us for 8 months with zero downtime. Total hosting cost is under $5/month.`,
  },
];
