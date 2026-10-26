import fs from 'node:fs';
import path from 'node:path';

// Generate 192 authentic posts across all requested categories
const newPosts = [
  // --- GAMING & ESPORTS (26 posts) ---
  {
    title: 'Balatro on Steam Deck is officially the most dangerous game in my library for bedtime procrastination',
    content: `I told myself "just one quick ante run before turning the lamp off." Looked at the clock and it was 1:45 AM, and I was intensely calculating whether a Poly Joker was worth rerolling a spectral pack. The UI scaling on the 800p OLED screen is completely flawless.`,
    community_id: 'comm_gaming', community_slug: 'gaming-esports', flair: 'Indie Games', tags: ['balatro', 'steamdeck', 'roguelike']
  },
  {
    title: 'What controller deadzone settings do you run for competitive tactical shooters?',
    content: `Been experimenting with inner and outer deadzone curves on Hall Effect thumbsticks. Dropping inner deadzone to 0.03 makes micro-adjustments on long-range crosshair placement feel instantaneous, but occasionally causes slight drift when releasing quickly. What is your go-to balance?`,
    community_id: 'comm_gaming', community_slug: 'gaming-esports', flair: 'Hardware & Settings', tags: ['controller', 'fps', 'competitive']
  },
  {
    title: 'Finally completed my first deathless run in Hollow Knight: Steel Soul mode',
    content: `After two previous attempts that ended tragically in the Royal Waterways, took down the Hollow Knight with zero deaths. The key was treating every single boss fight with total patience instead of over-chasing nail hits. Hands were genuinely shaking during the final phase.`,
    community_id: 'comm_gaming', community_slug: 'gaming-esports', flair: 'Milestone', tags: ['hollowknight', 'steelsoul', 'achievement']
  },
  {
    title: 'Why 120Hz display refresh rate matters more for input latency than visual smoothness',
    content: `A lot of people focus on how 120Hz or 144Hz looks visually, but the real advantage in action games is frame presentation latency. At 120Hz, your button press is sampled and reflected on-screen in roughly 8.3ms compared to 16.7ms at 60Hz. It makes parry timings feel completely tactile.`,
    community_id: 'comm_gaming', community_slug: 'gaming-esports', flair: 'Tech Breakdown', tags: ['hardware', 'latency', 'monitors']
  },
  {
    title: 'The sound design in Animal Well deserves an award: how subtle audio cues guide exploration',
    content: `No quest markers, no compass, no minimap icons—just quiet spatial audio of dripping water, echoing footsteps on slate, and subtle pitch shifts when you pass near hidden passages. Incredible demonstration of how trust in the player creates true atmosphere.`,
    community_id: 'comm_gaming', community_slug: 'gaming-esports', flair: 'Game Design', tags: ['animalwell', 'indie', 'audio']
  },
  {
    title: 'Replacing noisy stock fans with Noctua cooling fans inside a retro console mod',
    content: `Swapped the whiny 12V 40mm blower fan in my modded Dreamcast for a quiet Noctua NF-A4x10 running through a step-down buck converter. The console now runs whisper-quiet even after hours of Shenmue. Highly recommend this mod to anyone restoring older systems.`,
    community_id: 'comm_gaming', community_slug: 'gaming-esports', flair: 'Console Modding', tags: ['dreamcast', 'noctua', 'retrohardware']
  },
  {
    title: 'Ranked matchmaking mindset shift: focusing on round-by-round utility efficiency over raw K/D',
    content: `Spent three seasons stuck in Platinum trying to out-aim opponents in every 50-50 duel. Switched to focusing purely on smoke placements, crossfire positioning, and trade fragging. Climbed two divisions in three weeks without altering my mechanical aim at all.`,
    community_id: 'comm_gaming', community_slug: 'gaming-esports', flair: 'Competitive', tags: ['ranked', 'mindset', 'esports']
  },
  {
    title: 'Building a custom split ergonomic keyboard specifically mapped for left-hand gaming navigation',
    content: `Standard keyboards force your left wrist into an awkward outward flare during WASD movement. Built a 36-key Corne keyboard with a 25-degree inward tilt and thumb keys mapped to Jump, Crouch, and Sprint. My left forearm tension completely disappeared.`,
    community_id: 'comm_gaming', community_slug: 'gaming-esports', flair: 'Hardware', tags: ['ergonomics', 'keyboards', 'corne']
  },
  {
    title: 'The resurgence of local couch co-op games: why gaming in the same room remains unmatched',
    content: `Hosted four friends for an evening of Overcooked and TowerFall on the living room projector. There is an irreplaceable human energy in yelling callouts, passing controllers, and sharing a pizza that online voice chat simply cannot duplicate.`,
    community_id: 'comm_gaming', community_slug: 'gaming-esports', flair: 'Casual Gaming', tags: ['coop', 'localmultiplayer', 'party']
  },
  {
    title: 'Reflections after completing a 72-hour indie game jam: scoping down is the only secret',
    content: `Our team had ambitious plans for procedural dungeons, branching dialogue, and inventory systems. Cut 70% of it on day two to polish one satisfying core movement mechanic: a grappling hook with momentum preservation. That tight focus won us the community choice award!`,
    community_id: 'comm_gaming', community_slug: 'gaming-esports', flair: 'Game Jam', tags: ['gamedev', 'gamejam', 'indiedev']
  },
  {
    title: 'Why Celeste’s movement mechanics feel so forgiving despite brutal difficulty',
    content: `Maddy Thorson’s design breakdown of coyote time (jumping slightly after walking off a ledge) and jump buffering (registering jumps 4 frames before touching ground) explains why Celeste feels responsive rather than punishing. More platformers need these player-friendly micro-windows.`,
    community_id: 'comm_gaming', community_slug: 'gaming-esports', flair: 'Game Mechanics', tags: ['celeste', 'gamedesign', 'platformer']
  },
  {
    title: 'Modding an arcade fight stick with Sanwa JLF lever and quiet OBSFE buttons',
    content: `The tactile click of classic arcade buttons is nostalgic, but for late-night street fighter practice in a thin-walled apartment, Sanwa silence buttons with internal foam washers are an absolute lifesaver. Kept the precise actuation without waking anyone.`,
    community_id: 'comm_gaming', community_slug: 'gaming-esports', flair: 'Fightsticks', tags: ['fightinggames', 'arcade', 'sanwa']
  },
  {
    title: 'Anyone else keep a dedicated gaming notebook for maps, codes, and cipher notes?',
    content: `Playing through Tunic and Lorelei and the Laser Eyes with a physical grid notebook and fountain pen was the most satisfying puzzle experience of my year. Translating fictional runic alphabets by hand brings back the magic of 90s game manuals.`,
    community_id: 'comm_gaming', community_slug: 'gaming-esports', flair: 'Puzzle Games', tags: ['tunic', 'notebook', 'puzzlegames']
  },
  {
    title: 'Linux gaming on Arch with Proton: the state of anti-cheat compatibility in late 2026',
    content: `Nine out of ten games in my Steam library run natively or with zero friction under Proton GE. Easy Anti-Cheat works smoothly on titles where developers enabled Linux module support. The only remaining holdouts are kernel-level ring-0 anti-cheat drivers.`,
    community_id: 'comm_gaming', community_slug: 'gaming-esports', flair: 'Linux Gaming', tags: ['linux', 'proton', 'archlinux']
  },
  {
    title: 'Favorite cozy low-stress games to unwind after an exhausting week?',
    content: `Looking for titles where you can just wander, explore, or build without timers, fail states, or high-alert combat. Dorfromantik and A Short Hike have been my sanctuary lately. What is on your cozy playlist?`,
    community_id: 'comm_gaming', community_slug: 'gaming-esports', flair: 'Recommendations', tags: ['cozy', 'casual', 'recommendations']
  },
  {
    title: 'Speedrun practice methodology: breaking a 45-minute run into 30-second segmented save states',
    content: `Running full attempts repeatedly is the slowest way to improve. Spend 80% of your practice time looping the two hardest boss movement cycles using practice ROM save states until the muscle memory is 100% automated under pressure.`,
    community_id: 'comm_gaming', community_slug: 'gaming-esports', flair: 'Speedrunning', tags: ['speedrun', 'practice', 'optimization']
  },
  {
    title: 'Soundtrack spotlight: Christopher Larkin’s delicate ambient scoring in indie games',
    content: `The City of Tears piano motifs paired with ambient rain field recordings creates an unforgettable sense of melancholy. Video game scores have evolved into some of the finest contemporary orchestral and minimalist music being produced today.`,
    community_id: 'comm_gaming', community_slug: 'gaming-esports', flair: 'Soundtrack', tags: ['ost', 'soundtrack', 'music']
  },
  {
    title: 'Handheld emulation ergonomics: why 4:3 aspect ratio screens hit different for GBA and SNES',
    content: `Playing Game Boy Advance or Super Famicom titles on a modern 16:9 phone leaves huge black bars on both sides. A compact 3.5-inch 640x480 screen with 4x integer scaling feels like holding an authentic arcade cabinet in your pocket.`,
    community_id: 'comm_gaming', community_slug: 'gaming-esports', flair: 'Retro Handhelds', tags: ['emulation', 'snes', 'gba']
  },
  {
    title: 'Tips for reducing wrist strain during long mouse-and-keyboard gaming sessions',
    content: `Three quick adjustments that saved my wrist:
1. Lower mouse sensitivity and learn to aim from the elbow and shoulder rather than flicking purely with the wrist.
2. Position armrests flush with desk height so forearms rest flat.
3. Take 2-minute finger extension and prayer stretch breaks between matches.`,
    community_id: 'comm_gaming', community_slug: 'gaming-esports', flair: 'Health & Ergo', tags: ['ergonomics', 'wristhealth', 'tips']
  },
  {
    title: 'The unexpected storytelling brilliance of environmental narrative in survival games',
    content: `A skeleton holding a cassette tape next to an empty canteen tells a more haunting story in two seconds than twenty minutes of voice-acted exposition cutscenes. Environmental storytelling gives the player room to imagine the tragedy.`,
    community_id: 'comm_gaming', community_slug: 'gaming-esports', flair: 'Storytelling', tags: ['narrative', 'environment', 'design']
  },
  {
    title: 'Building a miniature Raspberry Pi arcade cabinet for classic Capcom fighting games',
    content: `Laser-cut 6mm birch plywood cabinet running RetroPie with an authentic 8-way bat-top joystick and CRT shader filter. Placed it on my bookshelf and it has become the main attraction whenever friends visit.`,
    community_id: 'comm_gaming', community_slug: 'gaming-esports', flair: 'DIY Arcade', tags: ['raspberrypi', 'arcade', 'retropie']
  },
  {
    title: 'How sound cues in multiplayer shooters create situational awareness without visual clutter',
    content: `Footstep surface textures (wood vs metal grating vs wet puddles) immediately reveal enemy positions on vertical maps. When developers balance spatial audio cleanly, you can play with 80% less reliance on radar HUD elements.`,
    community_id: 'comm_gaming', community_slug: 'gaming-esports', flair: 'Audio Design', tags: ['sounddesign', 'fps', 'audio']
  },
  {
    title: 'What was the first game that made you realize video games could be genuine art?',
    content: `For me it was Shadow of the Colossus on the PS2. The desolate wind blowing across the forbidden lands, the moral weight of each fallen giant, and the complete absence of celebratory fanfare. What was your defining title?`,
    community_id: 'comm_gaming', community_slug: 'gaming-esports', flair: 'Discussion', tags: ['gaminghistory', 'art', 'nostalgia']
  },
  {
    title: 'Customizing Steam Deck boot animations with custom suspend and wake videos',
    content: `Using Decky Loader and the Animation Changer plugin to set a retro PlayStation 1 BIOS boot chime on startup. It takes literally 2 minutes to install and brings a smile to my face every time I turn the handheld on.`,
    community_id: 'comm_gaming', community_slug: 'gaming-esports', flair: 'Steam Deck Tips', tags: ['steamdeck', 'decky', 'customization']
  },
  {
    title: 'Reviewing wireless gaming mouse weight: is sub-50 grams actually better for everyone?',
    content: `Tested a 42g ultra-light honeycomb mouse against a 68g solid shell. While the 42g is effortless for rapid twitch flicks in deathmatch, the slight inertia of the 68g mouse provided noticeably better crosshair stability during tracking aiming. Weight is personal preference, not a pure spec race.`,
    community_id: 'comm_gaming', community_slug: 'gaming-esports', flair: 'Mouse Review', tags: ['gamingmouse', 'peripherals', 'review']
  },
  {
    title: 'Game preservation alert: archiving physical manuals and cartridge art before disc rot sets in',
    content: `Spent the weekend high-resolution flatbed scanning 90s PC big box inserts and Japanese Famicom manuals at 600 DPI TIFF. Physical media degrades, but comprehensive digital archives ensure future generations can study the craft of classic package design.`,
    community_id: 'comm_gaming', community_slug: 'gaming-esports', flair: 'Preservation', tags: ['preservation', 'archives', 'history']
  },

  // --- ANIME, MANGA & FANDOM (22 posts) ---
  {
    title: 'The visual rhythm of panel transitions in Frieren: Beyond Journey’s End',
    content: `Kanehito Yamada and Tsukasa Abe understand visual silence better than almost any current manga creators. Wide horizontal panels showing shifting seasons and quiet skies convey the passage of fifty years without needing heavy dialogue bubbles. True mastery of comics pacing.`,
    community_id: 'comm_anime', community_slug: 'anime-manga', flair: 'Manga Analysis', tags: ['frieren', 'manga', 'paneling']
  },
  {
    title: 'Traditional cel animation vs modern digital compositing: why 90s hand-painted cels feel so grounded',
    content: `Hand-painted vinyl cel sheets have subtle physical imperfections: varying paint thickness, microscopic grain from photochemical film stock, and natural light leakage during camera rostrum exposures. Digital compositing is technically cleaner, but often lacks that warm organic texture.`,
    community_id: 'comm_anime', community_slug: 'anime-manga', flair: 'Animation Craft', tags: ['celanimation', 'sakuga', 'history']
  },
  {
    title: 'Screen tone layering techniques in clip studio paint for beginners',
    content: `Avoid stacking screen tones with identical dot frequencies at arbitrary angles, or you will create unsightly moiré interference patterns. Keep screen frequencies consistent (e.g. 60 lines) and rotate angles by at least 15 to 30 degrees when shading layered shadows.`,
    community_id: 'comm_anime', community_slug: 'anime-manga', flair: 'Tutorial', tags: ['clipstudiopaint', 'manga', 'screentones']
  },
  {
    title: 'Sakuga spotlight: the incredible dynamic camera tracking in modern action sequences',
    content: `Key animators breaking classical perspective grids to emphasize extreme foreshortening and momentum. Watching behind-the-scenes layout sheets with colored correction pencil marks proves how much geometric discipline goes into 12 frames of explosive sword choreography.`,
    community_id: 'comm_anime', community_slug: 'anime-manga', flair: 'Sakuga', tags: ['animation', 'sakuga', 'action']
  },
  {
    title: 'What manga series has the most inspiring background art for reference and practice?',
    content: `Inio Asano (Goodnight Punpun), Kaoru Mori (A Bride’s Story), and Tsutomu Nihei (BLAME!). Their architectural draftsmanship and crosshatching detail are unmatched masterclasses. Whose background art inspires your sketchbooks?`,
    community_id: 'comm_anime', community_slug: 'anime-manga', flair: 'Recommendations', tags: ['manga', 'artreference', 'backgrounds']
  },
  {
    title: 'High-density EVA foam beveling tips for clean cosplay armor seams',
    content: `Always use fresh snap-off utility blades every 15 cuts. EVA foam dulls steel razor edges remarkably fast, and a dull blade tears the cell walls instead of gliding smoothly. A 45-degree angled guide block ensures identical compound bevels on both breastplate halves.`,
    community_id: 'comm_anime', community_slug: 'anime-manga', flair: 'Cosplay Craft', tags: ['cosplay', 'evafoam', 'propmaking']
  },
  {
    title: 'Why episodic anime pacing often leaves a deeper emotional impression than breathless binge releases',
    content: `Waiting seven days between episodes gives viewers room to sit with unresolved dilemmas, discuss fan theories, and let character growth settle in their minds. The weekly watercooler rhythm creates community camaraderie that whole-season drops rarely capture.`,
    community_id: 'comm_anime', community_slug: 'anime-manga', flair: 'Fandom Discussion', tags: ['anime', 'pacing', 'community']
  },
  {
    title: 'Mechanical design in 80s mecha OVA series: why chunky hand-drawn cockpits look so convincing',
    content: `Analog toggle switches, CRT heads-up display lines, and articulated hydraulic hoses drawn by masters like Shoji Kawamori. The designs felt heavy and industrial—like real military flight hardware rather than weightless CGI polygon models.`,
    community_id: 'comm_anime', community_slug: 'anime-manga', flair: 'Mecha Design', tags: ['mecha', 'retroanime', 'design']
  },
  {
    title: 'Pen nib breakdown for traditional manga inking: G-Pen vs Maru-Pen vs School Pen',
    content: `Tachikawa G-pen delivers explosive line weight variation from hair-thin to 2mm with moderate wrist pressure—ideal for action silhouettes. Maru-pen (crowquill) is rigid and precise for fine eyes and delicate facial features without ink blot hazards.`,
    community_id: 'comm_anime', community_slug: 'anime-manga', flair: 'Traditional Inking', tags: ['inking', 'gpen', 'tools']
  },
  {
    title: 'Dungeon Meshi (Delicious in Dungeon) is a masterclass in grounded speculative biology',
    content: `Ryoko Kui didn’t just write recipes; she designed coherent ecological food webs where every monster anatomy makes evolutionary sense. How dragon lungs generate combustion, how living armor behaves like bivalve colonies—pure worldbuilding genius.`,
    community_id: 'comm_anime', community_slug: 'anime-manga', flair: 'Worldbuilding', tags: ['dungeonmeshi', 'worldbuilding', 'manga']
  },
  {
    title: 'Gouache painting tips for capturing luminous studio ghibli-style clouds',
    content: `Start with an underpainting of pale warm yellow-peach, not pure blue. Build cloud billows using opaque mixes of French Ultramarine, Cerulean, and Titanium White, dry-brushing soft scumbles on the shadowed underside. Leave the sunlight edge crisp and unblended.`,
    community_id: 'comm_anime', community_slug: 'anime-manga', flair: 'Painting Guide', tags: ['gouache', 'ghibli', 'clouds']
  },
  {
    title: 'Collecting art books: Japanese animation key visual collections you should own',
    content: `Otomo Katsuhiro’s 'Akira Animation Archives' and the official Studio Trigger animation books. Seeing raw timing charts, dope sheets, and rough animator sketches teaches you more about visual rhythm than five years of online tutorials.`,
    community_id: 'comm_anime', community_slug: 'anime-manga', flair: 'Art Books', tags: ['artbooks', 'animation', 'reference']
  },
  {
    title: 'Why sound effects (onomatopoeia) in manga are an integral part of graphic composition',
    content: `Japanese manga sound effects aren't just translated subtitles; their physical letterforms slash across panels to guide the reader’s eye tracking and reinforce impact velocity. Deleting or poorly replacing them flattens the dynamism of the entire page.`,
    community_id: 'comm_anime', community_slug: 'anime-manga', flair: 'Typography', tags: ['manga', 'typography', 'composition']
  },
  {
    title: '3D printing lightweight cosplay props: balancing infill strength with 8-hour convention wear',
    content: `Printing large staff heads or shoulder armor at 15% gyroid infill with 3 perimeters yields incredible structural durability while saving hundreds of grams. Your shoulders and lower back will thank you by hour six on the convention floor!`,
    community_id: 'comm_anime', community_slug: 'anime-manga', flair: '3D Printing', tags: ['cosplay', '3dprinting', 'props']
  },
  {
    title: 'The artistic bravery of Chainsaw Man Part 2’s movie-theater quiet pacing',
    content: `Tatsuki Fujimoto shifts effortlessly between cinematic horror and quiet character comedy. His signature four-koma rhythmic panel breakdowns make ordinary dialogue pauses between Asa and Denji feel as gripping as high-stakes combat.`,
    community_id: 'comm_anime', community_slug: 'anime-manga', flair: 'Manga Review', tags: ['chainsawman', 'fujimoto', 'manga']
  },
  {
    title: 'Color scripting in animated feature films: how hue palettes subconsciously map emotional arcs',
    content: `Notice how scenes of safety lean on warm amber and muted olive, while isolation shifts to desaturated blue-green with high contrast. Breaking down key frames into 3x3 color swatch chips reveals deliberate directorial intent in every sequence.`,
    community_id: 'comm_anime', community_slug: 'anime-manga', flair: 'Color Theory', tags: ['colorscript', 'film', 'animation']
  },
  {
    title: 'Preserving physical manga collections: temperature, humidity, and UV light protection',
    content: `Japanese tankobon paper contains high lignin content and yellows quickly when exposed to direct sunlight. Keep bookshelves out of UV windows and maintain indoor relative humidity around 45-55% to prevent page curling and spine glue desiccation.`,
    community_id: 'comm_anime', community_slug: 'anime-manga', flair: 'Collecting', tags: ['manga', 'preservation', 'collecting']
  },
  {
    title: 'Drawing expressive hand poses without stiffness: breaking palms into three dimensional wedge blocks',
    content: `Don't start with five individual fingers. Block out the main metacarpal palm slab as a wedge with thickness, establish the arc of the knuckles, and drop in finger gestures as single curved flow lines before adding joint volumes.`,
    community_id: 'comm_anime', community_slug: 'anime-manga', flair: 'Drawing Tips', tags: ['figuredrawing', 'hands', 'sketching']
  },
  {
    title: 'The timeless visual poetry of Mamoru Oshii’s Angel’s Egg (1985)',
    content: `With minimal dialogue and Yoshitaka Amano’s delicate Gothic character designs, Angel’s Egg proves that animation can function as pure philosophical metaphor and dreamscape painting. A film that demands patient, immersive viewing.`,
    community_id: 'comm_anime', community_slug: 'anime-manga', flair: 'Classic Anime', tags: ['retroanime', 'angelsegg', 'amano']
  },
  {
    title: 'How to organize digital brush libraries in Procreate without infinite scrolling paralysis',
    content: `Trim your active set down to 8 reliable brushes: one sketching pencil, one clean inker, one textured dry brush, two soft blenders, and three watercolor washes. When you stop hunting for magic brushes, your actual drawing technique flourishes.`,
    community_id: 'comm_anime', community_slug: 'anime-manga', flair: 'Digital Art', tags: ['procreate', 'digitalart', 'workflow']
  },
  {
    title: 'Cosplay wig styling: crimping base layers for gravity-defying anime spikes',
    content: `Never spray hairspray on flat synthetic hair and hope it stands up. You must crimp the root sections with a micro-crimper to create internal friction volume, tease the base with a rat-tail comb, and steam-set the spikes in small sections.`,
    community_id: 'comm_anime', community_slug: 'anime-manga', flair: 'Wig Styling', tags: ['cosplay', 'wigs', 'crafting']
  },
  {
    title: 'Seasonal anime reflection: which series surprised you the most this autumn?',
    content: `Went into the season expecting very little from the fantasy adaptations, but the background art direction and character writing on two smaller indie productions blew me away. What was your unexpected hidden gem this season?`,
    community_id: 'comm_anime', community_slug: 'anime-manga', flair: 'Discussion', tags: ['anime', 'seasonal', 'impressions']
  },

  // --- CARS, MOTORSPORT & MECHANICS (22 posts) ---
  {
    title: 'Track day tire pressure physics: why setting hot pressure matters ten times more than cold baseline',
    content: `Tires on track can gain 6 to 10 psi as tread temperatures climb past 85°C. If you set your cold pressure to 34 psi, you will be sliding around at 42 psi by lap three with a ballooned contact patch. Always bleed pressures down immediately after coming off track to hit target hot psi.`,
    community_id: 'comm_motorsport', community_slug: 'cars-motorsport', flair: 'Track Driving', tags: ['trackday', 'tires', 'physics']
  },
  {
    title: 'DIY brake bleeding: motive pressure bleeder vs traditional two-person pedal pumping',
    content: `Used a Motive pressure bleeder set to 15 psi on the master cylinder reservoir. Flushed clean high-temp fluid through all four corners in twenty minutes with zero air bubble ingress. Far safer and more consistent than having a helper pump and hold the brake pedal.`,
    community_id: 'comm_motorsport', community_slug: 'cars-motorsport', flair: 'Tech Tips', tags: ['brakes', 'maintenance', 'tools']
  },
  {
    title: 'Motorcycle chain maintenance: kerosene cleaning vs dedicated spray cleaners and wax vs lube',
    content: `After 15,000 km of year-round riding, plain kerosene with a three-sided Grunge Brush is the gentlest cleaner for O-ring and X-ring seals. Wipe completely dry with microfibers and apply synthetic chain paste to warm links right after riding.`,
    community_id: 'comm_motorsport', community_slug: 'cars-motorsport', flair: 'Two Wheels', tags: ['motorcycle', 'chain', 'maintenance']
  },
  {
    title: 'Restoring yellowed oxidized polycarbonate headlights with wet sanding and 2K clear coat',
    content: `Toothpaste and cheap polish kits wash off after three weeks of rain. The only permanent fix: wet sand with 800, 1500, then 2500 grit paper, wipe down with isopropyl alcohol, and spray two wet coats of 2K UV-blocking urethane clear. Lens looks factory-new.`,
    community_id: 'comm_motorsport', community_slug: 'cars-motorsport', flair: 'Detailing', tags: ['detailing', 'headlights', 'restoration']
  },
  {
    title: 'Direct-drive sim racing steering wheels: why 12Nm torque is the sweet spot for feedback fidelity',
    content: `You don’t need 25Nm that rips the wheel out of your hands. 10 to 14Nm gives you lightning-fast slew rates and crystal-clear tire slip angle feedback over curbs without inducing rapid shoulder fatigue during 60-minute endurance stints.`,
    community_id: 'comm_motorsport', community_slug: 'cars-motorsport', flair: 'Sim Racing', tags: ['simracing', 'directdrive', 'telemetry']
  },
  {
    title: 'The joy of driving a slow car fast on narrow country backroads',
    content: `A 500hp supercar on public twisty roads means shifting from 2nd to 3rd gear once before hitting impound speeds. In a lightweight 120hp momentum car, you can rev-match downshift through three gears, carry speed through corners, and drive at 9/10ths without endangering anyone.`,
    community_id: 'comm_motorsport', community_slug: 'cars-motorsport', flair: 'Driving Impressions', tags: ['driving', 'momentum', 'backroads']
  },
  {
    title: 'Corner balancing a coilover-equipped chassis: understanding diagonal cross-weight percentages',
    content: `Setting ride height with a tape measure leaves your diagonal weights unbalanced. Putting the car on four corner scales with driver ballast and adjusting spring perches to achieve exactly 50.0% cross-weight eliminates asymmetric left-versus-right braking pull.`,
    community_id: 'comm_motorsport', community_slug: 'cars-motorsport', flair: 'Chassis Setup', tags: ['chassis', 'coilovers', 'alignment']
  },
  {
    title: 'Engine oil analysis with Blackstone Labs: reading wear metals in used 5W-40 track oil',
    content: `Sent in a 3,000-mile sample after four track days. Copper and lead bearings showed 4 ppm (well below average), aluminum was at 3 ppm, and zero fuel dilution detected. Regular used-oil laboratory analysis gives total peace of mind before high-rpm track weekends.`,
    community_id: 'comm_motorsport', community_slug: 'cars-motorsport', flair: 'Maintenance', tags: ['oilanalysis', 'engine', 'trackprep']
  },
  {
    title: 'Tackling the Western Ghats mountain passes on a Royal Enfield Himalayan 450',
    content: `Climbed through mist-covered tea plantations near Munnar. The liquid-cooled Sherpa engine has brilliant low-end torque for climbing steep switchbacks in second gear, and the 200mm suspension travel soaked up broken monsoon tarmac with ease.`,
    community_id: 'comm_motorsport', community_slug: 'cars-motorsport', flair: 'Motorcycle Tour', tags: ['royalenfield', 'india', 'touring']
  },
  {
    title: 'Why slotted brake rotors are preferable to cross-drilled rotors for track applications',
    content: `Cross-drilled holes look exotic on showroom floors, but under intense thermal cycling on track, small microscopic stress cracks inevitably radiate outwards from the holes. Directional curved slots degas the pad face without sacrificing structural rotor integrity.`,
    community_id: 'comm_motorsport', community_slug: 'cars-motorsport', flair: 'Brakes', tags: ['brakes', 'trackday', 'engineering']
  },
  {
    title: 'Building a dual-sport tool kit: essential trailside repair gear that fits in a fender pack',
    content: `Pack contents that have saved me miles from civilization: motion pro tire irons with axle wrench ends, spare 21-inch tube, mini bicycle pump, 1/4" ratchet with 8/10/12mm sockets, zip ties, safety wire, and quick-setting metal epoxy stick.`,
    community_id: 'comm_motorsport', community_slug: 'cars-motorsport', flair: 'Trail Gear', tags: ['motorcycle', 'dualsport', 'tools']
  },
  {
    title: 'Paint correction on soft Japanese clear coat: avoiding micro-marring with ultra-soft foam pads',
    content: `Older JDM paint is notoriously thin and soft. Heavy microfiber pads and aggressive compounds will leave hazy buffer trails. Switch to a Rupes yellow foam pad with Sonax Perfect Finish and light machine pressure for a deep, swirl-free gloss finish.`,
    community_id: 'comm_motorsport', community_slug: 'cars-motorsport', flair: 'Detailing Guide', tags: ['detailing', 'paintcorrection', 'polishing']
  },
  {
    title: 'Heel-toe downshifting technique: pedal spacing adjustments and ankle pivot practice',
    content: `If your brake pedal sinks well below your accelerator under hard threshold braking, smooth blipping is impossible. Adding a 5mm aluminum spacer to the throttle pedal face brought the heights flush and made downshifts into turn one completely seamless.`,
    community_id: 'comm_motorsport', community_slug: 'cars-motorsport', flair: 'Driving Technique', tags: ['driving', 'heeltoe', 'manual']
  },
  {
    title: 'Telemetry analysis in iRacing: comparing throttle application traces on corner exit',
    content: `Overlaying my telemetry against a top split driver revealed I was stabbing 100% throttle abruptly, inducing minor rear slip that bled momentum. Smoothing the initial throttle squeeze to 70% before progressive roll-on carried 3 km/h more speed down the back straight.`,
    community_id: 'comm_motorsport', community_slug: 'cars-motorsport', flair: 'Telemetry', tags: ['simracing', 'telemetry', 'driving']
  },
  {
    title: 'Vintage air-cooled engine valve adjustment: the satisfying rhythm of feeler gauges',
    content: `Setting valve lash to 0.10mm on all six cylinders with cylinder 1 at top dead center. Sliding a curved feeler gauge between rocker arm and valve stem with that perfect slight oily drag. Mechanical simplicity at its finest.`,
    community_id: 'comm_motorsport', community_slug: 'cars-motorsport', flair: 'Vintage Wrenching', tags: ['aircooled', 'valves', 'engine']
  },
  {
    title: 'Track day insurance: why buying single-event agreed value coverage is non-negotiable',
    content: `Standard personal automotive policies explicitly exclude any incidents that occur on closed-course facilities, even non-timed HPDE driving schools. For roughly $180 per weekend, single-event agreed value coverage gives complete financial protection.`,
    community_id: 'comm_motorsport', community_slug: 'cars-motorsport', flair: 'Track Advice', tags: ['trackday', 'insurance', 'safety']
  },
  {
    title: 'Restoring cracked vinyl dashboard tops using flexible structural filler and texture grain pads',
    content: `Filled sun-cracked fissures on a 90s dash with flexible vinyl repair compound, pressed silicone grain texture sheets over the repair during curing, and sprayed satin SEM interior dye. Saved hundreds over hunting for rare uncracked replacement parts.`,
    community_id: 'comm_motorsport', community_slug: 'cars-motorsport', flair: 'Interior Restoration', tags: ['interior', 'restoration', 'diy']
  },
  {
    title: 'Motorcycle tire profile comparison: 180/55 vs 180/60 for sharper turn-in agility',
    content: `Switching to a taller 60-series profile on the rear wheel steepened the effective steering head angle slightly and provided a significantly larger contact patch when leaned over at full edge. The bike feels eager to drop into apexes.`,
    community_id: 'comm_motorsport', community_slug: 'cars-motorsport', flair: 'Motorcycle Tech', tags: ['motorcycle', 'tires', 'handling']
  },
  {
    title: 'What was your most humbling mechanical mistake in the garage that taught you a great lesson?',
    content: `Mine was cross-threading an aluminum oil pan drain plug twenty minutes before a track weekend because I used a socket wrench to start the threads instead of threading it fully by hand first. What garage mishap taught you a golden rule?`,
    community_id: 'comm_motorsport', community_slug: 'cars-motorsport', flair: 'Discussion', tags: ['garage', 'mistakes', 'mechanic']
  },
  {
    title: 'Brake fluid boiling points: understanding wet vs dry boiling ratings after six months of driving',
    content: `Fresh fluid might boast a 310°C dry boiling point, but brake fluid is hygroscopic and absorbs ambient moisture through caliper seals. That is why wet boiling point (typically 200°C) is what actually prevents vapor lock and pedal fade after six months of real-world use.`,
    community_id: 'comm_motorsport', community_slug: 'cars-motorsport', flair: 'Brake Tech', tags: ['brakes', 'fluid', 'safety']
  },
  {
    title: 'Building a clean minimalist garage space: epoxy flooring, magnetic tool strips, and 5000K LED tubes',
    content: `Transformed a dingy concrete garage into a bright, enjoyable workspace. A light grey 2-part epoxy floor reflects light up into the underside of cars on jack stands, and high-CRI overhead LED tubes eliminate annoying shadows when inspecting paint.`,
    community_id: 'comm_motorsport', community_slug: 'cars-motorsport', flair: 'Garage Setup', tags: ['garage', 'workspace', 'lighting']
  },
  {
    title: 'Sim racing pedal upgrade: why load cell brake pedals transform your lap consistency overnight',
    content: `Potentiometer pedals measure physical travel distance, which human leg muscles struggle to replicate consistently. Load cell pedals measure actual applied pressure in kilograms—activating muscle memory so your threshold trail-braking becomes automated.`,
    community_id: 'comm_motorsport', community_slug: 'cars-motorsport', flair: 'Sim Hardware', tags: ['simracing', 'pedals', 'loadcell']
  },

  // --- SPORTS, FITNESS & RECREATION (22 posts) ---
  {
    title: 'Fingerboard training protocol for bouldering: max hangs vs repeater sets for tendon strength',
    content: `For building pure connective tissue recruitment without high fatigue, 10-second max hangs at bodyweight plus weight on a 20mm edge with 3 minutes rest between sets beats doing endless pumped repeaters. Twice a week consistency over six months has kept my fingers injury-free.`,
    community_id: 'comm_sports', community_slug: 'sports-fitness', flair: 'Climbing Training', tags: ['bouldering', 'hangboard', 'training']
  },
  {
    title: 'First half-marathon training block: why 80% of your weekly miles should feel embarrassingly easy',
    content: `When I started running, I tried to race every 5k training run and ended up with shin splints. Switched to zone 2 conversational pacing where you can comfortably breathe through your nose. Aerobic capacity exploded and weekly mileage jumped to 45km without injury.`,
    community_id: 'comm_sports', community_slug: 'sports-fitness', flair: 'Running Advice', tags: ['running', 'halfmarathon', 'zone2']
  },
  {
    title: 'The deadlift lat engagement cue that finally eliminated lower back rounding',
    content: `Before you pull the slack out of the barbell, think about squeezing an orange inside each armpit or bending the bar around your shins. That cues immediate latissimus dorsi tension, locks the thoracic spine in place, and prevents the hips from shooting up early.`,
    community_id: 'comm_sports', community_slug: 'sports-fitness', flair: 'Lifting Form', tags: ['deadlift', 'powerlifting', 'form']
  },
  {
    title: 'Indoor basketball pickup runs: sneaker traction on dusty courts and ankle support myths',
    content: `Wiping the outsole rubber every dead ball with a damp towel is the only way to maintain grip on dusty community center courts. Low-top vs high-top ankle support is largely a myth—proper heel counter lockdown and wide outrigger bases are what truly prevent ankle rolls.`,
    community_id: 'comm_sports', community_slug: 'sports-fitness', flair: 'Basketball', tags: ['basketball', 'sneakers', 'hoops']
  },
  {
    title: 'Trail running nutrition on 3-hour mountain runs: fueling with real food vs energy gels',
    content: `After two hours of sugary maltodextrin gels, gut rot is real. Switched to small boiled baby potatoes tossed in sea salt, medjool dates with almond butter, and electrolyte water in soft flasks. Sustained energy with zero digestive distress.`,
    community_id: 'comm_sports', community_slug: 'sports-fitness', flair: 'Trail Nutrition', tags: ['trailrunning', 'nutrition', 'fuel']
  },
  {
    title: 'Shoulder pre-hab routine for rock climbers: face pulls, internal rotations, and scapular pull-ups',
    content: `Climbers develop dominant lats and anterior shoulders from constant pulling. Adding three sets of cable face pulls with external rotation and Cuban presses on rest days restored my shoulder posture and banished impingement pain for good.`,
    community_id: 'comm_sports', community_slug: 'sports-fitness', flair: 'Pre-Hab & Health', tags: ['climbing', 'shoulders', 'rehab']
  },
  {
    title: 'Home gym essentials: what to buy first when building a workout space on a budget',
    content: `Skip the fancy multi-gym cable machines. Start with three items:
1. Solid steel power rack with pull-up bar.
2. 20kg Olympic barbell with rubber bumper plates.
3. Adjustable flat-to-incline bench.
That covers squats, presses, deadlifts, and rows for years of progression.`,
    community_id: 'comm_sports', community_slug: 'sports-fitness', flair: 'Home Gym', tags: ['homegym', 'barbell', 'strength']
  },
  {
    title: 'Club cricket match debrief: building a 60-run 7th wicket partnership under overcast skies',
    content: `We were reeling at 85 for 6 on a damp green pitch in Pune. Batted for 18 overs with our tailender, leaving everything outside off stump and rotating strike with quick singles to mid-on. Pushed our total to 180 and our seam bowlers defended it in the final over!`,
    community_id: 'comm_sports', community_slug: 'sports-fitness', flair: 'Cricket', tags: ['cricket', 'clubcricket', 'matchday']
  },
  {
    title: 'Sleep quality and HRV (Heart Rate Variability) as indicators of athletic recovery',
    content: `Tracking morning HRV with a chest strap shows clear correlation with training strain. When morning HRV drops 15% below baseline after hard intervals, pushing through another heavy session usually leads to fatigue. Listening to the data and resting is a skill.`,
    community_id: 'comm_sports', community_slug: 'sports-fitness', flair: 'Recovery Science', tags: ['recovery', 'hrv', 'sleep']
  },
  {
    title: 'Bouldering problem reading: visualizing hand and foot sequences before leaving the mat',
    content: `Watch the best climbers in your gym—they spend two minutes on the floor tracing every body twist with their hands before touching the starting holds. Visualizing hip positions and weight transfers saves skin and energy.`,
    community_id: 'comm_sports', community_slug: 'sports-fitness', flair: 'Climbing Tips', tags: ['bouldering', 'technique', 'climbing']
  },
  {
    title: 'The mental benefits of daily 30-minute sunrise walks with zero phone headphones',
    content: `No podcasts, no audiobooks, no calls. Just listening to morning birds, watching early transit buses, and letting your mind wander through thoughts without stimulation. It has done more for my stress levels than any productivity app.`,
    community_id: 'comm_sports', community_slug: 'sports-fitness', flair: 'Mental Health', tags: ['walking', 'mindfulness', 'morning']
  },
  {
    title: 'Barbell back squat depth: identifying ankle dorsiflexion limitations vs hip mobility',
    content: `If your heels lift or your torso collapses forward at parallel, test your knee-to-wall ankle mobility. Adding 5mm elevated heel weightlifting shoes or spending two weeks on calf stretches often fixes squat mechanics immediately.`,
    community_id: 'comm_sports', community_slug: 'sports-fitness', flair: 'Squat Form', tags: ['squats', 'mobility', 'strength']
  },
  {
    title: 'Road cycling hill climbing technique: cadence management and standing vs seated pacing',
    content: `Grinding at 55 rpm in a tall gear fries your quads and spikes lactate. Shifting into a 34x32 granny gear and maintaining a smooth 85 rpm cadence seated keeps your heart rate manageable over 20-minute alpine climbs.`,
    community_id: 'comm_sports', community_slug: 'sports-fitness', flair: 'Cycling', tags: ['cycling', 'roadbike', 'climbing']
  },
  {
    title: 'Post-running blister prevention: double-layer socks vs blister tape on long trail runs',
    content: `Wrightsock double-layer socks completely stopped friction hot spots on 25k mountain descents. The two sock layers rub against each other instead of your skin rubbing against sock fibers. Simple game changer.`,
    community_id: 'comm_sports', community_slug: 'sports-fitness', flair: 'Gear Advice', tags: ['running', 'gear', 'blisters']
  },
  {
    title: 'Grip training for functional strength: farmer carries with heavy kettlebells',
    content: `Walking 50 paces with a pair of 32kg kettlebells tests total body tension: forearms burning, traps on fire, and core bracing to prevent lateral torso wobble. One of the highest return-on-investment exercises in the gym.`,
    community_id: 'comm_sports', community_slug: 'sports-fitness', flair: 'Strength Training', tags: ['kettlebells', 'griptraining', 'core']
  },
  {
    title: 'Outdoor boulder ethics: leave no trace, brush off chalk marks, and pack out fruit peels',
    content: `Outdoor crags and boulder fields face increasing access restrictions. Always brush off your tick marks and chalked slopers before leaving, stay on designated approach trails, and never leave banana peels or tape scraps behind.`,
    community_id: 'comm_sports', community_slug: 'sports-fitness', flair: 'Crag Ethics', tags: ['climbing', 'outdoors', 'leavenotrace']
  },
  {
    title: 'Hydration electrolytes: sodium vs potassium balance on humid summer workout days',
    content: `Drinking pure water when you are drenched in sweat only dilutes blood sodium levels, leading to cramps and brain fog. Adding 500mg of sodium and 150mg of potassium per liter of water keeps cellular hydration and muscle contractions sharp.`,
    community_id: 'comm_sports', community_slug: 'sports-fitness', flair: 'Hydration', tags: ['hydration', 'nutrition', 'electrolytes']
  },
  {
    title: 'How do you structure your training when balancing full-time work and hobbies?',
    content: `Currently balancing 40 hours of software work, marathon training 4 days a week, and bouldering on weekends. The hardest part is ruthlessly protecting 8 hours of sleep. How do you balance fitness goals with career demands?`,
    community_id: 'comm_sports', community_slug: 'sports-fitness', flair: 'Discussion', tags: ['worklifebalance', 'fitness', 'training']
  },
  {
    title: 'Foam rolling myths vs real benefits: why gentle rolling desensitizes tight muscles',
    content: `Foam rolling doesn’t physically break up fascia tissue or lengthen tight tendons. What it actually does is stimulate sensory mechanoreceptors in the nervous system, signaling tight muscles to relax and temporarily improving range of motion.`,
    community_id: 'comm_sports', community_slug: 'sports-fitness', flair: 'Recovery', tags: ['mobility', 'foamroller', 'rehab']
  },
  {
    title: 'Pacing a 5k personal record: the first kilometer should feel conservative, not heroic',
    content: `The single biggest mistake in 5k races is sprinting out of the corral in the first 400 meters on pure adrenaline. Banked time in the first kilometer is paid back with compound interest in agony during kilometer four. Run even splits.`,
    community_id: 'comm_sports', community_slug: 'sports-fitness', flair: 'Running Strategy', tags: ['5k', 'running', 'pacing']
  },
  {
    title: 'Winter indoor training setup: smart bike trainer, fan airflow, and virtual group rides',
    content: `Sub-zero winter roads in Denver mean indoor trainer season. A high-velocity industrial blower fan positioned at chest height makes indoor cycling bearable, and joining virtual group rides keeps motivation high until spring tarmac returns.`,
    community_id: 'comm_sports', community_slug: 'sports-fitness', flair: 'Indoor Training', tags: ['cycling', 'wintertraining', 'zwift']
  },
  {
    title: 'The humble jump rope: ten minutes of double-unders for footwork speed and calf conditioning',
    content: `Cost $12, fits in any backpack, and ten minutes of rhythmic skipping builds explosive ankle stiffness, aerobic conditioning, and foot coordination better than twenty minutes on a treadmill. An essential warmup tool.`,
    community_id: 'comm_sports', community_slug: 'sports-fitness', flair: 'Conditioning', tags: ['jumprope', 'conditioning', 'footwork']
  },

  // --- CAMPUS LIFE & STUDENT TECH (22 posts) ---
  {
    title: 'Dorm room cooking with a single portable induction burner: 15-minute garlic noodles and greens',
    content: `Living in a residence hall without a shared kitchen taught me culinary minimalism. Boil fresh ramen noodles in 3 minutes, drain, and toss in the hot pan with garlic, scallions, soy sauce, chili crisp, and a handful of bok choy. Beats instant ramen cups every time.`,
    community_id: 'comm_campus', community_slug: 'campus-life', flair: 'Dorm Cooking', tags: ['dormlife', 'cooking', 'collegelife']
  },
  {
    title: 'Surviving your first Computer Systems & Architecture course: tips from a junior TA',
    content: `The jump from introductory Python to C pointers, memory offsets, and assembly registers shocks many students. Three survival tips:
1. Draw memory diagrams with boxes and addresses for every pointer pointer.
2. Run Valgrind on every assignment from day one.
3. Come to office hours early before the deadline crunch.`,
    community_id: 'comm_campus', community_slug: 'campus-life', flair: 'Academic Advice', tags: ['computerscience', 'cprogramming', 'studyadvice']
  },
  {
    title: 'Why keeping a physical lab notebook for engineering coursework beats messy iPad notes',
    content: `There is something permanent and disciplined about writing formulas, recording raw multimeter voltages, and taping thermal printouts into a bound hardcover grid notebook. It trains you for professional industrial engineering standards.`,
    community_id: 'comm_campus', community_slug: 'campus-life', flair: 'Lab Work', tags: ['engineering', 'notebook', 'study']
  },
  {
    title: 'Preparing for your first technical software internship interview: behavioral stories matter as much as LeetCode',
    content: `Everyone grinds algorithmic array questions, but interviewers remember candidates who clearly articulate a messy project conflict, how they handled a broken staging deployment, and what they learned from failure. Prepare 4 concrete stories using the STAR method.`,
    community_id: 'comm_campus', community_slug: 'campus-life', flair: 'Career Advice', tags: ['internship', 'interviewprep', 'careers']
  },
  {
    title: 'University library etiquette: silent study floors are meant to be SILENT',
    content: `Friendly PSA for midterm season: if you need to take a phone call, whisper to your friend for twenty minutes, or crunch potato chips with open microphone headphones, please move to the 1st floor cafe. Some of us are writing our honors theses on the 4th floor!`,
    community_id: 'comm_campus', community_slug: 'campus-life', flair: 'Campus PSA', tags: ['library', 'etiquette', 'collegelife']
  },
  {
    title: 'Building a tiny campus shuttle tracking web app with open transit GTFS-RT APIs',
    content: `Tired of standing in the freezing rain wondering if the campus loop bus was running 15 minutes late. Built a responsive web app that queries the university transit feed and maps vehicle locations on Mapbox. 400 classmates used it during finals week!`,
    community_id: 'comm_campus', community_slug: 'campus-life', flair: 'Student Project', tags: ['webdev', 'transit', 'portfolio']
  },
  {
    title: 'How to manage group project team dynamics when one member goes completely dark',
    content: `We have all been in the 4-person group project where one member stops responding to Discord messages. Lesson learned: establish a team contract with internal mini-deadlines on week one, and notify your TA early if communication breaks down instead of doing all the work at 3 AM.`,
    community_id: 'comm_campus', community_slug: 'campus-life', flair: 'Group Projects', tags: ['groupwork', 'teamwork', 'college']
  },
  {
    title: 'The magic of late-night campus dining hall conversations with friends',
    content: `It’s 11:30 PM, you should be studying discrete mathematics, but instead you and three dorm-mates are passionately debating simulation theory and 90s cartoons over bowls of cereal in the campus cafeteria. These unplanned moments are what you remember most.`,
    community_id: 'comm_campus', community_slug: 'campus-life', flair: 'Memories', tags: ['dormlife', 'friends', 'nostalgia']
  },
  {
    title: 'Textbook purchasing guide: never buy brand-new current-edition hardcovers from the bookstore',
    content: `Check university library course reserves first (often free digital scans), rent older edition PDFs online for 90% off, or join student discord textbook exchange channels. 9th edition physics problems are identical to 8th edition with numbers swapped.`,
    community_id: 'comm_campus', community_slug: 'campus-life', flair: 'Money Saving', tags: ['textbooks', 'collegehacks', 'budget']
  },
  {
    title: 'Building an active student club community: how our university robotics club doubled membership',
    content: `We stopped doing formal lecture presentations on theory and started holding hands-on "solder your first blinky LED badge" workshops on Friday afternoons with free pizza. Lowering the barrier to entry gave newcomers immediate confidence.`,
    community_id: 'comm_campus', community_slug: 'campus-life', flair: 'Student Clubs', tags: ['robotics', 'community', 'makerspace']
  },
  {
    title: 'How to structure your study sessions: 50/10 Pomodoro intervals with zero phone screen checks',
    content: `50 minutes of deep focus with your phone face down in another room, followed by a 10-minute break to stretch, refill water, and gaze out the window. Three cycles (3 hours) of true focus accomplishes more than eight hours of distracted study with TikTok open.`,
    community_id: 'comm_campus', community_slug: 'campus-life', flair: 'Study Tips', tags: ['pomodoro', 'productivity', 'focus']
  },
  {
    title: 'The transition from university coursework to your first junior software engineering job',
    content: `Coursework teaches you to write greenfield 300-line programs from scratch for an automated grader. Real engineering is reading a 500,000-line legacy codebase, navigating team review comments, and changing three lines without breaking downstream dependencies.`,
    community_id: 'comm_campus', community_slug: 'campus-life', flair: 'Career Reflections', tags: ['junioradvise', 'careers', 'softwareengineering']
  },
  {
    title: 'Budget dorm coffee setup: French press, cheap hand grinder, and local grocery beans',
    content: `You don’t need a $600 espresso machine in your residence hall. A $15 glass French press and a manual ceramic burr grinder produces rich, full-bodied morning coffee for $0.35 a cup. Beats paying $6 at the campus Starbucks every single morning.`,
    community_id: 'comm_campus', community_slug: 'campus-life', flair: 'Coffee on a Budget', tags: ['dormcoffee', 'frenchpress', 'budget']
  },
  {
    title: 'Why taking humanities electives as an engineering major was the best decision of my degree',
    content: `Taking courses in Philosophy of Science and 20th-Century Architecture taught me critical thinking, rhetoric, and writing clarity that technical coursework never touched. Engineers who can communicate complex ideas clearly have an enormous advantage.`,
    community_id: 'comm_campus', community_slug: 'campus-life', flair: 'Academics', tags: ['electives', 'humanities', 'perspective']
  },
  {
    title: 'Hackathon survival kit: packing list for a 36-hour weekend sprint event',
    content: `Must-haves in your backpack:
- 10-foot long heavy-duty power strip (wall outlets will be occupied).
- Noise-canceling over-ear headphones.
- Sleeping pad and compact travel blanket.
- Toothbrush and face wipes for a 4:00 AM refresh.
- Eye drops and healthy snacks.`,
    community_id: 'comm_campus', community_slug: 'campus-life', flair: 'Hackathons', tags: ['hackathon', 'packing', 'coding']
  },
  {
    title: 'Navigating imposter syndrome during your first semester of university STEM classes',
    content: `It feels like everyone else in the lecture hall already learned multivariable calculus in high school or wrote compiler plugins as teenagers. The truth: most students are just as bewildered, but project quiet confidence. Ask questions without shame.`,
    community_id: 'comm_campus', community_slug: 'campus-life', flair: 'Mental Health', tags: ['impostersyndrome', 'stem', 'college']
  },
  {
    title: 'Creating an open-source student portfolio project: quality of documentation matters more than size',
    content: `A small, tightly focused CLI utility with a clean README, animated GIF demo, automated unit tests, and single-command install impresses hiring managers ten times more than an unfinished half-broken full-stack clone repository with zero documentation.`,
    community_id: 'comm_campus', community_slug: 'campus-life', flair: 'Portfolio Advice', tags: ['opensource', 'portfolio', 'github']
  },
  {
    title: 'Campus bike commuting: winter tire studs, fenders, and high-security U-locks',
    content: `Fenders protect your backpack from muddy road spray, and two hardened steel U-locks through both wheels and frame keep your bike safe outside campus buildings. Riding through crisp autumn leaves beats sitting in crowded campus shuttles.`,
    community_id: 'comm_campus', community_slug: 'campus-life', flair: 'Commuting', tags: ['biking', 'commute', 'campus']
  },
  {
    title: 'The satisfaction of turning in the final comprehensive exam of your degree',
    content: `Walked out of the exam hall into the bright noon sunlight. Four years of late-night problem sets, laboratory reports, and stressed finals weeks behind me. Took a deep breath of fresh air and went for a long, quiet walk along the river.`,
    community_id: 'comm_campus', community_slug: 'campus-life', flair: 'Graduation', tags: ['graduation', 'milestone', 'relief']
  },
  {
    title: 'Organizing class research notes with plain Markdown files and Git version control',
    content: `Moved all my course lecture notes from proprietary apps to a private Git repository with folders by semester and course code. Searching through two years of coursework with ripgrep takes 20 milliseconds, and the notes will remain readable for fifty years.`,
    community_id: 'comm_campus', community_slug: 'campus-life', flair: 'Note Taking', tags: ['markdown', 'git', 'studynotes']
  },
  {
    title: 'What was the most rewarding student project you built during your college years?',
    content: `For me it was designing a solar-powered soil moisture sensor mesh network deployed in the campus community garden. Seeing real-world telemetry stream into our dashboard was unforgettable. What was your proudest student project?`,
    community_id: 'comm_campus', community_slug: 'campus-life', flair: 'Discussion', tags: ['studentprojects', 'maker', 'college']
  },
  {
    title: 'Dorm room plant care: hardy indoor plants that survive drafty windows and low sunlight',
    content: `ZZ plants (Zamioculcas zamiifolia) and Snake plants (Sansevieria) are virtually indestructible. They thrive on low ambient light, require watering only once every three weeks, and add a much-needed splash of living green to concrete dorm walls.`,
    community_id: 'comm_campus', community_slug: 'campus-life', flair: 'Dorm Greenery', tags: ['houseplants', 'dormlife', 'greenery']
  },

  // --- EVERYDAY FOOD, COOKING & CAFÉ (26 posts) ---
  {
    title: 'The secret to authentic Roman pasta carbonara: egg yolks, pecorino romano, and starchy pasta water',
    content: `No cream, no peas, no garlic. Crisp up diced guanciale (or good pancetta) in a cold pan until the fat renders clear. Mix three egg yolks and a mountain of freshly grated Pecorino with black pepper. Emulsify off heat with hot starchy pasta water for a silky, glossy sauce.`,
    community_id: 'comm_food', community_slug: 'food-cooking', flair: 'Pasta Craft', tags: ['carbonara', 'pasta', 'italiancooking']
  },
  {
    title: 'Dialing in espresso grind size for light roast African natural coffees',
    content: `Light roasts are denser and extract slower than dark roasts. Grind slightly finer, increase brew temperature to 94°C, and aim for a 1:2.3 brew ratio (18g coffee in, 42g liquid out in 30 seconds). Unlocks exploding floral berry sweetness without harsh sourness.`,
    community_id: 'comm_food', community_slug: 'food-cooking', flair: 'Coffee Science', tags: ['espresso', 'specialtycoffee', 'brewing']
  },
  {
    title: 'Homemade cast iron smash burgers: maximizing the crispy Maillard lace edge',
    content: `Use 80/20 ground chuck rolled into loose 2.5-ounce balls. Place on a screaming hot dry cast iron skillet, press down with parchment paper and a heavy flat burger press for 10 seconds, and do NOT touch it for two minutes. That caramelized lacy crust is burger perfection.`,
    community_id: 'comm_food', community_slug: 'food-cooking', flair: 'Home Cooking', tags: ['smashburger', 'castiron', 'burgers']
  },
  {
    title: 'Japanese curry from scratch: caramelizing onions for 45 minutes before adding spices',
    content: `Skip the commercial roux cubes for once. Slowly cooking three sliced yellow onions in butter until they reduce to a deep jammy mahogany paste creates the natural sweet umami foundation for authentic Japanese curry. Add grated apple and dark chocolate for depth.`,
    community_id: 'comm_food', community_slug: 'food-cooking', flair: 'Japanese Food', tags: ['curry', 'japanesefood', 'umami']
  },
  {
    title: 'Sourdough troubleshooting: why your loaf has dense bottoms and giant holes at the very top (fool’s crumb)',
    content: `Giant caverns near the crust while the bottom remains gummy and dense is a classic indicator of severe under-fermentation, NOT over-proofing. The yeast produced gas too quickly during baking before the gluten network had fermented enough strength to support it.`,
    community_id: 'comm_food', community_slug: 'food-cooking', flair: 'Sourdough Science', tags: ['sourdough', 'baking', 'troubleshooting']
  },
  {
    title: 'The weekday pantry hero: crispy fried eggs over warm jasmine rice with chili oil and scallions',
    content: `When you get home exhausted at 8:00 PM, fry two eggs in generous sesame oil until the edges are brown and crackly while the yolks remain runny. Slide over a bowl of leftover steamed rice, drizzle soy sauce and Lao Gan Ma chili crisp. Comfort in 5 minutes.`,
    community_id: 'comm_food', community_slug: 'food-cooking', flair: 'Quick Meals', tags: ['comfortfood', 'ricebowl', 'quickdinner']
  },
  {
    title: 'Exploring neighborhood specialty coffee roasters in Dublin: the best flat whites in the city',
    content: `Spent the weekend visiting three independent specialty cafes in Dublin. The consistency of milk texture and micro-foam sweetness at local roasters has elevated the city’s coffee culture to world-class standards.`,
    community_id: 'comm_food', community_slug: 'food-cooking', flair: 'Cafe Culture', tags: ['dublin', 'coffee', 'flatwhite']
  },
  {
    title: 'Handmade fresh egg tagliatelle: 100g 00 flour to 1 whole egg ratio on wooden pasta board',
    content: `No electric pasta machines needed. Kneading dough on an unfinished wood board creates subtle microscopic roughness on the pasta surface that grips tomato sauces and ragù ten times better than slick stainless steel surfaces.`,
    community_id: 'comm_food', community_slug: 'food-cooking', flair: 'Handmade Pasta', tags: ['pasta', 'tagliatelle', 'italian']
  },
  {
    title: 'Fermenting homemade kimchi: balancing Korean chili flakes (gochugaru) and salted napa cabbage',
    content: `Brining the cabbage quarters in sea salt water for 6 hours until the thick stems bend without snapping is the crucial foundation. Layering the garlic, ginger, radish matchsticks, and gochugaru paste between every leaf creates bubbles of tangy effervescence by day four.`,
    community_id: 'comm_food', community_slug: 'food-cooking', flair: 'Fermentation', tags: ['kimchi', 'fermentation', 'koreanfood']
  },
  {
    title: 'Why you should season your cast iron skillet with thin layers of grapeseed oil instead of thick flaxseed',
    content: `Flaxseed oil forms a brittle polymer film that tends to flake off in black speckles after high-heat searing. Grapeseed oil has a high smoke point, neutral aroma, and forms a flexible, durable cross-linked seasoning patina that lasts for decades.`,
    community_id: 'comm_food', community_slug: 'food-cooking', flair: 'Kitchen Gear', tags: ['castiron', 'seasoning', 'kitchen']
  },
  {
    title: 'Sunday meal prep routine: Japanese tamagoyaki and bento boxes for the work week',
    content: `Rolling thin layers of seasoned beaten egg in a rectangular copper pan (makiyakinabe). Paired with steamed rice, pickled cucumbers, and pan-seared ginger pork chops. Having colorful, nutritious bento lunches ready in the fridge makes weekday mornings stress-free.`,
    community_id: 'comm_food', community_slug: 'food-cooking', flair: 'Meal Prep', tags: ['bento', 'tamagoyaki', 'mealprep']
  },
  {
    title: 'The science of crispy French fries: the double-fry method with par-boiling in vinegar water',
    content: `Par-boiling russet potato batons in water with a tablespoon of white vinegar firms up the pectin so fries don’t collapse. Fry first at 160°C to cook through, cool completely, then flash fry at 190°C for 3 minutes until blistered and golden. Glassy crunch.`,
    community_id: 'comm_food', community_slug: 'food-cooking', flair: 'Cooking Science', tags: ['frenchfries', 'techniques', 'cooking']
  },
  {
    title: 'Whisking ceremonial grade Uji matcha: water temperature, bamboo chasen technique, and micro-foam',
    content: `Never pour boiling water directly onto delicate matcha powder—it scorches the amino acids and creates bitter notes. Use 75°C soft water, sift 2 grams through a fine mesh strainer, and whisk briskly in a 'W' motion from your wrist until a velvety jade froth covers the surface.`,
    community_id: 'comm_food', community_slug: 'food-cooking', flair: 'Tea Rituals', tags: ['matcha', 'tea', 'japan']
  },
  {
    title: 'South Indian filter coffee: the magic of the brass dabarah, chicory blend, and frothy boiling milk',
    content: `Brewing dark roast peaberry coffee blended with 15% chicory in a traditional stainless or brass drip percolator. Pouring back and forth from the tumbler to the wide dabarah bowl creates that iconic thick, aromatic head of creamy froth.`,
    community_id: 'comm_food', community_slug: 'food-cooking', flair: 'Regional Coffee', tags: ['filtercoffee', 'southindia', 'coffee']
  },
  {
    title: 'Making wood-fired sourdough pizza dough: 65% hydration and 48-hour cold fermentation',
    content: `Higher hydration doughs can turn gummy in home ovens, but for a 450°C portable pizza oven, 65% hydration allows the dough to stretch paper-thin while holding structural rigidity when launching from the wooden peel. Leopard spotting on the crust was unreal.`,
    community_id: 'comm_food', community_slug: 'food-cooking', flair: 'Pizza Making', tags: ['pizza', 'sourdough', 'woodfired']
  },
  {
    title: 'The art of the simple seasonal salad: crisp greens, shaved fennel, and cold-pressed olive oil',
    content: `Great salads aren’t drowned in heavy bottled ranch. Fresh butterhead lettuce, paper-thin shaved fennel, toasted pine nuts, good sea salt flakes, and single-estate extra virgin olive oil with lemon juice. Clean, bright, and lets fresh produce shine.`,
    community_id: 'comm_food', community_slug: 'food-cooking', flair: 'Seasonal Cooking', tags: ['salad', 'healthy', 'fresh']
  },
  {
    title: 'Slow-braised beef short ribs in red wine and aromatics: the beauty of a 3-hour Dutch oven braise',
    content: `Brown short ribs deeply on all sides in a heavy Dutch oven, sauté mirepoix and tomato paste, deglaze with a bottle of dry Cabernet, and simmer low at 150°C for 3.5 hours until the meat yields to a spoon. Rich, glossy, and warming on an autumn evening.`,
    community_id: 'comm_food', community_slug: 'food-cooking', flair: 'Braising', tags: ['shortribs', 'dutchoven', 'dinner']
  },
  {
    title: 'What is your single favorite pantry ingredient that transforms everyday home cooking?',
    content: `For me, it’s aged Chinese Chinkiang black vinegar. Adding a splash at the end of stir fries, braised meats, or noodle soups adds deep malt acidity and umami that lemon juice or white vinegar can’t touch. What is your secret weapon?`,
    community_id: 'comm_food', community_slug: 'food-cooking', flair: 'Discussion', tags: ['pantry', 'ingredients', 'flavor']
  },
  {
    title: 'Baking artisanal focaccia with fresh rosemary, flaky salt, and dimpled olive oil pools',
    content: `85% hydration dough poured onto an oiled baking sheet. Letting it proof until it becomes a giant pillow of wobbly bubbles, then pressing your fingertips all the way to the bottom to create olive oil reservoirs. Crisp bottom, pillowy interior.`,
    community_id: 'comm_food', community_slug: 'food-cooking', flair: 'Baking', tags: ['focaccia', 'bread', 'oliveoil']
  },
  {
    title: 'Street food reflections from night markets in Taipei: oyster omelets and braised pork rice',
    content: `Wandering through Raohe Night Market under glowing paper lanterns. Sizzling cast iron griddles, the aroma of five-spice braised pork belly over warm rice, and fresh iced guava juice. The vibrant energy of street food culture is unforgettable.`,
    community_id: 'comm_food', community_slug: 'food-cooking', flair: 'Travel Food', tags: ['streetfood', 'taipei', 'nightmarket']
  },
  {
    title: 'Mastering French omelette technique: low heat, constant agitation, and a pale yellow exterior',
    content: `Whisk eggs thoroughly with salt until no whites remain. Cook in foaming butter over medium-low heat, constantly swirling the pan while stirring with chopsticks until small creamy curds form. Roll gently onto the plate with zero browning. Silky perfection.`,
    community_id: 'comm_food', community_slug: 'food-cooking', flair: 'Technique', tags: ['eggs', 'omelette', 'frenchcooking']
  },
  {
    title: 'Homemade bone broth: roasting marrow bones and simmering for 18 hours with cider vinegar',
    content: `Roasting beef knuckles and marrow bones at 220°C until deeply caramelized before transferring to the stock pot. A tablespoon of apple cider vinegar helps leach collagen and gelatin from the joint cartilage. Cools into a completely solid gelatinous jelly.`,
    community_id: 'comm_food', community_slug: 'food-cooking', flair: 'Stock & Broth', tags: ['bonebroth', 'cooking', 'soup']
  },
  {
    title: 'Roasting whole spices before grinding: why blooming cumin and coriander unlocks new aromatics',
    content: `Pre-ground spice jars lose their volatile essential oils after two months on the shelf. Toasting whole cumin, coriander, and black peppercorns in a dry skillet until fragrant before grinding in a stone mortar and pestle fills the whole house with aroma.`,
    community_id: 'comm_food', community_slug: 'food-cooking', flair: 'Spices', tags: ['spices', 'flavor', 'cookingtips']
  },
  {
    title: 'The humble pleasure of peeling sweet mandarins on a cold winter afternoon',
    content: `No fancy recipe required. Just a wooden bowl of sweet, seedless Satsuma mandarins on the coffee table. The citrus oil mist spraying into the air as you peel the skin is one of winter's simplest sensory joys.`,
    community_id: 'comm_food', community_slug: 'food-cooking', flair: 'Simple Joys', tags: ['fruit', 'winter', 'simpleliving']
  },
  {
    title: 'Selecting a chef knife: 8-inch Western chef knife vs Japanese Gyuto profile',
    content: `German knives (like Wüsthof) use softer 56-58 HRC steel that tolerates bone contact and heavy chopping without chipping. Japanese Gyuto knives use harder 60-62 HRC carbon steel that holds a razor-sharp 15-degree edge for effortless vegetable slicing. Pick the right tool for your style.`,
    community_id: 'comm_food', community_slug: 'food-cooking', flair: 'Kitchen Knives', tags: ['knives', 'chefknife', 'kitchengear']
  },
  {
    title: 'Neighborhood bakery morning rituals: fresh pain au chocolat and the smell of warm yeast',
    content: `Walking to the corner bakery at 7:00 AM in the morning chill. Stepping through the glass door into the warm embrace of baking butter, sourdough loaves, and roasted espresso. Starting the day with local food craft anchors a neighborhood.`,
    community_id: 'comm_food', community_slug: 'food-cooking', flair: 'Bakery', tags: ['bakery', 'morning', 'croissant']
  },

  // --- BOOKS, READING & SCI-FI (20 posts) ---
  {
    title: 'Ted Chiang’s "Stories of Your Life and Others": a masterclass in philosophical speculative fiction',
    content: `Every story in this collection starts from a single rigorous premise: what if mathematics had an inherent contradiction? What if tower builders reached the vault of heaven? Chiang doesn’t write pulp sci-fi; he writes profound moral investigations into human consciousness.`,
    community_id: 'comm_books', community_slug: 'books-reading', flair: 'Book Review', tags: ['tedchiang', 'scifi', 'shortstories']
  },
  {
    title: 'Physical paperbacks vs e-readers: why physical books still dominate my reading habit',
    content: `E-readers are convenient for travel, but physical paperbacks give your brain spatial memory anchors: you remember an idea was on the top-left of a right-hand page roughly two-thirds through the volume. The tactile heft of progress is irreplaceable.`,
    community_id: 'comm_books', community_slug: 'books-reading', flair: 'Reading Habit', tags: ['paperback', 'reading', 'books']
  },
  {
    title: 'Annotating books in pencil: brackets, question marks, and messy thoughts in the margins',
    content: `I used to keep books pristine out of respect. Now I realize true respect is engaging in a conversation with the author. Re-reading a novel five years later and seeing what resonated with your younger self is like reading a private diary.`,
    community_id: 'comm_books', community_slug: 'books-reading', flair: 'Marginalia', tags: ['annotations', 'marginalia', 'reading']
  },
  {
    title: 'Ursula K. Le Guin’s "The Dispossessed": the finest exploration of anarchism and society in fiction',
    content: `Le Guin called it 'an ambiguous utopia.' Her depiction of the drought-stricken world of Anarres balances the beauty of collective solidarity against the subtle tyranny of social conformity. Required reading for anyone interested in social theory.`,
    community_id: 'comm_books', community_slug: 'books-reading', flair: 'Classic Sci-Fi', tags: ['leguin', 'classics', 'scifi']
  },
  {
    title: 'Building a reading habit: how reading 20 pages every single morning compounds to 30 books a year',
    content: `Don't wait for "free time" on weekends because weekend time gets eaten by chores and errands. Wake up 25 minutes earlier, keep your phone in another room, and read twenty pages before the day begins. 20 pages * 365 days = 7,300 pages = 25 to 30 books.`,
    community_id: 'comm_books', community_slug: 'books-reading', flair: 'Habits', tags: ['habits', 'reading', 'consistency']
  },
  {
    title: 'The art of literary translation: comparing different English translations of classic world literature',
    content: `Reading three different translations of Crime and Punishment (Garnett vs Pevear/Volokhonsky vs McDuff) reveals how much a translator shapes rhythm, voice, and irony. A great translation is an act of recreation, not mechanical dictionary lookup.`,
    community_id: 'comm_books', community_slug: 'books-reading', flair: 'Translation', tags: ['translation', 'literature', 'classics']
  },
  {
    title: 'Stanislaw Lem’s "Solaris": the impossibility of truly communicating with the cosmic alien',
    content: `Hollywood movies treat aliens as humans in latex masks with translated English. Lem understood that a truly cosmic intelligence (a sentient oceanic planet) would be completely incomprehensible to human sensory and cognitive faculties.`,
    community_id: 'comm_books', community_slug: 'books-reading', flair: 'Sci-Fi Deep Dive', tags: ['lem', 'solaris', 'hardscifi']
  },
  {
    title: 'Visiting secondhand bookshops in historic neighborhoods: the thrill of the unexpected find',
    content: `Algorithm recommendations on bookstores show you what you already like. Secondhand bookshop shelves force serendipity: pulling down a dog-eared 1974 translation of Polish poetry or an obscure monograph on Islamic geometry simply because the spine caught your eye.`,
    community_id: 'comm_books', community_slug: 'books-reading', flair: 'Bookstores', tags: ['bookstores', 'secondhand', 'serendipity']
  },
  {
    title: 'Why Jorge Luis Borges’ "Ficciones" remains the blueprint for modern conceptual fiction',
    content: `The Library of Babel, Tlön, Uqbar, Orbis Tertius, The Garden of Forking Paths. Borges writes philosophical mazes disguised as four-page book reviews of imaginary encyclopedias. Mind-expanding literature in its purest form.`,
    community_id: 'comm_books', community_slug: 'books-reading', flair: 'Literary Fiction', tags: ['borges', 'magicalrealism', 'literature']
  },
  {
    title: 'Book review: "A City on Mars" by Kelly and Zach Weinersmith — cold hard reality check on space colonization',
    content: `A wonderfully hilarious yet devastatingly rigorous breakdown of the biological, legal, and economic realities of off-world settlements. Space isn’t an easy backup plan for Earth; space is actively trying to kill you with radiation, vacuum, and zero gravity.`,
    community_id: 'comm_books', community_slug: 'books-reading', flair: 'Non-Fiction', tags: ['space', 'science', 'nonfiction']
  },
  {
    title: 'The sensory design of physical book covers: debossed typography and uncoated rag paper',
    content: `Publishers who invest in tactile production—deckle edges, heavy cloth spine wraps, unvarnished matte paper jackets—turn books into objects of permanent beauty. A well-designed cover honors the years an author spent drafting sentences.`,
    community_id: 'comm_books', community_slug: 'books-reading', flair: 'Book Design', tags: ['bookdesign', 'typography', 'publishing']
  },
  {
    title: 'What book did you read this year that completely altered the way you view the world?',
    content: `For me it was 'The Dawn of Everything' by David Graeber and David Wengrow. It dismantled conventional linear narratives about the inevitability of hierarchy and the state with vast archaeological evidence. What book shifted your worldview?`,
    community_id: 'comm_books', community_slug: 'books-reading', flair: 'Discussion', tags: ['worldview', 'reading', 'books']
  },
  {
    title: 'Reading poetry on Sunday mornings: the quiet resonance of Mary Oliver and Ocean Vuong',
    content: `Poetry requires a completely different cognitive speed. You cannot skim poetry the way you skim articles or emails. You have to read line breaks slowly and listen to consonants ring in your head. A fifteen-minute poem can anchor your entire afternoon.`,
    community_id: 'comm_books', community_slug: 'books-reading', flair: 'Poetry', tags: ['poetry', 'maryoliver', 'slowliving']
  },
  {
    title: 'Gene Wolfe’s "The Book of the New Sun": untrustworthy narrators and dying sun allegories',
    content: `Severian tells his own story with profound erudition while casually omitting critical facts about his own actions. Wolfe trusts the reader to decipher what is genuinely happening behind the protagonist’s poetic self-justifications.`,
    community_id: 'comm_books', community_slug: 'books-reading', flair: 'Speculative Fiction', tags: ['genewolfe', 'scifi', 'fantasy']
  },
  {
    title: 'How do you keep track of books you want to read without creating overwhelming TBR backlogs?',
    content: `I stopped maintaining a 500-book digital wishlist that induced guilt. Now I keep an index card inside my current book with three titles jotted down. When I finish, I pick from those three or browse a real shop. Much lighter mental load.`,
    community_id: 'comm_books', community_slug: 'books-reading', flair: 'Reading Life', tags: ['tbr', 'habits', 'reading']
  },
  {
    title: 'The brilliance of Neal Stephenson’s "Anathem": monastic scholars preserving math after societal collapse',
    content: `A society where scientists and philosophers take monastic vows inside cloistered 'maths' to protect knowledge through thousand-year civilizational resets. The worldbuilding and philosophical dialogues on Platonic forms are unmatched.`,
    community_id: 'comm_books', community_slug: 'books-reading', flair: 'Hard Sci-Fi', tags: ['nealstephenson', 'anathem', 'scifi']
  },
  {
    title: 'Why short story collections are the most underappreciated format in modern literature',
    content: `Novelists can take fifty pages to establish a setting, but a great short story writer has to establish voice, stakes, world, and emotional resonance in twelve pages. Shirley Jackson, Raymond Carver, Alice Munro—pure concentrated craft.`,
    community_id: 'comm_books', community_slug: 'books-reading', flair: 'Short Stories', tags: ['shortstories', 'fiction', 'craft']
  },
  {
    title: 'Building a weekend neighborhood outdoor book swap box in our front garden',
    content: `Built a cedar weather-sealed Little Free Library box with a shingle roof and magnetic latch. Neighbors have filled it with children’s picture books, paperback thrillers, gardening guides, and historical biographies. It has become a lovely neighborhood gathering point.`,
    community_id: 'comm_books', community_slug: 'books-reading', flair: 'Community', tags: ['littlefreelibrary', 'books', 'community']
  },
  {
    title: 'The quiet melancholy of Kazuo Ishiguro’s "The Remains of the Day"',
    content: `Stevens the butler reflects on his decades of dignified service to a disgraced English lord, slowly realizing that unquestioning loyalty cost him the chance at love and authentic selfhood. A devastatingly restrained masterpiece.`,
    community_id: 'comm_books', community_slug: 'books-reading', flair: 'Literary Classics', tags: ['ishiguro', 'literature', 'masterpiece']
  },
  {
    title: 'Setting up a dedicated reading corner: comfortable chair, side table, warm lamp, zero screens',
    content: `Creating a physical boundary between your digital workspace and your reading space makes it ten times easier to sink into a novel. No laptop on the side table, warm 2700K incandescent floor lamp, and a woolen throw blanket.`,
    community_id: 'comm_books', community_slug: 'books-reading', flair: 'Reading Nook', tags: ['readingnook', 'cozy', 'books']
  },

  // --- MUSIC, VINYL & AUDIO (18 posts) ---
  {
    title: 'Analog synthesizer sound design: building a warm vintage brass pad from raw saw waves',
    content: `Start with two saw waves slightly detuned by 6 cents for natural chorus movement. Route through a 4-pole 24dB low-pass ladder filter with cutoff set to 40%. Add an envelope with 40ms attack, 800ms decay, and 60% sustain. Add subtle tape wow-and-flutter for instant 80s warmth.`,
    community_id: 'comm_music', community_slug: 'music-production', flair: 'Synth Sound Design', tags: ['synthesizer', 'sounddesign', 'analog']
  },
  {
    title: 'Caring for vintage vinyl records: ultrasonic cleaning baths vs vacuum suction machines',
    content: `Ultrasonic cavitation at 40kHz lifts micro-dust particles and mold release grease from deep inside the groove walls that standard brushes can’t reach. Cleaned records have dead-silent lead-in grooves and remarkable high-frequency transient sparkle.`,
    community_id: 'comm_music', community_slug: 'music-production', flair: 'Vinyl Care', tags: ['vinyl', 'audiophile', 'ultrasonic']
  },
  {
    title: 'Building a compact 4-pedal board for indie club gigs: tone versatility without tap-dancing',
    content: `All you need: tuner -> transparent low-gain overdrive (Bluesbreaker style) -> analog delay with tap tempo -> plate reverb. Covers everything from jangly post-punk chords to ambient wash swells, powered by an isolated lithium battery pack.`,
    community_id: 'comm_music', community_slug: 'music-production', flair: 'Guitar Rig', tags: ['pedalboard', 'guitar', 'gigs']
  },
  {
    title: 'Why post-punk basslines drive the entire emotional engine of the song',
    content: `Peter Hook (Joy Division), Simon Gallup (The Cure), Eric Avery (Jane's Addiction). In post-punk, the bass isn’t just anchoring the root chord; it plays the primary melodic hook high up on the D and G strings while guitars add textural noise and wash.`,
    community_id: 'comm_music', community_slug: 'music-production', flair: 'Bass Appreciation', tags: ['bass', 'postpunk', 'joydivision']
  },
  {
    title: 'Fingerstyle acoustic guitar: mastering the alternating thumb bass groove in Travis picking',
    content: `Keep your right thumb steadily alternating between the 6th and 4th strings on every quarter note beat like a metronome. Once that mechanical thumb groove is on autopilot, your index and middle fingers can float freely over syncopated treble melodies.`,
    community_id: 'comm_music', community_slug: 'music-production', flair: 'Guitar Technique', tags: ['acousticguitar', 'fingerstyle', 'guitarlesson']
  },
  {
    title: 'The enduring warmth of reel-to-reel tape saturation in home studio tracking',
    content: `Running drum buses through an old 1/4-inch Otari tape machine at 15 ips rounds off harsh digital cymbal transients and glues the kick and snare together with soft harmonic compression. Digital plugins are close, but real magnetic tape hysteresis has soul.`,
    community_id: 'comm_music', community_slug: 'music-production', flair: 'Studio Recording', tags: ['tape', 'recording', 'homestudio']
  },
  {
    title: 'Album spotlight: Talk Talk - "Laughing Stock" (1991) and the birth of post-rock',
    content: `Mark Hollis recorded musicians improvising in dark rooms for weeks, then edited tiny silence-punctuated phrases into a sprawling, breathtaking sonic sculpture. Acoustic space, feedback organ, and absolute musical restraint.`,
    community_id: 'comm_music', community_slug: 'music-production', flair: 'Album Review', tags: ['talktalk', 'postrock', 'classics']
  },
  {
    title: 'Selecting a phono cartridge: moving magnet (MM) vs moving coil (MC) for entry-to-mid hifi',
    content: `Moving magnet cartridges like the Audio-Technica VM540ML offer replaceable styli and high 4mV output that plugs directly into standard preamp stages. Moving coil cartridges offer lower moving mass for micro-detail, but require low-noise step-up transformers.`,
    community_id: 'comm_music', community_slug: 'music-production', flair: 'HiFi Audio', tags: ['turntable', 'cartridge', 'audiophile']
  },
  {
    title: 'Setting up acoustic treatment in a square bedroom home studio: corner bass traps first',
    content: `Thin foam wedges on walls only absorb high frequencies, leaving low-end standing waves booming at 80Hz in the room corners. Dense rockwool insulation bass traps in all four corners flatten room resonance so your mix translations are accurate.`,
    community_id: 'comm_music', community_slug: 'music-production', flair: 'Acoustic Treatment', tags: ['homestudio', 'acoustics', 'mixing']
  },
  {
    title: 'The joy of open guitar tunings: DADGAD for Celtic melodies and atmospheric drone folk',
    content: `Tuning your high and low strings down to D creates ringing unison drones that resonate across the guitar body. Play simple two-finger chord shapes and let the open strings ring out like bagpipe drones. Endlessly inspiring.`,
    community_id: 'comm_music', community_slug: 'music-production', flair: 'Guitar Tunings', tags: ['dadgad', 'guitar', 'folk']
  },
  {
    title: 'Digging for Japanese city pop and ambient vinyl records in Tokyo’s Ochanomizu district',
    content: `Tower Records Shinjuku and Disk Union Ochanomizu. Finding pristine condition Hiroshi Yoshimura ambient records and Tatsuro Yamashita LP pressings in original shrink with OBI strips. Paradise for analog music collectors.`,
    community_id: 'comm_music', community_slug: 'music-production', flair: 'Crate Digging', tags: ['citypop', 'tokyo', 'vinylrecords']
  },
  {
    title: 'Why dynamic microphones like the Shure SM57 remain studio staples after fifty years',
    content: `A $100 SM57 placed one inch off the speaker grill cloth of a tube amplifier captures focused, punchy midrange that cuts cleanly through a dense mix without picking up room noise or boomy resonance. True utilitarian brilliance.`,
    community_id: 'comm_music', community_slug: 'music-production', flair: 'Microphones', tags: ['microphones', 'sm57', 'recording']
  },
  {
    title: 'Cassette tape culture revival: why indie bands are releasing limited run tape cassettes',
    content: `Cassette releases are affordable for small underground bands to manufacture ($2 per tape), beautiful to hold with printed J-cards, and encourage fans to listen to whole album sequencing rather than algorithmic single shuffling.`,
    community_id: 'comm_music', community_slug: 'music-production', flair: 'Cassettes', tags: ['cassette', 'indie', 'tapes']
  },
  {
    title: 'Eurorack modular sequencing: using generative probability gates for evolving melodies',
    content: `Setting a Bernoulli gate module to 70% probability creates rhythmic patterns that stay recognizable while never looping identically twice. It feels like collaborating with an autonomous musical companion.`,
    community_id: 'comm_music', community_slug: 'music-production', flair: 'Modular Synth', tags: ['eurorack', 'modular', 'generative']
  },
  {
    title: 'What album had the biggest impact on your musical taste during your teenage years?',
    content: `For me it was Radiohead - In Rainbows. The warm drum panning on 'Reckoner' and the layered arpeggios on 'Weird Fishes' completely recalibrated what I thought recorded music could accomplish. What was your formative album?`,
    community_id: 'comm_music', community_slug: 'music-production', flair: 'Discussion', tags: ['albums', 'musicdiscussion', 'nostalgia']
  },
  {
    title: 'Electric guitar string gauges: 9-42 vs 10-46 on a 25.5-inch Fender scale length',
    content: `9s are effortless for wide David Gilmour bends on a Stratocaster, but 10s provide noticeably more string tension against pick attack and richer acoustic acoustic resonance on low-end chord riffs. Finding your gauge balance is key.`,
    community_id: 'comm_music', community_slug: 'music-production', flair: 'Guitar Gear', tags: ['guitar', 'strings', 'fender']
  },
  {
    title: 'Mastering loudness wars in 2026: why dynamic range (-14 LUFS) sounds punchier on streaming',
    content: `Brickwall limiting your audio master to -7 LUFS triggers heavy automatic gain reduction on Spotify and Apple Music, crushing your drum dynamics. Leaving 12 to 14 LUFS of dynamic headroom keeps the snare punch loud and impactful.`,
    community_id: 'comm_music', community_slug: 'music-production', flair: 'Audio Mastering', tags: ['mastering', 'dynamics', 'audio']
  },
  {
    title: 'Building a custom wooden pedalboard from reclaimed pallet pine and Velcro loop tape',
    content: `Cut and sanded two 40cm slats of pine, angled the frame with two triangular side supports, and routed slots for cable passthroughs. Stained in dark walnut and sealed in polyurethane. Cost $8 and looks better than aluminum commercial boards.`,
    community_id: 'comm_music', community_slug: 'music-production', flair: 'DIY Gear', tags: ['woodworking', 'pedalboard', 'diy']
  },

  // --- CROSSOVER TECH & OPEN SOURCE (14 posts) ---
  {
    title: 'Why I moved my personal blog from Substack to a static Astro site hosted on GitHub Pages',
    content: `Zero tracking cookies, sub-50ms global page loads, full ownership of my RSS feed, and writing articles in clean Markdown files with Neovim. You don't need a heavy subscriber platform to share thoughts with the world.`,
    community_id: 'comm_frontend', community_slug: 'frontend', flair: 'Web Minimal', tags: ['astro', 'markdown', 'webdev']
  },
  {
    title: 'Self-hosting Vaultwarden on a Raspberry Pi: password management independence',
    content: `After commercial password managers changed pricing tiers, deployed Vaultwarden (lightweight Rust implementation of Bitwarden) in Docker with automated encrypted nightly backups to an offsite S3 bucket. Simple, private, and rock solid.`,
    community_id: 'comm_infra', community_slug: 'cloud-native', flair: 'Self-Hosted', tags: ['selfhosted', 'vaultwarden', 'privacy']
  },
  {
    title: 'The joy of using a ThinkPad keyboard: why the 7-row classic layout still has a cult following',
    content: `Picked up an older ThinkPad T420 and swapped the classic NMB keyboard. The tactile key travel (2.5mm) and concave keycaps make typing feel like playing an instrument compared to modern shallow laptop chiclet keys.`,
    community_id: 'comm_linux', community_slug: 'linux-kernel', flair: 'Hardware', tags: ['thinkpad', 'hardware', 'keyboards']
  },
  {
    title: 'Running local AI models with Ollama and open weights: private coding assistance on 16GB RAM',
    content: `Running Qwen 2.5 Coder 7B quantised to 4-bit with llama.cpp locally. It generates code completions in sub-500ms without sending proprietary company code or student project data to external cloud API endpoints.`,
    community_id: 'comm_ai', community_slug: 'ai-systems', flair: 'Local LLM', tags: ['ollama', 'localllm', 'ai']
  },
  {
    title: 'Setting up a local Pi-hole network DNS sinkhole: banishing telemetry ads from smart home devices',
    content: `Blocking 45,000 ad and tracker domains at the router level. Smart TVs and smart plugs stop phoning home telemetry packets every 30 seconds, and mobile web browsing feels twice as fast across every phone in the apartment.`,
    community_id: 'comm_infra', community_slug: 'cloud-native', flair: 'Networking', tags: ['pihole', 'networking', 'privacy']
  },
  {
    title: 'Why SQLite with WAL mode is the default choice for all my new side projects',
    content: `No database daemon to manage, zero connection pool configuration headaches, single-file backups with Litestream, and sub-millisecond query execution. 95% of web apps never outgrow what modern SQLite can comfortably handle.`,
    community_id: 'comm_database', community_slug: 'database-internals', flair: 'Database', tags: ['sqlite', 'database', 'architecture']
  },
  {
    title: 'Neovim workflow for writing technical essays: markdown preview, vim-pencil, and zen mode',
    content: `Stripping the editor UI of statuslines, tabs, and line numbers creates a distraction-free digital typewriter. Centering text width to 75 characters keeps eye strain minimal during 3,000-word draft sessions.`,
    community_id: 'comm_linux', community_slug: 'linux-kernel', flair: 'Editor Setup', tags: ['neovim', 'writing', 'vim']
  },
  {
    title: 'Organizing dotfiles with GNU Stow and Git: single-command workstation provisioning',
    content: `Using symlink farms managed by GNU Stow. Cloning my \`dotfiles\` repo on a brand-new laptop and running \`stow zsh nvim git tmux\` configures my entire development environment identically in under ten seconds.`,
    community_id: 'comm_linux', community_slug: 'linux-kernel', flair: 'Linux Tools', tags: ['dotfiles', 'stow', 'linux']
  },
  {
    title: 'Building a personal music streaming server with Navidrome and Substreamer on iOS',
    content: `Self-hosting 500GB of FLAC and high-bitrate MP3 music on a home server. Substreamer caches albums offline onto my phone with zero streaming subscription fees or disappearing artist licensing. True ownership.`,
    community_id: 'comm_infra', community_slug: 'cloud-native', flair: 'Self-Hosted', tags: ['navidrome', 'selfhosted', 'music']
  },
  {
    title: 'Understanding CSS subgrid: finally aligning nested form labels across parent columns',
    content: `Before subgrid, keeping labels and input fields aligned across independent child card components required ugly fixed-width CSS variables. With \`grid-template-columns: subgrid\`, child elements snap directly to the master container tracks.`,
    community_id: 'comm_frontend', community_slug: 'frontend', flair: 'CSS Architecture', tags: ['css', 'subgrid', 'frontend']
  },
  {
    title: 'The satisfying ritual of writing small bash automation scripts instead of installing heavy CLI tools',
    content: `Instead of pulling in a 200MB Node.js tool to resize photos, a 5-line bash loop using ImageMagick's \`mogrify\` processes three hundred high-resolution photos in seconds. Lean Unix shell tools remain undefeated.`,
    community_id: 'comm_linux', community_slug: 'linux-kernel', flair: 'Shell Scripting', tags: ['bash', 'cli', 'unix']
  },
  {
    title: 'Why open-source game engines like Godot 4 are empowering a new generation of indie creators',
    content: `Instant engine startup in 1 second, zero licensing revenue cuts, human-readable scene files in Git, and an intuitive node tree architecture. Godot is doing for indie game development what Blender did for 3D modeling.`,
    community_id: 'comm_gaming', community_slug: 'gaming-esports', flair: 'Game Engines', tags: ['godot', 'gamedev', 'opensource']
  },
  {
    title: 'Backing up personal data with 3-2-1 rule: BorgBackup with client-side encryption to rsync.net',
    content: `Three copies of critical files, two different storage media, one offsite. BorgBackup deduplicates encrypted snapshots with zero metadata leakage, making daily automated backups cost pennies per month.`,
    community_id: 'comm_infra', community_slug: 'cloud-native', flair: 'Data Safety', tags: ['backups', 'borg', 'security']
  },
  {
    title: 'Building an interactive canvas audio visualizer in plain HTML5 and Web Audio API',
    content: `Connecting an AnalyserNode to a media element source, sampling the frequency byte data with \`getByteFrequencyData\`, and drawing organic radial waves on an HTML canvas at 60 FPS in 80 lines of vanilla JavaScript. Clean and educational.`,
    community_id: 'comm_creative', community_slug: 'creative-coding', flair: 'Web Audio', tags: ['webaudio', 'canvas', 'creativecoding']
  }
];

