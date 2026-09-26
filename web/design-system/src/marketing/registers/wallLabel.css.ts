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
import * as showcase from "../MarketingShowcase.styles.css"
import * as cards from "../MarketingCardGrid.styles.css"
import * as steps from "../MarketingSteps.styles.css"
import { ctaPrimary, ctaSecondary, mediaImage, section, sectionKicker, sectionTitle } from "../shared.css"

/*
 * `wall-label` (inkblot): the page as a gallery exhibition poster. The
 * split hero hangs its title across the wall in a huge serif, the
 * photograph (a plate) centered beneath it unframed, the caption to its
 * left like a curator's aside, and the hero directory to its right as
 * the wall label — name, lines, then the catalogue's links. Plates below
 * hang bare with numbered captions; the price list is the exhibition
 * price list; everything else sits on hairlines with a lot of wall.
 * In the light appearance plates print onto the wall (multiply), so a
 * photographed paper ground disappears into the page.
 */
const W = '[data-marketing-treatment~="wall-label"]'
const LIGHT = `[data-marketing-mode="light"]${W}`
const ink = marketing.color.text
const hair = `1px solid ${marketing.color.line}`
const smallCaps = {
    fontFamily: marketing.font.body,
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
} as const

globalStyle(`${W} ${ctaPrimary}, ${W} ${ctaSecondary}`, {
    fontFamily: marketing.font.body,
    fontSize: 17,
    fontWeight: 500,
    letterSpacing: "0.02em",
    borderRadius: 0,
    padding: "13px 24px",
})
globalStyle(`${W} ${ctaSecondary}`, { border: `1px solid ${ink}` })

// -- Nav: the gallery's name on the wall.
globalStyle(`${W} ${shell.logo}`, {
    fontFamily: marketing.font.display,
    fontSize: 24,
    fontWeight: 500,
    letterSpacing: "0.01em",
})
globalStyle(`${W} ${shell.link}`, { fontFamily: marketing.font.body, fontSize: 17, fontStyle: "italic" })

// -- Hero: title across the wall, the plate beneath, the label beside it.
globalStyle(`${W} ${hero.split}`, {
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.25fr) minmax(0, 1fr)",
    gridTemplateRows: "auto auto auto 1fr",
    gridTemplateAreas: '"head head head" "sub media badge" "sub media dir" "caption media cta"',
    columnGap: scaledSpace(40),
    rowGap: 0,
    alignItems: "start",
    paddingTop: scaledSpace(34),
    paddingBottom: scaledSpace(56),
})
globalStyle(`${W} ${hero.split} ${hero.splitCopy}`, { display: "contents" })
globalStyle(`${W} ${hero.split} ${hero.headline}`, {
    gridArea: "head",
    justifySelf: "center",
    textAlign: "center",
    fontSize: `calc(clamp(52px, 11vw, 164px) * ${marketing.display.scale} / 1.5)`,
    lineHeight: 0.86,
    letterSpacing: "-0.02em",
    maxWidth: "none",
    textWrap: "balance",
    margin: `0 0 ${scaledSpace(30)}`,
})
globalStyle(`${W} ${hero.split} ${hero.badgeLive}`, {
    gridArea: "badge",
    justifySelf: "start",
    background: "transparent",
    border: "none",
    boxShadow: "none",
    padding: 0,
    marginBottom: scaledSpace(18),
    ...smallCaps,
    color: marketing.color.subtle,
})
globalStyle(`${W} ${hero.split} ${hero.badgeLiveDot}`, { width: 8, height: 8 })
globalStyle(`${W} ${hero.split} ${hero.subheadline}`, {
    gridArea: "sub",
    margin: 0,
    fontSize: 19,
    lineHeight: 1.55,
    color: ink,
})
globalStyle(`${W} ${hero.split} ${hero.media}`, {
    gridArea: "media",
    marginTop: 0,
    alignSelf: "stretch",
})
globalStyle(`${W} ${hero.split} ${hero.media} ${mediaImage}`, {
    width: "100%",
    height: "auto",
    aspectRatio: "1",
    objectFit: "cover",
    border: "none",
    borderRadius: 0,
    boxShadow: "none",
})
globalStyle(`${LIGHT} ${hero.split} ${hero.media} ${mediaImage}`, {
    mixBlendMode: "multiply",
    filter: "brightness(1.09) contrast(1.08)",
    maskImage: "radial-gradient(closest-side, black 80%, transparent 100%)",
    WebkitMaskImage: "radial-gradient(closest-side, black 80%, transparent 100%)",
})
globalStyle(`${W} ${hero.split} ${hero.splitCaption}`, {
    gridArea: "caption",
    alignSelf: "end",
    margin: 0,
    paddingTop: scaledSpace(18),
    borderTop: hair,
    fontFamily: marketing.font.display,
    fontSize: 22,
    lineHeight: 1.3,
    color: ink,
})

