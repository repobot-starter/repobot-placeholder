// Pure Koi-Koi engine: the 48-card hanafuda deck, dealing, the turn/match
// state machine, yaku evaluation, round scoring, and the bot AI. No React,
// no DOM — everything here is plain data and functions over EngineState so
// it can be tested headlessly and mirrored by the native ports.
//
// The iOS (`ios/App/View/Games/Hanafuda/HanafudaEngine.swift`) and Android
// (`android/.../view/games/hanafuda/HanafudaEngine.kt`) engines are 1:1
// ports of this file. Any rules change here must be mirrored there.

/** Rounds in a full match; the dealer alternates every round. */
export const TOTAL_ROUNDS = 6

/** Cards dealt to each hand and to the field (the classic 8/8/8 deal). */
export const HAND_SIZE = 8
export const FIELD_SIZE = 8

/** Winning with this many points or more doubles the round score. */
export const BIG_HAND_THRESHOLD = 7

/** localStorage key the match tally persists under (web only). */
export const STATS_STORAGE_KEY = "hanafudabot-stats"

export type CardKind = "bright" | "animal" | "ribbon" | "chaff"

/** Ribbon flavor: red with poetry, plain red, or blue. */
export type RibbonColor = "poetry" | "plain" | "blue"

export interface HanafudaCard {
    /** Stable id 0..47: `(month - 1) * 4 + slot`. */
    id: number
    /** Month 1 (pine) through 12 (paulownia). */
    month: number
    kind: CardKind
    /** English display name, e.g. "Crane and Sun". */
    name: string
    /** Set only on ribbon cards. */
    ribbon?: RibbonColor
}

// Ids of the cards that individual yaku care about. Slot 0 of each month is
// its headline card, so these are all `(month - 1) * 4`.
export const CRANE_ID = 0 // January bright
export const CURTAIN_ID = 8 // March bright (hanami-zake)
export const MOON_ID = 28 // August bright (tsukimi-zake)
export const RAIN_MAN_ID = 40 // November bright (the "rain" bright)
export const PHOENIX_ID = 44 // December bright
export const SAKE_CUP_ID = 32 // September animal (hanami/tsukimi partner)
export const BOAR_ID = 24 // July animal (ino-shika-cho)
export const DEER_ID = 36 // October animal (ino-shika-cho)
export const BUTTERFLIES_ID = 20 // June animal (ino-shika-cho)

export const MONTH_FLOWERS = [
    "Pine",
    "Plum",
    "Cherry",
    "Wisteria",
    "Iris",
    "Peony",
    "Clover",
    "Pampas",
    "Chrysanthemum",
    "Maple",
    "Willow",
    "Paulownia",
]

interface MonthLayout {
    flower: string
    /** Kind + naming for the month's four slots, in slot order. */
    slots: { kind: CardKind; name: string; ribbon?: RibbonColor }[]
}

