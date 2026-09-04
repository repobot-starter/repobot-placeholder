/**
 * The primary-care pack's single content file: the practice, the
 * providers, the services, the insurance list, the hours, the reviews,
 * the new-patient guide, and the appointment offering. Everything the
 * site renders comes from here — edit this file (not the page
 * components) to make the site yours.
 *
 * The two structured exports are contract-shaped on purpose:
 * `codePractice` and `codeAppointments` are the code fallbacks for the
 * business-content contract's `practice` and `appointments` domains
 * (web/app/src/View/Landing/practiceDocument.ts), so an owner's Manage
 * edit and this file walk the same rendering path. The appointments
 * export is booking mode 2's input: visit types x weekly availability
 * windows, projected into concrete capacity-1 slots by the same
 * derivation the platform uses (`generateAppointmentSlots`).
 *
 * DELIBERATE ARCHITECTURE — the booking surface is clinically empty.
 * Booking a visit asks for a name, contact details, a visit type, and
 * new/returning. No free-text reason, no symptoms, no health questions:
 * the platform never holds medical information. Keep every field and
 * every line of copy on that side of the line.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/care` (see PACK.md). The art direction is calm natural
 * light — soft daylight interiors and warm, unposed portraits; nothing
 * stocky, nothing fluorescent.
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
        src: `/care/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/care/${name}-${step}w.webp`, width: step })),
    }
}

export const practice = {
    name: "Alder House Family Medicine",
    tagline: "Primary care that knows your name",
    city: "Bellingham, Washington",
    address: "1204 Alder Street, Suite 210, Bellingham, WA 98225",
    phone: "(360) 555-0175",
    email: "frontdesk@alderhousefamilymed.example",
    mapsQuery: "1204 Alder Street Bellingham WA 98225",
}

/**
 * The clinic's week: Mon–Fri office hours plus a Saturday morning.
 * 0 = Sunday … 6 = Saturday; times are minutes since midnight. The home
 * hero derives its live "Open today until…" badge from these, the same
 * clock discipline as the menu pack's hours engine.
 */
export const clinicHours: PracticeHoursEntry[] = [
    { day: 1, open: 8 * 60, close: 17 * 60 },
    { day: 2, open: 8 * 60, close: 17 * 60 },
    { day: 3, open: 8 * 60, close: 17 * 60 },
    { day: 4, open: 8 * 60, close: 17 * 60 },
    { day: 5, open: 8 * 60, close: 17 * 60 },
    { day: 6, open: 9 * 60, close: 13 * 60 },
]

/** Portraits by provider id — the contract carries facts, code carries art. */
export const providerPhotos: Record<string, CareImage> = {
    "dr-mercer": photo(
        "portrait-mercer",
        1024,
        1536,
        "Dr. June Mercer in a white coat, smiling in a sunlit exam room",
    ),
    "dr-okonkwo": photo(
        "portrait-okonkwo",
        1024,
        1536,
        "Dr. Daniel Okonkwo with a stethoscope, standing by the clinic window",
    ),
    "reyes-pa": photo(
        "portrait-reyes",
        1024,
        1536,
        "Alma Reyes, PA-C, seated at a consult desk with a warm smile",
    ),
    "chen-np": photo(
        "portrait-chen",
        1024,
        1536,
        "Elliot Chen, FNP, leaning at the front desk in clinic scrubs",
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
            providerId: "dr-mercer",
            name: "Dr. June Mercer",
            credentials: "MD",
            role: "Family medicine · Founder",
            bio: "Twenty-two years of family medicine, the last eleven on Alder Street. June opened the practice around one rule: appointments start on time and end when you're done. She sees every age and keeps a soft spot for stubborn diagnoses.",
        },
        {
            providerId: "dr-okonkwo",
            name: "Dr. Daniel Okonkwo",
            credentials: "MD",
            role: "Family medicine",
            bio: "Board-certified in family medicine with a focus on chronic conditions — diabetes, blood pressure, asthma. Daniel is the provider who draws the diagram until the plan makes sense to you, not just to him.",
        },
        {
            providerId: "reyes-pa",
            name: "Alma Reyes",
            credentials: "PA-C",
            role: "Physician assistant",
            bio: "Alma runs most of the clinic's same-day schedule: ear infections, sprains, the flu that couldn't wait. Ten years of urgent-care experience, and the calmest room in the building.",
        },
        {
            providerId: "chen-np",
            name: "Elliot Chen",
            credentials: "FNP-C",
            role: "Nurse practitioner",
            bio: "Elliot leads annual physicals and preventive care, and keeps the clinic's Saturday hours. Patients describe him as the reason they finally stopped skipping their yearly visit.",
        },
    ],
    services: [
        {
            name: "Annual physicals",
            description:
                "A yearly preventive visit that doesn't feel like a formality: screenings, labs, and time for the conversation.",
        },
        {
            name: "Same-day sick visits",
            description:
                "Call before 10 AM and you'll usually be seen the same day — by a provider who can read your chart, not a stranger.",
        },
        {
            name: "Chronic condition care",
            description:
                "Diabetes, blood pressure, asthma, thyroid — steady management with one provider who tracks the whole picture.",
        },
        {
            name: "Women's health",
            description:
                "Well-woman exams, contraception counseling, and menopause care, handled in-house by your own provider.",
        },
        {
            name: "Immunizations",
            description:
                "Flu, shingles, tetanus, and travel vaccines — on the schedule or as a walk-in nurse visit.",
        },
        {
            name: "School & sports physicals",
            description:
                "Forms signed on the spot. Book a quick visit before the season starts, not the night the form is due.",
        },
        {
            name: "On-site lab draws",
            description:
                "Blood work drawn here at your visit — no second trip across town, results reviewed by your provider.",
        },
        {
            name: "Telehealth follow-ups",
            description:
                "Follow-up visits and medication check-ins by video, when the exam room adds nothing but the drive.",
        },
    ],
    insurance: [
        "Aetna",
        "Blue Cross Blue Shield",
        "Cigna",
        "UnitedHealthcare",
        "Humana",
        "Medicare",
        "Premera Blue Cross",
        "Regence",
        "Kaiser Permanente",
        "Apple Health (Medicaid)",
    ],
    locations: [
        {
            locationId: "alder-street",
            label: "Alder Street clinic",
            address: practice.address,
            phone: practice.phone,
            hours: clinicHours,
        },
    ],
    // Owner-curated: real quotes the practice chose to publish — contract
    // data, never runtime review ingestion.
    reviews: [
        {
            quote: "Dr. Mercer has looked after three generations of this family. She remembers my mother's knee and my son's asthma without opening the chart.",
            name: "Carol W.",
            detail: "Patient since 2013",
        },
        {
            quote: "Called at 8 AM with a feverish kid, saw Alma at 10:15, prescription filled by noon. That's why we stay.",
            name: "Dev P.",
            detail: "Patient since 2020",
        },
        {
            quote: "Dr. Okonkwo actually explained my A1C instead of just handing me a printout. First time a number ever made sense.",
            name: "Marisol T.",
            detail: "Patient since 2018",
        },
        {
            quote: "Booked online on a Tuesday night, physical with Elliot that Saturday. The forms took five minutes on my phone.",
            name: "Aaron K.",
            detail: "New patient, 2025",
        },
    ],
    newPatient: [
        {
            title: "Before your first visit",
            body: "Book online, then finish your intake forms from the confirmation email — about five minutes on your phone, no clipboard in the waiting room.",
        },
        {
            title: "What to bring",
            body: "A photo ID, your insurance card, and your medication list — or just the bottles. We'll copy what we need at the desk.",
        },
        {
            title: "Your first visit",
            body: "New-patient visits run 45 minutes: your history, a full exam, and a plan you helped write. Bring questions; they're the point.",
        },
        {
            title: "Records & refills",
            body: "Sign one release and we'll request your records from your previous clinic. Existing prescriptions carry over without a gap.",
        },
    ],
}

