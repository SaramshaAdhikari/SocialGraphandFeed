import fs from 'node:fs';
import path from 'node:path';

const seedPath = path.resolve('packages/backend/src/db/seed.ts');
let content = fs.readFileSync(seedPath, 'utf-8');

// Replace coreUsers bios
content = content.replace(
  `bio: 'feed engineering & distributed graph nerd • tinkering with fastify and redis • fueled by pour-over coffee and good typography',`,
  `bio: 'distributed systems & web perf • tinkering with redis & fastify • fueled by pour-overs and good typography',`
);
content = content.replace(
  `bio: 'Distributed systems researcher & systems engineer • trying to build consensus protocols so my pager doesn’t wake me at 3am • occasionally building acoustic guitars',`,
  `bio: 'consensus protocols & distributed tracing • building acoustic guitars in my spare time',`
);
content = content.replace(
  `bio: 'architectural & industrial photographer roaming around brutalist structures, concrete halls, and compute clusters • hasselblad 500c/m • berlin',`,
  `bio: 'architectural & brutalist photography • hasselblad 500c/m • berlin',`
);
content = content.replace(
  `bio: 'Staff SRE & Linux kernel aficionado • writing postmortems so you don’t have to • ebpf, cache invalidation, and mechanical keyboards',`,
  `bio: 'linux kernel debugging & sre • mechanical keyboards & ebpf',`
);
content = content.replace(
  `bio: 'Design systems architect & UI engineering lead • obsessing over CSS tokens, subgrid alignments, and web accessibility • tea enthusiast',`,
  `bio: 'design systems & web accessibility • obsessing over css tokens and tea',`
);

