import React, { useEffect, useRef } from "react"
import * as styles from "./MarketingPage.styles.css"
// Register treatments that restyle several sections at once live in their
// own sheets (selectors keyed on the page root's treatment flag).
import "./registers/transit.css"
import "./registers/sleeve.css"
import "./registers/wallLabel.css"
import "./registers/candy.css"
import "./registers/keepsake.css"
import "./registers/filigree.css"
import "./registers/panorama.css"
import "./registers/engraved.css"
import "./registers/alcove.css"
import "./registers/ritual.css"
import "./registers/gilt.css"
import "./registers/fieldbook.css"
import "./registers/weave.css"
import "./registers/marginalia.css"
import "./registers/frost.css"
import "./registers/terrazzo.css"
import "./registers/picturebook.css"
import "./registers/seaglass.css"
import "./registers/limone.css"
import "./registers/alpine.css"
import "./registers/milkglass.css"
import "./registers/darkroom.css"
import "./registers/photoHero.css"
import "./registers/gauge.css"
import "./registers/dispatch.css"
import "./registers/journal.css"
import "./registers/stillness.css"
import "./registers/concierge.css"
import "./registers/cabana.css"
import "./registers/framestack.css"
import "./registers/tintbands.css"
import "./registers/inkover.css"
import "./registers/roomline.css"
import "./registers/miradouro.css"
import "./registers/sprocket.css"
import "./registers/galley.css"
import "./registers/soundings.css"
import "./registers/monograph.css"
import "./registers/proofmark.css"
import { useResolvedUiMode } from "../theme/UiThemeProvider"
import { useThemeContract } from "../theme/themeHotUpdate"
import {
    MARKETING_RADIUS_CONTROL_FLOOR_VAR,
    MARKETING_RADIUS_FLOOR_VAR,
    MARKETING_RADIUS_SCALE_VAR,
    MARKETING_SPACE_SCALE_VAR,
    marketingRadiusControlFloor,
    marketingRadiusFloor,
    marketingRadiusScale,
    marketingSpaceScale,
} from "./theme/feelBridge"
import { marketingPresetModeClasses, type MarketingPresetName } from "./theme/marketingTheme.css"
import { marketingPresetDefinitions } from "./theme/marketingPresets"

/**
 * The Feel bridge values live in feelBridge.ts (shared with the pinned
 * bridge tests): theme-contract radius/density presets mapped onto
 * marketing scale factors. An UNSET radius is the preset's authored art
 * direction (scale 1, no floors) — a square-authored look stays square
 * until the user actually chooses. Density scales the section library's
 * authored rhythm (section paddings, grid gaps, and the hero's text-stack
 * margins — the scaledSpace() declarations), so each step visibly
 * re-spaces stacked content.
 */

export interface MarketingPageProps {
    /** Style preset — the page's whole art direction (docs/landing-kernel-spec.md §4). */
    preset: MarketingPresetName
    /**
     * Targeted re-assignments of `--marketing-*` variables, e.g. an accent
     * hex under the `--marketing-color-accent` key. The escape hatch before
     * ejecting a section.
     */
    overrides?: Record<string, string>
    children: React.ReactNode
}

/**
 * Baked-in scroll reveal: every top-level block (sections, the hero header,
 * the footer — everything except the sticky nav, which must never carry a
 * transform) rises into place as it enters the viewport, with a short
 * cascade for whatever is above the fold on load. The reveal attribute is
 * only set from here, so without JavaScript nothing is ever hidden; the
 * matching styles (and their reduced-motion opt-out) live in
 * MarketingPage.styles.css.ts.
 */
function useScrollReveal(frameRef: React.RefObject<HTMLDivElement | null>, children: React.ReactNode): void {
    useEffect(() => {
        const frame = frameRef.current
        if (frame === null || typeof IntersectionObserver === "undefined") return
        let revealed = 0
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue
                    const element = entry.target as HTMLElement
                    // Cascade the initial burst; later reveals fire alone
                    // anyway, so the capped delay only shapes page load.
                    element.style.transitionDelay = `${Math.min(revealed * 70, 280)}ms`
                    element.setAttribute("data-mkreveal", "in")
                    revealed += 1
                    observer.unobserve(element)
                }
            },
            { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
        )
        const targets: HTMLElement[] = []
        for (const child of Array.from(frame.children)) {
            const element = child as HTMLElement
            // The sticky nav lives in a wrapper around a <nav>; a transform
            // on it would become its containing block and break stickiness.
            if (element.querySelector("nav") !== null) continue
            if (element.getAttribute("data-mkreveal") === "in") continue
            element.setAttribute("data-mkreveal", "")
            targets.push(element)
        }
        for (const target of targets) observer.observe(target)
        return () => observer.disconnect()
    }, [frameRef, children])
}

