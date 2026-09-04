#!/usr/bin/env bash
#
# Switch which pack owns `/` in the local dev stack — the fast path for
# iterating on template UI locally instead of through sandbox pods or
# deploys. Delegates to scripts/lib/pack-switch.mjs (shared with the
# Template Studio at /__studio on the dev server), which writes
# packs/active.json plus the pack's compose-time overlays (theme, landing,
# project IA); web/app watches those files, so a running Vite dev server
# (scripts/dev-up.sh) hot-swaps the home surface immediately — no recompose,
# rebuild, or restart.
#
# Usage:
#   scripts/dev-pack.sh              list packs, mark the active one
#   scripts/dev-pack.sh <pack-key>   switch to a pack (e.g. paint)
#   scripts/dev-pack.sh --next       cycle to the next pack alphabetically
#   scripts/dev-pack.sh --prev       cycle to the previous pack
#
# Switching to `blank` restores every pristine committed file the overlays
# touched (no git diff), so there is nothing to clean up when you are done —
# except stub pages the IA scaffolder generated, which are never deleted
# automatically and are listed on every switch (`git clean` removes them).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

exec node "${REPO_ROOT}/scripts/lib/pack-switch.mjs" "${1:-}"
