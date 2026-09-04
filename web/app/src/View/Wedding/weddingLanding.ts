import type { LandingConfig, MarketingShellConfig } from "@ui"
import {
    about,
    albums,
    faq,
    heroSlides,
    home,
    inquire,
    packages,
    packagesPage,
    photographer,
    selectedWork,
    type Album,
    type PhotoImage,
} from "./content"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import { weddingShell } from "./weddingShell"

/**
 * The wedding pack's pages as landing-kernel configs (docs/landing.md,
 * "The photography-grade set"). `content.ts` stays the single
 * owner-editable source; these builders only map it into sections.
 *
 * Every builder takes `basePath`: "" when the pack owns the site (links are
 * /weddings, /packages, …) and "/wedding" on the preview route — same
 * pages, both wirings.
 *
 * Every section carries a stable `id`: WeddingPage pipes these configs
 * through the landing document's per-page merge (`useSitePageConfig`), so
 * the platform's structural editor can reorder / delete / add sections on
 * these pages and the ids are what the document's skeleton binds to. The
 * pack's catalog maps the routes (`landing.routes` in catalog.json).
 */

const imageMedia = (image: PhotoImage) => ({
    kind: "image" as const,
    src: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
    srcSet: image.srcSet,
})

// The shared chrome lives in weddingShell.ts (manifest pages wear it too);
// this alias keeps the page builders reading naturally.
function shell(
    basePath: string,
    currentPath: "" | "/weddings" | "/packages" | "/about" | "/inquire",
): MarketingShellConfig {
    return weddingShell(basePath, currentPath)
}

/** Collection tiles for the wedding index — shared by home and /weddings. */
function weddingTiles(basePath: string) {
    return albums.map((album) => ({
        title: album.title,
        description: album.description,
        eyebrow: album.eyebrow,
        meta: `${album.images.length} photographs`,
        media: imageMedia(album.images[0]),
        url: `${basePath}/weddings?wedding=${album.slug}`,
    }))
}

/** The flat-priced packages as pricing tiers — shared by the home teaser
 * and /packages. The empty period suppresses "/mo", and equal
 * monthly/yearly suppresses the billing toggle. */
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

/**
 * The home spine is deliberately NOT the photography pack's: it opens on
 * the person (intro before the work — a wedding is booked on trust), runs
 * the selected work as a filmstrip rail instead of a justified wall, and
 * puts the pack's real differentiators — flat-priced packages (with the
 * private proofing room in their features) and the kind words — on the
 * first scroll instead of behind a nav link.
 */
export function homeLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.wedding },
        shell: shell(basePath, ""),
        sections: [
            {
                id: "hero",
                type: "hero",
                // The marquee over the night: masthead type across the
                // photograph — must match the catalog's landing seed byte
                // for byte.
                variant: "masthead-overlay",
                content: {
                    badge: home.badge,
                    headline: home.headline,
                    accent: "none",
                    subheadline: home.subheadline,
                    primaryCta: { label: "See the weddings", href: `${basePath}/weddings` },
                    secondaryCta: { label: "Check your date", href: `${basePath}/inquire` },
                    slides: heroSlides.map(imageMedia),
                },
            },
            {
                id: "intro",
                type: "content-split",
                variant: "media-left",
                content: {
                    kicker: home.intro.kicker,
                    headline: home.intro.title,
                    body: home.intro.paragraphs.join(" "),
                    media: imageMedia(about.portrait),
                    cta: { label: "More about me", href: `${basePath}/about` },
                },
            },
            {
                id: "selected-work",
                type: "gallery",
                // Tilted party polaroids — must match the catalog's seed.
                variant: "scrapbook",
                content: {
                    kicker: "From recent weddings",
                    items: selectedWork.map((image) => ({ media: imageMedia(image) })),
                    lightbox: true,
                },
            },
            {
                id: "packages",
                type: "pricing",
                variant: "tiers",
                content: {
                    kicker: packagesPage.kicker,
                    title: "Priced flat, told up front.",
                    period: "",
                    tiers: packageTiers(),
                },
            },
            {
                id: "kind-words",
                type: "testimonials",
                variant: "single-featured",
                content: {
                    kicker: "Kind words",
                    quotes: [
                        {
                            quote: about.testimonials[0].quote,
                            author: about.testimonials[0].name,
                            title: about.testimonials[0].detail,
                        },
                    ],
                },
            },
            {
                id: "weddings",
                type: "showcase",
                variant: "collections",
                content: {
                    kicker: "Recent weddings",
                    items: weddingTiles(basePath),
                },
            },
            {
                id: "inquire-banner",
                type: "cta-banner",
                // The RSVP as a ticket stub — must match the catalog's seed.
                variant: "ticket",
                content: {
                    title: "Planning a wedding, or something smaller?",
                    body: "Flat packages, one wedding a weekend, and a private proofing room for your families' print picks.",
                    cta: { label: "Check your date", href: `${basePath}/inquire` },
                },
            },
        ],
    }
}

