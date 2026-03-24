/**
 * Cruising season reference data for circumnavigation planning.
 * Covers cyclone zones, trade wind regions, and key transit windows.
 *
 * Sources: Jimmy Cornell's World Cruising Routes, Noonsite, NOAA.
 */

export interface CruisingZone {
  id: string;
  name: string;
  /** Polygon as [lon, lat] pairs */
  polygon: [number, number][];
  /** Months that are safe/optimal for cruising (1-12) */
  safeMonths: number[];
  /** Months with cyclone/hurricane risk (1-12) */
  dangerMonths: number[];
  /** Brief description of the season */
  notes: string;
  /** Type of hazard in danger months */
  hazard: 'cyclone' | 'hurricane' | 'typhoon' | 'monsoon' | 'winter-storms';
}

export interface TransitWindow {
  id: string;
  name: string;
  /** Start point [lon, lat] */
  from: [number, number];
  /** End point [lon, lat] */
  to: [number, number];
  /** Best months to transit (1-12) */
  bestMonths: number[];
  notes: string;
}

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Major cyclone/hurricane/typhoon zones with seasonal risk windows.
 * Polygons are simplified bounding boxes for each basin.
 */
export const CRUISING_ZONES: CruisingZone[] = [
  {
    id: 'north-atlantic-hurricane',
    name: 'North Atlantic Hurricane Zone',
    polygon: [[-100, 8], [-100, 35], [-15, 35], [-15, 8], [-100, 8]],
    safeMonths: [12, 1, 2, 3, 4, 5],
    dangerMonths: [6, 7, 8, 9, 10, 11],
    notes: 'Hurricane season Jun–Nov. Peak Aug–Oct. Caribbean safest Dec–May.',
    hazard: 'hurricane',
  },
  {
    id: 'south-pacific-cyclone',
    name: 'South Pacific Cyclone Zone',
    polygon: [[155, -5], [155, -25], [-130, -25], [-130, -5], [155, -5]],
    safeMonths: [5, 6, 7, 8, 9, 10],
    dangerMonths: [11, 12, 1, 2, 3, 4],
    notes: 'Cyclone season Nov–Apr. Fiji/Tonga safest May–Oct.',
    hazard: 'cyclone',
  },
  {
    id: 'south-indian-cyclone',
    name: 'South Indian Ocean Cyclone Zone',
    polygon: [[40, -5], [40, -25], [100, -25], [100, -5], [40, -5]],
    safeMonths: [5, 6, 7, 8, 9, 10],
    dangerMonths: [11, 12, 1, 2, 3, 4],
    notes: 'Cyclone season Nov–Apr. Madagascar/Mauritius safest May–Oct.',
    hazard: 'cyclone',
  },
  {
    id: 'northwest-pacific-typhoon',
    name: 'Northwest Pacific Typhoon Zone',
    polygon: [[100, 5], [100, 30], [180, 30], [180, 5], [100, 5]],
    safeMonths: [1, 2, 3, 4, 12],
    dangerMonths: [5, 6, 7, 8, 9, 10, 11],
    notes: 'Typhoon season May–Nov. Peak Jul–Oct. Philippines/Japan highest risk.',
    hazard: 'typhoon',
  },
  {
    id: 'north-indian-monsoon',
    name: 'North Indian Ocean / Arabian Sea',
    polygon: [[40, 5], [40, 25], [100, 25], [100, 5], [40, 5]],
    safeMonths: [11, 12, 1, 2, 3],
    dangerMonths: [4, 5, 6, 7, 8, 9, 10],
    notes: 'SW monsoon Jun–Sep, cyclone risk Apr–Jun & Oct–Dec. Best window Nov–Mar.',
    hazard: 'monsoon',
  },
  {
    id: 'med-winter',
    name: 'Mediterranean',
    polygon: [[-6, 30], [-6, 46], [36, 46], [36, 30], [-6, 30]],
    safeMonths: [4, 5, 6, 7, 8, 9, 10],
    dangerMonths: [11, 12, 1, 2, 3],
    notes: 'Winter storms Nov–Mar. Meltemi (Aegean) Jul–Aug strong but not dangerous. Best Apr–Oct.',
    hazard: 'winter-storms',
  },
  {
    id: 'southern-ocean',
    name: 'Southern Ocean (below 40°S)',
    polygon: [[-180, -40], [-180, -60], [180, -60], [180, -40], [-180, -40]],
    safeMonths: [12, 1, 2, 3],
    dangerMonths: [4, 5, 6, 7, 8, 9, 10, 11],
    notes: 'Roaring Forties. Extreme conditions year-round, least bad Dec–Mar. Not for casual cruising.',
    hazard: 'winter-storms',
  },
];

