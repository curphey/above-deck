/**
 * Check curated, story-driven brand name candidates.
 * These are hand-picked names with meaning, not algorithmic output.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DELAY_MS = 1200;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function checkDomainWhois(domain: string): boolean {
  try {
    const output = execFileSync('whois', [domain], {
      timeout: 10000,
      encoding: 'utf-8',
    });
    const availablePatterns = [
      'No match for', 'NOT FOUND', 'No entries found',
      'Domain not found', 'No Data Found', 'Status: AVAILABLE',
      'No Object Found',
    ];
    const upper = output.toUpperCase();
    return availablePatterns.some(p => upper.includes(p.toUpperCase()));
  } catch {
    return false;
  }
}

interface CuratedName {
  name: string;
  domain: string;
  category: string;
  story: string;
  syllables: number;
}

// ─────────────────────────────────────────────────────────────
// CURATED CANDIDATES — each has a story
// ─────────────────────────────────────────────────────────────

const candidates: CuratedName[] = [
  // === NAUTICAL CONCEPTS WITH DEPTH ===
  { name: 'Offing', domain: 'offing.com', category: 'nautical-concept',
    story: 'The part of the sea visible from shore. "In the offing" means something is approaching — perfect for a planning tool. You look to the offing to see what\'s coming.',
    syllables: 2 },
  { name: 'Rhumb', domain: 'rhumb.com', category: 'nautical-concept',
    story: 'A rhumb line is a course of constant bearing — the line you draw on a chart. Short, punchy, technical. Every sailor knows what a rhumb line is.',
    syllables: 1 },
  { name: 'Leeway', domain: 'leeway.com', category: 'nautical-concept',
    story: 'The sideways drift of a boat. In everyday English, "leeway" means freedom to maneuver. Double meaning: navigation precision + flexible platform.',
    syllables: 2 },
  { name: 'Halcyon', domain: 'halcyon.com', category: 'myth',
    story: 'From Greek myth: the kingfisher bird (alcyone) that calmed the seas. "Halcyon days" = calm seas. Evokes the beauty and peace of sailing.',
    syllables: 3 },
  { name: 'Fathom', domain: 'fathom.com', category: 'nautical-concept',
    story: 'A unit of depth (6 feet), but also means "to understand deeply." Perfect dual meaning for a platform about understanding your boat and the sea.',
    syllables: 2 },
  { name: 'Bearing', domain: 'bearing.com', category: 'nautical-concept',
    story: 'Your direction of travel. "Take a bearing" = get oriented. Also means composure — "keeping your bearing" at sea.',
    syllables: 2 },
  { name: 'Landfall', domain: 'landfall.com', category: 'nautical-concept',
    story: 'First sight of land after an ocean crossing. The most emotional moment in sailing. Every bluewater sailor remembers their landfalls.',
    syllables: 2 },
  { name: 'Almanac', domain: 'almanac.com', category: 'nautical-concept',
    story: 'The navigator\'s reference book. Every boat carries a nautical almanac. It\'s the trusted source of truth — like this platform aims to be.',
    syllables: 3 },
  { name: 'Traverse', domain: 'traverse.com', category: 'nautical-concept',
    story: 'To cross the sea. Also a surveying/navigation technique for plotting position. Clean, active, implies journey.',
    syllables: 2 },
  { name: 'Clew', domain: 'clew.com', category: 'nautical-concept',
    story: 'The bottom corner of a sail where sheets attach. Etymologically, "clew" = a ball of thread (Ariadne\'s clew to escape the labyrinth). Finding your way.',
    syllables: 1 },
  { name: 'Loxo', domain: 'loxo.com', category: 'nautical-concept',
    story: 'Short for loxodrome — the mathematical term for a rhumb line (a spiral path on a globe). Short, modern, technical. Fits the blueprint aesthetic.',
    syllables: 2 },

  // === MEASUREMENT / PRECISION ===
  { name: 'Sixknots', domain: 'sixknots.com', category: 'measurement',
    story: 'Comfortable cruising speed for most sailboats. It\'s the sweet spot — fast enough to make progress, slow enough to enjoy it. Every cruiser knows six knots.',
    syllables: 2 },
  { name: 'Eightbells', domain: 'eightbells.com', category: 'measurement',
    story: 'End of a four-hour watch. Eight bells marks completion and a new beginning. The rhythm of life at sea.',
    syllables: 2 },
  { name: 'Noonsight', domain: 'noonsight.com', category: 'measurement',
    story: 'The daily sun observation at local noon to determine latitude. The most important ritual in celestial navigation. Precision and tradition.',
    syllables: 2 },
  { name: 'Truewind', domain: 'truewind.com', category: 'measurement',
    story: 'Actual wind direction (vs. apparent wind felt on a moving boat). "True" = honest, real. Fits the transparency values.',
    syllables: 2 },

  // === FOREIGN WORDS WITH MEANING ===
  { name: 'Pelagos', domain: 'pelagos.com', category: 'foreign',
    story: 'Greek for "open sea." The root of "pelagic" and "archipelago." International, classic, rich heritage.',
    syllables: 3 },
  { name: 'Pelago', domain: 'pelago.com', category: 'foreign',
    story: 'Italian form of pelagos. Shorter, more brandable. "Open sea" in the language of the Mediterranean.',
    syllables: 3 },
  { name: 'Vigia', domain: 'vigia.com', category: 'foreign',
    story: 'Portuguese nautical term for a lookout/watchtower, or a reported but unconfirmed hazard. Has mystery and alertness.',
    syllables: 3 },
  { name: 'Rumo', domain: 'rumo.com', category: 'foreign',
    story: 'Portuguese for "course" or "heading." Short, punchy, international. The course you set.',
    syllables: 2 },
  { name: 'Vento', domain: 'vento.com', category: 'foreign',
    story: 'Italian/Portuguese for "wind." Universal, musical, simple. Wind drives everything in sailing.',
    syllables: 2 },
  { name: 'Farol', domain: 'farol.com', category: 'foreign',
    story: 'Portuguese for "lighthouse." A beacon of guidance. 5 letters, easy to say, warm sound.',
    syllables: 2 },
  { name: 'Velara', domain: 'velara.com', category: 'foreign-coined',
    story: 'From Latin "vela" (sail). Musical, feminine, brandable. Evokes sails filling with wind.',
    syllables: 3 },
  { name: 'Galene', domain: 'galene.com', category: 'foreign',
    story: 'Greek goddess of calm seas. Also a real word meaning "calm, serenity." Beautiful double meaning.',
    syllables: 3 },
  { name: 'Pontos', domain: 'pontos.com', category: 'foreign',
    story: 'Greek god of the sea, predating Poseidon. Also means "sea" in Greek. Ancient, powerful.',
    syllables: 2 },
  { name: 'Caleta', domain: 'caleta.com', category: 'foreign',
    story: 'Spanish for a small cove or inlet — a sheltered anchorage. Warm, inviting, specific.',
    syllables: 3 },
  { name: 'Hoku', domain: 'hoku.com', category: 'foreign',
    story: 'Hawaiian for "star." Polynesian navigators crossed the Pacific using stars. Short, warm, memorable.',
    syllables: 2 },
  { name: 'Makani', domain: 'makani.com', category: 'foreign',
    story: 'Hawaiian for "wind" or "breeze." Beautiful sound, evokes Pacific sailing, 3 syllables.',
    syllables: 3 },
  { name: 'Moana', domain: 'moana.com', category: 'foreign',
    story: 'Polynesian for "ocean." Widely known (thanks Disney), warm, universal. Probably taken but worth checking.',
    syllables: 3 },
  { name: 'Nalu', domain: 'nalu.com', category: 'foreign',
    story: 'Hawaiian for "wave" or "surf." Short, musical, 4 letters. Polynesian navigation heritage.',
    syllables: 2 },
  { name: 'Bolge', domain: 'bolge.com', category: 'foreign',
    story: 'Norse for "wave" or "billow." Connects to Viking seafaring tradition. Short, unusual.',
    syllables: 2 },

  // === MYTHOLOGY / STORY NAMES ===
  { name: 'Ninthwave', domain: 'ninthwave.com', category: 'myth',
    story: 'In Celtic tradition, the ninth wave marks the boundary between the known world and the open sea. Cross it and you\'re truly at sea.',
    syllables: 2 },
  { name: 'Fairwind', domain: 'fairwind.com', category: 'tradition',
    story: '"Fair winds and following seas" — the universal sailor\'s blessing. A fair wind means everything is with you.',
    syllables: 2 },

  // === METAPHORIC / ABSTRACT ===
  { name: 'Waymark', domain: 'waymark.com', category: 'metaphoric',
    story: 'A marker that shows you the way. Navigation markers, waypoints. Simple, clear purpose.',
    syllables: 2 },
  { name: 'Trident', domain: 'trident.com', category: 'myth',
    story: 'Poseidon\'s three-pronged spear. Power over the sea. Also suggests three-part platform (plan, sail, share).',
    syllables: 2 },
  { name: 'Sonder', domain: 'sonder.com', category: 'abstract',
    story: 'The realization that every passerby has a life as vivid as your own. In a sailing community, it\'s about connecting with other sailors\' stories.',
    syllables: 2 },
  { name: 'Athwart', domain: 'athwart.com', category: 'nautical-concept',
    story: 'Across the line of a ship\'s course. "Athwart the bow." Unusual word, distinctly nautical, 7 letters.',
    syllables: 2 },

  // === PORTMANTEAU / COINED WITH CLEAR ETYMOLOGY ===
  { name: 'Navex', domain: 'navex.com', category: 'coined',
    story: 'Navigation + exploration. Short, punchy, the X adds energy. In military, a "navex" is a navigation exercise.',
    syllables: 2 },
  { name: 'Tidefix', domain: 'tidefix.com', category: 'coined',
    story: 'A "fix" in navigation is your confirmed position. "Tide fix" = knowing where you stand with the tides. Short compound.',
    syllables: 2 },
  { name: 'Waylog', domain: 'waylog.com', category: 'coined',
    story: 'Way (journey) + log (record). The log of your way — voyage recording, planning. Clean compound.',
    syllables: 2 },
  { name: 'Helmsea', domain: 'helmsea.com', category: 'coined',
    story: 'Helm (where you steer) + sea. Implies mastery of the sea from the helm. 7 letters.',
    syllables: 2 },
  { name: 'Bowline', domain: 'bowline.com', category: 'nautical-concept',
    story: 'The king of knots. Every sailor\'s first and most important knot. Also the line from the bow. Universally known.',
    syllables: 2 },

  // === UNEXPECTED ANGLE ===
  { name: 'Schooner', domain: 'schooner.com', category: 'vessel',
    story: 'A type of sailing vessel — but also a large glass of beer. Approachable, fun, everyone knows the word.',
    syllables: 2 },
  { name: 'Sextant', domain: 'sextant.com', category: 'instrument',
    story: 'The precision instrument that made open-ocean navigation possible. Technical, precise, fits the blueprint/draughtsman aesthetic perfectly.',
    syllables: 2 },
  { name: 'Azimuth', domain: 'azimuth.com', category: 'instrument',
    story: 'The angular measurement in navigation. Technical precision. Distinctive, serious, professional.',
    syllables: 3 },

  // === SHORTER COINED / ABSTRACT WITH MEANING ===
  { name: 'Navra', domain: 'navra.com', category: 'coined',
    story: 'From "nav" (navigation) with a warm "ra" ending (like aurora). Short, brandable, suggests navigation.',
    syllables: 2 },
  { name: 'Kelva', domain: 'kelva.com', category: 'coined',
    story: 'Evokes "kelp" (the sea) and has a Scandinavian feel. Short, distinctive, 5 letters.',
    syllables: 2 },
  { name: 'Velio', domain: 'velio.com', category: 'coined',
    story: 'From Latin "velum" (sail). Italian-feeling ending. Musical, light, suggests movement.',
    syllables: 3 },
  { name: 'Pelara', domain: 'pelara.com', category: 'coined',
    story: 'From Greek "pelagos" (open sea) + "ara" suffix. Open sea, warm sound. 6 letters.',
    syllables: 3 },
  { name: 'Routica', domain: 'routica.com', category: 'coined',
    story: 'Route + the "-ica" suffix (like Nautica). Suggests routing, planning, systematic approach.',
    syllables: 3 },
  { name: 'Helmix', domain: 'helmix.com', category: 'coined',
    story: 'Helm + the techy "-ix" suffix. Modern, short. Where you steer from.',
    syllables: 2 },
  { name: 'Tidara', domain: 'tidara.com', category: 'coined',
    story: 'Tide + warm "ara" ending. Tides are fundamental to passage planning. Musical.',
    syllables: 3 },

  // === "STORY" NAMES LIKE 38 DEGREES ===
  { name: 'Fortysouth', domain: 'fortysouth.com', category: 'story',
    story: 'The Roaring Forties — 40°S latitude where winds blow unobstructed around the globe. The most famous sailing latitude. Adventure, challenge, legend.',
    syllables: 3 },
  { name: 'Fiftysouth', domain: 'fiftysouth.com', category: 'story',
    story: 'The Furious Fifties — 50°S, even more extreme than the Roaring Forties. Clipper ships, Cape Horn, the Southern Ocean.',
    syllables: 4 },
  { name: 'Capehorn', domain: 'capehorn.com', category: 'story',
    story: 'The most famous point in sailing. Rounding Cape Horn is the ultimate achievement. Every sailor dreams of it.',
    syllables: 2 },
  { name: 'Firstlight', domain: 'firstlight.com', category: 'story',
    story: 'Dawn at sea — when sailors check conditions, plan the day. Also "seeing for the first time." Connects to the planning aspect.',
    syllables: 2 },
  { name: 'Dogwatch', domain: 'dogwatch.com', category: 'story',
    story: 'The short 2-hour watches (16:00-18:00 and 18:00-20:00) that prevent the same crew keeping the same watch every day. Clever, practical, very sailor.',
    syllables: 2 },
  { name: 'Glasshalf', domain: 'glasshalf.com', category: 'story',
    story: '"When the glass falls low, prepare for a blow" — the barometer. Also optimism: glass half full. Double meaning.',
    syllables: 2 },
  { name: 'Turnofbilge', domain: 'turnofbilge.com', category: 'story',
    story: 'Where the hull curves from bottom to side. A beautiful line in boat design. Technical, distinctive.',
    syllables: 3 },
  { name: 'Decklog', domain: 'decklog.com', category: 'story',
    story: 'The official record kept on deck. Every passage has a deck log. Simple, direct, functional.',
    syllables: 2 },
  { name: 'Handbear', domain: 'handbear.com', category: 'story',
    story: 'Short for "hand bearing compass" — a portable compass for taking bearings. Very sailor, distinctive, action-oriented.',
    syllables: 2 },
  { name: 'Sailplan', domain: 'sailplan.com', category: 'story',
    story: 'The technical drawing of a boat\'s sails. Also "the plan for sailing." Fits the blueprint/draughtsman brand perfectly.',
    syllables: 2 },
  { name: 'Plotchart', domain: 'plotchart.com', category: 'story',
    story: 'The chart you plot your course on. Direct, functional, fits the precision aesthetic.',
    syllables: 2 },

  // === ADDITIONAL INTERESTING ONES ===
  { name: 'Kedge', domain: 'kedge.com', category: 'nautical-concept',
    story: 'A small anchor used to reposition a boat. "To kedge" = to move forward by anchoring ahead and pulling. Progress through preparation.',
    syllables: 1 },
  { name: 'Heave', domain: 'heave.com', category: 'nautical-concept',
    story: '"Heave to" = to stop the boat safely in heavy weather. Also the effort of hauling. Power and control.',
    syllables: 1 },
  { name: 'Tideway', domain: 'tideway.com', category: 'nautical-concept',
    story: 'The channel where tidal currents run. A path shaped by the sea. Navigation and flow.',
    syllables: 2 },
  { name: 'Searoom', domain: 'searoom.com', category: 'nautical-concept',
    story: 'Space to maneuver safely at sea. Every sailor wants sea room. Freedom, safety, planning.',
    syllables: 2 },
  { name: 'Westing', domain: 'westing.com', category: 'nautical-concept',
    story: 'Distance made good toward the west. "Making westing" — the age of sail phrase for progress on a westward passage.',
    syllables: 2 },
  { name: 'Zenith', domain: 'zenith.com', category: 'celestial',
    story: 'The point directly overhead. In celestial navigation, the zenith is your reference point. Also means the peak, the best.',
    syllables: 2 },
  { name: 'Polaris', domain: 'polaris.com', category: 'celestial',
    story: 'The North Star — the most important star in navigation. Every sailor can find Polaris. The constant guide.',
    syllables: 3 },
  { name: 'Windrose', domain: 'windrose.com', category: 'instrument',
    story: 'The compass rose on a chart showing wind directions. Beautiful, decorative, functional. The classic navigation symbol.',
    syllables: 2 },
  { name: 'Windvane', domain: 'windvane.com', category: 'instrument',
    story: 'Self-steering device that keeps a boat on course relative to the wind. Self-sufficient cruising. Also shows direction.',
    syllables: 2 },
  { name: 'Chartwork', domain: 'chartwork.com', category: 'skill',
    story: 'The art of plotting on charts. Precision, craft, the draughtsman\'s skill. Fits the blueprint aesthetic perfectly.',
    syllables: 2 },
  { name: 'Dayshape', domain: 'dayshape.com', category: 'nautical-concept',
    story: 'Black shapes hoisted on a boat to communicate status (anchored, restricted, fishing). Visual communication at sea.',
    syllables: 2 },
  { name: 'Catspaw', domain: 'catspaw.com', category: 'nautical-concept',
    story: 'A light breeze that barely ripples the water. Delicate, precise observation. Also a type of knot.',
    syllables: 2 },
  { name: 'Seawise', domain: 'seawise.com', category: 'quality',
    story: 'Knowledgeable about the sea. An experienced sailor is "sea-wise." Community wisdom, shared knowledge.',
    syllables: 2 },
  { name: 'Waywise', domain: 'waywise.com', category: 'quality',
    story: 'Wise about the way/journey. Finding your way wisely. Navigation intelligence.',
    syllables: 2 },
  { name: 'Sailwise', domain: 'sailwise.com', category: 'quality',
    story: 'Wise about sailing. Direct, clear, implies expertise and good judgment.',
    syllables: 2 },
  { name: 'Seacraft', domain: 'seacraft.com', category: 'quality',
    story: 'The skill and knowledge of seamanship. "Good seacraft" = competent sailing. Craft implies both skill and making.',
    syllables: 2 },
];

async function main() {
  const outDir = join(import.meta.dirname || process.cwd(), '..', '..', 'tmp', 'brand-names');
  mkdirSync(outDir, { recursive: true });

  console.log('=== CURATED BRAND NAME CHECK ===');
  console.log(`Checking ${candidates.length} story-driven candidates...\n`);

  const available: CuratedName[] = [];
  const taken: CuratedName[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    process.stdout.write(`  [${i + 1}/${candidates.length}] ${c.domain}...`);

    const isAvailable = checkDomainWhois(c.domain);

    if (isAvailable) {
      process.stdout.write(` ✅ AVAILABLE\n`);
      available.push(c);
    } else {
      process.stdout.write(` ❌ taken\n`);
      taken.push(c);
    }

    if (i < candidates.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  AVAILABLE: ${available.length} / ${candidates.length}`);
  console.log(`${'═'.repeat(60)}\n`);

  if (available.length > 0) {
    for (const c of available) {
      console.log(`  🟢 ${c.name}`);
      console.log(`     Domain: ${c.domain}`);
      console.log(`     Category: ${c.category}`);
      console.log(`     Syllables: ${c.syllables}`);
      console.log(`     Story: ${c.story}`);
      console.log('');
    }
  }

  // Save results
  writeFileSync(
    join(outDir, 'curated-results.json'),
    JSON.stringify({ available, taken, checkedAt: new Date().toISOString() }, null, 2),
  );
  console.log(`Results saved to tmp/brand-names/curated-results.json`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
