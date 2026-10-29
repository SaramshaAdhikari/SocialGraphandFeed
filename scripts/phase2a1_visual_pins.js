import { verifiedPhotos } from '../packages/backend/src/db/fixtures/verifiedPhotos.js';

// Flatten the 100 verified photos
const allPhotos = [
  ...verifiedPhotos.architecture,  // 0..19
  ...verifiedPhotos.technology,    // 20..39
  ...verifiedPhotos.workspaces,    // 40..59
  ...verifiedPhotos.lifestyle,     // 60..79
  ...verifiedPhotos.creative_art,  // 80..99
];

// 84 distinct, authentic visual pin definitions with natural human captions
const visualPinMeta = [
  // 0-19: Architecture & Built Form (indices 0..19 -> verifiedPhotos.architecture)
  {
    title: 'Morning light on concrete',
    caption: 'Morning light catching the board-formed concrete cantilever on the fine arts building. The wood grain texture came out so clean on 400 ISO.',
    commId: 'comm_photography', slug: 'photography', tags: ['architecture', 'monochrome', 'concrete']
  },
  {
    title: 'Balconies on the residential tower',
    caption: 'Balconies on the high-rise downtown. Love walking past these on foggy autumn mornings.',
    commId: 'comm_architecture', slug: 'architecture', tags: ['brutalism', 'urban', 'architecture']
  },
  {
    title: 'Old power station turbine hall',
    caption: 'Toured the decommissioned 1930s hydroelectric turbine hall today. The overhead gantry crane and ribbed pillars are massive.',
    commId: 'comm_architecture', slug: 'architecture', tags: ['industrial', 'architecture', 'heritage']
  },
  {
    title: 'Stairwell shadows at 4pm',
    caption: 'Stairwell study in the engineering pavilion. Always stop to watch the afternoon shadows cut across the steps.',
    commId: 'comm_photography', slug: 'photography', tags: ['stairs', 'shadows', 'light']
  },
  {
    title: 'Spiral staircase in the faculty hall',
    caption: 'Looking down the spiral concrete stairs. The curved soffit against the textured wall is such satisfying geometry.',
    commId: 'comm_architecture', slug: 'architecture', tags: ['staircase', 'geometry', 'concrete']
  },
  {
    title: 'Modernist parking ramp curves',
    caption: 'Helical parking ramp downtown. Modernist curves never get old.',
    commId: 'comm_architecture', slug: 'architecture', tags: ['modernism', 'concrete', 'structure']
  },
  {
    title: 'Window grid pattern',
    caption: 'Deeply recessed square windows on the new concert hall facade. Rhythmic and minimal.',
    commId: 'comm_design', slug: 'design', tags: ['minimalism', 'facade', 'grid']
  },
  {
    title: 'Pavilion angle study',
    caption: 'Looking up at the faceted corner of the contemporary art pavilion. Clean lines against overcast sky.',
    commId: 'comm_architecture', slug: 'architecture', tags: ['angles', 'perspective', 'lines']
  },
  {
    title: 'Diamond lattice concourse ceiling',
    caption: 'Looking up while waiting for the morning train. The structural steel lattice over the concourse always stops me in my tracks.',
    commId: 'comm_architecture', slug: 'architecture', tags: ['ceiling', 'structural', 'lattice']
  },
  {
    title: 'Hillside concrete studio',
    caption: 'Single-story studio pavilion nestled into the hillside. Concrete slabs floating over glass.',
    commId: 'comm_architecture', slug: 'architecture', tags: ['minimalism', 'concrete', 'studio']
  },
  {
    title: 'Drafting desk morning reset',
    caption: 'Drafting table laid out before starting elevation drawings for the studio review.',
    commId: 'comm_design', slug: 'design', tags: ['drafting', 'sketch', 'studio']
  },
  {
    title: 'Cedar slats & dark steel',
    caption: 'Warm cedar louvers against matte powder-coated steel columns. Beautiful material contrast.',
    commId: 'comm_architecture', slug: 'architecture', tags: ['materials', 'pavilion', 'facade']
  },
  {
    title: 'Reflecting pool in morning mist',
    caption: 'Reflecting pool outside the museum gallery. Quiet symmetry at 7am.',
    commId: 'comm_architecture', slug: 'architecture', tags: ['reflections', 'symmetry', 'water']
  },
  {
    title: 'Double-height library reading corner',
    caption: 'Double-height library room with oak shelving and woodland views. Dream workspace.',
    commId: 'comm_design', slug: 'design', tags: ['interiors', 'library', 'workspace']
  },
  {
    title: 'Charred timber forest cabin',
    caption: 'Charred cedar exterior on the forest retreat studio. Seamless integration with the trees.',
    commId: 'comm_architecture', slug: 'architecture', tags: ['timber', 'studio', 'nordic']
  },
  {
    title: 'Courtyard board-formed concrete',
    caption: 'Inner courtyard concrete walls weathering nicely with moss and subtle mineral patina.',
    commId: 'comm_photography', slug: 'photography', tags: ['courtyard', 'texture', 'concrete']
  },
  {
    title: 'Looking up between glass towers',
    caption: 'Looking straight up between the glass towers downtown. Felt slightly dizzy taking this!',
    commId: 'comm_photography', slug: 'photography', tags: ['city', 'perspective', 'sky']
  },
  {
    title: 'Hazy morning city skyline',
    caption: 'Telephoto view of the city skyline through the morning atmospheric haze.',
    commId: 'comm_photography', slug: 'photography', tags: ['skyline', 'city', 'telephoto']
  },
  {
    title: 'Rain reflections outside the station',
    caption: 'Late night puddle reflections outside the metro entrance. Neon magenta trails on wet pavement 🌧️',
    commId: 'comm_photography', slug: 'photography', tags: ['night', 'rain', 'reflections', 'city']
  },
  {
    title: 'Late night walk home in the rain',
    caption: 'Wet streets and subway entrance glow walking home after a long studio session.',
    commId: 'comm_photography', slug: 'photography', tags: ['night', 'urban', 'cinematic']
  },

  // 20-39: Technology, Hardware & Labs (indices 20..39 -> verifiedPhotos.technology)
  {
    title: 'Microprocessor die under magnification',
    caption: 'Silicon die interconnect traces under the optical microscope. Looks like an intricate miniature city.',
    commId: 'comm_systems', slug: 'systems', tags: ['hardware', 'silicon', 'macro']
  },
  {
    title: 'Fiber patch cords dressed in the rack',
    caption: 'Spent 2 hours dressing the aqua OM4 fiber patch cords down from the ladder rack. Tidy cabling makes me unreasonably happy.',
    commId: 'comm_infra', slug: 'cloud-native', tags: ['datacenter', 'fiber', 'networking']
  },
  {
    title: 'Cluster telemetry dashboard',
    caption: 'Terminal telemetry dashboard tracking packet queues and buffer pools during load testing.',
    commId: 'comm_infra', slug: 'cloud-native', tags: ['monitoring', 'terminal', 'devops']
  },
  {
    title: 'VT100 green phosphor glow',
    caption: 'Booted up the old green phosphor VT100 terminal in the server room. That cathode tube hum is pure nostalgia.',
    commId: 'comm_systems', slug: 'systems', tags: ['retrocomputing', 'terminal', 'vintage']
  },
  {
    title: 'Fiber optic light pipe macro',
    caption: 'Testing optical transceiver links in the server rack today. That blue termination glow in the dark aisle is strangely hypnotic.',
    commId: 'comm_infra', slug: 'cloud-native', tags: ['fiber', 'optics', 'tech']
  },
  {
    title: 'SMD soldering bench inspection',
    caption: 'Soldering tiny surface-mount decoupling caps under the magnifying lamp. Steady hands needed today.',
    commId: 'comm_systems', slug: 'systems', tags: ['electronics', 'soldering', 'hardware']
  },
  {
    title: 'Robotics lab manipulator',
    caption: 'Calibrating joint kinematics on the 6-axis arm. Watching smooth trajectory interpolation in hardware never gets old.',
    commId: 'comm_ai', slug: 'ai-systems', tags: ['robotics', 'automation', 'lab']
  },
  {
    title: 'Storage nodes in the cold aisle',
    caption: 'Pulsing green activity LEDs on the 2U NVMe storage arrays. Nothing beats a dark server aisle.',
    commId: 'comm_infra', slug: 'cloud-native', tags: ['servers', 'datacenter', 'hardware']
  },
  {
    title: 'Workstation GPU heatsink fin array',
    caption: 'The copper heatpipe and fin array on this workstation card is an absolute unit. Heavy thermal engineering.',
    commId: 'comm_ai', slug: 'ai-systems', tags: ['hardware', 'gpu', 'cooling']
  },
  {
    title: 'Quiet Sunday in the CS lab',
    caption: 'Dual-monitor Linux workstations in an empty department lab on Sunday morning. Best time to get work done without interruptions.',
    commId: 'comm_systems', slug: 'systems', tags: ['campus', 'workstation', 'linux']
  },
  {
    title: 'Late night code reflections',
    caption: 'Code buffer reflections across the laptop screen at 1am.',
    commId: 'comm_frontend', slug: 'frontend', tags: ['coding', 'night', 'laptop']
  },
  {
    title: 'Blade chassis power modules',
    caption: 'Rear hot-swap redundant power distribution on the blade chassis in our colocation cage.',
    commId: 'comm_infra', slug: 'cloud-native', tags: ['datacenter', 'sysadmin', 'hardware']
  },
  {
    title: 'Dual socket motherboard on testbench',
    caption: 'Bench testing a dual-socket server board with DDR4 memory banks before racking it.',
    commId: 'comm_systems', slug: 'systems', tags: ['hardware', 'server', 'testbench']
  },
  {
    title: '192-port Cat6A patch panel dressing',
    caption: 'Finished dressing 192 patch cords into the modular panels. Color-coded by VLAN.',
    commId: 'comm_infra', slug: 'cloud-native', tags: ['networking', 'cabling', 'homelab']
  },
  {
    title: 'Post-deploy war room review',
    caption: 'Team reviewing Grafana latency percentiles after rolling out the new cache service.',
    commId: 'comm_infra', slug: 'cloud-native', tags: ['team', 'grafana', 'monitoring']
  },
  {
    title: 'Whiteboard service topology sketch',
    caption: 'Whiteboard diagram of our async queue consumer topology before we start coding the worker service.',
    commId: 'comm_architecture', slug: 'architecture', tags: ['systemdesign', 'whiteboard', 'diagram']
  },
  {
    title: 'Custom 65% on wool desk mat',
    caption: 'Top-down look at my daily driver 65% with vintage beige keycaps on an acoustic wool mat.',
    commId: 'comm_design', slug: 'design', tags: ['keyboards', 'deskmat', 'workspace']
  },
  {
    title: 'Rust async code in Neovim',
    caption: 'Neovim with clean font ligatures and minimal status line. Distraction-free coding.',
    commId: 'comm_frontend', slug: 'frontend', tags: ['neovim', 'terminal', 'coding']
  },
  {
    title: 'Responsive testing in Chrome DevTools',
    caption: 'Testing mobile viewports and layout shifts with performance profiling docked.',
    commId: 'comm_frontend', slug: 'frontend', tags: ['webdev', 'frontend', 'responsive']
  },
  {
    title: 'Tailwind styling session',
    caption: 'Split editor previewing design token utility classes in our component library.',
    commId: 'comm_frontend', slug: 'frontend', tags: ['css', 'tailwind', 'designsystems']
  },

  // 40-59: Workspaces, Desks & Reading (indices 40..59 -> verifiedPhotos.workspaces)
  {
    title: 'Morning desk reset with coffee',
    caption: 'Birch standing desk in morning light. Fresh dot-grid notebook, hot mug, and laptop ready for standup.',
    commId: 'comm_design', slug: 'design', tags: ['desksetup', 'minimalism', 'coffee']
  },
  {
    title: 'Sunny home office window corner',
    caption: 'Home office corner with morning light and desk plants. Calming place to write code.',
    commId: 'comm_design', slug: 'design', tags: ['homeoffice', 'workspace', 'plants']
  },
  {
    title: 'Cafe corner coding sprint',
    caption: 'Grabbed a corner booth at the neighborhood cafe with pour-over coffee and headphones.',
    commId: 'comm_frontend', slug: 'frontend', tags: ['cafe', 'coding', 'coffee']
  },
  {
    title: 'Minimal matte black workstation',
    caption: 'All-black desk setup. Monitor arm, wireless mouse, and black desk pad.',
    commId: 'comm_design', slug: 'design', tags: ['desksetup', 'minimalism', 'workspace']
  },
  {
    title: 'Warm bias lighting behind dual displays',
    caption: 'Warm 2700K backlight behind dual monitors. Saves eye strain during evening debugging sessions.',
    commId: 'comm_design', slug: 'design', tags: ['workspace', 'monitors', 'lighting']
  },
  {
    title: 'Close-up of code on screen',
    caption: 'Clean monospaced font with subtle syntax highlighting.',
    commId: 'comm_frontend', slug: 'frontend', tags: ['code', 'typography', 'terminal']
  },
  {
    title: 'Monochrome terminal editor',
    caption: 'High-contrast monochrome editor theme. Zero visual noise.',
    commId: 'comm_systems', slug: 'systems', tags: ['terminal', 'minimal', 'coding']
  },
  {
    title: 'Classic engineering books on oak desk',
    caption: 'The holy trinity on my desk: Hennessy & Patterson, Knuth, and Tanenbaum.',
    commId: 'comm_systems', slug: 'systems', tags: ['books', 'engineering', 'reading']
  },
  {
    title: 'Quiet campus library stacks',
    caption: 'Quiet wooden aisles and soft brass reading lamps in the university library.',
    commId: 'comm_photography', slug: 'photography', tags: ['library', 'books', 'quiet']
  },
  {
    title: 'Fountain pen notes in dot grid journal',
    caption: 'Handwritten graph traversal notes and pseudocode in my notebook with dark black ink.',
    commId: 'comm_design', slug: 'design', tags: ['analog', 'fountainpen', 'notes']
  },
  {
    title: 'Typography layout sketches',
    caption: 'Pencil sketches testing modular typographic scale and baseline grid ratios for a landing page.',
    commId: 'comm_design', slug: 'design', tags: ['typography', 'sketch', 'design']
  },
  {
    title: 'Study group whiteboard session',
    caption: 'Campus study session grinding out algorithm complexity diagrams before midterms.',
    commId: 'comm_systems', slug: 'systems', tags: ['college', 'study', 'students']
  },
  {
    title: 'Weekend project sprint with the team',
    caption: 'Hour 14 of the sprint. Cold brew is running low, but the demo build is finally compiling without errors.',
    commId: 'comm_frontend', slug: 'frontend', tags: ['hackathon', 'team', 'coding']
  },
  {
    title: 'Sunday reading in the sunny corner',
    caption: 'Afternoon quiet reading session with a scifi paperback and coffee in the sun.',
    commId: 'comm_photography', slug: 'photography', tags: ['reading', 'books', 'afternoon']
  },
  {
    title: 'Bound journal archives in the library',
    caption: 'Old bound volumes of IEEE Computer and ACM Transactions in the graduate library stacks.',
    commId: 'comm_systems', slug: 'systems', tags: ['archive', 'research', 'library']
  },
  {
    title: 'Late night desk lamp glow',
    caption: 'Amber task lamp glow over my desk notes at midnight.',
    commId: 'comm_photography', slug: 'photography', tags: ['night', 'desk', 'cozy']
  },
  {
    title: 'BIM model review discussion',
    caption: 'Architects and structural engineers reviewing 3D elevation cuts on a tablet.',
    commId: 'comm_architecture', slug: 'architecture', tags: ['architecture', 'bim', 'meeting']
  },
  {
    title: 'Paper wireframe cards on corkboard',
    caption: 'Paper wireframe cards pinned to the cork wall to test checkout navigation hierarchy.',
    commId: 'comm_design', slug: 'design', tags: ['ux', 'prototyping', 'wireframe']
  },
  {
    title: 'Architecture milestones presentation',
    caption: 'Presentation slide highlighting our infrastructure migration timeline for the team.',
    commId: 'comm_infra', slug: 'cloud-native', tags: ['slides', 'team', 'architecture']
  },
  {
    title: 'Grafana telemetry on tablet',
    caption: 'Portable tablet showing live edge cache hit ratios and 5xx error rates.',
    commId: 'comm_infra', slug: 'cloud-native', tags: ['dashboard', 'telemetry', 'monitoring']
  },

  // 60-79: Lifestyle, Coffee, Food & Cafes (indices 60..79 -> verifiedPhotos.lifestyle)
  // Assigned to comm_photography (cafes, food, travel) & comm_design (coffee craft)
  {
    title: 'Morning Chemex brew',
    caption: 'Watching the bloom on a washed Ethiopian coffee in the Chemex. Jasmine and peach notes.',
    commId: 'comm_design', slug: 'design', tags: ['coffee', 'chemex', 'pourover']
  },
  {
    title: 'Neighborhood indie cafe corner',
    caption: 'Exposed brick, pendant lights, and quiet morning chatter at my favorite neighborhood cafe.',
    commId: 'comm_photography', slug: 'photography', tags: ['cafe', 'coffee', 'cozy']
  },
  {
    title: 'Single origin espresso shot',
    caption: 'Single origin espresso in a stoneware demitasse cup with a glass of sparkling water.',
    commId: 'comm_design', slug: 'design', tags: ['espresso', 'coffee', 'ceramic']
  },
  {
    title: 'Croissant and black coffee by the window',
    caption: 'Flaky warm croissant and black coffee by the cafe window. Quiet start to the weekend.',
    commId: 'comm_photography', slug: 'photography', tags: ['cafe', 'morning', 'croissant']
  },
  {
    title: 'Fresh pain au chocolat',
    caption: 'Fresh pain au chocolat straight from the neighborhood bakery oven. Golden and flaky.',
    commId: 'comm_photography', slug: 'photography', tags: ['pastry', 'bakery', 'food']
  },
  {
    title: 'Sourdough pizza with fresh basil',
    caption: 'Neapolitan style sourdough pizza with blistered crust, fresh buffalo mozzarella, and garden basil.',
    commId: 'comm_photography', slug: 'photography', tags: ['pizza', 'sourdough', 'food']
  },
  {
    title: 'Avocado and grain lunch bowl',
    caption: 'Healthy lunch bowl with quinoa, avocado, kale, and lemon tahini dressing.',
    commId: 'comm_photography', slug: 'photography', tags: ['healthy', 'salad', 'lunch']
  },
  {
    title: 'Blueberry buttermilk pancakes',
    caption: 'Weekend pancake stack with fresh blueberries and real maple syrup.',
    commId: 'comm_photography', slug: 'photography', tags: ['breakfast', 'pancakes', 'weekend']
  },
  {
    title: 'Farmers market vegetable harvest',
    caption: 'Heirloom carrots and radishes fresh from the Saturday farmers market.',
    commId: 'comm_photography', slug: 'photography', tags: ['farmersmarket', 'vegetables', 'food']
  },
  {
    title: 'Roasted seasonal squash plate',
    caption: 'Roasted delicata squash with toasted hazelnuts and herbs.',
    commId: 'comm_photography', slug: 'photography', tags: ['dinner', 'cooking', 'seasonal']
  },
  {
    title: 'Tonkotsu ramen on a cold evening',
    caption: 'Steaming bowl of spicy tonkotsu ramen with soft egg and springy noodles on a rainy night.',
    commId: 'comm_photography', slug: 'photography', tags: ['ramen', 'comfortfood', 'food']
  },
  {
    title: 'Homemade smash burger',
    caption: 'Double smash burger with crispy lace edges, griddled onions, and cheddar on a potato roll.',
    commId: 'comm_photography', slug: 'photography', tags: ['burger', 'cooking', 'food']
  },
  {
    title: 'Candlelight bistro dinner',
    caption: 'Warm evening dinner ambiance at the local wine bistro.',
    commId: 'comm_photography', slug: 'photography', tags: ['bistro', 'evening', 'dining']
  },
  {
    title: 'Hand grinding beans for pour-over',
    caption: 'Grinding light roast beans in the manual burr grinder. The aroma fills the whole kitchen.',
    commId: 'comm_design', slug: 'design', tags: ['coffee', 'pourover', 'manual']
  },
  {
    title: 'Latte art rosetta',
    caption: 'Poured a clean symmetrical rosetta in my handmade ceramic mug this morning.',
    commId: 'comm_design', slug: 'design', tags: ['coffee', 'latteart', 'ceramic']
  },
  {
    title: 'Mountain ridgeline view on the trail',
    caption: 'Reaching the granite ridge above the tree line. Cool mountain air and endless views.',
    commId: 'comm_photography', slug: 'photography', tags: ['hiking', 'mountains', 'outdoors']
  },
  {
    title: 'Vintage 35mm rangefinder and trail map',
    caption: 'Trail map, brass compass, and my Olympus OM-1. Taking a quiet breather at the ridge before starting the descent.',
    commId: 'comm_photography', slug: 'photography', tags: ['travel', 'analog', 'hiking']
  },
  {
    title: 'Desert highway dusk road trip',
    caption: 'Cruising through the red rock country right as dusk turns the clouds violet.',
    commId: 'comm_photography', slug: 'photography', tags: ['roadtrip', 'travel', 'sunset']
  },
  {
    title: 'Granite peaks in morning mist',
    caption: 'Alpine granite peaks emerging through the low morning clouds.',
    commId: 'comm_photography', slug: 'photography', tags: ['mountains', 'alpine', 'nature']
  },
  {
    title: 'Low tide ocean waves',
    caption: 'Gentle morning waves washing over the wet sand at low tide. Incredibly peaceful.',
    commId: 'comm_photography', slug: 'photography', tags: ['ocean', 'beach', 'calm']
  },

  // 80-83: Creative Code, Generative Art & Pets (indices 80..83 -> verifiedPhotos.creative_art)
  {
    title: 'Generative 3D line density field',
    caption: 'GLSL compute shader experiment exploring vector field line density and spatial tension.',
    commId: 'comm_creative', slug: 'creative-coding', tags: ['generative', 'shaders', 'webgl']
  },
  {
    title: 'Oliver napping in the afternoon sun',
    caption: 'Oliver found the one warm sunbeam on the armchair and has not moved for 3 hours 🐱',
    commId: 'comm_photography', slug: 'photography', tags: ['cats', 'pets', 'cozy']
  },
  {
    title: 'Golden hour sprint in the leaves',
    caption: 'Chasing tennis balls through fallen maple leaves at full sprint. Peak autumn joy!',
    commId: 'comm_photography', slug: 'photography', tags: ['dogs', 'autumn', 'pets']
  },
  {
    title: 'Luna on the front lawn',
    caption: 'Luna the border collie puppy tilting her head trying to understand why I have a camera in her face.',
    commId: 'comm_photography', slug: 'photography', tags: ['puppy', 'pets', 'dogs']
  },
];

export function getVisualPin(index) {
  const meta = visualPinMeta[index % visualPinMeta.length];
  const photo = allPhotos[index % allPhotos.length];
  return {
    title: meta.title,
    caption: meta.caption,
    community_id: meta.commId,
    community_slug: meta.slug,
    media: {
      url: `https://images.unsplash.com/${photo.id}?w=1200&auto=format&fit=crop&q=80`,
      aspect_ratio: photo.ratio,
      width: photo.width,
      height: photo.height,
      alt_text: photo.alt,
    },
    dominant_color: photo.color,
    tags: meta.tags,
  };
}

console.log(`Configured ${visualPinMeta.length} visual pins definitions.`);
