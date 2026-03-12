export interface NameCandidate {
  name: string;
  strategy: Strategy;
  length: number;
  score: number;
  scores: {
    length: number;
    pronounceability: number;
    spellingClarity: number;
    uniqueness: number;
  };
}

export interface DomainResult extends NameCandidate {
  domain: string;
  available: boolean;
  priceUSD: number | null;
  priceGBP: number | null;
}

export type Strategy =
  | 'nautical'
  | 'compound'
  | 'coinage'
  | 'metaphoric'
  | 'abstract'
  | 'foreign';

export interface GeneratorFn {
  (): string[];
}

export interface Config {
  strategies: Strategy[];
  minScore: number;
  limit: number;
  dryRun: boolean;
  usdToGbp: number;
  gbpBudget: number;
}
