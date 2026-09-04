#!/usr/bin/env bash
#
# Pre-build the approved client-only templates' web bundles and publish them
# into the platform deployer's web-bundle build cache — so a customer's FIRST
# publish of a lightly-modified template restores a bundle instead of paying
# the ~55s install+prebuild+vite leg (the platform's run-deploy.sh; the
# config overlay re-stamps theme/landing/content at DEPLOYING_WEB, so config
# edits keep hitting these bundles).
#
# The key contract (MUST stay in lockstep with the platform's run-deploy.sh —
# scripts/bake-web-bundles.test.mjs and the platform's
# CustomerDeployerContractTest pin both sides against the same golden vector
# AND the same scripts/lib/web-tree-id.mjs digest):
#
#   tree id    = scripts/lib/web-tree-id.mjs (v3): sha256 of the tree's
#                build-relevant content only — blind to the overlaid visual
#                documents, provisioning/bake stamps, the wizard's
#                index.html title/identity stamp, web/app/public imagery,
#                docs/, mobile trees, .env.example files, packs/ data
#                except active.json, and dormant packs' content seeds.
#                (Legacy v2 tier: the coarser ls-tree filter below; still
#                published so pre-v3 deployers keep hitting.)
#   cache key  = "template/" + sha256("<tree id> <auth mode> <auth methods> node<major>")
#   object     = web-dist/template/<sha256>.tar.gz in gs://<posture>-build-cache
#
# Environment-free on purpose: client-only deploys ship no functions, so
# every endpoint the bundle derives from VITE_GRAPHQL_URL (analytics beacon,
# storage, auth) is a dead URL whatever value is baked — the deployer's
# per-environment key components (DEPLOY_SLUG, the env's function URL) can
# therefore be dropped without changing what the site does. Fullstack packs
# are skipped: their VITE_GRAPHQL_URL is live and per-environment, so no
# CI-built bundle can be correct for them.
#
# Each bundle uploads under TWO tree-variant keys for the two provisioning
# paths that both exist in production:
#   - the artifact tree (template-generate repos): carries
#     .repobot-template-pack-ref (build-templates-artifact.sh stamps it)
#   - the compose-push tree (warm-pod provisioning): same tree WITHOUT that
#     stamp (SandboxWorkspace composeAndPushProject never writes it)
# The stamp is a provenance file the web build never reads, so the bundle
# bytes are identical — only the key differs.
#
# Trees come from the composed-templates artifact (scripts/
# build-templates-artifact.sh), never from an ad-hoc compose: the artifact
# is the exact tree the platform installs, stamps included, so key equality
# with a fresh project's first-publish tree holds by construction.
#
# Usage:
#   scripts/bake-web-bundles.sh [--publish "gs://bucket [gs://bucket…]"] \
#       [--artifact <templates-*.tar.zst>] [--out <dir>] [pack…]
#   scripts/bake-web-bundles.sh --print-keys <composed-tree-dir>
#
# Packs default to packs/prebuilt-web.json (REPOBOT_PREBUILT_PACKS overrides,
# space-separated). --print-keys is the test seam: prints the variant cache
# keys for one composed tree and exits. Publishing from a dirty checkout is
# refused, same as every other artifact publisher here.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

hash_stdin() {
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum | awk '{print $1}'
    else
        shasum -a 256 | awk '{print $1}'
    fi
}

# The deployer's config-blind tree filter, byte-for-byte from run-deploy.sh
# (WEB_TREE_ID v2). Changing this without changing the platform side splits
# every key and silently turns the whole store into dead weight.
WEB_TREE_FILTER='
    $2 == "repobot.theme.json" { next }
    $2 == "repobot.landing.json" { next }
    $2 == "repobot.content.json" { next }
    $2 == "AGENTS.md" { next }
    $2 == "ios/App/Config/ActivePack.swift" { next }
    $2 == "android/app/src/main/kotlin/com/baseapp/android/config/ActivePack.kt" { next }
    $2 ~ /^packs\// && $2 != "packs/active.json" { next }
    { print }
  '

# The tree id of the current HEAD of a git repo dir, filtered like the
# deployer filters it.
web_tree_id() {
    local repo="$1"
    echo "v2 $(git -C "${repo}" ls-tree -r 'HEAD^{tree}' | awk -F'\t' "${WEB_TREE_FILTER}" | hash_stdin)"
}

