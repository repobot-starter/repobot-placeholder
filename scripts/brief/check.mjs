// The brief runner (docs/brief-spec.md Phase 2): evaluates every ask in
// repobot.brief.json and reports per-ask status. Status is derived, never
// stored — this runner (not agent self-report) is the source of truth for
// whether the repo honors its promise ledger.
//
//   node scripts/brief/check.mjs [--brief <path>] [--base-url <url>]
//                                [--report-dir <dir>] [--skip-gates]
//                                [--skip-screenshots] [--with-screenshots]
//                                [--vocabulary]
//
// --skip-gates reports gate-passes assertions as "blocked" instead of
// spawning them — for cheap mid-run checks (a pod polling while the setup
// agent works) where running the full quality gate every pass would be
// prohibitive. The final check always runs without it.
//
// --skip-screenshots reports screenshot assertions as "blocked" without
// visiting their routes and drops first-look captures — the browser only
// launches if functional assertions (route-renders / content-present) need
// it. Mid-run passes use this: captures are evidence for the design judge
// and progress candy for the gallery, neither of which a reconcile loop
// needs. --with-screenshots forces captures on; with neither flag the
// BRIEF_SCREENSHOTS env decides ("off" skips, anything else captures).
//
// Env: BRIEF_BASE_URL (dev server URL when --base-url is not passed);
// BRIEF_BROWSER_CDP_URL (attach to an existing Chromium over CDP instead of
// launching one — pods share the streamed preview's browser this way);
// BRIEF_SCREENSHOTS ("off" to skip captures when no screenshot flag is
// passed — the platform's kill switch for all pod screenshotting).
//
// Output: JSON report on stdout, human summary on stderr. Exit 0 unless a
// checkable ask FAILS. Assertions whose dependency is unavailable (dev stack
// down for browser checks, database down for GraphQL checks, repo not
// composed for deploy-manifest checks) report "blocked", not "fail".
//
// Run: npm run brief:check
// Test: npm run test:brief

