#!/usr/bin/env bash
#
# Stage the kernel with a pack applied: a clean copy of this repo with
# packs/active.json set to the pack and a root repobot.deploy.json emitted
# from the pack's catalog (the capability manifest the platform's deployer
# and provisioning read from the customer repo).
#
# Usage:
#   scripts/compose-pack.sh <pack-key> <output-dir>
#
# The output dir must not exist (refuses to clobber). Local artifacts
# (node_modules, builds, dev state, env files) are excluded via .gitignore,
# so the staged tree matches a fresh checkout. Generated code (GraphQL types,
# protobuf classes) is regenerated here before staging so every composed
# template ships types that match its schema — a fresh clone of a published
# template must typecheck with zero manual codegen.

set -euo pipefail

if [[ $# -ne 2 ]]; then
    echo "Usage: $0 <pack-key> <output-dir>" >&2
    exit 1
fi

PACK_KEY="$1"
OUTPUT_DIR="$2"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CATALOG="${REPO_ROOT}/packs/${PACK_KEY}/catalog.json"

if [[ ! -f "${CATALOG}" ]]; then
    echo "error: unknown pack '${PACK_KEY}' (no ${CATALOG})" >&2
    exit 1
fi
if [[ -e "${OUTPUT_DIR}" ]]; then
    echo "error: output dir already exists: ${OUTPUT_DIR}" >&2
    exit 1
fi

# Derived templates (catalog `remixOf`, packs/README.md): expand the thin
# remix catalog into the effective one — the base pack's catalog wearing the
# remix's identity, brand, and content seed — through the same resolver the
# dev switch uses. Everything below runs against the effective catalog;
# ACTIVE_KEY is the base pack key the kernel's routers and native constants
# switch on (a real pack for the base case, so no step branches on remix).
EFFECTIVE_CATALOG="$(mktemp -t compose-catalog.XXXXXX)"
trap 'rm -f "${EFFECTIVE_CATALOG}"' EXIT
ACTIVE_KEY="$(COMPOSE_PACK_SWITCH_LIB="${REPO_ROOT}/scripts/lib/pack-switch.mjs" \
    COMPOSE_CATALOG="${CATALOG}" COMPOSE_EFFECTIVE="${EFFECTIVE_CATALOG}" \
    COMPOSE_REPO_ROOT="${REPO_ROOT}" node -e '
    const { readFileSync, writeFileSync } = require("node:fs")
    import(process.env.COMPOSE_PACK_SWITCH_LIB)
        .then(({ resolveCatalog }) => {
            const catalog = JSON.parse(readFileSync(process.env.COMPOSE_CATALOG, "utf8"))
            const resolved = resolveCatalog(process.env.COMPOSE_REPO_ROOT, catalog)
            writeFileSync(process.env.COMPOSE_EFFECTIVE, JSON.stringify(resolved, null, 4) + "\n")
            console.log(resolved.activeKey)
        })
        .catch((error) => {
            console.error(error)
            process.exit(1)
        })
')"
CATALOG="${EFFECTIVE_CATALOG}"

# Kernel-wide prep: the theme-hardcoding gate and a full codegen pass
# (GraphQL resolver types, client hooks, protobuf classes, JSON schema
# definitions) so the staged tree can never ship stale types — even when
# composing from a checkout with uncommitted schema edits (dev publishes
# rsync the working tree). Both are functions of the kernel, not the pack:
# batch callers composing many packs from one unchanging checkout set
# REPOBOT_COMPOSE_SKIP_CODEGEN=1 after their first compose so the prep runs
# once per staging session instead of once per pack (it dominated publish
# and image-staging time at ~40s x N packs).
if [[ "${REPOBOT_COMPOSE_SKIP_CODEGEN:-}" != "1" ]]; then
    node "${REPO_ROOT}/scripts/check-theme-hardcoding.mjs"
    if [[ ! -d "${REPO_ROOT}/node_modules" ]]; then
        echo "compose-pack: node_modules missing in ${REPO_ROOT}; running npm ci..." >&2
        (cd "${REPO_ROOT}" && npm ci --no-audit --no-fund)
    fi
    bash "${REPO_ROOT}/scripts/codegen.sh"
fi

mkdir -p "${OUTPUT_DIR}"
# The --include must precede the gitignore excludes: rsync has no support for
# gitignore's `!.env.example` negation, and `.env.*` would drop the committed
# example env files without it.
rsync -a \
    --include=".env.example" \
    --exclude .git \
    --exclude-from="${REPO_ROOT}/.gitignore" \
    "${REPO_ROOT}/" "${OUTPUT_DIR}/"

# A dev-pack switch (scripts/lib/pack-switch.mjs) stamps overlay state into
# the working tree and snapshots the pristine bytes to
# .dev/studio-overlay.json. Restore those bytes in the STAGED tree — and drop
# the scaffolder's stub pages — so composing from a checkout with an active
# dev pack matches composing from a fresh clone. The overlays below then
# apply the composed pack's own state on top.
node -e '
    const { existsSync, readFileSync, writeFileSync, rmSync } = require("node:fs")
    const path = require("node:path")
    const [repoRoot, outputDir] = process.argv.slice(1)
    const statePath = path.join(repoRoot, ".dev", "studio-overlay.json")
    if (!existsSync(statePath)) process.exit(0)
    const state = JSON.parse(readFileSync(statePath, "utf8"))
    for (const [relativePath, content] of Object.entries(state.pristine ?? {})) {
        writeFileSync(path.join(outputDir, relativePath), content)
    }
    for (const relativePath of state.scaffoldCreated ?? []) {
        rmSync(path.join(outputDir, relativePath), { force: true })
    }
' "${REPO_ROOT}" "${OUTPUT_DIR}"

printf '{\n    "key": "%s",\n    "comment": "Which pack owns `/` in this checkout. Set by compose-pack.sh."\n}\n' \
    "${ACTIVE_KEY}" > "${OUTPUT_DIR}/packs/active.json"

# Pristine kernel defaults, preserved for the platform's agent-free template
# flip. The overlays below rewrite the root contract documents in place
# (repobot.project.json when a pack ships its own IA, repobot.landing.json
# when it carries a landing skeleton), and the published tree is the only
# copy of the kernel the platform can read — so a later flip to a pack
# WITHOUT its own manifest/skeleton needs these to restore, or the previous
# pack's documents linger and keep owning the home surface. Not a pack dir:
# no catalog.json, so pack tooling skips it. Copied from the staged tree
# (post-restore), not the checkout, which may carry a dev pack's stamps.
mkdir -p "${OUTPUT_DIR}/packs/.defaults"
cp "${OUTPUT_DIR}/repobot.project.json" "${OUTPUT_DIR}/packs/.defaults/repobot.project.json"
cp "${OUTPUT_DIR}/repobot.landing.json" "${OUTPUT_DIR}/packs/.defaults/repobot.landing.json"
cp "${OUTPUT_DIR}/repobot.theme.json" "${OUTPUT_DIR}/packs/.defaults/repobot.theme.json"
cp "${OUTPUT_DIR}/repobot.content.json" "${OUTPUT_DIR}/packs/.defaults/repobot.content.json"

# Stamp the generated pack map into AGENTS.md, right under the title. Agents
# read AGENTS.md first; this section tells them which view files own which
# routes and sections and where the user-editable surfaces live, so a first
# message works from the map instead of paying a full-repo exploration (the
# thin "Active pack" pointer this replaces still left agents discovering the
# pack's shape file by file). Derived from the pack's catalog + tree by
# scripts/generate-agent-map.mjs; the AGENT_MAP marker pair is a cross-repo
# contract the platform's runtime brief and publish gate detect, and
# scripts/check-agent-maps.mjs gates every approved pack's map in CI.
node "${REPO_ROOT}/scripts/generate-agent-map.mjs" "${PACK_KEY}" --stamp "${OUTPUT_DIR}/AGENTS.md"

# Stamp the active pack into the native apps. The web app reads
# packs/active.json at build time; iOS and Android compile a constant instead
# (ios/App/Config/ActivePack.swift, .../config/ActivePack.kt), which RootView
# switches its home surface on. Keep all three in sync here.
node -e '
    const { readFileSync, writeFileSync } = require("node:fs")
    const packKey = process.argv[1]
    const constantPattern = /(static let key = |const val KEY = )"blank"/
    for (const filePath of process.argv.slice(2)) {
        const source = readFileSync(filePath, "utf8")
        const stamped = source.replace(constantPattern, `$1"${packKey}"`)
        if (packKey !== "blank" && stamped === source) {
            throw new Error(`No stampable pack key found in ${filePath}`)
        }
        writeFileSync(filePath, stamped)
    }
' "${ACTIVE_KEY}" \
    "${OUTPUT_DIR}/ios/App/Config/ActivePack.swift" \
    "${OUTPUT_DIR}/android/app/src/main/kotlin/com/baseapp/android/config/ActivePack.kt"

# repobot.deploy.json: the platform-facing capability manifest. Derived from
# the catalog at compose time; agents update it in-project when they add or
# remove capabilities (e.g. wiring a real backend into a client-only game).
# base is the pack's base-template family (packs/README.md, append-only
# vocabulary mirrored by the platform's TemplateRegistry) and isBase marks
# the canonical configurable base of that family — the platform's workspace
# reads both from the manifest to place the project. authMethods drives the
# platform's auth provisioning and the deploy-time VITE_AUTH_METHODS
# injection; email codes are the zero-setup default every provisioned
# project supports. Project setup later appends `platforms` (the user's
# platform choice) — compose deliberately omits it, and check-all.sh treats
# its absence as web-only. contentDomains lists the business-content
# domains the pack's content seed carries (repobot.content.json's top-level
# keys — "schedule" today): the platform's Manage surface gates on it, so a
# template declares which owner-editable domains it ships the same way it
# declares capabilities. formKinds mirrors the catalog's forms map (formKey
# -> RSVP | LEAD | MAILING_LIST | PROOFING): ingestion is unchanged, the kinds only
# tell the dashboard which typed view renders a form's submissions — the
# raw Inbox stays the fallback for undeclared keys. Resolved catalogs are
# stamped here, so a remix inherits its base's domains and kinds
# automatically.
node -e '
    const { readFileSync, writeFileSync } = require("node:fs")
    const catalog = JSON.parse(readFileSync(process.argv[1], "utf8"))
    const contentDomains = Object.keys(catalog.content ?? {}).filter(
        (key) => key !== "$comment",
    )
    const formKinds = Object.fromEntries(
        Object.entries(catalog.forms ?? {}).filter(([key]) => key !== "$comment"),
    )
    const manifest = {
        templateKey: catalog.templateKey,
        packKey: catalog.key,
        base: catalog.base,
        ...(catalog.isBase === true ? { isBase: true } : {}),
        ...(catalog.isFeature === true ? { isFeature: true } : {}),
        clientOnly: catalog.clientOnly === true,
        capabilities: catalog.capabilities ?? [],
        authMethods: catalog.authMethods ?? ["email-code"],
        ...(contentDomains.length > 0 ? { contentDomains } : {}),
        ...(Object.keys(formKinds).length > 0 ? { formKinds } : {}),
    }
    writeFileSync(process.argv[2], JSON.stringify(manifest, null, 4) + "\n")
' "${CATALOG}" "${OUTPUT_DIR}/repobot.deploy.json"

# Pack theme + landing overlays: the catalog's partial `theme` object merges
# over the kernel's repobot.theme.json (a pack ships in its natural
# mode/brand while staying inside the theme contract) and its partial
# `landing` object merges over repobot.landing.json (the page's layout
# skeleton — style preset, shell chrome variants, section order/variants;
# section content stays in the pack's code, read back through
# web/app/src/View/Landing/landingDocument.ts). One implementation applies
# these everywhere — scripts/lib/pack-switch.mjs `applyPackOverlays`, shared
# with the dev/studio switch and the preview builder — so a composed
# template, a dev checkout, and a published preview always stamp the same
# documents. Packs without overlays keep the kernel defaults. Native theme
# constants are regenerated when the theme changed.
# Parameters ride the environment: an argv[1] here would satisfy the
# lib's run-as-CLI guard and launch the dev switch instead of the import.
THEME_APPLIED="$(COMPOSE_PACK_SWITCH_LIB="${REPO_ROOT}/scripts/lib/pack-switch.mjs" \
    COMPOSE_CATALOG="${CATALOG}" COMPOSE_OUTPUT_DIR="${OUTPUT_DIR}" node -e '
    const { readFileSync } = require("node:fs")
    import(process.env.COMPOSE_PACK_SWITCH_LIB)
        .then(({ applyPackOverlays }) => {
            const catalog = JSON.parse(readFileSync(process.env.COMPOSE_CATALOG, "utf8"))
            const applied = applyPackOverlays(process.env.COMPOSE_OUTPUT_DIR, catalog)
            if (applied.theme) console.log("theme")
        })
        .catch((error) => {
            console.error(error)
            process.exit(1)
        })
')"
if [[ "${THEME_APPLIED}" == "theme" ]]; then
    (cd "${OUTPUT_DIR}" && node scripts/generate-native-theme.mjs)
fi

# Pack-owned project IA: a pack may ship its own repobot.project.json
# (packs/<key>/repobot.project.json). Compose stamps it over the kernel's
# empty manifest and runs the repo's own IA scaffolder in the staged tree, so
# the published template ships wired dashboard routes, the auth gate, and
# shell nav — the same convergence path the setup flow uses
# (docs/project-ia.md). The scaffolder is dependency-free Node, so it needs
# no npm install in the staged tree.
PACK_MANIFEST="${REPO_ROOT}/packs/${ACTIVE_KEY}/repobot.project.json"
if [[ -f "${PACK_MANIFEST}" ]]; then
    cp "${PACK_MANIFEST}" "${OUTPUT_DIR}/repobot.project.json"
    (cd "${OUTPUT_DIR}" && node scripts/scaffold-ia.mjs)
fi

# A derived template's content seed replaces the base pack's content module
# in the staged tree: the customer's checkout IS the base pack, opening on
# the remix's business. The seed is a byte-for-byte structural twin of the
# module (the remix parity tests pin that), so the pack's content tests and
# the contract keep holding against the swapped file.
node -e '
    const { readFileSync, writeFileSync } = require("node:fs")
    const path = require("node:path")
    const catalog = JSON.parse(readFileSync(process.argv[1], "utf8"))
    if (catalog.contentSeed === undefined) process.exit(0)
    const [, repoRoot, outputDir] = process.argv.slice(1)
    writeFileSync(
        path.join(outputDir, catalog.contentContract.module),
        readFileSync(path.join(repoRoot, catalog.contentSeed), "utf8"),
    )
' "${CATALOG}" "${REPO_ROOT}" "${OUTPUT_DIR}"

# Stamp the pack's auth methods into the native config files so the iOS and
# Android sign-in screens render the same methods the web app gets via
# VITE_AUTH_METHODS at deploy time. The kernel default is email-code.
node -e '
    const { readFileSync, writeFileSync } = require("node:fs")
    const catalog = JSON.parse(readFileSync(process.argv[1], "utf8"))
    const methods = (catalog.authMethods ?? ["email-code"]).join(",")
    for (const filePath of process.argv.slice(2)) {
        const source = readFileSync(filePath, "utf8")
        const stamped = filePath.endsWith(".plist")
            ? source.replace(
                  /(<key>AUTH_METHODS<\/key>\s*<string>)[^<]*(<\/string>)/,
                  `$1${methods}$2`,
              )
            : source.replace(/^AUTH_METHODS=.*$/m, `AUTH_METHODS=${methods}`)
        if (stamped === source && methods !== "email-code") {
            throw new Error(`No stampable AUTH_METHODS found in ${filePath}`)
        }
        writeFileSync(filePath, stamped)
    }
' "${CATALOG}" \
    "${OUTPUT_DIR}/ios/App/Config/Config.sandbox.plist" \
    "${OUTPUT_DIR}/ios/App/Config/Config.dev.plist" \
    "${OUTPUT_DIR}/ios/App/Config/Config.prod.plist" \
    "${OUTPUT_DIR}/android/app/src/sandbox/assets/config.properties" \
    "${OUTPUT_DIR}/android/app/src/development/assets/config.properties" \
    "${OUTPUT_DIR}/android/app/src/production/assets/config.properties"

# Prune other packs' public imagery from the staged tree. The kernel ships
# every pack's web/app/public/<key> subtree (~78MB across the catalog), but a
# composed template only serves its own chain's: without pruning the
# templates artifact is O(packs x total imagery) — every new media pack
# grows every OTHER template, and extracting the artifact at catalog size
# ran the deploy runner out of disk. The ownership rule, the reference scan
# that keeps any subtree the tree's live sources still use, and the
# verification that fails compose when a referenced subtree went missing all
# live in scripts/lib/public-assets.mjs (shared with the per-pack publish
# stamp, which must hash exactly what survives here). Runs LAST — the scan
# must see the final tree (post content-seed swap, post overlays). The
# escape hatch ships the whole store when the rule itself is in question.
if [[ "${REPOBOT_COMPOSE_SKIP_PRUNE:-}" != "1" ]]; then
    node "${REPO_ROOT}/scripts/lib/public-assets.mjs" prune "${PACK_KEY}" "${OUTPUT_DIR}"
fi

echo "Composed pack '${PACK_KEY}' -> ${OUTPUT_DIR}"
