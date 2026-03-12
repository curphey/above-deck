import type { NameCandidate, DomainResult } from './types.js';

const GODADDY_BASE = 'https://api.godaddy.com/v1';
const DELAY_MS = 500; // Rate limit: 500ms between requests

interface GoDaddyResponse {
  available: boolean;
  domain: string;
  definitive: boolean;
  price: number;
  currency: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Check a single domain via GoDaddy API */
async function checkDomain(
  domain: string,
  apiKey: string,
  apiSecret: string,
): Promise<{ available: boolean; priceUSD: number | null }> {
  const url = `${GODADDY_BASE}/domains/available?domain=${encodeURIComponent(domain)}&checkType=FAST`;

  const res = await fetch(url, {
    headers: {
      Authorization: `sso-key ${apiKey}:${apiSecret}`,
      Accept: 'application/json',
    },
  });

  if (res.status === 429) {
    // Rate limited — wait and retry once
    console.warn(`  Rate limited on ${domain}, waiting 5s...`);
    await sleep(5000);
    return checkDomain(domain, apiKey, apiSecret);
  }

  if (!res.ok) {
    const text = await res.text();
    console.error(`  API error for ${domain}: ${res.status} ${text}`);
    return { available: false, priceUSD: null };
  }

  const data = (await res.json()) as GoDaddyResponse;

  return {
    available: data.available,
    priceUSD: data.available ? data.price / 1_000_000 : null, // GoDaddy returns micro-units
  };
}

/** Check domains for a batch of name candidates */
export async function checkDomains(
  candidates: NameCandidate[],
  usdToGbp: number,
  gbpBudget: number,
): Promise<DomainResult[]> {
  const apiKey = process.env.GODADDY_API_KEY;
  const apiSecret = process.env.GODADDY_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.error('Missing GODADDY_API_KEY or GODADDY_API_SECRET in environment');
    process.exit(1);
  }

  const results: DomainResult[] = [];
  const total = candidates.length;

  console.log(`\nChecking ${total} domains via GoDaddy API...\n`);

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    const domain = `${candidate.name.toLowerCase()}.com`;

    // Progress indicator
    if ((i + 1) % 10 === 0 || i === 0) {
      process.stdout.write(`  [${i + 1}/${total}] Checking ${domain}...`);
    }

    const { available, priceUSD } = await checkDomain(domain, apiKey, apiSecret);

    const priceGBP = priceUSD !== null ? Math.round(priceUSD * usdToGbp * 100) / 100 : null;

    const result: DomainResult = {
      ...candidate,
      domain,
      available,
      priceUSD,
      priceGBP,
    };

    if (available) {
      const withinBudget = priceGBP !== null && priceGBP <= gbpBudget;
      const marker = withinBudget ? ' ✓' : ` (£${priceGBP} - over budget)`;
      console.log(`  ✓ AVAILABLE: ${domain} — $${priceUSD?.toFixed(2)}${marker}`);

      if (withinBudget) {
        results.push(result);
      }
    }

    if ((i + 1) % 10 === 0) {
      process.stdout.write('\r\x1b[K'); // Clear the progress line
    }

    // Rate limit delay
    if (i < candidates.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
