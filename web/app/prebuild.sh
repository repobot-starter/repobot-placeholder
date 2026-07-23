#!/usr/bin/env bash
# Generates typed GraphQL hooks from the SDL in /Graphql plus the documents in
# src/Graphql/Operations/Gql. Output (src/generated/) is COMMITTED so composed
# template repos typecheck on a fresh clone; re-run and commit after schema or
# operation changes, via `npm run codegen` at the repo root or
# `npm --workspace web/app run codegen`.

set -e

cd "$(dirname "$0")"

rm -rf src/generated
mkdir -p src/generated/graphql

npx graphql-codegen --config graphql-codegen.yaml
