# Chart Layers Design

**Goal:** Add a layer toggle panel, vessel type filtering, rotated vessel icons, and marina markers to the chartplotter.

## Components

### 1. ChartLayerPanel.tsx
Floating collapsible panel, top-left of chart. Blueprint-dark glass aesthetic matching existing controls.

**Collapsed state:** Single icon button (stacked layers icon "☰")
**Expanded state:** Panel showing:
- **Layers section:** Toggle switches for:
  - OpenSeaMap marks (default: on)
  - AIS vessels (default: on)
  - Weather overlay (default: on)
  - Range rings (default: on)
  - Marinas (default: on)
- **Vessel filter section:** Checkboxes for vessel types:
  - Sailing (default: on)
  - Cargo (default: on)
  - Fishing (default: on)
  - Passenger (default: off — reduces clutter)
  - Tanker (default: off)
  - Other (default: on)

Panel width: ~180px. Uses Fira Code 11px, brand colors.

### 2. chartStore.ts additions
```
layerVisibility: {
  seamarks: boolean     // OpenSeaMap overlay
  aisVessels: boolean   // AIS target layer
  weather: boolean      // Weather overlay
  rangeRings: boolean   // Existing, move here
  marinas: boolean      // Marina markers
}
vesselTypeFilter: Record<string, boolean>  // "Sailing" → true, "Cargo" → true, etc.
layerPanelOpen: boolean
```

### 3. ChartVesselLayer.tsx updates
- Replace circle markers with **rotated triangle SVG markers** pointing in COG direction
- Apply `vesselTypeFilter` — skip rendering vessels whose type is filtered out
- Own vessel stays as green circle (distinct from AIS targets)

### 4. ChartMarinasLayer.tsx
- Render marina/harbour markers from region agent data (agent.Metadata or hardcoded list)
- Click popup: marina name, VHF channel, position
- Blue anchor icon (⚓) style marker

## Data Flow
- Layer panel toggles → chartStore → components read visibility flags
- Vessel type filter → chartStore → ChartVesselLayer filters before rendering
- Marina data comes from region definition passed via WebSocket world_update or hardcoded per-region

## Testing
- chartStore: test layer visibility toggles and vessel type filter state
- ChartLayerPanel: test render, toggle callbacks, collapsed/expanded states
- ChartVesselLayer: test filtering by vessel type
