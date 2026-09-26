#!/usr/bin/env node
// Remix safety, as RENDERED: load one built template bundle in a real
// browser once per style preset and assert every register degrades
// gracefully on this template's content.
//
// The remix path is the production one: the deploy job republishes a
// cached bundle with a <script id="repobot-site-config"> overlay carrying
// the edited repobot.landing.json (runtimeSiteDocuments) — here the overlay
// re-values style.preset and nothing is rebuilt. Per preset (and per
// appearance asked for), the page must:
//
//   - render the requested register (data-marketing-preset) without page
//     errors or console errors;
//   - never scroll sideways (no user-scrollable horizontal overflow);
//   - keep text in the first viewport above the legibility floor against
//     its own solid ground (text over photographs and gradient-filled
//     letters are skipped — the scrim and the fill carry those);
//   - register every face the preset names (display, body, script), and
//     load the ones the page uses.
//
//   node scripts/verify-preset-remix.mjs --build <dir> [--landing <file>]
//       [--theme <file>] [--presets a,b] [--modes native,light,dark]
//       [--floor 3] [--shots <dir>]
//
// <dir> is a `vite build` output for one template (web/app, pack switched).
// --landing/--theme default to the repo root documents, which match the
// build when it was made from this checkout. Exits 1 on any failure.
// Browser machinery as verify-pack-registers (playwright-core, the shared
// Chromium resolver, BRIEF_BROWSER_CDP_URL).

import { createReadStream, existsSync, mkdirSync, readFileSync, statSync } from "node:fs"
import { createServer } from "node:http"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { resolveChromiumExecutablePath } from "./brief/chromium.mjs"
import { parseDesignVocabulary } from "./lib/design-vocabulary.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function fail(message) {
    console.error(`verify-preset-remix: ${message}`)
    process.exit(1)
}

function parseArgs(argv) {
    const options = {
        landing: path.join(ROOT, "repobot.landing.json"),
        theme: path.join(ROOT, "repobot.theme.json"),
        modes: ["native"],
        floor: 3,
    }
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index]
        const value = () => argv[++index] ?? fail(`${arg} needs a value`)
        if (arg === "--build") options.build = path.resolve(value())
        else if (arg === "--landing") options.landing = path.resolve(value())
        else if (arg === "--theme") options.theme = path.resolve(value())
        else if (arg === "--presets") options.presets = value().split(",").filter(Boolean)
        else if (arg === "--modes") options.modes = value().split(",").filter(Boolean)
        else if (arg === "--floor") options.floor = Number(value())
        else if (arg === "--shots") options.shots = path.resolve(value())
        else fail(`unknown option ${arg}`)
    }
    if (options.build === undefined || !existsSync(path.join(options.build, "index.html"))) {
        fail("usage: node scripts/verify-preset-remix.mjs --build <vite build dir> [options]")
    }
    return options
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
    ".woff2": "font/woff2",
    ".woff": "font/woff",
}

function serveStatic(publicDir) {
    const server = createServer((request, response) => {
        const url = new URL(request.url ?? "/", "http://localhost")
        let filePath = path.join(publicDir, path.normalize(decodeURIComponent(url.pathname)))
        if (!filePath.startsWith(publicDir)) {
            response.writeHead(403).end()
            return
        }
        if (existsSync(filePath) && statSync(filePath).isDirectory())
            filePath = path.join(filePath, "index.html")
        // SPA fallback: every route is the bundle's index.
        if (!existsSync(filePath)) filePath = path.join(publicDir, "index.html")
        response.writeHead(200, {
            "content-type": CONTENT_TYPES[path.extname(filePath)] ?? "application/octet-stream",
        })
        createReadStream(filePath).pipe(response)
    })
    return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)))
}

async function openBrowser() {
    let chromium
    try {
        chromium = createRequire(path.join(ROOT, "firebase", "functions", "package.json"))(
            "playwright-core",
        ).chromium
    } catch {
        fail("playwright-core is not installed (npm install)")
    }
    const cdpUrl = process.env.BRIEF_BROWSER_CDP_URL
    if (cdpUrl !== undefined && cdpUrl !== "") return chromium.connectOverCDP(cdpUrl)
    const executablePath = resolveChromiumExecutablePath()
    if (executablePath === undefined)
        fail("no Chromium found (install Chrome/Chromium or set DOCUMENTS_CHROMIUM_PATH)")
    return chromium.launch({ headless: true, executablePath })
}

