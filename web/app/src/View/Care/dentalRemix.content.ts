/**
 * The care-dental remix's content seed (packs/README.md "Derived
 * templates"): a modern dental practice worn over the care pack. At
 * compose time this file is copied byte-for-byte over
 * `View/Care/content.ts`, so it must remain a STRUCTURAL TWIN of that
 * module — the same export surface, the same shapes, the contract's
 * minimums met (tests/View/Care/dentalRemixSeed.test.ts pins the twin).
 *
 * The trade: Waverly Dental, a three-chair dental practice in Madison,
 * Wisconsin — the care family's third remix, deliberately apart from
 * the therapy remix's couples-and-families warmth and the psychology
 * remix's scholarly evidence voice. This practice is clinical-but-warm:
 * dentistry that names its prices before the chair reclines, a comfort
 * menu for nervous patients written without condescension, and
 * dental-specific booking — new-patient exams, cleanings, same-day
 * emergency visits, and free cosmetic consults — projected from each
 * provider's actual week. The booking surface stays clinically empty:
 * name, contact, visit type. What's wrong with the tooth is a
 * conversation for the chair, not a form field.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/care-dental` (see PACK.md). The art direction is warm
 * boutique clinic — pale oak, sage upholstery, soft daylight, unposed
 * portraits; nothing fluorescent, nothing stocky.
 */
import type { AppointmentsContent, PracticeContent, PracticeHoursEntry } from "../Landing/practiceDocument"

export interface CareImage {
    src: string
    alt: string
    width: number
    height: number
    srcSet: { src: string; width: number }[]
}

/** The width ladder `npm run image -- responsive` emits by default. */
const LADDER = [640, 1024, 1600, 2400]

/** A responsive-verb image entry from its name and intrinsic size. */
function photo(name: string, width: number, height: number, alt: string): CareImage {
    const widths = [...new Set(LADDER.map((step) => Math.min(step, width)))]
    return {
        src: `/care-dental/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/care-dental/${name}-${step}w.webp`, width: step })),
    }
}

export const practice = {
    name: "Waverly Dental",
    tagline: "Modern dentistry, without the dread",
    city: "Madison, Wisconsin",
    address: "744 Waverly Court, Suite 120, Madison, WI 53703",
    phone: "(608) 555-0142",
    email: "hello@waverlydental.example",
    mapsQuery: "744 Waverly Court Madison WI 53703",
}

/**
 * The practice's week: early mornings on purpose — a 7 AM cleaning fits
 * before work, which is when most people actually keep them — and a
 * short Friday. 0 = Sunday … 6 = Saturday; times are minutes since
 * midnight. The home hero derives its live "Open today until…" badge
 * from these.
 */
export const clinicHours: PracticeHoursEntry[] = [
    { day: 1, open: 7 * 60, close: 17 * 60 },
    { day: 2, open: 7 * 60, close: 17 * 60 },
    { day: 3, open: 7 * 60, close: 17 * 60 },
    { day: 4, open: 7 * 60, close: 17 * 60 },
    { day: 5, open: 7 * 60, close: 13 * 60 },
]

/** Portraits by provider id — the contract carries facts, code carries art. */
export const providerPhotos: Record<string, CareImage> = {
    "dr-nakamura": photo(
        "portrait-nakamura",
        864,
        1152,
        "Dr. Mei Nakamura in a white clinical coat over a sage scrub top, warm daylight in the studio behind her",
    ),
    "dr-ellison": photo(
        "portrait-ellison",
        864,
        1152,
        "Dr. Andre Ellison in slate-blue scrubs beside an operatory window, relaxed and open",
    ),
    "fuentes-rdh": photo(
        "portrait-fuentes",
        864,
        1152,
        "Sofia Fuentes, the practice's lead hygienist, in terracotta scrubs on a stool in a bright treatment room",
    ),
}

/**
 * The `practice` content domain, code fallback. Section by section this
 * is what the Manage practice editor writes into repobot.content.json —
 * the site renders identically from either source.
 */
