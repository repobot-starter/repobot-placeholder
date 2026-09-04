import { useMemo, useSyncExternalStore } from "react"
import {
    configuredDefaultMode,
    configuredDensityPreset,
    configuredRadiusExplicit,
    configuredRadiusPreset,
    gateThemeDocument,
    navigationConfig,
    packBrandVarNames,
    packFontVarName,
    radiusPresetIsExplicit,
    rawThemeContract,
    resolveCharacterConfig,
    resolveConfiguredMode,
    resolveDensityPreset,
    resolveDisplayFont,
    resolveNavigationConfig,
    resolvePackBrand,
    resolvePackFont,
    resolveRadiusPreset,
    resolveShellConfig,
    resolveThemeTokens,
    resolveTreatments,
    resolveUiConfig,
    shellConfig,
    themeDocumentForeign,
    uiConfig,
    type RepobotThemeConfig,
    type ResolvedUiConfig,
    type ThemeConfiguredMode,
    type ThemeDensityPreset,
    type ThemeRadiusPreset,
} from "./themeConfig"
import {
    marketingPresetDefinitions,
    resolvePresetOverlay,
    type MarketingPresetName,
} from "../marketing/theme/marketingPresets"
import { marketing, marketingPresetModeClasses } from "../marketing/theme/marketingTheme.css"
import {
    getThemeContractOverride,
    setThemeContractOverride,
    subscribeThemeContract,
} from "./themeContractStore"
import { hasRuntimeSiteDocument } from "./runtimeSiteDocuments"
import { darkTheme, lightTheme, vars } from "./tokens.css"

/**
 * Live application of repobot.theme.json edits in a running dev server.
 *
 * The vanilla-extract theme classes bake the contract's resolution into
 * static CSS custom properties at build time. When the contract is edited
 * live (the platform showroom preview-writes it), themeConfig.ts accepts the
 * JSON module's hot update and pushes the raw contract into
 * themeContractStore; this module then:
 *
 * - re-resolves the DYNAMIC token subset (brand, palette, radius, density,
 *   font, motion, character treatments) with the same pure resolvers the
 *   build uses, and re-declares every theme custom property in an injected
 *   stylesheet that outweighs the stale static classes — colors, spacing,
 *   type, and washes repaint in one style recalc, no reload;
 * - re-resolves the STRUCTURAL presets (navigation/shell variants, the `ui`
 *   block, the default mode) and hands them to components through
 *   `useThemeContract()`, so shells and chrome re-render through React
 *   state instead of a page reload;
 * - re-resolves the MARKETING overlay (customer brand accent + font over
 *   each style preset) and re-declares those `--marketing-*` variables over
 *   the static preset classes, so public pages repaint with the app instead
 *   of holding their build-time bake until the next full rebuild.
 *
 * In production and in tests the store never fires and everything below is
 * inert: components see the exact build-time constants.
 */

/* ----------------------------------------------------------------- */
/* CSS custom property re-application                                  */
/* ----------------------------------------------------------------- */

const HOT_STYLE_ID = "repobot-theme-contract-hot"
const VAR_REFERENCE = /^var\((--[^),\s]+)\)$/

/** Walks the vars contract and a parallel value object, emitting
 * `--property: value` declarations for every leaf. */
function collectDeclarations(contract: unknown, values: unknown, out: string[]): void {
    if (typeof contract === "string") {
        const match = VAR_REFERENCE.exec(contract)
        if (match !== null && values !== undefined && values !== null) {
            out.push(`    ${match[1]}: ${String(values)};`)
        }
        return
    }
    if (typeof contract !== "object" || contract === null) return
    for (const [key, child] of Object.entries(contract)) {
        collectDeclarations(child, (values as Record<string, unknown> | null)?.[key], out)
    }
}

function themeClassSelector(themeClass: string): string {
    // Double every class for specificity: the injected declarations must win
    // over the static vanilla-extract theme rules regardless of stylesheet
    // order, which Vite does not guarantee across hot updates.
    const compound = themeClass
        .split(" ")
        .map((name) => `.${name}`)
        .join("")
    return `${compound}${compound}`
}

/** Recomputes every theme custom property from a live contract and injects
 * them over the static theme classes. Exported for tests. */
