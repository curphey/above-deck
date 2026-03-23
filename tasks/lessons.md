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

## User's Editor

- User uses **Zed** (zed.dev), not VS Code. The sidebar shows the main repo root, not worktrees.