// Canonical per-month composition: 5 brights, 9 animals, 10 ribbons, 24
// chaff. November (willow) is the odd month out — bright + animal + ribbon +
// the lightning chaff — and December (paulownia) carries three chaff.
const MONTHS: MonthLayout[] = [
    {
        flower: "Pine",
        slots: [
            { kind: "bright", name: "Crane and Sun" },
            { kind: "ribbon", name: "Pine Poetry Ribbon", ribbon: "poetry" },
            { kind: "chaff", name: "Pine Chaff" },
            { kind: "chaff", name: "Pine Chaff" },
        ],
    },
    {
        flower: "Plum",
        slots: [
            { kind: "animal", name: "Bush Warbler" },
            { kind: "ribbon", name: "Plum Poetry Ribbon", ribbon: "poetry" },
            { kind: "chaff", name: "Plum Chaff" },
            { kind: "chaff", name: "Plum Chaff" },
        ],
    },
    {
        flower: "Cherry",
        slots: [
            { kind: "bright", name: "Flower-Viewing Curtain" },
            { kind: "ribbon", name: "Cherry Poetry Ribbon", ribbon: "poetry" },
            { kind: "chaff", name: "Cherry Chaff" },
            { kind: "chaff", name: "Cherry Chaff" },
        ],
    },
    {
        flower: "Wisteria",
        slots: [
            { kind: "animal", name: "Cuckoo" },
            { kind: "ribbon", name: "Wisteria Ribbon", ribbon: "plain" },
            { kind: "chaff", name: "Wisteria Chaff" },
            { kind: "chaff", name: "Wisteria Chaff" },
        ],
    },
    {
        flower: "Iris",
        slots: [
            { kind: "animal", name: "Eight-Plank Bridge" },
            { kind: "ribbon", name: "Iris Ribbon", ribbon: "plain" },
            { kind: "chaff", name: "Iris Chaff" },
            { kind: "chaff", name: "Iris Chaff" },
        ],
    },
    {
        flower: "Peony",
        slots: [
            { kind: "animal", name: "Butterflies" },
            { kind: "ribbon", name: "Peony Blue Ribbon", ribbon: "blue" },
            { kind: "chaff", name: "Peony Chaff" },
            { kind: "chaff", name: "Peony Chaff" },
        ],
    },
    {
        flower: "Clover",
        slots: [
            { kind: "animal", name: "Boar" },
            { kind: "ribbon", name: "Clover Ribbon", ribbon: "plain" },
            { kind: "chaff", name: "Clover Chaff" },
            { kind: "chaff", name: "Clover Chaff" },
        ],
    },
    {
        flower: "Pampas",
        slots: [
            { kind: "bright", name: "Full Moon" },
            { kind: "animal", name: "Geese in Flight" },
            { kind: "chaff", name: "Pampas Chaff" },
            { kind: "chaff", name: "Pampas Chaff" },
        ],
    },
    {
        flower: "Chrysanthemum",
        slots: [
            { kind: "animal", name: "Sake Cup" },
            { kind: "ribbon", name: "Chrysanthemum Blue Ribbon", ribbon: "blue" },
            { kind: "chaff", name: "Chrysanthemum Chaff" },
            { kind: "chaff", name: "Chrysanthemum Chaff" },
        ],
    },
    {
        flower: "Maple",
        slots: [
            { kind: "animal", name: "Deer" },
            { kind: "ribbon", name: "Maple Blue Ribbon", ribbon: "blue" },
            { kind: "chaff", name: "Maple Chaff" },
            { kind: "chaff", name: "Maple Chaff" },
        ],
    },
    {
        flower: "Willow",
        slots: [
            { kind: "bright", name: "Rain Man" },
            { kind: "animal", name: "Swallow" },
            { kind: "ribbon", name: "Willow Ribbon", ribbon: "plain" },
            { kind: "chaff", name: "Lightning" },
        ],
    },
    {
        flower: "Paulownia",
        slots: [
            { kind: "bright", name: "Phoenix" },
            { kind: "chaff", name: "Paulownia Chaff" },
            { kind: "chaff", name: "Paulownia Chaff" },
            { kind: "chaff", name: "Paulownia Chaff" },
        ],
    },
]

/** The full 48-card deck in id order (index === id). */
export const DECK: readonly HanafudaCard[] = MONTHS.flatMap((month, monthIndex) =>
    month.slots.map((slot, slotIndex) => ({
        id: monthIndex * 4 + slotIndex,
        month: monthIndex + 1,
        kind: slot.kind,
        name: slot.name,
        ...(slot.ribbon ? { ribbon: slot.ribbon } : {}),
    })),
)

export function cardById(id: number): HanafudaCard {
    return DECK[id]
}

// ---------------------------------------------------------------------------
// Yaku evaluation
// ---------------------------------------------------------------------------

export type YakuKey =
    | "goko"
    | "shiko"
    | "ame-shiko"
    | "sanko"
    | "hanami-zake"
    | "tsukimi-zake"
    | "inoshikacho"
    | "akatan"
    | "aotan"
    | "tan"
    | "tane"
    | "kasu"

