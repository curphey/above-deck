# Equipment Catalog Design

## Goal

Replace hard-coded equipment templates with a Supabase-backed catalog of real marine products (Schenker watermakers, Fischer Panda gensets, Victron solar, etc.) alongside generic defaults. Users select real products with locked specs, or create custom items with editable specs.

## Database Schema

A single `equipment_catalog` table replaces both `power_consumers` and `product_specs`:

```sql
equipment_catalog (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type          text NOT NULL,          -- 'drain' | 'charge' | 'store'
  category      text NOT NULL,          -- 'navigation', 'solar', 'lifepo4', etc.
  make          text,                   -- NULL for generic items
  model         text,                   -- NULL for generic items
  year          int,                    -- model year, NULL for generic
  latest        boolean DEFAULT true,   -- default filter to latest models
  name          text NOT NULL,          -- display name: "Schenker Zen 30" or "Watermaker (generic)"
  specs         jsonb NOT NULL,         -- type-specific fields
  source_url    text,                   -- provenance URL
  created_at    timestamptz DEFAULT now()
)
```

### Specs JSONB by type

**Drain:** `{ wattsTypical, wattsMin, wattsMax, hoursPerDayAnchor, hoursPerDayPassage, dutyCycle, crewScaling, powerType }`

**Charge:** `{ sourceType, panelWatts, panelType, alternatorAmps, motoringHoursPerDay, shoreChargerAmps, shoreHoursPerDay }`

**Store:** `{ chemistry, capacityAh }`

RLS: public read access.

## Equipment Coverage (~150 real products + ~20 generic)

### Drains

| Category | Manufacturers | ~Count |
|---|---|---|
| Watermakers | Schenker, Spectra, Katadyn, Rainman, Village Marine | 12-15 |
| Gensets | Fischer Panda, Paguro, Onan/Cummins, Mastervolt, WhisperPower | 10-12 |
| Refrigeration | Isotherm, Vitrifrigo, Engel, Frigoboat, Dometic | 10-12 |
| Autopilots | Raymarine, B&G, Garmin, Simrad | 8-10 |
| Chartplotters | Raymarine, Garmin, B&G, Simrad, Furuno | 8-10 |
| Radar | Raymarine, Garmin, Furuno, Simrad | 6-8 |
| Windlasses | Lewmar, Quick, Maxwell, Lofrans | 6-8 |
| AIS | Vesper, Raymarine, em-trak, Digital Yacht | 6-8 |
| Lighting | Hella Marine, Lopolight, Aqua Signal + generic | 4-6 |
| Water/comfort | Jabsco pumps + generic defaults | 8-10 |

### Charge Sources

| Category | Manufacturers | ~Count |
|---|---|---|
| Solar panels | Victron, Renogy, SunPower, Rich Solar, BougeRV | 12-15 |
| Alternators | Balmar, Mastervolt, Electromaax, generic | 6-8 |
| Shore chargers | Victron, Mastervolt, Sterling, ProMariner | 6-8 |

### Storage

| Category | Manufacturers | ~Count |
|---|---|---|
| LiFePO4 | Victron, Battle Born, Relion, Lithionics, SOK, Epoch | 12-15 |
| AGM | Lifeline, Rolls/Surrette, Trojan, Firefly | 6-8 |

## Application Integration

### Origin types

Extend `origin` from `'stock' | 'added'` to `'stock' | 'catalog' | 'custom'`:

- `stock` — came with boat template
- `catalog` — selected from real product catalog (locked specs)
- `custom` — user-defined (editable specs)

### AddEquipmentModal changes

1. Query `equipment_catalog` filtered by `type` and `latest = true` on open
2. Group by `category` (existing tab structure)
3. Search across `name`, `make`, `model`
4. Show make + model + key spec per item; "Generic" badge for unbranded
5. Set `catalogId` and `origin: 'catalog'` on selection
6. "Show older models" toggle reveals `latest = false` items
7. "Add custom" button for user-defined items

### Locked vs editable specs

- `origin === 'catalog'` — specs displayed read-only in equipment drawer
- `origin === 'custom'` — specs editable as today

### Data loading

`useEquipmentCatalog()` hook using TanStack Query with `staleTime: Infinity`. Single query on modal open, client-side filtering by category.

## Migration Strategy

1. New migration creates `equipment_catalog` table
2. Seed file populates all products
3. Old tables (`power_consumers`, `product_specs`) left in place — not deleted
4. `AddEquipmentModal` rewired to use new hook
5. Equipment drawer updated for read-only catalog specs

## Not Building

- No admin UI for catalog management
- No scraping infrastructure
- No product images
- No pricing data
- No product comparison features
