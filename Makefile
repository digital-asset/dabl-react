GIT_TAG := 1.0.0-rc.1
MATCHES := $(shell expr $(GIT_TAG) : '*rc*')
RELEASE_TAG := $(shell if [ $(MATCHES) -ne 0 ]; then echo 'prerelease'; else echo 'latest'; fi)

.PHONY: publish
publish:
	npm publish --access public --tag $(RELEASE_TAG) --dry-run
