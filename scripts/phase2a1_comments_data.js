// 65 Contextual Root Comments tailored to specific posts with natural, varied styles and tones
export const contextualRootComments = [
  // 0-9: Tech News Comments (natural reactions, practical questions, and real experience)
  {
    targetIndex: 0, // [0] PostgreSQL 17
    content: `The vacuum memory reduction alone makes this a huge release. We routinely had autovacuum worker processes spike into several gigs of memory during large table updates on PG 15. Excited to test this in our staging environment.`,
  },
  {
    targetIndex: 1, // [1] Linux 6.12 LTS
    content: `Having PREEMPT_RT merged directly into mainline is massive for robotics. Maintaining out-of-tree patchsets that broke with every minor kernel update was such a headache for our embedded team.`,
  },
  {
    targetIndex: 2, // [2] Rust 1.82
    content: `The \`use<..>\` precise capturing syntax finally gets rid of those cryptic 'hidden type captures lifetime' compiler errors with async traits. Clean improvement.`,
  },
  {
    targetIndex: 3, // [3] Python 3.13
    content: `Tested our numerical matrix scripts on the 3.13 free-threaded build yesterday. Spawning 16 OS threads actually gave us linear speedups without needing multiprocessing IPC. Feels surreal seeing Python utilize all cores natively.`,
  },
  {
    targetIndex: 4, // [4] WebGPU
    content: `The compute shader capabilities in WebGPU are such a step up from WebGL hacks. Finally feeling like browser graphics is caught up with modern hardware.`,
  },
  {
    targetIndex: 5, // [5] SQLite 3.46
    content: `JSONB in SQLite is a big deal for local embedded apps. Querying binary json rather than parsing strings on every filter cut our local search latency in half.`,
  },
  {
    targetIndex: 6, // [6] Node.js 22 LTS
    content: `Synchronous ESM require() has saved us so much friction when migrating older CommonJS libraries. Glad native WebSockets are enabled by default now too.`,
  },
  {
    targetIndex: 7, // [7] TypeScript 5.6
    content: `The disallowed truthy regex check (\`if (/regex/)\`) immediately caught two silly typos in our checkout form validation code on our first compile run haha.`,
  },
  {
    targetIndex: 8, // [8] React 19
    content: `useActionState simplifies form pending states so much. Being able to declare optimistic updates without managing five separate useState flags is really nice.`,
  },
  {
    targetIndex: 9, // [9] Go 1.23
    content: `Range-over-func iterators feel very natural in Go. Iterating over custom tree structures without allocating intermediate slices is great.`,
  },

  // 10-17: Multi-Image Posts Comments
  {
    targetIndex: 10, // [10] Mechanical Keyboard
    content: `That brass plate finish looks incredible! Did you use Krytox 205g0 for the stabilizers or XHT-BDZ on the wire bends? I found BDZ prevents ticking way longer on the spacebar.`,
  },
  {
    targetIndex: 11, // [11] Homelab Rack
    content: `Those slim Cat6A patch cords make such a difference for rack airflow. Did you punch down the keystones yourself or buy pre-made lengths?`,
  },
  {
    targetIndex: 12, // [12] Backpacking
    content: `Mount Marcy in October is serious business! What sleeping pad R-value did you bring? Cold ground usually gets you before the air temp does.`,
  },
  {
    targetIndex: 13, // [13] Minimal Desk
    content: `That vertical monitor setup is so clean. How did you route the display cables behind the desk arm?`,
  },
  {
    targetIndex: 14, // [14] Barbican Walk
    content: `That second photo with the water court reflection captures the rough concrete texture so well. The Barbican is timeless.`,
  },
  {
    targetIndex: 15, // [15] Sourdough
    content: `That blistered crust is gorgeous! Did you bake in a Dutch oven or an open steel with lava rocks for steam?`,
  },
  {
    targetIndex: 16, // [16] SGI Octane
    content: `Seeing the IRIX desktop brings back so many memories of our university graphics lab. That teal chassis is pure industrial art. Did the power supply need recapping?`,
  },
  {
    targetIndex: 17, // [17] Espresso PID
    content: `Adding a PID to the Gaggia is hands down the best upgrade. Completely eliminates temperature surfing. Did you swap the OPV spring to 9 bar as well?`,
  },

  // 18-29: Developer & Systems Posts Comments
  {
    targetIndex: 18, // [18] LSM compaction
    content: `We saw similar write amplification issues in Cassandra. Tiered compaction works wonders for write bursts, but definitely keep an eye on disk headroom during major compaction merges.`,
  },
  {
    targetIndex: 19, // [19] B-link tree
    content: `Lehman-Yao is such an elegant algorithm. Avoiding read latches on internal nodes completely gets rid of cache-line bouncing on root pages across CPU sockets.`,
  },
  {
    targetIndex: 20, // [20] io_uring SQPOLL
    content: `Keep in mind SQPOLL pins a CPU core at 100% busy-looping while waiting for submissions. If traffic drops to zero, that core is still burning cycles unless you tune \`sq_thread_idle\`.`,
  },
  {
    targetIndex: 21, // [21] eBPF XDP
    content: `Dropping packets at the XDP driver level before the kernel allocates an sk_buff is really the only way to survive massive UDP floods on commodity hardware.`,
  },
  {
    targetIndex: 22, // [22] Distributed locks
    content: `Moving away from distributed locks toward causal versioning took our team a lot of discipline, but it eliminated almost all of our deadlock alerts.`,
  },
  {
    targetIndex: 30, // [30] React hydration mismatch
    content: `V8 heap snapshots and AST lint rules saved us last month. Turned out an unclosed event listener in our WebSocket auth handler was keeping thousands of user session objects alive.`,
  },
  {
    targetIndex: 58, // [58] Container Queries
    content: `Container queries completely changed how we build reusable card components. No more passing arbitrary \`size="compact"\` props from parent containers.`,
  },
  {
    targetIndex: 54, // [54] Microkernels
    content: `Message passing overhead in microkernels has come a long way with modern IPC fast-paths that pass register state directly without context switching.`,
  },
  {
    targetIndex: 25, // [25] Kubernetes operators
    content: `Graceful shutdown with \`preStop\` sleep hooks is crucial. If you don't give kube-proxy 5 seconds to drain endpoints from iptables, you will get dropped TCP connections on every rolling update.`,
  },
  {
    targetIndex: 29, // [29] CSS subgrid
    content: `Subgrid makes multi-column card alignment look so much more deliberate. No more jagged title rows across card items.`,
  },
  {
    targetIndex: 31, // [31] Fluid typography
    content: `The accessibility point is critical. So many clamp() tutorials online use pure vw slopes that completely break when users increase browser zoom.`,
  },
  {
    targetIndex: 26, // [26] OpenTelemetry trace sampling
    content: `Tail-based sampling in OpenTelemetry Collector was an instant win for us. Capturing 100% of errors while downsampling healthy 200s cut our ingest bills dramatically.`,
  },
  {
    targetIndex: 45, // [45] Rust async runtimes
    content: `Hashed hierarchical timer wheels are so much lighter on memory than binary heap priority queues when you have 500k idle TCP connections.`,
  },
  {
    targetIndex: 46, // [46] Lock-free memory reclamation
    content: `Epoch-Based Reclamation is great for throughput, but the memory unboundedness hazard if a single reader thread stalls is real. Hazard pointers are safer if threads can stall on I/O.`,
  },
  {
    targetIndex: 47, // [47] SIMD vector search
    content: `AVX-512 FMA instructions for cosine distance calculations give you an unbelievable throughput boost. Vector search is one of the clearest wins for SIMD.`,
  },
  {
    targetIndex: 48, // [48] Speculative decoding
    content: `Speculative decoding pairing a 1B draft model with a 70B target model cut our p99 token latency in half on coding prompts. Very practical optimization.`,
  },
  {
    targetIndex: 49, // [49] RoCE v2 deadlocks
    content: `PFC pause deadlocks in RoCE v2 clusters are terrifying to debug. If buffer queues fill circular across leaf switches, the whole fabric just freezes.`,
  },
  {
    targetIndex: 50, // [50] Blocked bloom filters
    content: `Restricting bloom filter bit probes to a single 64-byte L1 cache line doubles lookup speed. Perfect tradeoff for LSM indexes.`,
  },
  {
    targetIndex: 51, // [51] Postgres vacuuming
    content: `In-page vacuuming removing dead tuples during ordinary SELECT queries when space is available on the 8KB page is one of Postgres's neatest subtle optimizations.`,
  },
  {
    targetIndex: 52, // [52] Redis lock contention
    content: `Salting key hash slots to distribute high-cardinality counters across Redis cluster shards is a classic pattern that solves CPU core saturation nicely.`,
  },

  // 38-44: Relatable Developer Experiences & War Stories Comments
  {
    targetIndex: 38, // [38] Typo in env var
    content: `Haha I feel this in my soul. Spent 3 hours yesterday wondering why my database connection refused until I realized I wrote \`PORT= 5432\` with a space.`,
  },
  {
    targetIndex: 39, // [39] ThinkCentre homelab
    content: `Those 1L tiny PCs like the ThinkCentre M720q or Elitedesk 800 G4 are incredible value. Quiet, 15W idle, and 64GB RAM for under $200 on eBay.`,
  },
  {
    targetIndex: 40, // [40] Redux to hook
    content: `100%. Redux was great in 2017, but for 90% of apps, a simple custom hook or URL query param store is infinitely easier to maintain.`,
  },
  {
    targetIndex: 41, // [41] Notion to Markdown
    content: `Moved all our team docs to a \`/docs\` folder in the main git repo last year. Having docs versioned alongside code and reviewed in PRs was an instant upgrade.`,
  },
  {
    targetIndex: 42, // [42] Local HTTPS with mkcert
    content: `mkcert is genuinely one of the best developer experience tools ever created. Zero browser certificate warnings in local dev.`,
  },
  {
    targetIndex: 43, // [43] Bash vs Zsh
    content: `Did the exact same thing last month! Stripped down my bashrc to the essentials. Terminal opens instantly with zero lag.`,
  },
  {
    targetIndex: 44, // [44] SQLite in production
    content: `SQLite with WAL mode and busy_timeout=5000ms handles internal company dashboards and small SaaS apps with zero drama. Backups are literally just copying a file.`,
  },

  // 45-50: Lifestyle Posts Comments
  {
    targetIndex: 68, // [68] First snow in Montreal
    content: `Nothing beats that first quiet morning walk after fresh snowfall. Café Olimpico is legendary too!`,
  },
  {
    targetIndex: 69, // [69] Rescue cat Jasper
    content: `Welcome home Jasper! Rescue cats have the best personalities once they feel safe. He looks so cozy.`,
  },
  {
    targetIndex: 71, // [71] Learning guitar
    content: `The F chord is the great filter of guitar playing! Once your hand builds that muscle memory, barre chords become second nature. Keep at it!`,
  },
  {
    targetIndex: 73, // [73] Balcony garden
    content: `Fresh homegrown basil hits completely different. Nothing from the grocery store comes close to that aroma.`,
  },
  {
    targetIndex: 75, // [75] Olympus OM-1 flea market
    content: `Finding a working OM-1 with a clean Zuiko 50mm f/1.8 for $40 is an absolute steal! The viewfinder on that camera is massive.`,
  },
  {
    targetIndex: 81, // [81] Desk restoration
    content: `That hand-rubbed Danish oil brought the oak grain right back to life! Beautiful restoration.`,
  },

  // 51-64: Community Questions Comments
  {
    targetIndex: 113, // [113] CLI tools
    content: `For me it's \`ncdu\` for disk usage and \`ripgrep\`. The speed of ripgrep across million-line repos ruined standard grep for me forever.`,
  },
  {
    targetIndex: 114, // [114] Zero downtime migrations
    content: `Expand-and-contract pattern every time. Add nullable column, start writing to both, backfill in batches, switch reads, drop old column. Slower, but zero downtime.`,
  },
  {
    targetIndex: 115, // [115] Ergonomic upgrade
    content: `A good heavy-duty monitor arm that lets you position the screen at actual eye level. Stopped me from slouching and completely fixed my neck pain.`,
  },
  {
    targetIndex: 117, // [117] Film stock choice
    content: `Tri-X 400 rated at 800 and pushed one stop in D-76. In flat grey light, you need that extra punchy contrast and toothy grain.`,
  },
  {
    targetIndex: 119, // [119] Self hosted winner
    content: `Vaultwarden hands down. Runs on 25MB of RAM on my home server and syncs passwords across all devices flawlessly.`,
  },
  {
    targetIndex: 120, // [120] Language feature click
    content: `Rust's \`Result<T, E>\` combined with the \`?\` operator. Error handling suddenly felt like part of the normal program flow rather than an afterthought.`,
  },
  {
    targetIndex: 123, // [123] Mechanical keyboard switch
    content: `Boba U4T 62g tactiles. Clean tactile bump right at the top of the keystroke with zero mushiness. Never going back to linears for coding.`,
  },
  {
    targetIndex: 124, // [124] React state
    content: `URL search params for filter/search state + TanStack Query for server cache. We barely write any global client state anymore.`,
  },
  {
    targetIndex: 126, // [126] Coffee hopper
    content: `Currently brewing a natural processed Ethiopian from Sey Coffee. Strawberry jam and jasmine notes on the V60 at 93°C.`,
  },
  {
    targetIndex: 128, // [128] Ultrawide vs Dual
    content: `Switched from dual 27" to a single 34" curved ultrawide. Having editor and browser side-by-side with zero bezel down the middle is so much more cohesive.`,
  },
  {
    targetIndex: 129, // [129] Fast integration tests
    content: `We run tests against a single persistent local Postgres database instance using transactional rollbacks between test cases. Sub-second runtimes with real DB verification.`,
  },
  {
    targetIndex: 131, // [131] Street focal length
    content: `35mm. Wide enough to capture environmental context, but tight enough that you don't distort faces when you step in close.`,
  },
  {
    targetIndex: 138, // [138] Dark mode palette
    content: `Dark tinted zinc (#18181b) over pure #000000. True black has way too much contrast on bright desktop displays and causes harsh eye strain.`,
  },
  {
    targetIndex: 139, // [139] Book recommendation
    content: `*Designing Data-Intensive Applications* by Martin Kleppmann. Explains the actual engineering trade-offs behind consensus, replication, and storage without academic fluff.`,
  },
];
