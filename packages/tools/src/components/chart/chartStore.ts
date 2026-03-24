import { create } from 'zustand';

export interface ChartVessel {
  name: string;
  callSign: string;
  lat: number;
  lon: number;
  sog: number;
  cog: number;
  type: string;
}

export interface ChartWeather {
  windSpeedKnots: number;
  windDirection: number;
  seaState: string;
  visibility: string;
}

export interface OwnPosition {
  lat: number;
  lon: number;
  sog: number;
  cog: number;
}

export type Orientation = 'north-up' | 'head-up' | 'course-up';

export interface LayerVisibility {
  seamarks: boolean;
  aisVessels: boolean;
  weather: boolean;
  rangeRings: boolean;
}

export const VESSEL_TYPES = ['Sailing', 'Cargo', 'Fishing', 'Passenger', 'Tanker', 'Pleasure craft', 'Vessel'] as const;
export type VesselType = typeof VESSEL_TYPES[number];

export type VesselTypeFilter = Record<string, boolean>;

interface ChartState {
  vessels: ChartVessel[];
  ownPosition: OwnPosition;
  weather: ChartWeather;
  activeRadioTarget: string | null;
  orientation: Orientation;
  layers: LayerVisibility;
  vesselTypeFilter: VesselTypeFilter;
  layerPanelOpen: boolean;
  setVessels: (vessels: ChartVessel[]) => void;
  setOwnPosition: (pos: OwnPosition) => void;
  setWeather: (weather: ChartWeather) => void;
  setActiveRadioTarget: (id: string | null) => void;
  setOrientation: (o: Orientation) => void;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  toggleVesselType: (type: string) => void;
  setLayerPanelOpen: (open: boolean) => void;
  // Backward compat
  showRangeRings: boolean;
  setShowRangeRings: (show: boolean) => void;
}

const defaultVesselTypeFilter: VesselTypeFilter = {
  Sailing: true,
  Cargo: true,
  Fishing: true,
  Passenger: false,
  Tanker: false,
  'Pleasure craft': true,
  Vessel: true,
};

const initialState = {
  vessels: [] as ChartVessel[],
  ownPosition: { lat: 50.09, lon: -5.04, sog: 0, cog: 0 } as OwnPosition,
  weather: { windSpeedKnots: 0, windDirection: 0, seaState: 'calm', visibility: 'good' } as ChartWeather,
  activeRadioTarget: null as string | null,
  orientation: 'north-up' as Orientation,
  layers: { seamarks: true, aisVessels: true, weather: true, rangeRings: true } as LayerVisibility,
  vesselTypeFilter: { ...defaultVesselTypeFilter } as VesselTypeFilter,
  layerPanelOpen: false,
  showRangeRings: true,
};

export const useChartStore = create<ChartState>()((set) => ({
  ...initialState,
  setVessels: (vessels) => set({ vessels }),
  setOwnPosition: (ownPosition) => set({ ownPosition }),
  setWeather: (weather) => set({ weather }),
  setActiveRadioTarget: (activeRadioTarget) => set({ activeRadioTarget }),
  setOrientation: (orientation) => set({ orientation }),
  toggleLayer: (layer) => set((s) => ({
    layers: { ...s.layers, [layer]: !s.layers[layer] },
    // Keep showRangeRings in sync
    ...(layer === 'rangeRings' ? { showRangeRings: !s.layers.rangeRings } : {}),
  })),
  toggleVesselType: (type) => set((s) => ({
    vesselTypeFilter: { ...s.vesselTypeFilter, [type]: !s.vesselTypeFilter[type] },
  })),
  setLayerPanelOpen: (layerPanelOpen) => set({ layerPanelOpen }),
  setShowRangeRings: (showRangeRings) => set((s) => ({
    showRangeRings,
    layers: { ...s.layers, rangeRings: showRangeRings },
  })),
}));

(useChartStore as any).getInitialState = () => initialState;