# The full cache key from its components — the printf format is the
# deployer's, with the per-environment components (DEPLOY_SLUG, the env's
# VITE_GRAPHQL_URL) deliberately absent; see the header.
template_cache_key() {
    local tree_id="$1" auth_mode="$2" auth_methods="$3" node_major="$4"
    echo "template/$(printf '%s %s %s node%s' \
        "${tree_id}" "${auth_mode}" "${auth_methods}" "${node_major}" | hash_stdin)"
}

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
# The deployer image (platform CustomerDeployer/Dockerfile) runs node 20 and
# hashes its own major into every key: bundles built under any other major
# would publish under keys no deployer ever computes — wasted spend, zero
# hits. Bump both sides together.
DEPLOYER_NODE_MAJOR="${REPOBOT_DEPLOYER_NODE_MAJOR:-20}"

# Compute the variant cache keys for one composed tree: a scratch git repo
# over a hardlink/clone copy (the tree itself is never mutated). Prints
#   v3 <key>             (the build-relevant tree id — scripts/lib/
#                         web-tree-id.mjs, byte-identical to the platform
#                         deployer's copy; blind to provisioning stamps,
#                         wizard shell edits, public imagery, and dormant
#                         pack seeds, so ONE key serves both provisioning
#                         variants and real first publishes)
#   artifact <key>       (legacy v2 tier — templates provisioned from the
#                         artifact, untouched trees only)
#   compose-push <key>   (legacy v2 tier without the pack-ref stamp; only
#                         when the tree carries the stamp)
# The v2 variants keep publishing until every deployer in the field
# computes v3; drop them with the platform's fallback restore.
print_tree_keys() {
    local tree="$1"
    local methods auth_mode="disabled" # client-only deploys never get an auth backend
    methods="$(cd "${tree}" && node -e 'const m = require(process.cwd() + "/repobot.deploy.json").authMethods; console.log(Array.isArray(m) ? m.join(",") : "")')"
    local scratch
    scratch="$(mktemp -d "${TMPDIR:-/tmp}/bake-web-keys.XXXXXX")"
    # tar keeps file modes (the exec bit is part of git's tree hash); any
    # .git riding along (dev trees) must not leak history into the scratch
    # repo, and an already-built tree's node_modules/dist add nothing the
    # scratch repo's gitignore wouldn't drop — skip copying them at all.
    (cd "${tree}" && tar -cf - --exclude ./.git --exclude ./node_modules --exclude './web/*/node_modules' --exclude ./web/app/dist .) | tar -xf - -C "${scratch}"
    git -C "${scratch}" -c init.defaultBranch=main init --quiet
    git -C "${scratch}" add -A
    git -C "${scratch}" -c user.name=bake -c user.email=bake@repobot.dev \
        commit --quiet --no-verify -m keys
    echo "v3 $(template_cache_key "$(node "${REPO_ROOT}/scripts/lib/web-tree-id.mjs" "${scratch}")" "${auth_mode}" "${methods}" "${NODE_MAJOR}")"
    echo "artifact $(template_cache_key "$(web_tree_id "${scratch}")" "${auth_mode}" "${methods}" "${NODE_MAJOR}")"
    if [[ -f "${scratch}/.repobot-template-pack-ref" ]]; then
        git -C "${scratch}" rm --quiet --cached .repobot-template-pack-ref
        git -C "${scratch}" -c user.name=bake -c user.email=bake@repobot.dev \
            commit --quiet --no-verify -m compose-push-variant
        echo "compose-push $(template_cache_key "$(web_tree_id "${scratch}")" "${auth_mode}" "${methods}" "${NODE_MAJOR}")"
    fi
    rm -rf "${scratch}"
}

if [[ "${1:-}" == "--print-keys" ]]; then
    print_tree_keys "${2:?--print-keys requires a composed tree dir}"
    exit 0
fi

PUBLISH_STORES=""
ARTIFACT=""
OUT_DIR="${REPO_ROOT}/dist/web-bundles"
while [[ $# -gt 0 ]]; do
    case "$1" in
        --publish)
            PUBLISH_STORES="${2:?--publish requires gs://bucket[ gs://bucket…]}"
            shift 2
            ;;
        --artifact)
            ARTIFACT="${2:?--artifact requires a templates tar.zst path}"
            shift 2
            ;;
        --out)
            OUT_DIR="${2:?--out requires a directory}"
            shift 2
            ;;
        *)
            break
            ;;
    esac
