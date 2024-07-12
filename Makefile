.PHONY: check_version
check_version:
	./scripts/check_version

.PHONY: check_tag
check_tag:
	./scripts/check_tag

.PHONY: nano_testnet_build
nano_testnet_build:
	FULLNODE_HOST=node1.nano-testnet.hathor.network; \
	export REACT_APP_BASE_URL=https://$$FULLNODE_HOST/v1a/; \
	export REACT_APP_WS_URL=wss://$$FULLNODE_HOST/v1a/ws/; \
	export REACT_APP_EXPLORER_SERVICE_BASE_URL=https://explorer-service.nano-testnet.hathor.network/; \
	export REACT_APP_TIMESERIES_DASHBOARD_ID=59683ac0-237a-11ef-8f75-578bca86e218; \
	export REACT_APP_NETWORK=nano-testnet-alpha; \
	npm run build

.PHONY: nano_testnet_s3_sync
nano_testnet_s3_sync:
	aws s3 sync --delete ./build/ s3://hathor-nano-testnet-public-explorer-2

.PHONY: nano_testnet_deploy
nano_testnet_deploy: check_version nano_testnet_s3_sync clear_cloudfront_cache

.PHONY: ekvilibro_testnet_build
ekvilibro_testnet_build:
	FULLNODE_HOST=node-side-dag.ekvilibro-testnet.hathor.network; \
	export REACT_APP_BASE_URL=https://$$FULLNODE_HOST/v1a/; \
	export REACT_APP_WS_URL=wss://$$FULLNODE_HOST/v1a/ws/; \
	export REACT_APP_EXPLORER_SERVICE_BASE_URL=https://explorer-service.ekvilibro-testnet.hathor.network/; \
	export REACT_APP_TIMESERIES_DASHBOARD_ID=; \
	export REACT_APP_NETWORK=ekvilibro-testnet; \
	npm run build

.PHONY: ekvilibro_testnet_s3_sync
ekvilibro_testnet_s3_sync:
	aws s3 sync --delete ./build/ s3://hathor-ekvilibro-testnet-public-explorer

.PHONY: ekvilibro_testnet_deploy
ekvilibro_testnet_deploy: check_version ekvilibro_testnet_s3_sync clear_cloudfront_cache

.PHONY: testnet_build
testnet_build:
	FULLNODE_HOST=node.explorer.testnet.hathor.network; \
	export REACT_APP_BASE_URL=https://$$FULLNODE_HOST/v1a/; \
	export REACT_APP_WS_URL=wss://$$FULLNODE_HOST/v1a/ws/; \
	export REACT_APP_EXPLORER_SERVICE_BASE_URL=https://explorer-service.testnet.hathor.network/; \
	export REACT_APP_TIMESERIES_DASHBOARD_ID=35379840-e8c5-11ec-a7f2-0fee9be0d8ee; \
	export REACT_APP_NETWORK=testnet; \
	npm run build

.PHONY: testnet_s3_sync
testnet_s3_sync:
	aws s3 sync --delete ./build/ s3://hathor-testnet-golf-public-explorer

.PHONY: testnet_deploy
testnet_deploy: check_version testnet_s3_sync clear_cloudfront_cache

.PHONY: mainnet_build
mainnet_build:
	FULLNODE_HOST=node.explorer.hathor.network; \
	export REACT_APP_BASE_URL=https://$$FULLNODE_HOST/v1a/; \
	export REACT_APP_WS_URL=wss://$$FULLNODE_HOST/v1a/ws/; \
	export REACT_APP_GTM_ID=GTM-MJVX6BG; \
	export REACT_APP_EXPLORER_SERVICE_BASE_URL=https://explorer-service.hathor.network/; \
	export REACT_APP_TIMESERIES_DASHBOARD_ID=674ebc10-e8c4-11ec-a7f2-0fee9be0d8ee; \
	export REACT_APP_NETWORK=mainnet; \
	npm run build

.PHONY: mainnet_s3_sync
mainnet_s3_sync:
	aws s3 sync --delete ./build/ s3://hathor-mainnet-public-explorer

.PHONY: mainnet_deploy
mainnet_deploy: check_version check_tag mainnet_s3_sync clear_cloudfront_cache

.PHONY: clear_cloudfront_cache
clear_cloudfront_cache:
	aws cloudfront create-invalidation --distribution-id $$CLOUDFRONT_ID --paths "/index.html"

.PHONY: testnet_local
testnet_local:
	FULLNODE_HOST=node.explorer.testnet.hathor.network; \
	export REACT_APP_BASE_URL=https://$$FULLNODE_HOST/v1a/; \
	export REACT_APP_WS_URL=wss://$$FULLNODE_HOST/v1a/ws/; \
	export REACT_APP_EXPLORER_SERVICE_BASE_URL=http://localhost:3001/dev/; \
	export REACT_APP_TIMESERIES_DASHBOARD_ID=35379840-e8c5-11ec-a7f2-0fee9be0d8ee; \
	export REACT_APP_NETWORK=testnet; \
	npm run start

.PHONY: mainnet_local
mainnet_local:
	FULLNODE_HOST=node.explorer.hathor.network; \
	export REACT_APP_BASE_URL=https://$$FULLNODE_HOST/v1a/; \
	export REACT_APP_WS_URL=wss://$$FULLNODE_HOST/v1a/ws/; \
	export REACT_APP_EXPLORER_SERVICE_BASE_URL=http://localhost:3001/dev/; \
	export REACT_APP_TIMESERIES_DASHBOARD_ID=674ebc10-e8c4-11ec-a7f2-0fee9be0d8ee; \
	export REACT_APP_NETWORK=mainnet; \
	npm run start
