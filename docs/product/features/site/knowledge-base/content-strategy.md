# Knowledge Base — Content Generation Strategy & Content Management

**Date:** 2026-03-31
**Status:** Draft v1
**Companion to:** `spec.md` (KB feature spec), `ai-strategy.md`, community-curated-kb-and-rag-safety research
**License:** GPL — 100% free and open source

---

## Overview

This document covers two things:

1. **Content Generation Strategy** — how to produce 50-80 high-quality KB articles using AI-assisted drafting from existing research, open-source content sources, and editorial curation.
2. **Content Administration** — how the KB is managed day-to-day: admin dashboard, editorial workflow, content maintenance, editorial standards, and success metrics.

The KB spec (`spec.md`) defines what the KB is — data model, RAG integration, user features. This document defines how content gets created and maintained.

---

# PART 1: CONTENT GENERATION STRATEGY

## 1. Seed Content Plan

The KB needs enough content at launch to feel substantial. The target is **50-80 articles at launch** across all doc types and topics. 50-80 gives a solid foundation with content in every major topic area.

### 1.1 Existing Content Inventory

The following 15 articles already exist as MDX drafts in `packages/site/src/content/knowledge/`:

| Article | Doc Type | Topic Area | Status |
|---------|----------|------------|--------|
| AIS Explained | guide | Communications > AIS | Drafted |
| Caribbean Cruising Guide | guide | Cruising | Drafted |
| Choosing a Boat Computer | guide | Boat Systems > Electronics | Drafted |
| Diesel Engine Maintenance | how-to | Maintenance > Engines | Drafted |
| Marine Software Landscape | reference | Boat Systems > Electronics | Drafted |
| NMEA 2000 Explained | guide | Boat Systems > Electrical > NMEA 2000 | Drafted |
| Passage Planning Guide | tutorial | Navigation > Passage Planning | Drafted |
| Provisioning for Passages | guide | Cruising > Provisioning | Drafted |
| Safety Equipment Checklist | reference | Safety | Drafted |
| Solar Sizing Guide | how-to | Boat Systems > Electrical > Solar & Charging | Drafted |
| Tidal Prediction Basics | guide | Navigation > Tides | Drafted |
| Understanding 12V Systems | guide | Boat Systems > Electrical | Drafted |
| Understanding Electronic Charts | guide | Navigation > Charts & Plotting | Drafted |
| Watermaker Basics | guide | Maintenance > Plumbing | Drafted |
| Weather Data Sources | reference | Navigation > Weather | Drafted |

These 15 articles provide the starting foundation. They need editorial review and promotion from draft to published.

### 1.2 Complete Seed Content Plan by Topic

The full article plan below targets 75 articles across all topics. Priority levels: **P1** = must-have for launch, **P2** = should-have within first month, **P3** = nice-to-have, lower priority. Effort: **S** = short (< 1,500 words), **M** = medium (1,500-3,000 words), **L** = long (3,000+ words).

#### Navigation (16 articles)

| # | Article Title | Doc Type | Priority | Effort | Source Material | Status |
|---|--------------|----------|----------|--------|----------------|--------|
| 1 | Understanding Electronic Charts | guide | P1 | M | `s57-enc-chart-rendering.md`, `mapping-and-chart-technology.md` | Drafted |
| 2 | S-57 ENC Chart Format | spec | P2 | M | `s57-enc-chart-rendering.md` | Not started |
| 3 | Chart Datum and Projections | reference | P2 | S | `mapping-and-chart-technology.md` | Not started |
| 4 | IALA Buoyage Systems A and B | reference | P1 | M | Public domain (IALA) | Not started |
| 5 | Tidal Prediction Basics | guide | P1 | M | `tides-and-currents.md` | Drafted |
| 6 | Tidal Harmonics and Constituents | reference | P2 | L | `tides-and-currents.md` | Not started |
| 7 | Reading Tidal Diamonds and Stream Atlases | how-to | P1 | S | `tides-and-currents.md` | Not started |
| 8 | Weather Data Sources for Sailors | reference | P1 | M | `marine-weather-deep-dive.md`, `weather-data-sources.mdx` | Drafted |
| 9 | Reading GRIB Files and Weather Models | how-to | P2 | M | `marine-weather-deep-dive.md` | Not started |
| 10 | Understanding Weather Routing | guide | P2 | M | `fastseas-and-weather-routing-research.md` | Not started |
| 11 | Passage Planning Step by Step | tutorial | P1 | L | `passage-planning-workflows.md` | Drafted |
| 12 | Passage Planning Checklist | reference | P1 | S | `passage-planning-workflows.md` | Not started |
| 13 | Choosing a Weather Routing Tool | guide | P3 | M | `fastseas-and-weather-routing-research.md`, competitive research | Not started |
| 14 | Understanding Radar for Sailing | guide | P2 | M | `weather-routing-radar-autopilot-deep-dive.md` | Not started |
| 15 | Autopilot Systems for Sailing | guide | P2 | M | `weather-routing-radar-autopilot-deep-dive.md` | Not started |
| 16 | Celestial Navigation Basics | guide | P3 | M | No existing research | Not started |

#### Boat Systems — Electrical (12 articles)

