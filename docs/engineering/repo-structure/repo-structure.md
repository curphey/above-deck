# Repository Structure

**Date:** 2026-03-31
**Status:** Draft v1
**Parent:** [Engineering Standards](../engineering-standards.md)

---

## 1. Multi-Repo Architecture

Above Deck is split across four repositories. Each repo has a single responsibility, its own CI pipeline, its own release cadence, and its own `CLAUDE.md`.

| Repository | Purpose | Language | Deploys to |
|------------|---------|----------|------------|
| `above-deck-docs` | Documentation: vision, architecture, research, feature specs, engineering standards, wireframes | Markdown | GitHub Pages |
| `above-deck-os` | Boat OS: Go backend, protocol adapters, data model, AI agents, monitoring, sync, security scanner. Ships as a Docker image. | Go | Container registry |
| `above-deck-site` | Community site: blog, knowledge base, hosted tools (passage planner, energy sizer, VHF sim), forums. Astro + React. | TypeScript | CDN + Supabase |
| `above-deck-shared` | Shared contracts: data model schema, API definitions, type generation for Go and TypeScript | Go + TypeScript | Go module + npm package |

### Rationale

**Why not a monorepo?**

- The site and the OS are fundamentally different projects. Different languages, different build tools, different deployment targets, different users.
- Go cross-compilation for ARM64 should not block a frontend CSS fix.
- Spoke releases are carefully staged (boats at sea). Site deploys are continuous. Coupling their release pipelines is a liability.
- The docs repo can be public from day one, even before code repos are ready.
- Each repo gets focused CI — Go linting does not run on TypeScript changes and vice versa.
- Clear boundaries make it easier for contributors to find what they need and understand what they can change.

**Why four repos and not two or three?**

- `above-deck-shared` must be independent so both `os` and `site` can pin specific versions of the schema. If schema lived inside either consumer, the other would have a circular dependency.
- `above-deck-docs` is separate because documentation has its own lifecycle. Specs are written before code exists. Research persists after implementations change. Docs should never be gated on a code CI pipeline.

---

## 2. Repository Details

### above-deck-docs

All project documentation: product vision, technical architecture, engineering standards, feature specs, research, and wireframes.

```
above-deck-docs/
  docs/
    above-deck-product-vision-v2.md
    above-deck-technical-architecture.md
    engineering/
      engineering-standards.md
      release-process/
      repo-structure/
      ci-cd/
      testing/
      dev-environment/
      cross-compilation/
    features/
      boat-systems/
      underway/
      platform/
    research/
      data-and-apis/
      hardware/
      protocols/
      navigation/
      market/
      ai/
      regulations/
  wireframes/
    html/
  CLAUDE.md
  README.md
```

**Key points:**
- Deployed to GitHub Pages as a static documentation site
- CI validates internal links (no broken references)
- No code, no build artifacts, no dependencies beyond a static site generator
- This is the public-facing specification of the project — anyone can read it without cloning a code repo

---

### above-deck-os

The boat operating system. A single Go binary that runs on spoke hardware (Mac Mini M4, Raspberry Pi, or any Linux box on the boat). Connects to instruments, processes data, runs AI agents, syncs with the hub.

```
above-deck-os/
  cmd/
    spoke/              — main entry point for the spoke binary
  internal/
    adapter/            — protocol adapters
      nmea2000/         — NMEA 2000 / CAN bus adapter
      nmea0183/         — NMEA 0183 serial/TCP adapter
      victron/          — Victron VE.Direct and MQTT adapter
      ais/              — AIS message decoder
      signalk/          — Signal K client adapter
      camera/           — IP camera integration
      mqtt/             — generic MQTT adapter
    agent/              — AI agent runtime
      watchman/         — continuous monitoring agent
      navigator/        — passage planning and routing agent
      engineer/         — systems monitoring and diagnostics agent
      radio/            — VHF radio operations agent
      bosun/            — maintenance and scheduling agent
      pilot/            — autopilot integration agent
    alert/              — monitoring rules and alert engine
    api/                — HTTP and WebSocket API server
    datamodel/          — unified hierarchical data model
    discovery/          — auto-discovery engine (scan network for instruments)
    firmware/           — firmware version tracker and scrapers
    security/           — network security scanner
    sync/               — hub-spoke bidirectional sync engine
    storage/            — SQLite management and migrations
  pkg/
    nmea2000/           — PGN parsing library (reusable outside this project)
    victron/            — VE.Direct / MQTT protocol library (reusable)
    canbus/             — CAN bus frame library (reusable)
  web/                  — embedded frontend (built from above-deck-site or standalone UI)
  testdata/             — recorded protocol data for tests (.can, .nmea files)
  Dockerfile
  docker-compose.yml
  go.mod
  CLAUDE.md
```

