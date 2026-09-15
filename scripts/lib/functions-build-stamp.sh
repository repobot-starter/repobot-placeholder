#!/usr/bin/env bash
# Prints one content hash covering every input the firebase/functions build
# reads: TypeScript sources, the codegen inputs prebuild.sh regenerates from
# (GraphQL SDL, protobufs, the JSON-schema generator), build config, and the
# dependency lockfile. dev-up.sh skips the functions build when this hash
# matches the stamp written after the last successful build, and
# bake-kernel-tree.sh stamps the bake — so bake-seeded sandboxes never pay
# prebuild codegen + tsc on boot. Any source/schema/lockfile change flips
# the hash and forces a real build.
set -euo pipefail

cd "$(dirname "$0")/../.."

bash scripts/lib/content-hash.sh \
    firebase/functions/src \
    firebase/functions/scripts \
    firebase/functions/prebuild.sh \
    firebase/functions/tsconfig.json \
    firebase/functions/graphql-codegen.yaml \
    firebase/functions/buf.gen.yaml \
    firebase/functions/package.json \
    Graphql \
    protobufs \
    package-lock.json