| # | Article Title | Doc Type | Priority | Effort | Source Material | Status |
|---|--------------|----------|----------|--------|----------------|--------|
| 17 | Understanding 12V Electrical Systems | guide | P1 | L | `boat-systems-monitoring.md` | Drafted |
| 18 | 24V vs 12V Systems | guide | P2 | M | `sailor-hardware-landscape.md` | Not started |
| 19 | NMEA 2000 Explained | guide | P1 | L | `nmea2000-pgn-field-specifications.md`, `can-bus-technology.md` | Drafted |
| 20 | NMEA 2000 PGN Reference | spec | P1 | L | `nmea2000-pgn-field-specifications.md`, `nmea2000-pgn-field-specs.md` | Not started |
| 21 | NMEA 0183 vs NMEA 2000 | reference | P2 | S | `nmea2000-pgn-field-specifications.md`, `sailor-hardware-landscape.md` | Not started |
| 22 | CAN Bus Technology for Marine Use | reference | P3 | M | `can-bus-technology.md` | Not started |
| 23 | Solar Panel Sizing for Boats | how-to | P1 | M | `solar-energy-research.md` | Drafted |
| 24 | Solar System Design and Installation | guide | P2 | L | `solar-energy-research.md`, `pvgis-solar-data.md` | Not started |
| 25 | Battery Chemistry Comparison | reference | P1 | M | `sailor-hardware-landscape.md` (section 3) | Not started |
| 26 | Victron System Integration | how-to | P1 | L | `victron-and-j1939-protocols.md`, `boat-systems-monitoring.md` | Not started |
| 27 | Victron VE.Direct Protocol | spec | P2 | M | `victron-and-j1939-protocols.md` | Not started |
| 28 | Shore Power Safety | guide | P1 | M | Safety-critical — human-authored only | Not started |

#### Boat Systems — Engines & Propulsion (4 articles)

| # | Article Title | Doc Type | Priority | Effort | Source Material | Status |
|---|--------------|----------|----------|--------|----------------|--------|
| 29 | Diesel Engine Maintenance | how-to | P1 | M | — | Drafted |
| 30 | J1939 Engine Data Protocol | spec | P3 | M | `victron-and-j1939-protocols.md` | Not started |
| 31 | Engine Monitoring with Above Deck | how-to | P3 | M | `victron-and-j1939-protocols.md`, `boat-systems-monitoring.md` | Not started |
| 32 | Understanding Engine Alarms | reference | P2 | S | `boat-systems-monitoring.md` | Not started |

#### Communications (8 articles)

| # | Article Title | Doc Type | Priority | Effort | Source Material | Status |
|---|--------------|----------|----------|--------|----------------|--------|
| 33 | AIS Explained | guide | P1 | M | — | Drafted |
| 34 | AIS Class A vs Class B | reference | P2 | S | `sailor-hardware-landscape.md` | Not started |
| 35 | VHF Radio Procedures | guide | P1 | L | Safety-critical — human-authored, ITU refs | Not started |
| 36 | DSC Distress Calling | how-to | P1 | M | Safety-critical — human-authored, ITU refs | Not started |
| 37 | MMSI Registration Guide | how-to | P1 | S | Public domain (national authorities) | Not started |
| 38 | Satellite Communications for Cruisers | guide | P2 | M | `sailor-hardware-landscape.md` (section 4) | Not started |
| 39 | SSB and HF Radio | guide | P3 | M | `sailor-hardware-landscape.md` | Not started |
| 40 | Marine Radio Frequencies | reference | P1 | S | Public domain (ITU) | Not started |

#### Safety (8 articles)

| # | Article Title | Doc Type | Priority | Effort | Source Material | Status |
|---|--------------|----------|----------|--------|----------------|--------|
| 41 | Safety Equipment Checklist | reference | P1 | M | — | Drafted |
| 42 | COLREGs Overview | guide | P1 | L | Safety-critical — human-authored, public domain (USCG/IMO) | Not started |
| 43 | Right of Way Rules Explained | guide | P1 | M | Safety-critical — human-authored | Not started |
| 44 | Man Overboard Procedures | how-to | P1 | M | Safety-critical — human-authored | Not started |
| 45 | Fire Safety on Boats | guide | P1 | M | Safety-critical — human-authored | Not started |
| 46 | LPG Safety on Boats | guide | P1 | M | Safety-critical — human-authored | Not started |
| 47 | Heavy Weather Preparation | guide | P2 | M | Safety-critical — human-authored | Not started |
| 48 | Emergency Procedures Checklist | reference | P1 | S | Safety-critical — human-authored | Not started |

#### Maintenance (5 articles)

| # | Article Title | Doc Type | Priority | Effort | Source Material | Status |
|---|--------------|----------|----------|--------|----------------|--------|
| 49 | Watermaker Basics | guide | P1 | M | — | Drafted |
| 50 | Antifouling and Hull Maintenance | how-to | P2 | M | No existing research | Not started |
| 51 | Rigging Inspection Checklist | reference | P2 | S | No existing research | Not started |
| 52 | Winterising Your Boat | how-to | P3 | M | No existing research | Not started |
| 53 | Through-Hull Fittings and Seacocks | how-to | P2 | S | No existing research | Not started |

#### Cruising & Administration (7 articles)

| # | Article Title | Doc Type | Priority | Effort | Source Material | Status |
|---|--------------|----------|----------|--------|----------------|--------|
| 54 | Provisioning for Passages | guide | P1 | M | — | Drafted |
| 55 | Caribbean Cruising Guide | guide | P2 | L | — | Drafted |
| 56 | Customs and Immigration for Cruisers | guide | P2 | M | `vessel-registration-systems.md` | Not started |
| 57 | Vessel Registration and Documentation | reference | P2 | M | `vessel-registration-systems.md` | Not started |
| 58 | Anchoring Techniques | how-to | P1 | M | No existing research | Not started |
| 59 | Marina Etiquette and Procedures | guide | P3 | S | No existing research | Not started |
| 60 | Choosing and Using a Dinghy | guide | P3 | M | No existing research | Not started |

#### Hardware & Electronics (8 articles)

