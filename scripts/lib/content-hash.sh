#!/usr/bin/env bash
# Prints one sha256 over the content of the given files and directories
# (directories are hashed recursively; missing paths are skipped). Used by
# the build/codegen stamp guards: a step records the hash of everything it
# reads AND writes after a successful run, and skips itself when the hash is
# unchanged. Hashing content (never mtimes) keeps stamps stable across tree
# copies, git resets, and snapshot restores; hashing outputs as well as
# inputs keeps freshness gates sound — a hand-edited output flips the hash
# and forces a regeneration that exposes the drift.
set -euo pipefail

# Linux (sandbox pods, CI) has sha256sum; macOS dev machines have shasum.
HASH_CMD=(sha256sum)
command -v sha256sum >/dev/null 2>&1 || HASH_CMD=(shasum -a 256)

{
    for target in "$@"; do
        if [ -d "$target" ]; then
            find "$target" -type f -print0
        elif [ -f "$target" ]; then
            printf '%s\0' "$target"
        fi
    done
} | sort -z | xargs -0 "${HASH_CMD[@]}" | "${HASH_CMD[@]}" | awk '{print $1}'
