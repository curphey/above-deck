import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Config, Strategy } from './types.js';
import { generateAndScore } from './generate-names.js';
import { checkDomains } from './check-domains.js';

const ALL_STRATEGIES: Strategy[] = [
  'nautical', 'compound', 'coinage', 'metaphoric', 'abstract', 'foreign',
];

function parseArgs(): Config {
  const args = process.argv.slice(2);
  const config: Config = {
    strategies: ALL_STRATEGIES,
    minScore: 50,
    limit: 50,
    dryRun: false,
    usdToGbp: 0.82, // Conservative rate with margin built in
    gbpBudget: 50,
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
    } else if (arg === '--help') {
      console.log(`
Brand Name Generator & Domain Checker

Usage: npx tsx index.ts [options]

Options:
  --strategy=nautical,compound  Run only specific strategies
  --min-score=60                Minimum quality score (0-100, default: 50)
  --limit=50                    Max results to display (default: 50)
  --budget=50                   Max domain price in GBP (default: 50)
  --dry-run                     Generate and score without checking domains
  --help                        Show this help
`);
      process.exit(0);
    }
  }

  return config;
}

function printTable(rows: Array<Record<string, unknown>>, columns: string[]) {
  // Calculate column widths
  const widths: Record<string, number> = {};
  for (const col of columns) {
    widths[col] = col.length;
    for (const row of rows) {
      const val = String(row[col] ?? '');
      widths[col] = Math.max(widths[col], val.length);
    }
  }

  // Header
  const header = columns.map(c => c.padEnd(widths[c])).join(' | ');
  const separator = columns.map(c => '-'.repeat(widths[c])).join('-+-');
  console.log(header);
  console.log(separator);

  // Rows
  for (const row of rows) {
    const line = columns.map(c => String(row[c] ?? '').padEnd(widths[c])).join(' | ');
    console.log(line);
  }
}

async function main() {
  const config = parseArgs();

  console.log('=== Brand Name Generator & Domain Checker ===\n');
  console.log(`Strategies: ${config.strategies.join(', ')}`);
  console.log(`Min score: ${config.minScore}`);
  console.log(`Budget: £${config.gbpBudget}`);
  console.log(`Mode: ${config.dryRun ? 'DRY RUN (no domain checks)' : 'LIVE (checking domains)'}\n`);

  // Step 1: Generate and score
  console.log('Generating names...');
  const candidates = generateAndScore(config);
  console.log(`Generated ${candidates.length} candidates above score threshold\n`);

  // Step 2: Show strategy breakdown
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
    // Show top candidates without domain check
    console.log(`Top ${Math.min(config.limit, candidates.length)} candidates (dry run):\n`);
    const top = candidates.slice(0, config.limit);
    printTable(
      top.map(c => ({
        '#': top.indexOf(c) + 1,
        Name: c.name,
        Domain: `${c.name.toLowerCase()}.com`,
        Score: c.score,
        Len: c.length,
        Strategy: c.strategy,
        'Len/Pro/Spl/Unq': `${c.scores.length}/${c.scores.pronounceability}/${c.scores.spellingClarity}/${c.scores.uniqueness}`,
      })),
      ['#', 'Name', 'Domain', 'Score', 'Len', 'Strategy', 'Len/Pro/Spl/Unq'],
    );

    // Save to file
    const outDir = join(process.cwd(), '..', '..', 'tmp', 'brand-names');
    mkdirSync(outDir, { recursive: true });
    const outPath = join(outDir, 'dry-run-results.json');
    writeFileSync(outPath, JSON.stringify(top, null, 2));
    console.log(`\nResults saved to ${outPath}`);
    return;
  }

  // Step 3: Check domains
  const topCandidates = candidates.slice(0, 300); // Check top 300 max
  const results = await checkDomains(topCandidates, config.usdToGbp, config.gbpBudget);

  console.log(`\n=== RESULTS: ${results.length} available domains under £${config.gbpBudget} ===\n`);

  if (results.length === 0) {
    console.log('No available domains found within budget. Try:');
    console.log('  - Lowering --min-score to get more candidates');
    console.log('  - Increasing --budget');
    console.log('  - Running specific strategies: --strategy=abstract,coinage');
    return;
  }

  const display = results.slice(0, config.limit);
  printTable(
    display.map((r, i) => ({
      '#': i + 1,
      Name: r.name,
      Domain: r.domain,
      'Price (GBP)': `£${r.priceGBP?.toFixed(2)}`,
      'Price (USD)': `$${r.priceUSD?.toFixed(2)}`,
      Score: r.score,
      Len: r.length,
      Strategy: r.strategy,
    })),
    ['#', 'Name', 'Domain', 'Price (GBP)', 'Price (USD)', 'Score', 'Len', 'Strategy'],
  );

  // Save full results
  const outDir = join(process.cwd(), '..', '..', 'tmp', 'brand-names');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'results.json');
  writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nFull results saved to ${outPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
