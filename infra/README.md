# Deploying skolsalsa.se

Production deployment of the SALSA Explorer on a Linux server with Docker.

## Prerequisites

- Docker and Docker Compose installed
- Ports 80 and 443 open in the firewall
- DNS A records for `skolsalsa.se` and `www.skolsalsa.se` pointing to the server's public IP

## Deploy

```bash
# 1. Clone the repo
git clone <repo-url> skolsalsa
cd skolsalsa

# 2. Place the database
#    Copy salsa.db from your dev machine:
scp dev-machine:~/repos/skolsalsa/data/salsa.db data/salsa.db

# 3. Start
cd infra
docker compose up -d
```

Caddy automatically obtains TLS certificates from Let's Encrypt on first start. This requires ports 80 and 443 to be reachable from the internet.

## Verify

```bash
# Check containers are running
docker compose ps

# Check explorer health
docker compose logs explorer

# Check Caddy got certificates
docker compose logs caddy

# Test locally
curl -I http://localhost
```

The site should be live at https://skolsalsa.se within a minute of starting.

## Update the database

```bash
# Copy a new salsa.db from dev
scp dev-machine:~/repos/skolsalsa/data/salsa.db data/salsa.db

# Restart explorer to pick up the new file
cd infra
docker compose restart explorer
```

## Update the application

```bash
cd skolsalsa
git pull

cd infra
docker compose up -d --build
```

## Stop

```bash
cd infra
docker compose down
```

TLS certificates persist in the `caddy_data` Docker volume and survive restarts.

## Architecture

```
Internet
  │
  ├─ :80  ──► Caddy (redirect to HTTPS)
  └─ :443 ──► Caddy (TLS termination) ──► explorer:3000
                                              │
                                              └── SQLite (read-only bind mount)
```

- `skolsalsa` Docker network isolates these containers from any other Docker workloads on the machine
- Only ports 80 and 443 are exposed to the host; the explorer container is not directly reachable
- The database is mounted read-only; the application makes no writes

## Configuration

| Setting | File | Default |
|---------|------|---------|
| ACME email (for Let's Encrypt) | `Caddyfile` | `admin@skolsalsa.se` |
| Domain names | `Caddyfile` | `skolsalsa.se`, `www.skolsalsa.se` |
| Request body limit | `Caddyfile` | 1 MB |
| Database path | `docker-compose.yml` | `../data/salsa.db` mounted at `/app/data/salsa.db` |

## Rate limiting

API endpoints (`/api/search`, `/api/compare`) are rate-limited at 60 requests per minute per IP by the application. Caddy's standard distribution does not include a rate-limit module. For proxy-level rate limiting, replace the Caddy image with a custom build that includes [caddy-ratelimit](https://github.com/mholt/caddy-ratelimit).
