# Deploying skolsalsa.se

Production deployment on a Linux server with Docker behind a shared Caddy reverse proxy.

## Prerequisites

- Docker and Docker Compose installed
- Shared Caddy proxy running (see [caddy-infra](https://github.com/ClaudeCarlsson/caddy-infra))
- DNS A records for `skolsalsa.se` and `www.skolsalsa.se` pointing to the server

## Deploy

```bash
# 1. Clone the repo
git clone <repo-url> skolsalsa
cd skolsalsa

# 2. Place the database
scp dev-machine:~/repos/skolsalsa/data/salsa.db data/salsa.db

# 3. Start (requires the shared 'web' network from caddy-infra)
cd infra
docker compose up -d
```

## Verify

```bash
docker compose ps
docker compose logs skolsalsa-app
curl -I https://skolsalsa.se
```

## Update the database

```bash
scp dev-machine:~/repos/skolsalsa/data/salsa.db data/salsa.db
cd infra
docker compose restart skolsalsa-app
```

## Update the application

```bash
git pull
cd infra
docker compose up -d --build
```

## Architecture

```
Internet → :443 → Caddy (shared) → skolsalsa-app:3000
                                      │
                                      └── SQLite (read-only bind mount)
```

TLS, compression, and security headers are handled by the shared Caddy instance in [caddy-infra](https://github.com/ClaudeCarlsson/caddy-infra). This repo only runs the application container on the shared `web` Docker network.

## Rate limiting

API endpoints are rate-limited at 60 requests per minute per IP by the application.
