// Static-class templates must not boot the full-stack dev harness
// (premium-static-sites §6: "no backend dev-server processes competing for
// shared CPU"). The failure this closes (2026-09-18 owner repro,
// repobot-influencer on a shared-CPU sandbox pod): dev-up started vite AND a
// functions emulator AND an embedded Postgres for a site with no backend at
// all; the emulator took five minutes to even spawn, .dev/stack-ready was
// gated on it, the agent's 180s readiness waits timed out twice, and the
// preview sat gray while the idle backend starved vite.
//
// These tests pin the three layers of the fix:
//   1. the classifier (scripts/lib/stack-class.mjs) — the complement of the
//      platform's isApplicationTemplate test, fed by the compose-stamped
//      repobot.deploy.json;
//   2. dev-up.sh's wiring — every backend component guarded on STACK_CLASS,
//      readiness published for both classes by the ONE write that
//      dev-up-ports.test.mjs already orders after the emulator ownership
//      gate;
//   3. the client-only boot end to end — a static-manifest fixture tree runs
//      dev-up for real and must come up with a readiness marker, a web
//      server, and NO functions emulator artifacts.

import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { after, test } from "node:test"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"
import {
    applicationCapabilities,
    classifyStackForManifest,
    classifyStackForRepo,
} from "./lib/stack-class.mjs"

const execFileAsync = promisify(execFile)
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

// --- 1. classification ------------------------------------------------------

test("a landing pack with only native platform targets is client-only", () => {
    assert.equal(
        classifyStackForManifest({
            templateKey: "repobot-influencer",
            packKey: "influencer",
            base: "landing",
            clientOnly: true,
            capabilities: ["IOS", "ANDROID"],
        }),
        "client",
    )
})

test("app- and store-base templates keep the full harness", () => {
    assert.equal(classifyStackForManifest({ packKey: "saas", base: "app", capabilities: [] }), "full")
    assert.equal(classifyStackForManifest({ packKey: "checkout", base: "store", capabilities: [] }), "full")
})

test("any provisioned-infrastructure capability keeps the full harness", () => {
    for (const capability of applicationCapabilities) {
        assert.equal(
            classifyStackForManifest({ packKey: "x", base: "landing", capabilities: [capability] }),
            "full",
            `capability ${capability} must force the full stack`,
        )
    }
})

test("the blank starter is client-only despite its historical app base tag", () => {
    // Mirrors isApplicationTemplate's blank exemption: the bare kernel
    // provisions nothing, and blank is what blank_start sessions compose.
    assert.equal(
        classifyStackForManifest({ packKey: "blank", base: "app", capabilities: ["IOS", "ANDROID"] }),
        "client",
    )
})

test("a missing or malformed manifest keeps the full harness (kernel checkouts)", () => {
    const scratch = mkdtempSync(path.join(tmpdir(), "stack-class-"))
    try {
        assert.equal(classifyStackForRepo(scratch, {}), "full")
        writeFileSync(path.join(scratch, "repobot.deploy.json"), "{not json")
        assert.equal(classifyStackForRepo(scratch, {}), "full")
    } finally {
        rmSync(scratch, { recursive: true, force: true })
    }
})

test("REPOBOT_DEV_STACK overrides the manifest in both directions", () => {
    const scratch = mkdtempSync(path.join(tmpdir(), "stack-class-"))
    try {
        writeFileSync(
            path.join(scratch, "repobot.deploy.json"),
            JSON.stringify({ packKey: "influencer", base: "landing", capabilities: [] }),
        )
        assert.equal(classifyStackForRepo(scratch, { REPOBOT_DEV_STACK: "full" }), "full")
        assert.equal(classifyStackForRepo(scratch, {}), "client")
        writeFileSync(
            path.join(scratch, "repobot.deploy.json"),
            JSON.stringify({ packKey: "saas", base: "app", capabilities: ["DATABASE"] }),
        )
        assert.equal(classifyStackForRepo(scratch, { REPOBOT_DEV_STACK: "client" }), "client")
    } finally {
        rmSync(scratch, { recursive: true, force: true })
    }
})

// --- 2. dev-up wiring pins ---------------------------------------------------

test("dev-up keys on the classifier and guards every backend component", () => {
    const devUp = readFileSync(path.join(repoRoot, "scripts", "dev-up.sh"), "utf8")
    // The class is resolved once, from the shared classifier.
    assert.match(
        devUp,
        /STACK_CLASS="\$\(node "\$REPO_ROOT\/scripts\/lib\/stack-class\.mjs" "\$REPO_ROOT"\)"/,
    )
    // Backend components sit under the class guard: db, emulator start, and
    // the functions readiness gates must all appear AFTER a guard opener.
    const firstGuard = devUp.indexOf('if [ "$STACK_CLASS" != "client" ]; then')
    assert.ok(firstGuard > 0, "class guard present")
    for (const backendMarker of [
        "bash scripts/dev-db.sh",
        "start_functions_emulator",
        'wait_for_port 127.0.0.1 "$FUNCTIONS_PORT"',
        "probe_functions_registration",
    ]) {
        assert.ok(
            devUp.indexOf(backendMarker) > firstGuard,
            `${backendMarker} must be guarded behind STACK_CLASS`,
        )
    }
    // The web wait is NOT class-guarded (both classes serve the preview) and
    // precedes the single readiness write.
    const webWait = devUp.indexOf('wait_for_port 127.0.0.1 "$WEB_PORT"')
    const readyWrite = devUp.indexOf('> "$STACK_READY_FILE"')
    assert.ok(webWait > 0 && readyWrite > webWait, "readiness follows the web wait")
    // Exactly one readiness publication: dev-up-ports.test.mjs orders it
    // after the emulator ownership gate, which only holds if the client
    // path reuses that same write instead of adding an earlier one.
    assert.equal(devUp.split('> "$STACK_READY_FILE"').length, 2)
    // A static tree evicts a previous full-stack boot's emulator instead of
    // inheriting it (template flips from application packs).
    const clientBranch = devUp.indexOf('if [ "$STACK_CLASS" = "client" ]; then')
    assert.ok(clientBranch > 0 && clientBranch < firstGuard)
    assert.match(devUp, /stop_background functions\s*\n\s*rm -f "\$DEV_DIR\/functions-port"/)
})