| # | Article Title | Doc Type | Priority | Effort | Source Material | Status |
|---|--------------|----------|----------|--------|----------------|--------|
| 61 | Choosing a Boat Computer | guide | P1 | M | `sailor-hardware-landscape.md`, `industrial-sbc-and-docker-research.md` | Drafted |
| 62 | Marine Software Landscape | reference | P1 | M | `competitive-landscape.md`, multiple competitive docs | Drafted |
| 63 | Marine Electronics Buying Guide | guide | P2 | L | `sailor-hardware-landscape.md` | Not started |
| 64 | SignalK for Beginners | guide | P2 | M | SignalK docs (Apache 2.0) | Not started |
| 65 | Setting Up a Raspberry Pi for Marine Use | tutorial | P2 | L | `industrial-sbc-and-docker-research.md`, `smart-home-and-pwa-integration.md` | Not started |
| 66 | Marine Display Options | reference | P2 | M | `marine-mfd-platforms-and-integrations.md`, `mfd-platform-ecosystems.md` | Not started |
| 67 | NMEA 2000 Hardware Setup | how-to | P2 | M | `can-bus-technology.md`, `sailor-hardware-landscape.md` | Not started |
| 68 | Firmware Management for Marine Electronics | guide | P3 | S | `firmware-update-tracking.md` | Not started |

#### Above Deck Platform (7 articles)

| # | Article Title | Doc Type | Priority | Effort | Source Material | Status |
|---|--------------|----------|----------|--------|----------------|--------|
| 69 | Getting Started with Above Deck | tutorial | P1 | M | Platform docs | Not started |
| 70 | Setting Up the Above Deck Spoke | tutorial | P1 | L | Architecture docs | Not started |
| 71 | Connecting Victron to Above Deck | how-to | P1 | M | `victron-and-j1939-protocols.md` | Not started |
| 72 | Connecting NMEA 2000 to Above Deck | how-to | P1 | M | `nmea2000-pgn-field-specifications.md`, `can-bus-technology.md` | Not started |
| 73 | Understanding the AI Crew | guide | P1 | M | `ai-strategy.md` | Not started |
| 74 | Using the Passage Planner | tutorial | P2 | M | Platform docs | Not started |
| 75 | Using the Energy Planner | tutorial | P2 | M | Platform docs | Not started |

### 1.3 Priority Summary

| Priority | Count | Description |
|----------|-------|-------------|
| P1 (launch) | 38 | Must-have for launch — core topics, safety-critical content, platform docs |
| P2 (month 1-3) | 27 | Should-have — fills out topic areas, deepens coverage |
| P3 (later) | 10 | Nice-to-have — lower priority, produced as time allows |
| **Total** | **75** | |

Of the 38 P1 articles, 15 are already drafted. That leaves **23 P1 articles to produce before launch**.

### 1.4 Doc Type Distribution

| Doc Type | Count | Notes |
|----------|-------|-------|
| guide | 33 | Largest category — narrative explanations of concepts |
| how-to | 14 | Step-by-step practical instructions |
| reference | 13 | Tabular, lookup-oriented content |
| spec | 5 | Protocol and format specifications |
| tutorial | 6 | Hands-on worked examples |
| manual | 0 | Manuals will come from platform features as they ship |

---

## 2. AI-Assisted Content Generation

The project has 30+ research documents totaling approximately 10,000 lines of detailed technical analysis. These are the primary raw material for generating seed content.

### 2.1 Process

```
Research document(s) selected
  → AI drafts article from research, following doc type template
  → Draft tagged as internal (invisible to users)
  → Human reviewer checks accuracy, completeness, tone
  → Human edits for voice — adds personal experience, regional nuance, practical warnings
  → Human promotes to published
  → Published
  → RAG pipeline triggered
```

**AI-generated drafts are NEVER published without human review.** They start as internal drafts, invisible to the public, and don't appear on the site until reviewed and promoted.

### 2.2 What AI Is Good At

- Transforming dense technical research into structured, readable guides
- Creating tabular reference content from specification documents (e.g., PGN tables from `nmea2000-pgn-field-specifications.md`)
- Generating step-by-step procedures from workflow descriptions
- Cross-referencing multiple research docs into a unified article
- Formatting and structuring content consistently across doc types
- Identifying gaps — "this research covers X and Y but not Z, which a reader would need"

### 2.3 What AI Is Bad At

- **Personal experience.** "I anchored in Falmouth in a southwesterly and the holding was poor" — this must come from humans.
- **Regional nuance.** Tidal behaviour in the Solent vs. the Bay of Fundy requires lived knowledge.
- **Equipment-specific gotchas.** "The Victron SmartSolar 100/30 has a known issue with firmware v1.61 where..." — this comes from forums, experience, and manufacturer errata.
- **Safety judgment.** Knowing which procedures are safety-critical and what the real-world failure modes are requires domain expertise.
- **Sea stories.** The anecdotes that make technical content memorable and trustworthy cannot be generated.
- **Current accuracy.** Regulations, frequencies, and procedures change. AI may have outdated knowledge.

### 2.4 Safety-Critical Content Exclusion

AI should NOT draft safety-critical articles. The following must be written by qualified humans from the start:

- VHF radio procedures (articles 35, 36)
- COLREGs and right of way (articles 42, 43)
- MOB procedures (article 44)
- Fire safety (article 45)
- LPG safety (article 46)
- Shore power safety (article 28)
- Heavy weather preparation (article 47)
- Emergency procedures (article 48)

These 8 articles require authors with verified domain credentials (e.g., RYA Yachtmaster, GMDSS operator, ABYC-certified electrician, marine surveyor).

### 2.5 Batch Production Schedule

| Batch | Articles | Method | Timeline |
|-------|----------|--------|----------|
| 1 | 15 existing drafts | Human review and publish | Week 1-2 |
| 2 | 15 AI-drafted articles from research docs (non-safety) | AI draft → human review → publish | Week 2-4 |
| 3 | 8 safety-critical articles | Human-authored from scratch | Week 3-6 |
| 4 | Remaining P1 articles | AI-draft or human-authored as appropriate | Week 4-8 |
| 5 | P2 articles begin | Rolling production | Month 2+ |

### 2.6 AI Disclosure

