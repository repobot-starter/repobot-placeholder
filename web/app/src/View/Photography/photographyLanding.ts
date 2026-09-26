import type { LandingConfig, MarketingShellConfig } from "@ui"
import {
    about,
    albums,
    booking,
    galleries,
    heroSlides,
    home,
    inquire,
    photographer,
    selectedWork,
    work,
    type Album,
    type PhotoImage,
} from "./content"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import { photographyShell } from "./photographyShell"

/**
 * The photography pack's pages as landing-kernel configs (docs/landing.md,
 * "The photography-grade set"). `content.ts` stays the single owner-editable
 * source; these builders only map it into sections.
 *
 * Every builder takes `basePath`: "" when the pack owns the site (links are
 * /work, /about, /inquire) and "/photography" on the preview route — same
 * pages, both wirings.
 *
 * Every section carries a stable `id`: PhotographyPage pipes these configs
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

// The shared chrome lives in photographyShell.ts (manifest pages wear it
// too); this alias keeps the page builders reading naturally.
function shell(
    basePath: string,
    currentPath: "" | "/work" | "/galleries" | "/about" | "/book" | "/inquire",
): MarketingShellConfig {
    return photographyShell(basePath, currentPath)
}

export function homeLanding(basePath: string): LandingConfig {
    if (home.layout === "stack") {
        return stackHomeLanding(basePath)
    }
    return {
        style: { preset: PACK_REGISTERS.photography },
        shell: shell(basePath, ""),
        sections: [
            {
                id: "hero",
                type: "hero",
                // The tour book's cover: masthead type over the photograph —
                // must match the catalog's landing seed byte for byte.
                variant: "masthead-overlay",
                content: {
                    badge: home.badge,
                    headline: home.headline,
                    accent: "none",
                    subheadline: home.subheadline,
                    primaryCta: { label: "See the work", href: `${basePath}/work` },
                    secondaryCta: { label: "Inquire", href: `${basePath}/inquire` },
                    slides: heroSlides.map(imageMedia),
                },
            },
            {
                id: "selected-work",
                type: "gallery",
                // Tilted taped-in prints — must match the catalog's seed.
                variant: "scrapbook",
                content: {
                    kicker: "Selected work",
                    items: selectedWork.map((image) => ({ media: imageMedia(image) })),
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
                    cta: { label: "More about the studio", href: `${basePath}/about` },
                },
            },
            {
                id: "collections",
                type: "showcase",
                variant: "collections",
                content: {
                    kicker: "Collections",
                    items: albums.map((album) => ({
                        title: album.title,
                        description: album.description,
                        eyebrow: album.eyebrow,
                        meta: `${album.images.length} photographs`,
                        media: imageMedia(album.images[0]),
                        url: `${basePath}/work?album=${album.slug}`,
                    })),
                },
            },
            {
                id: "inquire-banner",
                type: "cta-banner",
                content: {
                    title: "Planning a portrait or a commission?",
                    cta: { label: "Start an inquiry", href: `${basePath}/inquire` },
                },
            },
        ],
    }
}

/** The photographer's stack (`home.layout: "stack"`): the selected work as
 * one full-bleed column of same-size frames on caption bands, then one
 * closing line and a text link to /book — no hero, no cards. */
function stackHomeLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.photography },
        shell: shell(basePath, ""),
        sections: [
            {
                id: "stack",
                type: "gallery",
                variant: "sequence",
                content: {
                    items: selectedWork.map((image) => ({
                        media: imageMedia(image),
                        ...(image.caption !== undefined ? { caption: image.caption } : {}),
                    })),
                    fullBleed: true,
                    lightbox: true,
                    captionStack: `band-${home.stack.align}`,
                },
            },
            {
                id: "closing",
                type: "cta-banner",
                variant: "colophon",
                content: {
                    title: home.stack.closing.line,
                    ...(home.stack.closing.note !== "" ? { body: home.stack.closing.note } : {}),
                    cta: { label: home.stack.closing.cta, href: `${basePath}/book` },
                    align: home.stack.align,
                },
            },
        ],
    }
}

