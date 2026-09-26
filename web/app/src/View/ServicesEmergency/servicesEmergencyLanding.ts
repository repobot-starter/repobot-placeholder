import { isMarketingIconName, type LandingConfig, type LandingSection, type MarketingShellConfig } from "@ui"
import { dayNames, formatMinute, statusAt } from "../Landing/hours"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import {
    about,
    business,
    dispatchBoard,
    faq,
    heroThread,
    home,
    hoursNote,
    intake,
    jobReports,
    landingCopy,
    metrics,
    onCall,
    priceBoard,
    priceBook,
    request,
    restorations,
    serviceArea,
    services,
    steps,
    systems,
    testimonials,
    type JobReport,
    type SiteImage,
} from "./content"
import { servicesEmergencyShell } from "./servicesEmergencyShell"

/**
 * The emergency-services pack's pages as landing-kernel configs — the
 * `services` category's dispatch shape (docs/landing.md). `content.ts`
 * stays the single owner-editable source; these builders only map it into
 * sections.
 *
 * The shape's convictions, in section order: the hero leads with the call
 * (primary CTA is tel:, the badge is the on-call status computed from
 * `onCall.week` — never a fake live tracker) over a full-bleed photograph
 * of the owner on the job, with the prices painted on a board right on it;
 * the status strip carries the measured numbers, a job report proves the
 * quote is the invoice, and "how it works" is the text thread the customer
 * actually gets. No portfolio: nobody browses a gallery while their
 * basement floods.
 *
 * Presence is content-driven so derived templates (remix seeds) keep their
 * own shape: a `home.heroImage` → the photograph beside the headline, or
 * full-bleed under the price board when there is one (without a photograph
 * the text thread sits beside the headline, else a typographic statement); a
 * `priceBoard` → the board on the hero, and the home drops the services
 * grid and full price book to /services (without one the home carries
 * both, the book only when it has items); `home.seal` / `home.readout` →
 * the hero's roundel and monumental figure; no job reports → no report;
 * no `onCall.week` → the static dispatch badge; an `intake` with a `cta`
 * (and a photograph) → the hero as the intake card over the scene; filled
 * `systems` → the systems index after the hero (services and price book
 * move to /services); `dispatchBoard` rows → the live board just before
 * the metrics strip (a remix pins one or both); `restorations` → the before/after gallery after "how it
 * works"; `home.credit` → the tracked line under a full-bleed headline;
 * `landingCopy.finalCtaBody` / `finalCtaAsk` → the closing banner's line
 * and ask. A remix pins its section
 * order and variants in its own catalog's landing seed.
 *
 * Every builder takes `basePath`: "" when the pack owns the site (links
 * are /services, /about, /request) and "/emergency" on the preview route —
 * same pages, both wirings.
 *
 * Every section carries a stable `id`: ServicesEmergencyPage pipes these
 * configs through the landing document's per-page merge
 * (`useSitePageConfig`), so the platform's structural editor can reorder /
 * delete / add sections on these pages. The pack's catalog maps the routes
 * (`landing.routes` in catalog.json).
 */

const imageMedia = (image: SiteImage) => ({
    kind: "image" as const,
    src: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
    srcSet: image.srcSet,
})

/**
 * The hero's on-call pill from the shared hours engine. A week of
 * `[[0, 1440]]` days is 24/7 (the engine alone would call it "closes 12
 * AM"); the arrival line is the content's measured typical, not a live ETA.
 */
