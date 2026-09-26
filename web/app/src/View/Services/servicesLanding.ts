import type { LandingConfig, LandingSection, MarketingShellConfig } from "@ui"
import { statusLabel } from "../Landing/hours"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import {
    about,
    buildLog,
    business,
    faq,
    feature,
    home,
    hoursNote,
    journal,
    landingCopy,
    lookbook,
    metrics,
    nowBuilding,
    palette,
    policies,
    priceMenu,
    process,
    projects,
    quote,
    serviceArea,
    services,
    species,
    testimonials,
    walk,
    weeklyHours,
    type Project,
    type SiteImage,
} from "./content"
import { servicesShell } from "./servicesShell"

/**
 * The services pack's pages as landing-kernel configs (docs/landing.md,
 * "Custom builder / fine trades" blueprint). `content.ts` stays the single
 * owner-editable source — facts AND copy; these builders only map it into
 * sections, so they carry no strings of their own.
 *
 * Every builder takes `basePath`: "" when the pack owns the site (links
 * are /projects, /services, /quote, …) and "/services" on the preview
 * route — same pages, both wirings. The home builder also takes `now`:
 * the config is rebuilt per render so a storefront hero's live "Open now"
 * badge stays current (the menu pack's idiom, on the shared hours engine).
 *
 * Every section carries a stable `id`: ServicesPage pipes these configs
 * through the landing document's per-page merge (`useSitePageConfig`), so
 * the platform's structural editor can reorder / delete / add sections on
 * these pages and the ids are what the document's skeleton binds to. The
 * pack's catalog maps the routes (`landing.routes` in catalog.json).
 *
 * Content-gated sections: a section whose list is empty in content.ts is
 * left out rather than rendered bare (the ticker, the garden journal and
 * the garden walk, build log, materials
 * board, the color deck, the menu board, the lookbook, the house-rules
 * card, the home before/after teaser and metrics strip; `home.serviceGrid`
 * drops the services grid). The metrics strip rides the home page when
 * `home.proofMetrics` has entries and the about page otherwise. The
 * contractor original and its trade remixes fill the storefront lists and
 * leave the rest empty; the restyled derived templates (services-builder
 * and the skins) fill their own lists and pin their own skeletons.
 *
 * A seed that sets `home.stack` gets the stack home instead (see
 * `ServicesStack`); the other pages are the same either way.
 */

/** One room of the stack home: the photograph and the line written into it ("" for none). */
export interface ServicesStackFrame {
    image: SiteImage
    caption: string
}

/**
 * The stack home: the hero photograph with the headline as its line, then
 * each frame edge to edge at the hero's size with its caption set in the
 * foot of the photograph (gallery `sequence`, `captionStack` `overlay-start`), then the
 * closing line over the quote link (cta-banner `colophon`, at the page
 * column's start). "" for `closing`/`closingCta` falls back to the home
 * banner title and the quote ask.
 */
export interface ServicesStack {
    frames: ServicesStackFrame[]
    closing: string
    closingCta: string
}

/** The seed's stack home, when it sets one. Seeds infer `home`, so it's read structurally. */
function homeStack(): ServicesStack | undefined {
    return "stack" in home ? (home.stack as ServicesStack | undefined) : undefined
}

const imageMedia = (image: SiteImage) => ({
    kind: "image" as const,
    src: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
    srcSet: image.srcSet,
})

/** A project as a comparison-gallery item: drag the divider, see the work. */
const comparisonItem = (project: Project) => ({
    media: imageMedia(project.after),
    beforeMedia: imageMedia(project.before),
    caption: `${project.title}, ${project.location} — ${project.scope}`,
})

const quotePath = (basePath: string) => `${basePath}/quote`

const testimonialQuotes = () =>
    testimonials.map((entry) => ({
        quote: entry.quote,
        author: entry.name,
        title: entry.detail,
    }))

// The shared chrome lives in servicesShell.ts (manifest pages wear it
// too); this alias keeps the page builders reading naturally.
function shell(
    basePath: string,
    currentPath: "" | "/projects" | "/services" | "/about" | "/quote",
): MarketingShellConfig {
    return servicesShell(basePath, currentPath)
}

/**
 * The home hero. The storefront reading puts the live open/closed badge
 * and both asks (quote and call) beside the work; the title card sets the
 * headline over the full-bleed photograph with its credit and caption and
 * keeps to one ask. `home.hero.storefront` picks.
 */