/** Runs in the page: what a visitor would see go wrong. */
function probe(floor) {
    const root = document.querySelector("[data-marketing-preset]")
    const result = {
        preset: root?.getAttribute("data-marketing-preset") ?? null,
        mode: root?.getAttribute("data-marketing-mode") ?? null,
    }
    const scrollable = !["hidden", "clip"].includes(getComputedStyle(document.documentElement).overflowX)
    result.overflowX = scrollable
        ? Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth
        : 0

    const styles = root === null ? null : getComputedStyle(root)
    const declared = new Map()
    document.fonts.forEach((face) => {
        const family = face.family.replace(/^['"]|['"]$/g, "")
        declared.set(family, [...(declared.get(family) ?? []), face.status])
    })
    result.fonts = ["--marketing-font-display", "--marketing-font-body", "--marketing-font-script"]
        .map((name) => styles?.getPropertyValue(name).trim())
        .filter(Boolean)
        .map((stack) =>
            stack
                .split(",")[0]
                .trim()
                .replace(/^['"]|['"]$/g, ""),
        )
        .map((family) => ({ family, status: declared.get(family) ?? null }))

    const parse = (color) => {
        const match = color.match(/rgba?\(([^)]+)\)/)
        if (!match) return null
        const parts = match[1]
            .split(/[ ,/]+/)
            .filter(Boolean)
            .map(Number)
        return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 }
    }
    const luminance = ({ r, g, b }) => {
        const channel = (value) => {
            const scaled = value / 255
            return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4
        }
        return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
    }
    const media = Array.from(document.querySelectorAll("img, video, picture, svg image"))
        .map((element) => element.getBoundingClientRect())
        .filter((rect) => rect.width > 40 && rect.height > 40)
    const overMedia = (rect) =>
        media.some(
            (m) => rect.left < m.right && rect.right > m.left && rect.top < m.bottom && rect.bottom > m.top,
        )
    const groundOf = (element) => {
        const layers = []
        for (let node = element; node; node = node.parentElement) {
            const style = getComputedStyle(node)
            if (style.backgroundImage !== "none") return null
            const color = parse(style.backgroundColor)
            if (color && color.a > 0) {
                layers.push(color)
                if (color.a >= 0.99) break
            }
        }
        let base = { r: 255, g: 255, b: 255 }
        for (const layer of layers.reverse()) {
            base = {
                r: layer.r * layer.a + base.r * (1 - layer.a),
                g: layer.g * layer.a + base.g * (1 - layer.a),
                b: layer.b * layer.a + base.b * (1 - layer.a),
            }
        }
        return base
    }
    const low = []
    const seen = new Set()
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) {
        const text = walker.currentNode
        const element = text.parentElement
        if (!text.textContent.trim() || element === null || seen.has(element)) continue
        seen.add(element)
        const rect = element.getBoundingClientRect()
        if (rect.bottom <= 0 || rect.top >= window.innerHeight || rect.width === 0 || rect.height === 0)
            continue
        const style = getComputedStyle(element)
        if (
            style.visibility === "hidden" ||
            Number(style.opacity) < 0.2 ||
            element.closest("[aria-hidden='true']")
        )
            continue
        if (/rgba?\([^)]*,\s*0\)/.test(style.webkitTextFillColor ?? "")) continue
        if (overMedia(rect)) continue
        const ink = parse(style.color)
        const ground = groundOf(element)
        if (ink === null || ground === null || ink.a < 0.3) continue
        const mixed = {
            r: ink.r * ink.a + ground.r * (1 - ink.a),
            g: ink.g * ink.a + ground.g * (1 - ink.a),
            b: ink.b * ink.a + ground.b * (1 - ink.a),
        }
        const [light, dark] = [luminance(mixed), luminance(ground)].sort((x, y) => y - x)
        const ratio = (light + 0.05) / (dark + 0.05)
        if (ratio < floor) low.push(`"${text.textContent.trim().slice(0, 32)}" ${ratio.toFixed(2)}:1`)
    }
    result.lowContrast = low
    return result
}