export interface Yaku {
    key: YakuKey
    label: string
    points: number
}

/**
 * Evaluates every yaku in a pile of captured cards. Bright yaku are mutually
 * exclusive (only the best applies); akatan/aotan stack with the tan count,
 * and the sake cup counts as an animal only (see PACK.md house rules).
 */
export function evaluateYaku(captured: HanafudaCard[]): Yaku[] {
    const yaku: Yaku[] = []
    const ids = new Set(captured.map((card) => card.id))

    const brights = captured.filter((card) => card.kind === "bright")
    const hasRain = ids.has(RAIN_MAN_ID)
    const dryBrights = brights.length - (hasRain ? 1 : 0)
    if (brights.length === 5) {
        yaku.push({ key: "goko", label: "Goko (Five Brights)", points: 15 })
    } else if (brights.length === 4 && !hasRain) {
        yaku.push({ key: "shiko", label: "Shiko (Four Brights)", points: 8 })
    } else if (brights.length === 4) {
        yaku.push({ key: "ame-shiko", label: "Ame-Shiko (Rainy Four Brights)", points: 7 })
    } else if (dryBrights === 3) {
        yaku.push({ key: "sanko", label: "Sanko (Three Brights)", points: 6 })
    }

    if (ids.has(CURTAIN_ID) && ids.has(SAKE_CUP_ID)) {
        yaku.push({ key: "hanami-zake", label: "Hanami-zake (Flower Viewing)", points: 5 })
    }
    if (ids.has(MOON_ID) && ids.has(SAKE_CUP_ID)) {
        yaku.push({ key: "tsukimi-zake", label: "Tsukimi-zake (Moon Viewing)", points: 5 })
    }
    if (ids.has(BOAR_ID) && ids.has(DEER_ID) && ids.has(BUTTERFLIES_ID)) {
        yaku.push({ key: "inoshikacho", label: "Ino-Shika-Cho (Boar, Deer, Butterfly)", points: 5 })
    }

    const ribbons = captured.filter((card) => card.kind === "ribbon")
    const poetry = ribbons.filter((card) => card.ribbon === "poetry").length
    const blue = ribbons.filter((card) => card.ribbon === "blue").length
    if (poetry === 3) {
        yaku.push({ key: "akatan", label: "Akatan (Poetry Ribbons)", points: 5 })
    }
    if (blue === 3) {
        yaku.push({ key: "aotan", label: "Aotan (Blue Ribbons)", points: 5 })
    }
    if (ribbons.length >= 5) {
        yaku.push({ key: "tan", label: "Tan (Ribbons)", points: 1 + (ribbons.length - 5) })
    }

    const animals = captured.filter((card) => card.kind === "animal").length
    if (animals >= 5) {
        yaku.push({ key: "tane", label: "Tane (Animals)", points: 1 + (animals - 5) })
    }

    const chaff = captured.filter((card) => card.kind === "chaff").length
    if (chaff >= 10) {
        yaku.push({ key: "kasu", label: "Kasu (Chaff)", points: 1 + (chaff - 10) })
    }

    return yaku
}

export function yakuPoints(yaku: Yaku[]): number {
    return yaku.reduce((sum, item) => sum + item.points, 0)
}

/**
 * Final round score for a winner holding `points` yaku points. House rules
 * (see PACK.md): 7+ points doubles, and winning after the *opponent* called
 * koi-koi doubles again; the multipliers stack.
 */
export function roundScore(points: number, opponentCalledKoiKoi: boolean): number {
    let score = points
    if (points >= BIG_HAND_THRESHOLD) {
        score *= 2
    }
    if (opponentCalledKoiKoi) {
        score *= 2
    }
    return score
}

// ---------------------------------------------------------------------------
// Match state machine
// ---------------------------------------------------------------------------

export type Seat = "player" | "bot"

export function opponentOf(seat: Seat): Seat {
    return seat === "player" ? "bot" : "player"
}