All AI-drafted articles include a disclosure in their metadata:

```
ai_assisted: true
ai_disclosure: "Initial draft generated with AI assistance from project research documents. Reviewed and edited by [editor name]."
```

This disclosure is rendered on the article page as a small note, not prominently featured but not hidden. Transparency about process builds trust.

---

## 3. Open Source Content Sources

Content from the following sources can be legally incorporated into the KB under CC-BY-SA-4.0 licensing.

### 3.1 Public Domain Sources (No restrictions)

| Source | Content Available | License | Attribution Required | Usable Content |
|--------|------------------|---------|---------------------|----------------|
| NOAA Publications | Coast Pilot, tide prediction methodology, chart symbology, weather patterns | Public domain (US government) | None required, but good practice to cite | Tidal prediction articles, weather reference, chart interpretation |
| USCG Navigation Rules | Full COLREGs text for US waters (33 CFR Part 83) | Public domain (US government) | None required | COLREGs overview, right of way rules |
| NOAA Nautical Chart Symbols | Chart No. 1 — complete symbology reference | Public domain | None required | Chart reading reference |
| US Coast Pilot | Coastal navigation information, port descriptions | Public domain | None required | Passage planning reference material |
| NOAA CO-OPS | Tidal prediction methodology, harmonic constituents | Public domain | None required | Tidal harmonics reference |

### 3.2 Compatible Open Source Licenses

| Source | Content Available | License | Compatible with CC-BY-SA-4.0? | Attribution Required |
|--------|------------------|---------|-------------------------------|---------------------|
| SignalK Documentation | Protocol specification, data model, integration guides | Apache 2.0 | Yes | Must include original copyright notice |
| canboat PGN Database | NMEA 2000 PGN specifications, field definitions | Apache 2.0 | Yes | Must include original copyright notice |
| Wikipedia Marine Articles | Navigation, seamanship, marine systems articles | CC-BY-SA-4.0 | Yes (same license) | Must attribute original authors and link |
| OpenCPN Documentation | Chart rendering, navigation software concepts | GPL | Needs careful handling — GPL applies to software, docs may differ per file | Check per-document; some docs may be GPL, some CC |

### 3.3 Restricted Sources (Reference Only)

| Source | Content Available | License | What We Can Do |
|--------|------------------|---------|---------------|
| ITU Radio Regulations | VHF procedures, frequencies, call signs | Copyrighted | Reference and summarise, link to official docs. Cannot reproduce verbatim |
| IMO COLREGS | International collision regulations full text | Copyrighted (IMO publishes) | Reference. Use USCG public domain version for US waters, note differences |
| IALA | Buoyage system specifications | Copyrighted | Describe and diagram. Cannot reproduce official publications |
| RYA Training Materials | Navigation, seamanship, radio procedures | Copyrighted | Reference. Cannot reproduce. Good citation target |
| ABYC Standards | Electrical wiring, safety standards | Copyrighted | Reference standard numbers and requirements. Cannot reproduce text |
| Victron Documentation | Product manuals, technical specifications | Various | Check per-document. Some Victron community docs are open. Official manuals are copyrighted but Victron generally permits technical reference |

### 3.4 Attribution Template

For articles incorporating open-source content:

```markdown
---
license: CC-BY-SA-4.0
original_source:
  title: "Signal K Specification"
  url: "https://signalk.org/specification/"
  license: "Apache 2.0"
  attribution: "Signal K project contributors"
---
```

For articles adapting Wikipedia content:

```markdown
---
license: CC-BY-SA-4.0
original_source:
  title: "Automatic identification system"
  url: "https://en.wikipedia.org/wiki/Automatic_identification_system"
  license: "CC-BY-SA-4.0"
  attribution: "Wikipedia contributors"
---
```

---

## 4. Content from Existing Project Research

The project's research documents in `docs/research/` are the richest source material for KB articles. The following table maps research documents to the KB articles that can be derived from them.

| Research Document | Path | Potential KB Articles |
|------------------|------|----------------------|
| `nmea2000-pgn-field-specifications.md` | `data-and-apis/` | NMEA 2000 PGN Reference (spec), Understanding NMEA 2000 (guide), NMEA 0183 vs NMEA 2000 (reference) |
| `nmea2000-pgn-field-specs.md` | `data-and-apis/` | NMEA 2000 PGN Reference (spec) — additional field detail |
| `victron-and-j1939-protocols.md` | `hardware/` | Victron VE.Direct Protocol (spec), Victron System Integration (how-to), J1939 Engine Data Protocol (spec) |
| `can-bus-technology.md` | `hardware/` | CAN Bus Technology for Marine Use (reference), NMEA 2000 Hardware Setup (how-to) |
| `marine-weather-deep-dive.md` | `navigation-and-weather/` | Reading GRIB Files and Weather Models (how-to), Weather Data Sources (reference) |
| `tides-and-currents.md` | `navigation-and-weather/` | Tidal Prediction Basics (guide), Tidal Harmonics and Constituents (reference), Reading Tidal Diamonds (how-to) |
| `passage-planning-workflows.md` | `navigation-and-weather/` | Passage Planning Step by Step (tutorial), Passage Planning Checklist (reference) |
| `solar-energy-research.md` | `data-and-apis/` | Solar Panel Sizing (how-to), Solar System Design and Installation (guide) |
| `boat-systems-monitoring.md` | `domain/` | Understanding 12V Systems (guide), Victron System Integration (how-to), Understanding Engine Alarms (reference) |
| `sailor-hardware-landscape.md` | `hardware/` | Marine Electronics Buying Guide (guide), Battery Chemistry Comparison (reference), Satellite Comms for Cruisers (guide), 24V vs 12V Systems (guide) |
| `fastseas-and-weather-routing-research.md` | `navigation-and-weather/` | Understanding Weather Routing (guide), Choosing a Weather Routing Tool (guide) |
| `s57-enc-chart-rendering.md` | `navigation-and-weather/` | S-57 ENC Chart Format (spec), Understanding Electronic Charts (guide) |
| `mapping-and-chart-technology.md` | `navigation-and-weather/` | Chart Datum and Projections (reference), Understanding Electronic Charts (guide) |
| `weather-routing-radar-autopilot-deep-dive.md` | `navigation-and-weather/` | Understanding Radar for Sailing (guide), Autopilot Systems for Sailing (guide) |
| `vessel-registration-systems.md` | `data-and-apis/` | Vessel Registration and Documentation (reference), Customs and Immigration (guide) |
| `industrial-sbc-and-docker-research.md` | `hardware/` | Setting Up a Raspberry Pi for Marine Use (tutorial) |
| `marine-mfd-platforms-and-integrations.md` | `hardware/` | Marine Display Options (reference) |
| `firmware-update-tracking.md` | `hardware/` | Firmware Management for Marine Electronics (guide) |
| `competitive-landscape.md` | `competitive/` | Marine Software Landscape (reference) |
| `data-licensing-review.md` | `data-and-apis/` | Contextual reference for data source articles |
| `pvgis-solar-data.md` | `data-and-apis/` | Solar System Design and Installation (guide) — regional irradiance data |

