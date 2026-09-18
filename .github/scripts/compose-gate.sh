#!/usr/bin/env bash
#
# The composed-tree gate for ONE pack: compose it, then run the exact
# test-bearing steps of the ci.yml the template ships (the web suite under
# REPOBOT_COMPOSE_GATE=1, plus the theme-agnostic pinned rerun).
#
# Why this exists here (and not only in the platform's publish): composition
# rewrites the root contract documents (repobot.landing.json,
# repobot.theme.json, packs/active.json), so a kernel test that pins
# kernel-default state can pass on the kernel yet fail on every composed
# tree — which is how repobot-photography once published red on its very
# first commit. A template repo must be green at commit zero. CI runs this
# gate per approved pack (matrixed, so the wall clock is one suite) BEFORE
# the templates artifact publishes; the platform's template publish then
# pushes the proven artifact trees as-is instead of recomposing and
# re-proving every tree serially mid-deploy (which cost an hour per kernel
# bump at catalog size).
#
# Usage:
#   .github/scripts/compose-gate.sh <pack-key>
#
# Lives under .github/ deliberately: kernel-fingerprint.sh excludes .github/
# from the runtime identity, so gate tooling changes don't force a rebake of
# every kernel snapshot and a republish of every template. (The job that
# runs this is kernel-repo-only in ci.yml; composed clones skip it.)
#
# Requirements: the kernel's node_modules installed (npm ci). The dependency
# tree is MOVED into the composed stage for the test run and moved back
# after, so one install serves repeated invocations.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PACK_KEY="${1:?Usage: .github/scripts/compose-gate.sh <pack-key>}"

if [[ ! -d "${REPO_ROOT}/node_modules" ]]; then
    echo "compose-gate: kernel node_modules missing; run npm ci first." >&2
    exit 1
fi

STAGE="$(mktemp -d "${TMPDIR:-/tmp}/compose-gate-${PACK_KEY}.XXXXXX")"

# The dependency tree travels by rename (same filesystem when TMPDIR allows;
# falls back to the kernel checkout's parent otherwise) — N gate runs cost
# one npm ci.
move_node_modules() {
    local FROM="$1" TO="$2"
    while IFS= read -r DIR; do
        local RELATIVE="${DIR#"${FROM}"/}"
        mkdir -p "$(dirname "${TO}/${RELATIVE}")"
        mv "${DIR}" "${TO}/${RELATIVE}"
    done < <(find "${FROM}" -maxdepth 3 -type d -name node_modules -not -path '*/node_modules/*')
}

MOVED=false
cleanup() {
    if [[ "${MOVED}" == "true" ]]; then
        move_node_modules "${STAGE}/tree" "${REPO_ROOT}"
    fi
    rm -rf "${STAGE}"
}
trap cleanup EXIT

# mktemp on another filesystem would turn every node_modules rename into a
# full copy (mv falls back to copying across devices); probe with a file and
# stage next to the checkout when that would happen.
PROBE="${REPO_ROOT}/.compose-gate-fs-probe"
touch "${PROBE}"
if ! mv "${PROBE}" "${STAGE}/.fs-probe" 2>/dev/null || [[ "$(stat -f %d "${REPO_ROOT}" 2>/dev/null || stat -c %d "${REPO_ROOT}")" != "$(stat -f %d "${STAGE}" 2>/dev/null || stat -c %d "${STAGE}")" ]]; then
    rm -f "${PROBE}" "${STAGE}/.fs-probe"
    rm -rf "${STAGE}"
    STAGE="$(mktemp -d "${REPO_ROOT}/../compose-gate-${PACK_KEY}.XXXXXX")"
else
    rm -f "${STAGE}/.fs-probe"
fi

bash "${REPO_ROOT}/scripts/compose-pack.sh" "${PACK_KEY}" "${STAGE}/tree"

move_node_modules "${REPO_ROOT}" "${STAGE}/tree"
MOVED=true

# REPOBOT_COMPOSE_GATE: the staged tree is freshly composed, so the strict
# document-fidelity assertions apply here (and only here — in a cloned
# project the platform legitimately edits the documents, so the same tests
# skip those assertions in the repo's own CI).
(cd "${STAGE}/tree" && REPOBOT_COMPOSE_GATE=1 npm --workspace web/app run test)
(cd "${STAGE}/tree" && REPOBOT_COMPOSE_GATE=1 node scripts/check-theme-agnostic-tests.mjs)

# The composed tree carries the pack's repobot.deploy.json, so the same
# capability-declaration check the template's own check-all runs must pass
# HERE, before the artifact publishes — a pack whose declared capabilities
# drift from the kernel clients its tree exercises otherwise publishes a
# template that is red at commit zero (how repobot-saas once burned an
# agent-fix on its first customer PR). Milliseconds per pack; the matrix
# proves every approved pack.
(cd "${STAGE}/tree" && node scripts/verify-capability-declarations.mjs)

move_node_modules "${STAGE}/tree" "${REPO_ROOT}"
MOVED=false

echo "compose-gate: '${PACK_KEY}' composed tree is green."
