/**
 * The Feel bridge's shared vocabulary: the CSS custom properties
 * MarketingPage plants from the theme contract's radius/density presets,
 * and the calc() helper the section library uses to let authored rhythm
 * follow density. Plain module (not .css.ts) because vanilla-extract
 * files may only export serializable values — the styles files import
 * these at build time and bake the calc() strings into static CSS.
 */

export const MARKETING_RADIUS_SCALE_VAR = "--marketing-radius-scale"
export const MARKETING_RADIUS_FLOOR_VAR = "--marketing-radius-floor"

/**
 * The bridge's value tables, keyed by the theme contract's radius/density
 * presets. MarketingPage plants these; exported so pinned tests can assert
 * the planted values against the COMMITTED contract instead of hardcoding
 * the kernel default (which the theme-agnostic gate rightly rejects).
 *
 *   sharp — zeroes every authored radius.
 *   soft  — authored radii kept, floored so square-authored looks
 *           (atelier, photography's set) genuinely soften too.
 *   round — controls become full pills (their own floor), cards round
 *           generously without turning into capsules.
 */
export const marketingRadiusScale: Record<string, string> = { sharp: "0", soft: "1", round: "2.2" }
export const marketingRadiusFloor: Record<string, string> = {
    sharp: "0px",
    soft: "8px",
    round: "18px",
}
export const marketingRadiusControlFloor: Record<string, string> = {
    sharp: "0px",
    soft: "8px",
    round: "999px",
}
export const marketingSpaceScale: Record<string, string> = {
    compact: "0.65",
    comfortable: "1",
    spacious: "1.4",
}
/**
 * Controls (buttons, inputs) get their own floor so Round can take them
 * all the way to pills while cards stay generously-but-sanely rounded —
 * a 999px floor on a section card would read as a capsule, not a corner.
 * Falls back to the shared floor when unset.
 */
export const MARKETING_RADIUS_CONTROL_FLOOR_VAR = "--marketing-radius-control-floor"
export const MARKETING_SPACE_SCALE_VAR = "--marketing-space-scale"

/** Scaled spacing for the section library: authored rhythm × the density
 * factor. Used for the vertical paddings and gaps that define a section's
 * breathing room — not for hairline insets that must not drift. */
export function scaledSpace(authoredPx: number): string {
    return `calc(${authoredPx}px * var(${MARKETING_SPACE_SCALE_VAR}, 1))`
}