function homeHero(basePath: string, now: Date): LandingSection {
    const quoteHref = `${basePath}/quote`
    if (home.hero.storefront) {
        const day = now.getDay()
        const minute = now.getHours() * 60 + now.getMinutes()
        return {
            id: "hero",
            type: "hero",
            variant: "split-media",
            content: {
                badge: statusLabel(weeklyHours, day, minute),
                headline: home.headline,
                subheadline: home.subheadline,
                primaryCta: { label: landingCopy.quoteCta, href: quoteHref },
                secondaryCta: { label: `Call ${business.phone}`, href: business.phoneHref },
                // The storefront closes its copy column on the credit line
                // when the seed sets one ("" keeps the column bare).
                ...(home.hero.credit !== "" ? { credit: home.hero.credit } : {}),
                media: imageMedia(home.heroImage),
            },
        }
    }
    return {
        id: "hero",
        type: "hero",
        // The photograph is the pitch: the headline sits low-left over it
        // like a film title, amber saved for the single ask.
        variant: "full-bleed-media",
        content: {
            ...(home.hero.kicker !== "" ? { badge: home.hero.kicker } : {}),
            headline: home.headline,
            accent: home.hero.accent,
            ...(home.hero.credit !== "" ? { credit: home.hero.credit } : {}),
            ...(home.hero.caption !== "" ? { mediaCaption: home.hero.caption } : {}),
            ...(home.hero.coverLines.length > 0 ? { coverLines: home.hero.coverLines } : {}),
            // The panel row's centered copy carries the line under the name;
            // the photographic readings leave it to the credit.
            ...(home.hero.panels.length > 0
                ? {
                      subheadline: home.subheadline,
                      panels: home.hero.panels.map((panel) => ({
                          label: panel.label,
                          media: imageMedia(panel.image),
                      })),
                  }
                : {}),
            ...(home.hero.seal !== "" ? { seal: home.hero.seal } : {}),
            primaryCta: { label: landingCopy.quoteCta, href: quoteHref },
            media: imageMedia(home.heroImage),
        },
    }
}

/** The garden journal: the season's stories as a spread, each jumping to the work. */
function journalSection(basePath: string): LandingSection {
    return {
        id: "journal",
        type: "showcase",
        variant: "stories",
        content: {
            ...(journal.kicker !== "" ? { kicker: journal.kicker } : {}),
            ...(journal.title !== "" ? { title: journal.title } : {}),
            items: journal.items.map((entry) => ({
                meta: entry.season,
                title: entry.title,
                description: entry.description,
                media: imageMedia(entry.image),
                url: `${basePath}/projects`,
                ...(journal.linkLabel !== "" ? { linkLabel: journal.linkLabel } : {}),
            })),
        },
    }
}

/** A garden walk: one garden frame by frame, each at its own shape, in walking order. */
function walkSection(): LandingSection {
    return {
        id: "walk",
        type: "gallery",
        variant: "sequence",
        content: {
            ...(walk.kicker !== "" ? { kicker: walk.kicker } : {}),
            ...(walk.title !== "" ? { title: walk.title } : {}),
            items: walk.frames.map((frame) => ({
                media: imageMedia(frame.image),
                caption: frame.caption,
            })),
        },
    }
}

/** The lookbook: the work as portraits, each look named with its detail (home and projects). */
function lookbookSection(): LandingSection {
    return {
        id: "lookbook",
        type: "showcase",
        variant: "specimens",
        content: {
            ...(lookbook.kicker !== "" ? { kicker: lookbook.kicker } : {}),
            ...(lookbook.title !== "" ? { title: lookbook.title } : {}),
            items: lookbook.items.map((item) => ({
                title: item.name,
                ...(item.group !== undefined ? { eyebrow: item.group } : {}),
                meta: item.meta,
                description: item.description,
                tags: item.tags,
                media: imageMedia(item.image),
            })),
        },
    }
}

