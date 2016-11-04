#!/usr/bin/env bash
set -e
cd "$(dirname $0)/.."
echo "Building Modules..."
node_modules/.bin/tsc -p .
echo "Running intern..."
node_modules/.bin/intern-client config=tests/intern reporters=Console reporters=node_modules/remap-istanbul/lib/intern-reporters/JsonCoverage && cat coverage-final.json | node_modules/.bin/remap-istanbul --output html-report  --type html --exclude node_modules,tests