/**
 * What the UI should show / ask for next:
 * - `selectHand` — the player picks a hand card to play.
 * - `chooseFieldForHand` / `chooseFieldForDraw` — the played (or flipped)
 *   card matches exactly two field cards and the player must pick one.
 * - `decision` — the player formed a new yaku: koi-koi or shobu.
 * - `botTurn` — the bot is up; the UI calls `botTakeTurn()` (usually after
 *   a short delay so the turn reads as an opponent acting).
 * - `roundOver` / `matchOver` — terminal; `startNextRound()` / `startMatch()`.
 */
export type Phase =
    | "selectHand"
    | "chooseFieldForHand"
    | "chooseFieldForDraw"
    | "decision"
    | "botTurn"
    | "roundOver"
    | "matchOver"

/** Everything that happened in one completed turn, for logs and toasts. */
export interface TurnReport {
    seat: Seat
    played: HanafudaCard
    /** Cards moved to the capture pile by the hand play (empty on a discard). */
    playedCaptured: HanafudaCard[]
    drawn: HanafudaCard | null
    drawnCaptured: HanafudaCard[]
    /** Yaku newly formed this turn (score strictly improved). */
    newYaku: Yaku[]
    /** Set when the bot formed a yaku and decided its own fate. */
    botDecision?: "koikoi" | "shobu"
}

export interface RoundResult {
    round: number
    winner: Seat | null
    yaku: Yaku[]
    basePoints: number
    score: number
}

/**
 * A full 6-round Koi-Koi match against the bot. Mutable state driven by the
 * UI through `playHandCard` / `resolveFieldChoice` / `declareKoiKoi` /
 * `declareShobu` / `botTakeTurn`, mirroring how PongEngine is driven by its
 * frame loop. Shuffling goes through an injected `random` so tests (and the
 * native ports' tests) can be fully deterministic.
 */
export class KoiKoiEngine {
    round = 1
    /** The dealer leads; the player deals odd rounds (round 1 first). */
    dealer: Seat = "player"
    phase: Phase = "selectHand"
    turn: Seat = "player"

    deck: HanafudaCard[] = []
    field: HanafudaCard[] = []
    hands: Record<Seat, HanafudaCard[]> = { player: [], bot: [] }
    captured: Record<Seat, HanafudaCard[]> = { player: [], bot: [] }

    /** Whether each seat has called koi-koi this round (drives doubling). */
    koiKoiCalled: Record<Seat, boolean> = { player: false, bot: false }
    /** Yaku points at the seat's last decision — used to detect *new* yaku. */
    private bankedPoints: Record<Seat, number> = { player: 0, bot: 0 }

    /** Per-round scores banked so far, indexed by seat. */
    scores: Record<Seat, number[]> = { player: [], bot: [] }
    results: RoundResult[] = []
    matchWinner: Seat | null | undefined = undefined

    /** The most recently completed turn, for the UI log / toasts. */
    lastReport: TurnReport | null = null

    /** Hand card awaiting a two-way field choice. */
    pendingHandCard: HanafudaCard | null = null
    /** Flipped deck card awaiting a two-way field choice. */
    pendingDrawnCard: HanafudaCard | null = null
    /** In-progress report accumulated across the choice sub-phases. */
    private draftReport: TurnReport | null = null

    private readonly random: () => number

    constructor(random: () => number = Math.random) {
        this.random = random
        this.startMatch()
    }

    startMatch(): void {
        this.round = 1
        this.scores = { player: [], bot: [] }
        this.results = []
        this.matchWinner = undefined
        this.startRound()
    }