function stackHome(basePath: string, stack: ServicesStack): LandingSection[] {
    const sections: (LandingSection | false)[] = [
        {
            id: "hero",
            type: "hero",
            variant: "full-bleed-media",
            content: {
                headline: home.headline,
                accent: "none",
                media: imageMedia(home.heroImage),
            },
        },
        stack.frames.length > 0 && {
            id: "rooms",
            type: "gallery",
            variant: "sequence",
            content: {
                items: stack.frames.map((frame) => ({
                    media: imageMedia(frame.image),
                    ...(frame.caption !== "" ? { caption: frame.caption } : {}),
                })),
                captionStack: "overlay-start",
            },
        },
        {
            id: "quote-banner",
            type: "cta-banner",
            variant: "colophon",
            content: {
                title: stack.closing !== "" ? stack.closing : landingCopy.home.bannerTitle,
                cta: {
                    label: stack.closingCta !== "" ? stack.closingCta : landingCopy.quoteCta,
                    href: quotePath(basePath),
                },
                align: "start",
            },
        },
    ]
    return sections.filter((section): section is LandingSection => section !== false)
}

export function homeLanding(basePath: string, now: Date): LandingConfig {
    const stack = homeStack()
    if (stack !== undefined) {
        return {
            style: { preset: PACK_REGISTERS.services },
            shell: shell(basePath, ""),
            sections: stackHome(basePath, stack),
        }
    }
    const sections: (LandingSection | false)[] = [
        homeHero(basePath, now),
        nowBuilding.length > 0 && {
            id: "now-building",
            type: "social-proof",
            // What's on the bench right now; the register sets the ticker's voice.
            variant: "ticker",
            content: {
                label: landingCopy.home.nowBuildingLabel,
                items: nowBuilding,
            },
        },
        journal.items.length > 0 && journalSection(basePath),
        walk.frames.length > 0 && walkSection(),
        buildLog.steps.length > 0 && {
            id: "build-log",
            type: "steps",
            // One house, survey to keys, left to right on one line.
            variant: "horizontal-rail",
            content: {
                kicker: buildLog.kicker,
                title: buildLog.title,
                steps: buildLog.steps.map((step) => ({
                    ...(step.label !== "" ? { label: step.label } : {}),
                    title: step.title,
                    ...(step.duration !== undefined ? { duration: step.duration } : {}),
                    description: step.description,
                    media: imageMedia(step.image),
                    // The timeline reading sets these beside the lead photograph.
                    ...(step.frames !== undefined && step.frames.length > 0
                        ? { frames: step.frames.map(imageMedia) }
                        : {}),
                })),
            },
        },
        species.items.length > 0 && {
            id: "species",
            type: "showcase",
            // The materials board: what the houses are made of.
            variant: "specimens",
            content: {
                kicker: species.kicker,
                title: species.title,
                items: species.items.map((item) => ({
                    title: item.name,
                    meta: item.use,
                    description: item.description,
                    media: imageMedia(item.image),
                })),
            },
        },
        palette.items.length > 0 && {
            id: "palette",
            type: "showcase",
            // The color deck: flat paint chips, each a way into a quote.
            variant: "swatches",
            content: {
                ...(palette.kicker !== "" ? { kicker: palette.kicker } : {}),
                ...(palette.title !== "" ? { title: palette.title } : {}),
                items: palette.items.map((swatch) => ({
                    title: swatch.name,
                    meta: swatch.code,
                    description: swatch.note,
                    color: swatch.color,
                    ...(swatch.image !== undefined ? { media: imageMedia(swatch.image) } : {}),
                    url: quotePath(basePath),
                })),
            },
        },
        priceMenu.groups.length > 0 && {
            id: "price-menu",
            type: "pricing",
            // The menu board: every priced line, grouped, honest "from"s.
            variant: "price-list",
            content: {
                ...(priceMenu.kicker !== "" ? { kicker: priceMenu.kicker } : {}),
                ...(priceMenu.title !== "" ? { title: priceMenu.title } : {}),
                ...(priceMenu.intro !== "" ? { intro: priceMenu.intro } : {}),
                groups: priceMenu.groups,
                ...(priceMenu.footnote !== "" ? { footnote: priceMenu.footnote } : {}),
                cta: { label: landingCopy.quoteCta, href: quotePath(basePath) },
            },
        },
        lookbook.items.length > 0 && lookbookSection(),
        home.serviceGrid && {
            id: "services",
            type: "card-grid",
            // Three across; a derived template may re-pin the grid (4up).
            variant: "3up",
            content: {
                kicker: landingCopy.home.servicesKicker,
                title: landingCopy.servicesHeading,
                cards: services.map((service) => ({
                    media: imageMedia(service.image),
                    title: service.title,
                    meta: home.servicePrices ? service.priceNote : undefined,
                    body: service.description,
                })),
            },
        },
        home.featuredProjects.length > 0 && {
            id: "transformations",
            type: "gallery",
            // Drag the divider across the same room, before and after.
            variant: "before-after",
            content: {
                kicker: landingCopy.home.transformationsKicker,
                title: landingCopy.home.transformationsTitle,
                items: home.featuredProjects.map(comparisonItem),
                // Corner expand on each frame: the pair full screen as
                // adjacent after/before slides. The drag stays the drag.
                lightbox: true,
            },
        },
        policies.items.length > 0 && {
            id: "policies",
            type: "feature-grid",
            // The house rules on one ticked card.
            variant: "checklist",
            content: {
                ...(policies.kicker !== "" ? { kicker: policies.kicker } : {}),
                ...(policies.title !== "" ? { title: policies.title } : {}),
                ...(policies.cardTitle !== "" ? { cardTitle: policies.cardTitle } : {}),
                ...(policies.body !== "" ? { body: policies.body } : {}),
                ...(policies.image !== null ? { media: imageMedia(policies.image) } : {}),
                features: policies.items.map((item) => ({ title: item.title, description: item.body })),
            },
        },
        home.proofMetrics.length > 0 && {
            id: "proof",
            type: "social-proof",
            variant: "metrics-row",
            content: {
                label: business.license,
                metrics: home.proofMetrics,
            },
        },
        feature.headline !== "" && {
            id: "feature",
            type: "content-split",
            // One design story beside its photograph, the link to the work;
            // the `feature` variant also sets the quote, figures and plate.
            variant: "media-left",
            content: {
                ...(feature.kicker !== "" ? { kicker: feature.kicker } : {}),
                headline: feature.headline,
                body: feature.paragraphs.join("\n\n"),
                ...(feature.image !== null ? { media: imageMedia(feature.image) } : {}),
                ...(feature.pullQuote !== "" ? { pullQuote: feature.pullQuote } : {}),
                ...(feature.figures.length > 0
                    ? {
                          figures: feature.figures.map((figure) => ({
                              media: imageMedia(figure.image),
                              title: figure.title,
                              caption: figure.caption,
                          })),
                      }
                    : {}),
                ...(feature.plate !== null
                    ? {
                          plate: {
                              media: imageMedia(feature.plate),
                              ...(feature.plateCaption !== "" ? { caption: feature.plateCaption } : {}),
                          },
                      }
                    : {}),
                ...(feature.linkLabel !== ""
                    ? { cta: { label: feature.linkLabel, href: `${basePath}/projects` } }
                    : {}),
            },
        },
        {
            id: "kind-words",
            type: "testimonials",
            // One voice, the whole room — the strongest quote leads.
            variant: "single-featured",
            content: {
                kicker: landingCopy.home.testimonialsKicker,
                quotes: testimonialQuotes(),
            },
        },
        {
            id: "service-area",
            type: "social-proof",
            variant: "text-logos",
            content: {
                label: landingCopy.home.serviceAreaLabel,
                items: serviceArea,
            },
        },
        {
            id: "quote-banner",
            type: "cta-banner",
            content: {
                title: landingCopy.home.bannerTitle,
                body: landingCopy.home.bannerBody,
                cta: { label: landingCopy.quoteCta, href: `${basePath}/quote` },
                ...(home.bannerImage !== null
                    ? {
                          backdrop: {
                              src: home.bannerImage.src,
                              srcSet: home.bannerImage.srcSet,
                              overlay: "soft" as const,
                          },
                      }
                    : {}),
            },
        },
    ]
    return {
        style: { preset: PACK_REGISTERS.services },
        shell: shell(basePath, ""),
        sections: sections.filter((section): section is LandingSection => section !== false),
    }
}

