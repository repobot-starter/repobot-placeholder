// Tests for the brief runner (docs/brief-spec.md Phase 2).
//
// Unit tests exercise validation, pointer resolution, and report semantics
// with fake adapters. The end-to-end test runs the real CLI against the shop
// fixture: assertions whose dependency is unavailable (dev stack, database,
// deploy manifest) must report "blocked" — never "fail" — so this suite is
// green on a bare checkout and strictly stronger with the stack up.
//
// Run: npm run test:brief

import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"
import { checkBrowserAssertions, checkGateAssertion, checkManifestAssertion, runBrief } from "./check.mjs"
import { cacheableTreeHash, recordGatePasses } from "./gate-cache.mjs"
import { BRIEF_GATES, BRIEF_VOCABULARY, resolveManifestPointer, validateBrief } from "./schema.mjs"

const briefDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(briefDir, "..", "..")
const fixturePath = path.join(briefDir, "fixtures", "shop-brief.json")
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"))

// ---------------------------------------------------------------------------
// Schema validation
// ---------------------------------------------------------------------------

test("the shop fixture and the committed placeholder are valid briefs", () => {
    assert.deepEqual(validateBrief(fixture), [])
    const placeholder = JSON.parse(readFileSync(path.join(repoRoot, "repobot.brief.json"), "utf8"))
    assert.deepEqual(validateBrief(placeholder), [])
})

// Every gate script package.json ships must be brief-nameable: the setup
// flow's brief compiler emits these names (check:web for content-only
// drafts), and a gate missing from BRIEF_GATES invalidates every brief
// that names it.
test("every shipped gate name validates in a gate-passes assertion", () => {
    const pkg = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"))
    for (const gate of ["check:all", "test", "test:web", "check:web"]) {
        assert.ok(BRIEF_GATES.includes(gate), `BRIEF_GATES is missing ${gate}`)
        assert.ok(pkg.scripts[gate], `package.json has no ${gate} script`)
        const problems = validateBrief({
            content: {},
            asks: [
                {
                    id: "healthy",
                    statement: "s",
                    tier: "checkable",
                    acceptance: [{ assert: "gate-passes", gate }],
                },
            ],
        })
        assert.deepEqual(problems, [])
    }
})

test("validation rejects the documented failure shapes", () => {
    const problemsFor = (asks, content = {}) => validateBrief({ content, asks })

    assert.ok(problemsFor([{ id: "x", statement: "s", tier: "urgent" }]).some((p) => p.includes("tier")))
    assert.ok(
        problemsFor([{ id: "Bad_Id", statement: "s", tier: "judged", rubric: "r" }]).some((p) =>
            p.includes("kebab-case"),
        ),
    )
    assert.ok(
        problemsFor([{ id: "a", statement: "s", tier: "checkable" }]).some((p) => p.includes("acceptance")),
    )
    assert.ok(
        problemsFor([{ id: "a", statement: "s", tier: "compiled" }]).some((p) => p.includes("realizedBy")),
    )
    assert.ok(
        problemsFor([
            { id: "a", statement: "s", tier: "judged", rubric: "r" },
            { id: "a", statement: "s", tier: "judged", rubric: "r" },
        ]).some((p) => p.includes("duplicated")),
    )
    assert.ok(
        problemsFor([
            {
                id: "a",
                statement: "s",
                tier: "checkable",
                acceptance: [{ assert: "teleport", to: "prod" }],
            },
        ]).some((p) => p.includes("vocabulary")),
    )
    assert.ok(
        problemsFor([
            {
                id: "a",
                statement: "s",
                tier: "checkable",
                contentRefs: ["missing.ref"],
                acceptance: [{ assert: "gate-passes", gate: "test" }],
            },
        ]).some((p) => p.includes("missing.ref")),
    )
    assert.ok(
        problemsFor([
            {
                id: "a",
                statement: "s",
                tier: "judged",
                rubric: "r",
                acceptance: [{ assert: "gate-passes", gate: "test" }],
            },
        ]).some((p) => p.includes("screenshot")),
    )
})

