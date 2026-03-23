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

type Orientation = 'north-up' | 'head-up' | 'course-up';

interface ChartState {
  vessels: ChartVessel[];
  ownPosition: OwnPosition;
  weather: ChartWeather;
  activeRadioTarget: string | null;
  orientation: Orientation;
  showRangeRings: boolean;
  setVessels: (vessels: ChartVessel[]) => void;
  setOwnPosition: (pos: OwnPosition) => void;
  setWeather: (weather: ChartWeather) => void;
  setActiveRadioTarget: (id: string | null) => void;
  setOrientation: (o: Orientation) => void;
  setShowRangeRings: (show: boolean) => void;
}

const initialState = {
  vessels: [] as ChartVessel[],
  ownPosition: { lat: 50.09, lon: -5.04, sog: 0, cog: 0 } as OwnPosition,
  weather: { windSpeedKnots: 0, windDirection: 0, seaState: 'calm', visibility: 'good' } as ChartWeather,
  activeRadioTarget: null as string | null,
  orientation: 'north-up' as Orientation,
  showRangeRings: true,
};

export const useChartStore = create<ChartState>()((set) => ({
  ...initialState,
  setVessels: (vessels) => set({ vessels }),
  setOwnPosition: (ownPosition) => set({ ownPosition }),
  setWeather: (weather) => set({ weather }),
  setActiveRadioTarget: (activeRadioTarget) => set({ activeRadioTarget }),
  setOrientation: (orientation) => set({ orientation }),
  setShowRangeRings: (showRangeRings) => set({ showRangeRings }),
}));

(useChartStore as any).getInitialState = () => initialState;
