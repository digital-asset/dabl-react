GIT_TAG := 1.0.0-rc.1
MATCHES := $(shell expr $(GIT_TAG) : '*rc*')
RELEASE_TAG := $(shell if [ "$(MATCHES)" = "0" ]; then echo 'latest'; else echo 'prerelease'; fi)

.PHONY: publish
publish:
	npm publish --access public --tag $(RELEASE_TAG) --dry-run
