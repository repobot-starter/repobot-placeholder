// Blocks new hardcoded palettes from bypassing the repobot.theme.json
// contract (docs/design-system.md "Theming"):
//
// 1. web/design-system/ derives every color from themeConfig.ts — a raw hex
//    anywhere else in the package means a component stopped following the
//    token contract and customer brands can no longer reach it.
// 2. Pack views (web/app/src/View/) own their art palettes, but accent/brand
//    constants must read the pack-overlay custom properties —
//    `var(--pack-accent, <art fallback>)` — so "make it my brand color"
//    reaches every pack AND a live theme edit re-inks it without a rebuild
//    (packs/README.md "Pack palettes"). Baking the overlay's build-time
//    constants (`packBrand?.accent ?? …`) is the pattern the variables
//    replaced: it deploys fine but leaves the workspace preview inert.
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

// 2. Pack views: accent/brand constants must read the live pack-overlay
//    custom properties, never the baked packBrand/packFont constants.
const viewsDir = path.join(repoRoot, "web", "app", "src", "View")
for (const filePath of walk(viewsDir)) {
    if (!/\.(ts|tsx)$/.test(filePath)) continue
    const isStyleFile = /\.(styles\.)?css\.ts$/.test(filePath)
    const lines = readFileSync(filePath, "utf8").split("\n")
    lines.forEach((line, index) => {
        if (isStyleFile && ACCENT_CONST.test(line) && HEX_COLOR.test(line) && !line.includes("var(--pack-")) {
            checkLine(
                filePath,
                index + 1,
                line,
                "accent/brand constant bypasses the pack overlay — read " +
                    "`var(--pack-accent, <art fallback>)` (packs/README.md)",
            )
        }
        // The baked constants resolve at BUILD time, so the workspace
        // preview never repaints on a theme edit — the exact bug the
        // custom properties fixed. Pack code reads the variables instead.
        if (/\bpackBrand\b|\bpackFont\b/.test(line)) {
            checkLine(
                filePath,
                index + 1,
                line,
                "packBrand/packFont bake at build time and go stale in the live " +
                    "preview — read the `--pack-*` custom properties instead (packs/README.md)",
            )
        }
    })
}

// 2b. Register-declaring packs: their whole view tree rides the register's
//     token contract. A pack that declares landing.style.preset in its
//     catalog is a branded marketing surface — a raw hex in its views is a
//     forked constant that survives register changes and lets two packs
//     drift into wearing the same clothes (photography's proofing room kept
//     its rust literal through the atelier/heirloom split). Game packs and
//     other register-less packs keep their art-palette freedom (rule 2).
//     Genuinely art-directed values opt out with `theme-exempt: <reason>`.
const packsDir = path.join(repoRoot, "packs")
const registeredViewDirs = readdirSync(packsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(packsDir, entry.name, "catalog.json"))
    .filter((catalogPath) => {
        try {
            const catalog = JSON.parse(readFileSync(catalogPath, "utf8"))
            return catalog.landing?.style?.preset !== undefined && catalog.homeViewDir !== undefined
        } catch {
            return false
        }
    })
    .map((catalogPath) => {
        const catalog = JSON.parse(readFileSync(catalogPath, "utf8"))
        return path.join(repoRoot, catalog.homeViewDir)
    })
for (const viewDir of registeredViewDirs) {
    for (const filePath of walk(viewDir)) {
        if (!/\.(ts|tsx)$/.test(filePath)) continue
        const lines = readFileSync(filePath, "utf8").split("\n")
        lines.forEach((line, index) => {
            if (HEX_COLOR.test(line) && !line.includes("&#")) {
                checkLine(
                    filePath,
                    index + 1,
                    line,
                    "raw color in a register-declaring pack's views — read the register's " +
                        "marketing tokens (or theme-exempt a genuinely art-directed value)",
                )
            }
        })
    }
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
