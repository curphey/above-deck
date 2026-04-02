# CI/CD Specification

**Date:** 2026-03-31
**Status:** Draft v1
**Parent:** [Engineering Standards](../engineering-standards.md)

---

## 1. Overview

Above Deck uses a multi-repo structure with independent CI/CD pipelines per repository. Each repo has its own release cadence, build toolchain, and deployment target. GitHub Actions is the CI/CD platform for all repos.

| Repository | Language | Deploys To | Release Model |
|------------|----------|------------|---------------|
| `above-deck-os` | Go | Docker image → ghcr.io | Tagged releases (vX.Y.Z) |
| `above-deck-site` | TypeScript (Astro/React) | CDN (Netlify or Cloudflare Pages) | Continuous (merge to main) |
| `above-deck-shared` | Go + TypeScript | npm registry + Go module tag | Tagged releases (vX.Y.Z) |
| `above-deck-docs` | Markdown | GitHub Pages | Continuous (merge to main) |

All repositories are GPL-licensed and open source. All CI artifacts (Docker images, npm packages, docs builds) are public.

---

## 2. GitHub Actions Workflows

### 2.1 `above-deck-os` (Go Spoke/Hub)

#### `ci.yml` — On every push and PR

```yaml
name: CI
on:
  push:
    branches: [main, 'feature/**', 'fix/**']
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'
      - uses: golangci/golangci-lint-action@v6
        with:
          version: latest

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'
      - name: Unit tests
        run: go test -race -count=1 ./...
      - name: Integration tests (recorded protocol data)
        run: go test -race -tags=integration ./...

  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        goos: [linux]
        goarch: [amd64, arm64]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'
      - name: Cross-compile check
        env:
          GOOS: ${{ matrix.goos }}
          GOARCH: ${{ matrix.goarch }}
          CGO_ENABLED: 1
        run: |
          # Install cross-compiler for ARM64 when building on AMD64
          if [ "$GOARCH" = "arm64" ]; then
            sudo apt-get update && sudo apt-get install -y gcc-aarch64-linux-gnu
            export CC=aarch64-linux-gnu-gcc
          fi
          go build -o /dev/null ./cmd/abovedeck/

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'
      - name: govulncheck
        run: |
          go install golang.org/x/vuln/cmd/govulncheck@latest
          govulncheck ./...
      - name: Dependency audit
        run: go mod verify
```

**Protocol data tests:** The `integration` build tag gates tests that replay recorded protocol data. Test fixtures live in `testdata/` directories alongside the adapter code:

```
adapters/
  nmea2000/
    testdata/
      recorded-frames-depth.can
      recorded-frames-wind.can
      recorded-frames-battery.can
  victron/
    testdata/
      vedirect-mppt-recording.txt
      vedirect-bmv-recording.txt
  ais/
    testdata/
      ais-sentences-type1-5.nmea
```

These are real recorded binary frames and text protocol sessions from actual marine hardware. Never fabricate test data that does not match real protocol behaviour.

#### `docker.yml` — On merge to main