// --- 3. the client-only boot, end to end -------------------------------------

// A minimal static-manifest tree: the real dev-up.sh + helpers + bootstrap-env
// against a stub web/app whose dev script is a plain node http server. What
// this proves functionally: a client-class boot reaches stack-ready off the
// web server alone — no firebase invocation, no functions port artifacts, no
// generated firebase.local.json — and dev-up --no-wait exits 0.
const fixtureRoot = mkdtempSync(path.join(tmpdir(), "dev-up-client-"))
after(() => {
    const pidFile = path.join(fixtureRoot, ".dev", "pids", "web.pid")
    if (existsSync(pidFile)) {
        const pid = Number(readFileSync(pidFile, "utf8").trim())
        if (Number.isFinite(pid) && pid > 1) {
            try {
                process.kill(-pid, "SIGTERM")
            } catch {
                try {
                    process.kill(pid, "SIGTERM")
                } catch {
                    // Already gone.
                }
            }
        }
    }
    rmSync(fixtureRoot, { recursive: true, force: true })
})

test("a static-manifest tree boots client-only: stack-ready without any emulator artifact", async () => {
    for (const relative of [
        "scripts/lib/common.sh",
        "scripts/lib/stack-class.mjs",
        "scripts/lib/embedded-pg.mjs",
        "scripts/dev-up.sh",
        "scripts/bootstrap-env.mjs",
        "env.manifest.json",
    ]) {
        cpSync(path.join(repoRoot, relative), path.join(fixtureRoot, relative))
    }
    // Static-class manifest, exactly as compose stamps it for a landing pack.
    writeFileSync(
        path.join(fixtureRoot, "repobot.deploy.json"),
        JSON.stringify(
            {
                templateKey: "repobot-influencer",
                packKey: "influencer",
                base: "landing",
                clientOnly: true,
                capabilities: ["IOS", "ANDROID"],
                authMethods: ["email-code"],
            },
            null,
            4,
        ),
    )
    // Every package bootstrap-env writes env files into must exist.
    const manifest = JSON.parse(readFileSync(path.join(repoRoot, "env.manifest.json"), "utf8"))
    for (const pkg of new Set(manifest.vars.map((entry) => entry.package))) {
        mkdirSync(path.join(fixtureRoot, pkg), { recursive: true })
    }
    // Present generated outputs so dev-up skips codegen (not under test).
    mkdirSync(path.join(fixtureRoot, "firebase/functions/generated"), { recursive: true })
    mkdirSync(path.join(fixtureRoot, "web/app/src/generated"), { recursive: true })
    // The stub web app: answers 200 on the port dev-up passes through.
    writeFileSync(
        path.join(fixtureRoot, "package.json"),
        JSON.stringify({ name: "fixture", private: true, workspaces: ["web/app"] }),
    )
    writeFileSync(
        path.join(fixtureRoot, "web/app/package.json"),
        JSON.stringify({ name: "fixture-web", private: true, scripts: { dev: "node dev-server.mjs" } }),
    )
    writeFileSync(
        path.join(fixtureRoot, "web/app/dev-server.mjs"),
        [
            'import http from "node:http"',
            'const port = Number(process.argv[process.argv.indexOf("--port") + 1])',
            'http.createServer((req, res) => res.end("ok")).listen(port, "127.0.0.1")',
            "",
        ].join("\n"),
    )

    const webPort = 43811 + (process.pid % 500)
    await execFileAsync("bash", ["scripts/dev-up.sh", "--no-wait"], {
        cwd: fixtureRoot,
        env: { ...process.env, DB_MODE: "embedded", PORT: String(webPort) },
    })

    assert.ok(existsSync(path.join(fixtureRoot, ".dev", "stack-ready")), "stack-ready published")
    assert.equal(readFileSync(path.join(fixtureRoot, ".dev", "web-port"), "utf8").trim(), String(webPort))
    // The whole point: nothing backend came up or was even configured.
    assert.equal(
        existsSync(path.join(fixtureRoot, ".dev", "functions-port")),
        false,
        "no functions port recorded",
    )
    assert.equal(
        existsSync(path.join(fixtureRoot, ".dev", "pids", "functions.pid")),
        false,
        "no emulator pid",
    )
    assert.equal(
        existsSync(path.join(fixtureRoot, "firebase.local.json")),
        false,
        "no generated emulator config",
    )
    assert.equal(
        existsSync(path.join(fixtureRoot, ".dev", "functions-build-stamp")),
        false,
        "no functions build ran",
    )
    // The web server dev-up supervises is really answering.
    const response = await fetch(`http://127.0.0.1:${webPort}/`)
    assert.equal(response.status, 200)
})
