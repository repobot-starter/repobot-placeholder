import type { LandingConfig, LandingSection, MarketingMedia, MarketingShellConfig } from "@ui"
import { formatMinute, statusLabel, type DayHours } from "../Landing/hours"
import type { PracticeContent, PracticeProvider } from "../Landing/practiceDocument"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import { careShell } from "./careShell"
import type { CareDirectory, CarePhoto, CareStack } from "./careSections"
import {
    booking,
    codePractice,
    exhibits,
    faq,
    home,
    journey,
    landingCopy,
    menu,
    practice,
    promises,
    providerPhotos,
    spotlight,
    story,
} from "./content"

/**
 * The primary-care pack's pages as landing-kernel configs
 * (docs/landing.md). The business facts — providers, services,
 * insurance, hours, reviews, new-patient info — arrive as a RESOLVED
 * `PracticeContent` (the business-content contract over `content.ts`,
 * resolved once in CarePage via `usePracticeContent`): an owner's Manage
 * edit and the code default walk the same path. Page copy that isn't a
 * business fact (headlines, the story, the price list, the FAQ, the
 * booking intro) stays in `content.ts` alone.
 *
 * The base wears the luxe-light register in the practice's own calm teal
 * (hairline rules, white cards on a near-white ground, one confident
 * accent); the remixes re-register it in their catalogs. Section order is
 * fixed here; a seed shapes its pages by what it fills — `promises`,
 * `exhibits`, `journey`, `menu`, `spotlight`, and `faq` emit only when the
 * seed writes them, a home page that leads with any of the first three
 * drops the service grid (the services page keeps the full list), the
 * seed's `home.layout`, `exhibits.layout`, and `journey.layout` pick the
 * hero, exhibit, and journey variants (so a pinned skeleton always
 * matches), a directory of the providers replaces the home portraits band, a
 * spotlight with a filled report prints the report card and leads the
 * page ahead of the journey, and
 * a home page without a price list carries the insurance strip straight under the
 * hero (an in-network practice's first answer is which plans it takes;
 * with prices, coverage follows the prices it qualifies). A seed's
 * `home.progress` pairs and `home.journey` rail hang straight under the
 * hero, ahead of all of it, and `home.layout` puts the hero photograph
 * full-bleed. A seed that sets `home.stack` gets the `stack` home instead
 * (`CareStack`); the other pages are the same either way.
 *
 * Every builder takes `basePath`: "" when the pack owns the site (links
 * are /providers, /book) and "/care" on the preview route — same pages,
 * both wirings. Section `id`s are stable: CarePage pipes these configs
 * through the landing document's per-page merge (`useSitePageConfig`),
 * and the catalog's seeded skeletons bind to the ids.
 */

const imageMedia = (image: CarePhoto): MarketingMedia => ({
    kind: "image",
    src: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
    srcSet: image.srcSet,
})

/** Site-relative paths join the base path; anchors and absolute links pass through. */
function sitePath(basePath: string, path: string): string {
    return path.startsWith("/") ? `${basePath}${path}` : path
}

/**
 * A provider's portrait: the contract's photo ref when the owner set one
 * (a served public path), else the pack's own portrait by provider id —
 * facts from the document, art from code.
 */
function providerMedia(provider: PracticeProvider): MarketingMedia | undefined {
    if (provider.photo !== undefined) {
        return { kind: "image", src: provider.photo, alt: provider.name }
    }
    const code = providerPhotos[provider.providerId]
    return code === undefined ? undefined : imageMedia(code)
}

function shell(basePath: string, currentPath: string): MarketingShellConfig {
    return careShell(basePath, currentPath)
}

/** The resolved practice's primary location (the pack ships exactly one). */
function mainLocation(content: PracticeContent): PracticeContent["locations"][number] | undefined {
    return content.locations[0]
}

