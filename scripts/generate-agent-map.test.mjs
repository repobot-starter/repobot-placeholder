// The agent-map generator's own contract, pinned: the marker pair, the
// stamp's insert/replace behavior, the PACK.md "## Agent map notes" merge,
// and the path extraction the dangling-path gate (check-agent-maps.mjs)
// stands on. The fixture pack lives in a temp repo root so the tests never
// depend on (or perturb) a real pack's sources.
//
// Run: node --test scripts/generate-agent-map.test.mjs

import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"

import {
    MAP_CLOSE,
    MAP_OPEN,
    NOTES_HEADING,
    extractMapPaths,
    generatePackMap,
    stampAgentMap,
} from "./generate-agent-map.mjs"
import { parseDesignVocabulary } from "./lib/design-vocabulary.mjs"
import { DASHBOARD_SECTION_TYPES } from "./scaffold-ia.mjs"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

/** A minimal pack fixture: catalog + PACK.md + a one-file home view. */
function makeFixtureRoot({ notes, contentContract, content } = {}) {
    const root = mkdtempSync(path.join(os.tmpdir(), "agent-map-test-"))
    const packDir = path.join(root, "packs", "mini")
    const viewDir = path.join(root, "web", "app", "src", "View", "Mini")
    mkdirSync(packDir, { recursive: true })
    mkdirSync(viewDir, { recursive: true })
    writeFileSync(
        path.join(packDir, "catalog.json"),
        JSON.stringify({
            key: "mini",
            templateKey: "repobot-mini",
            title: "Mini",
            homePath: "/",
            previewPath: "/mini",
            homeViewDir: "web/app/src/View/Mini",
            base: "app",
            clientOnly: true,
            ...(contentContract === undefined ? {} : { contentContract }),
            ...(content === undefined ? {} : { content }),
        }),
    )
    writeFileSync(
        path.join(packDir, "PACK.md"),
        `# Pack: mini\n\nA fixture.\n${notes === undefined ? "" : `\n${NOTES_HEADING}\n\n${notes}\n`}\n## Non-goals\n\n- none\n`,
    )
    writeFileSync(path.join(viewDir, "MiniPage.tsx"), "export default 1\n")
    return root
}

test("the map is marker-delimited and names the pack's surfaces", () => {
    // Against the real repo: care is the richest approved pack (routes,
    // content contract, theme overlay, imagery), so its map exercises every
    // derivation source at once.
    const map = generatePackMap(repoRoot, "care")
    assert.ok(map.startsWith(MAP_OPEN), "map must open with the AGENT_MAP marker")
    assert.ok(map.endsWith(MAP_CLOSE), "map must close with the AGENT_MAP end marker")
    assert.ok(map.includes("## Pack map"), "map lost its contract heading")
    assert.ok(map.includes("Active pack: **care**"), "map lost the active-pack pointer")
    assert.ok(map.includes("| `/book` | book |"), "map lost the catalog's route table")
    assert.ok(map.includes("`web/app/src/View/Care/content.ts`"), "map lost the content module surface")
    // Copy vs managed facts: a rename is a content-module edit. The note
    // must ride near the top so it survives the platform's 6000-char cap
    // (care's full map is larger than that; the recipes at the tail truncate).
    const bodyStart = map.indexOf("## Pack map")
    const inlined = map.slice(bodyStart, bodyStart + 6000)
    assert.ok(
        inlined.includes("Rename / copy: the site wordmark, taglines, and story live ONLY in"),
        "copy-location note must survive the 6000-char inline cap",
    )
    assert.ok(inlined.includes("`practice.name`"), "care map must name the display-name slot")
    assert.ok(
        inlined.includes("never update_managed_content"),
        "care map must forbid managed-content for a rename",
    )
    assert.ok(
        inlined.includes("Do not run test suites for content-module copy edits"),
        "copy edits must skip suites, and that rule must survive the cap",
    )
    assert.ok(map.includes("Copy vs managed facts:"), "user-editable surfaces lost the copy/managed split")
})

test("every pack map carries the app-composition recipe, derived from the scaffolder", () => {
    const map = generatePackMap(repoRoot, "blank")
    assert.ok(
        map.includes("### Building an app (dashboard + sidebar shell)"),
        "map lost the app-composition section",
    )
    assert.ok(map.includes("npm run scaffold:ia"), "recipe must name the scaffold command")
    // The section-type table derives from DASHBOARD_SECTION_TYPES — every
    // vocabulary entry must appear, with pipes escaped so the table survives.
    for (const type of Object.keys(DASHBOARD_SECTION_TYPES)) {
        assert.ok(map.includes(`| \`${type}\` |`), `section type ${type} missing from the table`)
    }
    assert.ok(map.includes("up\\|down\\|flat"), "cell pipes must be escaped for markdown tables")
    // The verification step keeps the agent off the full test suite: scaffold
    // output is contract-tested here, typecheck is the sufficient check.
    assert.ok(
        map.includes("Verify with `npm run typecheck`"),
        "recipe must steer verification to typecheck, not a suite run",
    )
    assert.ok(
        map.includes("content-module") && map.includes("copy edits"),
        "suite-skip rule must cover content-module copy edits",
    )
})

