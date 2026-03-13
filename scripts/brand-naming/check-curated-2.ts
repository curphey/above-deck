/**
 * Round 2: Deeper, more creative candidates.
 * Less obvious terms, unusual compounds, creative coinages with real meaning.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DELAY_MS = 1200;
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function checkWhois(domain: string): boolean {
  try {
    const output = execFileSync('whois', [domain], { timeout: 10000, encoding: 'utf-8' });
    const patterns = ['No match for', 'NOT FOUND', 'No entries found', 'Domain not found', 'No Data Found', 'Status: AVAILABLE', 'No Object Found'];
    const upper = output.toUpperCase();
    return patterns.some(p => upper.includes(p.toUpperCase()));
  } catch { return false; }
}

interface Name { name: string; story: string; category: string; }

const candidates: Name[] = [
  // === OBSCURE BUT REAL NAUTICAL TERMS ===
  { name: 'Lazyjack', story: 'Lines that guide the mainsail into neat folds when you lower it. Clever, labor-saving, practical — like the platform.', category: 'nautical-obscure' },
  { name: 'Fairlead', story: 'A fitting that guides rope smoothly in the right direction. Literally "leads fairly." Guidance without friction.', category: 'nautical-obscure' },
  { name: 'Chiplog', story: 'The original device for measuring speed at sea — a piece of wood on a knotted line. Where the word "knot" comes from. Origin story of measurement.', category: 'nautical-obscure' },
  { name: 'Catspaw', story: 'A light breeze that barely ripples the water — the first sign of wind. Delicate observation. Also a type of hitch knot.', category: 'nautical-obscure' },
  { name: 'Sheerline', story: 'The elegant curve of a boat\'s deck edge when viewed from the side. The defining aesthetic line of any vessel. Beauty and craft.', category: 'nautical-obscure' },
  { name: 'Garboard', story: 'The first plank laid next to the keel — the foundation of the hull. Building from the bottom up, like this project.', category: 'nautical-obscure' },
  { name: 'Tumblehome', story: 'Where the hull curves inward above the waterline. A distinctive, beautiful boat design feature. Unusual word, memorable.', category: 'nautical-obscure' },
  { name: 'Gudgeon', story: 'The fitting on the stern that holds the rudder. Without it, you can\'t steer. Small but critical.', category: 'nautical-obscure' },
  { name: 'Coaming', story: 'The raised edge around a cockpit that keeps water out. Protection, seamanship, practical design.', category: 'nautical-obscure' },
  { name: 'Samson', story: 'The strong post on deck for securing heavy lines. Named for biblical strength. Solid, reliable.', category: 'nautical-obscure' },
  { name: 'Pawl', story: 'A hinged bar that prevents a winch from spinning backwards. Ratcheting progress — you never go backward.', category: 'nautical-obscure' },
  { name: 'Toerail', story: 'The low rail at the edge of the deck that stops your feet sliding overboard. Safety, always present, easy to overlook.', category: 'nautical-obscure' },
  { name: 'Strake', story: 'A plank in the hull. Strakes are numbered from keel to deck. Building blocks of a vessel.', category: 'nautical-obscure' },
  { name: 'Sheave', story: 'The wheel inside a pulley block. The thing that makes mechanical advantage work. Hidden but essential.', category: 'nautical-obscure' },
  { name: 'Thwart', story: 'A seat that runs across a small boat, providing structure. To "sit athwart" is to sit sideways. Cross-support.', category: 'nautical-obscure' },
  { name: 'Layline', story: 'The optimal course to a mark without needing to tack again. The most efficient path. Every racer knows the layline.', category: 'nautical' },
  { name: 'Jackline', story: 'Safety line that runs the length of the deck. You clip your harness to it. Lifeline, literally.', category: 'nautical' },
  { name: 'Preventer', story: 'A line that stops the boom from swinging dangerously in a gybe. Safety and preparation.', category: 'nautical' },
  { name: 'Reacher', story: 'A sail set for reaching (sailing across the wind). The most comfortable and fast point of sail. Sweet spot.', category: 'nautical' },
  { name: 'Deadrise', story: 'The angle of a hull bottom from horizontal. Determines how a boat handles waves. Fundamental design parameter.', category: 'nautical-obscure' },
  { name: 'Freeboard', story: 'Height of the hull above the waterline. More freeboard = drier ride, less = sportier. Balance.', category: 'nautical' },

  // === WEATHER / OBSERVATION ===
  { name: 'Isobar', story: 'A line on a weather chart connecting points of equal pressure. The sailor\'s key to reading weather. Technical, precise.', category: 'weather' },
  { name: 'Barograph', story: 'The instrument that records barometric pressure over time. The trace it draws is art. Precision instrument.', category: 'weather' },
  { name: 'Veering', story: 'Wind shifting clockwise. In the Northern Hemisphere, veering wind often means improving weather. Change and hope.', category: 'weather' },
  { name: 'Backing', story: 'Wind shifting counterclockwise. Understanding backing vs veering is fundamental weather literacy at sea.', category: 'weather' },

  // === CREATIVE COMPOUNDS WITH STORY ===
  { name: 'Keelwise', story: 'Wise about your keel — knowing your draft, your limits. Also "keel-wise" like "otherwise." Smart sailing.', category: 'compound' },
  { name: 'Windlog', story: 'A log of the wind. Recording conditions, planning passages. Observation and data.', category: 'compound' },
  { name: 'Saltlog', story: 'A log kept by salt-hardened sailors. Experience recorded. Salty + systematic.', category: 'compound' },
  { name: 'Sailfix', story: 'A "fix" is your confirmed position in navigation. Sail + fix = knowing where you stand under sail.', category: 'compound' },
  { name: 'Helmlog', story: 'The log kept at the helm. Direction, course, conditions. The record of decisions.', category: 'compound' },
  { name: 'Tideplot', story: 'Plotting the tides. The fundamental act of passage planning. Precision and timing.', category: 'compound' },
  { name: 'Tidecraft', story: 'The craft/skill of understanding tides. Expertise and elegance combined.', category: 'compound' },
  { name: 'Sailcraft', story: 'The art and skill of sailing. Also implies craftsmanship — building something with care.', category: 'compound' },
  { name: 'Chartline', story: 'A line drawn on a chart. Your planned course. Simple, direct.', category: 'compound' },
  { name: 'Knotlog', story: 'Speed measurement (knots) + record (log). The chip log was the first knotlog. History meets function.', category: 'compound' },
  { name: 'Plotline', story: 'Your plotted course line. But also "plotline" as in narrative — the story of your voyage.', category: 'compound' },
  { name: 'Logline', story: 'The line with knots used to measure speed (original). Also a one-sentence pitch. Identity.', category: 'compound' },
  { name: 'Windway', story: 'The way of the wind. The path it follows, the path you sail.', category: 'compound' },
  { name: 'Saltway', story: 'The way across salt water. An ancient word for a sea route.', category: 'compound' },
  { name: 'Passageplan', story: 'The document every skipper creates before a voyage. Required by maritime law. The core use case.', category: 'compound' },
  { name: 'Helmwise', story: 'Wise at the helm. Knowledgeable, competent, trusted. The person you want steering.', category: 'compound' },

  // === COINAGES WITH CLEAR ROOTS ===
  { name: 'Nautic', story: 'From nautical. Clean, modern, obvious. Like "music" from "musical."', category: 'coined' },
  { name: 'Navica', story: 'Navigation + -ica (like Nautica). International, warm, brandable.', category: 'coined' },
  { name: 'Pelaga', story: 'From pelagos (open sea). Like "Pelago" but more distinctive. 6 letters.', category: 'coined' },
  { name: 'Ventora', story: 'Vento (wind) + venture/explorer. Wind-driven exploration.', category: 'coined' },
  { name: 'Vesta', story: 'Roman goddess of the hearth. Also a brand of matches/fire. Short, strong, 5 letters. Warmth and light.', category: 'coined' },
  { name: 'Thalassa', story: 'Greek personification of the sea itself. "Thalassa! Thalassa!" was the cry of Xenophon\'s soldiers when they finally saw the sea.', category: 'foreign' },
  { name: 'Saltera', story: 'From "salt" + Latin suffix. Of the salt, of the sea. Musical.', category: 'coined' },
  { name: 'Velero', story: 'Spanish for "sailboat." Beautiful word, 6 letters. International.', category: 'foreign' },
  { name: 'Estela', story: 'Spanish for "wake" (the trail a boat leaves). Also a woman\'s name. Poetic.', category: 'foreign' },
  { name: 'Seekarte', story: 'German for "sea chart." Direct, functional, distinctive.', category: 'foreign' },
  { name: 'Zeekart', story: 'Dutch for "sea chart." Short, unusual to English ears.', category: 'foreign' },
  { name: 'Kursvind', story: 'Norwegian: "kurs" (course) + "vind" (wind). Course wind. The wind that determines your course.', category: 'foreign' },
  { name: 'Havkart', story: 'Norwegian: "hav" (ocean) + "kart" (chart). Ocean chart. Short, distinctive.', category: 'foreign' },
  { name: 'Sjokart', story: 'Norwegian: "sjø" (sea) + "kart" (chart). Sea chart. Very Nordic.', category: 'foreign' },

  // === "GET/GO" DOMAIN PATTERN ===
  { name: 'Gohelm', story: 'Go to the helm. Take control. Action-oriented. "gohelm.com"', category: 'action' },
  { name: 'Gethelm', story: 'Get the helm. Take charge. "gethelm.com"', category: 'action' },
  { name: 'Gooffing', story: 'Go to the offing — go see what\'s on the horizon. "gooffing.com"', category: 'action' },

  // === ALTERNATE DOMAIN PATTERNS FOR TOP PICKS ===
  { name: 'Theoffing', story: 'The Offing. The part of the sea visible from shore. "theoffing.com"', category: 'the-prefix' },
  { name: 'Thefathom', story: 'The Fathom. To understand deeply. "thefathom.com"', category: 'the-prefix' },
  { name: 'Thebearing', story: 'The Bearing. Your direction. "thebearing.com"', category: 'the-prefix' },
  { name: 'Thekedge', story: 'The Kedge. Progress through preparation. "thekedge.com"', category: 'the-prefix' },
  { name: 'Thetraverse', story: 'The Traverse. Crossing the sea. "thetraverse.com"', category: 'the-prefix' },
  { name: 'Therhumb', story: 'The Rhumb. Your constant-bearing course. "therhumb.com"', category: 'the-prefix' },
  { name: 'Theclew', story: 'The Clew. Finding your way (from Ariadne). "theclew.com"', category: 'the-prefix' },
  { name: 'Thehaven', story: 'The Haven. Safe harbor. "thehaven.com"', category: 'the-prefix' },
  { name: 'Thehelm', story: 'The Helm. Where you steer from. "thehelm.com"', category: 'the-prefix' },
  { name: 'Thealmanac', story: 'The Almanac. The navigator\'s trusted reference. "thealmanac.com"', category: 'the-prefix' },
];

async function main() {
  const outDir = join(import.meta.dirname || process.cwd(), '..', '..', 'tmp', 'brand-names');
  mkdirSync(outDir, { recursive: true });

  console.log('=== CURATED BRAND NAMES — ROUND 2 ===');
  console.log(`Checking ${candidates.length} candidates...\n`);

  const available: (Name & { domain: string })[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const domain = c.name.toLowerCase().replace(/\s/g, '') + '.com';
    process.stdout.write(`  [${i + 1}/${candidates.length}] ${domain}...`);

    const isAvailable = checkWhois(domain);
    if (isAvailable) {
      process.stdout.write(` ✅ AVAILABLE\n`);
      available.push({ ...c, domain });
    } else {
      process.stdout.write(` ❌\n`);
    }
    if (i < candidates.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  AVAILABLE: ${available.length} / ${candidates.length}`);
  console.log(`${'═'.repeat(60)}\n`);

  for (const c of available) {
    console.log(`  🟢 ${c.name}`);
    console.log(`     ${c.domain} | ${c.category}`);
    console.log(`     ${c.story}`);
    console.log('');
  }

  writeFileSync(join(outDir, 'curated-2-results.json'), JSON.stringify({ available, checkedAt: new Date().toISOString() }, null, 2));
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
