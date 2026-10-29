// Real Verifiable Tech News Announcements
export const realNewsItems = [
  {
    title: 'PostgreSQL 17 Released: Enhanced Query Optimization, Logical Replication Failover & Memory Efficiency',
    content: `The PostgreSQL Global Development Group has officially announced the release of PostgreSQL 17.

### Key Highlights
- **Vacuuming Memory Overhaul**: A new internal memory structure reduces vacuum memory consumption by up to 20x, minimizing shared-buffer contention.
- **Logical Replication Failover**: High availability failover control allows logical replication slots to seamlessly synchronize across physical standby nodes.
- **SQL/JSON JSON_TABLE**: Native support for the standard JSON_TABLE expression to query nested JSON arrays directly as tabular rows.
- **SIMD Acceleration**: AVX-512 vectorization enabled for bitset operations and B-tree page scans.

Source: Official announcement published by the PostgreSQL Global Development Group.`,
    destination_url: 'https://www.postgresql.org/about/news/postgresql-17-released-2722/',
    community_id: 'comm_database',
    community_slug: 'database-internals',
    flair: 'Official Release',
    tags: ['postgresql', 'database', 'sql', 'release'],
  },
  {
    title: 'Linux Kernel 6.12 LTS Released with Real-Time PREEMPT_RT Support and Sched_ext Scheduler',
    content: `Linus Torvalds has released Linux Kernel 6.12, selected as the 2024 Long Term Support (LTS) kernel release.

### Key Highlights
- **PREEMPT_RT in Mainline**: Real-time computing support is officially merged directly into mainline x86-64 and ARM64 architectures after two decades of development.
- **sched_ext BPF Scheduler**: Allows implementing and dynamically loading kernel task schedulers using eBPF programs in user-space without kernel recompilation.
- **DRM Panic Screen**: A built-in kernel panic handler capable of displaying visual QR codes and stack traces directly on graphics hardware when a panic occurs.

Source: The Linux Kernel Archives release notes by Linus Torvalds.`,
    destination_url: 'https://kernel.org',
    community_id: 'comm_linux',
    community_slug: 'linux-kernel',
    flair: 'Kernel Release',
    tags: ['linux', 'kernel', 'ebpf', 'realtime'],
  },
  {
    title: 'Rust 1.82.0 Released with Precise Capturing Syntax in use<..> and Native Cargo Info',
    content: `The Rust Project has published Rust 1.82.0, introducing stabilized language syntax and developer tooling improvements.

### Key Highlights
- **Precise Capturing (\`use<..>\`)**: Fine-grained lifetime and generic parameter capturing control for \`impl Trait\` return positions, resolving long-standing lifetime inference ambiguities.
- **Native \`cargo info\`**: Built-in cargo subcommand to inspect crate metadata, dependencies, and owners directly from the command line without third-party extensions.
- **Apple Target Promotion**: \`aarch64-apple-darwin\` and modern Apple targets promoted to higher support tiers with full compiler test coverage.

Source: Official release notes on the Rust Blog.`,
    destination_url: 'https://blog.rust-lang.org/2024/10/17/Rust-1.82.0.html',
    community_id: 'comm_systems',
    community_slug: 'systems',
    flair: 'Language Update',
    tags: ['rust', 'compiler', 'cargo', 'systems'],
  },
  {
    title: 'Python 3.13 Released with Experimental Free-Threaded Mode (No GIL) and Tier 1 JIT',
    content: `The Python Software Foundation has officially launched Python 3.13.0, representing one of the most consequential releases in the history of the language.

### Key Highlights
- **Free-Threaded CPython (PEP 703)**: Experimental build option that disables the Global Interpreter Lock (GIL), enabling true multi-core parallel execution in Python threads.
- **Interactive REPL Overhaul**: Modern terminal interface featuring syntax highlighting, multi-line editing, and colorized interactive tracebacks based on PyPy's design.
- **Tier 1 Just-In-Time (JIT) Compiler**: Baseline JIT compiler laying the foundation for substantial execution speedups in numerical and algorithmic workloads.

Source: Python Software Foundation official release notes.`,
    destination_url: 'https://www.python.org/downloads/release/python-3130/',
    community_id: 'comm_systems',
    community_slug: 'systems',
    flair: 'Runtime News',
    tags: ['python', 'concurrency', 'multithreading', 'jit'],
  },
  {
    title: 'WebGPU reaches W3C Candidate Recommendation for Next-Generation Web Graphics and Compute',
    content: `The W3C GPU for the Web Working Group has published WebGPU and the WebGPU Shading Language (WGSL) as Candidate Recommendations.

### Key Highlights
- **Modern GPU Hardware Access**: Direct low-overhead programming interface mirroring Vulkan, Metal, and DirectX 12 inside standard web browsers.
- **General-Purpose Compute (GPGPU)**: Native execution of compute shaders for machine learning inference, fluid simulations, and audio processing in client-side web apps.
- **Cross-Browser Adoption**: Ships natively across Chrome, Edge, and Firefox Nightly on Windows, macOS, Linux, and Android.

Source: World Wide Web Consortium (W3C) Technical Report specification.`,
    destination_url: 'https://www.w3.org/TR/webgpu/',
    community_id: 'comm_creative',
    community_slug: 'creative-coding',
    flair: 'Web Standards',
    tags: ['webgpu', 'wgsl', 'graphics', 'w3c'],
  },
  {
    title: 'SQLite 3.46.0 Released with Native JSONB Binary Representation and Optimization Improvements',
    content: `The SQLite Development Team has published SQLite version 3.46.0, introducing a major performance enhancement for embedded JSON workloads.

### Key Highlights
- **Native JSONB Storage**: Binary representation of JSON documents avoiding repeated string parsing during SQL filtering and extraction queries.
- **PRAGMA optimize Tuning**: Automated heuristic tracking of query patterns to maintain optimal index coverage on high-frequency tables.
- **Query Planner Benchmarks**: Up to 3.2x faster evaluation for deeply nested JSON array navigations.

Source: SQLite.org official changelog and release history.`,
    destination_url: 'https://sqlite.org/releaselog/3_46_0.html',
    community_id: 'comm_database',
    community_slug: 'database-internals',
    flair: 'Storage Engine',
    tags: ['sqlite', 'database', 'jsonb', 'performance'],
  },
  {
    title: 'Node.js 22 Promoted to Active Long-Term Support (LTS) Codename Jod',
    content: `The OpenJS Foundation has transitioned Node.js 22 into Active Long-Term Support (LTS) under the codename 'Jod', scheduled for enterprise maintenance through April 2027.

### Key Highlights
- **V8 12.4 Engine**: Includes WebAssembly Garbage Collection (WasmGC) support and array grouping methods.
- **Built-in WebSocket Client**: Standards-compliant WebSocket client enabled by default without third-party npm packages.
- **Synchronous ESM require()**: Support for loading ECMAScript modules synchronously via \`require()\` when no top-level await is present.

Source: OpenJS Foundation Node.js project release blog.`,
    destination_url: 'https://nodejs.org/en/blog/release/v22.0.0',
    community_id: 'comm_frontend',
    community_slug: 'frontend',
    flair: 'Platform LTS',
    tags: ['nodejs', 'javascript', 'backend', 'lts'],
  },
  {
    title: 'TypeScript 5.6 Released with Disallowed Nullish Checks and Iterator Helper Methods',
    content: `Microsoft Developer Tools has announced the general availability of TypeScript 5.6.

### Key Highlights
- **Disallowed Nullish and Truthy Checks**: Syntax errors are now raised when syntax patterns like \`if (/regex/)\` or \`x => true\` are erroneously used where expressions are always truthy.
- **Iterator Helpers Support**: Types and method definitions for standard ECMAScript Iterator methods (\`map\`, \`filter\`, \`take\`, \`drop\`, \`flatMap\`).
- **Project Reference Speedups**: Substantial reductions in memory usage and parsing latency for large monorepos building in \`--build\` mode.

Source: Microsoft TypeScript Official Blog by Daniel Rosenwasser.`,
    destination_url: 'https://devblogs.microsoft.com/typescript/announcing-typescript-5-6/',
    community_id: 'comm_frontend',
    community_slug: 'frontend',
    flair: 'Tooling News',
    tags: ['typescript', 'frontend', 'developer-tools'],
  },
  {
    title: 'React 19 Reaches General Availability: Server Actions, Asset Loading & Document Metadata',
    content: `The React team has officially tagged React 19 as Generally Available, stabilizing long-awaited concurrency and server features.

### Key Highlights
- **Actions & useActionState**: First-class support for handling pending states, errors, optimistic updates, and form submissions automatically.
- **Native Document Metadata**: Built-in support for rendering \`<title>\`, \`<meta>\`, and stylesheet tags anywhere in the component hierarchy with automatic hoisting.
- **Asset Preloading Primitives**: APIs like \`preload\` and \`preinit\` to coordinate script and stylesheet loading before render phases.

Source: React Official Blog announcement.`,
    destination_url: 'https://react.dev/blog/2024/04/25/react-19',
    community_id: 'comm_frontend',
    community_slug: 'frontend',
    flair: 'Framework GA',
    tags: ['react', 'webdev', 'frontend', 'components'],
  },
  {
    title: 'Go 1.23 Released with Range-Over-Func Iterators and Generic Aliases',
    content: `The Go Team has published Go version 1.23, featuring standard language support for custom iterators.

### Key Highlights
- **Range-Over-Func**: The \`for range\` loop now directly accepts iterator functions yielding one or two values, simplifying custom collection traversal.
- **Timer & Ticker Memory Fixes**: \`time.Timer\` and \`time.Ticker\` values that are no longer referenced are automatically collected by the garbage collector without requiring explicit \`Stop()\` calls.
- **Telemetry Preview**: Opt-in architecture telemetry to help the Go team understand toolchain compiler performance in real-world workloads.

Source: The Go Programming Language official documentation.`,
    destination_url: 'https://go.dev/doc/go1.23',
    community_id: 'comm_systems',
    community_slug: 'systems',
    flair: 'Language Release',
    tags: ['golang', 'iterators', 'tooling', 'backend'],
  },
];

