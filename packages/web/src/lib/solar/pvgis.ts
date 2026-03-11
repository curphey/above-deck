import type { PvgisMonthlyData } from './types';

const PVGIS_BASE = 'https://re.jrc.ec.europa.eu/api/v5_3';

export async function fetchMonthlyIrradiance(
  lat: number,
  lon: number
): Promise<PvgisMonthlyData[]> {
  const url = `${PVGIS_BASE}/MRcalc?lat=${lat}&lon=${lon}&horirrad=1&optrad=1&avtemp=1&outputformat=json`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`PVGIS API error: ${response.status}`);
  }

  const data = await response.json();
  const months = data.outputs.monthly;

  return months.map((m: { month: number; H_h: number; H_opt: number; T2m: number }) => ({
    month: m.month,
    horizontalIrradiance: m.H_h / 1000,
    optimalIrradiance: m.H_opt / 1000,
    temperature: m.T2m,
  }));
}

export function peakSunHours(monthlyData: PvgisMonthlyData[], month: number): number {
  const data = monthlyData.find(m => m.month === month);
  return data?.horizontalIrradiance ?? 4.0;
}

export function annualAveragePeakSunHours(monthlyData: PvgisMonthlyData[]): number {
  if (monthlyData.length === 0) return 4.0; // fallback
  const sum = monthlyData.reduce((acc, m) => acc + m.horizontalIrradiance, 0);
  return sum / monthlyData.length;
}
