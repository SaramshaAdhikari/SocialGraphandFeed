// Phase 2A.3 & 2A.4 Personas and Communities
// 45 diverse fictional online personas (usr_65 to usr_109) with authentic non-face vector avatars
// and 8 interest-driven communities

export const phase2a3Communities = [
  {
    id: 'comm_gaming',
    name: 'Gaming & Esports',
    slug: 'gaming-esports',
    description: 'PC gaming rigs, indie highlights, competitive esports, handheld modding, and co-op clips.',
    avatar_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200',
    rules: [
      { id: 'r1', title: 'No spoilers without tags', description: 'Mark story spoilers clearly in the title or opening line.' },
      { id: 'r2', title: 'Hardware specs', description: 'Mention platform and resolution when sharing performance clips.' }
    ]
  },
  {
    id: 'comm_anime',
    name: 'Anime, Manga & Visual Art',
    slug: 'anime-manga',
    description: 'Manga panel composition, seasonal episode impressions, sakuga animation, and original art.',
    avatar_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200',
    rules: [
      { id: 'r1', title: 'Credit original creators', description: 'Always cite artists and manga chapter sources.' },
      { id: 'r2', title: 'Respectful fandom', description: 'Keep ship debates and tier lists constructive.' }
    ]
  },
  {
    id: 'comm_motorsport',
    name: 'Cars, Motorsport & Mechanics',
    slug: 'cars-motorsport',
    description: 'Track day telemetry, weekend garage projects, detailing craft, sim racing, and motorcycle touring.',
    avatar_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200',
    rules: [
      { id: 'r1', title: 'Safety first', description: 'Promote track driving and closed-course safety over reckless street stunts.' },
      { id: 'r2', title: 'Build details', description: 'List chassis, year, and parts when posting project builds.' }
    ]
  },
  {
    id: 'comm_sports',
    name: 'Recreational Sports & Fitness',
    slug: 'sports-fitness',
    description: 'Bouldering problem breakdowns, 10k/marathon splits, road cycling routes, and strength training.',
    avatar_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200',
    rules: [
      { id: 'r1', title: 'Inclusive encouragement', description: 'Every pace, weight, and grade is celebrated.' },
      { id: 'r2', title: 'No unsolicited medical advice', description: 'Discuss personal routines, not prescriptive injury diagnoses.' }
    ]
  },
  {
    id: 'comm_music',
    name: 'Music, Vinyl & Production',
    slug: 'music-production',
    description: 'Crate digging, analog guitar pedals, synth patch design, indie gig logs, and home tracking.',
    avatar_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200',
    rules: [
      { id: 'r1', title: 'Signal chain details', description: 'List mics, pedals, or VSTs when sharing audio samples.' }
    ]
  },
  {
    id: 'comm_campus',
    name: 'Campus Life & Student Tech',
    slug: 'campus-life',
    description: 'University projects, dorm setups, late-night hackathons, study routines, and early-career reflections.',
    avatar_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=200',
    rules: [
      { id: 'r1', title: 'No academic dishonesty', description: 'Share learning resources, never exam answers or homework solutions.' }
    ]
  },
  {
    id: 'comm_food',
    name: 'Everyday Food, Coffee & Baking',
    slug: 'food-cooking',
    description: 'Home cooking, 80% hydration sourdough, neighborhood café finds, street food travel, and pantry hacks.',
    avatar_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200',
    rules: [
      { id: 'r1', title: 'Include recipes or ingredients', description: 'Share dough baker percentages or key spices when posting dishes.' }
    ]
  },
  {
    id: 'comm_books',
    name: 'Books, Reading & Sci-Fi',
    slug: 'books-reading',
    description: 'Speculative fiction, non-fiction deep dives, poetry collections, physical bookshelves, and annotations.',
    avatar_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200',
    rules: [
      { id: 'r1', title: 'Mention title and author', description: 'Put book title and author name in post titles or headers.' }
    ]
  }
];