const options = parseArgs(process.argv.slice(2))
const vocabulary = parseDesignVocabulary(ROOT)
const presets = options.presets ?? vocabulary.stylePresets
for (const preset of presets) {
    if (!vocabulary.stylePresets.includes(preset)) fail(`unknown preset '${preset}'`)
}
const presetsSource = readFileSync(
    path.join(ROOT, "web/design-system/src/marketing/theme/marketingPresets.ts"),
    "utf8",
)
const nativeModes = new Map(
    [...presetsSource.matchAll(/\n {4}"?([a-z-]+)"?: \{\n {8}nativeMode: "(light|dark)"/g)].map(
        ([, name, mode]) => [name, mode],
    ),
)
const landing = JSON.parse(readFileSync(options.landing, "utf8"))
const theme = JSON.parse(readFileSync(options.theme, "utf8"))

function overlay(preset, mode) {
    const documents = { "repobot.landing.json": { ...landing, style: { ...(landing.style ?? {}), preset } } }
    const appearance = mode === "native" ? nativeModes.get(preset) : mode
    if (appearance === "light" || appearance === "dark")
        documents["repobot.theme.json"] = { ...theme, mode: appearance }
    const json = JSON.stringify(documents).replace(/</g, "\\u003c")
    return `<script type="application/json" id="repobot-site-config">${json}</script>`
}

if (options.shots !== undefined) mkdirSync(options.shots, { recursive: true })
const server = await serveStatic(options.build)
const port = server.address().port
const browser = await openBrowser()

let failures = 0
for (const preset of presets) {
    for (const mode of options.modes) {
        const label = `${preset}${mode === "native" ? "" : `/${mode}`}`
        const context = await browser.newContext({
            viewport: { width: 1200, height: 900 },
            reducedMotion: "reduce",
        })
        await context.route(/^https?:\/\/(?!127\.0\.0\.1)(?!fonts\.(googleapis|gstatic)\.com)/, (route) =>
            route.abort(),
        )
        await context.route(new RegExp(`^http://127\\.0\\.0\\.1:${port}/(\\?.*)?$`), async (route) => {
            const response = await route.fetch()
            const html = (await response.text()).replace("<head>", `<head>${overlay(preset, mode)}`)
            await route.fulfill({
                response,
                body: html,
                headers: { ...response.headers(), "content-type": "text/html" },
            })
        })
        const page = await context.newPage()
        const errors = []
        page.on("pageerror", (error) => errors.push(String(error?.message ?? error).split("\n")[0]))
        page.on("console", (message) => {
            if (message.type() === "error") errors.push(message.text().split("\n")[0])
        })
        const problems = []
        try {
            await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "load", timeout: 30000 })
            await page.waitForSelector("[data-marketing-preset]", { timeout: 10000 })
            await page.evaluate(async () => {
                await document.fonts.ready
                document
                    .querySelectorAll("[data-mkreveal]")
                    .forEach((element) => element.setAttribute("data-mkreveal", "in"))
            })
            await page.waitForTimeout(400)
            const result = await page.evaluate(probe, options.floor)
            if (result.preset !== preset) problems.push(`renders "${result.preset}"`)
            if (result.overflowX > 0) problems.push(`scrolls sideways by ${result.overflowX}px`)
            for (const { family, status } of result.fonts) {
                if (status === null) problems.push(`face '${family}' is not registered`)
                else if (status.includes("error")) problems.push(`face '${family}' failed to load`)
            }
            if (result.lowContrast.length > 0) {
                problems.push(`text under ${options.floor}:1 — ${result.lowContrast.slice(0, 4).join(", ")}`)
            }
            if (options.shots !== undefined) {
                await page.screenshot({
                    path: path.join(options.shots, `${preset}${mode === "native" ? "" : `-${mode}`}.png`),
                })
            }
        } catch (error) {
            problems.push(String(error?.message ?? error).split("\n")[0])
        }
        problems.push(...errors.map((error) => `error: ${error}`))
        if (problems.length === 0) {
            console.log(`ok   ${label}`)
        } else {
            failures += 1
            console.error(`FAIL ${label}: ${problems.join("; ")}`)
        }
        await context.close()
    }
}

await browser.close()
server.close()
process.exit(failures > 0 ? 1 : 0)