/** Contract hours → the hours engine's day/intervals shape. */
export function toDayHours(content: PracticeContent): DayHours[] {
    const location = mainLocation(content)
    if (location === undefined) return []
    const byDay = new Map<number, [number, number][]>()
    for (const entry of location.hours) {
        const intervals = byDay.get(entry.day) ?? []
        intervals.push([entry.open, entry.close])
        byDay.set(entry.day, intervals)
    }
    return [...byDay.entries()].map(([day, intervals]) => ({
        day,
        intervals: intervals.sort((a, b) => a[0] - b[0]),
    }))
}

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

/**
 * Human hours lines from the contract's entries, consecutive same-hours
 * days grouped: "Monday – Friday · 8 AM – 5 PM", "Saturday · 9 AM – 1 PM".
 */
export function hoursLines(content: PracticeContent): string[] {
    const location = mainLocation(content)
    if (location === undefined) return []
    const sorted = [...location.hours].sort((a, b) => a.day - b.day)
    const lines: string[] = []
    let runStart = 0
    for (let i = 0; i <= sorted.length; i++) {
        const prev = sorted[i - 1]
        const current = sorted[i]
        const extends_ =
            i > runStart &&
            current !== undefined &&
            prev !== undefined &&
            current.day === prev.day + 1 &&
            current.open === prev.open &&
            current.close === prev.close
        if (i === 0 || extends_) continue
        const first = sorted[runStart]
        const last = sorted[i - 1]
        const days =
            first.day === last.day
                ? DAY_LABELS[first.day]
                : `${DAY_LABELS[first.day]} – ${DAY_LABELS[last.day]}`
        lines.push(`${days} · ${formatMinute(first.open)} – ${formatMinute(first.close)}`)
        runStart = i
    }
    return lines
}

