import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import { scaledSpace } from "../theme/feelBridge"
import * as hero from "../MarketingHero.styles.css"
import * as shell from "../MarketingShell.styles.css"
import * as prices from "../MarketingPriceList.styles.css"
import * as logos from "../MarketingLogos.styles.css"
import * as split from "../MarketingContentSplit.styles.css"
import * as team from "../MarketingTeam.styles.css"
import * as quotes from "../MarketingTestimonials.styles.css"
import * as faq from "../MarketingFaq.styles.css"
import * as banner from "../MarketingCtaBanner.styles.css"
import * as cards from "../MarketingCardGrid.styles.css"
import * as steps from "../MarketingSteps.styles.css"
import { ctaPrimary, ctaSecondary, mediaImage, sectionKicker, sectionTitle, spot1 } from "../shared.css"

/*
 * `sleeve` (groove): a 1970s soul-duet LP, front and back. The split hero
 * is the album front: a square cover photograph with the black record
 * sliding out of its right edge, a round record-label sticker on the
 * shrink-wrap, and a fat stacked-shadow title; the hero directory and the
 * price list read as tracklists (A1, A2 … B1 with dotted leaders); the
 * rest of the page is the back cover's liner notes. Vinyl is black in
 * either appearance.
 */
const S = '[data-marketing-treatment~="sleeve"]'
const cream = marketing.color.text
const amber = spot1
const orange = marketing.color.accent
const burnt = `color-mix(in srgb, ${marketing.color.accent} 55%, black)`
const soulRed = `color-mix(in srgb, ${marketing.color.accent} 55%, crimson)`
// The amber plates are inked with the page ground, which is the dark
// sleeve in groove's native dark appearance; on the light appearance the
// ground is cream and the plates take the page ink instead.
const plateInk = "var(--sleeve-plate-ink)"
globalStyle(S, { vars: { "--sleeve-plate-ink": marketing.color.pageBg } })
globalStyle(`${S}[data-marketing-mode="light"]`, { vars: { "--sleeve-plate-ink": cream } })
const vinyl = "#141010" // theme-exempt: a record is black in both appearances
const vinylGroove = "#231b17" // theme-exempt: the groove sheen on black vinyl
const stackedShadow = `0.035em 0.035em 0 ${orange}, 0.07em 0.07em 0 ${burnt}`
const tracklist = {
    display: "flex",
    alignItems: "baseline",
    gap: 12,
} as const

// -- Controls: glossy pills, the cream one a price sticker.
globalStyle(`${S} ${ctaPrimary}`, {
    background: amber,
    color: plateInk,
    fontFamily: marketing.font.display,
    fontWeight: 400,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    padding: "15px 28px",
    boxShadow: `0 4px 0 ${burnt}`,
})
globalStyle(`${S} ${ctaSecondary}`, {
    fontFamily: marketing.font.display,
    fontWeight: 400,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    border: `1.5px solid ${cream}`,
    color: cream,
    background: "transparent",
    padding: "14px 26px",
})

// -- Nav: the title strip along the top of the sleeve.
globalStyle(`${S} ${shell.barCentered}`, {
    borderBottom: `1.5px solid color-mix(in srgb, ${cream} 30%, transparent)`,
})
globalStyle(`${S} ${shell.logoCentered}`, {
    fontFamily: marketing.font.display,
    fontSize: 26,
    fontWeight: 400,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
    color: cream,
})
globalStyle(`${S} ${shell.barCentered} ${shell.logoTagline}`, {
    fontFamily: marketing.font.body,
    fontStyle: "italic",
    letterSpacing: "0.08em",
    textTransform: "none",
    color: amber,
})
globalStyle(`${S} ${shell.barCentered} ${shell.link}`, {
    fontFamily: marketing.font.body,
    fontStyle: "italic",
    fontSize: 17,
    color: cream,
})

