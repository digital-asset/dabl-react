GIT_TAG := $(shell git tag --contains)
RELEASE_TAG := $(shell [[ $(GIT_TAG) =~ ^.*rc.* ]] && echo 'prerelease' || echo 'latest')

.PHONY: publish
publish:
	npm publish --access public --tag $(RELEASE_TAG)