export function buildThemeContractCss(config: RepobotThemeConfig): string {
    const tokens = resolveThemeTokens(config)
    const character = resolveCharacterConfig(config)
    const fontFamily = {
        ...tokens.scales.fontFamily,
        display: resolveDisplayFont(config, tokens.bodyFont),
    }
    const modes = [
        {
            themeClass: lightTheme,
            values: {
                ...tokens.scales,
                fontFamily,
                color: tokens.lightColors,
                navigation: tokens.lightNavigation,
                chart: tokens.lightCharts,
                shadow: tokens.lightShadows,
                treatment: resolveTreatments(character, tokens.lightColors, tokens.lightShadows, false),
            },
        },
        {
            themeClass: darkTheme,
            values: {
                ...tokens.scales,
                fontFamily,
                color: tokens.darkColors,
                navigation: tokens.darkNavigation,
                chart: tokens.darkCharts,
                shadow: tokens.darkShadows,
                treatment: resolveTreatments(character, tokens.darkColors, tokens.darkShadows, true),
            },
        },
    ]
    return modes
        .map(({ themeClass, values }) => {
            const declarations: string[] = []
            collectDeclarations(vars, values, declarations)
            return `${themeClassSelector(themeClass)} {\n${declarations.join("\n")}\n}`
        })
        .join("\n")
}

/** A contract leaf (`var(--marketing-*)`) back to its property name. */
function contractVarName(reference: string): string | null {
    const match = VAR_REFERENCE.exec(reference)
    return match === null ? null : match[1]
}

/**
 * Recomputes the brand/font-dependent marketing variables from a live
 * contract and injects them over every static preset class. Marketing
 * pages bake the customer overlay (`packBrand` / `packFont`) into their
 * preset themes at build time — without this, a live Look or Typeface edit
 * saves fine but the public pages keep their stale accent and type until a
 * full rebuild, while the app surface repaints. Only the overlay-derived
 * variables are re-declared: everything else about a preset (neutrals,
 * shape, spacing) is art direction the theme never touches. Exported for
 * tests.
 */
export function buildMarketingContractCss(config: RepobotThemeConfig): string {
    const packBrand = resolvePackBrand(config)
    const brand = packBrand === null ? null : { accent: packBrand.accent, accentDark: packBrand.accentDark }
    const font = resolvePackFont(config)
    return (Object.keys(marketingPresetDefinitions) as MarketingPresetName[])
        .flatMap((name) =>
            (["light", "dark"] as const).map((mode) => {
                const overlay = resolvePresetOverlay(marketingPresetDefinitions[name], mode, brand, font)
                const declarations = (
                    [
                        [marketing.color.accent, overlay.accent],
                        [marketing.color.accentSoft, overlay.accentSoft],
                        [marketing.color.onAccent, overlay.onAccent],
                        [marketing.font.display, overlay.fontDisplay],
                        [marketing.font.body, overlay.fontBody],
                        [marketing.shape.shadowCta, overlay.shadowCta],
                        [marketing.background.page, overlay.backgroundPage],
                    ] as const
                ).flatMap(([reference, value]) => {
                    const property = contractVarName(reference)
                    return property === null ? [] : [`    ${property}: ${value};`]
                })
                return `${themeClassSelector(marketingPresetModeClasses[name][mode])} {\n${declarations.join("\n")}\n}`
            }),
        )
        .join("\n")
}

/**
 * Recomputes the pack-overlay custom properties (the `--pack-accent` family
 * and `--pack-font`) from a live contract. Pack views consume them as
 * `var(--pack-*, <art fallback>)` (check-theme-hardcoding rule 2), so this
 * re-declaration is what makes a live brand/font edit re-ink games and
 * feature apps in the workspace preview — the exact gap
 * buildMarketingContractCss closes for marketing pages. When the contract
 * no longer sets a brand/font the properties are re-declared as `initial`:
 * a custom property explicitly set to a CSS-wide keyword is
 * guaranteed-invalid, so every var() falls back to the pack's baked art
 * value — matching the build-time bake (tokens.css.ts), which only declares
 * the properties when the overlay resolves non-null. Exported for tests.
 */
export function buildPackOverlayCss(config: RepobotThemeConfig): string {
    const brand = resolvePackBrand(config)
    const font = resolvePackFont(config)
    const declarations = (Object.keys(packBrandVarNames) as (keyof typeof packBrandVarNames)[]).map(
        (key) => `    ${packBrandVarNames[key]}: ${brand === null ? "initial" : brand[key]};`,
    )
    declarations.push(`    ${packFontVarName}: ${font ?? "initial"};`)
    // :root doubled for the same reason as themeClassSelector: the injected
    // declarations must outweigh the static :root bake regardless of
    // stylesheet order.
    return `:root:root {\n${declarations.join("\n")}\n}`
}

function applyThemeContractVars(config: RepobotThemeConfig): void {
    let tag = document.getElementById(HOT_STYLE_ID)
    if (tag === null) {
        tag = document.createElement("style")
        tag.id = HOT_STYLE_ID
        document.head.appendChild(tag)
    }
    tag.textContent = `${buildThemeContractCss(config)}\n${buildMarketingContractCss(config)}\n${buildPackOverlayCss(config)}`
}