export function projectsLanding(basePath: string): LandingConfig {
    const sections: (LandingSection | false)[] = [
        {
            id: "hero",
            type: "hero",
            variant: "statement",
            content: {
                headline: landingCopy.projects.headline,
                subheadline: landingCopy.projects.subheadline,
            },
        },
        lookbook.items.length > 0 && lookbookSection(),
        {
            id: "transformations",
            type: "gallery",
            variant: "before-after",
            content: {
                kicker: landingCopy.projects.kicker,
                items: projects.map(comparisonItem),
                lightbox: true,
            },
        },
        {
            id: "process",
            type: "steps",
            variant: "timeline",
            content: {
                kicker: process.kicker,
                title: process.title,
                steps: process.steps,
            },
        },
        {
            id: "quote-banner",
            type: "cta-banner",
            content: {
                title: landingCopy.projects.bannerTitle,
                cta: { label: landingCopy.quoteCta, href: `${basePath}/quote` },
            },
        },
    ]
    return {
        style: { preset: PACK_REGISTERS.services },
        shell: shell(basePath, "/projects"),
        sections: sections.filter((section): section is LandingSection => section !== false),
    }
}

export function servicesPageLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.services },
        shell: shell(basePath, "/services"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: landingCopy.servicesPage.headline,
                    subheadline: landingCopy.servicesPage.subheadline,
                },
            },
            {
                id: "services",
                type: "showcase",
                variant: "card-grid",
                content: {
                    kicker: landingCopy.servicesPage.kicker,
                    items: services.map((service) => ({
                        title: service.title,
                        description: service.description,
                        eyebrow: service.eyebrow,
                        meta: service.priceNote,
                        media: imageMedia(service.image),
                        url: `${basePath}/quote`,
                    })),
                },
            },
            {
                id: "faq",
                type: "faq",
                content: {
                    kicker: landingCopy.servicesPage.faqKicker,
                    title: landingCopy.servicesPage.faqTitle,
                    items: faq,
                },
            },
            {
                id: "quote-banner",
                type: "cta-banner",
                content: {
                    title: landingCopy.servicesPage.bannerTitle,
                    body: landingCopy.servicesPage.bannerBody,
                    cta: { label: landingCopy.quoteCta, href: `${basePath}/quote` },
                },
            },
        ],
    }
}

