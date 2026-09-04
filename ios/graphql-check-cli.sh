#!/usr/bin/env bash

set -euo pipefail

if [ ! -f "./apollo-ios-cli" ]; then
  echo "Apollo CLI './apollo-ios-cli' not found."
  echo "Install it with:"
  echo "  swift package --package-path ./ApolloGraphql/AppGraphqlApi --allow-writing-to-package-directory apollo-cli-install"
  exit 1
fi
