import { createGlobalThemeContract, createTheme } from "@vanilla-extract/css"
import { packBrand, packFont } from "../../theme/themeConfig"
import {
    MARKETING_RADIUS_CONTROL_FLOOR_VAR,
    MARKETING_RADIUS_FLOOR_VAR,
    MARKETING_RADIUS_SCALE_VAR,
} from "./feelBridge"
import {
    marketingPresetDefinitions,
    resolvePresetOverlay,
    type MarketingMode,
    type MarketingPresetName,
    type PresetDefinition,
} from "./marketingPresets"

/**
 * The marketing token contract. Landing sections style themselves from these
 * variables only; a style preset assigns the full set, and
 * `LandingConfig.style.overrides` can re-assign individual vars at the page
 * root because the names are stable (`--marketing-*`) — that stability is
 * part of the landing kernel's public contract (docs/landing-kernel-spec.md).
 *
 * The preset definitions and the brand/font overlay math live in
 * marketingPresets.ts (a plain module): this file bakes them into static
 * theme classes at build time, and themeHotUpdate.ts re-runs the same
 * resolution to repaint live repobot.theme.json edits over these classes.
 *
 * Every preset bakes one class per appearance (light and dark); the theme
 * contract's resolved `mode` picks which one MarketingPage applies — the
 * Feel appearance toggle therefore restyles public pages, not just the app.
 */
export const marketing = createGlobalThemeContract(
    {
        color: {
            pageBg: null,
            surface: null,
            line: null,
            text: null,
            subtle: null,
            accent: null,
            accentSoft: null,
            onAccent: null,
            /**
             * Ink for text on an accent plate that keeps the page ink when
             * it reads there (≥4.5:1) and falls back to onAccent otherwise.
             */
            inkOnAccent: null,
            /**
             * Ink for text on a spot-1 plate: the deep-accent ink when it
             * reads there, otherwise the plate's own readable ink.
             */
            inkOnSpot: null,
        },
        font: {
            display: null,
            body: null,
        },
        display: {
            weight: null,
            tracking: null,
            /** "normal" | "italic" — how the headline's accent word is set. */
            accentStyle: null,
            /** "none" | "uppercase" — case treatment for display type. */
            transform: null,
            /**
             * Display-scale multiplier (the ambition axis): the big display
             * moments — hero headlines, stat numerals — calc() their sizes
             * against it, so monumental registers grow the type without
             * every section re-authoring its clamp.
             */
            scale: null,
        },
        shape: {
            radiusCard: null,
            radiusControl: null,
            borderWidth: null,
            shadowCard: null,
            shadowCta: null,
        },
        background: {
            /** Full background-image value for the page (gradients or "none"). */
            page: null,
        },
        motion: {
            /** Rise-on-load duration; "0ms" disables. */
            rise: null,
        },
        layout: {
            maxWidth: null,
        },
    },
    (_value, path) => `marketing-${path.join("-")}`,
)

export type { MarketingMode, MarketingPresetName } from "./marketingPresets"
export { grainTile } from "./marketingPresets"

/**
 * The Feel bridge: theme-contract radius/density land on marketing pages as
 * scale factors (set inline by MarketingPage), and the preset's authored
 * radii become calc() of the factor. The user's Feel choice wins over the
 * preset's art direction: Sharp zeroes every radius; Soft amplifies AND
 * enforces a floor (so square-authored looks — atelier, brutalist,
 * photography's set — visibly soften instead of the control being a
 * silent no-op); Round goes further and takes CONTROLS to full pills
 * through their own floor, while cards keep a generous-but-sane floor
 * (a 999px card is a capsule, not a corner). The defaults make the vars
 * optional (sections and older documents never notice them).
 *
 * The var names and the scaledSpace() helper live in feelBridge.ts (plain
 * module): vanilla-extract files may only export serializable values.
 */
function scaledRadius(authored: string): string {
    return `max(calc(${authored} * var(${MARKETING_RADIUS_SCALE_VAR}, 1)), var(${MARKETING_RADIUS_FLOOR_VAR}, 0px))`
}