**Key points:**
- `internal/` packages are private to this module — not importable by other projects
- `pkg/` packages are designed to be reusable. Other Go projects can import `pkg/nmea2000` to parse PGNs without pulling in the full OS
- `web/` contains the embedded frontend. During development this can be a simple standalone UI; in production it embeds the built output from `above-deck-site`
- `testdata/` contains real recorded protocol data — never fabricated test data
- `cmd/spoke/` is the single entry point. Build tags (`//go:build hub` / `//go:build spoke`) control which features compile in
- Docker image is multi-arch: `linux/arm64` and `linux/amd64`

---

### above-deck-site

The community web presence and hosted tools. Astro 5 with React 19 islands. Serves the blog, knowledge base, interactive tools (passage planner, energy sizer, VHF simulator), and community forums.

```
above-deck-site/
  src/
    pages/              — Astro pages (blog, knowledge base, tools, community)
    components/         — React components (MFD shell, gauges, charts, maps)
    layouts/            — Astro layouts
    content/            — MDX content (blog posts, knowledge base articles)
    lib/                — utilities, API clients, Zustand stores
    styles/             — global styles, theme tokens
  public/               — static assets (images, fonts, icons)
  tests/
    unit/               — Vitest unit and component tests
    e2e/                — Playwright end-to-end tests
  supabase/
    migrations/         — PostgreSQL migrations for hub database
  astro.config.mjs
  package.json
  CLAUDE.md
```

**Key points:**
- Astro 5 with SSR via `@astrojs/node` for dynamic pages, static generation for content pages
- React 19 islands for interactive components — charts, maps, MFD shell
- Tailwind CSS + Ant Design 5 for UI components, styled with the project's blueprint aesthetic
- Supabase for auth (Google OAuth, PKCE flow), database (PostgreSQL with RLS), and real-time subscriptions
- PWA support via `@vite-pwa/astro` with Workbox for offline capability
- Continuous deployment — every merge to `main` deploys automatically

---

### above-deck-shared

The contract layer between `os` and `site`. Defines the data model, API schemas, and shared types. Both consumers generate language-specific types from a single source of truth.

```
above-deck-shared/
  schema/               — Protocol Buffers or JSON Schema definitions
    boat.proto          — boat profile, equipment, systems
    navigation.proto    — position, route, waypoints
    weather.proto       — forecasts, observations
    energy.proto        — batteries, solar, consumption
    sync.proto          — hub-spoke sync messages
    alerts.proto        — alert definitions and events
  go/                   — generated Go types and validation
  ts/                   — generated TypeScript types and validation
  scripts/
    generate.sh         — runs protoc / json-schema-to-typescript
    validate.sh         — validates schema consistency
  go.mod
  package.json
  CLAUDE.md
```

**Key points:**
- Schema definitions are the source of truth — hand-edited Go or TypeScript types are not allowed
- `scripts/generate.sh` regenerates types for both languages from schema
- CI validates that generated code matches schema (no stale generated files)
- Versioned as both a Go module and an npm package
- Breaking schema changes require a MAJOR version bump

---

## 3. Cross-Repo Dependencies

### Dependency graph

```
above-deck-shared
       │
  ┌────┴────┐
  │         │
  ▼         ▼
above-   above-
deck-os  deck-site
```

`above-deck-docs` has no code dependencies on other repos. `above-deck-os` and `above-deck-site` both depend on `above-deck-shared`. Neither depends on the other.

### How shared types are consumed

