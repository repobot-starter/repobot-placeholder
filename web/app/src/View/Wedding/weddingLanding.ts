import type { LandingConfig, LandingSection, MarketingShellConfig } from "@ui"
import {
    about,
    albums,
    booking,
    faq,
    galleries,
    heroSlides,
    home,
    inquire,
    landingCopy,
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
    currentPath: "" | "/weddings" | "/galleries" | "/packages" | "/about" | "/book" | "/inquire",
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

/** A landingCopy heading or label, dropped when the seed leaves it empty. */
const titled = (title: string) => (title !== "" ? { title } : {})
const bodied = (body: string) => (body !== "" ? { body } : {})
const cta = (label: string, href: string) => (label !== "" ? { label, href } : undefined)

const inquireCta = (basePath: string) => ({ label: landingCopy.inquireCta, href: `${basePath}/inquire` })

/** A photograph on a wall, with its caption and grease-pencil mark when it has them. */
const print = (image: PhotoImage) => ({
    media: imageMedia(image),
    ...(image.caption !== undefined ? { caption: image.caption } : {}),
    ...(image.mark !== undefined ? { mark: image.mark } : {}),
    ...(image.note !== undefined ? { note: image.note } : {}),
})

/** The prices' currency, stamped only when it isn't the kernel's dollar default. */
const currency = landingCopy.currency !== "usd" ? { currency: landingCopy.currency } : {}

function heroCtas(basePath: string) {
    const primaryCta = cta(landingCopy.home.primaryCta, `${basePath}/weddings`)
    const secondaryCta = cta(landingCopy.home.secondaryCta, `${basePath}/inquire`)
    return {
        ...(primaryCta !== undefined ? { primaryCta } : {}),
        ...(secondaryCta !== undefined ? { secondaryCta } : {}),
    }
}

function introSection(basePath: string): LandingSection {
    return {
        id: "intro",
        type: "content-split",
        variant: "media-left",
        content: {
            kicker: home.intro.kicker,
            headline: home.intro.title,
            body: home.intro.paragraphs.join(" "),
            media: imageMedia(about.portrait),
            cta: { label: landingCopy.home.introCta, href: `${basePath}/about` },
        },
    }
}

function selectedWorkSection(): LandingSection {
    return {
        id: "selected-work",
        type: "gallery",
        variant: home.wall,
        content: {
            kicker: landingCopy.home.selectedWorkKicker,
            ...titled(landingCopy.home.selectedWorkTitle),
            items: selectedWork.map(print),
            lightbox: true,
            ...(home.wall === "contact-sheet" ? { edgeCode: home.edgeCode } : {}),
        },
    }
}

function packagesSection(): LandingSection {
    return {
        id: "packages",
        type: "pricing",
        variant: "tiers",
        content: {
            kicker: packagesPage.kicker,
            ...titled(landingCopy.home.packagesTitle),
            period: "",
            ...currency,
            tiers: packageTiers(),
        },
    }
}

function kindWordsSection(): LandingSection {
    return {
        id: "kind-words",
        type: "testimonials",
        variant: "single-featured",
        content: {
            kicker: landingCopy.home.reviewsKicker,
            quotes: [
                {
                    quote: about.testimonials[0].quote,
                    author: about.testimonials[0].name,
                    title: about.testimonials[0].detail,
                },
            ],
        },
    }
}

/**
 * The marquee home deliberately is NOT the photography pack's: it opens on
 * the person (intro before the work — a wedding is booked on trust), runs
 * the selected work as tilted party prints instead of a justified wall,
 * and puts the pack's real differentiators — flat-priced packages (with
 * the private proofing room in their features) and the kind words — on
 * the first scroll instead of behind a nav link.
 */
function marqueeHome(basePath: string): LandingSection[] {
    return [
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
                ...heroCtas(basePath),
                slides: heroSlides.map(imageMedia),
            },
        },
        introSection(basePath),
        selectedWorkSection(),
        packagesSection(),
        kindWordsSection(),
        {
            id: "weddings",
            type: "showcase",
            variant: "collections",
            content: {
                kicker: landingCopy.home.weddingsKicker,
                items: weddingTiles(basePath),
            },
        },
        {
            id: "inquire-banner",
            type: "cta-banner",
            // The RSVP as a ticket stub — must match the catalog's seed.
            variant: "ticket",
            content: {
                title: landingCopy.home.bannerTitle,
                ...bodied(landingCopy.home.bannerBody),
                cta: { label: landingCopy.home.bannerCta, href: `${basePath}/inquire` },
            },
        },
    ]
}

/** The places as a spec sheet: one card per location, the same facts down each. */
function locationsSection(): LandingSection[] {
    if (home.locations.length === 0) return []
    const labels = landingCopy.home.locationLabels
    const row = (label: string, pick: (place: (typeof home.locations)[number]) => string) => ({
        label,
        values: home.locations.map(pick),
    })
    return [
        {
            id: "the-places",
            type: "comparison",
            variant: "cards",
            content: {
                ...(landingCopy.home.locationsKicker !== ""
                    ? { kicker: landingCopy.home.locationsKicker }
                    : {}),
                ...titled(landingCopy.home.locationsTitle),
                columns: ["", ...home.locations.map((place) => place.name)],
                rows: [
                    row(labels.where, (place) => place.where),
                    row(labels.season, (place) => place.season),
                    row(labels.permit, (place) => place.permit),
                    row(labels.elevation, (place) => place.elevation),
                    row(labels.hike, (place) => place.hike),
                    row(labels.coordinates, (place) => place.coordinates),
                ],
            },
        },
    ]
}

/**
 * The stack home: the photographs ARE the page. A full-bleed frame under
 * the hero copy, then the weddings edge to edge with each couple's names
 * over the photograph, the person, the picks, the prices, one voice — and
 * a closing band over one last photograph.
 */
