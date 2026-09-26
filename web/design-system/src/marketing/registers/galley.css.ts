import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import { scaledSpace } from "../theme/feelBridge"
import * as cards from "../MarketingCardGrid.styles.css"
import * as hero from "../MarketingHero.styles.css"
import * as lead from "../MarketingLeadForm.styles.css"
import * as prose from "../MarketingRichProse.styles.css"
import * as shell from "../MarketingShell.styles.css"
import * as showcase from "../MarketingShowcase.styles.css"
import * as stats from "../MarketingStats.styles.css"
import * as steps from "../MarketingSteps.styles.css"
import {
    scriptFont,
    sectionHeaderCentered,
    sectionKicker,
    sectionTitle,
    sectionTitleDisplay,
    spot1,
} from "../shared.css"

/*
 * `galley`: a chef's photographic résumé, typeset like the menu board and
 * the kitchen ticket. Three voices: the display Clarendon for names,
 * titles and numbers (its italic for the accent word), the body face for
 * reading, and the register's mono third voice for everything a ticket
 * printer would print — kickers, years, labels, the hero's computed line.
 *
 * The full-bleed hero keeps the cook in frame with the copy low on the
 * left over a warm scrim. The photographic timeline hangs each kitchen
 * from a mono year ticket on a hairline rail, the photographs cut 4:3 like
 * the rest of the shoot. The stories are press clippings: the flag ruled
 * in ink, mono kickers, the lead story's photograph beside it. Cards drop
 * their boxes for a ruled four-up; the numbers are display numerals over
 * mono labels; headers sit left, like the top of a menu.
 */
const G = '[data-marketing-treatment~="galley"]'
const WHITE = "#ffffff" // theme-exempt: copy over the photograph is white in every theme
const INK_RULE = `1.5px solid ${marketing.color.text}`
const HAIRLINE = `${marketing.shape.borderWidth} solid ${marketing.color.line}`
const ticket = {
    fontFamily: scriptFont,
    fontSize: 12,
    fontWeight: 400,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
} as const

// ------------------------------------------------------------------- the bar
globalStyle(`${G} ${shell.barSplit}`, {
    borderBottom: INK_RULE,
})

globalStyle(`${G} ${shell.logo}`, {
    fontFamily: marketing.font.display,
    fontWeight: 600,
    fontSize: 22,
    letterSpacing: "-0.01em",
})

globalStyle(`${G} ${shell.link}`, {
    ...ticket,
    color: marketing.color.text,
})

globalStyle(`${G} ${shell.cta}`, {
    ...ticket,
    background: marketing.color.accent,
    color: marketing.color.onAccent,
    border: "none",
    boxShadow: "none",
    padding: "12px 18px",
})

// ------------------------------------------------------------------ the hero
globalStyle(`${G} ${hero.fullBleed}`, {
    minHeight: "min(88svh, 940px)",
    "@media": {
        // A phone stands the frame up: a tall crop that keeps the cook.
        "(max-width: 640px)": { minHeight: "min(640px, 150vw)" },
    },
})

globalStyle(`${G} ${hero.fullBleedImg}`, {
    objectPosition: "40% 30%",
})

globalStyle(`${G} ${hero.fullBleedScrim}`, {
    background:
        "linear-gradient(to top, rgba(20, 14, 8, 0.72) 0%, rgba(20, 14, 8, 0.3) 38%, rgba(20, 14, 8, 0) 62%)", // theme-exempt: a warm neutral scrim over photography, the same in every theme
})

globalStyle(`${G} ${hero.fullBleedBadge}`, {
    ...ticket,
    fontSize: 11,
    background: "none",
    color: WHITE,
    border: `1px solid rgba(255, 255, 255, 0.7)`, // theme-exempt: the ticket's edge over the scrim
    borderRadius: 0,
    padding: "6px 10px",
    boxShadow: "none",
})

globalStyle(`${G} ${hero.fullBleedHeadline}`, {
    fontFamily: marketing.font.display,
    fontWeight: 600,
    fontSize: `calc(clamp(56px, 8.6vw, 136px) * ${marketing.display.scale})`,
    lineHeight: 0.92,
    letterSpacing: "-0.02em",
    color: WHITE,
})

globalStyle(`${G} ${hero.fullBleed} ${hero.accentWord}`, {
    color: WHITE,
    fontStyle: "italic",
    fontWeight: 500,
})

globalStyle(`${G} ${hero.fullBleedSubheadline}`, {
    ...ticket,
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)", // theme-exempt: secondary copy over the scrim
})

globalStyle(`${G} ${hero.fullBleed} a`, {
    ...ticket,
    borderRadius: 0,
})

// ---------------------------------------------------------------- the headers
globalStyle(`${G} ${sectionHeaderCentered}`, {
    textAlign: "left",
    marginInline: 0,
})

globalStyle(`${G} ${sectionKicker}`, {
    ...ticket,
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    color: marketing.color.accent,
    background: "none",
    padding: 0,
    border: "none",
})

globalStyle(`${G} ${sectionKicker}::before`, {
    content: '""',
    width: 22,
    borderTop: `1.5px solid ${marketing.color.accent}`,
})

globalStyle(`${G} ${sectionTitle}, ${G} ${sectionTitleDisplay}`, {
    fontFamily: marketing.font.display,
    fontWeight: 600,
    fontSize: `calc(clamp(34px, 4.4vw, 58px) * ${marketing.display.scale})`,
    lineHeight: 1.02,
    letterSpacing: "-0.015em",
})

