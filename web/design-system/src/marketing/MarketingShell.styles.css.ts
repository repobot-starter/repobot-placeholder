import { globalStyle, keyframes, style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import {
    ATOMIC_ROOT,
    BRUSH_MASK,
    COLORBLOCK_ROOT,
    LACQUER_ROOT,
    LARIAT_ROOT,
    METALLIC_ROOT,
    MIRRORBALL_ROOT,
    TAPED_ROOT,
    TWO_INK_ROOT,
    ZINE_ROOT,
    atomicStar,
    captionFontStack,
    chromeFill,
    ctaPrimary,
    metalText,
    pulpExtrude,
    scriptFont,
    spot1,
    spot2,
} from "./shared.css"

const MOBILE = "(max-width: 720px)"

export const announcement = style({
    display: "block",
    textAlign: "center",
    padding: "9px 16px",
    fontSize: 13,
    fontWeight: 600,
    color: marketing.color.text,
    background: marketing.color.accentSoft,
    borderBottom: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: `0 0 ${marketing.shape.radiusControl} ${marketing.shape.radiusControl}`,
})

export const stickyWrap = style({
    position: "sticky",
    top: 0,
    zIndex: 30,
    // Bleeds the sticky bar over the frame's horizontal padding so the
    // floating treatment hangs edge-to-edge of the content column.
    margin: "0 -12px",
    padding: "8px 12px",
})

export const bar = style({
    display: "flex",
    alignItems: "center",
    gap: 20,
    padding: "12px 14px",
    borderRadius: marketing.shape.radiusCard,
    border: `${marketing.shape.borderWidth} solid transparent`,
    transition: "background 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
    "@media": {
        "(prefers-reduced-motion: reduce)": { transition: "none" },
    },
})

/** Applied once the page scrolls: the bar lifts into a floating card. */
export const barScrolled = style({
    background: `color-mix(in srgb, ${marketing.color.pageBg} 82%, transparent)`,
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    borderColor: marketing.color.line,
    boxShadow: marketing.shape.shadowCard,
})

export const barCentered = style({
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    "@media": {
        [MOBILE]: { display: "flex" },
    },
})

/**
 * `full-width`: the sticky wrap bleeds past the content column to the
 * viewport edges so the bar sits flush against the top of the page.
 */
export const stickyWrapFullWidth = style({
    margin: "0 calc(50% - 50vw)",
    padding: 0,
})

/** `split` / `logo-only` sit flush in the column: no inset, square corners. */
export const stickyWrapFlush = style({
    margin: 0,
    padding: 0,
})

/**
 * The `full-width` bar: a translucent, blurred band with a hairline rule,
 * edge-to-edge. The row inside (`fullWidthInner`) re-constrains content to
 * the preset's max width so links line up with the page column.
 */
export const barFullWidth = style({
    display: "block",
    padding: 0,
    borderRadius: 0,
    borderBottom: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    background: `color-mix(in srgb, ${marketing.color.pageBg} 72%, transparent)`,
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
})

export const barFullWidthScrolled = style({
    background: `color-mix(in srgb, ${marketing.color.pageBg} 90%, transparent)`,
    boxShadow: marketing.shape.shadowCard,
})

export const fullWidthInner = style({
    display: "flex",
    alignItems: "center",
    gap: 20,
    width: `min(${marketing.layout.maxWidth}, 100%)`,
    margin: "0 auto",
    padding: "13px 24px",
    position: "relative",
})

/**
 * The flush bands (`split` / `centered` / `burger-overlay`) bleed to the
 * viewport edges — the hero full-bleed move: negative margins carry the
 * bar out of the content column and the inline padding carries the
 * content back into it. The bands' rules and scrolled veils span the
 * whole page. Before this, the bar (and the scrolled blur veil with it)
 * stopped at the column edge, 2px from the first and last nav items:
 * with the page scrolling visibly in the gutters beside the veil, the
 * links read as cropped against a hard boundary — the nonprofit and
 * community packs' review flag, and the same pathology on every register
 * wearing a flush variant.
 */
const FLUSH_BLEED_MARGIN = "0 calc(50% - 50vw)"
const flushBleedPadding = (vertical: string) => `${vertical} calc(50vw - 50% + 2px)`

/** The `split` bar: taller, squared, always ruled underneath — no card. */
export const barSplit = style({
    margin: FLUSH_BLEED_MARGIN,
    padding: flushBleedPadding("18px"),
    borderRadius: 0,
    borderBottom: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
})

/**
 * The `centered` bar: a flush masthead band ruled underneath — the program
 * at the door, the gallery's letterhead. Deliberately not the inset card:
 * each variant carries its own silhouette, or they all read as one navbar.
 */
export const barMasthead = style({
    margin: FLUSH_BLEED_MARGIN,
    padding: flushBleedPadding("16px"),
    borderRadius: 0,
    borderBottom: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
})

/**
 * The `burger-overlay` bar: chromeless — a wordmark and a burger floating
 * over the page with no card, so full-bleed frames own the viewport. Scroll
 * adds only the blur veil for legibility.
 */
export const barChromeless = style({
    margin: FLUSH_BLEED_MARGIN,
    padding: flushBleedPadding("16px"),
    borderRadius: 0,
})

/** Scroll treatment for the flush variants: a blur veil instead of a card. */
export const barFlushScrolled = style({
    background: `color-mix(in srgb, ${marketing.color.pageBg} 86%, transparent)`,
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
})

/** `pill-links`: logo / pill cluster / CTA on a three-column grid. */
export const barPills = style({
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    "@media": {
        [MOBILE]: { display: "flex" },
    },
})

/** `logo-only`: the mark alone, roomier, chrome appearing only on scroll. */
export const barLogoOnly = style({
    justifyContent: "center",
    padding: "20px 14px",
    borderRadius: 0,
})

export const barLogoOnlyScrolled = style({
    borderBottomColor: marketing.color.line,
})

export const logo = style({
    display: "flex",
    alignItems: "center",
    gap: 9,
    fontFamily: marketing.font.display,
    fontWeight: 700,
    fontSize: 19,
    letterSpacing: "-0.01em",
    color: marketing.color.text,
    textDecoration: "none",
})

export const logoCentered = style({
    justifySelf: "center",
})

/** The logo's home link — visually silent, the mark carries the weight. */
export const logoLink = style({
    display: "inline-flex",
    alignItems: "center",
    textDecoration: "none",
    color: "inherit",
})

/** The committed brand logo, capped to the nav's wordmark height. */
export const logoImage = style({
    display: "block",
    height: 30,
    width: "auto",
    maxWidth: 220,
    objectFit: "contain",
})

/** A brand mark beside the wordmark (`logo.markSrc`), in the wordmark's ink. */
export const logoMarked = style({
    display: "inline-flex",
    alignItems: "center",
    gap: 12,
    color: marketing.color.text,
})

export const logoMark = style({
    flexShrink: 0,
    display: "block",
    width: 50,
    height: 44,
    background: "currentColor",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    "@media": {
        [MOBILE]: { width: 40, height: 36 },
    },
})

/** Two-line brand wordmark: name above, tagline as a small caps line. */
export const logoStack = style({
    display: "inline-flex",
    flexDirection: "column",
    gap: 2,
})

export const logoTagline = style({
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})

export const links = style({
    display: "flex",
    alignItems: "center",
    gap: 18,
    marginLeft: "auto",
    fontSize: 14,
    color: marketing.color.subtle,
    "@media": {
        [MOBILE]: { display: "none" },
    },
})

export const linksCentered = style({
    marginLeft: 0,
    justifySelf: "start",
})

export const link = style({
    color: "inherit",
    textDecoration: "none",
    selectors: { "&:hover": { color: marketing.color.text } },
})

/** `split`: links carry full text color with wider tracking between them. */
export const linksSplit = style({
    gap: 28,
    color: marketing.color.text,
    fontWeight: 500,
})

/** `split` link treatment: an accent underline grows in on hover. */
export const linkUnderline = style({
    color: "inherit",
    textDecoration: "none",
    paddingBottom: 3,
    backgroundImage: `linear-gradient(${marketing.color.accent}, ${marketing.color.accent})`,
    backgroundSize: "0% 1.5px",
    backgroundPosition: "0 100%",
    backgroundRepeat: "no-repeat",
    transition: "background-size 160ms ease",
    selectors: { "&:hover": { backgroundSize: "100% 1.5px" } },
    "@media": {
        "(prefers-reduced-motion: reduce)": { transition: "none" },
    },
})

/**
 * `pill-links`: the link row lives in a bordered cluster whose geometry
 * follows the preset's control radius (a pill under `warm-boutique`, a
 * squared segment strip under `brutalist`).
 */
export const pillBox = style({
    alignItems: "center",
    gap: 2,
    padding: 4,
    marginLeft: 0,
    justifySelf: "center",
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: `calc(${marketing.shape.radiusControl} + 4px)`,
    background: `color-mix(in srgb, ${marketing.color.surface} 72%, transparent)`,
})

export const linkPill = style({
    padding: "6px 14px",
    borderRadius: marketing.shape.radiusControl,
    color: "inherit",
    textDecoration: "none",
    transition: "background 120ms ease, color 120ms ease",
    selectors: {
        "&:hover": { background: marketing.color.accentSoft, color: marketing.color.text },
    },
    "@media": {
        "(prefers-reduced-motion: reduce)": { transition: "none" },
    },
})

// ------------------------------------------------------------ hover menu

/** Chevron on links that carry a menu; rotates while the panel is open. */
export const linkChevron = style({
    display: "inline-block",
    marginLeft: 5,
    verticalAlign: "middle",
    transition: "transform 140ms ease",
    "@media": {
        "(prefers-reduced-motion: reduce)": { transition: "none" },
    },
})

export const linkChevronOpen = style({
    transform: "rotate(180deg)",
})

const menuRise = keyframes({
    from: { opacity: 0, transform: "translateY(-6px)" },
    to: { opacity: 1, transform: "none" },
})

/**
 * The hover panel: a floating card under the bar, constrained to the
 * content column whatever the nav variant's own geometry (the full-width
 * band, the inset card) so entries line up with the page. Desktop only —
 * menus flatten into the burger overlay on mobile.
 */
export const menuPanel = style({
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    margin: "0 auto",
    width: `min(calc(${marketing.layout.maxWidth} - 48px), calc(100% - 48px))`,
    padding: 26,
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    zIndex: 31,
    animation: `${menuRise} 180ms ease both`,
    "@media": {
        [MOBILE]: { display: "none" },
        "(prefers-reduced-motion: reduce)": { animation: "none" },
    },
})

export const menuColumns = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 22,
})