test("every pack map carries the site recipe, derived from landing vocabulary", () => {
    const map = generatePackMap(repoRoot, "blank")
    assert.ok(
        map.includes("### Building a site (landing pages + sections)"),
        "map lost the site-composition section",
    )
    assert.ok(map.includes("repobot.project.json"), "site recipe must point to the project manifest")
    assert.ok(map.includes("repobot.landing.json"), "site recipe must point to the layout document")
    for (const [type, variants] of Object.entries(parseDesignVocabulary(repoRoot).sectionVariants)) {
        assert.ok(
            map.includes(`| \`${type}\` | ${variants.join(", ")} |`),
            `section type ${type} missing or drifted in site recipe table`,
        )
    }
})

test("copy guidance is derived from the pack's own slots and managed domains", () => {
    const root = makeFixtureRoot({
        contentContract: {
            module: "web/app/src/View/Mini/content.ts",
            slots: {
                "studio.name": { kind: "text" },
                "studio.tagline": { kind: "text" },
                "home.headline": { kind: "text" },
            },
        },
        content: { hours: { week: [] }, listings: { entries: [] } },
    })
    writeFileSync(
        path.join(root, "web", "app", "src", "View", "Mini", "content.ts"),
        "export const studio = {}\n",
    )
    try {
        const map = generatePackMap(root, "mini")
        assert.ok(map.includes("`web/app/src/View/Mini/content.ts`"), "must name the pack's content module")
        assert.ok(
            map.includes("`studio.name`"),
            "must name this pack's display-name slot, not a care hardcoded one",
        )
        assert.ok(map.includes("`studio.tagline`"), "must name this pack's tagline slot")
        assert.ok(map.includes("Managed domains (hours, listings)"), "must name this pack's managed domains")
        assert.ok(!map.includes("`practice.name`"), "must not leak another pack's slot names")
        assert.ok(map.includes("never update_managed_content"))
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})

test("PACK.md agent-map notes merge verbatim (and their paths are extractable)", () => {
    const root = makeFixtureRoot({
        notes: "The scoreboard lives in `web/app/src/View/Mini/MiniPage.tsx` — edit it there.",
    })
    try {
        const map = generatePackMap(root, "mini")
        assert.ok(map.includes("### Pack notes"), "authored notes did not merge into the map")
        assert.ok(map.includes("The scoreboard lives in"), "note body lost")
        // The dangling-path gate must see note-authored paths exactly like
        // generated ones, so a note pointing at a deleted file fails CI.
        assert.ok(
            extractMapPaths(map).includes("web/app/src/View/Mini/MiniPage.tsx"),
            "note-authored path must be extractable for the dangling-path gate",
        )

        const bare = makeFixtureRoot()
        try {
            assert.ok(
                !generatePackMap(bare, "mini").includes("### Pack notes"),
                "a PACK.md without the designated heading must add no notes section",
            )
        } finally {
            rmSync(bare, { recursive: true, force: true })
        }
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})

test("stampAgentMap inserts under the H1 once and replaces in place after", () => {
    const map = `${MAP_OPEN}\n## Pack map\n\nfirst\n${MAP_CLOSE}`
    const stamped = stampAgentMap("# Agent Guide\n\n## Repo map\n\nbody\n", map)
    // First section right under the title, shielded from prettier (composed
    // repos run prettier --check "*.md"; the map's layout is a contract).
    assert.ok(
        stamped.startsWith(`# Agent Guide\n\n<!-- prettier-ignore-start -->\n${MAP_OPEN}`),
        "map must be the first section, wrapped in prettier-ignore markers",
    )
    assert.ok(stamped.includes("## Repo map"), "stamping must keep the surrounding document")

    const restamped = stampAgentMap(stamped, `${MAP_OPEN}\n## Pack map\n\nsecond\n${MAP_CLOSE}`)
    assert.ok(restamped.includes("second") && !restamped.includes("first"), "restamp must replace")
    assert.equal(restamped.split(MAP_OPEN).length, 2, "restamping must never duplicate the map section")
})

test("extractMapPaths keeps repo paths and drops routes, globs, and commands", () => {
    const paths = extractMapPaths(
        [
            "See `web/app/src/View/Care/content.ts` and `packs/care/PACK.md`.",
            "Route `/book` and preview `/care` are URLs, not files.",
            "Globs like `web/app/public/*` and commands like `npm run image -- responsive`",
            "and bare names like `repobot.theme.json` are not path-checked.",
            "Trailing slashes normalize: `web/app/src/View/Care/`.",
        ].join("\n"),
    )
    assert.deepEqual(paths, [
        "web/app/src/View/Care/content.ts",
        "packs/care/PACK.md",
        "web/app/src/View/Care",
    ])
})