function onCallBadge(now: Date): { badge: string; badgeLive?: true } {
    if (onCall.week.length === 0) {
        return { badge: business.dispatchBadge }
    }
    const arrival = onCall.typicalArrival !== "" ? ` · ${onCall.typicalArrival}` : ""
    const alwaysOn = [0, 1, 2, 3, 4, 5, 6].every((day) =>
        onCall.week.some(
            (entry) =>
                entry.day === day && entry.intervals.some(([open, close]) => open <= 0 && close >= 1440),
        ),
    )
    if (alwaysOn) {
        return { badge: `On call now, 24/7${arrival}`, badgeLive: true }
    }
    const day = now.getDay()
    const status = statusAt(onCall.week, day, now.getHours() * 60 + now.getMinutes())
    if (!status.nextChange) {
        return { badge: business.dispatchBadge }
    }
    const time = formatMinute(status.nextChange.minute)
    if (status.open) {
        return { badge: `On call now — until ${time}${arrival}`, badgeLive: true }
    }
    const when = status.nextChange.day === day ? time : `${dayNames[status.nextChange.day]} ${time}`
    return { badge: `Back on call ${when} · ${hoursNote}` }
}

/** Price-book lines in headed runs, in the order the owner wrote them. */
function priceBookGroups() {
    const groups: {
        heading?: string
        items: { name: string; note?: string; price: string; qualifier?: string }[]
    }[] = []
    for (const item of priceBook.items) {
        const heading = item.group !== "" ? item.group : undefined
        let group = groups.find((entry) => entry.heading === heading)
        if (!group) {
            group = { ...(heading !== undefined ? { heading } : {}), items: [] }
            groups.push(group)
        }
        group.items.push({
            name: item.name,
            ...(item.note !== "" ? { note: item.note } : {}),
            price: item.price,
            ...(item.qualifier !== "" ? { qualifier: item.qualifier } : {}),
        })
    }
    return groups
}

function priceBookSection(basePath: string, id: string): LandingSection {
    return {
        id,
        type: "pricing",
        variant: "price-list",
        content: {
            title: priceBook.title,
            intro: priceBook.intro,
            groups: priceBookGroups(),
            footnote: priceBook.footnote,
            cta: { label: priceBook.ctaLabel, href: `${basePath}/request` },
        },
    }
}

function reportCard(report: JobReport) {
    return {
        label: "Job report",
        issuer: business.name,
        title: `Job #${report.jobNumber} — ${report.title}`,
        location: report.location,
        rows: [
            { label: "Diagnosed", value: report.diagnosed },
            { label: "Quoted", value: report.quoted },
            { label: "Final", value: report.final, highlight: true },
            { label: "Time on site", value: report.timeOnSite },
        ],
        before: imageMedia(report.before),
        after: imageMedia(report.after),
        signature: { name: report.tech, detail: report.techDetail },
        ...(report.stamp !== "" ? { stamp: report.stamp } : {}),
    }
}

/** The hero's price board, from the content's sign-writer shorthand. */
function priceBoardAside(basePath: string) {
    return {
        kind: "price-board" as const,
        title: priceBoard.title,
        items: priceBoard.items.map((item) => ({
            name: item.name,
            price: item.price,
            ...(item.qualifier !== "" ? { qualifier: item.qualifier } : {}),
        })),
        ...(priceBoard.footnote !== "" ? { footnote: priceBoard.footnote } : {}),
        cta: { label: priceBook.ctaLabel, href: `${basePath}/request` },
    }
}

/**
 * How it works. With a hero photograph the text thread moves here: each
 * message is a step's bubble and the step at the same position explains
 * it. Otherwise (the thread is in the hero, or there is none) the steps
 * read as numbered cards.
 */
function whenYouCallSection(): LandingSection {
    const thread = home.heroImage !== null && heroThread.messages.length > 0
    if (!thread) {
        return {
            id: "when-you-call",
            type: "steps",
            variant: "numbered-cards",
            content: {
                kicker: steps.kicker,
                title: steps.title,
                steps: steps.items,
            },
        }
    }
    return {
        id: "when-you-call",
        type: "steps",
        variant: "message-thread",
        content: {
            kicker: steps.kicker,
            title: steps.title,
            thread: {
                name: heroThread.name,
                ...(heroThread.detail !== "" ? { detail: heroThread.detail } : {}),
            },
            steps: heroThread.messages.map((message, index) => ({
                title: message.text,
                description: steps.items[index]?.description ?? "",
                side: message.side,
                time: message.time,
                ...(message.photo !== undefined ? { media: imageMedia(message.photo) } : {}),
                ...(message.chip !== undefined ? { chip: message.chip } : {}),
            })),
        },
    }
}