function scaledControlRadius(authored: string): string {
    return `max(calc(${authored} * var(${MARKETING_RADIUS_SCALE_VAR}, 1)), var(${MARKETING_RADIUS_CONTROL_FLOOR_VAR}, var(${MARKETING_RADIUS_FLOOR_VAR}, 0px)))`
}

function buildPresetTheme(definition: PresetDefinition, mode: MarketingMode): string {
    // Resolution order (packs/README.md): customer brand > preset palette.
    const overlay = resolvePresetOverlay(
        definition,
        mode,
        packBrand ? { accent: packBrand.accent, accentDark: packBrand.accentDark } : null,
        packFont,
    )
    const variant = definition.modes[mode]
    return createTheme(marketing, {
        color: {
            pageBg: variant.palette.pageBg,
            surface: variant.palette.surface,
            line: variant.palette.line,
            text: variant.palette.text,
            subtle: variant.palette.subtle,
            accent: overlay.accent,
            accentSoft: overlay.accentSoft,
            onAccent: overlay.onAccent,
            inkOnAccent: overlay.inkOnAccent,
            inkOnSpot: overlay.inkOnSpot,
        },
        font: { display: overlay.fontDisplay, body: overlay.fontBody },
        display: definition.display,
        shape: {
            radiusCard: scaledRadius(definition.shape.radiusCard),
            radiusControl: scaledControlRadius(definition.shape.radiusControl),
            borderWidth: definition.shape.borderWidth,
            shadowCard: variant.shadowCard,
            shadowCta: overlay.shadowCta,
        },
        background: { page: overlay.backgroundPage },
        motion: { rise: definition.motion.rise },
        layout: { maxWidth: definition.maxWidth },
    })
}

function buildPresetModeClasses(name: MarketingPresetName): Record<MarketingMode, string> {
    return {
        light: buildPresetTheme(marketingPresetDefinitions[name], "light"),
        dark: buildPresetTheme(marketingPresetDefinitions[name], "dark"),
    }
}

/**
 * Preset name → per-appearance theme classes; `MarketingPage` applies the
 * one the resolved theme mode selects.
 */
