import { keyframes, style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"

export const strip = style({
    display: "flex",
    flexWrap: "wrap",
    gap: `${scaledSpace(14)} ${scaledSpace(34)}`,
    justifyContent: "center",
    alignItems: "baseline",
    padding: `${scaledSpace(34)} 0 ${scaledSpace(10)}`,
})

export const label = style({
    width: "100%",
    textAlign: "center",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
    marginBottom: 4,
})

export const item = style({
    // Set as wordmarks — display face, tight caps — so the strip reads as a
    // deliberate row of logos rather than leftover body text.
    fontFamily: marketing.font.display,
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    // Quieter than body-subtle: logos whisper, they don't compete.
    color: `color-mix(in srgb, ${marketing.color.subtle} 72%, ${marketing.color.pageBg})`,
})

/*
 * `marquee`: the text-logo strip on a continuous scroll. Two copies of the
 * group sit back-to-back and the track slides exactly one copy's width
 * (-50%), so the loop point never shows. Edge masks fade the names in and
 * out; hover pauses; reduced-motion falls back to a static centered wrap.
 */
const marqueeSlide = keyframes({
    from: { transform: "translateX(0)" },
    to: { transform: "translateX(-50%)" },
})

export const marqueeWrap = style({
    padding: `${scaledSpace(34)} 0 ${scaledSpace(10)}`,
})

export const marqueeViewport = style({
    overflow: "hidden",
    maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
    WebkitMaskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
})

export const marqueeTrack = style({
    display: "flex",
    width: "max-content",
    animation: `${marqueeSlide} 28s linear infinite`,
    selectors: {
        [`${marqueeViewport}:hover &`]: { animationPlayState: "paused" },
    },
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            animation: "none",
            width: "auto",
            flexWrap: "wrap",
            justifyContent: "center",
        },
    },
})

export const marqueeGroup = style({
    display: "flex",
    alignItems: "baseline",
    gap: scaledSpace(34),
    paddingRight: scaledSpace(34),
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            flexWrap: "wrap",
            justifyContent: "center",
            rowGap: scaledSpace(14),
            // The duplicate copy is redundant when nothing moves.
            selectors: { "&[aria-hidden]": { display: "none" } },
        },
    },
})

/*
 * `ticker`: the marquee mechanics at display scale — monumental stroke-only
 * words rolling the full width, the severe registers' moving set piece.
 * Outline is the variant's identity (not gated on the treatment flag):
 * filled type at this size would shout the section into a wall.
 */
export const tickerWrap = style({
    padding: `${scaledSpace(28)} 0`,
    // The words own the full viewport width; the page column would crop
    // the roll into a window.
    width: "100vw",
    marginLeft: "calc(50% - 50vw)",
})

export const tickerTrack = style([
    marqueeTrack,
    {
        alignItems: "baseline",
        // Monumental words need a slower roll to stay legible in motion.
        animationDuration: "44s",
    },
])

export const tickerItem = style({
    fontFamily: marketing.font.display,
    fontSize: `calc(clamp(44px, 7vw, 84px) * ${marketing.display.scale})`,
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    lineHeight: 1.15,
    color: "transparent",
    WebkitTextStroke: `1.5px color-mix(in srgb, ${marketing.color.text} 60%, transparent)`,
})

export const tickerSeparator = style({
    fontFamily: marketing.font.display,
    fontSize: `calc(clamp(28px, 4vw, 48px) * ${marketing.display.scale})`,
    color: marketing.color.subtle,
    alignSelf: "center",
})

export const metricsRow = style({
    display: "flex",
    flexWrap: "wrap",
    gap: `${scaledSpace(22)} ${scaledSpace(48)}`,
    justifyContent: "center",
    padding: `${scaledSpace(40)} 0 ${scaledSpace(12)}`,
})

export const metric = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
})

export const metricValue = style({
    fontFamily: marketing.font.display,
    fontSize: "clamp(28px, 4vw, 40px)",
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    color: marketing.color.accent,
    lineHeight: 1.1,
})

export const metricLabel = style({
    fontSize: 12.5,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})