/** The hero's text-thread aside, or nothing when the module has no thread. */
function heroAside() {
    if (heroThread.messages.length === 0) return {}
    return {
        aside: {
            kind: "thread" as const,
            name: heroThread.name,
            ...(heroThread.detail !== "" ? { detail: heroThread.detail } : {}),
            messages: heroThread.messages.map((message) => ({
                text: message.text,
                side: message.side,
                time: message.time,
                ...(message.photo !== undefined ? { media: imageMedia(message.photo) } : {}),
                ...(message.chip !== undefined ? { chip: message.chip } : {}),
            })),
        },
    }
}

/** The hero's intake card, from the content's `intake` (only called when its `cta` is filled). */
function intakeForm() {
    return {
        ...(intake.title !== "" ? { heading: intake.title } : {}),
        ...(intake.choices.length > 0
            ? {
                  choices: intake.choices.map((choice) => ({
                      label: choice.label,
                      ...(isMarketingIconName(choice.icon) ? { icon: choice.icon } : {}),
                  })),
              }
            : {}),
        ...(intake.field.name !== ""
            ? {
                  field: {
                      name: intake.field.name,
                      label: intake.field.label,
                      ...(intake.field.placeholder !== "" ? { placeholder: intake.field.placeholder } : {}),
                  },
              }
            : {}),
        contact: intake.contact,
        placeholder: intake.placeholder,
        cta: intake.cta,
        confirmation: intake.confirmation,
    }
}

/** The systems index: the property's systems as coded specimen plates. */
function systemsSection(): LandingSection {
    return {
        id: "systems",
        type: "showcase",
        variant: "specimens",
        content: {
            ...(systems.kicker !== "" ? { kicker: systems.kicker } : {}),
            ...(systems.title !== "" ? { title: systems.title } : {}),
            items: systems.items.map((system) => ({
                eyebrow: system.code,
                title: system.name,
                meta: system.interval,
                description: system.description,
                media: imageMedia(system.image),
            })),
        },
    }
}

/**
 * The dispatch board: one ruled row per crew — who and where on the left,
 * the status and its figure beside it — with the summary line under it.
 */
function dispatchBoardSection(): LandingSection {
    return {
        id: "dispatch-board",
        type: "schedule",
        variant: "day-rows",
        content: {
            ...(dispatchBoard.label !== "" ? { kicker: dispatchBoard.label } : {}),
            days: dispatchBoard.rows.map((row) => ({
                label: row.crew,
                sessions: [{ time: row.value, title: row.status }],
            })),
            ...(dispatchBoard.summary !== "" ? { note: dispatchBoard.summary } : {}),
        },
    }
}

/** Before and after from the same doorway, one pair per restoration. */
function restorationsSection(): LandingSection {
    return {
        id: "restorations",
        type: "gallery",
        variant: "before-after",
        content: {
            ...(restorations.kicker !== "" ? { kicker: restorations.kicker } : {}),
            ...(restorations.title !== "" ? { title: restorations.title } : {}),
            items: restorations.items.map((item) => ({
                media: imageMedia(item.after),
                beforeMedia: imageMedia(item.before),
                caption: `${item.title}, ${item.location} — ${item.scope}`,
            })),
        },
    }
}

// The shared chrome lives in servicesEmergencyShell.ts (manifest pages
// wear it too); this alias keeps the page builders reading naturally.
function shell(
    basePath: string,
    currentPath: "" | "/services" | "/about" | "/request",
): MarketingShellConfig {
    return servicesEmergencyShell(basePath, currentPath)
}

