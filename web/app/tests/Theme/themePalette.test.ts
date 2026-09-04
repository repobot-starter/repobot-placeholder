import { contrastText, isShadowValue, mixHex, resolveThemeTokens, themeConfig } from "@base/design-system"
import { afterEach, describe, expect, it, vi } from "vitest"

/**
 * The `palette`/`motion` contract blocks (docs/design-system.md "Theming").
 * These tests feed SYNTHETIC contracts through the pure resolver, so they
 * hold in every project regardless of the committed repobot.theme.json —
 * the theme-agnostic way (see themeConfig.test.ts).
 */

afterEach(() => {
    vi.restoreAllMocks()
})

describe("byte-identical defaults (Plan 2 A0 backward compatibility)", () => {
    // With no palette/motion in the contract, every pre-palette token must
    // resolve to exactly its pre-change value: existing customer apps' derived
    // CSS custom properties stay byte-identical. The palette era's additions
    // (color.ring, shadow.xl, motion.*) are pinned separately at the bottom.
    const resolved = resolveThemeTokens({})

    it("resolves the pre-palette light color set verbatim", () => {
        expect(resolved.lightColors).toEqual({
            background: "#f6f7f9",
            surface: "#ffffff",
            surfaceHover: "#eef2f8",
            ring: "#eef2f8", // addition: defaults to surfaceHover, its pre-palette source
            muted: "#eef2f8", // A0.2 addition: the muted surface, defaults to surfaceHover
            input: "#dce1ea", // A0.2 addition: form-control border, defaults to border
            border: "#dce1ea",
            textPrimary: "#12161f",
            textSecondary: "#576074",
            accent: "#1f6feb",
            accentHover: "#1a5fd0",
            accentText: "#ffffff",
            danger: "#b91c1c",
            dangerSurface: "rgba(239, 68, 68, 0.12)",
            success: "#166534",
            successSurface: "rgba(34, 197, 94, 0.16)",
            warning: "#b45309", // A0.2 addition: amber, the danger/success pattern
            warningSurface: "rgba(245, 158, 11, 0.14)",
            info: "#0369a1", // A0.2 addition: sky
            infoSurface: "rgba(14, 165, 233, 0.14)",
            overlay: "rgba(15, 18, 24, 0.4)",
            skeleton: "#e5e9f0",
        })
    })

    it("resolves the pre-palette dark color set verbatim", () => {
        expect(resolved.darkColors).toEqual({
            background: "#17191d",
            surface: "#1e2126",
            surfaceHover: "#262a31",
            ring: "#262a31", // addition: defaults to surfaceHover
            muted: "#262a31", // A0.2 addition
            input: "#2a2f37", // A0.2 addition
            border: "#2a2f37",
            textPrimary: "#f3f4f6",
            textSecondary: "#b6bcc8",
            accent: "#90caf9",
            accentHover: "#a8d5fb",
            accentText: "#071223",
            danger: "#fca5a5",
            dangerSurface: "rgba(239, 68, 68, 0.2)",
            success: "#86efac",
            successSurface: "rgba(34, 197, 94, 0.2)",
            warning: "#fcd34d", // A0.2 addition
            warningSurface: "rgba(245, 158, 11, 0.2)",
            info: "#7dd3fc", // A0.2 addition
            infoSurface: "rgba(14, 165, 233, 0.2)",
            overlay: "rgba(0, 0, 0, 0.55)",
            skeleton: "#262a31",
        })
    })

    it("resolves the pre-palette shadow ramps verbatim (plus the new xl headroom)", () => {
        expect(resolved.lightShadows).toEqual({
            sm: "0 2px 8px rgba(15, 18, 24, 0.08)",
            md: "0 8px 24px rgba(15, 18, 24, 0.12)",
            lg: "0 20px 48px rgba(15, 18, 24, 0.18)",
            xl: "0 28px 64px rgba(15, 18, 24, 0.22)", // addition: extends the ramp
        })
        expect(resolved.darkShadows).toEqual({
            sm: "0 2px 8px rgba(0, 0, 0, 0.24)",
            md: "0 8px 24px rgba(0, 0, 0, 0.3)",
            lg: "0 20px 48px rgba(0, 0, 0, 0.4)",
            xl: "0 28px 64px rgba(0, 0, 0, 0.48)", // addition
        })
    })

    it("resolves the pre-palette navigation derivation verbatim", () => {
        expect(resolved.lightNavigation).toEqual({
            sidebarBg: "#ffffff",
            itemText: "#576074",
            itemHoverBg: "#eef2f8",
            itemHoverText: "#12161f",
            itemActiveBg: "#e4eefd",
            itemActiveText: "#1f6feb",
            border: "#dce1ea", // A0.2 addition: defaults to the palette border
            ring: "#1f6feb", // A0.2 addition: the shell's focus color tracks the accent
        })
        expect(resolved.darkNavigation).toEqual({
            sidebarBg: "#1e2126",
            itemText: "#b6bcc8",
            itemHoverBg: "#262a31",
            itemHoverText: "#f3f4f6",
            itemActiveBg: "#333f4c",
            itemActiveText: "#acd7fb",
            border: "#2a2f37", // A0.2 addition
            ring: "#90caf9", // A0.2 addition
        })
    })

    it("resolves the chart ramp the components derived at runtime pre-A0.2", () => {
        // The accent-derived monochromatic progression ChartCardChart used to
        // mix on every render, now precomputed into the theme classes.
        expect(resolved.lightCharts).toEqual({
            1: "#1f6feb",
            2: "#6a9ff0",
            3: "#19478f",
            4: "#a0c1f3",
            5: "#576074",
            6: "#979ca9",
        })
        expect(resolved.darkCharts).toEqual({
            1: "#90caf9",
            2: "#668cac",
            3: "#bdddf8",
            4: "#476075",
            5: "#b6bcc8",
            6: "#767b84",
        })
    })

    it("resolves the pre-palette scales verbatim (plus the new motion clock)", () => {
        expect(resolved.scales).toEqual({
            space: { xxs: "2px", xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px", xxl: "40px" },
            radius: { sm: "6px", md: "10px", lg: "14px", pill: "999px" },
            fontSize: { xs: "12px", sm: "13px", md: "14px", lg: "16px", xl: "20px" },
            fontFamily: {
                body: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
            },
            motion: {
                // addition: the values components hardcoded pre-palette
                durationFast: "120ms",
                durationBase: "180ms",
                easing: "ease",
                easingEmphasis: "cubic-bezier(0.2, 0, 0, 1)",
            },
        })
    })

    it("reports no palette and the smooth motion preset", () => {
        expect(resolved.palette).toBeNull()
        expect(resolved.motionPreset).toBe("smooth")
        expect(resolved.brandIsKernelDefault).toBe(true)
    })
})

describe("palette resolution", () => {
    it("applies light values to the light color set", () => {
        const resolved = resolveThemeTokens({
            palette: { background: "#e7f2ef", surface: "#faf7f2", textSecondary: "#5d726d" },
        })
        expect(resolved.lightColors.background).toBe("#e7f2ef")
        expect(resolved.lightColors.surface).toBe("#faf7f2")
        expect(resolved.lightColors.textSecondary).toBe("#5d726d")
        // Untouched tokens keep the kernel defaults.
        expect(resolved.lightColors.border).toBe("#dce1ea")
        expect(resolved.palette).toEqual({
            background: "#e7f2ef",
            surface: "#faf7f2",
            textSecondary: "#5d726d",
        })
    })

    it("derives dark values from light hexes by blending toward the kernel dark counterpart", () => {
        const resolved = resolveThemeTokens({ palette: { background: "#e7f2ef" } })
        // The documented rule: 88% kernel dark + 12% of the light token's hue.
        expect(resolved.darkColors.background).toBe(mixHex("#e7f2ef", "#17191d", 0.88))
        expect(resolved.darkColors.background).toBe("#303336")
    })

    it("honors an explicit <name>Dark override over the derivation", () => {
        const resolved = resolveThemeTokens({
            palette: { background: "#e7f2ef", backgroundDark: "#10201c" },
        })
        expect(resolved.darkColors.background).toBe("#10201c")
    })

    it("keeps the kernel dark value for rgba palette colors without a Dark override", () => {
        const resolved = resolveThemeTokens({ palette: { overlay: "rgba(10, 60, 30, 0.5)" } })
        expect(resolved.lightColors.overlay).toBe("rgba(10, 60, 30, 0.5)")
        expect(resolved.darkColors.overlay).toBe("rgba(0, 0, 0, 0.55)")
    })

    it("accepts rgba colors anywhere a palette color is read", () => {
        const resolved = resolveThemeTokens({ palette: { ring: "rgba(53, 143, 130, 0.28)" } })
        expect(resolved.lightColors.ring).toBe("rgba(53, 143, 130, 0.28)")
        // rgba can't blend; the dark ring stands at the kernel default.
        expect(resolved.darkColors.ring).toBe("#262a31")
    })

    it("resolves ring from surfaceHover when only the hover wash is branded", () => {
        const resolved = resolveThemeTokens({ palette: { surfaceHover: "#f0e9dc" } })
        expect(resolved.lightColors.ring).toBe("#f0e9dc")
        expect(resolved.darkColors.ring).toBe(mixHex("#f0e9dc", "#262a31", 0.88))
    })

    it("lets an explicit ring beat the surfaceHover follow", () => {
        const resolved = resolveThemeTokens({
            palette: { surfaceHover: "#f0e9dc", ring: "#358f82", ringDark: "#7fc4b9" },
        })
        expect(resolved.lightColors.ring).toBe("#358f82")
        expect(resolved.darkColors.ring).toBe("#7fc4b9")
    })

    it("resolves muted and input from the tokens they fed pre-A0.2", () => {
        // No explicit values: muted follows surfaceHover, input follows border.
        const followed = resolveThemeTokens({
            palette: { surfaceHover: "#f0e9dc", border: "#d8cdb8" },
        })
        expect(followed.lightColors.muted).toBe("#f0e9dc")
        expect(followed.darkColors.muted).toBe(mixHex("#f0e9dc", "#262a31", 0.88))
        expect(followed.lightColors.input).toBe("#d8cdb8")
        expect(followed.darkColors.input).toBe(mixHex("#d8cdb8", "#2a2f37", 0.88))
        // Explicit values beat the follow, with the palette's dark rule.
        const explicit = resolveThemeTokens({
            palette: { muted: "#e8e2d4", input: "#c9bfa8", inputDark: "#4a4438" },
        })
        expect(explicit.lightColors.muted).toBe("#e8e2d4")
        expect(explicit.darkColors.muted).toBe(mixHex("#e8e2d4", "#262a31", 0.88))
        expect(explicit.lightColors.input).toBe("#c9bfa8")
        expect(explicit.darkColors.input).toBe("#4a4438")
    })

    it("flows warning/info and their surfaces through both modes", () => {
        const resolved = resolveThemeTokens({
            palette: { warning: "#d97706", info: "#0284c7", infoSurface: "rgba(2, 132, 199, 0.1)" },
        })
        expect(resolved.lightColors.warning).toBe("#d97706")
        expect(resolved.darkColors.warning).toBe(mixHex("#d97706", "#fcd34d", 0.88))
        expect(resolved.lightColors.info).toBe("#0284c7")
        expect(resolved.darkColors.info).toBe(mixHex("#0284c7", "#7dd3fc", 0.88))
        expect(resolved.lightColors.infoSurface).toBe("rgba(2, 132, 199, 0.1)")
        // rgba can't blend; the dark surface stands at the kernel default.
        expect(resolved.darkColors.infoSurface).toBe("rgba(14, 165, 233, 0.2)")
        // Untouched: the kernel warning surface defaults hold.
        expect(resolved.lightColors.warningSurface).toBe("rgba(245, 158, 11, 0.14)")
    })

    it("lets palette.accentText override the accent's on-color, dark included", () => {
        const resolved = resolveThemeTokens({ palette: { accentText: "#f7f3e8" } })
        expect(resolved.lightColors.accentText).toBe("#f7f3e8")
        expect(resolved.darkColors.accentText).toBe(mixHex("#f7f3e8", "#071223", 0.88))
    })

    it("derives the nav set from palette.nav, foregrounds from the bg's luminance", () => {
        // A dark custom sidebar: foregrounds flip to the light on-color and
        // the muted/hover/border fields blend out of the bg.
        const resolved = resolveThemeTokens({ palette: { nav: { bg: "#2b2622" } } })
        expect(resolved.lightNavigation.sidebarBg).toBe("#2b2622")
        expect(resolved.lightNavigation.itemHoverText).toBe(contrastText("#2b2622"))
        expect(resolved.lightNavigation.itemText).toBe(mixHex(contrastText("#2b2622"), "#2b2622", 0.4))
        expect(resolved.lightNavigation.itemHoverBg).toBe(mixHex("#2b2622", contrastText("#2b2622"), 0.08))
        expect(resolved.lightNavigation.border).toBe(mixHex("#2b2622", contrastText("#2b2622"), 0.16))
        // The active item keeps deriving from the brand accent, washed over
        // the nav bg; on a dark bg the active text lightens like dark mode.
        expect(resolved.lightNavigation.itemActiveBg).toBe(mixHex("#1f6feb", "#2b2622", 0.88))
        expect(resolved.lightNavigation.itemActiveText).toBe(mixHex("#1f6feb", "#ffffff", 0.25))
        // The dark side blends each field toward its kernel dark counterpart.
        expect(resolved.darkNavigation.sidebarBg).toBe(mixHex("#2b2622", "#1e2126", 0.88))
    })

    it("lets explicit nav fields beat the luminance derivation", () => {
        const resolved = resolveThemeTokens({
            palette: {
                nav: { bg: "#2b2622", text: "#f5efe6", muted: "#a89f93", ring: "#e8b04b" },
            },
        })
        expect(resolved.lightNavigation.sidebarBg).toBe("#2b2622")
        expect(resolved.lightNavigation.itemHoverText).toBe("#f5efe6")
        expect(resolved.lightNavigation.itemText).toBe("#a89f93")
        expect(resolved.lightNavigation.ring).toBe("#e8b04b")
        expect(resolved.darkNavigation.ring).toBe(mixHex("#e8b04b", "#90caf9", 0.88))
        // The accepted palette round-trips the nav sub-block for tooling.
        expect(resolved.palette?.nav).toEqual({
            bg: "#2b2622",
            text: "#f5efe6",
            muted: "#a89f93",
            ring: "#e8b04b",
        })
    })

    it("warns on invalid nav fields and unknown nav keys", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
        const resolved = resolveThemeTokens({
            palette: { nav: { bg: "url(evil)", text: "#f5efe6", active: "#000000" as never } },
        })
        expect(resolved.lightNavigation.sidebarBg).toBe("#ffffff")
        expect(resolved.lightNavigation.itemHoverText).toBe("#f5efe6")
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('invalid palette.nav.bg "url(evil)"'))
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("invalid palette.nav.active"))
    })

    it("assembles palette.charts into the six token slots, cycling a 5-color palette", () => {
        const resolved = resolveThemeTokens({
            palette: { charts: ["#111111", "#222222", "#333333", "#444444", "#555555"] },
        })
        expect(resolved.lightCharts).toEqual({
            1: "#111111",
            2: "#222222",
            3: "#333333",
            4: "#444444",
            5: "#555555",
            6: "#111111", // cycles
        })
        // No chartsDark: each slot blends toward the dark theme's own ramp
        // slot (the palette's 88% rule, per-mode ramp as the counterpart).
        const darkRamp = resolved.darkCharts
        expect(darkRamp[1]).toBe(mixHex("#111111", "#90caf9", 0.88))
        expect(darkRamp[5]).toBe(mixHex("#555555", "#b6bcc8", 0.88))
        // An explicit chartsDark wins outright.
        const explicit = resolveThemeTokens({
            palette: {
                charts: ["#111111", "#222222", "#333333", "#444444", "#555555"],
                chartsDark: ["#aaaaaa", "#bbbbbb", "#cccccc", "#dddddd", "#eeeeee", "#ffffff"],
            },
        })
        expect(explicit.darkCharts).toEqual({
            1: "#aaaaaa",
            2: "#bbbbbb",
            3: "#cccccc",
            4: "#dddddd",
            5: "#eeeeee",
            6: "#ffffff",
        })
    })

    it("warns and keeps the derived ramp on malformed charts arrays", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
        const resolved = resolveThemeTokens({
            palette: { charts: ["#111111", "#222222"] },
        })
        expect(resolved.lightCharts[1]).toBe("#1f6feb") // kernel derived ramp stands
        expect(resolved.palette).toBeNull()
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("invalid palette.charts"))
    })

    it("warns and falls back on invalid colors, keeping the accepted entries", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
        const resolved = resolveThemeTokens({
            palette: { background: "url(https://evil.example)", border: "#cfe0da" },
        })
        expect(resolved.lightColors.background).toBe("#f6f7f9")
        expect(resolved.lightColors.border).toBe("#cfe0da")
        expect(resolved.palette).toEqual({ border: "#cfe0da" })
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('invalid palette.background "url(https://evil.example)"'),
        )
    })

    it("warns on unknown palette keys (the accent lives in brand.primary)", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
        const resolved = resolveThemeTokens({ palette: { accent: "#ff0000" } as never })
        expect(resolved.lightColors.accent).toBe("#1f6feb")
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("unknown palette.accent"))
    })
})

