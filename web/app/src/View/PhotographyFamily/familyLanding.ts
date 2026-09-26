import type { LandingConfig, LandingSection, MarketingShellConfig } from "@ui"
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
    landingCopy,
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
 *
 * The home composition is content (`home.layout`): `crossfade` is the
 * photo-led stack on a justified wall, `pinboard` the pile of taped prints
 * on a scrapbook wall with the day's lengths, rail, and checklist. The
 * layout also picks the album walls' variant; `builder` opens on one
 * full-bleed photograph with the session builder (`home.builder`) under it. Headings and button labels
 * come from the module's `landingCopy`, so a remix seed retrades the site.
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

const pinboard = home.layout === "pinboard"

/** Justified never reorders (the edit's order IS the craft); scrapbook pins prints up at a lean. */
const WALL_VARIANT = pinboard ? "scrapbook" : "justified"

/** A landingCopy heading, dropped when the seed leaves it empty. */
const titled = (title: string) => (title !== "" ? { title } : {})

/** Any copy field, dropped when the seed leaves it empty. */
const filled = <K extends string>(key: K, value: string) =>
    (value !== "" ? { [key]: value } : {}) as Record<K, string>

const bookCta = (basePath: string) => ({ label: landingCopy.bookCta, href: `${basePath}/book` })

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

/** A photograph on the wall, with the line written on its border when it has one. */
const print = (image: PhotoImage) => ({
    media: imageMedia(image),
    ...(image.caption !== undefined ? { caption: image.caption } : {}),
})

/** The offerings as flat-priced tiers: equal monthly/yearly suppresses the
 * billing toggle; period "" suppresses the "/mo" reading. */
function offeringTiers() {
    return investment.offerings.map((offering) => ({
        name: offering.name,
        monthly: offering.price,
        yearlyPerMonth: offering.price,
        description: `${offering.duration} — ${offering.description}`,
        features: offering.includes,
        ...(offering.highlighted
            ? {
                  highlighted: true,
                  ...(investment.highlightNote !== "" ? { badge: investment.highlightNote } : {}),
              }
            : {}),
    }))
}

function introSection(basePath: string): LandingSection {
    return {
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
    }
}

function collectionsSection(basePath: string): LandingSection {
    return {
        id: "collections",
        type: "showcase",
        variant: "collections",
        content: {
            kicker: landingCopy.home.collectionsKicker,
            ...titled(landingCopy.home.collectionsTitle),
            items: collectionTiles(basePath),
        },
    }
}