export function homeLanding(basePath: string, now: Date = new Date()): LandingConfig {
    const report = jobReports.items[0]
    const board = priceBoard.items.length > 0
    const intakeHero = intake.cta !== "" && home.heroImage !== null
    const indexed = systems.items.length > 0
    return {
        style: { preset: PACK_REGISTERS["services-emergency"] },
        shell: shell(basePath, ""),
        sections: [
            {
                id: "hero",
                type: "hero",
                // The call leads: on a dispatch site the phone IS the
                // product, so it takes the primary slot. A hero photograph
                // sits beside the call, or fills the frame with the price
                // board painted over it; the text thread sits beside the
                // headline without one; with neither the hero is
                // typographic. With an intake the photograph carries the
                // dispatcher's first question instead of the buttons: the
                // intake card over the scene, the call beside the copy. A
                // derived template may re-pin the variant.
                variant: intakeHero
                    ? "form-first"
                    : home.heroImage
                      ? board
                          ? "full-bleed-media"
                          : "split-media"
                      : heroThread.messages.length > 0
                        ? "split-media"
                        : "statement",
                content: {
                    ...onCallBadge(now),
                    headline: home.headline,
                    subheadline: home.subheadline,
                    primaryCta: { label: `Call ${business.phone}`, href: business.phoneHref },
                    secondaryCta: { label: "Request service", href: `${basePath}/request` },
                    ...(intakeHero ? { form: intakeForm() } : {}),
                    ...(home.heroImage
                        ? {
                              media: imageMedia(home.heroImage),
                              ...(board && !intakeHero ? { aside: priceBoardAside(basePath) } : {}),
                          }
                        : heroAside()),
                    ...(home.credit !== "" ? { credit: home.credit } : {}),
                    ...(home.seal !== "" ? { seal: home.seal } : {}),
                    ...(home.readout.value !== ""
                        ? {
                              readout: {
                                  value: home.readout.value,
                                  ...(home.readout.note !== "" ? { note: home.readout.note } : {}),
                              },
                          }
                        : {}),
                },
            },
            ...(indexed ? [systemsSection()] : []),
            ...(dispatchBoard.rows.length > 0 ? [dispatchBoardSection()] : []),
            {
                id: "dispatch-proof",
                type: "social-proof",
                // The measured numbers, stated once, as a thin strip. The
                // same figures ride as one-line items for registers that
                // roll the strip as a ticker readout.
                variant: "metrics-row",
                content: {
                    label: business.license,
                    metrics,
                    items: metrics.map((metric) => `${metric.value} ${metric.label}`),
                },
            },
            ...(board || indexed
                ? []
                : [
                      {
                          id: "services",
                          type: "card-grid" as const,
                          variant: "3up" as const,
                          content: {
                              kicker: "What we fix",
                              title: landingCopy.servicesHeading,
                              cards: services.map((service) => ({
                                  media: imageMedia(service.image),
                                  title: service.title,
                                  body: service.description,
                              })),
                          },
                      },
                      ...(priceBook.items.length > 0 ? [priceBookSection(basePath, "price-book")] : []),
                  ]),
            ...(report
                ? [
                      {
                          id: "job-report",
                          type: "content-split" as const,
                          // The evidence in the media's place: the quote and
                          // the final on one signed card.
                          variant: "report" as const,
                          content: {
                              kicker: jobReports.kicker,
                              headline: jobReports.headline,
                              body: jobReports.body,
                              report: reportCard(report),
                              cta: { label: "See every price", href: `${basePath}/services` },
                          },
                      },
                  ]
                : []),
            whenYouCallSection(),
            ...(restorations.items.length > 0 ? [restorationsSection()] : []),
            {
                id: "kind-words",
                type: "testimonials",
                variant: "single-featured",
                content: {
                    kicker: "From our customers",
                    quotes: testimonials.map((entry) => ({
                        quote: entry.quote,
                        author: entry.name,
                        title: entry.detail,
                    })),
                },
            },
            {
                id: "service-area",
                type: "social-proof",
                variant: "text-logos",
                content: {
                    label: landingCopy.serviceAreaLabel,
                    items: serviceArea,
                },
            },
            {
                id: "call-banner",
                type: "cta-banner",
                content: {
                    title: landingCopy.finalCtaTitle,
                    body:
                        landingCopy.finalCtaBody !== ""
                            ? landingCopy.finalCtaBody
                            : `The line is answered by a person, 24 hours a day. ${hoursNote}.`,
                    cta:
                        landingCopy.finalCtaAsk !== ""
                            ? { label: landingCopy.finalCtaAsk, href: `${basePath}/request` }
                            : { label: `Call ${business.phone}`, href: business.phoneHref },
                },
            },
        ],
    }
}