import { execFileSync, spawnSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { cacheableTreeHash, readGateCache, recordGatePass } from "./gate-cache.mjs"
import { BRIEF_VOCABULARY, resolveManifestPointer, validateBrief } from "./schema.mjs"
import { resolveChromiumExecutablePath } from "./chromium.mjs"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")

// ---------------------------------------------------------------------------
// Adapters. Each takes assertion objects and returns
// { status: "pass" | "fail" | "blocked", detail?: string } per assertion.
// ---------------------------------------------------------------------------

/** manifest-entry / capability-declared: reads root manifests directly. */
export function checkManifestAssertion(assertion, rootDir) {
    const manifestName =
        assertion.assert === "capability-declared" ? "repobot.deploy.json" : assertion.manifest
    const manifestPath = path.join(rootDir, manifestName)
    if (!existsSync(manifestPath)) {
        // A missing deploy manifest means the repo has not been composed for a
        // project yet — that is an environment state, not a broken promise.
        return { status: "blocked", detail: `${manifestName} does not exist (repo not composed)` }
    }
    let manifest
    try {
        manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
    } catch {
        return { status: "fail", detail: `${manifestName} is not valid JSON` }
    }
    if (assertion.assert === "capability-declared") {
        const capabilities = manifest.capabilities ?? []
        return Array.isArray(capabilities) && capabilities.includes(assertion.capability)
            ? { status: "pass" }
            : { status: "fail", detail: `capability ${assertion.capability} not declared in ${manifestName}` }
    }
    const value = resolveManifestPointer(manifest, assertion.pointer)
    return value !== undefined
        ? { status: "pass" }
        : { status: "fail", detail: `pointer "${assertion.pointer}" does not resolve in ${manifestName}` }
}

/**
 * gate-passes: spawns the named npm script at the repo root.
 *
 * Passing results are cached keyed by the working tree's content hash (see
 * gate-cache.mjs — the gate scripts themselves record passes into the same
 * cache): the setup agent's evidence pass and the platform's post-run
 * verification run the identical gate on identical content minutes apart,
 * and the second pass was ~19% of a whole content-tier setup run (bench,
 * 2026-07-26). Only passes cache — failures always re-run — and a gate
 * that mutates the tree (regenerated output) invalidates its own cache
 * entry by changing the hash.
 */
export function checkGateAssertion(assertion, rootDir) {
    const treeHash = cacheableTreeHash(rootDir)
    if (treeHash) {
        const cached = readGateCache(rootDir)[assertion.gate]
        if (cached?.tree === treeHash && cached.status === "pass") {
            return {
                status: "pass",
                detail: `npm run ${assertion.gate} passed on this exact tree at ${cached.at} (cached)`,
            }
        }
    }
    const result = spawnSync("npm", ["run", assertion.gate], {
        cwd: rootDir,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
    })
    if (result.status === 0) {
        // recordGatePass re-hashes after the run: the gate itself may have
        // dirtied the tree (regenerated codegen output), in which case the
        // result is real but not cacheable.
        recordGatePass(rootDir, assertion.gate, treeHash)
        return { status: "pass" }
    }
    const tail = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim().split("\n").slice(-12).join("\n")
    return { status: "fail", detail: `npm run ${assertion.gate} exited ${result.status}:\n${tail}` }
}

/**
 * query-returns / mutation-roundtrip: delegated in one batch to the
 * functions-side script, which boots the in-process Apollo server against
 * the dev database (firebase/functions/scripts/brief-gql.ts).
 */
export function checkGqlAssertions(assertions, rootDir) {
    const functionsDir = path.join(rootDir, "firebase", "functions")
    // Invoke the local tsx binary directly when present: this runs on every
    // brief:check with GraphQL asserts, and npx's resolution adds a few
    // hundred ms per call for nothing. npx stays as the fallback for trees
    // with unusual hoisting.
    const tsxBin = [
        path.join(rootDir, "node_modules", ".bin", "tsx"),
        path.join(functionsDir, "node_modules", ".bin", "tsx"),
    ].find((candidate) => existsSync(candidate))
    const gqlArgs = ["scripts/brief-gql.ts", JSON.stringify(assertions)]
    const [command, commandArgs] = tsxBin ? [tsxBin, gqlArgs] : ["npx", ["tsx", ...gqlArgs]]
    let stdout
    try {
        stdout = execFileSync(command, commandArgs, {
            cwd: functionsDir,
            encoding: "utf8",
            stdio: ["ignore", "pipe", "pipe"],
            maxBuffer: 16 * 1024 * 1024,
            // brief-gql also self-primes; set it here so a stale template
            // copy that predates that fix still accepts sandbox local modes.
            env: { ...process.env, FUNCTIONS_EMULATOR: "true" },
        })
    } catch (error) {
        const detail = `brief-gql failed to run: ${String(error.stderr ?? error.message)
            .trim()
            .split("\n")
            .slice(-6)
            .join("\n")}`
        return assertions.map(() => ({ status: "blocked", detail }))
    }
    try {
        // The script prints exactly one JSON array as its final line.
        const lines = stdout.trim().split("\n")
        return JSON.parse(lines[lines.length - 1])
    } catch {
        return assertions.map(() => ({ status: "blocked", detail: "brief-gql produced no parseable report" }))
    }
}

/**
 * route-renders / content-present / screenshot: drives a real Chromium (via
 * the functions workspace's playwright-core) against the running dev stack —
 * the same app the user's preview shows, in a browser of the runner's own.
 *
 * Set BRIEF_BROWSER_CDP_URL to attach to an existing Chromium over CDP (an
 * isolated context, never the user's tab) instead of launching one — so a
 * pod that already runs a browser for the streamed preview shares it rather
 * than paying for a second instance.
 */
export async function checkBrowserAssertions(assertions, options) {
    const { rootDir, baseUrl, reportDir, skipScreenshots } = options
    const blockedAll = (detail) => assertions.map(() => ({ status: "blocked", detail }))

    // Skip mode: screenshot assertions resolve as blocked without visiting
    // their routes, and no first-look captures are taken. When nothing
    // functional (route-renders / content-present) remains, the browser —
    // and the dev-stack probe — never run at all.
    const screenshotSkipped = { status: "blocked", detail: "screenshot skipped (--skip-screenshots)" }
    if (skipScreenshots === true && assertions.every((assertion) => assertion.assert === "screenshot")) {
        return { results: assertions.map(() => ({ ...screenshotSkipped })), firstLooks: [] }
    }

    const identityProblem = await probeDevStackIdentity(baseUrl, rootDir)
    if (identityProblem !== undefined) {
        return blockedAll(identityProblem)
    }
    let chromium
    try {
        const requireFromFunctions = createRequire(
            path.join(rootDir, "firebase", "functions", "package.json"),
        )
        chromium = requireFromFunctions("playwright-core").chromium
    } catch {
        return blockedAll("playwright-core is not installed (npm install)")
    }

    const cdpUrl = process.env.BRIEF_BROWSER_CDP_URL
    let browser
    if (cdpUrl !== undefined && cdpUrl !== "") {
        try {
            browser = await chromium.connectOverCDP(cdpUrl)
        } catch (error) {
            return blockedAll(
                `could not attach to browser at BRIEF_BROWSER_CDP_URL: ${String(error?.message ?? error).split("\n")[0]}`,
            )
        }
    } else {
        const executablePath = resolveChromiumExecutablePath()
        if (executablePath === undefined) {
            // Steer agents to the system browser: a real run burned minutes
            // on `npx playwright install` when the fix was pointing the env
            // var at the Chromium already on the machine.
            return blockedAll(
                "no Chromium found — set DOCUMENTS_CHROMIUM_PATH to an installed Chrome/Chromium binary " +
                    "(e.g. /usr/bin/chromium). Do not run `npx playwright install`; " +
                    "this runner drives the system browser via playwright-core.",
            )
        }
        browser = await chromium.launch({ headless: true, executablePath })
    }

    const results = []
    // First-look captures: one full-page screenshot per route this pass
    // visits, taken regardless of the owning ask's outcome. Mid-run checks
    // ship these to the progress page, so the owner sees each page as it
    // starts rendering — long before its ask passes.
    const firstLooks = []
    const firstLookRoutes = new Set()
    const recordFirstLook = async (route, page) => {
        if (skipScreenshots === true || firstLookRoutes.has(route)) {
            return
        }
        firstLookRoutes.add(route)
        try {
            mkdirSync(reportDir, { recursive: true })
            const file = path.join(reportDir, `first-look-${routeSlug(route)}.png`)
            await page.screenshot({ path: file, fullPage: true })
            firstLooks.push({ path: route, file: path.relative(process.cwd(), file) })
        } catch {
            // First looks are progress candy, never evidence — a failed
            // capture must not disturb the assertion that owns the page.
        }
    }
    // An isolated context: cookies/storage never touch other sessions in a
    // shared (CDP-attached) browser, and pages never appear in the user's view.
    // Signed-in assertions (signedIn: true) run in a SECOND isolated context
    // that authenticates once via the sandbox's simulated sign-in, so
    // signed-out assertions (the login page screenshot included) never see
    // its session.
    const context = await browser.newContext()
    let signedInContext
    let signedInBlockedReason
    try {
        for (const assertion of assertions) {
            if (skipScreenshots === true && assertion.assert === "screenshot") {
                results.push({ ...screenshotSkipped })
                continue
            }
            if (assertion.signedIn === true) {
                if (signedInContext === undefined && signedInBlockedReason === undefined) {
                    signedInContext = await browser.newContext()
                    signedInBlockedReason = await signInSandboxUser(signedInContext, baseUrl)
                }
                if (signedInBlockedReason !== undefined) {
                    results.push({ status: "blocked", detail: signedInBlockedReason })
                    continue
                }
                results.push(
                    await runBrowserAssertion(signedInContext, assertion, {
                        baseUrl,
                        reportDir,
                        recordFirstLook,
                    }),
                )
                continue
            }
            results.push(
                await runBrowserAssertion(context, assertion, { baseUrl, reportDir, recordFirstLook }),
            )
        }
    } finally {
        await context.close()
        if (signedInContext !== undefined) {
            await signedInContext.close()
        }
        if (cdpUrl === undefined || cdpUrl === "") {
            await browser.close()
        }
    }
    return { results, firstLooks }
}

/** "/" -> "home", "/pricing/plans" -> "pricing-plans" — mirrors ask slugs. */
function routeSlug(route) {
    return route === "/" ? "home" : route.replaceAll("/", "-").replace(/^-/, "")
}

/**
 * Signs the context in as the sandbox's local dev user by driving the login
 * page's "Skip as local dev user" affordance — the exact path a human takes
 * in the workspace preview. Only exists when auth runs in local (simulated)
 * mode, so on a builtin-auth stack this returns a blocked-reason instead;
 * signed-in assertions are a sandbox capability by design (deployed
 * environments verify auth end-to-end through real sign-in, not here).
 * Returns undefined once the context holds a signed-in session.
 */
async function signInSandboxUser(context, baseUrl) {
    const page = await context.newPage()
    try {
        await page.goto(new URL("/login", baseUrl).toString(), {
            waitUntil: "networkidle",
            timeout: 30000,
        })
        const skip = page.getByRole("button", { name: "Skip as local dev user" })
        try {
            await skip.click({ timeout: 5000 })
        } catch {
            return (
                "signed-in assertions need the sandbox's simulated auth " +
                "(AUTH_MODE=local); the login page offered no local sign-in"
            )
        }
        // Sign-in lands back in the app: wait for the router to leave /login.
        await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 })
        return undefined
    } catch (error) {
        return `local sign-in failed: ${String(error?.message ?? error).split("\n")[0]}`
    } finally {
        await page.close()
    }
}

