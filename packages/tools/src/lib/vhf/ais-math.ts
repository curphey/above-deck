/**
 * Navigation math utilities for computing AIS target metrics.
 * Distance (nm), bearing (degrees), and CPA (closest point of approach).
 */

const EARTH_RADIUS_NM = 3440.065;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/** Great-circle distance in nautical miles (Haversine). */
export function distanceNM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLon = (lon2 - lon1) * DEG_TO_RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_NM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Initial bearing from point 1 to point 2 in degrees (0-360). */
export function bearingDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = (lon2 - lon1) * DEG_TO_RAD;
  const y = Math.sin(dLon) * Math.cos(lat2 * DEG_TO_RAD);
  const x =
    Math.cos(lat1 * DEG_TO_RAD) * Math.sin(lat2 * DEG_TO_RAD) -
    Math.sin(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD) * Math.cos(dLon);
  return ((Math.atan2(y, x) * RAD_TO_DEG) + 360) % 360;
}

/**
 * Estimated Closest Point of Approach (CPA) in nautical miles.
 * Uses linear motion projection over 30 minutes.
 * Returns the minimum distance during the projection window.
 */
export function estimateCPA(
  ownLat: number, ownLon: number, ownSog: number, ownCog: number,
  tgtLat: number, tgtLon: number, tgtSog: number, tgtCog: number,
): number {
  // Project positions forward in 1-minute steps for 30 minutes
  let minDist = distanceNM(ownLat, ownLon, tgtLat, tgtLon);

  for (let t = 1; t <= 30; t++) {
    const dt = t / 60; // hours
    const ownLatP = ownLat + (ownSog * dt * Math.cos(ownCog * DEG_TO_RAD)) / 60;
    const ownLonP = ownLon + (ownSog * dt * Math.sin(ownCog * DEG_TO_RAD)) / (60 * Math.cos(ownLat * DEG_TO_RAD));
    const tgtLatP = tgtLat + (tgtSog * dt * Math.cos(tgtCog * DEG_TO_RAD)) / 60;
    const tgtLonP = tgtLon + (tgtSog * dt * Math.sin(tgtCog * DEG_TO_RAD)) / (60 * Math.cos(tgtLat * DEG_TO_RAD));
    const d = distanceNM(ownLatP, ownLonP, tgtLatP, tgtLonP);
    if (d < minDist) minDist = d;
  }

  return minDist;
}
