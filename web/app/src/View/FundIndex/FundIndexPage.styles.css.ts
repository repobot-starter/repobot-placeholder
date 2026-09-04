import { globalStyle, style } from "@vanilla-extract/css"

/**
 * The pack's true-black pin. mono-utility's dark reading is the terminal's
 * phosphor ground — a green-tinted near-black — which is right for
 * the dj pack but read as "dark green" on the fund's review. The register
 * itself stays untouched (dj wears it); this wrapper re-pins the dark
 * appearance's ground tokens to neutral true black for fund-index pages
 * only. Scoped by class + mode attribute so the light spec-sheet reading is
 * untouched, and specificity (class + attribute) outranks the preset's
 * single-class theme without touching the inline override channel.
 */
export const blackout = style({})

globalStyle(`${blackout} [data-marketing-preset="mono-utility"][data-marketing-mode="dark"]`, {
    vars: {
        "--marketing-color-pageBg": "#000000", // theme-exempt: the review-mandated true-black re-ground of mono-utility's phosphor dark, this pack only
        "--marketing-color-surface": "#101010", // theme-exempt: neutral lift over the true-black ground, de-greened with it
        "--marketing-color-line": "#2c2c2c", // theme-exempt: neutral hairline for the de-greened ground
        "--marketing-color-text": "#f2f2f2", // theme-exempt: achromatic ink matching the pack's brand pin
        "--marketing-color-subtle": "#9a9a9a", // theme-exempt: neutral subtle ink for the de-greened ground
    },
})
