import { globalStyle, keyframes, style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import {
    ATOMIC_ARROW_MASK,
    ATOMIC_ROOT,
    COLORBLOCK_ROOT,
    LACQUER_ROOT,
    LARIAT_ROOT,
    RULED_ROOT,
    MASKING_TAPE,
    SCRIBBLE_ARROW_MASK,
    TAPED_ROOT,
    TAPE_CLIP,
    LINEWORK,
    METALLIC_ROOT,
    MIRRORBALL_ROOT,
    SWOOSH_MASK,
    ZINE_ROOT,
    POP,
    TWO_INK_ROOT,
    SIGNPAINT,
    SUNBURST,
    captionFontStack,
    chromeFill,
    coverStar,
    ctaPrimary,
    ctaSecondary,
    emojiPanel,
    goldFill,
    foilRule,
    halftonePlate,
    handCutRadius,
    mediaImage,
    metalText,
    pulpExtrude,
    rise,
    scriptFont,
    atomicStar,
    atomicTeal,
    spot1,
    spot2,
    zineLabel,
} from "./shared.css"

const SQUIGGLE_MASK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 26'%3E%3Cpath d='M4 16 q 11 -18 22 0 t 22 0 t 22 0 t 22 0' fill='none' stroke='black' stroke-width='7' stroke-linecap='round'/%3E%3C/svg%3E")`

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
        // The pop starburst and the seal pin to the header's corner.
        position: "relative",
        "@media": {
            "(max-width: 860px)": { gridTemplateColumns: "1fr", gap: scaledSpace(32) },
        },
    },
])

/** `split-media` beside a photograph (the `sunburst` bleed hooks this). */
export const splitPhoto = style({})

/** `split-media`'s aside panel: flush right beside the copy, full width stacked. */
export const aside = style({
    justifySelf: "end",
    "@media": {
        "(max-width: 860px)": { justifySelf: "stretch" },
    },
})

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
    selectors: {
        // The starburst sticker: a 14-point burst in the second spot ink,
        // outlined and offset in ink by stacked drop-shadows (the burst
        // itself is the ::before, so the filter traces its cut edge).
        [POP]: {
            position: "relative",
            isolation: "isolate",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            width: 132,
            height: 132,
            // The copy sits inside the burst's inscribed circle (~3/4 of
            // the box), so the padding keeps a long word off the points.
            padding: "0 26px",
            fontFamily: marketing.font.display,
            fontStyle: "italic",
            fontWeight: 900,
            fontSize: 13,
            lineHeight: 1.02,
            letterSpacing: "0.01em",
            color: "#141414", // theme-exempt: ink on the lemon burst reads in both appearances
            background: "none",
            border: "none",
            borderRadius: 0,
            transform: "rotate(-9deg)",
            filter:
                `drop-shadow(2px 0 0 ${marketing.color.line}) drop-shadow(-2px 0 0 ${marketing.color.line}) ` +
                `drop-shadow(0 2px 0 ${marketing.color.line}) drop-shadow(0 -2px 0 ${marketing.color.line}) ` +
                `drop-shadow(5px 5px 0 ${marketing.color.line})`,
        },
        [`${POP}::before`]: {
            content: '""',
            position: "absolute",
            inset: 0,
            zIndex: -1,
            background: spot2,
            clipPath:
                "polygon(50% 0%, 57.8% 13.8%, 72.4% 6.9%, 73.8% 22.6%, 89.5% 21.5%, 84.2% 36.4%, 99.5% 40.2%, " +
                "88.3% 50%, 99.5% 59.8%, 84.2% 63.6%, 89.5% 78.5%, 73.8% 77.4%, 72.4% 93.1%, 57.8% 86.2%, " +
                "50% 100%, 42.2% 86.2%, 27.6% 93.1%, 26.2% 77.4%, 10.5% 78.5%, 15.8% 63.6%, 0.5% 59.8%, " +
                "11.7% 50%, 0.5% 40.2%, 15.8% 36.4%, 10.5% 21.5%, 26.2% 22.6%, 27.6% 6.9%, 42.2% 13.8%)",
        },
    },
})

/** The burst's slow sticker wobble (kinetic idiom); reduced motion holds it. */
const burstWobble = keyframes({
    "0%, 100%": { transform: "rotate(-9deg) scale(1)" },
    "50%": { transform: "rotate(-3deg) scale(1.04)" },
})

// Split heroes hang the burst over the photograph's top corner; stacked
// (narrow) heroes keep it in the copy flow, a touch smaller.
globalStyle(`[data-marketing-treatment~="pop"] ${split} ${badge}`, {
    position: "absolute",
    top: 4,
    right: -18,
    zIndex: 2,
    width: 156,
    height: 156,
    padding: "0 30px",
    fontSize: 15,
    marginBottom: 0,
    animation: `${burstWobble} 5.5s ease-in-out infinite`,
    "@media": {
        // Tuck the overhang in once the page gutter is narrower than the
        // rotated burst's reach, so it never scrolls the page sideways.
        "(max-width: 1219px)": { right: 0 },
        "(max-width: 860px)": {
            position: "relative",
            top: "auto",
            right: "auto",
            width: 124,
            height: 124,
            padding: "0 24px",
            fontSize: 12,
            marginBottom: 8,
        },
        "(prefers-reduced-motion: reduce)": { animation: "none" },
    },
})

const livePulse = keyframes({
    "0%": { boxShadow: `0 0 0 0 color-mix(in srgb, ${marketing.color.accent} 55%, transparent)` },
    "70%": { boxShadow: `0 0 0 9px color-mix(in srgb, ${marketing.color.accent} 0%, transparent)` },
    "100%": { boxShadow: `0 0 0 0 color-mix(in srgb, ${marketing.color.accent} 0%, transparent)` },
})

/** `badgeLive`: the computed-status pill — sentence case, led by a live dot. */
export const badgeLive = style({
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 1.3,
    color: marketing.color.text,
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: 999,
    boxShadow: marketing.shape.shadowCard,
    padding: "8px 16px 8px 12px",
    marginBottom: scaledSpace(22),
})

export const badgeLiveDot = style({
    flex: "none",
    width: 11,
    height: 11,
    borderRadius: "50%",
    background: marketing.color.accent,
    animation: `${livePulse} 2.2s ease-out infinite`,
    "@media": {
        "(prefers-reduced-motion: reduce)": { animation: "none" },
    },
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
    selectors: {
        // Chunky italic with a hard offset in the first spot ink — the
        // flyer headline, printed slightly off-register on purpose.
        [POP]: {
            fontStyle: "italic",
            lineHeight: 0.98,
            textShadow: `0.05em 0.05em 0 ${spot1}`,
        },
    },
})

/** Centered variants cap the measure; split/statement run wider. */
export const headlineCentered = style({
    maxWidth: 760,
    margin: "0 auto",
})

export const headlineStatement = style({
    fontSize: `calc(clamp(40px, 7.5vw, 78px) * ${marketing.display.scale})`,
    maxWidth: 900,
    selectors: {
        // `ruled`: the invitation — the statement hero carrying the
        // countdown badge (the home) — sets the names as the page's only
        // picture; page-title statements keep the register's size.
        [`${RULED_ROOT} ${badge} ~ &`]: {
            fontSize: `calc(clamp(60px, 16vw, 104px) * ${marketing.display.scale})`,
            lineHeight: 0.98,
            maxWidth: "none",
        },
    },
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
        [POP]: { textShadow: `0.05em 0.05em 0 ${marketing.color.text}` },
    },
})