export const codePractice: PracticeContent = {
    providers: [
        {
            providerId: "dr-nakamura",
            name: "Dr. Mei Nakamura",
            credentials: "DDS",
            role: "Restorative & cosmetic dentistry · Founder",
            bio: "Eighteen years of restorative work, the last nine on Waverly Court. Mei opened the practice on one rule: you hear the price and the plan before the chair reclines. She keeps the trickiest crown and veneer cases for herself and photographs her margins because she's proud of them.",
        },
        {
            providerId: "dr-ellison",
            name: "Dr. Andre Ellison",
            credentials: "DMD",
            role: "General & family dentistry",
            bio: "Andre sees every age and specializes in the patients who announce they hate the dentist. His answer is the same every time: numb slowly, narrate everything, and stop the moment a hand goes up. Most of his once-nervous patients now book cleanings without a reminder call.",
        },
        {
            providerId: "fuentes-rdh",
            name: "Sofia Fuentes",
            credentials: "RDH",
            role: "Lead dental hygienist",
            bio: "Twelve years of hygiene and the gentlest scaler in Dane County. Sofia runs the practice's cleaning schedule and its periodontal program — and she'll tell you honestly whether you need to floss more or just needed a better cleaning technique all along.",
        },
    ],
    services: [
        {
            name: "Cleanings & prevention",
            description:
                "Unhurried hygiene visits with honest coaching — the goal is fewer fillings, not more appointments.",
        },
        {
            name: "White fillings",
            description:
                "Tooth-colored composite matched to your enamel, placed under proper isolation so it lasts.",
        },
        {
            name: "Crowns & bridges",
            description:
                "Digitally scanned — no goopy impressions — with a written price before any tooth is prepared.",
        },
        {
            name: "Clear aligners",
            description:
                "Straighter teeth without brackets: a scan, a plan you approve, and check-ins that respect your schedule.",
        },
        {
            name: "Whitening",
            description:
                "Professional whitening with custom trays — real results, honest expectations, no drugstore roulette.",
        },
        {
            name: "Implant restoration",
            description:
                "Crowns and bridges on implants, coordinated with a local surgeon we'd send our own families to.",
        },
        {
            name: "Same-day emergencies",
            description:
                "A broken tooth or a toothache that won't wait — call before noon and we'll see you today.",
        },
        {
            name: "Comfort dentistry",
            description:
                "Nitrous, noise-cancelling headphones, hand-signal stops, and a pace you control. Fear is a reason to come here, not to stay away.",
        },
    ],
    insurance: [
        "Delta Dental of Wisconsin",
        "Cigna Dental",
        "MetLife Dental",
        "Guardian",
        "Aetna Dental",
        "UnitedHealthcare Dental",
        "Anthem Blue Cross Blue Shield",
        "Principal",
    ],
    locations: [
        {
            locationId: "waverly-court",
            label: "Waverly Court studio",
            address: "744 Waverly Court, Suite 120, Madison, WI 53703",
            phone: "(608) 555-0142",
            hours: [
                { day: 1, open: 7 * 60, close: 17 * 60 },
                { day: 2, open: 7 * 60, close: 17 * 60 },
                { day: 3, open: 7 * 60, close: 17 * 60 },
                { day: 4, open: 7 * 60, close: 17 * 60 },
                { day: 5, open: 7 * 60, close: 13 * 60 },
            ],
        },
    ],
    // Owner-curated: patient words shared with written consent — contract
    // data, never runtime review ingestion.
    reviews: [
        {
            quote: "I avoided dentists for nine years. Dr. Ellison talked me through every step, stopped twice when I raised my hand, and I walked out embarrassed only that I'd waited so long. I've kept every cleaning since.",
            name: "K. R.",
            detail: "Patient since 2024, shared with consent",
        },
        {
            quote: "A crown somewhere else was going to be a mystery number on a bill later. Here it was a printed price before Dr. Nakamura touched the tooth — and the crown matches so well I can't find it in the mirror.",
            name: "J. M.",
            detail: "Restorative patient, shared with consent",
        },
        {
            quote: "Cracked a molar on a Sunday popcorn kernel, called Monday at 7:05, sat down at 10:30. Sofia checked on me by text that evening. That's the whole review.",
            name: "T. B.",
            detail: "Emergency visit, shared with consent",
        },
    ],
    // The care pack's new-patient guide, worn here as the honest answers
    // a dental practice owes people — money first, because that's the
    // question everyone actually has.
    newPatient: [
        {
            title: "What will it cost?",
            body: "We're in network with the plans above and we quote every treatment in writing before it starts — including the insurance estimate and your share. No insurance? Our membership plan covers two cleanings, exams, and x-rays for a flat yearly fee, and larger treatment can be split into monthly payments. Nobody learns a price from a bill here.",
        },
        {
            title: "Your first visit",
            body: "New-patient exams run a full hour: digital x-rays, a gum health check, time with the dentist, and a written plan with prices — most visits include your cleaning too. You leave knowing exactly where your mouth stands and what, if anything, comes next.",
        },
        {
            title: "Nervous? Say so.",
            body: "Tell us when you book — it changes how we schedule you, not how welcome you are. Longer appointment, slower numbing, nitrous if you want it, headphones if you'd rather not hear a thing, and a hand signal that stops everything instantly. Every step is narrated before it happens.",
        },
        {
            title: "Emergencies",
            body: "A broken tooth, a lost crown, or a toothache that kept you up: call before noon and we'll see you the same day, usually within a couple of hours. We'll get you out of pain first and talk about the long-term fix once you can think straight again.",
        },
    ],
}

