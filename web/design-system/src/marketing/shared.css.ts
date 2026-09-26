import { globalStyle, keyframes, style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"

/**
 * Shared style vocabulary for marketing sections: the section rhythm, the
 * kicker/title header pattern, and the CTA button pair. Internal to the
 * marketing family — not exported from the package.
 */

/**
 * The caption face: small slugs that read as annotation, not copy (photo
 * captions, rail dates, specimen uses). Plex Mono is self-hosted by the app
 * shell; the stack falls back to the platform monospace.
 */
export const captionFontStack =
    "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"

export const rise = keyframes({
    from: { opacity: 0, transform: "translateY(16px)" },
    to: { opacity: 1, transform: "translateY(0)" },
})

export const section = style({
    // The section rhythm follows the theme contract's density through the
    // Feel bridge (MarketingPage sets the scale var; 1 when absent).
    padding: `${scaledSpace(64)} 0 0`,
})

export const sectionKicker = style({
    display: "block",
    fontFamily: marketing.font.body,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: marketing.color.accent,
    marginBottom: 8,
})

export const sectionTitle = style({
    fontFamily: marketing.font.display,
    fontSize: "clamp(26px, 4vw, 36px)",
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    // The contract emits plain var strings; the token is "none" | "uppercase".
    textTransform: marketing.display.transform as "none",
    color: marketing.color.text,
    margin: `0 0 ${scaledSpace(36)}`,
})

/**
 * The wide left-aligned header for image-led strips (the steps rail, the
 * specimens board): the section title grown with the register's display
 * scale axis, so monumental presets carry their voice past the hero.
 */
export const sectionTitleDisplay = style([
    sectionTitle,
    {
        fontSize: `calc(clamp(26px, 3.4vw, 38px) * ${marketing.display.scale})`,
        lineHeight: 1.08,
        maxWidth: 820,
        margin: `0 0 ${scaledSpace(40)}`,
    },
])

/** Center-aligned header block (most sections). */
export const sectionHeaderCentered = style({
    textAlign: "center",
})

export const ctaPrimary = style({
    display: "inline-block",
    fontFamily: marketing.font.body,
    fontSize: 15,
    fontWeight: 700,
    color: marketing.color.onAccent,
    background: marketing.color.accent,
    border: "none",
    borderRadius: marketing.shape.radiusControl,
    boxShadow: marketing.shape.shadowCta,
    padding: "13px 24px",
    textDecoration: "none",
    cursor: "pointer",
    transition: "transform 140ms ease",
    selectors: {
        "&:hover": { transform: "translateY(-1px)" },
    },
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            transition: "none",
            selectors: { "&:hover": { transform: "none" } },
        },
    },
})

export const ctaSecondary = style({
    display: "inline-block",
    fontFamily: marketing.font.body,
    fontSize: 15,
    fontWeight: 600,
    color: marketing.color.text,
    background: "transparent",
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusControl,
    padding: "12px 22px",
    textDecoration: "none",
    cursor: "pointer",
    selectors: {
        "&:hover": { borderColor: marketing.color.subtle },
    },
})

/** Emoji on an accent-tinted panel — the zero-asset media default. */
export const emojiPanel = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: marketing.color.accentSoft,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    fontSize: 72,
    minHeight: 260,
    width: "100%",
})

/**
 * The `halftone` treatment's press plate: a media frame that, on registers
 * declaring the flag, lays a fine ink dot screen over its photograph and
 * presses the contrast up — the photo reads as printed, not displayed.
 * Hover (or focus within) lifts the screen to the clean original. Off the
 * flag it is a plain positioned frame. The dots are press ink in every
 * appearance (multiplied over the photo), so they are a fixed color.
 */
export const halftonePlate = style({
    position: "relative",
    overflow: "hidden",
    selectors: {
        '[data-marketing-treatment~="halftone"] &::after': {
            content: '""',
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: "radial-gradient(rgba(12, 12, 10, 0.5) 0.9px, transparent 1.35px)", // theme-exempt: press ink dots, multiplied over the photograph
            backgroundSize: "4px 4px",
            mixBlendMode: "multiply",
            opacity: 0.5,
            transition: "opacity 240ms ease",
        },
        '[data-marketing-treatment~="halftone"] &:hover::after, [data-marketing-treatment~="halftone"] &:focus-within::after':
            {
                opacity: 0,
            },
    },
})

globalStyle(`[data-marketing-treatment~="halftone"] ${halftonePlate} img`, {
    filter: "contrast(1.1) saturate(1.06)",
})

export const mediaImage = style({
    width: "100%",
    // Images now carry intrinsic width/height attributes (MarketingImage);
    // auto height keeps the rendered box following the CSS width while the
    // attributes still reserve the aspect ratio before the file arrives.
    height: "auto",
    borderRadius: marketing.shape.radiusCard,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    display: "block",
})

/**
 * Selector hook for the `pop` treatment (memphis): ink-cut type and cards
 * with hard offset shadows. Sections opt in per style through this, never
 * by matching a preset name.
 */
export const POP = '[data-marketing-treatment~="pop"] &'
const POP_ROOT = '[data-marketing-treatment~="pop"]'

/** The register's spot inks, falling back to the accent where a preset has none. */
export const spot1 = `var(--marketing-spot-1, ${marketing.color.accent})`
export const spot2 = `var(--marketing-spot-2, ${marketing.color.accent})`

// Ink tape: the kicker as a skewed black label with a spot-ink offset — the
// flyer's strap line.
globalStyle(`${POP_ROOT} ${sectionKicker}`, {
    display: "inline-block",
    fontFamily: marketing.font.display,
    fontStyle: "italic",
    fontWeight: 900,
    fontSize: 13,
    letterSpacing: "0.08em",
    color: marketing.color.pageBg,
    background: marketing.color.text,
    padding: "6px 14px 5px",
    transform: "skewX(-8deg)",
    boxShadow: `3px 3px 0 ${spot1}`,
    marginBottom: 16,
})

globalStyle(`${POP_ROOT} ${sectionTitle}`, {
    // Chunky display caps strand a last word easily; balance the lines.
    textWrap: "balance",
    fontStyle: "italic",
    fontSize: "clamp(30px, 4.6vw, 48px)",
    lineHeight: 1.02,
    textShadow: `0.06em 0.06em 0 ${spot1}`,
})

const popCta = {
    fontFamily: marketing.font.display,
    fontStyle: "italic",
    fontWeight: 900,
    fontSize: 17,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
    padding: "12px 24px 11px",
} as const

globalStyle(`${POP_ROOT} ${ctaPrimary}`, {
    ...popCta,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
})