// --------------------------------------------------------------- the profile
// The profile sits like the head of a menu: the kicker in the margin
// column, the lede and the line beside it, under an ink rule.
globalStyle(`${G} ${prose.frame}`, {
    maxWidth: "none",
    margin: 0,
    display: "grid",
    gridTemplateColumns: "minmax(0, 3fr) minmax(0, 8fr)",
    columnGap: scaledSpace(32),
    alignItems: "start",
    borderTop: INK_RULE,
    paddingTop: scaledSpace(22),
    textAlign: "left",
    "@media": {
        "(max-width: 860px)": { gridTemplateColumns: "1fr" },
    },
})

globalStyle(`${G} ${prose.frame} > div`, {
    maxWidth: "62ch",
})

globalStyle(`${G} ${prose.paragraph}:first-of-type`, {
    fontFamily: marketing.font.display,
    fontWeight: 400,
    fontSize: `calc(clamp(22px, 2.2vw, 28px) * ${marketing.display.scale})`,
    lineHeight: 1.36,
    letterSpacing: "-0.005em",
    color: marketing.color.text,
})

// -------------------------------------------------------------- the kitchens
globalStyle(`${G} ${steps.timelinePhoto}`, {
    maxWidth: "none",
})

globalStyle(`${G} ${steps.timelinePhotoItem}::before`, {
    background: marketing.color.text,
    width: 1,
})

globalStyle(`${G} ${steps.timelineNode}`, {
    borderRadius: 0,
    border: "none",
    background: marketing.color.accent,
})

globalStyle(`${G} ${steps.timelineLabel}`, {
    ...ticket,
    fontSize: 12,
    lineHeight: 1,
    color: marketing.color.text,
    border: `1px solid ${marketing.color.text}`,
    padding: "5px 7px",
    background: marketing.color.pageBg,
})

globalStyle(`${G} ${steps.timelineTitle}`, {
    fontSize: `calc(clamp(22px, 2vw, 28px) * ${marketing.display.scale})`,
    lineHeight: 1.12,
    marginBottom: 12,
})

globalStyle(`${G} ${steps.timelineLead}`, {
    aspectRatio: "4 / 3",
})

// ------------------------------------------------------------- the numbers
globalStyle(`${G} ${stats.row}`, {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: scaledSpace(32),
    "@media": {
        "(max-width: 640px)": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
    },
})

globalStyle(`${G} ${stats.stat}`, {
    alignItems: "flex-start",
    borderTop: INK_RULE,
    paddingTop: scaledSpace(16),
    textAlign: "left",
})

globalStyle(`${G} ${stats.stat}:first-child`, {
    "@media": {
        "(max-width: 640px)": { gridColumn: "1 / -1" },
    },
})

globalStyle(`${G} ${stats.value}`, {
    fontFamily: marketing.font.display,
    fontWeight: 600,
    fontSize: `calc(clamp(52px, 6.4vw, 92px) * ${marketing.display.scale})`,
    lineHeight: 1,
    letterSpacing: "-0.02em",
    color: marketing.color.accent,
})

globalStyle(`${G} ${stats.label}`, {
    ...ticket,
    color: marketing.color.subtle,
})

// ------------------------------------------------------------ the clippings
globalStyle(`${G} ${showcase.storiesFlag}`, {
    borderTop: `3px double ${marketing.color.text}`,
    paddingTop: 12,
})

globalStyle(`${G} ${showcase.storiesTitle}`, {
    letterSpacing: "-0.01em",
})

globalStyle(`${G} ${showcase.storiesKicker}`, {
    ...ticket,
    fontStyle: "normal",
    color: marketing.color.accent,
})

globalStyle(`${G} ${showcase.storyKicker}`, {
    ...ticket,
    fontSize: 11,
    color: spot1,
})

globalStyle(`${G} ${showcase.storyPhotoLead}`, {
    aspectRatio: "4 / 3",
})

globalStyle(`${G} ${showcase.storyImg}`, {
    objectPosition: "50% 35%",
})

// -------------------------------------------------------------- the stations
globalStyle(`${G} ${cards.card}`, {
    background: "none",
    border: "none",
    borderTop: INK_RULE,
    borderRadius: 0,
    boxShadow: "none",
    padding: `${scaledSpace(16)} 0 0`,
    textAlign: "left",
})

globalStyle(`${G} ${cards.cardTitle}`, {
    fontFamily: marketing.font.display,
    fontWeight: 600,
    fontSize: `calc(24px * ${marketing.display.scale})`,
    letterSpacing: "-0.01em",
})

globalStyle(`${G} ${cards.cardBody}`, {
    fontSize: 15.5,
    lineHeight: 1.6,
})

// --------------------------------------------------------------- the contact
globalStyle(`${G} ${lead.body}`, {
    marginInline: 0,
})

globalStyle(`${G} ${lead.channels}`, {
    justifyContent: "flex-start",
    borderTop: HAIRLINE,
    paddingTop: scaledSpace(18),
})

globalStyle(`${G} ${lead.channel}`, {
    alignItems: "flex-start",
})

globalStyle(`${G} ${lead.channelLabel}`, {
    ...ticket,
    fontSize: 11,
    color: marketing.color.accent,
})

globalStyle(`${G} ${lead.channelValue}, ${G} ${lead.channelLink}`, {
    fontFamily: marketing.font.display,
    fontSize: `calc(20px * ${marketing.display.scale})`,
    fontWeight: 500,
})
