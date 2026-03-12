# Brand Name Generator & Domain Checker

**Date:** 2026-03-12
**Status:** Design

---

## Problem

The project needs a final brand name. The working name "Above Deck" is a placeholder. Good .com domains are scarce, so a systematic approach is needed: generate many candidates, check availability, filter by price, and surface a shortlist for human review.

## Constraints

- .com domain available for no more than 50 GBP
- Short: ideally under 10 characters
- Easy to spell and say — no ambiguous pronunciation
- Not too niche — should work if the product expands beyond sailing route planning
- Memorable and unique — must stand out from Savvy Navvy, Orca, Navily, Keeano, SeaPeople
- Open to all naming styles (nautical, coined, compound, metaphoric)

## Solution

A Node.js script that generates hundreds of brand name candidates, filters them by quality heuristics, checks .com domain availability and price via the GoDaddy API, and outputs a ranked shortlist.

### Name Generation Strategies

The script uses six generation strategies to maximise coverage:

| # | Strategy | Description | Examples |
|---|----------|-------------|----------|
| 1 | Nautical vocabulary | Real sailing/marine terms | tack, helm, bearing, fathom, luff |
| 2 | Compound words | Two short words joined | BlueTack, SeaPlot, TidePlan |
| 3 | Prefix/suffix coinages | Nautical roots + brandable endings | Navra, Helmly, Routica |
| 4 | Metaphoric | Words evoking sailing without being literal | Traverse, Meridian, Azimuth |
| 5 | Short abstract | 4-7 letter invented words | Vruno, Kelva, Ostra, Pelago |
| 6 | Foreign language roots | Latin, Greek, Norse, Portuguese sailing words | Pelagos, Vento, Vigia |

### Quality Scoring

Each candidate is scored (0-100) based on:

- **Length** (weight: 30%) — 5-7 chars optimal, 4 or 8-10 acceptable, >10 rejected
- **Pronounceability** (weight: 30%) — consonant-vowel ratio, no awkward clusters
- **Spelling clarity** (weight: 20%) — one obvious spelling when heard aloud
- **Uniqueness** (weight: 20%) — not too similar to known competitor names

Names scoring below 50 are filtered out before domain checking.

### Domain Checking Pipeline

```
Generate candidates (6 strategies)
  → Filter by length (4-10 chars)
  → Score and filter (>= 50/100)
  → GoDaddy API: check .com availability + price
  → Convert USD price to GBP (with safety margin)
  → Filter: available AND <= 50 GBP
  → Sort by quality score descending
  → Output shortlist
```

**GoDaddy API details:**
- Endpoint: `GET /v1/domains/available?domain={name}.com`
- Returns: `{ available: boolean, price: number, currency: "USD" }`
- Auth: API key + secret as headers (`Authorization: sso-key {key}:{secret}`)
- Rate limit: batch with 500ms delays between requests
- Price conversion: USD to GBP at current rate + 10% safety margin

### Output

Two output formats:

1. **Console table** — formatted for quick review during the session
2. **JSON file** — `tmp/brand-names/results.json` for further analysis

Output fields per candidate:
- `name` — the candidate name
- `domain` — `{name}.com`
- `available` — boolean
- `priceUSD` — raw price from GoDaddy
- `priceGBP` — converted price
- `score` — quality score (0-100)
- `strategy` — which generation strategy produced it
- `length` — character count

## Project Structure

```
scripts/brand-naming/
  generate-names.ts      — name generation strategies + scoring
  check-domains.ts       — GoDaddy API integration
  index.ts               — orchestrator: generate → score → check → output
  names/
    nautical.ts          — word lists for nautical vocabulary
    compounds.ts         — compound word generator
    coinages.ts          — prefix/suffix coinage generator
    metaphoric.ts        — metaphoric word lists
    abstract.ts          — abstract name generator
    foreign.ts           — foreign language root lists
  types.ts               — shared types
.env                     — GoDaddy API credentials (gitignored)
tmp/brand-names/         — output directory (gitignored)
```

## Dependencies

- `node-fetch` or Node.js native fetch (Node 18+)
- No other external dependencies

## Configuration

Environment variables (in `.env`, gitignored):

```
GODADDY_API_KEY=your_key_here
GODADDY_API_SECRET=your_secret_here
```

GoDaddy API keys are free to obtain at https://developer.godaddy.com/keys

## Usage

```bash
cd scripts/brand-naming
npx tsx index.ts
```

Options:
- `--strategy=nautical,compound` — run only specific strategies
- `--min-score=60` — raise the quality threshold
- `--limit=50` — max results to display
- `--dry-run` — generate and score without checking domains

## Success Criteria

- Generates 200+ unique candidates across all strategies
- Checks domain availability without hitting rate limits
- Outputs a shortlist of available .com domains under 50 GBP
- Results are reproducible (same word lists produce same candidates)
- Script completes in under 5 minutes

## Out of Scope

- Trademark checking (manual step after shortlisting)
- Social media handle availability
- Logo generation
- Renaming the codebase (separate task after name is chosen)
