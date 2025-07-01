.PHONY: build
build:
	./scripts/deploy.sh $(site) build $(aws_profile)

.PHONY: sync
sync:
	./scripts/deploy.sh $(site) sync $(aws_profile)

.PHONY: deploy
deploy: check_version build sync clear_cloudfront_cache

.PHONY: check_version
check_version:
	./scripts/check_version

.PHONY: check_tag
check_tag:
	./scripts/check_tag

.PHONY: clear_cloudfront_cache
clear_cloudfront_cache:
	./scripts/deploy.sh $(site) clear_cache $(aws_profile)

.PHONY: testnet_local
testnet_local:
	./scripts/deploy.sh testnet-local start $(aws_profile)

.PHONY: mainnet_local
mainnet_local:
	./scripts/deploy.sh mainnet-local start $(aws_profile)
