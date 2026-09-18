import { globalStyle, style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const form = style({})

// rjsf wraps everything in nested divs; keep the root fieldset invisible.
globalStyle(`${form} fieldset`, {
    border: "none",
    margin: 0,
    padding: 0,
    minWidth: 0,
})

export const field = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.xs,
    marginBottom: vars.space.md,
})

export const description = style({
    margin: 0,
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
})

export const fieldError = style({
    margin: 0,
    fontSize: vars.fontSize.xs,
    color: vars.color.danger,
})

export const objectContainer = style({
    display: "flex",
    flexDirection: "column",
})

/** Nested objects: a titled section set off by a hairline. */
export const objectSection = style({
    display: "flex",
    flexDirection: "column",
    marginBottom: vars.space.md,
    paddingTop: vars.space.md,
    borderTop: `1px solid ${vars.color.border}`,
})

export const objectGrid = style({
    display: "flex",
    flexDirection: "column",
})

/** `"ui:options": { "columns": 2 }` — scalar fields pair up; big fields span. */
export const objectGridTwoColumn = style({
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    columnGap: vars.space.md,
    "@media": {
        "screen and (max-width: 560px)": {
            gridTemplateColumns: "minmax(0, 1fr)",
        },
    },
})

export const gridItemFull = style({
    gridColumn: "1 / -1",
})

export const sectionTitle = style({
    margin: `0 0 ${vars.space.sm}`,
    fontSize: vars.fontSize.md,
    fontWeight: 700,
    color: vars.color.textPrimary,
})

/** Multi-select enum (uniqueItems array): a stacked checkbox group. */
export const checkboxGroup = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.sm,
})

export const checkboxGroupInline = style({
    display: "flex",
    flexWrap: "wrap",
    gap: vars.space.lg,
})

// ------------------------------------------------------------------ arrays

export const arrayContainer = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.sm,
    marginBottom: vars.space.md,
})

export const arrayEmpty = style({
    margin: 0,
    fontSize: vars.fontSize.sm,
    color: vars.color.textSecondary,
})

/** One entry: fields on the left, a slim control rail on the right. */
export const arrayItem = style({
    display: "flex",
    alignItems: "flex-start",
    gap: vars.space.sm,
    padding: vars.space.md,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.md,
    backgroundColor: vars.color.surface,
})

export const arrayItemBody = style({
    flex: 1,
    minWidth: 0,
})

// The entry card carries the spacing; the last field shouldn't add more.
globalStyle(`${arrayItemBody} > div > ${field}:last-child, ${arrayItemBody} > ${field}:last-child`, {
    marginBottom: 0,
})

export const arrayItemControls = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.xxs,
    flexShrink: 0,
})

export const arrayControlButton = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "26px",
    height: "26px",
    padding: 0,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.sm,
    backgroundColor: "transparent",
    color: vars.color.textSecondary,
    fontSize: vars.fontSize.sm,
    lineHeight: 1,
    cursor: "pointer",
    transition: `background-color ${vars.motion.durationFast} ${vars.motion.easing}, color ${vars.motion.durationFast} ${vars.motion.easing}`,
    selectors: {
        "&:hover:not(:disabled)": {
            backgroundColor: vars.color.surfaceHover,
            color: vars.color.textPrimary,
        },
        "&:disabled": {
            opacity: 0.4,
            cursor: "not-allowed",
        },
    },
})

export const arrayControlDanger = style({
    selectors: {
        "&:hover:not(:disabled)": {
            backgroundColor: vars.color.dangerSurface,
            color: vars.color.danger,
            borderColor: vars.color.danger,
        },
    },
})

// ------------------------------------------------------------------ wizard

export const wizard = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.md,
})

export const stepHeader = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.md,
    margin: 0,
    padding: 0,
    listStyle: "none",
    flexWrap: "wrap",
})

export const stepEntry = style({
    display: "inline-flex",
    alignItems: "center",
    gap: vars.space.xs,
    color: vars.color.textSecondary,
    selectors: {
        '&[data-state="current"]': { color: vars.color.textPrimary },
        // The connector between entries.
        "&:not(:first-child)::before": {
            content: "",
            width: "18px",
            height: "1px",
            marginRight: vars.space.xs,
            backgroundColor: vars.color.border,
        },
    },
})

export const stepIndex = style({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "20px",
    height: "20px",
    flexShrink: 0,
    borderRadius: vars.radius.pill,
    border: `1px solid ${vars.color.border}`,
    fontSize: vars.fontSize.xs,
    fontWeight: 700,
    selectors: {
        [`${stepEntry}[data-state="current"] &`]: {
            borderColor: vars.color.accent,
            backgroundColor: vars.color.accent,
            color: vars.color.accentText,
        },
        [`${stepEntry}[data-state="done"] &`]: {
            borderColor: vars.color.accent,
            color: vars.color.accent,
        },
    },
})

export const stepTitle = style({
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
})

export const stepDescription = style({
    margin: 0,
    fontSize: vars.fontSize.sm,
    color: vars.color.textSecondary,
})
