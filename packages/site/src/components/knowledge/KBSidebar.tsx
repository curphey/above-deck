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
    <>
      <style>{sidebarCSS}</style>
      <nav className="kb-sidebar">
        {/* Search */}
        <div className="kb-sidebar-search-wrap">
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="kb-sidebar-search"
          />
        </div>

        {/* Filter pills */}
        <div className="kb-sidebar-filter-row">
          {(['all', 'learning', 'building'] as FilterMode[]).map((mode: FilterMode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`kb-sidebar-pill ${filter === mode ? 'kb-sidebar-pill-active' : ''}`}
            >
              {mode === 'all' && 'All'}
              {mode === 'learning' && '\u{1F393} Learning'}
              {mode === 'building' && '\u{1F527} Building'}
            </button>
          ))}
        </div>

        {/* Tree */}
        <div className="kb-sidebar-tree">
          {filteredTree.map((purpose: KBNode) => (
            <div key={purpose.path}>
              {/* Purpose header */}
              <div
                className="kb-sidebar-purpose"
                onClick={() => toggle(purpose.path)}
              >
                <span className="kb-sidebar-chevron">
                  {isExpanded(purpose.path) ? '\u25BE' : '\u25B8'}
                </span>
                <span className="kb-sidebar-purpose-icon">
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
                      className={`kb-sidebar-article kb-sidebar-article-root ${currentSlug === article.slug ? 'kb-sidebar-article-active' : ''}`}
                    >
                      {article.title}
                    </a>
                  ))}

                  {/* Topic nodes */}
                  {purpose.children.map((topic: KBNode) => (
                    <div key={topic.path}>
                      <div
                        className="kb-sidebar-topic"
                        onClick={() => toggle(topic.path)}
                      >
                        <span className="kb-sidebar-chevron-sm">
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
                              className={`kb-sidebar-article ${currentSlug === article.slug ? 'kb-sidebar-article-active' : ''}`}
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
    </>
  );
}

const sidebarCSS = `
  .kb-sidebar {
    width: 260px;
    min-width: 260px;
    border-right: 1px solid #e8e8e8;
    background-color: #ffffff;
    overflow-y: auto;
    font-family: 'Inter', sans-serif;
    display: flex;
    flex-direction: column;
  }

  .kb-sidebar-search-wrap {
    padding: 12px 12px 0;
  }

  .kb-sidebar-search {
    width: 100%;
    padding: 7px 10px;
    font-size: 12px;
    font-family: 'Inter', sans-serif;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    background-color: #fafaf8;
    color: #2d2d3a;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s, background-color 0.15s;
  }

  .kb-sidebar-search:focus {
    border-color: #60a5fa;
    background-color: #ffffff;
  }

  .kb-sidebar-search::placeholder {
    color: #b0b0b0;
  }

  .kb-sidebar-filter-row {
    display: flex;
    gap: 4px;
    padding: 8px 12px;
  }

  .kb-sidebar-pill {
    padding: 3px 8px;
    font-size: 10px;
    font-family: 'Space Mono', monospace;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    background-color: #ffffff;
    color: #8b8b9e;
    cursor: pointer;
    line-height: 1.4;
    transition: all 0.15s;
  }

  .kb-sidebar-pill:hover {
    border-color: #c0c0c0;
    color: #2d2d3a;
  }

  .kb-sidebar-pill-active {
    background-color: #2d2d3a;
    color: #ffffff;
    border-color: #2d2d3a;
  }

  .kb-sidebar-pill-active:hover {
    background-color: #2d2d3a;
    color: #ffffff;
    border-color: #2d2d3a;
  }

  .kb-sidebar-tree {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0 12px;
  }

  .kb-sidebar-purpose {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 700;
    font-family: 'Inter', sans-serif;
    color: #2d2d3a;
    user-select: none;
    transition: background 0.1s;
  }

  .kb-sidebar-purpose:hover {
    background: #fafaf8;
  }

  .kb-sidebar-chevron {
    font-size: 10px;
    width: 10px;
    text-align: center;
    color: #8b8b9e;
  }

  .kb-sidebar-chevron-sm {
    font-size: 9px;
    width: 10px;
    text-align: center;
    color: #8b8b9e;
  }

  .kb-sidebar-purpose-icon {
    font-size: 13px;
  }

  .kb-sidebar-topic {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 5px 12px 5px 28px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 600;
    color: #4b5563;
    font-family: 'Inter', sans-serif;
    user-select: none;
    transition: background 0.1s;
  }

  .kb-sidebar-topic:hover {
    background: #fafaf8;
  }

  .kb-sidebar-article {
    display: block;
    padding: 4px 12px 4px 42px;
    font-size: 11px;
    color: #8b8b9e;
    text-decoration: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border-left: 2px solid transparent;
    transition: all 0.1s;
  }

  .kb-sidebar-article-root {
    padding-left: 28px;
  }

  .kb-sidebar-article:hover {
    color: #2d2d3a;
    background: rgba(96, 165, 250, 0.04);
  }

  .kb-sidebar-article-active {
    color: #2d2d3a;
    font-weight: 500;
    background: rgba(96, 165, 250, 0.08);
    border-left-color: #60a5fa;
  }
`;
