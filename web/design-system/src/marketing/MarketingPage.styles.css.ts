import { globalStyle, style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"

export const page = style({
    minHeight: "100vh",
    background: marketing.color.pageBg,
    backgroundImage: marketing.background.page,
    color: marketing.color.text,
    fontFamily: marketing.font.body,
    boxSizing: "border-box",
})

globalStyle(`${page} *`, {
    boxSizing: "border-box",
})

export const frame = style({
    width: `min(${marketing.layout.maxWidth}, 100%)`,
    margin: "0 auto",
    padding: "0 24px 56px",
})

// ------------------------------------------------------- surface treatments
// The register-level treatment flags that need page CSS (grain/glow live in
// the presets' authored washes and shadows; outline in the hero styles;
// tilt in the media clusters). Both overlays draw in the register's own
// text ink through color-mix, so one flag reads correctly on either
// appearance — phosphor rows on the tube, ruled rows on the printout.

// `scanline` (crt): the raster made literal — fixed 1px rows over the
// whole viewport, quiet enough to read as glass, not a venetian blind.
globalStyle(`${page}[data-marketing-treatment~="scanline"]::after`, {
    content: '""',
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    zIndex: 9999,
    backgroundImage: `repeating-linear-gradient(0deg, color-mix(in srgb, ${marketing.color.text} 7%, transparent) 0 1px, transparent 1px 3px)`,
})

// `pixel` (handheld): a dithered checker wash — the shading a four-shade
// LCD could actually do — laid over the page like the glass itself.
globalStyle(`${page}[data-marketing-treatment~="pixel"]::after`, {
    content: '""',
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    zIndex: 9999,
    backgroundImage: `repeating-conic-gradient(color-mix(in srgb, ${marketing.color.text} 5%, transparent) 0% 25%, transparent 0% 50%)`,
    backgroundSize: "4px 4px",
})

// ------------------------------------------------------------ baked motion
// The reveal attribute is set exclusively by MarketingPage's observer, so
// these styles can never hide content when JavaScript hasn't run.

globalStyle(`${page} [data-mkreveal]`, {
    opacity: 0,
    transform: "translateY(18px)",
    transition: "opacity 640ms cubic-bezier(0.16, 1, 0.3, 1), transform 640ms cubic-bezier(0.16, 1, 0.3, 1)",
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            opacity: 1,
            transform: "none",
            transition: "none",
        },
    },
})

globalStyle(`${page} [data-mkreveal="in"]`, {
    opacity: 1,
    transform: "none",
})

// Card-shaped content (grids, showcase, blog, team, pricing all render
// <article>) lifts a touch on hover — one uniform, subtle motion signature
// across every preset instead of per-section one-offs.
globalStyle(`${page} article`, {
    transition: "transform 180ms ease",
    "@media": {
        "(prefers-reduced-motion: reduce)": { transition: "none" },
    },
})

globalStyle(`${page} article:hover`, {
    transform: "translateY(-3px)",
    "@media": {
        "(prefers-reduced-motion: reduce)": { transform: "none" },
    },
})