export const subheadline = style({
    fontSize: 18,
    lineHeight: 1.6,
    color: marketing.color.subtle,
    maxWidth: 620,
    margin: `${scaledSpace(22)} 0 0`,
    selectors: {
        // `ruled`: the invitation's place-and-date line in tracked caps under
        // an ink rule (page-title statements keep sentence case).
        [`${RULED_ROOT} ${badge} ~ ${headlineStatement} ~ &`]: {
            fontSize: 13,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: marketing.color.text,
            maxWidth: "none",
            borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.accent}`,
            paddingTop: scaledSpace(16),
        },
    },
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
    selectors: {
        [POP]: { position: "relative", isolation: "isolate" },
        // Two ornaments with a job: a dot screen the print sits on, and a
        // squiggle underlining its top edge. Ink/spot fills through a mask,
        // so they follow the appearance.
        [`${POP}::before`]: {
            content: '""',
            position: "absolute",
            left: -22,
            bottom: -22,
            width: "46%",
            height: "52%",
            zIndex: -1,
            backgroundImage: `radial-gradient(${marketing.color.text} 2.2px, transparent 2.8px)`,
            backgroundSize: "14px 14px",
        },
        [`${POP}::after`]: {
            content: '""',
            position: "absolute",
            left: 18,
            top: -30,
            width: 96,
            height: 26,
            background: marketing.color.accent,
            WebkitMaskImage: SQUIGGLE_MASK,
            maskImage: SQUIGGLE_MASK,
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
        },
    },
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
 * `panel-collage` with `panels`: a row of portrait photographs under the
 * centered copy, each captioned beneath — four across, two on narrow
 * screens.
 */
export const panelRow = style({
    listStyle: "none",
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: scaledSpace(22),
    margin: `${scaledSpace(44)} auto 0`,
    padding: 0,
    maxWidth: 1080,
    "@media": {
        "(max-width: 760px)": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: scaledSpace(16) },
    },
})

export const panel = style({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: scaledSpace(12),
    minWidth: 0,
})

export const panelFrame = style({
    margin: 0,
    width: "100%",
    aspectRatio: "3 / 4",
    overflow: "hidden",
    borderRadius: marketing.shape.radiusCard,
    background: marketing.color.surface,
})

export const panelImg = style({
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
})

export const panelLabel = style({
    fontFamily: marketing.font.display,
    fontSize: 19,
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    color: marketing.color.text,
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
    // A floor, never a fixed height: the frame is its authored size when
    // the copy fits, and grows with the copy when a register's display
    // scale outgrows it — a fixed height clipped the headline's first line
    // under the nav (overflow hidden, copy pinned to the foot).
    minHeight: "clamp(480px, 92svh, 1100px)",
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
    selectors: {
        // The mist treatment: the frame arrives out of fog. The photograph
        // dissolves into the page ground under the nav and again at its
        // foot (so the next section continues the weather rather than
        // starting on a hard edge), and the grade that carries the copy
        // leans in from the lower left only — the sky and the subject stay
        // clean instead of the whole frame going muddy.
        '[data-marketing-treatment~="mist"] &': {
            background:
                `linear-gradient(180deg, color-mix(in srgb, ${marketing.color.pageBg} 70%, transparent) 0%, ` +
                "transparent 14%, transparent 58%, " +
                `color-mix(in srgb, ${marketing.color.pageBg} 55%, transparent) 88%, ${marketing.color.pageBg} 100%), ` +
                "radial-gradient(120% 90% at 0% 100%, rgba(8, 10, 14, 0.62) 0%, rgba(8, 10, 14, 0.28) 42%, rgba(8, 10, 14, 0) 70%)",
        },
    },
})

/** Mirrors MarketingPage's frame so the copy lines up with the page column. */
export const fullBleedInner = style({
    position: "relative",
    width: `min(${marketing.layout.maxWidth}, 100%)`,
    margin: "0 auto",
    padding: `0 24px ${scaledSpace(64)}`,
})

/**
 * With a media caption the copy keeps to the left of the frame and the
 * caption takes the lower right — the title card and its slug. Narrow
 * screens stack the caption under the copy.
 */
export const fullBleedInnerCaptioned = style({
    display: "grid",
    gridTemplateColumns: "minmax(0, 7fr) minmax(0, 4fr)",
    gap: scaledSpace(40),
    alignItems: "end",
    "@media": {
        "(max-width: 860px)": { gridTemplateColumns: "1fr", gap: scaledSpace(28) },
    },
})

export const fullBleedCredit = style({
    fontSize: 12.5,
    fontWeight: 500,
    letterSpacing: "0.24em",
    textTransform: "uppercase",
    lineHeight: 1.7,
    color: "rgba(255, 255, 255, 0.8)",
    margin: `${scaledSpace(26)} 0 0`,
})

/** The copy column over the photograph (badge, headline, credit, subheadline, asks). */
export const fullBleedCopy = style({})

export const fullBleedCaption = style({
    fontFamily: captionFontStack,
    fontSize: 12,
    lineHeight: 1.6,
    letterSpacing: "0.02em",
    color: "rgba(255, 255, 255, 0.72)",
    margin: 0,
    justifySelf: "end",
    textAlign: "right",
    maxWidth: 320,
    "@media": {
        "(max-width: 860px)": { justifySelf: "start", textAlign: "left" },
    },
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

/**
 * The captioned title card: with the caption holding the right of the
 * frame, the headline takes the left column at statement scale and breaks
 * onto two lines — the film title, not a banner.
 */
export const fullBleedHeadlineCaptioned = style({
    fontSize: `calc(clamp(40px, 7.5vw, 78px) * ${marketing.display.scale})`,
    lineHeight: 1,
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

/*
 * `front-page`: a daily's lead story. The masthead bar is accent ink with
 * on-accent type; column rules and the caption line are the register's
 * line color at hairline and heavy weights — no cards, no shadows. The
 * headline honors authored line breaks (the copy desk sets the wood).
 */
export const frontPage = style([
    heroBase,
    {
        padding: `${scaledSpace(20)} 0 ${scaledSpace(8)}`,
    },
])

export const frontBar = style({
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
    gridTemplateAreas: '"dateline masthead issue"',
    alignItems: "center",
    gap: 18,
    background: marketing.color.accent,
    color: marketing.color.onAccent,
    fontFamily: marketing.font.display,
    fontWeight: marketing.display.weight,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    fontSize: 14,
    lineHeight: 1.15,
    padding: "10px 18px",
    "@media": {
        // Phones: the nameplate takes the whole top row, the ears share
        // the row under it.
        "(max-width: 720px)": {
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gridTemplateAreas: '"masthead masthead" "dateline issue"',
            gap: "6px 12px",
            fontSize: 11,
            padding: "10px 12px 8px",
        },
    },
})

export const frontBarDateline = style({
    gridArea: "dateline",
    display: "flex",
    flexWrap: "wrap",
    gap: "2px 8px",
    alignItems: "center",
    minWidth: 0,
})

export const frontBarStar = style({
    "@media": {
        "(max-width: 720px)": { display: "none" },
    },
})

export const frontBarMasthead = style({
    gridArea: "masthead",
    // The nameplate: the paper's name at flag scale.
    fontSize: "clamp(34px, 5.6vw, 88px)",
    lineHeight: 0.9,
    letterSpacing: "0.01em",
    textAlign: "center",
    whiteSpace: "nowrap",
    "@media": {
        "(max-width: 720px)": { fontSize: "clamp(34px, 11vw, 52px)" },
    },
})

export const frontBarIssue = style({
    gridArea: "issue",
    textAlign: "right",
    minWidth: 0,
})

const frontGridBase = style({
    display: "grid",
    gap: scaledSpace(28),
    paddingTop: scaledSpace(22),
    borderTop: `3px solid ${marketing.color.text}`,
    marginTop: 4,
})

export const frontGrid = style([
    frontGridBase,
    {
        gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 1fr)",
        "@media": {
            "(max-width: 900px)": { gridTemplateColumns: "1fr" },
        },
    },
])

export const frontGridSolo = style([frontGridBase, { gridTemplateColumns: "1fr" }])

export const frontCopy = style({
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
})

export const frontKicker = style({
    alignSelf: "flex-start",
    fontFamily: marketing.font.display,
    fontWeight: marketing.display.weight,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontSize: 14,
    color: marketing.color.pageBg,
    background: marketing.color.text,
    padding: "4px 8px 3px",
    marginBottom: scaledSpace(14),
})

export const frontHeadline = style([
    headline,
    {
        fontSize: `calc(clamp(38px, 5.1vw, 68px) * ${marketing.display.scale})`,
        lineHeight: 0.92,
        letterSpacing: marketing.display.tracking,
        whiteSpace: "pre-line",
        textWrap: "balance",
    },
])

export const frontDeckRow = style({
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: scaledSpace(22),
    alignItems: "end",
    marginTop: scaledSpace(22),
    paddingTop: scaledSpace(16),
    borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    "@media": {
        "(max-width: 560px)": { gridTemplateColumns: "1fr" },
    },
})

export const frontDeck = style({
    fontFamily: marketing.font.display,
    fontWeight: marketing.display.weight,
    textTransform: marketing.display.transform as "none",
    letterSpacing: "0.01em",
    fontSize: "clamp(20px, 2.1vw, 28px)",
    lineHeight: 1.08,
    color: marketing.color.text,
    margin: 0,
})

export const frontByline = style({
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontFamily: marketing.font.body,
})

export const frontBylineMug = style([
    halftonePlate,
    {
        display: "block",
        width: 76,
        height: 76,
        flex: "0 0 auto",
        border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    },
])

export const frontBylineImg = style({
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
})

export const frontBylineName = style({
    display: "block",
    fontSize: 15,
    fontWeight: 700,
    color: marketing.color.text,
    whiteSpace: "nowrap",
})

export const frontBylineRole = style({
    display: "block",
    fontSize: 13,
    fontStyle: "italic",
    color: marketing.color.subtle,
    whiteSpace: "nowrap",
})

export const frontPhoto = style([
    halftonePlate,
    {
        minHeight: 340,
        border: `${marketing.shape.borderWidth} solid ${marketing.color.text}`,
        background: marketing.color.text,
        "@media": {
            "(max-width: 900px)": { minHeight: 0, aspectRatio: "4 / 3" },
        },
    },
])

export const frontPhotoImg = style({
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
})

export const frontCaptionRow = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginTop: scaledSpace(16),
    padding: "10px 0",
    borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderBottom: `3px solid ${marketing.color.text}`,
    "@media": {
        "(max-width: 720px)": { flexDirection: "column", alignItems: "flex-start", gap: 10 },
    },
})

export const frontCaption = style({
    fontFamily: marketing.font.body,
    fontSize: 14,
    lineHeight: 1.45,
    color: marketing.color.text,
    margin: 0,
})

export const frontJump = style({
    flex: "0 0 auto",
    fontFamily: marketing.font.display,
    fontWeight: marketing.display.weight,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    fontSize: 14,
    color: marketing.color.text,
    textDecoration: "none",
    border: `${marketing.shape.borderWidth} solid ${marketing.color.text}`,
    padding: "5px 10px 4px",
    selectors: {
        "&:hover": { background: marketing.color.text, color: marketing.color.pageBg },
    },
})

/*
 * `sport` (gameday) over the full-bleed photograph: the campaign one-sheet.
 * A shorter frame so the next section's first row reads in the same view
 * (the drop sells the product under the hero, not a scroll later); a left
 * grade for the white block type and a foot that dissolves into the
 * page's striped ground; the badge a tilted accent signature in the top
 * corner; the credit a tracked strap line under an accent swipe.
 */
globalStyle(`[data-marketing-treatment~="sport"] ${fullBleed}`, {
    minHeight: "clamp(520px, 64svh, 610px)",
    "@media": {
        // Stacked copy outgrows the short frame on phones; the frame follows it.
        "(max-width: 860px)": { height: "auto", minHeight: 560, paddingTop: scaledSpace(40) },
    },
})

globalStyle(`[data-marketing-treatment~="sport"] ${fullBleedImg}`, { objectPosition: "center 42%" })

globalStyle(`[data-marketing-treatment~="sport"] ${fullBleedScrim}`, {
    background:
        "linear-gradient(90deg, rgba(3, 20, 9, 0.74) 0%, rgba(3, 20, 9, 0.46) 34%, rgba(3, 20, 9, 0) 60%), " +
        `linear-gradient(180deg, rgba(3, 20, 9, 0.2) 0%, transparent 22%, transparent 72%, ${marketing.color.pageBg} 100%)`,
    "@media": {
        "(max-width: 860px)": {
            background: `linear-gradient(180deg, rgba(3, 20, 9, 0.3) 0%, rgba(3, 20, 9, 0.62) 42%, ${marketing.color.pageBg} 100%)`,
        },
    },
})

/** `split-media`'s credit line: tracked caps closing the copy column, under the asks. */
export const splitCredit = style({
    fontSize: 12.5,
    fontWeight: 600,
    letterSpacing: "0.24em",
    textTransform: "uppercase",
    lineHeight: 1.7,
    color: marketing.color.subtle,
    margin: `${scaledSpace(26)} 0 0`,
})

/** `split-media`'s copy column (registers regrid the hero through it). */
export const splitCopy = style({ minWidth: 0 })

/** `split-media`'s caption under the visual. */
export const splitCaption = style({
    gridColumn: "2",
    margin: `calc(${scaledSpace(-28)}) 0 0`,
    fontSize: 14,
    lineHeight: 1.5,
    fontStyle: "italic",
    whiteSpace: "pre-line",
    color: marketing.color.subtle,
    "@media": {
        "(max-width: 860px)": { gridColumn: "1", margin: `calc(${scaledSpace(-16)}) 0 0` },
    },
})

/*
 * The `directory` aside: the few load-bearing facts in the copy column. The
 * plain reading is a ruled list — label strong, note quiet, an icon in a
 * soft disc — that every register can wear; treatments restyle it into a
 * sign directory, a tracklist, a wall label, a sticker sheet.
 */
export const directory = style({
    margin: `${scaledSpace(26)} 0 ${scaledSpace(6)}`,
    maxWidth: 520,
})

export const directoryTitle = style({
    margin: 0,
    fontFamily: marketing.font.display,
    fontWeight: marketing.display.weight,
    fontSize: 18,
    color: marketing.color.text,
})

export const directoryLine = style({
    margin: "4px 0 0",
    fontSize: 15,
    color: marketing.color.subtle,
})

export const directoryList = style({
    listStyle: "none",
    margin: `${scaledSpace(12)} 0 0`,
    padding: 0,
    borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
})

export const directoryItem = style({
    borderBottom: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
})

const directoryRow = {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "12px 0",
} as const

export const directoryLink = style({
    ...directoryRow,
    color: "inherit",
    textDecoration: "none",
    ":hover": { color: marketing.color.accent },
})

export const directoryEntry = style(directoryRow)

export const directoryIcon = style({
    flex: "none",
    display: "inline-grid",
    placeItems: "center",
    width: 38,
    height: 38,
    borderRadius: "50%",
    color: marketing.color.accent,
    background: marketing.color.accentSoft,
})

export const directoryText = style({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    columnGap: 10,
    rowGap: 2,
    minWidth: 0,
})

export const directoryLabel = style({
    fontWeight: 700,
    fontSize: 16,
    color: marketing.color.text,
})

export const directoryNote = style({
    fontSize: 14.5,
    color: marketing.color.subtle,
})

/*
 * `two-ink` (riso): the full-bleed hero becomes a trimmed poster print —
 * inset from the page edges with eased corners, a landscape sheet rather
 * than a viewport, the photograph separated into the two drums (the page
 * filter) under a flood of the warm ink from the top left. The headline is
 * set like wood type over the print: paper-colored caps, huge and tight,
 * a hair of dark-drum misregistration behind them. The media caption is
 * struck as a round rubber stamp in the top right corner.
 */
const PEAR_MASK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 44'%3E%3Cellipse cx='20' cy='30' rx='10' ry='13'/%3E%3Cellipse cx='9' cy='12' rx='6' ry='9' transform='rotate(-20 9 12)'/%3E%3Cellipse cx='31' cy='12' rx='6' ry='8.5' transform='rotate(20 31 12)'/%3E%3C/svg%3E")`

globalStyle(`${TWO_INK_ROOT} ${fullBleed}`, {
    width: "calc(100vw - 40px)",
    marginLeft: "calc(50% - 50vw + 20px)",
    minHeight: "clamp(360px, 34vw, 580px)",
    borderRadius: 14,
    alignItems: "stretch",
    background: spot2,
    "@media": {
        "(max-width: 720px)": {
            width: "calc(100vw - 24px)",
            marginLeft: "calc(50% - 50vw + 12px)",
            height: "auto",
            minHeight: 500,
            borderRadius: 10,
        },
    },
})

globalStyle(`[data-marketing-treatment~="sport"] ${fullBleedInner}`, {
    paddingBottom: scaledSpace(56),
})

globalStyle(`[data-marketing-treatment~="sport"] ${fullBleedHeadline}`, {
    fontSize: "clamp(54px, 8vw, 118px)",
    lineHeight: 0.88,
    letterSpacing: "0.002em",
    maxWidth: "6.4em",
    textShadow: "0 2px 22px rgba(0, 0, 0, 0.32)",
})

globalStyle(`[data-marketing-treatment~="sport"] ${fullBleedBadge}`, {
    position: "absolute",
    right: 24,
    bottom: "calc(100% - 24px)",
    fontFamily: marketing.font.display,
    fontStyle: "italic",
    fontWeight: 800,
    fontSize: "clamp(24px, 2.6vw, 34px)",
    letterSpacing: "0.02em",
    lineHeight: 0.95,
    color: marketing.color.accent,
    maxWidth: "6em",
    textAlign: "center",
    transform: "rotate(-8deg)",
    paddingBottom: 10,
    marginBottom: 0,
    borderBottom: `4px solid ${marketing.color.accent}`,
    textShadow: "0 2px 14px rgba(0, 0, 0, 0.35)",
    "@media": {
        "(max-width: 860px)": {
            position: "static",
            display: "inline-block",
            fontSize: 22,
            marginBottom: scaledSpace(18),
            transform: "rotate(-4deg)",
        },
    },
})

globalStyle(`[data-marketing-treatment~="sport"] ${fullBleedCredit}`, {
    position: "relative",
    fontFamily: marketing.font.display,
    fontSize: "clamp(17px, 1.6vw, 21px)",
    fontWeight: 800,
    letterSpacing: "0.08em",
    color: "#ffffff", // theme-exempt: copy over a photographic scrim is white in every theme
    paddingTop: 22,
    margin: `${scaledSpace(20)} 0 0`,
})

// The swipe: a slanted accent stroke under the headline, over the strap line.
globalStyle(`[data-marketing-treatment~="sport"] ${fullBleedCredit}::before`, {
    content: '""',
    position: "absolute",
    left: 0,
    top: 0,
    width: "min(300px, 60%)",
    height: 7,
    background: `linear-gradient(90deg, ${marketing.color.accent} 70%, transparent)`,
    transform: "skewX(-24deg)",
    transformOrigin: "left",
})

globalStyle(`[data-marketing-treatment~="sport"] ${fullBleedSubheadline}`, {
    fontSize: 17,
    maxWidth: 520,
    color: "rgba(255, 255, 255, 0.86)",
})

globalStyle(`[data-marketing-treatment~="sport"] ${fullBleedSecondary}`, {
    borderColor: "rgba(255, 255, 255, 0.8)",
})

globalStyle(`[data-marketing-treatment~="sport"] ${headline}`, {
    lineHeight: 0.9,
})

/*
 * `pulp` (creature) over the painted frame: the creature-feature one-sheet.
 * The title in poster cream, tipped and extruded, its accent word dropped
 * onto its own line at a larger size; the badge a spot-ink starburst
 * slapped on the art's corner; the credit the billing block — a full-width
 * band across the frame's foot, always last in the stack.
 */
const POSTER_CREAM = "#f6ecd2" // theme-exempt: poster cream on the painted night, in every appearance

globalStyle(`[data-marketing-treatment~="pulp"] ${fullBleed}`, {
    minHeight: "max(620px, min(88svh, 820px))",
    background: "#070b1c", // theme-exempt: the painted night under the frame before it loads
})

globalStyle(`[data-marketing-treatment~="pulp"] ${fullBleedImg}`, { objectPosition: "62% center" })

globalStyle(`[data-marketing-treatment~="pulp"] ${fullBleedScrim}`, {
    // A press dot screen over the paint, then the grades that carry the type.
    background:
        "radial-gradient(rgba(4, 8, 24, 0.34) 0.9px, transparent 1.4px) 0 0 / 4px 4px, " +
        "linear-gradient(90deg, rgba(5, 9, 26, 0.72) 0%, rgba(5, 9, 26, 0.38) 36%, rgba(5, 9, 26, 0) 58%), " +
        "linear-gradient(180deg, rgba(5, 9, 26, 0.35) 0%, transparent 20%, transparent 60%, rgba(5, 9, 26, 0.7) 100%)",
})

globalStyle(`[data-marketing-treatment~="pulp"] ${fullBleedInner}`, {
    paddingBottom: 0,
})

globalStyle(`[data-marketing-treatment~="pulp"] ${fullBleedCopy}`, {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
})

// Every page's headline is poster lettering: extruded in the accent, its
// accent word extruded in cream so the orange keeps its edge.
globalStyle(`[data-marketing-treatment~="pulp"] ${headline}`, {
    lineHeight: 0.95,
    letterSpacing: "0.02em",
    textShadow: pulpExtrude(5),
})

globalStyle(`[data-marketing-treatment~="pulp"] ${headline} ${accentWord}`, {
    textShadow:
        `1px 1px 0 ${POSTER_CREAM}, 2px 2px 0 ${POSTER_CREAM}, 3px 3px 0 ${POSTER_CREAM}, ` +
        "6px 7px 0 rgba(3, 6, 18, 0.9)",
})

globalStyle(`[data-marketing-treatment~="pulp"] ${mastheadHeadline}`, {
    color: POSTER_CREAM,
    fontSize: "clamp(58px, 8.8vw, 132px)",
    lineHeight: 0.9,
    letterSpacing: "0.015em",
    maxWidth: "6.6em",
    transform: "rotate(-3deg)",
    transformOrigin: "left bottom",
    textShadow: pulpExtrude(6),
})

globalStyle(`[data-marketing-treatment~="pulp"] ${mastheadHeadline} ${accentWord}`, {
    display: "block",
    fontSize: "1.32em",
    lineHeight: 0.92,
    color: marketing.color.accent,
    textShadow:
        `1px 1px 0 ${POSTER_CREAM}, 2px 2px 0 ${POSTER_CREAM}, 3px 3px 0 ${POSTER_CREAM}, ` +
        "6px 7px 0 rgba(3, 6, 18, 0.9)",
})

const pulpBurst =
    "polygon(50% 0%, 57.8% 13.8%, 72.4% 6.9%, 73.8% 22.6%, 89.5% 21.5%, 84.2% 36.4%, 99.5% 40.2%, " +
    "88.3% 50%, 99.5% 59.8%, 84.2% 63.6%, 89.5% 78.5%, 73.8% 77.4%, 72.4% 93.1%, 57.8% 86.2%, " +
    "50% 100%, 42.2% 86.2%, 27.6% 93.1%, 26.2% 77.4%, 10.5% 78.5%, 15.8% 63.6%, 0.5% 59.8%, " +
    "11.7% 50%, 0.5% 40.2%, 15.8% 36.4%, 10.5% 21.5%, 26.2% 22.6%, 27.6% 6.9%, 42.2% 13.8%)"

globalStyle(`[data-marketing-treatment~="pulp"] ${mastheadKicker}`, {
    position: "absolute",
    right: 24,
    top: -12,
    zIndex: 2,
    isolation: "isolate",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    width: 164,
    height: 164,
    padding: "0 30px",
    fontFamily: marketing.font.display,
    fontSize: 20,
    fontWeight: 400,
    lineHeight: 0.98,
    letterSpacing: "0.03em",
    color: "#0a1024", // theme-exempt: midnight ink on the acid starburst in every appearance
    transform: "rotate(-10deg)",
    marginBottom: 0,
    filter: "drop-shadow(5px 5px 0 rgba(3, 6, 18, 0.9))",
    "@media": {
        "(max-width: 860px)": {
            position: "relative",
            right: "auto",
            top: "auto",
            width: 124,
            height: 124,
            padding: "0 22px",
            fontSize: 15,
            marginBottom: 6,
        },
    },
})

globalStyle(`${TWO_INK_ROOT} ${fullBleedScrim}`, {
    background:
        `radial-gradient(70% 100% at 0% 0%, color-mix(in srgb, ${marketing.color.accent} 94%, transparent) 0%, ` +
        `color-mix(in srgb, ${marketing.color.accent} 72%, transparent) 36%, transparent 70%)`,
    mixBlendMode: "multiply",
})

globalStyle(`${TWO_INK_ROOT} ${fullBleedInner}`, {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    padding: `${scaledSpace(34)} 32px ${scaledSpace(34)}`,
    "@media": {
        "(max-width: 720px)": { padding: "26px 20px 28px" },
    },
})

globalStyle(`${TWO_INK_ROOT} ${fullBleedInner} > div:first-child`, {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    flex: 1,
})

globalStyle(`${TWO_INK_ROOT} ${fullBleedHeadline}`, {
    color: spot2,
    fontSize: "clamp(62px, 10.6vw, 176px)",
    lineHeight: 0.84,
    letterSpacing: "0.004em",
    maxWidth: "5.8em",
    textShadow: `0.026em 0.03em 0 color-mix(in srgb, ${spot1} 85%, transparent)`,
})

// The credit rides as a strip of dark-drum tape under the headline, so
// it holds over any part of the print.
globalStyle(`${TWO_INK_ROOT} ${fullBleedCredit}`, {
    fontFamily: marketing.font.display,
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: "0.16em",
    lineHeight: 1.3,
    color: spot2,
    background: spot1,
    padding: "6px 12px 5px",
    margin: `${scaledSpace(18)} 0 0`,
})

// A subheadline is paragraph copy over the multiplied print's brightest
// ink; it takes the credit's tape so it reads over any photograph.
globalStyle(`${TWO_INK_ROOT} ${fullBleedSubheadline}`, {
    color: spot2,
    background: `color-mix(in srgb, ${spot1} 90%, transparent)`,
    padding: "8px 12px 9px",
    maxWidth: "36em",
    margin: `${scaledSpace(18)} 0 0`,
})

globalStyle(`${TWO_INK_ROOT} ${fullBleedImg}`, {
    objectPosition: "50% 30%",
})

globalStyle(`${TWO_INK_ROOT} ${fullBleed} ${ctaRow}`, {
    marginTop: "auto",
    paddingTop: scaledSpace(22),
})

globalStyle(`${TWO_INK_ROOT} ${fullBleed} ${ctaPrimary}`, {
    background: spot2,
    color: spot1,
})

globalStyle(`${TWO_INK_ROOT} ${fullBleedCaption}`, {
    position: "absolute",
    top: 24,
    right: 28,
    width: 136,
    height: 136,
    maxWidth: "none",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: "0 20px",
    borderRadius: "50%",
    background: spot2,
    color: spot1,
    border: `3px solid ${spot1}`,
    boxShadow: `inset 0 0 0 5px ${spot2}, inset 0 0 0 6.5px ${spot1}`,
    fontFamily: marketing.font.display,
    fontSize: 17,
    fontWeight: 800,
    lineHeight: 0.95,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    textAlign: "center",
    transform: "rotate(-9deg)",
    "@media": {
        "(max-width: 720px)": {
            top: "auto",
            bottom: 22,
            right: 18,
            width: 104,
            height: 104,
            fontSize: 13,
            padding: "0 14px",
        },
    },
})

globalStyle(`[data-marketing-treatment~="pulp"] ${mastheadKicker}::before`, {
    content: '""',
    position: "absolute",
    inset: 0,
    zIndex: -1,
    background: spot1,
    clipPath: pulpBurst,
})

globalStyle(`[data-marketing-treatment~="pulp"] ${fullBleedSubheadline}`, {
    order: 3,
    fontSize: "clamp(18px, 1.6vw, 22px)",
    fontWeight: 700,
    fontStyle: "italic",
    lineHeight: 1.4,
    color: POSTER_CREAM,
    maxWidth: 600,
    margin: `${scaledSpace(30)} 0 0`,
    textShadow: "0 2px 12px rgba(3, 6, 18, 0.8)",
})

globalStyle(`[data-marketing-treatment~="pulp"] ${fullBleedCopy} > ${ctaRow}`, { order: 4 })

globalStyle(`[data-marketing-treatment~="pulp"] ${fullBleedSecondary}`, {
    color: POSTER_CREAM,
    borderColor: POSTER_CREAM,
    background: "rgba(5, 9, 26, 0.55)",
})

// The billing block: a full-bleed band pinned to the frame's foot.
globalStyle(`[data-marketing-treatment~="pulp"] ${fullBleedCredit}`, {
    order: 5,
    alignSelf: "stretch",
    width: "100vw",
    marginLeft: "calc(50% - 50vw)",
    marginTop: scaledSpace(34),
    marginBottom: 0,
    padding: "16px max(24px, calc(50vw - 576px)) 14px",
    fontFamily: marketing.font.display,
    fontSize: "clamp(17px, 1.9vw, 25px)",
    fontWeight: 400,
    letterSpacing: "0.07em",
    lineHeight: 1.2,
    color: POSTER_CREAM,
    background: "rgba(5, 9, 26, 0.9)",
    borderTop: `3px solid ${spot1}`,
    boxShadow: `inset 0 -5px 0 ${marketing.color.accent}`,
})

globalStyle(`${TWO_INK_ROOT} ${fullBleedCaption}::before`, {
    content: '""',
    width: 26,
    height: 28,
    flex: "none",
    background: spot1,
    maskImage: PEAR_MASK,
    maskSize: "contain",
    maskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskImage: PEAR_MASK,
    WebkitMaskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
})

/*
 * `colorblock` (paintchip): the split hero becomes two flat fields meeting
 * edge to edge — the copy on the page ground, the photograph bleeding off
 * the right edge and up to the nav with no frame, radius, or border. The
 * accent word keeps the ink color and wears a paint stripe; the live
 * badge is a flat square-dotted chip.
 */
globalStyle(`${COLORBLOCK_ROOT} ${split}`, {
    width: "100vw",
    marginLeft: "calc(50% - 50vw)",
    padding: 0,
    gridTemplateColumns: "minmax(0, 1fr) 50vw",
    gap: 0,
    alignItems: "stretch",
    minHeight: "clamp(420px, 38vw, 620px)",
    borderBottom: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    "@media": {
        "(max-width: 860px)": { gridTemplateColumns: "1fr", minHeight: 0 },
    },
})

globalStyle(`${COLORBLOCK_ROOT} ${split} > div:first-child`, {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: `${scaledSpace(30)} ${scaledSpace(40)} ${scaledSpace(30)} calc((100vw - min(${marketing.layout.maxWidth}, 100vw)) / 2 + 24px)`,
    "@media": {
        "(max-width: 860px)": { padding: "28px 20px 32px" },
    },
})

globalStyle(`${COLORBLOCK_ROOT} ${split} ${headline}`, {
    fontSize: "clamp(50px, 7.5vw, 124px)",
    lineHeight: 0.88,
    letterSpacing: "-0.035em",
    wordSpacing: "0.08em",
})

globalStyle(`${COLORBLOCK_ROOT} ${accentWord}`, {
    color: marketing.color.text,
    backgroundImage: `linear-gradient(${marketing.color.accent}, ${marketing.color.accent})`,
    backgroundSize: "100% 0.14em",
    backgroundPosition: "0 96%",
    backgroundRepeat: "no-repeat",
})

globalStyle(`${COLORBLOCK_ROOT} ${split} ${subheadline}`, {
    fontSize: 16.5,
    lineHeight: 1.5,
    maxWidth: 440,
    margin: `${scaledSpace(18)} 0 0`,
})

globalStyle(`${COLORBLOCK_ROOT} ${split} ${ctaRow}`, {
    alignItems: "center",
    marginTop: scaledSpace(24),
    gap: "12px 18px",
})

globalStyle(`${COLORBLOCK_ROOT} ${split} ${ctaPrimary}`, {
    fontSize: 13,
    letterSpacing: "0.12em",
    padding: "15px 22px",
})

// The call is the quieter ask: an underlined ink link beside the chip.
globalStyle(`${COLORBLOCK_ROOT} ${split} ${ctaSecondary}`, {
    padding: "8px 2px",
    background: "none",
    border: "none",
    boxShadow: "none",
    textDecoration: "underline",
    textDecorationThickness: 2,
    textUnderlineOffset: 5,
})

globalStyle(`${COLORBLOCK_ROOT} ${split} ${ctaSecondary}:hover`, {
    transform: "none",
    textDecorationColor: marketing.color.accent,
})

globalStyle(`${COLORBLOCK_ROOT} ${split} ${splitCredit}`, {
    color: marketing.color.text,
    fontWeight: 700,
    margin: `${scaledSpace(20)} 0 0`,
})

globalStyle(`${COLORBLOCK_ROOT} ${split} ${media}`, {
    marginTop: 0,
    height: "100%",
    minHeight: 320,
})

globalStyle(`${COLORBLOCK_ROOT} ${split} ${media} img`, {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: 0,
    border: "none",
})

globalStyle(`${COLORBLOCK_ROOT} ${badgeLive}`, {
    gap: 9,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    borderRadius: 0,
    boxShadow: "none",
    padding: "7px 12px 7px 10px",
})

globalStyle(`${COLORBLOCK_ROOT} ${badgeLiveDot}`, {
    width: 9,
    height: 9,
    borderRadius: 0,
    animation: "none",
})

globalStyle(`${COLORBLOCK_ROOT} ${badge}`, {
    display: "inline-flex",
    alignItems: "center",
    gap: 9,
    fontSize: 11.5,
    fontWeight: 800,
    letterSpacing: "0.18em",
    color: marketing.color.text,
    background: marketing.color.surface,
    borderRadius: 0,
    padding: "6px 11px",
    marginBottom: scaledSpace(18),
})

globalStyle(`${COLORBLOCK_ROOT} ${badge}::before`, {
    content: '""',
    width: 9,
    height: 9,
    flex: "none",
    background: marketing.color.accent,
})

/*
 * The hero's stamped furniture: the `seal` roundel, the `readout` figure,
 * and the `price-board` aside. Each has a plain reading in the register's
 * tokens; the signpaint / linework / sunburst treatments re-letter them.
 */

const SIGNPAINT_ROOT = '[data-marketing-treatment~="signpaint"]'
const LINEWORK_ROOT = '[data-marketing-treatment~="linework"]'
const SUNBURST_ROOT = '[data-marketing-treatment~="sunburst"]'

/** Sign-writer's cream over a photograph: constant in every appearance. */
const SIGN_CREAM = "#fff3d9" // theme-exempt: painted letters over a photograph read cream in every theme
/** The outline ink: the second spot pressed toward black. */
const SIGN_INK = `color-mix(in srgb, ${spot2} 36%, black)`

/**
 * The torn foot of a pasted-up print: a ragged 240px tile repeated along
 * the photograph's bottom edge through a mask.
 */
const TORN_EDGE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='22' viewBox='0 0 240 22' preserveAspectRatio='none'%3E%3Cpath d='M0 0 H240 V9 L228 14 L214 8 L201 15 L188 10 L171 17 L158 9 L143 13 L130 7 L116 15 L101 10 L88 16 L72 8 L60 13 L45 9 L31 16 L17 10 L0 12 Z' fill='black'/%3E%3C/svg%3E")`

export const seal = style({
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: 150,
    height: 150,
    padding: 16,
    borderRadius: "50%",
    textAlign: "center",
    color: marketing.color.onAccent,
    background: marketing.color.accent,
    boxShadow: marketing.shape.shadowCard,
    transform: "rotate(-8deg)",
    selectors: {
        // The painted roundel: a cream disc, a double ink ring, red letters.
        [SIGNPAINT]: {
            width: 172,
            height: 172,
            color: marketing.color.accent,
            background: SIGN_CREAM,
            border: `4px solid ${SIGN_INK}`,
            outline: `2px solid ${SIGN_INK}`,
            outlineOffset: -13,
            boxShadow: `5px 6px 0 ${SIGN_INK}`,
        },
        [LINEWORK]: {
            color: marketing.color.accent,
            background: "transparent",
            border: `1.5px solid ${marketing.color.accent}`,
            boxShadow: `0 0 24px color-mix(in srgb, ${marketing.color.accent} 40%, transparent)`,
            transform: "none",
        },
    },
    "@media": {
        "(max-width: 860px)": { width: 118, height: 118, padding: 12 },
    },
})

export const sealTop = style({
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    lineHeight: 1.1,
    selectors: {
        [SIGNPAINT]: {
            fontFamily: scriptFont,
            fontSize: 25,
            fontWeight: 400,
            letterSpacing: 0,
            textTransform: "none",
            color: SIGN_INK,
        },
    },
})

export const sealMain = style({
    fontFamily: marketing.font.display,
    fontWeight: marketing.display.weight,
    fontSize: 40,
    lineHeight: 1,
    letterSpacing: marketing.display.tracking,
    selectors: {
        [SIGNPAINT]: { fontSize: 50, marginTop: 2 },
        // The sign-writer's star under the big line.
        [`${SIGNPAINT}::after`]: {
            content: '"★"',
            display: "block",
            fontSize: 18,
            lineHeight: 1.2,
            color: SIGN_INK,
        },
    },
    "@media": {
        "(max-width: 860px)": { fontSize: 32 },
    },
})

/** Full-bleed: the seal hangs in the photograph's upper left, on the page column's edge. */
export const fullBleedSealSlot = style({
    position: "absolute",
    zIndex: 2,
    top: scaledSpace(36),
    left: `max(24px, calc((100vw - ${marketing.layout.maxWidth}) / 2 + 24px))`,
    "@media": {
        "(max-width: 860px)": { top: 18, left: "auto", right: 16 },
    },
})

/** Split: the seal pins to the media's top corner; stacked, it sits in the flow. */
export const splitSealSlot = style({
    position: "absolute",
    zIndex: 2,
    top: scaledSpace(40),
    right: -12,
    "@media": {
        "(max-width: 1219px)": { right: 0 },
        "(max-width: 860px)": { position: "static", justifySelf: "start" },
    },
})

export const readout = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    margin: `0 0 ${scaledSpace(18)}`,
    selectors: {
        [SUNBURST]: { isolation: "isolate", marginBottom: scaledSpace(14) },
    },
})

export const readoutValue = style({
    fontFamily: marketing.font.display,
    fontWeight: marketing.display.weight,
    fontSize: `calc(clamp(96px, 15vw, 212px) * ${marketing.display.scale})`,
    lineHeight: 0.82,
    letterSpacing: "-0.035em",
    color: marketing.color.accent,
    selectors: {
        // Seventies stacked type: the figure in the accent with a
        // terracotta and an ink shadow stepped out behind it, standing in
        // front of the register's rising sun.
        [SUNBURST]: {
            position: "relative",
            fontSize: `calc(clamp(80px, 10vw, 150px) * ${marketing.display.scale})`,
            textShadow:
                `0.035em 0.035em 0 color-mix(in srgb, ${marketing.color.accent} 42%, ${marketing.color.pageBg}), ` +
                `0.07em 0.07em 0 ${marketing.color.text}`,
            padding: "0.56em 0.16em 0 0.1em",
        },
        // The whole half-sun rises behind the figure from a horizon ruled
        // along its baseline — the register's ornament, sized to the
        // figure so it stays inside the column at every width.
        [`${SUNBURST}::before`]: {
            content: '""',
            position: "absolute",
            zIndex: -1,
            left: 0,
            bottom: "0.02em",
            width: "2.3em",
            aspectRatio: "800 / 420",
            backgroundImage: "var(--marketing-ornament, none)",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center bottom",
        },
        [`${SUNBURST}::after`]: {
            content: '""',
            position: "absolute",
            zIndex: -1,
            left: 0,
            right: 0,
            bottom: "0.02em",
            height: 3,
            borderRadius: 2,
            background: marketing.color.text,
        },
        [LINEWORK]: {
            fontFamily: captionFontStack,
            fontWeight: 500,
            letterSpacing: "-0.04em",
            textShadow: `0 0 28px color-mix(in srgb, ${marketing.color.accent} 55%, transparent)`,
        },
    },
})

export const readoutNote = style({
    position: "relative",
    fontFamily: scriptFont,
    fontSize: "clamp(36px, 4.6vw, 64px)",
    lineHeight: 1,
    color: spot2,
    margin: "-0.18em 0 0 0.5em",
    transform: "rotate(-5deg)",
    transformOrigin: "left center",
    whiteSpace: "nowrap",
    selectors: {
        [SUNBURST]: {
            fontSize: "clamp(40px, 4.6vw, 64px)",
            margin: "0.3em 0 0 0.9em",
            transform: "rotate(-3deg)",
            textShadow: `0.025em 0.03em 0 color-mix(in srgb, ${marketing.color.text} 60%, transparent)`,
        },
        // The swash under the script: one long brushed stroke.
        "&::after": {
            content: '""',
            position: "absolute",
            left: "-0.3em",
            right: "-1.4em",
            bottom: "-0.12em",
            height: "0.22em",
            background: "currentColor",
            WebkitMaskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 20' preserveAspectRatio='none'%3E%3Cpath d='M2 14 C 70 20, 150 4, 298 6' fill='none' stroke='black' stroke-width='3.2' stroke-linecap='round'/%3E%3C/svg%3E")`,
            maskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 20' preserveAspectRatio='none'%3E%3Cpath d='M2 14 C 70 20, 150 4, 298 6' fill='none' stroke='black' stroke-width='3.2' stroke-linecap='round'/%3E%3C/svg%3E")`,
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
        },
    },
})

export const priceBoard = style({
    width: "100%",
    maxWidth: 380,
    textAlign: "left",
    color: marketing.color.text,
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    padding: "20px 22px 18px",
    selectors: {
        // The menu board: cream enamel, a double ink frame cut by hand,
        // the hard painted shade.
        [SIGNPAINT]: {
            color: SIGN_INK,
            background: SIGN_CREAM,
            borderColor: SIGN_INK,
            borderRadius: handCutRadius,
            outline: `1.5px solid ${SIGN_INK}`,
            outlineOffset: -10,
            boxShadow: `6px 7px 0 ${SIGN_INK}`,
            padding: "22px 28px 20px",
        },
    },
})

export const priceBoardTitle = style({
    fontFamily: marketing.font.display,
    fontWeight: marketing.display.weight,
    fontSize: 22,
    lineHeight: 1.1,
    textAlign: "center",
    color: marketing.color.accent,
    margin: "0 0 12px",
    selectors: {
        [SIGNPAINT]: {
            fontFamily: scriptFont,
            fontWeight: 400,
            fontSize: 32,
            textTransform: "none",
        },
        [`${SIGNPAINT}::before, ${SIGNPAINT}::after`]: {
            content: '""',
            display: "inline-block",
            verticalAlign: "middle",
            width: 22,
            height: 4,
            borderRadius: "3px 1px 3px 1px",
            background: "currentColor",
        },
        [`${SIGNPAINT}::before`]: { marginRight: 10, transform: "rotate(-9deg)" },
        [`${SIGNPAINT}::after`]: { marginLeft: 10, transform: "rotate(9deg)" },
    },
})

export const priceBoardLines = style({
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "grid",
    gap: 7,
})

export const priceBoardLine = style({
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    selectors: {
        [`${SIGNPAINT}::before`]: {
            content: '"•"',
            color: marketing.color.accent,
            fontSize: 20,
            lineHeight: 1,
        },
    },
})

export const priceBoardName = style({
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    selectors: {
        [SIGNPAINT]: {
            fontFamily: marketing.font.display,
            fontWeight: marketing.display.weight,
            fontSize: 19,
            letterSpacing: "0.03em",
        },
    },
})

export const priceBoardLeader = style({
    flex: 1,
    minWidth: 16,
    borderBottom: `2px dotted color-mix(in srgb, currentColor 45%, transparent)`,
    transform: "translateY(-5px)",
})

export const priceBoardPrice = style({
    fontFamily: marketing.font.display,
    fontWeight: marketing.display.weight,
    fontSize: 24,
    lineHeight: 1,
    whiteSpace: "nowrap",
    selectors: {
        [SIGNPAINT]: { fontSize: 27 },
    },
})

export const priceBoardQualifier = style({
    fontFamily: marketing.font.body,
    fontSize: 12,
    fontWeight: 600,
    textTransform: "none",
    color: marketing.color.subtle,
    selectors: {
        [SIGNPAINT]: { color: "inherit" },
    },
})

export const priceBoardFootnote = style({
    fontSize: 13.5,
    lineHeight: 1.45,
    textAlign: "center",
    color: marketing.color.subtle,
    margin: "14px 0 0",
    selectors: {
        [SIGNPAINT]: { color: "inherit", fontWeight: 600 },
    },
})

export const priceBoardCta = style([
    ctaPrimary,
    {
        display: "block",
        textAlign: "center",
        marginTop: 14,
    },
])

/*
 * Full-bleed with a price board: the copy keeps the page column's left
 * edge, the board stands near the viewport's right edge over the
 * photograph. Narrow screens stack the board under the copy and let the
 * hero grow past its fixed height instead of clipping either.
 */
export const fullBleedBoarded = style({
    "@media": {
        "(max-width: 860px)": { height: "auto", minHeight: "92svh", maxHeight: "none" },
    },
})

export const fullBleedInnerBoarded = style({
    width: "100%",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(290px, 340px)",
    gap: scaledSpace(40),
    alignItems: "end",
    paddingLeft: `max(24px, calc((100vw - ${marketing.layout.maxWidth}) / 2 + 24px))`,
    paddingRight: "clamp(20px, 3vw, 48px)",
    "@media": {
        "(max-width: 860px)": {
            gridTemplateColumns: "1fr",
            gap: scaledSpace(28),
            paddingTop: 150,
        },
    },
})

/** The intake card in the board's slot: square to the frame, lifted off the foot. */
export const fullBleedIntake = style({
    justifySelf: "end",
    marginBottom: scaledSpace(8),
    "@media": {
        "(max-width: 860px)": { justifySelf: "stretch", maxWidth: "none" },
    },
})

export const fullBleedBoard = style({
    justifySelf: "end",
    transform: "rotate(1.2deg)",
    "@media": {
        "(max-width: 860px)": { justifySelf: "stretch", maxWidth: "none", transform: "none" },
    },
})

// ---------------------------------------------------------- signpaint hero

// The painted headline over the photograph: cream letters with an ink
// outline and a sunset drop shade; the accent word brushed in script.
globalStyle(`${SIGNPAINT_ROOT} ${fullBleedHeadline}`, {
    color: SIGN_CREAM,
    fontSize: `calc(clamp(40px, 6vw, 86px) * ${marketing.display.scale})`,
    lineHeight: 1.02,
    // A sign-writer's measure: short painted lines, stacked.
    maxWidth: "6.6em",
    WebkitTextStroke: `0.11em ${SIGN_INK}`,
    paintOrder: "stroke fill",
    // The drop shade in the sunset ink, edged in the outline ink.
    textShadow: `0.07em 0.075em 0 ${spot1}, 0.1em 0.11em 0 ${SIGN_INK}`,
})

globalStyle(`${SIGNPAINT_ROOT} ${accentWord}`, {
    display: "inline-block",
    fontFamily: scriptFont,
    textTransform: "none",
    letterSpacing: 0,
    transform: "rotate(-4deg)",
    paddingRight: "0.08em",
})

globalStyle(`${SIGNPAINT_ROOT} ${fullBleedHeadline} ${accentWord}`, {
    color: spot1,
    fontSize: "1.14em",
    WebkitTextStroke: `0.09em ${SIGN_INK}`,
    textShadow: `0.05em 0.06em 0 ${SIGN_CREAM}, 0.075em 0.085em 0 ${SIGN_INK}`,
})

// Off the photograph, the lettering keeps its shade on the board ground.
globalStyle(`${SIGNPAINT_ROOT} ${headline}:not(${fullBleedHeadline})`, {
    textShadow: `0.05em 0.055em 0 ${spot1}`,
})

globalStyle(`${SIGNPAINT_ROOT} ${fullBleedScrim}`, {
    background:
        "linear-gradient(90deg, rgba(24, 12, 44, 0.62) 0%, rgba(24, 12, 44, 0.22) 46%, rgba(24, 12, 44, 0) 66%), " +
        "linear-gradient(180deg, rgba(24, 12, 44, 0) 48%, rgba(24, 12, 44, 0.5) 100%)",
})

globalStyle(`${SIGNPAINT_ROOT} ${fullBleedSubheadline}`, {
    color: SIGN_CREAM,
    fontWeight: 500,
    fontSize: 19,
    maxWidth: 540,
    textShadow: "0 1px 3px rgba(0, 0, 0, 0.55)",
})

globalStyle(`${SIGNPAINT_ROOT} ${fullBleedBadge}`, {
    fontFamily: scriptFont,
    fontSize: 26,
    fontWeight: 400,
    letterSpacing: 0,
    textTransform: "none",
    color: SIGN_CREAM,
    textShadow: "0 1px 3px rgba(0, 0, 0, 0.55)",
})

// The print is pasted up and torn off at its foot.
globalStyle(`${SIGNPAINT_ROOT} ${fullBleed}`, {
    WebkitMaskImage: `linear-gradient(black, black), ${TORN_EDGE}`,
    maskImage: `linear-gradient(black, black), ${TORN_EDGE}`,
    WebkitMaskSize: "100% calc(100% - 21px), 240px 22px",
    maskSize: "100% calc(100% - 21px), 240px 22px",
    WebkitMaskPosition: "top left, bottom left",
    maskPosition: "top left, bottom left",
    WebkitMaskRepeat: "no-repeat, repeat-x",
    maskRepeat: "no-repeat, repeat-x",
})

// ---------------------------------------------------------- linework hero

// The flyer over the photograph: copy centered in the frame's height, a
// grade that leans in from the left and the foot, and the register's
// schematic drawn over the photograph under the copy.
globalStyle(`${LINEWORK_ROOT} ${fullBleed}`, {
    alignItems: "center",
})

globalStyle(`${LINEWORK_ROOT} ${fullBleedScrim}`, {
    background:
        "linear-gradient(90deg, rgba(4, 6, 9, 0.82) 0%, rgba(4, 6, 9, 0.4) 44%, rgba(4, 6, 9, 0) 68%), " +
        "linear-gradient(0deg, rgba(4, 6, 9, 0.8) 0%, rgba(4, 6, 9, 0) 34%)",
})

globalStyle(`${LINEWORK_ROOT} ${fullBleedScrim}::after`, {
    content: '""',
    position: "absolute",
    inset: 0,
    backgroundImage: "var(--marketing-ornament, none)",
    backgroundSize: "cover",
    backgroundPosition: "center bottom",
    backgroundRepeat: "no-repeat",
    opacity: 0.5,
    // The drawing stays off the copy: it runs full width along the top and
    // the foot, and only down the photograph's side between them.
    WebkitMaskImage:
        "linear-gradient(180deg, black 0 22%, transparent 27% 79%, black 85%), " +
        "linear-gradient(90deg, transparent 0 44%, black 54%)",
    maskImage:
        "linear-gradient(180deg, black 0 22%, transparent 27% 79%, black 85%), " +
        "linear-gradient(90deg, transparent 0 44%, black 54%)",
    "@media": {
        "(max-width: 860px)": {
            WebkitMaskImage: "linear-gradient(180deg, black 0 12%, transparent 18% 86%, black 92%)",
            maskImage: "linear-gradient(180deg, black 0 12%, transparent 18% 86%, black 92%)",
        },
    },
})

globalStyle(`${LINEWORK_ROOT} ${fullBleedHeadline}`, {
    fontSize: `calc(clamp(40px, 6.6vw, 100px) * ${marketing.display.scale})`,
    lineHeight: 0.98,
})

globalStyle(`${LINEWORK_ROOT} ${fullBleedHeadline} ${accentWord}`, {
    display: "block",
    textShadow: `0 0 34px color-mix(in srgb, ${marketing.color.accent} 45%, transparent)`,
})

globalStyle(`${LINEWORK_ROOT} ${fullBleedBadge}`, {
    fontFamily: captionFontStack,
    fontWeight: 500,
    letterSpacing: "0.26em",
    color: spot1,
})

globalStyle(`${LINEWORK_ROOT} ${fullBleedSubheadline}`, {
    fontSize: 19,
    maxWidth: 520,
})

// ---------------------------------------------------------- sunburst hero

// Beside a photograph, the frame is an arched window — a hard-edged,
// round-topped desert-modern opening with a terracotta shadow stepped out
// behind it, inside the column so the arch reads whole.
globalStyle(`${SUNBURST_ROOT} ${splitPhoto}`, {
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
    gap: scaledSpace(44),
    paddingTop: scaledSpace(22),
    paddingBottom: scaledSpace(22),
    "@media": {
        "(max-width: 860px)": { gridTemplateColumns: "1fr" },
    },
})

globalStyle(`${SUNBURST_ROOT} ${splitPhoto} ${media}`, {
    marginTop: 0,
    marginRight: 18,
    alignSelf: "stretch",
    display: "flex",
    "@media": {
        "(max-width: 860px)": { marginRight: 14 },
    },
})

globalStyle(`${SUNBURST_ROOT} ${splitPhoto} ${media} img`, {
    border: "none",
    borderRadius: "50% 50% 28px 28px / 38% 38% 28px 28px",
    boxShadow: `18px 16px 0 color-mix(in srgb, ${marketing.color.accent} 42%, ${marketing.color.pageBg})`,
    width: "100%",
    height: "100%",
    minHeight: "clamp(340px, 48vh, 520px)",
    objectFit: "cover",
    objectPosition: "64% 50%",
    "@media": {
        "(max-width: 860px)": { borderRadius: "50% 50% 22px 22px / 30% 30% 22px 22px", minHeight: 380 },
    },
})

globalStyle(`${SUNBURST_ROOT} ${splitPhoto} ${headline}`, {
    fontSize: `calc(clamp(34px, 4.2vw, 58px) * ${marketing.display.scale})`,
})

/*
 * Cover lines (`coverLines`): the short sells stacked under a photographic
 * headline. Off any treatment they are plain white display caps, the tail
 * quieter than the lead; registers set the inks.
 */
export const coverLines = style({
    listStyle: "none",
    padding: 0,
    margin: `${scaledSpace(24)} 0 0`,
    display: "grid",
    gap: scaledSpace(10),
})

export const coverLine = style({
    fontFamily: marketing.font.display,
    fontWeight: marketing.display.weight,
    fontSize: "clamp(18px, 2.2vw, 26px)",
    lineHeight: 1.05,
    textTransform: "uppercase",
    color: "#ffffff", // theme-exempt: copy over a photographic scrim is white in every theme
})

export const coverLineLead = style({ display: "block" })

export const coverLineTail = style({
    display: "block",
    fontSize: "0.72em",
    color: "rgba(255, 255, 255, 0.78)",
})

/*
 * metallic (crown): the masthead hero as a glossy late-90s cover. The
 * photograph holds the right; a plum grade carries the copy down the
 * left. The name is cast in chrome — the first line ("The") set small,
 * the accent word dropped to its own line in gold — over a gold-ruled
 * billing line and the stacked cover lines, each line's lead and tail in
 * its own ink. The frame grows with its copy instead of cropping it.
 */
globalStyle(`${METALLIC_ROOT} ${fullBleed}`, {
    height: "auto",
    minHeight: "min(84svh, 980px)",
    maxHeight: "none",
    paddingTop: scaledSpace(72),
    background: marketing.color.pageBg,
    "@media": {
        "(max-width: 700px)": { minHeight: "100svh", paddingTop: "46svh" },
    },
})

globalStyle(`${METALLIC_ROOT} ${fullBleedImg}`, {
    objectPosition: "center 18%",
    "@media": {
        "(max-width: 700px)": { objectPosition: "66% top" },
    },
})

globalStyle(`${METALLIC_ROOT} ${fullBleedScrim}`, {
    background:
        `linear-gradient(90deg, ${marketing.color.pageBg} 0%, color-mix(in srgb, ${marketing.color.pageBg} 88%, transparent) 24%, ` +
        `color-mix(in srgb, ${marketing.color.pageBg} 42%, transparent) 46%, transparent 62%), ` +
        `linear-gradient(0deg, ${marketing.color.pageBg} 0%, transparent 16%)`,
    "@media": {
        "(max-width: 700px)": {
            background:
                `linear-gradient(180deg, transparent 0%, transparent 30%, ` +
                `color-mix(in srgb, ${marketing.color.pageBg} 80%, transparent) 50%, ${marketing.color.pageBg} 64%)`,
        },
    },
})

globalStyle(`${METALLIC_ROOT} ${fullBleedInner}`, {
    paddingBottom: scaledSpace(44),
})

globalStyle(`${METALLIC_ROOT} ${fullBleedCopy}`, {
    maxWidth: 720,
})

globalStyle(`${METALLIC_ROOT} ${mastheadKicker}`, {
    fontFamily: marketing.font.display,
    fontStretch: "75%",
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: "0.34em",
    color: spot1,
    marginBottom: scaledSpace(10),
})

globalStyle(`${METALLIC_ROOT} ${mastheadKicker}::before`, {
    content: coverStar,
    marginRight: 12,
    letterSpacing: 0,
    color: marketing.color.accent,
})

globalStyle(`${METALLIC_ROOT} ${mastheadHeadline}`, {
    ...metalText(chromeFill, "0.03em"),
    backgroundSize: "100% 0.9em",
    whiteSpace: "pre-line",
    fontStyle: "italic",
    fontStretch: "116%",
    fontWeight: 900,
    fontSize: `calc(clamp(40px, 6.6vw, 96px) * ${marketing.display.scale})`,
    lineHeight: 0.9,
    letterSpacing: "-0.03em",
    // The casting's bright bevel: a hairline of polished edge on every glyph.
    WebkitTextStroke: `0.012em color-mix(in srgb, ${spot2} 55%, white)`,
})

globalStyle(`${METALLIC_ROOT} ${mastheadHeadline}::first-line`, {
    fontSize: "0.42em",
    letterSpacing: "0.02em",
})

globalStyle(`${METALLIC_ROOT} ${mastheadHeadline} ${accentWord}`, {
    ...metalText(goldFill),
    backgroundSize: "100% 0.9em",
    filter: "none",
    display: "block",
    fontStyle: "italic",
    WebkitTextStroke: `0.012em color-mix(in srgb, ${spot1} 45%, white)`,
})

globalStyle(`${METALLIC_ROOT} ${fullBleedCredit}`, {
    display: "flex",
    alignItems: "center",
    gap: 14,
    fontFamily: marketing.font.display,
    fontStretch: "80%",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.34em",
    color: spot1,
    margin: `${scaledSpace(16)} 0 0`,
    "@media": {
        "(max-width: 760px)": { fontSize: 12, letterSpacing: "0.22em", gap: 10 },
    },
})

globalStyle(`${METALLIC_ROOT} ${fullBleedCredit}::before, ${METALLIC_ROOT} ${fullBleedCredit}::after`, {
    content: '""',
    flex: "0 0 36px",
    height: 1,
    background: spot1,
    "@media": {
        "(max-width: 760px)": { flexBasis: 16 },
    },
})

globalStyle(`${METALLIC_ROOT} ${coverLines}`, {
    gap: 0,
    margin: `${scaledSpace(18)} 0 0`,
    maxWidth: 560,
})

globalStyle(`${METALLIC_ROOT} ${coverLine}`, {
    position: "relative",
    fontStretch: "70%",
    fontWeight: 900,
    fontSize: "clamp(24px, 2.6vw, 38px)",
    lineHeight: 0.96,
    letterSpacing: "0.005em",
    padding: `${scaledSpace(12)} 0`,
    color: marketing.color.text,
    textShadow: "0 2px 10px rgba(0, 0, 0, 0.45)",
})

globalStyle(`${METALLIC_ROOT} ${coverLine} + ${coverLine}`, {
    borderTop: `1px solid color-mix(in srgb, ${spot1} 60%, transparent)`,
})

// The sparkle pinned on each rule between lines.
globalStyle(`${METALLIC_ROOT} ${coverLine} + ${coverLine}::before`, {
    content: coverStar,
    position: "absolute",
    top: 0,
    left: "38%",
    transform: "translateY(-54%)",
    fontSize: 15,
    lineHeight: 1,
    color: spot1,
    textShadow: "none",
})

globalStyle(`${METALLIC_ROOT} ${coverLineTail}`, {
    fontSize: "1em",
    color: marketing.color.text,
})

// The inks cycle the way a cover sets its sells: the first line's tail
// in tangerine, the second line's lead a big tangerine verb over a small
// white tail, the third line's tail cast in gold.
globalStyle(`${METALLIC_ROOT} ${coverLine}:nth-child(3n + 1) ${coverLineTail}`, {
    color: marketing.color.accent,
})

globalStyle(`${METALLIC_ROOT} ${coverLine}:nth-child(3n + 2) ${coverLineLead}`, {
    fontSize: "1.32em",
    color: marketing.color.accent,
})

globalStyle(`${METALLIC_ROOT} ${coverLine}:nth-child(3n + 2) ${coverLineTail}`, {
    fontSize: "0.74em",
})

globalStyle(`${METALLIC_ROOT} ${coverLine}:nth-child(3n) ${coverLineTail}`, {
    ...metalText(goldFill, "0.02em"),
    textShadow: "none",
})

globalStyle(`${METALLIC_ROOT} ${fullBleed} ${ctaRow}`, {
    marginTop: scaledSpace(20),
})

globalStyle(`${METALLIC_ROOT} ${fullBleedSecondary}`, {
    color: spot1,
    borderColor: spot1,
})

/*
 * lacquer (vanity): the full-bleed hero as a beauty-counter card. Black
 * ground, the photograph (strokes and all) held on the right, and the
 * Didone headline stacked down the left: the first line huge in white,
 * the middle small in blush, the accent word huge in lipstick. The
 * billing line is tiny widely spaced blush caps under a lipstick rule.
 * The frame stops short of the viewport so the shade cards that follow
 * sit on the first screen.
 */
globalStyle(`${LACQUER_ROOT} ${fullBleed}`, {
    height: "auto",
    minHeight: "min(72svh, 820px)",
    maxHeight: "none",
    paddingTop: scaledSpace(56),
    background: marketing.color.pageBg,
    "@media": {
        "(max-width: 700px)": { minHeight: "92svh", paddingTop: "40svh" },
    },
})

globalStyle(`${LACQUER_ROOT} ${fullBleedImg}`, {
    objectPosition: "right 22%",
    "@media": {
        "(max-width: 700px)": { objectPosition: "64% top" },
    },
})

globalStyle(`${LACQUER_ROOT} ${fullBleedScrim}`, {
    background:
        `linear-gradient(90deg, ${marketing.color.pageBg} 0%, color-mix(in srgb, ${marketing.color.pageBg} 70%, transparent) 30%, transparent 52%), ` +
        `linear-gradient(0deg, ${marketing.color.pageBg} 0%, transparent 22%)`,
    "@media": {
        "(max-width: 700px)": {
            background:
                `linear-gradient(180deg, transparent 0%, transparent 28%, ` +
                `color-mix(in srgb, ${marketing.color.pageBg} 78%, transparent) 46%, ${marketing.color.pageBg} 62%)`,
        },
    },
})

// Room under the asks for the shade cards riding up over the frame's foot.
globalStyle(`${LACQUER_ROOT} ${fullBleedInner}`, {
    paddingBottom: `calc(${scaledSpace(40)} + clamp(28px, 5vw, 72px))`,
    "@media": {
        "(max-width: 760px)": { paddingBottom: scaledSpace(32) },
    },
})

globalStyle(`${LACQUER_ROOT} ${fullBleedHeadline}`, {
    whiteSpace: "pre-line",
    fontSize: `calc(clamp(24px, 3.3vw, 50px) * ${marketing.display.scale})`,
    lineHeight: 1,
    letterSpacing: "0.01em",
    color: spot1,
})

globalStyle(`${LACQUER_ROOT} ${fullBleedHeadline}::first-line`, {
    fontSize: "2.3em",
    letterSpacing: "-0.012em",
    color: marketing.color.text,
})

globalStyle(`${LACQUER_ROOT} ${fullBleedHeadline} ${accentWord}`, {
    display: "block",
    fontSize: "2.3em",
    letterSpacing: "-0.012em",
    lineHeight: 0.98,
    fontStyle: "normal",
    color: marketing.color.accent,
})

globalStyle(`${LACQUER_ROOT} ${fullBleedCredit}`, {
    fontFamily: marketing.font.body,
    fontSize: 12,
    fontWeight: 400,
    letterSpacing: "0.42em",
    lineHeight: 1.9,
    color: spot1,
    maxWidth: 560,
    margin: `${scaledSpace(30)} 0 0`,
})

globalStyle(`${LACQUER_ROOT} ${fullBleedCredit}::before`, {
    content: '""',
    display: "block",
    width: 72,
    height: 1,
    marginBottom: scaledSpace(22),
    background: spot1,
})

globalStyle(`${LACQUER_ROOT} ${fullBleed} ${ctaRow}`, {
    marginTop: scaledSpace(30),
})

// metallic: the inside pages' heads are cast from the same chrome as the
// cover, italic and wide, the accent word in gold.
globalStyle(`${METALLIC_ROOT} ${headline}`, {
    ...metalText(chromeFill, "0.03em"),
    backgroundSize: "100% 0.95em",
    fontStyle: "italic",
    fontStretch: "112%",
    fontWeight: 900,
    lineHeight: 0.95,
    letterSpacing: "-0.02em",
})

globalStyle(`${METALLIC_ROOT} ${headline} ${accentWord}`, {
    ...metalText(goldFill),
    backgroundSize: "100% 0.95em",
    filter: "none",
})

// ------------------------------------------------------------ atomic hero

/*
 * `atomic` (midcentury): the catalog cover. The split hero's photograph
 * runs off the right edge and up to the nav; the copy sits on the stock
 * in a ruled panel — an atomic star, a short mustard rule, the condensed
 * headline, a longer rule, the subheadline in tracked caps — with the
 * register's ornament (half-disc, ring, star) set in the panel's corner.
 * The asks are lettered links, the portfolio one pointed by a teal arrow.
 */
globalStyle(`${ATOMIC_ROOT} ${splitPhoto}`, {
    width: "100vw",
    marginLeft: "calc(50% - 50vw)",
    padding: 0,
    gridTemplateColumns: "minmax(0, 1fr) 58vw",
    gap: 0,
    alignItems: "stretch",
    minHeight: "clamp(460px, 52vw, 680px)",
    borderBottom: `1px solid ${marketing.color.line}`,
    "@media": {
        "(max-width: 860px)": { gridTemplateColumns: "1fr", minHeight: 0 },
    },
})

globalStyle(`${ATOMIC_ROOT} ${splitPhoto} > div:first-child`, {
    position: "relative",
    isolation: "isolate",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: `${scaledSpace(36)} ${scaledSpace(36)} ${scaledSpace(64)} calc((100vw - min(${marketing.layout.maxWidth}, 100vw)) / 2 + 24px)`,
    borderRight: `1px solid ${marketing.color.line}`,
    "@media": {
        "(max-width: 860px)": { padding: "34px 20px 132px", borderRight: "none" },
    },
})

globalStyle(`${ATOMIC_ROOT} ${splitPhoto} > div:first-child::before`, {
    ...atomicStar(34, spot2),
    marginBottom: scaledSpace(18),
})

globalStyle(`${ATOMIC_ROOT} ${splitPhoto} > div:first-child::after`, {
    content: '""',
    position: "absolute",
    zIndex: -1,
    right: "3%",
    bottom: 0,
    width: "min(36%, 172px)",
    aspectRatio: "360 / 300",
    backgroundImage: "var(--marketing-ornament)",
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain",
    backgroundPosition: "right bottom",
    pointerEvents: "none",
    "@media": {
        "(max-width: 860px)": { width: 150 },
    },
})

globalStyle(`${ATOMIC_ROOT} ${splitPhoto} ${headline}`, {
    fontSize: "clamp(46px, 6vw, 80px)",
    lineHeight: 0.98,
    letterSpacing: "0.004em",
    textWrap: "balance",
    margin: 0,
    paddingTop: 24,
    backgroundImage: `linear-gradient(${marketing.color.accent}, ${marketing.color.accent})`,
    backgroundSize: "46px 3px",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "0 0",
})

globalStyle(`${ATOMIC_ROOT} ${splitPhoto} ${headline}::after`, {
    content: '""',
    display: "block",
    width: "62%",
    height: 2,
    marginTop: "0.3em",
    background: `color-mix(in srgb, ${spot2} 55%, ${marketing.color.text})`,
})

globalStyle(`${ATOMIC_ROOT} ${splitPhoto} ${subheadline}`, {
    fontSize: 14.5,
    fontWeight: 500,
    lineHeight: 1.7,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: marketing.color.text,
    maxWidth: "30em",
    margin: `${scaledSpace(22)} 0 0`,
})

globalStyle(`${ATOMIC_ROOT} ${splitPhoto} ${ctaRow}`, {
    alignItems: "center",
    gap: "10px 28px",
    marginTop: scaledSpace(26),
})

globalStyle(`${ATOMIC_ROOT} ${splitPhoto} ${primary}, ${ATOMIC_ROOT} ${splitPhoto} ${secondary}`, {
    padding: "6px 0",
    background: "none",
    border: "none",
    boxShadow: "none",
})

globalStyle(`${ATOMIC_ROOT} ${splitPhoto} ${primary}::after`, {
    width: 16,
    height: 16,
    verticalAlign: "-0.2em",
    border: "none",
    transform: "none",
    margin: "0 0 0 10px",
    background: atomicTeal,
    maskImage: ATOMIC_ARROW_MASK,
    WebkitMaskImage: ATOMIC_ARROW_MASK,
    maskSize: "contain",
    WebkitMaskSize: "contain",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
})

globalStyle(`${ATOMIC_ROOT} ${splitPhoto} ${secondary}`, {
    color: marketing.color.subtle,
    textDecoration: "underline",
    textDecorationThickness: 1,
    textUnderlineOffset: 6,
})

globalStyle(`${ATOMIC_ROOT} ${splitPhoto} ${secondary}:hover`, {
    background: "none",
    color: marketing.color.text,
})

globalStyle(`${ATOMIC_ROOT} ${splitPhoto} ${media}`, {
    marginTop: 0,
    height: "100%",
    minHeight: 320,
})

globalStyle(`${ATOMIC_ROOT} ${splitPhoto} ${media} img`, {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: 0,
    border: "none",
})

/*
 * `invitation`: the party invitation. Base styles read on any register;
 * the `zine` (photo-booth wedding) and `mirrorball` (disco supper club)
 * treatments below re-ink it.
 */
export const invite = style([
    heroBase,
    { padding: `${scaledSpace(36)} 0 ${scaledSpace(24)}`, position: "relative" },
])

export const inviteGrid = style({
    display: "grid",
    gridTemplateColumns: "minmax(0, 0.86fr) minmax(0, 1.14fr)",
    gap: scaledSpace(40),
    alignItems: "center",
    "@media": {
        "(max-width: 860px)": { gridTemplateColumns: "1fr", gap: scaledSpace(32) },
    },
})

/** A single portrait instead of the wall: it takes more of the row and bleeds right. */
export const inviteGridPortrait = style({
    gridTemplateColumns: "minmax(0, 0.8fr) minmax(0, 1.2fr)",
    alignItems: "stretch",
    "@media": {
        "(max-width: 860px)": { gridTemplateColumns: "1fr" },
    },
})

export const inviteGridSolo = style({ display: "grid", gridTemplateColumns: "1fr" })

export const inviteCopy = style({ position: "relative", zIndex: 1, alignSelf: "center" })

export const inviteBadge = style({
    display: "inline-block",
    fontFamily: captionFontStack,
    fontSize: 12.5,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: marketing.color.accent,
    marginBottom: scaledSpace(16),
})

export const inviteReadout = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    margin: `0 0 ${scaledSpace(6)}`,
})

