// CabinBot simulation: every type, roster entry, and tuning constant for the
// flight lives here so the whole game can be rebalanced from one file.

export type FlightPhase = "idle" | "boarding" | "cruise" | "landed"
export type CabinDifficulty = "trainee" | "crew" | "captain"
export type ItemKind = "pretzels" | "drink" | "headphones" | "blanket" | "airsick"
export type SpecialRole = "none" | "celebrity" | "runner" | "grandma"
export type SoundCue = "pop" | "request" | "serve" | "grumble" | "intercom" | "sparkle" | "landing"

export interface GalleyItem {
    kind: ItemKind
    emoji: string
    label: string
}

/** The five items on the galley tray, in display order. */
export const GALLEY_ITEMS: GalleyItem[] = [
    { kind: "pretzels", emoji: "🥨", label: "Pretzels" },
    { kind: "drink", emoji: "🥤", label: "Drink" },
    { kind: "headphones", emoji: "🎧", label: "Headphones" },
    { kind: "blanket", emoji: "🧣", label: "Blanket" },
    { kind: "airsick", emoji: "🤢", label: "Airsick Bag" },
]

export const CABIN_ROWS = 5
export const SEATS_PER_ROW = 4

/** Every gameplay number in one place — tweak these to rebalance the flight. */
export const TUNING = {
    boardingMs: 5000,
    cruiseMs: 120000,
    cruiseAltitudeFt: 35000,
    /** Ms spent climbing to (and descending from) cruise altitude, inside cruiseMs. */
    climbMs: 20000,
    startHappiness: 70,
    requestPatienceMs: 10000,
    servedHappiness: 12,
    expiredHappiness: -15,
    wrongItemHappiness: -8,
    /** Ms between request spawns at the start of the cruise, per difficulty. */
    spawnIntervalMs: { trainee: 5200, crew: 3800, captain: 2600 },
    /** Spawn interval multiplier by the end of the cruise (lower = more hectic finale). */
    endOfFlightSpawnFactor: 0.45,
    /** How long an intercom announcement and a mood face stay on screen. */
    announcementMs: 4500,
    moodMs: 900,
    celebrity: { patienceMs: 6000, happinessBonus: 30, happinessPenalty: -25, flashMs: 900 },
    runner: { grabsToCalm: 3, hopIntervalMs: 1300, nearbyDrainPerSec: 2.5 },
    grandma: { chatMs: 3000, patienceMs: 20000, happinessBonus: 24, cookieBoost: 10, glowMs: 1600 },
}

/** One face per seat; shuffled every flight so the cabin always looks fresh. */
const FACES = [
    "🧑",
    "👵",
    "🧒",
    "👨‍🦱",
    "👩‍🎤",
    "👨‍💼",
    "👩‍🦰",
    "🧔",
    "👱‍♀️",
    "👴",
    "👦",
    "👩‍🦱",
    "🧕",
    "👨‍🎨",
    "👧",
    "🧓",
    "👨‍🦰",
    "👩",
    "🙎‍♂️",
    "👩‍💼",
]

export interface SeatRequest {
    item: ItemKind
    remainingMs: number
    totalMs: number
}

export interface Passenger {
    id: number
    row: number
    seat: number
    face: string
    happiness: number
    boardAtMs: number
    boarded: boolean
    request: SeatRequest | null
    role: SpecialRole
    /** Celebrity/grandma: how many of their special demands are complete. */
    demandsServed: number
    /** Runner: true while dashing around the aisle instead of sitting. */
    running: boolean
    grabCount: number
    /** Runner: aisle position as a fraction of cabin depth (0 = front row). */
    aislePos: number
    hopCooldownMs: number
    /** Grandma: still owes the player a click-and-hold chat. */
    needsChat: boolean
    chatting: boolean
    chatMs: number
    /** Brief face override after a serve/grumble ("happy" | "upset"). */
    mood: "happy" | "upset" | null
    moodMs: number
}

interface ScheduledEvent {
    kind: "celebrity" | "runner" | "grandma"
    atMs: number
    fired: boolean
}

