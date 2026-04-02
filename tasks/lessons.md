# Lessons Learned

<!-- Check this file before starting work. Update after any correction. -->

## Astro Islands + Docker

- `import.meta.env.PUBLIC_*` vars are **inlined at build time** by Astro/Vite. In Docker, pass them as `ARG`/`ENV` before `RUN astro build`. Runtime `--env-file` only sets process.env, not the client bundle.
- `client:only="react"` creates an independent React root. It does NOT inherit providers (MantineProvider, QueryClient) from other islands like `AppShellWrapper`. Each `client:only` island must wrap itself.
- `client:load` = SSR + hydrate. If a hook calls browser-only APIs (Supabase client, localStorage), use `client:only` to skip SSR entirely.
- Docker `--no-cache` is needed when build args change — cached layers won't re-evaluate ARG values.
- `source .env` doesn't export vars. Use `export $(grep '^PUBLIC_' .env | xargs)` for Docker build args.

## Supabase SSR Auth

- Astro's `AstroCookies` does NOT have a `.headers()` method. Use `cookies.getAll()` directly in the `@supabase/ssr` cookie adapter.
- Signout must call `supabase.auth.signOut()` via the server client, not manually delete cookie names. Cookie names are project-specific (`sb-<project-ref>-auth-token`), not generic.
- `SECURITY DEFINER` functions need `SET search_path = public, auth` to prevent schema injection.

## Astro SSR + Static Pages

- In `output: 'server'` mode, pages using `getStaticPaths()` MUST also export `prerender = true`, otherwise the build fails.
- Content collection pages (blog, knowledge base) should use `prerender = true` since they're static content.
- Pass `props: { post }` from `getStaticPaths` instead of re-fetching the collection at runtime.

## React Patterns

- `setTimeout` in event handlers must be tracked with `useRef` and cleared on unmount to prevent memory leaks.
- Don't use `setUser()` side-effects inside TanStack Query `queryFn` — derive state from the query's `data` field instead.
- Mantine `Switch` `onChange` fires from keyboard (Space bar), but `onClick` only fires from mouse. Use `onChange` for the toggle logic and `onClick` only for `stopPropagation`.
- Variable dependency arrays in `useEffect` cause it to fire every render. Serialize deps with `JSON.stringify` for a stable comparison key.
- Create Supabase client as a singleton (module-level cache) to avoid re-instantiation on every render.

## KB API Security

- Path traversal prevention: `slug.replace(/\.\./g, '')` leaves multiple slashes (e.g. `../../etc/passwd` → `//etc/passwd`). Must use `/^\/+/` (strip ALL leading slashes), not `/^\//` (strip one). The `startsWith(DOCS_BASE)` check is a safety net, but normalization should be correct too.
- Writing tests for path validation immediately caught this bug — TDD would have prevented it from being committed in the first place.

## Code Quality

- Always import `HEADING_FONT` from `@/theme/fonts` — never declare local copies. Local constants drift from the source of truth.
- Region data must have a single source of truth: `@/lib/solar/regions.ts`. The old `REGIONS` array in `RegionPicker.tsx` had diverging PSH values.
- PVGIS API response types should be explicit — avoid `any` in `.map()` callbacks. Type the response shape inline or in `types.ts`.
- Dead components (superseded by newer versions) should be deleted along with their tests. Check for imports before removing.

## PostgREST / Supabase Queries

- `.or()` filter strings are not sanitized. Escape `%`, `_`, `,`, `.` in user search input before interpolating into `ilike` patterns.

## Chartplotter Map Tiles

- MapLibre demo tiles (`demotiles.maplibre.org`) have very limited coverage and minimal detail — NOT suitable for a real nautical chart. Use OpenMapTiles, Protomaps, or MapTiler for proper base geography.
- Always verify map tiles render visible content at the target zoom/position BEFORE building features on top. A blank dark canvas with vessel dots is useless.
- Vessel positions must be placed at realistic geographic locations (near harbours, in shipping channels) — not arbitrary offsets from a coastguard station position.
- The chart is foundational — everything else (vessels, weather, popups) is meaningless without visible coastline and features.

## Claude Tool Use (Go API)

- The Claude API's tool_use feature requires a loop: send request with tools → check `stop_reason` → if `"tool_use"`, execute the tool, send `tool_result` back → repeat until `stop_reason` is `"end_turn"`. Cap iterations (we use 5) to prevent infinite loops.
- `tool_result` content can be a plain string — no need to wrap in content block arrays.
- Tool names in Go agent definitions (`RadioAgent.Tools[]`) must exactly match names in the executor registry. A mismatch silently skips tools (the `DefinitionsForLLM` method filters by name).
- `ToolExecutorInterface` should be an optional dependency (`SetToolExecutor` method) — agents without tools should fall back gracefully to plain `SendMessage`.
- When adding a new method to a Go interface (e.g., `SendMessageWithTools` to `LLMClient`), ALL mock implementations in test files must add the new method or tests won't compile.

## Cross-Store Data Bridges

- When two Zustand stores need the same data in different shapes (e.g., chart vessels → VHF AIS targets), use a bridge hook (`useAISBridge`) that reads from one store and writes to another. Don't duplicate the WebSocket connection.
- Compute derived values (distance, bearing, CPA) in the bridge hook, not in the rendering component. Keep rendering components focused on display.

## Stale Worktrees

- Git worktrees in `.claude/worktrees/` and `.worktrees/` are matched by Vitest's glob patterns (`**/*.test.ts`). Stale worktrees from old sessions with different package structures (e.g., pre-restructure `packages/web/`) cause phantom test failures. Always run `git worktree list` and remove stale entries with `git worktree remove <path> --force`.

## Product Strategy

- Building fast without a coherent product vision creates a patchwork quilt. Stop and research before building more.
- Organize research by product domain (boat management, trips, communication, utilities) to see gaps clearly.
- Study the best hardware UX (Raymarine Axiom 2, Garmin) then build the software equivalent — free, open-source, cross-platform.
- The AI is not a feature, it's the platform identity. A crew of specialized agents (Navigator, Engineer, Radio Op, Bosun, Pilot).
- Phase 1 is infrastructure (Docker, auth, sync, PWA), not UI. Get the plumbing right first.
- Multi-surface = Docker on the boat + web anywhere + PWA on phone. Like Claude CLI/Desktop/Web.
- This is 100% free and open source. No commercial model, ever. NEVER suggest monetization, pricing tiers, paid features, subscription models, or revenue strategies for Above Deck in any document — research, vision, architecture, or otherwise. Analysing competitor pricing is fine for competitive context, but never propose how Above Deck itself could charge money. This has been corrected multiple times.

## Tech Stack

- UI is Tailwind CSS + Ant Design 5 (antd), NOT Mantine or shadcn/ui. Icons are @ant-design/icons. User has changed component library twice — always use the current choice (Ant Design) in all docs and code.

## User's Editor

- User uses **Zed** (zed.dev), not VS Code. The sidebar shows the main repo root, not worktrees.
