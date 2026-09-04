#!/usr/bin/env bash
# The full local quality gate, mirroring CI: codegen -> lint -> build -> prettier.
# Backend tests need the test database and are run via `npm test` (CI runs them
# with a Postgres service container); pass --with-tests to include them here.
#
# Self-scoping: "all" means everything this project is built for, read from
# the deploy manifest (repobot.deploy.json) compose emits into every composed
# tree. A clientOnly content project skips the backend sections; projects
# shipping IOS/ANDROID build those apps too, wherever the toolchain exists.
# The kernel repo carries no manifest and checks its full backend+web surface.

source "$(dirname "$0")/lib/common.sh"
cd "$REPO_ROOT"

WITH_TESTS=false
[ "${1:-}" = "--with-tests" ] && WITH_TESTS=true

# Hash the tree up front so a pass can be recorded in the brief runner's
# gate cache (gate-cache.mjs); a later brief:check gate-passes assertion on
# the unchanged tree then answers from the cache instead of re-running.
GATE_START_HASH="$(node scripts/brief/gate-cache.mjs hash 2>/dev/null || true)"

CHECK_BACKEND=true
CHECK_IOS=false
CHECK_ANDROID=false
if [ -f repobot.deploy.json ]; then
    eval "$(node scripts/lib/check-scope.mjs)"
fi

# A clientOnly skip is only valid evidence while the backend surface is
# actually untouched (same self-guard as check-web.sh): if an agent edited
# it anyway, check it rather than pass a green that means nothing.
if [ "$CHECK_BACKEND" = false ]; then
    BACKEND_DIRTY="$(git status --porcelain -- Graphql firebase protobufs 2>/dev/null || true)"
    if [ -n "$BACKEND_DIRTY" ]; then
        log "clientOnly project, but the backend surface changed; checking it anyway."
        echo "$BACKEND_DIRTY"
        CHECK_BACKEND=true
    fi
fi

if [ "$CHECK_BACKEND" = true ]; then
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

    log "Linting + typechecking firebase/functions (parallel)..."
    # The build's prebuild hook skips via its stamp (codegen.sh above just
    # ran it), so this is lint + tsc — independent, and overlapped.
    run_bg functions-lint npm --workspace firebase/functions run lint
    run_bg functions-build npm --workspace firebase/functions run build
    wait_bg
else
    log "clientOnly project: skipping backend sections (codegen, functions lint/build)."
fi

log "Checking theme contract coverage..."
node scripts/check-theme-hardcoding.mjs

# In the kernel this keeps the pristine manifest fresh (refresh with --write
# after intentional design-system changes); in customer repos it catches
# agents editing the base design system instead of ejecting overrides.
log "Verifying design-system pristine manifest..."
node scripts/verify-ds-pristine.mjs

# In the kernel refresh with --write after intentional test changes; in
# customer repos this catches agents weakening template-shipped tests
# instead of fixing the code the tests pin.
log "Verifying template-shipped tests are intact..."
node scripts/verify-pinned-tests.mjs

# In customer repos this catches agents using a kernel capability (storage,
# documents, jobs, …) without declaring it in repobot.deploy.json — the
# sandbox runs every kernel in local mode, so only the manifest gets the
# backing service provisioned at deploy time. Exits clean in the kernel
# itself (no manifest).
log "Verifying used capabilities are declared in the deploy manifest..."
node scripts/verify-capability-declarations.mjs

# Every pack must declare its base-template family (packs/README.md): the
# platform's workspace taxonomy reads it, so a new pack without a valid
# `base` fails here instead of silently falling outside the taxonomy.
log "Verifying pack catalogs declare a valid base taxonomy..."
node scripts/verify-pack-catalogs.mjs

log "Verifying landing kernel reference is fresh..."
node scripts/generate-landing-reference.mjs --check

log "Verifying design-space manifest is fresh..."
node scripts/generate-design-manifest.mjs --check

log "Verifying app kernel reference is fresh..."
node scripts/generate-web-app-reference.mjs --check