export const menuColumnTitle = style({
    display: "block",
    fontSize: 11.5,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
    margin: "0 10px 8px",
})

export const menuEntry = style({
    display: "block",
    padding: "9px 10px",
    borderRadius: marketing.shape.radiusControl,
    textDecoration: "none",
    transition: "background 120ms ease",
    selectors: {
        "&:hover": { background: marketing.color.accentSoft },
    },
    "@media": {
        "(prefers-reduced-motion: reduce)": { transition: "none" },
    },
})

export const menuEntryLabel = style({
    display: "block",
    fontSize: 14,
    fontWeight: 600,
    color: marketing.color.text,
})

export const menuEntryDescription = style({
    display: "block",
    marginTop: 2,
    fontSize: 12.5,
    lineHeight: 1.45,
    color: marketing.color.subtle,
})

/** Menu entries flattened into the mobile overlay, under their parent link. */
export const overlaySubLink = style({
    fontSize: 17,
    fontWeight: 500,
    color: marketing.color.subtle,
    textDecoration: "none",
    padding: "4px 0 4px 18px",
    selectors: { "&:hover": { color: marketing.color.text } },
})

export const cta = style([
    ctaPrimary,
    {
        fontSize: 14,
        padding: "9px 16px",
        "@media": {
            [MOBILE]: { display: "none" },
        },
    },
])