export function aboutLanding(basePath: string): LandingConfig {
    const sections: (LandingSection | false)[] = [
        {
            id: "story",
            type: "content-split",
            variant: "media-left",
            content: {
                kicker: landingCopy.about.kicker,
                headline: about.headline,
                body: about.paragraphs.join(" "),
                bullets: landingCopy.about.bullets,
                media: imageMedia(about.photo),
                cta: { label: landingCopy.quoteCta, href: `${basePath}/quote` },
            },
        },
        home.proofMetrics.length === 0 && {
            id: "proof",
            type: "social-proof",
            // The numbers only: the license already rides the story's
            // bullets, the credentials strip, and the footer.
            variant: "metrics-row",
            content: { metrics },
        },
        {
            id: "credentials",
            type: "social-proof",
            variant: "text-logos",
            content: {
                label: landingCopy.about.credentialsLabel,
                items: about.credentials,
            },
        },
        {
            id: "kind-words",
            type: "testimonials",
            variant: "quote-grid",
            content: {
                kicker: landingCopy.about.reviewsKicker,
                title: landingCopy.about.reviewsTitle,
                quotes: testimonialQuotes(),
            },
        },
        {
            id: "quote-banner",
            type: "cta-banner",
            content: {
                title: landingCopy.about.bannerTitle,
                cta: { label: landingCopy.quoteCta, href: `${basePath}/quote` },
            },
        },
    ]
    return {
        style: { preset: PACK_REGISTERS.services },
        shell: shell(basePath, "/about"),
        sections: sections.filter((section): section is LandingSection => section !== false),
    }
}

export function quoteLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.services },
        shell: shell(basePath, "/quote"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: quote.headline,
                    subheadline: quote.body,
                },
            },
            {
                id: "quote-form",
                type: "lead-form",
                variant: "detail-form",
                content: {
                    kicker: landingCopy.quotePage.kicker,
                    title: landingCopy.quotePage.title,
                    cta: landingCopy.quotePage.cta,
                    confirmation: quote.confirmation,
                    fields: quote.fields,
                    // Direct channels trail the form. The phone is a tel:
                    // link — click-to-call is how trades customers actually
                    // reach out — while the email stays deliberately plain
                    // text (the photography pack's reasoning: selectable
                    // for whatever mail client the visitor uses). The form
                    // itself delivers through the platform's managed forms
                    // pipeline.
                    channels: [
                        { label: "Phone", value: business.phone, href: business.phoneHref },
                        { label: "Email", value: business.email },
                        {
                            label: "Office",
                            value: business.address,
                            href: `https://maps.google.com/?q=${encodeURIComponent(business.address)}`,
                        },
                        { label: "Hours", value: hoursNote },
                    ],
                },
            },
        ],
    }
}
