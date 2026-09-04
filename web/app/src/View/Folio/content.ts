/**
 * Everything the Folio portfolio renders lives in this file: the profile,
 * the projects, the skills, and the contact details. Edit it (or ask the
 * agent to) and the portfolio updates — there is no backend and no CMS.
 */

export interface FolioProfile {
    name: string
    /** One-line role shown under the name, e.g. "Product designer". */
    role: string
    /** The hero statement — one bold sentence about what you do. */
    statement: string
    /** Shown as a pulsing badge; empty string hides it. */
    availability: string
    location: string
    email: string
}

export interface Project {
    title: string
    year: string
    description: string
    /** Filter chips derive from the union of all project tags. */
    tags: string[]
    /** Native card artwork: an emoji on an accent-tinted panel (the web grid stays type-only). */
    emoji: string
    /** Accent tint behind the emoji in the native apps (a hex color). */
    accent: string
    url: string
}

export interface SocialLink {
    label: string
    url: string
}

export const profile: FolioProfile = {
    name: "Mina Okafor",
    role: "Product designer who codes",
    statement: "I design and build interfaces that feel obvious in hindsight.",
    availability: "Open to freelance projects",
    location: "Toronto, Canada",
    email: "mina@example.com",
}

export const projects: Project[] = [
    {
        title: "Tidepool",
        year: "2026",
        description:
            "A calm budgeting app that rounds every balance to feelings, not cents. Led design and shipped the React front end.",
        tags: ["Product", "Mobile"],
        emoji: "🌊",
        accent: "#cfe3f7", // theme-exempt: native card tint (web grid is type-only)
        url: "https://mina.example/tidepool",
    },
    {
        title: "Letterloop",
        year: "2025",
        description:
            "A group-newsletter tool for families. Designed the prompt system that gets grandparents to actually write back.",
        tags: ["Product", "Brand"],
        emoji: "💌",
        accent: "#f7d9cf", // theme-exempt: native card tint (web grid is type-only)
        url: "https://mina.example/letterloop",
    },
    {
        title: "Wayfare",
        year: "2025",
        description:
            "Design system for a travel startup: 84 components, dark mode, and docs the engineers actually read.",
        tags: ["Design systems"],
        emoji: "🧭",
        accent: "#d9f0d5", // theme-exempt: native card tint (web grid is type-only)
        url: "https://mina.example/wayfare",
    },
    {
        title: "Perch",
        year: "2024",
        description:
            "A tiny window-seat reservation app for a café chain. Two weeks from sketch to launch; tripled weekday bookings.",
        tags: ["Product", "Mobile"],
        emoji: "🪑",
        accent: "#f2e4c9", // theme-exempt: native card tint (web grid is type-only)
        url: "https://mina.example/perch",
    },
    {
        title: "Field Notes for Figma",
        year: "2024",
        description:
            "A plugin that turns annotation chaos into a tidy handoff doc. 12k installs and a lifetime supply of thank-you DMs.",
        tags: ["Tools"],
        emoji: "🗒️",
        accent: "#e3d7f4", // theme-exempt: native card tint (web grid is type-only)
        url: "https://mina.example/field-notes",
    },
    {
        title: "The Long Way",
        year: "2023",
        description:
            "A personal essay series on slow software, hand-illustrated. Featured in three design newsletters I admire.",
        tags: ["Writing", "Brand"],
        emoji: "🚲",
        accent: "#f6d3e0", // theme-exempt: native card tint (web grid is type-only)
        url: "https://mina.example/long-way",
    },
]

/** The about section: a short story plus a skills cloud. */
export const about = {
    paragraphs: [
        "I spent five years at agencies making things look right, then five more at startups learning why they break. Now I sit in the middle: close enough to the pixels to care, close enough to the code to ship.",
        "When I'm not working I'm restoring a 1978 road bike, learning Yoruba, and losing gracefully at chess.",
    ],
    skills: [
        "Product design",
        "Design systems",
        "Prototyping",
        "React & TypeScript",
        "SwiftUI",
        "Illustration",
        "Design ops",
        "Workshop facilitation",
    ],
}

// Bare platform homepages render as plain text (folioLanding links a
// channel only when the URL has a profile path) — replace with your real
// profile URLs, e.g. "https://github.com/yourhandle", to make them live.
export const socials: SocialLink[] = [
    { label: "GitHub", url: "https://github.com" },
    { label: "Dribbble", url: "https://dribbble.com" },
    { label: "LinkedIn", url: "https://linkedin.com" },
]

/** Union of all project tags, in first-appearance order — the filter chips. */
export function allTags(list: Project[] = projects): string[] {
    const seen: string[] = []
    for (const project of list) {
        for (const tag of project.tags) {
            if (!seen.includes(tag)) {
                seen.push(tag)
            }
        }
    }
    return seen
}
