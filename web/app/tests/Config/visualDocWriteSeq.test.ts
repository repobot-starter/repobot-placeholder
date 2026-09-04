import { cpSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { createServer, type ViteDevServer } from "vite"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

const appDir = path.resolve(__dirname, "../..")
const repoRoot = path.resolve(appDir, "../..")

// The platform correlates its "Updating preview…" arm with the kernel's
// visual-applied acks by WRITE SEQUENCE (the changed file's mtime — the same
// value the pod reports for its preview-writes). The manifest watcher must
// announce {doc, seq} to every client BEFORE the apply event that triggers
// the renderer's ack (theme contract / module update / vacuous broadcast),
// or the ack goes out unkeyed and a rapid-fire remix burst's coalesced acks
// clear the wrong press's overlay arm — the intermittent stuck
// "Updating preview…" loader.
//
// Same scratch-manifest discipline as watchRootManifests.test.ts: mutations
// happen on a copy (REPOBOT_ROOT_MANIFEST_DIR), never the committed files —
// vitest workers share the checkout.
describe("visual-doc write-sequence announcements", () => {
    let server: ViteDevServer | undefined
    let scratchRoot: string

    beforeEach(() => {
        scratchRoot = mkdtempSync(path.join(tmpdir(), "rb-manifest-seq-"))
        cpSync(path.join(repoRoot, "repobot.project.json"), path.join(scratchRoot, "repobot.project.json"))
        mkdirSync(path.join(scratchRoot, "packs"))
        cpSync(path.join(repoRoot, "packs/active.json"), path.join(scratchRoot, "packs/active.json"))
        process.env.REPOBOT_ROOT_MANIFEST_DIR = scratchRoot
    })

    afterEach(async () => {
        delete process.env.REPOBOT_ROOT_MANIFEST_DIR
        rmSync(scratchRoot, { recursive: true, force: true })
        // Bounded close, same reason as watchRootManifests.test.ts: a wedged
        // vite close must not convert a passing assertion into a hook
        // timeout. The forked vitest worker reaps stragglers.
        await Promise.race([server?.close(), new Promise((resolve) => setTimeout(resolve, 3_000))])
    })

    it("announces each ack-bearing document's write sequence ahead of its apply event", async () => {
        server = await createServer({
            configFile: path.join(appDir, "vite.config.ts"),
            root: appDir,
            logLevel: "silent",
            server: { port: 0, hmr: false },
            optimizeDeps: { noDiscovery: true, include: [] },
        })
        await server.listen()

        // Observe the wire, not clients: the plugin resolves server.ws.send
        // dynamically, so replacing it captures every payload it dispatches.
        const sent: { event?: string; data?: { doc?: string; seq?: number } }[] = []
        server.ws.send = ((payload: (typeof sent)[number]) => {
            sent.push(payload)
        }) as typeof server.ws.send

        // A theme edit: the sequence must precede the contract event.
        const themePath = path.join(scratchRoot, "repobot.theme.json")
        writeFileSync(themePath, JSON.stringify({ brand: { primary: "#123456" } }))
        await expect
            .poll(() => sent.some((message) => message.event === "repobot:theme-contract"), {
                timeout: 5_000,
                interval: 100,
            })
            .toBe(true)
        const themeSeqIndex = sent.findIndex(
            (message) =>
                message.event === "repobot:visual-doc-will-apply" &&
                message.data?.doc === "repobot.theme.json",
        )
        const contractIndex = sent.findIndex((message) => message.event === "repobot:theme-contract")
        expect(themeSeqIndex).toBeGreaterThanOrEqual(0)
        expect(themeSeqIndex).toBeLessThan(contractIndex)
        expect(sent[themeSeqIndex].data?.seq).toBe(statSync(themePath).mtimeMs)

        // A landing edit with no loaded renderer (nothing imported it under
        // noDiscovery): the vacuous-ack broadcast itself must carry the seq,
        // and the will-apply announcement precedes it.
        const landingPath = path.join(scratchRoot, "repobot.landing.json")
        writeFileSync(landingPath, JSON.stringify({ sections: [] }))
        await expect
            .poll(
                () =>
                    sent.some(
                        (message) =>
                            message.event === "repobot:visual-doc-changed" &&
                            message.data?.doc === "repobot.landing.json",
                    ),
                { timeout: 5_000, interval: 100 },
            )
            .toBe(true)
        const landingSeqIndex = sent.findIndex(
            (message) =>
                message.event === "repobot:visual-doc-will-apply" &&
                message.data?.doc === "repobot.landing.json",
        )
        const broadcastIndex = sent.findIndex(
            (message) =>
                message.event === "repobot:visual-doc-changed" &&
                message.data?.doc === "repobot.landing.json",
        )
        expect(landingSeqIndex).toBeGreaterThanOrEqual(0)
        expect(landingSeqIndex).toBeLessThan(broadcastIndex)
        const landingSeq = statSync(landingPath).mtimeMs
        expect(sent[landingSeqIndex].data?.seq).toBe(landingSeq)
        expect(sent[broadcastIndex].data?.seq).toBe(landingSeq)
    }, 20_000)
})
