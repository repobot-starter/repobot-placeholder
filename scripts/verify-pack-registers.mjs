#!/usr/bin/env node
// Register conformance, as RENDERED: load each built template preview in a
// real browser and assert the page wears the register its pack declares.
//
// The catalog declares the register once (landing.style.preset), the
// composer stamps it, the resolver applies it — and this gate is the eyes
// at the end of that chain. It reads the `data-marketing-preset` attribute
// MarketingPage stamps on the rendered page and compares it against the
// design manifest's stylePreset for the pack, so it needs no mirror of any
// palette or token. Config-level checks kept passing while /previews/
// photography shipped rendering the kernel default register; this is the
// check that would have caught it.
//
//   node scripts/verify-pack-registers.mjs --public-dir <dir> [keys...]
//
// <dir> is a static web root containing previews/<key>/ bundles (the
// platform's web/app/public after scripts/build-game-previews.sh). With no
// keys, every pack that declares a register AND has a built preview is
// checked; keys narrow it. Exits 1 on any mismatch or missing stamp.
// Reuses page-check's browser machinery (playwright-core via the functions
// workspace, the shared Chromium resolver, BRIEF_BROWSER_CDP_URL).

import { createReadStream, existsSync, readFileSync, statSync } from "node:fs"
import { createServer } from "node:http"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { resolveChromiumExecutablePath } from "./brief/chromium.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function fail(message) {
    console.error(`verify-pack-registers: ${message}`)
    process.exit(1)
}

function parseArgs(argv) {
    const keys = []
    let publicDir
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index]
        if (arg === "--public-dir") publicDir = argv[++index]
        else if (arg.startsWith("--")) fail(`unknown option ${arg}`)
        else keys.push(arg)
    }
    if (publicDir === undefined) {
        fail("usage: node scripts/verify-pack-registers.mjs --public-dir <dir> [keys...]")
    }
    return { publicDir: path.resolve(publicDir), keys }
}

const CONTENT_TYPES = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".webp": "image/webp",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".ico": "image/x-icon",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".txt": "text/plain",
    ".xml": "application/xml",
}

/** A minimal static server over the public dir — previews are plain files. */
function serveStatic(publicDir) {
    const server = createServer((request, response) => {
        const url = new URL(request.url ?? "/", "http://localhost")
        let filePath = path.join(publicDir, path.normalize(decodeURIComponent(url.pathname)))
        if (!filePath.startsWith(publicDir)) {
            response.writeHead(403).end()
            return
        }
        if (existsSync(filePath) && statSync(filePath).isDirectory()) {
            filePath = path.join(filePath, "index.html")
        }
        if (!existsSync(filePath)) {
            response.writeHead(404).end()
            return
        }
        response.writeHead(200, {
            "content-type": CONTENT_TYPES[path.extname(filePath)] ?? "application/octet-stream",
        })
        createReadStream(filePath).pipe(response)
    })
    return new Promise((resolve) => {
        server.listen(0, "127.0.0.1", () => resolve(server))
    })
}

async function openBrowser() {
    let chromium
    try {
        const requireFromFunctions = createRequire(path.join(ROOT, "firebase", "functions", "package.json"))
        chromium = requireFromFunctions("playwright-core").chromium
    } catch {
        fail("playwright-core is not installed (npm install)")
    }
    const cdpUrl = process.env.BRIEF_BROWSER_CDP_URL
    if (cdpUrl !== undefined && cdpUrl !== "") {
        return chromium.connectOverCDP(cdpUrl)
    }
    const executablePath = resolveChromiumExecutablePath()
    if (executablePath === undefined) {
        fail("no Chromium found (install Chrome/Chromium or set DOCUMENTS_CHROMIUM_PATH)")
    }
    return chromium.launch({ headless: true, executablePath })
}

const { publicDir, keys } = parseArgs(process.argv.slice(2))

const manifest = JSON.parse(readFileSync(path.join(ROOT, "docs/design-manifest.json"), "utf8"))
const declared = Object.entries(manifest.packs)
    .filter(([, pack]) => pack.stylePreset !== undefined)
    .map(([key, pack]) => ({ key, preset: pack.stylePreset }))

const targets = declared.filter(({ key }) => {
    if (keys.length > 0 && !keys.includes(key)) return false
    return existsSync(path.join(publicDir, "previews", key, "index.html"))
})
if (keys.length > 0) {
    for (const key of keys) {
        if (!targets.some((target) => target.key === key)) {
            fail(
                `pack '${key}' has no declared register or no built preview under ` +
                    `${path.join(publicDir, "previews", key)}`,
            )
        }
    }
}
if (targets.length === 0) {
    console.log("verify-pack-registers: no built previews declare a register; nothing to check.")
    process.exit(0)
}

const server = await serveStatic(publicDir)
const port = server.address().port
const browser = await openBrowser()
const context = await browser.newContext()

let failures = 0
for (const { key, preset } of targets) {
    const page = await context.newPage()
    try {
        await page.goto(`http://127.0.0.1:${port}/previews/${key}/`, {
            waitUntil: "load",
            timeout: 30000,
        })
        // The stamp appears when the marketing page mounts; poll instead of
        // sleeping so a fast bundle verifies fast.
        const worn = await page
            .waitForSelector("[data-marketing-preset]", { timeout: 10000 })
            .then((element) => element.getAttribute("data-marketing-preset"))
            .catch(() => null)
        if (worn === preset) {
            console.log(`ok   ${key}: renders "${preset}"`)
        } else if (worn === null) {
            failures += 1
            console.error(`FAIL ${key}: no rendered marketing page (expected "${preset}")`)
        } else {
            failures += 1
            console.error(`FAIL ${key}: renders "${worn}", catalog declares "${preset}"`)
        }
    } catch (error) {
        failures += 1
        console.error(`FAIL ${key}: ${String(error?.message ?? error).split("\n")[0]}`)
    } finally {
        await page.close()
    }
}

await browser.close()
server.close()
process.exit(failures > 0 ? 1 : 0)
