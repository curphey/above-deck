import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Appliance, PanelType, EquipmentInstance } from '@/lib/solar/types';

export type ViewMode = 'anchor' | 'passage';

interface SolarState {
  // --- New fields (v3) ---
  boatName: string;
  templateId: string | null;
  acCircuitVoltage: 110 | 220;
  equipment: EquipmentInstance[];

  // --- New actions (v3) ---
  setBoat: (
    templateId: string | null,
    name: string,
    equipment: EquipmentInstance[],
    voltage: 12 | 24 | 48,
    acVoltage: 110 | 220,
  ) => void;
  setAcCircuitVoltage: (v: 110 | 220) => void;
  addEquipment: (item: EquipmentInstance) => void;
  updateEquipment: (id: string, updates: Partial<EquipmentInstance>) => void;
  removeEquipment: (id: string) => void;
  toggleEquipment: (id: string) => void;
  duplicateEquipment: (id: string) => void;
  setEquipment: (items: EquipmentInstance[]) => void;

  // --- Legacy fields (kept for existing components) ---
  /** @deprecated Use templateId instead */
  boatModelId: string | null;
  /** @deprecated Use setBoat instead */
  setBoatModelId: (id: string | null) => void;
  crewSize: number;
  setCrewSize: (size: number) => void;
  /** @deprecated Use equipment array with ChargeEquipment instead */
  solarPanelWatts: number;
  /** @deprecated Use equipment array with ChargeEquipment instead */
  setSolarPanelWatts: (watts: number) => void;
  /** @deprecated Use equipment array with ChargeEquipment instead */
  panelType: PanelType;
  /** @deprecated Use equipment array with ChargeEquipment instead */
  setPanelType: (type: PanelType) => void;
  /** @deprecated Use equipment array instead */
  appliances: Appliance[];
  /** @deprecated Use setEquipment instead */
  setAppliances: (appliances: Appliance[]) => void;
  /** @deprecated Use toggleEquipment instead */
  toggleAppliance: (id: string) => void;
  /** @deprecated Use updateEquipment instead */
  updateApplianceHours: (id: string, mode: 'anchor' | 'passage', hours: number) => void;
  /** @deprecated Use removeEquipment instead */
  removeAppliance: (id: string) => void;
  /** @deprecated Use updateEquipment instead */
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
  /** @deprecated Use equipment array with ChargeEquipment instead */
  alternatorAmps: number;
  /** @deprecated Use equipment array with ChargeEquipment instead */
  setAlternatorAmps: (amps: number) => void;
  /** @deprecated Use equipment array with ChargeEquipment instead */
  motoringHoursPerDay: number;
  /** @deprecated Use equipment array with ChargeEquipment instead */
  setMotoringHoursPerDay: (hours: number) => void;
  journeyType: 'plan' | 'check' | 'upgrade';
  setJourneyType: (type: 'plan' | 'check' | 'upgrade') => void;
  /** @deprecated Use equipment array with ChargeEquipment instead */
  shorePowerHoursPerDay: number;
  /** @deprecated Use equipment array with ChargeEquipment instead */
  setShorePowerHoursPerDay: (hours: number) => void;
  /** @deprecated Use equipment array with ChargeEquipment instead */
  shoreChargerAmps: number;
  /** @deprecated Use equipment array with ChargeEquipment instead */
  setShoreChargerAmps: (amps: number) => void;
  /** @deprecated Use equipment array with StoreEquipment instead */
  batteryBankAh: number;
  /** @deprecated Use equipment array with StoreEquipment instead */
  setBatteryBankAh: (ah: number) => void;
  deratingFactor: number;
  setDeratingFactor: (factor: number) => void;
}

export const initialState = {
  // New fields
  boatName: '',
  templateId: null as string | null,
  acCircuitVoltage: 220 as 110 | 220,
  equipment: [] as EquipmentInstance[],

  // Legacy fields
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
  journeyType: 'plan' as const,
  shorePowerHoursPerDay: 0,
  shoreChargerAmps: 30,
  batteryBankAh: 0,
  deratingFactor: 0.75,
};

export const useSolarStore = create<SolarState>()(
  persist(
    (set) => ({
      ...initialState,

      // --- New actions ---
      setBoat: (templateId, name, equipment, voltage, acVoltage) =>
        set({
          templateId,
          boatName: name,
          equipment,
          systemVoltage: voltage,
          acCircuitVoltage: acVoltage,
        }),
      setAcCircuitVoltage: (v) => set({ acCircuitVoltage: v }),
      addEquipment: (item) =>
        set((state) => ({ equipment: [...state.equipment, item] })),
      updateEquipment: (id, updates) =>
        set((state) => ({
          equipment: state.equipment.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),
      removeEquipment: (id) =>
        set((state) => ({
          equipment: state.equipment.filter((e) => e.id !== id),
        })),
      toggleEquipment: (id) =>
        set((state) => ({
          equipment: state.equipment.map((e) =>
            e.id === id ? { ...e, enabled: !e.enabled } : e
          ),
        })),
      duplicateEquipment: (id) =>
        set((state) => {
          const item = state.equipment.find((e) => e.id === id);
          if (!item) return state;
          const copy = {
            ...item,
            id: `${item.id}-${Date.now()}`,
            origin: 'added' as const,
          };
          return { equipment: [...state.equipment, copy] };
        }),
      setEquipment: (items) => set({ equipment: items }),

      // --- Legacy actions ---
      /** @deprecated */
      setBoatModelId: (id) => set({ boatModelId: id }),
      setCrewSize: (size) => set({ crewSize: size }),
      /** @deprecated */
      setSolarPanelWatts: (watts) => set({ solarPanelWatts: watts }),
      /** @deprecated */
      setPanelType: (type) => set({ panelType: type }),
      /** @deprecated */
      setAppliances: (appliances) => set({ appliances }),
      /** @deprecated */
      toggleAppliance: (id) =>
        set((state) => ({
          appliances: state.appliances.map((a) =>
            a.id === id ? { ...a, enabled: !a.enabled } : a
          ),
        })),
      /** @deprecated */
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
      /** @deprecated */
      removeAppliance: (id) =>
        set((state) => ({
          appliances: state.appliances.filter((a) => a.id !== id),
        })),
      /** @deprecated */
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
      /** @deprecated */
      setAlternatorAmps: (amps) => set({ alternatorAmps: amps }),
      /** @deprecated */
      setMotoringHoursPerDay: (hours) => set({ motoringHoursPerDay: hours }),
      setJourneyType: (type) => set({ journeyType: type }),
      /** @deprecated */
      setShorePowerHoursPerDay: (hours) => set({ shorePowerHoursPerDay: hours }),
      /** @deprecated */
      setShoreChargerAmps: (amps) => set({ shoreChargerAmps: amps }),
      /** @deprecated */
      setBatteryBankAh: (ah) => set({ batteryBankAh: ah }),
      setDeratingFactor: (factor) => set({ deratingFactor: factor }),
    }),
    {
      name: 'above-deck-solar',
      partialize: (state) => ({
        // New fields
        boatName: state.boatName,
        templateId: state.templateId,
        acCircuitVoltage: state.acCircuitVoltage,
        equipment: state.equipment,
        // Legacy fields
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
        journeyType: state.journeyType,
        shorePowerHoursPerDay: state.shorePowerHoursPerDay,
        shoreChargerAmps: state.shoreChargerAmps,
        batteryBankAh: state.batteryBankAh,
        deratingFactor: state.deratingFactor,
      }),
    }
  )
);