export interface FlightState {
    phase: FlightPhase
    difficulty: CabinDifficulty
    /** Elapsed ms within the current phase. */
    elapsedMs: number
    passengers: Passenger[]
    events: ScheduledEvent[]
    spawnCooldownMs: number
    served: number
    missed: number
    announcement: string | null
    announcementMs: number
    /** Countdown overlays: paparazzi camera flash and grandma's cookie glow. */
    paparazziMs: number
    cookieGlowMs: number
    /** Final 1-5 rating, computed on landing. */
    stars: number
}

export interface ServeResult {
    correct: boolean
    cues: SoundCue[]
}

/** Seat label like "3B" for a row/seat index pair. */
export function seatLabel(row: number, seat: number): string {
    return `${row + 1}${"ABCD"[seat]}`
}

/** Emoji for a galley item kind. */
export function itemEmoji(kind: ItemKind): string {
    return GALLEY_ITEMS.find((item) => item.kind === kind)?.emoji ?? "❓"
}

/** Fresh flight in the "idle" phase with a full, shuffled roster. */
export function createFlight(difficulty: CabinDifficulty): FlightState {
    const faces = [...FACES].sort(() => Math.random() - 0.5)
    const passengers: Passenger[] = []
    for (let row = 0; row < CABIN_ROWS; row += 1) {
        for (let seat = 0; seat < SEATS_PER_ROW; seat += 1) {
            const id = row * SEATS_PER_ROW + seat
            passengers.push({
                id,
                row,
                seat,
                face: faces[id],
                happiness: TUNING.startHappiness,
                boardAtMs: 300 + (id / (CABIN_ROWS * SEATS_PER_ROW)) * (TUNING.boardingMs - 800),
                boarded: false,
                request: null,
                role: "none",
                demandsServed: 0,
                running: false,
                grabCount: 0,
                aislePos: 0,
                hopCooldownMs: 0,
                needsChat: false,
                chatting: false,
                chatMs: 0,
                mood: null,
                moodMs: 0,
            })
        }
    }
    return {
        phase: "idle",
        difficulty,
        elapsedMs: 0,
        passengers,
        events: [
            { kind: "celebrity", atMs: 15000 + Math.random() * 20000, fired: false },
            { kind: "runner", atMs: 45000 + Math.random() * 25000, fired: false },
            { kind: "grandma", atMs: 78000 + Math.random() * 18000, fired: false },
        ],
        spawnCooldownMs: 1500,
        served: 0,
        missed: 0,
        announcement: null,
        announcementMs: 0,
        paparazziMs: 0,
        cookieGlowMs: 0,
        stars: 0,
    }
}

/** Push back from the gate: starts the boarding phase. */
export function beginBoarding(state: FlightState): void {
    state.phase = "boarding"
    state.elapsedMs = 0
}

/** Average happiness of everyone on board, 0-100. */
export function cabinHappiness(state: FlightState): number {
    const boarded = state.passengers.filter((passenger) => passenger.boarded)
    if (boarded.length === 0) {
        return TUNING.startHappiness
    }
    const total = boarded.reduce((sum, passenger) => sum + passenger.happiness, 0)
    return Math.round(total / boarded.length)
}

/** Current altitude for the status-bar ticker (climb, cruise, descend). */
export function altitudeFt(state: FlightState): number {
    if (state.phase !== "cruise") {
        return 0
    }
    const { climbMs, cruiseMs, cruiseAltitudeFt } = TUNING
    if (state.elapsedMs < climbMs) {
        return Math.round(cruiseAltitudeFt * (state.elapsedMs / climbMs))
    }
    if (state.elapsedMs > cruiseMs - climbMs) {
        return Math.round(cruiseAltitudeFt * (Math.max(0, cruiseMs - state.elapsedMs) / climbMs))
    }
    return cruiseAltitudeFt
}

/** Overall 🛫→🛬 progress across boarding + cruise, 0-1. */
export function flightProgress(state: FlightState): number {
    const total = TUNING.boardingMs + TUNING.cruiseMs
    if (state.phase === "idle") {
        return 0
    }
    if (state.phase === "landed") {
        return 1
    }
    const elapsed = state.phase === "boarding" ? state.elapsedMs : TUNING.boardingMs + state.elapsedMs
    return Math.min(1, elapsed / total)
}