export const marketingPresetModeClasses: Record<MarketingPresetName, Record<MarketingMode, string>> = {
    "dark-dev": buildPresetModeClasses("dark-dev"),
    "soft-saas": buildPresetModeClasses("soft-saas"),
    editorial: buildPresetModeClasses("editorial"),
    brutalist: buildPresetModeClasses("brutalist"),
    "warm-boutique": buildPresetModeClasses("warm-boutique"),
    "mono-utility": buildPresetModeClasses("mono-utility"),
    "aurora-dark": buildPresetModeClasses("aurora-dark"),
    "luxe-light": buildPresetModeClasses("luxe-light"),
    atelier: buildPresetModeClasses("atelier"),
    heirloom: buildPresetModeClasses("heirloom"),
    tourbook: buildPresetModeClasses("tourbook"),
    monolith: buildPresetModeClasses("monolith"),
    lanternlight: buildPresetModeClasses("lanternlight"),
    sitework: buildPresetModeClasses("sitework"),
    brownstone: buildPresetModeClasses("brownstone"),
    marquee: buildPresetModeClasses("marquee"),
    ballroom: buildPresetModeClasses("ballroom"),
    picnic: buildPresetModeClasses("picnic"),
    chalk: buildPresetModeClasses("chalk"),
    hymnal: buildPresetModeClasses("hymnal"),
    broadside: buildPresetModeClasses("broadside"),
    crt: buildPresetModeClasses("crt"),
    handheld: buildPresetModeClasses("handheld"),
    lounge: buildPresetModeClasses("lounge"),
    retroware: buildPresetModeClasses("retroware"),
    tideline: buildPresetModeClasses("tideline"),
    memphis: buildPresetModeClasses("memphis"),
    jacaranda: buildPresetModeClasses("jacaranda"),
    tabloid: buildPresetModeClasses("tabloid"),
    gameday: buildPresetModeClasses("gameday"),
    creature: buildPresetModeClasses("creature"),
    riso: buildPresetModeClasses("riso"),
    paintchip: buildPresetModeClasses("paintchip"),
    schematic: buildPresetModeClasses("schematic"),
    sunbelt: buildPresetModeClasses("sunbelt"),
    crown: buildPresetModeClasses("crown"),
    vanity: buildPresetModeClasses("vanity"),
    midcentury: buildPresetModeClasses("midcentury"),
    photobooth: buildPresetModeClasses("photobooth"),
    disco: buildPresetModeClasses("disco"),
    wayfinding: buildPresetModeClasses("wayfinding"),
    groove: buildPresetModeClasses("groove"),
    inkblot: buildPresetModeClasses("inkblot"),
    bubblegum: buildPresetModeClasses("bubblegum"),
    snapshot: buildPresetModeClasses("snapshot"),
    rodeo: buildPresetModeClasses("rodeo"),
    vitrine: buildPresetModeClasses("vitrine"),
    seamless: buildPresetModeClasses("seamless"),
    liner: buildPresetModeClasses("liner"),
    seafog: buildPresetModeClasses("seafog"),
    harvest: buildPresetModeClasses("harvest"),
    carton: buildPresetModeClasses("carton"),
    daybook: buildPresetModeClasses("daybook"),
    jharokha: buildPresetModeClasses("jharokha"),
    horizon: buildPresetModeClasses("horizon"),
    shingle: buildPresetModeClasses("shingle"),
    limestone: buildPresetModeClasses("limestone"),
    cognac: buildPresetModeClasses("cognac"),
    plantroom: buildPresetModeClasses("plantroom"),
    stormline: buildPresetModeClasses("stormline"),
    plaster: buildPresetModeClasses("plaster"),
    basalt: buildPresetModeClasses("basalt"),
    whiteglove: buildPresetModeClasses("whiteglove"),
    palmbeach: buildPresetModeClasses("palmbeach"),
    parlor: buildPresetModeClasses("parlor"),
    trailhead: buildPresetModeClasses("trailhead"),
    hearth: buildPresetModeClasses("hearth"),
    colophon: buildPresetModeClasses("colophon"),
    boreal: buildPresetModeClasses("boreal"),
    terrazzo: buildPresetModeClasses("terrazzo"),
    picturebook: buildPresetModeClasses("picturebook"),
    seaglass: buildPresetModeClasses("seaglass"),
    limone: buildPresetModeClasses("limone"),
    alpine: buildPresetModeClasses("alpine"),
    milkglass: buildPresetModeClasses("milkglass"),
    darkroom: buildPresetModeClasses("darkroom"),
    buttercream: buildPresetModeClasses("buttercream"),
    vineyard: buildPresetModeClasses("vineyard"),
    adobe: buildPresetModeClasses("adobe"),
    fogline: buildPresetModeClasses("fogline"),
    limewash: buildPresetModeClasses("limewash"),
    miradouro: buildPresetModeClasses("miradouro"),
    sprocket: buildPresetModeClasses("sprocket"),
    galley: buildPresetModeClasses("galley"),
    baylight: buildPresetModeClasses("baylight"),
    schist: buildPresetModeClasses("schist"),
    galleyproof: buildPresetModeClasses("galleyproof"),
}

/**
 * Preset name → its NATIVE-appearance class, for surfaces that pin a preset
 * outside the theme contract's reach (e.g. isolated stories). Live pages go
 * through MarketingPage, which follows the resolved mode instead.
 */
export const marketingPresetClasses: Record<MarketingPresetName, string> = Object.fromEntries(
    (Object.keys(marketingPresetModeClasses) as MarketingPresetName[]).map((name) => [
        name,
        marketingPresetModeClasses[name][marketingPresetDefinitions[name].nativeMode],
    ]),
) as Record<MarketingPresetName, string>

export const marketingPresetNames = Object.keys(marketingPresetModeClasses) as MarketingPresetName[]
