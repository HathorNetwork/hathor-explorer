.PHONY: build
build:
	./scripts/deploy.sh $(site) build

.PHONY: sync
sync:
	./scripts/deploy.sh $(site) sync

.PHONY: deploy
deploy: check_version sync clear_cloudfront_cache

.PHONY: check_version
check_version:
	./scripts/check_version

.PHONY: check_tag
check_tag:
	./scripts/check_tag

.PHONY: clear_cloudfront_cache
clear_cloudfront_cache:
	./scripts/deploy.sh $(site) clear_cache

.PHONY: testnet_local
testnet_local:
	./scripts/deploy.sh testnet-local start

.PHONY: mainnet_local
mainnet_local:
	./scripts/deploy.sh mainnet-local start
