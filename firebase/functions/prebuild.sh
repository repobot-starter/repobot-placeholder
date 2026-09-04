#!/usr/bin/env bash
# Regenerates everything under generated/ (COMMITTED, so composed template
# repos build on a fresh clone; re-run and commit after schema/proto changes):
#   1. Protobuf TypeScript classes from /protobufs (protobuf-es).
#   2. A copy of the GraphQL SDL from /Graphql (the source of truth).
#   3. GraphQL resolver types (graphql-codegen).
#   4. JSON Schema definitions for all *Fields input types (backend-driven forms).
set -euo pipefail

cd "$(dirname "$0")"

# Stamp guard: this hook fires on every `npm run build`, so boots and gate
# iterations used to pay the full wipe + buf + graphql-codegen + JSON-schema
# regeneration even when nothing changed. Skip when the content hash of
# everything this script reads (SDL, protos, config, the schema generator)
# and writes (generated/) matches the stamp from the last successful run.
# Outputs are in the hash on purpose: a hand-edited generated file flips it
# and forces the regeneration that exposes the drift, keeping check:all's
# freshness gate sound. PREBUILD_FORCE=1 bypasses.
STAMP_FILE="node_modules/.cache/repobot-prebuild-stamp"
compute_stamp() {
    bash ../../scripts/lib/content-hash.sh \
        ../../Graphql \
        ../../protobufs \
        prebuild.sh \
        buf.gen.yaml \
        graphql-codegen.yaml \
        scripts/generate-json-schema-definitions.mjs \
        generated
}
if [ "${PREBUILD_FORCE:-}" != "1" ] && [ -d generated ] && [ -f "$STAMP_FILE" ] \
    && [ "$(cat "$STAMP_FILE")" = "$(compute_stamp)" ]; then
    echo "prebuild: inputs and outputs unchanged; skipping codegen."
    exit 0
fi

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

mkdir -p node_modules/.cache
compute_stamp > "$STAMP_FILE"

echo "prebuild: generated/ is up to date."