export const ctaCentered = style({
    justifySelf: "end",
})

/** `split`: the CTA is the bar's strongest element — a size up from inline. */
export const ctaSplit = style({
    fontSize: 14,
    padding: "10px 20px",
})

/** Pushes the CTA to the far edge when there is no link row. */
export const ctaSlot = style({
    marginLeft: "auto",
})

export const burger = style({
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
    marginLeft: "auto",
    padding: 0,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusControl,
    background: "transparent",
    color: marketing.color.text,
    cursor: "pointer",
    "@media": {
        [MOBILE]: { display: "flex" },
    },
})

/** The `burger-overlay` variant shows the burger at every width. */
export const burgerAlways = style({
    display: "flex",
})

/** `burger-overlay` hides the inline chrome at every width, not just mobile. */
export const hiddenInline = style({
    display: "none",
})

export const overlay = style({
    position: "fixed",
    inset: 0,
    zIndex: 40,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "24px",
    background: marketing.color.pageBg,
    backgroundImage: marketing.background.page,
    color: marketing.color.text,
    fontFamily: marketing.font.body,
})

export const overlayTop = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
})

export const overlayLink = style({
    fontFamily: marketing.font.display,
    fontSize: "clamp(28px, 6vw, 44px)",
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    color: marketing.color.text,
    textDecoration: "none",
    padding: "8px 0",
    selectors: { "&:hover": { color: marketing.color.accent } },
})

