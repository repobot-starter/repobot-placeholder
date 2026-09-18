#!/usr/bin/env bash
#
# Build a kernel snapshot: the fully baked workspace tree (sources,
# node_modules, build output, initialized embedded-Postgres data dir, and
# version stamps) packed as a content-addressed, per-platform tar.zst. This
# is the artifact the platform's runtime pods fetch and preboot from instead
# of baking the kernel into their image (see the platform repo's
# docs/plans/kernel-snapshot-artifacts.md — kernel changes ship as snapshot
# publishes plus a pin bump, never as image rebuilds).
#
# Usage:
#   scripts/build-kernel-snapshot.sh [output-dir]
#   scripts/build-kernel-snapshot.sh --publish gs://<bucket>[/prefix] [output-dir]
#
# Output:
#   <output-dir>/kernel-<platform>-<ref>.tar.zst
#   <output-dir>/kernel-<platform>-<ref>.json   (ref, source commit, bytes)
#
# The ref is the RUNTIME FINGERPRINT (scripts/kernel-fingerprint.sh): a
# content hash of the tree minus docs/tests/markdown. Content addressing is
# what makes bakes skippable — a commit that changes nothing a pod runs
# resolves to the artifact that already exists, and this script then does
# NOTHING (locally: the file is already in the output dir; publishing: the
# object is already in the store). REPOBOT_KERNEL_FORCE_BAKE=1 rebakes
# anyway.
#
# --publish uploads both files to the given GCS store (the one the posture's
# runtime pods read via REPOBOT_KERNEL_SNAPSHOT_STORE). Dirty checkouts are
# refused: an artifact no commit can reproduce must not enter a shared
# store. CI publishes every green main push (.github/workflows/ci.yml, bake
# job), so in the steady state no workstation runs this against a shared
# store at all.
#
# Default output dir: dist/kernel-snapshots. The tree is staged from the
# checkout's WORKING TREE (gitignore rules applied), so local iteration bakes
# exactly what you are editing. The artifact is named by the fingerprint
# ALONE — never a -dirty suffix. The fingerprint already describes the exact
# content, and every consumer (template staging stamps, .env pins, the
# runtime's fetch) addresses artifacts by that same fingerprint; a suffix on
# just this file made the local bring-up bake a snapshot its own pin step
# could then never find. Dirtiness is recorded in the manifest ("dirty":
# true) and enforced where it matters: the publish guard above.
#
# The bake must run on the pod platform (native deps, initdb), so on
# non-linux hosts it streams the staged tree through a small builder image
# (node:20 + zstd) and streams the packed snapshot back out — no bind
# mounts, so macOS FUSE IO never touches node_modules. Two named volumes
# keep container rebakes warm: the npm download cache, and the bake
# dependency cache (node_modules + initialized Postgres, keyed by lockfile /
# migrations content — see bake-kernel-tree.sh), which turns a source-only
# rebake from an npm ci + initdb + full-migration-replay into a restore.
# On linux with node available it bakes in place.

set -euo pipefail

# KERNELS BAKE IN CI. ONLY IN CI. The bake job (.github/workflows/ci.yml)
# publishes both pod architectures (amd64 + arm64) to the dev store on every
# green main push; every consumer — dev/prod deploys AND the local bring-up
# — fetches from there by fingerprint. A workstation bake produces an
# artifact no commit can reproduce, ties up the machine for minutes, and is
# exactly the workflow this pipeline exists to end. If you are stuck because
# the store lacks your fingerprint: commit, push, and let CI bake it.
# REPOBOT_ALLOW_LOCAL_BAKE=1 exists for debugging this script itself.
if [[ -z "${CI:-}" && "${REPOBOT_ALLOW_LOCAL_BAKE:-}" != "1" ]]; then
    echo "Refusing to bake outside CI. Kernel snapshots bake in the CI bake job" >&2
    echo "and publish to the dev store; commit + push and CI will bake this" >&2
    echo "fingerprint for both platforms. (REPOBOT_ALLOW_LOCAL_BAKE=1 overrides" >&2
    echo "for debugging the bake tooling itself.)" >&2
    exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUBLISH_STORE=""
