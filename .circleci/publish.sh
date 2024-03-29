#!/usr/bin/env bash

set -euo pipefail

GIT_TAG=$(git tag --contains)

if [[ "$GIT_TAG" = "" ]]
then
    echo "No git tag found! Aborting..."
    exit 1
fi

echo "Found git tag: '$GIT_TAG'..."

RELEASE_TAG="latest"
if [[ $GIT_TAG =~ ^v.*rc.* ]]
then
    RELEASE_TAG="prerelease"
fi

echo "Publishing with '--tag $RELEASE_TAG'..."
npm publish --access public --tag $RELEASE_TAG
