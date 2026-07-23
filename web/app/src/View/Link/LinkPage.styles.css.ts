import { globalStyle, keyframes, style } from "@vanilla-extract/css"

/**
 * Every color reads from a `--lb-*` custom property that LinkPage sets from
 * the active theme in content.ts, so switching themes is a data change — no
 * styles are duplicated per palette.
 */

const rise = keyframes({
    from: { opacity: 0, transform: "translateY(14px)" },
    to: { opacity: 1, transform: "translateY(0)" },
})

export const page = style({
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    padding: "48px 16px 32px",
    background: "var(--lb-background)",
    color: "var(--lb-text)",
    fontFamily: '-apple-system, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    boxSizing: "border-box",
    transition: "background 300ms ease, color 300ms ease",
})

globalStyle(`${page} *`, {
    boxSizing: "border-box",
})

export const column = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "min(560px, 100%)",
    gap: 24,
})

export const header = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    textAlign: "center",
    animation: `${rise} 480ms ease both`,
})

export const avatar = style({
    width: 96,
    height: 96,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 44,
    background: "var(--lb-surface)",
    border: "3px solid var(--lb-accent)",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.18)",
    marginBottom: 8,
})

export const name = style({
    margin: 0,
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: "-0.02em",
})

export const handle = style({
    fontSize: 15,
    fontWeight: 600,
    color: "var(--lb-accent)",
})

export const bio = style({
    margin: "6px 0 0",
    maxWidth: 420,
    fontSize: 15,
    lineHeight: 1.5,
    color: "var(--lb-subtle)",
})

export const location = style({
    fontSize: 13,
    color: "var(--lb-subtle)",
})

export const socialRow = style({
    display: "flex",
    gap: 10,
    animation: `${rise} 480ms ease 80ms both`,
})

export const socialChip = style({
    width: 40,
    height: 40,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 700,
    color: "var(--lb-text)",
    background: "var(--lb-surface)",
    border: "1px solid var(--lb-border)",
    textDecoration: "none",
    transition: "transform 150ms ease, border-color 150ms ease",
    selectors: {
        "&:hover": {
            transform: "translateY(-2px)",
            borderColor: "var(--lb-accent)",
        },
    },
})

export const linkList = style({
    display: "flex",
    flexDirection: "column",
    gap: 12,
    width: "100%",
    animation: `${rise} 480ms ease 160ms both`,
})

export const linkRow = style({
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 18px",
    borderRadius: 16,
    background: "var(--lb-surface)",
    border: "1px solid var(--lb-border)",
    color: "var(--lb-text)",
    textDecoration: "none",
    transition: "transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease",
    selectors: {
        "&:hover": {
            transform: "translateY(-2px)",
            borderColor: "var(--lb-accent)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
        },
    },
})

export const linkEmoji = style({
    fontSize: 24,
    flexShrink: 0,
})

export const linkText = style({
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minWidth: 0,
})

export const linkLabel = style({
    fontSize: 16,
    fontWeight: 650,
})

export const linkNote = style({
    fontSize: 13,
    color: "var(--lb-subtle)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
})

export const linkArrow = style({
    marginLeft: "auto",
    fontSize: 16,
    color: "var(--lb-subtle)",
    flexShrink: 0,
})

export const shareButton = style({
    padding: "10px 22px",
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 650,
    color: "var(--lb-text)",
    background: "var(--lb-surface)",
    border: "1px solid var(--lb-border)",
    cursor: "pointer",
    transition: "border-color 150ms ease",
    animation: `${rise} 480ms ease 240ms both`,
    selectors: {
        "&:hover": {
            borderColor: "var(--lb-accent)",
        },
    },
})

export const footer = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    marginTop: "auto",
    paddingTop: 16,
    animation: `${rise} 480ms ease 320ms both`,
})

export const themeRow = style({
    display: "flex",
    gap: 10,
})

export const themeSwatch = style({
    width: 26,
    height: 26,
    borderRadius: "50%",
    border: "2px solid var(--lb-border)",
    cursor: "pointer",
    padding: 0,
    transition: "transform 150ms ease, border-color 150ms ease",
    selectors: {
        "&:hover": {
            transform: "scale(1.12)",
        },
        '&[aria-pressed="true"]': {
            borderColor: "var(--lb-accent)",
            transform: "scale(1.12)",
        },
    },
})

export const madeWith = style({
    fontSize: 12,
    color: "var(--lb-subtle)",
})
