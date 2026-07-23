/**
 * All content for the pastry-machine site lives here. To make this template
 * yours, replace the brand, lineups, and machines below — the freshness
 * engine and the UI adapt to whatever you define. Prices are in cents;
 * times are minutes since midnight (7 * 60 = 7:00 AM).
 */

import type { MachineSchedule } from "./freshness"

export interface Pastry {
    name: string
    emoji: string
    description: string
    /** Price in cents so arithmetic and formatting stay exact. */
    priceCents: number
}

/** One day's case. The lineup rotates daily through this list. */
export interface Lineup {
    title: string
    pastries: Pastry[]
}

export interface Machine {
    name: string
    /** Where to actually find it, written like you'd text a friend. */
    spot: string
    note?: string
    schedule: MachineSchedule
}

export const brand = {
    name: "The Sugar Bin",
    tagline: "Fresh pastries from a little pink machine.",
    story:
        "Every morning before dawn, our bakers fill each Sugar Bin with pastries made that night — " +
        "no day-olds, no freezer, no apologies. When a machine sells out, it sells out. " +
        "Whatever's left at closing goes to the neighborhood shelter, and we start again tomorrow.",
}

export const howItWorks = [
    {
        emoji: "🌙",
        title: "Baked overnight",
        text: "Our kitchen starts at midnight so everything in the bin was made hours ago, not days.",
    },
    {
        emoji: "🚲",
        title: "Stocked at 7 sharp",
        text: "Riders fill every machine each morning. The case you see is the whole batch.",
    },
    {
        emoji: "🧁",
        title: "Tap, grab, go",
        text: "Tap your card, the door pops, breakfast is handled. No app, no account, no line.",
    },
]

/** The case rotates through these lineups, one per day. */
export const lineups: Lineup[] = [
    {
        title: "The classics case",
        pastries: [
            {
                name: "Butter croissant",
                emoji: "🥐",
                description: "Twenty-seven layers, rolled at midnight, still whispering.",
                priceCents: 450,
            },
            {
                name: "Morning bun",
                emoji: "🌀",
                description: "Croissant dough, cinnamon sugar, candied orange peel.",
                priceCents: 500,
            },
            {
                name: "Chocolate chunk cookie",
                emoji: "🍪",
                description: "Sea salt on top, still soft in the middle at 7 AM.",
                priceCents: 375,
            },
            {
                name: "Strawberry cream puff",
                emoji: "🍓",
                description: "Choux, vanilla bean cream, berries from the Saturday market.",
                priceCents: 550,
            },
        ],
    },
    {
        title: "The cozy case",
        pastries: [
            {
                name: "Pain au chocolat",
                emoji: "🍫",
                description: "Two batons of dark chocolate, zero restraint.",
                priceCents: 495,
            },
            {
                name: "Maple pecan twist",
                emoji: "🍁",
                description: "Laminated dough, toasted pecans, real maple glaze.",
                priceCents: 525,
            },
            {
                name: "Lemon poppyseed loaf",
                emoji: "🍋",
                description: "A thick slice, tart glaze, cheerful attitude.",
                priceCents: 425,
            },
            {
                name: "Hazelnut brownie",
                emoji: "🌰",
                description: "Fudgy center, crackly top, roasted hazelnuts throughout.",
                priceCents: 450,
            },
        ],
    },
    {
        title: "The weekend case",
        pastries: [
            {
                name: "Cardamom knot",
                emoji: "🪢",
                description: "Swedish-style, pearl sugar, best eaten warm from the bin.",
                priceCents: 525,
            },
            {
                name: "Raspberry danish",
                emoji: "🫐",
                description: "Cream cheese, whole raspberries, a very flaky situation.",
                priceCents: 550,
            },
            {
                name: "Ham & gruyère roll",
                emoji: "🥨",
                description: "The savory one — croissant dough, dijon, proper cheese.",
                priceCents: 650,
            },
            {
                name: "Cinnamon roll",
                emoji: "🥮",
                description: "Cream cheese frosting applied without fear.",
                priceCents: 500,
            },
        ],
    },
]

export const machines: Machine[] = [
    {
        name: "Pioneer Square",
        spot: "SW 6th & Morrison, by the fountain",
        note: "Our first machine — she's the pink one you can see from the MAX.",
        schedule: {
            stockedDays: [0, 1, 2, 3, 4, 5, 6],
            restockMinute: 7 * 60,
            selloutMinute: 13 * 60,
        },
    },
    {
        name: "PDX Airport",
        spot: "Concourse C, across from gate C7",
        note: "Restocked twice on holiday weekends.",
        schedule: {
            stockedDays: [0, 1, 2, 3, 4, 5, 6],
            restockMinute: 6 * 60,
            selloutMinute: 15 * 60,
        },
    },
    {
        name: "Tech Row",
        spot: "NW 13th & Irving, lobby of the Brewery Blocks",
        note: "Weekdays only — she rests when you do.",
        schedule: {
            stockedDays: [1, 2, 3, 4, 5],
            restockMinute: 7 * 60,
            selloutMinute: 11 * 60,
        },
    },
    {
        name: "Riverfront Market",
        spot: "Waterfront Park, north entrance",
        note: "Weekends only, next to the flower cart.",
        schedule: {
            stockedDays: [0, 6],
            restockMinute: 8 * 60,
            selloutMinute: 14 * 60,
        },
    },
]

export const contact = {
    email: "hello@sugarbin.example",
    instagram: "https://instagram.com/example",
    /** The B2B pitch under the machine list. */
    hostPitch: "Want a Sugar Bin in your lobby, campus, or terminal?",
    donationNote: "Unsold pastries are donated to Blanchet House every evening.",
}
