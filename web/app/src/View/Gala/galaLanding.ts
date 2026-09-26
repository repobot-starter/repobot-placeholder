import type { LandingConfig, LandingSection, MarketingShellConfig } from "@ui"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import {
    after,
    decades,
    details,
    dressCode,
    entertainment,
    event,
    home,
    landingCopy,
    program,
    rsvp,
    songs,
    stay,
    toastImage,
    venue,
    type SiteImage,
} from "./content"
import { countdownLabel, rsvpNudge } from "./countdown"
import { galaShell } from "./galaShell"

/**
 * The gala pack's pages as landing-kernel configs (docs/landing.md).
 * `content.ts` stays the single owner-editable source; these builders only
 * map it into sections.
 *
 * Every builder takes `basePath`: "" when the pack owns the site and
 * "/gala" on the preview route — same pages, both wirings. Both builders
 * also take `now`: the configs are rebuilt per render so the hero
 * countdown and the reply-by nudge stay computed from the clock (the
 * clock engine, `countdown.ts` — the estate listings engine's idiom).
 *
 * Every section carries a stable `id`: GalaPage pipes these configs
 * through the landing document's per-page merge (`useSitePageConfig`), so
 * the platform's structural editor can reorder / delete / add sections on
 * these pages and the ids are what the document's skeleton binds to. The
 * pack's catalog maps the routes (`landing.routes` in catalog.json).
 *
 * The home is shaped by what the evening fills: the hero is the
 * invitation card once `event.name` is set (the masthead over the room
 * otherwise, with the engraved lines as their own card), and the toast
 * photograph, the floor show, the dress-code swatches, the decades wall,
 * and the song requests emit only when their content has entries.
 * `home.layout: "stack"` swaps the whole home for the quiet party page
 * (`stackHome`); the RSVP page is the same either way.
 */

const imageMedia = (image: SiteImage) => ({
    kind: "image" as const,
    src: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
    srcSet: image.srcSet,
})

// The shared chrome lives in galaShell.ts (manifest pages wear it too);
// this alias keeps the page builders reading naturally.
function shell(basePath: string, currentPath: "" | "/rsvp"): MarketingShellConfig {
    return galaShell(basePath, currentPath)
}

/**
 * The `stack` home (`home.layout`): the photograph with the headline and
 * its date line, the band of lines, the frames at one size, the memory
 * book once it has entries, and the closing line over the RSVP link —
 * the band, frames, and book each emit only when filled.
 */
function stackHome(basePath: string): LandingSection[] {
    const bandTitle = home.bandTitle.trim()
    return [
        {
            id: "hero",
            type: "hero",
            variant: "full-bleed-media",
            content: {
                headline: event.headline,
                accent: "none",
                subheadline: event.subtitle,
                media: imageMedia(event.heroImage),
            },
        },
        ...(bandTitle !== "" || home.band.length > 0
            ? [
                  {
                      id: "band",
                      type: "rich-prose" as const,
                      variant: "narrow" as const,
                      content: {
                          ...(bandTitle !== "" ? { title: bandTitle } : {}),
                          paragraphs: [...home.band],
                      },
                  },
              ]
            : []),
        ...(home.stack.length > 0
            ? [
                  {
                      id: "frames",
                      type: "gallery" as const,
                      variant: "sequence" as const,
                      content: {
                          items: home.stack.map((frame) => ({
                              media: imageMedia(frame.image),
                              ...(frame.caption.trim() !== "" ? { caption: frame.caption } : {}),
                          })),
                          captionStack: "band-center" as const,
                      },
                  },
              ]
            : []),
        ...(home.memories.length > 0
            ? [
                  {
                      id: "memories",
                      type: "testimonials" as const,
                      variant: "quote-grid" as const,
                      content: {
                          ...(home.memoriesKicker !== "" ? { kicker: home.memoriesKicker } : {}),
                          quotes: home.memories.map((memory) => ({
                              quote: memory.note,
                              author: memory.name,
                          })),
                      },
                  },
              ]
            : []),
        {
            id: "rsvp-banner",
            type: "cta-banner",
            variant: "colophon",
            content: {
                title: home.closing !== "" ? home.closing : landingCopy.finalCtaTitle,
                cta: {
                    label: home.closingCta !== "" ? home.closingCta : landingCopy.rsvpCtaLabel,
                    href: `${basePath}/rsvp`,
                },
            },
        },
    ]
}