/**
 * Advance the simulation by dtMs. Mutates the state in place and returns the
 * sound cues that fired this tick so the caller can play them.
 */
export function tickFlight(state: FlightState, dtMs: number): SoundCue[] {
    const cues: SoundCue[] = []
    if (state.phase === "idle" || state.phase === "landed") {
        return cues
    }
    state.elapsedMs += dtMs
    tickTimers(state, dtMs)

    if (state.phase === "boarding") {
        for (const passenger of state.passengers) {
            if (!passenger.boarded && state.elapsedMs >= passenger.boardAtMs) {
                passenger.boarded = true
                cues.push("pop")
            }
        }
        if (state.elapsedMs >= TUNING.boardingMs) {
            state.passengers.forEach((passenger) => {
                passenger.boarded = true
            })
            state.phase = "cruise"
            state.elapsedMs = 0
            announce(state, "📢 Doors closed, climbing to cruise. Snack service begins!")
            cues.push("intercom")
        }
        return cues
    }

    tickSpawns(state, dtMs, cues)
    tickRequests(state, dtMs, cues)
    tickEvents(state, cues)
    tickRunner(state, dtMs)
    tickChat(state, dtMs, cues)

    if (state.elapsedMs >= TUNING.cruiseMs) {
        land(state)
        cues.push("landing")
    }
    return cues
}

/** Hold pretzels/a drink/etc. up to a seat. */
export function serveItem(state: FlightState, passengerId: number, item: ItemKind): ServeResult {
    const passenger = state.passengers.find((candidate) => candidate.id === passengerId)
    if (state.phase !== "cruise" || !passenger || !passenger.boarded || passenger.running) {
        return { correct: false, cues: [] }
    }
    if (!passenger.request) {
        return { correct: false, cues: [] }
    }
    if (passenger.request.item !== item) {
        adjustHappiness(passenger, TUNING.wrongItemHappiness)
        setMood(passenger, "upset")
        return { correct: false, cues: ["grumble"] }
    }

    passenger.request = null
    state.served += 1
    adjustHappiness(passenger, TUNING.servedHappiness)
    setMood(passenger, "happy")
    const cues: SoundCue[] = ["serve"]

    if (passenger.role === "celebrity") {
        passenger.demandsServed += 1
        if (passenger.demandsServed >= 2) {
            adjustHappiness(passenger, TUNING.celebrity.happinessBonus)
            passenger.role = "none"
            announce(state, "📢 Autograph secured! The celebrity adores this airline ⭐")
            cues.push("sparkle")
        } else {
            passenger.request = makeRequest(randomItem(item), TUNING.celebrity.patienceMs)
            cues.push("request")
        }
    } else if (passenger.role === "grandma") {
        passenger.demandsServed = 1
        if (!passenger.needsChat) {
            completeGrandma(state, passenger, cues)
        }
    }
    return { correct: true, cues }
}

/** One grab attempt at the runner; three grabs calms them back into their seat. */
export function grabRunner(state: FlightState, passengerId: number): SoundCue[] {
    const passenger = state.passengers.find((candidate) => candidate.id === passengerId)
    if (state.phase !== "cruise" || !passenger || !passenger.running) {
        return []
    }
    passenger.grabCount += 1
    if (passenger.grabCount >= TUNING.runner.grabsToCalm) {
        passenger.running = false
        passenger.role = "none"
        setMood(passenger, "happy")
        announce(state, "📢 Runner calmed and buckled back in. Nice save, crew!")
        return ["serve", "sparkle"]
    }
    return ["pop"]
}

/** Begin the click-and-hold chat with grandma (released via stopChatting). */
export function startChat(state: FlightState, passengerId: number): void {
    const passenger = state.passengers.find((candidate) => candidate.id === passengerId)
    if (state.phase === "cruise" && passenger?.role === "grandma" && passenger.needsChat) {
        passenger.chatting = true
    }
}

