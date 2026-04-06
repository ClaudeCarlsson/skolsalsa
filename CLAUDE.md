# CLAUDE.md — SkolSalsa

## What is this?

Swedish school performance explorer using Skolverket's SALSA model (actual vs predicted results). Monorepo with three packages: `explorer` (Next.js web app), `scraper` (SIRIS data scraper), `db` (SQLite schema/migrations).

## Tech stack

- **Explorer**: Next.js 16, React 19, TypeScript 5 (strict), Tailwind CSS 4, Recharts, better-sqlite3
- **Scraper**: Node.js, ES modules, Cheerio, better-sqlite3
- **DB**: SQLite (WAL mode), read-only in production
- **Infra**: Docker multi-stage builds, Caddy reverse proxy
- **Tests**: Node.js native `node:test` + `node:assert/strict` (no Jest/Vitest)

## Commands

```bash
npm run dev              # Start Next.js dev server
npm run build            # Build explorer for production
npm test                 # Run scraper tests
npm run test:quick       # Rate limiter + db tests only
npm run test:integration # Session + parser tests
npm run test:e2e         # End-to-end scraper tests
npm run lint             # ESLint (run from packages/explorer)
npm run scrape           # Full SIRIS scrape
npm run scrape:sample    # Sample scrape for testing
npm run db:migrate       # Run database migrations

# Explorer-specific tests (from root or packages/explorer)
npm run test:db --workspace=packages/explorer
npm run test:frontend --workspace=packages/explorer  # requires build first
```

## Project structure

```
packages/
  explorer/    Next.js 16 app (TypeScript, server components by default)
  scraper/     HTTP scraper (JavaScript ES modules)
  db/          SQLite schema and migrations
infra/         Docker Compose + Caddy config for production
data/          SQLite database file (salsa.db)
```

## Git & workflow rules

- GitHub CLI is authenticated (`gh auth login` is already done)
- Commits: 1-2 sentences, single line, imperative mood, lowercase start
- Always push after tests pass
- Never amend published commits — create new ones
- Use the repo owner's git identity for commits, never Claude's

## Code conventions

- **Server components** by default; use `"use client"` only when needed
- **Styling**: Tailwind utility classes, `cn()` helper for conditional classes
- **i18n**: Translation via `t(key, lang)` / `tf(key, lang, vars)` from `src/lib/i18n.ts` — Swedish default
- **SQL**: Always use parameterized queries and `escapeLike()` for LIKE patterns
- **ESLint**: strict rules enabled — `no-eval`, `eqeqeq: always`, `prefer-const`, warn on `any`
- **Scraper**: ES modules, class-based (SessionManager, RateLimiter, SalsaScraper), no TypeScript
- **Path alias**: `@/*` maps to `./src/*` in explorer

## Next.js 16 warning

This repo uses Next.js 16 which has breaking changes from earlier versions. Before writing Next.js code, read the guides in `packages/explorer/node_modules/next/dist/docs/` and check `packages/explorer/AGENTS.md`.

## Security

- CSP, X-Frame-Options, HSTS, and other security headers configured in `next.config.ts`
- API rate limiting: 60 req/min per IP (`checkRateLimit()`)
- Route params validated with regex whitelist
- Docker runs as non-root (uid 1001)
- No secrets needed — public data, readonly SQLite, no auth
