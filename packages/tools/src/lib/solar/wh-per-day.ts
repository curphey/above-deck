import type { EquipmentInstance } from './types';
import { INVERTER_EFFICIENCY, PANEL_FACTOR, ALTERNATOR_EFFICIENCY } from './equipment-calc';

/**
 * Build a map of equipment ID → Wh/day for every item in the list.
 * Disabled items get 0. Store items always return 0 (they don't produce/consume).
 */
export function buildWhPerDayMap(
  equipment: EquipmentInstance[],
  viewMode: 'anchor' | 'passage',
  crewSize: number,
  peakSunHours: number,
  deratingFactor: number,
  systemVoltage: number,
): Map<string, number> {
  const map = new Map<string, number>();

  for (const item of equipment) {
    if (!item.enabled) {
      map.set(item.id, 0);
      continue;
    }

    switch (item.type) {
      case 'drain': {
        const hours = viewMode === 'anchor' ? item.hoursPerDayAnchor : item.hoursPerDayPassage;
        const crewMultiplier = item.crewScaling ? Math.max(crewSize, 1) / 2 : 1;
        const inverterFactor = item.powerType === 'ac' ? 1 / INVERTER_EFFICIENCY : 1;
        map.set(
          item.id,
          Math.round(item.wattsTypical * hours * item.dutyCycle * crewMultiplier * inverterFactor),
        );
        break;
      }
      case 'charge': {
        switch (item.sourceType) {
          case 'solar': {
            const panelFactor = PANEL_FACTOR[item.panelType ?? 'rigid'];
            map.set(
              item.id,
              Math.round((item.panelWatts ?? 0) * peakSunHours * deratingFactor * panelFactor),
            );
            break;
          }
          case 'alternator': {
            map.set(
              item.id,
              Math.round(
                (item.alternatorAmps ?? 0) *
                  systemVoltage *
                  (item.motoringHoursPerDay ?? 0) *
                  ALTERNATOR_EFFICIENCY,
              ),
            );
            break;
          }
          case 'shore': {
            map.set(
              item.id,
              Math.round(
                (item.shoreChargerAmps ?? 0) * systemVoltage * (item.shoreHoursPerDay ?? 0),
              ),
            );
            break;
          }
        }
        break;
      }
      case 'store': {
        map.set(item.id, 0);
        break;
      }
    }
  }

  return map;
}
