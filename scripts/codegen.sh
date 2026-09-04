#!/usr/bin/env bash
# Run all code generation: protobufs + GraphQL types for every package.
# Always run this via `npm run codegen` after changing Graphql/**/*.gql or
# protobufs/**/*.proto. Never hand-edit anything under a generated/ directory.

source "$(dirname "$0")/lib/common.sh"
cd "$REPO_ROOT"

log "Generating backend (protos + GraphQL resolver types + JSON schema definitions)..."
bash firebase/functions/prebuild.sh

log "Generating web/core GraphQL types..."
bash web/core/prebuild.sh

log "Generating web/app GraphQL hooks..."
bash web/app/prebuild.sh

log "Generating native theme constants from repobot.theme.json..."
node scripts/generate-native-theme.mjs

log "Codegen complete."
