import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RouteWaypoint {
  name: string;
  lat: number;
  lon: number;
  arriveMonth: number; // 1-12
  arriveYear: number;  // relative year (1, 2, 3...)
  departMonth: number;
  stayWeeks: number;
  notes: string;
  /** Safety status for this location in arrive month */
  seasonStatus: 'safe' | 'caution' | 'danger';
}

export interface RoutePlan {
  waypoints: RouteWaypoint[];
  totalYears: number;
  generatedAt: string;
  summary: string;
}

export type TripDuration = 3 | 4 | 5;
export type Direction = 'eastabout' | 'westabout';

interface RoutePlannerState {
  // Inputs
  departureLat: number;
  departureLon: number;
  departureName: string;
  departureMonth: number;
  departureYear: number;
  tripDuration: TripDuration;
  direction: Direction;
  boatSpeed: number; // average passage speed in knots
  preferences: string; // free text

  // Output
  plan: RoutePlan | null;
  loading: boolean;
  error: string | null;

  // API
  apiKey: string;

  // Actions
  setDeparture: (name: string, lat: number, lon: number) => void;
  setDepartureMonth: (month: number) => void;
  setDepartureYear: (year: number) => void;
  setTripDuration: (d: TripDuration) => void;
  setDirection: (d: Direction) => void;
  setBoatSpeed: (s: number) => void;
  setPreferences: (p: string) => void;
  setPlan: (plan: RoutePlan | null) => void;
  setLoading: (l: boolean) => void;
  setError: (e: string | null) => void;
  setApiKey: (k: string) => void;
}

export const useRoutePlannerStore = create<RoutePlannerState>()(
  persist(
    (set) => ({
      departureLat: 36.14,
      departureLon: -5.35,
      departureName: 'Gibraltar',
      departureMonth: 9,
      departureYear: 2026,
      tripDuration: 3,
      direction: 'westabout',
      boatSpeed: 6,
      preferences: '',
      plan: null,
      loading: false,
      error: null,
      apiKey: '',

      setDeparture: (name, lat, lon) => set({ departureName: name, departureLat: lat, departureLon: lon }),
      setDepartureMonth: (departureMonth) => set({ departureMonth }),
      setDepartureYear: (departureYear) => set({ departureYear }),
      setTripDuration: (tripDuration) => set({ tripDuration }),
      setDirection: (direction) => set({ direction }),
      setBoatSpeed: (boatSpeed) => set({ boatSpeed }),
      setPreferences: (preferences) => set({ preferences }),
      setPlan: (plan) => set({ plan }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setApiKey: (apiKey) => set({ apiKey }),
    }),
    {
      name: 'above-deck-route-planner',
      partialize: (s) => ({
        apiKey: s.apiKey,
        departureName: s.departureName,
        departureLat: s.departureLat,
        departureLon: s.departureLon,
        departureMonth: s.departureMonth,
        departureYear: s.departureYear,
        tripDuration: s.tripDuration,
        direction: s.direction,
        boatSpeed: s.boatSpeed,
        preferences: s.preferences,
      }),
    },
  ),
);