export const inviteReadoutValue = style({
    fontFamily: scriptFont,
    fontSize: `calc(clamp(52px, 7vw, 100px) * ${marketing.display.scale})`,
    fontWeight: 400,
    lineHeight: 1,
    color: marketing.color.accent,
})

export const inviteReadoutNote = style({
    fontFamily: marketing.font.display,
    fontSize: "clamp(18px, 2.2vw, 28px)",
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: spot2,
})

export const inviteHeadline = style({
    position: "relative",
    fontSize: `calc(clamp(44px, 6.4vw, 88px) * ${marketing.display.scale})`,
    lineHeight: 0.96,
})

export const inviteLine = style({
    display: "block",
    selectors: {
        "&:last-child:not(:first-child)": { color: marketing.color.accent },
    },
})

export const inviteSub = style({ maxWidth: 460 })

export const inviteAskRow = style({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: scaledSpace(24),
    marginTop: scaledSpace(30),
})

export const inviteSeal = style({
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: 132,
    height: 132,
    padding: 14,
    borderRadius: "50%",
    border: `1.5px solid ${spot2}`,
    color: spot2,
    fontFamily: marketing.font.display,
    fontSize: 15,
    lineHeight: 1.15,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    textAlign: "center",
})

export const inviteSealLine = style({ display: "block" })