    /** Deals 8/8/8 and hands the lead to the round's dealer. */
    startRound(): void {
        this.dealer = this.round % 2 === 1 ? "player" : "bot"
        this.deck = shuffled(DECK, this.random)
        this.hands = { player: this.deck.splice(0, HAND_SIZE), bot: this.deck.splice(0, HAND_SIZE) }
        this.field = this.deck.splice(0, FIELD_SIZE)
        this.captured = { player: [], bot: [] }
        this.koiKoiCalled = { player: false, bot: false }
        this.bankedPoints = { player: 0, bot: 0 }
        this.pendingHandCard = null
        this.pendingDrawnCard = null
        this.draftReport = null
        this.lastReport = null
        this.turn = this.dealer
        this.phase = this.dealer === "player" ? "selectHand" : "botTurn"
    }

    startNextRound(): void {
        if (this.phase !== "roundOver") {
            return
        }
        this.round += 1
        this.startRound()
    }

    /** Field cards the given card would capture (same month). */
    fieldMatches(card: HanafudaCard): HanafudaCard[] {
        return this.field.filter((fieldCard) => fieldCard.month === card.month)
    }

    /**
     * Test hook: replaces the shuffled deal with an arranged one. `deck` is
     * consumed front-first: 8 player hand, 8 bot hand, 8 field, 24 draw pile.
     */
    dealArranged(deck: HanafudaCard[]): void {
        this.deck = [...deck]
        this.hands = { player: this.deck.splice(0, HAND_SIZE), bot: this.deck.splice(0, HAND_SIZE) }
        this.field = this.deck.splice(0, FIELD_SIZE)
        this.captured = { player: [], bot: [] }
        this.koiKoiCalled = { player: false, bot: false }
        this.bankedPoints = { player: 0, bot: 0 }
        this.turn = this.dealer
        this.phase = this.dealer === "player" ? "selectHand" : "botTurn"
    }

    /**
     * Player plays a hand card. If it matches exactly two field cards the
     * engine parks in `chooseFieldForHand` until `resolveFieldChoice` names
     * one; otherwise the play (and then the deck flip) resolve immediately.
     */
    playHandCard(cardId: number): void {
        if (this.phase !== "selectHand" || this.turn !== "player") {
            return
        }
        const index = this.hands.player.findIndex((card) => card.id === cardId)
        if (index === -1) {
            return
        }
        const card = this.hands.player[index]
        const matches = this.fieldMatches(card)
        if (matches.length === 2) {
            this.hands.player.splice(index, 1)
            this.pendingHandCard = card
            this.phase = "chooseFieldForHand"
            return
        }
        this.hands.player.splice(index, 1)
        const capturedNow = this.placeCard("player", card, matches)
        this.beginDraft("player", card, capturedNow)
        this.flipDeckCard("player")
    }

    /** Resolves a two-way field choice for either the hand play or the flip. */
    resolveFieldChoice(fieldCardId: number): void {
        if (this.phase === "chooseFieldForHand" && this.pendingHandCard) {
            const target = this.field.find((card) => card.id === fieldCardId)
            if (!target || target.month !== this.pendingHandCard.month) {
                return
            }
            const card = this.pendingHandCard
            this.pendingHandCard = null
            const capturedNow = this.placeCard("player", card, [target])
            this.beginDraft("player", card, capturedNow)
            this.flipDeckCard("player")
        } else if (this.phase === "chooseFieldForDraw" && this.pendingDrawnCard && this.draftReport) {
            const target = this.field.find((card) => card.id === fieldCardId)
            if (!target || target.month !== this.pendingDrawnCard.month) {
                return
            }
            const drawn = this.pendingDrawnCard
            this.pendingDrawnCard = null
            const capturedNow = this.placeCard("player", drawn, [target])
            this.draftReport.drawn = drawn
            this.draftReport.drawnCaptured = capturedNow
            this.finishTurn("player")
        }
    }

    /** Player elects to keep going after forming a yaku. */
    declareKoiKoi(): void {
        if (this.phase !== "decision") {
            return
        }
        this.koiKoiCalled.player = true
        this.bankedPoints.player = yakuPoints(evaluateYaku(this.captured.player))
        this.passTurn("player")
    }

    /** Player banks the round. */
    declareShobu(): void {
        if (this.phase !== "decision") {
            return
        }
        this.endRound("player")
    }