function stackHome(basePath: string): LandingSection[] {
    const closing = home.closing
    return [
        {
            id: "hero",
            type: "hero",
            variant: "full-bleed-media",
            content: {
                badge: home.badge,
                headline: home.headline,
                accent: "none",
                subheadline: home.subheadline,
                ...heroCtas(basePath),
                slides: heroSlides.map(imageMedia),
            },
        },
        {
            id: "stack",
            type: "gallery",
            variant: "sequence",
            content: {
                items: home.stack.map(print),
                captionStack: "overlay-start",
                lightbox: true,
            },
        },
        introSection(basePath),
        ...locationsSection(),
        selectedWorkSection(),
        packagesSection(),
        kindWordsSection(),
        {
            id: "inquire-banner",
            type: "cta-banner",
            variant: "full-bleed",
            content: {
                title: landingCopy.home.bannerTitle,
                ...bodied(landingCopy.home.bannerBody),
                cta: { label: landingCopy.home.bannerCta, href: `${basePath}/inquire` },
                ...(closing !== null
                    ? {
                          backdrop: {
                              src: closing.image.src,
                              srcSet: closing.image.srcSet,
                              alt: closing.image.alt,
                              overlay: closing.overlay,
                              position: closing.position,
                          },
                      }
                    : {}),
            },
        },
    ]
}

export function homeLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.wedding },
        shell: shell(basePath, ""),
        sections: home.layout === "stack" ? stackHome(basePath) : marqueeHome(basePath),
    }
}

/** One wedding's wall: justified rows, the roll as a contact sheet, or the captioned stack. */
function albumWall(album: Album): LandingSection {
    const items = album.images.map(print)
    if (home.albumWall === "contact-sheet") {
        return {
            id: "wedding-gallery",
            type: "gallery",
            variant: "contact-sheet",
            content: { items, lightbox: true, edgeCode: home.edgeCode },
        }
    }
    if (home.albumWall === "stack") {
        return {
            id: "wedding-gallery",
            type: "gallery",
            variant: "sequence",
            content: { items, captionStack: "overlay-start", lightbox: true },
        }
    }
    return {
        id: "wedding-gallery",
        type: "gallery",
        variant: "justified",
        content: {
            items: album.images.map((image) => ({ media: imageMedia(image) })),
            lightbox: true,
        },
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
                        secondaryCta: {
                            label: landingCopy.weddingsPage.allCta,
                            href: `${basePath}/weddings`,
                        },
                    },
                },
                albumWall(album),
                {
                    id: "wedding-banner",
                    type: "cta-banner",
                    variant: "full-bleed",
                    content: {
                        title: landingCopy.weddingsPage.bannerTitle,
                        cta: inquireCta(basePath),
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
                    headline: landingCopy.weddingsPage.headline,
                    accent: "none",
                    subheadline: landingCopy.weddingsPage.subheadline,
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
                    ...currency,
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
                    title: landingCopy.packagesPage.bannerTitle,
                    cta: inquireCta(basePath),
                },
            },
        ],
    }
}

/**
 * The client-galleries page: the proofing explainer, speaking to couples
 * and their families (what happens after the wedding) — which is also how
 * a couple evaluating the template sees the proofing service working as
 * site content. The sample card opens the demo Nora & June room on
 * /proof, so a preview visitor can walk the real gate-and-choose flow;
 * content.ts derives the shown access code from the fixture.
 */
export function galleriesLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.wedding },
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
                    kicker: landingCopy.galleriesPage.stepsKicker,
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
                id: "inquire-banner",
                type: "cta-banner",
                content: {
                    title: landingCopy.galleriesPage.bannerTitle,
                    cta: inquireCta(basePath),
                },
            },
        ],
    }
}

/**
 * The booking page: an editorial frame around the BookingWidget, which
 * WeddingPage mounts as the hero's section trailer (the photography
 * pack's /book discipline) so the session cards and times sit right under
 * the masthead. Sections here carry only the frame — the widget itself
 * rides the managed booking kernel through BookingClient.
 */
export function bookLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.wedding },
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
            // (WeddingPage `sectionTrailers`).
            {
                id: "session-notes",
                type: "content-split",
                variant: "media-right",
                content: {
                    kicker: landingCopy.bookPage.notesKicker,
                    headline: landingCopy.bookPage.notesHeadline,
                    body: landingCopy.bookPage.notesBody,
                    bullets: [...landingCopy.bookPage.notesBullets],
                    media: imageMedia(booking.notesImage),
                    cta: { label: landingCopy.bookPage.notesCta, href: `${basePath}/inquire` },
                },
            },
            {
                id: "inquire-banner",
                type: "cta-banner",
                content: {
                    title: landingCopy.bookPage.bannerTitle,
                    cta: { label: landingCopy.startInquiryCta, href: `${basePath}/inquire` },
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
                    kicker: landingCopy.aboutPage.kicker,
                    headline: about.headline,
                    body: about.paragraphs.join(" "),
                    media: imageMedia(about.portrait),
                    cta: inquireCta(basePath),
                },
            },
            {
                id: "kind-words",
                type: "testimonials",
                variant: "quote-grid",
                content: {
                    kicker: landingCopy.aboutPage.reviewsKicker,
                    title: landingCopy.aboutPage.reviewsTitle,
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
                    title: landingCopy.aboutPage.bannerTitle,
                    cta: { label: landingCopy.startInquiryCta, href: `${basePath}/inquire` },
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
                    kicker: landingCopy.inquirePage.formKicker,
                    title: landingCopy.inquirePage.formTitle,
                    cta: landingCopy.inquirePage.submit,
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