async function runBrowserAssertion(context, assertion, { baseUrl, reportDir, recordFirstLook }) {
    const page = await context.newPage()
    const pageErrors = []
    page.on("pageerror", (error) => pageErrors.push(String(error?.message ?? error)))
    try {
        const url = new URL(assertion.path, baseUrl).toString()
        // Gate on DOM readiness, not network silence: a dev server's HMR
        // chatter (recompile fetches after the agent's own edits) can keep
        // the network from ever settling, and a networkidle-gated goto then
        // times out — or races hydration and reads an empty page — failing
        // content checks whose text IS on the page. The idle wait remains as
        // best-effort polish so screenshots catch late images and fonts.
        const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 })
        if (response !== null && response.status() >= 400) {
            return { status: "fail", detail: `${assertion.path} responded ${response.status()}` }
        }
        // Hydration gate: React mounted something into #root. This replaces
        // the old one-shot empty-root probe, which could fire mid-recompile.
        const hydrated = await page
            .waitForFunction(() => (document.querySelector("#root")?.childElementCount ?? 0) > 0, undefined, {
                timeout: 15000,
            })
            .then(
                () => true,
                () => false,
            )
        if (!hydrated) {
            return { status: "fail", detail: `${assertion.path} rendered an empty root` }
        }
        await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {})
        // Captures are evidence the design judge scores, so wait out loading
        // UI first: the kernel's spinners (PageLoadingGate included) expose
        // role="status", and a cold dev server compiling a lazy route keeps
        // one up long after hydration — the old behavior photographed that
        // gray spinner and the judge failed every section as "missing".
        // Best-effort with a generous cap: a page may legitimately keep a
        // status region (a toast), so shoot anyway when the wait expires.
        const waitForLoadingUiToClear = async () => {
            await page
                .waitForFunction(
                    () =>
                        ![...document.querySelectorAll('[role="status"]')].some(
                            (element) => element.getClientRects().length > 0,
                        ),
                    undefined,
                    { timeout: 20000 },
                )
                .catch(() => {})
        }
        // Never record a redirected page as the route's first look: the
        // kernel's catch-all <Route path="*"> sends unregistered routes to
        // the default page, and a capture of that would show the wrong page
        // in the progress gallery.
        const landedPath = new URL(page.url()).pathname.replace(/\/+$/, "") || "/"
        const askedPath = String(assertion.path).replace(/\/+$/, "") || "/"
        if (recordFirstLook !== undefined && landedPath === askedPath) {
            await waitForLoadingUiToClear()
            await recordFirstLook(assertion.path, page)
        }

        if (assertion.assert === "screenshot") {
            await waitForLoadingUiToClear()
            mkdirSync(reportDir, { recursive: true })
            const file = path.join(reportDir, `${routeSlug(assertion.path)}.png`)
            await page.screenshot({ path: file, fullPage: true })
            return { status: "pass", detail: `saved ${path.relative(process.cwd(), file)}` }
        }

        if (pageErrors.length > 0) {
            return { status: "fail", detail: `page error on ${assertion.path}: ${pageErrors[0]}` }
        }

        if (assertion.assert === "route-renders" && landedPath !== askedPath) {
            // The kernel's catch-all <Route path="*"> redirects unknown
            // routes to the default page, which renders fine — so a 200 +
            // hydrated #root proves nothing about THIS route existing. A
            // real run asserted a dashboard route that was never scaffolded
            // and passed on the redirect target. Landing on a different
            // pathname than asserted means the route isn't registered.
            return {
                status: "fail",
                detail: `${assertion.path} redirected to ${landedPath} — the route isn't registered (unbuilt page?)`,
            }
        }

        if (assertion.assert === "content-present") {
            // Retry briefly instead of a one-shot innerText read: streamed
            // sections and post-hydration effects can land the text a beat
            // after mount.
            const found = await page
                .waitForFunction(
                    (needle) => document.body.innerText.toLowerCase().includes(needle),
                    assertion.text.toLowerCase(),
                    { timeout: 5000 },
                )
                .then(
                    () => true,
                    () => false,
                )
            return found
                ? { status: "pass" }
                : { status: "fail", detail: `"${assertion.text}" not found on ${assertion.path}` }
        }
        return { status: "pass" }
    } catch (error) {
        return {
            status: "fail",
            detail: `${assertion.path}: ${String(error?.message ?? error).split("\n")[0]}`,
        }
    } finally {
        await page.close()
    }
}