done
for STORE in ${PUBLISH_STORES}; do
    if [[ "${STORE}" != gs://* ]]; then
        echo "--publish stores must be gs://bucket URLs, got: ${STORE}" >&2
        exit 1
    fi
done

if [[ "${NODE_MAJOR}" != "${DEPLOYER_NODE_MAJOR}" ]]; then
    echo "node ${NODE_MAJOR} builds bundles the node-${DEPLOYER_NODE_MAJOR} deployer would never restore (the major is hashed into every key)." >&2
    echo "Run under node ${DEPLOYER_NODE_MAJOR}, or set REPOBOT_DEPLOYER_NODE_MAJOR if the deployer image really moved." >&2
    exit 1
fi

if [[ -n "${PUBLISH_STORES}" && -n "$(git -C "${REPO_ROOT}" status --porcelain 2>/dev/null)" ]]; then
    echo "Refusing to publish web bundles from a dirty checkout; only artifacts a commit can reproduce may enter a shared store." >&2
    exit 1
fi

# --- Packs ---------------------------------------------------------------
if [[ $# -gt 0 ]]; then
    PACKS="$*"
elif [[ -n "${REPOBOT_PREBUILT_PACKS:-}" ]]; then
    PACKS="${REPOBOT_PREBUILT_PACKS}"
else
    PACKS="$(node -e '
        const { readFileSync } = require("node:fs")
        const manifest = JSON.parse(readFileSync(process.argv[1], "utf8"))
        process.stdout.write(manifest.packs.join(" "))
    ' "${REPO_ROOT}/packs/prebuilt-web.json")"
fi

# --- The composed-templates artifact -------------------------------------
REF="$(cd "${REPO_ROOT}" && bash scripts/kernel-fingerprint.sh --working-tree)"
if [[ -z "${ARTIFACT}" ]]; then
    ARTIFACT="${REPO_ROOT}/dist/kernel-snapshots/templates-${REF}.tar.zst"
    if [[ ! -f "${ARTIFACT}" && -n "${REPOBOT_TEMPLATES_STORE:-}" ]]; then
        mkdir -p "$(dirname "${ARTIFACT}")"
        echo "Fetching templates-${REF}.tar.zst from ${REPOBOT_TEMPLATES_STORE%/}..." >&2
        gcloud storage cp "${REPOBOT_TEMPLATES_STORE%/}/templates-${REF}.tar.zst" "${ARTIFACT}"
    fi
    if [[ ! -f "${ARTIFACT}" ]]; then
        echo "No templates artifact for ${REF}; composing it locally..." >&2
        bash "${REPO_ROOT}/scripts/build-templates-artifact.sh"
    fi
fi
if ! command -v zstd >/dev/null 2>&1; then
    echo "zstd is required to unpack the templates artifact." >&2
    exit 1
fi
EXTRACT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/bake-web-bundles.XXXXXX")"
cleanup() {
    rm -rf "${EXTRACT_DIR}"
}
trap cleanup EXIT
zstd -dc "${ARTIFACT}" | tar -xf - -C "${EXTRACT_DIR}"

# --- Dependencies: install once, clone per tree ---------------------------
# Every composed tree shares the kernel lockfile, so one workspace install
# serves them all; per-tree placement is a hardlink (linux) or APFS clone
# (macOS) — effectively free, exactly like the deployer's prebaked tree.
if [[ ! -d "${REPO_ROOT}/node_modules" ]]; then
    echo "node_modules missing in ${REPO_ROOT}; running npm ci..." >&2
    (cd "${REPO_ROOT}" && npm ci --no-audit --no-fund)
fi
clone_dir() {
    local from="$1" to="$2"
    if [[ "$(uname -s)" == "Darwin" ]]; then
        cp -Rc "${from}" "${to}"
    else
        cp -al "${from}" "${to}" 2>/dev/null || cp -R "${from}" "${to}"
    fi
}

mkdir -p "${OUT_DIR}"
BUILT=0
SKIPPED=0
for PACK_KEY in ${PACKS}; do
    CATALOG="${REPO_ROOT}/packs/${PACK_KEY}/catalog.json"
    if [[ ! -f "${CATALOG}" ]]; then
        echo "error: unknown pack '${PACK_KEY}' (no ${CATALOG})" >&2
        exit 1
    fi
    TEMPLATE_KEY="$(node -e 'console.log(JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8")).templateKey)' "${CATALOG}")"
    TREE="${EXTRACT_DIR}/${TEMPLATE_KEY}"
    if [[ ! -d "${TREE}" ]]; then
        echo "error: templates artifact carries no tree for '${TEMPLATE_KEY}' — is '${PACK_KEY}' in packs/approved.json?" >&2
        exit 1
    fi

    # Only client-only packs bake (see the header); the composed tree's own
    # manifest is the source of truth, so a pack that grows a backend drops
    # out here instead of publishing a bundle no deployer would restore.
    CLIENT_ONLY="$(cd "${TREE}" && node -e 'console.log(require(process.cwd() + "/repobot.deploy.json").clientOnly === true ? "1" : "0")')"
    if [[ "${CLIENT_ONLY}" != "1" ]]; then
        echo "${PACK_KEY}: fullstack (clientOnly=false) — skipping (its VITE_GRAPHQL_URL is live and per-environment)."
        SKIPPED=$((SKIPPED + 1))
        continue
    fi

    KEYS="$(print_tree_keys "${TREE}")"
    OBJECTS=()
    while IFS=' ' read -r _variant key; do
        OBJECTS+=("web-dist/${key}.tar.gz")
    done <<< "${KEYS}"

    BUNDLE="${OUT_DIR}/${TEMPLATE_KEY}-web-dist.tar.gz"

    # Content-addressed reuse: when every variant object is already in every
    # store, there is nothing to build (the common case for a commit that
    # didn't move this template's tree).
    if [[ -n "${PUBLISH_STORES}" ]]; then
        ALL_PRESENT=1
        for STORE in ${PUBLISH_STORES}; do
            for OBJECT in "${OBJECTS[@]}"; do
                if ! gcloud storage objects describe "${STORE%/}/${OBJECT}" >/dev/null 2>&1; then
                    ALL_PRESENT=0
                    break 2
                fi
            done
        done
        if [[ "${ALL_PRESENT}" == "1" ]]; then
            echo "${PACK_KEY}: every store already holds this tree's bundle — nothing to build."
            SKIPPED=$((SKIPPED + 1))
            continue
        fi
    fi

    if [[ ! -f "${BUNDLE}" ]]; then
        echo "${PACK_KEY}: building ${TEMPLATE_KEY} web bundle..."
        for MODULES in node_modules web/app/node_modules web/core/node_modules web/design-system/node_modules; do
            if [[ -d "${REPO_ROOT}/${MODULES}" && ! -d "${TREE}/${MODULES}" ]]; then
                clone_dir "${REPO_ROOT}/${MODULES}" "${TREE}/${MODULES}"
            fi
        done
        # The deployer's exact build shape (run-deploy.sh build_web_app, the
        # stock-script branch: CI is the type gate, vite the transpiler) and
        # its exact Vite-time env, minus the per-environment parts the key
        # dropped. The GraphQL URL keeps the kernel's function-name shape so
        # every derived endpoint stays well-formed — and .invalid can never
        # resolve, which is the same dead end the per-environment URL is on
        # a client-only site (no functions ever deploy).
        BUILD_SCRIPT="$(cd "${TREE}" && node -p 'require(process.cwd() + "/web/app/package.json").scripts?.build ?? ""')"
        if [[ "${BUILD_SCRIPT}" != "tsc --noEmit"*"&& vite build" ]]; then
            echo "error: ${TEMPLATE_KEY}'s web/app build script is not the stock kernel shape; refusing to guess." >&2
            exit 1
        fi
        VITE_AUTH_METHODS="$(cd "${TREE}" && node -e 'const m = require(process.cwd() + "/repobot.deploy.json").authMethods; console.log(Array.isArray(m) ? m.join(",") : "")')"
        (
            cd "${TREE}"
            export VITE_GRAPHQL_URL="https://prebuilt-client-only.invalid/graphql__request__api"
            export VITE_AUTH_MODE="disabled"
            export VITE_AUTH_METHODS
            npm --workspace web/app run prebuild
            (cd web/app && npx --no-install vite build)
        )
        if ! grep -q "</head>" "${TREE}/web/app/dist/index.html"; then
            echo "error: ${TEMPLATE_KEY} built a dist without an injectable index.html." >&2
            exit 1
        fi
        # Same archive shape as the deployer's build-cache.mjs store.
        COPYFILE_DISABLE=1 tar -czf "${BUNDLE}" -C "${TREE}/web/app/dist" .
        BUILT=$((BUILT + 1))
    else
        echo "${PACK_KEY}: reusing already-built ${BUNDLE}."
    fi

    for STORE in ${PUBLISH_STORES}; do
        for OBJECT in "${OBJECTS[@]}"; do
            gcloud storage cp "${BUNDLE}" "${STORE%/}/${OBJECT}"
        done
    done
    echo "${PACK_KEY}: $(printf '%s' "${KEYS}" | tr '\n' ' ')"
done

echo "Web bundles: ${BUILT} built, ${SKIPPED} skipped (packs: ${PACKS})." >&2
