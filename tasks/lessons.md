# Lessons Learned

<!-- Check this file before starting work. Update after any correction. -->

## Astro Islands + Docker

- `import.meta.env.PUBLIC_*` vars are **inlined at build time** by Astro/Vite. In Docker, pass them as `ARG`/`ENV` before `RUN astro build`. Runtime `--env-file` only sets process.env, not the client bundle.
- `client:only="react"` creates an independent React root. It does NOT inherit providers (MantineProvider, QueryClient) from other islands like `AppShellWrapper`. Each `client:only` island must wrap itself.
- `client:load` = SSR + hydrate. If a hook calls browser-only APIs (Supabase client, localStorage), use `client:only` to skip SSR entirely.
- Docker `--no-cache` is needed when build args change — cached layers won't re-evaluate ARG values.
- `source .env` doesn't export vars. Use `export $(grep '^PUBLIC_' .env | xargs)` for Docker build args.

## User's Editor

- User uses **Zed** (zed.dev), not VS Code. The sidebar shows the main repo root, not worktrees.
