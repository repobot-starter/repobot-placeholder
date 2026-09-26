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

// Registers bleed ornaments past the column (a rotated seal at the hero's
// edge, tilted prints); they must never turn into a sideways scroll. The
// clip sits on the root element, so it lands on the viewport: clipping an
// ancestor box instead would also stop lazy images in horizontal rails
// from preloading, and would break sticky shells.
globalStyle(`html:has(${page})`, {
    overflowX: "clip",
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

// `confetti` (memphis): the preset's ornament tile (`--marketing-ornament`)
// on a layer under the content column, one page wide and repeating every
// 2200px down. The tile pins its shapes to the page edges, so they sit in
// the gutters; below 1320px the gutters are too narrow to hold a shape
// clear of copy, and the layer steps aside entirely.
globalStyle(`${page}[data-marketing-treatment~="confetti"]`, {
    position: "relative",
    isolation: "isolate",
})

globalStyle(`${page}[data-marketing-treatment~="confetti"]::before`, {
    content: '""',
    position: "absolute",
    inset: 0,
    zIndex: -1,
    pointerEvents: "none",
    backgroundImage: "var(--marketing-ornament, none)",
    backgroundSize: "100% 2200px",
    backgroundRepeat: "repeat-y",
    "@media": {
        "(max-width: 1319px)": { display: "none" },
    },
})

// `two-ink` (riso): every photograph on the page prints through the
// register's two-drum separation (the filter MarketingPage mounts). The
// before/after proof opts back out in its own styles — evidence stays in
// full color.
globalStyle(`${page}[data-marketing-treatment~="two-ink"] img`, {
    filter: "url(#mk-two-ink)",
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

// `lariat` (rodeo): the poster's rope border around the whole bill — the
// preset's ornament is a border-image tile (knotted corners, twisted rope
// edges) drawn on a layer over the page, so the ropes run down both sides
// at every scroll position and close at the top and the foot. The frame
// gets a wider gutter so copy never rides the rope.
globalStyle(`${page}[data-marketing-treatment~="lariat"]`, {
    position: "relative",
})

globalStyle(`${page}[data-marketing-treatment~="lariat"] ${frame}`, {
    paddingLeft: 40,
    paddingRight: 40,
    "@media": {
        "(max-width: 720px)": { paddingLeft: 24, paddingRight: 24 },
    },
})

globalStyle(`${page}[data-marketing-treatment~="lariat"]::after`, {
    content: '""',
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    zIndex: 9999,
    borderStyle: "solid",
    borderColor: "transparent",
    borderWidth: 16,
    borderImageSource: "var(--marketing-ornament, none)",
    borderImageSlice: 16,
    borderImageRepeat: "round",
    "@media": {
        "(max-width: 720px)": { borderWidth: 10 },
    },
})

// `cabana` (palmbeach): the club poster's bamboo frame, the same layered
// border-image as lariat's rope — lashed corners, green canes down every
// edge — with the gutter widened so copy never rides the cane.
globalStyle(`${page}[data-marketing-treatment~="cabana"]`, {
    position: "relative",
})

globalStyle(`${page}[data-marketing-treatment~="cabana"] ${frame}`, {
    paddingLeft: 38,
    paddingRight: 38,
    "@media": {
        "(max-width: 720px)": { paddingLeft: 24, paddingRight: 24 },
    },
})

globalStyle(`${page}[data-marketing-treatment~="cabana"]::after`, {
    content: '""',
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    zIndex: 9999,
    borderStyle: "solid",
    borderColor: "transparent",
    borderWidth: 14,
    borderImageSource: "var(--marketing-ornament, none)",
    borderImageSlice: 14,
    borderImageRepeat: "round",
    "@media": {
        "(max-width: 720px)": { borderWidth: 9 },
    },
})
