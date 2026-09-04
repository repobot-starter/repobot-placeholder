// Self-test for the theme importer (Plan 2 A1). The fixture is a trimmed copy
// of the reference case — the original docu-sea app's src/styles.css — with
// the emitted contract pinned against the values the real file produces.
//
// Note the pinned values are the reference file's ACTUAL tokens: docu-sea is
// a coral/warm identity (primary oklch(0.685 0.153 21.5) → #e96e6f), not the
// teal set run-7's wave 14 hand-picked (#358f82 / #e7f2ef) while working
// around the pre-palette contract ceiling — the wave-14 note records those as
// the agent's approximation, and the importer exists precisely so themes come
// from the reference file instead of an agent's eyeball.
//
// Run: node --test scripts/import-theme.test.mjs

import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"
import {
    formatColor,
    importTheme,
    mergeThemeFragment,
    parseColor,
    parseThemeCss,
    validateThemeFragment,
} from "./import-theme.mjs"

const SCRIPT = fileURLToPath(new URL("./import-theme.mjs", import.meta.url))

/* Trimmed copy of /Volumes/sgrepos/docu-sea/src/styles.css (the reference
 * case): the @theme font declaration, the mapped :root/.dark vars with their
 * real values (including the full sidebar/chart families), and a sampling of
 * the genuinely unmappable vars (secondary/card-foreground) that the report
 * must still show as dropped. */
const DOCU_SEA_FIXTURE = `
@import "tailwindcss" source(none);
@custom-variant dark (&:is(.dark *));

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --color-primary: var(--primary);
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
}

:root {
  --radius: 0.5rem;
  --background: oklch(0.985 0.002 60);
  --foreground: oklch(0.24 0.008 60);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.24 0.008 60);
  --popover: oklch(1 0 0);
  --primary: oklch(0.685 0.153 21.5);
  --primary-foreground: oklch(0.99 0 0);
  --secondary: oklch(0.955 0.004 60);
  --muted: oklch(0.962 0.003 60);
  --muted-foreground: oklch(0.55 0.008 60);
  --accent: oklch(0.955 0.02 25);
  --destructive: oklch(0.6 0.21 27);
  --border: oklch(0.915 0.004 60);
  --input: oklch(0.915 0.004 60);
  --ring: oklch(0.685 0.153 21.5);
  --success: oklch(0.62 0.13 155);
  --warning: oklch(0.78 0.14 75);
  --info: oklch(0.62 0.11 250);
  --nav: oklch(0.24 0.006 60);
  --nav-foreground: oklch(0.96 0.003 60);
  --nav-muted: oklch(0.68 0.006 60);
  --chart-1: oklch(0.685 0.153 21.5);
  --chart-2: oklch(0.62 0.11 250);
  --chart-3: oklch(0.7 0.13 155);
  --chart-4: oklch(0.78 0.14 75);
  --chart-5: oklch(0.62 0.14 300);
  --sidebar: oklch(0.24 0.006 60);
  --sidebar-foreground: oklch(0.96 0.003 60);
  --sidebar-primary: oklch(0.685 0.153 21.5);
  --sidebar-primary-foreground: oklch(0.99 0 0);
  --sidebar-accent: oklch(0.3 0.006 60);
  --sidebar-accent-foreground: oklch(0.96 0.003 60);
  --sidebar-border: oklch(0.32 0.006 60);
  --sidebar-ring: oklch(0.685 0.153 21.5);
}

.dark {
  --background: oklch(0.129 0.042 264.695);
  --foreground: oklch(0.984 0.003 247.858);
  --card: oklch(0.208 0.042 265.755);
  --primary: oklch(0.929 0.013 255.508);
  --primary-foreground: oklch(0.208 0.042 265.755);
  --muted: oklch(0.279 0.041 260.031);
  --muted-foreground: oklch(0.704 0.04 256.788);
  --accent: oklch(0.279 0.041 260.031);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.551 0.027 264.364);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.208 0.042 265.755);
  --sidebar-foreground: oklch(0.984 0.003 247.858);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.984 0.003 247.858);
  --sidebar-accent: oklch(0.279 0.041 260.031);
  --sidebar-accent-foreground: oklch(0.984 0.003 247.858);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.551 0.027 264.364);
}
`

