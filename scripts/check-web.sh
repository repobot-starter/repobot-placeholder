#!/usr/bin/env bash
# The content-tier quality gate: web packages only. Marketing/content work
# (landing configs, copy, page views, theme) never touches the backend, so
# gating it on check:all — codegen, functions lint+build, the full monorepo —
# multiplies every agent verification loop by minutes it doesn't need. The
# brief compiler emits this gate for content-only projects (repo-healthy ask);
# everything else keeps check:all.
#
# Self-guarding: if anything outside the web app's surface changed (GraphQL
# schema, backend, protos, the pristine design system, kernel scripts), the
# web-only shortcut is no longer valid evidence of repo health — escalate to
# the full check:all instead of passing a green that means nothing.

source "$(dirname "$0")/lib/common.sh"
cd "$REPO_ROOT"

GUARD_PATHS=(Graphql firebase protobufs ios android packs web/design-system web/core scripts docs/brief-spec.md)
GUARD_DIRTY="$(git status --porcelain -- "${GUARD_PATHS[@]}" 2>/dev/null || true)"
if [ -n "$GUARD_DIRTY" ]; then
    log "check:web guard: non-web surface changed; escalating to the full check:all."
    echo "$GUARD_DIRTY"
    exec bash "$REPO_ROOT/scripts/check-all.sh" "$@"
fi

# Hash the tree up front so a pass can be recorded in the brief runner's
# gate cache (gate-cache.mjs): agents iterate with direct check:web runs
# and finish with the full brief:check, whose gate-passes assertion then
# answers from the cache instead of re-running this whole script.
GATE_START_HASH="$(node scripts/brief/gate-cache.mjs hash 2>/dev/null || true)"

log "Checking theme contract coverage..."
node scripts/check-theme-hardcoding.mjs

log "Verifying design-system pristine manifest..."
node scripts/verify-ds-pristine.mjs

log "Verifying template-shipped tests are intact..."
node scripts/verify-pinned-tests.mjs

log "Verifying landing kernel reference is fresh..."
node scripts/generate-landing-reference.mjs --check

log "Verifying the storefront isn't signposted while still the stock demo..."
node scripts/verify-shop-integration.mjs

# The AGENTS.md shell/auth/pack invariants, made mechanical (ratcheted like
# the theme-hardcoding check: existing violations are baselined in each
# script; new ones fail).
log "Verifying pages render within the kernel shells..."
node scripts/verify-shell-containment.mjs

log "Verifying no sign-in surface outside the kernel auth components..."
node scripts/verify-auth-surface.mjs

log "Verifying every pack is intact (catalog + home view)..."
node scripts/verify-pack-integrity.mjs

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

node scripts/brief/gate-cache.mjs record "$GATE_START_HASH" check:web 2>/dev/null || true
log "check:web passed."
