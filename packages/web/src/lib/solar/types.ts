export interface Appliance {
  id: string;
  name: string;
  category: string;
  wattsTypical: number;
  wattsMin: number;
  wattsMax: number;
  hoursPerDayAnchor: number;
  hoursPerDayPassage: number;
  dutyCycle: number;
  usageType: 'always-on' | 'scheduled' | 'intermittent';
  crewScaling: boolean;
  enabled: boolean;
}

export interface SystemConfig {
  appliances: Appliance[];
  crewSize: number;
  batteryChemistry: 'agm' | 'lifepo4';
  systemVoltage: 12 | 24 | 48;
  daysAutonomy: number;
  deratingFactor: number;
  alternatorAmps: number;
  motoringHoursPerDay: number;
  hasShorepower: boolean;
  latitude: number;
  longitude: number;
  month: number;
}

export interface ConsumptionResult {
  totalWhPerDayAnchor: number;
  totalWhPerDayPassage: number;
  totalAhPerDayAnchor: number;
  totalAhPerDayPassage: number;
  breakdownByCategory: Record<string, { anchor: number; passage: number }>;
}

export interface SolarRecommendation {
  panelWatts: { minimum: number; recommended: number; comfortable: number };
  batteryAh: { minimum: number; recommended: number; comfortable: number };
  batteryCount: number;
  mpptAmps: number;
  mpptMaxVoltage: number;
  inverterWatts: number | null;
  alternatorDailyAh: number;
  needsSmartRegulator: boolean;
  batteryMonitor: boolean;
  wireGauge: string;
  dailyGenerationWh: number;
  dailyBalance: number;
}

export interface PvgisMonthlyData {
  month: number;
  horizontalIrradiance: number;
  optimalIrradiance: number;
  temperature: number;
}

export type JourneyMode = 'new-system' | 'check-existing' | 'add-upgrade';
