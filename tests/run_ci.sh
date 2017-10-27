#!/usr/bin/env bash
set -e
cd "$(dirname $0)/.."
rm -rf tmp
node_modules/.bin/tsc -p .
node_modules/.bin/intern config=@ci && cat ./lcov.info | ./node_modules/.bin/codecov