/** The collections index, or one album's sequenced gallery via `?album=`.
 * Album views carry `album-` ids and merge under `pages["album-<slug>"]`:
 * they share the /work route with the index but are a different composition,
 * and must never bind to the index's documented skeleton.
 */
export function workLanding(basePath: string, album: Album | undefined): LandingConfig {
    if (album !== undefined) {
        return {
            style: { preset: PACK_REGISTERS.photography },
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
                        title: "Something here you'd like on a wall?",
                        cta: { label: "Inquire about prints", href: `${basePath}/inquire` },
                    },
                },
            ],
        }
    }
    return {
        style: { preset: PACK_REGISTERS.photography },
        shell: shell(basePath, "/work"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: work.headline,
                    accent: "none",
                    subheadline: work.intro,
                },
            },
            {
                id: "collections",
                type: "showcase",
                variant: "collections",
                content: {
                    items: albums.map((album) => ({
                        title: album.title,
                        description: album.description,
                        eyebrow: album.eyebrow,
                        meta: `${album.images.length} photographs`,
                        media: imageMedia(album.images[0]),
                        url: `${basePath}/work?album=${album.slug}`,
                    })),
                },
            },
        ],
    }
}

export function aboutLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.photography },
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
                    cta: { label: "Work with me", href: `${basePath}/inquire` },
                },
            },
            {
                id: "kind-words",
                type: "testimonials",
                content: {
                    kicker: "Kind words",
                    title: "From people who sat for the camera",
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
                    title: "Let's make a photograph worth keeping.",
                    cta: { label: "Start an inquiry", href: `${basePath}/inquire` },
                },
            },
        ],
    }
}

/**
 * The client-galleries page: the proofing explainer, speaking to the
 * photographer's clients (what happens after the shoot) — which is also
 * how a photographer evaluating the template sees the proofing service
 * working as site content. The sample card opens the demo Harlow room
 * on /proof, so a preview visitor can walk the real gate-and-choose
 * flow; content.ts derives the shown access code from the fixture.
 */
export function galleriesLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.photography },
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
                id: "how-proofing",
                type: "steps",
                variant: "numbered-cards",
                content: {
                    kicker: "How proofing works",
                    steps: galleries.steps.map((step) => ({
                        title: step.title,
                        description: step.body,
                    })),
                },
            },
            {
                id: "sample-gallery",
                type: "content-split",
                variant: "media-right",
                content: {
                    kicker: galleries.sample.kicker,
                    headline: galleries.sample.headline,
                    body: galleries.sample.body,
                    media: imageMedia(galleries.sample.image),
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
                    title: "Haven't been in front of the camera yet?",
                    cta: { label: "Book a session", href: `${basePath}/book` },
                },
            },
        ],
    }
}

/**
 * The booking page: an editorial frame around the BookingWidget, which
 * PhotographyPage mounts as the hero's section trailer (the care pack's
 * /book discipline) so the session cards and times sit right under the
 * masthead. Sections here carry only the frame — the widget itself rides
 * the managed booking kernel through BookingClient.
 */
export function bookLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.photography },
        shell: shell(basePath, "/book"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: booking.headline,
                    accent: "none",
                    subheadline: booking.intro,
                },
            },
            // The BookingWidget mounts as this page's hero trailer
            // (PhotographyPage `sectionTrailers`).
            {
                id: "session-notes",
                type: "content-split",
                variant: "media-right",
                content: {
                    kicker: booking.notes.kicker,
                    headline: booking.notes.headline,
                    body: booking.notes.body,
                    bullets: booking.notes.bullets,
                    media: imageMedia(booking.notes.image),
                    cta: { label: "Ask a question first", href: `${basePath}/inquire` },
                },
            },
            {
                id: "inquire-banner",
                type: "cta-banner",
                content: {
                    title: "Planning something the calendar can't hold?",
                    cta: { label: "Start an inquiry", href: `${basePath}/inquire` },
                },
            },
        ],
    }
}

export function inquireLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.photography },
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