/**
 * Classic circumnavigation transit windows.
 * These are the well-known timing "gates" that define the rhythm of a circumnavigation.
 */
export const TRANSIT_WINDOWS: TransitWindow[] = [
  {
    id: 'atlantic-crossing-east-west',
    name: 'Atlantic Crossing (E→W)',
    from: [-18, 28],  // Canaries
    to: [-62, 16],    // Caribbean
    bestMonths: [11, 12, 1, 2],
    notes: 'ARC rally departs Las Palmas late Nov. Trade winds most reliable Dec–Feb.',
  },
  {
    id: 'panama-canal',
    name: 'Panama Canal Transit',
    from: [-80, 9],   // Caribbean side
    to: [-80, 8],     // Pacific side
    bestMonths: [1, 2, 3, 4],
    notes: 'Transit Jan–Apr before hurricane season. Book weeks ahead.',
  },
  {
    id: 'pacific-crossing-east-west',
    name: 'Pacific Crossing (E→W)',
    from: [-110, 10],  // Mexico/Central America
    to: [-150, -15],   // French Polynesia
    bestMonths: [2, 3, 4],
    notes: 'Depart Feb–Apr via Galapagos or direct. Arrive before cyclone season.',
  },
  {
    id: 'coral-sea-to-australia',
    name: 'Fiji → Australia',
    from: [177, -18],  // Fiji
    to: [153, -27],    // Brisbane
    bestMonths: [9, 10, 11],
    notes: 'Head south Sep–Nov before cyclone season. Many stop in New Caledonia.',
  },
  {
    id: 'torres-strait',
    name: 'Torres Strait → Indian Ocean',
    from: [142, -11],  // Torres Strait
    to: [105, -7],     // Bali/Indonesia
    bestMonths: [7, 8, 9],
    notes: 'Transit Jul–Sep during SE trade winds. Indonesian rally Jul–Aug.',
  },
  {
    id: 'indian-ocean-crossing',
    name: 'Indian Ocean Crossing',
    from: [80, 6],     // Sri Lanka
    to: [50, -5],      // East Africa
    bestMonths: [1, 2, 3],
    notes: 'NE monsoon Jan–Mar. Via Maldives, Chagos. Arrive before SW monsoon.',
  },
  {
    id: 'red-sea-south-north',
    name: 'Red Sea (S→N)',
    from: [43, 12],    // Bab el Mandeb
    to: [33, 30],      // Suez
    bestMonths: [3, 4, 5],
    notes: 'Motor-sail north Mar–May. NW winds year-round — this is an upwind slog.',
  },
  {
    id: 'suez-to-med',
    name: 'Suez → Mediterranean',
    from: [33, 30],    // Suez
    to: [24, 37],      // Greece
    bestMonths: [4, 5, 6],
    notes: 'Transit Apr–Jun for full Med summer. Meltemi starts Jul.',
  },
];

/** Returns whether a given month (1-12) is safe in a zone. */
export function isMonthSafe(zone: CruisingZone, month: number): boolean {
  return zone.safeMonths.includes(month);
}

/** Returns whether a given month (1-12) is dangerous in a zone. */
export function isMonthDangerous(zone: CruisingZone, month: number): boolean {
  return zone.dangerMonths.includes(month);
}

/** Get the safety status label for a zone in a given month. */
export function getMonthStatus(zone: CruisingZone, month: number): 'safe' | 'danger' | 'transition' {
  if (zone.safeMonths.includes(month)) return 'safe';
  if (zone.dangerMonths.includes(month)) return 'danger';
  return 'transition';
}
