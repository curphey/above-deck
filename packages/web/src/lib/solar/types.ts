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
  origin: 'stock' | 'catalog' | 'custom';
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

export type PanelType = 'rigid' | 'semi-flexible' | 'flexible';

// --- Equipment Instance types (v3) ---

export interface EquipmentBase {
  id: string;
  catalogId: string | null;
  name: string;
  type: 'drain' | 'charge' | 'store';
  enabled: boolean;
  origin: 'stock' | 'added';
  notes: string;
}

export interface DrainEquipment extends EquipmentBase {
  type: 'drain';
  category: string;
  wattsTypical: number;
  wattsMin: number;
  wattsMax: number;
  hoursPerDayAnchor: number;
  hoursPerDayPassage: number;
  dutyCycle: number;
  crewScaling: boolean;
  powerType: 'dc' | 'ac';
}

export interface ChargeEquipment extends EquipmentBase {
  type: 'charge';
  sourceType: 'solar' | 'alternator' | 'shore';
  panelWatts?: number;
  panelType?: PanelType;
  regionName?: string;
  alternatorAmps?: number;
  motoringHoursPerDay?: number;
  shoreHoursPerDay?: number;
  shoreChargerAmps?: number;
}

export interface StoreEquipment extends EquipmentBase {
  type: 'store';
  chemistry: 'agm' | 'lifepo4';
  capacityAh: number;
}

export type EquipmentInstance = DrainEquipment | ChargeEquipment | StoreEquipment;

// --- Configurator types (v4) ---

export type CruisingStyle = 'weekend' | 'coastal' | 'offshore';
export type BoatType = 'mono' | 'cat' | 'tri';

export interface WizardConfig {
  boatName: string;
  templateId: string | null;
  boatType: BoatType;
  boatLengthFt: number;
  systemVoltage: 12 | 24 | 48;
  regionName: string;
  latitude: number;
  longitude: number;
  peakSunHours: number;
  deratingFactor: number;
  cruisingStyle: CruisingStyle;
  crewSize: number;
}

export interface CuratedRegion {
  name: string;
  lat: number;
  lon: number;
  psh: number;
  deratingFactor: number;
  thumbnailUrl: string;
}

export interface PreviousMetrics {
  drainWhPerDay: number;
  chargeWhPerDay: number;
  netBalance: number;
  daysAutonomy: number;
}