export const overlayCta = style([
    ctaPrimary,
    {
        alignSelf: "flex-start",
        marginTop: 16,
    },
])

export const close = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
    padding: 0,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusControl,
    background: "transparent",
    color: marketing.color.text,
    cursor: "pointer",
    fontSize: 18,
})

// ------------------------------------------------------------------ footer

export const footer = style({
    marginTop: 64,
    paddingTop: 32,
    borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    fontSize: 13,
    color: marketing.color.subtle,
})

export const footerSimple = style({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
})

export const footerGrid = style({
    display: "grid",
    gridTemplateColumns: "minmax(200px, 1.4fr) repeat(auto-fit, minmax(140px, 1fr))",
    gap: 32,
    "@media": {
        [MOBILE]: { gridTemplateColumns: "1fr" },
    },
})

export const footerBrand = style({
    display: "flex",
    flexDirection: "column",
    gap: 10,
    maxWidth: 320,
})

export const footerBlurb = style({
    margin: 0,
    lineHeight: 1.6,
})

export const footerColumn = style({
    display: "flex",
    flexDirection: "column",
    gap: 8,
})

export const footerColumnTitle = style({
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: marketing.color.text,
    marginBottom: 4,
})

export const footerLink = style({
    color: marketing.color.subtle,
    textDecoration: "none",
    selectors: { "&:hover": { color: marketing.color.text } },
})

export const footerNewsletter = style({
    display: "flex",
    flexDirection: "column",
    gap: 10,
})

export const footerNewsletterTitle = style({
    margin: 0,
    fontFamily: marketing.font.display,
    fontSize: 16,
    fontWeight: 700,
    color: marketing.color.text,
})

export const footerNote = style({
    marginTop: 28,
    paddingTop: 16,
    borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    textAlign: "center",
})

/*
 * `sport` (gameday): the wordmark is the kit's — condensed italic caps with
 * the tagline tracked wide between accent rules; the links set in the
 * display face like a scoreboard's labels.
 */
const SPORT_ROOT = '[data-marketing-treatment~="sport"]'

globalStyle(`${SPORT_ROOT} ${logo}`, {
    fontStyle: "italic",
    fontWeight: 800,
    fontSize: 31,
    lineHeight: 0.9,
    letterSpacing: "0.01em",
    textTransform: "uppercase",
})

globalStyle(`${SPORT_ROOT} ${logoTagline}`, {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.42em",
    color: marketing.color.text,
})

globalStyle(`${SPORT_ROOT} ${logoTagline}::before, ${SPORT_ROOT} ${logoTagline}::after`, {
    content: '""',
    flex: "1 1 12px",
    height: 2,
    background: marketing.color.accent,
})

globalStyle(`${SPORT_ROOT} ${links}`, {
    fontFamily: marketing.font.display,
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: marketing.color.text,
})

