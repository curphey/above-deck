import { useState, useMemo } from 'react';
import type { KBNode, KBArticle } from '../../lib/kb';

type FilterMode = 'all' | 'learning' | 'building';

interface Props {
  tree: KBNode[];
  currentSlug?: string;
}

const PURPOSE_ICONS: Record<string, string> = {
  learning: '\u{1F393}',
  research: '\u{1F52C}',
  market: '\u{1F4CA}',
  product: '\u{1F4D0}',
  engineering: '\u2699\uFE0F',
};

const BUILDING_PURPOSES = ['research', 'market', 'product', 'engineering'];

function matchesSearch(node: KBNode, query: string): boolean {
  if (node.articles.some((a) => a.title.toLowerCase().includes(query))) {
    return true;
  }
  return node.children.some((child) => matchesSearch(child, query));
}

function filterArticles(articles: KBArticle[], query: string): KBArticle[] {
  if (!query) return articles;
  return articles.filter((a) => a.title.toLowerCase().includes(query));
}

function filterNode(node: KBNode, query: string): KBNode | null {
  if (!query) return node;
  const filteredArticles = filterArticles(node.articles, query);
  const filteredChildren = node.children
    .map((child) => filterNode(child, query))
    .filter(Boolean) as KBNode[];

  if (filteredArticles.length === 0 && filteredChildren.length === 0) {
    return null;
  }

  return { ...node, articles: filteredArticles, children: filteredChildren };
}

export default function KBSidebar({ tree, currentSlug }: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    // First purpose expanded by default
    if (tree.length > 0) {
      const first = tree[0];
      const init: Record<string, boolean> = { [first.path]: true };
      // Also expand first topic of first purpose
      if (first.children.length > 0) {
        init[first.children[0].path] = true;
      }
      return init;
    }
    return {};
  });

  const filteredTree = useMemo(() => {
    let nodes = tree;

    // Apply filter mode
    if (filter === 'learning') {
      nodes = nodes.filter((n) => n.name === 'learning');
    } else if (filter === 'building') {
      nodes = nodes.filter((n) => BUILDING_PURPOSES.includes(n.name));
    }

    // Apply search
    const query = search.toLowerCase().trim();
    if (query) {
      nodes = nodes
        .map((n) => filterNode(n, query))
        .filter(Boolean) as KBNode[];
    }

    return nodes;
  }, [tree, filter, search]);

  const toggle = (path: string) => {
    setExpanded((prev: Record<string, boolean>) => ({ ...prev, [path]: !prev[path] }));
  };

  const isExpanded = (path: string) => {
    // When searching, expand everything
    if (search.trim()) return true;
    return !!expanded[path];
  };

  return (
    <nav style={styles.sidebar}>
      {/* Search */}
      <div style={styles.searchWrap}>
        <input
          type="text"
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.search}
        />
      </div>

      {/* Filter pills */}
      <div style={styles.filterRow}>
        {(['all', 'learning', 'building'] as FilterMode[]).map((mode: FilterMode) => (
          <button
            key={mode}
            onClick={() => setFilter(mode)}
            style={{
              ...styles.pill,
              ...(filter === mode ? styles.pillActive : {}),
            }}
          >
            {mode === 'all' && 'All'}
            {mode === 'learning' && '\u{1F393} Learning'}
            {mode === 'building' && '\u{1F527} Building'}
          </button>
        ))}
      </div>

      {/* Tree */}
      <div style={styles.tree}>
        {filteredTree.map((purpose: KBNode) => (
          <div key={purpose.path}>
            {/* Purpose header */}
            <div
              style={styles.purposeHeader}
              onClick={() => toggle(purpose.path)}
            >
              <span style={styles.chevron}>
                {isExpanded(purpose.path) ? '\u25BE' : '\u25B8'}
              </span>
              <span style={styles.purposeIcon}>
                {PURPOSE_ICONS[purpose.name] || ''}
              </span>
              <span>{purpose.label}</span>
            </div>

            {isExpanded(purpose.path) && (
              <div>
                {/* Root articles (directly under purpose) */}
                {purpose.articles.map((article: KBArticle) => (
                  <a
                    key={article.slug}
                    href={`/knowledge/${article.slug}`}
                    style={{
                      ...styles.articleLink,
                      paddingLeft: 28,
                      ...(currentSlug === article.slug
                        ? styles.articleActive
                        : {}),
                    }}
                  >
                    {article.title}
                  </a>
                ))}

                {/* Topic nodes */}
                {purpose.children.map((topic: KBNode) => (
                  <div key={topic.path}>
                    <div
                      style={styles.topicHeader}
                      onClick={() => toggle(topic.path)}
                    >
                      <span style={styles.chevronSmall}>
                        {isExpanded(topic.path) ? '\u25BE' : '\u25B8'}
                      </span>
                      <span>{topic.label}</span>
                    </div>

                    {isExpanded(topic.path) && (
                      <div>
                        {topic.articles.map((article: KBArticle) => (
                          <a
                            key={article.slug}
                            href={`/knowledge/${article.slug}`}
                            style={{
                              ...styles.articleLink,
                              ...(currentSlug === article.slug
                                ? styles.articleActive
                                : {}),
                            }}
                          >
                            {article.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 260,
    minWidth: 260,
    borderRight: '1px solid #e8e8e8',
    backgroundColor: '#ffffff',
    overflowY: 'auto',
    fontFamily: "'Inter', sans-serif",
    display: 'flex',
    flexDirection: 'column',
  },
  searchWrap: {
    padding: '12px 12px 0',
  },
  search: {
    width: '100%',
    padding: '6px 10px',
    fontSize: 12,
    fontFamily: "'Inter', sans-serif",
    border: '1px solid #e0e0e0',
    borderRadius: 4,
    backgroundColor: '#ffffff',
    color: '#2d2d3a',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  filterRow: {
    display: 'flex',
    gap: 4,
    padding: '8px 12px',
  },
  pill: {
    padding: '3px 8px',
    fontSize: 10,
    fontFamily: "'Space Mono', monospace",
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    border: '1px solid #e0e0e0',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    color: '#6b7280',
    cursor: 'pointer',
    lineHeight: '1.4',
  },
  pillActive: {
    backgroundColor: '#2d2d3a',
    color: '#ffffff',
    borderColor: '#2d2d3a',
  },
  tree: {
    flex: 1,
    overflowY: 'auto',
    padding: '4px 0',
  },
  purposeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "'Inter', sans-serif",
    color: '#2d2d3a',
    userSelect: 'none' as const,
  },
  chevron: {
    fontSize: 10,
    width: 10,
    textAlign: 'center' as const,
    color: '#8b8b9e',
  },
  chevronSmall: {
    fontSize: 9,
    width: 10,
    textAlign: 'center' as const,
    color: '#8b8b9e',
  },
  purposeIcon: {
    fontSize: 13,
  },
  topicHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 12px 4px 28px',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 600,
    color: '#4b5563',
    fontFamily: "'Inter', sans-serif",
    userSelect: 'none' as const,
  },
  articleLink: {
    display: 'block',
    padding: '3px 12px 3px 42px',
    fontSize: 11,
    color: '#6b7280',
    textDecoration: 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    borderLeft: '2px solid transparent',
    transition: 'all 0.1s',
  },
  articleActive: {
    color: '#2d2d3a',
    fontWeight: 500,
    backgroundColor: 'rgba(96, 165, 250, 0.08)',
    borderLeftColor: '#60a5fa',
  },
};
