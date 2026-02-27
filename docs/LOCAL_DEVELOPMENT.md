# Hathor Explorer - Local Development

This document describes how to run the Hathor Explorer locally connected to a private network (localnet).

## Quick Start (Recommended)

The `docker/docker-compose.localnet.yml` file provides a **complete, self-contained environment** with all required services. No external dependencies or additional repositories are needed.

```bash
# 1. Start all services (fullnode, wallet-service, explorer-service, headless, etc.)
npm run localnet:up

# 2. Wait for services to become healthy (~30 seconds)
docker compose -f docker/docker-compose.localnet.yml ps

# 3. Start the frontend
npm run start:local
```

The explorer will be available at http://localhost:3002

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run localnet:up` | Start all Docker services |
| `npm run localnet:down` | Stop and remove all services |
| `npm run localnet:logs` | Show logs from all services |
| `npm run localnet:seed` | Create test tokens (FBT, DBT, TST) |
| `npm run start:local` | Start frontend pointing to localnet |

---

## Architecture Overview

The localnet starts all services required for a fully functional explorer:

```
+-------------------+     +-------------------+     +------------------+
|  Explorer         | --> | Explorer Service  | --> | Fullnode         |
|  (Frontend)       |     | (Backend)         |     | (hathor-core)    |
|  localhost:3002   |     | localhost:3003    |     | localhost:8083   |
+-------------------+     +-------------------+     +------------------+
                                |                          |
                                v                          v
                    +-----------+-----------+     +------------------+
                    |                       |     | TX Mining        |
          +---------v--------+   +----------v--+  | localhost:8035   |
          | Elasticsearch    |   | Redis       |  +------------------+
          | localhost:9200   |   | :6379       |         |
          +---------+--------+   +-------------+         v
                    ^                             +------------------+
                    |                             | CPU Miner        |
          +---------+--------+                    +------------------+
          | Logstash         |
          | (MySQL -> ES)    |
          +---------+--------+
                    ^
                    |
          +---------+--------+     +------------------+
          | Wallet Service   | --> | MySQL            |
          | :3000, :3001     |     | :3380            |
          +------------------+     +------------------+
                                          ^
                                          |
                                   +------+-------+
                                   | Headless     |
                                   | :8000        |
                                   +--------------+
```

### Data Ingestion Flow

Token and transaction search uses Elasticsearch, populated via Logstash:

```
MySQL (wallet-service) --> Logstash --> Elasticsearch --> explorer-service API
```

Logstash pipelines (in `docker/logstash/`):
- `tokens.conf` - Indexes tokens from `token` table (every 30s)
- `token-balances.conf` - Indexes address balances (every 30s)
- `transactions.conf` - Indexes transactions (every 30s)

To check Elasticsearch status:
```bash
curl "http://localhost:9200/_cat/indices?v"
```

---

## Services Reference

All services are started by `docker-compose.localnet.yml`:

| Service | Port | Description |
|---------|------|-------------|
| Explorer Frontend | 3002 | React frontend (started separately via `npm run start:local`) |
| Explorer Service | 3003 | Explorer backend (proxies fullnode, adds caching) |
| Fullnode | 8083 | Hathor Core node (REST API + WebSocket) |
| TX Mining Service | 8034/8035 | Stratum (8034) and API (8035) |
| CPU Miner | - | Generates blocks automatically |
| Wallet Service Daemon | 8081/8082 | Sync daemon (HTTP/WebSocket) |
| Wallet Service API | 3000/3001 | Lambda API (HTTP/WebSocket) |
| Headless Wallet | 8000 | Wallet API for creating tokens/transactions |
| MySQL | 3380 | Wallet-service database |
| Redis | 6379 | Cache for wallet-service and explorer-service |
| Elasticsearch | 9200 | Token/transaction search index |
| Logstash | - | Data ingestion from MySQL to Elasticsearch |

---

## Create Test Tokens

Use the seed script to create test tokens:

```bash
npm run localnet:seed
```

This creates:
- **Fee Based Token (FBT)** - Token with fee (version 2)
- **Deposit Based Token (DBT)** - Token with deposit (version 1)
- **Test Token (TST)** - Additional token for testing

### Manually via curl

```bash
# Start the genesis wallet (has initial funds)
curl -X POST http://localhost:8000/start \
  -H 'Content-Type: application/json' \
  -d '{"wallet-id":"genesis","seedKey":"default"}'

# Wait for wallet to become ready
curl -H 'x-wallet-id: genesis' http://localhost:8000/wallet/status

# Create fee-based token (version 2)
curl -X POST http://localhost:8000/wallet/create-token \
  -H 'Content-Type: application/json' \
  -H 'x-wallet-id: genesis' \
  -d '{"name":"Fee Based Token","symbol":"FBT","amount":100000,"version":2}'

