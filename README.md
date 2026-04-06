# SkolSalsa

**[skolsalsa.se](https://skolsalsa.se)** — Explore Swedish school performance data from Skolverket's SALSA model.

## What is SALSA?

SALSA (Skolverkets Arbetsverktyg for Lokala SambandsAnalyser) is a regression model that compares each school's actual results against predictions based on student demographics. The **residual** (actual minus predicted) reveals how schools perform relative to expectations — enabling fairer comparisons that account for socioeconomic differences.

## Dataset

| Metric | Value |
|--------|-------|
| Schools | 1,535 (1,092 municipal + 443 independent) |
| Records | 21,668 |
| Municipalities | 290 (all of Sweden) |
| Year range | 1998–2025 |
| Source | [SIRIS](https://siris.skolverket.se) |

Data points per school per year: merit value, predicted merit, residual, eligibility rate, parents' education level, newly arrived %, foreign background %, boys %.

## Architecture

```
packages/
├── scraper/     # SIRIS data scraper (Node.js, Cheerio)
├── db/          # SQLite schema and migrations
└── explorer/    # Next.js web application

infra/           # Production deployment (Caddy + Docker Compose)
```

### Explorer

Next.js 16 application with server components reading directly from SQLite. Fully bilingual (Swedish/English).

**Pages:**
- **Dashboard** — national trends, top/bottom performers, municipality ranking, school type filter (all/municipal/independent)
- **Municipalities** — browse all 290 municipalities
- **Municipality Detail** — trend chart + sortable school table with CSV export
- **School Detail** — 4 charts (merit trend, residual, eligibility, demographics), residual explanation in plain language, full data table with CSV export
- **Search** — live typeahead search by name or municipality
- **Compare** — select up to 5 schools for side-by-side comparison (shareable URLs)
- **Trends** — national averages over 28 years
- **Favorites** — star/bookmark schools, saved to localStorage, compare all with one click
- **About** — methodology, data dictionary, SALSA model evolution (fully bilingual)

**SEO:**
- Dynamic sitemap.xml with all school and municipality pages
- robots.txt
- Per-page `<title>`, `<meta description>`, and Open Graph tags in both languages

**Mobile:**
- Responsive hamburger menu with sticky header
- Touch-friendly tables with horizontal scroll
- Adaptive grid layouts

### Scraper

Pure HTTP session manager — no browser required. Replicates Oracle APEX AJAX calls to navigate SIRIS, select schools, and extract table data.

```bash
npm run discover        # Discover all 1,535 schools
npm run scrape          # Scrape SALSA data for all schools (resumable)
npm run scrape:sample   # Quick scrape of 10 major cities
```

Features: rate limiting (token bucket), exponential backoff retries, per-municipality checkpointing with resume, graceful shutdown (SIGINT/SIGTERM).

## Quick Start

```bash
npm install

# Run the explorer locally
npm run dev

# Build for production
npm run build
```

## Production Deployment

The `infra/` directory contains everything needed to deploy to a server:

```bash
# On the server:
git clone https://github.com/ClaudeCarlsson/skolsalsa.git
cd skolsalsa/infra
docker compose up -d
```

This starts the Next.js app behind Caddy with automatic HTTPS via Let's Encrypt. Auto-deploy via cron runs `deploy.sh` which fetches and resets to origin/main on changes.

## Testing

```bash
# Scraper tests (hits real SIRIS API)
npm test

# Explorer DB layer tests
cd packages/explorer && npm run test:db

# Explorer frontend tests (builds app, starts server, hits every route)
cd packages/explorer && npm run test:frontend

# Infrastructure tests (builds Docker images, tests reverse proxy)
cd infra && bash test.sh
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_PATH` | `../../data/salsa.db` | Path to SQLite database |
| `BATCH_SIZE` | `10` | Schools per scrape batch |
| `PORT` | `3000` | Explorer server port |

## Security

OWASP Top 10 compliant:
- **Injection** — parameterized SQL queries, LIKE metacharacter escaping, input validation (regex whitelist on route params)
- **Security Headers** — CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff, HSTS, Referrer-Policy, Permissions-Policy
- **Rate Limiting** — 60 req/min per IP on API endpoints
- **No Secrets** — readonly SQLite, no auth needed, no PII stored
- **Docker** — non-root user, npm ci for reproducible builds, read-only data volume, isolated network

## License

Data sourced from [Skolverket SIRIS](https://siris.skolverket.se). Not affiliated with or endorsed by Skolverket.
