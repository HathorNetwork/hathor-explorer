# Hathor Explorer - Local Development

This document describes step-by-step how to run the Hathor Explorer locally connected to a private network (localnet).

## Quick Start (Recommended)

The simplest way to run the explorer locally:

```bash
# 1. Start all services (fullnode, wallet-service, explorer-service, headless)
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

### Create Test Tokens

The simplest way is to use the seed script:

```bash
npm run localnet:seed
```

This script automatically creates:
- **Fee Based Token (FBT)** - Token with fee (version 2)
- **Deposit Based Token (DBT)** - Token with deposit (version 1)
- **Test Token (TST)** - Additional token for testing

#### Manually via curl

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

## Manual Configuration (Step by Step)

## Architecture Overview

The Explorer depends on several services to function completely:

```
+-------------------+     +---------------------+     +------------------+
|  Explorer         | --> | Explorer Service    | --> | Fullnode         |
|  (Frontend React) |     | (Backend Node.js)   |     | (hathor-core)    |
|  localhost:3002   |     | localhost:3003      |     | localhost:8083   |
+-------------------+     +---------------------+     +------------------+
                                                              |
                                                              v
                                                      +------------------+
                                                      | TX Mining Service|
                                                      | localhost:8035   |
                                                      +------------------+
                                                              |
                                                              v
                                                      +------------------+
                                                      | CPU Miner        |
                                                      +------------------+
```

## Required Projects

| Project | Repository | Function |
|---------|------------|----------|
| hathor-explorer | This project | Explorer React frontend |
| hathor-explorer-service | hathor-explorer-service | Backend that proxies and caches APIs |
| hathor-wallet-lib | hathor-wallet-lib | Contains localnet docker-compose |

## Step 1: Start the Localnet (hathor-wallet-lib)

The localnet is provided by the `hathor-wallet-lib` project and includes all services required for a private network.

### 1.1 Navigate to the project

```bash
cd /path/to/hathor-wallet-lib
```

### 1.2 Start the network

```bash
npm run test_network_up
```

Or directly with docker-compose:

```bash
docker compose -f ./__tests__/integration/configuration/docker-compose.yml up -d
```

### 1.3 Services available after starting the localnet

| Service | Port | URL |
|---------|------|-----|
| Fullnode API | 8083 | http://localhost:8083/v1a/ |
| Fullnode P2P | 40404 | tcp://localhost:40404 |
| TX Mining Service API | 8035 | http://localhost:8035 |
| TX Mining Service Stratum | 8034 | stratum+tcp://localhost:8034 |
| MySQL | 3380 | localhost:3380 |
| Redis | 6379 | redis://localhost:6379 |
| Wallet Service Daemon | 8081 | http://localhost:8081 |
| Wallet Service Daemon WS | 8082 | ws://localhost:8082 |
| Wallet Service API (Lambda) | 3000 | http://localhost:3000 |
| Wallet Service WS (Lambda) | 3001 | http://localhost:3001 |

### 1.4 Verify the network is healthy

```bash
# Check container status
docker compose -f ./__tests__/integration/configuration/docker-compose.yml ps

# Test fullnode API
curl http://localhost:8083/v1a/version
```

### 1.5 Stop the network

```bash
npm run test_network_down
```

## Step 2: Start the Explorer Service (hathor-explorer-service)

The Explorer Service is a backend that proxies calls to the fullnode and adds extra functionality.

### 2.1 Navigate to the project

```bash
cd /path/to/hathor-explorer-service
```

### 2.2 Configure the .env file

Create or edit the `.env` file in the project root with the following settings:

```env
# AWS (mock values for local development)
AWS_ACCOUNT_ID=aws_account_id
AWS_ACCESS_KEY_ID=aws_access_key_id
AWS_SECRET_ACCESS_KEY=secret_access_key
AWS_DEFAULT_REGION=eu-central-1
AWS_VPC_DEFAULT_SG_ID=vpc_default
AWS_SUBNET_ID_1=subnet1
AWS_SUBNET_ID_2=subnet2
AWS_SUBNET_ID_3=subnet3

# Connection to local fullnode
HATHOR_CORE_URL=http://host.docker.internal:8083/v1a
HATHOR_NODES=http://host.docker.internal:8083/v1a

# API port (use 3003 to avoid conflict with wallet-service on port 3000)
API_PORT=3003

# Lambda (internal configuration)
LAMBDA_INVOKE_URL=http://explorer-service:3002/
DATA_AGGREGATOR_LAMBDA_NAME=hathor-explorer-service-dev-node_data_aggregator_handler

# Redis (using localnet Redis via host.docker.internal)
REDIS_KEY_PREFIX=hathor-explorer-service-dev
REDIS_HOST=host.docker.internal
REDIS_PORT=6379
REDIS_DB=0

# S3 Mock
S3_ENDPOINT=http://explorer-service:4569/
METADATA_BUCKET=metadata-testnet

# CORS - IMPORTANT: allows requests from localhost
CORS_ALLOWED_REGEX=https?

# Cache
NODE_CACHE_TTL=30

