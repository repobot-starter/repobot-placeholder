import { style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import { ctaPrimary, ctaSecondary, emojiPanel, mediaImage, rise } from "./shared.css"

const heroBase = style({
    padding: `${scaledSpace(72)} 0 ${scaledSpace(40)}`,
    animation: `${rise} ${marketing.motion.rise} ease both`,
    "@media": {
        "(prefers-reduced-motion: reduce)": { animation: "none" },
    },
})

export const centered = style([heroBase, { textAlign: "center" }])

export const split = style([
    heroBase,
    {
        display: "grid",
        gridTemplateColumns: "1.1fr 0.9fr",
        gap: scaledSpace(48),
        alignItems: "center",
        textAlign: "left",
        "@media": {
            "(max-width: 860px)": { gridTemplateColumns: "1fr", gap: scaledSpace(32) },
        },
    },
])

export const statement = style([
    heroBase,
    { textAlign: "left", padding: `${scaledSpace(88)} 0 ${scaledSpace(48)}` },
])

export const badge = style({
    display: "inline-block",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: marketing.color.accent,
    background: marketing.color.accentSoft,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: 999,
    padding: "5px 12px",
    marginBottom: scaledSpace(22),
})

export const headline = style({
    fontFamily: marketing.font.display,
    // The display-scale axis multiplies the authored clamp: monumental
    // registers grow the headline into the layout's main event without the
    // hero re-authoring its size.
    fontSize: `calc(clamp(36px, 6vw, 62px) * ${marketing.display.scale})`,
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    // The contract emits plain var strings; the token is "none" | "uppercase".
    textTransform: marketing.display.transform as "none",
    lineHeight: 1.05,
    color: marketing.color.text,
    margin: 0,
})

/** Centered variants cap the measure; split/statement run wider. */
export const headlineCentered = style({
    maxWidth: 760,
    margin: "0 auto",
})

export const headlineStatement = style({
    fontSize: `calc(clamp(40px, 7.5vw, 78px) * ${marketing.display.scale})`,
    maxWidth: 900,
})

export const accentWord = style({
    color: marketing.color.accent,
    fontStyle: marketing.display.accentStyle,
    selectors: {
        // The outline treatment: registers that declare it (monolith) set
        // the headline's accent word as stroke-only letterforms — the
        // mid-animation look from the concept — instead of a color shift.
        // text-stroke needs a hue: the current text color, since outline
        // registers speak in ink, not accent.
        '[data-marketing-treatment~="outline"] &': {
            color: "transparent",
            WebkitTextStroke: `1.5px ${marketing.color.text}`,
        },
    },
})

export const subheadline = style({
    fontSize: 18,
    lineHeight: 1.6,
    color: marketing.color.subtle,
    maxWidth: 620,
    margin: `${scaledSpace(22)} 0 0`,
})

export const subheadlineCentered = style({
    marginLeft: "auto",
    marginRight: "auto",
})

export const ctaRow = style({
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginTop: scaledSpace(32),
})

export const ctaRowCentered = style({
    justifyContent: "center",
})

export const primary = ctaPrimary

export const secondary = ctaSecondary

export const formSlot = style({
    marginTop: scaledSpace(32),
})

export const media = style({
    marginTop: scaledSpace(40),
})

export const mediaCentered = style({
    maxWidth: 820,
    marginLeft: "auto",
    marginRight: "auto",
})

export const mediaEmoji = emojiPanel

export const mediaImg = mediaImage

export const productFrame = style({
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    overflow: "hidden",
})

export const productFrameBar = style({
    display: "flex",
    gap: 6,
    padding: "10px 14px",
    borderBottom: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
})

export const productFrameDot = style({
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: marketing.color.line,
})

export const productFrameEmoji = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: marketing.color.accentSoft,
    fontSize: 72,
    minHeight: 260,
})

export const productFrameImg = style({
    width: "100%",
    display: "block",
})

/*
 * `panel-collage`: the framed product below centered copy, with floating
 * UI-crop fragments overlapping the frame's edges. The fragments carry
 * card chrome here so plain crops arrive ready; on narrow screens they
 * give way and the frame stands alone.
 */
export const collage = style({
    position: "relative",
    marginTop: scaledSpace(48),
    maxWidth: 960,
    marginLeft: "auto",
    marginRight: "auto",
})

export const collageFrame = style({
    // A whisper of perspective so the panel reads as an object, not a flat
    // screenshot; static (no motion), so reduced-motion needs no branch.
    transform: "perspective(2000px) rotateX(1.5deg)",
    transformOrigin: "center top",
})

