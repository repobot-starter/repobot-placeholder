import { keyframes, style } from "@vanilla-extract/css"

// The spaceboy night scene owns its art palette (packs own their art —
// see check-theme-hardcoding.mjs). The scene is copy-free: just the boy,
// the moon, and the sky.
const nightTop = "#08090d"
const night = "#0b0c11"
const nightBottom = "#10121a"

const twinkle = keyframes({
    from: { opacity: 0.12 },
    to: { opacity: 0.85 },
})

const sceneIn = keyframes({
    from: { opacity: 0 },
    to: { opacity: 1 },
})

const moonGlowPulse = keyframes({
    "0%, 100%": { opacity: 0.5 },
    "50%": { opacity: 0.85 },
})

export const page = style({
    position: "relative",
    minHeight: "100svh",
    overflow: "hidden",
    background: `linear-gradient(180deg, ${nightTop} 0%, ${night} 45%, ${nightBottom} 100%)`,
})

export const star = style({
    position: "absolute",
    borderRadius: "50%",
    background: "#ffffff",
    animationName: twinkle,
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
    animationDirection: "alternate",
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            animationName: "none",
            opacity: 0.5,
        },
    },
})

export const scene = style({
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    animation: `${sceneIn} 900ms ease both`,
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            animation: "none",
        },
    },
})

export const moonHalo = style({
    animationName: moonGlowPulse,
    animationDuration: "7s",
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            animationName: "none",
        },
    },
})
