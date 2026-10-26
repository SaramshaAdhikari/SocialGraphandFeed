import fs from 'node:fs';
import path from 'node:path';

const avatarsDir = path.resolve('packages/frontend/public/avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

const avatars = [
  // 1. Mascot Panda
  {
    name: 'mascot-panda.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#1e1b4b" stroke="#818cf8" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Ears -->
  <circle cx="48" cy="48" r="18" fill="#0f172a"/>
  <circle cx="112" cy="48" r="18" fill="#0f172a"/>
  <circle cx="48" cy="48" r="8" fill="#312e81"/>
  <circle cx="112" cy="48" r="8" fill="#312e81"/>
  <!-- Head -->
  <ellipse cx="80" cy="90" rx="44" ry="40" fill="#f8fafc"/>
  <!-- Eye Patches -->
  <ellipse cx="62" cy="86" rx="14" ry="11" fill="#0f172a" transform="rotate(-15 62 86)"/>
  <ellipse cx="98" cy="86" rx="14" ry="11" fill="#0f172a" transform="rotate(15 98 86)"/>
  <!-- Eyes -->
  <circle cx="64" cy="85" r="4" fill="#ffffff"/>
  <circle cx="96" cy="85" r="4" fill="#ffffff"/>
  <circle cx="65" cy="84" r="1.5" fill="#38bdf8"/>
  <circle cx="97" cy="84" r="1.5" fill="#38bdf8"/>
  <!-- Nose & Mouth -->
  <ellipse cx="80" cy="100" rx="6" ry="4" fill="#0f172a"/>
  <path d="M75 106 C77 109 83 109 85 106" stroke="#0f172a" stroke-width="2" stroke-linecap="round" fill="none"/>
  <!-- Cheeks -->
  <circle cx="48" cy="98" r="5" fill="#fda4af" opacity="0.6"/>
  <circle cx="112" cy="98" r="5" fill="#fda4af" opacity="0.6"/>
</svg>`
  },

  // 2. Mascot Raccoon (Trash Panda)
  {
    name: 'mascot-raccoon.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#18181b" stroke="#a1a1aa" stroke-width="3" stroke-opacity="0.35"/>
  <!-- Ears -->
  <polygon points="40,65 52,28 72,55" fill="#52525b"/>
  <polygon points="44,60 52,35 66,54" fill="#f4f4f5"/>
  <polygon points="120,65 108,28 88,55" fill="#52525b"/>
  <polygon points="116,60 108,35 94,54" fill="#f4f4f5"/>
  <!-- Face base -->
  <path d="M38 78 C38 116 56 128 80 128 C104 128 122 116 122 78 C122 55 102 52 80 52 C58 52 38 55 38 78 Z" fill="#71717a"/>
  <!-- Bandit Mask -->
  <path d="M42 76 C52 70 70 76 80 80 C90 76 108 70 118 76 C122 86 116 96 106 96 C92 96 84 88 80 88 C76 88 68 96 54 96 C44 96 38 86 42 76 Z" fill="#18181b"/>
  <!-- White eye brows / muzzle -->
  <path d="M68 92 C72 88 88 88 92 92 L80 112 Z" fill="#f4f4f5"/>
  <!-- Eyes -->
  <circle cx="58" cy="84" r="5" fill="#fbbf24"/>
  <circle cx="102" cy="84" r="5" fill="#fbbf24"/>
  <circle cx="58" cy="84" r="2.5" fill="#18181b"/>
  <circle cx="102" cy="84" r="2.5" fill="#18181b"/>
  <circle cx="57" cy="82.5" r="1" fill="#ffffff"/>
  <circle cx="101" cy="82.5" r="1" fill="#ffffff"/>
  <!-- Nose -->
  <polygon points="76,96 84,96 80,102" fill="#09090b"/>
</svg>`
  },

  // 3. Mascot Cat (NullCat)
  {
    name: 'mascot-cat.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#09090b" stroke="#10b981" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Ears -->
  <polygon points="38,70 46,30 74,60" fill="#18181b"/>
  <polygon points="42,65 48,38 68,58" fill="#10b981" opacity="0.3"/>
  <polygon points="122,70 114,30 86,60" fill="#18181b"/>
  <polygon points="118,65 112,38 92,58" fill="#10b981" opacity="0.3"/>
  <!-- Head -->
  <ellipse cx="80" cy="88" rx="44" ry="38" fill="#18181b"/>
  <!-- Glowing Eyes -->
  <ellipse cx="60" cy="84" rx="8" ry="12" fill="#10b981"/>
  <ellipse cx="100" cy="84" rx="8" ry="12" fill="#10b981"/>
  <ellipse cx="60" cy="84" rx="2.5" ry="9" fill="#064e3b"/>
  <ellipse cx="100" cy="84" rx="2.5" ry="9" fill="#064e3b"/>
  <circle cx="58" cy="80" r="2" fill="#ffffff"/>
  <circle cx="98" cy="80" r="2" fill="#ffffff"/>
  <!-- Nose & Whiskers -->
  <polygon points="77,96 83,96 80,100" fill="#34d399"/>
  <line x1="42" y1="94" x2="22" y2="90" stroke="#52525b" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="42" y1="98" x2="20" y2="100" stroke="#52525b" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="118" y1="94" x2="138" y2="90" stroke="#52525b" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="118" y1="98" x2="140" y2="100" stroke="#52525b" stroke-width="1.5" stroke-linecap="round"/>
</svg>`
  },

  // 4. Mascot Fox
  {
    name: 'mascot-fox.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#1c1917" stroke="#f97316" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Ears -->
  <polygon points="34,75 42,26 76,64" fill="#ea580c"/>
  <polygon points="40,68 46,35 68,60" fill="#292524"/>
  <polygon points="126,75 118,26 84,64" fill="#ea580c"/>
  <polygon points="120,68 114,35 92,60" fill="#292524"/>
  <!-- Head polygon geometric -->
  <polygon points="36,76 80,126 124,76 80,56" fill="#ea580c"/>
  <!-- White cheeks -->
  <polygon points="36,76 80,126 62,88" fill="#f5f5f4"/>
  <polygon points="124,76 80,126 98,88" fill="#f5f5f4"/>
  <!-- Eyes -->
  <polygon points="56,76 70,82 58,84" fill="#1c1917"/>
  <polygon points="104,76 90,82 102,84" fill="#1c1917"/>
  <!-- Nose -->
  <circle cx="80" cy="122" r="5" fill="#0c0a09"/>
</svg>`
  },

  // 5. Mascot Shiba
  {
    name: 'mascot-shiba.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#27272a" stroke="#d97706" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Ears -->
  <polygon points="40,68 48,32 72,58" fill="#d97706"/>
  <polygon points="46,62 52,40 66,56" fill="#fef3c7"/>
  <polygon points="120,68 112,32 88,58" fill="#d97706"/>
  <polygon points="114,62 108,40 94,56" fill="#fef3c7"/>
  <!-- Head -->
  <ellipse cx="80" cy="88" rx="42" ry="38" fill="#d97706"/>
  <!-- White Muzzle -->
  <path d="M50 86 C50 114 62 126 80 126 C98 126 110 114 110 86 C98 84 88 94 80 94 C72 94 62 84 50 86 Z" fill="#fffbeb"/>
  <!-- White Eyebrows -->
  <circle cx="62" cy="74" r="4.5" fill="#fffbeb"/>
  <circle cx="98" cy="74" r="4.5" fill="#fffbeb"/>
  <!-- Eyes -->
  <ellipse cx="62" cy="84" rx="4" ry="5" fill="#18181b"/>
  <ellipse cx="98" cy="84" rx="4" ry="5" fill="#18181b"/>
  <circle cx="61" cy="82" r="1.5" fill="#ffffff"/>
  <circle cx="97" cy="82" r="1.5" fill="#ffffff"/>
  <!-- Nose -->
  <ellipse cx="80" cy="100" rx="6" ry="4" fill="#18181b"/>
  <path d="M76 106 C78 109 82 109 84 106" stroke="#18181b" stroke-width="2" stroke-linecap="round" fill="none"/>
</svg>`
  },

  // 6. Pixel Gameboy
  {
    name: 'pixel-gameboy.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#0f172a" stroke="#8b5cf6" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Console Shell -->
  <rect x="44" y="32" width="72" height="102" rx="10" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>
  <!-- Screen Lens -->
  <rect x="52" y="42" width="56" height="44" rx="6" fill="#64748b"/>
  <!-- Dot Matrix Screen -->
  <rect x="60" y="48" width="40" height="32" rx="2" fill="#84cc16"/>
  <!-- Pixel art icon in screen (tiny sword) -->
  <rect x="76" y="54" width="4" height="16" fill="#3f6212"/>
  <rect x="72" y="66" width="12" height="4" fill="#3f6212"/>
  <rect x="78" y="70" width="4" height="4" fill="#1a2e05"/>
  <!-- D-Pad -->
  <rect x="54" y="98" width="8" height="20" fill="#1e293b"/>
  <rect x="48" y="104" width="20" height="8" fill="#1e293b"/>
  <!-- Action Buttons (A/B) -->
  <circle cx="104" cy="102" r="5" fill="#ec4899"/>
  <circle cx="94" cy="110" r="5" fill="#ec4899"/>
</svg>`
  },

  // 7. Pixel Potion
  {
    name: 'pixel-potion.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#18181b" stroke="#ec4899" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Cork -->
  <rect x="72" y="36" width="16" height="10" fill="#b45309"/>
  <rect x="74" y="38" width="12" height="4" fill="#d97706"/>
  <!-- Bottle Neck -->
  <rect x="70" y="46" width="20" height="12" fill="#64748b"/>
  <!-- Bottle Body -->
  <path d="M64 58 L50 82 L50 112 C50 120 56 126 64 126 L96 126 C104 126 110 120 110 112 L110 82 L96 58 Z" fill="#334155" stroke="#64748b" stroke-width="3"/>
  <!-- Magic Liquid -->
  <path d="M54 90 L54 112 C54 118 58 122 64 122 L96 122 C102 122 106 118 106 112 L106 90 Z" fill="#ec4899"/>
  <!-- Bubbles & Sparkles -->
  <circle cx="70" cy="104" r="4" fill="#fbcfe8"/>
  <circle cx="88" cy="98" r="3" fill="#fbcfe8"/>
  <circle cx="78" cy="112" r="2.5" fill="#fbcfe8"/>
  <circle cx="62" cy="74" r="2" fill="#ffffff" opacity="0.8"/>
  <circle cx="68" cy="66" r="3" fill="#ffffff" opacity="0.8"/>
</svg>`
  },

  // 8. Pixel Ghost
  {
    name: 'pixel-ghost.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#0f172a" stroke="#38bdf8" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Pixel Ghost Body -->
  <path d="M52 56 C52 40 64 36 80 36 C96 36 108 40 108 56 L108 116 L98 106 L88 116 L80 106 L72 116 L62 106 L52 116 Z" fill="#38bdf8"/>
  <!-- Ghost Eyes -->
  <rect x="62" y="58" width="10" height="14" rx="2" fill="#ffffff"/>
  <rect x="88" y="58" width="10" height="14" rx="2" fill="#ffffff"/>
  <rect x="68" y="64" width="6" height="8" rx="1" fill="#0369a1"/>
  <rect x="94" y="64" width="6" height="8" rx="1" fill="#0369a1"/>
</svg>`
  },

  // 9. Gear Porsche 911 / Car Track
  {
    name: 'gear-car.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#18181b" stroke="#ef4444" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Tachometer Dial -->
  <circle cx="80" cy="80" r="54" fill="#09090b" stroke="#3f3f46" stroke-width="3"/>
  <circle cx="80" cy="80" r="50" fill="none" stroke="#27272a" stroke-width="1.5" stroke-dasharray="4 4"/>
  <!-- Redline arc -->
  <path d="M108 44 A 50 50 0 0 1 128 72" fill="none" stroke="#ef4444" stroke-width="4"/>
  <!-- Gauge Needle -->
  <polygon points="78,82 82,82 114,52 110,48" fill="#ef4444"/>
  <circle cx="80" cy="80" r="8" fill="#27272a" stroke="#71717a" stroke-width="2"/>
  <!-- RPM label -->
  <text x="80" y="112" font-family="sans-serif" font-size="10" font-weight="bold" fill="#71717a" text-anchor="middle">RPM x1000</text>
</svg>`
  },

  // 10. Gear Motorcycle / Cafe Racer
  {
    name: 'gear-motorcycle.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#1c1917" stroke="#f59e0b" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Retro Motorcycle Helmet Visor & Stripes -->
  <path d="M44 80 C44 54 58 40 80 40 C102 40 116 54 116 80 C116 106 106 122 80 122 C54 122 44 106 44 80 Z" fill="#292524" stroke="#44403c" stroke-width="2.5"/>
  <!-- Racing Dual Stripes -->
  <rect x="74" y="40" width="5" height="82" fill="#f59e0b"/>
  <rect x="81" y="40" width="5" height="82" fill="#f59e0b"/>
  <!-- Dark Visor Shield -->
  <path d="M50 72 C50 64 62 60 80 60 C98 60 110 64 110 72 C110 86 102 92 80 92 C58 92 50 86 50 72 Z" fill="#0c0a09" stroke="#78716c" stroke-width="2"/>
  <path d="M56 68 C62 64 72 63 80 63" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
</svg>`
  },

  // 11. Gear Bouldering / Climbing
  {
    name: 'gear-boulder.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#1e293b" stroke="#38bdf8" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Carabiner outline -->
  <path d="M60 44 C72 38 88 38 98 48 C106 56 108 72 108 94 C108 114 98 124 84 124 C68 124 52 116 52 98 L52 64 C52 52 54 46 60 44 Z" fill="none" stroke="#38bdf8" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Screw Gate -->
  <rect x="47" y="68" width="10" height="24" rx="2" fill="#f59e0b"/>
  <line x1="47" y1="74" x2="57" y2="74" stroke="#78350f" stroke-width="1.5"/>
  <line x1="47" y1="80" x2="57" y2="80" stroke="#78350f" stroke-width="1.5"/>
  <line x1="47" y1="86" x2="57" y2="86" stroke="#78350f" stroke-width="1.5"/>
</svg>`
  },

  // 12. Gear Running / Stride
  {
    name: 'gear-running.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#0f172a" stroke="#22c55e" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Stopwatch dial & speed wings -->
  <circle cx="80" cy="86" r="42" fill="#1e293b" stroke="#22c55e" stroke-width="3"/>
  <rect x="76" y="34" width="8" height="12" rx="2" fill="#22c55e"/>
  <rect x="72" y="30" width="16" height="5" rx="2" fill="#4ade80"/>
  <!-- Dial ticks -->
  <line x1="80" y1="50" x2="80" y2="56" stroke="#4ade80" stroke-width="2"/>
  <line x1="116" y1="86" x2="110" y2="86" stroke="#4ade80" stroke-width="2"/>
  <line x1="80" y1="122" x2="80" y2="116" stroke="#4ade80" stroke-width="2"/>
  <line x1="44" y1="86" x2="50" y2="86" stroke="#4ade80" stroke-width="2"/>
  <!-- Stopwatch Needle -->
  <line x1="80" y1="86" x2="100" y2="66" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="80" cy="86" r="4" fill="#ef4444"/>
</svg>`
  },

  // 13. Gear Vinyl / Music
  {
    name: 'gear-vinyl.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#18181b" stroke="#e11d48" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Vinyl Record -->
  <circle cx="80" cy="80" r="54" fill="#09090b" stroke="#27272a" stroke-width="2"/>
  <!-- Grooves -->
  <circle cx="80" cy="80" r="46" fill="none" stroke="#27272a" stroke-width="1.5"/>
  <circle cx="80" cy="80" r="38" fill="none" stroke="#27272a" stroke-width="1.5"/>
  <circle cx="80" cy="80" r="30" fill="none" stroke="#27272a" stroke-width="1.5"/>
  <!-- Vinyl Light Sheen reflections -->
  <path d="M52 52 L62 62 M108 108 L98 98" stroke="#3f3f46" stroke-width="2" stroke-linecap="round"/>
  <!-- Center Label -->
  <circle cx="80" cy="80" r="20" fill="#e11d48"/>
  <circle cx="80" cy="80" r="5" fill="#f43f5e"/>
  <!-- Spindle Hole -->
  <circle cx="80" cy="80" r="3" fill="#ffffff"/>
</svg>`
  },

  // 14. Food Coffee / V60
  {
    name: 'food-coffee.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#1c1917" stroke="#b45309" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Coffee Carafe base -->
  <path d="M58 88 L50 126 C50 130 54 134 60 134 L100 134 C106 134 110 130 110 126 L102 88 Z" fill="#292524" stroke="#57534e" stroke-width="2"/>
  <!-- Liquid Level -->
  <path d="M54 108 L50 126 C50 130 54 134 60 134 L100 134 C106 134 110 130 110 126 L106 108 Z" fill="#78350f"/>
  <!-- V60 Ceramic Dripper Cone -->
  <polygon points="46,44 114,44 88,88 72,88" fill="#f5f5f4" stroke="#d6d3d1" stroke-width="2"/>
  <!-- Dripper ribs -->
  <line x1="56" y1="46" x2="76" y2="82" stroke="#a8a29e" stroke-width="1.5"/>
  <line x1="80" y1="46" x2="80" y2="84" stroke="#a8a29e" stroke-width="1.5"/>
  <line x1="104" y1="46" x2="84" y2="82" stroke="#a8a29e" stroke-width="1.5"/>
  <!-- Steam curls -->
  <path d="M72 36 C70 30 74 26 72 20" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round"/>
  <path d="M86 36 C88 30 84 26 86 20" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round"/>
</svg>`
  },

  // 15. Food Sourdough
  {
    name: 'food-sourdough.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#1c1917" stroke="#d97706" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Artisan Boule Bread Crust -->
  <ellipse cx="80" cy="94" rx="52" ry="36" fill="#b45309" stroke="#78350f" stroke-width="3"/>
  <!-- Bread Top Crust Dome -->
  <path d="M32 94 C32 60 52 48 80 48 C108 48 128 60 128 94 Z" fill="#d97706"/>
  <!-- Scored Ear Cut -->
  <path d="M46 76 C64 62 96 62 114 76" fill="none" stroke="#fef3c7" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M46 76 C64 62 96 62 114 76" fill="none" stroke="#78350f" stroke-width="1.5" stroke-linecap="round"/>
  <!-- Flour Dusting Speckles -->
  <circle cx="62" cy="58" r="1.5" fill="#fef3c7"/>
  <circle cx="78" cy="54" r="2" fill="#fef3c7"/>
  <circle cx="94" cy="56" r="1.5" fill="#fef3c7"/>
  <circle cx="106" cy="66" r="1.5" fill="#fef3c7"/>
</svg>`
  },

  // 16. Food Matcha
  {
    name: 'food-matcha.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#14532d" stroke="#86efac" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Ceramic Chawan Tea Bowl -->
  <path d="M38 72 C38 116 52 130 80 130 C108 130 122 116 122 72 L38 72 Z" fill="#1f2937" stroke="#374151" stroke-width="3"/>
  <!-- Frothy Matcha Green Surface -->
  <ellipse cx="80" cy="74" rx="40" ry="12" fill="#65a30d"/>
  <!-- Foam microbubbles -->
  <circle cx="70" cy="74" r="3" fill="#bef264"/>
  <circle cx="88" cy="73" r="2.5" fill="#bef264"/>
  <circle cx="78" cy="76" r="2" fill="#bef264"/>
  <circle cx="96" cy="75" r="2" fill="#bef264"/>
  <circle cx="62" cy="75" r="2" fill="#bef264"/>
  <!-- Bamboo Whisk (Chasen) Silhouette top -->
  <path d="M74 30 L86 30 L82 48 L78 48 Z" fill="#d97706"/>
  <path d="M72 48 C72 58 76 64 78 64 L82 64 C84 64 88 58 88 48 Z" fill="#fef3c7" stroke="#b45309" stroke-width="1.5"/>
</svg>`
  },

  // 17. Nature Monstera
  {
    name: 'nature-monstera.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#064e3b" stroke="#34d399" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Leaf Stem -->
  <path d="M80 138 C80 110 80 80 80 34" stroke="#059669" stroke-width="4" stroke-linecap="round"/>
  <!-- Monstera Leaf Silhouette -->
  <path d="M80 34 C104 50 126 80 110 116 C100 136 80 134 80 134 C80 134 60 136 50 116 C34 80 56 50 80 34 Z" fill="#10b981"/>
  <!-- Deep Leaf Cutouts (Fenestrations) -->
  <ellipse cx="94" cy="74" rx="14" ry="4" fill="#064e3b" transform="rotate(25 94 74)"/>
  <ellipse cx="94" cy="94" rx="12" ry="4" fill="#064e3b" transform="rotate(20 94 94)"/>
  <ellipse cx="66" cy="74" rx="14" ry="4" fill="#064e3b" transform="rotate(-25 66 74)"/>
  <ellipse cx="66" cy="94" rx="12" ry="4" fill="#064e3b" transform="rotate(-20 66 94)"/>
</svg>`
  },

  // 18. Nature Mountain
  {
    name: 'nature-mountain.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#0f172a" stroke="#38bdf8" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Moon -->
  <circle cx="112" cy="50" r="10" fill="#fef08a"/>
  <!-- Back Mountain -->
  <polygon points="60,132 104,60 138,132" fill="#334155"/>
  <polygon points="104,60 116,80 104,78 94,84" fill="#e2e8f0"/>
  <!-- Front Mountain -->
  <polygon points="26,132 72,44 116,132" fill="#1e293b"/>
  <!-- Snowcap -->
  <polygon points="72,44 86,70 76,66 70,72 62,64 58,70" fill="#f8fafc"/>
  <!-- Pine tree silhouettes -->
  <polygon points="40,132 46,118 52,132" fill="#0f172a"/>
  <polygon points="50,132 55,122 60,132" fill="#0f172a"/>
</svg>`
  },

  // 19. Art Manga Dip Pen
  {
    name: 'art-manga-pen.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#18181b" stroke="#e11d48" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Pen Nib (G-Pen) -->
  <polygon points="80,126 64,80 72,40 88,40 96,80" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>
  <line x1="80" y1="58" x2="80" y2="124" stroke="#1e293b" stroke-width="2"/>
  <circle cx="80" cy="68" r="4" fill="#09090b"/>
  <!-- Nib side cutouts -->
  <circle cx="64" cy="76" r="4" fill="#18181b"/>
  <circle cx="96" cy="76" r="4" fill="#18181b"/>
  <!-- Ink Droplet on tip -->
  <circle cx="80" cy="132" r="3.5" fill="#e11d48"/>
</svg>`
  },

  // 20. Code Terminal (NullCat / Tech)
  {
    name: 'code-terminal.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#022c22" stroke="#10b981" stroke-width="3" stroke-opacity="0.4"/>
  <!-- CRT Monitor Frame -->
  <rect x="36" y="44" width="88" height="72" rx="12" fill="#064e3b" stroke="#059669" stroke-width="2.5"/>
  <!-- Screen Glow -->
  <rect x="42" y="50" width="76" height="60" rx="8" fill="#022c22"/>
  <!-- Terminal Prompt -->
  <text x="50" y="74" font-family="monospace" font-size="16" font-weight="bold" fill="#34d399">&gt; $</text>
  <rect x="74" y="62" width="10" height="14" fill="#10b981">
    <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/>
  </rect>
  <line x1="50" y1="92" x2="98" y2="92" stroke="#059669" stroke-width="2.5" stroke-linecap="round"/>
</svg>`
  },

  // 21. Books Reading
  {
    name: 'books-reading.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#1e1b4b" stroke="#a855f7" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Open Hardcover Book -->
  <path d="M80 62 C64 54 42 56 36 62 L36 112 C44 106 64 106 80 114 C96 106 116 106 124 112 L124 62 C118 56 96 54 80 62 Z" fill="#f8fafc" stroke="#475569" stroke-width="2.5"/>
  <line x1="80" y1="62" x2="80" y2="114" stroke="#cbd5e1" stroke-width="2.5"/>
  <!-- Ribbon Bookmark -->
  <path d="M80 62 L80 126 L85 120 L90 126 L90 64" fill="#a855f7"/>
  <!-- Text lines suggestion -->
  <line x1="46" y1="74" x2="70" y2="74" stroke="#94a3b8" stroke-width="1.5"/>
  <line x1="46" y1="82" x2="68" y2="82" stroke="#94a3b8" stroke-width="1.5"/>
  <line x1="46" y1="90" x2="72" y2="90" stroke="#94a3b8" stroke-width="1.5"/>
  <line x1="90" y1="74" x2="114" y2="74" stroke="#94a3b8" stroke-width="1.5"/>
  <line x1="90" y1="82" x2="112" y2="82" stroke="#94a3b8" stroke-width="1.5"/>
  <line x1="90" y1="90" x2="114" y2="90" stroke="#94a3b8" stroke-width="1.5"/>
</svg>`
  },

  // 22. Abstract Bauhaus
  {
    name: 'abstract-bauhaus.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#18181b" stroke="#eab308" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Primary geometric shapes -->
  <circle cx="64" cy="64" r="28" fill="#ef4444"/>
  <rect x="74" y="68" width="46" height="46" rx="4" fill="#3b82f6"/>
  <polygon points="50,124 88,124 69,88" fill="#eab308"/>
  <line x1="36" y1="40" x2="124" y2="128" stroke="#f4f4f5" stroke-width="2.5" stroke-dasharray="3 3"/>
</svg>`
  },

  // 23. Abstract Cyber
  {
    name: 'abstract-cyber.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#030712" stroke="#06b6d4" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Concentric cyber hex polygons -->
  <polygon points="80,32 118,54 118,106 80,128 42,106 42,54" fill="none" stroke="#06b6d4" stroke-width="2.5"/>
  <polygon points="80,48 106,63 106,97 80,112 54,97 54,63" fill="#0f172a" stroke="#3b82f6" stroke-width="2"/>
  <circle cx="80" cy="80" r="10" fill="#06b6d4"/>
  <!-- Reticle Crosshairs -->
  <line x1="80" y1="24" x2="80" y2="40" stroke="#06b6d4" stroke-width="2"/>
  <line x1="80" y1="120" x2="80" y2="136" stroke="#06b6d4" stroke-width="2"/>
  <line x1="32" y1="80" x2="48" y2="80" stroke="#06b6d4" stroke-width="2"/>
  <line x1="112" y1="80" x2="128" y2="80" stroke="#06b6d4" stroke-width="2"/>
</svg>`
  },

  // 24. Chai Cup (chai.exe)
  {
    name: 'food-chai.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#292524" stroke="#f59e0b" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Traditional Kulhar / Terracotta Chai Glass -->
  <polygon points="56,66 104,66 94,126 66,126" fill="#d97706" stroke="#92400e" stroke-width="2.5"/>
  <!-- Tea surface -->
  <ellipse cx="80" cy="66" rx="24" ry="7" fill="#b45309"/>
  <!-- Steam rising -->
  <path d="M72 52 C70 42 76 36 72 26" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M84 52 C86 42 80 36 84 26" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Cardamom pod icon -->
  <ellipse cx="80" cy="94" rx="4" ry="7" fill="#78350f" transform="rotate(30 80 94)"/>
</svg>`
  },

  // 25. Basketball / FourthQuarter
  {
    name: 'sports-basketball.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#18181b" stroke="#f97316" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Basketball -->
  <circle cx="80" cy="80" r="48" fill="#ea580c" stroke="#18181b" stroke-width="3"/>
  <!-- Seams -->
  <line x1="32" y1="80" x2="128" y2="80" stroke="#18181b" stroke-width="3"/>
  <line x1="80" y1="32" x2="80" y2="128" stroke="#18181b" stroke-width="3"/>
  <path d="M46 46 C66 66 66 94 46 114" fill="none" stroke="#18181b" stroke-width="3"/>
  <path d="M114 46 C94 66 94 94 114 114" fill="none" stroke="#18181b" stroke-width="3"/>
</svg>`
  }
];

for (const a of avatars) {
  const filePath = path.join(avatarsDir, a.name);
  fs.writeFileSync(filePath, a.svg, 'utf-8');
  console.log(`Created ${a.name}`);
}

console.log(`\nSuccessfully generated ${avatars.length} custom vector avatars in ${avatarsDir}`);

const extraAvatars = [
  // 26. Pixel Moth (pixelmoth)
  {
    name: 'pixel-moth.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#1e1b4b" stroke="#c084fc" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Moth Wings -->
  <polygon points="80,72 40,36 30,76 80,94" fill="#a855f7"/>
  <polygon points="80,72 120,36 130,76 80,94" fill="#a855f7"/>
  <polygon points="80,94 44,88 50,118 80,108" fill="#7e22ce"/>
  <polygon points="80,94 116,88 110,118 80,108" fill="#7e22ce"/>
  <!-- Wing eye spots -->
  <circle cx="52" cy="62" r="6" fill="#fde047"/>
  <circle cx="108" cy="62" r="6" fill="#fde047"/>
  <circle cx="52" cy="62" r="2.5" fill="#1e1b4b"/>
  <circle cx="108" cy="62" r="2.5" fill="#1e1b4b"/>
  <!-- Moth Body -->
  <ellipse cx="80" cy="88" rx="6" ry="24" fill="#f8fafc"/>
  <!-- Antennae -->
  <path d="M78 66 C70 54 60 48 54 48" fill="none" stroke="#f8fafc" stroke-width="2" stroke-linecap="round"/>
  <path d="M82 66 C90 54 100 48 106 48" fill="none" stroke="#f8fafc" stroke-width="2" stroke-linecap="round"/>
</svg>`
  },

  // 27. Food Ramen (ramenrespawn)
  {
    name: 'food-ramen.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#18181b" stroke="#f43f5e" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Ramen Bowl -->
  <path d="M36 74 C36 116 52 130 80 130 C108 130 124 116 124 74 L36 74 Z" fill="#e11d48" stroke="#be123c" stroke-width="3"/>
  <ellipse cx="80" cy="74" rx="44" ry="14" fill="#f59e0b"/>
  <!-- Broth & Noodles -->
  <path d="M50 74 C60 70 70 76 80 72 C90 70 100 76 110 72" stroke="#fef08a" stroke-width="3" fill="none"/>
  <!-- Nori sheet -->
  <rect x="42" y="52" width="16" height="26" rx="2" fill="#14532d" transform="rotate(-15 42 52)"/>
  <!-- Ajitsuke Tamago (Egg) -->
  <ellipse cx="94" cy="74" rx="10" ry="8" fill="#ffffff"/>
  <circle cx="94" cy="74" r="5" fill="#ea580c"/>
  <!-- Narutomaki (fish cake) -->
  <circle cx="68" cy="72" r="7" fill="#ffffff"/>
  <path d="M68 68 C70 68 72 72 68 74 C66 74 66 72 68 72" fill="none" stroke="#f43f5e" stroke-width="1.5"/>
  <!-- Chopsticks -->
  <line x1="32" y1="44" x2="114" y2="68" stroke="#d97706" stroke-width="3" stroke-linecap="round"/>
  <line x1="34" y1="38" x2="120" y2="64" stroke="#d97706" stroke-width="3" stroke-linecap="round"/>
</svg>`
  },

  // 28. Gear Camera / SlowShutter (slowshutter)
  {
    name: 'gear-camera.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#1c1917" stroke="#78716c" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Camera Body -->
  <rect x="34" y="54" width="92" height="64" rx="8" fill="#292524" stroke="#57534e" stroke-width="2.5"/>
  <rect x="34" y="54" width="92" height="18" fill="#44403c"/>
  <!-- Viewfinder & Shutter Dial -->
  <rect x="46" y="44" width="14" height="10" rx="2" fill="#78716c"/>
  <rect x="98" y="46" width="18" height="8" rx="2" fill="#a8a29e"/>
  <!-- Big Lens Element -->
  <circle cx="80" cy="88" r="26" fill="#18181b" stroke="#a8a29e" stroke-width="3"/>
  <circle cx="80" cy="88" r="20" fill="#0c0a09" stroke="#38bdf8" stroke-width="1.5"/>
  <circle cx="80" cy="88" r="10" fill="#1e293b"/>
  <!-- Lens Glare -->
  <path d="M72 80 A 12 12 0 0 1 88 80" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
</svg>`
  },

  // 29. Gear Synth (synth / audio)
  {
    name: 'gear-synth.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#0f172a" stroke="#06b6d4" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Eurorack Module Faceplate -->
  <rect x="36" y="40" width="88" height="80" rx="6" fill="#1e293b" stroke="#475569" stroke-width="2"/>
  <!-- Knobs -->
  <circle cx="56" cy="62" r="12" fill="#334155" stroke="#06b6d4" stroke-width="2"/>
  <line x1="56" y1="62" x2="64" y2="54" stroke="#06b6d4" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="104" cy="62" r="12" fill="#334155" stroke="#f43f5e" stroke-width="2"/>
  <line x1="104" y1="62" x2="98" y2="52" stroke="#f43f5e" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Patch Jacks -->
  <circle cx="56" cy="98" r="8" fill="#0f172a" stroke="#94a3b8" stroke-width="2"/>
  <circle cx="56" cy="98" r="3" fill="#06b6d4"/>
  <circle cx="104" cy="98" r="8" fill="#0f172a" stroke="#94a3b8" stroke-width="2"/>
  <circle cx="104" cy="98" r="3" fill="#f43f5e"/>
  <!-- Glowing Patch Cable curve -->
  <path d="M56 98 C70 126 90 126 104 98" fill="none" stroke="#eab308" stroke-width="3" stroke-linecap="round"/>
</svg>`
  },

  // 30. Mascot Frog
  {
    name: 'mascot-frog.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#064e3b" stroke="#4ade80" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Big Frog Eyes -->
  <circle cx="54" cy="62" r="18" fill="#22c55e"/>
  <circle cx="106" cy="62" r="18" fill="#22c55e"/>
  <circle cx="54" cy="60" r="10" fill="#ffffff"/>
  <circle cx="106" cy="60" r="10" fill="#ffffff"/>
  <ellipse cx="54" cy="60" rx="4" ry="7" fill="#064e3b"/>
  <ellipse cx="106" cy="60" rx="4" ry="7" fill="#064e3b"/>
  <!-- Frog Head -->
  <ellipse cx="80" cy="92" rx="46" ry="34" fill="#22c55e"/>
  <!-- Smile -->
  <path d="M52 96 C64 108 96 108 108 96" fill="none" stroke="#064e3b" stroke-width="3" stroke-linecap="round"/>
  <!-- Cheeks -->
  <circle cx="48" cy="94" r="5" fill="#86efac" opacity="0.6"/>
  <circle cx="112" cy="94" r="5" fill="#86efac" opacity="0.6"/>
</svg>`
  },

  // 31. Mascot Owl
  {
    name: 'mascot-owl.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#18181b" stroke="#f59e0b" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Ear Tufts -->
  <polygon points="44,60 36,32 64,52" fill="#78350f"/>
  <polygon points="116,60 124,32 96,52" fill="#78350f"/>
  <!-- Head & Body -->
  <ellipse cx="80" cy="88" rx="44" ry="38" fill="#92400e"/>
  <!-- Big Eyes -->
  <circle cx="60" cy="78" r="16" fill="#fef08a" stroke="#78350f" stroke-width="2"/>
  <circle cx="100" cy="78" r="16" fill="#fef08a" stroke="#78350f" stroke-width="2"/>
  <circle cx="60" cy="78" r="8" fill="#18181b"/>
  <circle cx="100" cy="78" r="8" fill="#18181b"/>
  <circle cx="58" cy="76" r="2.5" fill="#ffffff"/>
  <circle cx="98" cy="76" r="2.5" fill="#ffffff"/>
  <!-- Beak -->
  <polygon points="76,84 84,84 80,96" fill="#d97706"/>
</svg>`
  },

  // 32. Gear Keyboard (mech_keys)
  {
    name: 'gear-keyboard.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#1e1b4b" stroke="#a78bfa" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Isometric Keycap -->
  <polygon points="80,38 122,62 122,96 80,120 38,96 38,62" fill="#312e81" stroke="#6366f1" stroke-width="2"/>
  <polygon points="80,38 122,62 80,86 38,62" fill="#4338ca"/>
  <!-- Key Legend: ESC -->
  <text x="80" y="68" font-family="sans-serif" font-size="14" font-weight="bold" fill="#f43f5e" text-anchor="middle">ESC</text>
  <!-- Coiled aviator cable silhouette at bottom -->
  <path d="M48 128 C56 122 64 134 72 128 C80 122 88 134 96 128 C104 122 112 134 120 128" fill="none" stroke="#a78bfa" stroke-width="3" stroke-linecap="round"/>
</svg>`
  },

  // 33. Art Watercolor Palette
  {
    name: 'art-palette.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#18181b" stroke="#38bdf8" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Wooden Artist Palette -->
  <path d="M42 66 C42 44 64 36 94 38 C124 40 128 66 124 94 C120 122 96 128 72 124 C58 122 56 112 48 112 C40 112 36 120 34 108 C30 88 42 88 42 66 Z" fill="#b45309" stroke="#78350f" stroke-width="2.5"/>
  <!-- Thumb Hole -->
  <ellipse cx="50" cy="102" rx="7" ry="9" fill="#18181b"/>
  <!-- Paint Blobs -->
  <circle cx="68" cy="54" r="6" fill="#ef4444"/>
  <circle cx="90" cy="50" r="6" fill="#f59e0b"/>
  <circle cx="110" cy="62" r="6" fill="#10b981"/>
  <circle cx="114" cy="84" r="6" fill="#3b82f6"/>
  <circle cx="98" cy="104" r="6" fill="#8b5cf6"/>
</svg>`
  },

  // 34. Nature Bonsai
  {
    name: 'nature-bonsai.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#0f172a" stroke="#10b981" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Ceramic Pot -->
  <polygon points="46,116 114,116 106,134 54,134" fill="#1e293b" stroke="#334155" stroke-width="2"/>
  <!-- Gnarled Trunk -->
  <path d="M80 116 C76 100 84 88 74 76 C66 66 74 54 80 50" fill="none" stroke="#78350f" stroke-width="6" stroke-linecap="round"/>
  <path d="M74 76 C60 74 54 66 52 62" fill="none" stroke="#78350f" stroke-width="4" stroke-linecap="round"/>
  <path d="M78 64 C90 62 98 56 104 54" fill="none" stroke="#78350f" stroke-width="4" stroke-linecap="round"/>
  <!-- Pine Needle Foliage Clouds -->
  <ellipse cx="80" cy="46" rx="20" ry="12" fill="#059669"/>
  <ellipse cx="50" cy="60" rx="16" ry="10" fill="#059669"/>
  <ellipse cx="106" cy="52" rx="16" ry="10" fill="#059669"/>
</svg>`
  },

  // 35. Gear Headphones / Audio
  {
    name: 'gear-headphones.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <circle cx="80" cy="80" r="76" fill="#18181b" stroke="#f43f5e" stroke-width="3" stroke-opacity="0.4"/>
  <!-- Headband Arc -->
  <path d="M46 84 C46 54 60 40 80 40 C100 40 114 54 114 84" fill="none" stroke="#52525b" stroke-width="6" stroke-linecap="round"/>
  <!-- Ear Cups -->
  <rect x="36" y="74" width="16" height="34" rx="8" fill="#f43f5e"/>
  <rect x="108" y="74" width="16" height="34" rx="8" fill="#f43f5e"/>
  <!-- Inner Cushion -->
  <rect x="48" y="78" width="6" height="26" rx="3" fill="#09090b"/>
  <rect x="106" y="78" width="6" height="26" rx="3" fill="#09090b"/>
  <!-- Sound Waves inside -->
  <path d="M70 82 L70 98 M76 76 L76 104 M80 72 L80 108 M84 76 L84 104 M90 82 L90 98" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
</svg>`
  }
];

for (const a of extraAvatars) {
  const filePath = path.join(avatarsDir, a.name);
  fs.writeFileSync(filePath, a.svg, 'utf-8');
  console.log(`Created extra avatar: ${a.name}`);
}

console.log(`\nGenerated ${extraAvatars.length} additional custom vector avatars! Total in dir: ${fs.readdirSync(avatarsDir).filter(f => f.endsWith('.svg')).length}`);