**Coverage:** 21 research documents map to approximately 45 KB articles.

### 4.2 Research Docs as Direct KB Content

The 45 research documents in `docs/research/` are not just source material — many are directly publishable as KB articles with light editing. They represent hundreds of hours of research and are the most detailed technical content we have. They should be in the KB, not hidden in a developer folder.

**Publication approach:**

1. **Review each research doc** for KB suitability
2. **Classify** as: publish directly, edit for KB, derive articles from, or keep internal
3. **Light editing** for publishable docs: remove internal project references, add intro/summary, ensure consistent formatting, add metadata (doc type, topic, tags)
4. **Publish as published articles** — these are project-authored, reviewed content

**Classification of all 45 research documents:**

| Category | Documents | Action |
|----------|-----------|--------|
| **Publish directly** (minimal editing) | CAN bus technology, NMEA 2000 PGN specs (both), Victron/J1939 protocols, marine weather deep dive, tides and currents, passage planning workflows, solar energy research, boat systems monitoring, sailor hardware landscape, mapping and chart technology, S-57 chart rendering, weather routing/radar/autopilot, vessel registration, hardware connectivity, matter protocol IoT, smart home integration, firmware update tracking, marine data APIs, data source matrix, PVGIS solar data, mooring/marina data sources | 22 docs |
| **Edit for KB** (remove internal framing, restructure) | competitive landscape, marine software landscape (apps and github projects), MFD platform ecosystems, marine MFD platforms, Raymarine Axiom deep dive, chartplotter UI patterns, community platform patterns, visual design patterns, first-run setup experiences, deployment architecture, PWA capabilities | 11 docs |
| **Derive articles from** (too internal to publish as-is, but content is reusable) | d3kOS deep dive, Keeano deep dive, Savvy Navvy deep dive, PredictWind/Orca analysis, competitive intelligence update, infrastructure gaps, CarPlay marine analogy, Go marine ecosystem, industrial SBC research, data licensing review, community-curated KB research | 11 docs |
| **Keep internal** (project strategy, not reader-useful) | competitive intelligence update (pricing/strategy details) | 1 doc |

**Impact on content volume:** Publishing 22 research docs directly + 11 edited = 33 additional articles. Combined with 15 existing MDX drafts + 23 new articles from the seed plan = **71+ articles at launch**.

**Process:**
- Week 1-2: Review and classify all 45 docs
- Week 2-4: Light-edit the 22 "publish directly" docs (add KB metadata, remove internal refs)
- Week 3-5: Restructure the 11 "edit for KB" docs
- Week 4-6: Draft new articles derived from the 11 "derive from" docs
- All published as published articles with proper doc type, topic assignment, and tags
- All automatically chunked and embedded for RAG on publish

---

## 5. Content Quality Standards

All KB content is author-published. These standards apply to every article regardless of source (original writing, AI-assisted drafts, adapted research).

### 5.1 Quality Standards by Doc Type

| Doc Type | Required Sections | Quality Criteria |
|----------|------------------|-----------------|
| **Guide** | Introduction, prerequisites (if any), main content with H2 sections, summary/key takeaways | Clear progression from concept to understanding. No assumed knowledge beyond stated prerequisites. Practical examples where relevant. Diagrams for complex systems. |
| **Spec** | Overview, version/standard reference, complete specification content, changelog | Complete and accurate. Versioned (which edition/release of the standard). Sourced from authoritative data (e.g., canboat for PGNs, NOAA for tidal constituents). Cross-referenced with related specs. Tabular format where data is structured. |
| **How-To** | Prerequisites, tools/materials needed, numbered steps, expected result, troubleshooting/common issues | Step-by-step numbered instructions. Prerequisites stated upfront. Each step is one action. Expected outcome described so the reader knows they did it right. Common pitfalls called out with warnings. |
| **Manual** | Table of contents, structured sections, index/cross-references | Comprehensive coverage of the subject. Structured for reference lookup, not linear reading. Every section independently useful — reader should be able to jump to any section. |
| **Reference** | Header row, structured data, source citations, last-updated date | Tabular where possible. Complete coverage of the domain (e.g., all PGNs, all VHF channels, all buoy types). Regularly updated when source data changes. |
| **Tutorial** | Learning objectives, prerequisites, worked example, exercises/next steps | Hands-on — follows a specific worked example from start to finish. Produces a concrete, visible result the reader can verify. Builds on prerequisites explicitly. |

### 5.2 Universal Quality Criteria

Every article, regardless of doc type:

- **Accuracy** — factual claims are correct and sourced where possible
- **Completeness** — covers the topic to the depth appropriate for the doc type (a guide can be introductory; a spec must be exhaustive)
- **Clarity** — written in direct, technical but accessible prose. No marketing language, no filler, no unnecessary hedging
- **Structure** — logical heading hierarchy (H1 title, H2 sections, H3 subsections). Scannable — reader should grasp the structure from headings alone
- **Formatting** — consistent Markdown formatting. Code blocks for technical content. Tables for structured data. Lists for sequential items
- **Attribution** — sources cited. Claims about standards reference the standard. Claims about products reference the manufacturer's documentation
- **Currency** — content reflects the current state of the subject. Version-specific content states which version it applies to

### 5.3 Safety-Critical Quality Criteria

In addition to universal criteria, safety-critical articles must:

- Cite authoritative sources for every procedural claim (RYA, USCG, IMO, ABYC, ITU)
- Include verification reminders ("Always verify VHF channels with your local port authority")
- Not contradict official sources without explicit explanation
- Be reviewed by a person with verified domain credentials
- Include a last-reviewed date and reviewer identification
- Be re-verified every 12 months

---

## 6. Content Calendar

### Pre-Launch Phase (8 weeks)

| Week | Activity | Target |
|------|----------|--------|
| 1-2 | Review and promote 15 existing drafted articles to published | 15 articles published |
| 2-4 | AI-draft batch 1: 15 articles from research docs (non-safety) | 15 drafts in review |
| 3-6 | Human-author 8 safety-critical articles | 8 articles in review |
| 4-6 | Review and publish AI-drafted batch 1 | 30 articles published |
| 5-8 | Produce remaining P1 articles | 38 P1 articles published |
| 6-8 | Begin P2 articles | 5-10 P2 articles published |
| **Launch** | | **43-48 articles live** |

### Post-Launch Cadence

| Phase | Timeline | Output | Focus |
|-------|----------|--------|-------|
| Ramp-up | Month 1-3 | 5-10 articles/week | Fill P2 gaps, respond to reader feedback |
| Growth | Month 3-6 | 3-5 articles/week | Deepen coverage, publish adapted research docs |
| Steady state | Month 6+ | 1-3 articles/week | Safety-critical updates, quality review, topic expansion |
| Mature | Month 12+ | As needed | Maintain accuracy, update for new standards/products, fill RAG gaps |

### Recurring Activities

- **Weekly:** Comment moderation, content health check
- **Monthly:** Content health review (stale articles, coverage gaps, RAG audit)
- **Quarterly:** Topic structure review (new topics needed? merges? reordering?)
- **Annually:** Full safety-critical content re-verification cycle

---

# PART 2: CONTENT ADMINISTRATION

## 7. Admin Dashboard Specification

The admin KB management interface is part of the site admin dashboard. UI uses Tailwind CSS and Ant Design 5 components.

### 7a. Article Management

**Article List View (`/admin/kb/articles`)**

- Table with columns: Title, Topic, Doc Type, Status, Status, Author, Updated, Views, Comments, Favorites
- Sortable by any column
- Filterable by:
  - Status: draft, review, published, archived (multi-select)
  - Status: published / draft (multi-select)
  - Doc type: guide, spec, how-to, manual, reference, tutorial (multi-select)
  - Topic: hierarchical topic selector
  - Author: user search
  - Safety-critical: yes/no
  - Stale: articles not updated in 12+ months
  - RAG status: embedded/not-embedded/stale-embedding
- Pagination with configurable page size
- Bulk selection with checkboxes
- Bulk actions: publish selected drafts, archive selected, trigger re-embedding

**Create/Edit Article (`/admin/kb/articles/new`, `/admin/kb/articles/{id}/edit`)**

- Split-pane layout: Markdown editor (left), live rendered preview (right)
- Editor: CodeMirror or Monaco with Markdown syntax highlighting, keyboard shortcuts
- Metadata panel (collapsible sidebar):
  - Title (text input)
  - Slug (auto-generated from title, editable)
  - Topic (hierarchical selector)
  - Doc type (dropdown)
  - Trust tier (dropdown — author sets status)
  - Safety-critical toggle
  - Tags (multi-select with typeahead)
  - Summary (textarea — for cards, search results, meta tags)
  - Related articles (multi-select search)
  - License (dropdown, default CC-BY-SA-4.0)
  - Original source fields (if adapted from external content)
  - AI-assisted toggle and disclosure text
- **Change summary** — required text field when editing an existing published article: "What changed?"
- **Diff preview** — before publishing, show a diff of all changes vs. the current published version
- **Save draft** — saves without publishing (remains at current status)
- **Publish** — increments version, updates content, triggers RAG pipeline, notifies subscribers

**Article Detail (`/admin/kb/articles/{id}`)**

- Full metadata display
- Version history: list of all versions with date, editor, change summary. Click to view any version. Diff between any two versions.
- Discussion: recent comments on this article
- RAG status: chunk count, last embedded timestamp, embedding model used
- Engagement: views, favorites, discussion comments, times cited by agents
- Actions: edit, archive, trigger re-embedding, view on site

### 7b. Comment Moderation (`/admin/kb/comments`)

- Table of recent comments across all articles: commenter name, article title, comment preview, date, status (visible/hidden/flagged)
- Actions: approve, hide, delete
- Filter by: status, article, date range
- Flagged comments (reported by readers) highlighted for attention
- Bulk actions: hide selected, delete selected

### 7c. Content Health (`/admin/kb/health`)

Dashboard with cards/panels showing:

**Staleness**
- Count of articles not updated in 12+ months
- List view: article title, last updated date, topic, status, views in last 30 days
- Action: assign for review, archive, mark as "confirmed current" (resets timer)

**Quality Signals**
- Articles with most discussion comments (active topics) — top 10
- Articles with lowest engagement (published but rarely viewed in last 90 days) — candidates for promotion or archival