/**
 * The photo wall: a tight mosaic. Five pieces lay out as the zine page —
 * a strip and a wide print on top, then a strip reaching back under the
 * copy, a tall print, and a second tall print — every photograph
 * cover-cropped to its cell so the wall stays one rectangle.
 */
export const inviteWall = style({
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gridAutoRows: "minmax(0, 1fr)",
    gap: 10,
    aspectRatio: "1 / 1",
    selectors: {
        '&[data-pieces="5"]': {
            gridTemplateColumns: "minmax(0, 0.8fr) minmax(0, 1fr) minmax(0, 1fr)",
            gridTemplateRows: "minmax(0, 1fr) minmax(0, 1fr)",
            aspectRatio: "0.96 / 1",
        },
    },
})

export const invitePiece = style({
    position: "relative",
    margin: 0,
    minWidth: 0,
    minHeight: 0,
    height: "100%",
})

globalStyle(`${inviteWall}[data-pieces="5"] > ${invitePiece}:nth-child(2)`, { gridColumn: "2 / 4" })
globalStyle(`${inviteWall}[data-pieces="5"] > ${invitePiece}:nth-child(3)`, {
    gridColumn: "1",
    gridRow: "2",
    "@media": {
        // The second strip reaches back under the copy column, the way the
        // page was pasted up.
        "(min-width: 861px)": { transform: "translateX(-34%)" },
    },
})

