import { cpSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { createServer, type ViteDevServer } from "vite"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

const appDir = path.resolve(__dirname, "../..")
const repoRoot = path.resolve(appDir, "../..")

// The platform (git reset on session claim, agents' atomic-write editors)
// replaces the root manifests instead of writing them in place, swapping the
// inode. A chokidar file-level watch dies with the old inode and never
// re-arms — the dev server then silently serves the stale bundle for every
// later manifest edit, which reads as "my change didn't work" (and once sent
// a setup agent rewiring the home page around TypeScript to dodge it). This
// boots the real dev server and asserts the reload survives an inode swap.
//
// The mutations happen on a SCRATCH copy of the manifests, never the
// committed files (REPOBOT_ROOT_MANIFEST_DIR, read by the watcher plugin in
// vite.config.ts). Vitest workers share the checkout: flipping the real
// packs/active.json to photography — even for one 300ms poll — races every
// parallel worker whose test imports it, and a composed services template
// once failed its PUBLISH GATE because landingDocument.test loaded the
// flipped value and computed its fidelity expectation against the wrong
// pack's landing overlay. Config-time JSON imports elsewhere in the suite
// read committed state; this test must not be able to perturb it at all.
describe("watch-root-manifests", () => {
    let server: ViteDevServer | undefined
    let scratchRoot: string

    beforeEach(() => {
        scratchRoot = mkdtempSync(path.join(tmpdir(), "rb-manifest-watch-"))
        cpSync(path.join(repoRoot, "repobot.project.json"), path.join(scratchRoot, "repobot.project.json"))
        mkdirSync(path.join(scratchRoot, "packs"))
        cpSync(path.join(repoRoot, "packs/active.json"), path.join(scratchRoot, "packs/active.json"))
        process.env.REPOBOT_ROOT_MANIFEST_DIR = scratchRoot
    })

    afterEach(async () => {
        delete process.env.REPOBOT_ROOT_MANIFEST_DIR
        rmSync(scratchRoot, { recursive: true, force: true })
        // Bounded close: vite's close awaits internal work (dep-optimizer
        // builds, pending transforms) that this test never needs; a wedged
        // close must not convert a PASSING watcher assertion into a 10s hook
        // timeout that reads as a red suite (it broke template publish gates
        // exactly that way). The forked vitest worker reaps stragglers.
        await Promise.race([server?.close(), new Promise((resolve) => setTimeout(resolve, 3_000))])
    })

    it("full-reloads on a rename-replaced root manifest", async () => {
        const manifestPath = path.join(scratchRoot, "repobot.project.json")
        const original = readFileSync(manifestPath, "utf8")
        const logged: string[] = []
        server = await createServer({
            configFile: path.join(appDir, "vite.config.ts"),
            root: appDir,
            logLevel: "silent",
            server: { port: 0, hmr: false },
            // The subject under test is the manifest stat-poller, not the
            // dep optimizer; discovery just makes boot slow and close hangy
            // (esbuild crawls the whole app, and close awaits the cancel).
            optimizeDeps: { noDiscovery: true, include: [] },
            customLogger: {
                info: (message) => logged.push(message),
                warn: () => {},
                warnOnce: () => {},
                error: () => {},
                clearScreen: () => {},
                hasErrorLogged: () => false,
                hasWarned: false,
            },
        })
        await server.listen()

        // Replace via rename: a new inode at the same path, exactly what git
        // checkout and atomic-write editors produce. The staged copy sits
        // next to the manifest — rename(2) requires one filesystem.
        const reloads = () => logged.filter((line) => line.includes("root manifest changed")).length
        const staged = `${manifestPath}.swap-${process.pid}`
        writeFileSync(staged, original)
        renameSync(staged, manifestPath)
        await expect.poll(reloads, { timeout: 5_000, interval: 100 }).toBeGreaterThanOrEqual(1)

        // The production failure mode (Linux/inotify): the first swap killed
        // the inode-level watch, and every edit AFTER it went unseen — the
        // session claim's git reset was the swap, the agent's manifest edits
        // were the silence. The second change must still be detected.
        const seen = reloads()
        writeFileSync(manifestPath, `${original}\n`)
        await expect.poll(reloads, { timeout: 5_000, interval: 100 }).toBeGreaterThan(seen)
    }, 20_000)

    it("warms the flipped pack's pages server-side on an active.json change", async () => {
        // A template flip's full reload makes the BROWSER discover the new
        // pack's modules one import level at a time — a serial waterfall of
        // cold transforms that cost users a minute of stale placeholder on a
        // busy pod. The watcher must instead crawl the flipped pack's page
        // subtree server-side (warmupRequest) the moment active.json changes.
        const activePackPath = path.join(scratchRoot, "packs/active.json")
        server = await createServer({
            configFile: path.join(appDir, "vite.config.ts"),
            root: appDir,
            logLevel: "silent",
            server: { port: 0, hmr: false },
            optimizeDeps: { noDiscovery: true, include: [] },
        })
        await server.listen()

        // Observe intent, not transform output: with the dep optimizer off,
        // real transforms of pack pages aren't meaningful here — the subject
        // is that the watcher requests the right warmups.
        const warmed: string[] = []
        server.warmupRequest = async (url: string): Promise<void> => {
            warmed.push(url)
        }

        writeFileSync(activePackPath, JSON.stringify({ key: "photography" }))
        await expect
            .poll(() => warmed.some((url) => url.includes("/Photography/PhotographyPage.tsx")), {
                timeout: 5_000,
                interval: 100,
            })
            .toBe(true)
        // Targeted: the flip's pack only, not the whole catalog (startup
        // warmup owns that) — over-matching by substring is fine, warming a
        // page the key doesn't concern is not.
        expect(warmed.every((url) => url.toLowerCase().includes("photography"))).toBe(true)
    }, 20_000)
})