// -- Hero: the album front.
globalStyle(`${S} ${hero.split}`, {
    gridTemplateColumns: "1.05fr 0.95fr",
    gap: scaledSpace(40),
    paddingTop: scaledSpace(56),
    paddingBottom: scaledSpace(110),
    isolation: "isolate",
})
globalStyle(`${S} ${hero.statement}`, {
    position: "relative",
    isolation: "isolate",
    paddingBottom: scaledSpace(104),
})
// The sleeve's three-color band along the foot of the front, edge to edge.
globalStyle(`${S} ${hero.split}::after, ${S} ${hero.statement}::after`, {
    content: '""',
    position: "absolute",
    zIndex: -1,
    left: "calc(50% - 50vw)",
    right: "calc(50% - 50vw)",
    bottom: scaledSpace(34),
    height: 54,
    background: `linear-gradient(to bottom, ${amber} 0 33.3%, ${orange} 33.3% 66.6%, ${soulRed} 66.6%)`,
})
globalStyle(`${S} ${hero.badgeLive}`, {
    fontFamily: marketing.font.body,
    fontStyle: "italic",
    fontWeight: 500,
    fontSize: 16,
    background: "transparent",
    border: `1.5px solid color-mix(in srgb, ${cream} 45%, transparent)`,
    boxShadow: "none",
    color: cream,
})
globalStyle(`${S} ${hero.badgeLiveDot}`, { background: amber })
globalStyle(`${S} ${hero.headline}`, {
    fontSize: `calc(clamp(50px, 7.4vw, 92px) * ${marketing.display.scale} / 1.3)`,
    lineHeight: 0.98,
    letterSpacing: "0.005em",
    color: cream,
    textShadow: stackedShadow,
})
globalStyle(`${S} ${hero.headline} ${hero.accentWord}`, { color: amber, fontStyle: "normal" })
globalStyle(`${S} ${hero.subheadline}`, {
    fontSize: 20,
    fontStyle: "italic",
    color: cream,
    maxWidth: 540,
})

// The directory as the side's tracklist.
globalStyle(`${S} ${hero.directory}`, { marginTop: scaledSpace(30), maxWidth: 520 })
globalStyle(`${S} ${hero.directoryTitle}`, {
    fontFamily: marketing.font.display,
    fontSize: 15,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: amber,
    margin: "0 0 8px",
})
globalStyle(`${S} ${hero.directoryList}`, {
    counterReset: "sleeve-track",
    borderTop: `1.5px solid color-mix(in srgb, ${cream} 35%, transparent)`,
})
globalStyle(`${S} ${hero.directoryItem}`, {
    counterIncrement: "sleeve-track",
    borderBottom: "none",
})
globalStyle(`${S} ${hero.directoryEntry}, ${S} ${hero.directoryLink}`, {
    ...tracklist,
    padding: "9px 0",
})
globalStyle(`${S} ${hero.directoryEntry}::before, ${S} ${hero.directoryLink}::before`, {
    content: '"A" counter(sleeve-track)',
    flex: "none",
    width: 34,
    fontFamily: marketing.font.display,
    fontSize: 16,
    color: amber,
})
globalStyle(`${S} ${hero.directoryIcon}`, { display: "none" })
globalStyle(`${S} ${hero.directoryText}`, { ...tracklist, flex: 1, flexDirection: "row" })
globalStyle(`${S} ${hero.directoryText}::after`, {
    content: '""',
    order: 1,
    flex: 1,
    minWidth: 20,
    borderBottom: `2px dotted color-mix(in srgb, ${cream} 45%, transparent)`,
    transform: "translateY(-5px)",
})
globalStyle(`${S} ${hero.directoryLabel}`, {
    order: 0,
    fontSize: 19,
    fontWeight: 500,
    color: cream,
})
globalStyle(`${S} ${hero.directoryNote}`, {
    order: 2,
    fontFamily: marketing.font.display,
    fontSize: 16,
    color: amber,
    fontVariantNumeric: "tabular-nums",
})
globalStyle(`${S} ${hero.ctaRow}`, { marginTop: scaledSpace(32) })
globalStyle(`${S} ${hero.splitCredit}`, {
    fontFamily: marketing.font.body,
    fontStyle: "italic",
    letterSpacing: "0.12em",
    color: `color-mix(in srgb, ${cream} 70%, transparent)`,
})

// The cover, with the record sliding out of its right edge.
globalStyle(`${S} ${hero.split} ${hero.media}`, {
    position: "relative",
    isolation: "isolate",
    width: "80%",
    marginTop: 0,
    marginRight: "18%",
    justifySelf: "start",
})
globalStyle(`${S} ${hero.split} ${hero.media}::before`, {
    content: '""',
    position: "absolute",
    zIndex: -1,
    top: "3%",
    bottom: "3%",
    right: "-21%",
    aspectRatio: "1",
    borderRadius: "50%",
    background: [
        `radial-gradient(circle, ${marketing.color.pageBg} 0 1.6%, ${amber} 1.9% 16%, ${vinyl} 16.4% 18%, transparent 18.2%)`,
        `repeating-radial-gradient(circle, ${vinyl} 0 2px, ${vinylGroove} 2.6px 3.4px)`,
    ].join(", "),
    boxShadow: `0 18px 40px color-mix(in srgb, black 45%, transparent)`,
})
globalStyle(`${S} ${hero.split} ${hero.media} ${mediaImage}`, {
    width: "100%",
    height: "auto",
    aspectRatio: "1",
    objectFit: "cover",
    borderRadius: 4,
    boxShadow: `0 24px 50px color-mix(in srgb, black 50%, transparent), inset 0 0 0 1px ${cream}`,
})

