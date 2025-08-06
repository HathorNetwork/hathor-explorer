#!/bin/bash

# Check if site and command parameters are provided
if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: $0 <site> <command> [aws_profile]"
  exit 1
fi

site=$1
command=$2
aws_profile=$3

# Define environment variables for each site
case $site in
  mainnet-local)
    FULLNODE_HOST=node.explorer.hathor.network
    REACT_APP_BASE_URL=http://$FULLNODE_HOST/v1a/
    REACT_APP_WS_URL=ws://$FULLNODE_HOST/v1a/ws/
    REACT_APP_EXPLORER_SERVICE_BASE_URL=http://localhost:3001/dev/
    REACT_APP_TIMESERIES_DASHBOARD_ID=674ebc10-e8c4-11ec-a7f2-0fee9be0d8ee
    REACT_APP_NETWORK=mainnet
    ;;
  testnet-local)
    FULLNODE_HOST=node.explorer.testnet.hathor.network
    REACT_APP_BASE_URL=http://$FULLNODE_HOST/v1a/
    REACT_APP_WS_URL=ws://$FULLNODE_HOST/v1a/ws/
    REACT_APP_EXPLORER_SERVICE_BASE_URL=http://localhost:3001/dev/
    REACT_APP_TIMESERIES_DASHBOARD_ID=35379840-e8c5-11ec-a7f2-0fee9be0d8ee
    REACT_APP_NETWORK=testnet
    ;;
  nano-testnet)
    FULLNODE_HOST=hathorplay.nano-testnet.hathor.network
    REACT_APP_BASE_URL=https://$FULLNODE_HOST/v1a/
    REACT_APP_WS_URL=wss://$FULLNODE_HOST/v1a/ws/
    REACT_APP_EXPLORER_SERVICE_BASE_URL=https://explorer-service.nano-testnet.hathor.network/
    REACT_APP_TIMESERIES_DASHBOARD_ID=59683ac0-237a-11ef-8f75-578bca86e218
    REACT_APP_NETWORK=nano-testnet-alpha
    S3_BUCKET=hathor-nano-testnet-public-explorer-2
    CLOUDFRONT_ID=EN58551BWE3XZ
    ;;
  nano-testnet-bravo)
    FULLNODE_HOST=node1.bravo.nano-testnet.hathor.network
    REACT_APP_BASE_URL=https://$FULLNODE_HOST/v1a/
    REACT_APP_WS_URL=wss://$FULLNODE_HOST/v1a/ws/
    REACT_APP_EXPLORER_SERVICE_BASE_URL=https://explorer-service.bravo.nano-testnet.hathor.network/
    REACT_APP_TIMESERIES_DASHBOARD_ID=00c45139-8e79-4ed1-8558-00c8ebf3c326
    REACT_APP_NETWORK=nano-testnet-bravo
    S3_BUCKET=hathor-nano-testnet-bravo-public-explorer
    CLOUDFRONT_ID=ERBB1LFGS2AMQ
    ;;
  nano-testnet-hackaton)
    FULLNODE_HOST=node1.hackaton.hathor.network
    REACT_APP_BASE_URL=https://$FULLNODE_HOST/v1a/
    REACT_APP_WS_URL=wss://$FULLNODE_HOST/v1a/ws/
    REACT_APP_EXPLORER_SERVICE_BASE_URL=https://explorer-service.hackaton.hathor.network/
    REACT_APP_TIMESERIES_DASHBOARD_ID=7e29e360-16ed-11f0-b1d4-99e4bfb760b1
    REACT_APP_NETWORK=nano-testnet-alpha
    S3_BUCKET=hathor-nano-testnet-hackaton-public-explorer
    CLOUDFRONT_ID=E1DJWV2MDJCYPE 
    ;;
  ekvilibro-testnet)
    FULLNODE_HOST=node-side-dag.ekvilibro-testnet.hathor.network
    REACT_APP_BASE_URL=https://$FULLNODE_HOST/v1a/
    REACT_APP_WS_URL=wss://$FULLNODE_HOST/v1a/ws/
    REACT_APP_EXPLORER_SERVICE_BASE_URL=https://explorer-service.ekvilibro-testnet.hathor.network/
    REACT_APP_TIMESERIES_DASHBOARD_ID=
    REACT_APP_NETWORK=ekvilibro-testnet
    S3_BUCKET=hathor-ekvilibro-testnet-public-explorer
    CLOUDFRONT_ID=E3SRP23QB7K3DQ
    ;;
  ekvilibro-mainnet)
    FULLNODE_HOST=node-side-dag.ekvilibro-mainnet.hathor.network
    REACT_APP_BASE_URL=https://$FULLNODE_HOST/v1a/
    REACT_APP_WS_URL=wss://$FULLNODE_HOST/v1a/ws/
    REACT_APP_EXPLORER_SERVICE_BASE_URL=https://explorer-service.ekvilibro-mainnet.hathor.network/
    REACT_APP_TIMESERIES_DASHBOARD_ID=
    REACT_APP_NETWORK=ekvilibro-mainnet
    S3_BUCKET=hathor-ekvilibro-mainnet-public-explorer
    CLOUDFRONT_ID=E1NI147Y237J4M
    ;;
  testnet)
    FULLNODE_HOST=node.explorer.golf.testnet.hathor.network
    REACT_APP_BASE_URL=https://$FULLNODE_HOST/v1a/
    REACT_APP_WS_URL=wss://$FULLNODE_HOST/v1a/ws/
    REACT_APP_EXPLORER_SERVICE_BASE_URL=https://explorer-service.golf.testnet.hathor.network/
    REACT_APP_TIMESERIES_DASHBOARD_ID=35379840-e8c5-11ec-a7f2-0fee9be0d8ee
    REACT_APP_NETWORK=testnet
    S3_BUCKET=hathor-testnet-golf-public-explorer
    CLOUDFRONT_ID=E2TGO5SVP34CC3
    ;;
  testnet-hotel)
    FULLNODE_HOST=node.explorer.hotel.testnet.hathor.network
    REACT_APP_BASE_URL=https://$FULLNODE_HOST/v1a/
    REACT_APP_WS_URL=wss://$FULLNODE_HOST/v1a/ws/
    REACT_APP_EXPLORER_SERVICE_BASE_URL=https://explorer-service.hotel.testnet.hathor.network/
    REACT_APP_TIMESERIES_DASHBOARD_ID=1c601ee9-899e-4b42-8a9c-fa5d4adb1390
    # This one is currently only used to form the names of feature flags,
    # so it made sense to keep it as testnet
    REACT_APP_NETWORK=testnet
    S3_BUCKET=hathor-testnet-hotel-public-explorer
    CLOUDFRONT_ID=E2G33O3YIT0NZ8
    ;;
  mainnet)
    FULLNODE_HOST=node.explorer.hathor.network
    REACT_APP_BASE_URL=https://$FULLNODE_HOST/v1a/
    REACT_APP_WS_URL=wss://$FULLNODE_HOST/v1a/ws/
    REACT_APP_GTM_ID=GTM-MJVX6BG
    REACT_APP_EXPLORER_SERVICE_BASE_URL=https://explorer-service.mainnet.hathor.network/
    REACT_APP_TIMESERIES_DASHBOARD_ID=674ebc10-e8c4-11ec-a7f2-0fee9be0d8ee
    REACT_APP_NETWORK=mainnet
    S3_BUCKET=hathor-mainnet-public-explorer
    CLOUDFRONT_ID=ETOC9JKCK86OG
    ;;
  *)
    echo "Unknown site: $site"
    exit 1
    ;;
