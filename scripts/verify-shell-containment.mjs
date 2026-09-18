// Blocks hand-built page chrome from drifting in beside the kernel shells
// (AGENTS.md invariant: "App shells and sidebars are never hand-built").
// The invariant was prompt-level only; this makes it mechanical:
//
// 1. Anchors — the signed-in chrome stays kernel-dispatched: AppLayout.tsx
//    must keep rendering the kernel `AppShell` (imported through `@ui`), and
//    App.tsx must keep the protected routes nested inside `<AppLayout />`.
//    Anything that rewires either is bespoke chrome by construction.
// 2. Ratchet — no NEW top-level layout scaffolding: a .tsx file under
//    web/app/src/ that renders its own `<nav`/`<aside` without importing a
//    kernel shell surface from `@ui` is a hand-built shell in the making.
//    The art-directed pack pages that already do this are baselined below
//    (fail on NEW violations only, like the theme-hardcoding ratchet).
//
// Sanctioned paths when this fires: pick an `AppShell`/`MarketingShell`
// variant (repobot.theme.json `shell`/`navigation`, docs/shell.md), feed nav
// through the shell's config (shellNavSections.tsx), or eject the shell
// through the `@ui` registry (web/app/src/Theme/overrides/). Genuinely
// in-page nav semantics (pagination, a game HUD) opt out with a
// `shell-exempt: <reason>` comment on the same line.
//
// Run: node scripts/verify-shell-containment.mjs [repoRoot]

import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

/* Kernel shell surfaces: importing any of these from @ui means the file
 * composes kernel chrome rather than hand-building it. */
const KERNEL_SHELL_IMPORTS = [
    "AppShell",
    "MarketingShell",
    "MarketingPage",
    "MarketingNav",
    "AuthShell",
    "AuthScreen",
]

/* The art-directed pack pages that already carried their own <nav>/<aside>
 * when this gate landed. Baseline — append-only shrink: never add to this
 * list to get a green; new pages compose the kernel shells. */
const BASELINE = new Set([
    "web/app/src/View/Games/Astro/AstroPage.tsx",
    "web/app/src/View/Games/Blackjack/BlackjackPage.tsx",
    "web/app/src/View/Games/Carrom/CarromPage.tsx",
    "web/app/src/View/Games/Chess/ChessPage.tsx",
    "web/app/src/View/Games/Chimney/ChimneyPage.tsx",
    "web/app/src/View/Games/Code/CodePage.tsx",
    "web/app/src/View/Games/Gomoku/GomokuPage.tsx",
    "web/app/src/View/Games/Hanafuda/HanafudaPage.tsx",
    "web/app/src/View/Games/Ludo/LudoPage.tsx",
    "web/app/src/View/Games/Pong/PongPage.tsx",
    "web/app/src/View/Games/Race/RacePage.tsx",
    "web/app/src/View/Games/Salon/SalonPage.tsx",
    "web/app/src/View/Games/Snake/SnakePage.tsx",
    "web/app/src/View/Games/Style/StylePage.tsx",
    "web/app/src/View/Games/Tawla/TawlaPage.tsx",
    "web/app/src/View/Games/Truco/TrucoPage.tsx",
    "web/app/src/View/Link/LinkPage.tsx",
    "web/app/src/View/Shop/ShopPage.tsx",
])