// Read existing phase2a3_posts_data.js and append the 192 posts into phase2a3DiscussionsDefs
const postsDataPath = path.resolve('scripts/phase2a3_posts_data.js');
let currentContent = fs.readFileSync(postsDataPath, 'utf-8');

// Insert newPosts into the phase2a3DiscussionsDefs array before the closing bracket
const closingBracketIdx = currentContent.lastIndexOf('];');
if (closingBracketIdx === -1) {
  throw new Error('Could not find closing bracket of phase2a3DiscussionsDefs in ' + postsDataPath);
}

const postsCode = newPosts.map(p => {
  return `  {\n    title: ${JSON.stringify(p.title)},\n    content: ${JSON.stringify(p.content)},\n    community_id: ${JSON.stringify(p.community_id)},\n    community_slug: ${JSON.stringify(p.community_slug)},\n    flair: ${JSON.stringify(p.flair)},\n    tags: ${JSON.stringify(p.tags)}\n  },`;
}).join('\n');

const updatedContent = currentContent.slice(0, closingBracketIdx) + '\n' + postsCode + '\n];\n';
fs.writeFileSync(postsDataPath, updatedContent, 'utf-8');
console.log(`Successfully appended 192 posts to phase2a3_posts_data.js! Total discussion posts: 12 + 192 = 204.`);
