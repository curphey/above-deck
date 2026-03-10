export const CATEGORIES = [
  'electrical',
  'engine-mechanical',
  'plumbing-water',
  'safety-emergency',
  'provisioning-living',
  'destinations-cruising',
  'general',
  'introductions',
  'feature-requests',
] as const;

export type Category = (typeof CATEGORIES)[number];

const LABELS: Record<Category, string> = {
  'electrical': 'Electrical',
  'engine-mechanical': 'Engine & Mechanical',
  'plumbing-water': 'Plumbing & Water',
  'safety-emergency': 'Safety & Emergency',
  'provisioning-living': 'Provisioning & Living',
  'destinations-cruising': 'Destinations & Cruising',
  'general': 'General',
  'introductions': 'Introductions',
  'feature-requests': 'Feature Requests',
};

const COLOR_MAP: Record<Category, string> = {
  'electrical': 'yellow',
  'engine-mechanical': 'orange',
  'plumbing-water': 'cyan',
  'safety-emergency': 'red',
  'provisioning-living': 'green',
  'destinations-cruising': 'blue',
  'general': 'gray',
  'introductions': 'teal',
  'feature-requests': 'violet',
};

export function categoryLabel(cat: string): string {
  return LABELS[cat as Category] ?? cat;
}

export function categoryColor(cat: string): string {
  return COLOR_MAP[cat as Category] ?? 'gray';
}