**RAG Coverage**
- Total articles published: N
- Articles embedded for RAG: N (should equal published count)
- Articles NOT embedded (drafts): N
- Stale embeddings (article updated since last embedding): N — action: trigger re-embedding
- Last full re-index date

**Status Distribution**
- Bar chart: published / draft counts
- Trend over time (monthly)

**Topic Coverage**
- Table: topic name, article count, articles per doc type, last article published date
- Highlights topics with zero or few articles (content gaps)
- Cross-referenced with agent gap queries — high-demand topics with low article counts are priority gaps

**Agent Utilisation**
- Top 10 most-cited articles by AI agents (from RAG retrieval logs)
- Top 10 agent queries with no relevant results (content gap signals)
- Agent citation count by topic (which topics are agents well-informed on?)

### 7d. Topic Management (`/admin/kb/topics`)

- Tree view of the full topic hierarchy
- Drag-and-drop reordering within parent
- Create new topic: name, slug, description, icon (Ant Design icon picker), parent topic
- Edit topic: same fields, plus merge option (move all articles from this topic to another, then delete)
- Topic metrics: article count, total views, total comments, growth trend
- Cannot delete a topic that has articles — must reassign or merge first

### 7e. RAG Management (`/admin/kb/rag`)

- **Overview:** total chunks in vector store, chunks by status, last full index date, embedding model and version
- **Per-article view:** select an article → see its chunks (chunk text preview, chunk index, metadata)
- **Trigger re-embedding:** single article or all articles. Shows progress bar and status
- **Chunk preview:** before publishing, preview how an article will be chunked (split at H2 boundaries, title prepended)
- **Audit:** verify no draft content is in the vector store. One-click audit that scans all chunks and reports any with `status = 'draft'`
- **Contradiction detection:** run a scan across safety-critical topic clusters. Flags chunks that may contradict each other for editorial review

---

## 8. Editorial Workflow

The complete lifecycle of a KB article from idea to published and RAG-indexed content. All articles are author-published — there is no community submission or review queue.

### 8.1 Article Lifecycle

```
Idea / topic identified
  ↓
Draft written:
  → AI-assisted drafting from research docs, OR
  → Written from scratch in admin Markdown editor or external tool
  ↓
Author self-review (accuracy, completeness, formatting, tone)
  ↓
If safety-critical:
  → Author verifies against authoritative sources (RYA, USCG, IMO, ABYC, ITU)
  → Additional care taken — these articles carry real-world safety implications
  ↓
Set status to published
  ↓
Publish
  ↓
RAG pipeline triggered:
  → Article chunked at H2 boundaries
  → Chunks embedded with status: published
  → Old chunks for this article deleted
  → New chunks inserted with full metadata
  ↓
Subscribers notified (in-app + email digest if configured)
  ↓
Article live on website + available to AI agents
```

### 8.2 Article Updates

```
Author identifies content that needs updating
  (from reader comments, staleness flags, agent gap signals, or own review)
  ↓
Author edits article in admin editor
  ↓
Change summary recorded (required for all edits to published articles)
  ↓
Version incremented
  ↓
RAG re-embedded with updated content
  ↓
Subscribers notified of update
```

---

## 9. Content Maintenance

### 9.1 Staleness Detection

- Articles not updated in **12 months** are flagged as stale in the admin content health dashboard
- Safety-critical articles are flagged at **6 months**
- Stale articles are NOT removed from RAG — they remain available but with a staleness signal
- Agents can note content age when citing older articles: "This guide was last updated in March 2025"

### 9.2 Stale Review Workflow

```
Article flagged as stale (automated, based on updated_at)
  ↓
Editor reviews article:
  → Is the content still accurate?
  → Have standards/regulations changed?
  → Has equipment/software been updated?
  ↓
If still accurate:
  → Editor clicks "Confirm Current" — resets the staleness timer
  → No version increment (content didn't change)
If updates needed:
  → Editor makes updates, writes change summary
  → New version published → RAG re-embedded
If no longer relevant:
  → Archive article → removed from site and RAG
```

### 9.3 Version-Specific Content

Articles referencing specific software versions, firmware versions, or regulatory editions need version tracking:

- The article metadata includes a `relevant_versions` field (e.g., "Victron firmware 3.x", "NMEA 2000 v2.0")
- When a new version is released, articles referencing the old version are flagged for review
- This is initially a manual process (editor marks articles for update) but could be automated with a version-tracking feed

### 9.4 Agent Feedback Loop

When AI agents frequently receive questions they cannot answer well (few relevant chunks, low confidence), that is a signal for new content:

- Track queries where agents retrieve no relevant chunks (from RAG retrieval logs)
- Surface these "content gap queries" in the admin content health dashboard
- Convert high-frequency unanswered queries into article ideas
- This closes the loop: user asks agent → agent cannot answer → gap identified → article written → agent can now answer

### 9.5 Deprecation and Archival

Articles about discontinued products, deprecated standards, or obsolete procedures:

- **Archive, never delete.** Archived articles are removed from the site and RAG but preserved in the database for history
- **Archive reason** recorded in metadata (e.g., "Product discontinued", "Superseded by [new article]")
- **Redirect** — if an archived article is superseded, the old slug redirects to the replacement article
- **RAG removal** — all chunks for archived articles are deleted from the vector store immediately on archival

---

## 10. Editorial Standards

The following standards apply to all KB content. They ensure consistency across articles regardless of whether they were written from scratch, AI-assisted, or adapted from research documents.

### 10.1 Writing Style

- Direct and technical but accessible
- Write as a fellow sailor, not a marketer or academic
- No filler, no unnecessary hedging, no marketing language
- Assume the reader is intelligent but may not know this specific topic
- Use "you" for the reader, "we" sparingly and only for the sailing community (never "our platform")
- Active voice preferred
- Specific over vague: "use 4mm² wire for runs over 3 metres" not "use appropriately sized wire"