```yaml
name: Docker Build
on:
  push:
    branches: [main]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-qemu-action@v3

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/metadata-action@v5
        id: meta
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=sha,prefix=
            type=raw,value=edge

      - uses: docker/build-push-action@v6
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

The `edge` tag always points to the latest main build. This is for development and testing only — spokes pull tagged releases, not edge.

#### `release.yml` — On tag vX.Y.Z

```yaml
name: Release
on:
  push:
    tags: ['v*.*.*']

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: docker/setup-qemu-action@v3
      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/metadata-action@v5
        id: meta
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=raw,value=latest

      - uses: docker/build-push-action@v6
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Generate changelog
        id: changelog
        run: |
          # Generate changelog from conventional commits since last tag
          PREV_TAG=$(git describe --tags --abbrev=0 HEAD^ 2>/dev/null || echo "")
          if [ -n "$PREV_TAG" ]; then
            CHANGELOG=$(git log --pretty=format:"- %s (%h)" $PREV_TAG..HEAD)
          else
            CHANGELOG=$(git log --pretty=format:"- %s (%h)")
          fi
          echo "changelog<<EOF" >> $GITHUB_OUTPUT
          echo "$CHANGELOG" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          body: |
            ## Docker Image

            ```bash
            docker pull ghcr.io/${{ github.repository }}:${{ github.ref_name }}
            ```

            ## Changelog

            ${{ steps.changelog.outputs.changelog }}
          generate_release_notes: true

      - name: Update spoke update metadata
        run: |
          # Write version metadata file that spokes check for updates
          echo '{"version":"${{ github.ref_name }}","released":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","image":"ghcr.io/${{ github.repository }}:${{ github.ref_name }}"}' > update-metadata.json
          # Upload as release asset
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

### 2.2 `above-deck-site` (Astro/React Hub Frontend)

#### `ci.yml` — On every push and PR

```yaml
name: CI
on:
  push:
    branches: [main, 'feature/**', 'fix/**']
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile

      - name: ESLint
        run: pnpm lint

      - name: TypeScript typecheck
        run: pnpm typecheck

      - name: Vitest
        run: pnpm test

      - name: Astro build
        run: pnpm build

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - name: Audit dependencies
        run: pnpm audit --production
```

#### `e2e.yml` — On PR only

```yaml
name: E2E Tests
on:
  pull_request:
    branches: [main]

jobs:
  playwright:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium
      - name: Run Playwright tests
        run: pnpm exec playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

#### `deploy.yml` — On merge to main

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build

      # Option A: Netlify
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v3
        with:
          publish-dir: ./dist
          production-deploy: true
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}

      # Option B: Cloudflare Pages (alternative — use one or the other)
      # - name: Deploy to Cloudflare Pages
      #   uses: cloudflare/wrangler-action@v3
      #   with:
      #     apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      #     accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      #     command: pages deploy ./dist --project-name=above-deck-site

  supabase-migrations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - name: Push migrations
        run: supabase db push --linked
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
```

---

### 2.3 `above-deck-shared` (Shared Types/Schemas)

#### `ci.yml` — On every push and PR

```yaml
name: CI
on:
  push:
    branches: [main, 'feature/**', 'fix/**']
  pull_request:
    branches: [main]

jobs:
  go:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'
      - uses: golangci/golangci-lint-action@v6
      - run: go test -race ./...
      - run: go vet ./...

  typescript:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test

  schema-sync:
    runs-on: ubuntu-latest
    needs: [go, typescript]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - name: Verify Go and TypeScript types are in sync
        run: |
          # Regenerate types from schema source of truth
          make generate-types
          # Fail if generated files differ from committed files
          git diff --exit-code -- '*.go' '*.ts'
```

The schema-sync job ensures that Go structs and TypeScript interfaces are always generated from the same source schema (JSON Schema or Protocol Buffers). If someone edits a generated file by hand instead of updating the schema, CI catches it.

#### `publish.yml` — On tag vX.Y.Z

```yaml
name: Publish
on:
  push:
    tags: ['v*.*.*']

jobs:
  publish-npm:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: 'https://registry.npmjs.org'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  tag-go-module:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Verify Go module
        run: |
          # The git tag already serves as the Go module version.
          # Verify the module is valid.
          go mod verify
```

Go modules use the git tag directly — `go get github.com/above-deck/above-deck-shared@v1.2.0`. No separate publish step needed.

---

### 2.4 `above-deck-docs` (Documentation)

#### `build.yml` — On push to main and PRs

```yaml
name: Docs
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # If using a docs framework (VitePress, Starlight, etc.)
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build

  link-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check internal links
        uses: lycheeverse/lychee-action@v2
        with:
          args: --no-progress --exclude-mail '**/*.md'
          fail: true

  deploy:
    if: github.ref == 'refs/heads/main'
    needs: [build, link-check]
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist/
      - uses: actions/deploy-pages@v4
```