/** The `two-ink` treatment's filter id — photographs reference it from CSS. */
export const TWO_INK_FILTER_ID = "mk-two-ink"

/** A dot-screen cell as an feImage tile: alpha rises from 0 at the dot's center to 1 at its corners. */
function screenTile(cell: number): string {
    const half = cell / 2
    return (
        "data:image/svg+xml," +
        encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="${cell}" height="${cell}">` +
                `<radialGradient id="d" cx="${half}" cy="${half}" r="${half * Math.SQRT2}" gradientUnits="userSpaceOnUse">` +
                `<stop offset="0" stop-opacity="0"/><stop offset="1" stop-opacity="1"/></radialGradient>` +
                `<rect width="${cell}" height="${cell}" fill="url(#d)"/></svg>`,
        )
    )
}

/**
 * The `two-ink` separation (risograph): every photograph is re-printed in
 * the register's two drums on its paper. The dark plate takes density from
 * the photo's luminance with the reds weighed light (so warm subjects fall
 * to the second drum, not to mud); the warm plate takes density where red
 * leads green. Each plate is screened through its own dot cell (a
 * threshold against the tile, soft-edged), speckled with drum noise, and
 * flooded with its ink — `--marketing-spot-1` for the dark plate, the
 * accent for the warm one, pulled a hair off-register — then multiplied
 * over a `--marketing-spot-2` paper flood and clipped to the photo. Inks
 * resolve through CSS `flood-color`, so the customer brand re-inks the
 * warm drum and the appearance can re-paper the prints.
 */
function TwoInkFilter(): React.ReactElement {
    return (
        <svg width="0" height="0" aria-hidden focusable="false" style={{ position: "absolute" }}>
            <filter
                id={TWO_INK_FILTER_ID}
                x="0"
                y="0"
                width="100%"
                height="100%"
                colorInterpolationFilters="sRGB"
            >
                <feColorMatrix
                    in="SourceGraphic"
                    type="matrix"
                    values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.62 -0.3 -0.08 0 1"
                    result="darkDensity"
                />
                <feComponentTransfer in="darkDensity" result="darkTone">
                    <feFuncA type="table" tableValues="0 0.04 0.2 0.46 0.72 0.9 1" />
                </feComponentTransfer>
                <feColorMatrix
                    in="SourceGraphic"
                    type="matrix"
                    values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.3 -2.1 -0.2 0 0"
                    result="warmTone"
                />
                <feImage href={screenTile(5)} x="0" y="0" width="5" height="5" result="darkCell" />
                <feTile in="darkCell" result="darkScreen" />
                <feImage href={screenTile(4)} x="0" y="0" width="4" height="4" result="warmCell" />
                <feTile in="warmCell" result="warmScreen" />
                <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.7"
                    numOctaves="1"
                    seed="7"
                    result="noise"
                />
                <feColorMatrix
                    in="noise"
                    type="matrix"
                    values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3.2 0 0 0 -0.55"
                    result="speckle"
                />
                <feComposite
                    in="darkTone"
                    in2="darkScreen"
                    operator="arithmetic"
                    k2="2.6"
                    k3="-2.6"
                    k4="0.5"
                    result="darkDots"
                />
                <feComposite in="darkDots" in2="speckle" operator="arithmetic" k1="1" result="darkPlate" />
                <feComposite
                    in="warmTone"
                    in2="warmScreen"
                    operator="arithmetic"
                    k2="2.6"
                    k3="-2.6"
                    k4="0.5"
                    result="warmDots"
                />
                <feComposite in="warmDots" in2="speckle" operator="arithmetic" k1="1" result="warmSpeckled" />
                <feOffset in="warmSpeckled" dx="1.5" dy="1" result="warmPlate" />
                <feFlood
                    style={{ floodColor: "var(--marketing-spot-2, var(--marketing-color-pageBg))" }}
                    result="paper"
                />
                <feFlood
                    style={{ floodColor: "var(--marketing-spot-1, var(--marketing-color-text))" }}
                    result="darkInk"
                />
                <feComposite in="darkInk" in2="darkPlate" operator="in" result="darkLayer" />
                <feFlood style={{ floodColor: "var(--marketing-color-accent)" }} result="warmInk" />
                <feComposite in="warmInk" in2="warmPlate" operator="in" result="warmLayer" />
                <feBlend in="warmLayer" in2="paper" mode="multiply" result="warmPrint" />
                <feBlend in="darkLayer" in2="warmPrint" mode="multiply" result="print" />
                <feComposite in="print" in2="SourceAlpha" operator="in" />
            </filter>
        </svg>
    )
}

/**
 * Root of every marketing/landing page: applies the style preset's token
 * theme and the page chrome (background, type, content frame, baked-in
 * scroll-reveal motion). Sections render as children, typically via the
 * app's `LandingRenderer` binder.
 */
export function MarketingPage({ preset, overrides, children }: MarketingPageProps): React.ReactElement {
    const frameRef = useRef<HTMLDivElement | null>(null)
    useScrollReveal(frameRef, children)
    // The Feel bridge: the resolved appearance picks the preset's authored
    // light/dark variant (appearance always wins over the preset's native
    // lean), and radius/density land as scale factors the preset classes
    // calc() against. Explicit page overrides still win — they spread last.
    const mode = useResolvedUiMode()
    const contract = useThemeContract()
    // Unset radius = the preset's authored geometry; only an explicit
    // choice re-shapes it (see the bridge-value table above).
    const radius = contract.radiusExplicit ? contract.radius : undefined
    const feelVars = {
        [MARKETING_RADIUS_SCALE_VAR]: (radius && marketingRadiusScale[radius]) || "1",
        [MARKETING_RADIUS_FLOOR_VAR]: (radius && marketingRadiusFloor[radius]) || "0px",
        [MARKETING_RADIUS_CONTROL_FLOOR_VAR]: (radius && marketingRadiusControlFloor[radius]) || "0px",
        [MARKETING_SPACE_SCALE_VAR]: marketingSpaceScale[contract.density] ?? "1",
    }
    const definition = marketingPresetDefinitions[preset]
    const modeVariant = definition.modes[mode]
    const registerVars = {
        ...(modeVariant.spot !== undefined
            ? { "--marketing-spot-1": modeVariant.spot[0], "--marketing-spot-2": modeVariant.spot[1] }
            : {}),
        ...(modeVariant.ornament !== undefined ? { "--marketing-ornament": modeVariant.ornament } : {}),
        ...(definition.fonts.script !== undefined
            ? { "--marketing-font-script": definition.fonts.script }
            : {}),
    }
    return (
        <div
            className={`${marketingPresetModeClasses[preset][mode]} ${styles.page}`}
            // The register the page actually wears, as rendered — the
            // mirror-free probe for the register conformance gate
            // (scripts/verify-pack-registers.mjs) and for humans debugging
            // "which preset is this page really on?" in devtools.
            data-marketing-preset={preset}
            data-marketing-mode={mode}
            // The ambition axes, as selector hooks: section styles opt into
            // a register's movement idiom and surface signatures through
            // these ([data-marketing-motion="sweep"] beams,
            // [data-marketing-treatment~="tilt"] scrapbook rotation) instead
            // of matching preset names — new registers inherit the idiom's
            // behavior by declaring the axis, not by being enumerated.
            data-marketing-motion={definition.motion.idiom}
            data-marketing-treatment={
                definition.treatment.length > 0 ? definition.treatment.join(" ") : undefined
            }
            style={{ ...feelVars, ...registerVars, ...overrides } as React.CSSProperties}
        >
            {definition.treatment.includes("two-ink") ? <TwoInkFilter /> : null}
            <div ref={frameRef} className={styles.frame}>
                {children}
            </div>
        </div>
    )
}