/** Release every held chat (call on mouseup anywhere). */
export function stopChatting(state: FlightState): void {
    state.passengers.forEach((passenger) => {
        passenger.chatting = false
    })
}

function tickTimers(state: FlightState, dtMs: number): void {
    if (state.announcement) {
        state.announcementMs -= dtMs
        if (state.announcementMs <= 0) {
            state.announcement = null
        }
    }
    state.paparazziMs = Math.max(0, state.paparazziMs - dtMs)
    state.cookieGlowMs = Math.max(0, state.cookieGlowMs - dtMs)
    for (const passenger of state.passengers) {
        if (passenger.mood) {
            passenger.moodMs -= dtMs
            if (passenger.moodMs <= 0) {
                passenger.mood = null
            }
        }
    }
}

function tickSpawns(state: FlightState, dtMs: number, cues: SoundCue[]): void {
    state.spawnCooldownMs -= dtMs
    if (state.spawnCooldownMs > 0) {
        return
    }
    const idle = state.passengers.filter(
        (passenger) =>
            passenger.boarded && !passenger.running && passenger.role === "none" && !passenger.request,
    )
    if (idle.length > 0) {
        const passenger = idle[Math.floor(Math.random() * idle.length)]
        passenger.request = makeRequest(randomItem(), TUNING.requestPatienceMs)
        cues.push("request")
    }
    // Spawn interval shrinks linearly through the flight so the finale is hectic.
    const progress = Math.min(1, state.elapsedMs / TUNING.cruiseMs)
    const factor = 1 - progress * (1 - TUNING.endOfFlightSpawnFactor)
    state.spawnCooldownMs = TUNING.spawnIntervalMs[state.difficulty] * factor
}

function tickRequests(state: FlightState, dtMs: number, cues: SoundCue[]): void {
    for (const passenger of state.passengers) {
        if (!passenger.request) {
            continue
        }
        passenger.request.remainingMs -= dtMs
        if (passenger.request.remainingMs > 0) {
            continue
        }
        passenger.request = null
        state.missed += 1
        adjustHappiness(passenger, TUNING.expiredHappiness)
        setMood(passenger, "upset")
        cues.push("grumble")
        if (passenger.role === "celebrity") {
            adjustHappiness(passenger, TUNING.celebrity.happinessPenalty)
            passenger.role = "none"
            state.paparazziMs = TUNING.celebrity.flashMs
            announce(state, "📢 The celebrity is fuming — paparazzi caught everything! 📸")
        } else if (passenger.role === "grandma") {
            passenger.role = "none"
            passenger.needsChat = false
            passenger.chatting = false
            announce(state, "📢 Grandma dozed off without her blanket... the cookies stay in her bag.")
        }
    }
}

function tickEvents(state: FlightState, cues: SoundCue[]): void {
    for (const event of state.events) {
        if (event.fired || state.elapsedMs < event.atMs) {
            continue
        }
        event.fired = true
        cues.push("intercom")
        if (event.kind === "celebrity") {
            fireCelebrity(state)
        } else if (event.kind === "runner") {
            fireRunner(state)
        } else {
            fireGrandma(state)
        }
    }
}

function tickRunner(state: FlightState, dtMs: number): void {
    const runner = state.passengers.find((passenger) => passenger.running)
    if (!runner) {
        return
    }
    runner.hopCooldownMs -= dtMs
    if (runner.hopCooldownMs <= 0) {
        runner.aislePos = Math.random()
        runner.hopCooldownMs = TUNING.runner.hopIntervalMs
    }
    // Passengers within a row of the runner get rattled while the chaos lasts.
    const runnerRow = runner.aislePos * (CABIN_ROWS - 1)
    const drain = (TUNING.runner.nearbyDrainPerSec * dtMs) / 1000
    for (const passenger of state.passengers) {
        if (passenger.id !== runner.id && passenger.boarded && Math.abs(passenger.row - runnerRow) <= 1) {
            adjustHappiness(passenger, -drain)
        }
    }
}

