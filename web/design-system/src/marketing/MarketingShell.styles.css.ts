import { keyframes, style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { ctaPrimary } from "./shared.css"

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
