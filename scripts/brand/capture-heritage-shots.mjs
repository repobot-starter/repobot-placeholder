// Heritage-register review shots: the four recovered registers (crt,
// handheld, lounge, retroware) on the marketing gallery's single-preset
// view, both appearances. One-off verification sweep for the heritage
// recovery — follows capture-saas-shots.mjs' Playwright pattern; the mode
// rides UiThemeProvider's localStorage key.
//
//   node scripts/brand/capture-heritage-shots.mjs [--base-url http://127.0.0.1:5186]
//                                                 [--out .dev/shots/heritage]

import { mkdirSync } from "node:fs"
import path from "node:path"
import { chromium } from "playwright-core"
import { resolveChromiumExecutablePath } from "../brief/chromium.mjs"

const args = process.argv.slice(2)
const option = (name, fallback) => {
    const index = args.indexOf(name)
    return index >= 0 ? args[index + 1] : fallback
}
const baseUrl = option("--base-url", "http://127.0.0.1:5186").replace(/\/$/, "")
const outDir = option("--out", ".dev/shots/heritage")
mkdirSync(outDir, { recursive: true })

const presets = ["crt", "handheld", "lounge", "retroware"]
const modes = ["light", "dark"]

async function main() {
    const executablePath = resolveChromiumExecutablePath()
    if (executablePath === undefined) throw new Error("no Chromium found")
    const browser = await chromium.launch({ headless: true, executablePath })
    try {
        for (const mode of modes) {
            const context = await browser.newContext({
                viewport: { width: 1440, height: 900 },
                deviceScaleFactor: 2,
            })
            await context.addInitScript((value) => {
                window.localStorage.setItem("base.themeMode", value)
            }, mode)
            const page = await context.newPage()
            for (const preset of presets) {
                await page.goto(`${baseUrl}/theme/marketing?preset=${preset}&view=single`, {
                    waitUntil: "load",
                    timeout: 30_000,
                })
                await page.waitForLoadState("networkidle").catch(() => {})
                await page.waitForTimeout(900)
                const file = path.join(outDir, `${preset}-${mode}.png`)
                await page.screenshot({ path: file, fullPage: true, animations: "disabled" })
                console.log(`wrote ${file}`)
            }
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