/*
 * `two-ink` (riso): the bar is the poster's top line — the wordmark set
 * in the condensed caps at poster size over its tagline, the links in
 * tracked caps, no rule under the band (the print below starts the sheet).
 */
globalStyle(`${TWO_INK_ROOT} ${logo}`, {
    fontSize: 30,
    fontWeight: 800,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
    lineHeight: 0.95,
})

globalStyle(`${TWO_INK_ROOT} ${logoTagline}`, {
    fontFamily: marketing.font.display,
    fontSize: 12.5,
    fontWeight: 700,
    letterSpacing: "0.16em",
    color: marketing.color.text,
})

globalStyle(`${TWO_INK_ROOT} ${links}`, {
    gap: 30,
    fontFamily: marketing.font.display,
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: marketing.color.text,
})

/*
 * `pulp` (creature): the wordmark is the one-sheet's title lettering —
 * poster caps extruded in the accent, the tagline a spot-ink billing line
 * between stars; the links in the poster face.
 */
const PULP_ROOT = '[data-marketing-treatment~="pulp"]'

globalStyle(`${PULP_ROOT} ${logo}`, {
    fontWeight: 400,
    fontSize: 34,
    lineHeight: 0.9,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
    textShadow: pulpExtrude(3),
})

globalStyle(`${PULP_ROOT} ${logoStack}`, { alignItems: "center", gap: 4 })

globalStyle(`${PULP_ROOT} ${logoTagline}`, {
    fontFamily: marketing.font.display,
    fontSize: 14,
    fontWeight: 400,
    letterSpacing: "0.22em",
    color: spot1,
})

globalStyle(`${PULP_ROOT} ${logoTagline}::before`, { content: '"★ "' })
globalStyle(`${PULP_ROOT} ${logoTagline}::after`, { content: '" ★"' })

globalStyle(`${PULP_ROOT} ${links}`, {
    fontFamily: marketing.font.display,
    fontSize: 19,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: marketing.color.text,
})

globalStyle(`${TWO_INK_ROOT} ${barFullWidth}`, {
    borderBottom: "none",
})

globalStyle(`${TWO_INK_ROOT} ${fullWidthInner}`, {
    padding: "16px 24px 14px",
})

/*
 * `colorblock` (paintchip): the deck-spine masthead — the wordmark in
 * wide-tracked heavy caps, the links in small tracked caps.
 */
globalStyle(`${COLORBLOCK_ROOT} ${logo}`, {
    fontSize: 21,
    fontWeight: 800,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
})

globalStyle(`${COLORBLOCK_ROOT} ${links}`, {
    gap: 26,
    fontSize: 12.5,
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: marketing.color.text,
})

/*
 * The wordmark under the lettering treatments. `signpaint`: show-card
 * caps with the painted drop shade, the tagline brushed in script;
 * `linework`: the tagline as a tracked spark-ink label under the wide
 * caps; `sunburst`: the fat rounded name over a tracked line in the
 * cool ink pressed toward the text color.
 */
const SIGNPAINT_ROOT = '[data-marketing-treatment~="signpaint"]'
const LINEWORK_ROOT = '[data-marketing-treatment~="linework"]'
const SUNBURST_ROOT = '[data-marketing-treatment~="sunburst"]'

globalStyle(`${SIGNPAINT_ROOT} ${logo}`, {
    fontSize: 25,
    fontWeight: marketing.display.weight,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
    lineHeight: 1,
    textShadow: `0.05em 0.06em 0 var(--marketing-spot-1, ${marketing.color.accent})`,
})

globalStyle(`${SIGNPAINT_ROOT} ${logoTagline}`, {
    fontFamily: `var(--marketing-font-script, ${marketing.font.display})`,
    fontSize: 16,
    fontWeight: 400,
    letterSpacing: 0,
    textTransform: "none",
    textShadow: "none",
    color: marketing.color.accent,
})

globalStyle(`${LINEWORK_ROOT} ${logo}`, {
    fontSize: 17,
    fontWeight: marketing.display.weight,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
})

