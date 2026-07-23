/**
 * All content for the local-business site lives here: identity, menu,
 * weekly hours, and contact details. To make this template yours, replace
 * the business below — no other file needs to change.
 */
import type { DayHours } from "./hours"

export interface MenuItem {
    name: string
    description: string
    /** Price in cents so arithmetic and formatting stay exact. */
    priceCents: number
    /** Dietary marks shown as small chips: "V" vegetarian, "VG" vegan, "GF" gluten-free. */
    dietary: ("V" | "VG" | "GF")[]
    popular?: boolean
}

export interface MenuSection {
    title: string
    note?: string
    items: MenuItem[]
}

export const business = {
    name: "The Copper Kettle",
    tagline: "Neighborhood café & all-day kitchen",
    description:
        "Slow mornings, honest coffee, and a short menu we cook from scratch every day. Counter service, sunny corner windows, and the same four soups our regulars won't let us retire.",
    address: "214 Alder Street, Portland, OR 97204",
    phone: "(503) 555-0184",
    email: "hello@copperkettle.example",
    instagram: "https://instagram.com/example",
    /** Used for the "Get directions" link. */
    mapsQuery: "214 Alder Street Portland OR",
}

/** 0 = Sunday … 6 = Saturday. Minutes since midnight. */
export const weeklyHours: DayHours[] = [
    { day: 0, intervals: [[9 * 60, 14 * 60]] }, // Sun 9–2
    { day: 2, intervals: [[7 * 60, 15 * 60]] }, // Tue 7–3
    { day: 3, intervals: [[7 * 60, 15 * 60]] }, // Wed 7–3
    { day: 4, intervals: [[7 * 60, 15 * 60]] }, // Thu 7–3
    {
        day: 5,
        intervals: [
            [7 * 60, 15 * 60],
            [17 * 60, 21 * 60],
        ],
    }, // Fri 7–3, supper 5–9
    {
        day: 6,
        intervals: [
            [8 * 60, 15 * 60],
            [17 * 60, 21 * 60],
        ],
    }, // Sat 8–3, supper 5–9
    // Monday: closed (no entry).
]

export const hoursNote = "Closed Mondays. Friday & Saturday supper service 5–9 PM."

export const menu: MenuSection[] = [
    {
        title: "Breakfast",
        note: "Served till 11:30, eggs from Meadowlark Farm",
        items: [
            {
                name: "Copper Kettle breakfast",
                description: "Two eggs any style, sourdough toast, herbed potatoes, greens",
                priceCents: 1400,
                dietary: ["V"],
                popular: true,
            },
            {
                name: "Oat porridge",
                description: "Steel-cut oats, poached pear, toasted hazelnuts, maple",
                priceCents: 950,
                dietary: ["VG", "GF"],
            },
            {
                name: "Smoked trout toast",
                description: "Rye, whipped crème fraîche, pickled shallot, dill",
                priceCents: 1550,
                dietary: [],
            },
            {
                name: "Buttermilk pancakes",
                description: "Three cakes, whipped butter, warm blueberry compote",
                priceCents: 1250,
                dietary: ["V"],
                popular: true,
            },
        ],
    },
    {
        title: "Lunch",
        note: "From 11:30, soup changes daily",
        items: [
            {
                name: "Soup + half sandwich",
                description: "Today's soup with a half grilled cheese on sourdough",
                priceCents: 1300,
                dietary: ["V"],
                popular: true,
            },
            {
                name: "Roast chicken sandwich",
                description: "Garlic aioli, pickles, butter lettuce, ciabatta",
                priceCents: 1500,
                dietary: [],
            },
            {
                name: "Farro bowl",
                description: "Roasted squash, kale, feta, pepitas, lemon vinaigrette",
                priceCents: 1400,
                dietary: ["V"],
            },
            {
                name: "Kettle burger",
                description: "Smashed patty, sharp cheddar, onion jam, fries",
                priceCents: 1700,
                dietary: [],
            },
        ],
    },
    {
        title: "Drinks",
        items: [
            {
                name: "Drip coffee",
                description: "Bottomless with any plate — Heart Roasters",
                priceCents: 400,
                dietary: ["VG", "GF"],
            },
            {
                name: "Cappuccino",
                description: "Double shot, oat milk on request",
                priceCents: 550,
                dietary: ["V"],
                popular: true,
            },
            {
                name: "Chai",
                description: "House-spiced, steamed milk, lightly sweet",
                priceCents: 525,
                dietary: ["V"],
            },
            {
                name: "Fresh lemonade",
                description: "Pressed daily, mint from the planter out back",
                priceCents: 450,
                dietary: ["VG", "GF"],
            },
        ],
    },
    {
        title: "Sweets",
        note: "Baked each morning",
        items: [
            {
                name: "Cardamom bun",
                description: "Twisted, buttery, pearl sugar",
                priceCents: 525,
                dietary: ["V"],
                popular: true,
            },
            {
                name: "Olive oil cake",
                description: "Citrus glaze, whipped cream",
                priceCents: 650,
                dietary: ["V"],
            },
            {
                name: "Flourless chocolate cookie",
                description: "Crackly top, sea salt",
                priceCents: 400,
                dietary: ["V", "GF"],
            },
        ],
    },
]

/** "$14" / "$9.50" — trims trailing zero cents. */
export function formatPrice(priceCents: number): string {
    const dollars = Math.floor(priceCents / 100)
    const cents = priceCents % 100
    return cents === 0 ? `$${dollars}` : `$${dollars}.${String(cents).padStart(2, "0")}`
}

export const dietaryLabels: Record<"V" | "VG" | "GF", string> = {
    V: "Vegetarian",
    VG: "Vegan",
    GF: "Gluten-free",
}
