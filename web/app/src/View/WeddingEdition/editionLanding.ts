import type { LandingConfig, MarketingShellConfig } from "@ui"
import {
    about,
    classified,
    desksPicks,
    faq,
    home,
    inquire,
    letters,
    packages,
    photographer,
    pricesPage,
    proofingNote,
    rolls,
    stories,
    type Frame,
    type PhotoImage,
    type Roll,
} from "./content"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import { editionShell } from "./editionShell"

/**
 * The Late Edition's pages as landing-kernel configs (docs/landing.md,
 * "The newsroom set"). `content.ts` stays the single owner-editable
 * source; these builders only map it into sections.
 *
 * Every builder takes `basePath`: "" when the pack owns the site (links are
 * /weddings, /prices, …) and "/wedding-edition" on the preview route —
 * same pages, both wirings.
 *
 * Every section carries a stable `id`: WeddingEditionPage pipes these
 * configs through the landing document's per-page merge
 * (`useSitePageConfig`), so the platform's structural editor can reorder /
 * delete / add sections on these pages; the pack's catalog seeds the same
 * ids and variants (`landing.pages` in catalog.json).
 */

const imageMedia = (image: PhotoImage) => ({
    kind: "image" as const,
    src: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
    srcSet: image.srcSet,
})

type PagePath = "" | "/weddings" | "/prices" | "/about" | "/inquire"

// The shared chrome lives in editionShell.ts (manifest pages wear it too);
// this alias keeps the page builders reading naturally.
function shell(basePath: string, currentPath: PagePath): MarketingShellConfig {
    return editionShell(basePath, currentPath)
}

/**
 * Today's date as the front page prints it, in the paper's own time zone —
 * a late edition is always today's. Injectable so tests and baked
 * previews can pin it.
 */
export function editionDateline(now: Date): string {
    return new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "America/New_York",
    }).format(now)
}

const rollHref = (basePath: string, roll: Roll): string => `${basePath}/weddings?roll=${roll.slug}`

function rollBySlug(slug: string): Roll {
    const roll = rolls.find((entry) => entry.slug === slug)
    if (roll === undefined) {
        throw new Error(`editionLanding: no roll "${slug}"`)
    }
    return roll
}

/** One roll's frames as contact-sheet items: the photo, the grease pencil, the note. */
function sheetItems(frames: readonly Frame[]) {
    return frames.map((entry) => ({
        media: imageMedia(entry.image),
        caption: entry.image.alt,
        ...(entry.mark !== undefined ? { mark: entry.mark } : {}),
        ...(entry.note !== undefined ? { note: entry.note } : {}),
    }))
}

/** The flat-priced packages as pricing tiers. The empty period suppresses
 * "/mo", and equal monthly/yearly suppresses the billing toggle. */
function packageTiers() {
    return packages.map((entry) => ({
        name: entry.name,
        monthly: entry.price,
        yearlyPerMonth: entry.price,
        description: entry.description,
        features: entry.features,
        ...(entry.highlighted !== undefined ? { highlighted: entry.highlighted } : {}),
        ...(entry.badge !== undefined ? { badge: entry.badge } : {}),
    }))
}

function classifiedContent(basePath: string) {
    return {
        kicker: classified.kicker,
        title: classified.title,
        price: classified.price,
        body: classified.body,
        cta: { label: "Check your date", href: `${basePath}/inquire` },
        finePrint: classified.finePrint,
        signoff: classified.signoff,
    }
}

function lettersContent() {
    return {
        kicker: "Mailbag",
        title: "Letters to the editor",
        quotes: letters.map((entry) => ({ quote: entry.quote, author: entry.name, title: entry.detail })),
    }
}

/**
 * The front page: the lead story (front-page hero, with the dateline
 * computed for today), the stories under the fold, the rate card, the
 * mailbag, and the classified as the closing ask.
 */
