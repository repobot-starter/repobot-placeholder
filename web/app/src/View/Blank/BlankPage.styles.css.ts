import { keyframes, style } from "@vanilla-extract/css"

// The spaceboy night scene owns its art palette (packs own their art —
// see check-theme-hardcoding.mjs). The scene is copy-free: the crayon
// rocket, its trail, and the sky.
// Neutral near-black, no navy cast — the same two stops as the workspace's
// SpaceboyNightScene and the iOS holding scene, so the crossfade is seamless.
const nightTop = "#050506"
const nightBottom = "#0a0a0c"

const twinkle = keyframes({
    from: { opacity: 0.12 },
    to: { opacity: 0.85 },
})

const sceneIn = keyframes({
    from: { opacity: 0 },
    to: { opacity: 1 },
})

const drift = keyframes({
    from: { transform: "translate(-50%, calc(-50% + 7px))" },
    to: { transform: "translate(-50%, calc(-50% - 7px))" },
})

export const page = style({
    position: "relative",
    minHeight: "100svh",
    overflow: "hidden",
    background: `linear-gradient(180deg, ${nightTop} 0%, ${nightBottom} 100%)`,
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

// Construction-paper grain over the night gradient.
export const grain = style({
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    opacity: 0.07,
    backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E\")",
})

export const scene = style({
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: "min(64vmin, 460px)",
    height: "auto",
    animation: `${sceneIn} 900ms ease both, ${drift} 4.5s ease-in-out infinite alternate`,
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            animation: `${sceneIn} 900ms ease both`,
        },
    },
})