# Create deposit based token (version 1)
curl -X POST http://localhost:8000/wallet/create-token \
  -H 'Content-Type: application/json' \
  -H 'x-wallet-id: genesis' \
  -d '{"name":"Deposit Based Token","symbol":"DBT","amount":50000,"version":1}'
```

---

## Available Wallet Seeds

| Wallet | Seed | Description |
|--------|------|-------------|
| Genesis | `avocado spot town typical traffic vault danger century property shallow divorce festival spend attack anchor afford rotate green audit adjust fade wagon depart level` | Wallet with initial funds |
| Miner | `scare more mobile text erupt flush paper snack despair goddess route solar keep search result author bounce pulp shine next butter unknown frozen trap` | Wallet that receives mining rewards |

---

## Basic Mode (Without Explorer Service)

Basic mode connects the frontend directly to the fullnode, bypassing the explorer-service. This is useful for minimal testing or when developing features that don't require explorer-service functionality.

**What changes:**
- Only frontend environment variables change
- No Docker modifications needed
- Can use the localnet fullnode OR any external fullnode

**What doesn't work in basic mode:**
- Statistics page
- Network page
- Token search (requires Elasticsearch)
- Some cached/aggregated data

### Using Basic Mode with Localnet

Start the localnet normally, then run the frontend in basic mode:

```bash
# Start localnet (fullnode still needed)
npm run localnet:up

# Start frontend in basic mode
PORT=3002 \
REACT_APP_BASE_URL=http://localhost:8083/v1a/ \
REACT_APP_WS_URL=ws://localhost:8083/v1a/ws/ \
REACT_APP_NETWORK=privatenet \
REACT_APP_EXPLORER_MODE=basic \
REACT_APP_LOCAL_FEATURES_ENABLED=true \
npm start
```

### Using Basic Mode with External Fullnode

```bash
PORT=3002 \
REACT_APP_BASE_URL=http://YOUR_FULLNODE:8083/v1a/ \
REACT_APP_WS_URL=ws://YOUR_FULLNODE:8083/v1a/ws/ \
REACT_APP_NETWORK=mainnet \
REACT_APP_EXPLORER_MODE=basic \
npm start
```

> **Note**: Basic mode may cause CORS errors when connecting to fullnodes that don't have CORS headers configured. The explorer-service acts as a proxy and adds the necessary headers.

---

## Troubleshooting

### CORS Error

If a CORS error appears in the browser console, check:
1. If explorer-service is running
2. If the `REACT_APP_EXPLORER_SERVICE_BASE_URL` URL is correct
3. If explorer-service is configured to accept requests from localhost

**Common error**: If you run the explorer pointing directly to the fullnode (basic mode), you may get CORS errors because the fullnode doesn't have CORS headers configured.

### Port Already in Use

If a port is already in use:
1. Check which process is using it: `lsof -i :PORT`
2. Use an alternative port via the `PORT` variable

### Containers Won't Start

Check if there are old containers occupying the ports:

```bash
# List containers
docker ps -a

# Stop and remove all project containers
npm run localnet:down
```

### Fullnode Won't Become Healthy

Check fullnode logs:

```bash
npm run localnet:logs
# Or for specific service:
docker compose -f docker/docker-compose.localnet.yml logs fullnode -f
```

### Tokens Menu Not Showing

The "Tokens" menu is controlled by feature flags. Since there are no flags for "privatenet" network, use `REACT_APP_LOCAL_FEATURES_ENABLED=true` to enable all features locally.

The `npm run start:local` script already includes this variable.

### Elasticsearch Not Indexing

If tokens don't appear in search:

```bash
# Check ES indices
curl "http://localhost:9200/_cat/indices?v"

# Check logstash logs
docker compose -f docker/docker-compose.localnet.yml logs logstash -f
```

---

## Enabled Features

- Nano Contracts: **enabled**
- Fee Based Tokens: **enabled**
- Network: **nano-testnet-bravo**

---

## Frontend Environment Variables

| Variable | Description | Default for Localnet |
|----------|-------------|----------------------|
| `REACT_APP_BASE_URL` | Fullnode API URL | http://localhost:8083/v1a/ |
| `REACT_APP_WS_URL` | Fullnode WebSocket URL | ws://localhost:8083/v1a/ws/ |
| `REACT_APP_NETWORK` | Network name | privatenet |
| `REACT_APP_EXPLORER_SERVICE_BASE_URL` | explorer-service URL | http://localhost:3003/dev/ |
| `REACT_APP_EXPLORER_MODE` | Explorer mode (full/basic) | full |
| `REACT_APP_LOCAL_FEATURES_ENABLED` | Enable all features without Unleash | true |
| `PORT` | Development server port | 3002 |