export const invitePrint = style({
    display: "block",
    width: "100%",
    height: "100%",
    overflow: "hidden",
})

export const invitePrintImg = style({
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover",
})

/** The booth strip: its frames stacked in an ink border. */
export const inviteStrip = style({
    display: "flex",
    flexDirection: "column",
    gap: 7,
    padding: 7,
    background: marketing.color.text,
})

export const inviteStripFrame = style({
    display: "block",
    flex: "1 1 0",
    minHeight: 0,
    overflow: "hidden",
})

export const inviteSticker = style({
    position: "absolute",
    zIndex: 2,
    top: -12,
    left: "8%",
    maxWidth: "88%",
    fontFamily: captionFontStack,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.06em",
    lineHeight: 1.25,
    textTransform: "uppercase",
    textAlign: "center",
    whiteSpace: "pre-line",
    color: marketing.color.onAccent,
    background: marketing.color.accent,
    padding: "7px 10px",
    boxShadow: marketing.shape.shadowCard,
    transform: "rotate(-2deg)",
})

// The last piece's label is the big one, slapped over its lower corner.
globalStyle(`${invitePiece}:last-child > ${inviteSticker}`, {
    top: "auto",
    left: "auto",
    bottom: "7%",
    right: "-5%",
    maxWidth: "92%",
    fontSize: 14,
    padding: "10px 14px",
    transform: "rotate(-5deg)",
    "@media": {
        "(max-width: 860px)": { right: 0 },
    },
})

