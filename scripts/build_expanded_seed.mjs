import fs from 'node:fs';
import path from 'node:path';

const extraUsers = [
  { id: 'usr_20', username: 'vikram_db', name: 'Vikram Patel', bio: 'Storage engine architect • LSM compaction heuristics, B-link concurrent indexes, and zero-allocation IO buffers in C++ and Zig', verified: true, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200' },
  { id: 'usr_21', username: 'clara_lsm', name: 'Clara Schmidt', bio: 'Distributed database researcher • Raft log replication, write-ahead logging durability, and ACID guarantees under partitioned networks', verified: true, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200', banner: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200' },
  { id: 'usr_22', username: 'torsten_wal', name: 'Torsten Lind', bio: 'Database performance engineer • optimizing direct I/O throughput on NVMe arrays, io_uring ring-buffers, and memory-mapped page caches', verified: false, avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200', banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200' },
  { id: 'usr_23', username: 'mei_kv', name: 'Mei Zhang', bio: 'Key-value engine author • lock-free skiplists, cache-conscious hash tables, and probabilistic filter optimizations', verified: false, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200', banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200' },
  { id: 'usr_24', username: 'devin_ai', name: 'Devin Vance', bio: 'AI cluster infrastructure engineer • GPU interconnect topologies, RoCE v2 congestion control, and distributed training telemetry', verified: true, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200' },
  { id: 'usr_25', username: 'zara_tensor', name: 'Zara Al-Mansoor', bio: 'Model serving compiler specialist • quantization kernels, FP8 matrix multiplies, and p99 token generation latency reduction', verified: true, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200', banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200' },
  { id: 'usr_26', username: 'arjun_ml', name: 'Arjun Rao', bio: 'Vector database engineer • HNSW graph indexing, SIMD cosine similarity, and scalable nearest neighbor retrieval', verified: false, avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200', banner: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200' },
  { id: 'usr_27', username: 'selena_model', name: 'Selena Gomez-Cruz', bio: 'Inference runtime engineer • continuous batching, speculative decoding pipelines, and multi-tenant GPU memory isolation', verified: false, avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200', banner: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200' },
  { id: 'usr_28', username: 'nathan_sec', name: 'Nathan Drake', bio: 'Platform security researcher • side-channel mitigations, hardware enclaves, memory-safe primitives, and formal audit logs', verified: true, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200', banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200' },
  { id: 'usr_29', username: 'roxana_crypto', name: 'Roxana Petrescu', bio: 'Applied cryptographer • zero-knowledge circuit optimization, threshold signatures, and post-quantum key exchange algorithms', verified: true, avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200', banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200' },
  { id: 'usr_30', username: 'klaus_zero', name: 'Klaus Weber', bio: 'Zero-trust infrastructure architect • mTLS mesh networks, SPIFFE identities, and hardware security module orchestration', verified: false, avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200', banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200' },
  { id: 'usr_31', username: 'leila_auth', name: 'Leila Moradi', bio: 'Authentication protocol engineer • WebAuthn passkeys, FIDO2 biometric authentication flows, and token revocation cascades', verified: false, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200', banner: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200' },
  { id: 'usr_32', username: 'omar_cloud', name: 'Omar Farooq', bio: 'Distributed infrastructure lead • multi-cloud Kubernetes control planes, cross-region ingress, and zero-downtime failovers', verified: true, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200', banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200' },
  { id: 'usr_33', username: 'brigitte_sre', name: 'Brigitte Moreau', bio: 'Chaos engineering & SRE specialist • fault injection experiments, automated rollback heuristics, and graceful load shedding', verified: true, avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200', banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200' },
  { id: 'usr_34', username: 'dmitri_k8s', name: 'Dmitri Sokolov', bio: 'Cloud native systems hacker • writing custom Kubernetes operators in Go, eBPF packet routing, and network policy enforcement', verified: false, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', banner: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200' },
  { id: 'usr_35', username: 'tessa_raft', name: 'Tessa van Dijk', bio: 'Consensus protocol implementer • joint consensus reconfigurations, linearizable state machines, and Byzantine fault simulation', verified: true, avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=200', banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200' },
  { id: 'usr_36', username: 'gabriel_wasm', name: 'Gabriel Costa', bio: 'WebAssembly runtime engineer • porting audio DSP pipelines to WASM threads, SIMD vectorization, and SharedArrayBuffer memory layouts', verified: true, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', banner: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200' },
  { id: 'usr_37', username: 'yuki_dom', name: 'Yuki Takahashi', bio: 'Browser rendering engine enthusiast • layout thrashing diagnostics, compositing layers, and 120fps CSS paint worklets', verified: false, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200', banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200' },
  { id: 'usr_38', username: 'anika_css', name: 'Anika Roy', bio: 'CSS specifications & typographic layout designer • container queries, fluid typography clamps, and accessible micro-layouts', verified: true, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200', banner: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200' },
  { id: 'usr_39', username: 'callum_v8', name: 'Callum MacLeod', bio: 'V8 internals & JIT compilation researcher • analyzing hidden class transitions, inline caches, and GC pause time reduction', verified: false, avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200', banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200' },
  { id: 'usr_40', username: 'simon_shader', name: 'Simon Gauthier', bio: 'Generative artist & GLSL shader programmer • raymarching Signed Distance Fields, volumetric atmospheric scattering, and procedural noise', verified: true, avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200', banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200' },
  { id: 'usr_41', username: 'nadia_flow', name: 'Nadia Benali', bio: 'Creative technologist • Navier-Stokes fluid simulations in WebGPU, particle vector fields, and generative audio-visual systems', verified: false, avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200', banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200' },
  { id: 'usr_42', username: 'orion_ray', name: 'Orion Vance', bio: 'Real-time ray tracing & compute shader specialist • bounding volume hierarchies, Monte Carlo path tracing on the web', verified: false, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200' },
  { id: 'usr_43', username: 'freja_gl', name: 'Freja Nielsen', bio: 'Interactive graphics programmer • WebGPU compute shaders, procedural terrain generation, and non-photorealistic rendering', verified: true, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200', banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200' },
  { id: 'usr_44', username: 'mateo_raw', name: 'Mateo Morales', bio: 'Industrial architecture photographer • documenting post-war concrete grain elevators, brutalist radio towers, and raw textures', verified: true, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200', banner: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200' },
  { id: 'usr_45', username: 'ingrid_mono', name: 'Ingrid Bergman', bio: 'Monochrome architectural purist • large format 4x5 film, tilt-shift perspective correction, and high-contrast brutalist shadows', verified: true, avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200', banner: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200' },
  { id: 'usr_46', username: 'samir_form', name: 'Samir Kassam', bio: 'Urban structural photographer • geometric facade alignments, suspended bridge cables, and industrial railway architecture', verified: false, avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200', banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200' },
  { id: 'usr_47', username: 'zoe_iso', name: 'Zoe Laurent', bio: 'Brutalist concrete & geometric architecture • documenting Barbican, Habitat 67, and monumental Soviet modernist structures', verified: false, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200', banner: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200' },
  { id: 'usr_48', username: 'hassan_arm', name: 'Hassan Al-Husseini', bio: 'ARM64 kernel engineer • cache coherency across heterogeneous cores, memory barrier semantics, and bootloader bring-up', verified: true, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200', banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200' },
  { id: 'usr_49', username: 'olga_bpf', name: 'Olga Voronova', bio: 'Linux eBPF kernel hacker • writing XDP network drivers, CO-RE BTF relocations, and kernel tracing tools', verified: true, avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200', banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200' },
  { id: 'usr_50', username: 'piotr_riscv', name: 'Piotr Wisniewski', bio: 'RISC-V hardware & toolchain developer • instruction set extensions, FPGA emulation, and LLVM backend targeting', verified: false, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', banner: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200' },
  { id: 'usr_51', username: 'brenda_pcie', name: 'Brenda O’Connor', bio: 'High-speed hardware interconnect engineer • PCIe Gen 5 protocol analyzers, CXL memory expansion, and DMA controller drivers', verified: false, avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=200', banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200' },
  { id: 'usr_52', username: 'linus_forth', name: 'Linus Hallberg', bio: 'Forth language preservationist & stack machine builder • bootstrapping threaded code on bare-metal Z80 microprocessors', verified: false, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', banner: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200' },
  { id: 'usr_53', username: 'astrid_llvm', name: 'Astrid Lindgren-Smith', bio: 'Compiler engineer • LLVM optimization passes, polyhedral loop transformations, and static single assignment analysis', verified: true, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200', banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200' },
  { id: 'usr_54', username: 'diego_68k', name: 'Diego Ramirez', bio: 'Amiga & Motorola 68000 systems archivist • Copper coprocessor copperlists, planar graphics hardware, and demoscene coding', verified: false, avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200', banner: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200' },
  { id: 'usr_55', username: 'valerie_retro', name: 'Valerie Dupuis', bio: 'Vintage workstation restorer • SGI IRIX graphics pipelines, DEC Alpha workstations, and SCSI bus termination debugging', verified: false, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200', banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200' },
  { id: 'usr_56', username: 'thierry_types', name: 'Thierry Laurent', bio: 'Type theory researcher • dependent types, linear type systems, and Curry-Howard isomorphism in production language design', verified: true, avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200', banner: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200' },
  { id: 'usr_57', username: 'sujin_proof', name: 'Sujin Park', bio: 'Formal verification engineer • proving distributed protocol correctness with TLA+ and verifying kernel modules with Isabelle/HOL', verified: true, avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200', banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200' },
  { id: 'usr_58', username: 'ronan_coq', name: 'Ronan O’Brien', bio: 'Interactive theorem prover programmer • Coq proof assistants, mechanically verified crypto algorithms, and certified compilers', verified: false, avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200', banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200' },
  { id: 'usr_59', username: 'fatima_rust', name: 'Fatima Zahra', bio: 'Rust systems engineer • fearless concurrency, non-lexical lifetimes, and zero-overhead memory safety in high-frequency trading', verified: true, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200', banner: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200' },
  { id: 'usr_60', username: 'axel_nord', name: 'Axel Nordstrom', bio: 'Nordic datacenter mechanical engineer • geothermal heat recovery, immersion cooling arrays, and server chassis airflow modeling', verified: false, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200' },
  { id: 'usr_61', username: 'linnea_gl', name: 'Linnea Ekstrom', bio: 'Procedural typography artist • bezier curve offsets, variable font interpolation, and vector glyph rendering on the GPU', verified: false, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200', banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200' },
  { id: 'usr_62', username: 'dante_core', name: 'Dante Rossi', bio: 'Operating systems instructor • microkernel message passing, virtual memory paging algorithms, and educational OS kernels', verified: false, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200' },
  { id: 'usr_63', username: 'chiara_art', name: 'Chiara Esposito', bio: 'Architectural historian & brutalist archivist • cataloging reinforced concrete public housing across post-war Southern Europe', verified: true, avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200', banner: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200' },
  { id: 'usr_64', username: 'sergei_mesh', name: 'Sergei Morozov', bio: 'Wireless mesh networking engineer • ad-hoc routing protocols, 802.11s mesh frames, and disaster response communications', verified: false, avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200', banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200' },
];

const extraCommunities = [
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

const allCommunities = [
  { id: 'comm_systems', slug: 'systems' },
  { id: 'comm_architecture', slug: 'architecture' },
  { id: 'comm_frontend', slug: 'frontend' },
  { id: 'comm_photography', slug: 'photography' },
  { id: 'comm_design', slug: 'design' },
  { id: 'comm_database', slug: 'database-internals' },
  { id: 'comm_linux', slug: 'linux-kernel' },
  { id: 'comm_creative', slug: 'creative-coding' },
  { id: 'comm_infra', slug: 'cloud-native' },
  { id: 'comm_ai', slug: 'ai-systems' },
];

const visualPhotos = [
  { url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200', aspect_ratio: 0.75, width: 1200, height: 1600, color: '#343a40', alt: 'Monochrome concrete cantilever study' },
  { url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200', aspect_ratio: 1.33, width: 1600, height: 1200, color: '#212529', alt: 'Brutalist high-rise concrete facade' },
  { url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200', aspect_ratio: 0.8, width: 1200, height: 1500, color: '#1e293b', alt: 'Rain-slicked night reflection on pavement' },
  { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200', aspect_ratio: 1.25, width: 1500, height: 1200, color: '#0f172a', alt: 'Procedural geometric line density study' },
  { url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200', aspect_ratio: 1.33, width: 1600, height: 1200, color: '#334155', alt: 'Decommissioned turbine hall interior' },
  { url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200', aspect_ratio: 1.0, width: 1200, height: 1200, color: '#4f46e5', alt: 'Interactive WebGL fragment shader canvas' },
  { url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200', aspect_ratio: 1.5, width: 1800, height: 1200, color: '#18181b', alt: 'Digital matrix telemetry and data nodes' },
  { url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200', aspect_ratio: 1.5, width: 1800, height: 1200, color: '#09090b', alt: 'High density datacenter fiber cabling' },
  { url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200', aspect_ratio: 1.5, width: 1800, height: 1200, color: '#172554', alt: 'Silicon microprocessor die and circuit traces' },
  { url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200', aspect_ratio: 1.33, width: 1600, height: 1200, color: '#27272a', alt: 'Modular workstation and design tokens display' },
];

// Rich discussion topics per community
const discussionTopics = {
  systems: [
    { title: 'Designing vector clocks for causal consistency across multi-region edge caches', body: 'When network partitions occur, how do you handle concurrency conflicts without falling back to wall-clock time? A walkthrough of our dotted version vector implementation.', flair: 'Consensus', tags: ['distributed', 'consensus', 'crdt'] },
    { title: 'Why Multi-Raft group rebalancing is harder than leader election', body: 'Partitioning a 100-node cluster into 10,000 Raft groups creates severe IO hotspots during joint consensus reconfiguration. Here is our shard migration strategy.', flair: 'Raft', tags: ['raft', 'storage', 'sharding'] },
    { title: 'Comparing Paxos churn handling with Epaxos under adversarial network delays', body: 'We benchmarked leaderless consensus when cross-rack p99 latency spiked by 40ms. The conflict rate reached 34% before stable dependency graphs resolved.', flair: 'Protocols', tags: ['paxos', 'latency', 'networking'] },
    { title: 'Practical CRDT state compression for real-time document collaboration', body: 'Delta-state CRDTs can easily leak memory if tombstone compaction is not coordinated with garbage collection intervals.', flair: 'CRDTs', tags: ['crdt', 'collaboration', 'state'] },
    { title: 'Partition tolerance testing using deterministic Jepsen harnesses', body: 'How we caught a subtle split-brain scenario where lease renewal races occurred during node clock drift.', flair: 'Verification', tags: ['testing', 'chaos', 'jepsen'] },
  ],
  architecture: [
    { title: 'Transactional outboxes at scale: partitioning change stream collections', body: 'A detailed look at avoiding document-level deletions in outbox collections by dropping expired time-bucket partitions atomically in MongoDB.', flair: 'Event Sourcing', tags: ['mongodb', 'events', 'patterns'] },
    { title: 'Bounded context boundaries: when to split microservices and when to stay modular monolith', body: 'Premature service decomposition creates distributed transaction debt. Here are the 5 coupling metrics we monitor before extracting a boundary.', flair: 'Domain Design', tags: ['ddd', 'monolith', 'microservices'] },
    { title: 'Idempotency key enforcement under concurrent duplicate webhook delivery', body: 'Handling the exact millisecond when two identical payment gateway webhooks hit different replica instances simultaneously.', flair: 'Idempotency', tags: ['webhooks', 'concurrency', 'fastify'] },
    { title: 'Dead-letter queue topologies and automated replay classification', body: 'Not all DLQ messages are equal: distinguishing poison pills from transient network timeout errors with automated retry policies.', flair: 'Reliability', tags: ['queues', 'kafka', 'resilience'] },
    { title: 'Event schema evolution without breaking downstream consumers', body: 'Using Protocol Buffers and backward-compatible JSON schema validation pipelines in Kafka event hubs.', flair: 'Schema', tags: ['schema', 'contracts', 'streaming'] },
  ],
  frontend: [
    { title: 'Mastering CSS subgrid for complex data tables with sticky headers', body: 'CSS subgrid allows nested cells to align to the parent grid definition effortlessly. Here is how we eliminated JavaScript coordinate calculations.', flair: 'CSS', tags: ['css', 'subgrid', 'layout'] },
    { title: 'Offloading Canvas rasterization to Web Workers via OffscreenCanvas', body: 'How keeping our graphing rendering loop entirely on worker threads preserved a solid 60fps interaction during heavy main-thread DOM reconciliation.', flair: 'Performance', tags: ['webworkers', 'canvas', 'rendering'] },
    { title: 'Building resilient keyboard focus rings with CSS :focus-visible and tokens', body: 'Ensuring accessibility compliance without cluttering pointer clicks: pairing token-based CSS variables with native focus-visible pseudo-classes.', flair: 'Accessibility', tags: ['a11y', 'tokens', 'focus'] },
    { title: 'Hydration mismatch elimination in server-rendered React apps', body: 'Analyzing the performance cost of attribute desynchronization and how strict AST linting guarantees deterministic HTML output.', flair: 'React', tags: ['react', 'ssr', 'performance'] },
    { title: 'Micro-frontends without module federation: Web Components and Custom Elements', body: 'Why isolated shadow DOM boundaries gave us cleaner contract isolation than runtime JavaScript dependency sharing.', flair: 'Architecture', tags: ['webcomponents', 'frontend', 'dom'] },
  ],
  photography: [
    { title: 'Framing brutalist raw concrete textures in early morning diffused light', body: 'The balance between micro-contrast on formwork ridges and soft shadows across monolithic staircases. Shooting medium format film in cold dawn light.', flair: 'Brutalism', tags: ['brutalism', 'concrete', 'monochrome'] },
    { title: 'Tilt-shift lens mechanics for architectural vertical line preservation', body: 'Correcting perspective convergence optically at capture time rather than stretching pixels in digital post-processing.', flair: 'Technique', tags: ['architecture', 'lenses', 'composition'] },
    { title: 'Night urban architecture: managing high dynamic range neon reflections', body: 'Balancing 10-stop dynamic ranges when wet asphalt reflects fluorescent sign tubes against matte granite facades.', flair: 'Night', tags: ['urban', 'reflections', 'night'] },
    { title: 'Documenting decommissioned industrial steel infrastructure before demolition', body: 'Photographing 1930s hydroelectric turbines and railway trusses: preserving scale, rivets, and natural patina.', flair: 'Industrial', tags: ['industrial', 'heritage', 'monochrome'] },
  ],
  design: [
    { title: 'Coordinating multi-tier design token pipelines from Figma to Tailwind CSS v4', body: 'Structuring semantic color aliases so brand token adjustments propagate cleanly into dark mode surface hierarchies without code churn.', flair: 'Design Tokens', tags: ['tokens', 'tailwind', 'figma'] },
    { title: 'Fluid typography clamp formulas with accessible user font scaling', body: 'How to write CSS clamp() rules that respect browser root font-size preferences while maintaining strict typographic hierarchy on ultrawide monitors.', flair: 'Typography', tags: ['css', 'typography', 'a11y'] },
    { title: 'Micro-interaction physics: designing restrained spring animations in UI buttons', body: 'Why bouncy springs fatigue users over time: tuning stiffness and damping constants for subtle, tactile button feedback.', flair: 'Motion', tags: ['animation', 'ux', 'motion'] },
    { title: 'Spatial rhythm and 4px baseline grids in dense dashboard layouts', body: 'Maintaining optical alignment across badges, status pills, and monospaced data tables in technical developer consoles.', flair: 'Layout', tags: ['grid', 'layout', 'design'] },
  ],
  'database-internals': [
    { title: 'Mitigating write amplification in LSM-tree compaction with tiered tiering', body: 'Universal compaction vs leveled compaction trade-offs when write workloads exhibit heavy temporal skew. Real benchmarks on NVMe storage.', flair: 'LSM Trees', tags: ['storage', 'lsm', 'rocksdb'] },
    { title: 'B-link tree concurrency: lock-free search and split mechanics', body: 'How the Lehman-Yao B-link algorithm allows concurrent readers to traverse nodes without acquiring read latches during page splits.', flair: 'Indexing', tags: ['btree', 'concurrency', 'indexes'] },
    { title: 'Measuring write-ahead log fsync latency jitter on modern Linux filesystems', body: 'Comparing XFS and ext4 WAL append latencies with O_DIRECT and io_uring ring-submission buffers under 100k IOPS write bursts.', flair: 'WAL', tags: ['linux', 'fsync', 'nvme'] },
    { title: 'MVCC garbage collection strategies: vacuuming dead tuples in high-update stores', body: 'In-page vacuuming vs background worker sweeper threads: analyzing memory bloat when long-running read transactions stall snapshot watermarks.', flair: 'MVCC', tags: ['mvcc', 'postgres', 'storage'] },
  ],
  'linux-kernel': [
    { title: 'High-performance packet processing with eBPF XDP zero-copy buffers', body: 'Bypassing the Linux network stack with AF_XDP sockets to achieve 14.8 million packets per second on commodity 25GbE NICs.', flair: 'eBPF', tags: ['ebpf', 'networking', 'xdp'] },
    { title: 'io_uring kernel polling mode: eliminating context switch overhead in async I/O', body: 'Setting up IORING_SETUP_SQPOLL dedicated kernel threads to achieve pure lockless submission ring interactions in user-space.', flair: 'io_uring', tags: ['iouring', 'kernel', 'async'] },
    { title: 'Analyzing memory barrier requirements on ARMv8 vs x86-64 weak memory models', body: 'Why lock-free data structures that pass tests on Intel hardware silently corrupt memory on Graviton3 without proper acquire-release fences.', flair: 'Architecture', tags: ['arm', 'concurrency', 'memory'] },
    { title: 'Real-time task determinism with PREEMPT_RT on embedded industrial hardware', body: 'Measuring interrupt latency jitter down to sub-10 microsecond thresholds for precision robotics control loops.', flair: 'Real-Time', tags: ['rtos', 'linux', 'robotics'] },
  ],
  'creative-coding': [
    { title: 'Real-time volumetric atmospheric scattering inside WebGPU compute shaders', body: 'Implementing Rayleigh and Mie scattering integration loops at 120fps with temporal reprojection for dense atmospheric clouds.', flair: 'WebGPU', tags: ['webgpu', 'shaders', 'graphics'] },
    { title: 'Signed Distance Field (SDF) raymarching techniques for smooth geometric blending', body: 'Using polynomial smooth minimum functions to blend complex 3D primitives smoothly inside a single fragment shader pass.', flair: 'GLSL', tags: ['glsl', 'sdf', 'raymarching'] },
    { title: 'Procedural reaction-diffusion patterns using Gray-Scott equation textures', body: 'Simulating organic morphogenetic skin patterns through ping-pong float framebuffers in WebGL 2.', flair: 'Procedural', tags: ['generative', 'webgl', 'simulation'] },
    { title: 'GPU-accelerated bezier curve offset algorithms for generative typography', body: 'Evaluating cubic bezier parallel offsets directly in compute shaders without polygon triangulation artifacts.', flair: 'Typography', tags: ['typography', 'gpu', 'math'] },
  ],
  'cloud-native': [
    { title: 'Building reliable Kubernetes operators: level-triggered reconciliation loops', body: 'Why edge-triggered events cause state drift and how implementing idempotent status reconciliation guarantees eventual convergence.', flair: 'Kubernetes', tags: ['k8s', 'operators', 'go'] },
    { title: 'Observability cost optimization: dynamic OpenTelemetry trace sampling heuristics', body: 'Sampling 100% of error traces and slow p99 outliers while shedding 95% of routine health-check spans to control telemetry bills.', flair: 'Telemetry', tags: ['opentelemetry', 'tracing', 'sre'] },
    { title: 'Envoy sidecar memory footprint optimization in 5,000-pod service meshes', body: 'Pruning unused cluster metadata and CDS discovery configurations to recover 85MB of RAM per container in large microservice meshes.', flair: 'Service Mesh', tags: ['envoy', 'mesh', 'memory'] },
    { title: 'Automated chaos experiment pipelines with localized fault injection', body: 'Simulating packet corruption, DNS resolution timeouts, and disk fill-ups in staging environments before major releases.', flair: 'Chaos Eng', tags: ['chaos', 'resilience', 'testing'] },
  ],
  'ai-systems': [
    { title: 'Speculative decoding architectures: accelerating LLM token generation throughput', body: 'Pairing small draft models with large verification models to achieve 2.8x speedups on sequential token generation without quality degradation.', flair: 'Inference', tags: ['llm', 'inference', 'systems'] },
    { title: 'FP8 quantization calibration and outlier activation management', body: 'How per-tensor scaling factors preserve perplexity across 70B parameter models while doubling matrix multiplication throughput on modern tensor cores.', flair: 'Quantization', tags: ['quantization', 'gpu', 'ai'] },
    { title: 'RDMA over Converged Ethernet (RoCE v2) congestion control in distributed GPU training', body: 'Tuning Priority-based Flow Control (PFC) and Explicit Congestion Notification (ECN) to eliminate buffer overflow drops during all-reduce gradients.', flair: 'Networking', tags: ['rdma', 'gpu', 'training'] },
    { title: 'Scalable vector indexing: optimizing HNSW graphs for high-concurrency read queries', body: 'Balancing M and efConstruction parameters to guarantee 98% recall at 10,000 queries per second on 1536-dimensional embedding vectors.', flair: 'Vector DB', tags: ['vector', 'indexing', 'hnsw'] },
  ],
};

console.log('Generating expanded posts...');
// We will generate 224 posts (post_201 to post_424)
const expandedPosts = [];
const expandedComments = [];
const expandedVotes = [];
const expandedSaves = [];
const expandedFollows = [];
const expandedMemberships = [];

let postIdx = 201;
let commentIdx = 11;
let voteIdx = 201;
let saveIdx = 201;

// Generate 224 posts:
// 140 discussions (14 per community across 10 communities)
// 84 visual pins (8 or 9 per community)
allCommunities.forEach((comm, commIdx) => {
  const topics = discussionTopics[comm.slug] || discussionTopics.systems;
  
  // 14 discussions per community
  for (let i = 0; i < 14; i++) {
    const t = topics[i % topics.length];
    const authorUser = extraUsers[(commIdx * 4 + i) % extraUsers.length];
    const daysAgo = (postIdx * 7) % 28 + 1;
    const hour = (postIdx * 3) % 24;
    const min = (postIdx * 17) % 60;
    const createdDate = new Date('2026-10-24T12:00:00.000Z');
    createdDate.setUTCDate(createdDate.getUTCDate() - daysAgo);
    createdDate.setUTCHours(hour, min, 0, 0);

    const postId = `post_${postIdx++}`;
    expandedPosts.push({
      _id: postId,
      post_type: 'discussion',
      author_id: authorUser.id,
      title: `${t.title}${i >= topics.length ? ` (Part ${Math.floor(i / topics.length) + 1})` : ''}`,
      content: `${t.body}\n\n### Implementation Notes\nWhen deploying this at production scale, ensure proper monitoring metrics and telemetry alerts are configured before running migration jobs. Benchmarking under synthetic load revealed clear trade-offs between throughput and tail latency.`,
      community_id: comm.id,
      community_slug: comm.slug,
      flair: t.flair,
      tags: t.tags,
      score: 0,
      hot_score: 0,
      comments_count: 0,
      created_at: createdDate,
      updated_at: createdDate,
    });
  }

  // ~8.4 visual pins per community (total 84 visual pins)
  const visualCount = commIdx < 4 ? 9 : 8;
  for (let i = 0; i < visualCount; i++) {
    const photo = visualPhotos[(commIdx * 3 + i) % visualPhotos.length];
    const authorUser = extraUsers[(commIdx * 4 + i + 15) % extraUsers.length];
    const daysAgo = (postIdx * 5) % 28 + 1;
    const hour = (postIdx * 7) % 24;
    const min = (postIdx * 13) % 60;
    const createdDate = new Date('2026-10-24T12:00:00.000Z');
    createdDate.setUTCDate(createdDate.getUTCDate() - daysAgo);
    createdDate.setUTCHours(hour, min, 0, 0);

    const postId = `post_${postIdx++}`;
    expandedPosts.push({
      _id: postId,
      post_type: 'visual',
      author_id: authorUser.id,
      title: `${photo.alt} • Study ${i + 1}`,
      caption: `Exploration of surface geometry, light contrast, and architectural rhythm in ${comm.name}. Captured on location with high resolution details.`,
      community_id: comm.id,
      community_slug: comm.slug,
      media: {
        id: `media_${postIdx}`,
        url: photo.url,
        aspect_ratio: photo.aspect_ratio,
        width: photo.width,
        height: photo.height,
        alt_text: photo.alt,
      },
      dominant_color: photo.color,
      tags: [comm.slug, 'noir', 'geometry'],
      score: 0,
      hot_score: 0,
      comments_count: 0,
      created_at: createdDate,
      updated_at: createdDate,
    });
  }
});

console.log(`Generated ${expandedPosts.length} expanded posts (total: ${16 + expandedPosts.length})`);

// Generate 130 comments (cmt_011 to cmt_140)
// 65 root comments (depth 0)
// 45 depth-1 replies
// 20 depth-2 replies
const commentAuthors = extraUsers.slice(0, 35);
const rootComments = [];
const depth1Comments = [];

for (let i = 0; i < 65; i++) {
  const targetPost = expandedPosts[i * 3 % expandedPosts.length];
  const author = commentAuthors[(i * 7) % commentAuthors.length];
  const cmtId = `cmt_${String(commentIdx++).padStart(3, '0')}`;
  const cDate = new Date(targetPost.created_at.getTime() + 1000 * 60 * (15 + i * 5));
  
  const cmt = {
    _id: cmtId,
    post_id: targetPost._id,
    parent_id: null,
    author_id: author.id,
    content: `Great analysis on ${targetPost.title.slice(0, 40)}. Did you measure how this behaves under sustained high p99 concurrency?`,
    score: (i % 7) + 1,
    depth: 0,
    created_at: cDate,
    updated_at: cDate,
  };
  rootComments.push(cmt);
  expandedComments.push(cmt);
}

for (let i = 0; i < 45; i++) {
  const parent = rootComments[i % rootComments.length];
  const author = commentAuthors[(i * 11 + 3) % commentAuthors.length];
  const cmtId = `cmt_${String(commentIdx++).padStart(3, '0')}`;
  const cDate = new Date(parent.created_at.getTime() + 1000 * 60 * 12);

  const cmt = {
    _id: cmtId,
    post_id: parent.post_id,
    parent_id: parent._id,
    author_id: author.id,
    content: `We observed tail latency stabilizing once we tuned the buffer pool allocations. The key factor was avoiding thread contention on page latches.`,
    score: (i % 5) + 1,
    depth: 1,
    created_at: cDate,
    updated_at: cDate,
  };
  depth1Comments.push(cmt);
  expandedComments.push(cmt);
}

for (let i = 0; i < 20; i++) {
  const parent = depth1Comments[i % depth1Comments.length];
  const author = commentAuthors[(i * 13 + 5) % commentAuthors.length];
  const cmtId = `cmt_${String(commentIdx++).padStart(3, '0')}`;
  const cDate = new Date(parent.created_at.getTime() + 1000 * 60 * 8);

  const cmt = {
    _id: cmtId,
    post_id: parent.post_id,
    parent_id: parent._id,
    author_id: author.id,
    content: `Agreed, that matches our production benchmarks across x86-64 and ARM clusters as well.`,
    score: (i % 4) + 1,
    depth: 2,
    created_at: cDate,
    updated_at: cDate,
  };
  expandedComments.push(cmt);
}

console.log(`Generated ${expandedComments.length} expanded comments (total: ${10 + expandedComments.length})`);

// Generate Follow Edges (~196 new edges among users 5 through 64)
// Core invariants:
// - usr_0 ONLY follows usr_1, usr_2, usr_3
// - usr_3 does NOT follow usr_1
const followPairs = new Set();
// Add core seed follows first to set to prevent duplicates
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

// We will add follows among usr_5 to usr_64 (hub nodes: usr_5, usr_6, usr_9, usr_20, usr_24, usr_28, usr_32, usr_40, usr_44, usr_48)
const hubUsers = ['usr_5', 'usr_6', 'usr_9', 'usr_20', 'usr_24', 'usr_28', 'usr_32', 'usr_40', 'usr_44', 'usr_48'];
const allCandidateUsers = [];
for (let i = 5; i <= 64; i++) {
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

// Generate Community Memberships (~153 new memberships across the 10 communities)
// Invariants:
// - usr_3 and usr_4 are NOT members of comm_systems
const membershipPairs = new Set();
// Add core seed memberships to set
[
  'usr_0_comm_systems', 'usr_1_comm_systems', 'usr_6_comm_systems', 'usr_5_comm_systems', 'usr_7_comm_systems', 'usr_11_comm_systems', 'usr_17_comm_systems', 'usr_19_comm_systems',
  'usr_0_comm_architecture', 'usr_1_comm_architecture', 'usr_3_comm_architecture', 'usr_9_comm_architecture', 'usr_13_comm_architecture', 'usr_15_comm_architecture', 'usr_18_comm_architecture', 'usr_19_comm_architecture',
  'usr_0_comm_frontend', 'usr_4_comm_frontend', 'usr_6_comm_frontend', 'usr_10_comm_frontend', 'usr_14_comm_frontend', 'usr_18_comm_frontend',
  'usr_0_comm_photography', 'usr_2_comm_photography', 'usr_8_comm_photography', 'usr_12_comm_photography', 'usr_16_comm_photography',
  'usr_0_comm_design', 'usr_4_comm_design', 'usr_6_comm_design', 'usr_10_comm_design', 'usr_12_comm_design', 'usr_14_comm_design',
].forEach(p => membershipPairs.add(p));

allCommunities.forEach((comm) => {
  allCandidateUsers.forEach((user, uIdx) => {
    // Systems exclusions
    if (comm.id === 'comm_systems' && (user === 'usr_3' || user === 'usr_4')) {
      return;
    }
    // Deterministic membership selection: each user joins ~2-3 communities
    if ((uIdx + comm.slug.length) % 4 === 0 || (uIdx % 10 === allCommunities.indexOf(comm))) {
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

// Generate Votes (~260 votes on expanded posts)
expandedPosts.forEach((post, pIdx) => {
  // Give each post between 1 and 3 votes from candidate users
  const numVotes = 1 + (pIdx % 3);
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
console.log(`Generated ${expandedVotes.length} expanded votes (total: ${22 + expandedVotes.length})`);

// Generate Saves (~51 saves across candidate users)
for (let s = 0; s < 51; s++) {
  const post = expandedPosts[s * 4 % expandedPosts.length];
  const saver = allCandidateUsers[(s * 5) % allCandidateUsers.length];
  expandedSaves.push({
    _id: `save_${post._id}_${saver}`,
    post_id: post._id,
    user_id: saver,
    created_at: new Date(post.created_at.getTime() + 1000 * 60 * 60),
  });
}
console.log(`Generated ${expandedSaves.length} expanded saves (total: ${9 + expandedSaves.length})`);

// Now write the TypeScript module
const outDir = path.resolve('packages/backend/src/db/fixtures');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const fileContent = `// Automatically generated expanded fixtures for SocialGraph Noir Phase 2A
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

export const expandedPersonas: UserDoc[] = ${JSON.stringify(extraUsers.map(u => ({
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
})), null, 2).replace(/"(2026-[^"]+)"/g, 'new Date("$1")')};

export const expandedCommunities: CommunityDoc[] = ${JSON.stringify(extraCommunities.map(c => ({
  _id: c.id,
  name: c.name,
  slug: c.slug,
  description: c.description,
  avatar_url: c.avatar_url,
  members_count: 0,
  rules: c.rules,
  created_at: new Date('2026-01-10T00:00:00.000Z'),
  updated_at: new Date('2026-01-10T00:00:00.000Z'),
})), null, 2).replace(/"(2026-[^"]+)"/g, 'new Date("$1")')};

export const expandedPosts: PostDoc[] = ${JSON.stringify(expandedPosts, null, 2).replace(/"(2026-[^"]+)"/g, 'new Date("$1")')};

export const expandedComments: CommentDoc[] = ${JSON.stringify(expandedComments, null, 2).replace(/"(2026-[^"]+)"/g, 'new Date("$1")')};

export const expandedFollows: FollowDoc[] = ${JSON.stringify(expandedFollows, null, 2).replace(/"(2026-[^"]+)"/g, 'new Date("$1")')};

export const expandedMemberships: CommunityMembershipDoc[] = ${JSON.stringify(expandedMemberships, null, 2).replace(/"(2026-[^"]+)"/g, 'new Date("$1")')};

export const expandedVotes: PostVoteDoc[] = ${JSON.stringify(expandedVotes, null, 2).replace(/"(2026-[^"]+)"/g, 'new Date("$1")')};

export const expandedSaves: PostSaveDoc[] = ${JSON.stringify(expandedSaves, null, 2).replace(/"(2026-[^"]+)"/g, 'new Date("$1")')};
`;

fs.writeFileSync(path.join(outDir, 'expandedDataset.ts'), fileContent, 'utf8');
console.log('Successfully wrote packages/backend/src/db/fixtures/expandedDataset.ts');