log "Verifying manifest home routes stay kernel-dispatched..."
node scripts/verify-manifest-routes.mjs

# The browser-preview renderer (ios/WebPreview) can only render the dialect
# it implements; this keeps non-game iOS view code inside that contract.
log "Verifying iOS views stay inside the web-preview dialect..."
node scripts/verify-ios-preview-dialect.mjs

# The AGENTS.md shell/auth/pack invariants, made mechanical (ratcheted like
# the theme-hardcoding check: existing violations are baselined in each
# script; new ones fail).
log "Verifying pages render within the kernel shells..."
node scripts/verify-shell-containment.mjs

log "Verifying no sign-in surface outside the kernel auth components..."
node scripts/verify-auth-surface.mjs

# The stale cross-project preview-token class (8cff2e6): sessions and
# authenticated fetches must ride the shared self-healing helpers, never a
# hand-rolled token + raw fetch.
log "Verifying auth plumbing stays on the shared helpers..."
node scripts/check-auth-plumbing.mjs

log "Verifying every pack is intact (catalog + home view)..."
node scripts/verify-pack-integrity.mjs

# Every approved pack and standalone template must carry a resolvable agent
# map (the AGENT_MAP section compose stamps into AGENTS.md): generation must
# succeed, no referenced path may dangle, and standalone stamps must be
# fresh. A new template cannot merge without one.
log "Verifying agent maps resolve for every approved template..."
node scripts/check-agent-maps.mjs

log "Verifying the storefront isn't signposted while still the stock demo..."
node scripts/verify-shop-integration.mjs

# Every package the web source can import — including through lazy chunks —
# must be pre-optimized at dev-server boot (optimizeDepsInclude.mjs), or the
# first page that introduces it mid-session breaks loaded dynamic imports.
log "Verifying the cold-boot dep cache covers every web import..."
npm run test:dep-cache

# Regenerate the app's codegen once up front: the build and test hooks
# (prebuild / pretest) then hit their stamp guard and skip, instead of two
# regenerations racing on src/generated inside the parallel wave below.
npm --workspace web/app run codegen

log "Typechecking + linting web packages (parallel)..."
run_bg core-typecheck npm --workspace web/core run typecheck
run_bg ds-typecheck npm --workspace web/design-system run typecheck
run_bg app-lint npm --workspace web/app run lint
wait_bg

log "Building + testing web app (parallel)..."
run_bg app-build npm --workspace web/app run build
run_bg app-test npm --workspace web/app run test
wait_bg

# Native checks run exactly when the project ships that platform and this
# machine can build it; elsewhere they log an explicit skip (the platform
# builds native apps remotely), never a failure.
if [ "$CHECK_IOS" = true ]; then
    if [ "$(uname -s)" = "Darwin" ] && command -v xcodebuild >/dev/null 2>&1; then
        log "Building iOS (project ships the IOS capability)..."
        npm run check:ios
    else
        log "Skipping iOS build: project ships IOS but this machine has no Xcode."
    fi
fi

if [ "$CHECK_ANDROID" = true ]; then
    if [ -d android ] && { [ -n "${ANDROID_HOME:-}" ] || [ -n "${ANDROID_SDK_ROOT:-}" ] || [ -f android/local.properties ]; }; then
        log "Building Android (project ships the ANDROID capability)..."
        npm run check:android
    else
        log "Skipping Android build: project ships ANDROID but no Android SDK is available."
    fi
fi

log "Prettier check..."
"$REPO_ROOT/node_modules/.bin/prettier" --check "Graphql/**/*.gql" "docs/**/*.md" "*.md" >/dev/null

if [ "$WITH_TESTS" = true ] && [ "$CHECK_BACKEND" = false ]; then
    log "clientOnly project: skipping backend tests (--with-tests)."
elif [ "$WITH_TESTS" = true ]; then
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

# check:all runs a strict superset of check:web's steps, so one pass is
# evidence for both gates on this tree.
node scripts/brief/gate-cache.mjs record "$GATE_START_HASH" check:all check:web 2>/dev/null || true
log "check:all passed."
