FULLNODE_HOST := node1.bravo.testnet.hathor.network
REACT_APP_BASE_URL := https://$(FULLNODE_HOST)/v1a/
REACT_APP_WS_URL := wss://$(FULLNODE_HOST)/v1a/ws/

.PHONY: build
build:
	REACT_APP_WS_URL=$(REACT_APP_WS_URL) \
	REACT_APP_BASE_URL=$(REACT_APP_BASE_URL) \
	npm run build

.PHONY: s3_upload
s3_upload:
	./s3_prod_upload
