import type { PanelType } from './types';

const ALTERNATOR_EFFICIENCY = 0.7;

const PANEL_TYPE_FACTOR: Record<PanelType, number> = {
  rigid: 1.0,
  'semi-flexible': 0.9,
  flexible: 0.85,
};

export interface ChargingInput {
  solarPanelWatts: number;
  panelType: PanelType;
  peakSunHours: number;
  deratingFactor: number;
  alternatorAmps: number;
  motoringHoursPerDay: number;
  systemVoltage: number;
  shorepower: 'no' | 'sometimes' | 'often';
}

export interface ChargingResult {
  solarWhPerDay: number;
  alternatorWhPerDay: number;
  totalWhPerDay: number;
}

export function calculateDailyCharging(input: ChargingInput): ChargingResult {
  const panelFactor = PANEL_TYPE_FACTOR[input.panelType];
  const solarWhPerDay = Math.round(
    input.solarPanelWatts * input.peakSunHours * input.deratingFactor * panelFactor
  );
  const alternatorWhPerDay = Math.round(
    input.alternatorAmps * input.motoringHoursPerDay * ALTERNATOR_EFFICIENCY * input.systemVoltage
  );
  return { solarWhPerDay, alternatorWhPerDay, totalWhPerDay: solarWhPerDay + alternatorWhPerDay };
}