// Multi-Image Post Definitions (8 posts, each with 3 coherent photos from verified pool)
export const multiImagePosts = [
  {
    title: 'Weekend custom 65% mechanical keyboard build: brass plate, lubed linear switches & coiled cable',
    content: `Spent Saturday assembling a custom 65% mechanical keyboard from scratch. 
    
### Build Specifications:
- **Case**: CNC milled frosted polycarbonate case with brass weight bar.
- **Plate**: Mirror-polished brass switch plate for a crisp, clacky acoustic profile.
- **Switches**: Hand-lubed Gateron Oil Kings (Krytox 205g0 on stems/housings, 105 on springs).
- **Keycaps**: PBT dye-sublimated chalk keycaps with cherry profile.
- **PCB**: Hotswap PCB with tape mod (3 layers painter tape) and poron plate foam.

The typing feel is remarkably solid with zero case ping. Sharing 3 photos from the assembly process!`,
    community_id: 'comm_design',
    community_slug: 'design',
    flair: 'Hardware Build',
    tags: ['mechanicalkeyboards', 'desksetup', 'diy', 'hardware'],
    photoKeys: [
      { id: 'photo-1587614382346-4ec70e388b28', alt: 'Custom 65 percent mechanical keyboard with dye-sub keycaps on desk' },
      { id: 'photo-1517420704952-d9f39e95b43e', alt: 'Soldering switches and inspecting PCB traces under work lamp' },
      { id: 'photo-1507238691740-187a5b1d37b8', alt: 'Completed mechanical keyboard integrated into clean minimal workspace' },
    ],
  },
  {
    title: 'Homelab overhaul: Re-cabling a 12U network rack with color-coded Cat6A slim patch cords and 10GbE SFP+ DACs',
    content: `Finally tackled the cable rats-nest in my basement homelab rack. 

### What was updated:
1. Replaced bulky 24AWG patch cords with 28AWG ultra-slim Cat6A patch cables.
2. Added two 24-port keystone blank patch panels with brush feed-through bars.
3. Connected the core switch to the Proxmox virtualization cluster via 10GbE SFP+ Direct Attach Copper (DAC) cables.
4. Labeled both ends of every run using Brady heat-shrink wire markers.

The airflow improved immediately, and idle temps on the switch dropped by 4°C!`,
    community_id: 'comm_infra',
    community_slug: 'cloud-native',
    flair: 'Homelab',
    tags: ['homelab', 'networking', 'sysadmin', 'hardware'],
    photoKeys: [
      { id: 'photo-1550751827-4bd374c3f58b', alt: 'Server rack cable management with color-coded Ethernet cabling' },
      { id: 'photo-1544197150-b99a580bb7a8', alt: 'Front chassis view of 1U servers with blinking activity indicators' },
      { id: 'photo-1563986768609-322da13575f3', alt: 'Clean patch bay terminations and brush panel cable combs' },
    ],
  },
  {
    title: 'Autumn backpacking through Adirondack High Peaks: 3 days, 26 miles, and sub-freezing mountain summits',
    content: `Completed a solo 3-day backpacking loop through the Adirondack High Peaks wilderness this past weekend. 

The fall foliage was peak at lower elevations, but above tree-line on Mount Marcy, rime ice and 40mph gusts made for a rigorous, exhilarating traverse. 

### Gear highlights:
- Ultralight 20F quilt kept me warm through a 22F overnight camp.
- Sawyer Squeeze inline filter with Platypus bladder worked flawlessly despite near-freezing creek temps.
- Fuji X-T4 with 23mm f/2 lens carried on a shoulder strap clip.

Here are 3 snapshots from the trail, the rocky summit, and the evening camp!`,
    community_id: 'comm_photography',
    community_slug: 'photography',
    flair: 'Outdoor Journal',
    tags: ['hiking', 'backpacking', 'mountains', 'nature', 'photography'],
    photoKeys: [
      { id: 'photo-1464822759023-fed622ff2c3b', alt: 'Granite mountain peaks rising above morning alpine cloud inversion' },
      { id: 'photo-1503676260728-1c00da094a0b', alt: 'Hiker standing on rocky overlook taking in expansive mountain vistas' },
      { id: 'photo-1470071459604-3b5ec3a7fe05', alt: 'Dense evergreen forest trail shrouded in peaceful morning autumn fog' },
    ],
  },
  {
    title: 'My minimalist ergonomic desk setup for 2026: dual 27-inch 4K panels, walnut riser, and zero visible cables',
    content: `After working remotely for 4 years, I iterated on my desk to solve neck fatigue and visual clutter.

### Key Setup Choices:
- **Displays**: Dual LG 27-inch 4K USB-C monitors mounted on heavy-duty gas spring arms. One landscape, one portrait for terminal logs and documentation.
- **Riser**: Custom American walnut monitor shelf with felt-lined drawers for dongles and hard drives.
- **Lighting**: BenQ screenbar light with ambient rear bias lighting dialed to 3000K warm white.
- **Cable Management**: Under-desk steel cable tray with magnetic zip ties and an Anker 100W GaN charging hub.

Zero wires touch the floor, and having the code editor in vertical mode has made reviewing pull requests so much more enjoyable.`,
    community_id: 'comm_design',
    community_slug: 'design',
    flair: 'Workspace',
    tags: ['desksetup', 'workspace', 'ergonomics', 'minimalism'],
    photoKeys: [
      { id: 'photo-1593642632823-8f785ba67e45', alt: 'Minimalist clean matte black desk setup with dual displays on arms' },
      { id: 'photo-1527689368864-3a821dbccc34', alt: 'Warm ambient backlighting behind dual monitors in evening study session' },
      { id: 'photo-1555066931-4365d14bab8c', alt: 'Close-up of syntax-highlighted code editor on vertical monitor' },
    ],
  },
  {
    title: 'Photo walk through Barbican Estate: documenting concrete formwork, elevated walkways, and barrel-vault roofs',
    content: `Spent Sunday afternoon with my 35mm rangefinder walking through London's Barbican Estate.

The architects (Chamberlin, Powell and Bon) used bush-hammered concrete that reveals rough granite aggregate underneath. When late-afternoon October light strikes the bush-hammered balconies at an angle, the shadows create incredible abstract geometric compositions.

Here are 3 studies focusing on the cantilevered walkway bridges, spiral stairs, and reflecting lake.`,
    community_id: 'comm_photography',
    community_slug: 'photography',
    flair: 'Architecture Study',
    tags: ['brutalism', 'architecture', 'monochrome', 'london'],
    photoKeys: [
      { id: 'photo-1479839672679-a46483c0e7c8', alt: 'Monolithic raw concrete cantilevered balconies with sharp angular shadows' },
      { id: 'photo-1533158307587-828f0a76ef46', alt: 'Sweeping spiral concrete ramp and elevated walkway geometric pattern' },
      { id: 'photo-1517581177682-a085bb7ffb15', alt: 'Board-formed concrete staircase textures under diffused natural light' },
    ],
  },
  {
    title: 'Mastering the weekend country sourdough loaf: 82% hydration, 18-hour cold retard, and open crumb structure',
    content: `After months of dense, gummy loaves, I finally nailed the fermentation timing on high-hydration sourdough.

### Formula and Schedule:
- **Flour**: 80% King Arthur Bread Flour, 15% Whole Wheat, 5% Dark Rye.
- **Hydration**: 82% water with 20% ripe levain (100% hydration) and 2.1% sea salt.
- **Bulk Fermentation**: 4.5 hours at 78°F with 4 sets of coil folds every 45 minutes.
- **Cold Retard**: 18 hours at 38°F in a wood-pulp banneton dusted with rice flour.
- **Bake**: Preheated Challenger bread pan at 475°F for 20 min covered, 22 min uncovered at 450°F.

The blistered crust crackled like crazy as it cooled on the wire rack!`,
    community_id: 'comm_creative',
    community_slug: 'creative-coding',
    flair: 'Baking',
    tags: ['sourdough', 'baking', 'fermentation', 'food', 'lifestyle'],
    photoKeys: [
      { id: 'photo-1559925393-8be0ec4767c8', alt: 'Golden blistered country sourdough loaf fresh from the cast iron oven' },
      { id: 'photo-1565299624946-b28f40a0ae38', alt: 'Artisan sourdough pizza dough fermentation bubbles and airy structure' },
      { id: 'photo-1476224203421-9ac39bcb3327', alt: 'Sliced artisanal sourdough loaf displaying open aerated gelatinized crumb' },
    ],
  },
  {
    title: 'Restoring a vintage SGI Indy workstation: recapping power supply, SCSI drive emulation, and booting IRIX 6.5',
    content: `Acquired an original 1994 Silicon Graphics Indy workstation in its iconic teal pizza-box chassis. 

### Restoration log:
1. **Power Supply**: Full electrolytic recap of the Sony power supply. The old Nichicon caps had begun leaking corrosive electrolyte onto the board.
2. **Storage**: Replaced the screaming 2GB Seagate Barracuda SCSI drive with a modern SCSI2SD v6 emulator loading off an industrial microSD card.
3. **Graphics**: Newport 24-bit XL graphics board cleaned with isopropyl alcohol and new thermal pads.
4. **OS**: Performed a fresh network installation of IRIX 6.5.22 via BOOTP/TFTP from a Raspberry Pi netboot server.

Booting into the SGI 4Dwm desktop for the first time was pure nostalgia. 3 photos of the chassis, motherboard, and desktop!`,
    community_id: 'comm_systems',
    community_slug: 'systems',
    flair: 'Retrocomputing',
    tags: ['sgi', 'irix', 'retrocomputing', 'unix', 'vintage'],
    photoKeys: [
      { id: 'photo-1550745165-9bc0b252726f', alt: 'Vintage retro unix terminal workstation powered on with CRT display' },
      { id: 'photo-1518770660439-4636190af475', alt: 'Close-up of RISC microprocessor silicon and motherboard circuit traces' },
      { id: 'photo-1525547719571-a2d4ac8945e2', alt: 'Bench testing vintage computer board with logic probe and serial console' },
    ],
  },
  {
    title: 'Espresso bar upgrade: Adding a custom Arduino PID temperature controller to a Gaggia Classic Pro',
    content: `Temperature stability is the Achilles heel of single-boiler espresso machines. The stock bi-metal thermostat has a massive 25°F deadband that produces erratic extraction flavors.

### Project Breakdown:
- **Controller**: Arduino Nano running an adaptive PID loop with anti-windup.
- **Sensor**: PT100 RTD sensor mounted directly to the aluminum boiler wall with thermal paste.
- **Relay**: Fotek 25A Solid State Relay (SSR) pulsing the heating element.
- **Display**: Tiny 0.91-inch I2C monochrome OLED screen discretely recessed inside the drip tray recess.

Brew temperature now locks onto 200.5°F within ±0.3°F. My light-roast Ethiopian shots are finally extracting balanced floral acidity with zero bitter astringency!`,
    community_id: 'comm_design',
    community_slug: 'design',
    flair: 'Coffee & Modding',
    tags: ['espresso', 'coffee', 'arduino', 'diy', 'hardware'],
    photoKeys: [
      { id: 'photo-1495474472287-4d71bcdd2085', alt: 'Specialty pour-over and espresso bar setup on oiled butcher-block counter' },
      { id: 'photo-1511920170033-f8396924c348', alt: 'Bottomless portafilter extracting rich golden espresso crema into ceramic cup' },
      { id: 'photo-1442512595331-e89e73853f31', alt: 'Weighing single-dose coffee beans before precision hand burr grinding' },
    ],
  },
];
