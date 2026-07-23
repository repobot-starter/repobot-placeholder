#!/usr/bin/env bash

set -euo pipefail

# The schema is composed from the repo's source-of-truth SDL (Graphql/Core)
# rather than introspecting a deployed endpoint, so iOS codegen always matches
# the backend in this checkout (deployed environments can lag behind).

OUT="./ApolloGraphql/Generated/schema.graphqls"
GQL_ROOT="../Graphql"

if [ ! -d "${GQL_ROOT}" ]; then
  echo "Expected repo schema at ${GQL_ROOT} (run from ios/)."
  exit 1
fi

echo "Composing GraphQL schema from ${GQL_ROOT}..."
{
  # Apollo iOS client-side directives (normally appended by fetch-schema).
  cat <<'PRELUDE'
"""
A directive used by the Apollo iOS client to annotate operations or fragments that should be used exclusively for generating local cache mutations instead of as standard operations.
"""
directive @apollo_client_ios_localCacheMutation on QUERY | MUTATION | SUBSCRIPTION | FRAGMENT_DEFINITION

"""
A directive used by the Apollo iOS code generation engine to generate custom import statements in operation or fragment definition files. An import statement to import a module with the name provided in the `module` argument will be added to the generated definition file.
"""
directive @import(
  """The name of the module to import."""
  module: String!
) repeatable on QUERY | MUTATION | SUBSCRIPTION | FRAGMENT_DEFINITION
PRELUDE
  find "${GQL_ROOT}" -name '*.gql' -print0 | sort -z | xargs -0 cat
} > "${OUT}"

echo "Schema composed: $(wc -l < "${OUT}") lines -> ${OUT}"