export function servicesPageLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["services-emergency"] },
        shell: shell(basePath, "/services"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: "Flat prices, quoted first.",
                    subheadline:
                        "Every job is diagnosed, then quoted flat — parts, labor, cleanup — before the work starts. The quote is the invoice, and after-hours costs the same as daytime.",
                },
            },
            ...(priceBook.items.length > 0 ? [priceBookSection(basePath, "price-book")] : []),
            {
                id: "services",
                type: "showcase",
                variant: "card-grid",
                content: {
                    kicker: "Services",
                    items: services.map((service) => ({
                        title: service.title,
                        description: service.description,
                        eyebrow: service.eyebrow,
                        meta: service.priceNote,
                        media: imageMedia(service.image),
                        url: `${basePath}/request`,
                    })),
                },
            },
            {
                id: "faq",
                type: "faq",
                content: {
                    kicker: "Fair questions",
                    title: "What people ask before they call",
                    items: faq,
                },
            },
            {
                id: "call-banner",
                type: "cta-banner",
                content: {
                    title: "Not sure what it needs? Describe the symptom.",
                    body: `Call ${business.phone} and the dispatcher will tell you straight — including when it's something you can fix yourself.`,
                    cta: { label: `Call ${business.phone}`, href: business.phoneHref },
                },
            },
        ],
    }
}

export function aboutLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["services-emergency"] },
        shell: shell(basePath, "/about"),
        sections: [
            {
                id: "story",
                type: "content-split",
                variant: "media-left",
                content: {
                    kicker: "The company",
                    headline: about.headline,
                    body: about.paragraphs.join(" "),
                    bullets: [business.license, ...about.bullets],
                    media: imageMedia(about.photo),
                    cta: { label: "Request service", href: `${basePath}/request` },
                },
            },
            {
                id: "credentials",
                type: "social-proof",
                variant: "text-logos",
                content: {
                    label: "Credentials",
                    items: about.credentials,
                },
            },
            {
                id: "kind-words",
                type: "testimonials",
                variant: "quote-grid",
                content: {
                    kicker: "From our customers",
                    title: "The calls we're proudest of",
                    quotes: testimonials.map((entry) => ({
                        quote: entry.quote,
                        author: entry.name,
                        title: entry.detail,
                    })),
                },
            },
            {
                id: "call-banner",
                type: "cta-banner",
                content: {
                    title: "Put the number on the fridge.",
                    cta: { label: `Call ${business.phone}`, href: business.phoneHref },
                },
            },
        ],
    }
}

export function requestLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["services-emergency"] },
        shell: shell(basePath, "/request"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: request.headline,
                    subheadline: request.body,
                },
            },
            {
                id: "request-form",
                type: "lead-form",
                variant: "detail-form",
                content: {
                    kicker: "Service request",
                    title: "The details",
                    cta: "Request service",
                    confirmation: request.confirmation,
                    fields: request.fields,
                    // Direct channels trail the form. The emergency line
                    // leads as a tel: link — on a dispatch site the call is
                    // the primary channel even on the form page — while the
                    // email stays deliberately plain text (selectable for
                    // whatever mail client the visitor uses). The form
                    // itself delivers through the platform's managed forms
                    // pipeline.
                    channels: [
                        { label: "Emergency line", value: business.phone, href: business.phoneHref },
                        { label: "Email", value: business.email },
                        {
                            label: "Shop",
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