---

## 3. Docker Build Details

### 3.1 Multi-Stage Dockerfile for `above-deck-os`

```dockerfile
# ──────────────────────────────────────────────
# Stage 1: Build the Go binary
# ──────────────────────────────────────────────
FROM --platform=$BUILDPLATFORM golang:1.22-alpine AS builder

RUN apk add --no-cache gcc musl-dev sqlite-dev

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download

COPY . .

ARG TARGETOS
ARG TARGETARCH
ARG VERSION=dev

# CGO required for SQLite (go-sqlite3) and sqlite-vec
RUN --mount=type=cache,target=/root/.cache/go-build \
    --mount=type=cache,target=/go/pkg/mod \
    GOOS=${TARGETOS} GOARCH=${TARGETARCH} CGO_ENABLED=1 \
    go build \
      -ldflags="-s -w -X main.version=${VERSION}" \
      -o /out/abovedeck \
      ./cmd/abovedeck/

# ──────────────────────────────────────────────
# Stage 2: Production image
# ──────────────────────────────────────────────
FROM alpine:3.20

RUN apk add --no-cache \
    ca-certificates \
    sqlite-libs \
    tzdata \
    && addgroup -S abovedeck \
    && adduser -S abovedeck -G abovedeck

COPY --from=builder /out/abovedeck /usr/local/bin/abovedeck

# Data directory for SQLite databases, cached charts, GRIB files
RUN mkdir -p /data && chown abovedeck:abovedeck /data
VOLUME /data

USER abovedeck

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:8080/api/health || exit 1

# Entrypoint handles SIGTERM for graceful shutdown
ENTRYPOINT ["abovedeck"]
CMD ["serve", "--data-dir=/data"]
```

### 3.2 Build Targets

| Tag | Meaning | Built When |
|-----|---------|------------|
| `edge` | Latest main build | Every merge to main |
| `sha-abc1234` | Specific commit | Every merge to main |
| `v1.2.3` | Exact release version | On release tag |
| `1.2` | Latest patch for this minor | On release tag |
| `latest` | Latest stable release | On release tag |

### 3.3 Image Size Target

Target: **under 100MB** compressed.

The Go binary with embedded frontend assets (via `embed.FS`) should be 30-50MB. Alpine base adds ~7MB. SQLite libs add ~2MB. Total well under budget.

If the image grows beyond 100MB, investigate:
- Are frontend assets being optimized (minified, compressed)?
- Are unnecessary files being copied into the build context?
- Is the Go binary being stripped (`-ldflags="-s -w"`)?

### 3.4 Multi-Architecture

Both `linux/amd64` and `linux/arm64` are first-class targets:

- **AMD64** — Intel N100 mini PCs, Mac Mini via OrbStack VM, any x86 server
- **ARM64** — HALPI2 (Compute Module 5), Mac Mini M4 via OrbStack VM, Raspberry Pi 5

Docker buildx with QEMU handles cross-compilation in CI. The `--platform` flag in the Dockerfile ensures correct architecture binaries.

### 3.5 Signal Handling

The Go binary handles OS signals for graceful shutdown:

```go
ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM, syscall.SIGINT)
defer stop()

// Start services...

<-ctx.Done()
// Graceful shutdown: flush SQLite WAL, close protocol adapters, drain sync queue
```

Docker sends SIGTERM on `docker stop`. The binary has 30 seconds (Docker default) to clean up before SIGKILL.

---

## 4. Environment Management

### 4.1 Secrets in GitHub Actions

Each repository configures its own secrets. No organisation-level secrets unless truly shared.

**`above-deck-os`:**

| Secret | Purpose |
|--------|---------|
| `GITHUB_TOKEN` | Automatic — push to ghcr.io |