/**
 * The `appointments` content domain, code fallback — booking mode 2's
 * inputs. Appointment types carry the slot length they book; each
 * provider's weekly windows are packed back-to-back into concrete
 * capacity-1 slots by `generateAppointmentSlots` (kernel and platform run
 * the same derivation, so the preview offers exactly what a deploy
 * would).
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "new-patient-exam",
            name: "New patient exam",
            durationMinutes: 60,
            description:
                "A full first hour: digital x-rays, a gum check, and a written plan with prices — usually your cleaning too.",
        },
        {
            typeId: "cleaning-checkup",
            name: "Cleaning & check-up",
            durationMinutes: 45,
            description:
                "Your regular hygiene visit with Sofia, plus a check from the dentist — in and out in 45 minutes.",
        },
        {
            typeId: "emergency-visit",
            name: "Same-day emergency",
            durationMinutes: 30,
            description:
                "Pain, a break, or a lost crown — we get you comfortable first and plan the fix second.",
        },
        {
            typeId: "cosmetic-consult",
            name: "Cosmetic & aligner consult",
            durationMinutes: 30,
            description:
                "A free conversation about whitening, veneers, or clear aligners — options and honest prices, no commitment.",
        },
    ],
    providers: [
        {
            providerId: "dr-nakamura",
            name: "Dr. Mei Nakamura",
            windows: [
                { day: 1, start: 8 * 60, end: 14 * 60 },
                { day: 3, start: 8 * 60, end: 14 * 60 },
                { day: 4, start: 10 * 60, end: 16 * 60 },
            ],
        },
        {
            providerId: "dr-ellison",
            name: "Dr. Andre Ellison",
            windows: [
                { day: 2, start: 8 * 60, end: 16 * 60 },
                { day: 4, start: 7 * 60, end: 13 * 60 },
                { day: 5, start: 7 * 60, end: 12 * 60 },
            ],
        },
        {
            providerId: "fuentes-rdh",
            name: "Sofia Fuentes, RDH",
            windows: [
                { day: 1, start: 7 * 60, end: 13 * 60 },
                { day: 2, start: 7 * 60, end: 13 * 60 },
                { day: 3, start: 11 * 60, end: 17 * 60 },
            ],
        },
    ],
}

/**
 * Landing copy the practice's discipline owns: the strings the landing
 * modules and shell render that would read wrong for a different kind of
 * practice. This seed retrades them for a dental practice — everything
 * else in the landing modules is practice-neutral on purpose.
 */
