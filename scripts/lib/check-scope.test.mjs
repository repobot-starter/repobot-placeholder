import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"
import { computeCheckScope } from "./check-scope.mjs"

const SCRIPT = fileURLToPath(new URL("./check-scope.mjs", import.meta.url))

test("no manifest: the kernel checks its full backend+web surface", () => {
    assert.deepEqual(computeCheckScope(undefined), {
        checkBackend: true,
        checkIos: false,
        checkAndroid: false,
    })
})

test("clientOnly content project skips the backend sections", () => {
    assert.deepEqual(computeCheckScope({ clientOnly: true, capabilities: [] }), {
        checkBackend: false,
        checkIos: false,
        checkAndroid: false,
    })
})

test("capability IOS/ANDROID badges alone never trigger native builds", () => {
    // Nearly every pack ships the native twins in-tree and badges them as
    // capabilities; only a recorded platform *choice* scopes the checks.
    assert.deepEqual(
        computeCheckScope({
            clientOnly: false,
            capabilities: ["AUTH", "DATABASE", "EMAIL", "IOS", "ANDROID"],
        }),
        { checkBackend: true, checkIos: false, checkAndroid: false },
    )
})

test("chosen platforms scope the native checks exactly", () => {
    assert.deepEqual(
        computeCheckScope({
            clientOnly: false,
            capabilities: ["IOS", "ANDROID"],
            platforms: ["WEB", "IOS"],
        }),
        { checkBackend: true, checkIos: true, checkAndroid: false },
    )
})

test("malformed manifest degrades to the full kernel surface", () => {
    assert.deepEqual(computeCheckScope("not-an-object"), {
        checkBackend: true,
        checkIos: false,
        checkAndroid: false,
    })
})

test("CLI prints eval-able shell assignments from a manifest file", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "check-scope-"))
    const manifestPath = path.join(dir, "repobot.deploy.json")
    writeFileSync(
        manifestPath,
        JSON.stringify({ clientOnly: true, platforms: ["WEB", "IOS"] }),
    )
    const stdout = execFileSync(process.execPath, [SCRIPT, manifestPath], {
        encoding: "utf8",
    })
    assert.equal(stdout, "CHECK_BACKEND=false\nCHECK_IOS=true\nCHECK_ANDROID=false\n")
})

test("CLI without a manifest file falls back to the kernel scope", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "check-scope-missing-"))
    const stdout = execFileSync(
        process.execPath,
        [SCRIPT, path.join(dir, "repobot.deploy.json")],
        { encoding: "utf8" },
    )
    assert.equal(stdout, "CHECK_BACKEND=true\nCHECK_IOS=false\nCHECK_ANDROID=false\n")
})
