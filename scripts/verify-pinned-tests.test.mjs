// Tests for verify-pinned-tests.mjs. The script resolves the repo root from
// its own location, so each case copies it into a throwaway repo layout and
// runs it there.

import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { cpSync, mkdirSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

const scriptSource = path.join(path.dirname(fileURLToPath(import.meta.url)), "verify-pinned-tests.mjs")

function makeRepo() {
    const root = mkdtempSync(path.join(tmpdir(), "pinned-tests-"))
    mkdirSync(path.join(root, "scripts"), { recursive: true })
    cpSync(scriptSource, path.join(root, "scripts", "verify-pinned-tests.mjs"))
    mkdirSync(path.join(root, "web", "app", "tests", "Seo"), { recursive: true })
    writeFileSync(path.join(root, "web", "app", "tests", "Seo", "PageMeta.test.tsx"), "original meta test\n")
    writeFileSync(path.join(root, "web", "app", "tests", "blueprints.test.ts"), "original blueprint test\n")
    return root
}

function run(root, args = []) {
    try {
        const stdout = execFileSync(
            process.execPath,
            [path.join(root, "scripts", "verify-pinned-tests.mjs"), ...args],
            { encoding: "utf8" },
        )
        return { code: 0, output: stdout }
    } catch (error) {
        return { code: error.status, output: `${error.stdout ?? ""}${error.stderr ?? ""}` }
    }
}

test("intact pinned tests verify clean, and new test files are welcome", () => {
    const root = makeRepo()
    try {
        assert.equal(run(root, ["--write"]).code, 0)
        assert.equal(run(root).code, 0)
        writeFileSync(path.join(root, "web", "app", "tests", "MyFeature.test.tsx"), "brand new test\n")
        const result = run(root)
        assert.equal(result.code, 0, result.output)
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})

test("modifying or deleting a pinned test fails with the seed-contract message", () => {
    const root = makeRepo()
    try {
        run(root, ["--write"])
        writeFileSync(path.join(root, "web", "app", "tests", "blueprints.test.ts"), "weakened expectations\n")
        unlinkSync(path.join(root, "web", "app", "tests", "Seo", "PageMeta.test.tsx"))
        const result = run(root)
        assert.equal(result.code, 1)
        assert.match(result.output, /modified: blueprints\.test\.ts/)
        assert.match(result.output, /deleted: {2}Seo\/PageMeta\.test\.tsx/)
        assert.match(result.output, /change your code so the promise still holds/)
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})

test("a missing manifest fails with a pointer to --write", () => {
    const root = makeRepo()
    try {
        const result = run(root)
        assert.equal(result.code, 1)
        assert.match(result.output, /--write/)
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})
