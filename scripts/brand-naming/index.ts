import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Config, Strategy, DomainResult } from './types.js';
import { generateAndScore } from './generate-names.js';
import { checkDomains } from './check-domains.js';

const ALL_STRATEGIES: Strategy[] = [
  'nautical', 'compound', 'coinage', 'metaphoric', 'abstract', 'foreign',
];

const OUT_DIR = join(import.meta.dirname || process.cwd(), '..', '..', 'tmp', 'brand-names');
const RESULTS_PATH = join(OUT_DIR, 'results.json');
const PROGRESS_PATH = join(OUT_DIR, 'progress.json');

interface BatchConfig extends Config {
  offset: number;
  batchSize: number;
}

function parseArgs(): BatchConfig {
  const args = process.argv.slice(2);
  const config: BatchConfig = {
    strategies: ALL_STRATEGIES,
    minScore: 50,
    limit: 50,
    dryRun: false,
    usdToGbp: 0.82,
    gbpBudget: 50,
    offset: 0,
    batchSize: 100,
  };

  for (const arg of args) {
    if (arg.startsWith('--strategy=')) {
      config.strategies = arg.split('=')[1].split(',') as Strategy[];
    } else if (arg.startsWith('--min-score=')) {
      config.minScore = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--limit=')) {
      config.limit = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--dry-run') {
      config.dryRun = true;
    } else if (arg.startsWith('--budget=')) {
      config.gbpBudget = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--offset=')) {
      config.offset = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--batch-size=')) {
      config.batchSize = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--auto') {
      // Auto-resume from last progress
      config.offset = -1; // sentinel: load from progress file
    } else if (arg === '--help') {
      console.log(`
Brand Name Generator & Domain Checker

Usage: npx tsx index.ts [options]

Options:
  --strategy=nautical,compound  Run only specific strategies
  --min-score=60                Minimum quality score (0-100, default: 50)
  --limit=50                    Max results to display (default: 50)
  --budget=50                   Max domain price in GBP (default: 50)
  --offset=300                  Start checking from candidate #N (default: 0)
  --batch-size=100              How many to check per run (default: 100)
  --auto                        Auto-resume from last progress
  --dry-run                     Generate and score without checking domains
  --help                        Show this help
`);
      process.exit(0);
    }
  }

  return config;
}

function printTable(rows: Array<Record<string, unknown>>, columns: string[]) {
  const widths: Record<string, number> = {};
  for (const col of columns) {
    widths[col] = col.length;
    for (const row of rows) {
      const val = String(row[col] ?? '');
      widths[col] = Math.max(widths[col], val.length);
    }
  }
  const header = columns.map(c => c.padEnd(widths[c])).join(' | ');
  const separator = columns.map(c => '-'.repeat(widths[c])).join('-+-');
  console.log(header);
  console.log(separator);
  for (const row of rows) {
    const line = columns.map(c => String(row[c] ?? '').padEnd(widths[c])).join(' | ');
    console.log(line);
  }
}

/** Load accumulated results from previous runs */
function loadExistingResults(): DomainResult[] {
  if (existsSync(RESULTS_PATH)) {
    try {
      return JSON.parse(readFileSync(RESULTS_PATH, 'utf-8'));
    } catch { return []; }
  }
  return [];
}

/** Load progress (which offset we've checked up to) */
function loadProgress(): { checkedUpTo: number } {
  if (existsSync(PROGRESS_PATH)) {
    try {
      return JSON.parse(readFileSync(PROGRESS_PATH, 'utf-8'));
    } catch { return { checkedUpTo: 0 }; }
  }
  return { checkedUpTo: 0 };
}

/** Save progress */
function saveProgress(checkedUpTo: number) {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(PROGRESS_PATH, JSON.stringify({ checkedUpTo }, null, 2));
}

/** Save accumulated results */
function saveResults(results: DomainResult[]) {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));
}