No additional secrets needed. The Docker image is pushed to GitHub Container Registry using the built-in `GITHUB_TOKEN`.

**`above-deck-site`:**

| Secret | Purpose |
|--------|---------|
| `NETLIFY_AUTH_TOKEN` | Deploy to Netlify |
| `NETLIFY_SITE_ID` | Netlify site identifier |
| `SUPABASE_ACCESS_TOKEN` | Push migrations |
| `SUPABASE_DB_PASSWORD` | Database access for migrations |

**`above-deck-shared`:**

| Secret | Purpose |
|--------|---------|
| `NPM_TOKEN` | Publish to npm registry |

**`above-deck-docs`:**

| Secret | Purpose |
|--------|---------|
| `GITHUB_TOKEN` | Automatic — deploy to GitHub Pages |

### 4.2 `.env.example` Files

Every repo includes a `.env.example` with all configuration keys documented and no values:

```bash
# above-deck-os/.env.example

# Server
PORT=8080
DATA_DIR=/data
LOG_LEVEL=info          # debug, info, warn, error
LOG_FORMAT=json         # json, text

# Mode
MODE=spoke              # spoke, hub

# Protocol adapters (spoke only)
NMEA_TCP_HOST=          # NavLink2 IP, e.g. 192.168.1.100
NMEA_TCP_PORT=10110
VICTRON_SERIAL_PORT=    # e.g. /dev/ttyUSB0
AIS_UDP_PORT=10111

# Sync (spoke only)
HUB_URL=                # e.g. https://api.abovedeck.org
SYNC_INTERVAL=300       # seconds

# AI agents
ANTHROPIC_API_KEY=      # Claude API key for agent reasoning

# Hub-only settings
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

The `.env` file is always gitignored.

### 4.3 Environment Tiers

| Environment | Purpose | Config Source |
|-------------|---------|---------------|
| **Development** | Local machine, `docker compose up` | `.env` file |
| **CI** | GitHub Actions runners | GitHub Secrets + workflow env vars |
| **Staging** | Pre-production validation (when needed) | Hosting platform env vars |
| **Production (hub)** | Live hub API and frontend | Hosting platform env vars |
| **Production (spoke)** | On-boat Docker container | `.env` file on boat hardware |

There is no staging environment at launch. When one is needed, it will mirror production configuration with a separate Supabase project and deployment target.

---

## 5. Dependency Management

### 5.1 Dependabot Configuration

Every repo includes `.github/dependabot.yml`:

```yaml
# above-deck-os
version: 2
updates:
  - package-ecosystem: gomod
    directory: /
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 10
    labels: ["dependencies", "go"]

  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
    labels: ["dependencies", "ci"]

  - package-ecosystem: docker
    directory: /
    schedule:
      interval: weekly
    labels: ["dependencies", "docker"]
```

```yaml
# above-deck-site
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 10
    labels: ["dependencies", "npm"]
    versioning-strategy: increase

  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
    labels: ["dependencies", "ci"]
```

```yaml
# above-deck-shared
version: 2
updates:
  - package-ecosystem: gomod
    directory: /
    schedule:
      interval: weekly
    labels: ["dependencies", "go"]

  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    labels: ["dependencies", "npm"]

  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
    labels: ["dependencies", "ci"]
```

### 5.2 Go Module Versioning

Go modules follow semver via git tags. The `above-deck-shared` module is imported as:

```go
import "github.com/above-deck/above-deck-shared/v2"
```

Major version bumps (v2+) use the `/v2` suffix in the import path per Go module conventions.

### 5.3 npm Package Versioning

The `@above-deck/shared` npm package follows semver. Version is set in `package.json` and must match the git tag.

### 5.4 Schema Change Propagation

When a shared schema changes, the update path is:

```
1. Update schema source of truth in above-deck-shared
   (JSON Schema, Protocol Buffers, or hand-maintained types)