/**
 * Verifies the base URL serves THIS app before any page assertion runs. A
 * developer machine can host several dev servers (the platform's site, other
 * checkouts), and a shared pod hosts neighboring project workspaces on
 * nearby ports; checking a stranger would report false failures against
 * promises it never made. Two layers: the repobot-app meta tag in
 * web/app/index.html says "some repobot app", and its content attribute —
 * stamped with the project's identity at compose time — says WHICH one, so
 * a neighboring repobot project no longer sails through the probe. Returns
 * a blocked-reason, or undefined when healthy.
 */
const APP_MARKER_PATTERN = /name="repobot-app"[^>]*content="([^"]*)"/

// Exported for page-check.mjs, which fronts the same dev stack.
export async function probeDevStackIdentity(baseUrl, rootDir) {
    let body
    try {
        const response = await fetch(baseUrl, { signal: AbortSignal.timeout(3000) })
        body = await response.text()
    } catch {
        return `dev stack not reachable at ${baseUrl} (start it with: npm run dev:up)`
    }
    if (!body.includes('name="repobot-app"')) {
        return `${baseUrl} is serving a different app (no repobot-app marker) — pass --base-url or set BRIEF_BASE_URL to this repo's dev server`
    }
    const served = body.match(APP_MARKER_PATTERN)?.[1]
    let local
    try {
        local = readFileSync(path.join(rootDir, "web", "app", "index.html"), "utf8").match(
            APP_MARKER_PATTERN,
        )?.[1]
    } catch {
        local = undefined
    }
    if (served !== undefined && local !== undefined && served !== local) {
        return (
            `${baseUrl} is serving a DIFFERENT repobot project (marker "${served}"; this repo is "${local}") — ` +
            `another workspace owns that port. Pass --base-url or set BRIEF_BASE_URL to this repo's dev server`
        )
    }
    return undefined
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

const MANIFEST_ASSERTS = new Set(["manifest-entry", "capability-declared"])
const GQL_ASSERTS = new Set(["query-returns", "mutation-roundtrip"])
const BROWSER_ASSERTS = new Set(["route-renders", "content-present", "screenshot"])

/**
 * Evaluates every ask in the brief. `adapters` is injectable for tests; the
 * defaults execute for real. Returns the report object (never throws on
 * assertion failures — those are report content).
 */
export async function runBrief(brief, options = {}) {
    const rootDir = options.rootDir ?? repoRoot
    const adapters = {
        manifest: (assertion) => checkManifestAssertion(assertion, rootDir),
        gate: (assertion) =>
            options.skipGates === true
                ? { status: "blocked", detail: `npm run ${assertion.gate} skipped (--skip-gates)` }
                : checkGateAssertion(assertion, rootDir),
        gql: (assertions) => checkGqlAssertions(assertions, rootDir),
        browser: (assertions) =>
            checkBrowserAssertions(assertions, {
                rootDir,
                baseUrl: options.baseUrl ?? defaultBaseUrl(rootDir),
                reportDir: options.reportDir ?? path.join(rootDir, "brief-report"),
                skipScreenshots: options.skipScreenshots,
            }),
        ...options.adapters,
    }

    // Collect every executable assertion with its owning ask, so the gql and
    // browser adapters run as batches (one server boot, one browser).
    const planned = []
    for (const ask of brief.asks ?? []) {
        if (ask.tier === "compiled") {
            planned.push({
                ask,
                assertion: {
                    assert: "manifest-entry",
                    manifest: ask.realizedBy.manifest,
                    pointer: ask.realizedBy.pointer,
                },
                implicit: true,
            })
        } else {
            for (const assertion of ask.acceptance ?? []) {
                planned.push({ ask, assertion })
            }
        }
    }

    const gqlBatch = planned.filter((entry) => GQL_ASSERTS.has(entry.assertion.assert))
    const browserBatch = planned.filter((entry) => BROWSER_ASSERTS.has(entry.assertion.assert))
    const gqlResults = gqlBatch.length > 0 ? await adapters.gql(gqlBatch.map((entry) => entry.assertion)) : []
    // The browser adapter returns { results, firstLooks }; test adapters may
    // return a bare results array (no captures).
    const browserOutcome =
        browserBatch.length > 0 ? await adapters.browser(browserBatch.map((entry) => entry.assertion)) : []
    const browserResults = Array.isArray(browserOutcome) ? browserOutcome : browserOutcome.results
    const firstLooks = Array.isArray(browserOutcome) ? [] : (browserOutcome.firstLooks ?? [])

    for (const [index, entry] of gqlBatch.entries()) entry.result = gqlResults[index]
    for (const [index, entry] of browserBatch.entries()) entry.result = browserResults[index]
    for (const entry of planned) {
        if (entry.result !== undefined) continue
        if (MANIFEST_ASSERTS.has(entry.assertion.assert)) {
            entry.result = adapters.manifest(entry.assertion)
        } else if (entry.assertion.assert === "gate-passes") {
            entry.result = adapters.gate(entry.assertion)
        } else {
            entry.result = { status: "blocked", detail: `no adapter for ${entry.assertion.assert}` }
        }
    }

    const asks = (brief.asks ?? []).map((ask) => {
        const assertions = planned
            .filter((entry) => entry.ask === ask)
            .map((entry) => ({ ...entry.assertion, ...entry.result }))
        return {
            id: ask.id,
            tier: ask.tier,
            statement: ask.statement,
            status: askStatus(ask, assertions),
            assertions,
        }
    })

    const summary = {
        asks: asks.length,
        pass: asks.filter((ask) => ask.status === "pass").length,
        fail: asks.filter((ask) => ask.status === "fail").length,
        blocked: asks.filter((ask) => ask.status === "blocked").length,
        judged: asks.filter((ask) => ask.status === "judged").length,
    }
    return {
        brief: options.briefPath ?? "repobot.brief.json",
        generatedAt: new Date().toISOString(),
        summary,
        asks,
        // Per-route captures from this pass (progress reveal, not evidence).
        ...(firstLooks.length > 0 ? { firstLooks } : {}),
    }
}

/**
 * Judged asks never pass/fail (their assertions are evidence). Otherwise:
 * any failed assertion fails the ask; else any blocked assertion blocks it;
 * else it passes.
 */
function askStatus(ask, assertions) {
    if (ask.tier === "judged") return "judged"
    if (assertions.some((assertion) => assertion.status === "fail")) return "fail"
    if (assertions.some((assertion) => assertion.status === "blocked")) return "blocked"
    return "pass"
}

// Exported for page-check.mjs, which fronts the same dev stack.
export function defaultBaseUrl(rootDir) {
    // The running stack's recorded port wins: dev-up picks a free port when
    // the manifest default is taken (shared pods slot sessions across
    // 5173/5174/…) and records it in .dev/web-port. Trusting the static
    // manifest port here pointed checks at a NEIGHBORING workspace's server —
    // a different repobot app, so even the identity probe waved it through.
    try {
        const recorded = readFileSync(path.join(rootDir, ".dev", "web-port"), "utf8").trim()
        if (/^\d+$/.test(recorded)) {
            return `http://127.0.0.1:${recorded}`
        }
    } catch {
        // No recorded port; fall back to the manifest default.
    }
    try {
        const sandbox = JSON.parse(readFileSync(path.join(rootDir, "repobot.sandbox.json"), "utf8"))
        return `http://127.0.0.1:${sandbox.defaultPort ?? 5173}`
    } catch {
        return "http://127.0.0.1:5173"
    }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const CLI_USAGE = [
    "usage: node scripts/brief/check.mjs [--brief <path>] [--base-url <url>]",
    "         [--report-dir <dir>] [--skip-gates] [--skip-screenshots]",
    "         [--with-screenshots] [--vocabulary] [--help]",
].join("\n")

function parseArgs(argv) {
    const args = { briefPath: path.join(repoRoot, "repobot.brief.json") }
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index]
        if (arg === "--vocabulary") args.vocabulary = true
        else if (arg === "--help" || arg === "-h") args.help = true
        else if (arg === "--brief") args.briefPath = path.resolve(argv[++index])
        else if (arg === "--base-url") args.baseUrl = argv[++index]
        else if (arg === "--report-dir") args.reportDir = path.resolve(argv[++index])
        else if (arg === "--skip-gates") args.skipGates = true
        else if (arg === "--skip-screenshots") args.skipScreenshots = true
        else if (arg === "--with-screenshots") args.withScreenshots = true
        else {
            // Warn-and-continue, never abort: the platform's prompt guidance
            // and a project's committed runner can be different vintages (a
            // dispatched run once told the agent `--skip-screenshots` before
            // this runner knew the flag, and the hard error cost the agent a
            // diagnosis loop). A typo'd flag still surfaces on stderr.
            console.error(`brief:check: ignoring unknown argument: ${arg}\n${CLI_USAGE}`)
        }
    }
    return args
}

