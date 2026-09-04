#!/usr/bin/env bash
# Verifies that the hand-written SQL migrations exactly match the drizzle
# schema definitions in src/Data. drizzle-kit is a devDependency used ONLY for
# this verification; it never manages the schema (migrations/ + migrate.ts do).
#
# The caller provides a scratch database via DATABASE_URL (e.g. a fresh docker
# postgres). This script:
#   1. Runs the SQL migrations against it.
#   2. Runs `drizzle-kit push --force` and inspects its output.
#   3. Fails if drizzle wanted to change anything (i.e. the SQL drifted).
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -z "${DATABASE_URL:-}" ]; then
    echo "drift-check: set DATABASE_URL to a scratch database." >&2
    exit 1
fi

echo "drift-check: applying SQL migrations to ${DATABASE_URL}..."
npx tsx scripts/migrate.ts

echo "drift-check: running drizzle-kit push against the migrated database..."
PUSH_OUTPUT=$(npx drizzle-kit push --force 2>&1) || {
    echo "$PUSH_OUTPUT"
    echo "drift-check: drizzle-kit push failed." >&2
    exit 1
}
echo "$PUSH_OUTPUT"

if echo "$PUSH_OUTPUT" | grep -qiE "(ALTER|CREATE|DROP) TABLE|apply.*changes|changes applied"; then
    echo "drift-check: FAILED - drizzle-kit wanted to modify the schema; migrations/*.sql drifted from src/Data." >&2
    exit 1
fi

if ! echo "$PUSH_OUTPUT" | grep -qiE "No changes detected|nothing to (push|migrate|do)"; then
    echo "drift-check: WARNING - could not positively confirm 'no changes'; inspect the output above." >&2
    exit 1
fi

echo "drift-check: OK - SQL migrations match the drizzle schema."
