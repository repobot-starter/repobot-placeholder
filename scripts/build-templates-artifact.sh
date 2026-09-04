#!/usr/bin/env bash
#
# Build the composed-templates artifact: every approved pack composed into its
# template tree (the exact tree the platform's template picker installs and
# previews from), packed as a single content-addressed tar.zst named by the
# kernel runtime fingerprint — the SAME ref that names kernel snapshots. One
# rt-* pin therefore governs both what sessions run and what templates
# contain; template content never rides a docker image where it can go stale
# (that was the "stale template in the picker" class of bug).
#
# Usage:
#   scripts/build-templates-artifact.sh [output-dir]
#   scripts/build-templates-artifact.sh --publish gs://<bucket>[/prefix] [output-dir]
#
# Output:
#   <output-dir>/templates-<ref>.tar.zst
#   <output-dir>/templates-<ref>.json                     (legacy build metadata)
#   <output-dir>/templates-<ref>/manifest.json            (delta contract)
#   <output-dir>/templates-<ref>/<templateKey>.tar.zst    (per-template tree)
#
# The artifact is platform-independent (composed trees are source-only; the
# .gitignore filter in compose-pack.sh keeps node_modules and build output
# out), so unlike kernel snapshots there is one artifact per ref, not one per
# platform, and it bakes fine on any host with node — CI publishes it from
# the same workflow that publishes kernel snapshots, and dev-local-up builds
# it locally for uncommitted kernels.
#
# Content addressing mirrors build-kernel-snapshot.sh: if the artifact for
# this fingerprint already exists (locally, or in the store when publishing),
# this script does nothing. Publishing from a dirty checkout is refused — an
# artifact no commit can reproduce must not enter a shared store.

set -euo pipefail

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

# --- Resolve the ref: the runtime fingerprint (same as kernel snapshots) -----
SOURCE_COMMIT="$(git -C "${REPO_ROOT}" rev-parse HEAD)"
REF="$(cd "${REPO_ROOT}" && bash scripts/kernel-fingerprint.sh --working-tree)"
DIRTY=false
if [[ -n "$(git -C "${REPO_ROOT}" status --porcelain 2>/dev/null)" ]]; then
    DIRTY=true
fi
if [[ -n "${PUBLISH_STORE}" && "${DIRTY}" == "true" ]]; then
    echo "Refusing to publish from a dirty checkout (${REF}) to ${PUBLISH_STORE}." >&2
    echo "Commit the changes first; only artifacts a commit can reproduce may enter a shared store." >&2
    exit 1
fi

ARTIFACT="${OUT_DIR}/templates-${REF}.tar.zst"
MANIFEST="${OUT_DIR}/templates-${REF}.json"
DELTA_DIR="${OUT_DIR}/templates-${REF}"
DELTA_MANIFEST="${DELTA_DIR}/manifest.json"

# --- The approved pack list (packs/approved.json, env override) --------------
if [[ -n "${REPOBOT_APPROVED_PACKS:-}" ]]; then
    APPROVED_PACKS="${REPOBOT_APPROVED_PACKS}"
else
    APPROVED_PACKS="$(node -e '
        const { readFileSync } = require("node:fs")
        const approved = JSON.parse(readFileSync(process.argv[1], "utf8"))
        process.stdout.write(approved.packs.join(" "))
    ' "${REPO_ROOT}/packs/approved.json")"
fi

# --- Content-addressed reuse --------------------------------------------------
if [[ "${REPOBOT_TEMPLATES_FORCE_BAKE:-}" != "1" ]]; then
    if [[ -n "${PUBLISH_STORE}" ]]; then
        DEST="${PUBLISH_STORE%/}"
        if gcloud storage objects describe "${DEST}/templates-${REF}.tar.zst" >/dev/null 2>&1 \
            && gcloud storage objects describe "${DEST}/templates-${REF}/manifest.json" >/dev/null 2>&1; then
            echo "Templates artifact templates-${REF} (monolith + delta manifest) is already published to ${DEST}; nothing to compose." >&2
            exit 0
        fi
    fi
    if [[ -f "${ARTIFACT}" && -f "${DELTA_MANIFEST}" ]]; then
        if [[ -n "${PUBLISH_STORE}" ]]; then
            echo "Templates artifact already built locally (${ARTIFACT} + ${DELTA_MANIFEST}); publishing without recomposing." >&2
        else
            echo "Templates artifact already built: ${ARTIFACT} (REPOBOT_TEMPLATES_FORCE_BAKE=1 rebuilds)." >&2
            exit 0
        fi
    fi
fi

