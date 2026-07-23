/**
 * Everything LinkBot renders lives in this file: the profile, the links, the
 * social chips, and the theme palettes. Edit it (or ask the agent to) and the
 * page updates — there is no backend and no CMS.
 */

export interface LinkProfile {
    name: string
    /** Shown under the name, e.g. "@robo". */
    handle: string
    bio: string
    /** Rendered inside the avatar ring; swap for any emoji (or initials). */
    avatarEmoji: string
    location: string
}

export interface LinkItem {
    /** Emoji badge on the left edge of the row. */
    emoji: string
    label: string
    /** One-line teaser under the label. */
    note: string
    url: string
}

export interface SocialLink {
    /** Accessible name, e.g. "GitHub". */
    label: string
    /** Tiny monogram shown in the chip, e.g. "gh". */
    monogram: string
    url: string
}

export const profile: LinkProfile = {
    name: "Robo Rivera",
    handle: "@robo",
    bio: "Creative technologist building tiny, joyful things on the internet.",
    avatarEmoji: "🤖",
    location: "Lisbon, Portugal",
}

export const links: LinkItem[] = [
    {
        emoji: "🎨",
        label: "Portfolio",
        note: "Selected projects & case studies",
        url: "https://robo.example/work",
    },
    {
        emoji: "✉️",
        label: "Weekly newsletter",
        note: "One tiny idea every Friday",
        url: "https://robo.example/letters",
    },
    {
        emoji: "🎬",
        label: "Latest video",
        note: "Building a synth in the browser",
        url: "https://robo.example/video",
    },
    {
        emoji: "🎧",
        label: "Studio playlist",
        note: "What I code to",
        url: "https://robo.example/playlist",
    },
    {
        emoji: "📅",
        label: "Book a call",
        note: "15 minutes — let's talk shop",
        url: "https://robo.example/call",
    },
    {
        emoji: "☕",
        label: "Buy me a coffee",
        note: "Fuel the next project",
        url: "https://robo.example/coffee",
    },
]

export const socials: SocialLink[] = [
    { label: "GitHub", monogram: "gh", url: "https://github.com" },
    { label: "X", monogram: "𝕏", url: "https://x.com" },
    { label: "Instagram", monogram: "ig", url: "https://instagram.com" },
    { label: "YouTube", monogram: "▶", url: "https://youtube.com" },
]

export type ThemeKey = "midnight" | "sunrise" | "meadow" | "paper"

export interface LinkTheme {
    key: ThemeKey
    label: string
    /** Full-page background (gradients welcome). */
    background: string
    /** Card + link row surfaces. */
    surface: string
    surfaceBorder: string
    text: string
    subtleText: string
    /** Avatar ring, hover borders, the active theme dot. */
    accent: string
}

/**
 * Theme presets cycled by the swatch buttons in the footer; the visitor's
 * pick persists in localStorage. Add a palette here and it appears
 * automatically.
 */
export const themes: LinkTheme[] = [
    {
        key: "midnight",
        label: "Midnight",
        background: "radial-gradient(circle at 20% 10%, #2b1a4d 0%, #120a24 55%, #0a0614 100%)",
        surface: "rgba(255, 255, 255, 0.06)",
        surfaceBorder: "rgba(255, 255, 255, 0.14)",
        text: "#f1eaff",
        subtleText: "#a898cc",
        accent: "#9d7bff",
    },
    {
        key: "sunrise",
        label: "Sunrise",
        background: "linear-gradient(160deg, #ffe8d6 0%, #ffd0b0 45%, #ffb4a2 100%)",
        surface: "rgba(255, 255, 255, 0.65)",
        surfaceBorder: "rgba(148, 82, 51, 0.25)",
        text: "#4a2513",
        subtleText: "#96604a",
        accent: "#e2711d",
    },
    {
        key: "meadow",
        label: "Meadow",
        background: "linear-gradient(165deg, #eaf7e4 0%, #cdebc9 55%, #a9d9b0 100%)",
        surface: "rgba(255, 255, 255, 0.7)",
        surfaceBorder: "rgba(47, 93, 58, 0.22)",
        text: "#1e3a26",
        subtleText: "#5b7d64",
        accent: "#2f9e57",
    },
    {
        key: "paper",
        label: "Paper",
        background: "#f5f2ec",
        surface: "#ffffff",
        surfaceBorder: "#d8d2c4",
        text: "#26221a",
        subtleText: "#7d766a",
        accent: "#26221a",
    },
]