export function homeLanding(basePath: string, now: Date): LandingConfig {
    if (home.layout === "stack") {
        return {
            style: { preset: PACK_REGISTERS.gala },
            shell: shell(basePath, ""),
            sections: stackHome(basePath),
        }
    }
    // The guest of honor's name in script makes the hero the invitation
    // card itself (particulars on its strip, the address with the venue);
    // without it the hero is the masthead over the room and the engraved
    // lines get their own card, the fine print read before the room.
    const invitationHero = event.name.trim() !== ""
    const detailsSection: LandingSection = {
        id: "details",
        type: "feature-grid",
        variant: invitationHero ? "cards-3up" : "icon-list",
        content: {
            kicker: "Details",
            title: details.headline,
            features: details.items.map((item) => ({
                title: item.title,
                description: item.body,
            })),
        },
    }
    return {
        style: { preset: PACK_REGISTERS.gala },
        shell: shell(basePath, ""),
        sections: [
            invitationHero
                ? {
                      id: "hero",
                      type: "hero",
                      // The supper club's card: her name in script, the
                      // number in lacquer red, the rest sung, the portrait
                      // bleeding off the right edge into the dark, the
                      // particulars on a gilt strip and the live countdown
                      // over it all — must match the catalog's landing seed
                      // byte for byte.
                      variant: "invitation",
                      content: {
                          badge: countdownLabel(event.dateIso, now),
                          readout: { value: event.name, note: event.nameNote },
                          headline: event.headline,
                          subheadline: event.subtitle,
                          credit: [event.dateShort, event.venueShort, event.timeLabel, event.dressLabel].join(
                              " · ",
                          ),
                          ...(event.seal !== "" ? { seal: event.seal } : {}),
                          primaryCta: { label: landingCopy.rsvpCtaLabel, href: `${basePath}/rsvp` },
                          media: imageMedia(event.heroImage),
                      },
                  }
                : {
                      id: "hero",
                      type: "hero",
                      // The room IS the invitation: masthead type over the
                      // ballroom photograph, with the live countdown as the
                      // badge — must match the catalog's landing seed byte
                      // for byte.
                      variant: "masthead-overlay",
                      content: {
                          badge: countdownLabel(event.dateIso, now),
                          headline: event.headline,
                          subheadline: event.subtitle,
                          primaryCta: { label: landingCopy.rsvpCtaLabel, href: `${basePath}/rsvp` },
                          media: imageMedia(event.heroImage),
                      },
                  },
            ...(invitationHero
                ? []
                : [
                      {
                          id: "invitation",
                          type: "rich-prose" as const,
                          // The card itself, set narrow: who, when, where —
                          // the engraved lines a guest photographs for their
                          // calendar.
                          variant: "narrow" as const,
                          content: {
                              kicker: `${event.host} request the pleasure of your company`,
                              title: `${event.dateLabel} · ${event.timeLabel}`,
                              paragraphs: [`${venue.name}, ${venue.role.toLowerCase()} — ${venue.address}.`],
                          },
                      },
                  ]),
            {
                id: "program",
                type: "steps",
                variant: "timeline",
                content: {
                    kicker: landingCopy.programKicker,
                    title: program.headline,
                    steps: program.items.map((item) => ({
                        title: `${item.time} — ${item.title}`,
                        description: item.description,
                    })),
                },
            },
            ...(toastImage !== null
                ? [
                      {
                          id: "toast",
                          type: "gallery" as const,
                          // One tall detail photograph as a full-width beat
                          // between the program and the fine print — the
                          // champagne tower, mid-pour.
                          variant: "sequence" as const,
                          content: {
                              items: [{ media: imageMedia(toastImage) }],
                          },
                      },
                  ]
                : []),
            ...(entertainment.items.length > 0
                ? [
                      {
                          id: "entertainment",
                          type: "card-grid" as const,
                          variant: "2up" as const,
                          content: {
                              kicker: "Entertainment",
                              title: entertainment.headline,
                              cards: entertainment.items.map((item) => ({
                                  media: imageMedia(item.image),
                                  title: item.title,
                                  body: item.body,
                              })),
                          },
                      },
                  ]
                : []),
            ...(dressCode.swatches.length > 0
                ? [
                      {
                          id: "dress-code",
                          type: "showcase" as const,
                          // The dress code as fabric chips: the room's inks.
                          variant: "swatches" as const,
                          content: {
                              kicker: "Dress code",
                              title: dressCode.headline,
                              items: dressCode.swatches.map((swatch) => ({
                                  title: swatch.name,
                                  color: swatch.color,
                                  meta: swatch.code,
                                  description: swatch.note,
                              })),
                          },
                      },
                  ]
                : []),
            ...(invitationHero ? [] : [detailsSection]),
            {
                id: "venue",
                type: "highlights",
                variant: "alternating",
                content: {
                    kicker: landingCopy.venueKicker,
                    highlights: [
                        {
                            media: imageMedia(venue.image),
                            headline: venue.name,
                            body: invitationHero
                                ? `${venue.role} · ${venue.address}. ${venue.description}`
                                : venue.description,
                            cta: { label: "Get directions", href: venue.mapUrl },
                        },
                        ...(after.title !== "" && after.image !== null
                            ? [{ media: imageMedia(after.image), headline: after.title, body: after.body }]
                            : []),
                        ...(stay.title !== "" && stay.image !== null
                            ? [
                                  {
                                      media: imageMedia(stay.image),
                                      headline: stay.title,
                                      body: stay.body,
                                      cta: { label: "Book a room", href: stay.url },
                                  },
                              ]
                            : []),
                    ],
                },
            },
            ...(invitationHero ? [detailsSection] : []),
            ...(decades.photos.length > 0
                ? [
                      {
                          id: "decades",
                          type: "gallery" as const,
                          // The photo wall from the party: prints pinned up at angles.
                          variant: "scrapbook" as const,
                          content: {
                              kicker: "Sixty years of fabulous",
                              title: decades.headline,
                              items: decades.photos.map((entry) => ({
                                  media: imageMedia(entry.image),
                                  caption: entry.caption,
                              })),
                              lightbox: true,
                          },
                      },
                  ]
                : []),
            ...(songs.requests.length > 0
                ? [
                      {
                          id: "songs",
                          type: "highlights" as const,
                          variant: "setlist" as const,
                          content: {
                              kicker: songs.intro,
                              title: songs.headline,
                              highlights: songs.requests.map((request) => ({
                                  headline: request.song,
                                  body: request.note,
                              })),
                          },
                      },
                  ]
                : []),
            {
                id: "rsvp-banner",
                type: "cta-banner",
                // The ticket variant: the ask reads as the stub a guest
                // hands the door.
                variant: "ticket",
                content: {
                    title: landingCopy.finalCtaTitle,
                    body: rsvpNudge(rsvp.replyByIso, rsvp.replyByLabel, now),
                    cta: { label: landingCopy.rsvpCtaLabel, href: `${basePath}/rsvp` },
                },
            },
        ],
    }
}

export function rsvpLanding(basePath: string, now: Date): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.gala },
        shell: shell(basePath, "/rsvp"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: rsvp.headline,
                    // The nudge recomputes per render: a live number
                    // converts better than a printed deadline.
                    subheadline: rsvpNudge(rsvp.replyByIso, rsvp.replyByLabel, now),
                },
            },
            {
                id: "rsvp-form",
                type: "lead-form",
                variant: "detail-form",
                content: {
                    kicker: "RSVP",
                    title: landingCopy.rsvpFormTitle,
                    body: rsvp.body,
                    cta: "Send the reply",
                    confirmation: rsvp.confirmation,
                    fields: rsvp.fields,
                    // Questions trail the form; the email stays plain text
                    // (selectable for whatever mail client the guest uses).
                    channels: [{ label: "Questions", value: event.email }],
                },
            },
            {
                id: "faq",
                type: "faq",
                variant: "accordion",
                content: {
                    kicker: "Asked and answered",
                    title: landingCopy.faqTitle,
                    items: rsvp.faqs,
                },
            },
        ],
    }
}
