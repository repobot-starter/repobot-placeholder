import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { createServer, type ViteDevServer } from "vite"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

const appDir = path.resolve(__dirname, "../..")
const repoRoot = path.resolve(appDir, "../..")

// Most pack keys are multi-word and dashed ("services-emergency",
// "fitness-trainer") while the View tree is CamelCase ("ServicesEmergency/").
// The warmup matcher's raw substring compare never matched any of them, so
// every dashed-key flip silently took the warm-everything fallback: hundreds
// of unrelated page transforms queued ahead of the flip target on an
// already-busy pod — the exact serial-waterfall cost the warmup exists to
// remove. This boots the real dev server (scratch manifest dir, same
// isolation rationale as watchRootManifests.test.ts) and asserts a dashed
// key warms its own pack's pages and nothing else.
describe("pack-switch warmup with dashed pack keys", () => {
    let server: ViteDevServer | undefined
    let scratchRoot: string

    beforeEach(() => {
        scratchRoot = mkdtempSync(path.join(tmpdir(), "rb-pack-warmup-"))
        cpSync(path.join(repoRoot, "repobot.project.json"), path.join(scratchRoot, "repobot.project.json"))
        mkdirSync(path.join(scratchRoot, "packs"))
        cpSync(path.join(repoRoot, "packs/active.json"), path.join(scratchRoot, "packs/active.json"))
        process.env.REPOBOT_ROOT_MANIFEST_DIR = scratchRoot
    })

    afterEach(async () => {
        delete process.env.REPOBOT_ROOT_MANIFEST_DIR
        rmSync(scratchRoot, { recursive: true, force: true })
        // Bounded close, matching the watcher suite: vite's close awaits
        // work this test never needs, and a wedged close must not turn a
        // passing assertion into a hook timeout.
        await Promise.race([server?.close(), new Promise((resolve) => setTimeout(resolve, 3_000))])
    })

    it("warms only the flipped pack's pages when the key is dashed", async () => {
        const activePackPath = path.join(scratchRoot, "packs/active.json")
        server = await createServer({
            configFile: path.join(appDir, "vite.config.ts"),
            root: appDir,
            logLevel: "silent",
            server: { port: 0, hmr: false },
            optimizeDeps: { noDiscovery: true, include: [] },
        })
        await server.listen()

        // Observe intent, not transform output (same technique as the
        // watcher suite): the subject is which warmups are requested.
        const warmed: string[] = []
        server.warmupRequest = async (url: string): Promise<void> => {
            warmed.push(url)
        }

        writeFileSync(activePackPath, JSON.stringify({ key: "services-emergency" }))
        await expect
            .poll(() => warmed.some((url) => url.includes("/ServicesEmergency/")), {
                timeout: 5_000,
                interval: 100,
            })
            .toBe(true)
        // The regression this pins: a missed match falls back to EVERY page
        // in the catalog. Dashed keys must not take that fallback.
        expect(warmed.every((url) => url.toLowerCase().includes("servicesemergency"))).toBe(true)
    }, 20_000)
})
