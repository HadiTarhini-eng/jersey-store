# syntax=docker/dockerfile:1.7
# Build from repo root:
#   docker build -f api/Dockerfile -t jersey-store .
#   docker run --rm -p 3000:3000 --env-file .env jersey-store

# ── Build the client (Vite) ──────────────────────────────────────────────────
FROM oven/bun:1 AS client-build
WORKDIR /app/client
COPY client/package.json client/bun.lock ./
RUN bun install --frozen-lockfile
COPY client/ ./
RUN bun run build

# ── Build the API (tsc) ──────────────────────────────────────────────────────
FROM oven/bun:1 AS api-build
WORKDIR /app/api
COPY api/package.json api/bun.lock ./
RUN bun install --frozen-lockfile
COPY api/ ./
RUN bun run build

# ── Runtime ──────────────────────────────────────────────────────────────────
FROM oven/bun:1-slim AS runtime
WORKDIR /app/api

ENV NODE_ENV=production \
    API_HOST=0.0.0.0 \
    API_PORT=3000 \
    CLIENT_DIST_PATH=/app/client/dist

COPY api/package.json api/bun.lock ./
RUN bun install --frozen-lockfile --production

COPY --from=api-build   /app/api/dist        ./dist
COPY --from=client-build /app/client/dist    /app/client/dist

EXPOSE 3000
CMD ["bun", "dist/index.js"]
