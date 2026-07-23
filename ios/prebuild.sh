#!/usr/bin/env bash

set -euo pipefail

./graphql-fetch-schema.sh
./graphql-generate.sh
