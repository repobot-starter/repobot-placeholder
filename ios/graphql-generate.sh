#!/usr/bin/env bash

set -euo pipefail

./graphql-check-cli.sh

echo "Generating iOS GraphQL types..."
# apollo-ios-cli fails to replace existing CustomScalars files on this volume
# ("couldn't be moved ... already exists"). Ours are plain generated
# typealiases with no hand-written logic, so clearing them first is safe.
rm -rf ./ApolloGraphql/AppGraphqlApi/Sources/Schema/CustomScalars
./apollo-ios-cli generate --path ./ApolloGraphql/apollo-codegen-config.json
echo "Code generation complete."
echo "If Xcode does not pick up generated changes, resolve package versions."
