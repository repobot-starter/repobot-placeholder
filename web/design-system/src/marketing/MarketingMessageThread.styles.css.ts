import { style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import { section, sectionKicker, sectionTitle } from "./shared.css"

const WIDE = "(min-width: 900px)"

// Phones read the thread before the walkthrough (head, phone, list); wide
// screens set the walkthrough under the head, beside the phone.
export const wrap = style([
    section,
    {
        display: "grid",
        gridTemplateColumns: "1fr",
        gridTemplateAreas: '"head" "phone" "list"',
        gap: scaledSpace(28),
        alignItems: "start",
        "@media": {
            [WIDE]: {
                gridTemplateColumns: "minmax(0, 0.95fr) minmax(0, 1.05fr)",
                gridTemplateRows: "1fr auto 1fr",
                gridTemplateAreas: '"head phone" "list phone" ". phone"',
                columnGap: scaledSpace(64),
                rowGap: scaledSpace(8),
            },
        },
    },
])

export const copy = style({
    gridArea: "head",
    textAlign: "left",
    "@media": {
        [WIDE]: { alignSelf: "end" },
    },
})

export const kicker = sectionKicker

export const title = style([sectionTitle, { margin: `0 0 ${scaledSpace(14)}`, lineHeight: 1.08 }])

export const intro = style({
    fontSize: 17,
    lineHeight: 1.55,
    color: marketing.color.subtle,
    margin: `0 0 ${scaledSpace(24)}`,
    maxWidth: 520,
})

export const walkthrough = style({
    gridArea: "list",
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: scaledSpace(14),
    margin: 0,
    padding: 0,
    maxWidth: 520,
})

export const walkthroughItem = style({
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
    fontSize: 15.5,
    lineHeight: 1.5,
    color: marketing.color.text,
})

export const walkthroughNumber = style({
    flex: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
    borderRadius: "50%",
    fontFamily: marketing.font.display,
    fontSize: 15,
    fontWeight: marketing.display.weight,
    color: marketing.color.onAccent,
    background: marketing.color.accent,
})

/** Places the shared thread card in the section's phone area. */
export const phoneSlot = style({
    gridArea: "phone",
    alignSelf: "center",
    justifySelf: "center",
})