/** Map link from the practice's map-ready address (content.ts, not contract). */
function directionsHref(): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(practice.mapsQuery)}`
}

/** The hero's facts list, its links joined to the base path. */
function heroDirectory(basePath: string, directory: CareDirectory) {
    return {
        kind: "directory" as const,
        ...(directory.title !== undefined ? { title: directory.title } : {}),
        ...(directory.lines !== undefined ? { lines: [...directory.lines] } : {}),
        items: directory.items.map((item) => ({
            label: item.label,
            ...(item.note !== undefined ? { note: item.note } : {}),
            ...(item.icon !== undefined ? { icon: item.icon } : {}),
            ...(item.path !== undefined ? { href: sitePath(basePath, item.path) } : {}),
        })),
    }
}

/** The insurance strip, shared by home, services, and new-patients. */
function insuranceSection(content: PracticeContent) {
    return {
        id: "insurance",
        type: "logos" as const,
        variant: "strip" as const,
        content: {
            kicker: landingCopy.insuranceKicker,
            logos: content.insurance.map((name) => ({ name })),
        },
    }
}

/** The price list — memberships, session fees, self-pay prices. Omitted when empty. */
function menuSections(): LandingSection[] {
    if (menu.groups.length === 0) return []
    return [
        {
            id: "menu",
            type: "pricing",
            variant: "price-list",
            content: {
                kicker: menu.kicker,
                title: menu.title,
                period: "",
                ...(menu.intro !== undefined ? { intro: menu.intro } : {}),
                groups: menu.groups.map((group) => ({
                    heading: group.heading,
                    items: group.items.map((item) => ({ ...item })),
                })),
                ...(menu.footnote !== undefined ? { footnote: menu.footnote } : {}),
            },
        },
    ]
}

/** The service cards (home: the first six, services page: all). */
function servicesSection(content: PracticeContent, variant: "3up" | "4up", heading: boolean) {
    const cards = content.services.map((service) => ({ title: service.name, body: service.description }))
    return {
        id: "services",
        type: "card-grid" as const,
        variant,
        content: heading
            ? {
                  kicker: landingCopy.home.servicesKicker,
                  title: landingCopy.home.servicesHeading,
                  cards: cards.slice(0, 6),
              }
            : { cards },
    }
}

const JOURNEY_VARIANTS = {
    timeline: "timeline",
    rail: "horizontal-rail",
    cards: "numbered-cards",
} as const

/** The patient's first months as steps. Omitted when empty. */
function journeySections(): LandingSection[] {
    if (journey.steps.length === 0) return []
    return [
        {
            id: "journey",
            type: "steps",
            variant: JOURNEY_VARIANTS[journey.layout ?? "timeline"],
            content: {
                ...(journey.kicker !== "" ? { kicker: journey.kicker } : {}),
                ...(journey.title !== "" ? { title: journey.title } : {}),
                steps: journey.steps.map((step) => ({
                    title: step.title,
                    description: step.description,
                    ...(step.label !== undefined ? { label: step.label } : {}),
                    ...(step.image !== undefined ? { media: imageMedia(step.image) } : {}),
                })),
            },
        },
    ]
}

/** A provider's one-line tag list ("Couples · Grief") as chips. */
function splitTags(line: string | undefined): string[] {
    return (line ?? "")
        .split("·")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== "")
}

/** A home page whose exhibits are a directory of the practice's providers. */
function directoryLeads(content: PracticeContent): boolean {
    return exhibits.layout === "directory" && content.providers.length > 0
}

/**
 * A directory's cards: the resolved providers themselves, so an owner's
 * Manage edit to a name, photo, role, or tags repaints the home page as
 * it does /providers. The seed's `extras` add each card's blurb.
 */
function directoryItems(content: PracticeContent) {
    return content.providers.map((provider) => {
        const media = providerMedia(provider)
        return {
            eyebrow: roleLine(provider),
            title: provider.name,
            description:
                exhibits.extras.find((extra) => extra.providerId === provider.providerId)?.description ?? "",
            tags: splitTags(provider.tags),
            ...(media !== undefined ? { media } : {}),
        }
    })
}

/** A spotlight carrying a filled report leads the home page. */
function reportLeads(): boolean {
    return spotlight !== null && spotlight.headline.trim() !== "" && spotlight.report.title.trim() !== ""
}

/**
 * What the home page leads with after the hero: promises, exhibits, a
 * report spotlight, the journey — or, when the seed fills none of them,
 * the service grid.
 */
function leadSections(content: PracticeContent, basePath: string): LandingSection[] {
    const sections: LandingSection[] = []
    if (promises.items.length > 0) {
        sections.push({
            id: "promises",
            type: "feature-grid",
            variant: "icon-list",
            content: {
                // An unheaded list is a strip of facts; no empty heading tags.
                ...(promises.kicker !== "" ? { kicker: promises.kicker } : {}),
                ...(promises.title !== "" ? { title: promises.title } : {}),
                features: promises.items.map((item) => ({ ...item })),
            },
        })
    }
    if (directoryLeads(content)) {
        sections.push({
            id: "exhibits",
            type: "showcase",
            variant: "filterable-grid",
            content: { kicker: exhibits.kicker, title: exhibits.title, items: directoryItems(content) },
        })
    } else if (exhibits.layout !== "directory" && exhibits.items.length > 0) {
        const notes = exhibits.layout === "notes"
        sections.push({
            id: "exhibits",
            type: "showcase",
            variant: notes ? "stories" : "card-grid",
            content: {
                kicker: exhibits.kicker,
                title: exhibits.title,
                items: exhibits.items.map((item) => ({
                    ...(notes ? { meta: item.meta } : item.meta !== "" ? { eyebrow: item.meta } : {}),
                    title: item.title,
                    description: item.description,
                    media: imageMedia(item.image),
                    ...(item.icon !== undefined ? { icon: item.icon } : {}),
                    ...(item.points !== undefined ? { points: [...item.points] } : {}),
                })),
            },
        })
    }
    if (reportLeads()) sections.push(...spotlightSections(basePath))
    sections.push(...journeySections())
    if (sections.length === 0) sections.push(servicesSection(content, "3up", true))
    return sections
}

/** The photograph-led story on the home page. Omitted until the seed gives it a headline. */
function spotlightSections(basePath: string): LandingSection[] {
    if (spotlight === null || spotlight.headline.trim() === "") return []
    const report = spotlight.report.title.trim() !== "" ? spotlight.report : undefined
    return [
        {
            id: "spotlight",
            type: "content-split",
            variant: report !== undefined ? "report" : "media-right",
            content: {
                kicker: spotlight.kicker,
                headline: spotlight.headline,
                body: spotlight.body,
                bullets: [...spotlight.bullets],
                ...(report !== undefined
                    ? {
                          report: {
                              ...(report.label !== "" ? { label: report.label } : {}),
                              issuer: practice.name,
                              title: report.title,
                              ...(report.summary !== "" ? { location: report.summary } : {}),
                              rows: report.rows.map((row) => ({ label: row.label, value: row.value })),
                              ...(report.signature !== "" ? { signature: { name: report.signature } } : {}),
                              ...(report.stamp !== "" ? { stamp: report.stamp } : {}),
                          },
                      }
                    : { media: imageMedia(spotlight.image) }),
                ...(spotlight.cta !== undefined
                    ? { cta: { label: spotlight.cta.label, href: sitePath(basePath, spotlight.cta.path) } }
                    : {}),
            },
        },
    ]
}

/** The before/after pairs and the path rail a seed hangs under the hero. Omitted when unset. */
function underHeroSections(): LandingSection[] {
    const sections: LandingSection[] = []
    if (home.progress !== undefined && home.progress.items.length > 0) {
        sections.push({
            id: "progress",
            type: "gallery",
            variant: "before-after",
            content: {
                kicker: home.progress.kicker,
                title: home.progress.title,
                lightbox: true,
                items: home.progress.items.map((item) => ({
                    caption: item.caption,
                    media: imageMedia(item.after),
                    beforeMedia: imageMedia(item.before),
                    ...(item.beforeLabel !== undefined ? { beforeLabel: item.beforeLabel } : {}),
                    ...(item.afterLabel !== undefined ? { afterLabel: item.afterLabel } : {}),
                })),
            },
        })
    }
    if (home.journey !== undefined && home.journey.steps.length > 0) {
        sections.push({
            id: "journey",
            type: "steps",
            variant: "horizontal-rail",
            content: {
                ...(home.journey.kicker !== undefined ? { kicker: home.journey.kicker } : {}),
                ...(home.journey.title !== undefined ? { title: home.journey.title } : {}),
                steps: home.journey.steps.map((step) => ({
                    title: step.title,
                    description: step.description,
                    ...(step.label !== undefined ? { label: step.label } : {}),
                    ...(step.icon !== undefined ? { icon: step.icon } : {}),
                    ...(step.image !== undefined ? { media: imageMedia(step.image) } : {}),
                })),
            },
        })
    }
    return sections
}

/** The questions people actually ask before joining. Omitted when empty. */
function faqSections(): LandingSection[] {
    if (faq.items.length === 0) return []
    return [
        {
            id: "faq",
            type: "faq",
            variant: "accordion",
            content: {
                kicker: faq.kicker,
                title: faq.title,
                items: faq.items.map((item) => ({ ...item })),
            },
        },
    ]
}

/** The visit panel: address, phone, grouped hours, a map link. */
function visitSection(content: PracticeContent, media: CarePhoto) {
    const location = mainLocation(content)
    return {
        id: "visit",
        type: "content-split" as const,
        variant: "media-left" as const,
        content: {
            kicker: "Visit us",
            headline: landingCopy.visitHeadline,
            body:
                location === undefined
                    ? practice.address
                    : `${location.address}${location.phone !== undefined ? ` · ${location.phone}` : ""}`,
            bullets: hoursLines(content),
            cta: { label: "Get directions", href: directionsHref() },
            media: imageMedia(media),
        },
    }
}

/** The closing ask, worn by most pages. */
function bookBanner(basePath: string, title: string) {
    return {
        id: "book-banner",
        type: "cta-banner" as const,
        variant: "card" as const,
        content: {
            title,
            cta: { label: landingCopy.bookCtaLabel, href: `${basePath}/book` },
        },
    }
}

/** "LMFT · Families & teens": credentials, then the one-line role. */
function roleLine(provider: PracticeProvider): string {
    return [provider.credentials, provider.role]
        .filter((part) => part !== undefined && part !== "")
        .join(" · ")
}

function teamMembers(content: PracticeContent, withBios: boolean) {
    return content.providers.map((provider) => ({
        name: provider.name,
        role: roleLine(provider),
        ...(withBios ? { bio: provider.bio } : {}),
        media: providerMedia(provider),
    }))
}

/**
 * The `stack` home (`home.stack`): the photograph with the headline, the
 * band line, the frames at one size (each caption on its band), the
 * outcomes report, and the closing line over the booking link — the band,
 * frames, and report emit only when filled.
 */
function stackHome(basePath: string, stack: CareStack): LandingSection[] {
    return [
        {
            id: "hero",
            type: "hero",
            variant: "full-bleed-media",
            content: {
                headline: home.headline,
                accent: home.accent ?? "none",
                ...(home.subheadline !== "" ? { subheadline: home.subheadline } : {}),
                media: imageMedia(home.hero),
            },
        },
        ...(stack.band.trim() !== ""
            ? [
                  {
                      id: "band",
                      type: "rich-prose" as const,
                      variant: "narrow" as const,
                      content: { paragraphs: [stack.band] },
                  },
              ]
            : []),
        ...(stack.frames.length > 0
            ? [
                  {
                      id: "frames",
                      type: "gallery" as const,
                      variant: "sequence" as const,
                      content: {
                          items: stack.frames.map((frame) => ({
                              media: imageMedia(frame.image),
                              ...(frame.caption.trim() !== "" ? { caption: frame.caption } : {}),
                          })),
                          captionStack: "band-center" as const,
                      },
                  },
              ]
            : []),
        ...(stack.report !== undefined && stack.report.rows.length > 0
            ? [
                  {
                      id: "numbers",
                      type: "stats" as const,
                      variant: "bars" as const,
                      content: {
                          ...(stack.report.kicker !== "" ? { kicker: stack.report.kicker } : {}),
                          ...(stack.report.intro !== "" ? { intro: stack.report.intro } : {}),
                          stats: stack.report.rows.map((row) => ({ label: row.label, value: row.value })),
                          ...(stack.report.footnote !== "" ? { footnote: stack.report.footnote } : {}),
                          ...(stack.report.note !== "" ? { note: stack.report.note } : {}),
                      },
                  },
              ]
            : []),
        {
            id: "book-banner",
            type: "cta-banner",
            variant: "colophon",
            content: {
                title: stack.closing !== "" ? stack.closing : landingCopy.home.bannerTitle,
                cta: {
                    label: stack.closingCta !== "" ? stack.closingCta : landingCopy.bookCtaLabel,
                    href: `${basePath}/book`,
                },
            },
        },
    ]
}

export function homeLanding(
    basePath: string,
    now: Date,
    content: PracticeContent = codePractice,
): LandingConfig {
    if (home.stack !== undefined) {
        return {
            style: { preset: PACK_REGISTERS.care },
            shell: shell(basePath, ""),
            sections: stackHome(basePath, home.stack),
        }
    }
    const coverageFirst = menu.groups.length === 0
    return {
        style: { preset: PACK_REGISTERS.care },
        shell: shell(basePath, ""),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: home.layout === "full-bleed" ? "full-bleed-media" : "split-media",
                content: {
                    // Live from the clock and the contract's hours — the
                    // menu pack's open-badge discipline.
                    badge: statusLabel(
                        toDayHours(content),
                        now.getDay(),
                        now.getHours() * 60 + now.getMinutes(),
                    ),
                    ...(home.liveBadge === true ? { badgeLive: true } : {}),
                    headline: home.headline,
                    accent: home.accent ?? "none",
                    subheadline: home.subheadline,
                    ...(home.credit !== undefined ? { credit: home.credit } : {}),
                    ...(home.caption !== undefined ? { mediaCaption: home.caption } : {}),
                    ...(home.seal !== undefined ? { seal: home.seal } : {}),
                    ...(home.directory !== undefined && home.directory.items.length > 0
                        ? { aside: heroDirectory(basePath, home.directory) }
                        : {}),
                    primaryCta: { label: landingCopy.bookCtaLabel, href: `${basePath}/book` },
                    secondaryCta: {
                        label: landingCopy.home.secondaryCtaLabel,
                        href: `${basePath}/providers`,
                    },
                    media: imageMedia(home.hero),
                },
            },
            ...underHeroSections(),
            ...(coverageFirst ? [insuranceSection(content)] : []),
            ...leadSections(content, basePath),
            ...menuSections(),
            ...(coverageFirst ? [] : [insuranceSection(content)]),
            ...(reportLeads() ? [] : spotlightSections(basePath)),
            ...(directoryLeads(content)
                ? []
                : [
                      {
                          id: "providers",
                          type: "team" as const,
                          variant: "portraits" as const,
                          content: {
                              kicker: landingCopy.home.providersKicker,
                              title: landingCopy.home.providersHeading,
                              members: teamMembers(content, false),
                          },
                      },
                  ]),
            {
                id: "kind-words",
                type: "testimonials",
                variant: "quote-grid",
                content: {
                    kicker: landingCopy.home.reviewsKicker,
                    quotes: content.reviews.map((review) => ({
                        quote: review.quote,
                        author: review.name,
                        title: review.detail,
                    })),
                },
            },
            ...faqSections(),
            visitSection(content, story.image),
            bookBanner(basePath, landingCopy.home.bannerTitle),
        ],
    }
}

export function providersLanding(basePath: string, content: PracticeContent = codePractice): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.care },
        shell: shell(basePath, "/providers"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: landingCopy.providersPage.headline,
                    accent: "none",
                    subheadline: landingCopy.providersPage.subheadline,
                },
            },
            {
                id: "providers",
                type: "team",
                variant: "portraits",
                content: { members: teamMembers(content, true) },
            },
            {
                id: "story",
                type: "content-split",
                variant: "media-right",
                content: {
                    kicker: story.kicker,
                    headline: story.headline,
                    body: story.paragraphs.join(" "),
                    media: imageMedia(story.image),
                    cta: { label: landingCopy.bookCtaLabel, href: `${basePath}/book` },
                },
            },
        ],
    }
}

export function servicesLanding(basePath: string, content: PracticeContent = codePractice): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.care },
        shell: shell(basePath, "/what-we-treat"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: landingCopy.servicesPage.headline,
                    accent: "none",
                    subheadline: landingCopy.servicesPage.subheadline,
                },
            },
            servicesSection(content, "4up", false),
            ...menuSections(),
            insuranceSection(content),
            bookBanner(basePath, landingCopy.servicesPage.bannerTitle),
        ],
    }
}

export function newPatientsLanding(basePath: string, content: PracticeContent = codePractice): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.care },
        shell: shell(basePath, "/new-patients"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: landingCopy.newPatientsPage.headline,
                    accent: "none",
                    subheadline: landingCopy.newPatientsPage.subheadline,
                },
            },
            {
                id: "first-visit",
                type: "steps",
                variant: "timeline",
                content: {
                    kicker: landingCopy.newPatientsPage.kicker,
                    steps: content.newPatient.map((item) => ({
                        title: item.title,
                        description: item.body,
                    })),
                },
            },
            insuranceSection(content),
            ...faqSections(),
            visitSection(content, home.hero),
            bookBanner(basePath, landingCopy.newPatientsPage.bannerTitle),
        ],
    }
}

export function bookLanding(basePath: string, content: PracticeContent = codePractice): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.care },
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
            // The AppointmentWidget mounts as this page's hero trailer
            // (CarePage `sectionTrailers`), so the times sit right here.
            {
                id: "how",
                type: "steps",
                variant: "numbered-cards",
                content: {
                    kicker: "How it works",
                    steps: landingCopy.bookPage.steps.map((step) => ({ ...step })),
                },
            },
            {
                id: "privacy",
                type: "content-split",
                variant: "media-right",
                content: {
                    kicker: "What booking asks",
                    headline: "Your details, not your diagnosis.",
                    body: booking.privacyNote,
                    bullets: [
                        "Your name and contact details",
                        "The visit type and a time",
                        "Whether you're new or returning — that's all",
                    ],
                },
            },
            visitSection(content, story.image),
        ],
    }
}
