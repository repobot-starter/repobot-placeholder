import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import { scaledSpace } from "../theme/feelBridge"
import * as backdrop from "../MarketingBackdrop.styles.css"
import * as banner from "../MarketingCtaBanner.styles.css"
import * as gallery from "../MarketingGallery.styles.css"
import * as hero from "../MarketingHero.styles.css"
import * as pricing from "../MarketingPricing.styles.css"
import * as shell from "../MarketingShell.styles.css"
import * as split from "../MarketingContentSplit.styles.css"
import * as quotes from "../MarketingTestimonials.styles.css"
import { ctaPrimary, ctaSecondary, sectionKicker, sectionTitle } from "../shared.css"

/*
 * `limone` (limone): the Italian coast on film. The centered masthead
 * sets the studio's name in wide thin capitals between two rows of small
 * caps; the hero keeps its copy small and centered at the top of the
 * photograph, where the sky is. Kickers are letterspaced small caps with
 * no chrome; titles are the hairline display face at ease. Captioned
 * stacks read as location slates in small caps, contact sheets sit on a
 * chalk mat under a hairline, collections are ruled columns with no card,
 * and the closing band is one quiet line of type over a hairline link on
 * a lightly veiled photograph. Corners are square throughout.
 */
const T = '[data-marketing-treatment~="limone"]'
const ink = marketing.color.text
const quiet = marketing.color.subtle
const rule = marketing.color.line
const chalk = marketing.color.surface
const smallCaps = {
    fontFamily: marketing.font.body,
    fontWeight: 400,
    textTransform: "uppercase" as const,
    letterSpacing: "0.24em",
}

// -- Kickers and titles: small caps with no chrome, the hairline face at ease.
globalStyle(`${T} ${sectionKicker}`, {
    ...smallCaps,
    fontSize: 11.5,
    color: quiet,
})
globalStyle(`${T} ${sectionTitle}`, {
    fontWeight: 400,
    letterSpacing: "0.01em",
})

// -- Masthead: the name in wide thin capitals, the links in small caps.
globalStyle(`${T} ${shell.logoCentered}, ${T} ${shell.logoCentered} *`, {
    fontFamily: marketing.font.display,
    fontWeight: 400,
    textTransform: "uppercase",
    letterSpacing: "0.26em",
})
globalStyle(`${T} ${shell.logoCentered}`, {
    fontSize: "clamp(17px, 2.1vw, 28px)",
    "@media": {
        "(max-width: 640px)": { letterSpacing: "0.18em" },
    },
})
globalStyle(`${T} ${shell.link}`, {
    ...smallCaps,
    fontSize: 11,
    letterSpacing: "0.2em",
})
globalStyle(`${T} ${shell.cta}`, {
    ...smallCaps,
    fontSize: 11,
    letterSpacing: "0.2em",
    background: "transparent",
    color: ink,
    border: `1px solid ${ink}`,
    borderRadius: 0,
    boxShadow: "none",
    padding: "10px 18px",
})

// -- Hero: the copy small and centered in the sky at the top of the frame.
globalStyle(`${T} ${hero.fullBleed}`, {
    alignItems: "flex-start",
    "@media": {
        // A phone keeps the landscape frame's people: a shorter floor crops
        // less of the sides, and the copy drops to the foot so the faces stay clear.
        "(max-width: 640px)": { minHeight: "clamp(460px, 124vw, 580px)", alignItems: "flex-end" },
    },
})
globalStyle(`${T} ${hero.fullBleedScrim}`, {
    background:
        "linear-gradient(180deg, rgba(12, 11, 8, 0.34) 0%, rgba(12, 11, 8, 0.08) 34%, rgba(12, 11, 8, 0) 55%)", // theme-exempt: a scrim over photography, the same in every theme
    "@media": {
        "(max-width: 640px)": {
            background:
                "linear-gradient(0deg, rgba(12, 11, 8, 0.66) 0%, rgba(12, 11, 8, 0.34) 36%, rgba(12, 11, 8, 0) 58%)", // theme-exempt: the phone's copy sits over the frame's foot
        },
    },
})
globalStyle(`${T} ${hero.fullBleedInner}`, {
    textAlign: "center",
    padding: `${scaledSpace(64)} 24px 0`,
    "@media": {
        "(max-width: 640px)": { padding: `0 20px ${scaledSpace(36)}` },
    },
})

globalStyle(`${T} ${hero.fullBleedBadge}`, {
    ...smallCaps,
    fontSize: 11.5,
    letterSpacing: "0.34em",
    color: "rgba(255, 255, 255, 0.9)", // theme-exempt: copy over a photographic scrim is white in every theme
    marginBottom: scaledSpace(14),
})
globalStyle(`${T} ${hero.fullBleedHeadline}`, {
    fontSize: `calc(clamp(38px, 4.6vw, 70px) * ${marketing.display.scale})`,
    fontWeight: 400,
    letterSpacing: "0.02em",
    lineHeight: 1.08,
    marginInline: "auto",
    maxWidth: "18ch",
})
globalStyle(`${T} ${hero.fullBleedSubheadline}`, {
    fontSize: 15,
    letterSpacing: "0.02em",
    marginInline: "auto",
    maxWidth: 520,
})