// The round label sticker on the shrink-wrap, over the cover's corner.
globalStyle(`${S} ${hero.splitSealSlot}`, {
    top: "auto",
    right: "auto",
    left: "calc(52% - 70px)",
    bottom: scaledSpace(40),
})
globalStyle(`${S} ${hero.seal}`, {
    width: 158,
    height: 158,
    gap: 26,
    color: marketing.color.pageBg,
    background: [
        `radial-gradient(circle, ${marketing.color.pageBg} 0 6px, transparent 6.5px)`,
        `radial-gradient(circle, transparent 0 62%, color-mix(in srgb, ${marketing.color.pageBg} 45%, transparent) 62.5% 63.5%, transparent 64%)`,
        cream,
    ].join(", "),
    boxShadow: `0 10px 26px color-mix(in srgb, black 40%, transparent)`,
    transform: "rotate(-10deg)",
})
globalStyle(`${S} ${hero.sealTop}`, {
    fontFamily: marketing.font.body,
    fontStyle: "italic",
    fontSize: 12,
    letterSpacing: "0.1em",
    fontWeight: 600,
    color: orange,
})
globalStyle(`${S} ${hero.sealMain}`, { fontSize: 24, letterSpacing: "0.01em", color: burnt })

globalStyle(`${S} ${hero.split}`, {
    "@media": {
        "(max-width: 860px)": {
            gridTemplateColumns: "1fr",
            paddingTop: scaledSpace(32),
        },
    },
})
globalStyle(`${S} ${hero.split} ${hero.media}`, {
    "@media": { "(max-width: 860px)": { width: "78%", marginRight: 0 } },
})
globalStyle(`${S} ${hero.splitSealSlot}`, {
    "@media": { "(max-width: 860px)": { position: "static", marginTop: scaledSpace(-8) } },
})

// -- Sections: the back cover.
globalStyle(`${S} ${sectionKicker}, ${S} ${prices.kicker}`, {
    fontFamily: marketing.font.body,
    fontStyle: "italic",
    fontSize: 17,
    fontWeight: 500,
    letterSpacing: "0.06em",
    textTransform: "none",
    color: amber,
})
globalStyle(`${S} ${sectionTitle}`, {
    fontSize: `clamp(36px, 4.6vw, 62px)`,
    lineHeight: 1,
    textShadow: stackedShadow,
})

// Service cards: liner-note panels.
globalStyle(`${S} ${cards.card}`, {
    background: `color-mix(in srgb, ${marketing.color.surface} 80%, transparent)`,
    border: `1.5px solid color-mix(in srgb, ${cream} 22%, transparent)`,
    boxShadow: "none",
})
globalStyle(`${S} ${cards.cardTitle}`, {
    fontFamily: marketing.font.display,
    fontWeight: 400,
    fontSize: 23,
    textTransform: "uppercase",
    color: amber,
})
globalStyle(`${S} ${cards.cardBody}`, { fontSize: 17, lineHeight: 1.55 })

// The price list is the tracklist: Side A, Side B.
globalStyle(`${S} ${prices.board}`, {
    background: "transparent",
    border: `1.5px solid color-mix(in srgb, ${cream} 40%, transparent)`,
    boxShadow: "none",
})
globalStyle(`${S} ${prices.head}`, {
    background: "transparent",
    color: cream,
    textAlign: "center",
    borderBottom: `1.5px solid color-mix(in srgb, ${cream} 40%, transparent)`,
})
globalStyle(`${S} ${prices.title}`, { textShadow: stackedShadow, color: cream })
globalStyle(`${S} ${prices.intro}`, { fontStyle: "italic", marginInline: "auto" })
globalStyle(`${S} ${prices.groupHeading}`, {
    display: "inline-flex",
    background: amber,
    color: plateInk,
    borderRadius: 999,
    padding: "6px 14px",
    letterSpacing: "0.12em",
})
globalStyle(`${S} ${prices.groupHeading}::before`, { display: "none" })
globalStyle(`${S} ${prices.lines}`, { counterReset: "sleeve-side" })
globalStyle(`${S} ${prices.line}`, {
    counterIncrement: "sleeve-side",
    borderBottom: "none",
    padding: `${scaledSpace(10)} 0`,
})
globalStyle(`${S} ${prices.line}::before`, {
    content: '"A" counter(sleeve-side)',
    flex: "none",
    width: 34,
    fontFamily: marketing.font.display,
    fontSize: 17,
    color: amber,
})
globalStyle(`${S} ${prices.group}:nth-child(2) ${prices.line}::before`, {
    content: '"B" counter(sleeve-side)',
})
globalStyle(`${S} ${prices.name}`, {
    fontFamily: marketing.font.body,
    fontSize: 21,
    fontWeight: 500,
    letterSpacing: 0,
})
globalStyle(`${S} ${prices.note}`, { fontStyle: "italic", fontWeight: 400, fontSize: 15 })
globalStyle(`${S} ${prices.leader}`, { color: cream, opacity: 0.45 })
globalStyle(`${S} ${prices.price}`, {
    fontSize: 24,
    color: amber,
})
globalStyle(`${S} ${prices.foot}`, {
    background: `color-mix(in srgb, ${cream} 8%, transparent)`,
    color: cream,
})
globalStyle(`${S} ${prices.footnote}`, { fontStyle: "italic", fontWeight: 400 })

