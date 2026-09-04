// The agent-map determinism gate: no template ships without a valid map.
// Dry-runs scripts/generate-agent-map.mjs for every approved pack
// (packs/approved.json — the compose stamp runs the same generator, so a
// pack that fails here would fail every compose) and for every approved
// standalone template (templates/approved.json — their AGENTS.md carries a
// committed stamp, so it is additionally checked for staleness against a
// fresh generation). Fails on:
//
//   - a map the generator cannot produce (broken catalog, missing view dir)
//   - a map without the AGENT_MAP marker pair (the cross-repo contract the
//     platform's runtime brief and publish gate detect)
//   - dangling paths: any repo-relative path the map references — generated
//     or authored in a PACK.md "## Agent map notes" section — that does not
//     exist in the tree
//   - a standalone template's committed AGENTS.md stamp missing or stale
//     (regenerate: node scripts/generate-agent-map.mjs --template <key> --write)
//
// Wired into check-all.sh and ci.yml, so a new template cannot merge
// without a map that resolves. Run: node scripts/check-agent-maps.mjs

import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { parseDesignVocabulary } from "./lib/design-vocabulary.mjs"
import {
    MAP_CLOSE,
    MAP_OPEN,
    extractMapPaths,
    generatePackMap,
    generateTemplateMap,
} from "./generate-agent-map.mjs"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const landingSectionVariants = parseDesignVocabulary(repoRoot).sectionVariants

const failures = []
const fail = (subject, message) => failures.push(`${subject}: ${message}`)

function validateSiteRecipe(subject, map) {
    if (!map.includes("### Building a site (landing pages + sections)")) {
        fail(subject, "map is missing the site-composition recipe section")
        return
    }
    for (const [type, variants] of Object.entries(landingSectionVariants)) {
        const row = `| \`${type}\` | ${variants.join(", ")} |`
        if (!map.includes(row)) {
            fail(subject, `site recipe vocabulary drifted for section '${type}' ` + `(expected row: ${row})`)
        }
    }
}

/** Marker + dangling-path validation shared by both template kinds. */
function validateMap(subject, map, pathsRoot, { requireSiteRecipe = false } = {}) {
    if (!map.startsWith(MAP_OPEN) || !map.endsWith(MAP_CLOSE)) {
        fail(subject, "map is not delimited by the AGENT_MAP marker pair")
        return
    }
    for (const referenced of extractMapPaths(map)) {
        if (!existsSync(path.join(pathsRoot, referenced))) {
            fail(subject, `map references a path that does not exist: ${referenced}`)
        }
    }
    if (requireSiteRecipe) {
        validateSiteRecipe(subject, map)
    }
}

const approvedPacks = JSON.parse(readFileSync(path.join(repoRoot, "packs", "approved.json"), "utf8")).packs
for (const key of approvedPacks) {
    let map
    try {
        map = generatePackMap(repoRoot, key)
    } catch (error) {
        fail(`pack '${key}'`, `map generation failed: ${error.message}`)
        continue
    }
    validateMap(`pack '${key}'`, map, repoRoot, { requireSiteRecipe: true })
}

const approvedTemplates = JSON.parse(
    readFileSync(path.join(repoRoot, "templates", "approved.json"), "utf8"),
).templates
for (const key of approvedTemplates) {
    const subject = `standalone template '${key}'`
    let map
    try {
        map = generateTemplateMap(repoRoot, key)
    } catch (error) {
        fail(subject, `map generation failed: ${error.message}`)
        continue
    }
    // Standalone paths are relative to the template dir (the repo root once
    // published), so the dangling check resolves them from there.
    validateMap(subject, map, path.join(repoRoot, "templates", key))

    // Unlike packs (stamped fresh at every compose), a standalone template
    // ships the AGENTS.md committed here — its stamp must exist and match a
    // fresh generation, or the published theme carries a map that lies.
    const agentsPath = path.join(repoRoot, "templates", key, "AGENTS.md")
    if (!existsSync(agentsPath)) {
        fail(subject, "has no AGENTS.md to carry the map")
        continue
    }
    const agents = readFileSync(agentsPath, "utf8")
    const openAt = agents.indexOf(MAP_OPEN)
    const closeAt = agents.indexOf(MAP_CLOSE)
    if (openAt === -1 || closeAt === -1) {
        fail(
            subject,
            "AGENTS.md is missing the stamped agent map" +
                ` (run: node scripts/generate-agent-map.mjs --template ${key} --write)`,
        )
        continue
    }
    const stamped = agents.slice(openAt, closeAt + MAP_CLOSE.length)
    if (stamped !== map) {
        fail(
            subject,
            "stamped agent map is stale against the template tree" +
                ` (run: node scripts/generate-agent-map.mjs --template ${key} --write)`,
        )
    }
}

if (failures.length > 0) {
    for (const failure of failures) {
        console.error(`check-agent-maps: ${failure}`)
    }
    console.error(`\n${failures.length} agent-map failure(s).`)
    process.exit(1)
}
console.log(
    `Agent maps OK: ${approvedPacks.length} approved packs` +
        ` + ${approvedTemplates.length} standalone templates.`,
)
