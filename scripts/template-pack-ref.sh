#!/usr/bin/env bash
#
# A composed template's PER-PACK PUBLISH STAMP: the kernel runtime
# fingerprint's input set (scripts/kernel-fingerprint.sh — the same filtered
# ls-tree listing, same blob-id hashing) MINUS the public imagery subtrees
# compose-time pruning removes from this pack's tree
# (scripts/lib/public-assets.mjs decides both, so the stamp hashes exactly
# what the composed tree ships). Two packs' stamps move independently when
# only one pack's imagery moved — the platform's publish-templates.sh
# compares this stamp to decide whether a template repo's CONTENT is stale,
# so a one-pack imagery change republishes one template instead of the whole
# catalog.
#
# This is deliberately NOT the kernel identity. Snapshots, the posture pin,
# and every template's .repobot-template-ref keep the kernel-wide rt-* ref
# (the config doctor's pin/skew comparisons are plain string equality across
# all of them and must keep threading through one identity); this stamp
# rides next to it in .repobot-template-pack-ref and only ever gates the
# tree push. The rtp- prefix keeps the two from ever being mistaken for one
# another in logs or stamps.
#
# Included beyond the pack's own imagery: everything the composed tree ships
# — shared kernel code, every pack's code and pack dir (they all ride along
# in the tree, dead behind the pack switch), this pack's chain's public
# subtrees, and any subtree the reference scan keeps. A change to any of
# those changes the published bytes, so it must change this stamp.
#
# Usage (from a kernel checkout):
#   scripts/template-pack-ref.sh <pack-key> [<commit-ish>|--working-tree]
#
# Prints a single token: rtp-<20 hex chars>. The prune plan reads catalog
# and source CONTENTS from the checkout on disk, so a <commit-ish> other
# than the checked-out state stamps a hybrid — publishers always run this
# against a clean checkout of the commit they publish.

set -euo pipefail

if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <pack-key> [<commit-ish>|--working-tree]" >&2
    exit 1
fi

PACK_KEY="$1"
MODE="${2:---working-tree}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

hash_stdin() {
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum | awk '{print $1}'
    else
        shasum -a 256 | awk '{print $1}'
    fi
}

# The pack's pruned public subtrees, one dir name per line (empty when the
# pack keeps everything — then the stamp covers the kernel fingerprint's
# whole input set and moves in lockstep with it).
PRUNED_FILE="$(mktemp -t template-pack-ref.XXXXXX)"
trap 'rm -f "${PRUNED_FILE}"' EXIT
node "${REPO_ROOT}/scripts/lib/public-assets.mjs" pruned "${PACK_KEY}" > "${PRUNED_FILE}"

STAMP="$(cd "${REPO_ROOT}" && bash scripts/kernel-fingerprint.sh --listing "${MODE}" \
    | awk -F'\t' -v prunedFile="${PRUNED_FILE}" '
        BEGIN {
            while ((getline dir < prunedFile) > 0) {
                if (dir != "") pruned["web/app/public/" dir "/"] = 1
            }
        }
        {
            keep = 1
            for (prefix in pruned) {
                if (index($2, prefix) == 1) { keep = 0; break }
            }
            if (keep) print
        }
    ' | hash_stdin)"

printf 'rtp-%s\n' "${STAMP:0:20}"