globalStyle(`${LINEWORK_ROOT} ${logoTagline}`, {
    fontFamily: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 10.5,
    fontWeight: 600,
    letterSpacing: "0.34em",
    color: `var(--marketing-spot-1, ${marketing.color.accent})`,
})

globalStyle(`${SUNBURST_ROOT} ${logo}`, {
    fontSize: 24,
    fontWeight: marketing.display.weight,
    lineHeight: 1,
    color: marketing.color.accent,
})

globalStyle(`${SUNBURST_ROOT} ${logoTagline}`, {
    fontSize: 10.5,
    fontWeight: 800,
    letterSpacing: "0.22em",
    color: `color-mix(in srgb, var(--marketing-spot-2, ${marketing.color.accent}) 55%, ${marketing.color.text})`,
})

// metallic: the wordmark cast in chrome, italic and wide, over its place
// line in gold condensed caps; the section links tracked condensed caps.
globalStyle(`${METALLIC_ROOT} ${logo}`, {
    ...metalText(chromeFill, "0.03em"),
    fontStyle: "italic",
    fontStretch: "112%",
    fontWeight: 900,
    fontSize: 22,
    lineHeight: 1,
    letterSpacing: "-0.01em",
    textTransform: "uppercase",
})

globalStyle(`${METALLIC_ROOT} ${logoTagline}`, {
    fontFamily: marketing.font.display,
    fontStretch: "75%",
    fontWeight: 700,
    fontSize: 11.5,
    letterSpacing: "0.3em",
    color: spot1,
})

globalStyle(`${METALLIC_ROOT} ${links}`, {
    fontFamily: marketing.font.display,
    fontStretch: "78%",
    fontWeight: 800,
    fontSize: 15,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: spot1,
})

// lacquer: the letterhead — the name in the Didone, the line under it in
// tiny spaced blush caps, the links small and widely tracked.
globalStyle(`${LACQUER_ROOT} ${logo}`, {
    fontWeight: 500,
    fontSize: 25,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
})

globalStyle(`${LACQUER_ROOT} ${logoTagline}`, {
    fontWeight: 400,
    fontSize: 10.5,
    letterSpacing: "0.46em",
    color: spot1,
})

globalStyle(`${LACQUER_ROOT} ${links}`, {
    fontSize: 12,
    fontWeight: 400,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
})

/*
 * `atomic` (midcentury): the catalog's masthead. An atomic star in the
 * accent leads the wordmark, set as two lines of tracked geometric caps
 * over its city in the olive ink; a hairline rules the mark off from the
 * links, which follow it rather than flee to the far edge; the ask holds
 * the corner.
 */
globalStyle(`${ATOMIC_ROOT} ${logoLink}`, {
    gap: 14,
    paddingRight: 30,
    alignSelf: "stretch",
    borderRight: `1px solid ${marketing.color.line}`,
    "@media": {
        [MOBILE]: { paddingRight: 0, borderRight: "none" },
    },
})

globalStyle(`${ATOMIC_ROOT} ${logoLink}::before`, atomicStar(38, marketing.color.accent))

globalStyle(`${ATOMIC_ROOT} ${logo}`, {
    fontFamily: marketing.font.body,
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 1.18,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    maxWidth: "11.5em",
})

globalStyle(`${ATOMIC_ROOT} ${logoTagline}`, {
    marginTop: 3,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.28em",
    color: `color-mix(in srgb, ${spot2} 82%, ${marketing.color.text})`,
})

globalStyle(`${ATOMIC_ROOT} ${barSplit}`, {
    paddingTop: 14,
    paddingBottom: 14,
})

globalStyle(`${ATOMIC_ROOT} ${linksSplit}`, {
    gap: 36,
    marginLeft: 36,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
})

globalStyle(`${ATOMIC_ROOT} ${ctaSplit}`, {
    marginLeft: "auto",
})

/*
 * `zine` (photobooth): the wordmark typed in caps with a pink sticker dot
 * after the names, the place stamped under it; links typed in ink.
 * `mirrorball` (disco): the name in pink script beside a little mirror
 * ball, the links tracked gold caps between hairline rules over a gold
 * foil line.
 */
