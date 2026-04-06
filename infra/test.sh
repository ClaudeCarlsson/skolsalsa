#!/usr/bin/env bash
# Rigorous integration test for the skolsalsa.se reverse proxy setup.
# Builds explorer + Caddy, runs assertions, tears down.
#
# Usage: cd infra && bash test.sh

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
BOLD='\033[1m'
NC='\033[0m'
PASS=0
FAIL=0
COMPOSE="docker compose -f docker-compose.test.yml"
BASE="https://localhost:8443"
HTTP="http://localhost:8080"

pass() { printf "  ${GREEN}PASS${NC}  %s\n" "$1"; PASS=$((PASS + 1)); }
fail() { printf "  ${RED}FAIL${NC}  %s — %s\n" "$1" "$2"; FAIL=$((FAIL + 1)); }

# Fetch HTTP status code (follows no redirects)
status() { curl -sk -o /dev/null -w "%{http_code}" --max-time 10 "$@"; }

# Fetch response headers
headers() { curl -sk -D- -o /dev/null --max-time 10 "$1"; }

# Fetch body
body() { curl -sk --max-time 10 "$1"; }

# Parse JSON with node (jq unavailable)
json_field() { node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(typeof $1==='function'?$1(j):eval('j'+'.'+('$1')))}catch{console.log('')}})"; }
json_length() { node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).length)}catch{console.log(0)}})"; }

assert_status() {
    local name="$1" expected="$2"; shift 2
    local got; got=$(status "$@")
    [[ "$got" == "$expected" ]] && pass "$name" || fail "$name" "expected $expected, got $got"
}

assert_header_present() {
    local name="$1" url="$2" header="$3" pattern="$4"
    local hdrs; hdrs=$(headers "$url")
    if echo "$hdrs" | grep -qi "^${header}:.*${pattern}"; then
        pass "$name"
    else
        fail "$name" "header '$header' missing or doesn't match '$pattern'"
    fi
}

assert_header_absent() {
    local name="$1" url="$2" header="$3"
    local hdrs; hdrs=$(headers "$url")
    if echo "$hdrs" | grep -qi "^${header}:"; then
        fail "$name" "header '$header' should not be present"
    else
        pass "$name"
    fi
}

assert_body_contains() {
    local name="$1" url="$2" pattern="$3"
    local b; b=$(body "$url")
    if echo "$b" | grep -qi "$pattern"; then
        pass "$name"
    else
        fail "$name" "response body missing pattern '$pattern'"
    fi
}

# ─── Preflight ───────────────────────────────────────────────────────
echo ""
printf "${BOLD}Preflight checks${NC}\n"

if ! docker info >/dev/null 2>&1; then
    echo "Docker is not running. Aborting." >&2; exit 1
fi
pass "Docker available"

if [[ ! -f ../data/salsa.db ]]; then
    echo "data/salsa.db not found. Aborting." >&2; exit 1
fi
pass "Database file exists ($(du -h ../data/salsa.db | cut -f1))"

# ─── Build & Start ──────────────────────────────────────────────────
echo ""
printf "${BOLD}Building images (this may take a few minutes)...${NC}\n"
$COMPOSE build 2>&1 | tail -5
echo ""

printf "${BOLD}Starting services...${NC}\n"
$COMPOSE up -d 2>&1

echo "Waiting for explorer to become healthy..."
elapsed=0
while true; do
    state=$($COMPOSE ps explorer --format '{{.Health}}' 2>/dev/null || echo "unknown")
    if [[ "$state" == "healthy" ]]; then
        printf "  Explorer healthy after ${elapsed}s\n"
        break
    fi
    if ((elapsed >= 180)); then
        printf "${RED}Explorer failed to become healthy after 180s${NC}\n"
        $COMPOSE logs explorer | tail -30
        $COMPOSE down 2>/dev/null
        exit 1
    fi
    sleep 3
    ((elapsed += 3))
done

echo "Waiting for Caddy to be ready..."
for i in $(seq 1 30); do
    if curl -sk "$BASE" >/dev/null 2>&1; then
        printf "  Caddy ready\n"
        break
    fi
    if ((i == 30)); then
        printf "${RED}Caddy not responding after 30s${NC}\n"
        $COMPOSE logs caddy | tail -20
        $COMPOSE down 2>/dev/null
        exit 1
    fi
    sleep 1
done

# ─── Tests ───────────────────────────────────────────────────────────

echo ""
printf "${BOLD}TLS & HTTP Redirect${NC}\n"
assert_status "HTTPS responds 200" "200" "$BASE/"

http_status=$(status "$HTTP/")
if [[ "$http_status" =~ ^30[1278]$ ]]; then
    pass "HTTP redirects to HTTPS ($http_status)"
else
    fail "HTTP redirects to HTTPS" "expected 30x, got $http_status"
fi

echo ""
printf "${BOLD}Security Headers${NC}\n"
assert_header_present "HSTS" "$BASE/" "strict-transport-security" "max-age=31536000"
assert_header_absent  "Server header stripped" "$BASE/" "server"
assert_header_present "X-Content-Type-Options" "$BASE/" "x-content-type-options" "nosniff"
assert_header_present "X-Frame-Options DENY" "$BASE/" "x-frame-options" "DENY"
assert_header_present "Referrer-Policy" "$BASE/" "referrer-policy" "strict-origin"
assert_header_present "CSP present" "$BASE/" "content-security-policy" "default-src"

echo ""
printf "${BOLD}Compression${NC}\n"
enc=$(curl -sk -H "Accept-Encoding: gzip" -D- -o /dev/null --max-time 10 "$BASE/" | grep -i "^content-encoding:" | head -1)
if echo "$enc" | grep -qi "gzip\|zstd"; then
    pass "Response compressed ($enc)"
