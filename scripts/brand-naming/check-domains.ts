import { execFileSync } from 'node:child_process';
import type { NameCandidate, DomainResult } from './types.js';

const DELAY_MS = 1000; // Rate limit: 1s between WHOIS requests

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Check a single domain via WHOIS (using execFileSync to avoid shell injection) */
function checkDomainWhois(domain: string): boolean {
  try {
    const output = execFileSync('whois', [domain], {
      timeout: 10000,
      encoding: 'utf-8',
    });

    // These patterns indicate the domain is NOT registered (i.e. available)
    const availablePatterns = [
      'No match for',
      'NOT FOUND',
      'No entries found',
      'Domain not found',
      'No Data Found',
      'Status: AVAILABLE',
      'No Object Found',
    ];

    const upper = output.toUpperCase();
    return availablePatterns.some(p => upper.includes(p.toUpperCase()));
  } catch {
    // whois command failed or timed out — assume not available
    return false;
  }
}

/** Check domains for a batch of name candidates using WHOIS */
export async function checkDomains(
  candidates: NameCandidate[],
  _usdToGbp: number,
  _gbpBudget: number,
): Promise<DomainResult[]> {
  const results: DomainResult[] = [];
  const total = candidates.length;

  console.log(`\nChecking ${total} domains via WHOIS...\n`);
  console.log(`Note: WHOIS checks availability only — domains showing as available`);
  console.log(`at standard .com registration (~$10-12 / ~£8-10) are within budget.`);
  console.log(`Premium domains will need manual price verification.\n`);

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    const domain = `${candidate.name.toLowerCase()}.com`;

    // Progress indicator
    process.stdout.write(`  [${i + 1}/${total}] ${domain}...`);

    const available = checkDomainWhois(domain);

    const result: DomainResult = {
      ...candidate,
      domain,
      available,
      priceUSD: null, // WHOIS doesn't return price
      priceGBP: null,
    };

    if (available) {
      process.stdout.write(` AVAILABLE ✓\n`);
      results.push(result);
    } else {
      process.stdout.write(` taken\n`);
    }

    // Rate limit delay
    if (i < candidates.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
