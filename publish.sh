#!/usr/bin/env bash

set -euo pipefail

GIT_TAG=$(git tag --contains)
GIT_TAG=1.0.0-rc.1
RELEASE_TAG="latest"

if [[ $GIT_TAG =~ ^v.*rc.* ]]
then
    $RELEASE_TAG="prerelease"
fi

echo "Publishing as $RELEASE_TAG..."
npm publish --access public --tag $RELEASE_TAG --dry-run
