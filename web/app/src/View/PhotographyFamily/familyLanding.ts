import type { LandingConfig, MarketingShellConfig } from "@ui"
import {
    about,
    albums,
    book,
    demoProofingAlbums,
    galleries,
    heroSlides,
    home,
    inquire,
    investment,
    photographer,
    selectedWork,
    type Album,
    type PhotoImage,
} from "./content"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import { familyShell } from "./familyShell"

/**
 * The family-photography pack's pages as landing-kernel configs
 * (docs/landing.md, "The photography-grade set"). `content.ts` stays the
 * single owner-editable source; these builders only map it into sections.
 *
 * Every builder takes `basePath`: "" when the pack owns the site (links
 * are /work, /investment, …) and "/photography-family" on the preview
 * route — same pages, both wirings.
 *
 * Every section carries a stable `id`: PhotographyFamilyPage pipes these
 * configs through the landing document's per-page merge
 * (`useSitePageConfig`), so the platform's structural editor can reorder /
 * delete / add sections and the ids are what the document's skeleton binds
 * to. The pack's catalog maps the routes (`landing.routes` in
 * catalog.json).
 */

const imageMedia = (image: PhotoImage) => ({
    kind: "image" as const,
    src: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
    srcSet: image.srcSet,
})

// The shared chrome lives in familyShell.ts (manifest pages wear it too);
// this alias keeps the page builders reading naturally.
function shell(
    basePath: string,
    currentPath: "" | "/work" | "/galleries" | "/investment" | "/about" | "/book" | "/inquire",
): MarketingShellConfig {
    return familyShell(basePath, currentPath)
}

function collectionTiles(basePath: string) {
    return albums.map((album) => ({
        title: album.title,
        description: album.description,
        eyebrow: album.eyebrow,
        meta: `${album.images.length} photographs`,
        media: imageMedia(album.images[0]),
        url: `${basePath}/work?album=${album.slug}`,
    }))
}

export function homeLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["photography-family"] },
        shell: shell(basePath, ""),
        sections: [
            {
                id: "hero",
                type: "hero",
                // The photograph IS the page: a slow crossfade of one frame
                // from each body of work — must match the catalog's landing
                // seed byte for byte.
                variant: "full-bleed-media",
                content: {
                    badge: home.badge,
                    headline: home.headline,
                    accent: "none",
                    subheadline: home.subheadline,
                    primaryCta: { label: "See the work", href: `${basePath}/work` },
                    secondaryCta: { label: "Book a session", href: `${basePath}/book` },
                    slides: heroSlides.map(imageMedia),
                },
            },
            {
                id: "selected-work",
                type: "gallery",
                // Justified, never masonry: the edit's order IS the craft.
                variant: "justified",
                content: {
                    kicker: "Selected work",
                    items: selectedWork.map((image) => ({ media: imageMedia(image) })),
                    // The work owns the whole width — the gallery-first
                    // promise starts on the first scroll.
                    fullBleed: true,
                    lightbox: true,
                },
            },
            {
                id: "intro",
                type: "content-split",
                variant: "media-right",
                content: {
                    kicker: home.intro.kicker,
                    headline: home.intro.title,
                    body: home.intro.paragraphs.join(" "),
                    media: imageMedia(about.portrait),
                    cta: { label: "More about me", href: `${basePath}/about` },
                },
            },
            {
                id: "collections",
                type: "showcase",
                variant: "collections",
                content: {
                    kicker: "The work",
                    items: collectionTiles(basePath),
                },
            },
            {
                id: "kind-words",
                type: "testimonials",
                // One voice at pull-quote scale — the trust moment before
                // the closing CTA.
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
                id: "book-banner",
                type: "cta-banner",
                content: {
                    title: "Golden hour is booking now.",
                    body: "Evenings fill a season ahead — hold a date and we'll plan the rest together.",
                    cta: { label: "Book a session", href: `${basePath}/book` },
                },
            },
        ],
    }
}

/** The collections index, or one album's sequenced gallery via `?album=`.
 * Album views carry `album-` ids and merge under `pages["album-<slug>"]`:
 * they share the /work route with the index but are a different
 * composition, and must never bind to the index's documented skeleton.
 */
export function workLanding(basePath: string, album: Album | undefined): LandingConfig {
    if (album !== undefined) {
        return {
            style: { preset: PACK_REGISTERS["photography-family"] },
            shell: shell(basePath, "/work"),
            sections: [
                {
                    id: "album-hero",
                    type: "hero",
                    variant: "statement",
                    content: {
                        badge: album.eyebrow,
                        headline: album.title,
                        accent: "none",
                        subheadline: album.description,
                        secondaryCta: { label: "All collections", href: `${basePath}/work` },
                    },
                },
                {
                    id: "album-gallery",
                    type: "gallery",
                    variant: "justified",
                    content: {
                        items: album.images.map((image) => ({ media: imageMedia(image) })),
                        lightbox: true,
                    },
                },
                {
                    id: "album-banner",
                    type: "cta-banner",
                    content: {
                        title: "Picture your family here.",
                        cta: { label: "Book a session", href: `${basePath}/book` },
                    },
                },
            ],
        }
    }
    return {
        style: { preset: PACK_REGISTERS["photography-family"] },
        shell: shell(basePath, "/work"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: "The work.",
                    accent: "none",
                    subheadline:
                        "Three bodies of work, each sequenced the way the day unfolded. Open a collection to see it in order.",
                },
            },
            {
                id: "collections",
                type: "showcase",
                variant: "collections",
                content: {
                    items: collectionTiles(basePath),
                },
            },
        ],
    }
}

