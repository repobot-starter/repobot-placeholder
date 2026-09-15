import { mixHex, resolveThemeTokens, type RepobotThemeConfig } from "@base/design-system"
import { describe, expect, it } from "vitest"

/**
 * Plan 2 A0 acceptance fixture — the docu-sea wave-14 token-gap finding,
 * expressible. The wave task pushed run-7's theme toward its reference app
 * and recorded what the contract could NOT say: "page background (#e7f2ef),
 * warm card surface (#faf7f2), border tint, text, muted, shadow, and ring
 * tokens are kernel-fixed until the palette block lands."
 *
 * The palette block is landed: this is that exact theme as a contract, and
 * the assertions pin the derived CSS custom property values (the resolved
 * token sets are what tokens.css.ts feeds to createTheme).
 */
const docuSeaContract: RepobotThemeConfig = {
    brand: { primary: "#358f82" }, // docu-sea teal (wave 14 set this much)
    radius: "soft", // md = 10px ≈ the reference's 0.625rem
    fontFamily: "inter",
    palette: {
        background: "#e7f2ef", // teal-wash page background
        surface: "#faf7f2", // warm cream card surface
        border: "#cfe0da", // teal-tinted border
        textPrimary: "#1f2d2a", // ink
        textSecondary: "#5d726d", // muted
        ring: "rgba(53, 143, 130, 0.28)", // teal focus halo
        shadowSm: "0 2px 8px rgba(31, 45, 42, 0.08)",
        shadowMd: "0 8px 24px rgba(31, 45, 42, 0.12)",
    },
}

const resolved = resolveThemeTokens(docuSeaContract)

describe("docu-sea wave-14 palette (acceptance fixture)", () => {
    it("expresses the wave-14 gap list: background, surface, border, text, muted, shadow, ring", () => {
        expect(resolved.lightColors.background).toBe("#e7f2ef")
        expect(resolved.lightColors.surface).toBe("#faf7f2")
        expect(resolved.lightColors.border).toBe("#cfe0da")
        expect(resolved.lightColors.textPrimary).toBe("#1f2d2a")
        expect(resolved.lightColors.textSecondary).toBe("#5d726d")
        expect(resolved.lightShadows.sm).toBe("0 2px 8px rgba(31, 45, 42, 0.08)")
        expect(resolved.lightShadows.md).toBe("0 8px 24px rgba(31, 45, 42, 0.12)")
        expect(resolved.lightColors.ring).toBe("rgba(53, 143, 130, 0.28)")
    })

    it("still flows the brand accent and contract presets through alongside", () => {
        expect(resolved.lightColors.accent).toBe("#358f82")
        expect(resolved.lightColors.accentText).toBe("#ffffff")
        expect(resolved.scales.radius.md).toBe("10px")
        expect(resolved.scales.fontFamily.body).toContain("'Inter'")
    })

    it("derives the dark set from the palette (kernel dark luminance + brand hue)", () => {
        expect(resolved.darkColors.background).toBe(mixHex("#e7f2ef", "#17191d", 0.88))
        expect(resolved.darkColors.surface).toBe(mixHex("#faf7f2", "#1e2126", 0.88))
        expect(resolved.darkColors.textPrimary).toBe(mixHex("#1f2d2a", "#f3f4f6", 0.88))
        // Shadows carry their own color, so the custom ramp inherits into dark…
        expect(resolved.darkShadows.md).toBe("0 8px 24px rgba(31, 45, 42, 0.12)")
        // …while the rgba ring can't blend: kernel dark stands.
        expect(resolved.darkColors.ring).toBe("#262a31")
    })

    it("re-derives the shell navigation from the branded surfaces", () => {
        expect(resolved.lightNavigation.sidebarBg).toBe("#faf7f2")
        expect(resolved.lightNavigation.itemText).toBe("#5d726d")
        expect(resolved.lightNavigation.itemActiveText).toBe("#358f82")
    })

    it("round-trips the accepted palette for tooling (theme importer previews)", () => {
        expect(resolved.palette).toEqual(docuSeaContract.palette)
    })
})

