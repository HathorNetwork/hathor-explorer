#!/bin/bash
# Hathor Explorer - Seed Script
# Creates test tokens for local development
#
# Usage: ./docker/seed.sh
#
# Prerequisites: Run `npm run localnet:up` first

set -e

HEADLESS_URL="http://localhost:8000"
WALLET_ID="genesis"

echo "=== Hathor Explorer Seed Script ==="
echo ""

# Wait for headless to be ready
echo "Waiting for headless service..."
until curl -s "$HEADLESS_URL/" > /dev/null 2>&1; do
  echo "  Headless not ready, waiting..."
  sleep 2
done
echo "  Headless is ready!"

# Start genesis wallet
echo ""
echo "Starting genesis wallet..."
RESULT=$(curl -s -X POST "$HEADLESS_URL/start" \
  -H 'Content-Type: application/json' \
  -d "{\"wallet-id\":\"$WALLET_ID\",\"seedKey\":\"default\"}")

if echo "$RESULT" | grep -q '"success":true'; then
  echo "  Wallet started successfully"
else
  echo "  Warning: $RESULT"
fi

# Wait for wallet to be ready
echo ""
echo "Waiting for wallet to be ready..."
for i in {1..30}; do
  STATUS=$(curl -s -H "x-wallet-id: $WALLET_ID" "$HEADLESS_URL/wallet/status" | grep -o '"statusMessage":"[^"]*"' | cut -d'"' -f4)
  if [ "$STATUS" = "Ready" ]; then
    echo "  Wallet is ready!"
    break
  fi
  echo "  Status: $STATUS, waiting..."
  sleep 2
done

# Check balance
echo ""
echo "Checking wallet balance..."
BALANCE=$(curl -s -H "x-wallet-id: $WALLET_ID" "$HEADLESS_URL/wallet/balance")
echo "  Balance: $BALANCE"

# Create Fee-Based Token (version 2)
echo ""
echo "Creating Fee-Based Token (FBT)..."
FBT_RESULT=$(curl -s -X POST "$HEADLESS_URL/wallet/create-token" \
  -H 'Content-Type: application/json' \
  -H "x-wallet-id: $WALLET_ID" \
  -d '{"name":"Fee Based Token","symbol":"FBT","amount":100000,"version":2}')

# Extract the token hash (transaction hash = token UID)
FBT_HASH=$(echo "$FBT_RESULT" | jq -r '.hash // empty')
if [ -n "$FBT_HASH" ]; then
  echo "  Created FBT: $FBT_HASH"
else
  echo "  Error: $FBT_RESULT"
fi

# Wait a bit for the transaction to be processed
sleep 2

# Create Deposit Based Token (version 1)
echo ""
echo "Creating Deposit Based Token (DBT)..."
DBT_RESULT=$(curl -s -X POST "$HEADLESS_URL/wallet/create-token" \
  -H 'Content-Type: application/json' \
  -H "x-wallet-id: $WALLET_ID" \
  -d '{"name":"Deposit Based Token","symbol":"DBT","amount":50000,"version":1}')

# Extract the token hash (transaction hash = token UID)
DBT_HASH=$(echo "$DBT_RESULT" | jq -r '.hash // empty')
if [ -n "$DBT_HASH" ]; then
  echo "  Created DBT: $DBT_HASH"
else
  echo "  Error: $DBT_RESULT"
fi

# Wait a bit for the transaction to be processed
sleep 2

# Create another token for variety
echo ""
echo "Creating Test Token (TST)..."
TST_RESULT=$(curl -s -X POST "$HEADLESS_URL/wallet/create-token" \
  -H 'Content-Type: application/json' \
  -H "x-wallet-id: $WALLET_ID" \
  -d '{"name":"Test Token","symbol":"TST","amount":1000000,"version":2}')

# Extract the token hash (transaction hash = token UID)
TST_HASH=$(echo "$TST_RESULT" | jq -r '.hash // empty')
if [ -n "$TST_HASH" ]; then
  echo "  Created TST: $TST_HASH"
else
  echo "  Error: $TST_RESULT"
fi

# Wait for tokens to be confirmed
sleep 3

# Create Multi-Fee Transaction
# This transaction transfers FBT (fee-based token) and pays fees in both HTR and DBT
# Fee = 1 unit per FBT output (2 explicit + 1 change = 3 outputs = 3 fee units)
# Fee paid: 1 HTR (1 unit) + 200 DBT (2 units) = 3 units total
echo ""
echo "Creating Multi-Fee Transaction..."
echo "  (Transfers FBT with fees paid in HTR + DBT)"

MULTI_FEE_RESULT=$(curl -s -X POST "$HEADLESS_URL/wallet/tx-template/run" \
  -H 'Content-Type: application/json' \
  -H "x-wallet-id: $WALLET_ID" \
  -d "[
    {\"type\": \"action/setvar\", \"name\": \"addr\", \"call\": {\"method\": \"get_wallet_address\"}},
    {\"type\": \"input/utxo\", \"token\": \"00\", \"fill\": 200},
    {\"type\": \"input/utxo\", \"token\": \"$FBT_HASH\", \"fill\": 200},
    {\"type\": \"input/utxo\", \"token\": \"$DBT_HASH\", \"fill\": 300},
    {\"type\": \"output/token\", \"address\": \"{addr}\", \"token\": \"00\", \"amount\": 199},
    {\"type\": \"output/token\", \"address\": \"{addr}\", \"token\": \"$FBT_HASH\", \"amount\": 100},
    {\"type\": \"output/token\", \"address\": \"{addr}\", \"token\": \"$FBT_HASH\", \"amount\": 100},
    {\"type\": \"output/token\", \"address\": \"{addr}\", \"token\": \"$DBT_HASH\", \"amount\": 100},
    {\"type\": \"action/fee\", \"token\": \"00\", \"amount\": 1},
    {\"type\": \"action/fee\", \"token\": \"$DBT_HASH\", \"amount\": 200}
  ]")

MULTI_FEE_HASH=$(echo "$MULTI_FEE_RESULT" | jq -r '.hash // empty')
if [ -n "$MULTI_FEE_HASH" ]; then
  echo "  Created Multi-Fee TX: $MULTI_FEE_HASH"
  echo "  Fee paid: 0.01 HTR + 2.00 DBT"
else
  echo "  Error: $MULTI_FEE_RESULT"
fi

echo ""
echo "=== Seed Complete ==="
echo ""
echo "Tokens created:"
echo "  - Fee Based Token (FBT): $FBT_HASH"
echo "  - Deposit Based Token (DBT): $DBT_HASH"
echo "  - Test Token (TST): $TST_HASH"
echo ""
echo "Multi-Fee Transaction:"
echo "  - TX Hash: $MULTI_FEE_HASH"
echo "  - Fee paid: 0.01 HTR + 2.00 DBT"
echo "  - View: http://localhost:3002/transaction/$MULTI_FEE_HASH"
echo ""
echo "View in explorer: http://localhost:3002"
echo ""
