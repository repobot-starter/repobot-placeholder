#!/usr/bin/env bash
#
# Bake the kernel tree in place: install dependencies, run codegen, build the
# functions package, initialize the embedded Postgres cluster, and stamp the
# lockfile hash. This is THE definition of "a baked kernel" — the platform's
# runtime-image bake stage and build-kernel-snapshot.sh both execute this
# script, so the two artifacts can never drift (see the platform repo's
# docs/plans/kernel-snapshot-artifacts.md). Add bake steps here, nowhere else.
#
# Usage (from a kernel tree root):
#   scripts/bake-kernel-tree.sh [--skip-install]
#
# --skip-install: the caller already ran `npm ci` (the runtime Dockerfile
# installs in a separate manifests-only layer so docker caches it across
# kernel source edits).
#
# REPOBOT_BAKE_DEP_CACHE (optional): a directory (build-kernel-snapshot.sh
# mounts a named docker volume there) caching the two bake layers that
# dominate wall time and only change when their INPUTS change:
#   - node_modules, keyed on arch + package-lock.json: restored instead of
#     npm ci when the lockfile is unchanged (~90% of bake time on a
#     source-only edit).
#   - the initialized+migrated Postgres data dir, keyed on arch + the
#     migrations tree + the embedded-pg script + the lockfile (which pins
#     the postgres binary version): restored instead of initdb + full
#     migration replay.
# Cache entries are content-addressed, written atomically, and pruned to the
# 3 newest per layer. A cache problem can only ever cost a cold bake.
#
# Must run on the platform the artifact will serve (sharp, esbuild, and the
# embedded Postgres binaries are native), as a non-root user (initdb refuses
# root). All output goes to stderr so callers can stream a pack over stdout.

set -euo pipefail

SKIP_INSTALL=0
if [[ "${1:-}" == "--skip-install" ]]; then
    SKIP_INSTALL=1
fi

if [[ ! -f package-lock.json || ! -d scripts ]]; then
    echo "bake-kernel-tree.sh must run from a kernel tree root." >&2
    exit 1
fi

hash_stdin() {
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum | awk '{print $1}'
    else
        shasum -a 256 | awk '{print $1}'
    fi
}

DEP_CACHE="${REPOBOT_BAKE_DEP_CACHE:-}"
if [[ -n "${DEP_CACHE}" ]] && ! command -v zstd >/dev/null 2>&1; then
    echo "bake: REPOBOT_BAKE_DEP_CACHE set but zstd is missing; baking cold." >&2
    DEP_CACHE=""
fi
if [[ -n "${DEP_CACHE}" ]]; then
    mkdir -p "${DEP_CACHE}" 2>/dev/null || DEP_CACHE=""
fi

ARCH="$(uname -m)"
LOCKHASH="$(hash_stdin < package-lock.json)"
NM_ENTRY=""
PG_ENTRY=""
SKIP_PG=0
if [[ -n "${DEP_CACHE}" ]]; then
    NM_ENTRY="${DEP_CACHE}/node-modules-${ARCH}-${LOCKHASH:0:20}.tar.zst"
    PG_KEY="$( { cat package-lock.json scripts/lib/embedded-pg.mjs; \
                 find firebase/functions/migrations -type f | LC_ALL=C sort | xargs cat; } | hash_stdin)"
    PG_ENTRY="${DEP_CACHE}/pg-core-${ARCH}-${PG_KEY:0:20}.tar.zst"
fi

# Save one cache layer: pack to a temp file, then rename — a concurrent bake
# must never see a torn entry — and prune the layer to its 3 newest entries.
save_cache_entry() {
    local entry="$1"; shift
    local tmp="${entry}.tmp-$$"
    if tar -cf - "$@" 2>/dev/null | zstd -T0 -q -o "${tmp}" 2>/dev/null; then
        mv -f "${tmp}" "${entry}"
        local prefix
        prefix="$(basename "${entry}" | sed 's/-[^-]*-[0-9a-f]*\.tar\.zst$//')"
        ls -t "${DEP_CACHE}/${prefix}"-*.tar.zst 2>/dev/null | tail -n +4 | xargs rm -f 2>/dev/null || true
    else
        rm -f "${tmp}"
        echo "bake: failed to save cache entry $(basename "${entry}") (non-fatal)." >&2
    fi
}