2. Regenerate Go types and TypeScript types
   → make generate-types

3. Run CI on above-deck-shared
   → schema-sync job verifies generated code matches

4. Tag and publish above-deck-shared
   → npm publish + git tag for Go module

5. Update consumers:
   → above-deck-os:   go get github.com/above-deck/above-deck-shared@v1.3.0
   → above-deck-site: pnpm update @above-deck/shared

6. CI on each consumer validates compatibility
```

Breaking schema changes require a coordinated release (see Section 7).

---

## 6. Release Automation

### 6.1 Semantic Versioning

All repos follow semver: `MAJOR.MINOR.PATCH`

- **MAJOR** — breaking changes to API, data model, or shared schema
- **MINOR** — new features, backwards-compatible
- **PATCH** — bug fixes, security patches

### 6.2 Changelog Generation

Changelogs are generated from conventional commits. The release workflow extracts commit messages between the previous tag and the current tag.

Commit prefixes map to changelog sections:

| Prefix | Changelog Section |
|--------|------------------|
| `feat:` | Features |
| `fix:` | Bug Fixes |
| `docs:` | Documentation |
| `refactor:` | Refactoring |
| `test:` | Tests |
| `chore:` | Maintenance |

Security fixes (`fix:` with `security` in the message or a `security` label) are called out separately.

### 6.3 Docker Image Tag Strategy

| Tag Pattern | Example | Mutability | Purpose |
|-------------|---------|------------|---------|
| `vX.Y.Z` | `v1.2.3` | Immutable | Exact release — spokes pin to this |
| `X.Y` | `1.2` | Mutable | Latest patch for minor version |
| `latest` | — | Mutable | Latest stable release |
| `edge` | — | Mutable | Latest main build (development only) |
| `sha-<hash>` | `sha-abc1234` | Immutable | Specific commit (debugging, rollback) |

Spokes should pin to `vX.Y.Z` tags. The `latest` and `edge` tags exist for convenience but are not recommended for production boats.

### 6.4 Release Process

```
1. Ensure main is green (all CI checks pass)

2. Create release branch: release/v1.2.0
   → Update version in Go binary (ldflags)
   → Update any hardcoded version strings

3. Tag: git tag v1.2.0

4. Push tag: git push origin v1.2.0

5. CI automatically:
   → Builds multi-arch Docker image
   → Pushes to ghcr.io with version tags
   → Creates GitHub Release with changelog
   → Publishes update metadata for spoke discovery

6. Merge release branch back to main
```

### 6.5 Spoke Update Notification

Spokes check for updates by fetching a metadata file from the GitHub Release:

```json
{
  "version": "v1.2.3",
  "released": "2026-04-01T12:00:00Z",
  "image": "ghcr.io/above-deck/above-deck-os:v1.2.3",
  "changelog_url": "https://github.com/above-deck/above-deck-os/releases/tag/v1.2.3",
  "min_version": "v1.0.0"
}
```

The spoke checks this endpoint periodically when it has internet connectivity. Updates are always user-initiated — never automatic. The UI shows a notification: "Version 1.2.3 available" with a link to the changelog and a button to pull the new image.

The `min_version` field indicates the minimum version that can upgrade directly. If a spoke is below `min_version`, it must upgrade through intermediate versions (for migration compatibility).

---

## 7. Cross-Repo Coordination

### 7.1 Independent by Default

Most changes are repo-local. A bug fix in `above-deck-os` does not require changes in `above-deck-site`. Each repo has its own CI, its own release cadence, and its own deployment target. This is the normal case.

### 7.2 Coordinated Schema Changes

When a shared schema change affects multiple consumers:

**Non-breaking changes (additive fields, new types):**

```
1. Add new types/fields in above-deck-shared
2. Publish new version of above-deck-shared
3. Update above-deck-os at convenience (new fields are optional)
4. Update above-deck-site at convenience (new fields are optional)
```

No coordination needed. Consumers update on their own schedule.

**Breaking changes (removed fields, type changes, renamed paths):**

```
1. Open tracking issue describing the breaking change and affected repos

