#!/usr/bin/env bash

# Integration test for @daml/hub-react when installed in
# a sample application built with webpack v5

set -o nounset
set -o errexit
set -o pipefail

npm link ../../
npm install
npm run build
