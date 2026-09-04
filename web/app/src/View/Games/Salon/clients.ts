// Client generation, look vocabulary, and scoring for the salon. Everything
// the game treats as "content" (dye colors, style names, reactions, point
// values) lives here so it is easy to remix without touching rendering code.

export type HairLength = "short" | "medium" | "long"
export type HairColor = "pink" | "blue" | "blonde" | "brown" | "black" | "red" | "purple" | "mint"
export type HairTexture = "straight" | "curly" | "waves" | "updo" | "braids"
export type Accessory = "bow" | "flower" | "clip" | "tiara" | "none"

/** A complete hairdo as rendered on a client's head. */
export interface HairLook {
    length: HairLength
    color: HairColor
    texture: HairTexture
    accessory: Accessory
}

/** What the client asks for. `accessory` is null when they have no wish. */
export interface ClientRequest {
    length: HairLength
    color: HairColor
    texture: HairTexture
    accessory: Accessory | null
}

export interface Client {
    name: string
    skinTone: string
    eyeColor: string
    smile: "soft" | "wide"
    /** The tangled hairdo they walk in with. */
    startLook: HairLook
    /** What is stuck in that tangled hair. */
    debris: "leaf" | "gum"
    request: ClientRequest
}

export const HAIR_LENGTHS: HairLength[] = ["short", "medium", "long"]
export const HAIR_COLORS: HairColor[] = ["pink", "blue", "blonde", "brown", "black", "red", "purple", "mint"]
export const HAIR_TEXTURES: HairTexture[] = ["straight", "curly", "waves", "updo", "braids"]
export const ACCESSORIES: Accessory[] = ["bow", "flower", "clip", "tiara", "none"]

export const LENGTH_LABELS: Record<HairLength, string> = {
    short: "Short",
    medium: "Medium",
    long: "Long",
}

export const TEXTURE_LABELS: Record<HairTexture, { label: string; emoji: string }> = {
    straight: { label: "Straight", emoji: "💇" },
    curly: { label: "Curly", emoji: "➿" },
    waves: { label: "Waves", emoji: "🌊" },
    updo: { label: "Updo", emoji: "🍥" },
    braids: { label: "Braids", emoji: "🪢" },
}

export const DYE_SWATCHES: Record<HairColor, { label: string; fill: string; highlight: string }> = {
    pink: { label: "Pink", fill: "#f06eaa", highlight: "#ffb8d9" },
    blue: { label: "Blue", fill: "#4f8fe6", highlight: "#a8ccf5" },
    blonde: { label: "Blonde", fill: "#f2c94c", highlight: "#ffe9a8" },
    brown: { label: "Brown", fill: "#8a5a33", highlight: "#c08a55" },
    black: { label: "Black", fill: "#3a3540", highlight: "#6e6879" },
    red: { label: "Red", fill: "#cf4b32", highlight: "#f0855f" },
    purple: { label: "Purple", fill: "#9a6fd0", highlight: "#cdb0ee" },
    mint: { label: "Mint", fill: "#58c9a2", highlight: "#a8ebd2" },
}

export const ACCESSORY_META: Record<Accessory, { label: string; emoji: string }> = {
    bow: { label: "Bow", emoji: "🎀" },
    flower: { label: "Flower", emoji: "💐" },
    clip: { label: "Clip", emoji: "⭐" },
    tiara: { label: "Tiara", emoji: "👑" },
    none: { label: "None", emoji: "🙅" },
}

/** Points for each request attribute the finished look matches. */
export const POINTS_PER_MATCH = 25
/** Extra points for a perfect scrub at the wash station. */
export const WASH_BONUS_MAX = 25

const NAMES = ["Luna", "Milo", "Zoe", "Kai", "Pippa", "Ravi", "Nova", "Theo", "Mimi", "Ozzy", "Ida", "Beau"]
const SKIN_TONES = ["#ffe0c7", "#f3c9a6", "#e0ac7e", "#c68a5a", "#9c6b43", "#71492c"]
const EYE_COLORS = ["#4a3826", "#2f4a6e", "#3c6b4f", "#5a4a7a"]
/** Walk-in hair colors; requests always ask for something different. */
const WALK_IN_COLORS: HairColor[] = ["brown", "black", "blonde", "red"]
const ACCESSORY_WISH_CHANCE = 0.5

function pick<T>(items: readonly T[]): T {
    return items[Math.floor(Math.random() * items.length)]
}

/** Roll a fresh client: a messy walk-in look plus a random request card. */
export function randomClient(): Client {
    const startColor = pick(WALK_IN_COLORS)
    const wantsAccessory = Math.random() < ACCESSORY_WISH_CHANCE
    return {
        name: pick(NAMES),
        skinTone: pick(SKIN_TONES),
        eyeColor: pick(EYE_COLORS),
        smile: Math.random() < 0.5 ? "soft" : "wide",
        startLook: { length: "long", color: startColor, texture: "straight", accessory: "none" },
        debris: Math.random() < 0.5 ? "leaf" : "gum",
        request: {
            length: pick(HAIR_LENGTHS),
            color: pick(HAIR_COLORS.filter((color) => color !== startColor)),
            texture: pick(HAIR_TEXTURES),
            accessory: wantsAccessory ? pick(ACCESSORIES.filter((item) => item !== "none")) : null,
        },
    }
}

export interface Score {
    lengthMatch: boolean
    colorMatch: boolean
    textureMatch: boolean
    /** Null when the client had no accessory wish. */
    accessoryMatch: boolean | null
    washBonus: number
    total: number
    max: number
}

/** Compare the finished look against the request card. */
export function scoreLook(request: ClientRequest, look: HairLook, cleanliness: number): Score {
    const lengthMatch = look.length === request.length
    const colorMatch = look.color === request.color
    const textureMatch = look.texture === request.texture
    const accessoryMatch = request.accessory === null ? null : look.accessory === request.accessory
    const washBonus = Math.round(cleanliness * WASH_BONUS_MAX)
    const matches =
        [lengthMatch, colorMatch, textureMatch].filter(Boolean).length + (accessoryMatch === true ? 1 : 0)
    const max = POINTS_PER_MATCH * (request.accessory === null ? 3 : 4) + WASH_BONUS_MAX
    return {
        lengthMatch,
        colorMatch,
        textureMatch,
        accessoryMatch,
        washBonus,
        total: POINTS_PER_MATCH * matches + washBonus,
        max,
    }
}

export type Mood = "delighted" | "happy" | "grimace"

export const REACTIONS: Record<Mood, { emoji: string; lines: string[] }> = {
    delighted: {
        emoji: "😍",
        lines: [
            "I LOVE it! You're a wizard with scissors!",
            "Stunning! I'm never going anywhere else!",
            "Best. Hair. Ever. I could cry!",
        ],
    },
    happy: {
        emoji: "🙂",
        lines: [
            "Pretty nice! I'd come back.",
            "Not exactly what I asked for, but cute!",
            "Solid work, stylist. Solid work.",
        ],
    },
    grimace: {
        emoji: "😬",
        lines: [
            "Um… did you read my request card?",
            "I asked for WHAT now?",
            "My hat is staying ON, thanks.",
        ],
    },
}

/** How the client feels about their reveal. */
export function moodFor(score: Score): Mood {
    const ratio = score.total / score.max
    if (ratio >= 0.9) {
        return "delighted"
    }
    if (ratio >= 0.55) {
        return "happy"
    }
    return "grimace"
}

export function pickReactionLine(mood: Mood): string {
    return pick(REACTIONS[mood].lines)
}
