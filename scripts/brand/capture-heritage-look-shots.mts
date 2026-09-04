// Heritage-Look review shots: each re-paired and new platform Look rendered
// as its identity — the Look's register resolved with its brand accent in
// its native mode, exactly the overlay math the platform runs when a Look is
// applied (resolvePresetOverlay). Stands in for applying each Look to a
// scratch project. Run with tsx so the kernel's TS module imports directly:
//
//   node_modules/.bin/tsx scripts/brand/capture-heritage-look-shots.mts \
//       [--base-url http://localhost:5186] [--out .dev/shots/heritage-looks]

import { mkdirSync } from "node:fs"
import path from "node:path"
import { chromium } from "playwright-core"
// @ts-expect-error plain-JS helper without type declarations
import { resolveChromiumExecutablePath } from "../brief/chromium.mjs"
import {
    marketingPresetDefinitions,
    resolvePresetOverlay,
    type MarketingMode,
    type MarketingPresetName,
} from "../../web/design-system/src/marketing/theme/marketingPresets"

const args = process.argv.slice(2)
const option = (name: string, fallback: string): string => {
    const index = args.indexOf(name)
    return index >= 0 ? (args[index + 1] ?? fallback) : fallback
}
const baseUrl = option("--base-url", "http://localhost:5186").replace(/\/$/, "")
const outDir = option("--out", ".dev/shots/heritage-looks")
mkdirSync(outDir, { recursive: true })

// Mirrors the platform's StyleProfiles.ts pairings: register, native mode,
// and the brand accents the platform writes for the Look.
const looks: {
    key: string
    preset: MarketingPresetName
    mode: MarketingMode
    accent: string
    accentDark: string
}[] = [
    { key: "linux-phosphor", preset: "crt", mode: "dark", accent: "#166534", accentDark: "#9fe097" },
    { key: "the-terminal", preset: "crt", mode: "dark", accent: "#92600a", accentDark: "#ffb000" },
    { key: "jade", preset: "lounge", mode: "dark", accent: "#15803d", accentDark: "#1db954" },
    { key: "gameboy-handheld", preset: "handheld", mode: "light", accent: "#4a5238", accentDark: "#c4cfa1" },
    { key: "runet-98-old-net", preset: "retroware", mode: "light", accent: "#000080", accentDark: "#000080" },
    { key: "windows-95-bevel", preset: "retroware", mode: "light", accent: "#008080", accentDark: "#008080" },
    { key: "system-7-pinstripe", preset: "brutalist", mode: "light", accent: "#000000", accentDark: "#ffffff" },
    { key: "solitaire", preset: "retroware", mode: "light", accent: "#0a6c2f", accentDark: "#0a6c2f" },
    { key: "etch-a-sketch", preset: "retroware", mode: "light", accent: "#d0342c", accentDark: "#d0342c" },
]

async function main(): Promise<void> {
    const executablePath = resolveChromiumExecutablePath()
    if (executablePath === undefined) throw new Error("no Chromium found")
    const browser = await chromium.launch({ headless: true, executablePath })
    try {
        for (const look of looks) {
            const overlay = resolvePresetOverlay(
                marketingPresetDefinitions[look.preset],
                look.mode,
                { accent: look.accent, accentDark: look.accentDark },
                null,
            )
            const vars: Record<string, string> = {
                "--marketing-color-accent": overlay.accent,
                "--marketing-color-accentSoft": overlay.accentSoft,
                "--marketing-color-onAccent": overlay.onAccent,
                "--marketing-shape-shadowCta": overlay.shadowCta,
                "--marketing-background-page": overlay.backgroundPage,
            }
            const context = await browser.newContext({
                viewport: { width: 1440, height: 900 },
                deviceScaleFactor: 2,
            })
            await context.addInitScript((value) => {
                window.localStorage.setItem("base.themeMode", value)
            }, look.mode)
            const page = await context.newPage()
            await page.goto(`${baseUrl}/theme/marketing?preset=${look.preset}&view=single`, {
                waitUntil: "load",
                timeout: 30_000,
            })
            await page.waitForSelector("#gallery-accent", { timeout: 15_000 })
            // Nudge the gallery's own accent knob first: that routes the
            // override through React and mounts the inline-styled marketing
            // root we then write the full resolved overlay onto.
            await page.evaluate((accent) => {
                const input = document.querySelector("#gallery-accent") as HTMLInputElement
                const setter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype,
                    "value",
                )!.set!
                setter.call(input, accent)
                input.dispatchEvent(new Event("input", { bubbles: true }))
                input.dispatchEvent(new Event("change", { bubbles: true }))
            }, overlay.accent)
            await page.waitForSelector('[style*="--marketing-color-accent"]', { timeout: 15_000 })
            await page.evaluate((entries) => {
                for (const root of document.querySelectorAll<HTMLElement>(
                    '[style*="--marketing-color-accent"]',
                )) {
                    for (const [property, value] of Object.entries(entries)) {
                        root.style.setProperty(property, value)
                    }
                }
            }, vars)
            await page.waitForLoadState("networkidle").catch(() => {})
            await page.waitForTimeout(900)
            const file = path.join(outDir, `${look.key}.png`)
            await page.screenshot({ path: file, fullPage: true, animations: "disabled" })
            console.log(`wrote ${file}`)
            await context.close()
        }
    } finally {
        await browser.close()
    }
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