{
    if [[ "${SKIP_INSTALL}" -ne 1 && -n "${NM_ENTRY}" && -f "${NM_ENTRY}" ]]; then
        echo "bake: restoring node_modules from dep cache ($(basename "${NM_ENTRY}"))..."
        if tar --zstd -xf "${NM_ENTRY}"; then
            SKIP_INSTALL=1
        else
            echo "bake: cache restore failed; falling back to npm ci." >&2
            rm -f "${NM_ENTRY}"
        fi
    fi
    if [[ "${SKIP_INSTALL}" -ne 1 ]]; then
        npm ci --no-audit --no-fund
        if [[ -n "${NM_ENTRY}" ]]; then
            echo "bake: saving node_modules dep-cache layer..."
            # Every workspace-level node_modules (npm hoists most of it to
            # the root, but workspace dirs carry bins and native builds).
            save_cache_entry "${NM_ENTRY}" \
                $(find . -maxdepth 4 -type d -name node_modules -not -path '*/node_modules/*')
        fi
    fi
    npm run codegen
    npm --workspace firebase/functions run build
    # Stamp the functions build inputs so dev-up.sh can skip the (expensive:
    # codegen wipe + regen + full tsc) build on boot when nothing changed —
    # which is every fresh session seeded from this bake.
    mkdir -p .dev
    bash scripts/lib/functions-build-stamp.sh > .dev/functions-build-stamp
    # Warm the web packages' incremental typecheck caches into the tree. The
    # platform runtime's typecheck gate and bootstrap warm-up run this exact
    # invocation (AgentHost.mjs) for web/app, and check:web runs the same
    # flags for every package, so every session seeded from this bake
    # revalidates in seconds instead of paying cold full-program compiles.
    # node_modules/.cache rides the bake copy and workspace snapshots, is
    # never tracked by git, and tsc >= 5 stores build-info paths relative to
    # the file, so the cache survives the tree moving to per-session paths.
    for ws in web/app web/core web/design-system; do
        (
            cd "$ws"
            mkdir -p node_modules/.cache
            npx --no-install tsc --noEmit --incremental \
                --tsBuildInfoFile node_modules/.cache/repobot-typecheck.tsbuildinfo
        )
    done
    if [[ -n "${PG_ENTRY}" && -f "${PG_ENTRY}" ]]; then
        echo "bake: restoring initialized Postgres cluster from dep cache ($(basename "${PG_ENTRY}"))..."
        if tar --zstd -xf "${PG_ENTRY}"; then
            SKIP_PG=1
        else
            echo "bake: pg cache restore failed; falling back to initdb + migrate." >&2
            rm -rf .devdata/pg-core
            rm -f "${PG_ENTRY}"
        fi
    fi
    if [[ "${SKIP_PG}" -ne 1 ]]; then
        node scripts/lib/embedded-pg.mjs start core
        # Pre-apply migrations into the baked cluster: without this every cold
        # workspace replays the entire migration history inside its boot's
        # critical path. dev-up's migrate stays and becomes a fast no-op.
        DATABASE_URL="postgres://postgres:postgres@127.0.0.1:${DB_PORT:-5432}/postgres" \
            npm --workspace firebase/functions run migrate
        node scripts/lib/embedded-pg.mjs stop core
        if [[ -n "${PG_ENTRY}" && -d .devdata/pg-core ]]; then
            echo "bake: saving initialized Postgres dep-cache layer..."
            PG_PATHS=(.devdata/pg-core)
            [[ -f .devdata/.pg-core-pw ]] && PG_PATHS+=(.devdata/.pg-core-pw)
            save_cache_entry "${PG_ENTRY}" "${PG_PATHS[@]}"
        fi
    fi
    printf '%s\n' "${LOCKHASH}" > .repobot-bake-lockhash
} 1>&2