/** The wedding index, or one wedding's sequenced gallery via `?wedding=`.
 * Wedding interiors carry `wedding-` ids and merge under
 * `pages["wedding-<slug>"]`: they share the /weddings route with the index
 * but are a different composition, and must never bind to the index's
 * documented skeleton.
 */
export function weddingsLanding(basePath: string, album: Album | undefined): LandingConfig {
    if (album !== undefined) {
        return {
            style: { preset: PACK_REGISTERS.wedding },
            shell: shell(basePath, "/weddings"),
            sections: [
                {
                    id: "wedding-hero",
                    type: "hero",
                    variant: "statement",
                    content: {
                        badge: album.eyebrow,
                        headline: album.title,
                        accent: "none",
                        subheadline: album.description,
                        secondaryCta: { label: "All weddings", href: `${basePath}/weddings` },
                    },
                },
                {
                    id: "wedding-gallery",
                    type: "gallery",
                    variant: "justified",
                    content: {
                        items: album.images.map((image) => ({ media: imageMedia(image) })),
                        lightbox: true,
                    },
                },
                {
                    id: "wedding-banner",
                    type: "cta-banner",
                    variant: "full-bleed",
                    content: {
                        title: "Want your day photographed like this?",
                        cta: { label: "Check your date", href: `${basePath}/inquire` },
                    },
                },
            ],
        }
    }
    return {
        style: { preset: PACK_REGISTERS.wedding },
        shell: shell(basePath, "/weddings"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: "The weddings.",
                    accent: "none",
                    subheadline:
                        "Three recent days, each sequenced the way it happened. Open one to see it in order.",
                },
            },
            {
                id: "weddings",
                type: "showcase",
                variant: "collections",
                content: {
                    items: weddingTiles(basePath),
                },
            },
        ],
    }
}

export function packagesLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.wedding },
        shell: shell(basePath, "/packages"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: packagesPage.headline,
                    accent: "none",
                    subheadline: packagesPage.body,
                },
            },
            {
                id: "packages",
                type: "pricing",
                variant: "tiers",
                content: {
                    kicker: packagesPage.kicker,
                    period: "",
                    tiers: packageTiers(),
                },
            },
            {
                id: "faq",
                type: "faq",
                variant: "accordion",
                content: {
                    kicker: packagesPage.faqKicker,
                    title: packagesPage.faqTitle,
                    items: faq,
                },
            },
            {
                id: "inquire-banner",
                type: "cta-banner",
                content: {
                    title: "Your date might be open right now.",
                    cta: { label: "Check your date", href: `${basePath}/inquire` },
                },
            },
        ],
    }
}

export function aboutLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.wedding },
        shell: shell(basePath, "/about"),
        sections: [
            {
                id: "story",
                type: "content-split",
                variant: "media-left",
                content: {
                    kicker: "About",
                    headline: about.headline,
                    body: about.paragraphs.join(" "),
                    media: imageMedia(about.portrait),
                    cta: { label: "Check your date", href: `${basePath}/inquire` },
                },
            },
            {
                id: "kind-words",
                type: "testimonials",
                variant: "quote-grid",
                content: {
                    kicker: "Kind words",
                    title: "From couples and their families",
                    quotes: about.testimonials.map((entry) => ({
                        quote: entry.quote,
                        author: entry.name,
                        title: entry.detail,
                    })),
                },
            },
            {
                id: "inquire-banner",
                type: "cta-banner",
                content: {
                    title: "Let's talk about your day.",
                    cta: { label: "Start an inquiry", href: `${basePath}/inquire` },
                },
            },
        ],
    }
}

export function inquireLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.wedding },
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
                    cta: "Send inquiry",
                    confirmation: inquire.confirmation,
                    fields: inquire.fields,
                    // Direct channels trail the form. The email is deliberately
                    // plain text (no mailto:), selectable for whatever mail
                    // client the visitor actually uses — the form itself
                    // delivers through the platform's managed forms pipeline.
                    channels: [
                        { label: "Email", value: photographer.email },
                        { label: "Studio", value: photographer.location },
                        {
                            label: "Instagram",
                            // Handle only, no href: the shipped profile is
                            // fictional, and a dead external link is worse
                            // than none. Add `href: photographer.instagram`
                            // back once content.ts points at a real profile.
                            value: `@${photographer.instagram.split("/").pop() ?? ""}`,
                        },
                    ],
                },
            },
        ],
    }
}