// New 15 extended personas with non-face vector avatars & authentic identities
const newExtendedPersonas = `  // 15 Distinct Fictional Personas with non-face vector avatars
  const extendedPersonas: UserDoc[] = [
    {
      _id: 'usr_5',
      username: 'kenji_sys',
      display_name: 'Kenji Sato',
      avatar_url: '/avatars/code-terminal.svg',
      banner_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200',
      is_verified: true,
      bio: 'embedded linux & robotics • building rover prototypes in tokyo',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-01T00:00:00.000Z'),
      updated_at: new Date('2026-02-01T00:00:00.000Z'),
    },
    {
      _id: 'usr_6',
      username: 'maya_pixel',
      display_name: 'Maya Lin',
      avatar_url: '/avatars/abstract-bauhaus.svg',
      banner_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200',
      is_verified: true,
      bio: 'webgl shaders & interactive graphics • generative color studies',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-02T00:00:00.000Z'),
      updated_at: new Date('2026-02-02T00:00:00.000Z'),
    },
    {
      _id: 'usr_7',
      username: 'david_retro',
      display_name: 'David Okafor',
      avatar_url: '/avatars/pixel-gameboy.svg',
      banner_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200',
      is_verified: false,
      bio: 'restoring 90s workstations & writing forth interpreters • lagos',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-03T00:00:00.000Z'),
      updated_at: new Date('2026-02-03T00:00:00.000Z'),
    },
    {
      _id: 'usr_8',
      username: 'chloe_lens',
      display_name: 'Chloe Desjardins',
      avatar_url: '/avatars/gear-camera.svg',
      banner_url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200',
      is_verified: true,
      bio: 'night photography & neon reflections • montreal',
      website: 'https://chloe-photos.example.com',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-04T00:00:00.000Z'),
      updated_at: new Date('2026-02-04T00:00:00.000Z'),
    },
    {
      _id: 'usr_9',
      username: 'tariq_arch',
      display_name: 'Tariq Mansoor',
      avatar_url: '/avatars/nature-mountain.svg',
      banner_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200',
      is_verified: true,
      bio: 'event sourcing & immutable ledgers • weekend trail hiking in dubai',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-05T00:00:00.000Z'),
      updated_at: new Date('2026-02-05T00:00:00.000Z'),
    },
    {
      _id: 'usr_10',
      username: 'priya_ui',
      display_name: 'Priya Sharma',
      avatar_url: '/avatars/art-palette.svg',
      banner_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200',
      is_verified: true,
      bio: 'design tokens & screen reader accessibility • watercolor sketching • delhi',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-06T00:00:00.000Z'),
      updated_at: new Date('2026-02-06T00:00:00.000Z'),
    },
    {
      _id: 'usr_11',
      username: 'nullcat_404',
      display_name: 'Devin Bell',
      avatar_url: '/avatars/mascot-cat.svg',
      banner_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200',
      is_verified: false,
      bio: 'self-hosting on old thinkpads, cat dad, coffee addict. seattle',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-07T00:00:00.000Z'),
      updated_at: new Date('2026-02-07T00:00:00.000Z'),
    },
    {
      _id: 'usr_12',
      username: 'aoi_manga',
      display_name: 'Aoi Tanaka',
      avatar_url: '/avatars/art-manga-pen.svg',
      banner_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200',
      is_verified: false,
      bio: 'manga paneling & visual storytelling • osaka',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-08T00:00:00.000Z'),
      updated_at: new Date('2026-02-08T00:00:00.000Z'),
    },
    {
      _id: 'usr_13',
      username: 'marcus_v',
      display_name: 'Marcus Vance',
      avatar_url: '/avatars/gear-synth.svg',
      banner_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200',
      is_verified: false,
      bio: 'modular synth patches & analog sound design • atlanta',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-09T00:00:00.000Z'),
      updated_at: new Date('2026-02-09T00:00:00.000Z'),
    },
    {
      _id: 'usr_14',
      username: 'chai.exe',
      display_name: 'Chirag Mehta',
      avatar_url: '/avatars/food-chai.svg',
      banner_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200',
      is_verified: false,
      bio: 'undergrad cs @ bits pilani. tinkering with side projects & drinking ginger chai',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-10T00:00:00.000Z'),
      updated_at: new Date('2026-02-10T00:00:00.000Z'),
    },
    {
      _id: 'usr_15',
      username: 'civicafterdark',
      display_name: 'Leo Santos',
      avatar_url: '/avatars/gear-car.svg',
      banner_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200',
      is_verified: false,
      bio: 'ek9 civic hatch build, late night touge runs, track day telemetry. toronto',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-11T00:00:00.000Z'),
      updated_at: new Date('2026-02-11T00:00:00.000Z'),
    },
    {
      _id: 'usr_16',
      username: 'nina_cam',
      display_name: 'Nina Kowalski',
      avatar_url: '/avatars/gear-camera.svg',
      banner_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
      is_verified: false,
      bio: 'documentary film photography & industrial architecture • krakow',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-12T00:00:00.000Z'),
      updated_at: new Date('2026-02-12T00:00:00.000Z'),
    },
    {
      _id: 'usr_17',
      username: 'pixelmoth',
      display_name: 'Faye Zhao',
      avatar_url: '/avatars/pixel-moth.svg',
      banner_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200',
      is_verified: false,
      bio: 'pixel art & cozy games. drawing little critters and making tiny pico-8 carts. vancouver',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-13T00:00:00.000Z'),
      updated_at: new Date('2026-02-13T00:00:00.000Z'),
    },
    {
      _id: 'usr_18',
      username: 'hana_dev',
      display_name: 'Hana Park',
      avatar_url: '/avatars/mascot-frog.svg',
      banner_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200',
      is_verified: true,
      bio: 'frontend tooling & monorepos • seoul',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-14T00:00:00.000Z'),
      updated_at: new Date('2026-02-14T00:00:00.000Z'),
    },
    {
      _id: 'usr_19',
      username: 'fourthquarter',
      display_name: 'Darius Hall',
      avatar_url: '/avatars/sports-basketball.svg',
      banner_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200',
      is_verified: false,
      bio: 'rec league point guard, 90s basketball jerseys, sneaker rotation. chicago',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date('2026-02-15T00:00:00.000Z'),
      updated_at: new Date('2026-02-15T00:00:00.000Z'),
    },
  ];`;

// Replace extendedPersonas array regex
const extRegex = /\/\/ 15 Distinct Fictional Personas[\s\S]*?const extendedPersonas: UserDoc\[\] = \[[\s\S]*?\n  \];/;
if (!extRegex.test(content)) {
  console.error('Could not find extendedPersonas regex match!');
  process.exit(1);
}
content = content.replace(extRegex, newExtendedPersonas.trim());

fs.writeFileSync(seedPath, content, 'utf-8');
console.log('Successfully updated packages/backend/src/db/seed.ts with non-face vector avatars and authentic identities!');
