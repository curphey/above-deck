# ── Stage 1: Build ──────────────────────────────
FROM node:20-slim AS build

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /workspace

# Copy workspace root files for monorepo resolution
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/web/package.json packages/web/

# Install all deps (including devDependencies for build)
RUN pnpm install --filter @above-deck/web --frozen-lockfile

# Copy source and build
COPY packages/web packages/web
RUN pnpm --filter @above-deck/web build

# ── Stage 2: Production ────────────────────────
FROM node:20-slim AS runtime

RUN corepack enable && corepack prepare pnpm@latest --activate

# Keep the same workspace layout so node_modules resolve correctly
WORKDIR /workspace

COPY --from=build /workspace/package.json ./package.json
COPY --from=build /workspace/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /workspace/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /workspace/packages/web/package.json ./packages/web/package.json

# Install production deps only (same layout as build)
RUN pnpm install --filter @above-deck/web --prod --frozen-lockfile

# Copy built output into the same relative position
COPY --from=build /workspace/packages/web/dist ./packages/web/dist

WORKDIR /workspace/packages/web

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321

CMD ["node", "dist/server/entry.mjs"]
