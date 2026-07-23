// Regression test for the misdirected-agent bug: a workspace agent asked to
// "redesign this page" restyled web/app/src/View/Blank/ while the pong pack
// owned `/`, because the composed repo's AGENTS.md never said which pack was
// active. compose-pack.sh must stamp an unmissable Active-pack pointer (key,
// home view dir, PACK.md path) into AGENTS.md, and every catalog must carry a
// homeViewDir that actually exists in the kernel.
//
// Run: node --test scripts/compose-pack.test.mjs

import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs"
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

test("compose stamps the active pack pointer into AGENTS.md", () => {
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

        const sectionAt = agents.indexOf(`## Active pack: ${key}`)
        assert.notEqual(sectionAt, -1, "AGENTS.md is missing the Active pack section")
        // The pointer must be the first section (right under the H1), before
        // the generic repo map, so exploring agents cannot skim past it.
        const firstSectionAt = agents.indexOf("\n## ")
        assert.equal(
            sectionAt,
            firstSectionAt + 1,
            "Active pack section must be the first section in AGENTS.md",
        )
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
    } finally {
        rmSync(outputRoot, { recursive: true, force: true })
    }
})
