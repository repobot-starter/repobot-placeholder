#!/usr/bin/env bash

set -euo pipefail

# Android prebuild: compose the GraphQL schema from the repo SDL. Kotlin type
# generation itself happens inside the Gradle build (Apollo Kotlin plugin), so
# unlike iOS there is nothing else to regenerate or commit.
./graphql-fetch-schema.sh