# --- Compose (only when the artifact doesn't exist yet) -----------------------
if [[ ! -f "${ARTIFACT}" || "${REPOBOT_TEMPLATES_FORCE_BAKE:-}" == "1" ]]; then
    if ! command -v zstd >/dev/null 2>&1; then
        echo "zstd is required to pack the templates artifact (brew install zstd / apt-get install zstd)." >&2
        exit 1
    fi
    STAGE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/templates-artifact-stage.XXXXXX")"
    cleanup_stage() {
        rm -rf "${STAGE_DIR}"
    }
    trap cleanup_stage EXIT

    # The kernel doesn't change between packs: the first compose runs the
    # kernel-wide prep (theme gate + codegen), the rest skip straight to
    # staging — same batching every other multi-pack composer uses.
    COMPOSE_PREPARED=""
    TEMPLATE_KEYS=()
    TEMPLATE_ARGS=()
    for PACK_KEY in ${APPROVED_PACKS}; do
        CATALOG="${REPO_ROOT}/packs/${PACK_KEY}/catalog.json"
        if [[ ! -f "${CATALOG}" ]]; then
            echo "error: approved pack '${PACK_KEY}' has no catalog (${CATALOG})" >&2
            exit 1
        fi
        TEMPLATE_KEY="$(node -e 'console.log(JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8")).templateKey)' "${CATALOG}")"
        REPOBOT_COMPOSE_SKIP_CODEGEN="${COMPOSE_PREPARED}" \
            bash "${REPO_ROOT}/scripts/compose-pack.sh" "${PACK_KEY}" "${STAGE_DIR}/${TEMPLATE_KEY}"
        COMPOSE_PREPARED=1
        # The ref stamp every consumer checks (platform provisioning refuses
        # unstamped trees; ConfigDoctor compares stamps against the pin),
        # plus the per-pack publish stamp (scripts/template-pack-ref.sh) the
        # platform's publish compares to skip templates whose CONTENT didn't
        # move. Both must be byte-identical to what publish_stage rewrites
        # over these trees, so the rewrite stays a no-op and the artifact
        # trees push as-is.
        printf '%s\n' "${REF}" > "${STAGE_DIR}/${TEMPLATE_KEY}/.repobot-template-ref"
        bash "${REPO_ROOT}/scripts/template-pack-ref.sh" "${PACK_KEY}" --working-tree \
            > "${STAGE_DIR}/${TEMPLATE_KEY}/.repobot-template-pack-ref"
        TEMPLATE_KEYS+=("${TEMPLATE_KEY}")
        TEMPLATE_ARGS+=("${TEMPLATE_KEY}=${STAGE_DIR}/${TEMPLATE_KEY}")
    done

    # In-artifact manifest: which template keys this artifact carries, so the
    # runtime can fail a boot for an unknown key without unpacking guesswork.
    node -e '
        const { writeFileSync } = require("node:fs")
        const [outPath, ref, sourceCommit, ...templateKeys] = process.argv.slice(1)
        writeFileSync(
            outPath,
            JSON.stringify({ ref, sourceCommit, templateKeys }, null, 4) + "\n",
        )
    ' "${STAGE_DIR}/.repobot-templates-manifest.json" "${REF}" "${SOURCE_COMMIT}" "${TEMPLATE_KEYS[@]}"

    mkdir -p "${DELTA_DIR}"
    node "${REPO_ROOT}/scripts/lib/composed-templates-delta-manifest.mjs" \
        "${DELTA_MANIFEST}" \
        "${REF}" \
        "${SOURCE_COMMIT}" \
        "${TEMPLATE_ARGS[@]}"
    cp "${DELTA_MANIFEST}" "${STAGE_DIR}/.repobot-templates-delta-manifest.json"
    for TEMPLATE_KEY in "${TEMPLATE_KEYS[@]}"; do
        COPYFILE_DISABLE=1 tar -C "${STAGE_DIR}/${TEMPLATE_KEY}" -cf - . | zstd -T0 -q > "${DELTA_DIR}/${TEMPLATE_KEY}.tar.zst"
    done

    mkdir -p "${OUT_DIR}"
    # COPYFILE_DISABLE: keep macOS bsdtar from embedding AppleDouble ._* files
    # that extract on linux as garbage binaries (same fix as the kernel bake).
    COPYFILE_DISABLE=1 tar -C "${STAGE_DIR}" -cf - . | zstd -T0 -q > "${ARTIFACT}"
fi

# --- Manifest -----------------------------------------------------------------
BYTES="$(wc -c < "${ARTIFACT}" | tr -d ' ')"
node -e '
    const { writeFileSync } = require("node:fs")
    const [outPath, ref, sourceCommit, dirty, bytes, packs] = process.argv.slice(1)
    writeFileSync(
        outPath,
        JSON.stringify(
            {
                ref,
                sourceCommit,
                dirty: dirty === "true",
                bytes: Number(bytes),
                packs: packs.split(" "),
                deltaManifest: `templates-${ref}/manifest.json`,
                templateTarballPrefix: `templates-${ref}/`,
                createdAt: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
            },
            null,
            4,
        ) + "\n",
    )
' "${MANIFEST}" "${REF}" "${SOURCE_COMMIT}" "${DIRTY}" "${BYTES}" "${APPROVED_PACKS}"

echo "Templates artifact: ${ARTIFACT} (${BYTES} bytes)" >&2

# --- Publish -------------------------------------------------------------------
if [[ -n "${PUBLISH_STORE}" ]]; then
    if ! command -v gcloud >/dev/null 2>&1; then
        echo "gcloud is required to publish the templates artifact." >&2
        exit 1
    fi
    DEST="${PUBLISH_STORE%/}"
    echo "Publishing to ${DEST}..." >&2
    gcloud storage cp "${ARTIFACT}" "${MANIFEST}" "${DEST}/"
    gcloud storage cp "${DELTA_MANIFEST}" "${DEST}/templates-${REF}/manifest.json"
    gcloud storage cp "${DELTA_DIR}/"*.tar.zst "${DEST}/templates-${REF}/"
    echo "Published templates-${REF} to ${DEST}." >&2
fi