export const phase2a3Personas = [
  // Gaming & Memes (5)
  { id: 'usr_65', username: 'pixelpanda', name: 'Toby Lindqvist', bio: 'steam deck tinkerer, indie roguelikes, malmö. drinking too much cold brew', verified: false, avatar: '/avatars/mascot-panda.svg', banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200' },
  { id: 'usr_66', username: 'apex_milo', name: 'Milo Chen', bio: 'ranked fps grinder & mechanical keycaps. vancouver. aiming for diamond this split', verified: false, avatar: '/avatars/abstract-cyber.svg', banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200' },
  { id: 'usr_67', username: 'speedrun_sam', name: 'Samantha Vance', bio: 'retro platformer speedrunner & casual streamer. chicago. sub-20 or bust', verified: true, avatar: '/avatars/pixel-gameboy.svg', banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200' },
  { id: 'usr_68', username: 'retro_reese', name: 'Reese Callahan', bio: 'modding game boys with ips screens. austin. collecting 90s cartridges', verified: false, avatar: '/avatars/pixel-ghost.svg', banner: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=1200' },
  { id: 'usr_69', username: 'respawn_kate', name: 'Kate O’Reilly', bio: 'indie games, game jams, pixel art. dublin. currently making a tiny deckbuilder', verified: false, avatar: '/avatars/pixel-potion.svg', banner: 'https://images.unsplash.com/photo-1580234811497-9df7fd2f357e?w=1200' },

  // Anime, Manga, Illustration & Cosplay (5)
  { id: 'usr_70', username: 'sakura_sketch', name: 'Sakura Morimoto', bio: 'illustrator in kyoto. botanical drawings, watercolor, and ghibli background studies', verified: true, avatar: '/avatars/art-manga-pen.svg', banner: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200' },
  { id: 'usr_71', username: 'haruto_manga', name: 'Haruto Takahashi', bio: 'manga paneling enthusiast & collector. osaka. analyzing pan-shonen pacing', verified: false, avatar: '/avatars/art-manga-pen.svg', banner: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200' },
  { id: 'usr_72', username: 'kuro_anim', name: 'Kuro Tan', bio: 'sakuga animation appreciation. 2d fx, mecha layouts. singapore', verified: false, avatar: '/avatars/abstract-bauhaus.svg', banner: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1200' },
  { id: 'usr_73', username: 'lin_artspace', name: 'Lin Wei', bio: 'concept artist, character design, gouache painter. taipei. tea & sketchbooks', verified: true, avatar: '/avatars/art-palette.svg', banner: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200' },
  { id: 'usr_74', username: 'hana_cos', name: 'Hana Kim', bio: 'prop maker, eva foam crafting, 3d printing. seoul. photography & armor builds', verified: false, avatar: '/avatars/pixel-potion.svg', banner: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200' },

  // Cars, Motorsport & Motorcycles (5)
  { id: 'usr_75', username: 'trackday_dan', name: 'Daniel Keller', bio: 'weekend track days at hockenheim. air-cooled 911s & tire pressure obsessive. stuttgart', verified: true, avatar: '/avatars/gear-car.svg', banner: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200' },
  { id: 'usr_76', username: 'revmatch_raj', name: 'Rajiv Mehra', bio: 'motorcycle touring across the western ghats. royal enfield maintenance & chai stops. mumbai', verified: false, avatar: '/avatars/gear-motorcycle.svg', banner: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200' },
  { id: 'usr_77', username: 'silvia_spec', name: 'Camila Torres', bio: 'drifting, suspension tuning, 90s jdm restoration. cdmx. always smelling like brake cleaner', verified: false, avatar: '/avatars/gear-car.svg', banner: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200' },
  { id: 'usr_78', username: 'moto_maya', name: 'Maya Johansson', bio: 'dual-sport motorcycle trail riding & leathercraft. gothenburg. offroad routes & camping', verified: false, avatar: '/avatars/gear-motorcycle.svg', banner: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200' },
  { id: 'usr_79', username: 'apex_liam', name: 'Liam Murphy', bio: 'direct drive sim rig, iracing telemetry, weekend karting. melbourne', verified: false, avatar: '/avatars/abstract-cyber.svg', banner: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?w=1200' },

  // Sports & Recreational Fitness (5)
  { id: 'usr_80', username: 'boulder_ben', name: 'Ben Davies', bio: 'bouldering V7, chalk bags, peak district gritstone. sheffield. climbing & pour overs', verified: false, avatar: '/avatars/gear-boulder.svg', banner: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=1200' },
  { id: 'usr_81', username: 'stride_sonia', name: 'Sonia Verma', bio: 'marathon training, sunrise 10ks, trail running shoes. delhi. chasing a sub-3:45', verified: true, avatar: '/avatars/gear-running.svg', banner: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=1200' },
  { id: 'usr_82', username: 'hoops_tyler', name: 'Tyler Washington', bio: 'rec league point guard, pickup runs at the park, sneaker rotation. atlanta', verified: false, avatar: '/avatars/sports-basketball.svg', banner: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200' },
  { id: 'usr_83', username: 'trail_tanya', name: 'Tanya Morozova', bio: 'colorado 14ers, alpine lakes, ultralight hiking gear. denver. mountains over everything', verified: false, avatar: '/avatars/nature-mountain.svg', banner: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200' },
  { id: 'usr_84', username: 'cricket_kabir', name: 'Kabir Joshi', bio: 'weekend club cricket all-rounder, gully cricket nostalgia, pune. test cricket purist', verified: false, avatar: '/avatars/gear-running.svg', banner: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=1200' },

  // Photographers, Artists, Designers & Fashion (5)
  { id: 'usr_85', username: 'grain_and_shutter', name: 'Julian Thorne', bio: 'darkroom printing, 120 medium format, portra 400. london. grain is character', verified: true, avatar: '/avatars/gear-camera.svg', banner: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200' },
  { id: 'usr_86', username: 'seoul_streets', name: 'Min-jun Park', bio: 'street photography in euljiro & hongdae. leica m6, neon reflections. seoul', verified: false, avatar: '/avatars/abstract-cyber.svg', banner: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200' },
  { id: 'usr_87', username: 'nordic_lines', name: 'Elin Sandstrom', bio: 'scandinavian interiors, handthrown ceramics, wool textures. helsinki', verified: false, avatar: '/avatars/abstract-bauhaus.svg', banner: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200' },
  { id: 'usr_88', username: 'vintage_thread', name: 'Amara Okafor', bio: 'thrift archivist, selvedge denim fading, vintage outerwear. lagos / london', verified: true, avatar: '/avatars/art-palette.svg', banner: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200' },
  { id: 'usr_89', username: 'candid_cam', name: 'Camille Dubois', bio: 'documentary photojournalism with a 28mm lens. lyon. capturing everyday transit life', verified: false, avatar: '/avatars/gear-camera.svg', banner: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=1200' },

  // College Students & Early-Career (5)
  { id: 'usr_90', username: 'dorm_dev_leo', name: 'Leo Morales', bio: 'cs sophomore @ ucsd. hackathon traveler, cold brew addict, building tiny web tools', verified: false, avatar: '/avatars/food-ramen.svg', banner: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200' },
  { id: 'usr_91', username: 'eng_student_riya', name: 'Riya Sen', bio: 'electrical engineering @ iit kgp. breadboards, robotics club, late night canteen samosas', verified: false, avatar: '/avatars/code-terminal.svg', banner: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200' },
  { id: 'usr_92', username: 'cs_sophomore_kai', name: 'Kai Zheng', bio: 'uoft cs sophomore. algorithms midterms, vim configs, bubble tea runs. toronto', verified: false, avatar: '/avatars/mascot-cat.svg', banner: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1200' },
  { id: 'usr_93', username: 'grad_life_noah', name: 'Noah Fischer', bio: 'phd candidate in physics, eth zurich. latex typesetting, simulation runs, cycling', verified: true, avatar: '/avatars/food-coffee.svg', banner: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200' },
  { id: 'usr_94', username: 'premed_priya', name: 'Priya Nair', bio: 'biochem major in boston. flashcards, organic chem reactions, matcha latte study sessions', verified: false, avatar: '/avatars/books-reading.svg', banner: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200' },

  // Everyday Food, Cooking, Pets & Gardening (7)
  { id: 'usr_95', username: 'matcha_miki', name: 'Miki Sato', bio: 'whisking uji matcha, ceramic teaware, quiet tokyo kissaten corners', verified: false, avatar: '/avatars/food-matcha.svg', banner: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200' },
  { id: 'usr_96', username: 'sourdough_sid', name: 'Siddharth Iyer', bio: '80% hydration sourdough, cast iron dutch ovens, south indian filter coffee. bangalore', verified: false, avatar: '/avatars/food-sourdough.svg', banner: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=1200' },
  { id: 'usr_97', username: 'plantdad_percy', name: 'Percy Howard', bio: 'urban balcony jungle, monstera cuttings, worm composting. bristol', verified: false, avatar: '/avatars/nature-monstera.svg', banner: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200' },
  { id: 'usr_98', username: 'bento_bea', name: 'Beatrice Wong', bio: 'daily lunch bentos, tamagoyaki, meal prepping sundays. hong kong', verified: false, avatar: '/avatars/food-ramen.svg', banner: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=1200' },
  { id: 'usr_99', username: 'golden_ollie', name: 'Hannah Brooks', bio: 'daily walks with ollie the golden retriever. seattle dog parks & wet paws', verified: false, avatar: '/avatars/mascot-shiba.svg', banner: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=1200' },
  { id: 'usr_100', username: 'cafe_conor', name: 'Conor Walsh', bio: 'flat whites, single-origin natural Ethiopians, finding good croissants in dublin', verified: false, avatar: '/avatars/food-coffee.svg', banner: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200' },
  { id: 'usr_101', username: 'pasta_pietro', name: 'Pietro Romano', bio: 'handmade tagliatelle, rolling pin dough, traditional ragù. bologna', verified: true, avatar: '/avatars/food-sourdough.svg', banner: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200' },

  // Readers, Musicians & Hobbyists (8)
  { id: 'usr_102', username: 'vinyl_vibes_ian', name: 'Ian MacIntyre', bio: 'crate digging in glasgow, post-punk 7-inches, blue note jazz reissues', verified: false, avatar: '/avatars/gear-vinyl.svg', banner: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200' },
  { id: 'usr_103', username: 'bookish_bhavna', name: 'Bhavna Reddy', bio: 'magical realism, physical paperbacks, highlighter margin notes. hyderabad', verified: false, avatar: '/avatars/books-reading.svg', banner: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200' },
  { id: 'usr_104', username: 'synth_sofia', name: 'Sofia Bellini', bio: 'modular synthesizers, generative ambient patches, milan. cable spaghetti artist', verified: false, avatar: '/avatars/gear-synth.svg', banner: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=1200' },
  { id: 'usr_105', username: 'strum_sean', name: 'Sean O’Donnell', bio: 'fingerstyle acoustic guitar, open D tunings, folk tunes. cork', verified: false, avatar: '/avatars/gear-headphones.svg', banner: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1200' },
  { id: 'usr_106', username: 'novel_nadia', name: 'Nadia Mansoor', bio: 'historical fiction, translation studies, vintage bookmarks. cairo', verified: false, avatar: '/avatars/books-reading.svg', banner: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200' },
  { id: 'usr_107', username: 'wood_and_grain', name: 'Magnus Eklund', bio: 'hand plane shavings, mortise and tenon joinery, walnut. trondheim', verified: false, avatar: '/avatars/nature-bonsai.svg', banner: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200' },
  { id: 'usr_108', username: 'mech_keys_ken', name: 'Kenjiro Watanabe', bio: 'lubing tactile switches, 40% ortholinear layouts, custom coiled cables. yokohama', verified: false, avatar: '/avatars/gear-keyboard.svg', banner: 'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=1200' },
  { id: 'usr_109', username: 'climbing_clara', name: 'Clara Vane', bio: 'desert sandstone trad climbing, campfire beans, salt lake city', verified: true, avatar: '/avatars/gear-boulder.svg', banner: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=1200' },
];
