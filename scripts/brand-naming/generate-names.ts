import type { NameCandidate, Strategy, Config } from './types.js';
import { generateNautical } from './names/nautical.js';
import { generateCompounds } from './names/compounds.js';
import { generateCoinages } from './names/coinages.js';
import { generateMetaphoric } from './names/metaphoric.js';
import { generateAbstract } from './names/abstract.js';
import { generateForeign } from './names/foreign.js';

const generators: Record<Strategy, () => string[]> = {
  nautical: generateNautical,
  compound: generateCompounds,
  coinage: generateCoinages,
  metaphoric: generateMetaphoric,
  abstract: generateAbstract,
  foreign: generateForeign,
};

// Known competitor names to check uniqueness against
const COMPETITORS = [
  'savvynavvy', 'predictwind', 'orca', 'navily', 'seapeople',
  'noforeignland', 'sailities', 'keeano', 'opencpn', 'abovedeck',
  'sailgrib', 'fastseas', 'nautiplan',
];

/** Score name length: 5-7 is optimal */
function scoreLength(name: string): number {
  const len = name.length;
  if (len >= 5 && len <= 7) return 100;
  if (len === 4 || len === 8) return 80;
  if (len === 9) return 60;
  if (len === 10) return 40;
  return 0; // > 10 rejected
}

/** Score pronounceability based on consonant/vowel patterns */
function scorePronouncability(name: string): number {
  const lower = name.toLowerCase();
  const vowels = new Set('aeiou');
  let score = 100;

  // Penalise consecutive consonants (> 2)
  let consonantRun = 0;
  for (const ch of lower) {
    if (vowels.has(ch)) {
      consonantRun = 0;
    } else {
      consonantRun++;
      if (consonantRun > 2) score -= 15;
      if (consonantRun > 3) score -= 25;
    }
  }

  // Penalise consecutive vowels (> 2)
  let vowelRun = 0;
  for (const ch of lower) {
    if (vowels.has(ch)) {
      vowelRun++;
      if (vowelRun > 2) score -= 10;
    } else {
      vowelRun = 0;
    }
  }

  // Reward alternating consonant-vowel pattern
  let alternations = 0;
  for (let i = 1; i < lower.length; i++) {
    const prevIsVowel = vowels.has(lower[i - 1]);
    const currIsVowel = vowels.has(lower[i]);
    if (prevIsVowel !== currIsVowel) alternations++;
  }
  const alternationRatio = alternations / (lower.length - 1);
  score += Math.round(alternationRatio * 20);

  // Penalise awkward letter combos
  const awkward = ['xz', 'zx', 'qk', 'kq', 'vw', 'wv', 'bv', 'vb', 'kg', 'gk'];
  for (const combo of awkward) {
    if (lower.includes(combo)) score -= 20;
  }

  return Math.max(0, Math.min(100, score));
}

/** Score spelling clarity: one obvious spelling when heard */
function scoreSpellingClarity(name: string): number {
  const lower = name.toLowerCase();
  let score = 100;

  // Penalise ambiguous sounds
  const ambiguous = [
    { pattern: 'ph', penalty: 15 },  // ph vs f
    { pattern: 'ck', penalty: 10 },  // ck vs k vs c
    { pattern: 'igh', penalty: 20 }, // igh vs eye vs i
    { pattern: 'ough', penalty: 25 },
    { pattern: 'eigh', penalty: 20 },
    { pattern: 'tion', penalty: 10 },
    { pattern: 'sion', penalty: 10 },
    { pattern: 'ey', penalty: 5 },   // ey vs ee vs ie
    { pattern: 'ei', penalty: 10 },  // ei vs ie
    { pattern: 'ae', penalty: 10 },  // ae vs ee
  ];

  for (const { pattern, penalty } of ambiguous) {
    if (lower.includes(pattern)) score -= penalty;
  }

  // Penalise silent letters
  if (lower.startsWith('kn') || lower.startsWith('wr') || lower.startsWith('gn')) {
    score -= 15;
  }

  // Penalise double letters that might be heard as single
  const doubles = lower.match(/(.)\1/g);
  if (doubles && doubles.length > 0) score -= 5 * doubles.length;

  // Reward simple CV patterns
  if (/^[bcdfghjklmnprstvwz][aeiou]/i.test(lower)) score += 5;

  return Math.max(0, Math.min(100, score));
}

/** Score uniqueness: distance from competitor names */
function scoreUniqueness(name: string): number {
  const lower = name.toLowerCase().replace(/[^a-z]/g, '');
  let score = 100;

  for (const comp of COMPETITORS) {
    // Exact match
    if (lower === comp) return 0;

    // Starts with same 4+ chars
    const prefix = Math.min(lower.length, comp.length, 4);
    if (lower.slice(0, prefix) === comp.slice(0, prefix) && prefix >= 4) {
      score -= 20;
    }

    // Contains competitor name
    if (lower.includes(comp) || comp.includes(lower)) {
      score -= 30;
    }

    // Simple edit distance check for very similar names
    if (Math.abs(lower.length - comp.length) <= 1) {
      let diffs = 0;
      const maxLen = Math.max(lower.length, comp.length);
      for (let i = 0; i < maxLen; i++) {
        if (lower[i] !== comp[i]) diffs++;
      }
      if (diffs <= 1) score -= 40;
      if (diffs <= 2) score -= 15;
    }
  }

  return Math.max(0, Math.min(100, score));
}

/** Score a name candidate */
function scoreName(name: string): NameCandidate['scores'] {
  return {
    length: scoreLength(name),
    pronounceability: scorePronouncability(name),
    spellingClarity: scoreSpellingClarity(name),
    uniqueness: scoreUniqueness(name),
  };
}

/** Calculate weighted total score */
function totalScore(scores: NameCandidate['scores']): number {
  return Math.round(
    scores.length * 0.3 +
    scores.pronounceability * 0.3 +
    scores.spellingClarity * 0.2 +
    scores.uniqueness * 0.2
  );
}

/** Generate and score all name candidates */
export function generateAndScore(config: Config): NameCandidate[] {
  const allNames: Map<string, NameCandidate> = new Map();

  for (const strategy of config.strategies) {
    const gen = generators[strategy];
    if (!gen) continue;

    const names = gen();
    for (const raw of names) {
      // Normalise: capitalise first letter, lowercase rest
      const name = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();

      // Skip if already seen (dedup across strategies)
      if (allNames.has(name.toLowerCase())) continue;

      // Skip names > 10 chars
      if (name.length > 10) continue;

      // Skip names < 3 chars
      if (name.length < 3) continue;

      // Remove any with non-alpha characters
      if (!/^[a-zA-Z]+$/.test(name)) continue;

      const scores = scoreName(name);
      const score = totalScore(scores);

      if (score >= config.minScore) {
        allNames.set(name.toLowerCase(), {
          name,
          strategy,
          length: name.length,
          score,
          scores,
        });
      }
    }
  }

  // Sort by score descending
  return [...allNames.values()].sort((a, b) => b.score - a.score);
}