const collageFragment = style({
    position: "absolute",
    width: "clamp(180px, 24%, 260px)",
    borderRadius: marketing.shape.radiusCard,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    boxShadow: marketing.shape.shadowCard,
    overflow: "hidden",
    background: marketing.color.surface,
    "@media": {
        "(max-width: 720px)": { display: "none" },
    },
})

export const collageFragmentLeft = style([
    collageFragment,
    {
        left: "-4%",
        bottom: "12%",
    },
])

export const collageFragmentRight = style([
    collageFragment,
    {
        // Wider than the left slot: it usually carries a row-shaped crop
        // (a queue, a table) that needs the width to stay legible.
        width: "clamp(240px, 34%, 360px)",
        right: "-5%",
        top: "8%",
    },
])

export const collageFragmentImg = style({
    width: "100%",
    // Beat the intrinsic height attribute — the fragment scales to the
    // card's width and keeps its aspect.
    height: "auto",
    display: "block",
})

/**
 * `full-bleed-media`: the photograph IS the hero. Viewport-wide, most of
 * the viewport tall, copy floated low over a dark grade — light-on-image
 * is intrinsic to the variant (the neutral-scrim precedent from
 * MarketingBackdrop's `overlayDark`), so text colors are deliberate
 * constants rather than theme tokens here.
 */
export const fullBleed = style({
    position: "relative",
    width: "100vw",
    marginLeft: "calc(50% - 50vw)",
    height: "92svh",
    minHeight: 480,
    maxHeight: 1100,
    overflow: "hidden",
    display: "flex",
    alignItems: "flex-end",
    // Until a frame has painted (slow load, or the responsive WebPs failing
    // outright) the ground must already be dark, or the whole hero reads as
    // a blank white viewport — white copy over the page's paper.
    background: "#080a0e", // theme-exempt: the scrim's neutral — this variant's copy is white-on-photograph in every theme
})

export const fullBleedSlide = style({
    position: "absolute",
    inset: 0,
    opacity: 0,
    // Inactive frames stack full-bleed over each other; without this,
    // hover-Replace and clicks hit the last DOM slide, not the visible one.
    pointerEvents: "none",
    transition: "opacity 1400ms ease",
    "@media": {
        "(prefers-reduced-motion: reduce)": { transition: "none" },
    },
})

export const fullBleedSlideActive = style({
    opacity: 1,
    pointerEvents: "auto",
})

export const fullBleedImg = style({
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
})

export const fullBleedScrim = style({
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
        "linear-gradient(180deg, rgba(8, 10, 14, 0.22) 0%, rgba(8, 10, 14, 0) 38%, rgba(8, 10, 14, 0.55) 100%)",
})

/** Mirrors MarketingPage's frame so the copy lines up with the page column. */
export const fullBleedInner = style({
    position: "relative",
    width: `min(${marketing.layout.maxWidth}, 100%)`,
    margin: "0 auto",
    padding: `0 24px ${scaledSpace(64)}`,
})

export const fullBleedBadge = style({
    display: "inline-block",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: "rgba(255, 255, 255, 0.82)",
    marginBottom: scaledSpace(18),
})

export const fullBleedHeadline = style({
    color: "#ffffff", // theme-exempt: copy over a photographic scrim is white in every theme
})

export const fullBleedSubheadline = style({
    color: "rgba(255, 255, 255, 0.85)",
})

export const fullBleedSecondary = style([
    ctaSecondary,
    {
        color: "#ffffff", // theme-exempt: copy over a photographic scrim is white in every theme
        borderColor: "rgba(255, 255, 255, 0.55)",
        selectors: {
            "&:hover": { borderColor: "#ffffff" }, // theme-exempt: copy over a photographic scrim is white in every theme
        },
    },
])

/*
 * `masthead-overlay`: the type-dominant reading of the full-bleed hero.
 * The headline grows to masthead scale — the register's display voice
 * (family, case, tracking, scale axis) times a much larger base — and the
 * badge becomes a small tracked kicker above it. Copy stays white over the
 * photographic scrim, same as full-bleed.
 */
export const mastheadKicker = style({
    display: "inline-block",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: "rgba(255, 255, 255, 0.85)",
    marginBottom: scaledSpace(14),
})

export const mastheadHeadline = style({
    color: "#ffffff", // theme-exempt: copy over a photographic scrim is white in every theme
    fontSize: `calc(clamp(48px, 9.5vw, 118px) * ${marketing.display.scale})`,
    lineHeight: 0.98,
    // The masthead fills the frame; a measure cap would re-shrink it into
    // a caption.
    maxWidth: "none",
})