/* ------------------------------------------------------------------ */
/* Plan 2 A0.2 acceptance — the REAL docu-sea theme, as the importer   */
/* (scripts/import-theme.mjs) emits it from the reference app's CSS.   */
/* The A0.2 palette fields make its visible personality expressible:   */
/* the dark warm-charcoal sidebar, the 5-color chart ramp, the muted   */
/* surface/input split, warning/info, and the on-accent foreground.    */
/* ------------------------------------------------------------------ */
const docuSeaImported: RepobotThemeConfig = {
    brand: { primary: "#e96e6f", primaryDark: "#e2e8f0" }, // docu-sea coral
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
            // oklch(0.24 0.006 60) — the dark warm-charcoal sidebar.
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
}

const imported = resolveThemeTokens(docuSeaImported)

describe("docu-sea imported theme (A0.2 acceptance fixture)", () => {
    it("renders the dark warm-charcoal sidebar with its own foregrounds", () => {
        expect(imported.lightNavigation.sidebarBg).toBe("#211f1c")
        expect(imported.lightNavigation.itemText).toBe("#9b9795")
        expect(imported.lightNavigation.itemHoverText).toBe("#f3f1f0")
        expect(imported.lightNavigation.itemHoverBg).toBe("#302d2b")
        expect(imported.lightNavigation.border).toBe("#353230")
        expect(imported.lightNavigation.ring).toBe("#e96e6f")
        // The active item still derives from the brand accent — washed over
        // the charcoal bg, lightened like dark mode on the dark surface.
        expect(imported.lightNavigation.itemActiveBg).toBe(mixHex("#e96e6f", "#211f1c", 0.88))
        expect(imported.lightNavigation.itemActiveText).toBe(mixHex("#e96e6f", "#ffffff", 0.25))
    })

    it("carries the nav block into dark, deriving the fields docu-sea leaves unset", () => {
        expect(imported.darkNavigation.sidebarBg).toBe("#0f172b")
        expect(imported.darkNavigation.itemHoverText).toBe("#f8fafc")
        expect(imported.darkNavigation.border).toBe("rgba(255, 255, 255, 0.1)")
        // docu-sea's .dark block has no --nav-muted: the light value blends
        // toward the kernel dark counterpart (the palette's 88% rule).
        expect(imported.darkNavigation.itemText).toBe(mixHex("#9b9795", "#b6bcc8", 0.88))
    })

    it("runs the 5-color chart ramp through the six token slots", () => {
        expect(imported.lightCharts).toEqual({
            1: "#e96e6f",
            2: "#4f8ac6",
            3: "#51b67a",
            4: "#eba941",
            5: "#9470cd",
            6: "#e96e6f", // a 5-color palette cycles into the 6th slot
        })
        expect(imported.darkCharts).toEqual({
            1: "#1447e6",
            2: "#00bc7d",
            3: "#fe9a00",
            4: "#ad46ff",
            5: "#ff2056",
            6: "#1447e6",
        })
    })

    it("splits the muted surface from muted text and the input from the border", () => {
        expect(imported.lightColors.muted).toBe("#f4f2f0")
        expect(imported.lightColors.textSecondary).toBe("#75716d")
        expect(imported.darkColors.muted).toBe("#1d293d")
        expect(imported.lightColors.input).toBe("#e5e2e0")
        expect(imported.darkColors.input).toBe("rgba(255, 255, 255, 0.15)")
    })

    it("derives dark warning/info from the light hexes (docu-sea has no dark pair)", () => {
        expect(imported.lightColors.warning).toBe("#eba941")
        expect(imported.darkColors.warning).toBe(mixHex("#eba941", "#fcd34d", 0.88))
        expect(imported.lightColors.info).toBe("#4f8ac6")
        expect(imported.darkColors.info).toBe(mixHex("#4f8ac6", "#7dd3fc", 0.88))
        // Surfaces untouched: the kernel badge tints stand in both modes.
        expect(imported.lightColors.warningSurface).toBe("rgba(245, 158, 11, 0.14)")
        expect(imported.darkColors.infoSurface).toBe("rgba(14, 165, 233, 0.2)")
    })

    it("honors the on-accent foreground twin instead of the contrast derivation", () => {
        expect(imported.lightColors.accentText).toBe("#fcfcfc")
        expect(imported.darkColors.accentText).toBe("#0f172b")
    })

    it("round-trips the accepted palette for tooling (theme importer previews)", () => {
        expect(imported.palette).toEqual(docuSeaImported.palette)
    })
})
