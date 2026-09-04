import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

/**
 * The design manifest's per-pack `shellChrome` flag: published exactly when
 * the pack's catalog theme pins a `shell` block (a remix derives its
 * base's). The platform's remix engine reads it as positive evidence for
 * keeping the shell/content/ui axes live on templates whose registry TYPE
 * alone would mute them — chat is base "content" but its whole page wears
 * the AppShell, so a shell press is visible there.
 */
describe("design manifest shellChrome", () => {
    const root = path.resolve(__dirname, "../../../..")
    const manifest = JSON.parse(readFileSync(path.join(root, "docs/design-manifest.json"), "utf8")) as {
        packs: Record<string, { remixOf?: string; shellChrome?: boolean }>
    }

    const catalogShell = (key: string): boolean => {
        const catalog = JSON.parse(readFileSync(path.join(root, "packs", key, "catalog.json"), "utf8")) as {
            remixOf?: string
            theme?: { shell?: unknown }
        }
        const effective =
            catalog.remixOf !== undefined
                ? (JSON.parse(
                      readFileSync(path.join(root, "packs", catalog.remixOf, "catalog.json"), "utf8"),
                  ) as { theme?: { shell?: unknown } })
                : catalog
        return effective.theme?.shell !== undefined
    }

    it("mirrors each catalog theme's shell block, resolving remixes to their base", () => {
        for (const [key, pack] of Object.entries(manifest.packs)) {
            expect(pack.shellChrome, key).toBe(catalogShell(key) ? true : undefined)
        }
    })

    it("covers the shell-wearing templates the type gate alone would mute", () => {
        expect(manifest.packs.chat?.shellChrome).toBe(true)
        expect(manifest.packs.checkout?.shellChrome).toBe(true)
    })
})
