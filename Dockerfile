# Multi-stage Dockerfile for OpenSchool SALSA

# ============================================
# Stage 1: Base with Node.js and build tools
# ============================================
FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ && \
    rm -rf /var/lib/apt/lists/*
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser

# ============================================
# Stage 2: Scraper dependencies
# ============================================
FROM base AS scraper-deps
COPY package.json package-lock.json ./
COPY packages/scraper/package.json packages/scraper/
COPY packages/db/package.json packages/db/
RUN npm ci --workspace=packages/scraper --workspace=packages/db 2>/dev/null || npm ci

# ============================================
# Stage 3: Scraper (pure HTTP, no browser)
# ============================================
FROM base AS scraper
COPY --from=scraper-deps /app/node_modules ./node_modules
COPY package.json ./
COPY packages/scraper/ packages/scraper/
COPY packages/db/ packages/db/
RUN mkdir -p data && chown appuser:appgroup data

USER appuser
VOLUME ["/app/data"]
ENV NODE_ENV=production
CMD ["node", "packages/scraper/src/scrape-all.js"]

# ============================================
# Stage 4: Test runner
# ============================================
FROM scraper AS test
CMD ["node", "--test", "packages/scraper/src/tests/"]

# ============================================
# Stage 5: Explorer dependencies
# ============================================
FROM base AS explorer-deps
COPY package.json package-lock.json ./
COPY packages/explorer/package.json packages/explorer/
COPY packages/db/package.json packages/db/
RUN npm ci --workspace=packages/explorer --workspace=packages/db 2>/dev/null || npm ci

# ============================================
# Stage 6: Explorer build
# ============================================
FROM base AS explorer-build
COPY --from=explorer-deps /app/node_modules ./node_modules
COPY package.json ./
COPY packages/explorer/ packages/explorer/
COPY packages/db/ packages/db/
RUN mkdir -p data && node packages/db/src/migrate.js
WORKDIR /app/packages/explorer
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ============================================
# Stage 7: Explorer production (minimal image)
# ============================================
FROM node:22-bookworm-slim AS explorer
WORKDIR /app

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser

COPY --from=explorer-build --chown=appuser:appgroup /app/packages/explorer/.next/standalone ./
COPY --from=explorer-build --chown=appuser:appgroup /app/packages/explorer/.next/static ./packages/explorer/.next/static
COPY --from=explorer-build --chown=appuser:appgroup /app/packages/explorer/public ./packages/explorer/public

USER appuser
VOLUME ["/app/data"]
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "packages/explorer/server.js"]