if [[ "${1:-}" == "--publish" ]]; then
    PUBLISH_STORE="${2:?--publish requires a gs://bucket[/prefix] store}"
    if [[ "${PUBLISH_STORE}" != gs://* ]]; then
        echo "--publish store must be a gs://bucket[/prefix] URL, got: ${PUBLISH_STORE}" >&2
        exit 1
    fi
    shift 2
fi
OUT_DIR="${1:-${REPO_ROOT}/dist/kernel-snapshots}"
BUILDER_IMAGE="${REPOBOT_KERNEL_BUILDER_IMAGE:-repobot-kernel-builder:local}"
NPM_CACHE_VOLUME="${REPOBOT_KERNEL_NPM_CACHE_VOLUME:-repobot-kernel-npm-cache}"
DEP_CACHE_VOLUME="${REPOBOT_KERNEL_DEP_CACHE_VOLUME:-repobot-kernel-dep-cache}"

# --- Resolve the ref: the runtime fingerprint --------------------------------
SOURCE_COMMIT="$(git -C "${REPO_ROOT}" rev-parse HEAD)"
REF="$(cd "${REPO_ROOT}" && bash scripts/kernel-fingerprint.sh --working-tree)"
DIRTY=false
if [[ -n "$(git -C "${REPO_ROOT}" status --porcelain 2>/dev/null)" ]]; then
    # The fingerprint already hashes the exact working-tree content, so the
    # artifact name stays the bare fingerprint (everything that pins or
    # fetches snapshots addresses them that way); DIRTY only marks the bake
    # as not-from-a-commit for the manifest and the publish guard below.
    DIRTY=true
fi

if [[ -n "${PUBLISH_STORE}" && "${DIRTY}" == "true" ]]; then
    echo "Refusing to publish from a dirty checkout (${REF}) to ${PUBLISH_STORE}." >&2
    echo "Commit the changes first; only artifacts a commit can reproduce may enter a shared store." >&2
    exit 1
fi

# --- Resolve the platform up front (needed for the reuse checks) -------------
resolve_container_platform() {
    if [[ -n "${REPOBOT_KERNEL_PLATFORM:-}" ]]; then
        PLATFORM="${REPOBOT_KERNEL_PLATFORM}"
    else
        PLATFORM="linux-$(docker version --format '{{.Server.Arch}}')"
    fi
}
if [[ "$(uname -s)" == "Linux" ]] && command -v node >/dev/null 2>&1 && command -v zstd >/dev/null 2>&1; then
    BAKE_MODE="in_place"
    PLATFORM="linux-$(uname -m | sed 's/x86_64/amd64/; s/aarch64/arm64/')"
else
    BAKE_MODE="container"
    if ! command -v docker >/dev/null 2>&1; then
        echo "docker is required to bake a linux kernel snapshot from this host." >&2
        exit 1
    fi
    resolve_container_platform
fi
SNAPSHOT="${OUT_DIR}/kernel-${PLATFORM}-${REF}.tar.zst"
MANIFEST="${OUT_DIR}/kernel-${PLATFORM}-${REF}.json"

# --- Content-addressed reuse --------------------------------------------------
# The whole point of fingerprint refs: if the artifact for this exact runtime
# content already exists, there is nothing to bake.
if [[ "${REPOBOT_KERNEL_FORCE_BAKE:-}" != "1" ]]; then
    if [[ -n "${PUBLISH_STORE}" ]]; then
        DEST="${PUBLISH_STORE%/}"
        if gcloud storage objects describe "${DEST}/kernel-${PLATFORM}-${REF}.tar.zst" >/dev/null 2>&1; then
            echo "Snapshot kernel-${PLATFORM}-${REF} is already published to ${DEST}; nothing to bake." >&2
            echo "Pin it with REPOBOT_KERNEL_SNAPSHOT_REF=${REF}." >&2
            exit 0
        fi
    fi
    if [[ -f "${SNAPSHOT}" ]]; then
        if [[ -n "${PUBLISH_STORE}" ]]; then
            echo "Snapshot already baked locally (${SNAPSHOT}); publishing without rebaking." >&2
        else
            echo "Kernel snapshot already baked: ${SNAPSHOT} (REPOBOT_KERNEL_FORCE_BAKE=1 rebakes)." >&2
            exit 0
        fi
    fi
fi

# --- Stage and bake (only when the artifact doesn't exist yet) ---------------
if [[ ! -f "${SNAPSHOT}" || "${REPOBOT_KERNEL_FORCE_BAKE:-}" == "1" ]]; then
    STAGE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/kernel-snapshot-stage.XXXXXX")"
    cleanup_stage() {
        rm -rf "${STAGE_DIR}"
    }
    trap cleanup_stage EXIT

    rsync -a \
        --exclude .git \
        --filter=':- .gitignore' \
        "${REPO_ROOT}/" "${STAGE_DIR}/"
    printf '%s\n' "${REF}" > "${STAGE_DIR}/.repobot-template-ref"

    mkdir -p "${OUT_DIR}"

    bake_in_container() {
        # REPOBOT_KERNEL_PLATFORM (e.g. linux-amd64) cross-bakes for another
        # pod architecture via docker platform emulation. Slow under qemu; CI
        # bakes natively per platform (ci.yml bake job), this is the escape
        # hatch for when CI is down.
        # Single-token --platform=… so the empty case expands to nothing under
        # bash 3.2's set -u (macOS's system bash has no safe empty arrays).
        local docker_platform_flag=""
        if [[ -n "${REPOBOT_KERNEL_PLATFORM:-}" ]]; then
            docker_platform_flag="--platform=linux/${PLATFORM#linux-}"
        fi
        # The existence check alone is not enough: a native bake leaves an
        # image of the host's architecture under this tag, and a later
        # cross-platform bake would find it, skip the build, and then fail at
        # `docker run --platform` with a misleading "pull access denied"
        # (docker tries the registry when the local tag's arch doesn't
        # match). Check the arch too and rebuild under the same tag when it
        # differs.
        local want_arch="${PLATFORM#linux-}"
        local have_arch=""
        if docker image inspect "${BUILDER_IMAGE}" >/dev/null 2>&1; then
            have_arch="$(docker image inspect --format '{{.Architecture}}' "${BUILDER_IMAGE}")"
        fi
        if [[ "${have_arch}" != "${want_arch}" ]]; then
            if [[ -n "${have_arch}" ]]; then
                echo "Builder image ${BUILDER_IMAGE} is ${have_arch}; rebuilding for ${want_arch}..." >&2
            fi
            echo "Building the kernel builder image (${BUILDER_IMAGE}, ${want_arch})..." >&2
            docker build ${docker_platform_flag:+"${docker_platform_flag}"} -t "${BUILDER_IMAGE}" - <<'DOCKERFILE'
FROM node:20-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    git zstd ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /work /npm-cache /dep-cache && chown node:node /work /npm-cache /dep-cache
ENV npm_config_cache=/npm-cache
USER node
WORKDIR /work
DOCKERFILE
        fi
        echo "Baking kernel snapshot ${PLATFORM}@${REF} in ${BUILDER_IMAGE}..." >&2
        # Tree streams in over stdin and the packed snapshot streams out over
        # stdout: all heavy IO (npm ci, build, initdb) happens on the
        # container's own filesystem. The npm cache volume keeps downloads
        # warm; the dep cache volume keeps the INSTALLED node_modules and the
        # initialized Postgres cluster warm (bake-kernel-tree.sh restores
        # them when the lockfile / migrations are unchanged — the 15-minute
        # local bake becomes a ~2-minute refresh).
        # COPYFILE_DISABLE: macOS bsdtar otherwise embeds AppleDouble ._*
        # entries that extract on linux as binary files beginning with NUL —
        # codegen's *.graphql glob then chokes on ._Foo.graphql.
        COPYFILE_DISABLE=1 tar -C "${STAGE_DIR}" -cf - . | docker run -i --rm \
            ${docker_platform_flag:+"${docker_platform_flag}"} \
            -v "${NPM_CACHE_VOLUME}:/npm-cache" \
            -v "${DEP_CACHE_VOLUME}:/dep-cache" \
            -e REPOBOT_BAKE_DEP_CACHE=/dep-cache \
            "${BUILDER_IMAGE}" \
            bash -c 'tar -xf - && bash scripts/bake-kernel-tree.sh && tar -cf - . | zstd -T0 -q' \
            > "${SNAPSHOT}"
    }

    bake_in_place() {
        echo "Baking kernel snapshot ${PLATFORM}@${REF} in place..." >&2
        (cd "${STAGE_DIR}" && bash scripts/bake-kernel-tree.sh)
        tar -C "${STAGE_DIR}" -cf - . | zstd -T0 -q > "${SNAPSHOT}"
    }

    if [[ "${BAKE_MODE}" == "in_place" ]]; then
        bake_in_place
    else
        bake_in_container
    fi
fi

# --- Manifest ---------------------------------------------------------------
BYTES="$(wc -c < "${SNAPSHOT}" | tr -d ' ')"
cat > "${MANIFEST}" <<MANIFEST_JSON
{
    "ref": "${REF}",
    "platform": "${PLATFORM}",
    "sourceCommit": "${SOURCE_COMMIT}",
    "dirty": ${DIRTY},
    "bytes": ${BYTES},
    "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
MANIFEST_JSON

echo "Kernel snapshot: ${SNAPSHOT} (${BYTES} bytes)" >&2

# --- Publish -----------------------------------------------------------------
if [[ -n "${PUBLISH_STORE}" ]]; then
    if ! command -v gcloud >/dev/null 2>&1; then
        echo "gcloud is required to publish kernel snapshots." >&2
        exit 1
    fi
    DEST="${PUBLISH_STORE%/}"
    echo "Publishing to ${DEST}..." >&2
    gcloud storage cp "${SNAPSHOT}" "${MANIFEST}" "${DEST}/"
    echo "Published kernel-${PLATFORM}-${REF} to ${DEST}. Pin it with REPOBOT_KERNEL_SNAPSHOT_REF=${REF}." >&2
fi
