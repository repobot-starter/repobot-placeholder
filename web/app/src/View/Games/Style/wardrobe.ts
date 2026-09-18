// StyleBot wardrobe: pure data + scoring rules. This file is the star of the
// template — add items, themes, or tweak the scoring constants here and the
// whole game picks them up. No imports, no side effects.

/** One of the five outfit slots on the model, top to bottom. */
export type SlotId = "hat" | "top" | "bottom" | "shoes" | "accessory"

export interface WardrobeItem {
    id: string
    name: string
    emoji: string
    /** Themes whose tags overlap these count the item as on-theme. */
    tags: string[]
}

export interface WardrobeSlot {
    id: SlotId
    label: string
    icon: string
    items: WardrobeItem[]
}

export interface Theme {
    name: string
    emoji: string
    /** An item matches the theme when it shares at least one tag. */
    tags: string[]
    /** Judge one-liners, picked at random for the verdict card. */
    verdicts: string[]
}

/** What the model is currently wearing; null means the slot is empty. */
export type Outfit = Record<SlotId, WardrobeItem | null>

// ---------------------------------------------------------------------------
// Tunables — remix away!
// ---------------------------------------------------------------------------

/** Seconds on the clock each round. */
export const ROUND_SECONDS = 40
/** Rounds in one season. */
export const ROUNDS_PER_SEASON = 3
/** Points per item that matches the theme. */
export const MATCH_POINTS = 20
/** Bonus when every single item matches the theme. */
export const FULL_MATCH_BONUS = 20
/** Small bonus just for filling all five slots — effort counts. */
export const COMPLETE_OUTFIT_BONUS = 10
/** Highest score a single round can earn. */
export const MAX_ROUND_SCORE = MATCH_POINTS * 5 + FULL_MATCH_BONUS + COMPLETE_OUTFIT_BONUS
/** localStorage key for the best season score. */
export const BEST_SCORE_KEY = "style.bestScore"

// ---------------------------------------------------------------------------
// The closet
// ---------------------------------------------------------------------------

export const SLOTS: WardrobeSlot[] = [
    {
        id: "hat",
        label: "Hats",
        icon: "🎩",
        items: [
            { id: "top-hat", name: "Top Hat", emoji: "🎩", tags: ["gala", "concert"] },
            { id: "sun-hat", name: "Sun Hat", emoji: "👒", tags: ["beach", "safari"] },
            { id: "ball-cap", name: "Ball Cap", emoji: "🧢", tags: ["sport", "school"] },
            { id: "trek-helmet", name: "Trek Helmet", emoji: "⛑️", tags: ["safari", "rain"] },
            { id: "crown", name: "Crown", emoji: "👑", tags: ["gala"] },
            { id: "grad-cap", name: "Grad Cap", emoji: "🎓", tags: ["school"] },
            { id: "hair-bow", name: "Hair Bow", emoji: "🎀", tags: ["pajama", "school", "gala"] },
            { id: "earmuff-phones", name: "Earmuff Phones", emoji: "🎧", tags: ["snow", "concert"] },
        ],
    },
    {
        id: "top",
        label: "Tops",
        icon: "👗",
        items: [
            { id: "ball-gown", name: "Ball Gown", emoji: "👗", tags: ["gala"] },
            { id: "band-tee", name: "Band Tee", emoji: "👕", tags: ["concert", "school", "beach"] },
            { id: "puffer-coat", name: "Puffer Coat", emoji: "🧥", tags: ["snow", "rain"] },
            { id: "safari-vest", name: "Safari Vest", emoji: "🦺", tags: ["safari"] },
            { id: "silk-robe", name: "Silk Robe", emoji: "👘", tags: ["pajama", "gala"] },
            { id: "martial-gi", name: "Martial Gi", emoji: "🥋", tags: ["sport"] },
            { id: "track-jersey", name: "Track Jersey", emoji: "🎽", tags: ["sport", "beach"] },
            { id: "smart-shirt", name: "Smart Shirt", emoji: "👔", tags: ["school", "gala"] },
        ],
    },
    {
        id: "bottom",
        label: "Bottoms",
        icon: "👖",
        items: [
            { id: "blue-jeans", name: "Blue Jeans", emoji: "👖", tags: ["school", "concert", "safari"] },
            { id: "board-shorts", name: "Board Shorts", emoji: "🩳", tags: ["beach", "sport"] },
            { id: "swimsuit", name: "Swimsuit", emoji: "🩱", tags: ["beach"] },
            { id: "silk-skirt", name: "Silk Skirt", emoji: "🥻", tags: ["gala"] },
            { id: "ski-pants", name: "Ski Pants", emoji: "🎿", tags: ["snow"] },
            { id: "sprint-shorts", name: "Sprint Shorts", emoji: "🩲", tags: ["sport"] },
            { id: "flannel-pjs", name: "Flannel PJs", emoji: "💤", tags: ["pajama"] },
        ],
    },
    {
        id: "shoes",
        label: "Shoes",
        icon: "👠",
        items: [
            { id: "heels", name: "Heels", emoji: "👠", tags: ["gala"] },
            { id: "sneakers", name: "Sneakers", emoji: "👟", tags: ["sport", "school", "concert"] },
            { id: "hiking-boots", name: "Hiking Boots", emoji: "🥾", tags: ["safari", "rain"] },
            { id: "flip-flops", name: "Flip-Flops", emoji: "🩴", tags: ["beach", "pajama"] },
            { id: "tall-boots", name: "Tall Boots", emoji: "👢", tags: ["rain", "concert"] },
            { id: "ice-skates", name: "Ice Skates", emoji: "⛸️", tags: ["snow"] },
            { id: "fuzzy-socks", name: "Fuzzy Socks", emoji: "🧦", tags: ["pajama"] },
            { id: "ballet-flats", name: "Ballet Flats", emoji: "🩰", tags: ["gala", "school"] },
        ],
    },
    {
        id: "accessory",
        label: "Extras",
        icon: "👜",
        items: [
            { id: "handbag", name: "Handbag", emoji: "👜", tags: ["gala", "school"] },
            { id: "sunglasses", name: "Sunglasses", emoji: "🕶️", tags: ["beach", "sport", "concert"] },
            { id: "scarf", name: "Scarf", emoji: "🧣", tags: ["snow"] },
            { id: "umbrella", name: "Umbrella", emoji: "🌂", tags: ["rain"] },
            { id: "diamond-ring", name: "Diamond Ring", emoji: "💍", tags: ["gala"] },
            { id: "guitar", name: "Guitar", emoji: "🎸", tags: ["concert"] },
            { id: "teddy-bear", name: "Teddy Bear", emoji: "🧸", tags: ["pajama"] },
            { id: "camera", name: "Camera", emoji: "📷", tags: ["safari", "beach"] },
        ],
    },
]

