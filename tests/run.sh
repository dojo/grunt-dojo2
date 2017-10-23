#!/usr/bin/env bash
set -e
cd "$(dirname $0)/.."
echo "Building Modules..."
node_modules/.bin/tsc -p .
echo "Running intern..."
node_modules/.bin/intern
