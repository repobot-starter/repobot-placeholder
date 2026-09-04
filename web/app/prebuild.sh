#!/usr/bin/env bash
# Generates typed GraphQL hooks from the SDL in /Graphql plus the documents in
# src/Graphql/Operations/Gql. Output (src/generated/) is COMMITTED so composed
# template repos typecheck on a fresh clone; re-run and commit after schema or
# operation changes, via `npm run codegen` at the repo root or
# `npm --workspace web/app run codegen`.

set -e

cd "$(dirname "$0")"

# Stamp guard: this hook fires on every build AND every test run (prebuild +
# pretest), so agent verification loops used to pay the full wipe + codegen
# twice per iteration even when nothing changed. Skip when the content hash
# of everything this script reads (schema, operations, config, the SEO
# manifest) and writes (src/generated, the SEO files) matches the stamp from
# the last successful run. Outputs are in the hash on purpose: a hand-edited
# generated file flips it and forces the regeneration that exposes the
# drift, keeping check:all's freshness gate sound. PREBUILD_FORCE=1 bypasses.
STAMP_FILE="node_modules/.cache/repobot-prebuild-stamp"
compute_stamp() {
    bash ../../scripts/lib/content-hash.sh \
        ../../Graphql \
        src/Graphql/Operations \
        graphql-codegen.yaml \
        ../../scripts/generate-seo-files.mjs \
        ../../repobot.project.json \
        src/generated \
        public/sitemap.xml \
        public/robots.txt
}
if [ "${PREBUILD_FORCE:-}" != "1" ] && [ -d src/generated ] && [ -f "$STAMP_FILE" ] \
    && [ "$(cat "$STAMP_FILE")" = "$(compute_stamp)" ]; then
    echo "prebuild: inputs and outputs unchanged; skipping codegen."
    exit 0
fi

rm -rf src/generated
mkdir -p src/generated/graphql

npx graphql-codegen --config graphql-codegen.yaml

# SEO baseline (docs/seo.md): sitemap.xml + robots.txt in public/ are
# generated from repobot.project.json — never hand-edited. Regenerating here
# (prebuild + pretest) keeps them tracking the IA manifest; deploy builds
# export the canonical host (SITE_BASE_URL / APP_BASE_URL) for absolute URLs.
node ../../scripts/generate-seo-files.mjs

mkdir -p node_modules/.cache
compute_stamp > "$STAMP_FILE"
