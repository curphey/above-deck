export interface KBArticle {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  body?: string;
}

export interface KBNode {
  name: string;
  label: string;
  path: string;
  icon?: string;
  children: KBNode[];
  articles: KBArticle[];
}

const PURPOSE_ORDER = ['learning', 'research', 'market', 'product', 'engineering'];

const PURPOSE_ICONS: Record<string, string> = {
  learning: '🎓',
  research: '🔬',
  market: '📊',
  product: '📐',
  engineering: '⚙️',
};

/**
 * Known display names for folder slugs that can't be derived algorithmically.
 */
const DISPLAY_OVERRIDES: Record<string, string> = {
  'weather-tides': 'Weather & Tides',
  'data-and-apis': 'Data & APIs',
  'ux-and-design': 'UX & Design',
  'navigation-and-weather': 'Navigation & Weather',
};

/**
 * Prettify a kebab-case folder name into a display label.
 * Uses overrides for known names, otherwise capitalises words and swaps "and" for "&".
 */
export function prettifyName(name: string): string {
  if (DISPLAY_OVERRIDES[name]) return DISPLAY_OVERRIDES[name];

  const ACRONYMS: Record<string, string> = {
    apis: 'APIs',
    api: 'API',
    ux: 'UX',
    ui: 'UI',
  };

  return name
    .split('-')
    .map((word) => {
      if (word === 'and') return '&';
      const lower = word.toLowerCase();
      if (ACRONYMS[lower]) return ACRONYMS[lower];
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export type FilterMode = 'learning' | 'building';

interface EntryInput {
  id: string;
  title: string;
  summary?: string;
}

/**
 * Build a tree of KBNodes from flat content collection entries.
 *
 * Each entry id is a path like "learning/electrical/12v-systems.md".
 * The tree groups by purpose folder, then topic subfolder, then articles.
 */
export function buildTree(entries: EntryInput[], filter?: FilterMode): KBNode[] {
  // Group entries by purpose
  const purposeMap = new Map<string, Map<string, KBArticle[]>>();

  for (const entry of entries) {
    const parts = entry.id.split('/');
    if (parts.length < 2) continue;

    const purpose = parts[0];
    const filename = parts[parts.length - 1];
    const slug = entry.id.replace(/\.mdx?$/, '');

    const article: KBArticle = {
      id: entry.id,
      slug,
      title: entry.title,
      summary: entry.summary,
    };

    if (!purposeMap.has(purpose)) {
      purposeMap.set(purpose, new Map());
    }
    const topicMap = purposeMap.get(purpose)!;

    if (parts.length === 2) {
      // Article directly under purpose (no subfolder)
      const key = '__root__';
      if (!topicMap.has(key)) topicMap.set(key, []);
      topicMap.get(key)!.push(article);
    } else {
      const topic = parts[1];
      if (!topicMap.has(topic)) topicMap.set(topic, []);
      topicMap.get(topic)!.push(article);
    }
  }

  // Apply filter
  let purposes = PURPOSE_ORDER.filter((p) => purposeMap.has(p));
  if (filter === 'learning') {
    purposes = purposes.filter((p) => p === 'learning');
  } else if (filter === 'building') {
    purposes = purposes.filter((p) => p !== 'learning');
  }

  // Build tree
  return purposes.map((purpose) => {
    const topicMap = purposeMap.get(purpose)!;
    const rootArticles = topicMap.get('__root__') ?? [];
    const children: KBNode[] = [];

    for (const [topic, articles] of topicMap.entries()) {
      if (topic === '__root__') continue;
      children.push({
        name: topic,
        label: prettifyName(topic),
        path: `${purpose}/${topic}`,
        children: [],
        articles: [...articles].sort((a, b) => a.title.localeCompare(b.title)),
      });
    }

    children.sort((a, b) => a.name.localeCompare(b.name));

    return {
      name: purpose,
      label: prettifyName(purpose),
      path: purpose,
      icon: PURPOSE_ICONS[purpose],
      children,
      articles: [...rootArticles].sort((a, b) => a.title.localeCompare(b.title)),
    };
  });
}