### 10.2 Formatting Standards

- **Markdown** — all content is Markdown
- **Heading hierarchy:** H1 is the title (auto-generated). Content starts at H2. No skipping levels (H2 → H4 is wrong)
- **Code blocks** for technical content: NMEA sentences, protocol data, configuration examples
- **Tables** for structured data: specifications, comparisons, reference data
- **Numbered lists** for sequential steps (how-tos, tutorials)
- **Bulleted lists** for non-sequential items
- **Bold** for key terms on first use. Not for emphasis of entire sentences
- **Links** — link to source material, related KB articles, official documentation. Use descriptive link text, not "click here"

### 10.3 Required Sections by Doc Type

| Doc Type | Required Sections |
|----------|------------------|
| Guide | None strictly required, but should have: introduction, logical H2 sections, summary or key takeaways |
| Spec | Version/standard reference, specification content, changelog if versioned |
| How-To | Prerequisites, Steps (numbered), Expected Result, Troubleshooting / Common Issues |
| Manual | Table of Contents (auto-generated from headings), structured reference sections |
| Reference | Source citation, last-verified date |
| Tutorial | Learning Objectives, Prerequisites, Worked Example (the main body), Next Steps |

### 10.4 Image and Diagram Guidelines

- **SVG preferred** for diagrams, schematics, and technical illustrations — scales cleanly, small file size
- **PNG acceptable** for screenshots, photos — use compression, max 1200px wide
- **No copyrighted images** — all images must be original, CC-licensed, or public domain
- **Alt text required** for all images — describes what the image shows for accessibility
- **Diagrams over prose** — if a concept is spatial or relational (wiring diagram, network topology, buoyage layout), draw it rather than describe it in text
- **No watermarked stock photos** — ever

### 10.5 Citation Requirements

- Factual claims must be sourced: link to official documentation, standards, or authoritative publications
- Acceptable sources: manufacturer documentation, national maritime authorities (RYA, USCG, NOAA), international standards (IMO, ITU, IALA, ABYC), peer-reviewed research, project research documents
- Not acceptable as sole source: forum posts, social media, personal blogs (these can supplement but not replace authoritative sources)
- Citation format: inline links to source material. For standards, cite the standard number and section (e.g., "ABYC E-11, section 11.4.1")

### 10.6 Safety Disclaimer Requirements

Safety-critical content must include:

- A clear statement that the reader should verify information with official sources and qualified professionals
- Reference to the relevant authority (e.g., "Consult your national maritime authority for current regulations")
- Warning callouts for procedures that could cause injury or damage if performed incorrectly
- No absolute safety guarantees — use "this procedure is recommended by [authority]" not "this is always safe"

### 10.7 Licensing

- All KB content is published under **CC-BY-SA-4.0** unless an alternative license is explicitly noted
- Content adapted from other CC-BY-SA sources must maintain attribution and the same license
- Content adapted from Apache 2.0 or MIT sources must maintain original copyright notices
- All published content may be chunked, embedded, and served to AI agents via the RAG pipeline

---

## 11. Metrics and Success Criteria

### 11.1 Content Volume Metrics

| Metric | Measurement | Target (launch) | Target (6 months) | Target (12 months) |
|--------|-------------|-----------------|-------------------|-------------------|
| Total published articles | Count by status = published | 50+ | 150+ | 300+ |
| Articles by status | Count | 50+ published | 140+ published | 280+ published |
| Articles by doc type | Count by type | All types represented | Balanced distribution | Deep coverage in all types |
| Topic coverage | Articles per top-level topic | Every top-level topic has 3+ articles | Every subtopic has 2+ articles | No topic gaps identified |

### 11.2 Content Production Metrics

| Metric | Measurement | Healthy Range |
|--------|-------------|---------------|
| New articles per month | Count of new articles published | 10-20 early, 5-10 steady state |
| Articles updated per month | Count of articles with new versions | Regular updates = content staying fresh |

### 11.3 Content Quality Metrics

| Metric | Measurement | Healthy Signal |
|--------|-------------|---------------|
| Stale articles (12+ months) | Count of articles where updated_at < 12 months ago | < 10% of published articles |
| Safety-critical articles overdue for review | Count of safety-critical articles where last_verified > 6 months | Zero — these must be current |
| Discussion activity | Comments per article per month | Growing engagement |

### 11.4 RAG Utilisation Metrics

| Metric | Measurement | What It Tells You |
|--------|-------------|------------------|
| Agent citation rate | % of agent responses that cite a KB article | Higher = agents are well-informed |
| Most-cited articles | Top 10 articles by agent retrieval count | Which content is most valuable to agents |
| Zero-result queries | Agent queries that retrieved no relevant chunks | Content gaps — topics agents cannot answer about |
| Citation accuracy feedback | Thumbs-down rate on responses citing KB content | Low = KB quality is good; high = specific articles need review |

### 11.5 Content Health and Engagement Metrics

| Metric | Measurement | What It Tells You |
|--------|-------------|------------------|
| Search gap queries | Agent queries with no relevant results | Topics that need new articles |
| Reader comments per month | Count of discussion comments across all articles | Reader engagement level |
| Most-viewed articles | Top 20 by views in last 30 days | What readers care about most |
| Least-viewed articles | Bottom 20 by views in last 90 days | Candidates for improvement or archival |

### 11.6 Reporting Cadence

| Report | Frequency | Audience | Content |
|--------|-----------|----------|---------|
| Content health snapshot | Weekly | Author | Stale articles, comment moderation, RAG coverage |
| Content activity report | Monthly | Author | New articles, updates, discussion comments, search gaps |
| KB metrics dashboard | Always-on | Admin dashboard | All metrics above, updated in real-time |
| Quarterly review | Quarterly | Author | Trends, content gaps, engagement, RAG utilisation |
