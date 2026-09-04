// Regression test for the misdirected-agent bug: a workspace agent asked to
// "redesign this page" restyled web/app/src/View/Blank/ while the pong pack
// owned `/`, because the composed repo's AGENTS.md never said which pack was
// active. compose-pack.sh must stamp an unmissable, marker-delimited agent
// map (scripts/generate-agent-map.mjs: active key, home view dir, PACK.md
// path, routes/sections, user-editable surfaces) into AGENTS.md, and every
// catalog must carry a homeViewDir that actually exists in the kernel. The
// AGENT_MAP marker is a cross-repo contract: the platform's runtime brief
// inlines the section it finds, and its publish gate refuses templates
// without it.
//
// Run: node --test scripts/compose-pack.test.mjs

import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { mkdtempSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const packsDir = path.join(repoRoot, "packs")

const packKeys = readdirSync(packsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((key) => existsSync(path.join(packsDir, key, "catalog.json")))

// A dev-pack switch stamps overlay state into the checkout and snapshots the
// pristine bytes to .dev/studio-overlay.json (scripts/lib/pack-switch.mjs);
// compose restores those bytes into the staged tree. Expectations about the
// kernel's pristine documents must read through the same snapshot, or the
// tests only pass with the blank pack active.
function readPristine(relativePath) {
    const statePath = path.join(repoRoot, ".dev", "studio-overlay.json")
    if (existsSync(statePath)) {
        const pristine = JSON.parse(readFileSync(statePath, "utf8")).pristine ?? {}
        if (pristine[relativePath] !== undefined) {
            return pristine[relativePath]
        }
    }
    return readFileSync(path.join(repoRoot, relativePath), "utf8")
}

test("AGENTS.md sources carry the owner-facing narration rule", () => {
    // Published templates are composed from the kernel AGENTS.md (packs) or
    // ship their own copy (standalone templates), and template publishes
    // clone repobot-base from its remote — a fix that only lives in the
    // platform's runtime prompt or in a dirty local checkout evaporates on
    // the next game publish. Pin the rule in every AGENTS.md source so
    // dropping it fails this gate instead of resurfacing as engineer-speak
    // narration to non-technical users (the Pong-to-racer transcript).
    // Markdown sources hard-wrap at ~80 cols, so match on
    // whitespace-normalized text.
    const flatten = (text) => text.replace(/\s+/g, " ")
    const kernelAgents = flatten(readFileSync(path.join(repoRoot, "AGENTS.md"), "utf8"))
    assert.ok(
        kernelAgents.includes("for the app's owner, not for an"),
        "kernel AGENTS.md lost the owner-facing narration rule",
    )
    assert.ok(
        kernelAgents.includes("never internal mechanics"),
        "kernel AGENTS.md lost the no-internal-mechanics clause",
    )
    assert.ok(
        kernelAgents.includes("image generation tool"),
        "kernel AGENTS.md lost the image-generation capability rule",
    )
    // Card-only platform actions (born of a real session: "add google
    // sign-in" on a project with no auth got both hand-wired auth AND the
    // SET_AUTH_METHODS card, whose confirm launches the platform's own
    // wiring run — duplicated work on divergent lines). The rule lives in
    // the platform's runtime brief too, but the repo copy is what agents
    // reading AGENTS.md natively see.
    assert.ok(
        kernelAgents.includes("propose the card and stop"),
        "kernel AGENTS.md lost the card-only platform-actions rule",
    )

    const templatesDir = path.join(repoRoot, "templates")
    const standaloneKeys = readdirSync(templatesDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .filter((key) => existsSync(path.join(templatesDir, key, "template.json")))
    assert.ok(standaloneKeys.length > 0, "no standalone templates found")
    for (const key of standaloneKeys) {
        const agentsPath = path.join(templatesDir, key, "AGENTS.md")
        assert.ok(existsSync(agentsPath), `standalone template '${key}' has no AGENTS.md`)
        const agents = flatten(readFileSync(agentsPath, "utf8"))
        assert.ok(
            agents.includes("never internal mechanics"),
            `standalone template '${key}' AGENTS.md lost the owner-facing narration rule`,
        )
        assert.ok(
            agents.includes("image generation tool"),
            `standalone template '${key}' AGENTS.md lost the image-generation capability rule`,
        )
    }
})

test("every pack catalog declares an existing homeViewDir", () => {
    assert.ok(packKeys.length > 0, "no packs found")
    for (const key of packKeys) {
        const catalog = JSON.parse(readFileSync(path.join(packsDir, key, "catalog.json"), "utf8"))
        // Derived templates inherit the base pack's home view; they declare
        // a content seed instead (validated by verify-pack-catalogs.mjs).
        if (catalog.remixOf !== undefined) {
            assert.ok(
                existsSync(path.join(packsDir, catalog.remixOf, "catalog.json")),
                `remix '${key}' points at a base pack with no catalog: ${catalog.remixOf}`,
            )
            assert.ok(
                typeof catalog.contentSeed === "string" &&
                    existsSync(path.join(repoRoot, catalog.contentSeed)),
                `remix '${key}' contentSeed does not exist: ${catalog.contentSeed}`,
            )
            continue
        }
        assert.ok(
            typeof catalog.homeViewDir === "string" && catalog.homeViewDir.length > 0,
            `pack '${key}' catalog.json is missing homeViewDir`,
        )
        assert.ok(
            existsSync(path.join(repoRoot, catalog.homeViewDir)),
            `pack '${key}' homeViewDir does not exist: ${catalog.homeViewDir}`,
        )
    }
})

test("every pack catalog declares a base from the workspace taxonomy", () => {
    // The platform's workspace groups projects around ~4 configurable base
    // templates (landing page, web app, store, game) and presents complete
    // vertical starters separately; `base` is the catalog field that
    // declares which family a pack belongs to, and `isBase: true` marks the
    // one canonical configurable base of a family. The vocabulary is
    // append-only and mirrored by the platform's TemplateRegistry
    // (packs/README.md) — never rename or remove a value.
    const baseValues = ["landing", "app", "store", "game", "content"]
    const basePacks = []
    for (const key of packKeys) {
        const catalog = JSON.parse(readFileSync(path.join(packsDir, key, "catalog.json"), "utf8"))
        // Derived templates inherit the base pack's taxonomy.
        if (catalog.remixOf !== undefined) continue
        assert.ok(
            baseValues.includes(catalog.base),
            `pack '${key}' must declare base as one of ${baseValues.join(" | ")}` +
                ` (got ${JSON.stringify(catalog.base)})`,
        )
        if ("isBase" in catalog) {
            assert.equal(
                catalog.isBase,
                true,
                `pack '${key}' isBase must be exactly true when present (omit it otherwise)`,
            )
            basePacks.push(key)
        }
        // Physical-cluster coherence: packs whose home surface lives in the
        // games cluster are `game`, and the shared full-stack app chassis
        // (View/Site) is `app` — the taxonomy names the clustering that
        // already exists, so the two must never drift apart.
        if (catalog.homeViewDir.startsWith("web/app/src/View/Games/")) {
            assert.equal(catalog.base, "game", `pack '${key}' lives in the games cluster`)
        }
        if (catalog.homeViewDir === "web/app/src/View/Site") {
            assert.equal(catalog.base, "app", `pack '${key}' lives on the View/Site app chassis`)
        }
    }
    // The canonical configurable bases, per founder direction. The game base
    // has no isBase pack: the workspace's game tile is a picker across the
    // game packs, no single game is the canonical starting point.
    assert.deepEqual(
        basePacks.sort(),
        ["launch", "saas", "shop"],
        "isBase marks exactly the canonical configurable bases (launch/saas/shop)",
    )
})

test("build workflows only require dispatch inputs the platform always sends non-empty", () => {
    // Incident guard: GitHub's workflow_dispatch REST API treats an empty
    // string for a `required: true` input as "not provided" and rejects the
    // dispatch with a 422. The platform legitimately sends empty backend
    // config (graphql_url) for client-only packs, so the only inputs these
    // workflows may declare required are the ones the platform can never
    // send empty. This mirrors requiredBuildWorkflowInputs in the platform's
    // GitHubAppWrapper fake — keep the two in sync.
    const alwaysNonEmptyInputs = ["kind", "build_id", "app_name"]
    for (const workflowFile of ["ios-build.yml", "android-build.yml"]) {
        const source = readFileSync(path.join(repoRoot, ".github", "workflows", workflowFile), "utf8")
        const requiredInputs = []
        // Input blocks live under `workflow_dispatch: inputs:` with the input
        // name at 12-space indent and its properties at 16-space indent.
        let currentInput = null
        for (const line of source.split("\n")) {
            const inputName = line.match(/^ {12}(\w+):\s*$/)
            if (inputName) {
                currentInput = inputName[1]
                continue
            }
            if (currentInput && /^ {16}required:\s*true\s*$/.test(line)) {
                requiredInputs.push(currentInput)
            }
        }
        assert.deepEqual(
            requiredInputs.sort(),
            [...alwaysNonEmptyInputs].sort(),
            `${workflowFile} must only mark inputs required when the platform always` +
                ` dispatches them non-empty (GitHub 422s on empty required inputs)`,
        )
    }
})

test("compose stamps the generated agent map into AGENTS.md", () => {
    const outputRoot = mkdtempSync(path.join(os.tmpdir(), "compose-pack-test-"))
    try {
        // The incident pack; one compose is enough since the stamp is
        // catalog-driven and the catalogs are validated above.
        const key = "pong"
        const outputDir = path.join(outputRoot, key)
        execFileSync("bash", [path.join(repoRoot, "scripts", "compose-pack.sh"), key, outputDir], {
            stdio: "pipe",
        })

        const active = JSON.parse(readFileSync(path.join(outputDir, "packs", "active.json"), "utf8"))
        assert.equal(active.key, key)

        const catalog = JSON.parse(readFileSync(path.join(packsDir, key, "catalog.json"), "utf8"))
        const agents = readFileSync(path.join(outputDir, "AGENTS.md"), "utf8")

        // The marker pair is the cross-repo contract (platform brief +
        // publish gate detect it) — both ends must survive composition.
        assert.ok(agents.includes("<!-- AGENT_MAP:v1 -->"), "AGENTS.md is missing the AGENT_MAP marker")
        assert.ok(agents.includes("<!-- /AGENT_MAP -->"), "AGENTS.md is missing the AGENT_MAP close marker")
        const sectionAt = agents.indexOf("## Pack map")
        assert.notEqual(sectionAt, -1, "AGENTS.md is missing the Pack map section")
        // The map must be the first section (right under the H1), before
        // the generic repo map, so exploring agents cannot skim past it.
        const firstSectionAt = agents.indexOf("\n## ")
        assert.equal(sectionAt, firstSectionAt + 1, "Pack map section must be the first section in AGENTS.md")
        assert.ok(agents.includes(`Active pack: **${key}**`), "missing active pack pointer")
        assert.ok(agents.includes(`\`${catalog.homeViewDir}/\``), "missing home view dir pointer")
        assert.ok(agents.includes(`packs/${key}/PACK.md`), "missing PACK.md pointer")
        // The kernel's owner-facing narration rule must survive composition
        // into the published template. (Whitespace-normalized: markdown
        // sources hard-wrap.)
        assert.ok(
            agents.replace(/\s+/g, " ").includes("never internal mechanics"),
            "composed AGENTS.md lost the owner-facing narration rule",
        )
        assert.ok(
            agents.replace(/\s+/g, " ").includes("image generation tool"),
            "composed AGENTS.md lost the image-generation capability rule",
        )
        assert.ok(
            agents.replace(/\s+/g, " ").includes("propose the card and stop"),
            "composed AGENTS.md lost the card-only platform-actions rule",
        )

        // Native twins of packs/active.json: compose must stamp the pack key
        // into the compiled ActivePack constants so the iOS/Android home
        // surfaces match the web home surface.
        const activePackSwift = readFileSync(
            path.join(outputDir, "ios", "App", "Config", "ActivePack.swift"),
            "utf8",
        )
        assert.ok(
            activePackSwift.includes(`static let key = "${key}"`),
            "ActivePack.swift was not stamped with the pack key",
        )
        const activePackKotlin = readFileSync(
            path.join(
                outputDir,
                "android",
                "app",
                "src",
                "main",
                "kotlin",
                "com",
                "baseapp",
                "android",
                "config",
                "ActivePack.kt",
            ),
            "utf8",
        )
        // Pristine kernel defaults: the platform's agent-free template flip
        // restores these when flipping to a pack without its own manifest or
        // landing skeleton — without them, a Site-cluster manifest stamped by
        // an earlier flip keeps owning `/` forever.
        assert.equal(
            readFileSync(path.join(outputDir, "packs", ".defaults", "repobot.project.json"), "utf8"),
            readPristine("repobot.project.json"),
            "packs/.defaults/repobot.project.json must be the kernel's pristine manifest",
        )
        assert.equal(
            readFileSync(path.join(outputDir, "packs", ".defaults", "repobot.landing.json"), "utf8"),
            readPristine("repobot.landing.json"),
            "packs/.defaults/repobot.landing.json must be the kernel's pristine landing document",
        )
        assert.equal(
            readFileSync(path.join(outputDir, "packs", ".defaults", "repobot.theme.json"), "utf8"),
            readPristine("repobot.theme.json"),
            "packs/.defaults/repobot.theme.json must be the kernel's pristine theme document",
        )
        assert.equal(
            readFileSync(path.join(outputDir, "packs", ".defaults", "repobot.content.json"), "utf8"),
            readPristine("repobot.content.json"),
            "packs/.defaults/repobot.content.json must be the kernel's pristine content contract",
        )

        assert.ok(
            activePackKotlin.includes(`const val KEY = "${key}"`),
            "ActivePack.kt was not stamped with the pack key",
        )

        // Regression test for the stale-generated-types bug: a project created
        // from a published template hit TS errors because the composed repo
        // shipped generated GraphQL types that predated the kernel's Shop
        // operations. compose-pack.sh must run codegen so the staged tree
        // always carries generated types matching its schema + operations.
        const webTypes = readFileSync(
            path.join(outputDir, "web", "app", "src", "generated", "graphql", "types.ts"),
            "utf8",
        )
        const kernelWebTypes = readFileSync(
            path.join(repoRoot, "web", "app", "src", "generated", "graphql", "types.ts"),
            "utf8",
        )
        assert.equal(webTypes, kernelWebTypes, "composed web types diverge from fresh codegen")
        assert.ok(
            webTypes.includes("useShopProductQuery"),
            "composed web types are missing hooks for the kernel's Shop operations",
        )
        assert.ok(
            existsSync(path.join(outputDir, "firebase", "functions", "generated", "GraphqlResolverTypes.ts")),
            "composed repo is missing firebase/functions generated resolver types",
        )

        // The deploy manifest defaults auth methods to email codes for packs
        // that don't declare any (the zero-setup method every provisioned
        // project supports).
        const manifest = JSON.parse(readFileSync(path.join(outputDir, "repobot.deploy.json"), "utf8"))
        assert.deepEqual(manifest.authMethods, ["email-code"])
        // A pack without a content seed declares no manageable domains —
        // absence, not an empty list, so the platform's Manage gate reads
        // pre-contract and domainless manifests identically.
        assert.ok(
            !("contentDomains" in manifest),
            "a pack without a content seed must not declare contentDomains",
        )
        // Same posture for form kinds: a pack with no managed forms carries
        // no formKinds key at all — the dashboard's typed views gate on
        // presence, and pre-kind manifests read identically to kindless ones.
        assert.ok(!("formKinds" in manifest), "a pack without declared forms must not carry formKinds")
        // The base taxonomy rides the manifest so the platform can place the
        // project in the workspace without re-reading the pack catalog. A
        // starter project (every game) carries no isBase key at all —
        // absence, not false, is the "not a configurable base" signal.
        assert.equal(manifest.base, "game", "manifest must carry the pack's base family")
        assert.ok(!("isBase" in manifest), "a starter project must not carry isBase in the manifest")

        // The theme contract must ship in every composed template: the design
        // system derives its tokens from it, and agents are taught (AGENTS.md)
        // to edit it first for restyling requests. A composed tree without it
        // would fall back to defaults silently and orphan the /theme recipe.
        const themePath = path.join(outputDir, "repobot.theme.json")
        assert.ok(existsSync(themePath), "composed repo is missing repobot.theme.json")
        const theme = JSON.parse(readFileSync(themePath, "utf8"))
        assert.ok(
            typeof theme.brand?.primary === "string" && theme.brand.primary.startsWith("#"),
            "repobot.theme.json lost its brand.primary default",
        )
        assert.ok(agents.includes("repobot.theme.json"), "composed AGENTS.md lost the theming recipe pointer")
        // The landing layout contract ships too; packs without a landing
        // surface (pong) keep the kernel default document untouched.
        const kernelLanding = readPristine("repobot.landing.json")
        const stagedLanding = readFileSync(path.join(outputDir, "repobot.landing.json"), "utf8")
        assert.equal(
            stagedLanding,
            kernelLanding,
            "a pack without a landing surface must keep the kernel's repobot.landing.json",
        )
        // Same for the business-content contract: packs without manageable
        // business facts (pong) keep the kernel default document untouched.
        assert.equal(
            readFileSync(path.join(outputDir, "repobot.content.json"), "utf8"),
            readPristine("repobot.content.json"),
            "a pack without a content seed must keep the kernel's repobot.content.json",
        )
        // The eject seam ships with every template: the @ui registry and the
        // pristine manifest that guards the base design system.
        assert.ok(
            existsSync(path.join(outputDir, "web", "app", "src", "Theme", "ui.ts")),
            "composed repo is missing the @ui registry (web/app/src/Theme/ui.ts)",
        )
        assert.ok(
            existsSync(path.join(outputDir, "web", "design-system", ".pristine-manifest.json")),
            "composed repo is missing the design-system pristine manifest",
        )
        // The other pristine surfaces the platform's kernel refresh covers
        // (verify-ds-pristine.mjs SURFACES) ship their manifests too — the
        // visual surfaces and the backend surfaces alike, because the
        // refresh classifier reads the OLD manifest out of the customer
        // repo to prove which files are still pristine.
        for (const surfaceDir of [
            "web/app/src/View/Landing",
            "web/app/src/View/Site",
            "packs",
            "firebase/functions/migrations",
            "firebase/functions/src/Services",
            "firebase/functions/src/DependencyWrappers",
            "firebase/functions/src/Graphql/Resolvers",
            "Graphql/Core",
            "web/core",
        ]) {
            assert.ok(
                existsSync(path.join(outputDir, ...surfaceDir.split("/"), ".pristine-manifest.json")),
                `composed repo is missing the ${surfaceDir} pristine manifest`,
            )
        }

        // Packs without their own repobot.project.json keep the kernel's
        // empty IA manifest (the setup flow owns it from there).
        const iaManifest = JSON.parse(readFileSync(path.join(outputDir, "repobot.project.json"), "utf8"))
        assert.equal(iaManifest.marketing.pages.length, 0, "pong compose leaked marketing pages")
        assert.equal(
            iaManifest.dashboard.destinations.length,
            0,
            "pong compose leaked dashboard destinations",
        )

        // Local build artifacts ignored only by NESTED .gitignore files must
        // still be excluded from the staged tree: compose-pack.sh's rsync
        // reads the root .gitignore alone, so these need root-level entries.
        // Beyond bloat, copying a live Gradle build dir makes the rsync fail
        // nondeterministically (files vanish mid-copy during a concurrent
        // build) — which broke template publishes.
        for (const artifact of [
            ["android", "app", "build"],
            ["android", ".gradle"],
            ["android", ".kotlin"],
            ["android", "local.properties"],
            ["node_modules"],
        ]) {
            assert.ok(
                !existsSync(path.join(outputDir, ...artifact)),
                `composed repo leaked local artifact: ${artifact.join("/")}`,
            )
        }
    } finally {
        rmSync(outputRoot, { recursive: true, force: true })
    }
})

test("compose stamps a pack-owned project IA manifest and scaffolds it", () => {
    const outputRoot = mkdtempSync(path.join(os.tmpdir(), "compose-pack-ia-test-"))
    try {
        // The saas pack ships its own repobot.project.json: compose must
        // stamp it over the kernel's empty manifest and run scaffold-ia in
        // the staged tree, so the published template already has its
        // dashboard destinations wired (routes, auth gate, shell nav) and
        // keeps the kernel's designed pages instead of generating stubs.
        const outputDir = path.join(outputRoot, "saas")
        execFileSync("bash", [path.join(repoRoot, "scripts", "compose-pack.sh"), "saas", outputDir], {
            stdio: "pipe",
        })

        const packManifest = readFileSync(path.join(packsDir, "saas", "repobot.project.json"), "utf8")
        const stagedManifest = readFileSync(path.join(outputDir, "repobot.project.json"), "utf8")
        assert.equal(stagedManifest, packManifest, "pack manifest was not stamped to the root")

        // saas IS the canonical configurable app base: compose must carry
        // both taxonomy fields into the deploy manifest.
        const deployManifest = JSON.parse(readFileSync(path.join(outputDir, "repobot.deploy.json"), "utf8"))
        assert.equal(deployManifest.base, "app", "saas manifest must carry base: app")
        assert.equal(deployManifest.isBase, true, "saas manifest must carry isBase: true")

        const router = readFileSync(path.join(outputDir, "web", "app", "src", "Config", "Router.ts"), "utf8")
        assert.ok(
            router.includes('overview: { path: "/overview" },'),
            "scaffold-ia did not wire the overview route key",
        )

        const app = readFileSync(path.join(outputDir, "web", "app", "src", "App.tsx"), "utf8")
        assert.ok(
            app.includes('const OverviewPage = lazy(() => import("./View/Overview/OverviewPage"))'),
            "scaffold-ia did not wire the OverviewPage import",
        )
        assert.ok(
            app.includes("<Route path={routes.overview.path} element={<OverviewPage />} />"),
            "scaffold-ia did not mount /overview under ProtectedRoutes",
        )

        const nav = readFileSync(
            path.join(outputDir, "web", "app", "src", "View", "Navbar", "shellNavSections.tsx"),
            "utf8",
        )
        assert.ok(nav.includes('id: "product"'), "scaffold-ia did not add the product nav section")

        // The kernel ships a designed Overview page at the scaffolder's
        // expected path (a re-export of the Outlay spend surface); the
        // scaffolder must keep it, not stub over it.
        const overviewPage = readFileSync(
            path.join(outputDir, "web", "app", "src", "View", "Overview", "OverviewPage.tsx"),
            "utf8",
        )
        assert.ok(
            overviewPage.includes('export { default } from "../Spend/OverviewPage"'),
            "scaffold-ia replaced the designed Overview page with a stub",
        )

        // The kernel's Projects/Users exemplar is stripped: a composed
        // product's nav and routes show its product IA, not the kernel demo.
        assert.ok(
            !nav.includes('id: "workspace"') && !nav.includes('"Projects"'),
            "composed template still carries the exemplar nav section",
        )
        assert.ok(
            !app.includes("<ProjectsPage />") && !app.includes("<UsersPage />"),
            "composed template still mounts the exemplar routes",
        )
    } finally {
        rmSync(outputRoot, { recursive: true, force: true })
    }
})

test("compose emits authMethods and stamps them into native configs", () => {
    const outputRoot = mkdtempSync(path.join(os.tmpdir(), "compose-pack-auth-test-"))
    try {
        // The auth pack declares the zero-setup method set; compose must
        // carry it to the platform (repobot.deploy.json drives auth
        // provisioning + VITE_AUTH_METHODS) and to both native apps (which
        // compile AUTH_METHODS from their config files).
        const outputDir = path.join(outputRoot, "auth")
        execFileSync("bash", [path.join(repoRoot, "scripts", "compose-pack.sh"), "auth", outputDir], {
            stdio: "pipe",
        })

        const declared = JSON.parse(
            readFileSync(path.join(packsDir, "auth", "catalog.json"), "utf8"),
        ).authMethods
        assert.ok(Array.isArray(declared) && declared.length > 0, "auth pack lost its authMethods")

        const manifest = JSON.parse(readFileSync(path.join(outputDir, "repobot.deploy.json"), "utf8"))
        assert.deepEqual(manifest.authMethods, declared)

        const stamped = declared.join(",")
        for (const plist of ["Config.sandbox.plist", "Config.dev.plist", "Config.prod.plist"]) {
            const contents = readFileSync(path.join(outputDir, "ios", "App", "Config", plist), "utf8")
            assert.ok(
                /<key>AUTH_METHODS<\/key>\s*<string>([^<]*)<\/string>/.exec(contents)?.[1] === stamped,
                `${plist} was not stamped with AUTH_METHODS=${stamped}`,
            )
        }
        for (const flavor of ["sandbox", "development", "production"]) {
            const contents = readFileSync(
                path.join(outputDir, "android", "app", "src", flavor, "assets", "config.properties"),
                "utf8",
            )
            assert.ok(
                contents.includes(`AUTH_METHODS=${stamped}`),
                `${flavor} config.properties was not stamped with AUTH_METHODS=${stamped}`,
            )
        }

        // The auth pack ships in light mode: its catalog theme overlay must be
        // merged into repobot.theme.json (keeping the kernel's other defaults)
        // and the native theme constants regenerated to match.
        const theme = JSON.parse(readFileSync(path.join(outputDir, "repobot.theme.json"), "utf8"))
        assert.equal(theme.mode, "light", "auth pack theme overlay was not stamped")
        assert.ok(
            typeof theme.brand?.primary === "string" && theme.brand.primary.startsWith("#"),
            "theme overlay dropped the kernel's brand defaults",
        )
        const generatedSwift = readFileSync(
            path.join(outputDir, "ios", "App", "View", "Theme", "GeneratedTheme.swift"),
            "utf8",
        )
        assert.ok(
            generatedSwift.includes('static let defaultMode = "light"'),
            "native theme constants were not regenerated after the theme overlay",
        )
    } finally {
        rmSync(outputRoot, { recursive: true, force: true })
    }
})

test("compose stamps a pack's landing overlay into repobot.landing.json", () => {
    // The launch pack has a landing surface, so its catalog carries a
    // partial `landing` object (the page's layout skeleton) that compose
    // merges top-level over the kernel's repobot.landing.json — the same
    // pattern as the catalog.theme overlay. The active pack's landing page
    // then reads its skeleton from the document.
    const outputRoot = mkdtempSync(path.join(os.tmpdir(), "compose-pack-landing-test-"))
    try {
        const outputDir = path.join(outputRoot, "launch")
        execFileSync("bash", [path.join(repoRoot, "scripts", "compose-pack.sh"), "launch", outputDir], {
            stdio: "pipe",
            // Kernel-wide prep is orthogonal to the overlay stamp.
            env: { ...process.env, REPOBOT_COMPOSE_SKIP_CODEGEN: "1" },
        })

        const overlay = JSON.parse(
            readFileSync(path.join(packsDir, "launch", "catalog.json"), "utf8"),
        ).landing
        assert.ok(overlay, "launch catalog lost its landing overlay")

        const document = JSON.parse(readFileSync(path.join(outputDir, "repobot.landing.json"), "utf8"))
        assert.equal(document.style.preset, overlay.style.preset, "landing overlay preset not stamped")
        assert.deepEqual(document.sections, overlay.sections, "landing overlay sections not stamped")
        // Top-level merge keeps the kernel's untouched keys (the $comment).
        assert.ok(
            typeof document.$comment === "string" && document.$comment.length > 0,
            "landing overlay merge dropped the kernel document's $comment",
        )
    } finally {
        rmSync(outputRoot, { recursive: true, force: true })
    }
})

test("compose drops the root landing skeleton for page-based surfaces", () => {
    // Photography's landing overlay is page-based (routes + pages, no root
    // sections of its own). Nothing renders the root surface under such a
    // pack, so inheriting the kernel default's root `sections` through the
    // shallow merge would leave phantom sections that leak into the
    // platform's layout APIs (and Remix's landing shuffle).
    const outputRoot = mkdtempSync(path.join(os.tmpdir(), "compose-pack-pages-test-"))
    try {
        const outputDir = path.join(outputRoot, "photography")
        execFileSync("bash", [path.join(repoRoot, "scripts", "compose-pack.sh"), "photography", outputDir], {
            stdio: "pipe",
            env: { ...process.env, REPOBOT_COMPOSE_SKIP_CODEGEN: "1" },
        })

        const overlay = JSON.parse(
            readFileSync(path.join(packsDir, "photography", "catalog.json"), "utf8"),
        ).landing
        assert.ok(overlay?.pages, "photography catalog lost its page-based landing overlay")
        assert.equal(
            overlay.sections,
            undefined,
            "photography's overlay grew root sections — update this test",
        )

        const document = JSON.parse(readFileSync(path.join(outputDir, "repobot.landing.json"), "utf8"))
        assert.ok(!("sections" in document), "page-based overlay must not inherit root sections")
        assert.deepEqual(document.pages, overlay.pages, "landing overlay pages not stamped")
        assert.deepEqual(document.routes, overlay.routes, "landing overlay routes not stamped")
    } finally {
        rmSync(outputRoot, { recursive: true, force: true })
    }
})

test("compose expands a derived template over its base pack", () => {
    // A derived template (catalog `remixOf`) is the base pack composed with
    // the remix's identity, brand, and content seed. The staged tree must BE
    // the base pack everywhere the kernel switches on a pack key (active.json,
    // native ActivePack constants, AGENTS.md recipe pointer) while carrying
    // the remix's identity where the platform reads it (repobot.deploy.json)
    // and the remix's brand and content where the user sees them.
    const outputRoot = mkdtempSync(path.join(os.tmpdir(), "compose-pack-remix-test-"))
    try {
        const key = "services-landscape"
        const outputDir = path.join(outputRoot, key)
        execFileSync("bash", [path.join(repoRoot, "scripts", "compose-pack.sh"), key, outputDir], {
            stdio: "pipe",
            env: { ...process.env, REPOBOT_COMPOSE_SKIP_CODEGEN: "1" },
        })

        const remix = JSON.parse(readFileSync(path.join(packsDir, key, "catalog.json"), "utf8"))
        const baseKey = remix.remixOf
        const base = JSON.parse(readFileSync(path.join(packsDir, baseKey, "catalog.json"), "utf8"))

        // Kernel-facing surfaces switch on the BASE pack.
        const active = JSON.parse(readFileSync(path.join(outputDir, "packs", "active.json"), "utf8"))
        assert.equal(active.key, baseKey, "a remix must stamp its base pack into active.json")
        const activePackSwift = readFileSync(
            path.join(outputDir, "ios", "App", "Config", "ActivePack.swift"),
            "utf8",
        )
        assert.ok(
            activePackSwift.includes(`static let key = "${baseKey}"`),
            "ActivePack.swift must carry the base pack key",
        )
        const agents = readFileSync(path.join(outputDir, "AGENTS.md"), "utf8")
        assert.ok(
            agents.includes(`packs/${baseKey}/PACK.md`),
            "AGENTS.md must point at the base pack's recipe",
        )
        assert.ok(agents.includes(`**${key}** derived template`), "AGENTS.md must name the derived template")

        // Platform-facing identity is the remix's.
        const manifest = JSON.parse(readFileSync(path.join(outputDir, "repobot.deploy.json"), "utf8"))
        assert.equal(manifest.templateKey, remix.templateKey)
        assert.equal(manifest.packKey, key)
        assert.equal(manifest.base, base.base, "the deploy manifest inherits the base taxonomy")
        // Form kinds ride the resolved catalog, so a remix inherits its
        // base's formKey -> kind declarations ($comment stays in the
        // catalog; the manifest carries only real keys).
        const baseForms = Object.fromEntries(
            Object.entries(base.forms ?? {}).filter(([formKey]) => formKey !== "$comment"),
        )
        assert.ok(
            Object.keys(baseForms).length > 0,
            "the services base pack should declare form kinds — update this test's subject",
        )
        assert.deepEqual(
            manifest.formKinds,
            baseForms,
            "a remix must inherit its base pack's formKinds in the deploy manifest",
        )

        // The user-facing surfaces wear the remix: its brand merged over the
        // base theme, and its content seed as the pack's content module.
        const theme = JSON.parse(readFileSync(path.join(outputDir, "repobot.theme.json"), "utf8"))
        assert.equal(theme.brand.primary, remix.theme.brand.primary, "remix brand not stamped")
        const landing = JSON.parse(readFileSync(path.join(outputDir, "repobot.landing.json"), "utf8"))
        assert.equal(
            landing.style.preset,
            base.landing.style.preset,
            "the remix inherits the base pack's register",
        )
        assert.equal(
            readFileSync(path.join(outputDir, base.contentContract.module), "utf8"),
            readFileSync(path.join(repoRoot, remix.contentSeed), "utf8"),
            "the content seed must replace the base pack's content module byte-for-byte",
        )
    } finally {
        rmSync(outputRoot, { recursive: true, force: true })
    }
})

test("compose stamps a schedule pack's content seed and declares its domains", () => {
    // The business-content contract's compose leg: a schedule-bearing pack
    // (fitness) must ship with its catalog's content seed stamped into
    // repobot.content.json (the kernel resolver and the platform's Manage
    // UI read the same file), the seed's domains declared in the deploy
    // manifest (contentDomains gates the platform's Manage nav), and the
    // kernel's pristine default preserved under packs/.defaults for the
    // eject/restore seam.
    const outputRoot = mkdtempSync(path.join(os.tmpdir(), "compose-pack-content-test-"))
    try {
        const key = "fitness"
        const outputDir = path.join(outputRoot, key)
        execFileSync("bash", [path.join(repoRoot, "scripts", "compose-pack.sh"), key, outputDir], {
            stdio: "pipe",
            env: { ...process.env, REPOBOT_COMPOSE_SKIP_CODEGEN: "1" },
        })

        const catalog = JSON.parse(readFileSync(path.join(packsDir, key, "catalog.json"), "utf8"))
        const document = JSON.parse(readFileSync(path.join(outputDir, "repobot.content.json"), "utf8"))
        assert.deepEqual(
            document.schedule,
            catalog.content.schedule,
            "the catalog's schedule seed must be stamped into repobot.content.json verbatim",
        )
        // The kernel default's own keys (the $comment) ride under the merge.
        const kernelDefault = JSON.parse(readPristine("repobot.content.json"))
        assert.equal(document.$comment, kernelDefault.$comment)

        const manifest = JSON.parse(readFileSync(path.join(outputDir, "repobot.deploy.json"), "utf8"))
        assert.deepEqual(
            manifest.contentDomains,
            ["schedule"],
            "the deploy manifest must declare the seed's content domains",
        )

        assert.equal(
            readFileSync(path.join(outputDir, "packs", ".defaults", "repobot.content.json"), "utf8"),
            readPristine("repobot.content.json"),
            "packs/.defaults/repobot.content.json must be the kernel's pristine content contract",
        )
    } finally {
        rmSync(outputRoot, { recursive: true, force: true })
    }
})

test("compose prunes other packs' public imagery and the gate catches over-pruning", () => {
    // The kernel ships every pack's web/app/public/<key> imagery (~78MB
    // across the catalog), but a composed template serves only its own
    // chain's — without pruning the templates artifact is
    // O(packs x total imagery) and extracting it at catalog size ran the
    // deploy runner out of disk (the 833dc897 ENOSPC incident, platform
    // repo). Pin the whole contract on a remix, the hardest case: the tree
    // must keep BOTH its own subtree and its base's (the customer's checkout
    // IS the base pack rendering the remix's content), keep every
    // kernel-shared entry, prune everything the tree's live sources don't
    // reference, and stamp the manifest the content tests' publicAssetPresent
    // helper and the verification gate read.
    const outputRoot = mkdtempSync(path.join(os.tmpdir(), "compose-pack-prune-test-"))
    try {
        const key = "services-pest"
        const outputDir = path.join(outputRoot, key)
        execFileSync("bash", [path.join(repoRoot, "scripts", "compose-pack.sh"), key, outputDir], {
            stdio: "pipe",
            env: { ...process.env, REPOBOT_COMPOSE_SKIP_CODEGEN: "1" },
        })

        const publicDir = path.join(outputDir, "web", "app", "public")
        const baseKey = JSON.parse(readFileSync(path.join(packsDir, key, "catalog.json"), "utf8")).remixOf
        assert.ok(existsSync(path.join(publicDir, key)), "the pack's own imagery must ship")
        assert.ok(existsSync(path.join(publicDir, baseKey)), "a remix must inherit its base pack's imagery")
        for (const pruned of ["band", "estate", "wedding", "photography-music"]) {
            assert.ok(
                !existsSync(path.join(publicDir, pruned)),
                `unrelated pack imagery must be pruned: public/${pruned}`,
            )
        }
        // Kernel-shared entries (no pack claims them) always ship: the
        // marketing/brand assets, fonts, unowned subtrees, and root files.
        for (const shared of ["brand", "fonts", "showcase", "samples", "favicon.ico", "robots.txt"]) {
            assert.ok(
                existsSync(path.join(publicDir, shared)),
                `kernel-shared public entry must survive pruning: ${shared}`,
            )
        }

        const manifest = JSON.parse(readFileSync(path.join(outputDir, ".repobot-public-prune.json"), "utf8"))
        assert.equal(manifest.packKey, key)
        assert.ok(manifest.keep.includes(key) && manifest.keep.includes(baseKey))
        assert.ok(manifest.pruned.includes("band") && !manifest.pruned.includes(baseKey))

        // The safety net that makes pruning trustworthy: re-verifying a tree
        // that lost a subtree its live sources reference must fail loudly and
        // name the missing directory. (Compose itself runs this same
        // verification after pruning.)
        rmSync(path.join(publicDir, key), { recursive: true, force: true })
        assert.throws(
            () =>
                execFileSync(
                    "node",
                    [path.join(repoRoot, "scripts", "lib", "public-assets.mjs"), "verify", outputDir],
                    { stdio: "pipe" },
                ),
            (error) => String(error.stderr).includes(`web/app/public/${key}/`),
            "verify must fail naming the missing subtree",
        )
    } finally {
        rmSync(outputRoot, { recursive: true, force: true })
    }
})

test("the per-pack publish stamp moves with a pack's imagery and nothing else's", (t) => {
    // scripts/template-pack-ref.sh is the platform publisher's staleness
    // key: it hashes the kernel fingerprint's input set minus the subtrees
    // pruning removes from this pack's tree. An imagery edit in one pack
    // must move that pack's stamp and leave every other pack's alone —
    // that's the whole point (one pack changed = one template republished).
    // The kernel-wide fingerprint is deliberately NOT pinned here: it moves
    // on any runtime change, as before.
    //
    // The stamp hashes git blob ids, so it needs a git checkout. The
    // platform's publish gates replay this suite in an rsync-staged copy
    // WITHOUT .git (local-path publishes) — there the stamp never runs
    // (dirty local publishes republish everything regardless), so the test
    // skips rather than failing the whole gate over missing plumbing.
    if (!existsSync(path.join(repoRoot, ".git"))) {
        t.skip("not a git checkout (publish-gate staged copy); the stamp needs blob ids")
        return
    }
    const stampFor = (key) =>
        execFileSync("bash", [path.join(repoRoot, "scripts", "template-pack-ref.sh"), key], {
            stdio: "pipe",
        })
            .toString()
            .trim()

    const estateBefore = stampFor("estate")
    const bandBefore = stampFor("band")
    assert.match(estateBefore, /^rtp-[0-9a-f]{20}$/, "stamps wear the rtp- namespace")

    const assetDir = path.join(repoRoot, "web", "app", "public", "estate")
    const asset = readdirSync(assetDir).find((name) => name.endsWith(".webp"))
    assert.ok(asset, "the estate pack should carry webp imagery to perturb")
    const assetPath = path.join(assetDir, asset)
    const original = readFileSync(assetPath)
    try {
        writeFileSync(assetPath, Buffer.concat([original, Buffer.from("x")]))
        assert.notEqual(stampFor("estate"), estateBefore, "the owning pack's stamp must move")
        assert.equal(stampFor("band"), bandBefore, "an unrelated pack's stamp must not move")
    } finally {
        writeFileSync(assetPath, original)
    }
})

test("REPOBOT_COMPOSE_SKIP_CODEGEN=1 skips the kernel-wide prep", () => {
    // Batch callers (template publish, image staging) compose many packs
    // from one unchanging checkout and run the kernel-wide prep (theme gate
    // + codegen, ~40s) exactly once, passing the skip flag for every compose
    // after the first. Pin that the flag really skips codegen: a flagged
    // compose must stage generated files as they sit on disk, untouched.
    // Dropping the flag would silently re-serialize deploys into N codegen
    // passes — the regression this test exists to catch.
    const outputRoot = mkdtempSync(path.join(os.tmpdir(), "compose-pack-skip-test-"))
    const typesPath = path.join(repoRoot, "web", "app", "src", "generated", "graphql", "types.ts")
    const originalTypes = readFileSync(typesPath, "utf8")
    const marker = "// compose-pack-skip-codegen-test-marker"
    try {
        writeFileSync(typesPath, `${originalTypes}\n${marker}\n`)
        const outputDir = path.join(outputRoot, "pong")
        execFileSync("bash", [path.join(repoRoot, "scripts", "compose-pack.sh"), "pong", outputDir], {
            stdio: "pipe",
            env: { ...process.env, REPOBOT_COMPOSE_SKIP_CODEGEN: "1" },
        })
        const stagedTypes = readFileSync(
            path.join(outputDir, "web", "app", "src", "generated", "graphql", "types.ts"),
            "utf8",
        )
        assert.ok(
            stagedTypes.includes(marker),
            "flagged compose regenerated code: REPOBOT_COMPOSE_SKIP_CODEGEN=1 must skip codegen",
        )
        // The pack-level stamps must still run under the flag — skipping is
        // only about the kernel-wide prep, never the per-pack composition.
        const active = JSON.parse(readFileSync(path.join(outputDir, "packs", "active.json"), "utf8"))
        assert.equal(active.key, "pong", "flagged compose skipped the per-pack stamps")
    } finally {
        writeFileSync(typesPath, originalTypes)
        rmSync(outputRoot, { recursive: true, force: true })
    }
})
