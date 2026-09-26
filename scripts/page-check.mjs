#!/usr/bin/env node
// Load routes in a real browser and report what broke — the sanctioned way
// to answer "does this page actually work?" without hand-rolling browser
// automation. (A setup agent once burned a whole run improvising playwright
// installs three different ways; the browser it needed was on the pod all
// along.) Uses the same machinery as the brief runner: the functions
// workspace's playwright-core, the shared Chromium resolver, and
// BRIEF_BROWSER_CDP_URL to attach to the pod's already-running browser.
//
//   npm run page:check -- /pong [/about ...] [--base-url http://127.0.0.1:5173]
//                       [--screenshot-dir .dev/page-check] [--settle-ms 750]
//                       [--width 1440] [--compare path/to/design.png]
//
// Per route: uncaught page exceptions, console.error output, failed/5xx
// network requests (4xx reported as warnings), and a full-page screenshot.
// Exits 1 when any route has errors, 0 when all routes are clean.
//
// --width sets the viewport width (match the design's: ~1440 desktop, ~390
// phone). --compare composites the given design image and the fresh
// screenshot side by side into one labeled PNG — differences are far easier
// to spot inside a single image than across two separate reads.

import { mkdirSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { defaultBaseUrl, probeDevStackIdentity } from "./brief/check.mjs"
import { resolveChromiumExecutablePath } from "./brief/chromium.mjs"

function fail(message) {
    console.error(`page-check: ${message}`)
    process.exit(1)
}

function parseArgs(argv) {
    const routes = []
    const options = { screenshotDir: ".dev/page-check", settleMs: 750 }
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index]
        if (arg === "--base-url") options.baseUrl = argv[++index]
        else if (arg === "--screenshot-dir") options.screenshotDir = argv[++index]
        else if (arg === "--settle-ms") options.settleMs = Number(argv[++index])
        else if (arg === "--width") options.width = Number(argv[++index])
        else if (arg === "--compare") options.compare = argv[++index]
        else if (arg.startsWith("--")) fail(`unknown option ${arg}`)
        else routes.push(arg.startsWith("/") ? arg : `/${arg}`)
    }
    if (routes.length === 0) {
        fail(
            "usage: npm run page:check -- /route [/route2 ...] [--base-url URL] — see the header of scripts/page-check.mjs",
        )
    }
    return { routes, options }
}

async function openBrowser(rootDir) {
    let chromium
    try {
        const requireFromFunctions = createRequire(
            path.join(rootDir, "firebase", "functions", "package.json"),
        )
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

async function checkRoute(context, route, { baseUrl, screenshotDir, settleMs, width }) {
    const page = await context.newPage()
    if (Number.isFinite(width) && width > 0) {
        await page.setViewportSize({ width, height: Math.round(width * 0.625) })
    }
    const pageErrors = []
    const consoleErrors = []
    const failedRequests = []
    const warnings = []
    page.on("pageerror", (error) => pageErrors.push(String(error?.message ?? error).split("\n")[0]))
    page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text().split("\n")[0])
    })
    page.on("requestfailed", (request) => {
        failedRequests.push(
            `${request.method()} ${request.url()} — ${request.failure()?.errorText ?? "failed"}`,
        )
    })
    page.on("response", (response) => {
        if (response.status() >= 500) {
            failedRequests.push(
                `${response.request().method()} ${response.url()} — HTTP ${response.status()}`,
            )
        } else if (response.status() >= 400) {
            warnings.push(`${response.request().method()} ${response.url()} — HTTP ${response.status()}`)
        }
    })
    let screenshot
    try {
        await page.goto(`${baseUrl.replace(/\/$/, "")}${route}`, { waitUntil: "load", timeout: 30_000 })
        // Post-load settle: SPAs render (and crash) after `load` fires.
        await page.waitForTimeout(settleMs)
        mkdirSync(screenshotDir, { recursive: true })
        screenshot = path.join(
            screenshotDir,
            `${route.replace(/\W+/g, "-").replace(/^-|-$/g, "") || "root"}.png`,
        )
        await page.screenshot({ path: screenshot, fullPage: true })
    } catch (error) {
        pageErrors.push(`navigation failed: ${String(error?.message ?? error).split("\n")[0]}`)
    } finally {
        await page.close()
    }
    return { route, pageErrors, consoleErrors, failedRequests, warnings, screenshot }
}

