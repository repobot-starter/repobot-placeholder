import { readFileSync } from "node:fs"
import path from "node:path"
import {
    buildMarketingContractCss,
    marketingPresetDefinitions,
    marketingPresetNames,
    resolvePresetOverlay,
    type LandingConfig,
    type MarketingPresetName,
    type RepobotThemeConfig,
} from "@base/design-system"
import { cleanup, render } from "@testing-library/react"
import React from "react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
    MARKETING_PRESET_DESCRIPTIONS,
    MARKETING_TREATMENT_DESCRIPTIONS,
} from "../../../design-system/src/marketing/theme/presetDescriptions"
import { contrastText, mixHex, relativeLuminance } from "../../../design-system/src/theme/themeConfig"
import careCatalog from "../../../../packs/care/catalog.json"
import galaCatalog from "../../../../packs/gala/catalog.json"
import interiorsCatalog from "../../../../packs/interiors/catalog.json"
import photographyFamilyCatalog from "../../../../packs/photography-family/catalog.json"
import reunionCatalog from "../../../../packs/reunion/catalog.json"
import servicesCatalog from "../../../../packs/services/catalog.json"
import servicesBuilderCatalog from "../../../../packs/services-builder/catalog.json"
import servicesEmergencyCatalog from "../../../../packs/services-emergency/catalog.json"
import servicesRecurringCatalog from "../../../../packs/services-recurring/catalog.json"
import vowsCatalog from "../../../../packs/vows/catalog.json"
import weddingEditionCatalog from "../../../../packs/wedding-edition/catalog.json"