    /**
     * Runs the bot's whole turn: pick the best play, resolve any two-way
     * choice greedily, flip the deck card, then make its own koi-koi/shobu
     * call. Returns the report (also stored in `lastReport`).
     */
    botTakeTurn(): TurnReport | null {
        if (this.phase !== "botTurn" || this.turn !== "bot") {
            return null
        }
        const play = chooseBotPlay(this.hands.bot, this.field, this.captured.bot, this.captured.player)
        const index = this.hands.bot.findIndex((card) => card.id === play.card.id)
        this.hands.bot.splice(index, 1)
        const capturedNow = this.placeCard("bot", play.card, play.targets)
        this.beginDraft("bot", play.card, capturedNow)
        this.flipDeckCard("bot")
        return this.lastReport
    }

    // -- internals ----------------------------------------------------------

    private beginDraft(seat: Seat, played: HanafudaCard, playedCaptured: HanafudaCard[]): void {
        this.draftReport = {
            seat,
            played,
            playedCaptured,
            drawn: null,
            drawnCaptured: [],
            newYaku: [],
        }
    }

    /**
     * Places a card against the chosen field targets: captures the pair (or
     * all four on a triple month match), or lays the card on the field.
     * Returns the cards that entered the capture pile.
     */
    private placeCard(seat: Seat, card: HanafudaCard, targets: HanafudaCard[]): HanafudaCard[] {
        if (targets.length === 0) {
            this.field.push(card)
            return []
        }
        // A triple month match sweeps all three field cards with the fourth.
        const taken = targets.length >= 3 ? this.fieldMatches(card) : [targets[0]]
        this.field = this.field.filter((fieldCard) => !taken.some((t) => t.id === fieldCard.id))
        const capturedNow = [card, ...taken]
        this.captured[seat].push(...capturedNow)
        return capturedNow
    }

    /** Flips the top deck card and resolves it (or parks on a player choice). */
    private flipDeckCard(seat: Seat): void {
        const drawn = this.deck.shift()
        if (!drawn || !this.draftReport) {
            this.finishTurn(seat)
            return
        }
        const matches = this.fieldMatches(drawn)
        if (matches.length === 2) {
            if (seat === "player") {
                this.pendingDrawnCard = drawn
                this.phase = "chooseFieldForDraw"
                return
            }
            // Bot resolves its own choice greedily: take the richer card.
            const best = matches.reduce((a, b) =>
                captureValue(b, this.captured.bot) + denyValue(b, this.captured.player) >
                captureValue(a, this.captured.bot) + denyValue(a, this.captured.player)
                    ? b
                    : a,
            )
            const capturedNow = this.placeCard(seat, drawn, [best])
            this.draftReport.drawn = drawn
            this.draftReport.drawnCaptured = capturedNow
            this.finishTurn(seat)
            return
        }
        const capturedNow = this.placeCard(seat, drawn, matches)
        this.draftReport.drawn = drawn
        this.draftReport.drawnCaptured = capturedNow
        this.finishTurn(seat)
    }

    /**
     * Closes out a turn: detect newly formed yaku, run the decision (player
     * prompt / bot heuristic), and otherwise pass play or end a drawn round.
     */
    private finishTurn(seat: Seat): void {
        const report = this.draftReport
        this.draftReport = null
        if (!report) {
            return
        }
        const yaku = evaluateYaku(this.captured[seat])
        const points = yakuPoints(yaku)
        if (points > this.bankedPoints[seat]) {
            report.newYaku = yaku
            if (this.hands[seat].length === 0) {
                // No cards left to koi-koi with: the yaku auto-banks.
                report.botDecision = seat === "bot" ? "shobu" : undefined
                this.lastReport = report
                this.endRound(seat)
                return
            }
            if (seat === "player") {
                this.lastReport = report
                this.phase = "decision"
                return
            }
            const decision = chooseBotDecision(
                points,
                this.hands.bot.length,
                this.captured.bot,
                this.captured.player,
            )
            report.botDecision = decision
            this.lastReport = report
            if (decision === "shobu") {
                this.endRound("bot")
                return
            }
            this.koiKoiCalled.bot = true
            this.bankedPoints.bot = points
            this.passTurn(seat)
            return
        }
        this.lastReport = report
        this.passTurn(seat)
    }