# Elasticsearch (mock values - not used locally)
ELASTIC_CLOUD_ID=elastic_cloud_id
ELASTIC_USER=elastic
ELASTIC_PASSWORD=elastic_password
ELASTIC_INDEX=elastic_index
ELASTIC_TX_INDEX=elastic_tx_index
ELASTIC_TOKEN_BALANCES_INDEX=elastic_token_balances_index
ELASTIC_RESULTS_PER_PAGE=10
ELASTIC_SEARCH_TIMEOUT=25

# Wallet Service DB (mock values)
WALLET_SERVICE_DB_USERNAME=wallet_service_user
WALLET_SERVICE_DB_PASSWORD=password
WALLET_SERVICE_DB_HOST=127.0.0.1
WALLET_SERVICE_DB_NAME=wallet_service_ci

# Healthchecks - disable services not used locally
HEALTHCHECK_HATHOR_CORE_ENABLED=True
HEALTHCHECK_WALLET_SERVICE_DB_ENABLED=False
HEALTHCHECK_ELASTICSEARCH_ENABLED=False
HEALTHCHECK_REDIS_ENABLED=False
```

> **Note**: We use `host.docker.internal` so the Docker container can access services running on the host (fullnode on port 8083 and Redis on port 6379).

### 2.3 Configure docker-compose.yml

The `docker-compose.yml` file should have the following ports configured:

```yaml
version: "3.9"
services:
  daemons:
    build:
      context: .
      dockerfile: Dockerfile_Daemons
    stdin_open: true
    env_file:
      - .env
  redis:
    image: "redis:6-alpine"
    ports:
      - 6380:6379  # Alternative port to avoid conflict with localnet Redis
  explorer-service:
    build:
      context: .
      dockerfile: Dockerfile_Service
    ports:
      - 3003:3003  # Main API
      - 3004:3002  # Internal port
      - 4570:4569  # S3 mock
    env_file:
      - .env
```

> **Note**: The explorer-service Redis uses port 6380 to avoid conflict with localnet Redis (port 6379). However, we configure `REDIS_HOST=host.docker.internal` and `REDIS_PORT=6379` in the .env to use the localnet Redis.

### 2.4 Start the service

```bash
docker compose up -d explorer-service
```

### 2.5 Verify it's working

```bash
# View logs
docker logs hathor-explorer-service-explorer-service-1 -f

# Test API
curl http://localhost:3003/dev/node_api/version
```

## Step 3: Run the Explorer Frontend

### 3.1 Navigate to the project

```bash
cd /path/to/hathor-explorer
```

### 3.2 Install dependencies

```bash
npm install
```

### 3.3 Configure environment variables

The Explorer uses environment variables to configure connections. The main ones are:

| Variable | Description | Value for Localnet |
|----------|-------------|-------------------|
| `REACT_APP_BASE_URL` | Fullnode API URL | http://localhost:8083/v1a/ |
| `REACT_APP_WS_URL` | Fullnode WebSocket URL | ws://localhost:8083/v1a/ws/ |
| `REACT_APP_NETWORK` | Network name | privatenet |
| `REACT_APP_EXPLORER_SERVICE_BASE_URL` | explorer-service URL | http://localhost:3003/dev/ |
| `REACT_APP_EXPLORER_MODE` | Explorer mode (full/basic) | full |
| `REACT_APP_LOCAL_FEATURES_ENABLED` | Enable all features without Unleash | true |
| `PORT` | Development server port | 3002 |

### 3.4 Start the development server

```bash
PORT=3002 \
REACT_APP_BASE_URL=http://localhost:8083/v1a/ \
REACT_APP_WS_URL=ws://localhost:8083/v1a/ws/ \
REACT_APP_NETWORK=privatenet \
REACT_APP_EXPLORER_SERVICE_BASE_URL=http://localhost:3003/dev/ \
REACT_APP_LOCAL_FEATURES_ENABLED=true \
npm start
```

Or create a `.env.local` file in the project root:

```env
PORT=3002
REACT_APP_BASE_URL=http://localhost:8083/v1a/
REACT_APP_WS_URL=ws://localhost:8083/v1a/ws/
REACT_APP_NETWORK=privatenet
REACT_APP_EXPLORER_SERVICE_BASE_URL=http://localhost:3003/dev/
REACT_APP_LOCAL_FEATURES_ENABLED=true
```

Then run:

```bash
npm start
```

### 3.5 Access the Explorer

Open in browser: http://localhost:3002

## Port Summary

| Service | Port | Project |
|---------|------|---------|
| Explorer Frontend | 3002 | hathor-explorer |
| Explorer Service | 3003 | hathor-explorer-service |
| Wallet Service API | 3000 | hathor-wallet-lib (docker) |
| Wallet Service WS | 3001 | hathor-wallet-lib (docker) |
| Fullnode API | 8083 | hathor-wallet-lib (docker) |
| TX Mining API | 8035 | hathor-wallet-lib (docker) |
| MySQL | 3380 | hathor-wallet-lib (docker) |
| Redis | 6379 | hathor-wallet-lib (docker) |

## Basic Mode (without Explorer Service)

If you don't need the full functionality, you can run the explorer in basic mode, which doesn't depend on explorer-service:

```bash
PORT=3002 \
REACT_APP_BASE_URL=http://localhost:8083/v1a/ \
REACT_APP_WS_URL=ws://localhost:8083/v1a/ws/ \
REACT_APP_NETWORK=privatenet \
REACT_APP_EXPLORER_MODE=basic \
REACT_APP_LOCAL_FEATURES_ENABLED=true \
npm start
```

> **Note**: In basic mode, some features like Statistics, Network, and some pages may not work.

> **Warning**: Basic mode still tries to access the fullnode directly, which may cause CORS errors. For local development, it's recommended to use full mode with explorer-service.

## Troubleshooting

### CORS Error

If a CORS error appears in the browser console, check:
1. If explorer-service is running
2. If the `REACT_APP_EXPLORER_SERVICE_BASE_URL` URL is correct
3. If explorer-service is configured to accept requests from localhost
4. If the `CORS_ALLOWED_REGEX=https?` variable is configured in explorer-service's `.env`

**Common error**: If you try to run the explorer pointing directly to the fullnode (without explorer-service), you'll get CORS errors because the fullnode doesn't have CORS headers configured. The explorer-service acts as a proxy and adds the necessary headers.

### Port Already in Use

If a port already in use error appears:
1. Check which process is using it: `lsof -i :PORT`
2. Use an alternative port via the `PORT` variable

### Containers Won't Start

Check if there are old containers occupying the ports:

```bash
# List containers
docker ps -a