export const landingCopy = {
    /** The shell's nav labels for the pack's canonical trio of pages. */
    nav: { providers: "Our team", services: "Services", newPatients: "New patients" },
    /** The booking ask — the shell CTA and every page's primary CTA. */
    bookCtaLabel: "Book a visit",
    home: {
        secondaryCtaLabel: "Meet the team",
        servicesKicker: "What we do",
        servicesHeading: "From cleanings to the crown you can't find in the mirror",
        providersKicker: "Your dentists",
        providersHeading: "Three people who narrate every step",
        reviewsKicker: "From our patients",
        bannerTitle: "Nine years of avoidance ends in one hour.",
    },
    /** The insurance strip's kicker, shared by home, services, new patients. */
    insuranceKicker: "In network with most dental plans",
    /** The visit panel's headline — it names the practice's own street. */
    visitHeadline: "On Waverly Court, with free parking at the door.",
    providersPage: {
        headline: "The team.",
        subheadline:
            "Two dentists and a lead hygienist who work from one chart and one rule: you hear the plan and the price before anything touches a tooth.",
    },
    servicesPage: {
        headline: "What we do.",
        subheadline:
            "Prevention first, honest restorative work when it's needed, and cosmetic dentistry that starts with a free conversation — with written prices at every step.",
        bannerTitle: "Every treatment quoted in writing, before it starts.",
    },
    newPatientsPage: {
        headline: "The honest version of your first visit.",
        subheadline:
            "What it costs, what happens in the chair, what to say if you're nervous, and what to do when a tooth breaks — answered the way we'd want them answered.",
        kicker: "Common questions",
        bannerTitle: "Nervous patients are our specialty, not our exception.",
    },
    bookPage: {
        steps: [
            {
                title: "Pick a visit type",
                description:
                    "A new-patient exam, a cleaning, a same-day emergency, or a free cosmetic consult — the length is built in.",
            },
            {
                title: "Choose a provider and time",
                description:
                    "Real openings from each provider's actual week, up to four weeks out — including 7 AM slots.",
            },
            {
                title: "Confirm by email",
                description: "Your confirmation carries a one-click cancel link. No portal, no password.",
            },
        ],
    },
}

export const home = {
    headline: "Dentistry you don't have to brace for.",
    subheadline:
        "A modern dental practice on Waverly Court — unhurried cleanings, written prices before treatment, same-day emergency visits, and a comfort menu for everyone who's been putting this off.",
    hero: photo(
        "hero-studio",
        1152,
        864,
        "The practice's waiting room: sage-green armchairs and an olive tree beside a pale oak reception desk in soft morning light",
    ),
}

export const story = {
    kicker: "Our approach",
    headline: "The price comes before the drill. Always.",
    paragraphs: [
        "Waverly Dental runs on two habits most practices skip: every treatment is quoted in writing before it starts, and every step in the chair is narrated before it happens. The first habit is why our patients never dread the bill; the second is why so many of them arrived here calling themselves dental cowards and stopped needing the label.",
        "We'd rather prevent than restore — unhurried hygiene visits, honest coaching, and x-rays only on the schedule your mouth actually needs. When restorative work is the right call, it's done once, done well, and matched so closely you'll lose track of which tooth it was.",
    ],
    image: photo(
        "story-operatory",
        1152,
        864,
        "A bright operatory: a cream dental chair facing a large window with a linen shade, pale oak cabinetry and a green plant",
    ),
}

export const booking = {
    headline: "Book a visit.",
    intro: "Pick a visit type, a provider, and a time — including 7 AM slots that fit before work. You'll get an email confirmation with a one-click cancel link. No phone tree, no portal password.",
    // The privacy line the visitor reads beside the form. Honest by
    // design: it describes what the form collects, and claims nothing
    // beyond it (never write compliance claims into template copy).
    privacyNote:
        "Booking asks for your name, contact details, and visit type — nothing about your teeth. What's going on in your mouth is a conversation for the chair, and that's where it stays.",
}