globalStyle(`${POP_ROOT} ${ctaSecondary}`, {
    ...popCta,
    background: marketing.color.surface,
    borderColor: marketing.color.line,
    boxShadow: marketing.shape.shadowCta,
})

// Every photograph is a sticker print: ink edge, hard offset.
globalStyle(`${POP_ROOT} ${mediaImage}`, { boxShadow: marketing.shape.shadowCard })

/**
 * Selector hook for the `sport` treatment (gameday): the sportswear
 * campaign — condensed caps leaning italic, accent tape, slanted plates.
 */
export const SPORT = '[data-marketing-treatment~="sport"] &'
const SPORT_ROOT = '[data-marketing-treatment~="sport"]'

// Accent tape: the kicker as a slanted volt strip in the register's ink —
// the drop's strap line.
globalStyle(`${SPORT_ROOT} ${sectionKicker}`, {
    display: "inline-block",
    fontFamily: marketing.font.display,
    fontStyle: "italic",
    fontWeight: 800,
    fontSize: 17,
    letterSpacing: "0.08em",
    color: marketing.color.onAccent,
    background: marketing.color.accent,
    padding: "5px 16px 4px",
    transform: "skewX(-12deg)",
    marginBottom: 18,
})

globalStyle(`${SPORT_ROOT} ${sectionTitle}`, {
    textWrap: "balance",
    fontSize: "clamp(40px, 6vw, 72px)",
    lineHeight: 0.92,
    letterSpacing: "0.005em",
})

globalStyle(`${SPORT_ROOT} ${sectionTitleDisplay}`, {
    fontSize: "clamp(40px, 6vw, 72px)",
    lineHeight: 0.92,
})

const sportCta = {
    fontFamily: marketing.font.display,
    fontStyle: "italic",
    fontWeight: 800,
    fontSize: 21,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    lineHeight: 1,
    padding: "14px 26px 13px",
} as const

// Slanted plates with a forward arrow: the ask always points ahead.
globalStyle(`${SPORT_ROOT} ${ctaPrimary}`, sportCta)
globalStyle(`${SPORT_ROOT} ${ctaSecondary}`, { ...sportCta, borderColor: marketing.color.text })
globalStyle(`${SPORT_ROOT} ${ctaPrimary}::after`, { content: '"  →"', fontStyle: "normal" })

// Campaign photographs run clean: no frame line, square jersey-patch corners.
globalStyle(`${SPORT_ROOT} ${mediaImage}`, { border: "none", boxShadow: marketing.shape.shadowCard })

/**
 * Selector hook for the `pulp` treatment (creature): the creature-feature
 * poster — extruded hand-lettered caps, billing tabs, lobby-card mounts.
 */
export const PULP = '[data-marketing-treatment~="pulp"] &'
const PULP_ROOT = '[data-marketing-treatment~="pulp"]'

/** The poster title's extruded drop: stacked hard offsets in the accent, ink under. */
export const pulpExtrude = (depth: number): string =>
    [
        ...Array.from(
            { length: depth },
            (_, step) => `${step + 1}px ${step + 1}px 0 ${marketing.color.accent}`,
        ),
        `${depth + 2}px ${depth + 3}px 0 color-mix(in srgb, ${marketing.color.pageBg} 80%, black)`,
    ].join(", ")

// The billing tab: the kicker as a glowing spot-ink label, tipped like a
// sticker slapped on the one-sheet.
globalStyle(`${PULP_ROOT} ${sectionKicker}`, {
    display: "inline-block",
    fontFamily: marketing.font.display,
    fontWeight: 400,
    fontSize: 17,
    letterSpacing: "0.1em",
    color: marketing.color.pageBg,
    background: spot1,
    padding: "5px 14px 3px",
    transform: "rotate(-2deg)",
    boxShadow: marketing.shape.shadowCta,
    marginBottom: 18,
})

globalStyle(`${PULP_ROOT} ${sectionTitle}`, {
    textWrap: "balance",
    fontSize: "clamp(40px, 5.6vw, 66px)",
    lineHeight: 0.98,
    letterSpacing: "0.02em",
    textShadow: pulpExtrude(4),
})

globalStyle(`${PULP_ROOT} ${sectionTitleDisplay}`, {
    fontSize: "clamp(40px, 5.6vw, 66px)",
    lineHeight: 0.98,
})

const pulpCta = {
    fontFamily: marketing.font.display,
    fontWeight: 400,
    fontSize: 21,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    lineHeight: 1,
    padding: "13px 24px 11px",
} as const