esac

export FULLNODE_HOST
export REACT_APP_BASE_URL
export REACT_APP_WS_URL
export REACT_APP_GTM_ID
export REACT_APP_EXPLORER_SERVICE_BASE_URL
export REACT_APP_TIMESERIES_DASHBOARD_ID
export REACT_APP_NETWORK
export S3_BUCKET
export CLOUDFRONT_ID

case $command in
  build)
    echo "Building for site: $site"
    echo "FULLNODE_HOST: $FULLNODE_HOST"
    echo "REACT_APP_BASE_URL: $REACT_APP_BASE_URL"
    echo "REACT_APP_WS_URL: $REACT_APP_WS_URL"
    echo "REACT_APP_GTM_ID: $REACT_APP_GTM_ID"
    echo "REACT_APP_EXPLORER_SERVICE_BASE_URL: $REACT_APP_EXPLORER_SERVICE_BASE_URL"
    echo "REACT_APP_TIMESERIES_DASHBOARD_ID: $REACT_APP_TIMESERIES_DASHBOARD_ID"
    echo "REACT_APP_NETWORK: $REACT_APP_NETWORK"
    # Run the build command
    npm run build
    ;;
  sync)
    echo "Syncing for site: $site"
    if [ -n "$aws_profile" ]; then
      aws s3 sync --delete ./build/ s3://$S3_BUCKET --profile $aws_profile
    else
      aws s3 sync --delete ./build/ s3://$S3_BUCKET
    fi
    ;;
  clear_cache)
    echo "Clearing CloudFront cache for site: $site"
    if [ -n "$aws_profile" ]; then
      aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/index.html" --profile $aws_profile
    else
      aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/index.html"
    fi
    ;;
  start)
    echo "Starting for site: $site"
    npm run start
    ;;
  *)
    echo "Unknown command: $command"
    exit 1
    ;;
esac