// Ways to pay: cream stickers.
globalStyle(`${S} ${logos.wordmark}`, {
    fontFamily: marketing.font.body,
    fontStyle: "italic",
    fontSize: 18,
    color: cream,
    border: `1.5px solid color-mix(in srgb, ${cream} 40%, transparent)`,
    borderRadius: 999,
    padding: "8px 18px",
    opacity: 1,
})

// Spotlight and story photographs: prints with a cream border.
globalStyle(`${S} ${split.mediaImg}`, {
    border: `8px solid ${cream}`,
    borderRadius: 4,
    boxShadow: `0 20px 44px color-mix(in srgb, black 45%, transparent)`,
    transform: "rotate(-1.2deg)",
})
globalStyle(`${S} ${split.wrapMediaLeft} ${split.mediaImg}`, { transform: "rotate(1.2deg)" })
globalStyle(`${S} ${split.headline}`, { textShadow: stackedShadow })
globalStyle(`${S} ${split.bulletMark}`, { color: amber })

// Therapists: portrait prints.
globalStyle(`${S} ${team.portraitImg}`, {
    border: `6px solid ${cream}`,
    borderRadius: 4,
    boxShadow: `0 16px 34px color-mix(in srgb, black 40%, transparent)`,
})
globalStyle(`${S} ${team.portraitName}`, { fontWeight: 400, fontSize: 24, textTransform: "uppercase" })
globalStyle(`${S} ${team.portraitRole}`, { fontStyle: "italic", color: amber })

// Kind words: liner-note quotes.
globalStyle(`${S} ${quotes.card}`, {
    background: "transparent",
    border: "none",
    borderTop: `1.5px solid color-mix(in srgb, ${cream} 35%, transparent)`,
    borderRadius: 0,
    boxShadow: "none",
    paddingInline: 0,
})
globalStyle(`${S} ${quotes.quote}`, { fontStyle: "italic", fontSize: 20, lineHeight: 1.5, color: cream })
globalStyle(`${S} ${quotes.author}`, { fontFamily: marketing.font.display, fontWeight: 400, color: amber })

globalStyle(`${S} ${faq.item}`, {
    background: `color-mix(in srgb, ${marketing.color.surface} 75%, transparent)`,
    border: `1.5px solid color-mix(in srgb, ${cream} 22%, transparent)`,
    boxShadow: "none",
})
globalStyle(`${S} ${faq.question}`, { fontSize: 18, fontWeight: 600 })

globalStyle(`${S} ${steps.number}`, {
    fontFamily: marketing.font.display,
    fontWeight: 400,
    background: amber,
    color: plateInk,
})
globalStyle(`${S} ${steps.card}`, {
    background: `color-mix(in srgb, ${marketing.color.surface} 80%, transparent)`,
    border: `1.5px solid color-mix(in srgb, ${cream} 22%, transparent)`,
    boxShadow: "none",
})

// The banner: an amber-to-orange sunset sticker.
globalStyle(`${S} ${banner.card}`, {
    background: `linear-gradient(160deg, ${amber} 0%, ${orange} 58%, ${burnt} 100%)`,
    color: marketing.color.pageBg,
    border: "none",
    boxShadow: `0 24px 60px color-mix(in srgb, black 40%, transparent)`,
})
globalStyle(`${S} ${banner.title}`, {
    color: marketing.color.pageBg,
    fontSize: `clamp(38px, 5vw, 70px)`,
    textShadow: `0.035em 0.035em 0 color-mix(in srgb, ${cream} 55%, transparent)`,
})
globalStyle(`${S} ${banner.body}`, { color: marketing.color.pageBg, fontStyle: "italic", fontSize: 19 })
globalStyle(`${S} ${banner.card} ${banner.cta}`, {
    background: marketing.color.pageBg,
    color: cream,
    boxShadow: "none",
})
