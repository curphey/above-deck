FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/ packages/shared/
COPY packages/tools/ packages/tools/
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @above-deck/tools build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/packages/tools/dist/ ./dist/
ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
CMD ["node", "dist/server/entry.mjs"]
