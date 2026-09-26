import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import { scaledSpace } from "../theme/feelBridge"
import * as hero from "../MarketingHero.styles.css"
import * as shell from "../MarketingShell.styles.css"
import * as features from "../MarketingFeatureGrid.styles.css"
import * as prices from "../MarketingPriceList.styles.css"
import * as logos from "../MarketingLogos.styles.css"
import * as split from "../MarketingContentSplit.styles.css"
import * as team from "../MarketingTeam.styles.css"
import * as quotes from "../MarketingTestimonials.styles.css"
import * as faq from "../MarketingFaq.styles.css"
import * as banner from "../MarketingCtaBanner.styles.css"
import * as cards from "../MarketingCardGrid.styles.css"
import * as steps from "../MarketingSteps.styles.css"
import {
    ctaPrimary,
    ctaSecondary,
    mediaImage,
    scriptFont,
    sectionKicker,
    sectionTitle,
    spot1,
    spot2,
} from "../shared.css"

/*
 * `candy` (bubblegum): Y2K candy pop, glossy and inflated. Display type
 * is filled with a candy gradient and sits on a hard "candy drop" (a
 * drop-shadow filter traces the gradient-clipped glyphs, which a
 * text-shadow would paint over); the hero directory peels off as three
 * die-cut stickers; the seal is a heart; lists and questions are glossy
 * pills; photographs are rounded prints with a white die-cut edge; the
 * credit is signed in the script face. The first spot ink is mint, the
 * second cherry.
 */
const C = '[data-marketing-treatment~="candy"]'
const plum = marketing.color.text
const pink = marketing.color.accent
const mint = spot1
const cherry = spot2
const paper = marketing.color.surface
const gloss = `linear-gradient(180deg, color-mix(in srgb, white 55%, transparent) 0%, transparent 46%)`
const candyFill = (from: string, to: string) => ({
    backgroundImage: `linear-gradient(180deg, color-mix(in srgb, ${from} 70%, white) 0%, ${from} 42%, ${to} 100%)`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    WebkitTextFillColor: "transparent",
})
const candyDrop = (depth: number) => `drop-shadow(0 ${depth}px 0 ${plum})`
const dieCut = `0 0 0 4px ${paper}, 0 10px 24px -10px color-mix(in srgb, ${plum} 45%, transparent)`
const heartMask =
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 92'><path d='M50 90C22 70 3 53 3 31 3 15 15 3 30 3c9 0 16 5 20 12 4-7 11-12 20-12 15 0 27 12 27 28 0 22-19 39-47 59z'/></svg>\")"

// -- Controls: jelly buttons with a gloss cap.
globalStyle(`${C} ${ctaPrimary}`, {
    backgroundImage: gloss,
    fontWeight: 800,
    fontSize: 16,
    padding: "15px 28px",
})
globalStyle(`${C} ${ctaSecondary}`, {
    fontWeight: 700,
    fontSize: 16,
    background: paper,
    borderColor: marketing.color.line,
    padding: "13px 26px",
})

// -- Nav: the pill bar, the name in candy.
globalStyle(`${C} ${shell.logo}`, {
    fontFamily: marketing.font.display,
    fontWeight: 400,
    fontSize: 30,
    letterSpacing: "0.01em",
    ...candyFill(pink, cherry),
    filter: candyDrop(2),
})
globalStyle(`${C} ${shell.pillBox}`, {
    background: paper,
    boxShadow: `0 3px 0 color-mix(in srgb, ${plum} 12%, transparent)`,
})
globalStyle(`${C} ${shell.linkPill}`, { fontWeight: 700 })

