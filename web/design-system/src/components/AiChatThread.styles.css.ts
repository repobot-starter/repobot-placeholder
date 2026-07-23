import { keyframes, style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

// Every color routes through the theme contract, so the chat surface follows
// the product's brand (and light/dark mode) with no kernel edits. The chat
// pack renders it inside darkTheme for its night-sky look; any template can
// drop it into its own theme class instead.

export const root = style({
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 0,
    color: vars.color.textPrimary,
    fontFamily: vars.fontFamily.body,
    boxSizing: "border-box",
})

const column = style({
    width: "min(46rem, 100% - 2.5rem)",
    marginInline: "auto",
})

//
// Thread
//

export const thread = style({
    flex: 1,
    overflowY: "auto",
    scrollbarWidth: "thin",
})

export const threadColumn = style([
    column,
    {
        display: "flex",
        flexDirection: "column",
        gap: "1.6rem",
        paddingBlock: `${vars.space.md} ${vars.space.xl}`,
    },
])

export const emptyState = style([
    column,
    {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: vars.space.sm,
        flex: 1,
        textAlign: "center",
        paddingBlock: "4rem",
    },
])

export const emptyTitle = style({
    fontSize: vars.fontSize.xl,
    fontWeight: 600,
    margin: 0,
})

export const emptyHint = style({
    color: vars.color.textSecondary,
    fontSize: vars.fontSize.sm,
    maxWidth: "28rem",
    margin: 0,
    lineHeight: 1.6,
})

export const suggestions = style({
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: vars.space.sm,
    marginTop: vars.space.sm,
})

export const suggestion = style({
    appearance: "none",
    border: `1px solid ${vars.color.border}`,
    background: vars.color.surface,
    color: vars.color.textSecondary,
    fontFamily: vars.fontFamily.body,
    fontSize: vars.fontSize.sm,
    padding: "0.55rem 1rem",
    borderRadius: vars.radius.pill,
    cursor: "pointer",
    ":hover": { color: vars.color.textPrimary, borderColor: vars.color.accent },
})

//
// Messages
//

export const userMessage = style({
    alignSelf: "flex-end",
    maxWidth: "85%",
    background: vars.color.surfaceHover,
    border: `1px solid ${vars.color.accent}`,
    color: vars.color.textPrimary,
    padding: "0.75rem 1.05rem",
    borderRadius: "1.1rem 1.1rem 0.25rem 1.1rem",
    fontSize: vars.fontSize.sm,
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
})

export const assistantBlock = style({
    display: "flex",
    flexDirection: "column",
    gap: "0.7rem",
})

//
// Machinery: reasoning summaries and tool calls
//

export const machineryItem = style({
    border: `1px solid ${vars.color.border}`,
    background: vars.color.surface,
    borderRadius: vars.radius.md,
    padding: "0.6rem 0.85rem",
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
})

export const machineryLabel = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.xs,
    fontFamily: vars.fontFamily.mono,
    fontSize: "0.72rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: vars.color.textSecondary,
    marginBottom: "0.35rem",
})

const pulse = keyframes({
    "0%": { opacity: 0.35 },
    "50%": { opacity: 1 },
    "100%": { opacity: 0.35 },
})

export const machineryActiveDot = style({
    width: "0.42rem",
    height: "0.42rem",
    borderRadius: vars.radius.pill,
    background: vars.color.accent,
    animation: `${pulse} 1.1s ease-in-out infinite`,
})

export const machineryText = style({
    lineHeight: 1.55,
})

export const toolName = style({
    fontFamily: vars.fontFamily.mono,
    color: vars.color.textPrimary,
})

//
// Assistant answer segments
//

export const segmentTitle = style({
    fontSize: vars.fontSize.lg,
    fontWeight: 600,
    margin: 0,
    marginTop: vars.space.xs,
})

export const segmentParagraph = style({
    fontSize: vars.fontSize.sm,
    lineHeight: 1.65,
    color: vars.color.textPrimary,
    margin: 0,
    overflowWrap: "break-word",
})

export const segmentList = style({
    margin: 0,
    paddingLeft: "1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
})

export const segmentListItem = style({
    fontSize: vars.fontSize.sm,
    lineHeight: 1.6,
    color: vars.color.textPrimary,
    selectors: { "&::marker": { color: vars.color.accent } },
})

export const segmentCode = style({
    fontFamily: vars.fontFamily.mono,
    fontSize: vars.fontSize.xs,
    lineHeight: 1.6,
    background: vars.color.surface,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.md,
    padding: "0.85rem 1rem",
    margin: 0,
    overflowX: "auto",
    whiteSpace: "pre",
})

export const segmentQuote = style({
    margin: 0,
    paddingLeft: "0.9rem",
    borderLeft: `3px solid ${vars.color.accent}`,
    color: vars.color.textSecondary,
    fontSize: vars.fontSize.sm,
    lineHeight: 1.6,
})

const blink = keyframes({
    "0%": { opacity: 0 },
    "50%": { opacity: 1 },
    "100%": { opacity: 0 },
})

export const streamingCaret = style({
    display: "inline-block",
    width: "0.55rem",
    height: "1rem",
    marginLeft: "0.25rem",
    verticalAlign: "text-bottom",
    background: vars.color.accent,
    borderRadius: "2px",
    animation: `${blink} 0.9s step-end infinite`,
})

export const errorLine = style({
    color: vars.color.danger,
    fontSize: vars.fontSize.sm,
    lineHeight: 1.5,
})

//
// Composer
//

export const composerBar = style([
    column,
    {
        paddingBlock: `${vars.space.sm} ${vars.space.lg}`,
    },
])

export const composer = style({
    display: "flex",
    alignItems: "flex-end",
    gap: vars.space.sm,
    background: vars.color.surface,
    border: `1px solid ${vars.color.border}`,
    borderRadius: "1.1rem",
    padding: "0.55rem 0.55rem 0.55rem 1.05rem",
    selectors: {
        "&:focus-within": { borderColor: vars.color.accent },
    },
})

export const composerInput = style({
    flex: 1,
    resize: "none",
    border: "none",
    outline: "none",
    background: "transparent",
    color: vars.color.textPrimary,
    fontFamily: vars.fontFamily.body,
    fontSize: vars.fontSize.sm,
    lineHeight: 1.5,
    maxHeight: "9rem",
    paddingBlock: "0.35rem",
    "::placeholder": { color: vars.color.textSecondary },
})

export const sendButton = style({
    appearance: "none",
    border: "none",
    background: vars.color.accent,
    color: vars.color.accentText,
    fontFamily: vars.fontFamily.body,
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
    padding: "0.6rem 1.1rem",
    borderRadius: vars.radius.md,
    cursor: "pointer",
    ":hover": { background: vars.color.accentHover },
    ":disabled": { opacity: 0.45, cursor: "default" },
})

export const stopButton = style({
    appearance: "none",
    border: `1px solid ${vars.color.border}`,
    background: "transparent",
    color: vars.color.textSecondary,
    fontFamily: vars.fontFamily.body,
    fontSize: vars.fontSize.sm,
    fontWeight: 500,
    padding: "0.6rem 1.1rem",
    borderRadius: vars.radius.md,
    cursor: "pointer",
    ":hover": { color: vars.color.textPrimary },
})

export const composerHint = style({
    textAlign: "center",
    color: vars.color.textSecondary,
    fontSize: "0.72rem",
    marginTop: vars.space.sm,
})
