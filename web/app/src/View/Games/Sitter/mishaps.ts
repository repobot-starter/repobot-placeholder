// All gameplay data and tuning for SitterBot lives here so remixes only need
// to touch one file: rooms, tools, mishap definitions, spawn pacing, the
// scripted overflow event, and the end-of-shift scoring rules.

export type RoomKey = "living" | "kitchen" | "bedroom" | "bathroom"
export type ToolKey = "mop" | "hug" | "snack" | "tidy" | "sponge" | "remote"
export type MishapKey = "juice" | "crying" | "hungry" | "toys" | "crayon" | "tv"
export type SitterDifficulty = "chill" | "normal" | "chaos"

export interface FurnitureItem {
    emoji: string
    /** Percent offsets within the room panel. */
    x: number
    y: number
}

export interface Room {
    key: RoomKey
    name: string
    emoji: string
    furniture: FurnitureItem[]
}

export const ROOMS: Room[] = [
    {
        key: "living",
        name: "Living Room",
        emoji: "🛋️",
        furniture: [
            { emoji: "🛋️", x: 22, y: 66 },
            { emoji: "🖼️", x: 50, y: 26 },
            { emoji: "🪴", x: 82, y: 34 },
            { emoji: "📻", x: 78, y: 72 },
        ],
    },
    {
        key: "kitchen",
        name: "Kitchen",
        emoji: "🍳",
        furniture: [
            { emoji: "🍳", x: 24, y: 32 },
            { emoji: "🫖", x: 74, y: 30 },
            { emoji: "🍽️", x: 50, y: 70 },
            { emoji: "🧁", x: 82, y: 66 },
        ],
    },
    {
        key: "bedroom",
        name: "Bedroom",
        emoji: "🛏️",
        furniture: [
            { emoji: "🛏️", x: 26, y: 64 },
            { emoji: "🌙", x: 76, y: 26 },
            { emoji: "📚", x: 82, y: 66 },
            { emoji: "🧦", x: 52, y: 30 },
        ],
    },
    {
        key: "bathroom",
        name: "Bathroom",
        emoji: "🛁",
        furniture: [
            { emoji: "🛁", x: 26, y: 66 },
            { emoji: "🚿", x: 22, y: 28 },
            { emoji: "🪥", x: 72, y: 28 },
            { emoji: "🧻", x: 80, y: 68 },
        ],
    },
]

export interface Tool {
    key: ToolKey
    emoji: string
    label: string
}

export const TOOLS: Tool[] = [
    { key: "mop", emoji: "🧹", label: "Mop" },
    { key: "hug", emoji: "🤗", label: "Hug" },
    { key: "snack", emoji: "🍎", label: "Snack" },
    { key: "tidy", emoji: "🧺", label: "Tidy" },
    { key: "sponge", emoji: "🧽", label: "Sponge" },
    { key: "remote", emoji: "🎮", label: "Remote" },
]

export interface MishapKind {
    key: MishapKey
    emoji: string
    label: string
    /** The one tool that fixes it — anything else earns a buzz and a giggle. */
    tool: ToolKey
    /** Clicks with the right tool needed to fix (toys vanish one per click). */
    clicksToFix: number
    /** If > 0, the fix is click-and-hold for this long instead of clicking. */
    holdMs: number
    /** Relative spawn weight. */
    weight: number
    /** True for mishaps about a kid — fixing them feeds the happiness score. */
    kidCare: boolean
}

export const MISHAP_KINDS: MishapKind[] = [
    {
        key: "juice",
        emoji: "🧃",
        label: "Juice spill",
        tool: "mop",
        clicksToFix: 1,
        holdMs: 0,
        weight: 3,
        kidCare: false,
    },
    {
        key: "crying",
        emoji: "😭",
        label: "Crying kid",
        tool: "hug",
        clicksToFix: 1,
        holdMs: 2000,
        weight: 2,
        kidCare: true,
    },
    {
        key: "hungry",
        emoji: "🍪",
        label: "Hungry kid",
        tool: "snack",
        clicksToFix: 1,
        holdMs: 0,
        weight: 2,
        kidCare: true,
    },
    {
        key: "toys",
        emoji: "🧸",
        label: "Toy explosion",
        tool: "tidy",
        clicksToFix: 3,
        holdMs: 0,
        weight: 2,
        kidCare: false,
    },
    {
        key: "crayon",
        emoji: "🖍️",
        label: "Crayon on the wall",
        tool: "sponge",
        clicksToFix: 1,
        holdMs: 0,
        weight: 2,
        kidCare: false,
    },
    {
        key: "tv",
        emoji: "📺",
        label: "TV blasting",
        tool: "remote",
        clicksToFix: 1,
        holdMs: 0,
        weight: 2,
        kidCare: false,
    },
]

/** A live mishap sitting in a room, waiting for the right tool. */
export interface ActiveMishap {
    id: number
    kind: MishapKind
    room: RoomKey
    /** Percent offsets within the room panel. */
    x: number
    y: number
    /** Shift-elapsed ms when it appeared (drives the severity ring). */
    spawnedAt: number
    clicksDone: number
    /** Escalated past its timer: permanent unless fixed, counts double. */
    isMess: boolean
}

/** A kid wandering the house. */
export interface Kid {
    id: number
    emoji: string
    room: RoomKey
    /** Percent offsets within the room panel. */
    x: number
    y: number
    /** Bumped on each move so the hop animation replays. */
    hopToken: number
    /** Shift-elapsed ms of the next wander. */
    nextMoveAt: number
}