globalStyle(`${ZINE_ROOT} ${logo}`, {
    fontFamily: captionFontStack,
    fontSize: 19,
    fontWeight: 700,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
})

globalStyle(`${ZINE_ROOT} ${logo}::after`, {
    content: '""',
    width: "0.62em",
    height: "0.62em",
    marginLeft: 2,
    borderRadius: "50%",
    background: marketing.color.accent,
})

globalStyle(`${ZINE_ROOT} ${logoTagline}`, {
    fontFamily: captionFontStack,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.08em",
    color: marketing.color.text,
})

globalStyle(`${ZINE_ROOT} ${links}`, {
    fontFamily: captionFontStack,
    fontSize: 14.5,
    fontWeight: 500,
    color: marketing.color.text,
})

globalStyle(`${ZINE_ROOT} ${barSplit}`, { borderBottomColor: "transparent" })

globalStyle(`${MIRRORBALL_ROOT} ${barSplit}`, {
    borderBottomColor: `color-mix(in srgb, ${spot2} 70%, transparent)`,
})

globalStyle(`${MIRRORBALL_ROOT} ${logo}`, {
    gap: 12,
    fontFamily: scriptFont,
    fontSize: 32,
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: 1,
    color: spot1,
})

globalStyle(`${MIRRORBALL_ROOT} ${logo}::after`, {
    content: '""',
    width: 26,
    height: 32,
    backgroundImage: "var(--marketing-ornament, none)",
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
})

globalStyle(`${MIRRORBALL_ROOT} ${links}`, {
    gap: 0,
    fontFamily: marketing.font.body,
    fontSize: 13.5,
    fontWeight: 600,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: spot2,
})

globalStyle(`${MIRRORBALL_ROOT} ${links} > a`, { padding: "2px 18px" })

globalStyle(`${MIRRORBALL_ROOT} ${links} > a + a`, {
    borderLeft: `1px solid color-mix(in srgb, ${spot2} 60%, transparent)`,
})

/*
 * `taped` wordmark: the name in the heavy condensed face, the tagline set
 * beside it, and one red marker swipe underlining both.
 */
globalStyle(`${TAPED_ROOT} ${logo}`, { fontSize: 30, fontWeight: 900, letterSpacing: "-0.005em" })

globalStyle(`${TAPED_ROOT} ${logoStack}`, {
    position: "relative",
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    paddingBottom: 9,
})

globalStyle(`${TAPED_ROOT} ${logoStack}::after`, {
    content: '""',
    position: "absolute",
    left: -4,
    right: -6,
    bottom: 0,
    height: 9,
    background: marketing.color.accent,
    WebkitMaskImage: BRUSH_MASK,
    maskImage: BRUSH_MASK,
    WebkitMaskSize: "100% 100%",
    maskSize: "100% 100%",
})

globalStyle(`${TAPED_ROOT} ${logoTagline}`, {
    fontFamily: marketing.font.body,
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: 0,
    textTransform: "none",
    color: marketing.color.text,
    "@media": {
        [MOBILE]: { display: "none" },
    },
})

/*
 * `lariat` nav: the ranch sign. The name in wood-type caps beside its brand
 * mark, the links lettered in turquoise caps with a star between each.
 */
globalStyle(`${LARIAT_ROOT} ${logo}`, {
    fontSize: 21,
    fontWeight: 400,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
})

globalStyle(`${LARIAT_ROOT} ${logoTagline}`, {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.22em",
    color: marketing.color.text,
})

globalStyle(`${LARIAT_ROOT} ${links}`, {
    gap: 0,
    fontFamily: marketing.font.display,
    fontSize: 16,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: spot1,
})

globalStyle(
    `${LARIAT_ROOT} ${link} + ${link}::before, ${LARIAT_ROOT} ${linkUnderline} + ${linkUnderline}::before`,
    {
        content: '"★"',
        display: "inline-block",
        margin: "0 16px",
        fontSize: 11,
        verticalAlign: "0.18em",
        color: marketing.color.accent,
    },
)

globalStyle(`${LARIAT_ROOT} ${links} > :last-child`, { marginRight: 14 })