# Stop and remove all project containers
docker compose down -v
```

### Fullnode Won't Become Healthy

Check fullnode logs:

```bash
docker logs configuration-fullnode-1 -f
```

### Tokens Menu Not Showing

The "Tokens" menu in the explorer is controlled by Unleash feature flags. Since there are no flags for the "privatenet" network, the menu doesn't appear by default.

**Solution**: Use the `REACT_APP_LOCAL_FEATURES_ENABLED=true` variable to enable all features locally. The `npm run start:local` script already includes this variable.

If running manually, add the variable:
```bash
REACT_APP_LOCAL_FEATURES_ENABLED=true npm start
```

## Useful Scripts

### Start Everything at Once

Create a `start-local.sh` script:

```bash
#!/bin/bash

# Start localnet
cd /path/to/hathor-wallet-lib
npm run test_network_up

# Wait for fullnode to become healthy
echo "Waiting for fullnode..."
until curl -s http://localhost:8083/v1a/version > /dev/null; do
  sleep 2
done
echo "Fullnode OK!"

# Start explorer-service
cd /path/to/hathor-explorer-service
docker compose up -d explorer-service

# Wait for explorer-service
echo "Waiting for explorer-service..."
until curl -s http://localhost:3003/dev/node_api/version > /dev/null; do
  sleep 2
done
echo "Explorer Service OK!"

# Start explorer frontend
cd /path/to/hathor-explorer
PORT=3002 \
REACT_APP_BASE_URL=http://localhost:8083/v1a/ \
REACT_APP_WS_URL=ws://localhost:8083/v1a/ws/ \
REACT_APP_NETWORK=privatenet \
REACT_APP_EXPLORER_SERVICE_BASE_URL=http://localhost:3003/dev/ \
REACT_APP_LOCAL_FEATURES_ENABLED=true \
npm start
```

### Stop Everything

```bash
#!/bin/bash

# Stop explorer-service
cd /path/to/hathor-explorer-service
docker compose down

# Stop localnet
cd /path/to/hathor-wallet-lib
npm run test_network_down
```

## Local Docker Compose Services

The `docker/docker-compose.localnet.yml` file starts the following services:

| Service | Port | Description |
|---------|------|-------------|
| fullnode | 8083 | Hathor Fullnode (REST API + WebSocket) |
| tx-mining-service | 8035 | Transaction mining service |
| cpuminer | - | CPU miner (generates blocks automatically) |
| mysql | 3380 | Wallet-service database |
| redis | 6379 | Cache for wallet-service and explorer-service |
| ws-daemon | 8081, 8082 | Wallet-service sync daemon |
| ws-serverless | 3000, 3001 | Wallet-service Lambda API |
| explorer-service | 3003 | Explorer backend |
| headless | 8000 | Headless wallet for creating transactions/tokens |

### Available Wallet Seeds

| Wallet | Seed | Description |
|--------|------|-------------|
| Genesis | `avocado spot town typical traffic vault danger century property shallow divorce festival spend attack anchor afford rotate green audit adjust fade wagon depart level` | Wallet with initial funds |
| Miner | `scare more mobile text erupt flush paper snack despair goddess route solar keep search result author bounce pulp shine next butter unknown frozen trap` | Wallet that receives mining rewards |

### Enabled Features

- Nano Contracts: **enabled**
- Fee Based Tokens: **enabled**
- Network: **nano-testnet-bravo**
