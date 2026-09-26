// End-to-end tests for page-check.mjs: a throwaway HTTP server plays the dev
// stack (serving this repo's repobot-app marker so the identity probe
// passes), and the script drives the machine's real Chromium against it.
// Skips when no Chromium is available (mirrors the brief runner's behavior).

import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { createServer } from "node:http"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import path from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"
import { resolveChromiumExecutablePath } from "./brief/chromium.mjs"

const execFileAsync = promisify(execFile)
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const marker = readFileSync(path.join(repoRoot, "web", "app", "index.html"), "utf8").match(
    /name="repobot-app"[^>]*content="([^"]*)"/,
)?.[1]

const htmlShell = (body) =>
    `<!doctype html><html><head><meta name="repobot-app" content="${marker}" /></head><body>${body}</body></html>`

function startStubStack() {
    const server = createServer((request, response) => {
        if (request.url === "/api/boom") {
            response.writeHead(500).end("boom")
        } else if (request.url === "/broken") {
            response.writeHead(200, { "content-type": "text/html" }).end(
                htmlShell(`<h1>Broken</h1><script>
                    console.error("kaboom console")
                    fetch("/api/boom")
                    setTimeout(() => { throw new Error("kaboom exception") }, 50)
                </script>`),
            )
        } else {
            response.writeHead(200, { "content-type": "text/html" }).end(htmlShell("<h1>Clean</h1>"))
        }
    })
    return new Promise((resolve) => {
        server.listen(0, "127.0.0.1", () => {
            resolve({ server, baseUrl: `http://127.0.0.1:${server.address().port}` })
        })
    })
}

async function runPageCheck(args) {
    try {
        const { stdout, stderr } = await execFileAsync(
            process.execPath,
            [path.join(repoRoot, "scripts", "page-check.mjs"), ...args],
            { cwd: repoRoot, timeout: 90_000 },
        )
        return { code: 0, output: `${stdout}${stderr}` }
    } catch (error) {
        return { code: error.code, output: `${error.stdout ?? ""}${error.stderr ?? ""}` }
    }
}

const noChromium = resolveChromiumExecutablePath() === undefined && !process.env.BRIEF_BROWSER_CDP_URL

test(
    "a clean route passes with a screenshot; a broken one fails with every symptom named",
    { skip: noChromium && "no Chromium on this machine" },
    async () => {
        const { server, baseUrl } = await startStubStack()
        const screenshotDir = mkdtempSync(path.join(tmpdir(), "page-check-"))
        try {
            const clean = await runPageCheck([
                "/clean",
                "--base-url",
                baseUrl,
                "--screenshot-dir",
                screenshotDir,
            ])
            assert.equal(clean.code, 0, clean.output)
            assert.match(clean.output, /ok {2}\s*\/clean/)
            assert.ok(existsSync(path.join(screenshotDir, "clean.png")))

            const broken = await runPageCheck([
                "/broken",
                "--base-url",
                baseUrl,
                "--screenshot-dir",
                screenshotDir,
            ])
            assert.equal(broken.code, 1, broken.output)
            assert.match(broken.output, /FAIL \/broken/)
            assert.match(broken.output, /console\.error: kaboom console/)
            assert.match(broken.output, /pageerror: .*kaboom exception/)
            assert.match(broken.output, /request: GET .*\/api\/boom — HTTP 500/)
        } finally {
            server.close()
            rmSync(screenshotDir, { recursive: true, force: true })
        }
    },
)

test(
    "--compare writes a labeled side-by-side of the design and the build",
    { skip: noChromium && "no Chromium on this machine" },
    async () => {
        const require = createRequire(import.meta.url)
        let sharp
        try {
            sharp = require("sharp")
        } catch {
            return // sharp is a devDependency; skip if the install dropped optional deps
        }
        const { server, baseUrl } = await startStubStack()
        const screenshotDir = mkdtempSync(path.join(tmpdir(), "page-check-"))
        try {
            const designPath = path.join(screenshotDir, "design.png")
            await sharp({ create: { width: 800, height: 600, channels: 3, background: "#e63946" } })
                .png()
                .toFile(designPath)
            const result = await runPageCheck([
                "/clean",
                "--base-url",
                baseUrl,
                "--screenshot-dir",
                screenshotDir,
                "--width",
                "1440",
                "--compare",
                designPath,
            ])
            assert.equal(result.code, 0, result.output)
            assert.match(result.output, /compare: .*clean-vs-design\.png/)
            const comparePath = path.join(screenshotDir, "clean-vs-design.png")
            assert.ok(existsSync(comparePath))
            // Two 720px panes plus the divider; the build pane was shot at 1440.
            const meta = await sharp(comparePath).metadata()
            assert.equal(meta.width, 720 * 2 + 12)
        } finally {
            server.close()
            rmSync(screenshotDir, { recursive: true, force: true })
        }
    },
)

test("an unreachable dev stack is reported, not crashed on", async () => {
    const result = await runPageCheck(["/anything", "--base-url", "http://127.0.0.1:1"])
    assert.equal(result.code, 1)
    assert.match(result.output, /dev stack not reachable/)
})

test("no routes prints usage", async () => {
    const result = await runPageCheck([])
    assert.equal(result.code, 1)
    assert.match(result.output, /usage: npm run page:check/)
})