export function aboutLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["photography-family"] },
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
                    cta: { label: "Work with me", href: `${basePath}/book` },
                },
            },
            {
                id: "kind-words",
                type: "testimonials",
                content: {
                    kicker: "Kind words",
                    title: "From the families",
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
                    title: "Let's make the album your kids will fight over.",
                    cta: { label: "Start an inquiry", href: `${basePath}/inquire` },
                },
            },
        ],
    }
}

/**
 * The `/galleries` page: client-facing proofing, explained — the owner
 * mandate that photography templates allude to proofing on the site
 * itself, not just behind an unlisted route. Hero states the promise,
 * the timeline walks delivery → choosing → hand-finishing, and the
 * sample section links straight into the Ashford demo room (access code
 * in the copy) so a visitor can walk the real gate and selection tray.
 */
export function galleriesLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["photography-family"] },
        shell: shell(basePath, "/galleries"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: galleries.headline,
                    accent: "none",
                    subheadline: galleries.intro,
                },
            },
            {
                id: "gallery-steps",
                type: "steps",
                variant: "timeline",
                content: {
                    kicker: "After the session",
                    title: "How your gallery works",
                    steps: galleries.steps.map((step) => ({
                        title: step.title,
                        description: step.body,
                    })),
                },
            },
            {
                id: "sample-room",
                type: "content-split",
                variant: "media-right",
                content: {
                    kicker: galleries.sample.kicker,
                    headline: galleries.sample.title,
                    body: galleries.sample.body,
                    media: imageMedia(demoProofingAlbums[0].images[0]),
                    cta: {
                        label: galleries.sample.cta,
                        href: `${basePath}/proof?album=${galleries.sample.slug}`,
                    },
                },
            },
            {
                id: "book-banner",
                type: "cta-banner",
                content: {
                    title: "Your gallery starts with a session.",
                    body: "Hold a golden hour on the calendar and the rest of this page takes care of itself.",
                    cta: { label: "Book a session", href: `${basePath}/book` },
                },
            },
        ],
    }
}

export function investmentLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["photography-family"] },
        shell: shell(basePath, "/investment"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: investment.headline,
                    accent: "none",
                    subheadline: investment.body,
                },
            },
            {
                id: "offerings",
                type: "pricing",
                variant: "tiers",
                content: {
                    kicker: "Sessions",
                    title: "Priced flat, told up front.",
                    // Flat session prices: equal monthly/yearly suppresses the
                    // billing toggle; period "" suppresses the "/mo" reading.
                    period: "",
                    tiers: investment.offerings.map((offering) => ({
                        name: offering.name,
                        monthly: offering.price,
                        yearlyPerMonth: offering.price,
                        description: `${offering.duration} — ${offering.description}`,
                        features: offering.includes,
                        ...(offering.highlighted ? { highlighted: true } : {}),
                    })),
                },
            },
            {
                id: "how-it-works",
                type: "steps",
                variant: "timeline",
                content: {
                    kicker: "How it works",
                    title: "From hello to hanging on the wall",
                    steps: investment.steps.map((step) => ({
                        title: step.title,
                        description: step.body,
                    })),
                },
            },
            {
                id: "faq",
                type: "faq",
                variant: "accordion",
                content: {
                    kicker: "Questions",
                    title: "Asked by every family (rightly so)",
                    items: investment.faq.map((entry) => ({
                        question: entry.question,
                        answer: entry.answer,
                    })),
                },
            },
            {
                id: "book-banner",
                type: "cta-banner",
                content: {
                    title: "Ready when you are.",
                    body: book.flexibleNote,
                    cta: { label: "Book a session", href: `${basePath}/book` },
                },
            },
        ],
    }
}

export function bookLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["photography-family"] },
        shell: shell(basePath, "/book"),
        sections: [
            // The SessionBookingWidget mounts as this page's hero trailer
            // (PhotographyFamilyPage `sectionTrailers`), so the times sit
            // right under the headline.
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: book.headline,
                    accent: "none",
                    subheadline: book.intro,
                },
            },
            {
                id: "flexible-banner",
                type: "cta-banner",
                content: {
                    title: "Dates that don't fit a calendar?",
                    body: book.flexibleNote,
                    cta: { label: "Send an inquiry", href: `${basePath}/inquire` },
                },
            },
        ],
    }
}

export function inquireLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["photography-family"] },
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