test("signedIn browser assertions validate: optional, boolean-typed", () => {
    const problemsFor = (asks) => validateBrief({ content: {}, asks })
    // The signed-in dashboard promise the platform compiles: an auth-gated
    // route render plus signed-in screenshot evidence.
    assert.deepEqual(
        problemsFor([
            {
                id: "app-live",
                statement: "s",
                tier: "checkable",
                acceptance: [{ assert: "route-renders", path: "/overview", signedIn: true }],
            },
            {
                id: "design-parity-dashboard-overview",
                statement: "s",
                tier: "judged",
                rubric: "r",
                acceptance: [{ assert: "screenshot", path: "/overview", signedIn: true }],
            },
        ]),
        [],
    )
    assert.ok(
        problemsFor([
            {
                id: "a",
                statement: "s",
                tier: "checkable",
                acceptance: [{ assert: "route-renders", path: "/overview", signedIn: "yes" }],
            },
        ]).some((p) => p.includes("signedIn")),
    )
})

test("unknown content kinds and extra fields are carried, not rejected", () => {
    const brief = {
        futureTopLevelField: { anything: true },
        content: { "widgets.one": { kind: "hologram", size: "xl" } },
        asks: [],
    }
    assert.deepEqual(validateBrief(brief), [])
})

// ---------------------------------------------------------------------------
// Manifest pointer resolution
// ---------------------------------------------------------------------------

test("resolveManifestPointer walks objects and id/key-addressed arrays", () => {
    const manifest = {
        marketing: {
            preset: "dark-dev",
            pages: [{ id: "pricing", path: "/pricing" }],
        },
        capabilities: [{ key: "payments", enabled: true }],
    }
    assert.equal(resolveManifestPointer(manifest, "marketing.preset"), "dark-dev")
    assert.equal(resolveManifestPointer(manifest, "marketing.pages[pricing]").path, "/pricing")
    assert.equal(resolveManifestPointer(manifest, "capabilities[payments]").enabled, true)
    assert.equal(resolveManifestPointer(manifest, "marketing.pages[missing]"), undefined)
    assert.equal(resolveManifestPointer(manifest, "no.such.path"), undefined)
})

test("manifest assertions distinguish blocked (file missing) from fail (entry missing)", () => {
    const missing = checkManifestAssertion(
        { assert: "capability-declared", capability: "PAYMENTS" },
        path.join(repoRoot, "scripts"), // no repobot.deploy.json here
    )
    assert.equal(missing.status, "blocked")

    const resolves = checkManifestAssertion(
        { assert: "manifest-entry", manifest: "repobot.project.json", pointer: "marketing.preset" },
        repoRoot,
    )
    assert.equal(resolves.status, "pass")

    const wrongPointer = checkManifestAssertion(
        { assert: "manifest-entry", manifest: "repobot.project.json", pointer: "marketing.pages[nope]" },
        repoRoot,
    )
    assert.equal(wrongPointer.status, "fail")
})

// The PAYMENTS mutation-roundtrip boots the in-process Apollo server against
// sandbox .env.local (AUTH_MODE=local / PAYMENTS_MODE=local). Those modes are
// gated to the emulator/tests; without priming, every storefront ask fails.
test("brief-gql primes FUNCTIONS_EMULATOR so sandbox local modes validate", async () => {
    const { primeBriefGqlSandboxEnv } = await import(
        path.join(repoRoot, "firebase/functions/scripts/brief-gql-env.mjs")
    )
    const previous = process.env.FUNCTIONS_EMULATOR
    delete process.env.FUNCTIONS_EMULATOR
    try {
        primeBriefGqlSandboxEnv()
        assert.equal(process.env.FUNCTIONS_EMULATOR, "true")
        // Idempotent: a second call must not throw or clear the flag.
        primeBriefGqlSandboxEnv()
        assert.equal(process.env.FUNCTIONS_EMULATOR, "true")
    } finally {
        if (previous === undefined) {
            delete process.env.FUNCTIONS_EMULATOR
        } else {
            process.env.FUNCTIONS_EMULATOR = previous
        }
    }
})

// ---------------------------------------------------------------------------
// Report semantics (fake adapters)
// ---------------------------------------------------------------------------