// -- Hero.
globalStyle(`${C} ${hero.split}`, { gridTemplateColumns: "1.08fr 0.92fr", paddingTop: scaledSpace(40) })
globalStyle(`${C} ${hero.badgeLive}`, {
    background: paper,
    borderColor: paper,
    fontWeight: 800,
    boxShadow: `0 4px 0 color-mix(in srgb, ${plum} 14%, transparent)`,
})
globalStyle(`${C} ${hero.badgeLiveDot}`, {
    background: mint,
    boxShadow: `0 0 0 3px color-mix(in srgb, ${mint} 35%, transparent)`,
})
globalStyle(`${C} ${hero.headline}`, {
    fontSize: `calc(clamp(58px, 8.2vw, 102px) * ${marketing.display.scale} / 1.34)`,
    lineHeight: 0.94,
    letterSpacing: "0.01em",
    ...candyFill(pink, cherry),
    filter: candyDrop(6),
    paddingBottom: 6,
})
globalStyle(`${C} ${hero.headline} ${hero.accentWord}`, {
    ...candyFill(mint, `color-mix(in srgb, ${mint} 62%, ${plum})`),
})
globalStyle(`${C} ${hero.subheadline}`, { fontSize: 19, color: plum, maxWidth: 520 })

// The directory peels off as die-cut stickers.
globalStyle(`${C} ${hero.directory}`, { marginTop: scaledSpace(30) })
globalStyle(`${C} ${hero.directoryList}`, {
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
    borderTop: "none",
})
globalStyle(`${C} ${hero.directoryItem}`, {
    borderBottom: "none",
    background: paper,
    borderRadius: 999,
    boxShadow: dieCut,
    transform: "rotate(-3deg)",
})
globalStyle(`${C} ${hero.directoryItem}:nth-child(2)`, { transform: "rotate(2.5deg) translateY(6px)" })
globalStyle(`${C} ${hero.directoryItem}:nth-child(3)`, { transform: "rotate(-1.5deg)" })
globalStyle(`${C} ${hero.directoryEntry}, ${C} ${hero.directoryLink}`, {
    gap: 10,
    padding: "9px 18px 9px 9px",
})
globalStyle(`${C} ${hero.directoryIcon}`, {
    width: 34,
    height: 34,
    background: pink,
    color: paper,
    backgroundImage: gloss,
})
globalStyle(`${C} ${hero.directoryItem}:nth-child(2) ${hero.directoryIcon}`, {
    backgroundColor: mint,
    color: plum,
})
globalStyle(`${C} ${hero.directoryItem}:nth-child(3) ${hero.directoryIcon}`, { backgroundColor: cherry })
globalStyle(`${C} ${hero.directoryLabel}`, { fontSize: 16, fontWeight: 800, color: plum })
globalStyle(`${C} ${hero.ctaRow}`, { marginTop: scaledSpace(34) })
globalStyle(`${C} ${hero.splitCredit}`, {
    fontFamily: scriptFont,
    fontSize: 30,
    fontWeight: 400,
    letterSpacing: 0,
    textTransform: "none",
    color: cherry,
    transform: "rotate(-4deg)",
    transformOrigin: "left center",
    margin: `${scaledSpace(22)} 0 0`,
})

// The photograph: a rounded print with a die-cut edge, a mint blob behind.
globalStyle(`${C} ${hero.split} ${hero.media}`, {
    position: "relative",
    isolation: "isolate",
    marginTop: 0,
})
globalStyle(`${C} ${hero.split} ${hero.media}::before`, {
    content: '""',
    position: "absolute",
    zIndex: -1,
    inset: "-7% -9% -10% 8%",
    borderRadius: "46% 54% 58% 42% / 52% 40% 60% 48%",
    background: `radial-gradient(circle at 30% 25%, color-mix(in srgb, ${mint} 55%, white), ${mint} 70%)`,
})
globalStyle(`${C} ${hero.split} ${hero.media} ${mediaImage}`, {
    width: "100%",
    height: "auto",
    aspectRatio: "4 / 3.4",
    objectFit: "cover",
    border: "none",
    borderRadius: 34,
    boxShadow: `0 0 0 8px ${paper}, 0 28px 50px -22px color-mix(in srgb, ${plum} 55%, transparent)`,
    transform: "rotate(2deg)",
})