    private passTurn(seat: Seat): void {
        if (this.hands.player.length === 0 && this.hands.bot.length === 0) {
            this.endRound(null)
            return
        }
        const next = opponentOf(seat)
        this.turn = next
        this.phase = next === "player" ? "selectHand" : "botTurn"
    }

    /** Banks the round for `winner` (null = drawn round) and advances phases. */
    private endRound(winner: Seat | null): void {
        let result: RoundResult
        if (winner) {
            const yaku = evaluateYaku(this.captured[winner])
            const basePoints = yakuPoints(yaku)
            const score = roundScore(basePoints, this.koiKoiCalled[opponentOf(winner)])
            this.scores[winner].push(score)
            this.scores[opponentOf(winner)].push(0)
            result = { round: this.round, winner, yaku, basePoints, score }
        } else {
            this.scores.player.push(0)
            this.scores.bot.push(0)
            result = { round: this.round, winner: null, yaku: [], basePoints: 0, score: 0 }
        }
        this.results.push(result)
        if (this.round >= TOTAL_ROUNDS) {
            const playerTotal = totalScore(this.scores.player)
            const botTotal = totalScore(this.scores.bot)
            this.matchWinner = playerTotal === botTotal ? null : playerTotal > botTotal ? "player" : "bot"
            this.phase = "matchOver"
        } else {
            this.phase = "roundOver"
        }
    }
}

export function totalScore(scores: number[]): number {
    return scores.reduce((sum, value) => sum + value, 0)
}

/** Fisher-Yates over a copy, using the injected random source. */
function shuffled(cards: readonly HanafudaCard[], random: () => number): HanafudaCard[] {
    const deck = [...cards]
    for (let i = deck.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1))
        ;[deck[i], deck[j]] = [deck[j], deck[i]]
    }
    return deck
}

// ---------------------------------------------------------------------------
// Bot AI
// ---------------------------------------------------------------------------
// Heuristic, deterministic (no randomness) so all three platforms make the
// same call from the same position: value captures by how far they advance
// the bot's closest yaku, add a denial bonus for cards the player's visible
// pile is obviously building toward, and prefer shobu once the hand is big
// or the player looks threatening.

interface BotPlay {
    card: HanafudaCard
    targets: HanafudaCard[]
}

/**
 * How much capturing `card` advances the pile: a base value per kind plus
 * bonuses for every partially-collected yaku the card belongs to.
 */
export function captureValue(card: HanafudaCard, captured: HanafudaCard[]): number {
    const ids = new Set(captured.map((item) => item.id))
    let value = card.kind === "bright" ? 10 : card.kind === "animal" ? 4 : card.kind === "ribbon" ? 3 : 1

    if (card.kind === "bright") {
        const brightsHeld = captured.filter((item) => item.kind === "bright").length
        value += brightsHeld * 3
    }
    if (card.id === SAKE_CUP_ID) {
        value += 4 // hanami/tsukimi hinge card
        if (ids.has(CURTAIN_ID) || ids.has(MOON_ID)) {
            value += 5
        }
    }
    if ((card.id === CURTAIN_ID || card.id === MOON_ID) && ids.has(SAKE_CUP_ID)) {
        value += 5
    }
    const trio = [BOAR_ID, DEER_ID, BUTTERFLIES_ID]
    if (trio.includes(card.id)) {
        value += trio.filter((id) => ids.has(id)).length * 3
    }
    if (card.ribbon === "poetry" || card.ribbon === "blue") {
        const sameColor = captured.filter((item) => item.ribbon === card.ribbon).length
        value += sameColor * 2
    }
    return value
}