// --- Shift tuning ---------------------------------------------------------

export const SHIFT_LENGTH_MS = 120_000
/** How long a mishap wobbles before it hardens into a MESS. */
export const MISHAP_TIMER_MS = 12_000
export const MAX_ACTIVE_MISHAPS = 8
/** The first mishap of a shift arrives this soon. */
export const FIRST_SPAWN_MS = 2_500

/** The scripted bathtub overflow: trigger time, clicks to shut off, time before flood. */
export const OVERFLOW_AT_REMAINING_MS = 60_000
export const OVERFLOW_CLICKS = 5
export const OVERFLOW_WINDOW_MS = 8_000

export const KID_MOVE_MIN_MS = 3_000
export const KID_MOVE_MAX_MS = 6_000
/** After a mishap escalates into a mess, kids scatter within this window. */
export const KID_PANIC_MS = 900

/** Spawn pacing per difficulty: the interval ramps from start to end over the shift. */
export const DIFFICULTIES: Record<
    SitterDifficulty,
    { label: string; spawnStartMs: number; spawnEndMs: number }
> = {
    chill: { label: "Chill", spawnStartMs: 7_000, spawnEndMs: 4_200 },
    normal: { label: "Normal", spawnStartMs: 5_500, spawnEndMs: 3_000 },
    chaos: { label: "Chaos", spawnStartMs: 4_000, spawnEndMs: 2_000 },
}

/** Each replay ("Babysit again") multiplies spawn intervals by this. */
export const REPLAY_SPAWN_FACTOR = 0.92
export const MIN_SPAWN_MS = 1_500

// --- Scoring ----------------------------------------------------------------

export const UNFIXED_PENALTY = 8
/** Escalated messes count double against tidiness. */
export const MESS_PENALTY = 16
export const FLOOD_PENALTY = 25
export const BASE_PAY_PER_STAR = 12
export const TIP_PER_FIX = 1
export const BEST_PAY_KEY = "sitter.bestPay"

/** Overall score (0-100) needed for each star count, checked top down. */
export const STAR_THRESHOLDS: { stars: number; minScore: number }[] = [
    { stars: 5, minScore: 90 },
    { stars: 4, minScore: 72 },
    { stars: 3, minScore: 52 },
    { stars: 2, minScore: 30 },
    { stars: 1, minScore: 0 },
]

// --- Spawn logic ------------------------------------------------------------

/** Current gap between spawns: ramps down over the shift, faster on replays. */
export function spawnIntervalMs(
    elapsedMs: number,
    difficulty: SitterDifficulty,
    shiftNumber: number,
): number {
    const pace = DIFFICULTIES[difficulty]
    const progress = Math.min(1, Math.max(0, elapsedMs / SHIFT_LENGTH_MS))
    const base = pace.spawnStartMs + (pace.spawnEndMs - pace.spawnStartMs) * progress
    const replaySpeedup = Math.pow(REPLAY_SPAWN_FACTOR, shiftNumber - 1)
    return Math.max(MIN_SPAWN_MS, base * replaySpeedup)
}

/** Weighted random mishap kind. */
export function pickMishapKind(): MishapKind {
    const totalWeight = MISHAP_KINDS.reduce((sum, kind) => sum + kind.weight, 0)
    let roll = Math.random() * totalWeight
    for (const kind of MISHAP_KINDS) {
        roll -= kind.weight
        if (roll <= 0) {
            return kind
        }
    }
    return MISHAP_KINDS[0]
}

export function pickRoom(): RoomKey {
    return ROOMS[Math.floor(Math.random() * ROOMS.length)].key
}

/** A random spot inside a room panel, below the label and away from the edges. */
export function randomSpot(): { x: number; y: number } {
    return {
        x: 12 + Math.random() * 70,
        y: 34 + Math.random() * 44,
    }
}

export function kidMoveDelayMs(): number {
    return KID_MOVE_MIN_MS + Math.random() * (KID_MOVE_MAX_MS - KID_MOVE_MIN_MS)
}

// --- Scoring ----------------------------------------------------------------

export interface ShiftReport {
    fixes: number
    /** Hugs given + snacks served. */
    kidCare: number
    /** Unfixed mishaps still within their timer when the parents arrive. */
    leftoverMishaps: number
    /** Unfixed escalated messes (count double). */
    leftoverMesses: number
    flooded: boolean
}

export interface ShiftResult {
    stars: number
    pay: number
    tidiness: number
    happiness: number
}

export function scoreShift(report: ShiftReport): ShiftResult {
    const tidiness = clamp(
        100 -
            report.leftoverMishaps * UNFIXED_PENALTY -
            report.leftoverMesses * MESS_PENALTY -
            (report.flooded ? FLOOD_PENALTY : 0),
        0,
        100,
    )
    const happiness = clamp(40 + report.kidCare * 15 + report.fixes * 3, 0, 100)
    const overall = tidiness * 0.6 + happiness * 0.4
    const stars = STAR_THRESHOLDS.find((threshold) => overall >= threshold.minScore)?.stars ?? 1
    const pay = stars * BASE_PAY_PER_STAR + report.fixes * TIP_PER_FIX
    return { stars, pay, tidiness: Math.round(tidiness), happiness: Math.round(happiness) }
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
}