/* The live contract arrives over a custom HMR event from the dev server
 * (web/app/vite.config.ts, watchRootManifests): the theme JSON cannot ride
 * Vite's module-level HMR — the vanilla-extract compilation registers it as
 * a dependency of every compiled .css.ts module (which cannot accept it),
 * and import-analysis skips .json modules so it cannot self-accept either. */
const THEME_CONTRACT_EVENT = "repobot:theme-contract"

/* The platform holds every visual-document write to an OBSERVED repaint,
 * and falls back to a full preview reload when none arrives. This ack is
 * that observation: posted only after the contract actually APPLIED —
 * never on mere event delivery, which can succeed while the handler is
 * broken or missing. Two watchers listen, one per preview transport: the
 * iframe's platform parent, and the streamed kiosk's injected bridge on
 * this window itself (window.parent === window there, so the same post
 * reaches both). Standalone dev has no listener: a no-op. The optional
 * `seq` (the applied write's sequence — the changed file's mtime, recorded
 * from the dev server's will-apply announcement) rides along so the
 * platform can tell WHICH write this ack repainted: under rapid-fire remix
 * presses the pod coalesces and reorders applications, and an unkeyed ack
 * used to clear the wrong press's overlay arm — or none. */
function ackVisualApplied(doc: string, seq?: number): void {
    try {
        window.parent.postMessage(
            {
                channel: "repobot-preview",
                type: "visual-applied",
                doc,
                ...(seq !== undefined ? { seq } : {}),
            },
            "*",
        )
    } catch {
        /* A cross-origin parent that denies postMessage: nothing to ack. */
    }
}

/* The newest write sequence announced per visual document (vite.config.ts
 * sends VISUAL_DOC_WILL_APPLY_EVENT ahead of the apply event that triggers
 * the renderer). Monotonic: an out-of-order announcement can only belong
 * to an older application, and stamping a NEWER seq on an older paint
 * would falsely clear the platform's newest arm. */
const visualDocSeqs = new Map<string, number>()

/** Records a will-apply announcement's sequence. Exported for tests. */
export function recordVisualDocSeq(doc: string, seq: number): void {
    const prior = visualDocSeqs.get(doc)
    if (prior === undefined || seq > prior) {
        visualDocSeqs.set(doc, seq)
    }
}

/**
 * The newest announced write sequence for `doc`, or undefined before any
 * announcement (old dev servers never send one — acks then go out unkeyed,
 * exactly the pre-sequence wire format). Renderer modules
 * (landingDocument.ts / contentDocument.ts) stamp their acks with it.
 */
export function visualDocSeq(doc: string): number | undefined {
    return visualDocSeqs.get(doc)
}

/* Whether the LAST live contract was refused by the pack-stamp gate. A
 * gated contract still applies (as the default theme — same as the
 * build-time import), but it must never ACK: the write the platform is
 * holding did not become the look on screen. Withholding the ack lets the
 * repaint watchdog run its honest fallback (a full preview reload, which
 * re-reads packs/active.json and the real documents) instead of standing
 * down against a default-themed page — the "remix stops repainting but the
 * sidebar keeps changing" wedge, driven by a stale client writing the old
 * pack's stamp after a template flip. */
let lastContractGated = false

/* The visual documents whose renderer modules THIS client has actually
 * loaded (landingDocument.ts / contentDocument.ts announce themselves on
 * import). The dev server broadcasts every hot-applying visual-document
 * change as a custom event (vite.config.ts, watchRootManifests) alongside
 * Vite's module update — but a client only APPLIES the update when the
 * document's renderer is in its module graph. On any other route the write
 * changes nothing visible, no ack is ever posted, and the platform's
 * repaint watchdog escalates a finished paint into a multi-second buffered
 * swap: remix on an app dashboard writes repobot.landing.json for the
 * site's marketing pages, the dashboard renders none of them, and the
 * "updating preview…" loader lingers long after the re-ink applied. The
 * fallback below acks such a write vacuously — the truthful repaint signal
 * for a document with nothing on screen to repaint is "already done". A
 * loaded renderer keeps sole custody of its ack (including the pack-stamp
 * gate's deliberate withholding); this module is loaded everywhere the
 * design system is, so the decision is made on every route. */
const renderedVisualDocs = new Set<string>()

/**
 * Announces that the calling module renders (and will therefore ack) live
 * edits of `doc` — e.g. `"repobot.landing.json"`. Import-time registration
 * beats any HMR event's arrival: events ride the websocket, so a loaded
 * renderer is always registered before the fallback could misfire.
 */
export function registerVisualDocRenderer(doc: string): void {
    renderedVisualDocs.add(doc)
}

/** Whether a live edit of `doc` needs the vacuous fallback ack — no loaded
 * module has claimed its rendering. Exported for tests. */
export function visualDocAckFallbackNeeded(doc: string): boolean {
    return !renderedVisualDocs.has(doc)
}