const fakeAdapters = (result) => ({
    manifest: () => result,
    gate: () => result,
    gql: (assertions) => assertions.map(() => result),
    browser: (assertions) => assertions.map(() => result),
})

test("ask status: fail dominates blocked dominates pass; judged never fails", async () => {
    const brief = {
        asks: [
            {
                id: "mixed",
                statement: "s",
                tier: "checkable",
                acceptance: [
                    { assert: "route-renders", path: "/a" },
                    { assert: "gate-passes", gate: "test" },
                ],
            },
            {
                id: "taste",
                statement: "s",
                tier: "judged",
                rubric: "r",
                acceptance: [{ assert: "screenshot", path: "/a" }],
            },
        ],
    }
    const report = await runBrief(brief, {
        adapters: {
            ...fakeAdapters({ status: "pass" }),
            gate: () => ({ status: "fail", detail: "boom" }),
            browser: (assertions) => assertions.map(() => ({ status: "blocked" })),
        },
    })
    const [mixed, taste] = report.asks
    assert.equal(mixed.status, "fail")
    assert.equal(taste.status, "judged")
    assert.equal(report.summary.fail, 1)
    assert.equal(report.summary.judged, 1)
})

test("first-look captures from the browser pass ride the report; bare arrays still work", async () => {
    const brief = {
        asks: [
            {
                id: "page-home",
                statement: "s",
                tier: "checkable",
                acceptance: [{ assert: "route-renders", path: "/" }],
            },
        ],
    }
    const report = await runBrief(brief, {
        adapters: {
            ...fakeAdapters({ status: "pass" }),
            browser: (assertions) => ({
                results: assertions.map(() => ({ status: "fail", detail: "still building" })),
                firstLooks: [{ path: "/", file: "brief-report/first-look-home.png" }],
            }),
        },
    })
    assert.equal(report.asks[0].status, "fail")
    assert.deepEqual(report.firstLooks, [{ path: "/", file: "brief-report/first-look-home.png" }])

    // Legacy adapters returning a bare array produce a report without the key.
    const bare = await runBrief(brief, { adapters: fakeAdapters({ status: "pass" }) })
    assert.equal(bare.firstLooks, undefined)
})

test("skip-screenshots resolves a screenshot-only batch without launching a browser", async () => {
    // rootDir/baseUrl point nowhere: the early return must fire before the
    // dev-stack probe or any playwright resolution would fail the test.
    const outcome = await checkBrowserAssertions(
        [
            { assert: "screenshot", path: "/" },
            { assert: "screenshot", path: "/pricing" },
        ],
        {
            rootDir: "/nowhere",
            baseUrl: "http://127.0.0.1:1",
            reportDir: "/nowhere/brief-report",
            skipScreenshots: true,
        },
    )
    assert.deepEqual(outcome.firstLooks, [])
    assert.equal(outcome.results.length, 2)
    for (const result of outcome.results) {
        assert.equal(result.status, "blocked")
        assert.match(result.detail, /skipped/)
    }
})

test("compiled asks get an implicit manifest-entry assertion from realizedBy", async () => {
    const brief = {
        asks: [
            {
                id: "site-preset",
                statement: "s",
                tier: "compiled",
                realizedBy: { manifest: "repobot.project.json", pointer: "marketing.preset" },
            },
        ],
    }
    const seen = []
    const report = await runBrief(brief, {
        adapters: {
            ...fakeAdapters({ status: "pass" }),
            manifest: (assertion) => {
                seen.push(assertion)
                return { status: "pass" }
            },
        },
    })
    assert.equal(report.asks[0].status, "pass")
    assert.deepEqual(seen, [
        { assert: "manifest-entry", manifest: "repobot.project.json", pointer: "marketing.preset" },
    ])
})

test("--skip-gates reports gate assertions blocked without spawning them", async () => {
    const brief = {
        asks: [
            {
                id: "healthy",
                statement: "s",
                tier: "checkable",
                acceptance: [{ assert: "gate-passes", gate: "check:all" }],
            },
        ],
    }
    // No gate adapter override: skipGates must short-circuit before spawning.
    const report = await runBrief(brief, {
        skipGates: true,
        adapters: {
            manifest: () => ({ status: "pass" }),
            gql: (assertions) => assertions.map(() => ({ status: "pass" })),
            browser: (assertions) => assertions.map(() => ({ status: "pass" })),
        },
    })
    assert.equal(report.asks[0].status, "blocked")
    assert.match(report.asks[0].assertions[0].detail, /skipped/)
})

