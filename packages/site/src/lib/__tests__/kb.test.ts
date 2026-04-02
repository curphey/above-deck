import { describe, it, expect } from 'vitest';
import { buildTree, prettifyName, type KBArticle, type KBNode } from '../kb';

const sampleEntries = [
  { id: 'learning/electrical/12v-systems.md', title: '12V Systems', summary: 'Basics of 12V' },
  { id: 'learning/electrical/battery-types.md', title: 'Battery Types', summary: 'AGM vs Lithium' },
  { id: 'learning/weather-tides/tidal-basics.md', title: 'Tidal Basics', summary: 'Understanding tides' },
  { id: 'research/data-and-apis/marine-data.md', title: 'Marine Data', summary: 'API overview' },
  { id: 'research/hardware/can-bus.md', title: 'CAN Bus', summary: 'CAN bus tech' },
  { id: 'market/competitors/navionics.md', title: 'Navionics', summary: 'Navionics analysis' },
  { id: 'product/vision.md', title: 'Vision', summary: 'Product vision' },
  { id: 'engineering/standards/coding-style.md', title: 'Coding Style', summary: 'Code standards' },
];

describe('prettifyName', () => {
  it('converts kebab-case to title case', () => {
    expect(prettifyName('weather-tides')).toBe('Weather & Tides');
  });

  it('handles data-and-apis specially', () => {
    expect(prettifyName('data-and-apis')).toBe('Data & APIs');
  });

  it('handles single word', () => {
    expect(prettifyName('electrical')).toBe('Electrical');
  });

  it('handles ux-and-design', () => {
    expect(prettifyName('ux-and-design')).toBe('UX & Design');
  });

  it('replaces "and" with ampersand', () => {
    expect(prettifyName('charts-and-maps')).toBe('Charts & Maps');
  });
});

describe('buildTree', () => {
  it('builds correct tree from flat paths', () => {
    const tree = buildTree(sampleEntries);
    expect(tree).toHaveLength(5);
    expect(tree[0].name).toBe('learning');
    expect(tree[1].name).toBe('research');
    expect(tree[2].name).toBe('market');
    expect(tree[3].name).toBe('product');
    expect(tree[4].name).toBe('engineering');
  });

  it('assigns icons to purpose-level nodes', () => {
    const tree = buildTree(sampleEntries);
    const icons = tree.map((n) => n.icon);
    expect(icons).toEqual(['🎓', '🔬', '📊', '📐', '⚙️']);
  });

  it('nests topics under purposes', () => {
    const tree = buildTree(sampleEntries);
    const learning = tree.find((n) => n.name === 'learning')!;
    expect(learning.children).toHaveLength(2);
    const topicNames = learning.children.map((c) => c.name).sort();
    expect(topicNames).toEqual(['electrical', 'weather-tides']);
  });

  it('places articles in correct topic nodes', () => {
    const tree = buildTree(sampleEntries);
    const learning = tree.find((n) => n.name === 'learning')!;
    const electrical = learning.children.find((c) => c.name === 'electrical')!;
    expect(electrical.articles).toHaveLength(2);
    expect(electrical.articles.map((a) => a.title).sort()).toEqual(['12V Systems', 'Battery Types']);
  });

  it('handles articles directly under a purpose folder (no subfolder)', () => {
    const entries = [
      { id: 'product/vision.md', title: 'Vision', summary: 'Product vision' },
    ];
    const tree = buildTree(entries);
    const product = tree.find((n) => n.name === 'product')!;
    expect(product.articles).toHaveLength(1);
    expect(product.articles[0].title).toBe('Vision');
    expect(product.children).toHaveLength(0);
  });

  it('prettifies labels on purpose and topic nodes', () => {
    const tree = buildTree(sampleEntries);
    const research = tree.find((n) => n.name === 'research')!;
    expect(research.label).toBe('Research');
    const dataApis = research.children.find((c) => c.name === 'data-and-apis')!;
    expect(dataApis.label).toBe('Data & APIs');
  });

  it('sorts topics alphabetically', () => {
    const tree = buildTree(sampleEntries);
    const learning = tree.find((n) => n.name === 'learning')!;
    const topicNames = learning.children.map((c) => c.name);
    expect(topicNames).toEqual(['electrical', 'weather-tides']);
  });

  it('sorts articles alphabetically by title', () => {
    const tree = buildTree(sampleEntries);
    const learning = tree.find((n) => n.name === 'learning')!;
    const electrical = learning.children.find((c) => c.name === 'electrical')!;
    expect(electrical.articles.map((a) => a.title)).toEqual(['12V Systems', 'Battery Types']);
  });

  it('filters by learning mode (only learning purpose)', () => {
    const tree = buildTree(sampleEntries, 'learning');
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('learning');
  });

  it('filters by building mode (all except learning)', () => {
    const tree = buildTree(sampleEntries, 'building');
    expect(tree).toHaveLength(4);
    expect(tree.map((n) => n.name)).toEqual(['research', 'market', 'product', 'engineering']);
  });

  it('returns all purposes when no filter is specified', () => {
    const tree = buildTree(sampleEntries);
    expect(tree).toHaveLength(5);
  });

  it('derives slug from id', () => {
    const tree = buildTree(sampleEntries);
    const learning = tree.find((n) => n.name === 'learning')!;
    const electrical = learning.children.find((c) => c.name === 'electrical')!;
    const article = electrical.articles.find((a) => a.title === '12V Systems')!;
    expect(article.slug).toBe('learning/electrical/12v-systems');
  });

  it('handles empty input', () => {
    const tree = buildTree([]);
    expect(tree).toEqual([]);
  });
});