/* Matches VISUAL_DOC_CHANGED_EVENT in web/app/vite.config.ts. */
const VISUAL_DOC_CHANGED_EVENT = "repobot:visual-doc-changed"

/* Matches VISUAL_DOC_WILL_APPLY_EVENT in web/app/vite.config.ts. */
const VISUAL_DOC_WILL_APPLY_EVENT = "repobot:visual-doc-will-apply"

if (import.meta.hot) {
    import.meta.hot.on(VISUAL_DOC_WILL_APPLY_EVENT, (payload: { doc?: unknown; seq?: unknown }) => {
        if (
            typeof payload?.doc === "string" &&
            typeof payload.seq === "number" &&
            Number.isFinite(payload.seq)
        ) {
            recordVisualDocSeq(payload.doc, payload.seq)
        }
    })
    import.meta.hot.on(VISUAL_DOC_CHANGED_EVENT, (payload: { doc?: unknown; seq?: unknown }) => {
        const doc = payload?.doc
        if (typeof doc === "string") {
            // The broadcast carries the seq too (belt for clients whose
            // will-apply raced the reload of this module).
            if (typeof payload.seq === "number" && Number.isFinite(payload.seq)) {
                recordVisualDocSeq(doc, payload.seq)
            }
            if (visualDocAckFallbackNeeded(doc)) {
                ackVisualApplied(doc, visualDocSeq(doc))
            }
        }
    })
    import.meta.hot.on(THEME_CONTRACT_EVENT, (contract) => {
        // The pack-stamp gate: a live edit stamped for a foreign pack
        // resolves as the default theme, exactly like the build-time import.
        lastContractGated = themeDocumentForeign(contract)
        setThemeContractOverride(gateThemeDocument(contract))
    })
    subscribeThemeContract(() => {
        const override = getThemeContractOverride()
        if (override !== null) {
            applyThemeContractVars(override)
            if (!lastContractGated) {
                ackVisualApplied("repobot.theme.json", visualDocSeq("repobot.theme.json"))
            }
        }
    })
    // Fresh dev loads: the static vanilla-extract CSS may still carry values
    // from server start (the root manifests are deliberately outside
    // chokidar, so the .css.ts graph never recompiles on a contract edit),
    // while this module graph resolves the CURRENT contract. Re-assert it
    // over the theme classes so a reload after a live edit paints fresh.
    applyThemeContractVars(rawThemeContract)
} else if (hasRuntimeSiteDocument("repobot.theme.json")) {
    // Production with the deploy-injected overlay (runtimeSiteDocuments.ts):
    // the static vanilla-extract CSS bakes the contract the bundle was BUILT
    // from, but rawThemeContract already resolved the deployed one — the
    // production twin of the dev re-assert above. Module init runs before
    // React renders anything, so the corrected custom properties are in
    // place for the first content paint.
    applyThemeContractVars(rawThemeContract)
}

/* ----------------------------------------------------------------- */
/* Structural presets: the React-facing live contract                  */
/* ----------------------------------------------------------------- */

export interface ResolvedThemeContract {
    navigation: typeof navigationConfig
    shell: typeof shellConfig
    ui: ResolvedUiConfig
    mode: ThemeConfiguredMode
    /** Feel presets by name — MarketingPage maps them onto marketing scale
     * factors, the app tokens bake them into `vars` directly. */
    radius: ThemeRadiusPreset
    /** Whether the contract names a radius at all: unset means "the
     * preset's authored art direction", which the marketing bridge must
     * not repaint (resolveRadiusPreset collapses unset to "soft"). */
    radiusExplicit: boolean
    density: ThemeDensityPreset
}

const buildTimeContract: ResolvedThemeContract = {
    navigation: navigationConfig,
    shell: shellConfig,
    ui: uiConfig,
    mode: configuredDefaultMode,
    radius: configuredRadiusPreset,
    radiusExplicit: configuredRadiusExplicit,
    density: configuredDensityPreset,
}

/**
 * The current theme contract's structural presets. Identical to the
 * build-time constants until a live repobot.theme.json edit lands (dev
 * only); components read their defaults through this hook so a contract
 * edit re-renders them instead of reloading the page.
 */
export function useThemeContract(): ResolvedThemeContract {
    const override = useSyncExternalStore(
        subscribeThemeContract,
        getThemeContractOverride,
        getThemeContractOverride,
    )
    return useMemo(() => {
        if (override === null) return buildTimeContract
        return {
            navigation: resolveNavigationConfig(override),
            shell: resolveShellConfig(override),
            ui: resolveUiConfig(override),
            mode: resolveConfiguredMode(override),
            radius: resolveRadiusPreset(override),
            radiusExplicit: radiusPresetIsExplicit(override),
            density: resolveDensityPreset(override),
        }
    }, [override])
}
