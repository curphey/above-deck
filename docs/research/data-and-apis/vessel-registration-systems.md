# Vessel Registration & Identification Systems

## Identifier Types

| System | Format | Scope | Persistence | Used By |
|--------|--------|-------|-------------|---------|
| **MMSI** | 9 digits (e.g., 235001234) | Global | Tied to flag state + vessel | VHF/DSC, AIS, GMDSS |
| **IMO Number** | 7 digits (e.g., 9074729) | Commercial >100GT | Permanent (hull lifetime) | Shipping registers, port state control |
| **Call Sign** | 4-7 chars (e.g., MDMX9) | Global | Assigned with MMSI | VHF radio communications |
| **HIN** | 12 chars (e.g., ABC12345A404) | US mandatory since 1972 | Stamped into hull | Manufacturing, insurance, theft recovery |
| **Official Number** | Country-specific | National | Per registration | Flag state administration |

## MMSI Structure

- Digits 1-3: **MID** (Maritime Identification Digit) = country code
  - 230-239: UK
  - 303-303: US
  - 226-228: France
  - 201-201: Greece
- Digits 4-9: Unique vessel ID within that country

**MMSI is the universal digital identifier.** It's what AIS broadcasts, what DSC calls target, and what ties a vessel to its registration. Any "boat profile" in the platform should be keyed to MMSI.

## Flag State Registries

| Country | Registry | URL | Notes |
|---------|----------|-----|-------|
| UK | MCA Ship Register | gov.uk | SSR (simple) or Part 1 (full) |
| US | USCG Documentation | uscg.mil | >5 net tons, or state registration |
| France | Affaires Maritimes | mer.gouv.fr | |
| Cayman Islands | CISR | cishipping.com | Popular flag of convenience |
| Marshall Islands | IRI | register-iri.com | Largest registry by tonnage |

## Data Sources for Lookups

- **MarineTraffic.com** — AIS-based vessel tracking, searchable by MMSI/IMO/name
- **VesselFinder.com** — Similar, free tier available
- **ITU MARS** — Official MMSI database (maritime.itu.int)
- **Equasis.org** — EU-funded ship safety database (IMO registered vessels)

## Platform Implications

1. **Boat profile keyed to MMSI** — universal, globally unique, already in every AIS/DSC message
2. **Auto-populate from AIS** — when user enters MMSI, fetch vessel details from MarineTraffic/AIS cache
3. **Social features** — follow boats by MMSI, see where friends are via AIS
4. **VHF integration** — DSC calls use MMSI, so the VHF sim already has this data model
5. **Cross-reference** — link MMSI to IMO (commercial) and HIN (US recreational) for full identification
