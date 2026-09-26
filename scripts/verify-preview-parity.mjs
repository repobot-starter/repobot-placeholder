#!/usr/bin/env node
// The proxied-preview parity gate: prove every approved pack survives being
// viewed the way customers actually view it — through the platform's
// workspace preview gateway, where the page origin is NOT the pod, so any
// absolute loopback URL baked into the client bundle is unreachable (the
// viewer's own machine answers 127.0.0.1, not the pod's emulator). That
// exact escape shipped once: the first dashboard pack's GraphQL URL was
// absolute, sign-in "worked" (client-local), and every data fetch died with
// "Failed to fetch" — discovered by a user, not a gate. This script
// reproduces the gateway condition deterministically by ABORTING every
// browser request to a loopback origin other than the dev server itself,
// then walking each approved pack: landing renders, local sign-in lands,
// and the signed-in surface makes it through without a single escape.
//
//   node scripts/verify-preview-parity.mjs [pack-key ...]
//                                          [--base-url http://127.0.0.1:5173]
//
// Needs the running dev stack (npm run dev:up) — the same machinery
// page-check uses (functions workspace playwright-core, shared Chromium
// resolver, BRIEF_BROWSER_CDP_URL when a pod browser is already running).
// Packs default to packs/approved.json, so approving a pack automatically
// puts it under this gate. Each pack is activated via the same flip the
// Template Studio uses and the originally active pack is restored on exit.
//
// Failure signals, per pack:
//   escape:    a request to a loopback origin other than the dev server —
//              the class of bug this gate exists for (aborted, listed).
//   pageerror: an uncaught exception while rendering.
//   request:   a failed or 5xx backend (__request__api) request.
//   flow:      sign-in did not leave /login, or the page shows the global
//              "Failed to fetch"-style error surface.

import { execFileSync } from "node:child_process"
import { mkdirSync, readFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { defaultBaseUrl, probeDevStackIdentity } from "./brief/check.mjs"
import { resolveChromiumExecutablePath } from "./brief/chromium.mjs"

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"])
const SCREENSHOT_DIR = ".dev/preview-parity"

function fail(message) {
    console.error(`verify-preview-parity: ${message}`)
    process.exit(1)
}

function parseArgs(argv) {
    const packs = []
    const options = {}
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index]
        if (arg === "--base-url") options.baseUrl = argv[++index]
        else if (arg.startsWith("--")) fail(`unknown option ${arg}`)
        else packs.push(arg)
    }
    return { packs, options }
}

function approvedPacks(rootDir) {
    const manifestPath = path.join(rootDir, "packs", "approved.json")
    try {
        const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
        if (Array.isArray(manifest.packs) && manifest.packs.length > 0) {
            return manifest.packs
        }
    } catch {
        // Fall through to the failure below.
    }
    fail(`could not read the approved pack list from ${manifestPath}`)
}

function activePack(rootDir) {
    try {
        const manifest = JSON.parse(readFileSync(path.join(rootDir, "packs", "active.json"), "utf8"))
        return typeof manifest.key === "string" ? manifest.key : "blank"
    } catch {
        return "blank"
    }
}