describe("shadow tokens", () => {
    it("accepts free-form shadow strings: soft, hard-offset, and inset bevels", () => {
        expect(isShadowValue("none")).toBe(true)
        expect(isShadowValue("0 2px 8px rgba(15, 18, 24, 0.08)")).toBe(true)
        expect(isShadowValue("2px 2px 0 rgba(33, 33, 92, 0.18)")).toBe(true)
        // The Windows-95 bevel: hard inset strokes, commas inside and out.
        expect(isShadowValue("inset -1px -1px 0 #808080, inset 1px 1px 0 #ffffff")).toBe(true)
        expect(isShadowValue("0 2px 8px")).toBe(true) // colorless layer
        expect(isShadowValue("0 0 32px color-mix(in srgb, #1f6feb 24%, transparent)")).toBe(true)
    })

    it("rejects non-shadow shapes", () => {
        expect(isShadowValue("red")).toBe(false)
        expect(isShadowValue("10px")).toBe(false)
        expect(isShadowValue("")).toBe(false)
        expect(isShadowValue("0 2px 8px rgba(0, 0, 0, 0.2")).toBe(false) // unbalanced parens
        expect(isShadowValue("0 0 0 3px #fff; position: absolute")).toBe(false) // injection
        expect(isShadowValue(42)).toBe(false)
    })

    it("applies custom shadows and carries them into dark unless overridden", () => {
        const resolved = resolveThemeTokens({
            palette: {
                shadowMd: "4px 4px 0 rgba(33, 33, 92, 0.16)",
                shadowLgDark: "8px 8px 0 rgba(0, 0, 0, 0.5)",
            },
        })
        expect(resolved.lightShadows.md).toBe("4px 4px 0 rgba(33, 33, 92, 0.16)")
        // A shadow carries its own color: dark inherits the light string.
        expect(resolved.darkShadows.md).toBe("4px 4px 0 rgba(33, 33, 92, 0.16)")
        // The explicit dark override wins where set.
        expect(resolved.darkShadows.lg).toBe("8px 8px 0 rgba(0, 0, 0, 0.5)")
        expect(resolved.lightShadows.lg).toBe("0 20px 48px rgba(15, 18, 24, 0.18)")
    })

    it("warns and keeps the default ramp on invalid shadow strings", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
        const resolved = resolveThemeTokens({ palette: { shadowSm: "big and soft" } })
        expect(resolved.lightShadows.sm).toBe("0 2px 8px rgba(15, 18, 24, 0.08)")
        expect(resolved.darkShadows.sm).toBe("0 2px 8px rgba(0, 0, 0, 0.24)")
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("invalid palette.shadowSm"))
    })
})

