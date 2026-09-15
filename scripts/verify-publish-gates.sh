#!/usr/bin/env bash
# The kernel's publish gate set — the SINGLE definition of "this kernel tree
# is shippable to the platform". Three consumers run exactly this script:
#
#   1. Kernel CI (.github/workflows/ci.yml, publish-gates job): a kernel
#      commit that fails here never publishes a snapshot or templates
#      artifact, so a green kernel main MEANS platform-deployable.
#   2. The platform's template publish (repobot scripts/publish-templates.sh)
#      re-runs it against the kernel checkout it stages mid-deploy — the
#      same script, so the two sides cannot drift.
#   3. The platform's scripts/preflight.sh (and anyone locally) runs it
#      before pushing work that rides a deploy train.
#
# Every gate runs before the script exits: one pass reports every problem.
# (2026-09-10: the proofing feature paid one ~25-minute platform train per
# gate to learn, serially, four facts this script reports in one minute.)
#
# Dependency-free by design: node + a git checkout, no npm ci.
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

FAILURES=()
gate() {
    local name="$1"
    shift
    echo "==> ${name}"
    "$@" || FAILURES+=("${name}")
}

gate "compose contract tests (scripts/compose-pack.test.mjs)" \
    node --test scripts/compose-pack.test.mjs
gate "design-system pristine manifests (fix: node scripts/verify-ds-pristine.mjs --write, then commit)" \
    node scripts/verify-ds-pristine.mjs
gate "pinned-tests manifest (fix: node scripts/verify-pinned-tests.mjs --write, then commit)" \
    node scripts/verify-pinned-tests.mjs
gate "landing reference freshness (fix: npm run codegen:landing-reference, then commit)" \
    node scripts/generate-landing-reference.mjs --check
gate "kernel contract version bump guard (fix: bump kernel-contract.json version when surface paths change)" \
    node scripts/check-kernel-contract-version.mjs

echo ""
if [[ ${#FAILURES[@]} -gt 0 ]]; then
    echo "publish gates FAILED (${#FAILURES[@]} of 5):" >&2
    for f in "${FAILURES[@]}"; do echo "  - ${f}" >&2; done
    exit 1
fi
echo "All 5 publish gates green: this kernel tree is platform-shippable."