function tickChat(state: FlightState, dtMs: number, cues: SoundCue[]): void {
    for (const passenger of state.passengers) {
        if (passenger.role !== "grandma" || !passenger.needsChat || !passenger.chatting) {
            continue
        }
        passenger.chatMs += dtMs
        if (passenger.chatMs < TUNING.grandma.chatMs) {
            continue
        }
        passenger.needsChat = false
        passenger.chatting = false
        setMood(passenger, "happy")
        cues.push("serve")
        if (passenger.demandsServed >= 1) {
            completeGrandma(state, passenger, cues)
        }
    }
}

function fireCelebrity(state: FlightState): void {
    const candidates = state.passengers.filter(
        (passenger) => passenger.row === 0 && passenger.role === "none" && !passenger.running,
    )
    const passenger = candidates[Math.floor(Math.random() * candidates.length)] ?? state.passengers[0]
    passenger.role = "celebrity"
    passenger.face = "🕶️"
    passenger.demandsServed = 0
    passenger.request = makeRequest(randomItem(), TUNING.celebrity.patienceMs)
    announce(state, `📢 A celebrity just boarded seat ${seatLabel(passenger.row, passenger.seat)}! ⭐`)
}

function fireRunner(state: FlightState): void {
    const candidates = state.passengers.filter(
        (passenger) => passenger.boarded && passenger.role === "none" && !passenger.request,
    )
    const passenger = candidates[Math.floor(Math.random() * candidates.length)] ?? state.passengers[0]
    passenger.role = "runner"
    passenger.running = true
    passenger.grabCount = 0
    passenger.request = null
    passenger.aislePos = Math.random()
    passenger.hopCooldownMs = TUNING.runner.hopIntervalMs
    announce(state, "📢 Passenger on the loose in the aisle! Click them 3 times to calm them 🏃")
}

function fireGrandma(state: FlightState): void {
    const candidates = state.passengers.filter(
        (passenger) => passenger.boarded && passenger.role === "none" && !passenger.running,
    )
    const passenger = candidates[Math.floor(Math.random() * candidates.length)] ?? state.passengers[0]
    passenger.role = "grandma"
    passenger.face = "👵"
    passenger.demandsServed = 0
    passenger.needsChat = true
    passenger.chatMs = 0
    passenger.request = makeRequest("blanket", TUNING.grandma.patienceMs)
    announce(
        state,
        `📢 Sweet grandma in ${seatLabel(passenger.row, passenger.seat)} needs a blanket and a chat 👵`,
    )
}

function completeGrandma(state: FlightState, passenger: Passenger, cues: SoundCue[]): void {
    passenger.role = "none"
    adjustHappiness(passenger, TUNING.grandma.happinessBonus)
    state.passengers.forEach((other) => adjustHappiness(other, TUNING.grandma.cookieBoost))
    state.cookieGlowMs = TUNING.grandma.glowMs
    announce(state, "📢 Grandma is delighted — cookies for the whole cabin! 🍪")
    cues.push("sparkle")
}

function land(state: FlightState): void {
    state.phase = "landed"
    const happiness = cabinHappiness(state)
    state.stars = happiness >= 90 ? 5 : happiness >= 75 ? 4 : happiness >= 55 ? 3 : happiness >= 35 ? 2 : 1
    state.announcement = null
    state.passengers.forEach((passenger) => {
        passenger.running = false
        passenger.chatting = false
        passenger.request = null
    })
}

function announce(state: FlightState, message: string): void {
    state.announcement = message
    state.announcementMs = TUNING.announcementMs
}

function makeRequest(item: ItemKind, patienceMs: number): SeatRequest {
    return { item, remainingMs: patienceMs, totalMs: patienceMs }
}

function randomItem(exclude?: ItemKind): ItemKind {
    const pool = GALLEY_ITEMS.filter((item) => item.kind !== exclude)
    return pool[Math.floor(Math.random() * pool.length)].kind
}

function adjustHappiness(passenger: Passenger, delta: number): void {
    passenger.happiness = Math.max(0, Math.min(100, passenger.happiness + delta))
}

function setMood(passenger: Passenger, mood: "happy" | "upset"): void {
    passenger.mood = mood
    passenger.moodMs = TUNING.moodMs
}
