# Release Process

**Date:** 2026-03-31
**Status:** Draft v1
**Parent:** [Engineering Standards](../engineering-standards.md)

---

## 1. Semantic Versioning

All Above Deck repositories follow [Semantic Versioning 2.0.0](https://semver.org/): `MAJOR.MINOR.PATCH`.

| Increment | When | Examples |
|-----------|------|----------|
| **MAJOR** | Breaking changes to the sync protocol, data model schema, REST/WebSocket API contracts, or agent plugin interface. Any change that requires spoke owners to take manual action beyond pulling an update. | Data model restructure requiring manual migration, sync protocol v2 incompatible with v1, removal of a public API endpoint |
| **MINOR** | New features, new protocol adapters, new agent capabilities, new API endpoints. Backward-compatible additions. | Add Victron MQTT adapter, add anchor watch alert, new dashboard widget |
| **PATCH** | Bug fixes, security patches, performance improvements, documentation corrections within code. No new features, no breaking changes. | Fix depth offset calculation, patch WebSocket reconnection logic, correct PGN parsing edge case |

### Pre-release versions

- **Beta:** `v1.2.0-beta.1` — feature-complete but not fully tested in the field
- **Release candidate:** `v1.2.0-rc.1` — believed ready, pending final validation

### Version synchronization

Each repository is versioned independently. `above-deck-os` v2.1.0 does not imply `above-deck-site` v2.1.0. The shared schema version is the compatibility contract between them.

---

## 2. Changelog Generation

Changelogs are generated automatically from conventional commit messages.

### Commit prefix mapping

| Prefix | Changelog Section |
|--------|-------------------|
| `feat:` | Added |
| `fix:` | Fixed |
| `refactor:` | Changed |
| `perf:` | Performance |
| `docs:` | Documentation |
| `test:` | Testing |
| `chore:` | Maintenance |

### Process

1. All commits on `main` follow conventional commit format (enforced by CI)
2. On release, a changelog is generated from commits since the last tag
3. The generated changelog is included in the GitHub Release body
4. Breaking changes (commits containing `BREAKING CHANGE:` in the footer or `!` after the type) are highlighted at the top

### Tooling

- Go repos: `git-cliff` or equivalent — configured to parse conventional commits
- TypeScript repos: `changesets` or `git-cliff` — same format, same output

---

## 3. Spoke Release Flow

The spoke (`above-deck-os`) ships as a Docker image running on boat hardware. Releases must be reliable — a broken update on a boat at sea is not acceptable.

### Step-by-step flow

```
Feature ready on feature branch
  │
  ├── 1. Merge feature PR to main (CI passes, squash merge)
  │
  ├── 2. When ready to release: create release branch
  │      git checkout -b release/v1.2.0 main
  │
  ├── 3. Version bump
  │      Update version constant in Go source
  │      Update embedded frontend version (if bundled)
  │
  ├── 4. Feature freeze on release branch
  │      Only bug fixes from this point
  │
  ├── 5. Testing
  │      ├── Full CI suite (unit + integration + protocol tests)
  │      ├── Docker image builds for ARM64 + AMD64
  │      ├── Manual testing on real spoke hardware (Mac Mini or Pi)
  │      ├── Migration testing (fresh install + upgrade from N-1)
  │      └── Simulated NMEA data replay test
  │
  ├── 6. Tag release
  │      git tag v1.2.0
  │      git push origin v1.2.0
  │
  ├── 7. CI builds and publishes
  │      ├── Multi-arch Docker image → GitHub Container Registry
  │      ├── Tagged: v1.2.0, latest
  │      └── GitHub Release created with generated changelog
  │
  ├── 8. Update spoke metadata (see section 9)
  │
  └── 9. Merge release branch back to main
         git checkout main
         git merge release/v1.2.0
```

### Migration handling

SQLite schema changes are embedded in the Go binary as numbered migration files. On startup, the spoke:

1. Reads the current schema version from `schema_migrations` table
2. Applies any pending migrations in order
3. Logs each migration applied
4. If a migration fails, the spoke refuses to start and logs the error clearly

Migrations are tested in CI:
- Fresh database: all migrations applied from scratch
- Upgrade path: migrations applied from N-2 to current version

### Breaking change communication

When a release contains breaking changes:

1. The changelog highlights `BREAKING CHANGE` entries at the top
2. The GitHub Release is marked as containing breaking changes
3. The spoke update metadata includes a `breaking: true` flag
4. The in-app update notification warns the user before they install
5. Migration instructions are linked from the release notes

---

## 4. Site Release Flow

The community site (`above-deck-site`) uses continuous deployment.

```
Merge PR to main
  │
  ├── CI runs: lint, typecheck, unit tests, build
  │
  ├── Playwright e2e tests pass
  │
  ├── Astro builds static + SSR output
  │
  ├── Deploy to CDN (Netlify / Cloudflare Pages)
  │
  └── Supabase migrations applied (if any)
```

- No manual release process. Every merge to `main` is a deploy.
- Rollback is a git revert + merge to `main`, which triggers a new deploy.
- Database migrations are applied automatically by CI after frontend deploy succeeds.

---

## 5. Shared Schema Release Flow

The shared schema (`above-deck-shared`) defines the contract between spoke and site. Changes here affect both consumers and must be coordinated.

### Step-by-step flow

```
Schema change needed
  │
  ├── 1. Create feature branch in above-deck-shared
  │      Update .proto or JSON Schema definitions
  │
  ├── 2. Regenerate types
  │      Run codegen scripts → Go types + TypeScript types
  │
  ├── 3. Version bump
  │      Bump Go module version and npm package version
  │
  ├── 4. Merge PR to main in above-deck-shared
  │      CI validates schema consistency and codegen output
  │
  ├── 5. Publish
  │      Go: new module version available via go get
  │      TypeScript: publish to npm (or GitHub Packages)
  │
  ├── 6. Update consumers
  │      ├── above-deck-os: go get above-deck-shared@v1.3.0
  │      ├── above-deck-site: pnpm update @above-deck/shared
  │      └── Each update is a PR in the respective repo
  │
  ├── 7. Test consumers
  │      CI validates that both repos build and test clean with new schema
  │
  └── 8. Merge consumer PRs
```

### Rules

- Schema changes must be backward-compatible where possible (additive fields, not removals)
- Breaking schema changes require a MAJOR version bump in `above-deck-shared`
- Both consumers must update before the old schema version is considered deprecated
- CI in each consumer repo validates against the pinned shared version

---

## 6. Docs Release Flow

The documentation (`above-deck-docs`) uses continuous deployment.

```
Merge PR to main
  │
  └── Deploy to GitHub Pages (or docs hosting)
```

- No versioning, no release tags. Docs are always current.
- Build step validates all internal links and generates the static site.
- Broken links fail the build.

---

## 7. Hotfix Process

A critical bug is discovered in a production spoke release.

```
Bug reported in v1.2.0
  │
  ├── 1. Create hotfix branch from tag
  │      git checkout -b hotfix/v1.2.1 v1.2.0
  │
  ├── 2. Fix the bug
  │      Write test that reproduces the bug
  │      Implement fix, confirm test passes
  │
  ├── 3. Bump patch version
  │      v1.2.0 → v1.2.1
  │
  ├── 4. Test
  │      Full CI suite
  │      Manual verification on spoke hardware
  │      Migration test (v1.2.0 → v1.2.1)
  │
  ├── 5. Tag and release
  │      git tag v1.2.1
  │      CI builds Docker image, creates GitHub Release
  │
  ├── 6. Merge hotfix to main
  │      git checkout main
  │      git merge hotfix/v1.2.1
  │
  └── 7. Update spoke metadata
```

Hotfixes bypass the normal release branch process. Speed matters when boats are affected.

---

## 8. Docker Image Tagging Strategy

All spoke Docker images are published to GitHub Container Registry (`ghcr.io`).

| Tag | Meaning | When updated |
|-----|---------|--------------|
| `latest` | Latest stable release | On every release tag |
| `vX.Y.Z` | Specific release version | Immutable — set once at release |
| `sha-abc1234` | Specific commit build | On every push to main (for testing) |
| `beta` | Latest beta channel build | On every beta tag (`v1.2.0-beta.1`) |

### Rules

- `latest` always points to a full release, never a beta or RC
- Version tags (`vX.Y.Z`) are immutable — never overwrite a published version tag
- Commit SHA tags are for development and testing only — not for production spokes
- `beta` is a rolling tag for users who opt into the beta update channel
- All images are multi-arch: `linux/arm64` (Mac Mini M4, Pi) and `linux/amd64`

---

## 9. Spoke Update Metadata

A JSON file hosted on the hub describes available versions. Spokes check this file periodically (user-initiated or on a schedule configured by the user).

### Metadata format

```json
{
  "current_stable": "1.2.1",
  "current_beta": "1.3.0-beta.2",
  "minimum_supported": "1.0.0",
  "versions": [
    {
      "version": "1.2.1",
      "channel": "stable",
      "released": "2026-03-28T00:00:00Z",
      "docker_image": "ghcr.io/above-deck/os:v1.2.1",
      "release_notes_url": "https://github.com/above-deck/above-deck-os/releases/tag/v1.2.1",
      "breaking": false,
      "min_upgrade_from": "1.0.0",
      "migrations": true,
      "checksum": "sha256:abc123..."
    }
  ]
}
```

### Fields

| Field | Purpose |
|-------|---------|
| `current_stable` | Latest stable version — spokes compare against this |
| `current_beta` | Latest beta version — for users on the beta channel |
| `minimum_supported` | Oldest version that can still sync with the hub. Below this, the spoke must update. |
| `version` | Specific version string |
| `channel` | `stable` or `beta` |
| `released` | ISO 8601 release timestamp |
| `docker_image` | Full Docker image reference |
| `release_notes_url` | Link to GitHub Release |
| `breaking` | Whether this version contains breaking changes |
| `min_upgrade_from` | Oldest version that can upgrade directly to this one |
| `migrations` | Whether this version includes database migrations |
| `checksum` | SHA-256 digest of the Docker image for verification |

### Update flow on spoke

1. Spoke checks metadata endpoint (configurable interval, default daily)
2. Compares `current_stable` (or `current_beta`) against local version
3. If newer version available, shows notification in Settings > Updates
4. User reviews release notes and initiates update
5. Spoke pulls new Docker image, verifies checksum
6. Restarts with new image
7. Startup migrations run automatically
8. If startup fails, user can rollback (see section 11)

Updates are never automatic. The user always initiates.

---

## 10. Migration Strategy

### SQLite (Spoke)

- Migrations are SQL files embedded in the Go binary using `embed.FS`
- Numbered sequentially: `001_initial_schema.sql`, `002_add_equipment_table.sql`
- Applied on startup in order, tracked in `schema_migrations` table
- Each migration runs in a transaction — if it fails, it rolls back cleanly
- Migrations are forward-only in production (rollback migrations exist but are manual)
- Tested in CI: fresh install path and upgrade path from N-2

### PostgreSQL (Hub)

- Managed via Supabase CLI migrations
- Applied in CI after frontend deploy
- Migration files live in the `above-deck-site` repo under `supabase/migrations/`
- Each migration includes both `up` and `down` SQL
- RLS policies are part of migrations — no table exists without a security policy

### Data model changes

- Schema changes in `above-deck-shared` generate types for both Go and TypeScript
- Additive changes (new fields, new tables) are always preferred over modifications
- New fields have sensible defaults so existing data remains valid
- Enum extensions add new values but never remove or rename existing ones

### Breaking data model changes

When a breaking change is unavoidable:

1. Document the change in the release notes with a migration guide
2. Provide a data migration script (embedded in the Go binary for spoke, in Supabase migrations for hub)
3. The spoke runs the migration automatically on startup
4. If the migration is risky (data loss potential), the spoke backs up the database first
5. The backup is retained until the user confirms the upgrade is working

---

## 11. Rollback Procedures

### Spoke rollback

- The spoke retains the previous two Docker images locally (N-1 and N-2)
- Settings > Updates > Rollback shows available previous versions
- One click to rollback: stops current container, starts previous image
- If the rollback version has a different schema, the database rollback migration runs (tested but manual confirmation required)
- Rollback is logged and reported to the hub on next sync

### Hub API rollback

- Deploy the previous Docker image from GitHub Container Registry
- The CI pipeline supports deploying any tagged version
- DNS/load balancer cutover is immediate

### Hub frontend rollback

- CDN cache serves the previous build while a new deploy propagates
- Git revert the breaking commit, merge to main, which triggers redeploy
- CDN cache purge if the stale version is causing issues

### Database rollback

- Every migration has a corresponding `down` migration
- Down migrations are tested in CI but applied manually — never automatically
- For spoke SQLite: restore from the pre-upgrade backup file
- For hub PostgreSQL: run the down migration via Supabase CLI
- Data-destructive rollbacks (dropping columns) require explicit confirmation

### When rollback is not possible

If a migration has already transformed data in a way that cannot be reversed:

1. Document this clearly in the release notes before the release ships
2. The spoke takes an automatic backup before applying the migration
3. The backup file is the rollback path — restore it manually if needed
4. This situation should be rare and treated as a MAJOR version change

---

## 12. Communication

### Every release

- **GitHub Release** with auto-generated changelog, highlighted breaking changes, and migration notes
- **Spoke update metadata** updated so boats see the new version

### Minor and major releases

- **Blog post** on the community site explaining what changed and why
- **In-app notification** on spokes when a new version is available (non-intrusive, user-initiated updates only)

### Breaking changes

- **Migration guide** linked from the GitHub Release and the blog post
- **Advance notice** — breaking changes are announced at least one minor version before they land (deprecation warnings in logs)
- **Forum thread** for community discussion and support during migration

### Channels

| Channel | Audience | Content |
|---------|----------|---------|
| GitHub Releases | Contributors, power users | Full technical changelog |
| Blog | All users | Human-readable summary, screenshots, context |
| In-app notification | Spoke operators | Version available, one-line summary, link to notes |
| Forum | Community | Discussion, migration help, feedback |