function kindWordsSection(): LandingSection {
    return {
        id: "kind-words",
        type: "testimonials",
        // One voice at pull-quote scale — the trust moment before the
        // closing CTA.
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

function bookBannerSection(basePath: string): LandingSection {
    return {
        id: "book-banner",
        type: "cta-banner",
        content: {
            title: landingCopy.home.bannerTitle,
            ...filled("body", landingCopy.home.bannerBody),
            cta: bookCta(basePath),
        },
    }
}

/** The photo-led home: the photograph IS the page. */
function crossfadeHome(basePath: string): LandingSection[] {
    return [
        {
            id: "hero",
            type: "hero",
            // A slow crossfade of one frame from each body of work — must
            // match the catalog's landing seed byte for byte.
            variant: "full-bleed-media",
            content: {
                badge: home.badge,
                headline: home.headline,
                accent: home.accent,
                subheadline: home.subheadline,
                primaryCta: { label: landingCopy.home.primaryCta, href: `${basePath}/work` },
                secondaryCta: bookCta(basePath),
                ...(home.note !== null ? { seal: home.note } : {}),
                slides: heroSlides.map(imageMedia),
            },
        },
        {
            id: "selected-work",
            type: "gallery",
            variant: WALL_VARIANT,
            content: {
                kicker: landingCopy.home.selectedWorkKicker,
                ...titled(landingCopy.home.selectedWorkTitle),
                items: selectedWork.map(print),
                // The work owns the whole width — the gallery-first
                // promise starts on the first scroll.
                fullBleed: true,
                lightbox: true,
            },
        },
        introSection(basePath),
        collectionsSection(basePath),
        kindWordsSection(),
        bookBannerSection(basePath),
    ]
}

/** The fridge door: the shout beside a pile of taped prints. */
function pinboardHome(basePath: string): LandingSection[] {
    return [
        {
            id: "hero",
            type: "hero",
            // Its last line in marker red — must match the catalog's
            // landing seed byte for byte.
            variant: "pinboard",
            content: {
                badge: home.badge,
                headline: home.headline,
                accent: home.accent,
                subheadline: home.subheadline,
                primaryCta: { label: landingCopy.home.primaryCta, href: `${basePath}/work` },
                ...(home.scribble !== null ? { credit: home.scribble } : {}),
                ...(home.note !== null ? { seal: home.note } : {}),
                prints: heroSlides.map(print),
            },
        },
        {
            id: "selected-work",
            type: "gallery",
            variant: WALL_VARIANT,
            content: {
                kicker: landingCopy.home.selectedWorkKicker,
                ...titled(landingCopy.home.selectedWorkTitle),
                items: selectedWork.map(print),
                lightbox: true,
            },
        },
        collectionsSection(basePath),
        {
            id: "a-day-with-us",
            type: "pricing",
            variant: "tiers",
            content: {
                kicker: landingCopy.home.tiersKicker,
                ...titled(landingCopy.home.tiersTitle),
                period: "",
                tiers: offeringTiers(),
            },
        },
        ...(home.day.length > 0
            ? [
                  {
                      id: "how-a-day-goes",
                      type: "steps",
                      variant: "horizontal-rail",
                      content: {
                          kicker: landingCopy.home.dayKicker,
                          ...titled(landingCopy.home.dayTitle),
                          steps: home.day.map((step) => ({
                              title: step.title,
                              description: step.body,
                              label: step.label,
                              media: imageMedia(albums[0].images[step.image]),
                          })),
                      },
                  } satisfies LandingSection,
              ]
            : []),
        ...(home.expect.length > 0
            ? [
                  {
                      id: "what-to-expect",
                      type: "feature-grid",
                      variant: "checklist",
                      content: {
                          kicker: landingCopy.home.expectKicker,
                          ...titled(landingCopy.home.expectTitle),
                          cardTitle: landingCopy.home.expectCardTitle,
                          body: landingCopy.home.expectBody,
                          features: home.expect.map((item) => ({
                              title: item.title,
                              description: item.body,
                          })),
                          media: imageMedia(albums[0].images[3]),
                      },
                  } satisfies LandingSection,
              ]
            : []),
        introSection(basePath),
        kindWordsSection(),
        bookBannerSection(basePath),
    ]
}

/** The session builder: photograph tiles for the session, keepsakes, and extras beside the running total. */
function builderSection(basePath: string, builder: NonNullable<typeof home.builder>): LandingSection {
    return {
        id: "build-your-session",
        type: "pricing",
        variant: "builder",
        content: {
            ...filled("kicker", builder.kicker),
            ...titled(builder.title),
            ...filled("intro", builder.intro),
            builderLayout: "tiles",
            ...filled("summaryTitle", builder.summaryTitle),
            ...filled("totalLabel", builder.totalLabel),
            ...filled("footnote", builder.footnote),
            cta: bookCta(basePath),
            groups: builder.groups.map((group) => ({
                heading: group.heading,
                choose: group.choose,
                items: group.items.map((item) => ({
                    name: item.name,
                    ...(item.note !== undefined ? { note: item.note } : {}),
                    price: item.price,
                    media: imageMedia(item.image),
                    ...(item.selected === true ? { selected: true } : {}),
                })),
            })),
        },
    }
}

/** One full-bleed photograph: the hero the builder and specimens homes open on. */
function photoHero(basePath: string): LandingSection {
    return {
        id: "hero",
        type: "hero",
        variant: "full-bleed-media",
        content: {
            ...filled("badge", home.badge),
            headline: home.headline,
            accent: home.accent,
            ...filled("subheadline", home.subheadline),
            ...(landingCopy.home.primaryCta !== ""
                ? { primaryCta: { label: landingCopy.home.primaryCta, href: `${basePath}/work` } }
                : {}),
            ...(home.note !== null ? { seal: home.note } : {}),
            slides: heroSlides.map(imageMedia),
        },
    }
}

/** The selected work as one full-bleed row of frames at a single size. */
function uniformWall(): LandingSection {
    return {
        id: "selected-work",
        type: "gallery",
        variant: "uniform",
        content: {
            kicker: landingCopy.home.selectedWorkKicker,
            ...titled(landingCopy.home.selectedWorkTitle),
            items: selectedWork.map(print),
            fullBleed: true,
            lightbox: true,
        },
    }
}

/** The builder home: one full-bleed photograph, then the session builder right under it. */
function builderHome(basePath: string): LandingSection[] {
    return [
        photoHero(basePath),
        ...(home.builder !== null ? [builderSection(basePath, home.builder)] : []),
        uniformWall(),
        introSection(basePath),
        collectionsSection(basePath),
        kindWordsSection(),
        bookBannerSection(basePath),
    ]
}

/** The prints: one sitting in each process, as specimens with their note and price. */
function printsSection(prints: NonNullable<typeof home.prints>): LandingSection {
    return {
        id: "the-prints",
        type: "showcase",
        variant: "specimens",
        content: {
            ...filled("kicker", prints.kicker),
            ...titled(prints.title),
            items: prints.items.map((item) => ({
                title: item.name,
                description: item.note,
                meta: item.price,
                media: imageMedia(item.image),
            })),
        },
    }
}

/**
 * The specimens home: one full-bleed photograph, the prints right under it,
 * then the sitting and the booking ask before the work itself.
 */
function specimensHome(basePath: string): LandingSection[] {
    return [
        photoHero(basePath),
        ...(home.prints !== null ? [printsSection(home.prints)] : []),
        bookBannerSection(basePath),
        uniformWall(),
        introSection(basePath),
        collectionsSection(basePath),
        kindWordsSection(),
    ]
}

function homeSections(basePath: string): LandingSection[] {
    if (home.layout === "builder") return builderHome(basePath)
    if (home.layout === "specimens") return specimensHome(basePath)
    return pinboard ? pinboardHome(basePath) : crossfadeHome(basePath)
}

export function homeLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["photography-family"] },
        shell: shell(basePath, ""),
        sections: homeSections(basePath),
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
                        accent: landingCopy.heroAccent,
                        subheadline: album.description,
                        secondaryCta: { label: "All collections", href: `${basePath}/work` },
                    },
                },
                {
                    id: "album-gallery",
                    type: "gallery",
                    // The day in order: the wall keeps array order.
                    variant: WALL_VARIANT,
                    content: {
                        items: album.images.map(print),
                        lightbox: true,
                    },
                },
                {
                    id: "album-banner",
                    type: "cta-banner",
                    content: {
                        title: landingCopy.workPage.albumBannerTitle,
                        cta: bookCta(basePath),
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
                    headline: landingCopy.workPage.headline,
                    accent: landingCopy.heroAccent,
                    subheadline: landingCopy.workPage.subheadline,
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
                    kicker: landingCopy.aboutPage.kicker,
                    headline: about.headline,
                    body: about.paragraphs.join(" "),
                    media: imageMedia(about.portrait),
                    cta: { label: landingCopy.aboutPage.cta, href: `${basePath}/book` },
                },
            },
            {
                id: "kind-words",
                type: "testimonials",
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
                    cta: { label: landingCopy.aboutPage.bannerCta, href: `${basePath}/inquire` },
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
                    accent: landingCopy.heroAccent,
                    subheadline: galleries.intro,
                },
            },
            {
                id: "gallery-steps",
                type: "steps",
                variant: "timeline",
                content: {
                    kicker: landingCopy.galleriesPage.stepsKicker,
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
                    title: landingCopy.galleriesPage.bannerTitle,
                    body: landingCopy.galleriesPage.bannerBody,
                    cta: bookCta(basePath),
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
                    accent: landingCopy.heroAccent,
                    subheadline: investment.body,
                },
            },
            {
                id: "offerings",
                type: "pricing",
                variant: "tiers",
                content: {
                    kicker: landingCopy.investmentPage.offeringsKicker,
                    title: "Priced flat, told up front.",
                    period: "",
                    tiers: offeringTiers(),
                },
            },
            {
                id: "how-it-works",
                type: "steps",
                variant: "timeline",
                content: {
                    kicker: landingCopy.investmentPage.stepsKicker,
                    title: landingCopy.investmentPage.stepsTitle,
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
                    kicker: landingCopy.investmentPage.faqKicker,
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
                    cta: bookCta(basePath),
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
                    accent: landingCopy.heroAccent,
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
                    accent: landingCopy.heroAccent,
                    subheadline: inquire.body,
                },
            },
            {
                id: "inquiry-form",
                type: "lead-form",
                variant: "detail-form",
                content: {
                    kicker: landingCopy.inquirePage.formKicker,
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
