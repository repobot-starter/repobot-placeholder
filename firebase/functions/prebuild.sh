#!/usr/bin/env bash
# Regenerates everything under generated/ (COMMITTED, so composed template
# repos build on a fresh clone; re-run and commit after schema/proto changes):
#   1. Protobuf TypeScript classes from /protobufs (protobuf-es).
#   2. A copy of the GraphQL SDL from /Graphql (the source of truth).
#   3. GraphQL resolver types (graphql-codegen).
#   4. JSON Schema definitions for all *Fields input types (backend-driven forms).
set -euo pipefail

cd "$(dirname "$0")"

rm -rf generated
mkdir -p generated

# 1. Protobufs
npx buf generate ../../protobufs --template buf.gen.yaml -o generated/Protobufs

# 2. GraphQL SDL
cp -R ../../Graphql generated/Graphql

# 3. Resolver types
npx graphql-codegen --config graphql-codegen.yaml

# 4. JSON Schema definitions
node scripts/generate-json-schema-definitions.mjs

echo "prebuild: generated/ is up to date."
