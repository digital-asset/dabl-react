GIT_TAG := 1.0.0-rc.1
RELEASE_TAG := $(shell MATCHES=$$(expr $(GIT_TAG) : '*rc*'); if [ $$MATCHES -ne 0 ]; then echo 'prerelease'; else echo 'latest'; fi)

.PHONY: publish
publish:
	npm publish --access public --tag $(RELEASE_TAG) --dry-run