export function homeLanding(basePath: string, now: Date = new Date()): LandingConfig {
    const leadRoll = rolls[0]
    return {
        style: { preset: PACK_REGISTERS["wedding-edition"] },
        shell: shell(basePath, ""),
        sections: [
            {
                id: "hero",
                type: "hero",
                // Must match the catalog's landing seed byte for byte.
                variant: "front-page",
                content: {
                    badge: home.kicker,
                    headline: home.headline,
                    accent: "last-word",
                    subheadline: home.deck,
                    primaryCta: { label: "Check your date", href: `${basePath}/inquire` },
                    secondaryCta: { label: "See the contact sheets", href: `${basePath}/weddings` },
                    media: imageMedia(home.leadPhoto),
                    edition: {
                        dateline: editionDateline(now),
                        masthead: photographer.paper,
                        issue: home.issue,
                        byline: photographer.name,
                        bylineRole: photographer.role,
                        bylineMedia: imageMedia(photographer.portrait),
                        caption: home.caption,
                        ...(leadRoll !== undefined
                            ? {
                                  jump: {
                                      label: `Contact sheet, Roll ${leadRoll.number} →`,
                                      href: rollHref(basePath, leadRoll),
                                  },
                              }
                            : {}),
                    },
                },
            },
            {
                id: "stories",
                type: "showcase",
                variant: "stories",
                content: {
                    kicker: photographer.motto,
                    title: "Under the fold",
                    items: stories.map((story) => {
                        const roll = rollBySlug(story.roll)
                        return {
                            eyebrow: story.kicker,
                            title: story.headline,
                            description: story.body,
                            meta: story.dateline,
                            media: imageMedia(story.image),
                            url: rollHref(basePath, roll),
                            linkLabel: `Continued on Roll ${roll.number} →`,
                        }
                    }),
                },
            },
            {
                id: "packages",
                type: "pricing",
                variant: "tiers",
                content: {
                    kicker: pricesPage.kicker,
                    title: "The rate card",
                    period: "",
                    tiers: packageTiers(),
                },
            },
            {
                id: "letters",
                type: "testimonials",
                variant: "quote-grid",
                content: lettersContent(),
            },
            {
                id: "classified",
                type: "cta-banner",
                variant: "classified",
                content: classifiedContent(basePath),
            },
        ],
    }
}

/**
 * The weddings index — the desk's circled picks as one contact sheet, then
 * every roll as a story — or one roll's full sheet via `?roll=`. Roll
 * interiors carry `roll-` ids and merge under `pages["roll-<slug>"]`: they
 * share the /weddings route with the index but are a different
 * composition, and must never bind to the index's documented skeleton.
 */
export function weddingsLanding(basePath: string, roll: Roll | undefined): LandingConfig {
    if (roll !== undefined) {
        return {
            style: { preset: PACK_REGISTERS["wedding-edition"] },
            shell: shell(basePath, "/weddings"),
            sections: [
                {
                    id: "roll-hero",
                    type: "hero",
                    variant: "statement",
                    content: {
                        headline: `Roll ${roll.number}: ${roll.title}`,
                        accent: "none",
                        subheadline: `${roll.eyebrow}. ${roll.description}`,
                        secondaryCta: { label: "All the sheets", href: `${basePath}/weddings` },
                    },
                },
                {
                    id: "roll-sheet",
                    type: "gallery",
                    variant: "contact-sheet",
                    content: {
                        edgeCode: roll.edgeCode,
                        firstFrame: roll.firstFrame,
                        items: sheetItems(roll.frames),
                        lightbox: true,
                    },
                },
                {
                    id: "roll-classified",
                    type: "cta-banner",
                    variant: "classified",
                    content: classifiedContent(basePath),
                },
            ],
        }
    }
    return {
        style: { preset: PACK_REGISTERS["wedding-edition"] },
        shell: shell(basePath, "/weddings"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: "The contact sheets.",
                    accent: "none",
                    subheadline:
                        "Every wedding gets proofed like a roll of film — frames in order, the keepers circled in grease pencil. Open a roll to see the whole night.",
                },
            },
            {
                id: "picks",
                type: "gallery",
                variant: "contact-sheet",
                content: {
                    kicker: "Circled by the desk",
                    title: "This month's picks",
                    edgeCode: "Kodak Portra 400",
                    firstFrame: 1,
                    items: sheetItems(desksPicks),
                    lightbox: true,
                },
            },
            {
                id: "rolls",
                type: "showcase",
                variant: "stories",
                content: {
                    kicker: "Filed this season",
                    title: "The rolls",
                    items: rolls.map((entry) => {
                        const cover = entry.frames.find((frame) => frame.mark === "circle") ?? entry.frames[0]
                        return {
                            eyebrow: `Roll ${entry.number} · ${entry.eyebrow}`,
                            title: entry.title,
                            description: entry.description,
                            ...(cover !== undefined ? { media: imageMedia(cover.image) } : {}),
                            url: rollHref(basePath, entry),
                            linkLabel: `See all ${entry.frames.length} frames →`,
                        }
                    }),
                },
            },
            {
                id: "classified",
                type: "cta-banner",
                variant: "classified",
                content: classifiedContent(basePath),
            },
        ],
    }
}

