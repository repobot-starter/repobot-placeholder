import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import { scaledSpace } from "../theme/feelBridge"
import * as banner from "../MarketingCtaBanner.styles.css"
import * as hero from "../MarketingHero.styles.css"
import * as shell from "../MarketingShell.styles.css"
import * as showcase from "../MarketingShowcase.styles.css"
import * as proof from "../MarketingSocialProof.styles.css"
import * as team from "../MarketingTeam.styles.css"
import { sectionKicker } from "../shared.css"

/*
 * `proofmark`: the one-line page, set like a galley proof. A statement
 * hero that carries a `badge` (the home; page-title statements carry
 * none) fills the first screen: the badge as a mono slug at its head, the
 * line flush left at its foot at poster scale — its accent full stop the
 * only colour on the screen — and the subheadline, the pitch, in the mono
 * body face beneath. The text-logos strip is a plain comma-run of names in
 * the display face, closing on the accent full stop. The colophon is one
 * line on the paper under a hairline, its link beside it with an arrow.
 * Kickers, labels and the wordmark are set in the mono body face; nothing
 * is a pill. The showcase grid (the portfolio's spec sheet) is ruled rows
 * on the paper — years, tags and status marks as mono text, the filter
 * chips as words with the active one underlined in the accent; the team
 * list is the same ruled rows (name, role, brief across). The faces
 * ship one display weight, so bold is never synthesized.
 */
const P = '[data-marketing-treatment~="proofmark"]'
/** The home's statement: the one that carries a badge. */
const LINE = `${hero.statement}:has(${hero.badge})`
const PHONE = "(max-width: 640px)"

globalStyle(P, {
    fontSynthesis: "none",
})

// ------------------------------------------------------------ the labels
globalStyle(`${P} ${sectionKicker}, ${P} ${proof.label}`, {
    display: "block",
    fontFamily: marketing.font.body,
    fontSize: 11,
    fontWeight: 400,
    letterSpacing: "0.02em",
    textTransform: "none",
    color: marketing.color.subtle,
    background: "none",
    border: "none",
    padding: 0,
})

globalStyle(`${P} ${shell.logo}`, {
    fontFamily: marketing.font.display,
    fontWeight: 400,
    fontSize: 24,
    letterSpacing: "-0.02em",
})

// ------------------------------------------------------------ the line
globalStyle(`${P} ${LINE}`, {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    boxSizing: "border-box",
    minHeight: "calc(100svh - 88px)",
    padding: `${scaledSpace(20)} 0 ${scaledSpace(56)}`,
    "@media": {
        [PHONE]: { minHeight: "calc(100svh - 76px)", padding: `${scaledSpace(12)} 0 ${scaledSpace(36)}` },
    },
})

globalStyle(`${P} ${LINE} ${hero.badge}`, {
    alignSelf: "flex-start",
    marginBottom: "auto",
    fontFamily: marketing.font.body,
    fontSize: 11,
    fontWeight: 400,
    letterSpacing: "0.02em",
    textTransform: "none",
    color: marketing.color.subtle,
    background: "none",
    border: "none",
    borderRadius: 0,
    padding: 0,
})

globalStyle(`${P} ${LINE} ${hero.headlineStatement}`, {
    fontSize: `calc(clamp(58px, 13vw, 208px) * ${marketing.display.scale})`,
    lineHeight: 0.9,
    letterSpacing: "-0.035em",
    maxWidth: "none",
    textWrap: "balance",
    marginTop: scaledSpace(48),
    "@media": {
        [PHONE]: { fontSize: `calc(17.5vw * ${marketing.display.scale})` },
    },
})

globalStyle(`${P} ${LINE} ${hero.subheadline}`, {
    fontFamily: marketing.font.body,
    fontSize: 13,
    fontWeight: 300,
    lineHeight: 1.7,
    color: marketing.color.text,
    maxWidth: "44em",
    margin: `${scaledSpace(36)} 0 0`,
})

// ------------------------------------------------------- the names, run on
globalStyle(`${P} ${proof.strip}`, {
    display: "block",
    textAlign: "left",
    maxWidth: "22em",
    padding: `${scaledSpace(56)} 0 ${scaledSpace(24)}`,
    fontFamily: marketing.font.display,
    fontSize: `calc(clamp(28px, 3.6vw, 52px) * ${marketing.display.scale})`,
    lineHeight: 1.12,
    letterSpacing: "-0.02em",
})

globalStyle(`${P} ${proof.strip} ${proof.label}`, {
    width: "auto",
    textAlign: "left",
    marginBottom: scaledSpace(20),
})

globalStyle(`${P} ${proof.item}`, {
    display: "inline",
    fontFamily: "inherit",
    fontSize: "inherit",
    fontWeight: 400,
    letterSpacing: "inherit",
    textTransform: "none",
    whiteSpace: "nowrap",
    color: marketing.color.text,
})

