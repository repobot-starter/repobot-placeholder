import { style } from "@vanilla-extract/css"
import { marketing } from "@base/design-system/marketing-theme"

/**
 * The proofing room's chrome, drawn from the marketing token contract so it
 * inherits the pack's `atelier` register. Deliberately quieter than the
 * public site: no nav, no footer links — just the work and the tray.
 */

export const page = style({
    minHeight: "100vh",
    background: marketing.color.pageBg,
    color: marketing.color.text,
    fontFamily: marketing.font.body,
    // Room for the fixed selection tray.
    paddingBottom: 120,
})

export const header = style({
    maxWidth: 860,
    margin: "0 auto",
    padding: "64px 24px 36px",
    textAlign: "center",
    display: "grid",
    gap: 12,
})

export const studioMark = style({
    fontSize: 12,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})

export const title = style({
    fontFamily: marketing.font.display,
    fontSize: "clamp(28px, 4.5vw, 44px)",
    lineHeight: 1.1,
    margin: 0,
})

export const clientLine = style({
    fontSize: 14,
    color: marketing.color.subtle,
})

export const note = style({
    fontSize: 15.5,
    lineHeight: 1.65,
    color: marketing.color.text,
    maxWidth: 620,
    margin: "0 auto",
    textAlign: "left",
})

export const galleryWrap = style({
    maxWidth: 1280,
    margin: "0 auto",
    padding: "0 16px",
})

/* ---- The access-code gate ---- */

export const gate = style({
    minHeight: "70vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
})

export const gateCard = style({
    width: "min(420px, 100%)",
    display: "grid",
    gap: 14,
    padding: "36px 32px",
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    textAlign: "center",
})

export const gateTitle = style({
    fontFamily: marketing.font.display,
    fontSize: 26,
    margin: 0,
})

export const gateBody = style({
    fontSize: 14.5,
    lineHeight: 1.6,
    color: marketing.color.subtle,
    margin: 0,
})

export const gateForm = style({
    display: "grid",
    gap: 10,
    marginTop: 6,
})

export const gateInput = style({
    fontSize: 18,
    fontFamily: "inherit",
    textAlign: "center",
    letterSpacing: "0.3em",
    color: marketing.color.text,
    background: marketing.color.pageBg,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusControl,
    padding: "12px 16px",
    outline: "none",
    selectors: {
        "&:focus": { borderColor: marketing.color.accent },
    },
})

export const gateButton = style({
    fontSize: 15,
    fontWeight: 600,
    fontFamily: "inherit",
    padding: "12px 18px",
    borderRadius: marketing.shape.radiusControl,
    border: "none",
    background: marketing.color.accent,
    color: marketing.color.onAccent,
    cursor: "pointer",
})

export const gateError = style({
    fontSize: 13.5,
    // The register's own accent (atelier's near-ink), not a forked
    // constant — the rust literal this file carried was the last raw color
    // in any register-declaring pack's views.
    color: marketing.color.accent,
    margin: 0,
})

/* ---- The selection tray ---- */

export const tray = style({
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    padding: "14px 20px",
    background: marketing.color.surface,
    borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
})

export const trayCount = style({
    fontSize: 14.5,
    color: marketing.color.text,
})

export const trayButton = style({
    fontSize: 14.5,
    fontWeight: 600,
    fontFamily: "inherit",
    padding: "10px 22px",
    borderRadius: 999,
    border: "none",
    background: marketing.color.accent,
    color: marketing.color.onAccent,
    cursor: "pointer",
    selectors: {
        "&:disabled": { opacity: 0.45, cursor: "default" },
    },
})

export const trayGhostButton = style({
    fontSize: 14,
    fontFamily: "inherit",
    padding: "10px 18px",
    borderRadius: 999,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    background: "transparent",
    color: marketing.color.text,
    cursor: "pointer",
})

export const trayNote = style({
    width: "min(420px, 50vw)",
    fontSize: 14,
    fontFamily: "inherit",
    color: marketing.color.text,
    background: marketing.color.pageBg,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusControl,
    padding: "10px 14px",
    outline: "none",
    resize: "none",
    selectors: {
        "&:focus": { borderColor: marketing.color.accent },
    },
    "@media": {
        "(max-width: 640px)": { width: "100%" },
    },
})

/* ---- Sent confirmation ---- */

export const sentCard = style({
    maxWidth: 520,
    margin: "48px auto 0",
    padding: "32px 28px",
    display: "grid",
    gap: 10,
    textAlign: "center",
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
})

export const sentTitle = style({
    fontFamily: marketing.font.display,
    fontSize: 24,
    margin: 0,
})

export const sentBody = style({
    fontSize: 14.5,
    lineHeight: 1.6,
    color: marketing.color.subtle,
    margin: 0,
})

export const sentButton = style({
    justifySelf: "center",
    marginTop: 8,
    fontSize: 14,
    fontFamily: "inherit",
    padding: "10px 20px",
    borderRadius: 999,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    background: "transparent",
    color: marketing.color.text,
    cursor: "pointer",
})

/** The unknown-album panel (bad or truncated link). */
export const missing = style({
    minHeight: "60vh",
    display: "grid",
    placeItems: "center",
    padding: 24,
    textAlign: "center",
    fontSize: 15,
    color: marketing.color.subtle,
})

/** Tray on small screens: stack instead of a single row. */
export const trayInner = style({
    display: "flex",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
    justifyContent: "center",
    width: "min(960px, 100%)",
})