// -- Buttons: square, ink, small caps.
globalStyle(`${T} ${ctaPrimary}`, {
    ...smallCaps,
    fontSize: 11.5,
    letterSpacing: "0.22em",
    background: ink,
    color: marketing.color.pageBg,
    borderRadius: 0,
    boxShadow: "none",
    padding: "15px 28px",
})
globalStyle(`${T} ${ctaSecondary}`, {
    ...smallCaps,
    fontSize: 11.5,
    letterSpacing: "0.22em",
    borderRadius: 0,
})

// -- Captioned stack: the location slate in small caps.
globalStyle(`${T} ${gallery.overlayCaption}`, {
    fontSize: 11.5,
    letterSpacing: "0.26em",
})

// -- The person: a square print beside the note.
globalStyle(`${T} ${split.mediaImg}`, {
    borderRadius: 0,
})
globalStyle(`${T} ${split.headline}`, {
    fontWeight: 400,
})

// -- Contact sheets on a chalk mat under a hairline.
globalStyle(`${T} ${gallery.sheet}`, {
    outline: `${scaledSpace(26)} solid ${chalk}`,
    boxShadow: `0 0 0 calc(${scaledSpace(26)} + 1px) ${rule}`,
    marginBlock: scaledSpace(28),
    "@media": {
        "(max-width: 640px)": { outlineWidth: 12, boxShadow: `0 0 0 13px ${rule}` },
    },
})

globalStyle(`${T} ${gallery.sheetMark}, ${T} ${gallery.sheetNote}`, {
    color: "#e0503a", // theme-exempt: a red chinagraph pencil on the contact print
})

// -- Collections: ruled columns, no card, the price in the display face.
globalStyle(`${T} ${pricing.tierCard}`, {
    background: "transparent",
    border: "none",
    borderTop: `1px solid ${ink}`,
    borderRadius: 0,
    boxShadow: "none",
    padding: `${scaledSpace(26)} 4px 0`,
})
globalStyle(`${T} ${pricing.tierBadge}`, {
    ...smallCaps,
    fontSize: 10.5,
    background: "transparent",
    color: marketing.color.accent,
    border: "none",
    padding: 0,
    position: "static",
    transform: "none",
    marginBottom: 10,
})
globalStyle(`${T} ${pricing.tierName}`, {
    ...smallCaps,
    fontSize: 12.5,
    color: ink,
})
globalStyle(`${T} ${pricing.tierPrice}`, {
    fontFamily: marketing.font.display,
    fontWeight: 400,
    fontSize: 46,
    letterSpacing: "0.01em",
})
globalStyle(`${T} ${pricing.tierFeatureItem}`, {
    borderColor: rule,
})

// -- One voice at pull-quote scale in the hairline face.
globalStyle(`${T} ${quotes.featuredQuote}`, {
    fontFamily: marketing.font.display,
    fontWeight: 400,
    fontSize: "clamp(24px, 2.6vw, 36px)",
    lineHeight: 1.3,
})
globalStyle(`${T} ${quotes.author}`, {
    ...smallCaps,
    fontSize: 11.5,
})

// -- The closing band: a tall photograph, lightly veiled at its centre,
// one line of type over a hairline link, set in the photograph's upper sky.
globalStyle(`${T} ${backdrop.bleed}`, {
    display: "flex",
    alignItems: "flex-start",
    minHeight: "clamp(440px, 80vh, 860px)",
    marginTop: scaledSpace(64),
})
globalStyle(`${T} ${backdrop.overlaySoft}`, {
    background: `radial-gradient(ellipse 46% 30% at 50% 22%, color-mix(in srgb, ${marketing.color.pageBg} 80%, transparent) 0%, color-mix(in srgb, ${marketing.color.pageBg} 38%, transparent) 55%, transparent 100%)`,
})
globalStyle(`${T} ${backdrop.bleed} ${banner.band}`, {
    marginTop: 0,
    paddingBlock: `clamp(48px, 12vh, 128px) ${scaledSpace(40)}`,
})
globalStyle(`${T} ${backdrop.bleed} ${banner.title}`, {
    fontSize: "clamp(22px, 2.4vw, 32px)",
    fontWeight: 400,
    letterSpacing: "0.02em",
    marginBottom: 18,
})
globalStyle(`${T} ${backdrop.bleed} ${banner.cta}`, {
    ...smallCaps,
    fontSize: 12,
    background: "transparent",
    color: ink,
    padding: "0 0 6px",
    borderBottom: `1px solid ${ink}`,
})

// -- Footer: small caps.
globalStyle(`${T} ${shell.footerNote}, ${T} ${shell.footerBlurb}`, {
    ...smallCaps,
    fontSize: 10.5,
    letterSpacing: "0.2em",
})