// The wall label: a small card on the wall.
globalStyle(`${W} ${hero.split} ${hero.directory}`, {
    gridArea: "dir",
    margin: 0,
    padding: `${scaledSpace(22)} ${scaledSpace(22)} ${scaledSpace(12)}`,
    background: marketing.color.surface,
    boxShadow: `0 1px 2px color-mix(in srgb, ${ink} 12%, transparent), 0 8px 24px color-mix(in srgb, ${ink} 6%, transparent)`,
})
globalStyle(`${W} ${hero.directoryTitle}`, {
    fontFamily: marketing.font.body,
    fontSize: 19,
    fontWeight: 600,
    margin: "0 0 4px",
    color: ink,
})
globalStyle(`${W} ${hero.directoryLine}`, {
    fontFamily: marketing.font.body,
    fontSize: 16,
    fontStyle: "italic",
    margin: 0,
    color: marketing.color.subtle,
})
globalStyle(`${W} ${hero.directoryList}`, { marginTop: scaledSpace(16), borderTop: hair })
globalStyle(`${W} ${hero.directoryItem}`, { borderBottom: hair })
globalStyle(`${W} ${hero.directoryItem}:last-child`, { borderBottom: "none" })
globalStyle(`${W} ${hero.directoryLink}, ${W} ${hero.directoryEntry}`, { padding: "11px 0" })
globalStyle(`${W} ${hero.directoryLabel}`, {
    fontFamily: marketing.font.body,
    fontSize: 18,
    fontWeight: 500,
    color: marketing.color.accent,
})
globalStyle(`${W} ${hero.directoryLink}::after`, {
    content: '"\\2192"',
    marginLeft: "auto",
    color: marketing.color.accent,
})
globalStyle(`${W} ${hero.directoryLink}:hover ${hero.directoryLabel}`, { textDecoration: "underline" })
globalStyle(`${W} ${hero.split} ${hero.ctaRow}`, {
    gridArea: "cta",
    marginTop: scaledSpace(22),
    flexDirection: "column",
    alignItems: "stretch",
    textAlign: "center",
})
globalStyle(`${W} ${hero.split} ${hero.splitCredit}`, { display: "none" })

globalStyle(`${W} ${hero.split}`, {
    "@media": {
        "(max-width: 960px)": {
            gridTemplateColumns: "1fr",
            gridTemplateRows: "none",
            gridTemplateAreas: '"head" "media" "caption" "sub" "badge" "dir" "cta"',
        },
    },
})
globalStyle(`${W} ${hero.split} ${hero.splitCaption}`, {
    "@media": {
        "(max-width: 960px)": {
            alignSelf: "start",
            textAlign: "center",
            border: "none",
            paddingTop: 8,
            marginBottom: 24,
        },
    },
})
globalStyle(`${W} ${hero.split} ${hero.badgeLive}`, {
    "@media": { "(max-width: 960px)": { marginTop: 24 } },
})

// Inner pages: the title centered on the wall like the exhibition's name.
globalStyle(`${W} ${hero.statement}`, { textAlign: "center", paddingBottom: scaledSpace(56) })
globalStyle(`${W} ${hero.statement} ${hero.headline}`, { marginInline: "auto", textWrap: "balance" })
globalStyle(`${W} ${hero.statement} ${hero.subheadline}`, {
    marginInline: "auto",
    fontStyle: "italic",
    fontSize: 20,
})

// -- Sections: hairlines and wall space.
globalStyle(`${W} ${section}`, {
    borderTop: hair,
    paddingTop: scaledSpace(64),
    paddingBottom: scaledSpace(24),
})
globalStyle(`${W} ${sectionKicker}, ${W} ${prices.kicker}`, { ...smallCaps, color: marketing.color.subtle })
globalStyle(`${W} ${sectionTitle}`, {
    fontSize: `clamp(38px, 5vw, 72px)`,
    lineHeight: 0.98,
    fontWeight: 500,
})

// Plates: hung bare, numbered captions beneath.
globalStyle(`${W} ${showcase.grid}`, { gap: `${scaledSpace(48)} ${scaledSpace(40)}` })
globalStyle(`${W} ${showcase.card}`, {
    background: "transparent",
    border: "none",
    borderRadius: 0,
    boxShadow: "none",
    padding: 0,
})
globalStyle(`${W} ${showcase.mediaWrap}`, {
    borderRadius: 0,
    border: "none",
    background: "transparent",
    boxShadow: `0 1px 2px color-mix(in srgb, ${ink} 10%, transparent), 0 14px 30px color-mix(in srgb, ${ink} 8%, transparent)`,
})
globalStyle(`${W} ${showcase.mediaImg}`, { borderRadius: 0 })
globalStyle(`${LIGHT} ${showcase.mediaImg}`, { mixBlendMode: "multiply" })
globalStyle(`${W} ${showcase.eyebrow}`, {
    ...smallCaps,
    color: marketing.color.subtle,
    marginTop: scaledSpace(16),
})
globalStyle(`${W} ${showcase.itemTitle}`, {
    fontFamily: marketing.font.display,
    fontStyle: "italic",
    fontWeight: 500,
    fontSize: 30,
})
globalStyle(`${W} ${showcase.itemDescription}`, { fontSize: 17, lineHeight: 1.55 })

