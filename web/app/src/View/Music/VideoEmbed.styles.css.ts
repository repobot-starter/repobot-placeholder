import { style } from "@vanilla-extract/css"
import { marketing } from "@base/design-system/marketing-theme"

/** The click-to-load video frame: the pack's own poster and a hairline
 * play control — nothing off-register renders until play is pressed. */

const MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace"

export const frame = style({
    position: "relative",
    aspectRatio: "16 / 9",
    overflow: "hidden",
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
})

export const posterButton = style({
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    display: "block",
    padding: 0,
    cursor: "pointer",
    border: "none",
    background: "transparent",
})

export const poster = style({
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    // The register owns the emotion: posters ride slightly desaturated so
    // the frame reads as part of the page, not a thumbnail from elsewhere.
    filter: "grayscale(0.25) contrast(1.04)",
})

export const scrim = style({
    position: "absolute",
    inset: 0,
    // theme-exempt: a neutral black scrim over photography, register-independent
    background: "linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0.08) 55%)",
})

export const chrome = style({
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "18px 22px",
    textAlign: "left",
})

export const playBadge = style({
    flexShrink: 0,
    width: 52,
    height: 52,
    display: "grid",
    placeItems: "center",
    // theme-exempt: white-on-scrim control over photography, register-independent
    color: "#ffffff",
    // theme-exempt: white-on-scrim control over photography, register-independent
    border: "1px solid rgba(255,255,255,0.85)",
    borderRadius: marketing.shape.radiusControl,
    transition: "background 160ms ease, color 160ms ease",
    selectors: {
        [`${posterButton}:hover &`]: {
            // theme-exempt: white-on-scrim control over photography, register-independent
            background: "#ffffff",
            // theme-exempt: black play glyph on the hover-filled control
            color: "#000000",
        },
    },
})

export const caption = style({
    display: "grid",
    gap: 4,
    minWidth: 0,
})

export const captionTitle = style({
    fontFamily: marketing.font.display,
    fontSize: 17,
    fontWeight: 650,
    // theme-exempt: white-on-scrim caption over photography, register-independent
    color: "#ffffff",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
})

export const captionMeta = style({
    fontFamily: MONO,
    fontSize: 10.5,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    // theme-exempt: white-on-scrim caption over photography, register-independent
    color: "rgba(255,255,255,0.72)",
})

export const iframe = style({
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    border: "none",
})
