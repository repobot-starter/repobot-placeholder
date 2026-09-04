// Guards the pinned-test/theme-contract invariant: every template-shipped
// test in web/app/tests/.pinned-tests.json must pass under ANY committed
// repobot.theme.json. Projects commit their own contract during setup (dark
// mode, a different shell, flipped ui presets…) and verify-pinned-tests.mjs
// forbids them from editing these files — so a pinned test that asserts a
// kernel default (light mode active, an <aside> rail, "full" content) turns
// into a permanently red check:web that a project agent cannot fix.
//
// This gate reruns the pinned suite with the contract swapped for one that
// inverts every kernel default. A failure here means a pinned test hardcodes
// a contract-controlled value; the fix is to assert against the committed
// contract — themeConfig, configuredDefaultMode, uiConfig — the way
// themeConfig.test.ts and AppShellVariants.test.tsx do. Never fix it by
// weakening this contract or the test.
//
// Run: node scripts/check-theme-agnostic-tests.mjs

import { spawnSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

// The gate's verdict is only meaningful against the COMMITTED root manifests:
// earlier suite runs in the same checkout mutate them (watchRootManifests
// flips packs/active.json to exercise the dev-server watcher) and a reaped
// vitest worker can skip the restore hook — the leaked flip then fails the
// landing-document fidelity test here with a diff that reads as a theme bug.
// Shed any such leak before swapping the contract in.
spawnSync(
    "git",
    [
        "checkout",
        "--",
        "packs/active.json",
        "repobot.project.json",
        "repobot.landing.json",
        "repobot.content.json",
    ],
    {
        cwd: repoRoot,
        stdio: "inherit",
    },
)
const themePath = path.join(repoRoot, "repobot.theme.json")
const manifestPath = path.join(repoRoot, "web", "app", "tests", ".pinned-tests.json")
const uiRegistryPath = path.join(repoRoot, "web", "app", "src", "Theme", "ui.ts")

// The guarantee only covers kernel components. A project that ejected a
// component through the @ui registry (docs/design-system.md, eject seam)
// owns that code against its own committed contract, so rerunning under an
// inverted contract would be a false positive — skip, don't enforce. The
// line-anchored match avoids the eject example in ui.ts's own docblock.
if (/^[ \t]*export\b.*from\s+["']\.\/overrides\//m.test(readFileSync(uiRegistryPath, "utf8"))) {
    console.log(
        "The @ui registry re-points components to project overrides; skipping the " +
            "theme-agnostic gate (it only guards pristine kernel components).",
    )
    process.exit(0)
}

// The anti-kernel contract: every field diverges from the kernel default so
// any pinned assertion that secretly depends on a default trips here. The
// palette/motion blocks exercise the Plan 2 A0 + A0.2 vocabulary too (nav
// sub-block, chart ramp, warning/info, muted/input, the on-accent twin) —
// under `mode: "dark"` this also runs the palette's dark derivation on
// every pinned test.
const invertedContract = {
    $comment:
        "Transient contract written by scripts/check-theme-agnostic-tests.mjs; if you are reading this in a committed file, the gate crashed before restoring — `git checkout repobot.theme.json`.",
    brand: { primary: "#7c3aed", primaryDark: "#c4b5fd" },
    radius: "round",
    density: "compact",
    fontFamily: "serif",
    mode: "dark",
    motion: "instant",
    palette: {
        background: "#f3e8ff",
        surface: "#fffdf7",
        border: "#d8c8f0",
        textPrimary: "#241533",
        textSecondary: "#6b5a80",
        muted: "#ece2f8",
        input: "#c9b4e8",
        ring: "rgba(124, 58, 237, 0.3)",
        warning: "#d97706",
        warningSurface: "rgba(217, 119, 6, 0.18)",
        info: "#0284c7",
        infoSurface: "rgba(2, 132, 199, 0.18)",
        accentText: "#f5f0ff",
        nav: {
            bg: "#2e1a47",
            text: "#f3e8ff",
            muted: "#a68fc7",
            hover: "#3d2659",
            border: "#4a3266",
            ring: "#c4b5fd",
        },
        charts: ["#7c3aed", "#d946ef", "#f59e0b", "#10b981", "#0ea5e9"],
        shadowMd: "4px 4px 0 rgba(36, 21, 51, 0.25)",
    },
    navigation: { variant: "centered" },
    shell: { variant: "top-nav", content: "centered" },
    ui: {
        table: { style: "minimalist", pagination: "pages" },
        forms: { presentation: "page", width: "wide" },
        errors: { presentation: "corner" },
        loaders: { style: "progressive" },
    },
}

const pinnedFiles = Object.keys(JSON.parse(readFileSync(manifestPath, "utf8"))).map(
    (relativePath) => `tests/${relativePath}`,
)

const originalContract = readFileSync(themePath)
let restored = false
function restoreContract() {
    if (restored) return
    writeFileSync(themePath, originalContract)
    restored = true
}
process.on("exit", restoreContract)
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
    process.on(signal, () => {
        restoreContract()
        process.exit(1)
    })
}

writeFileSync(themePath, JSON.stringify(invertedContract, null, 4) + "\n")
console.log(`Running ${pinnedFiles.length} pinned test files under an inverted theme contract...`)

const result = spawnSync("npx", ["vitest", "run", ...pinnedFiles], {
    cwd: path.join(repoRoot, "web", "app"),
    stdio: "inherit",
})
restoreContract()

if (result.status !== 0) {
    console.error(
        "\nPinned template tests fail under a non-default theme contract. Projects commit " +
            "their own repobot.theme.json and cannot edit pinned tests, so this would strand " +
            "every themed project with a red check:web. Rewrite the failing assertion to read " +
            "the committed contract (themeConfig / configuredDefaultMode / uiConfig) instead " +
            "of a kernel default — see AppShellVariants.test.tsx.",
    )
    process.exit(result.status ?? 1)
}

console.log("Pinned tests are theme-agnostic.")