// The exhibition price list.
globalStyle(`${W} ${prices.board}`, {
    background: "transparent",
    border: "none",
    borderRadius: 0,
    boxShadow: "none",
})
globalStyle(`${W} ${prices.head}`, {
    background: "transparent",
    color: ink,
    textAlign: "center",
    paddingInline: 0,
})
globalStyle(`${W} ${prices.title}`, { color: ink, fontSize: `clamp(38px, 5vw, 72px)`, fontWeight: 500 })
globalStyle(`${W} ${prices.intro}`, {
    color: marketing.color.subtle,
    fontStyle: "italic",
    marginInline: "auto",
})
globalStyle(`${W} ${prices.groups}`, { paddingInline: 0, columnGap: scaledSpace(56) })
globalStyle(`${W} ${prices.groupHeading}`, {
    ...smallCaps,
    color: marketing.color.subtle,
    borderBottom: hair,
    paddingBottom: 10,
})
globalStyle(`${W} ${prices.groupHeading}::before`, { display: "none" })
globalStyle(`${W} ${prices.line}`, { borderBottom: hair })
globalStyle(`${W} ${prices.name}`, {
    fontFamily: marketing.font.body,
    fontSize: 20,
    fontWeight: 500,
    letterSpacing: 0,
})
globalStyle(`${W} ${prices.note}`, { fontStyle: "italic", fontWeight: 400, fontSize: 15 })
globalStyle(`${W} ${prices.leader}`, { opacity: 0.35, color: ink })
globalStyle(`${W} ${prices.price}`, {
    fontFamily: marketing.font.body,
    fontSize: 22,
    fontWeight: 500,
    color: ink,
})
globalStyle(`${W} ${prices.foot}`, {
    background: "transparent",
    color: marketing.color.subtle,
    borderTop: hair,
    paddingInline: 0,
})
globalStyle(`${W} ${prices.footnote}`, { fontStyle: "italic", fontWeight: 400 })

globalStyle(`${W} ${logos.wordmark}`, {
    fontFamily: marketing.font.body,
    fontStyle: "italic",
    fontSize: 19,
    color: ink,
    opacity: 1,
})

globalStyle(`${W} ${split.mediaImg}`, { borderRadius: 0, border: "none", boxShadow: "none" })
globalStyle(`${LIGHT} ${split.mediaImg}`, { mixBlendMode: "multiply" })
globalStyle(`${W} ${split.headline}`, { fontWeight: 500 })

globalStyle(`${W} ${team.portraitImg}`, { borderRadius: 0, border: "none" })
globalStyle(`${W} ${team.portraitName}`, { fontFamily: marketing.font.body, fontSize: 19, fontWeight: 600 })
globalStyle(`${W} ${team.portraitRole}`, {
    fontStyle: "italic",
    letterSpacing: 0,
    textTransform: "none",
    fontSize: 16,
    color: marketing.color.subtle,
})

globalStyle(`${W} ${quotes.card}`, {
    background: "transparent",
    border: "none",
    borderTop: hair,
    borderRadius: 0,
    boxShadow: "none",
    paddingInline: 0,
})
globalStyle(`${W} ${quotes.quote}`, {
    fontFamily: marketing.font.display,
    fontStyle: "italic",
    fontSize: 25,
    lineHeight: 1.3,
    color: ink,
})

globalStyle(`${W} ${faq.list}`, { gap: 0 })
globalStyle(`${W} ${faq.item}`, {
    background: "transparent",
    border: "none",
    borderTop: hair,
    borderRadius: 0,
    boxShadow: "none",
    padding: "4px 0",
})
globalStyle(`${W} ${faq.question}`, { fontFamily: marketing.font.display, fontSize: 24, fontWeight: 500 })

globalStyle(`${W} ${cards.card}, ${W} ${steps.card}`, {
    background: "transparent",
    border: "none",
    borderTop: hair,
    borderRadius: 0,
    boxShadow: "none",
    paddingInline: 0,
})
globalStyle(`${W} ${cards.cardTitle}`, { fontFamily: marketing.font.display, fontSize: 26, fontWeight: 500 })
globalStyle(`${W} ${steps.number}`, {
    fontFamily: marketing.font.display,
    fontStyle: "italic",
    background: "transparent",
    color: marketing.color.accent,
    border: `1px solid ${marketing.color.accent}`,
})

// The banner: an ultramarine field, the one place the ink floods.
globalStyle(`${W} ${banner.card}`, {
    background: marketing.color.accent,
    color: marketing.color.onAccent,
    borderRadius: 0,
    border: "none",
    boxShadow: "none",
})
globalStyle(`${W} ${banner.title}`, {
    color: marketing.color.onAccent,
    fontSize: `clamp(40px, 5.6vw, 84px)`,
    fontWeight: 500,
    lineHeight: 0.96,
})
globalStyle(`${W} ${banner.body}`, { color: marketing.color.onAccent, fontStyle: "italic" })
globalStyle(`${W} ${banner.card} ${banner.cta}`, {
    background: marketing.color.onAccent,
    color: marketing.color.accent,
    boxShadow: "none",
})
