import type { CuratedRegion } from './types';

export const CURATED_REGIONS: CuratedRegion[] = [
  { name: 'Mediterranean', lat: 36.0, lon: 14.5, psh: 4.5, deratingFactor: 0.75, thumbnailUrl: '' },
  { name: 'Caribbean', lat: 15.0, lon: -61.0, psh: 5.5, deratingFactor: 0.75, thumbnailUrl: '' },
  { name: 'SE Asia', lat: 8.0, lon: 104.0, psh: 4.8, deratingFactor: 0.70, thumbnailUrl: '' },
  { name: 'South Pacific', lat: -17.0, lon: -149.0, psh: 5.0, deratingFactor: 0.75, thumbnailUrl: '' },
  { name: 'Northern Europe', lat: 52.0, lon: 1.0, psh: 2.8, deratingFactor: 0.70, thumbnailUrl: '' },
  { name: 'Canary Islands', lat: 28.1, lon: -15.4, psh: 5.2, deratingFactor: 0.80, thumbnailUrl: '' },
  { name: 'US East Coast', lat: 28.0, lon: -80.0, psh: 4.0, deratingFactor: 0.72, thumbnailUrl: '' },
  { name: 'US West Coast', lat: 34.0, lon: -118.0, psh: 4.5, deratingFactor: 0.75, thumbnailUrl: '' },
  { name: 'Australia', lat: -33.8, lon: 151.2, psh: 5.0, deratingFactor: 0.78, thumbnailUrl: '' },
  { name: 'Red Sea', lat: 22.0, lon: 38.0, psh: 5.8, deratingFactor: 0.72, thumbnailUrl: '' },
  { name: 'Indian Ocean', lat: -4.0, lon: 55.0, psh: 5.0, deratingFactor: 0.73, thumbnailUrl: '' },
  { name: 'Baltic Sea', lat: 56.0, lon: 18.0, psh: 2.5, deratingFactor: 0.68, thumbnailUrl: '' },
  { name: 'UK / Channel', lat: 50.0, lon: -1.0, psh: 2.6, deratingFactor: 0.68, thumbnailUrl: '' },
  { name: 'Japan / Korea', lat: 34.0, lon: 135.0, psh: 3.8, deratingFactor: 0.72, thumbnailUrl: '' },
  { name: 'New Zealand', lat: -41.0, lon: 174.0, psh: 4.2, deratingFactor: 0.75, thumbnailUrl: '' },
  { name: 'Brazil', lat: -22.9, lon: -43.1, psh: 4.8, deratingFactor: 0.73, thumbnailUrl: '' },
  { name: 'West Africa', lat: 14.7, lon: -17.4, psh: 5.0, deratingFactor: 0.70, thumbnailUrl: '' },
  { name: 'Patagonia', lat: -42.0, lon: -65.0, psh: 3.5, deratingFactor: 0.70, thumbnailUrl: '' },
  { name: 'Alaska / PNW', lat: 57.0, lon: -135.0, psh: 2.8, deratingFactor: 0.68, thumbnailUrl: '' },
  { name: 'Persian Gulf', lat: 25.0, lon: 55.0, psh: 5.5, deratingFactor: 0.70, thumbnailUrl: '' },
];

export function findRegionByName(name: string): CuratedRegion | undefined {
  return CURATED_REGIONS.find((r) => r.name === name);
}
