#!/usr/bin/env bash
# @base/core has no codegen of its own: typed GraphQL documents are generated
# at the app level (see web/app/prebuild.sh). This stays a no-op so the root
# codegen pipeline can call every package uniformly.
exit 0