/** The rate card: packages, the proofing room's public door, the reader questions. */
export function pricesLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["wedding-edition"] },
        shell: shell(basePath, "/prices"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: pricesPage.headline,
                    accent: "none",
                    subheadline: pricesPage.body,
                },
            },
            {
                id: "packages",
                type: "pricing",
                variant: "tiers",
                content: {
                    period: "",
                    tiers: packageTiers(),
                },
            },
            {
                id: "proofing",
                type: "content-split",
                variant: "media-right",
                content: {
                    kicker: proofingNote.kicker,
                    headline: proofingNote.headline,
                    body: proofingNote.body,
                    media: imageMedia(proofingNote.image),
                    cta: { label: proofingNote.cta, href: `${basePath}/proof?album=${proofingNote.slug}` },
                },
            },
            {
                id: "faq",
                type: "faq",
                variant: "accordion",
                content: {
                    kicker: pricesPage.faqKicker,
                    title: pricesPage.faqTitle,
                    items: faq,
                },
            },
            {
                id: "classified",
                type: "cta-banner",
                variant: "classified",
                content: classifiedContent(basePath),
            },
        ],
    }
}

export function aboutLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["wedding-edition"] },
        shell: shell(basePath, "/about"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: about.headline,
                    accent: "none",
                    subheadline: about.deck,
                },
            },
            {
                id: "story",
                type: "content-split",
                variant: "media-left",
                content: {
                    kicker: about.kicker,
                    headline: about.title,
                    body: about.paragraphs.join(" "),
                    media: imageMedia(photographer.portrait),
                    cta: { label: "Check your date", href: `${basePath}/inquire` },
                },
            },
            {
                id: "rules",
                type: "steps",
                variant: "timeline",
                content: {
                    kicker: "House rules",
                    title: "The desk's standards",
                    steps: about.rules.map((rule) => ({ title: rule.title, description: rule.body })),
                },
            },
            {
                id: "letters",
                type: "testimonials",
                variant: "quote-grid",
                content: lettersContent(),
            },
            {
                id: "classified",
                type: "cta-banner",
                variant: "classified",
                content: classifiedContent(basePath),
            },
        ],
    }
}

export function inquireLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["wedding-edition"] },
        shell: shell(basePath, "/inquire"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: inquire.headline,
                    accent: "none",
                    subheadline: inquire.body,
                },
            },
            {
                id: "inquiry-form",
                type: "lead-form",
                variant: "detail-form",
                content: {
                    kicker: "Inquiry",
                    title: "The details",
                    cta: "File it",
                    confirmation: inquire.confirmation,
                    fields: inquire.fields,
                    // Direct channels trail the form. The email is plain text
                    // (no mailto:), selectable for whatever mail client the
                    // visitor uses — the form itself delivers through the
                    // platform's managed forms pipeline.
                    channels: [
                        { label: "Email", value: photographer.email },
                        { label: "The desk", value: photographer.location },
                        {
                            label: "Instagram",
                            // Handle only, no href: the shipped profile is
                            // fictional, and a dead external link is worse
                            // than none.
                            value: `@${photographer.instagram.split("/").pop() ?? ""}`,
                        },
                    ],
                },
            },
        ],
    }
}
