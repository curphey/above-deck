import type { CruisingStyle } from './types';

export interface ProfileAdjustments {
  autonomyDays: number;
  shoreCharging: boolean;
  hoursMultiplier: number;
  description: string;
}

const PROFILES: Record<CruisingStyle, ProfileAdjustments> = {
  weekend: {
    autonomyDays: 1,
    shoreCharging: true,
    hoursMultiplier: 0.6,
    description: 'Marina-based, shore power available, short trips',
  },
  coastal: {
    autonomyDays: 2,
    shoreCharging: false,
    hoursMultiplier: 1.0,
    description: 'Week-long trips, some marinas, mostly anchored',
  },
  offshore: {
    autonomyDays: 3,
    shoreCharging: false,
    hoursMultiplier: 1.3,
    description: 'Extended passages, fully self-sufficient',
  },
};

export function getProfileAdjustments(style: CruisingStyle): ProfileAdjustments {
  return PROFILES[style];
}