// The seal as a cherry heart over the print's corner.
globalStyle(`${C} ${hero.splitSealSlot}`, {
    top: scaledSpace(28),
    right: -18,
    filter: `drop-shadow(0 6px 0 ${plum}) drop-shadow(0 18px 20px color-mix(in srgb, ${plum} 30%, transparent))`,
})
globalStyle(`${C} ${hero.seal}`, {
    width: 176,
    height: 162,
    padding: "18px 22px 44px",
    borderRadius: 0,
    boxShadow: "none",
    background: `${gloss}, linear-gradient(160deg, ${pink}, ${cherry})`,
    maskImage: heartMask,
    WebkitMaskImage: heartMask,
    maskSize: "100% 100%",
    WebkitMaskSize: "100% 100%",
    transform: "rotate(10deg)",
    color: paper,
})
globalStyle(`${C} ${hero.sealTop}`, {
    fontFamily: scriptFont,
    fontSize: 22,
    fontWeight: 400,
    letterSpacing: 0,
    textTransform: "none",
})
globalStyle(`${C} ${hero.sealMain}`, { fontSize: 25, lineHeight: 0.92 })

globalStyle(`${C} ${hero.split}`, {
    "@media": { "(max-width: 860px)": { gridTemplateColumns: "1fr" } },
})
globalStyle(`${C} ${hero.split} ${hero.media}::before`, {
    "@media": { "(max-width: 860px)": { inset: "-5% -4% -7% 10%" } },
})
globalStyle(`${C} ${hero.splitSealSlot}`, {
    "@media": { "(max-width: 860px)": { justifySelf: "end", marginTop: -96, marginRight: 4 } },
})
globalStyle(`${C} ${hero.seal}`, {
    "@media": { "(max-width: 860px)": { width: 132, height: 122, padding: "12px 16px 34px" } },
})
globalStyle(`${C} ${hero.sealMain}`, {
    "@media": { "(max-width: 860px)": { fontSize: 19 } },
})
globalStyle(`${C} ${shell.logo}`, {
    "@media": { "(max-width: 640px)": { fontSize: 23 } },
})

// -- Sections.
globalStyle(`${C} ${sectionKicker}, ${C} ${prices.kicker}`, {
    display: "inline-block",
    fontWeight: 800,
    fontSize: 13,
    letterSpacing: "0.14em",
    color: plum,
    background: mint,
    backgroundImage: gloss,
    borderRadius: 999,
    padding: "6px 14px",
    boxShadow: `0 3px 0 color-mix(in srgb, ${plum} 18%, transparent)`,
})
globalStyle(`${C} ${sectionTitle}`, {
    fontSize: `clamp(38px, 5.2vw, 72px)`,
    lineHeight: 0.98,
    ...candyFill(pink, cherry),
    filter: candyDrop(4),
    paddingBottom: 4,
})

// The promise rows: glossy pill cards.
globalStyle(`${C} ${features.listGrid}`, { gap: 20 })
globalStyle(`${C} ${features.listRow}`, {
    alignItems: "center",
    background: paper,
    backgroundImage: gloss,
    border: `3px solid ${paper}`,
    borderRadius: 999,
    padding: "16px 26px 16px 16px",
    boxShadow: `0 6px 0 color-mix(in srgb, ${pink} 30%, transparent), 0 24px 40px -24px color-mix(in srgb, ${plum} 50%, transparent)`,
})
globalStyle(`${C} ${features.listIconTile}`, {
    width: 64,
    height: 64,
    flex: "none",
    borderRadius: "50%",
    background: pink,
    backgroundImage: gloss,
    color: paper,
})
globalStyle(`${C} ${features.listRow}:nth-child(2) ${features.listIconTile}`, {
    backgroundColor: mint,
    color: plum,
})
globalStyle(`${C} ${features.listRow}:nth-child(3) ${features.listIconTile}`, { backgroundColor: cherry })
globalStyle(`${C} ${features.featureTitle}`, {
    fontFamily: marketing.font.display,
    fontWeight: 400,
    fontSize: 26,
    textTransform: "uppercase",
    color: plum,
})
globalStyle(`${C} ${features.featureDescription}`, { fontSize: 15.5, color: marketing.color.subtle })

// The price board: a pink candy box.
globalStyle(`${C} ${prices.board}`, {
    border: `3px solid ${paper}`,
    boxShadow: `0 8px 0 color-mix(in srgb, ${pink} 35%, transparent), 0 40px 60px -34px color-mix(in srgb, ${plum} 55%, transparent)`,
})
globalStyle(`${C} ${prices.head}`, {
    background: `${gloss}, linear-gradient(160deg, ${pink}, ${cherry})`,
    color: paper,
})
globalStyle(`${C} ${prices.title}`, { filter: candyDrop(4), color: paper })
globalStyle(`${C} ${prices.intro}`, { color: paper, fontWeight: 500 })
globalStyle(`${C} ${prices.groupHeading}::before`, { background: mint })
globalStyle(`${C} ${prices.foot}`, { background: mint, color: plum })

