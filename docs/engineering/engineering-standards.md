# Engineering Standards

**Date:** 2026-03-31
**Status:** Draft v1
**Audience:** All contributors (human and AI)

---

## 1. Principles

### Always free, always open source
This project is GPL-licensed, foundation-owned, and will never have paid tiers, premium features, ads, or data selling. Every engineering decision should reinforce this. Never propose or implement monetization of any kind.

### Solo builder with AI
Built by one person using Claude as a development partner. No committee decisions, no design-by-consensus. Architecture coherence over contributor velocity. PRs are not accepted during active development — contributors can fork and track.

### TDD is mandatory
Every feature is built test-first. No exceptions.

1. Write tests first
2. Run tests, confirm they fail
3. Implement minimum code to pass
4. Refactor while tests stay green

### Ship quality, not quantity
Code must be correct, secure, and clear. No "fix it later" TODOs in production code. No security shortcuts. No untested paths.

---

## 2. Git Workflow

### Branch Strategy

```
main (protected — never commit directly)
  └── feature/issue-123-boat-management
  └── feature/issue-456-firmware-tracking  
  └── fix/issue-789-depth-offset-bug
  └── docs/product-vision-tech-arch
```

- **main** — always deployable. Protected. Merge via PR only.
- **Feature branches** — named `feature/issue-{number}-{short-description}`
- **Fix branches** — named `fix/issue-{number}-{short-description}`
- **Docs branches** — named `docs/{short-description}`
- Every branch references a GitHub issue number.

### Commit Standards

- Conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`
- Present tense, imperative mood: "add firmware tracker" not "added firmware tracker"
- Reference issue: `feat: add firmware version database (#123)`
- One logical change per commit. Don't bundle unrelated changes.

### Pull Requests

- Every PR references a GitHub issue
- PR title matches the commit convention
- PR body includes: Summary (what and why), Test plan (how to verify)
- CI must pass before merge
- Squash merge to main (clean linear history)

### GitHub Issues

GitHub Issues is the source of truth for all work. Every feature, bug, and task has an issue.

- Issues are created before work begins
- Issues are updated as work progresses
- Issues are closed when the PR merges
- Labels: `feature`, `bug`, `docs`, `research`, `infrastructure`
- Milestones track release targets

---

## 3. Code Standards

### Go (Backend / Spoke / API)

- **Version:** Latest stable Go (1.22+)
- **Style:** `gofmt` + `golangci-lint` (default config)
- **Error handling:** Explicit. No silent swallows. Wrap errors with context: `fmt.Errorf("parse PGN 127508: %w", err)`
- **Testing:** Go standard `testing` package. Table-driven tests. Subtests for related cases.
- **Naming:** Follow Go conventions — `MixedCaps`, not `snake_case`. Exported names start with uppercase.
- **Dependencies:** Minimal. Prefer standard library. Every external dependency needs justification.
- **Documentation:** Package-level doc comments. Exported functions have doc comments. Internal functions documented when non-obvious.
- **Concurrency:** Use goroutines and channels idiomatically. No global mutable state. Protect shared state with `sync.Mutex` or `sync.RWMutex`.
- **Build tags:** Use build tags for hub vs spoke mode: `//go:build hub` / `//go:build spoke`

### TypeScript / React (Frontend)

- **Version:** TypeScript 5+, React 19, Astro 5
- **Style:** ESLint + Prettier (project config)
- **Components:** Functional components only. No class components.
- **State:** Zustand for client state, TanStack Query for server state. No Redux, no Context for state management.
- **Styling:** Tailwind CSS + Ant Design 5 components. No styled-components.
- **Testing:** Vitest for unit tests, Playwright for e2e.
- **Imports:** Absolute imports via `@/` alias. Never relative imports deeper than one level (`../`).
- **Types:** Strict mode. No `any` unless absolutely necessary with a comment explaining why.

### SQL (Database)

- **Hub:** PostgreSQL via Supabase. Migrations via Supabase CLI.
- **Spoke:** SQLite. Migrations embedded in Go binary, run on startup.
- **Naming:** `snake_case` for tables and columns. Plural table names (`boats`, `equipment`).
- **RLS:** All hub tables have Row Level Security policies. No exceptions.
- **Indexes:** Create indexes for foreign keys and commonly queried columns. Document why each index exists.

---

## 4. Testing Strategy

### Test Pyramid

```
        ╱╲
       ╱  ╲       E2E (Playwright)
      ╱    ╲      — Critical user flows only
     ╱──────╲     — Slow, run on CI only
    ╱        ╲
   ╱          ╲   Integration
  ╱            ╲  — Go: real SQLite, recorded NMEA data
 ╱              ╲ — Frontend: component tests with mocked API
╱────────────────╲
        Unit       — Fast, isolated, run on every save
                   — Go: table-driven tests
                   — Frontend: Vitest
```

### Go Testing

| Type | Scope | Database | External APIs | Run when |
|------|-------|----------|---------------|----------|
| Unit | Single function/method | None (or in-memory SQLite) | Mocked | Every save |
| Integration | Adapter + data model | Real SQLite file | Recorded data replay | Pre-commit |
| Protocol | CAN frame parsing, NMEA decode | None | Recorded binary data | Pre-commit |
| Simulator | Full spoke with simulated instruments | Real SQLite | NMEA simulator (iKreate or software) | Manual / CI |

**Recorded data:** Protocol adapter tests use recorded real-world data (CAN frames, NMEA sentences, Victron VE.Direct text). Store in `testdata/` directories. Never fabricate test data that doesn't match real protocol behavior.

### Frontend Testing

| Type | Tool | Scope | Run when |
|------|------|-------|----------|
| Unit | Vitest | Components, hooks, utilities | Every save |
| Component | Vitest + Testing Library | Components with mocked data | Pre-commit |
| E2E | Playwright | Full user flows in browser | CI only |
| Visual | Playwright screenshots | Component visual regression | CI only |

### Coverage Requirements

Coverage is enforced in CI. PRs that drop coverage below thresholds are blocked.

**Go (Backend):**

| Package | Minimum | Rationale |
|---------|---------|-----------|
| `adapters/*` | 80% | Protocol parsing is safety-adjacent. Wrong depth/position/battery readings can endanger lives. |
| `monitoring/` | 80% | Alert rules protect people and boats. |
| `model/` | 80% | Data model is the foundation everything depends on. |
| `sync/` | 70% | Conflict resolution must be correct. |
| `security/` | 70% | Security scanner must not miss real issues. |
| `agents/` | 60% | Agent logic depends on mocked LLM responses. |
| `api/` | 60% | Standard HTTP handler testing. |
| **Overall** | **60%** | Balanced against development velocity for a solo builder. |

**Frontend (TypeScript):**

| Area | Minimum | Rationale |
|------|---------|-----------|
| Safety-critical components (anchor watch, MOB, alerts) | 80% | Must not fail silently. |
| Business logic (stores, hooks, utilities) | 70% | Core application logic. |
| UI components | 50% | Test behavior, not layout. |
| **Overall** | **60%** | |

Coverage reports are uploaded to Codecov on every CI run. Thresholds are per-package, not just overall — a new feature can't hide behind high coverage elsewhere.

### Test Harnesses

The project builds dedicated test harnesses for CAN bus, NMEA 2000, and Victron protocols. These are first-class infrastructure, not afterthoughts. See `docs/engineering/testing/test-harnesses.md` for the full specification.

- **NMEA Simulator** — Go binary generating realistic instrument data (position, depth, wind, battery, engine) across configurable scenarios
- **CAN Bus Test Harness** — virtual CAN bus (Linux `vcan`) with PGN injection, frame capture, and protocol verification
- **Victron Simulator** — VE.Direct text protocol over virtual serial, MQTT topic simulation via Mosquitto
- **Recorded Data Replay** — replay captured `.can`, `.nmea`, `.vedirect` files at real-time speed for integration tests
- **Protocol Fuzzer** — malformed frames, invalid PGNs, truncated packets to test adapter robustness

### What to Test

- **Always test:** Business logic, data transformations, protocol parsing, safety-critical paths (alerts, MOB, anchor drag)
- **Test at boundaries:** API endpoints, WebSocket messages, protocol adapter input/output
- **Don't test:** Framework internals, simple getters/setters, UI layout (unless safety-critical like night mode)

---

## 5. CI/CD

### Pipeline (GitHub Actions)

```
Push to any branch
  │
  ├── Go: lint (golangci-lint) + test + build
  │     ├── Unit tests
  │     ├── Integration tests
  │     └── Cross-compile check (ARM64 + AMD64)
  │
  ├── Frontend: lint (ESLint) + typecheck + test + build
  │     ├── Vitest unit + component tests
  │     └── Astro build (SSR + static)
  │
  └── Playwright e2e (on PR only, not every push)

Merge to main
  │
  ├── All of the above
  │
  ├── Build multi-arch Docker image (ARM64 + AMD64)
  │     └── Push to container registry (GitHub Container Registry)
  │
  ├── Build static frontend (Astro)
  │     └── Deploy to CDN (Netlify / Cloudflare Pages)
  │
  └── Deploy Supabase migrations

Release tag (vX.Y.Z)
  │
  ├── Build production Docker image with version tag
  │
  ├── Create GitHub Release with changelog
  │
  └── Spoke update metadata published
```

### CI Requirements

- All tests must pass before merge
- No lint warnings (errors only — don't suppress real issues)
- Build must succeed on both ARM64 and AMD64
- Docker image must build and start successfully
- PR review is informational only (solo builder) — CI is the gate

### Branch Protection Rules (main)

- Require CI to pass
- Require linear history (squash merge)
- No force push
- No direct commits

---

## 6. Repository Structure

### Decision: Multi-Repo

The community site and the boat OS are fundamentally different projects sharing a data model. They use different languages, build tools, CI pipelines, and deployment targets. A monorepo creates coupling where there should be independence.

**Proposed repository structure:**

| Repository | Contents | Language | Deploys to |
|------------|----------|----------|------------|
| `above-deck-docs` | All documentation: vision, architecture, research, feature specs, engineering standards, protocol specs, RAG content | Markdown | GitHub Pages or docs site |
| `above-deck-os` | Spoke: Go backend, protocol adapters, data model, AI agents, monitoring, sync, security. Docker image. | Go | Container registry → spoke hardware |
| `above-deck-site` | Hub: community site, blog, KB, forums, hosted tools (passage planner, energy sizer, VHF sim). Astro + React. | TypeScript | CDN + Supabase |
| `above-deck-shared` | Shared type definitions, API contracts, data model schema. Published as packages consumed by both os and site. | Go + TypeScript | npm + Go module |

**Why multi-repo:**
- Independent CI pipelines — Go cross-compilation doesn't block frontend deploys
- Independent release cadence — spoke firmware updates != site updates
- Clear ownership boundaries — different skill sets, different concerns
- The docs repo can be public from day one even if code repos aren't ready
- Each repo has its own CLAUDE.md with repo-specific rules

**Shared contracts:**
- API schemas defined in `above-deck-shared` using Protocol Buffers or JSON Schema
- Go types generated from schema, TypeScript types generated from same schema
- Single source of truth for data model, no drift between frontend and backend
- Schema changes require updating both consumers before merge

### Current State → Future State

The current monorepo (`above-deck`) becomes `above-deck-docs` — the docs are already here and ready to port. Code moves to the new repos when implementation begins.

---

## 7. Development Environment

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Go | 1.22+ | Backend development |
| Node.js | 20+ LTS | Frontend development |
| pnpm | 9+ | Frontend package management |
| Docker | 24+ | Container builds, local development |
| Supabase CLI | Latest | Local Supabase for hub development |
| Git | 2.40+ | Version control |

### Local Development

```bash
# Clone repos
git clone above-deck-os
git clone above-deck-site
git clone above-deck-shared

# OS development (spoke)
cd above-deck-os
docker compose up    # Go API (hot reload via air) + NMEA simulator + SQLite

# Site development (hub)
cd above-deck-site
pnpm install
pnpm dev             # Astro dev server + Supabase local

# Full stack
docker compose -f docker-compose.full.yml up   # Everything
```

### NMEA Simulator

For development without a boat:
- **Software simulator:** Go program that generates realistic NMEA 2000 and 0183 data (GPS position, depth, wind, battery, engine). Configurable boat parameters.
- **Hardware simulator:** Digital Yacht iKreate for real CAN bus traffic
- **Recorded data replay:** Replay captured `.can` / `.nmea` files at real-time speed

### Environment Variables

- All config via environment variables (12-factor)
- `.env.example` checked into repo with all keys documented (no values)
- `.env` gitignored
- Docker Compose reads from `.env`

---

## 8. Release Process

### Versioning

Semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR:** Breaking changes to API, data model, or plugin interface
- **MINOR:** New features, non-breaking
- **PATCH:** Bug fixes, security patches

### Spoke Releases

1. Create release branch from main: `release/v1.2.0`
2. Update version in Go binary and frontend
3. Generate changelog from commit history
4. Tag: `git tag v1.2.0`
5. CI builds multi-arch Docker image tagged `v1.2.0` + `latest`
6. Create GitHub Release with changelog and migration notes
7. Spokes detect new version on next update check (user-initiated install)

### Site Releases

Continuous deployment — every merge to main deploys automatically. No manual release process.

### Rollback

- Spoke: previous Docker image is retained locally. Settings → Updates → Rollback.
- Site: Git revert + redeploy. CDN cache purge.
- Database: Migrations are forward-only. Rollback migrations written and tested but applied manually.

---

## 9. Security Standards

### Code Security

- No hardcoded secrets. All credentials via environment variables.
- Input validation at all system boundaries (API endpoints, WebSocket messages, NMEA input)
- SQL injection prevention: parameterized queries only, never string interpolation
- XSS prevention: React handles escaping by default. Never use raw HTML injection with unsanitized content.
- CORS restricted to known origins
- Rate limiting on all API endpoints
- JWT validation on every authenticated request
- Audit logging for security-relevant actions

### Dependency Security

- `go mod tidy` and `pnpm audit` run in CI
- Dependabot enabled for both Go modules and npm packages
- No dependencies with known critical CVEs in production
- Review dependency tree before adding any new dependency

### NMEA 2000 / CAN Bus Security

- Observe-only by default — no writes to any bus without explicit user opt-in
- Write access is per-device, requires user confirmation
- CAN bus replay detection in continuous monitoring
- GPS spoofing detection
- Device fingerprinting for anomaly detection

---

## 10. Documentation Standards

### Code Documentation

- Package-level doc comments in Go (every package has a `doc.go`)
- Exported function doc comments in Go
- TypeScript: JSDoc for public APIs and complex functions
- No redundant comments — don't document what the code already says
- Update docs when changing behavior

### Project Documentation

```
docs/
  above-deck-product-vision-v2.md     — What we're building and why
  above-deck-technical-architecture.md — Technical decisions and rationale
  engineering/
    engineering-standards.md           — This document — how we build
    repo-structure/                    — Multi-repo setup, shared contracts
    ci-cd/                             — Pipeline configs, deployment details
    testing/                           — Test strategy deep dives
    dev-environment/                   — Setup guides, simulator docs
    release-process/                   — Version management, rollback procedures
    cross-compilation/                 — ARM64/AMD64 build specifics
  features/                            — Feature specs organized by tier
    boat-systems/
    underway/
    platform/
  research/                            — Background research by topic
```

### ADRs (Architecture Decision Records)

For significant technical decisions, write a brief ADR:

```markdown
# ADR-001: SQLite for spoke, PostgreSQL for hub

**Status:** Accepted
**Date:** 2026-03-26
**Context:** [why this decision was needed]
**Decision:** [what we decided]
**Consequences:** [what this means going forward]
```

Store in `docs/engineering/adrs/`. Keep them short — one page max.

### Content Authority Model

Content exists in multiple places. These rules define what is authoritative and how content flows between systems.

**Source of truth:**

| Location | What lives here | Authority | Audience |
|----------|----------------|-----------|----------|
| `/docs/research/` | Research documents — technical deep dives, competitive analysis, protocol specs | **Canonical** — this is the primary source. Always in git, version controlled. | Internal project record |
| `/docs/features/` | Feature specifications — detailed design for each feature | **Canonical** — same as research | Internal project record |
| `/docs/engineering/` | Engineering standards, tech stack, CI/CD, testing, release process | **Canonical** | Internal project record |
| KB (site) | Published versions of the above, with metadata for search/filter/browse | **Derived** — generated from `/docs/`. Not independently authored. | Public readers |
| CMS (future) | When the CMS ships, KB articles move to the database | **Replaces KB MDX files** — becomes the published version. `/docs/` remains canonical for project records. | Public readers |

**Rules:**

1. **`/docs/` is always the project record.** It is never deleted, always in git, updated by the author. It is the authoritative version of all research, specs, and engineering docs.
2. **KB articles are the published output.** They present `/docs/` content to readers with metadata (category, tags, search). Currently implemented as MDX files that include the full content from the source doc.
3. **When a doc in `/docs/` changes, the KB article must be regenerated.** This is currently manual. Future: automate via build pipeline or CMS sync.
4. **The CMS replaces the MDX files, not `/docs/`.** When the CMS ships, KB articles move from MDX files to the database. The `/docs/` source files remain unchanged — they are the project record. The CMS reads from or is seeded from `/docs/` but can diverge (e.g., editorial improvements for readability).
5. **Engineering specs and feature specs also appear in the KB** under the Engineering category. Same rules — `/docs/` is canonical, KB is the published version.
6. **Never edit a KB article without also updating the source doc** (if the change is substantive). Keep them in sync.

**Current state (pre-CMS):**
- KB articles are MDX files in `packages/site/src/content/knowledge/`
- Research articles (`research-*.mdx`) include the full content from the corresponding `/docs/research/` file
- Engineering articles (`eng-*.mdx`, `spec-*.mdx`) are summaries with references to the full spec
- This is a bridge — it works until the CMS is built

**Future state (post-CMS):**
- KB articles live in the database (Supabase PostgreSQL)
- Admin UI for editing, publishing, versioning
- `/docs/` remains the git-versioned project record
- Build pipeline can optionally sync `/docs/` → CMS on deploy
- MDX files in `packages/site/src/content/knowledge/` are deleted

---

## 11. Error Handling & Logging

### Go Error Handling

```go
// Wrap errors with context at every level
if err != nil {
    return fmt.Errorf("parse PGN %d from source %s: %w", pgn, source, err)
}

// Use sentinel errors for expected conditions
var ErrDeviceNotFound = errors.New("device not found")

// Never silently swallow errors
// Never log and return — do one or the other
```

### Logging

- Structured logging (JSON in production, human-readable in development)
- Log levels: `debug`, `info`, `warn`, `error`
- Include context: device ID, PGN number, adapter name, user ID
- No sensitive data in logs (no passwords, tokens, or personal data)
- Log rotation: bounded disk usage, configurable retention

### Metrics

- Prometheus-compatible metrics endpoint on spoke
- Key metrics: adapter connection status, data rates, error rates, memory/CPU, query latency
- Not exposed externally — accessible from Settings → Diagnostics only

---

## 12. Lessons Learned

Check `tasks/lessons.md` before starting any work. It captures mistakes that have already been made so they don't repeat. After any correction, update the file.

This is a living document — append new lessons as they're discovered, and periodically review to remove ones that are no longer relevant.
