FULLNODE_HOST := node1.bravo.testnet.hathor.network
REACT_APP_BASE_URL := https://$(FULLNODE_HOST)/v1a/
REACT_APP_WS_URL := wss://$(FULLNODE_HOST)/v1a/ws/

.PHONY: build
build:
	REACT_APP_WS_URL=$(REACT_APP_WS_URL) \
	REACT_APP_BASE_URL=$(REACT_APP_BASE_URL) \
	npm run build

.PHONY: check_version
check_version:
	./scripts/check_version

.PHONY: check_tag
check_tag:
	./scripts/check_tag