// Names never break inside; the run breaks only at the space after a comma.
globalStyle(`${P} ${proof.item}:not(:last-child)::after`, {
    content: '", "',
    whiteSpace: "normal",
})

globalStyle(`${P} ${proof.item}:last-child::after`, {
    content: '"."',
    color: marketing.color.accent,
})

// ------------------------------------------------------- the closing line
globalStyle(`${P} ${banner.colophon}`, {
    width: "auto",
    marginLeft: 0,
    padding: `${scaledSpace(40)} 0 ${scaledSpace(72)}`,
    background: "none",
    borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    textAlign: "left",
})

globalStyle(`${P} ${banner.colophonInner}`, {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    columnGap: scaledSpace(32),
    rowGap: scaledSpace(12),
    width: "100%",
    margin: 0,
})

globalStyle(`${P} ${banner.colophonInner} > ${banner.colophonLine}:first-child`, {
    flex: "1 1 auto",
    fontSize: `calc(clamp(26px, 3vw, 44px) * ${marketing.display.scale})`,
    lineHeight: 1.1,
    letterSpacing: "-0.02em",
    textWrap: "pretty",
})

globalStyle(`${P} ${banner.colophonInner} > ${banner.colophonLine}:not(:first-child)`, {
    order: 3,
    flexBasis: "100%",
    fontFamily: marketing.font.body,
    fontSize: 12,
    lineHeight: 1.7,
    color: marketing.color.subtle,
})

globalStyle(`${P} ${banner.colophonLink}`, {
    marginTop: 0,
    fontSize: 13,
    color: marketing.color.accent,
    textDecoration: "none",
})

globalStyle(`${P} ${banner.colophonLink}::after`, {
    content: '"  →"',
    whiteSpace: "pre",
})

// ------------------------------------------------------- the spec sheet
globalStyle(`${P} ${showcase.chipRow}`, {
    justifyContent: "flex-start",
    gap: `8px ${scaledSpace(22)}`,
})

globalStyle(`${P} ${showcase.chip}`, {
    fontSize: 12,
    fontWeight: 400,
    color: marketing.color.subtle,
    background: "transparent",
    border: "none",
    padding: "4px 0",
    textUnderlineOffset: 6,
})

globalStyle(`${P} ${showcase.chip}[aria-pressed="true"]`, {
    color: marketing.color.text,
    background: "transparent",
    textDecoration: "underline",
    textDecorationColor: marketing.color.accent,
    textDecorationThickness: 2,
})

globalStyle(`${P} ${showcase.card}`, {
    gap: 8,
    background: "none",
    border: "none",
    borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.text}`,
    borderRadius: 0,
    boxShadow: "none",
    padding: `${scaledSpace(14)} 0 ${scaledSpace(26)}`,
})

globalStyle(`${P} ${showcase.itemTitle}`, {
    fontSize: 26,
    fontWeight: 400,
    letterSpacing: "-0.015em",
    lineHeight: 1.1,
})

globalStyle(`${P} ${showcase.eyebrow}, ${P} ${showcase.tag}, ${P} ${showcase.badge}`, {
    fontFamily: marketing.font.body,
    fontSize: 11,
    fontWeight: 400,
    letterSpacing: "0.02em",
    textTransform: "none",
    color: marketing.color.subtle,
    background: "none",
    padding: 0,
})

globalStyle(`${P} ${showcase.tagRow}`, {
    gap: `4px ${scaledSpace(14)}`,
})

globalStyle(`${P} ${showcase.badgeAccent}`, {
    color: marketing.color.accent,
})

globalStyle(`${P} ${showcase.badgeNeutral}`, {
    color: marketing.color.text,
})

// ------------------------------------------------------------- the team
globalStyle(`${P} ${team.list}`, {
    maxWidth: "none",
    margin: 0,
    gap: 0,
})

globalStyle(`${P} ${team.listRow}`, {
    display: "block",
    borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.text}`,
    padding: `${scaledSpace(14)} 0 ${scaledSpace(30)}`,
})

globalStyle(`${P} ${team.listRow} > div`, {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 2fr)",
    columnGap: scaledSpace(32),
    alignItems: "baseline",
    "@media": {
        [PHONE]: { display: "block" },
    },
})

globalStyle(`${P} ${team.name}`, {
    fontSize: 26,
    fontWeight: 400,
    letterSpacing: "-0.015em",
    lineHeight: 1.1,
})

globalStyle(`${P} ${team.role}`, {
    display: "block",
    fontSize: 11,
    fontWeight: 400,
    letterSpacing: "0.02em",
    color: marketing.color.subtle,
    margin: "6px 0 10px",
})

globalStyle(`${P} ${team.bio}`, {
    fontSize: 13,
    lineHeight: 1.7,
    maxWidth: "none",
    margin: 0,
})