const APP_SHELL_IMPORT = /import\s*\{[^}]*\bAppShell\b[^}]*\}\s*from\s*["']@ui["']/
const APP_SHELL_RENDER = /<AppShell[\s>]/
const PROTECTED_UNDER_APP_LAYOUT =
    /<Route\s+element=\{<ProtectedRoutes\s*\/>\}>\s*<Route\s+element=\{<AppLayout\s*\/>\}>/

const CHROME_ELEMENT = /<(nav|aside)[\s>/]/
const UI_SHELL_IMPORT = new RegExp(
    `import\\s*\\{[^}]*\\b(?:${KERNEL_SHELL_IMPORTS.join("|")})\\b[^}]*\\}\\s*from\\s*["']@ui["']`,
)

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

/**
 * Pure core, exercised by the test: given file contents keyed by
 * repo-relative POSIX path, return the list of failure messages.
 */
export function verifyShellContainment(files) {
    const failures = []

    const appLayout = files["web/app/src/View/Navbar/AppLayout.tsx"]
    if (appLayout === undefined) {
        failures.push(
            "web/app/src/View/Navbar/AppLayout.tsx is gone — the signed-in chrome must keep " +
                "rendering the kernel AppShell there. Restore it; shell treatment changes go " +
                "through repobot.theme.json `shell` or an @ui override (docs/shell.md).",
        )
    } else if (!APP_SHELL_IMPORT.test(appLayout) || !APP_SHELL_RENDER.test(appLayout)) {
        failures.push(
            "web/app/src/View/Navbar/AppLayout.tsx no longer renders the kernel AppShell " +
                "(imported from @ui). Hand-built signed-in chrome is a drift from the shell " +
                "invariant: pick an AppShell variant (repobot.theme.json `shell`, docs/shell.md), " +
                "configure nav in shellNavSections.tsx, or eject AppShell through the @ui " +
                "registry (web/app/src/Theme/overrides/) — never replace the layout wrapper.",
        )
    }

    const app = files["web/app/src/App.tsx"]
    if (app !== undefined && !PROTECTED_UNDER_APP_LAYOUT.test(app)) {
        failures.push(
            "web/app/src/App.tsx no longer nests the protected routes inside " +
                "`<Route element={<ProtectedRoutes />}>` + `<Route element={<AppLayout />}>`. " +
                "Signed-in pages must render within the kernel shell; new dashboard destinations " +
                "are manifest entries + `npm run scaffold:ia`, never route rewiring " +
                "(docs/project-ia.md, docs/shell.md).",
        )
    }

    for (const [relativePath, source] of Object.entries(files)) {
        if (!relativePath.startsWith("web/app/src/")) continue
        if (!relativePath.endsWith(".tsx")) continue
        // The eject seam: overrides are sanctioned copies of kernel chrome.
        if (relativePath.startsWith("web/app/src/Theme/overrides/")) continue
        if (BASELINE.has(relativePath)) continue
        const lines = source.split("\n")
        const hasShellImport = UI_SHELL_IMPORT.test(source)
        lines.forEach((line, index) => {
            if (!CHROME_ELEMENT.test(line)) return
            if (line.includes("shell-exempt:")) return
            if (hasShellImport) return
            failures.push(
                `${relativePath}:${index + 1} — renders its own <nav>/<aside> without composing a ` +
                    "kernel shell. Routes and pages render within the kernel chrome: use " +
                    "AppShell/MarketingShell (variants via repobot.theme.json `shell`/`navigation`, " +
                    "docs/shell.md) or the landing renderer; eject through the @ui registry " +
                    "(web/app/src/Theme/overrides/) when the kernel can't express the layout. " +
                    "Genuinely in-page nav semantics may append `// shell-exempt: <reason>`.\n" +
                    `    ${line.trim()}`,
            )
        })
    }

    return failures
}

function main() {
    const repoRoot = process.argv[2] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
    const appSrc = path.join(repoRoot, "web", "app", "src")
    const files = {}
    if (existsSync(appSrc)) {
        for (const filePath of walk(appSrc)) {
            if (!filePath.endsWith(".tsx")) continue
            const relativePath = path.relative(repoRoot, filePath).split(path.sep).join("/")
            files[relativePath] = readFileSync(filePath, "utf8")
        }
    }
    const failures = verifyShellContainment(files)
    if (failures.length > 0) {
        console.error("[verify-shell-containment] FAIL:\n")
        for (const failure of failures) console.error(failure + "\n")
        process.exit(1)
    }
    console.log("[verify-shell-containment] OK - pages render within the kernel shells.")
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main()
}