function switchPack(rootDir, key) {
    execFileSync("node", [path.join(rootDir, "scripts", "lib", "pack-switch.mjs"), key], {
        cwd: rootDir,
        stdio: ["ignore", "ignore", "inherit"],
    })
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

/**
 * The gateway simulation: any request to a loopback origin that is not the
 * dev server itself is exactly what a proxied preview cannot reach, so it
 * is recorded as an escape and aborted. Public origins (font CDNs etc.)
 * pass through — the viewer's browser reaches those fine.
 */
async function installGatewayGuard(context, baseOrigin, escapes) {
    await context.route("**/*", (route) => {
        let url
        try {
            url = new URL(route.request().url())
        } catch {
            return route.continue()
        }
        if (LOOPBACK_HOSTS.has(url.hostname) && url.origin !== baseOrigin) {
            escapes.push(`${route.request().method()} ${url.href}`)
            return route.abort("connectionrefused")
        }
        return route.continue()
    })
}

async function checkPack(browser, packKey, baseUrl) {
    const escapes = []
    const pageErrors = []
    const failedRequests = []
    const flowErrors = []
    const context = await browser.newContext()
    await installGatewayGuard(context, new URL(baseUrl).origin, escapes)
    const page = await context.newPage()
    page.on("pageerror", (error) => pageErrors.push(String(error?.message ?? error).split("\n")[0]))
    /* The analytics pageview beacon is fire-and-forget BY CONTRACT
     * (web/core AnalyticsBeacon.ts): the client swallows every failure and
     * the handler itself answers 204 even when recording fails
     * (CloudFunctions/Analytics.ts) — a beacon failure can never surface on
     * the page this gate is judging. The only 5xx that endpoint can produce
     * comes from the emulator layer under CI load (a recycled worker or a
     * crossed timeout answers HTTP 500 — the same starvation mode the
     * apiProxy socket cap in web/app/vite.config.ts exists to soften), and
     * one such transient once failed a green pack's walk. Data-bearing
     * requests (GraphQL, storage) keep failing the gate; and a beacon that
     * ESCAPES to a loopback origin still fails via the route guard above —
     * this exemption never excuses an absolute-URL regression. */
    const isAnalyticsBeacon = (url) => url.includes("analytics__request__api")
    page.on("requestfailed", (request) => {
        if (!request.url().includes("__request__api") || isAnalyticsBeacon(request.url())) {
            return
        }
        const errorText = request.failure()?.errorText ?? "failed"
        // ERR_ABORTED is our own navigation cutting off an in-flight
        // request — an unreachable backend fails with connection errors
        // instead. Guard-aborted escapes are already recorded above.
        if (errorText === "net::ERR_ABORTED") {
            return
        }
        if (!escapes.some((escape) => escape.endsWith(request.url()))) {
            failedRequests.push(`${request.method()} ${request.url()} — ${errorText}`)
        }
    })
    page.on("response", (response) => {
        if (
            response.status() >= 500 &&
            response.url().includes("__request__api") &&
            !isAnalyticsBeacon(response.url())
        ) {
            failedRequests.push(
                `${response.request().method()} ${response.url()} — HTTP ${response.status()}`,
            )
        }
    })
    let screenshot
    try {
        // Landing: the surface every visitor hits.
        await page.goto(`${baseUrl}/`, { waitUntil: "load", timeout: 30_000 })
        await page.waitForTimeout(1_000)

        // Sign in as the local dev user, the way a user previews the
        // dashboard from the workspace: through the login page's sandbox
        // skip. Signed-in views are where backend fetches concentrate.
        await page.goto(`${baseUrl}/login`, { waitUntil: "load", timeout: 30_000 })
        // Routes are lazy-imported; a cold pack flip can spend many seconds
        // in the Suspense spinner before the login surface renders. Two valid
        // outcomes: the sandbox skip appears (the ordinary sign-out state), or
        // /login bounces straight into the app — packs without marketing pages
        // (entry, agent) session the visitor on the home route the harness
        // already hit, and LoginPage redirects a signed-in session away. The
        // bounce IS the signed-in surface this step exists to reach.
        const skip = page.getByText("Skip as local dev user").first()
        let signInOutcome
        try {
            signInOutcome = await Promise.any([
                skip.waitFor({ state: "visible", timeout: 30_000 }).then(() => "skip"),
                page
                    .waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 30_000 })
                    .then(() => "already-signed-in"),
            ])
        } catch {
            flowErrors.push("no local sign-in appeared on /login (expected sandbox auth mode)")
        }
        if (signInOutcome === "skip") {
            await skip.click()
            await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
                timeout: 15_000,
            })
        }
        if (signInOutcome !== undefined) {
            // Let the post-auth surface issue its data fetches.
            await page.waitForTimeout(2_500)
        }

        // The global error surface is where a dead backend shows up even
        // when nothing throws: "Failed to fetch" from the Apollo link.
        const bodyText = await page.evaluate(() => document.body.innerText)
        if (/Failed to fetch|Failed to load/i.test(bodyText)) {
            flowErrors.push('page shows a "Failed to fetch/load" error surface')
        }

        mkdirSync(SCREENSHOT_DIR, { recursive: true })
        screenshot = path.join(SCREENSHOT_DIR, `${packKey}.png`)
        await page.screenshot({ path: screenshot, fullPage: false })
    } catch (error) {
        flowErrors.push(`navigation failed: ${String(error?.message ?? error).split("\n")[0]}`)
    } finally {
        await context.close()
    }
    return { packKey, escapes, pageErrors, failedRequests, flowErrors, screenshot }
}

async function main() {
    const { packs: requestedPacks, options } = parseArgs(process.argv.slice(2))
    const rootDir = process.cwd()
    const packs = requestedPacks.length > 0 ? requestedPacks : approvedPacks(rootDir)
    const baseUrl = (options.baseUrl ?? process.env.BRIEF_BASE_URL ?? defaultBaseUrl(rootDir)).replace(
        /\/$/,
        "",
    )
    const identityProblem = await probeDevStackIdentity(baseUrl, rootDir)
    if (identityProblem !== undefined) {
        fail(identityProblem)
    }
    const originalPack = activePack(rootDir)
    const browser = await openBrowser(rootDir)
    let failures = 0
    try {
        for (const packKey of packs) {
            switchPack(rootDir, packKey)
            // The dev server's manifest stat-poller (300ms) plus module
            // warmup need a beat before the flip is fully served.
            await new Promise((resolve) => setTimeout(resolve, 2_000))
            const report = await checkPack(browser, packKey, baseUrl)
            const broken =
                report.escapes.length > 0 ||
                report.pageErrors.length > 0 ||
                report.failedRequests.length > 0 ||
                report.flowErrors.length > 0
            failures += broken ? 1 : 0
            console.log(`${broken ? "FAIL" : "ok  "} ${packKey}`)
            for (const escape of report.escapes) console.log(`      escape: ${escape}`)
            for (const error of report.pageErrors) console.log(`      pageerror: ${error}`)
            for (const request of report.failedRequests) console.log(`      request: ${request}`)
            for (const error of report.flowErrors) console.log(`      flow: ${error}`)
            if (report.screenshot) console.log(`      screenshot: ${report.screenshot}`)
        }
    } finally {
        try {
            switchPack(rootDir, originalPack)
        } catch (error) {
            console.error(`verify-preview-parity: failed to restore pack "${originalPack}": ${String(error)}`)
        }
        await browser.close()
    }
    if (failures > 0) {
        console.error(
            `verify-preview-parity: ${failures} pack(s) failed — an "escape" means the client` +
                " bundle reaches for a loopback URL a proxied preview cannot resolve" +
                " (serve APIs same-origin; see apiProxy in web/app/vite.config.ts).",
        )
    }
    process.exit(failures > 0 ? 1 : 0)
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)))
