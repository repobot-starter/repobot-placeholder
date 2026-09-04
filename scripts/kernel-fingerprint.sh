#!/usr/bin/env bash
#
# The kernel's RUNTIME FINGERPRINT: a content hash of every tracked file that
# can influence what a baked kernel runs — sources, lockfiles, migrations,
# codegen inputs, packs (including their markdown: PACK.md feeds the agent
# map compose stamps into AGENTS.md), the root AGENTS.md, bake scripts —
# and nothing that can't: docs/, other markdown, test suites, and the
# test-pin manifests. This is the identity
# kernel snapshots are named by, the posture pin points at, and templates are
# stamped with (the platform's pin/skew comparisons are plain string
# equality, so one identity must thread through all three).
#
# Why not the commit SHA: a tests-only or docs-only commit changes the SHA
# but nothing a pod runs, and under SHA-naming it forced a full rebake +
# republish + repin cycle. Under fingerprint-naming those commits resolve to
# the artifact that already exists.
#
# The deliberate trade-off: files excluded here still ship through the
# template PUBLISH path (the publisher clones the exact commit), but a
# compose-push provisioned project seeds from the snapshot tree, so its
# tests/docs can lag main by however long until the next runtime-relevant
# commit lands. Gates never lag: CI and the publish gates always run from
# the real commit.
#
# Usage (from a kernel checkout):
#   scripts/kernel-fingerprint.sh [<commit-ish>]   # fingerprint a commit
#   scripts/kernel-fingerprint.sh --working-tree   # fingerprint the working
#                                                  # tree (tracked + untracked,
#                                                  # gitignore applied); the
#                                                  # default
#   scripts/kernel-fingerprint.sh --listing [<commit-ish>|--working-tree]
#                                  # print the filtered ls-tree lines the
#                                  # fingerprint hashes, instead of hashing.
#                                  # For derived identities that must share
#                                  # THIS filter (template-pack-ref.sh
#                                  # subtracts pruned pack imagery from it) —
#                                  # one filter definition, or the identities
#                                  # drift apart silently.
#
# Prints a single token: rt-<20 hex chars>. Deterministic across machines
# for the same content (it hashes git's own blob ids, so line endings and
# mtimes never enter). Also runnable via stdin against any checkout that
# has the commit object:
#   git show <sha>:scripts/kernel-fingerprint.sh | bash -s -- <sha>

set -euo pipefail

EMIT="hash"
if [[ "${1:-}" == "--listing" ]]; then
    EMIT="listing"
    shift
fi
MODE="${1:---working-tree}"

hash_stdin() {
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum | awk '{print $1}'
    else
        shasum -a 256 | awk '{print $1}'
    fi
}

if [[ "${MODE}" == "--working-tree" ]]; then
    # Snapshot the working tree (tracked + untracked, .gitignore applied)
    # into a temporary index so dirty local bakes fingerprint EXACTLY what
    # they stage — without touching the real index.
    TMP_INDEX="$(mktemp "${TMPDIR:-/tmp}/kernel-fp-index.XXXXXX")"
    trap 'rm -f "${TMP_INDEX}"' EXIT
    cp "$(git rev-parse --git-path index)" "${TMP_INDEX}" 2>/dev/null || true
    GIT_INDEX_FILE="${TMP_INDEX}" git add -A >/dev/null
    TREE="$(GIT_INDEX_FILE="${TMP_INDEX}" git write-tree)"
else
    TREE="$(git rev-parse "${MODE}^{tree}")"
fi

# `git ls-tree -r` prints "<mode> <type> <blob-sha>\t<path>" per file; the
# blob sha IS the content hash, so hashing the filtered listing fingerprints
# the runtime tree without reading a single file body. Keep the exclusion
# list SMALL and obviously-inert: anything questionable stays in (an extra
# bake is cheap; a stale runtime artifact is not). ios/ and android/ stay
# IN — they ship into provisioned project repos from the snapshot tree.
# The root AGENTS.md and packs/**/*.md stay IN too: compose stamps the
# generated agent map (generate-agent-map.mjs, fed by PACK.md notes) into
# every composed tree's AGENTS.md, so those files ARE runtime-relevant — a
# map/doc edit must move the identity and force a bake/pin, at the accepted
# cost of doc-only pack commits triggering rebakes.
# The .pristine-manifest.json files are derived (sha256 of files already in
# the fingerprint), so a manifest regeneration alone never changes identity.
LISTING="$(git ls-tree -r "${TREE}" | awk -F'\t' '
    $2 !~ /^docs\// &&
    $2 !~ /^\.github\// &&
    ($2 !~ /\.md$/ || $2 == "AGENTS.md" || $2 ~ /^packs\/.*\.md$/) &&
    $2 !~ /^firebase\/functions\/test\// &&
    $2 !~ /^web\/app\/tests\// &&
    $2 !~ /\.test\.(ts|tsx|js|jsx|mjs|mts)$/ &&
    $2 !~ /\/\.pristine-manifest\.json$/
')"

if [[ "${EMIT}" == "listing" ]]; then
    printf '%s\n' "${LISTING}"
    exit 0
fi

FINGERPRINT="$(printf '%s\n' "${LISTING}" | hash_stdin)"

printf 'rt-%s\n' "${FINGERPRINT:0:20}"
