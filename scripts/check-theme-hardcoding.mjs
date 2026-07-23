// Blocks new hardcoded palettes from bypassing the repobot.theme.json
// contract (docs/design-system.md "Theming"):
//
// 1. web/design-system/ derives every color from themeConfig.ts — a raw hex
//    anywhere else in the package means a component stopped following the
//    token contract and customer brands can no longer reach it.
// 2. Pack views (web/app/src/View/) own their art palettes, but accent/brand
//    constants must route through the packBrand overlay so "make it my brand
//    color" reaches every pack (packs/README.md "Pack palettes").
//
// Genuinely intentional values opt out with a `theme-exempt: <reason>`
// comment on the same line.
//
// Run: node scripts/check-theme-hardcoding.mjs

import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const HEX_COLOR = /(?<!&)#[0-9a-fA-F]{3,8}\b/
const ACCENT_CONST = /^\s*(?:export\s+)?const\s+\w*(?:accent|brand)\w*\s*=/i

function* walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            yield* walk(fullPath)
        } else {
            yield fullPath
        }
    }
}

const failures = []

function checkLine(filePath, lineNumber, line, message) {
    if (line.includes("theme-exempt:")) return
    failures.push(`${path.relative(repoRoot, filePath)}:${lineNumber} — ${message}\n    ${line.trim()}`)
}

// 1. Design system: no raw hex colors outside the theme resolver.
const designSystemSrc = path.join(repoRoot, "web", "design-system", "src")
for (const filePath of walk(designSystemSrc)) {
    if (!/\.(ts|tsx)$/.test(filePath)) continue
    if (filePath.includes(`${path.sep}theme${path.sep}`)) continue
    if (filePath.endsWith(".stories.tsx")) continue
    const lines = readFileSync(filePath, "utf8").split("\n")
    lines.forEach((line, index) => {
        if (HEX_COLOR.test(line) && !line.includes("&#")) {
            checkLine(
                filePath,
                index + 1,
                line,
                "hardcoded color in the design system — use vars from the theme contract",
            )
        }
    })
}

// 2. Pack views: accent/brand constants must route through packBrand.
const viewsDir = path.join(repoRoot, "web", "app", "src", "View")
for (const filePath of walk(viewsDir)) {
    if (!filePath.endsWith(".styles.css.ts")) continue
    const lines = readFileSync(filePath, "utf8").split("\n")
    lines.forEach((line, index) => {
        if (ACCENT_CONST.test(line) && HEX_COLOR.test(line) && !line.includes("packBrand")) {
            checkLine(
                filePath,
                index + 1,
                line,
                "accent/brand constant bypasses the packBrand overlay — see packs/README.md",
            )
        }
    })
}

// 3. App components import UI through the @ui registry (the eject seam) —
//    direct "@base/design-system" imports would dodge project overrides.
//    Deep token/theme endpoints stay allowed for .styles.css.ts files.
const appSrc = path.join(repoRoot, "web", "app", "src")
const registryPath = path.join(appSrc, "Theme", "ui.ts")
for (const filePath of walk(appSrc)) {
    if (!/\.(ts|tsx)$/.test(filePath)) continue
    if (filePath === registryPath) continue
    const lines = readFileSync(filePath, "utf8").split("\n")
    lines.forEach((line, index) => {
        if (/from\s+["']@base\/design-system["']/.test(line)) {
            checkLine(
                filePath,
                index + 1,
                line,
                'import from "@ui" (src/Theme/ui.ts) instead of "@base/design-system" so component overrides apply',
            )
        }
    })
}

if (failures.length > 0) {
    console.error("Theme hardcoding check failed:\n")
    for (const failure of failures) {
        console.error(failure + "\n")
    }
    console.error(
        "Route customer-brandable colors through the theme contract, or append " +
            "`// theme-exempt: <reason>` for genuinely art-directed values.",
    )
    process.exit(1)
}

console.log("Theme hardcoding check passed.")