function importCss(css) {
    return importTheme(parseThemeCss(css))
}

test("docu-sea fixture emits the reference app's contract (oklch path, dark block)", () => {
    const { theme, report, warnings } = importCss(DOCU_SEA_FIXTURE)
    assert.deepEqual(warnings, [])
    assert.deepEqual(theme, {
        brand: { primary: "#e96e6f", primaryDark: "#e2e8f0" },
        radius: "soft",
        fontFamily: "inter",
        palette: {
            background: "#fbfaf9",
            backgroundDark: "#020618",
            surface: "#ffffff",
            surfaceDark: "#0f172b",
            surfaceHover: "#feebe9",
            surfaceHoverDark: "#1d293d",
            border: "#e5e2e0",
            borderDark: "rgba(255, 255, 255, 0.1)",
            textPrimary: "#221e1c",
            textPrimaryDark: "#f8fafc",
            textSecondary: "#75716d",
            textSecondaryDark: "#90a1b9",
            muted: "#f4f2f0",
            mutedDark: "#1d293d",
            input: "#e5e2e0",
            inputDark: "rgba(255, 255, 255, 0.15)",
            ring: "#e96e6f",
            ringDark: "#6a7282",
            danger: "#e23532",
            dangerDark: "#ff6467",
            success: "#349d62",
            warning: "#eba941",
            info: "#4f8ac6",
            accentText: "#fcfcfc",
            accentTextDark: "#0f172b",
            nav: {
                bg: "#211f1c",
                bgDark: "#0f172b",
                text: "#f3f1f0",
                textDark: "#f8fafc",
                muted: "#9b9795",
                hover: "#302d2b",
                hoverDark: "#1d293d",
                border: "#353230",
                borderDark: "rgba(255, 255, 255, 0.1)",
                ring: "#e96e6f",
                ringDark: "#6a7282",
            },
            charts: ["#e96e6f", "#4f8ac6", "#51b67a", "#eba941", "#9470cd"],
            chartsDark: ["#1447e6", "#00bc7d", "#fe9a00", "#ad46ff", "#ff2056"],
        },
    })
    // The emitted fragment must pass the contract's own validation rules.
    assert.deepEqual(validateThemeFragment(theme), [])
    // Gaps stay visible: genuinely unmappable vars are reported as dropped
    // (secondary/card-foreground have no contract consumer), popover is
    // card's twin, and the dark block's alpha border keeps its rgba form.
    const text = report.join("\n")
    assert.match(text, /--secondary .+ → no contract field — dropped/)
    assert.match(text, /--card-foreground .+ → no contract field — dropped/)
    assert.match(text, /--popover .+ → skipped \(--card already sets palette\.surface\)/)
    assert.match(text, /\[dark\] --border .+ → palette\.borderDark = rgba\(255, 255, 255, 0\.1\)/)
    // The sidebar/nav/chart families map onto palette.nav + palette.charts…
    assert.match(text, /--sidebar .+ → palette\.nav\.bg = #211f1c/)
    assert.match(text, /--nav .+ → skipped \(--sidebar already sets palette\.nav\.bg\)/)
    assert.match(text, /--nav-muted .+ → palette\.nav\.muted = #9b9795/)
    assert.match(text, /--sidebar-ring .+ → palette\.nav\.ring = #e96e6f/)
    assert.match(text, /--chart-1\.\.5 → palette\.charts = \[#e96e6f, #4f8ac6, #51b67a, #eba941, #9470cd\]/)
    assert.match(text, /\[dark\] --chart-1\.\.5 → palette\.chartsDark = \[#1447e6/)
    // …and the nav active item derives from the brand accent: a restated
    // --sidebar-primary is skipped, a divergent one drops with the reason.
    assert.match(
        text,
        /\[light\] --sidebar-primary .+ → equals --primary; nav active items derive from the brand accent — skipped/,
    )
    assert.match(
        text,
        /\[dark\] --sidebar-primary .+ → nav active items derive from the brand accent — dropped/,
    )
    assert.match(
        text,
        /\[dark\] --sidebar-primary-foreground .+ → on-accent text imports as palette\.accentText — dropped/,
    )
    // The radius math is shown, and the @theme font resolves to the preset.
    assert.match(text, /--radius 0\.5rem = 8px → radius = "soft" \(nearest preset: .*soft md 10px Δ2/)
    assert.match(text, /--font-sans \(@theme\) .+ → fontFamily = "inter"/)
})

test("chart families shorter than 5 warn and leave the ramp untouched", () => {
    const { theme, report, warnings } = importCss(`
        :root {
          --chart-1: #111111;
          --chart-2: #222222;
          --chart-3: #333333;
        }
    `)
    assert.equal(theme.palette, undefined)
    assert.match(warnings[0], /only 3 --chart-N vars — palette\.charts needs at least 5/)
    assert.match(report.join("\n"), /--chart-1\.\.3 → fewer than 5 chart colors — charts untouched/)

    // A 6+ family imports its first 6 with a warning.
    const six = importCss(`
        :root {
          --chart-1: #111111; --chart-2: #222222; --chart-3: #333333;
          --chart-4: #444444; --chart-5: #555555; --chart-6: #666666;
          --chart-7: #777777;
        }
    `)
    assert.deepEqual(six.theme.palette.charts, [
        "#111111",
        "#222222",
        "#333333",
        "#444444",
        "#555555",
        "#666666",
    ])
    assert.match(six.warnings[0], /7 --chart-N vars — the contract keeps the first 6/)
    assert.deepEqual(validateThemeFragment(six.theme), [])
})

test("the nav block maps without a --sidebar family (--nav trio only)", () => {
    const { theme, warnings } = importCss(`
        :root {
          --nav: #223311;
          --nav-foreground: #eeffdd;
          --nav-muted: #99aa88;
        }
    `)
    assert.deepEqual(warnings, [])
    assert.deepEqual(theme.palette.nav, { bg: "#223311", text: "#eeffdd", muted: "#99aa88" })
    assert.deepEqual(validateThemeFragment(theme), [])
})

test("validateThemeFragment rejects malformed nav and charts blocks", () => {
    const problems = validateThemeFragment({
        palette: {
            nav: { bg: "url(evil)", active: "#000000" },
            charts: ["#111111", "#222222"],
            chartsDark: "not-an-array",
        },
    })
    assert.deepEqual(problems, [
        'palette.nav.bg must be hex or rgb()/rgba(), got "url(evil)"',
        "palette.nav.active is not a contract nav field",
        "palette.charts must be an array of at least 5 hex/rgb(a) colors",
        "palette.chartsDark must be an array of at least 5 hex/rgb(a) colors",
    ])
})

test("HSL-triplet convention (hsl(var(--primary)) apps)", () => {
    const { theme, warnings } = importCss(`
        :root {
          --primary: 174 42% 34%;
          --background: 0 0% 100%;
          --destructive: 0 84.2% 60.2%;
        }
    `)
    assert.deepEqual(warnings, [])
    assert.equal(theme.brand.primary, "#327b74")
    assert.equal(theme.palette.background, "#ffffff")
    assert.equal(theme.palette.danger, "#ef4444")
    assert.deepEqual(validateThemeFragment(theme), [])
})

test("hex and rgb()/rgba() literals", () => {
    const { theme, warnings } = importCss(`
        :root {
          --primary: #358F82;
          --background: rgb(231, 242, 239);
          --ring: rgba(53, 143, 130, 0.28);
        }
    `)
    assert.deepEqual(warnings, [])
    assert.equal(theme.brand.primary, "#358f82") // normalized to lowercase
    assert.equal(theme.palette.background, "#e7f2ef")
    assert.equal(theme.palette.ring, "rgba(53, 143, 130, 0.28)")
    assert.deepEqual(validateThemeFragment(theme), [])
})

test("unrecognized values warn and are skipped, never emitted", () => {
    const { theme, report, warnings } = importCss(`
        :root {
          --primary: var(--brand);
          --background: linear-gradient(#fff, #000);
          --card: #ffffff;
        }
    `)
    assert.equal(warnings.length, 2)
    assert.match(warnings[0], /--primary: unrecognized color/)
    assert.match(warnings[1], /--background: unrecognized color/)
    assert.equal(theme.brand, undefined)
    assert.equal(theme.palette.background, undefined)
    assert.equal(theme.palette.surface, "#ffffff")
    assert.match(report.join("\n"), /--primary var\(--brand\) → unrecognized value — skipped/)
    assert.deepEqual(validateThemeFragment(theme), [])
})

test("--accent equal to --primary is not emitted as surfaceHover", () => {
    const { theme, report } = importCss(`
        :root {
          --primary: 174 42% 34%;
          --accent: 174 42% 34%;
        }
    `)
    assert.equal(theme.palette?.surfaceHover, undefined)
    assert.match(
        report.join("\n"),
        /--accent .+ → equals --primary; palette\.surfaceHover left to the kernel default/,
    )
})

test("brand fields reject alpha colors (the contract requires hex)", () => {
    const { theme, warnings } = importCss(`:root { --primary: rgba(53, 143, 130, 0.5); }`)
    assert.equal(theme.brand, undefined)
    assert.match(warnings[0], /must be a hex but .* carries alpha/)
})

test("radius snaps to the nearest preset md", () => {
    const sharp = importCss(`:root { --radius: 0.25rem; }`)
    assert.equal(sharp.theme.radius, "sharp")
    const round = importCss(`:root { --radius: 14px; }`)
    assert.equal(round.theme.radius, "round")
    const bogus = importCss(`:root { --radius: large; }`)
    assert.equal(bogus.theme.radius, undefined)
    assert.match(bogus.warnings[0], /--radius: unrecognized length/)
})

test("unknown font families emit the raw stack with a warning", () => {
    const { theme, warnings } = importCss(`:root { --font-sans: "Geist", system-ui, sans-serif; }`)
    assert.equal(theme.fontFamily, `"Geist", system-ui, sans-serif`)
    assert.match(warnings[0], /no close contract font preset for "geist"/)
    // Generic stacks map to their presets.
    assert.equal(importCss(`:root { --font-sans: Georgia, serif; }`).theme.fontFamily, "serif")
    assert.equal(importCss(`:root { --font-sans: ui-monospace, monospace; }`).theme.fontFamily, "mono")
})

test("color conversion sanity: known Tailwind oklch pairs", () => {
    // Pins the oklch matrix against Tailwind's published oklch→hex pairs.
    assert.equal(formatColor(parseColor("oklch(0.704 0.191 22.216)")), "#ff6467") // red-400
    assert.equal(formatColor(parseColor("oklch(0.929 0.013 255.508)")), "#e2e8f0") // slate-200
    assert.equal(formatColor(parseColor("oklch(0.551 0.027 264.364)")), "#6a7282") // slate-500
    assert.equal(formatColor(parseColor("oklch(1 0 0)")), "#ffffff")
})

test("mergeThemeFragment preserves non-theme fields and hand-tuned palette keys", () => {
    const existing = {
        $comment: "Project theme contract.",
        brand: { primary: "#1f6feb", primaryDark: "#90caf9" },
        radius: "soft",
        density: "comfortable",
        mode: "light",
        navigation: { variant: "inline" },
        ui: { forms: { presentation: "modal" } },
        palette: { shadowMd: "0 8px 24px rgba(31, 45, 42, 0.12)" },
    }
    const fragment = {
        brand: { primary: "#e96e6f" },
        radius: "soft",
        fontFamily: "inter",
        palette: { background: "#fbfaf9" },
    }
    const { merged, diff } = mergeThemeFragment(existing, fragment)
    // Non-theme fields and unimported palette keys survive; brand.primaryDark
    // stays until the import produces one.
    assert.equal(merged.$comment, existing.$comment)
    assert.equal(merged.density, "comfortable")
    assert.deepEqual(merged.navigation, { variant: "inline" })
    assert.deepEqual(merged.ui, { forms: { presentation: "modal" } })
    assert.equal(merged.palette.shadowMd, "0 8px 24px rgba(31, 45, 42, 0.12)")
    assert.equal(merged.brand.primaryDark, "#90caf9")
    // Imported fields land; the diff says what changed and what didn't.
    assert.equal(merged.brand.primary, "#e96e6f")
    assert.equal(merged.palette.background, "#fbfaf9")
    assert.equal(merged.fontFamily, "inter")
    const text = diff.join("\n")
    assert.match(text, /brand\.primary: "#1f6feb" → "#e96e6f"/)
    assert.match(text, /palette\.background: added → "#fbfaf9"/)
    assert.match(text, /radius: unchanged \(soft\)/)
})

test("CLI: dry run prints the fragment without writing; --write merges into repobot.theme.json", () => {
    const work = mkdtempSync(path.join(os.tmpdir(), "import-theme-test-"))
    try {
        const stylesPath = path.join(work, "styles.css")
        writeFileSync(stylesPath, DOCU_SEA_FIXTURE)
        const themePath = path.join(work, "repobot.theme.json")
        writeFileSync(
            themePath,
            `${JSON.stringify(
                {
                    $comment: "Project theme contract.",
                    brand: { primary: "#1f6feb", primaryDark: "#90caf9" },
                    density: "compact",
                    ui: { loaders: { style: "gate" } },
                },
                null,
                4,
            )}\n`,
        )

        const dry = spawnSync(process.execPath, [SCRIPT, stylesPath, work], { encoding: "utf8" })
        assert.equal(dry.status, 0, dry.stderr)
        assert.match(dry.stdout, /"primary": "#e96e6f"/)
        assert.match(dry.stdout, /Mapping report:/)
        assert.match(dry.stdout, /\(dry run — pass --write/)
        // The dry run must not touch the file.
        assert.match(readFileSync(themePath, "utf8"), /#1f6feb/)

        const write = spawnSync(process.execPath, [SCRIPT, stylesPath, "--write", work], { encoding: "utf8" })
        assert.equal(write.status, 0, write.stderr)
        assert.match(write.stdout, /diff summary:/)
        assert.match(write.stdout, /brand\.primary: "#1f6feb" → "#e96e6f"/)
        const written = JSON.parse(readFileSync(themePath, "utf8"))
        assert.equal(written.brand.primary, "#e96e6f")
        assert.equal(written.brand.primaryDark, "#e2e8f0")
        assert.equal(written.palette.background, "#fbfaf9")
        assert.equal(written.fontFamily, "inter")
        // Non-theme fields preserved.
        assert.equal(written.$comment, "Project theme contract.")
        assert.equal(written.density, "compact")
        assert.deepEqual(written.ui, { loaders: { style: "gate" } })
        // The written file passes the contract's rules.
        assert.deepEqual(validateThemeFragment(written), [])
    } finally {
        rmSync(work, { recursive: true, force: true })
    }
})

test("CLI: --dark none ignores the .dark block; --dark <file> reads a separate dark theme", () => {
    const work = mkdtempSync(path.join(os.tmpdir(), "import-theme-dark-test-"))
    try {
        const stylesPath = path.join(work, "styles.css")
        writeFileSync(stylesPath, DOCU_SEA_FIXTURE)

        const noDark = spawnSync(process.execPath, [SCRIPT, stylesPath, "--dark", "none", work], {
            encoding: "utf8",
        })
        assert.equal(noDark.status, 0, noDark.stderr)
        assert.match(noDark.stdout, /0 dark vars \(none\)/)
        assert.doesNotMatch(noDark.stdout, /backgroundDark/)

        const darkPath = path.join(work, "dark.css")
        writeFileSync(darkPath, `:root { --background: #121216; --primary: #9cc3ff; }`)
        const fileDark = spawnSync(process.execPath, [SCRIPT, stylesPath, "--dark", darkPath, work], {
            encoding: "utf8",
        })
        assert.equal(fileDark.status, 0, fileDark.stderr)
        assert.match(fileDark.stdout, /\[dark\] --background #121216 → palette\.backgroundDark = #121216/)
        assert.match(fileDark.stdout, /\[dark\] --primary #9cc3ff → brand\.primaryDark = #9cc3ff/)
    } finally {
        rmSync(work, { recursive: true, force: true })
    }
})