/**
 * Denial bonus: how much the *player* would want this card, judged from
 * their public capture pile. The bot leans toward taking those first.
 */
export function denyValue(card: HanafudaCard, playerCaptured: HanafudaCard[]): number {
    const value = captureValue(card, playerCaptured)
    const baseline = captureValue(card, [])
    return Math.max(0, value - baseline)
}

/**
 * Picks the bot's hand play: the capture maximizing advance + denial, or —
 * with no capture available — the discard that risks the least (low value
 * and few live cards of its month left unseen).
 */
export function chooseBotPlay(
    hand: HanafudaCard[],
    field: HanafudaCard[],
    botCaptured: HanafudaCard[],
    playerCaptured: HanafudaCard[],
): BotPlay {
    let best: BotPlay | null = null
    let bestValue = -Infinity
    for (const card of hand) {
        const matches = field.filter((fieldCard) => fieldCard.month === card.month)
        if (matches.length === 0) {
            continue
        }
        if (matches.length >= 3) {
            const value = matches.reduce(
                (sum, target) => sum + captureValue(target, botCaptured) + denyValue(target, playerCaptured),
                captureValue(card, botCaptured),
            )
            if (value > bestValue) {
                bestValue = value
                best = { card, targets: matches }
            }
            continue
        }
        for (const target of matches) {
            const value =
                captureValue(card, botCaptured) +
                captureValue(target, botCaptured) +
                denyValue(target, playerCaptured)
            if (value > bestValue) {
                bestValue = value
                best = { card, targets: [target] }
            }
        }
    }
    if (best) {
        return best
    }

    // No captures: discard the card whose loss (own value + what it could
    // hand the player) is smallest.
    let discard = hand[0]
    let discardRisk = Infinity
    for (const card of hand) {
        const risk = captureValue(card, botCaptured) + denyValue(card, playerCaptured)
        if (risk < discardRisk) {
            discardRisk = risk
            discard = card
        }
    }
    return { card: discard, targets: [] }
}

/**
 * One capture away from a listed yaku? Used both for the bot's own ambition
 * (keep going) and to read the player as a threat (bank now).
 */
export function isCloseToYaku(captured: HanafudaCard[]): boolean {
    const ids = new Set(captured.map((card) => card.id))
    const dryBrights = captured.filter((card) => card.kind === "bright" && card.id !== RAIN_MAN_ID).length
    const poetry = captured.filter((card) => card.ribbon === "poetry").length
    const blue = captured.filter((card) => card.ribbon === "blue").length
    const ribbons = captured.filter((card) => card.kind === "ribbon").length
    const animals = captured.filter((card) => card.kind === "animal").length
    const chaff = captured.filter((card) => card.kind === "chaff").length
    const trioHeld = [BOAR_ID, DEER_ID, BUTTERFLIES_ID].filter((id) => ids.has(id)).length
    const hasSake = ids.has(SAKE_CUP_ID)
    return (
        dryBrights === 2 ||
        poetry === 2 ||
        blue === 2 ||
        trioHeld === 2 ||
        ribbons === 4 ||
        animals === 4 ||
        chaff === 9 ||
        (hasSake && (!ids.has(CURTAIN_ID) || !ids.has(MOON_ID))) ||
        (!hasSake && (ids.has(CURTAIN_ID) || ids.has(MOON_ID)))
    )
}

/**
 * The bot's koi-koi/shobu call after forming a yaku: bank big hands and
 * threatened positions; press on only with cards in hand and a bigger yaku
 * in sight.
 */
export function chooseBotDecision(
    points: number,
    handSize: number,
    botCaptured: HanafudaCard[],
    playerCaptured: HanafudaCard[],
): "koikoi" | "shobu" {
    if (points >= BIG_HAND_THRESHOLD) {
        return "shobu"
    }
    if (handSize <= 1) {
        return "shobu"
    }
    if (isCloseToYaku(playerCaptured)) {
        return "shobu"
    }
    return isCloseToYaku(botCaptured) ? "koikoi" : "shobu"
}