async function main() {
    const args = parseArgs(process.argv.slice(2))
    if (args.help === true) {
        console.log(CLI_USAGE)
        return
    }
    if (args.vocabulary === true) {
        console.log(JSON.stringify(BRIEF_VOCABULARY, null, 2))
        return
    }

    const brief = JSON.parse(readFileSync(args.briefPath, "utf8"))
    const problems = validateBrief(brief)
    if (problems.length > 0) {
        console.error(`brief:check: ${args.briefPath} is not a valid brief:`)
        for (const problem of problems) console.error(`  - ${problem}`)
        process.exit(1)
    }

    // Flags outrank the env: --with-screenshots forces captures even under
    // BRIEF_SCREENSHOTS=off (the platform's final evidence pass), and
    // --skip-screenshots forces them off. With neither, the env decides.
    const skipScreenshots =
        args.withScreenshots === true
            ? false
            : args.skipScreenshots === true || process.env.BRIEF_SCREENSHOTS === "off"
    const report = await runBrief(brief, {
        briefPath: path.relative(repoRoot, args.briefPath),
        baseUrl: args.baseUrl ?? process.env.BRIEF_BASE_URL,
        reportDir: args.reportDir,
        skipGates: args.skipGates,
        skipScreenshots,
    })
    console.log(JSON.stringify(report, null, 2))

    const { summary } = report
    console.error(
        `brief:check: ${summary.asks} ask(s) — ${summary.pass} pass, ${summary.fail} fail, ` +
            `${summary.blocked} blocked, ${summary.judged} judged`,
    )
    for (const ask of report.asks) {
        if (ask.status === "fail" || ask.status === "blocked") {
            const first = ask.assertions.find((assertion) => assertion.status === ask.status)
            console.error(`  ${ask.status.toUpperCase()} ${ask.id}: ${first?.detail ?? ""}`)
        }
    }
    process.exit(summary.fail > 0 ? 1 : 0)
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main().catch((error) => {
        console.error(`brief:check: ${error instanceof Error ? error.message : String(error)}`)
        process.exit(1)
    })
}
