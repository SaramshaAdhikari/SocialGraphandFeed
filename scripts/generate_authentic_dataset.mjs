import fs from 'node:fs';
import path from 'node:path';
import { verifiedPhotos } from '../packages/backend/src/db/fixtures/verifiedPhotos.js';

// Flatten all verified photos (total 100)
const allPhotos = [
  ...verifiedPhotos.architecture,
  ...verifiedPhotos.technology,
  ...verifiedPhotos.workspaces,
  ...verifiedPhotos.lifestyle,
  ...verifiedPhotos.creative_art,
];

console.log(`Verified photo pool has ${allPhotos.length} photos.`);

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

console.log('Building content arrays...');
