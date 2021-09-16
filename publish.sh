#!/usr/bin/env bash

set -euo pipefail

GIT_TAG=$(git tag --contains)
RELEASE_TAG="latest"

if [[ $GIT_TAG =~ ^v.*rc.* ]]
then
    $RELEASE_TAG="prerelease"
fi

npm publish --access public --tag $RELEASE_TAG --dry-run
