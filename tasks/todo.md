# TODO

All work is tracked via [GitHub Issues](https://github.com/curphey/above-deck/issues).
This file exists for quick local notes only — the issue tracker is the source of truth.

## Open PRs (2026-03-24 session)

- **#210** — Agent tools: weather, AIS, time via Claude tool_use (Go backend) — Closes #209
- **#211** — Chart layer panel + vessel type filtering + rotated icons — Closes #208
- **#212** — AIS LCD data bridge + voice log export + nav + home screen — Closes #182
- **#213** — Pacific-centered global chart view — Closes #218
- **#214** — Nautical POI layer from OpenStreetMap Overpass — Closes #216
- **#215** — Cruising seasons overlay (cyclone zones, transit windows) — Closes #217

## Merge order suggestion

1. #210 (Go backend, no conflicts)
2. #211 (chart store changes, base for others)
3. #212 (VHF store bridge, nav updates)
4. #213 (chart page props, trivial)
5. #214 (new component, independent)
6. #215 (new component, independent)
