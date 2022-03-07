#!/usr/bin/env bash

# Integration test for @daml/hub-react when installed in
# a sample application built with webpack v5

set -o nounset
set -o errexit
set -o pipefail

echo "Establishing package link..."
yarn link

echo "Changing to webpack-5-test directory..."
cd tests/webpack-5-test

echo "Linking package..."
yarn link @daml/hub-react

echo "Running install..."
yarn install

echo "Running build..."
yarn build
