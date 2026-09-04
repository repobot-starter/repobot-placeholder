/**
 * The QuickBooks Sync command-center palette, shared between the
 * vanilla-extract styles and the hand-rolled SVG charts so data ink and
 * chrome always agree. The page force-applies its own dark art direction
 * (the founder's explicit ask): near-black layered surfaces in the same
 * black-and-white register as the other feature showcases — white ink for
 * money coming in, receding gray for money going out — with amber and red
 * held back for "needs attention" and "past due" only.
 */
export const palette = {
    /** Page base and washes. */
    bg: "#0a0a0a",
    /** Card surface gradient stops (top, bottom). */
    surfaceTop: "#171717",
    surfaceBottom: "#0f0f0f",
    /** Slightly raised inner surfaces (tracks, chips). */
    inset: "rgba(255, 255, 255, 0.04)",
    line: "rgba(255, 255, 255, 0.12)",
    lineSoft: "rgba(255, 255, 255, 0.07)",

    ink: "#ececec",
    muted: "#9a9a9a",
    faint: "#6a6a6a",

    /** Money-positive ink (revenue, cash, net). */
    inflow: "#e8ecef",
    inflowBright: "#ffffff",
    inflowSoft: "rgba(255, 255, 255, 0.12)",
    /** Money-out ink (expenses) — recedes behind the white inflow ink. */
    outflow: "#6f7681",
    outflowSoft: "rgba(160, 166, 176, 0.16)",
    /** Warnings (aging, overdue trending). */
    amber: "#fbbf5c",
    amberSoft: "rgba(251, 191, 92, 0.14)",
    /** Danger (past due). */
    red: "#f0958b",
    redSoft: "rgba(240, 149, 139, 0.14)",
    silver: "#c9ced6",
    slate: "#9aa1ac",
} as const

/** Ordered series colors for categorical charts (expense donut): a gray
 * ramp read by lightness, amber last for the long-tail slice. */
export const categorySeries: readonly string[] = [
    palette.inflowBright,
    palette.silver,
    palette.slate,
    palette.outflow,
    "#4b515b",
    "#31353c",
    palette.amber,
]