2. Update above-deck-shared with the breaking change
   → CI validates Go and TypeScript types compile
   → Do NOT publish yet

3. Update above-deck-os to work with new schema
   → Reference the shared branch/commit directly for testing
   → CI validates build and tests pass

4. Update above-deck-site to work with new schema
   → Reference the shared branch/commit directly for testing
   → CI validates build and tests pass

5. Publish above-deck-shared (tag + npm publish)

6. Merge above-deck-os and above-deck-site updates
   → Both now point to the published version

7. Close tracking issue
```

Breaking changes should be rare. Prefer additive changes with deprecation periods.

### 7.3 Reusable Workflows

Common CI steps are extracted into reusable workflows in a `.github` repository or within each repo:

```yaml
# .github/workflows/go-ci.yml (reusable)
name: Go CI
on:
  workflow_call:
    inputs:
      go-version:
        type: string
        default: '1.22'

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: ${{ inputs.go-version }}
      - uses: golangci/golangci-lint-action@v6

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: ${{ inputs.go-version }}
      - run: go test -race ./...

  vulncheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: ${{ inputs.go-version }}
      - run: |
          go install golang.org/x/vuln/cmd/govulncheck@latest
          govulncheck ./...
```

Consumers call it with:

```yaml
jobs:
  ci:
    uses: above-deck/.github/.github/workflows/go-ci.yml@main
    with:
      go-version: '1.22'
```

This keeps CI definitions consistent across repos without duplicating YAML.

### 7.4 Cross-Repo CI Validation

For critical shared changes, the `above-deck-shared` CI can optionally validate that consumers still build:

```yaml
  validate-consumers:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        repo: [above-deck-os, above-deck-site]
    steps:
      - uses: actions/checkout@v4
        with:
          repository: above-deck/${{ matrix.repo }}

      # Replace shared dependency with current branch version
      - name: Use local shared package
        run: |
          # For Go: use replace directive
          go mod edit -replace github.com/above-deck/above-deck-shared=../above-deck-shared
          # For npm: use file: protocol or npm link

      - name: Build consumer
        run: make build
```

This is optional and only used for breaking changes. It should not run on every push to shared — that would create tight coupling and slow CI.

---

## 8. Branch Protection Rules

All repos apply the same branch protection on `main`:

| Rule | Setting |
|------|---------|
| Require status checks to pass | Yes — all CI jobs |
| Require linear history | Yes — squash merge only |
| Restrict pushes | Yes — no direct commits |
| Allow force push | No |
| Allow deletions | No |
| Require signed commits | Optional (recommended) |

PR review is informational only — this is a solo-builder project. CI is the gate, not human review.

---

## 9. Summary

| Repo | CI Trigger | Deploy Trigger | Release Trigger |
|------|-----------|----------------|-----------------|
| `above-deck-os` | Push/PR: lint, test, build | Merge to main: Docker edge image | Tag vX.Y.Z: Docker release image + GitHub Release |
| `above-deck-site` | Push/PR: lint, typecheck, test, build | Merge to main: deploy to CDN + Supabase migrations | Continuous — no manual releases |
| `above-deck-shared` | Push/PR: lint, test (Go + TS), schema sync | — | Tag vX.Y.Z: npm publish + Go module tag |
| `above-deck-docs` | Push/PR: build, link check | Merge to main: deploy to GitHub Pages | Continuous — no manual releases |

Every pipeline follows the same principles:
- CI is the gate — all checks must pass before merge
- Conventional commits drive changelogs
- Semantic versioning for all packages and images
- No manual steps in deployment (except spoke updates, which are user-initiated)
- Security scanning (govulncheck, pnpm audit, Dependabot) runs on every build