**Go (above-deck-os):**
```
go get github.com/above-deck/above-deck-shared@v1.3.0
```
Import generated types:
```go
import "github.com/above-deck/above-deck-shared/go/boat"
```

**TypeScript (above-deck-site):**
```
pnpm add @above-deck/shared@1.3.0
```
Import generated types:
```typescript
import type { Boat, Equipment } from '@above-deck/shared';
```

### Version pinning strategy

- Both consumers pin to exact versions of `above-deck-shared` (no ranges, no `latest`)
- Dependabot or Renovate opens PRs when a new shared version is published
- The consumer's CI must pass with the new version before the PR is merged
- If a shared version introduces breaking changes, both consumers must update before the old version is deprecated

### CI validation of compatibility

- `above-deck-shared` CI runs type generation and validates output
- `above-deck-os` CI runs `go vet` and tests against the pinned shared version
- `above-deck-site` CI runs `tsc --noEmit` and tests against the pinned shared version
- A nightly CI job (or on shared version publish) tests both consumers against the latest shared version to catch drift early

---

## 4. CLAUDE.md per Repo

Each repository has its own `CLAUDE.md` at the root. This file tells Claude Code the rules for that specific repo.

### Common rules (present in every CLAUDE.md)

- Never commit to `main` — feature branches and PRs only
- Conventional commits required
- TDD is mandatory
- GPL licensed, always free, never monetize
- Never add text, copy, or prose without explicit user permission
- Screenshots go in `tmp/screenshots/` (gitignored)

### Repo-specific rules

**above-deck-docs:**
- No code files — only Markdown, HTML wireframes, and static assets
- Validate internal links before committing
- Research documents must cite sources

**above-deck-os:**
- Go standards: `gofmt`, `golangci-lint`, explicit error handling
- No Node.js dependencies — Go standard library preferred
- Test with recorded real-world protocol data, not fabricated data
- `internal/` for private packages, `pkg/` for reusable libraries
- Security: observe-only on CAN bus by default, no writes without user opt-in

**above-deck-site:**
- TypeScript strict mode, no `any`
- Astro 5 + React 19 islands + Tailwind CSS + Ant Design 5
- Zustand for client state, TanStack Query for server state
- All Supabase tables require RLS policies
- Visual design follows the blueprint aesthetic (see brand guidelines)

**above-deck-shared:**
- Never hand-edit generated files — edit schema, then regenerate
- Every schema change requires regenerating both Go and TypeScript types
- Breaking changes require MAJOR version bump
- CI must validate that generated code is not stale

---

## 5. Migration Path

### Current state

The project currently lives in a single monorepo (`above-deck`) containing documentation, wireframes, and early site code.

### Phase 1: Docs repo (now)

The current monorepo becomes `above-deck-docs`:

1. Remove `packages/` directory (site code moves later)
2. Restructure to the docs repo layout described above
3. Update `CLAUDE.md` to docs-specific rules
4. CI: link validation and static site build only

This can happen immediately. The docs are already the primary content of the current repo.

### Phase 2: Shared schema repo (before implementation)

Create `above-deck-shared` when the first line of implementation code is written:

1. Define initial schema from the existing data model documentation
2. Set up type generation scripts for Go and TypeScript
3. Publish as Go module and npm package
4. CI: schema validation and codegen verification

### Phase 3: OS repo (when Go implementation begins)

Create `above-deck-os` when the first protocol adapter is built:

1. Scaffold the Go module with `cmd/spoke/` entry point
2. Set up CI: lint, test, cross-compile, Docker build
3. Pin `above-deck-shared` as a dependency
4. Start with one adapter (NMEA 2000 or Victron) and the data model

### Phase 4: Site repo (when frontend implementation begins)

Create `above-deck-site` when the community site moves beyond wireframes:

1. Scaffold Astro 5 project with React 19 and Tailwind CSS + Ant Design 5
2. Move any existing site code from the current monorepo
3. Set up CI: lint, typecheck, test, build, deploy
4. Pin `above-deck-shared` as a dependency
5. Set up Supabase project and initial migrations

### Timing principle

Do not create empty repos. Each repo is created when there is real code to put in it. The docs repo comes first because the docs already exist. The others follow when implementation reaches that layer.
