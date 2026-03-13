import { execFileSync } from 'node:child_process';

const DELAY_MS = 1200;
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function checkWhois(domain: string): boolean {
  try {
    const output = execFileSync('whois', [domain], { timeout: 10000, encoding: 'utf-8' });
    const patterns = ['No match for', 'NOT FOUND', 'No entries found', 'Domain not found', 'No Data Found', 'Status: AVAILABLE', 'No Object Found'];
    return patterns.some(p => output.toUpperCase().includes(p.toUpperCase()));
  } catch { return false; }
}

const bases = [
  'sail', 'helm', 'keel', 'tide', 'wind', 'sea', 'salt', 'nav',
  'reef', 'hull', 'bow', 'mast', 'port', 'bay', 'gale',
  'drift', 'chart', 'log', 'boat', 'crew', 'deck', 'anchor',
  'harbor', 'haven', 'cove', 'voyage', 'passage', 'route',
  'bearing', 'rhumb', 'fathom', 'offing', 'clew', 'kedge',
  'wave', 'star', 'deep', 'fair', 'true', 'open',
  'plot', 'course', 'waypoint', 'marine', 'ocean', 'pelago',
  'vela', 'rumo', 'swell', 'fetch', 'luff', 'trim',
  'tack', 'jibe', 'reach', 'cruise', 'skipper', 'galley',
];

const suffixes = ['haus', 'hub'];

async function main() {
  const candidates: { name: string; domain: string }[] = [];
  for (const base of bases) {
    for (const suffix of suffixes) {
      candidates.push({ name: base + suffix, domain: base + suffix + '.com' });
    }
  }
  // Also try haus as prefix
  const prefixBases = ['sail', 'helm', 'keel', 'tide', 'sea', 'nav', 'boat', 'crew', 'chart', 'wind'];
  for (const base of prefixBases) {
    candidates.push({ name: 'haus' + base, domain: 'haus' + base + '.com' });
  }

  console.log('Checking ' + candidates.length + ' haus/hub names...\n');
  const available: typeof candidates = [];

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    process.stdout.write('  [' + (i+1) + '/' + candidates.length + '] ' + c.domain + '...');
    const ok = checkWhois(c.domain);
    if (ok) {
      process.stdout.write(' AVAILABLE\n');
      available.push(c);
    } else {
      process.stdout.write(' taken\n');
    }
    if (i < candidates.length - 1) await sleep(DELAY_MS);
  }

  console.log('\n==================================================');
  console.log('  AVAILABLE: ' + available.length + ' / ' + candidates.length);
  console.log('==================================================\n');
  for (const c of available) {
    console.log('  >> ' + c.name + ' -> ' + c.domain);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