test("gate results cache by content hash: identical tree skips the re-run", () => {
    // A throwaway git repo whose gate script counts its own invocations in a
    // file OUTSIDE the repo (a side effect inside would change the hash).
    const repoDir = mkdtempSync(path.join(os.tmpdir(), "brief-gate-cache-"))
    const counterFile = mkdtempSync(path.join(os.tmpdir(), "brief-gate-count-")) + "/count"
    writeFileSync(counterFile, "")
    writeFileSync(
        path.join(repoDir, "package.json"),
        JSON.stringify({
            name: "t",
            version: "0.0.0",
            scripts: { "gate:ok": `node -e "require('fs').appendFileSync('${counterFile}', 'x')"` },
        }),
    )
    writeFileSync(path.join(repoDir, ".gitignore"), ".brief-gate-cache.json\n")
    const git = (...args) => execFileSync("git", args, { cwd: repoDir, encoding: "utf8" })
    git("init", "-q")
    git("add", "-A")
    git("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "-m", "init")

    const first = checkGateAssertion({ assert: "gate-passes", gate: "gate:ok" }, repoDir)
    assert.equal(first.status, "pass")
    assert.equal(readFileSync(counterFile, "utf8"), "x")

    // Same content: the cache answers; the gate must not spawn again.
    const second = checkGateAssertion({ assert: "gate-passes", gate: "gate:ok" }, repoDir)
    assert.equal(second.status, "pass")
    assert.match(second.detail, /cached/)
    assert.equal(readFileSync(counterFile, "utf8"), "x")

    // Changed content invalidates the cache: the gate really runs...
    writeFileSync(path.join(repoDir, "changed.txt"), "new content")
    const third = checkGateAssertion({ assert: "gate-passes", gate: "gate:ok" }, repoDir)
    assert.equal(third.status, "pass")
    assert.equal(third.detail, undefined)
    assert.equal(readFileSync(counterFile, "utf8"), "xx")

    // ...and uncommitted-but-identical content hits again: setup pods never
    // commit mid-run, so the cache must work on a dirty tree.
    const fourth = checkGateAssertion({ assert: "gate-passes", gate: "gate:ok" }, repoDir)
    assert.match(fourth.detail, /cached/)
    assert.equal(readFileSync(counterFile, "utf8"), "xx")
})

// The gate scripts record their own passes through this flow (check-web.sh
// hashes up front, runs its checks, records on success), so a brief:check
// that follows a direct `npm run check:web` must cache-hit instead of
// re-running the whole gate — the doubled gate run was the bulk of an
// agent's finish-line wait.
test("a directly recorded gate pass answers the brief runner's gate assertion", () => {
    const repoDir = mkdtempSync(path.join(os.tmpdir(), "brief-gate-record-"))
    const counterFile = mkdtempSync(path.join(os.tmpdir(), "brief-gate-record-count-")) + "/count"
    writeFileSync(counterFile, "")
    writeFileSync(
        path.join(repoDir, "package.json"),
        JSON.stringify({
            name: "t",
            version: "0.0.0",
            scripts: { "gate:ok": `node -e "require('fs').appendFileSync('${counterFile}', 'x')"` },
        }),
    )
    writeFileSync(path.join(repoDir, ".gitignore"), ".brief-gate-cache.json\n")
    const git = (...args) => execFileSync("git", args, { cwd: repoDir, encoding: "utf8" })
    git("init", "-q")

    // What the gate script does: hash first, run the checks, record the pass.
    const startHash = cacheableTreeHash(repoDir)
    assert.ok(startHash)
    assert.equal(recordGatePasses(repoDir, ["gate:ok"], startHash), true)

    // The runner's gate assertion answers from the cache; the gate never spawns.
    const result = checkGateAssertion({ assert: "gate-passes", gate: "gate:ok" }, repoDir)
    assert.equal(result.status, "pass")
    assert.match(result.detail, /cached/)
    assert.equal(readFileSync(counterFile, "utf8"), "")

    // A recording attempt against a tree that changed after the hash was
    // taken must refuse: the checks did not see the current content.
    writeFileSync(path.join(repoDir, "drift.txt"), "edited mid-run")
    assert.equal(recordGatePasses(repoDir, ["gate:ok"], startHash), false)
})

test("an empty ledger reports zero asks (fresh repos stay green)", async () => {
    const report = await runBrief({ asks: [] }, { adapters: fakeAdapters({ status: "pass" }) })
    assert.equal(report.summary.asks, 0)
    assert.equal(report.summary.fail, 0)
})

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function runCli(args) {
    try {
        const stdout = execFileSync("node", [path.join(briefDir, "check.mjs"), ...args], {
            cwd: repoRoot,
            encoding: "utf8",
            stdio: ["ignore", "pipe", "pipe"],
        })
        return { exitCode: 0, stdout }
    } catch (error) {
        return { exitCode: error.status ?? 1, stdout: error.stdout ?? "" }
    }
}

// Version skew is real: the platform's dispatched prompts and a project's
// committed runner can be different vintages, and a hard "unknown argument"
// exit once cost a setup agent a diagnosis loop. Unknown flags warn and run.
test("unknown CLI arguments warn and are ignored, never fatal", () => {
    const { exitCode, stdout } = runCli(["--some-future-flag", "--vocabulary"])
    assert.equal(exitCode, 0)
    const vocabulary = JSON.parse(stdout)
    assert.deepEqual(vocabulary.tiers, ["compiled", "checkable", "judged"])
})

test("--help prints usage and exits 0", () => {
    const { exitCode, stdout } = runCli(["--help"])
    assert.equal(exitCode, 0)
    assert.match(stdout, /usage: node scripts\/brief\/check\.mjs/)
})

// A shared pod hosts neighboring project workspaces on nearby ports, and
// every one of them is "a repobot app" — the probe must compare the served
// identity marker against THIS repo's, or checks run against a stranger.
test("browser assertions block when the base URL serves a different repobot project", async () => {
    const { createServer } = await import("node:http")
    const server = createServer((request, response) => {
        response.setHeader("content-type", "text/html")
        response.end(
            '<html><head><meta name="repobot-app" content="some-other-project" /></head><body></body></html>',
        )
    })
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
    try {
        const results = await checkBrowserAssertions(
            [{ assert: "content-present", path: "/", text: "anything" }],
            { rootDir: repoRoot, baseUrl: `http://127.0.0.1:${server.address().port}` },
        )
        assert.equal(results[0].status, "blocked")
        assert.match(results[0].detail, /DIFFERENT repobot project/)
        assert.match(results[0].detail, /some-other-project/)
    } finally {
        server.close()
    }
})

test("--vocabulary prints the append-only assertion set", () => {
    const { exitCode, stdout } = runCli(["--vocabulary"])
    assert.equal(exitCode, 0)
    const vocabulary = JSON.parse(stdout)
    assert.deepEqual(Object.keys(vocabulary.asserts).sort(), Object.keys(BRIEF_VOCABULARY.asserts).sort())
    assert.deepEqual(vocabulary.tiers, ["compiled", "checkable", "judged"])
})

test("the committed placeholder brief exits 0", () => {
    const { exitCode, stdout } = runCli([])
    assert.equal(exitCode, 0)
    const report = JSON.parse(stdout)
    assert.equal(report.summary.asks, 0)
})

test("end-to-end: the shop fixture never fails (passes fully with the dev stack up)", () => {
    const { exitCode, stdout } = runCli(["--brief", fixturePath])
    const report = JSON.parse(stdout)
    for (const ask of report.asks) {
        for (const assertion of ask.assertions) {
            assert.notEqual(
                assertion.status,
                "fail",
                `${ask.id} ${assertion.assert} failed: ${assertion.detail ?? ""}`,
            )
        }
    }
    assert.equal(report.summary.fail, 0)
    assert.equal(exitCode, 0)
})