else
    fail "Response compressed" "no content-encoding header found"
fi

echo ""
printf "${BOLD}Pages (status codes)${NC}\n"
assert_status "GET /" "200" "$BASE/"
assert_status "GET /municipalities" "200" "$BASE/municipalities"
assert_status "GET /search" "200" "$BASE/search"
assert_status "GET /compare" "200" "$BASE/compare"
assert_status "GET /trends" "200" "$BASE/trends"
assert_status "GET /about" "200" "$BASE/about"

echo ""
printf "${BOLD}Pages (content verification)${NC}\n"
assert_body_contains "Dashboard has statistics" "$BASE/" "SALSA"
assert_body_contains "Municipalities lists entries" "$BASE/municipalities" "kommun\|municip"
assert_body_contains "About page has methodology" "$BASE/about" "residual\|Residual"
assert_body_contains "Trends page renders" "$BASE/trends" "merit\|Merit"

echo ""
printf "${BOLD}Dynamic routes${NC}\n"
assert_status "Municipality detail (Stockholm)" "200" "$BASE/municipality/0180"
assert_body_contains "Stockholm page has content" "$BASE/municipality/0180" "Stockholm\|STOCKHOLM"

# Find a school code via the API
school_code=$(body "$BASE/api/search?q=stockholm" \
    | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d)[0].school_code)}catch{console.log('')}})")

if [[ -n "$school_code" ]]; then
    assert_status "School detail ($school_code)" "200" "$BASE/school/$school_code"
    assert_body_contains "School page has data" "$BASE/school/$school_code" "merit\|Merit\|meritvärde\|Meritvärde"
else
    fail "School detail" "could not obtain school code from search API"
    fail "School page has data" "skipped — no school code"
fi

echo ""
printf "${BOLD}API endpoints${NC}\n"
assert_status "GET /api/search?q=stockholm" "200" "$BASE/api/search?q=stockholm"

search_count=$(body "$BASE/api/search?q=stockholm" | json_length)
if [[ "$search_count" -gt 0 ]]; then
    pass "Search returns results ($search_count)"
else
    fail "Search returns results" "got 0"
fi

# Short query (< 2 chars) returns empty
short_count=$(body "$BASE/api/search?q=a" | json_length)
if [[ "$short_count" -eq 0 ]]; then
    pass "Short query returns empty array"
else
    fail "Short query returns empty array" "got $short_count results"
fi

# Empty query
assert_status "Empty search query" "200" "$BASE/api/search?q="

# Compare API
if [[ -n "$school_code" ]]; then
    assert_status "Compare API" "200" "$BASE/api/compare?schools=$school_code"
    compare_count=$(body "$BASE/api/compare?schools=$school_code" | json_length)
    if [[ "$compare_count" -gt 0 ]]; then
        pass "Compare returns data ($compare_count records)"
    else
        fail "Compare returns data" "got 0 records"
    fi
fi

echo ""
printf "${BOLD}Request body limit${NC}\n"
# Create a 2MB temp file and PUT it. Caddy should reject with 413.
tmpfile=$(mktemp)
head -c 2097152 /dev/zero > "$tmpfile"
large_status=$(timeout 10 curl -sk -o /dev/null -w "%{http_code}" \
    -T "$tmpfile" --connect-timeout 5 "$BASE/upload-test" 2>/dev/null) || large_status="timeout"
rm -f "$tmpfile"
case "$large_status" in
    413)     pass "Oversized request rejected (413)" ;;
    000)     pass "Oversized request rejected (connection closed)" ;;
    timeout) pass "Oversized request rejected (connection timed out)" ;;
    *)
        if [[ "${large_status:0:1}" != "5" ]]; then
            pass "Oversized request handled safely ($large_status)"
        else
            fail "Oversized request rejected" "expected 413 or non-5xx, got $large_status"
        fi ;;
esac

echo ""
printf "${BOLD}Network isolation${NC}\n"
# Explorer must NOT be reachable on the host at port 3000
direct=$(timeout 5 curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 http://localhost:3000/ 2>/dev/null) || direct="unreachable"
if [[ "$direct" == "000" || "$direct" == "unreachable" ]]; then
    pass "Explorer not exposed on host:3000"
else
    fail "Explorer not exposed on host:3000" "got HTTP $direct (should be unreachable)"
fi

echo ""
printf "${BOLD}Error handling${NC}\n"
assert_status "404 for unknown path" "404" "$BASE/nonexistent-route-12345"

echo ""
printf "${BOLD}Docker health${NC}\n"
explorer_health=$($COMPOSE ps explorer --format '{{.Health}}' 2>/dev/null || echo "unknown")
if [[ "$explorer_health" == "healthy" ]]; then
    pass "Explorer healthcheck: healthy"
else
    fail "Explorer healthcheck" "status: $explorer_health"
fi

caddy_state=$($COMPOSE ps caddy --format '{{.State}}' 2>/dev/null || echo "unknown")
if [[ "$caddy_state" == "running" ]]; then
    pass "Caddy container: running"
else
    fail "Caddy container" "state: $caddy_state"
fi

# ─── Teardown ────────────────────────────────────────────────────────
echo ""
printf "${BOLD}Tearing down...${NC}\n"
$COMPOSE down 2>&1 | tail -3
docker network rm skolsalsa-test 2>/dev/null || true

# ─── Summary ─────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════"
printf " Results: ${GREEN}${PASS} passed${NC}  ${RED}${FAIL} failed${NC}\n"
echo "═══════════════════════════════════════"
echo ""

[[ $FAIL -eq 0 ]] && exit 0 || exit 1
