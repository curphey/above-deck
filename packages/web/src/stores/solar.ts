import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Appliance, PanelType } from '@/lib/solar/types';

export type ViewMode = 'anchor' | 'passage';

interface SolarState {
  boatModelId: string | null;
  setBoatModelId: (id: string | null) => void;
  crewSize: number;
  setCrewSize: (size: number) => void;
  solarPanelWatts: number;
  setSolarPanelWatts: (watts: number) => void;
  panelType: PanelType;
  setPanelType: (type: PanelType) => void;
  appliances: Appliance[];
  setAppliances: (appliances: Appliance[]) => void;
  toggleAppliance: (id: string) => void;
  updateApplianceHours: (id: string, mode: 'anchor' | 'passage', hours: number) => void;
  removeAppliance: (id: string) => void;
  updateApplianceWatts: (id: string, watts: number) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  latitude: number;
  longitude: number;
  regionName: string;
  setLocation: (lat: number, lon: number, name: string) => void;
  batteryChemistry: 'agm' | 'lifepo4';
  setBatteryChemistry: (chem: 'agm' | 'lifepo4') => void;
  systemVoltage: 12 | 24 | 48;
  setSystemVoltage: (v: 12 | 24 | 48) => void;
  daysAutonomy: number;
  setDaysAutonomy: (days: number) => void;
  alternatorAmps: number;
  setAlternatorAmps: (amps: number) => void;
  motoringHoursPerDay: number;
  setMotoringHoursPerDay: (hours: number) => void;
  shorepower: 'no' | 'sometimes' | 'often';
  setShorepower: (val: 'no' | 'sometimes' | 'often') => void;
  deratingFactor: number;
  setDeratingFactor: (factor: number) => void;
}

export const initialState = {
  boatModelId: null as string | null,
  crewSize: 2,
  solarPanelWatts: 0,
  panelType: 'rigid' as PanelType,
  appliances: [] as Appliance[],
  viewMode: 'anchor' as ViewMode,
  latitude: 36.0,
  longitude: 14.5,
  regionName: 'Mediterranean',
  batteryChemistry: 'lifepo4' as const,
  systemVoltage: 12 as const,
  daysAutonomy: 3,
  alternatorAmps: 75,
  motoringHoursPerDay: 1.5,
  shorepower: 'no' as const,
  deratingFactor: 0.75,
};

export const useSolarStore = create<SolarState>()(
  persist(
    (set) => ({
      ...initialState,
      setBoatModelId: (id) => set({ boatModelId: id }),
      setCrewSize: (size) => set({ crewSize: size }),
      setSolarPanelWatts: (watts) => set({ solarPanelWatts: watts }),
      setPanelType: (type) => set({ panelType: type }),
      setAppliances: (appliances) => set({ appliances }),
      toggleAppliance: (id) =>
        set((state) => ({
          appliances: state.appliances.map((a) =>
            a.id === id ? { ...a, enabled: !a.enabled } : a
          ),
        })),
      updateApplianceHours: (id, mode, hours) =>
        set((state) => ({
          appliances: state.appliances.map((a) =>
            a.id === id
              ? mode === 'anchor'
                ? { ...a, hoursPerDayAnchor: hours }
                : { ...a, hoursPerDayPassage: hours }
              : a
          ),
        })),
      removeAppliance: (id) =>
        set((state) => ({
          appliances: state.appliances.filter((a) => a.id !== id),
        })),
      updateApplianceWatts: (id, watts) =>
        set((state) => ({
          appliances: state.appliances.map((a) =>
            a.id === id ? { ...a, wattsTypical: watts } : a
          ),
        })),
      setViewMode: (mode) => set({ viewMode: mode }),
      setLocation: (lat, lon, name) =>
        set({ latitude: lat, longitude: lon, regionName: name }),
      setBatteryChemistry: (chem) => set({ batteryChemistry: chem }),
      setSystemVoltage: (v) => set({ systemVoltage: v }),
      setDaysAutonomy: (days) => set({ daysAutonomy: days }),
      setAlternatorAmps: (amps) => set({ alternatorAmps: amps }),
      setMotoringHoursPerDay: (hours) => set({ motoringHoursPerDay: hours }),
      setShorepower: (val) => set({ shorepower: val }),
      setDeratingFactor: (factor) => set({ deratingFactor: factor }),
    }),
    {
      name: 'above-deck-solar',
      partialize: (state) => ({
        boatModelId: state.boatModelId,
        crewSize: state.crewSize,
        solarPanelWatts: state.solarPanelWatts,
        panelType: state.panelType,
        appliances: state.appliances,
        viewMode: state.viewMode,
        latitude: state.latitude,
        longitude: state.longitude,
        regionName: state.regionName,
        batteryChemistry: state.batteryChemistry,
        systemVoltage: state.systemVoltage,
        daysAutonomy: state.daysAutonomy,
        alternatorAmps: state.alternatorAmps,
        motoringHoursPerDay: state.motoringHoursPerDay,
        shorepower: state.shorepower,
        deratingFactor: state.deratingFactor,
      }),
    }
  )
);