async function main() {
  const config = parseArgs();

  // Auto-resume: load offset from progress file
  if (config.offset === -1) {
    const progress = loadProgress();
    config.offset = progress.checkedUpTo;
    console.log(`Auto-resuming from offset ${config.offset}`);
  }

  console.log('=== Brand Name Generator & Domain Checker ===\n');
  console.log(`Strategies: ${config.strategies.join(', ')}`);
  console.log(`Min score: ${config.minScore}`);
  console.log(`Budget: £${config.gbpBudget}`);
  console.log(`Batch: offset=${config.offset}, size=${config.batchSize}`);
  console.log(`Mode: ${config.dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  // Step 1: Generate and score all candidates
  console.log('Generating names...');
  const candidates = generateAndScore(config);
  console.log(`Generated ${candidates.length} total candidates above score threshold\n`);

  // Strategy breakdown
  const byCat = new Map<string, number>();
  for (const c of candidates) {
    byCat.set(c.strategy, (byCat.get(c.strategy) || 0) + 1);
  }
  console.log('Strategy breakdown:');
  for (const [strategy, count] of byCat) {
    console.log(`  ${strategy}: ${count} candidates`);
  }
  console.log('');

  if (config.dryRun) {
    const top = candidates.slice(0, config.limit);
    printTable(
      top.map((c, i) => ({
        '#': i + 1,
        Name: c.name,
        Domain: `${c.name.toLowerCase()}.com`,
        Score: c.score,
        Len: c.length,
        Strategy: c.strategy,
      })),
      ['#', 'Name', 'Domain', 'Score', 'Len', 'Strategy'],
    );
    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(join(OUT_DIR, 'dry-run-results.json'), JSON.stringify(top, null, 2));
    console.log(`\nResults saved to ${join(OUT_DIR, 'dry-run-results.json')}`);
    return;
  }

  // Step 2: Slice the batch
  if (config.offset >= candidates.length) {
    console.log(`\n✅ ALL DONE! Offset ${config.offset} >= ${candidates.length} total candidates.`);
    console.log('All candidates have been checked.\n');
    const existing = loadExistingResults();
    console.log(`Total available domains found: ${existing.length}`);
    if (existing.length > 0) {
      console.log('\nAll available domains:\n');
      printTable(
        existing.sort((a, b) => b.score - a.score).map((r, i) => ({
          '#': i + 1,
          Name: r.name,
          Domain: r.domain,
          Score: r.score,
          Len: r.length,
          Strategy: r.strategy,
        })),
        ['#', 'Name', 'Domain', 'Score', 'Len', 'Strategy'],
      );
    }
    return;
  }

  const end = Math.min(config.offset + config.batchSize, candidates.length);
  const batch = candidates.slice(config.offset, end);
  console.log(`Checking batch: candidates ${config.offset + 1} to ${end} of ${candidates.length}\n`);

  // Step 3: Check domains for this batch
  const batchResults = await checkDomains(batch, config.usdToGbp, config.gbpBudget);

  // Step 4: Accumulate with previous results
  const existing = loadExistingResults();
  const allResults = [...existing, ...batchResults];
  // Dedup by domain name
  const deduped = [...new Map(allResults.map(r => [r.domain, r])).values()];
  const sorted = deduped.sort((a, b) => b.score - a.score);

  // Save
  saveResults(sorted);
  saveProgress(end);

  // Summary
  console.log(`\n=== BATCH COMPLETE ===`);
  console.log(`Checked: ${config.offset + 1} to ${end} of ${candidates.length}`);
  console.log(`This batch: ${batchResults.length} available`);
  console.log(`Total accumulated: ${sorted.length} available domains`);
  console.log(`Remaining: ${candidates.length - end} candidates`);
  console.log(`Next run: --offset=${end} (or use --auto)\n`);

  if (batchResults.length > 0) {
    console.log('New finds this batch:\n');
    printTable(
      batchResults.map((r, i) => ({
        '#': i + 1,
        Name: r.name,
        Domain: r.domain,
        Score: r.score,
        Len: r.length,
        Strategy: r.strategy,
      })),
      ['#', 'Name', 'Domain', 'Score', 'Len', 'Strategy'],
    );
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