function loadSharp(rootDir) {
    try {
        return createRequire(path.join(rootDir, "package.json"))("sharp")
    } catch {
        try {
            return createRequire(import.meta.url)("sharp")
        } catch {
            return undefined
        }
    }
}

// Composite the design reference (left) and the fresh screenshot (right)
// into one labeled PNG. Reading a single side-by-side image beats flipping
// between two files when hunting for layout/type/color mismatches.
async function writeComparison(sharp, designPath, screenshotPath, outPath) {
    const paneWidth = 720
    const labelHeight = 36
    const label = (text) =>
        Buffer.from(
            `<svg width="${paneWidth}" height="${labelHeight}"><rect width="100%" height="100%" fill="#111111"/>` +
                `<text x="12" y="25" font-family="sans-serif" font-size="18" font-weight="bold" fill="#ffffff">${text}</text></svg>`,
        )
    const pane = async (file, text) => {
        const image = await sharp(file).resize({ width: paneWidth }).png().toBuffer()
        const { height } = await sharp(image).metadata()
        return {
            height: height + labelHeight,
            buffer: await sharp({
                create: {
                    width: paneWidth,
                    height: height + labelHeight,
                    channels: 3,
                    background: "#111111",
                },
            })
                .composite([
                    { input: label(text), top: 0, left: 0 },
                    { input: image, top: labelHeight, left: 0 },
                ])
                .png()
                .toBuffer(),
        }
    }
    const design = await pane(designPath, "DESIGN (target)")
    const build = await pane(screenshotPath, "BUILD (current)")
    await sharp({
        create: {
            width: paneWidth * 2 + 12,
            height: Math.max(design.height, build.height),
            channels: 3,
            background: "#333333",
        },
    })
        .composite([
            { input: design.buffer, top: 0, left: 0 },
            { input: build.buffer, top: 0, left: paneWidth + 12 },
        ])
        .png()
        .toFile(outPath)
}

async function main() {
    const { routes, options } = parseArgs(process.argv.slice(2))
    const rootDir = process.cwd()
    const baseUrl = options.baseUrl ?? process.env.BRIEF_BASE_URL ?? defaultBaseUrl(rootDir)
    const identityProblem = await probeDevStackIdentity(baseUrl, rootDir)
    if (identityProblem !== undefined) {
        fail(identityProblem)
    }
    const browser = await openBrowser(rootDir)
    // Isolated context: never the streamed preview's own tab or session.
    const context = await browser.newContext()
    let failures = 0
    try {
        for (const route of routes) {
            const report = await checkRoute(context, route, { ...options, baseUrl })
            const broken =
                report.pageErrors.length > 0 ||
                report.consoleErrors.length > 0 ||
                report.failedRequests.length > 0
            failures += broken ? 1 : 0
            console.log(`${broken ? "FAIL" : "ok  "} ${report.route}`)
            for (const error of report.pageErrors) console.log(`      pageerror: ${error}`)
            for (const error of report.consoleErrors) console.log(`      console.error: ${error}`)
            for (const request of report.failedRequests) console.log(`      request: ${request}`)
            for (const warning of report.warnings) console.log(`      warn: ${warning}`)
            if (report.screenshot) console.log(`      screenshot: ${report.screenshot}`)
            if (report.screenshot && options.compare !== undefined) {
                const sharp = loadSharp(rootDir)
                if (sharp === undefined) {
                    console.log("      warn: --compare skipped (sharp is not installed)")
                } else {
                    const comparePath = report.screenshot.replace(/\.png$/, "-vs-design.png")
                    await writeComparison(sharp, options.compare, report.screenshot, comparePath)
                    console.log(`      compare: ${comparePath} (design left, build right)`)
                }
            }
        }
    } finally {
        await context.close()
        await browser.close()
    }
    process.exit(failures > 0 ? 1 : 0)
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)))
