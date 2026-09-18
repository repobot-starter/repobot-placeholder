#!/usr/bin/env bash

set -euo pipefail

# The schema is composed from the repo's source-of-truth SDL (Graphql/Core)
# rather than introspecting a deployed endpoint, so Android codegen always
# matches the backend in this checkout (deployed environments can lag behind).
#
# Unlike iOS (where apollo-ios-cli writes a committed Swift package), Apollo
# Kotlin generates types during the Gradle build from this schema file plus
# the operations in app/src/main/graphql/**/*.graphql.

OUT="./app/src/main/graphql/schema.graphqls"
GQL_ROOT="../Graphql"

if [ ! -d "${GQL_ROOT}" ]; then
  echo "Expected repo schema at ${GQL_ROOT} (run from android/)."
  exit 1
fi

echo "Composing GraphQL schema from ${GQL_ROOT}..."
find "${GQL_ROOT}" -name '*.gql' -print0 | sort -z | xargs -0 cat > "${OUT}"

echo "Schema composed: $(wc -l < "${OUT}") lines -> ${OUT}"