// The shared shells append the project manifest's marketing pages to every
// nav; pin it empty so renders depend on the pack alone.
vi.mock("../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))
import { homeLanding as careHome } from "../../src/View/Care/careLanding"
import { homeLanding as galaHome } from "../../src/View/Gala/galaLanding"
import { homeLanding as interiorsHome } from "../../src/View/Interiors/interiorsLanding"
import { landing as canonicalLanding } from "../../src/View/Landing/landing"
import { applySitePageDocument } from "../../src/View/Landing/landingDocument"
import { LandingRenderer } from "../../src/View/Landing/LandingRenderer"
import { homeLanding as photographyFamilyHome } from "../../src/View/PhotographyFamily/familyLanding"
import { homeLanding as reunionHome } from "../../src/View/Reunion/reunionLanding"
import { homeLanding as servicesHome } from "../../src/View/Services/servicesLanding"
import { homeLanding as servicesEmergencyHome } from "../../src/View/ServicesEmergency/servicesEmergencyLanding"
import { homeLanding as servicesRecurringHome } from "../../src/View/ServicesRecurring/servicesRecurringLanding"
import { homeLanding as vowsHome } from "../../src/View/Vows/vowsLanding"
import { homeLanding as weddingEditionHome } from "../../src/View/WeddingEdition/editionLanding"

/**
 * Remix safety: a remix re-values `style.preset` over a template's content,
 * so every register must work on every template, and pressing back must
 * restore the template exactly. The rendered half of this contract (real
 * layout: overflow, measured contrast, loaded faces) is
 * scripts/verify-preset-remix.mjs, which drives built bundles in a browser.
 */

const NOW = new Date("2026-09-24T10:30:00Z")

function contrast(a: string, b: string): number {
    const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
    return (light + 0.05) / (dark + 0.05)
}

/** Brand accents a customer can bring: pale, near-black, saturated, mid-gray, yellow, blue. */
const BRANDS = [
    null,
    { accent: "#f5f0e6", accentDark: "#fafafa" },
    { accent: "#101418", accentDark: "#0b0d10" },
    { accent: "#e11d48", accentDark: "#fb7185" },
    { accent: "#7c7c7c", accentDark: "#8a8a8a" },
    { accent: "#facc15", accentDark: "#fde047" },
    { accent: "#2563eb", accentDark: "#60a5fa" },
] as const

/** A plate-ink token as the color it resolves to (the tokens emit CSS). */
function resolveInk(value: string, text: string, accent: string): string {
    if (value === "var(--marketing-color-text)") return text
    if (value.startsWith("color-mix(")) return mixHex(accent, "#000000", 0.28)
    return value
}

describe("preset tokens stay legible under any brand", () => {
    it("page ink reads on the page ground and on surfaces", () => {
        for (const name of marketingPresetNames) {
            for (const mode of ["light", "dark"] as const) {
                const { palette } = marketingPresetDefinitions[name].modes[mode]
                expect(
                    contrast(palette.text, palette.pageBg),
                    `${name}/${mode} text on page`,
                ).toBeGreaterThanOrEqual(4.5)
                expect(
                    contrast(palette.text, palette.surface),
                    `${name}/${mode} text on surface`,
                ).toBeGreaterThanOrEqual(4.5)
                expect(
                    contrast(palette.subtle, palette.pageBg),
                    `${name}/${mode} subtle on page`,
                ).toBeGreaterThanOrEqual(3)
            }
        }
    })

    it("plate inks clear the floor on accent and spot-1 plates for every brand", () => {
        // 4.3, not 4.5: the better of the two fallback inks on the worst
        // mid-tone plate a brand can bring is ≈4.4:1 — no ink does better.
        const FLOOR = 4.3
        for (const name of marketingPresetNames) {
            const definition = marketingPresetDefinitions[name]
            for (const mode of ["light", "dark"] as const) {
                const variant = definition.modes[mode]
                for (const brand of BRANDS) {
                    const overlay = resolvePresetOverlay(definition, mode, brand, null)
                    const label = `${name}/${mode}/${brand?.accent ?? "own"}`
                    const onAccent = resolveInk(overlay.inkOnAccent, variant.palette.text, overlay.accent)
                    const spot1 = variant.spot?.[0] ?? overlay.accent
                    const onSpot = resolveInk(overlay.inkOnSpot, variant.palette.text, overlay.accent)
                    expect(contrast(onAccent, overlay.accent), `${label} inkOnAccent`).toBeGreaterThanOrEqual(
                        FLOOR,
                    )
                    expect(contrast(onSpot, spot1), `${label} inkOnSpot`).toBeGreaterThanOrEqual(FLOOR)
                }
            }
        }
    })

    it("an authored CTA label ink reads on the register's own accent and on any brand", () => {
        // gala and services-builder stamp their register's accent as the
        // brand: on its own template the label holds body-text contrast;
        // remixed onto another's brand it holds the plate-ink floor.
        const stamped = [galaCatalog, servicesBuilderCatalog].map(({ landing, theme }) => ({
            preset: landing.style.preset,
            brand: { accent: theme.brand.primary, accentDark: theme.brand.primaryDark },
        }))
        const authoring = marketingPresetNames.filter((name) =>
            (["light", "dark"] as const).some(
                (mode) => marketingPresetDefinitions[name].modes[mode].palette.onAccent !== undefined,
            ),
        )
        expect(authoring).toEqual(expect.arrayContaining(["ballroom", "lounge", "tideline"]))
        for (const name of authoring) {
            const definition = marketingPresetDefinitions[name]
            const own = stamped.filter(({ preset }) => preset === name).map(({ brand }) => brand)
            const others = stamped.filter(({ preset }) => preset !== name).map(({ brand }) => brand)
            for (const mode of ["light", "dark"] as const) {
                if (definition.modes[mode].palette.onAccent === undefined) continue
                for (const brand of [null, ...own]) {
                    const overlay = resolvePresetOverlay(definition, mode, brand, null)
                    expect(
                        contrast(overlay.onAccent, overlay.accent),
                        `${name}/${mode}/${brand?.accent ?? "own"} onAccent`,
                    ).toBeGreaterThanOrEqual(4.5)
                }
                for (const brand of [...BRANDS, ...others]) {
                    const overlay = resolvePresetOverlay(definition, mode, brand, null)
                    expect(
                        contrast(overlay.onAccent, overlay.accent),
                        `${name}/${mode}/${brand?.accent ?? "own"} onAccent`,
                    ).toBeGreaterThanOrEqual(4.3)
                }
            }
        }
    })

    it("the default CTA label keeps contrastText at 3:1 and flips only below it", () => {
        const editorial = marketingPresetDefinitions.editorial
        expect(editorial.modes.dark.palette.onAccent).toBeUndefined()
        const label = (accentDark: string) =>
            resolvePresetOverlay(editorial, "dark", { accent: "#101418", accentDark }, null).onAccent
        // White that reads stays white, even under 4.5:1 where the dark ink would score higher.
        expect(label("#2563eb")).toBe("#ffffff")
        expect(contrast("#ffffff", "#d05a41")).toBeGreaterThan(3)
        expect(contrast("#ffffff", "#d05a41")).toBeLessThan(4.5)
        expect(label("#d05a41")).toBe("#ffffff")
        // gala's dark gold carried white at 2.24:1: the label takes the dark ink.
        expect(contrast("#ffffff", "#d4a72c")).toBeLessThan(3)
        expect(label("#d4a72c")).toBe(contrastText("#ffffff"))
        expect(contrast(label("#d4a72c"), "#d4a72c")).toBeGreaterThanOrEqual(4.5)

        const stamped = [galaCatalog.theme.brand, servicesBuilderCatalog.theme.brand].map((brand) => ({
            accent: brand.primary,
            accentDark: brand.primaryDark,
        }))
        for (const name of marketingPresetNames) {
            const definition = marketingPresetDefinitions[name]
            for (const mode of ["light", "dark"] as const) {
                if (definition.modes[mode].palette.onAccent !== undefined) continue
                for (const brand of [...BRANDS, ...stamped]) {
                    const overlay = resolvePresetOverlay(definition, mode, brand, null)
                    const kernel = contrastText(overlay.accent)
                    const where = `${name}/${mode}/${brand?.accent ?? "own"}`
                    if (contrast(kernel, overlay.accent) >= 3) {
                        expect(overlay.onAccent, where).toBe(kernel)
                    } else {
                        expect(overlay.onAccent, where).not.toBe(kernel)
                        expect(contrast(overlay.onAccent, overlay.accent), where).toBeGreaterThanOrEqual(3)
                    }
                }
            }
        }
    })

    it("the live theme repaint re-declares the plate inks with the brand", () => {
        const css = buildMarketingContractCss({
            brand: { primary: "#f5f0e6", primaryDark: "#fafafa" },
        } as RepobotThemeConfig)
        const blocks = css.split("}\n").filter((block) => block.trim().length > 0)
        expect(blocks).toHaveLength(marketingPresetNames.length * 2)
        for (const block of blocks) {
            expect(block).toContain("--marketing-color-inkOnAccent:")
            expect(block).toContain("--marketing-color-inkOnSpot:")
        }
    })
})

describe("preset faces are registered wherever a preset can land", () => {
    const appRoot = path.resolve(__dirname, "../..")
    const indexHtml = readFileSync(path.join(appRoot, "index.html"), "utf8")
    const fontsCss = readFileSync(path.join(appRoot, "src/fonts.css"), "utf8")
    const googleFamilies = new Set(
        [...indexHtml.matchAll(/family=([^:&"]+)/g)].map(([, family]) =>
            decodeURIComponent(family.replace(/\+/g, " ")),
        ),
    )
    const selfHosted = new Set(
        [...fontsCss.matchAll(/font-family:\s*["']([^"']+)["']/g)].map(([, family]) => family),
    )
    // Faces every desktop platform ships: the stacks name them on purpose.
    const PLATFORM = new Set(["Tahoma", "Verdana", "Georgia", "ui-sans-serif", "ui-serif", "ui-monospace"])

    it("every preset's display, body and script faces load globally, not per template", () => {
        for (const name of marketingPresetNames) {
            const { fonts } = marketingPresetDefinitions[name]
            for (const stack of [fonts.display, fonts.body, fonts.script].filter(
                (value) => value !== undefined,
            )) {
                const family = stack
                    .split(",")[0]
                    .trim()
                    .replace(/^['"]|['"]$/g, "")
                expect(
                    googleFamilies.has(family) || selfHosted.has(family) || PLATFORM.has(family),
                    `${name}: '${family}' is neither in index.html's Google Fonts links nor in fonts.css`,
                ).toBe(true)
            }
        }
    })
})

describe("the vocabulary is described", () => {
    it("every preset and treatment flag has its art direction", () => {
        for (const name of marketingPresetNames) {
            expect(MARKETING_PRESET_DESCRIPTIONS[name]?.length ?? 0, name).toBeGreaterThan(20)
            for (const flag of marketingPresetDefinitions[name].treatment) {
                expect(
                    MARKETING_TREATMENT_DESCRIPTIONS[flag]?.length ?? 0,
                    `${name}: ${flag}`,
                ).toBeGreaterThan(20)
            }
        }
    })
})

function renderLanding(config: LandingConfig): HTMLElement {
    const { container } = render(
        <MemoryRouter>
            <LandingRenderer config={config} leadStorageKey="preset-remix-test" />
        </MemoryRouter>,
    )
    return container
}

function wornPreset(container: HTMLElement): string | null {
    return container.querySelector("[data-marketing-preset]")?.getAttribute("data-marketing-preset") ?? null
}

describe("every preset renders the canonical landing document", () => {
    afterEach(cleanup)

    it.each(marketingPresetNames)("%s", (preset) => {
        const errors = vi.spyOn(console, "error").mockImplementation(() => {})
        const container = renderLanding({ ...canonicalLanding, style: { ...canonicalLanding.style, preset } })
        expect(wornPreset(container)).toBe(preset)
        expect(container.querySelectorAll("[data-rb-section]").length).toBeGreaterThan(3)
        expect(errors).not.toHaveBeenCalled()
        errors.mockRestore()
    })
})

/** repobot.landing.json as a pack catalog declares it. */
interface LandingDocument {
    style: { preset: MarketingPresetName } & Record<string, unknown>
    [key: string]: unknown
}

interface PackCase {
    key: string
    catalog: { landing: LandingDocument }
    home: () => LandingConfig
}

const PACKS: PackCase[] = [
    { key: "care", catalog: careCatalog as unknown as PackCase["catalog"], home: () => careHome("", NOW) },
    { key: "gala", catalog: galaCatalog as unknown as PackCase["catalog"], home: () => galaHome("", NOW) },
    {
        key: "interiors",
        catalog: interiorsCatalog as unknown as PackCase["catalog"],
        home: () => interiorsHome(""),
    },
    {
        key: "photography-family",
        catalog: photographyFamilyCatalog as unknown as PackCase["catalog"],
        home: () => photographyFamilyHome(""),
    },
    {
        key: "reunion",
        catalog: reunionCatalog as unknown as PackCase["catalog"],
        home: () => reunionHome("", NOW),
    },
    {
        key: "services",
        catalog: servicesCatalog as unknown as PackCase["catalog"],
        home: () => servicesHome("", NOW),
    },
    {
        key: "services-emergency",
        catalog: servicesEmergencyCatalog as unknown as PackCase["catalog"],
        home: () => servicesEmergencyHome("", NOW),
    },
    {
        key: "services-recurring",
        catalog: servicesRecurringCatalog as unknown as PackCase["catalog"],
        home: () => servicesRecurringHome("", NOW),
    },
    { key: "vows", catalog: vowsCatalog as unknown as PackCase["catalog"], home: () => vowsHome("", NOW) },
    {
        key: "wedding-edition",
        catalog: weddingEditionCatalog as unknown as PackCase["catalog"],
        home: () => weddingEditionHome("", NOW),
    },
]

/** What the platform's Looks control writes: the document with a new root preset. */
function remixDocument(landingDocument: LandingDocument, preset: MarketingPresetName): LandingDocument {
    return { ...landingDocument, style: { ...landingDocument.style, preset } }
}

describe("remix round trip: another register and back restores the template", () => {
    afterEach(cleanup)

    it.each(PACKS)("$key", ({ catalog, home }) => {
        const landingDocument = catalog.landing
        const own = landingDocument.style.preset
        const pristineDocument = JSON.stringify(landingDocument)
        const original = applySitePageDocument(home(), "home", landingDocument)
        const pristineConfig = JSON.stringify(original)
        const originalContainer = renderLanding(original)
        const originalMarkup = originalContainer.innerHTML
        expect(wornPreset(originalContainer)).toBe(own)
        cleanup()

        // Two far registers: the neighbors on either side in the vocabulary.
        const index = marketingPresetNames.indexOf(own)
        const away = [
            marketingPresetNames[(index + 1) % marketingPresetNames.length],
            marketingPresetNames[(index + marketingPresetNames.length - 1) % marketingPresetNames.length],
        ]
        let current: LandingDocument = landingDocument
        for (const preset of away) {
            current = remixDocument(current, preset)
            const container = renderLanding(applySitePageDocument(home(), "home", current))
            expect(wornPreset(container)).toBe(preset)
            cleanup()
        }

        const restored = remixDocument(current, own)
        expect(JSON.stringify(restored)).toBe(pristineDocument)
        const back = applySitePageDocument(home(), "home", restored)
        expect(JSON.stringify(back)).toBe(pristineConfig)
        expect(renderLanding(back).innerHTML).toBe(originalMarkup)
        // Rendering under other registers never wrote into the template.
        expect(JSON.stringify(landingDocument)).toBe(pristineDocument)
        expect(JSON.stringify(original)).toBe(pristineConfig)
    })
})
