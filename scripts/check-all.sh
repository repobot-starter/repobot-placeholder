#!/usr/bin/env bash
# The full local quality gate, mirroring CI: codegen -> lint -> build -> prettier.
# Backend tests need the test database and are run via `npm test` (CI runs them
# with a Postgres service container); pass --with-tests to include them here.

source "$(dirname "$0")/lib/common.sh"
cd "$REPO_ROOT"

WITH_TESTS=false
[ "${1:-}" = "--with-tests" ] && WITH_TESTS=true

bash scripts/codegen.sh

# Generated code is committed (composed templates must typecheck on a fresh
# clone), so codegen must be a no-op against the working tree. A diff here
# means someone edited .gql/.proto sources without re-running codegen.
log "Checking committed generated code is fresh..."
GENERATED_DIRS=(web/app/src/generated firebase/functions/generated)
STALE="$(
    git ls-files --others --exclude-standard -- "${GENERATED_DIRS[@]}"
    git diff --name-only -- "${GENERATED_DIRS[@]}"
)"
if [ -n "$STALE" ]; then
    echo "$STALE"
    fail "Generated code is stale. Commit the codegen output above (npm run codegen)."
fi

log "Linting + typechecking firebase/functions..."
npm --workspace firebase/functions run lint
npm --workspace firebase/functions run build

log "Checking theme contract coverage..."
node scripts/check-theme-hardcoding.mjs

# In the kernel this keeps the pristine manifest fresh (refresh with --write
# after intentional design-system changes); in customer repos it catches
# agents editing the base design system instead of ejecting overrides.
log "Verifying design-system pristine manifest..."
node scripts/verify-ds-pristine.mjs

log "Typechecking web packages..."
npm --workspace web/core run typecheck
npm --workspace web/design-system run typecheck
npm --workspace web/app run lint
npm --workspace web/app run build

log "Running web tests..."
npm --workspace web/app run test

log "Prettier check..."
npx prettier --check "Graphql/**/*.gql" "docs/**/*.md" "*.md" >/dev/null

if [ "$WITH_TESTS" = true ]; then
    log "Running backend tests (requires the test db container)..."
    bash scripts/dev-db.sh --test
    # Resolve the container's real host port: it may be remapped away from
    # 5433 on machines where another project owns that port. Passing the URL
    # explicitly keeps migrate + tests pointed at the same database dev-db
    # just verified.
    TEST_DB_PORT="$(resolve_db_container_port base-local-test "${DB_TEST_PORT:-5433}")"
    TEST_DB_URL="postgres://postgres:postgres@127.0.0.1:${TEST_DB_PORT}/postgres"
    MIGRATE_TEST_DATABASE_URL="$TEST_DB_URL" npm --workspace firebase/functions run migrate:test
    DATABASE_URL="$TEST_DB_URL" npm --workspace firebase/functions run test
fi

log "check:all passed."