export const invitePortrait = style({
    position: "relative",
    minHeight: 420,
    borderRadius: marketing.shape.radiusCard,
    overflow: "hidden",
})

export const invitePortraitImg = style({
    position: "absolute",
    inset: 0,
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "72% center",
})

/** The particulars strip under the hero, with the jump to the details. */
export const inviteDetails = style({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: `${scaledSpace(14)} ${scaledSpace(28)}`,
    marginTop: scaledSpace(36),
    paddingTop: scaledSpace(18),
    borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.text}`,
})

export const inviteCells = style({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    rowGap: 6,
    margin: 0,
    fontSize: 17,
    lineHeight: 1.4,
    color: marketing.color.text,
})

export const inviteCell = style({
    display: "inline-flex",
    alignItems: "center",
    selectors: {
        "& + &::before": {
            content: '"•"',
            margin: "0 14px",
            color: spot1,
        },
        "&:last-child:not(:first-child)": { color: marketing.color.accent },
    },
})

export const inviteJump = style({
    display: "inline-flex",
    alignItems: "baseline",
    gap: 8,
    fontFamily: captionFontStack,
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: marketing.color.text,
    textDecoration: "none",
    whiteSpace: "nowrap",
})

export const inviteJumpWord = style({
    fontFamily: marketing.font.display,
    fontSize: 22,
    letterSpacing: 0,
    color: spot1,
})

export const inviteJumpArrow = style({ fontSize: 20, color: spot1 })

// ------------------------------------------------------------------ zine
// The photo-booth wedding: marker lines in ink, pink, and cobalt with a
// swoosh under the last and a cobalt star beside them; the details typed.
globalStyle(`${ZINE_ROOT} ${inviteHeadline}`, {
    display: "inline-block",
    fontSize: `calc(clamp(42px, 5.7vw, 76px) * ${marketing.display.scale})`,
    lineHeight: 0.98,
    letterSpacing: "-0.01em",
})

globalStyle(`${ZINE_ROOT} ${inviteLine}:nth-child(2)`, { color: marketing.color.accent })
globalStyle(
    `${ZINE_ROOT} ${inviteLine}:nth-child(3), ${ZINE_ROOT} ${inviteLine}:last-child:not(:first-child)`,
    {
        color: spot1,
    },
)
globalStyle(`${ZINE_ROOT} ${inviteLine}:nth-child(2):last-child`, { color: marketing.color.accent })

globalStyle(`${ZINE_ROOT} ${inviteHeadline}::after`, {
    content: '""',
    display: "block",
    width: "86%",
    height: "0.2em",
    marginTop: "0.12em",
    background: marketing.color.accent,
    maskImage: SWOOSH_MASK,
    maskSize: "100% 100%",
    maskRepeat: "no-repeat",
    WebkitMaskImage: SWOOSH_MASK,
    WebkitMaskSize: "100% 100%",
    WebkitMaskRepeat: "no-repeat",
    transform: "rotate(-1.6deg)",
    transformOrigin: "left center",
})

// The cobalt star rides the end of the second line.
globalStyle(`${ZINE_ROOT} ${inviteLine}:nth-child(2)::after`, {
    content: '"★"',
    display: "inline-block",
    marginLeft: "0.3em",
    fontSize: "0.5em",
    lineHeight: 1,
    verticalAlign: "0.5em",
    color: spot1,
    transform: "rotate(-12deg)",
})

globalStyle(`${ZINE_ROOT} ${inviteBadge}`, {
    ...zineLabel,
    padding: "6px 11px 5px",
    color: marketing.color.onAccent,
    background: marketing.color.accent,
    transform: "rotate(-2deg)",
})

globalStyle(`${ZINE_ROOT} ${inviteSub}`, {
    fontSize: 17,
    lineHeight: 1.6,
    color: marketing.color.text,
    maxWidth: 400,
})

globalStyle(`${ZINE_ROOT} ${inviteSticker}`, {
    ...zineLabel,
    left: "-12%",
    width: "max-content",
    maxWidth: "none",
    padding: "7px 11px 6px",
    boxShadow: marketing.shape.shadowCard,
    "@media": {
        "(max-width: 560px)": { left: "-4%", fontSize: 10.5, padding: "5px 8px 4px" },
    },
})

globalStyle(`${ZINE_ROOT} ${invitePiece}:last-child > ${inviteSticker}`, {
    fontFamily: marketing.font.display,
    fontSize: 21,
    fontWeight: 400,
    letterSpacing: "0.01em",
    lineHeight: 1.08,
    padding: "12px 16px 10px",
    "@media": {
        "(max-width: 560px)": { fontSize: 14, padding: "7px 9px 6px", right: "-3%" },
    },
})

globalStyle(`${ZINE_ROOT} ${inviteCells}`, { fontFamily: captionFontStack, fontSize: 19 })

globalStyle(`${ZINE_ROOT} ${inviteCell}:first-child::before`, {
    content: '"★"',
    marginRight: 16,
    fontSize: 30,
    lineHeight: 1,
    color: marketing.color.accent,
})

globalStyle(`${ZINE_ROOT} ${inviteJump}`, { fontSize: 15 })

globalStyle(`${ZINE_ROOT} ${inviteJumpWord}`, { fontSize: 28 })

// ------------------------------------------------------------ mirrorball
// The supper club: the guest of honor's name in pink script over tracked
// gold caps, the big number in lacquer red, the rest of the line sung in
// script, the portrait bleeding off the right edge into the dark.
globalStyle(`${MIRRORBALL_ROOT} ${invite}`, { padding: `${scaledSpace(18)} 0 ${scaledSpace(20)}` })

globalStyle(`${MIRRORBALL_ROOT} ${inviteBadge}`, {
    fontFamily: marketing.font.body,
    fontSize: 12.5,
    letterSpacing: "0.32em",
    color: spot2,
})

globalStyle(`${MIRRORBALL_ROOT} ${inviteReadout}`, { alignItems: "stretch", maxWidth: 520 })

globalStyle(`${MIRRORBALL_ROOT} ${inviteReadoutValue}`, {
    fontSize: `calc(clamp(64px, 7.4vw, 112px) * ${marketing.display.scale})`,
    lineHeight: 0.95,
    color: spot1,
    textShadow: `0 0 28px color-mix(in srgb, ${spot1} 40%, transparent)`,
    paddingLeft: "0.08em",
})

globalStyle(`${MIRRORBALL_ROOT} ${inviteReadoutNote}`, {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    fontSize: "clamp(18px, 2.1vw, 30px)",
    fontWeight: 600,
    letterSpacing: "0.36em",
    margin: "0.1em 0 0.02em",
})

globalStyle(
    `${MIRRORBALL_ROOT} ${inviteReadoutNote}::before, ${MIRRORBALL_ROOT} ${inviteReadoutNote}::after`,
    {
        content: '"✦"',
        flex: "1 1 0",
        fontSize: "0.5em",
        letterSpacing: 0,
        color: spot2,
    },
)

globalStyle(`${MIRRORBALL_ROOT} ${inviteReadoutNote}::before`, {
    textAlign: "right",
    background: `linear-gradient(90deg, transparent, ${spot2}) left center / calc(100% - 1.6em) 1px no-repeat`,
})

globalStyle(`${MIRRORBALL_ROOT} ${inviteReadoutNote}::after`, {
    textAlign: "left",
    background: `linear-gradient(90deg, ${spot2}, transparent) right center / calc(100% - 1.6em) 1px no-repeat`,
})

globalStyle(`${MIRRORBALL_ROOT} ${inviteHeadline}`, {
    display: "block",
    maxWidth: 560,
    lineHeight: 0.9,
    textAlign: "center",
})

globalStyle(`${MIRRORBALL_ROOT} ${inviteLine}:first-child`, {
    // Sized to fit the copy column: the gradient only paints inside the box.
    width: "fit-content",
    marginLeft: "auto",
    marginRight: "auto",
    padding: "0 0.04em",
    fontSize: "clamp(76px, 10.4vw, 146px)",
    lineHeight: 0.86,
    letterSpacing: "0.01em",
    color: marketing.color.accent,
    backgroundImage:
        `linear-gradient(180deg, color-mix(in srgb, ${marketing.color.accent} 62%, white) 0%, ` +
        `${marketing.color.accent} 42%, color-mix(in srgb, ${marketing.color.accent} 62%, black) 100%)`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    filter: `drop-shadow(0 2px 0 color-mix(in srgb, ${spot2} 55%, black))`,
})

globalStyle(`${MIRRORBALL_ROOT} ${inviteLine}:not(:first-child)`, {
    fontFamily: scriptFont,
    fontSize: "clamp(40px, 4.6vw, 70px)",
    fontWeight: 400,
    lineHeight: 1.15,
    letterSpacing: 0,
    textTransform: "none",
    color: spot1,
    marginTop: "0.08em",
})

// The swash under the sung line.
globalStyle(`${MIRRORBALL_ROOT} ${inviteHeadline}::after`, {
    content: '""',
    display: "block",
    width: "62%",
    height: 14,
    margin: "2px auto 0",
    background: spot1,
    maskImage: SWOOSH_MASK,
    maskSize: "100% 100%",
    maskRepeat: "no-repeat",
    WebkitMaskImage: SWOOSH_MASK,
    WebkitMaskSize: "100% 100%",
    WebkitMaskRepeat: "no-repeat",
})

globalStyle(`${MIRRORBALL_ROOT} ${inviteSub}`, {
    fontFamily: marketing.font.display,
    fontStyle: "italic",
    fontSize: 19,
    lineHeight: 1.5,
    color: spot2,
    maxWidth: 520,
})

globalStyle(`${MIRRORBALL_ROOT} ${inviteSub}::before`, {
    ...foilRule,
    width: "100%",
    margin: `0 0 ${scaledSpace(18)}`,
    fontStyle: "normal",
})

globalStyle(`${MIRRORBALL_ROOT} ${inviteSeal}`, {
    position: "relative",
    width: 150,
    height: 150,
    gap: 2,
    fontSize: 16,
    fontWeight: 600,
    border: `1px solid ${spot2}`,
    outline: `1px solid color-mix(in srgb, ${spot2} 60%, transparent)`,
    outlineOffset: 5,
    boxShadow: `0 0 36px -6px color-mix(in srgb, ${spot2} 45%, transparent)`,
    marginLeft: 6,
})

globalStyle(`${MIRRORBALL_ROOT} ${inviteSeal}::before`, { content: '"✦"', fontSize: 11, marginBottom: 2 })

globalStyle(`${MIRRORBALL_ROOT} ${inviteSeal}::after`, {
    content: '""',
    width: 30,
    height: 37,
    marginTop: 4,
    backgroundImage: "var(--marketing-ornament, none)",
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center bottom",
})

// The portrait bleeds off the right edge and dissolves into the room at
// its left and foot, so the copy stands in the same dark.
globalStyle(`${MIRRORBALL_ROOT} ${invitePortrait}`, {
    minHeight: 640,
    borderRadius: 0,
    marginLeft: "-14%",
    marginRight: `calc((min(${marketing.layout.maxWidth}, 100vw) - 100vw) / 2 - 24px)`,
    maskImage:
        "linear-gradient(90deg, transparent 0%, black 30%), linear-gradient(0deg, transparent 0%, black 16%)",
    maskComposite: "intersect",
    WebkitMaskImage:
        "linear-gradient(90deg, transparent 0%, black 30%), linear-gradient(0deg, transparent 0%, black 16%)",
    WebkitMaskComposite: "source-in",
    "@media": {
        "(max-width: 860px)": {
            order: -1,
            minHeight: 380,
            margin: "0 -24px",
            maskImage: "linear-gradient(0deg, transparent 0%, black 30%)",
            WebkitMaskImage: "linear-gradient(0deg, transparent 0%, black 30%)",
        },
    },
})

globalStyle(`${MIRRORBALL_ROOT} ${invitePortraitImg}`, { objectPosition: "66% 30%" })

globalStyle(`${MIRRORBALL_ROOT} ${inviteDetails}`, {
    justifyContent: "center",
    position: "relative",
    zIndex: 1,
    marginTop: scaledSpace(8),
    padding: `${scaledSpace(16)} ${scaledSpace(26)}`,
    border: `1px solid ${spot2}`,
    outline: `1px solid color-mix(in srgb, ${spot2} 55%, transparent)`,
    outlineOffset: 4,
    background: `color-mix(in srgb, ${marketing.color.pageBg} 82%, transparent)`,
})

globalStyle(`${MIRRORBALL_ROOT} ${inviteCells}`, {
    fontSize: 14.5,
    fontWeight: 600,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
})

globalStyle(`${MIRRORBALL_ROOT} ${inviteCell}:first-child`, {
    fontFamily: marketing.font.display,
    fontSize: 21,
    letterSpacing: "0.04em",
})

globalStyle(`${MIRRORBALL_ROOT} ${inviteCell} + ${inviteCell}::before`, {
    content: '"✦"',
    margin: "0 18px",
    fontSize: 12,
    color: spot2,
})

globalStyle(`${MIRRORBALL_ROOT} ${inviteCell}:last-child:not(:first-child)`, { color: spot1 })

globalStyle(`${MIRRORBALL_ROOT} ${inviteJump}`, {
    fontFamily: marketing.font.body,
    fontSize: 12.5,
    letterSpacing: "0.26em",
    color: spot2,
})

globalStyle(`${MIRRORBALL_ROOT} ${inviteJumpWord}`, {
    fontFamily: scriptFont,
    fontSize: 30,
    textTransform: "none",
    color: spot1,
})

/*
 * `pinboard`: the fridge door. The copy column on the left; on the right
 * a pile of white-bordered prints overlapping at their leans (each print's
 * `--mk-tilt`, set by the component), taped along the top, the caption
 * written on the border. Up to four prints land in authored spots; the
 * seal is a sticky note pressed on at the pile's foot.
 */
export const pinboard = style([
    heroBase,
    {
        display: "grid",
        gridTemplateColumns: "minmax(0, 0.92fr) minmax(0, 1.08fr)",
        gap: scaledSpace(36),
        alignItems: "center",
        textAlign: "left",
        padding: `${scaledSpace(28)} 0 ${scaledSpace(40)}`,
        "@media": {
            "(max-width: 900px)": { gridTemplateColumns: "1fr", gap: scaledSpace(28) },
        },
    },
])

export const pinboardCopy = style({
    position: "relative",
    zIndex: 1,
    // The shout sizes to its own column, so a long line never runs into the pile.
    containerType: "inline-size",
})

export const pinboardPile = style({
    position: "relative",
    width: "100%",
    // Taller than wide: the four prints fan down the column so every
    // caption stays readable where the prints overlap.
    aspectRatio: "0.88 / 1",
    "@media": {
        "(max-width: 900px)": { aspectRatio: "1 / 1.28" },
    },
})

export const pinboardPrint = style({
    position: "absolute",
    margin: 0,
    display: "flex",
    flexDirection: "column",
    padding: "2.6% 2.6% 0",
    background: marketing.color.surface,
    borderRadius: 2,
    boxShadow: marketing.shape.shadowCard,
    transform: "rotate(var(--mk-tilt, 0deg))",
    transition: "transform 220ms ease",
    selectors: {
        "&:hover": { transform: "rotate(0deg) scale(1.02)", zIndex: 3 },
        // Masking tape across the top edge, torn off the roll.
        "&::before": {
            content: '""',
            position: "absolute",
            zIndex: 1,
            top: -14,
            left: "50%",
            width: "32%",
            height: 30,
            background: MASKING_TAPE,
            clipPath: TAPE_CLIP,
            transform: "translateX(-50%) rotate(-2deg)",
        },
        "&:nth-child(1)": { top: "0%", left: "12%", width: "58%", zIndex: 3 },
        "&:nth-child(2)": { top: "50%", left: "0%", width: "47%", zIndex: 2 },
        "&:nth-child(3)": { top: "40%", right: "1%", width: "44%", zIndex: 2 },
        "&:nth-child(4)": { top: "70%", left: "36%", width: "40%", zIndex: 1 },
        "&:nth-child(2)::before": { left: "40%", transform: "translateX(-50%) rotate(4deg)" },
        "&:nth-child(3)::before": { left: "58%", transform: "translateX(-50%) rotate(-5deg)" },
        "&:nth-child(4)::before": {
            top: "auto",
            bottom: -12,
            left: "82%",
            width: "30%",
            transform: "translateX(-50%) rotate(-38deg)",
        },
    },
    "@media": {
        "(prefers-reduced-motion: reduce)": { transition: "none" },
        "(max-width: 900px)": {
            selectors: {
                "&:nth-child(1)": { left: "4%", width: "66%" },
                "&:nth-child(2)": { top: "44%", width: "54%" },
                "&:nth-child(3)": { top: "36%", right: "0%", width: "50%" },
                "&:nth-child(4)": { top: "67%", left: "36%", width: "50%" },
                "&::before": { height: 22, top: -10 },
            },
        },
    },
})

export const pinboardPhoto = style({
    display: "block",
    overflow: "hidden",
})

export const pinboardImg = style({
    display: "block",
    width: "100%",
    height: "auto",
    aspectRatio: "4 / 3",
    objectFit: "cover",
})

export const pinboardCaption = style({
    fontFamily: scriptFont,
    fontSize: "clamp(14px, 1.55vw, 22px)",
    lineHeight: 1.1,
    color: marketing.color.text,
    padding: "0.42em 0.15em 0.5em",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    "@media": {
        "(max-width: 900px)": { fontSize: 14 },
    },
})

/** The sticky note: first line small, the rest in the big hand, stuck on at a lean. */
export const pinboardNote = style({
    position: "absolute",
    zIndex: 4,
    right: "-1%",
    bottom: "-7%",
    display: "flex",
    flexDirection: "column",
    gap: 2,
    width: "clamp(150px, 27%, 186px)",
    margin: 0,
    padding: "22px 16px 18px",
    fontFamily: scriptFont,
    color: "#1d1916", // theme-exempt: marker ink on the yellow note, in every appearance
    background: spot1,
    boxShadow: "0 1px 1px rgba(40, 28, 16, 0.18), 0 16px 22px -14px rgba(40, 28, 16, 0.45)", // theme-exempt: paper shadow
    transform: "rotate(4deg)",
    selectors: {
        "&::before": {
            content: '""',
            position: "absolute",
            top: -12,
            left: "50%",
            width: "58%",
            height: 26,
            background: MASKING_TAPE,
            clipPath: TAPE_CLIP,
            transform: "translateX(-50%) rotate(-3deg)",
        },
    },
    "@media": {
        // On a phone the note moves up into the gap beside the top print.
        "(max-width: 900px)": {
            width: 118,
            padding: "18px 12px 14px",
            top: "3%",
            right: "0%",
            bottom: "auto",
            transform: "rotate(6deg)",
        },
    },
})

export const pinboardNoteTop = style({
    fontSize: 20,
    lineHeight: 1.05,
})

export const pinboardNoteLine = style({
    fontSize: 25,
    lineHeight: 1.05,
    selectors: {
        // The last line is circled in red marker, like a date on the calendar.
        "&:last-child": {
            alignSelf: "flex-start",
            whiteSpace: "nowrap",
            marginTop: 4,
            padding: "2px 10px 3px",
            border: `2.5px solid ${marketing.color.accent}`,
            borderRadius: "48% 52% 46% 54% / 58% 44% 56% 42%",
        },
    },
    "@media": {
        "(max-width: 900px)": { fontSize: 20 },
    },
})

/** The credit on a pinboard: a note scribbled on the door with a curling arrow toward the prints. */
export const pinboardScribble = style({
    position: "relative",
    maxWidth: 300,
    margin: `${scaledSpace(30)} 0 0 76px`,
    fontFamily: scriptFont,
    fontSize: 22,
    lineHeight: 1.2,
    color: marketing.color.text,
    transform: "rotate(-2deg)",
    selectors: {
        "&::before": {
            content: '""',
            position: "absolute",
            left: -76,
            top: -8,
            width: 64,
            height: 40,
            background: marketing.color.accent,
            WebkitMaskImage: SCRIBBLE_ARROW_MASK,
            maskImage: SCRIBBLE_ARROW_MASK,
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
        },
    },
    "@media": {
        "(max-width: 900px)": { fontSize: 19, marginLeft: 70 },
    },
})

// taped: the badge is a written kicker — condensed caps, tracked, a red
// heart after; the headline is set tight and shouted; the accent line is
// marker red.
globalStyle(`${TAPED_ROOT} ${badge}`, {
    display: "block",
    fontFamily: marketing.font.display,
    fontSize: 17,
    fontWeight: 800,
    letterSpacing: "0.06em",
    color: marketing.color.text,
    background: "none",
    border: "none",
    borderRadius: 0,
    padding: 0,
    marginBottom: scaledSpace(16),
})

globalStyle(`${TAPED_ROOT} ${badge}::after`, {
    content: '"♡"',
    display: "inline-block",
    marginLeft: 10,
    fontFamily: marketing.font.body,
    fontSize: 22,
    fontWeight: 900,
    color: marketing.color.accent,
    transform: "rotate(-8deg)",
})

globalStyle(`${TAPED_ROOT} ${pinboard} ${headline}`, {
    fontSize: "min(20cqi, 106px)",
    lineHeight: 0.9,
    letterSpacing: "-0.012em",
})

globalStyle(`${TAPED_ROOT} ${pinboard} ${accentWord}`, {
    fontSize: "min(0.82em, 13.6cqi)",
})

globalStyle(`${TAPED_ROOT} ${pinboard} ${subheadline}`, {
    fontSize: 19,
    lineHeight: 1.5,
    color: marketing.color.text,
    maxWidth: 400,
    margin: `${scaledSpace(20)} 0 0`,
})

globalStyle(`${TAPED_ROOT} ${pinboard} ${ctaRow}`, {
    marginTop: scaledSpace(26),
    alignItems: "center",
})

globalStyle(`${TAPED_ROOT} ${splitPhoto} ${media}`, {
    transform: "rotate(1.6deg)",
})

/*
 * `lariat` split-media: the rodeo bill. The photograph runs off the page's
 * left edge and fades into the paper on its inner side; the copy stands to
 * its right in wood type. The credit becomes a ribbon banner under the
 * headline and the seal a scalloped roundel hung on the photograph's foot.
 */
globalStyle(`${LARIAT_ROOT} ${splitPhoto}`, {
    width: "100vw",
    marginLeft: "calc(50% - 50vw)",
    gridTemplateColumns: "minmax(0, 1.22fr) minmax(0, 1fr)",
    gap: 0,
    alignItems: "stretch",
    padding: `0 0 ${scaledSpace(24)}`,
    "@media": {
        "(max-width: 860px)": { gridTemplateColumns: "1fr", padding: `0 0 ${scaledSpace(20)}` },
    },
})

globalStyle(`${LARIAT_ROOT} ${splitPhoto} > div:first-child`, {
    order: 2,
    // The wood type sizes to its own column: the name holds one line.
    containerType: "inline-size",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: `${scaledSpace(28)} calc((100vw - min(${marketing.layout.maxWidth}, 100vw)) / 2 + 24px) ${scaledSpace(28)} ${scaledSpace(8)}`,
    "@media": {
        "(max-width: 860px)": { padding: "8px 20px 12px" },
    },
})

globalStyle(`${LARIAT_ROOT} ${splitPhoto} ${media}`, {
    order: 1,
    marginTop: 0,
    minHeight: "clamp(440px, 46vw, 680px)",
    WebkitMaskImage:
        "linear-gradient(to right, black 82%, transparent 99.5%), linear-gradient(to bottom, black 84%, transparent)",
    maskImage:
        "linear-gradient(to right, black 82%, transparent 99.5%), linear-gradient(to bottom, black 84%, transparent)",
    WebkitMaskComposite: "source-in",
    maskComposite: "intersect",
    "@media": {
        "(max-width: 860px)": {
            minHeight: 300,
            WebkitMaskImage: "linear-gradient(to bottom, black 78%, transparent)",
            maskImage: "linear-gradient(to bottom, black 78%, transparent)",
        },
    },
})

globalStyle(`${LARIAT_ROOT} ${splitPhoto} ${media} img`, {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "14% 50%",
    border: "none",
    borderRadius: 0,
    boxShadow: "none",
})

globalStyle(`${LARIAT_ROOT} ${split} ${headline}`, {
    fontSize: "min(9.6cqi, 92px)",
    lineHeight: 0.98,
    "@media": {
        "(max-width: 640px)": { fontSize: "8cqi" },
    },
    textShadow: `0.035em 0.035em 0 color-mix(in srgb, ${marketing.color.text} 18%, transparent)`,
})

// The accent line is the bill's shout: nearly twice the name above it, so
// "ride again." breaks onto its own two lines in the column.
globalStyle(`${LARIAT_ROOT} ${split} ${accentWord}`, {
    display: "inline-block",
    fontSize: "1.9em",
    lineHeight: 0.92,
    marginTop: "0.04em",
})

globalStyle(`${LARIAT_ROOT} ${split} ${badge}`, {
    fontFamily: marketing.font.display,
    fontSize: 14,
    fontWeight: 400,
    letterSpacing: "0.18em",
    color: spot1,
    background: "none",
    border: "none",
    padding: 0,
    marginBottom: scaledSpace(14),
})

globalStyle(`${LARIAT_ROOT} ${split} ${subheadline}`, {
    fontSize: 18,
    lineHeight: 1.55,
    color: marketing.color.text,
    maxWidth: 520,
    margin: `${scaledSpace(20)} 0 0`,
})

// The ribbon: a dark banner with swallow-tail ends, the credit lettered
// across it in wood type, a turquoise star at each end.
globalStyle(`${LARIAT_ROOT} ${splitCredit}`, {
    order: -1,
    position: "relative",
    alignSelf: "flex-start",
    margin: `${scaledSpace(20)} 0 0`,
    padding: "11px 44px 9px",
    fontFamily: marketing.font.display,
    fontSize: 17,
    fontWeight: 400,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: marketing.color.pageBg,
    background: marketing.color.text,
    clipPath: "polygon(0 0, 100% 0, calc(100% - 16px) 50%, 100% 100%, 0 100%, 16px 50%)",
    "@media": {
        "(max-width: 860px)": { fontSize: 13, padding: "9px 30px 7px" },
    },
})

globalStyle(`${LARIAT_ROOT} ${splitCredit}::before, ${LARIAT_ROOT} ${splitCredit}::after`, {
    content: '"✦"',
    position: "absolute",
    top: "50%",
    transform: "translateY(-52%)",
    fontSize: 14,
    color: spot1,
})

globalStyle(`${LARIAT_ROOT} ${splitCredit}::before`, { left: 22 })
globalStyle(`${LARIAT_ROOT} ${splitCredit}::after`, { right: 22 })

// The ribbon hangs under the headline, above the reading copy.
globalStyle(`${LARIAT_ROOT} ${split} ${badge}`, { order: -3 })
globalStyle(`${LARIAT_ROOT} ${split} ${headline}`, { order: -2 })

globalStyle(`${LARIAT_ROOT} ${split} ${ctaRow}`, {
    marginTop: scaledSpace(26),
})

// The seal hangs on the photograph's lower right, over the fade.
globalStyle(`${LARIAT_ROOT} ${splitPhoto} ${splitSealSlot}`, {
    top: "auto",
    right: "auto",
    bottom: scaledSpace(34),
    left: "calc(55% - 196px)",
    "@media": {
        "(max-width: 860px)": { position: "absolute", top: 230, bottom: "auto", left: "auto", right: 14 },
    },
})

globalStyle(`${LARIAT_ROOT} ${seal}`, {
    width: 168,
    height: 168,
    padding: 18,
    color: marketing.color.pageBg,
    background: marketing.color.text,
    border: `3px solid ${marketing.color.pageBg}`,
    outline: `2px dashed color-mix(in srgb, ${marketing.color.pageBg} 70%, transparent)`,
    outlineOffset: -12,
    boxShadow: `0 0 0 3px ${marketing.color.text}, ${marketing.shape.shadowCard}`,
    transform: "rotate(-7deg)",
    "@media": {
        "(max-width: 860px)": { width: 120, height: 120, padding: 12 },
    },
})

globalStyle(`${LARIAT_ROOT} ${sealTop}`, {
    fontFamily: marketing.font.display,
    fontWeight: 400,
    fontSize: 15,
    letterSpacing: "0.12em",
})

globalStyle(`${LARIAT_ROOT} ${sealMain}`, {
    fontSize: 28,
    lineHeight: 1,
    whiteSpace: "nowrap",
    color: marketing.color.accent,
    marginTop: 4,
    "@media": {
        "(max-width: 860px)": { fontSize: 19 },
    },
})

globalStyle(`${LARIAT_ROOT} ${sealMain}::after`, {
    content: '"★ ★ ★"',
    display: "block",
    fontSize: 11,
    letterSpacing: "0.3em",
    marginTop: 6,
    color: marketing.color.pageBg,
})
