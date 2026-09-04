import type { LandingConfig, MarketingShellConfig } from "@ui"
import {
    about,
    albums,
    book,
    heroSlides,
    home,
    photographer,
    reel,
    type Album,
    type PhotoImage,
} from "./content"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import { musicShell } from "./musicShell"

/**
 * The music-photography pack's pages as landing-kernel configs
 * (docs/landing.md, "The photography-grade set"). `content.ts` stays the
 * single owner-editable source; these builders only map it into sections.
 *
 * The home page is the pack's signature: a full-bleed crossfade hero and
 * then the reel — gallery `sequence`, one photograph per near-viewport
 * frame, full-bleed — so scrolling the page is watching a slide show in a
 * dark room. The marquee register keeps the chrome to a wordmark.
 *
 * Every builder takes `basePath`: "" when the pack owns the site (links are
 * /work, /about, /book) and "/photography-music" on the preview route —
 * same pages, both wirings.
 *
 * Every section carries a stable `id`: PhotographyMusicPage pipes these
 * configs through the landing document's per-page merge
 * (`useSitePageConfig`), so the platform's structural editor can reorder /
 * delete / add sections on these pages and the ids are what the document's
 * skeleton binds to. The pack's catalog maps the routes (`landing.routes`
 * in catalog.json).
 */

const imageMedia = (image: PhotoImage) => ({
    kind: "image" as const,
    src: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
    srcSet: image.srcSet,
})

// The shared chrome lives in musicShell.ts (manifest pages wear it too);
// this alias keeps the page builders reading naturally.
function shell(basePath: string, currentPath: "" | "/work" | "/about" | "/book"): MarketingShellConfig {
    return musicShell(basePath, currentPath)
}

export function homeLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["photography-music"] },
        shell: shell(basePath, ""),
        sections: [
            {
                id: "hero",
                type: "hero",
                // The marquee: masthead type over the photograph on a slow
                // crossfade — must match the catalog's landing seed byte
                // for byte.
                variant: "masthead-overlay",
                content: {
                    badge: home.badge,
                    headline: home.headline,
                    accent: "none",
                    subheadline: home.subheadline,
                    primaryCta: { label: "See the work", href: `${basePath}/work` },
                    secondaryCta: { label: "Book", href: `${basePath}/book` },
                    slides: heroSlides.map(imageMedia),
                },
            },
            {
                id: "reel",
                type: "gallery",
                // The slide show: one frame per viewport, full-bleed, in
                // order — must match the catalog's seed.
                variant: "sequence",
                content: {
                    items: reel.map((image) => ({ media: imageMedia(image) })),
                    fullBleed: true,
                    lightbox: true,
                },
            },
            {
                id: "collections",
                type: "showcase",
                variant: "collections",
                content: {
                    kicker: "The archive",
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
                id: "intro",
                type: "content-split",
                variant: "media-left",
                content: {
                    kicker: home.intro.kicker,
                    headline: home.intro.title,
                    body: home.intro.paragraphs.join(" "),
                    media: imageMedia(about.portrait),
                    cta: { label: "More about Vic", href: `${basePath}/about` },
                },
            },
            {
                id: "book-banner",
                type: "cta-banner",
                variant: "full-bleed",
                content: {
                    title: "Playing a run this year?",
                    cta: { label: "Get me side-stage", href: `${basePath}/book` },
                },
            },
        ],
    }
}

/** The archive index, or one album's sequenced gallery via `?album=`.
 * Album views carry `album-` ids and merge under `pages["album-<slug>"]`:
 * they share the /work route with the index but are a different
 * composition, and must never bind to the index's documented skeleton.
 */
export function workLanding(basePath: string, album: Album | undefined): LandingConfig {
    if (album !== undefined) {
        return {
            style: { preset: PACK_REGISTERS["photography-music"] },
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
                        secondaryCta: { label: "The whole archive", href: `${basePath}/work` },
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
                        title: "Need a frame like these from your show?",
                        cta: { label: "Book the next one", href: `${basePath}/book` },
                    },
                },
            ],
        }
    }
    return {
        style: { preset: PACK_REGISTERS["photography-music"] },
        shell: shell(basePath, "/work"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: "The archive.",
                    accent: "none",
                    subheadline:
                        "Three bodies of work, each sequenced like a set list. Open one and turn it up.",
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
        style: { preset: PACK_REGISTERS["photography-music"] },
        shell: shell(basePath, "/about"),
        sections: [
            {
                id: "story",
                type: "content-split",
                variant: "media-right",
                content: {
                    kicker: "About",
                    headline: about.headline,
                    body: about.paragraphs.join(" "),
                    media: imageMedia(about.portrait),
                    cta: { label: "Book a show", href: `${basePath}/book` },
                },
            },
            {
                id: "kind-words",
                type: "testimonials",
                variant: "single-featured",
                content: {
                    kicker: "From the road",
                    title: "People who were there",
                    quotes: about.testimonials.map((entry) => ({
                        quote: entry.quote,
                        author: entry.name,
                        title: entry.detail,
                    })),
                },
            },
            {
                id: "book-banner",
                type: "cta-banner",
                variant: "full-bleed",
                content: {
                    title: "The archive only grows if you call.",
                    cta: { label: "Book a show", href: `${basePath}/book` },
                },
            },
        ],
    }
}

export function bookLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["photography-music"] },
        shell: shell(basePath, "/book"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: book.headline,
                    accent: "none",
                    subheadline: book.body,
                },
            },
            {
                id: "booking-form",
                type: "lead-form",
                variant: "detail-form",
                content: {
                    kicker: "Booking",
                    title: "The details",
                    cta: "Send it",
                    confirmation: book.confirmation,
                    fields: book.fields,
                    // Direct channels trail the form. The email is
                    // deliberately plain text (no mailto:), selectable for
                    // whatever mail client the visitor actually uses — the
                    // form itself delivers through the platform's managed
                    // forms pipeline.
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
