import React, { useEffect, useRef } from "react"
import * as styles from "./MarketingPage.styles.css"
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
            style={{ ...feelVars, ...overrides } as React.CSSProperties}
        >
            <div ref={frameRef} className={styles.frame}>
                {children}
            </div>
        </div>
    )
}