globalStyle(`${PULP_ROOT} ${ctaPrimary}`, {
    ...pulpCta,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.text}`,
})

globalStyle(`${PULP_ROOT} ${ctaSecondary}`, {
    ...pulpCta,
    color: marketing.color.text,
    borderColor: marketing.color.text,
    boxShadow: marketing.shape.shadowCta,
})

// Lobby cards: every photograph mounted in a cream border with a hard drop.
globalStyle(`${PULP_ROOT} ${mediaImage}`, {
    border: `4px solid ${spot2}`,
    boxShadow: marketing.shape.shadowCard,
})

/**
 * Selector hooks for the `two-ink` treatment (riso) and the `colorblock`
 * treatment (paintchip). Sections opt in per style through these, never
 * by matching a preset name.
 */
export const TWO_INK = '[data-marketing-treatment~="two-ink"] &'
export const TWO_INK_ROOT = '[data-marketing-treatment~="two-ink"]'
export const COLORBLOCK = '[data-marketing-treatment~="colorblock"] &'
export const COLORBLOCK_ROOT = '[data-marketing-treatment~="colorblock"]'

/** A dry brush stroke, tapering at both ends — the riso title underline, as a mask. */
export const BRUSH_MASK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 24' preserveAspectRatio='none'%3E%3Cpath d='M2 15 C 30 8 70 6 110 7 C 145 8 175 9 198 5 C 186 13 150 16 112 17 C 70 18 34 19 2 15 Z'/%3E%3Cpath d='M20 19 C 60 16 120 15 176 13' fill='none' stroke='black' stroke-width='1.4' opacity='0.7'/%3E%3C/svg%3E")`

// Riso: the kicker in the poster caps, in the dark drum (orange at kicker
// size would fail contrast on the paper — the ink carries the words).
globalStyle(`${TWO_INK_ROOT} ${sectionKicker}`, {
    fontFamily: marketing.font.display,
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: marketing.color.text,
})

// Riso: every section title gets the second drum's brush stroke under its
// first words — pulled on the same run, a little crooked.
globalStyle(`${TWO_INK_ROOT} ${sectionTitle}`, {
    lineHeight: 1,
})

globalStyle(`${TWO_INK_ROOT} ${sectionTitle}::after`, {
    content: '""',
    display: "block",
    width: "min(2.6em, 100%)",
    height: "0.2em",
    marginTop: "0.14em",
    background: marketing.color.accent,
    maskImage: BRUSH_MASK,
    maskSize: "100% 100%",
    maskRepeat: "no-repeat",
    WebkitMaskImage: BRUSH_MASK,
    WebkitMaskSize: "100% 100%",
    WebkitMaskRepeat: "no-repeat",
})

globalStyle(`${TWO_INK_ROOT} ${sectionHeaderCentered} ${sectionTitle}::after`, {
    marginLeft: "auto",
    marginRight: "auto",
})

// Riso: the asks in the poster caps — flat drum ink, no lift.
globalStyle(`${TWO_INK_ROOT} ${ctaPrimary}, ${TWO_INK_ROOT} ${ctaSecondary}`, {
    fontFamily: marketing.font.display,
    fontSize: 17,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
})

globalStyle(`${TWO_INK_ROOT} ${ctaSecondary}`, {
    borderColor: marketing.color.text,
})

// Colorblock: the kicker opens on a flat accent chip, the title sits
// tight under it in the heavy caps.
globalStyle(`${COLORBLOCK_ROOT} ${sectionKicker}`, {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    fontSize: 12.5,
    fontWeight: 800,
    letterSpacing: "0.2em",
    color: marketing.color.text,
})

globalStyle(`${COLORBLOCK_ROOT} ${sectionKicker}::before`, {
    content: '""',
    width: 14,
    height: 14,
    flex: "none",
    background: marketing.color.accent,
})

globalStyle(`${COLORBLOCK_ROOT} ${sectionTitle}`, {
    lineHeight: 0.95,
    wordSpacing: "0.1em",
    textWrap: "balance",
})

// Colorblock: the asks are flat chips with a hard ink offset — tracked
// caps, pressed down (not lifted) on hover.
globalStyle(`${COLORBLOCK_ROOT} ${ctaPrimary}, ${COLORBLOCK_ROOT} ${ctaSecondary}`, {
    fontSize: 13.5,
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    padding: "15px 24px",
})

globalStyle(`${COLORBLOCK_ROOT} ${ctaSecondary}`, {
    background: marketing.color.surface,
    boxShadow: marketing.shape.shadowCta,
})

globalStyle(`${COLORBLOCK_ROOT} ${ctaPrimary}:hover, ${COLORBLOCK_ROOT} ${ctaSecondary}:hover`, {
    transform: "translate(2px, 2px)",
    boxShadow: "none",
})

/**
 * The register's third voice (PresetDefinition `fonts.script`, emitted by
 * MarketingPage as `--marketing-font-script`), falling back to the display
 * face where a preset carries none.
 */
export const scriptFont = `var(--marketing-font-script, ${marketing.font.display})`

/** Selector hooks for the sign-writer, schematic, and desert-sun treatments. */
export const SIGNPAINT = '[data-marketing-treatment~="signpaint"] &'
export const LINEWORK = '[data-marketing-treatment~="linework"] &'
export const SUNBURST = '[data-marketing-treatment~="sunburst"] &'
const SIGNPAINT_ROOT = '[data-marketing-treatment~="signpaint"]'
const LINEWORK_ROOT = '[data-marketing-treatment~="linework"]'
const SUNBURST_ROOT = '[data-marketing-treatment~="sunburst"]'

/**
 * The hand-cut board edge: four unequal corner radii, so a painted panel
 * reads as cut and lettered by hand rather than drawn by a UI kit.
 */
export const handCutRadius = "14px 7px 12px 5px / 6px 12px 5px 14px"

// signpaint: kickers are brushed in script between two painted dashes;
// titles are lettered caps with the drop shade in the first spot ink.
globalStyle(`${SIGNPAINT_ROOT} ${sectionKicker}`, {
    fontFamily: scriptFont,
    fontSize: 26,
    fontWeight: 400,
    lineHeight: 1.15,
    letterSpacing: 0,
    textTransform: "none",
    marginBottom: 10,
})

globalStyle(`${SIGNPAINT_ROOT} ${sectionKicker}::before, ${SIGNPAINT_ROOT} ${sectionKicker}::after`, {
    content: '""',
    display: "inline-block",
    verticalAlign: "middle",
    width: 26,
    height: 4,
    borderRadius: "3px 1px 3px 1px",
    background: spot2,
})

globalStyle(`${SIGNPAINT_ROOT} ${sectionKicker}::before`, {
    marginRight: 12,
    transform: "rotate(-9deg)",
})

globalStyle(`${SIGNPAINT_ROOT} ${sectionKicker}::after`, {
    marginLeft: 12,
    transform: "rotate(9deg)",
})

globalStyle(`${SIGNPAINT_ROOT} ${sectionTitle}`, {
    textWrap: "balance",
    fontSize: "clamp(30px, 4.6vw, 50px)",
    lineHeight: 1.04,
    textShadow: `0.05em 0.055em 0 ${spot1}`,
})

const signCta = {
    fontFamily: marketing.font.display,
    fontWeight: marketing.display.weight,
    fontSize: 18,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    lineHeight: 1.1,
    padding: "14px 26px 11px",
    borderRadius: handCutRadius,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.text}`,
    boxShadow: marketing.shape.shadowCta,
} as const

globalStyle(`${SIGNPAINT_ROOT} ${ctaPrimary}`, signCta)

globalStyle(`${SIGNPAINT_ROOT} ${ctaSecondary}`, {
    ...signCta,
    color: marketing.color.text,
    background: marketing.color.surface,
})

// Every photograph is pinned up like a snapshot on the shop wall: a
// painted ink frame and the hard shade.
globalStyle(`${SIGNPAINT_ROOT} ${mediaImage}`, {
    borderColor: marketing.color.text,
    boxShadow: marketing.shape.shadowCard,
})

// linework: kickers read as instrument labels — mono, tracked, led by a
// small spark-ink square; CTAs are live frames in the current's color.
globalStyle(`${LINEWORK_ROOT} ${sectionKicker}`, {
    fontFamily: captionFontStack,
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "0.24em",
    marginBottom: 14,
})

globalStyle(`${LINEWORK_ROOT} ${sectionKicker}::before`, {
    content: '""',
    display: "inline-block",
    width: 7,
    height: 7,
    marginRight: 12,
    verticalAlign: "0.08em",
    background: spot1,
})

globalStyle(`${LINEWORK_ROOT} ${sectionTitle}`, {
    textWrap: "balance",
    fontSize: "clamp(24px, 3.4vw, 38px)",
    lineHeight: 1.1,
})

const lineCta = {
    fontFamily: captionFontStack,
    fontSize: 13.5,
    fontWeight: 600,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    padding: "15px 26px",
} as const

globalStyle(`${LINEWORK_ROOT} ${ctaPrimary}`, {
    ...lineCta,
    position: "relative",
    color: marketing.color.accent,
    background: "transparent",
    border: `1.5px solid ${marketing.color.accent}`,
    transition: "background 160ms ease, color 160ms ease",
})

globalStyle(`${LINEWORK_ROOT} ${ctaPrimary}:hover`, {
    color: marketing.color.onAccent,
    background: marketing.color.accent,
})

// The spark: a sodium-orange contact on the frame's lower right corner.
globalStyle(`${LINEWORK_ROOT} ${ctaPrimary}::after`, {
    content: '""',
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 7,
    height: 7,
    background: spot1,
})

globalStyle(`${LINEWORK_ROOT} ${ctaSecondary}`, lineCta)

// sunburst: kickers in the thin sign-script, titles fat and rounded,
// CTAs set in the display face like a motel sign's letters.
globalStyle(`${SUNBURST_ROOT} ${sectionKicker}`, {
    fontFamily: scriptFont,
    fontSize: 34,
    fontWeight: 400,
    lineHeight: 1,
    letterSpacing: 0,
    textTransform: "none",
    marginBottom: 6,
})

globalStyle(`${SUNBURST_ROOT} ${sectionTitle}`, {
    textWrap: "balance",
    fontSize: "clamp(30px, 4.4vw, 50px)",
    lineHeight: 1.04,
})

const sunCta = {
    fontFamily: marketing.font.display,
    fontWeight: marketing.display.weight,
    fontSize: 17,
    letterSpacing: "0.01em",
    padding: "14px 28px",
} as const

globalStyle(`${SUNBURST_ROOT} ${ctaPrimary}`, sunCta)
globalStyle(`${SUNBURST_ROOT} ${ctaSecondary}`, sunCta)

/** Selector hooks for the glossy-cover and beauty-counter treatments. */
export const METALLIC = '[data-marketing-treatment~="metallic"] &'
export const LACQUER = '[data-marketing-treatment~="lacquer"] &'
export const METALLIC_ROOT = '[data-marketing-treatment~="metallic"]'
export const LACQUER_ROOT = '[data-marketing-treatment~="lacquer"]'

/**
 * The cover's cast metals, as fills for real text: chrome (the second
 * spot ink) and gold (the first), each a polished bar with a dark horizon
 * just under center and a bright return below it, so a clipped letter
 * reads as a chromed casting rather than a flat color.
 */
export const chromeFill = `linear-gradient(180deg, color-mix(in srgb, ${spot2} 22%, white) 0%, ${spot2} 30%, color-mix(in srgb, ${spot2} 34%, black) 51%, color-mix(in srgb, ${spot2} 60%, white) 56%, ${spot2} 78%, color-mix(in srgb, ${spot2} 30%, white) 100%)`
export const goldFill = `linear-gradient(180deg, color-mix(in srgb, ${spot1} 30%, white) 0%, ${spot1} 32%, color-mix(in srgb, ${spot1} 52%, black) 52%, color-mix(in srgb, ${spot1} 78%, white) 58%, ${spot1} 80%, color-mix(in srgb, ${spot1} 70%, black) 100%)`

/**
 * Clips a metal fill to the glyphs. The fill tiles once per line (`1em`
 * bands at line-height 1, cloned across fragments) so every line gets its
 * own horizon; the drop shadows give the casting its depth and the
 * floor shadow under it.
 */
export const metalText = (fill: string, depth = "0.035em") =>
    ({
        backgroundImage: fill,
        backgroundSize: "100% 1em",
        backgroundRepeat: "repeat-y",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        WebkitTextFillColor: "transparent",
        WebkitBoxDecorationBreak: "clone",
        boxDecorationBreak: "clone",
        filter: `drop-shadow(0 ${depth} 0 color-mix(in srgb, ${spot1} 45%, black)) drop-shadow(0 0.09em 0.14em rgba(0, 0, 0, 0.55))`,
    }) as const

/** The cover's star: the four-point sparkle set between cover lines. */
export const coverStar = '"\\2726"'

// metallic: kickers are condensed gold caps led by a tangerine sparkle;
// titles are cast in chrome, wide and tight; CTAs are enamel buttons
// edged in gold.
globalStyle(`${METALLIC_ROOT} ${sectionKicker}`, {
    fontFamily: marketing.font.display,
    fontStretch: "72%",
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: "0.26em",
    color: spot1,
    marginBottom: 14,
})

globalStyle(`${METALLIC_ROOT} ${sectionKicker}::before`, {
    content: coverStar,
    marginRight: 10,
    color: marketing.color.accent,
    letterSpacing: 0,
})

globalStyle(`${METALLIC_ROOT} ${sectionTitle}`, {
    ...metalText(chromeFill),
    textWrap: "balance",
    fontStretch: "112%",
    fontSize: "clamp(32px, 5.2vw, 64px)",
    lineHeight: 1,
    letterSpacing: "-0.02em",
})

const metalCta = {
    fontFamily: marketing.font.display,
    fontStretch: "84%",
    fontWeight: 800,
    fontSize: 15,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    padding: "16px 30px 15px",
} as const

globalStyle(`${METALLIC_ROOT} ${ctaPrimary}`, {
    ...metalCta,
    background: `linear-gradient(180deg, color-mix(in srgb, ${marketing.color.accent} 62%, white) 0%, ${marketing.color.accent} 46%, color-mix(in srgb, ${marketing.color.accent} 78%, black) 100%)`,
    boxShadow: `inset 0 0 0 1px ${spot1}, ${marketing.shape.shadowCta}`,
})

globalStyle(`${METALLIC_ROOT} ${ctaSecondary}`, {
    ...metalCta,
    color: spot1,
    border: `1.5px solid ${spot1}`,
})

globalStyle(`${METALLIC_ROOT} ${mediaImage}`, {
    border: `1px solid color-mix(in srgb, ${spot1} 70%, transparent)`,
    boxShadow: marketing.shape.shadowCard,
})

// lacquer: kickers are tiny widely spaced caps in blush behind a
// lipstick hairline; titles are the Didone at fashion scale; CTAs are
// glossed lipstick bars, square-cut.
globalStyle(`${LACQUER_ROOT} ${sectionKicker}`, {
    fontFamily: marketing.font.body,
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.42em",
    color: spot1,
    marginBottom: 18,
})

globalStyle(`${LACQUER_ROOT} ${sectionKicker}::before`, {
    content: '""',
    display: "inline-block",
    width: 30,
    height: 1,
    marginRight: 14,
    verticalAlign: "0.3em",
    background: marketing.color.accent,
})

globalStyle(`${LACQUER_ROOT} ${sectionTitle}`, {
    textWrap: "balance",
    fontSize: "clamp(32px, 5vw, 64px)",
    lineHeight: 1.02,
})

const lacquerCta = {
    fontFamily: marketing.font.body,
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "0.32em",
    textTransform: "uppercase",
    borderRadius: 0,
    padding: "19px 34px 18px",
} as const

globalStyle(`${LACQUER_ROOT} ${ctaPrimary}`, {
    ...lacquerCta,
    background: `linear-gradient(180deg, rgba(255, 255, 255, 0.24) 0%, rgba(255, 255, 255, 0.04) 46%, transparent 52%), ${marketing.color.accent}`,
    boxShadow: "none",
})

globalStyle(`${LACQUER_ROOT} ${ctaSecondary}`, {
    ...lacquerCta,
    border: `1px solid ${spot1}`,
})

globalStyle(`${LACQUER_ROOT} ${mediaImage}`, {
    border: "none",
    borderRadius: 0,
})

/**
 * Selector hooks for the `atomic` treatment (midcentury): the 1950s
 * furniture catalog. Sections opt in per style through these.
 */
export const ATOMIC = '[data-marketing-treatment~="atomic"] &'
export const ATOMIC_ROOT = '[data-marketing-treatment~="atomic"]'

/**
 * The atomic star as a mask: four long tapering rays, four short
 * diagonals, and a center dot. Paint it with `background` in any ink.
 */
export const ATOMIC_STAR_MASK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Cpath d='M20 0 L21.3 18.7 L40 20 L21.3 21.3 L20 40 L18.7 21.3 L0 20 L18.7 18.7 Z'/%3E%3Cpath d='M9.4 9.4 L30.6 30.6 M30.6 9.4 L9.4 30.6' stroke='black' stroke-width='1.6' stroke-linecap='round'/%3E%3Ccircle cx='20' cy='20' r='3.4'/%3E%3C/svg%3E")`

/** A heavy up-right arrow as a mask — the catalog's "this way" mark. */
export const ATOMIC_ARROW_MASK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6 3 H21 V18 H17 V9.8 L5.8 21 L3 18.2 L14.2 7 H6 Z'/%3E%3C/svg%3E")`

/**
 * The catalog's fourth ink: teal, pressed toward the text color so it
 * darkens on the light stock and brightens on the walnut den.
 */
export const atomicTeal = `color-mix(in srgb, #1d7c76 78%, ${marketing.color.text})` // theme-exempt: the register's fixed fourth ink, mixed toward the mode's text

/** A painted atomic star, sized by the caller. */
export const atomicStar = (size: number, ink: string) =>
    ({
        content: '""',
        display: "inline-block",
        flex: "none",
        width: size,
        height: size,
        background: ink,
        maskImage: ATOMIC_STAR_MASK,
        WebkitMaskImage: ATOMIC_STAR_MASK,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
    }) as const

// atomic: kickers as tracked geometric caps in the burnt-orange ink behind
// a short rule; titles in the condensed caps, balanced; the ask a mustard
// block lettered in ink with an orange chevron, the second ask ruled in ink.
globalStyle(`${ATOMIC_ROOT} ${sectionKicker}`, {
    display: "inline-flex",
    alignItems: "center",
    gap: 12,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.24em",
    color: spot1,
    marginBottom: 14,
})

globalStyle(`${ATOMIC_ROOT} ${sectionKicker}::before`, {
    content: '""',
    width: 28,
    height: 2,
    background: "currentColor",
})

globalStyle(`${ATOMIC_ROOT} ${sectionTitle}`, {
    textWrap: "balance",
    fontSize: "clamp(30px, 4.2vw, 50px)",
    lineHeight: 1.02,
    letterSpacing: "0.005em",
})

const atomicCta = {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    padding: "15px 22px",
} as const

globalStyle(`${ATOMIC_ROOT} ${ctaPrimary}`, {
    ...atomicCta,
    color: marketing.color.inkOnAccent,
    background: marketing.color.accent,
})

globalStyle(`${ATOMIC_ROOT} ${ctaPrimary}::after`, {
    content: '""',
    display: "inline-block",
    width: 7,
    height: 7,
    verticalAlign: "0.1em",
    marginLeft: 14,
    marginRight: 2,
    borderTop: `2.5px solid ${spot1}`,
    borderRight: `2.5px solid ${spot1}`,
    transform: "rotate(45deg)",
})

globalStyle(`${ATOMIC_ROOT} ${ctaSecondary}`, {
    ...atomicCta,
    padding: "14px 21px",
    border: `1px solid ${marketing.color.text}`,
})

globalStyle(`${ATOMIC_ROOT} ${ctaSecondary}:hover`, {
    background: marketing.color.surface,
})

/** Selector hooks for the photo-booth zine and the disco supper club. */
export const ZINE = '[data-marketing-treatment~="zine"] &'
export const ZINE_ROOT = '[data-marketing-treatment~="zine"]'
export const MIRRORBALL = '[data-marketing-treatment~="mirrorball"] &'
export const MIRRORBALL_ROOT = '[data-marketing-treatment~="mirrorball"]'

/** A felt-tip swoosh, thick in the middle and lifting off at the right — the zine's underline, as a mask. */
export const SWOOSH_MASK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 26' preserveAspectRatio='none'%3E%3Cpath d='M5 19 C 60 12 130 9 188 8 C 208 8 222 7 234 4' fill='none' stroke='black' stroke-width='7' stroke-linecap='round'/%3E%3C/svg%3E")`

/** The zine's typed label: small tracked mono caps on a flat ink tag. */
export const zineLabel = {
    fontFamily: captionFontStack,
    fontSize: 12.5,
    fontWeight: 600,
    letterSpacing: "0.07em",
    lineHeight: 1.3,
    textTransform: "uppercase",
    color: spot2,
    background: spot1,
} as const

// zine: kickers are label-maker tags in cobalt, slapped on a touch crooked.
globalStyle(`${ZINE_ROOT} ${sectionKicker}`, {
    ...zineLabel,
    display: "inline-block",
    padding: "6px 11px 5px",
    transform: "rotate(-1.5deg)",
    marginBottom: 18,
})

// Titles are the felt-tip caps with a pink swoosh pulled under them.
globalStyle(`${ZINE_ROOT} ${sectionTitle}, ${ZINE_ROOT} ${sectionTitleDisplay}`, {
    textWrap: "balance",
    fontSize: `calc(clamp(32px, 4.4vw, 54px) * ${marketing.display.scale})`,
    lineHeight: 1,
})

globalStyle(`${ZINE_ROOT} ${sectionTitle}::after`, {
    content: '""',
    display: "block",
    width: "min(3.4em, 100%)",
    height: "0.2em",
    marginTop: "0.16em",
    background: marketing.color.accent,
    maskImage: SWOOSH_MASK,
    maskSize: "100% 100%",
    maskRepeat: "no-repeat",
    WebkitMaskImage: SWOOSH_MASK,
    WebkitMaskSize: "100% 100%",
    WebkitMaskRepeat: "no-repeat",
})

globalStyle(`${ZINE_ROOT} ${sectionHeaderCentered} ${sectionTitle}::after`, {
    marginLeft: "auto",
    marginRight: "auto",
})

const zineCta = {
    fontFamily: captionFontStack,
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    lineHeight: 1.2,
    padding: "13px 22px 12px",
    border: `${marketing.shape.borderWidth} solid ${marketing.color.text}`,
} as const

// The asks are typed tags with a hard ink offset.
globalStyle(`${ZINE_ROOT} ${ctaPrimary}`, zineCta)

globalStyle(`${ZINE_ROOT} ${ctaSecondary}`, {
    ...zineCta,
    color: marketing.color.text,
    background: marketing.color.surface,
    boxShadow: marketing.shape.shadowCta,
})

// Every photograph is a drugstore print: a paper border and a soft drop.
globalStyle(`${ZINE_ROOT} ${mediaImage}`, {
    border: `6px solid ${marketing.color.surface}`,
    boxShadow: marketing.shape.shadowCard,
})

/** Gold foil: the second spot ink lit across the middle, burnished at the edges. */
export const goldFoil =
    `linear-gradient(115deg, color-mix(in srgb, ${spot2} 72%, black) 0%, ${spot2} 28%, ` +
    `color-mix(in srgb, ${spot2} 45%, white) 48%, ${spot2} 64%, color-mix(in srgb, ${spot2} 70%, black) 100%)`

/** The foil rule with a sparkle at its middle, for a title's foot. */
export const foilRule = {
    content: '"✦"',
    display: "block",
    width: "min(240px, 70%)",
    marginTop: "0.42em",
    fontFamily: marketing.font.body,
    fontSize: 13,
    lineHeight: 1,
    letterSpacing: 0,
    textAlign: "center",
    color: spot2,
    background:
        `linear-gradient(90deg, transparent, ${spot2} 18%, ${spot2} 42%, transparent 44%, ` +
        `transparent 56%, ${spot2} 58%, ${spot2} 82%, transparent) center / 100% 1px no-repeat`,
} as const

// mirrorball: kickers are tracked gold caps between two sparkles.
globalStyle(`${MIRRORBALL_ROOT} ${sectionKicker}`, {
    fontSize: 12.5,
    fontWeight: 600,
    letterSpacing: "0.34em",
    color: spot2,
    marginBottom: 14,
})

globalStyle(`${MIRRORBALL_ROOT} ${sectionKicker}::before`, { content: '"✦\\00a0\\00a0"', letterSpacing: 0 })
globalStyle(`${MIRRORBALL_ROOT} ${sectionKicker}::after`, { content: '"\\00a0\\00a0✦"', letterSpacing: 0 })

// Titles are the Didone caps standing on a foil rule.
globalStyle(`${MIRRORBALL_ROOT} ${sectionTitle}, ${MIRRORBALL_ROOT} ${sectionTitleDisplay}`, {
    textWrap: "balance",
    fontSize: `calc(clamp(30px, 4vw, 50px) * ${marketing.display.scale})`,
    lineHeight: 1.02,
})

globalStyle(`${MIRRORBALL_ROOT} ${sectionTitle}::after`, foilRule)

globalStyle(`${MIRRORBALL_ROOT} ${sectionHeaderCentered} ${sectionTitle}::after`, {
    marginLeft: "auto",
    marginRight: "auto",
})

const discoCta = {
    fontSize: 13.5,
    fontWeight: 600,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    lineHeight: 1.2,
    padding: "16px 30px 14px",
} as const

// The asks are foil pills; the second ask a gilt outline.
globalStyle(`${MIRRORBALL_ROOT} ${ctaPrimary}`, {
    ...discoCta,
    color: `color-mix(in srgb, ${spot2} 22%, black)`,
    background: goldFoil,
})

globalStyle(`${MIRRORBALL_ROOT} ${ctaSecondary}`, {
    ...discoCta,
    color: spot2,
    borderColor: spot2,
})

// Photographs hang in a double gilt frame.
globalStyle(`${MIRRORBALL_ROOT} ${mediaImage}`, {
    border: `1px solid ${spot2}`,
    boxShadow: `0 0 0 5px ${marketing.color.pageBg}, 0 0 0 6px color-mix(in srgb, ${spot2} 55%, transparent), ${marketing.shape.shadowCard}`,
})

/** Selector hooks for the fridge-door and rodeo-poster treatments. */
export const TAPED = '[data-marketing-treatment~="taped"] &'
export const TAPED_ROOT = '[data-marketing-treatment~="taped"]'
export const LARIAT = '[data-marketing-treatment~="lariat"] &'
export const LARIAT_ROOT = '[data-marketing-treatment~="lariat"]'
/** Selector hook for the faire-part treatment (`carton`). */
export const RULED = '[data-marketing-treatment~="ruled"] &'
export const RULED_ROOT = '[data-marketing-treatment~="ruled"]'

/** Masking tape: a translucent crepe tan that reads on cream paper and on the dark door alike. */
export const MASKING_TAPE = "rgba(232, 214, 166, 0.82)" // theme-exempt: the tape is a material, not a theme ink

/** A strip of tape torn off the roll: ragged ends, straight sides. */
export const TAPE_CLIP =
    "polygon(0% 12%, 3% 0%, 97% 4%, 100% 18%, 98% 40%, 100% 62%, 97% 100%, 4% 94%, 0% 80%, 2% 56%, 0% 34%)"

/**
 * The marker plate: a hand-filled rectangle with ragged, uneven edges —
 * a CTA scribbled in with a fat red marker rather than set in a UI kit.
 */
export const MARKER_PLATE_MASK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 48' preserveAspectRatio='none'%3E%3Cpath d='M4 7 L22 3 L58 5 L96 2 L140 4 L176 2 L198 5 L196 16 L199 27 L196 39 L198 45 L160 43 L122 46 L84 44 L44 46 L6 44 L2 33 L4 22 L1 12 Z'/%3E%3C/svg%3E")`

/** A hand-drawn arrow curling right, for the notes scribbled beside the prints. */
export const SCRIBBLE_ARROW_MASK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 40'%3E%3Cpath d='M4 8 C 10 30, 26 34, 30 22 C 33 12, 20 10, 20 20 C 20 30, 38 34, 58 26' fill='none' stroke='black' stroke-width='3' stroke-linecap='round'/%3E%3Cpath d='M48 18 L59 26 L47 33' fill='none' stroke='black' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`

// taped: kickers are written on in the felt-tip script, in marker red;
// titles are the shouted condensed caps; the asks are marker plates.
globalStyle(`${TAPED_ROOT} ${sectionKicker}`, {
    fontFamily: scriptFont,
    fontSize: 27,
    fontWeight: 400,
    lineHeight: 1.1,
    letterSpacing: 0,
    textTransform: "none",
    marginBottom: 6,
})

globalStyle(`${TAPED_ROOT} ${sectionTitle}`, {
    textWrap: "balance",
    fontSize: "clamp(36px, 5.2vw, 64px)",
    lineHeight: 0.94,
})

globalStyle(`${TAPED_ROOT} ${ctaPrimary}`, {
    fontFamily: marketing.font.display,
    fontWeight: 800,
    fontSize: 19,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    lineHeight: 1.1,
    padding: "15px 30px 14px 26px",
    borderRadius: 0,
    boxShadow: "none",
    WebkitMaskImage: MARKER_PLATE_MASK,
    maskImage: MARKER_PLATE_MASK,
    WebkitMaskSize: "100% 100%",
    maskSize: "100% 100%",
})

globalStyle(`${TAPED_ROOT} ${ctaPrimary}::after`, {
    content: '"→"',
    marginLeft: 12,
    fontFamily: marketing.font.body,
    fontWeight: 700,
})

globalStyle(`${TAPED_ROOT} ${ctaSecondary}`, {
    fontFamily: scriptFont,
    fontSize: 24,
    fontWeight: 400,
    padding: "6px 4px",
    border: "none",
    borderRadius: 0,
    backgroundImage: `linear-gradient(${marketing.color.accent}, ${marketing.color.accent})`,
    backgroundSize: "100% 3px",
    backgroundPosition: "0 92%",
    backgroundRepeat: "no-repeat",
})

// Every photograph is a print: white border, a soft shadow on the door.
globalStyle(`${TAPED_ROOT} ${mediaImage}`, {
    padding: 10,
    background: marketing.color.surface,
    border: "none",
    borderRadius: 2,
    boxShadow: marketing.shape.shadowCard,
})

// lariat: kickers are wood-type caps between two stars; titles the
// poster's display letters; the asks are stitched leather tags.
globalStyle(`${LARIAT_ROOT} ${sectionKicker}`, {
    fontFamily: marketing.font.display,
    fontSize: 15,
    fontWeight: 400,
    letterSpacing: "0.16em",
    marginBottom: 12,
})

globalStyle(`${LARIAT_ROOT} ${sectionKicker}::before, ${LARIAT_ROOT} ${sectionKicker}::after`, {
    content: '"★"',
    display: "inline-block",
    fontSize: "0.8em",
    color: spot1,
    verticalAlign: "0.1em",
})

globalStyle(`${LARIAT_ROOT} ${sectionKicker}::before`, { marginRight: 12 })
globalStyle(`${LARIAT_ROOT} ${sectionKicker}::after`, { marginLeft: 12 })

globalStyle(`${LARIAT_ROOT} ${sectionTitle}`, {
    textWrap: "balance",
    fontSize: "clamp(30px, 4.4vw, 54px)",
    lineHeight: 1.02,
})

const lariatCta = {
    fontFamily: marketing.font.display,
    fontWeight: 400,
    fontSize: 16,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    lineHeight: 1.1,
    padding: "16px 28px 14px",
    borderRadius: 4,
} as const

globalStyle(`${LARIAT_ROOT} ${ctaPrimary}`, {
    ...lariatCta,
    outline: `1.5px dashed color-mix(in srgb, ${marketing.color.onAccent} 70%, transparent)`,
    outlineOffset: -6,
})

globalStyle(`${LARIAT_ROOT} ${ctaSecondary}`, {
    ...lariatCta,
    border: `2px solid ${marketing.color.text}`,
    padding: "14px 26px 12px",
})

globalStyle(`${LARIAT_ROOT} ${mediaImage}`, {
    border: `2px solid ${marketing.color.text}`,
    borderRadius: 3,
    boxShadow: marketing.shape.shadowCard,
})

/** Selector hooks for the Group 2 registers' treatments. */
export const GAUGE = '[data-marketing-treatment~="gauge"] &'
export const GAUGE_ROOT = '[data-marketing-treatment~="gauge"]'
export const DISPATCH = '[data-marketing-treatment~="dispatch"] &'
export const DISPATCH_ROOT = '[data-marketing-treatment~="dispatch"]'
export const JOURNAL = '[data-marketing-treatment~="journal"] &'
export const JOURNAL_ROOT = '[data-marketing-treatment~="journal"]'
export const STILLNESS = '[data-marketing-treatment~="stillness"] &'
export const STILLNESS_ROOT = '[data-marketing-treatment~="stillness"]'
export const CONCIERGE = '[data-marketing-treatment~="concierge"] &'
export const CONCIERGE_ROOT = '[data-marketing-treatment~="concierge"]'
export const CABANA = '[data-marketing-treatment~="cabana"] &'
export const CABANA_ROOT = '[data-marketing-treatment~="cabana"]'

// gauge: the plant-room log. Kickers are stencilled mono tags run off a
// copper rule; the asks are square-cut plates; photographs sit in a
// hairline instrument bezel.
globalStyle(`${GAUGE_ROOT} ${sectionKicker}`, {
    fontFamily: scriptFont,
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    display: "inline-flex",
    alignItems: "center",
    gap: 12,
})

globalStyle(`${GAUGE_ROOT} ${sectionKicker}::before`, {
    content: '""',
    width: 28,
    height: 1,
    background: marketing.color.accent,
})

globalStyle(`${GAUGE_ROOT} ${sectionTitle}`, {
    textWrap: "balance",
    textTransform: "uppercase",
    letterSpacing: "0.01em",
    lineHeight: 1,
})

globalStyle(`${GAUGE_ROOT} ${ctaPrimary}, ${GAUGE_ROOT} ${ctaSecondary}`, {
    fontFamily: scriptFont,
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    borderRadius: 0,
})

globalStyle(`${GAUGE_ROOT} ${mediaImage}`, {
    border: `1px solid ${marketing.color.line}`,
    borderRadius: 0,
    boxShadow: `0 0 0 6px ${marketing.color.surface}, 0 0 0 7px ${marketing.color.line}`,
})

// dispatch: the storm desk. Kickers are status chips led by the amber
// signal dot; titles set tight and heavy; the asks are fat rounded
// buttons a thumb finds in the rain.
globalStyle(`${DISPATCH_ROOT} ${sectionKicker}`, {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    padding: "6px 12px",
    borderRadius: 999,
    color: marketing.color.text,
    background: `color-mix(in srgb, ${marketing.color.accent} 16%, transparent)`,
})

globalStyle(`${DISPATCH_ROOT} ${sectionKicker}::before`, {
    content: '""',
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: marketing.color.accent,
    boxShadow: `0 0 0 3px color-mix(in srgb, ${marketing.color.accent} 30%, transparent)`,
})

globalStyle(`${DISPATCH_ROOT} ${sectionTitle}`, {
    textWrap: "balance",
    letterSpacing: "-0.02em",
    lineHeight: 1.02,
})

globalStyle(`${DISPATCH_ROOT} ${ctaPrimary}`, {
    fontWeight: 800,
    fontSize: 16,
    padding: "16px 26px",
})

globalStyle(`${DISPATCH_ROOT} ${mediaImage}`, {
    borderRadius: marketing.shape.radiusCard,
})

// journal: the garden notebook. Kickers are italic serif datelines in
// the olive ink; titles keep the book's lowercase ease; photographs are
// tipped-in plates with a paper margin.
globalStyle(`${JOURNAL_ROOT} ${sectionKicker}`, {
    fontFamily: marketing.font.display,
    fontStyle: "italic",
    fontSize: 19,
    fontWeight: 400,
    letterSpacing: 0,
    textTransform: "none",
    marginBottom: 8,
})

globalStyle(`${JOURNAL_ROOT} ${sectionTitle}`, {
    textWrap: "balance",
    fontSize: "clamp(32px, 4.4vw, 56px)",
    lineHeight: 1.06,
})

globalStyle(`${JOURNAL_ROOT} ${ctaPrimary}`, {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    padding: "15px 26px",
})

globalStyle(`${JOURNAL_ROOT} ${ctaSecondary}`, {
    fontFamily: marketing.font.display,
    fontStyle: "italic",
    fontSize: 18,
    border: "none",
    padding: "6px 2px",
    backgroundImage: `linear-gradient(${marketing.color.accent}, ${marketing.color.accent})`,
    backgroundSize: "100% 1px",
    backgroundPosition: "0 90%",
    backgroundRepeat: "no-repeat",
})

globalStyle(`${JOURNAL_ROOT} ${mediaImage}`, {
    padding: 8,
    background: marketing.color.surface,
    border: `1px solid ${marketing.color.line}`,
    borderRadius: 1,
})

// stillness: the tea garden. Kickers are widely spaced light caps behind a
// small vermilion seal square; titles whisper at a light weight; the asks
// are hairline outlines with no fill until touched.
globalStyle(`${STILLNESS_ROOT} ${sectionKicker}`, {
    display: "inline-flex",
    alignItems: "center",
    gap: 14,
    fontSize: 11,
    fontWeight: 400,
    letterSpacing: "0.34em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})

globalStyle(`${STILLNESS_ROOT} ${sectionKicker}::before`, {
    content: '""',
    width: 7,
    height: 7,
    background: marketing.color.accent,
})

globalStyle(`${STILLNESS_ROOT} ${sectionTitle}`, {
    textWrap: "balance",
    fontWeight: 300,
    letterSpacing: "0.02em",
    lineHeight: 1.12,
})

globalStyle(`${STILLNESS_ROOT} ${ctaPrimary}`, {
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "0.28em",
    textTransform: "uppercase",
    borderRadius: 0,
    padding: "16px 30px",
})

globalStyle(`${STILLNESS_ROOT} ${ctaSecondary}`, {
    fontSize: 12,
    fontWeight: 400,
    letterSpacing: "0.28em",
    textTransform: "uppercase",
    borderRadius: 0,
    background: "transparent",
    border: `1px solid ${marketing.color.line}`,
})

globalStyle(`${STILLNESS_ROOT} ${mediaImage}`, {
    borderRadius: 0,
    boxShadow: "none",
})

// concierge: the house manager's note. Kickers are sage small caps; the
// ask is a black square plate with its arrow, the second ask a plain
// underline — nothing on the page louder than the linen.
globalStyle(`${CONCIERGE_ROOT} ${sectionKicker}`, {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: spot1,
})

globalStyle(`${CONCIERGE_ROOT} ${sectionTitle}`, {
    textWrap: "balance",
    letterSpacing: "-0.025em",
    lineHeight: 1.04,
})

globalStyle(`${CONCIERGE_ROOT} ${ctaPrimary}`, {
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: "0.04em",
    padding: "16px 24px",
    boxShadow: "none",
})

globalStyle(`${CONCIERGE_ROOT} ${ctaPrimary}::after`, {
    content: '"→"',
    marginLeft: 14,
})

globalStyle(`${CONCIERGE_ROOT} ${ctaSecondary}`, {
    fontSize: 14,
    fontWeight: 600,
    border: "none",
    background: "transparent",
    padding: "6px 2px",
    backgroundImage: `linear-gradient(${marketing.color.text}, ${marketing.color.text})`,
    backgroundSize: "100% 1px",
    backgroundPosition: "0 92%",
    backgroundRepeat: "no-repeat",
})

// cabana: the Palm Beach club. Kickers are spaced caps between two gold
// rules; titles are the old serif; the asks are palm-green pills; every
// photograph wears a gold keyline inside a pink mat.
globalStyle(`${CABANA_ROOT} ${sectionKicker}`, {
    display: "inline-flex",
    alignItems: "center",
    gap: 14,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.26em",
    textTransform: "uppercase",
})

globalStyle(`${CABANA_ROOT} ${sectionKicker}::before, ${CABANA_ROOT} ${sectionKicker}::after`, {
    content: '""',
    width: 26,
    height: 1,
    background: spot2,
})

globalStyle(`${CABANA_ROOT} ${sectionTitle}`, {
    textWrap: "balance",
    lineHeight: 1.06,
})

globalStyle(`${CABANA_ROOT} ${ctaPrimary}`, {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    borderRadius: 999,
    padding: "15px 28px",
})

globalStyle(`${CABANA_ROOT} ${ctaSecondary}`, {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    borderRadius: 999,
})

globalStyle(`${CABANA_ROOT} ${mediaImage}`, {
    border: `1px solid ${spot2}`,
    boxShadow: `0 0 0 6px ${marketing.color.surface}, 0 0 0 7px color-mix(in srgb, ${spot2} 60%, transparent)`,
})
