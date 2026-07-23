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

# Published templates must not carry palettes the theme contract can't reach:
# block hardcoded design-system colors and unrouted pack accents up front.
node "${REPO_ROOT}/scripts/check-theme-hardcoding.mjs"

# Regenerate all generated code (GraphQL resolver types, client hooks,
# protobuf classes, JSON schema definitions) so the staged tree can never
# ship stale types — even when composing from a checkout with uncommitted
# schema edits (dev publishes rsync the working tree). Codegen is
# deterministic, so a clean, non-stale kernel is a no-op here.
if [[ ! -d "${REPO_ROOT}/node_modules" ]]; then
    echo "compose-pack: node_modules missing in ${REPO_ROOT}; running npm ci..." >&2
    (cd "${REPO_ROOT}" && npm ci --no-audit --no-fund)
fi
bash "${REPO_ROOT}/scripts/codegen.sh"

mkdir -p "${OUTPUT_DIR}"
# The --include must precede the gitignore excludes: rsync has no support for
# gitignore's `!.env.example` negation, and `.env.*` would drop the committed
# example env files without it.
rsync -a \
    --include=".env.example" \
    --exclude .git \
    --exclude-from="${REPO_ROOT}/.gitignore" \
    "${REPO_ROOT}/" "${OUTPUT_DIR}/"

printf '{\n    "key": "%s",\n    "comment": "Which pack owns `/` in this checkout. Set by compose-pack.sh."\n}\n' \
    "${PACK_KEY}" > "${OUTPUT_DIR}/packs/active.json"

# Stamp the active pack into AGENTS.md, right under the title. Agents read
# AGENTS.md first; without this pointer they guess which view owns `/` and
# restyle the wrong page (e.g. View/Blank while the pong pack is active).
node -e '
    const { readFileSync, writeFileSync } = require("node:fs")
    const catalog = JSON.parse(readFileSync(process.argv[1], "utf8"))
    const agentsPath = process.argv[2]
    const section = [
        `## Active pack: ${catalog.key}`,
        "",
        `This checkout was composed with the **${catalog.key}** pack`
            + ` (\`packs/active.json\`). The home surface the user sees at`
            + ` \`${catalog.homePath}\` is \`${catalog.homeViewDir}/\` —`
            + ` see \`packs/${catalog.key}/PACK.md\`.`,
        "",
        "When the user asks to change, restyle, or redesign \"the page\" or",
        `\"the app\", they mean that view. Do NOT edit \`web/app/src/View/Blank/\``
            + ` unless the blank pack is the active pack.`,
        "",
    ].join("\n")
    const agents = readFileSync(agentsPath, "utf8")
    const lines = agents.split("\n")
    // Insert after the H1 (first line) and its trailing blank line.
    lines.splice(2, 0, section)
    writeFileSync(agentsPath, lines.join("\n"))
' "${CATALOG}" "${OUTPUT_DIR}/AGENTS.md"

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
' "${PACK_KEY}" \
    "${OUTPUT_DIR}/ios/App/Config/ActivePack.swift" \
    "${OUTPUT_DIR}/android/app/src/main/kotlin/com/baseapp/android/config/ActivePack.kt"

# repobot.deploy.json: the platform-facing capability manifest. Derived from
# the catalog at compose time; agents update it in-project when they add or
# remove capabilities (e.g. wiring a real backend into a client-only game).
# authMethods drives the platform's auth provisioning and the
# deploy-time VITE_AUTH_METHODS injection; email codes are the zero-setup
# default every provisioned project supports.
node -e '
    const { readFileSync, writeFileSync } = require("node:fs")
    const catalog = JSON.parse(readFileSync(process.argv[1], "utf8"))
    const manifest = {
        templateKey: catalog.templateKey,
        packKey: catalog.key,
        clientOnly: catalog.clientOnly === true,
        capabilities: catalog.capabilities ?? [],
        authMethods: catalog.authMethods ?? ["email-code"],
    }
    writeFileSync(process.argv[2], JSON.stringify(manifest, null, 4) + "\n")
' "${CATALOG}" "${OUTPUT_DIR}/repobot.deploy.json"

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

echo "Composed pack '${PACK_KEY}' -> ${OUTPUT_DIR}"