describe("motion preset", () => {
    it("resolves snappy and instant clocks", () => {
        expect(resolveThemeTokens({ motion: "snappy" }).scales.motion).toEqual({
            durationFast: "80ms",
            durationBase: "140ms",
            easing: "ease-out",
            easingEmphasis: "cubic-bezier(0.2, 0, 0, 1)",
        })
        expect(resolveThemeTokens({ motion: "instant" }).scales.motion).toEqual({
            durationFast: "0ms",
            durationBase: "0ms",
            easing: "linear",
            easingEmphasis: "linear",
        })
    })

    it("warns and falls back to smooth on an invalid preset", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
        const resolved = resolveThemeTokens({ motion: "wild" as never })
        expect(resolved.motionPreset).toBe("smooth")
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('invalid motion "wild"'))
    })
})

describe("the committed contract (this repo)", () => {
    // The gallery/tooling surface exposes the new blocks; in a project whose
    // committed contract sets no palette (the kernel default), it reports none.
    it("exposes palette and motion through themeConfig", () => {
        expect(["smooth", "snappy", "instant"]).toContain(themeConfig.motion)
        if (themeConfig.palette === null) {
            expect(themeConfig.motion).toBe("smooth")
        } else {
            expect(Object.keys(themeConfig.palette).length).toBeGreaterThan(0)
        }
    })
})