// Insurers as text stickers.
globalStyle(`${C} ${logos.strip}`, { gap: 14 })
globalStyle(`${C} ${logos.wordmark}`, {
    fontWeight: 800,
    fontSize: 16,
    color: plum,
    background: paper,
    borderRadius: 999,
    padding: "9px 18px",
    boxShadow: `0 4px 0 color-mix(in srgb, ${pink} 30%, transparent)`,
    opacity: 1,
})

globalStyle(`${C} ${split.mediaImg}`, {
    border: "none",
    borderRadius: 34,
    boxShadow: `0 0 0 8px ${paper}, 0 28px 50px -24px color-mix(in srgb, ${plum} 50%, transparent)`,
    transform: "rotate(-1.5deg)",
})
globalStyle(`${C} ${split.wrapMediaLeft} ${split.mediaImg}`, { transform: "rotate(1.5deg)" })
globalStyle(`${C} ${split.headline}`, { ...candyFill(pink, cherry), filter: candyDrop(3), paddingBottom: 3 })
globalStyle(`${C} ${split.bulletMark}`, { color: pink })

globalStyle(`${C} ${team.portraitImg}`, {
    border: "none",
    borderRadius: 34,
    boxShadow: `0 0 0 6px ${paper}, 0 24px 40px -24px color-mix(in srgb, ${plum} 50%, transparent)`,
})
globalStyle(`${C} ${team.portraitName}`, {
    fontWeight: 400,
    fontSize: 26,
    textTransform: "uppercase",
    color: plum,
})
globalStyle(`${C} ${team.portraitRole}`, { color: pink, fontWeight: 700 })

// Kind words: speech bubbles.
globalStyle(`${C} ${quotes.card}`, {
    position: "relative",
    background: paper,
    border: "none",
    borderRadius: 30,
    marginBottom: 18,
})
globalStyle(`${C} ${quotes.card}::after`, {
    content: '""',
    position: "absolute",
    left: 34,
    bottom: -16,
    width: 30,
    height: 20,
    background: paper,
    clipPath: "polygon(0 0, 100% 0, 10% 100%)",
})
globalStyle(`${C} ${quotes.quote}`, { fontSize: 17, lineHeight: 1.55, color: plum })
globalStyle(`${C} ${quotes.author}`, {
    fontFamily: marketing.font.body,
    fontSize: 15,
    fontWeight: 800,
    color: pink,
})

globalStyle(`${C} ${faq.item}`, {
    background: paper,
    border: "none",
    borderRadius: 26,
    boxShadow: `0 4px 0 color-mix(in srgb, ${pink} 26%, transparent)`,
})
globalStyle(`${C} ${faq.question}`, { fontSize: 17, fontWeight: 800 })

globalStyle(`${C} ${cards.card}, ${C} ${steps.card}`, {
    border: "none",
    backgroundImage: gloss,
})
globalStyle(`${C} ${steps.number}`, {
    fontFamily: marketing.font.display,
    fontWeight: 400,
    background: pink,
    backgroundImage: gloss,
    color: paper,
})

// The banner: a cherry-pink jelly slab.
globalStyle(`${C} ${banner.card}`, {
    background: `${gloss}, linear-gradient(150deg, ${pink} 0%, ${cherry} 100%)`,
    color: paper,
    border: "none",
    boxShadow: `0 10px 0 color-mix(in srgb, ${cherry} 55%, ${plum}), 0 40px 60px -30px color-mix(in srgb, ${plum} 60%, transparent)`,
})
globalStyle(`${C} ${banner.title}`, {
    backgroundImage: "none",
    color: paper,
    WebkitTextFillColor: paper,
    fontSize: `clamp(40px, 5.4vw, 78px)`,
    filter: candyDrop(5),
})
globalStyle(`${C} ${banner.body}`, { color: paper })
globalStyle(`${C} ${banner.card} ${banner.cta}`, {
    background: paper,
    backgroundImage: gloss,
    color: pink,
})