// ---------------------------------------------------------------------------
// The themes
// ---------------------------------------------------------------------------

export const THEMES: Theme[] = [
    {
        name: "Beach Day",
        emoji: "🏖️",
        tags: ["beach"],
        verdicts: ["Sun-kissed and camera-ready!", "The sand called — it wants your autograph."],
    },
    {
        name: "Gala Night",
        emoji: "💃",
        tags: ["gala"],
        verdicts: ["Red carpet? More like rolled out just for you.", "The chandeliers are jealous."],
    },
    {
        name: "Snow Trip",
        emoji: "❄️",
        tags: ["snow"],
        verdicts: ["Frostbite could never touch this fit.", "Cooler than the slopes themselves."],
    },
    {
        name: "Sport Star",
        emoji: "🏆",
        tags: ["sport"],
        verdicts: ["Gold medal in looking fast.", "The scoreboard just gave you extra points."],
    },
    {
        name: "Rainy School Run",
        emoji: "🌧️",
        tags: ["rain", "school"],
        verdicts: ["Puddle-proof AND homework-proof.", "Even the rain stopped to stare."],
    },
    {
        name: "Rock Concert",
        emoji: "🎸",
        tags: ["concert"],
        verdicts: [
            "Front row hearts you. Backstage wants you.",
            "That outfit shreds harder than the encore.",
        ],
    },
    {
        name: "Safari Adventure",
        emoji: "🦁",
        tags: ["safari"],
        verdicts: ["The lions are taking style notes.", "Built for the bush, dressed for the cover shoot."],
    },
    {
        name: "Pajama Party",
        emoji: "🌙",
        tags: ["pajama"],
        verdicts: ["Certified coziest look in the sleepover.", "Dream-sequence levels of comfy glamour."],
    },
]

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

export interface RoundScore {
    /** How many of the five worn items match the theme. */
    matches: number
    /** All five slots filled? */
    complete: boolean
    /** All five slots filled AND every item on-theme? */
    fullMatch: boolean
    total: number
    /** 0-5 stars for the verdict card. */
    stars: number
}

/** True when the item shares at least one tag with the theme. */
export function itemMatchesTheme(item: WardrobeItem, theme: Theme): boolean {
    return item.tags.some((tag) => theme.tags.includes(tag))
}

/** Applies the scoring rules above to a finished outfit. */
export function scoreOutfit(outfit: Outfit, theme: Theme): RoundScore {
    const worn = SLOTS.map((slot) => outfit[slot.id]).filter((item) => item !== null)
    const matches = worn.filter((item) => itemMatchesTheme(item, theme)).length
    const complete = worn.length === SLOTS.length
    const fullMatch = complete && matches === SLOTS.length
    const total =
        matches * MATCH_POINTS + (fullMatch ? FULL_MATCH_BONUS : 0) + (complete ? COMPLETE_OUTFIT_BONUS : 0)
    return {
        matches,
        complete,
        fullMatch,
        total,
        stars: Math.round((total / MAX_ROUND_SCORE) * 5),
    }
}

/** An outfit with every slot empty. */
export function emptyOutfit(): Outfit {
    return { hat: null, top: null, bottom: null, shoes: null, accessory: null }
}

/** A random item in every slot — the shuffle button. */
export function randomOutfit(): Outfit {
    const outfit = emptyOutfit()
    for (const slot of SLOTS) {
        outfit[slot.id] = slot.items[Math.floor(Math.random() * slot.items.length)]
    }
    return outfit
}

/** The themes in a fresh random order, for one season's rounds. */
export function shuffledThemes(): Theme[] {
    const deck = [...THEMES]
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[deck[i], deck[j]] = [deck[j], deck[i]]
    }
    return deck
}
