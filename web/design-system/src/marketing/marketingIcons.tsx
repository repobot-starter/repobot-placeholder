import React from "react"

/**
 * Named icon vocabulary for manifest-driven marketing sections. The names are
 * data (they travel through repobot.project.json), so this list is
 * append-only: never rename or remove a shipped name. Drawn in the same
 * feather-style stroke language as the app shell's nav icons so marketing
 * and product read as one system.
 */
export type MarketingIconName =
    | "folder"
    | "users"
    | "chart"
    | "zap"
    | "shield"
    | "clock"
    | "layers"
    | "globe"
    | "link"
    | "bell"
    | "search"
    | "check"
    | "calendar"
    | "inbox"
    | "star"
    | "sliders"
    | "home"
    | "phone"
    | "message"
    | "stethoscope"
    | "map-pin"
    | "heart"
    | "sparkle"
    | "smile"
    | "tooth"
    | "droplet"
    | "flame"
    | "storm"
    | "spores"
    | "leaf"
    | "hanger"
    | "sprig"
    | "flower"
    | "sun"
    | "waves"
    | "moon"

const iconPaths: Record<MarketingIconName, string> = {
    folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
    chart: "M18 20V10 M12 20V4 M6 20v-6",
    zap: "M13 2 3 14h9l-1 8 10-12h-9l1-8z",
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2",
    layers: "M12 2 2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5",
    globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M2 12h20 M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
    link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
    bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0",
    search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.35-4.35",
    check: "M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01l-3-3",
    calendar: "M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M16 2v4 M8 2v4 M3 10h18",
    inbox: "M22 12h-6l-2 3h-4l-2-3H2 M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    sliders: "M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6",
    home: "M3 10.5 12 3l9 7.5 M5 9v11h14V9 M10 20v-6h4v6",
    phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
    message: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z M8 9h8 M8 13h5",
    stethoscope:
        "M5 3v6a5 5 0 0 0 10 0V3 M5 3H3 M15 3h2 M10 14v2a5 5 0 0 0 10 0v-3 M20 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    "map-pin": "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    heart: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
    sparkle:
        "M12 2c.6 4.6 2.4 7.4 8 8-5.6.6-7.4 3.4-8 8-.6-4.6-2.4-7.4-8-8 5.6-.6 7.4-3.4 8-8z M19 16c.2 1.6.9 2.5 2.5 2.8-1.6.3-2.3 1.2-2.5 2.7-.2-1.5-.9-2.4-2.5-2.7 1.6-.3 2.3-1.2 2.5-2.8z",
    smile: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M8 14s1.5 2 4 2 4-2 4-2 M9 9h.01 M15 9h.01",
    tooth: "M12 5.5C10.5 4 8.8 3 7 3 4.5 3 3 5 3 7.5c0 3 1.2 4.5 2 7 .7 2.3 1 6.5 3 6.5 1.8 0 1.8-5 4-5s2.2 5 4 5c2 0 2.3-4.2 3-6.5.8-2.5 2-4 2-7C21 5 19.5 3 17 3c-1.8 0-3.5 1-5 2.5z",
    droplet: "M12 2.7s-6 6.6-6 11.3a6 6 0 0 0 12 0c0-4.7-6-11.3-6-11.3z M9.2 15a2.9 2.9 0 0 0 2.8 2.8",
    flame: "M12 22a7 7 0 0 0 7-7c0-4-3-6.5-4-10-2 1.5-3 4-3 6-1-1-1.6-2.2-1.8-3.5C8 9.2 5 11.8 5 15a7 7 0 0 0 7 7z M12 22a3 3 0 0 1-3-3c0-2 3-4 3-4s3 2 3 4a3 3 0 0 1-3 3z",
    storm: "M7 16a5 5 0 1 1 1.1-9.9A6 6 0 0 1 19.5 8 4 4 0 0 1 18 16 M13 11l-3 5h4l-3 5",
    spores: "M7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M16.5 7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M12 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M17 19a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
    leaf: "M5 19C5 10 10 4 20 4c0 10-6 15-15 15z M5 19c3-5 7-8 11-11",
    hanger: "M12 7a2 2 0 1 1 2-2c0 1.2-2 1.6-2 3.2 M12 8.2 3 15.5a1.3 1.3 0 0 0 .8 2.3h16.4a1.3 1.3 0 0 0 .8-2.3L12 8.2",
    sprig: "M12 22V8 M12 8c0-3 2-5 5-6 0 3-2 5.5-5 6z M12 13c-3 0-5.5-2-6-5 3 0 5.5 2 6 5z M12 18c3 0 5.5-2 6-5-3 0-5.5 2-6 5z",
    flower: "M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M12 9.5c-2-2.5-1.5-6 0-7 1.5 1 2 4.5 0 7z M12 14.5c2 2.5 1.5 6 0 7-1.5-1-2-4.5 0-7z M14.5 12c2.5-2 6-1.5 7 0-1 1.5-4.5 2-7 0z M9.5 12c-2.5 2-6 1.5-7 0 1-1.5 4.5-2 7 0z",
    sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M6.34 17.66l-1.41 1.41 M19.07 4.93l-1.41 1.41",
    waves: "M2 8c2 0 2-1.5 4-1.5S8 8 10 8s2-1.5 4-1.5S16 8 18 8s2-1.5 4-1.5 M2 13c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5 M2 18c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5",
    moon: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
}

export function isMarketingIconName(value: string): value is MarketingIconName {
    return value in iconPaths
}

export interface MarketingIconProps {
    name: MarketingIconName
    size?: number
}

export function MarketingIcon({ name, size = 20 }: MarketingIconProps): React.ReactElement {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
            <path
                d={iconPaths[name]}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}