/**
 * The `appointments` content domain, code fallback — booking mode 2's
 * inputs. Visit types carry the slot length they book; each provider's
 * weekly windows are packed back-to-back into concrete capacity-1 slots
 * by `generateAppointmentSlots` (kernel and platform run the same
 * derivation, so the preview offers exactly what a deploy would).
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "new-patient",
            name: "New patient visit",
            durationMinutes: 45,
            description: "A full first visit: your history, an exam, and a plan.",
        },
        {
            typeId: "follow-up",
            name: "Follow-up visit",
            durationMinutes: 15,
            description: "A focused check-in on something we're already treating.",
        },
        {
            typeId: "annual-physical",
            name: "Annual physical",
            durationMinutes: 30,
            description: "Your yearly preventive visit — screenings, labs, and the conversation.",
        },
    ],
    providers: [
        {
            providerId: "dr-mercer",
            name: "Dr. June Mercer",
            windows: [
                { day: 1, start: 9 * 60, end: 12 * 60 },
                { day: 3, start: 9 * 60, end: 12 * 60 },
                { day: 4, start: 13 * 60, end: 16 * 60 },
            ],
        },
        {
            providerId: "dr-okonkwo",
            name: "Dr. Daniel Okonkwo",
            windows: [
                { day: 2, start: 9 * 60, end: 12 * 60 },
                { day: 4, start: 9 * 60, end: 12 * 60 },
                { day: 5, start: 13 * 60, end: 16 * 60 },
            ],
        },
        {
            providerId: "reyes-pa",
            name: "Alma Reyes, PA-C",
            windows: [
                { day: 1, start: 13 * 60, end: 16 * 60 },
                { day: 3, start: 13 * 60, end: 16 * 60 },
                { day: 5, start: 9 * 60, end: 12 * 60 },
            ],
        },
        {
            providerId: "chen-np",
            name: "Elliot Chen, FNP",
            windows: [
                { day: 2, start: 13 * 60, end: 16 * 60 },
                { day: 6, start: 9 * 60, end: 12 * 60 },
            ],
        },
    ],
}

export const home = {
    headline: "Primary care that knows your name.",
    subheadline:
        "Family medicine on Alder Street — same-day sick visits, unhurried physicals, and providers who remember your last one.",
    hero: photo(
        "hero-lobby",
        1536,
        1024,
        "The clinic's sunlit waiting room: warm wood, plants, and morning light through tall windows",
    ),
}

export const story = {
    kicker: "The practice",
    headline: "A neighborhood practice, on purpose.",
    paragraphs: [
        "Alder House keeps its patient panel small enough that your provider is your provider — the same face at your physical, your follow-up, and the Tuesday you wake up with a fever.",
        "Visits start on time because the schedule is built honestly: new patients get 45 minutes, follow-ups get what they need, and nobody is triple-booked at 4 PM.",
    ],
    image: photo(
        "story-clinic",
        1536,
        1024,
        "An exam room in soft daylight: consult chairs by the window, no desk between them",
    ),
}

export const booking = {
    headline: "Book an appointment.",
    intro: "Pick a visit type, a provider, and a time. You'll get an email confirmation with a one-click cancel link — no phone tree, no portal password.",
    // The privacy line the visitor reads beside the form. Honest by
    // design: it describes what the form collects, and claims nothing
    // beyond it (never write compliance claims into template copy).
    privacyNote:
        "Booking asks for your name, contact details, and visit type — nothing about your health. Anything clinical waits for the exam room, where it belongs.",
}
