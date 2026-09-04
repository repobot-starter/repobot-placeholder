// Pure Truco Paulista rules engine: deck, manilha ordering, the trick/hand/game
// state machine, the truco raise ladder, and the bluffing bot. No React, no
// network, no assets — the page (and the native ports) only render this state
// and forward user intents.
//
// The iOS (`ios/App/View/Games/Truco/TrucoEngine.swift`) and Android
// (`android/.../view/games/truco/TrucoEngine.kt`) engines mirror this file's
// rank tables, thresholds, and state machine exactly; change them together.

/** Suits, listed in manilha order (weakest to strongest): ♦ < ♠ < ♥ < ♣. */
export type Suit = "diamonds" | "spades" | "hearts" | "clubs"

/** The 10 truco ranks (no 8/9/10 in the 40-card deck). */
export type Rank = "4" | "5" | "6" | "7" | "Q" | "J" | "K" | "A" | "2" | "3"

export interface Card {
    rank: Rank
    suit: Suit
}

/** Plain-card order, weakest to strongest: 4 5 6 7 Q J K A 2 3. */
export const RANK_ORDER: readonly Rank[] = ["4", "5", "6", "7", "Q", "J", "K", "A", "2", "3"]

/** Manilha suit order, weakest to strongest: ouros, espadas, copas, zap. */
export const MANILHA_SUIT_ORDER: readonly Suit[] = ["diamonds", "spades", "hearts", "clubs"]

export const SUIT_SYMBOL: Record<Suit, string> = {
    diamonds: "♦",
    spades: "♠",
    hearts: "♥",
    clubs: "♣",
}

/** The raise ladder: 1 (hand) → 3 (Truco) → 6 (Seis) → 9 (Nove) → 12 (Doze). */
export const STAKE_LADDER: readonly number[] = [1, 3, 6, 9, 12]

/** Portuguese announcement for each raised stake. */
export const RAISE_CALL: Record<number, string> = {
    3: "Truco!",
    6: "Seis!",
    9: "Nove!",
    12: "Doze!",
}

/** First to this many points wins the game (and triggers mão de onze at 11). */
export const WINNING_SCORE = 12

// Table-talk lines the bot picks from (via the injected RNG).
const ACCEPT_LINES = ["Cai dentro!", "Bora, então!", "Segura essa!"]
const FOLD_LINES = ["Corro!", "Tô fora...", "Fica pra ti."]
const HAND_WIN_LINES = ["É nóis!", "O boteco é meu!", "Mais uma pro bot!"]
const HAND_LOSE_LINES = ["Ah, não...", "Sorte sua, hein.", "Essa doeu."]
const MAO_DE_ONZE_PLAY_LINES = ["Na mão de onze eu vou!", "Confia no bot."]

export type Seat = "player" | "bot"

/** Outcome of one trick: a winner, or a tie ("empate"). */
export type TrickResult = Seat | "tie"

export type Phase =
    | "maoDeOnze" // player sits at 11: choose play (worth 3) or fold (bot +1)
    | "playerTurn"
    | "botTurn"
    | "respond" // the bot raised: player must accept / re-raise / fold
    | "handOver" // hand settled: call startHand() for the next deal
    | "gameOver" // someone reached 12: call newGame()

export type RaiseResponse = "accept" | "raise" | "fold"

/** Discrete things an action caused, for speech bubbles / sounds / tests. */
export type TrucoEvent =
    | { type: "handStarted" }
    | { type: "botSpoke"; line: string }
    | { type: "botPlayed"; card: Card }
    | { type: "trickResolved"; result: TrickResult }
    | { type: "botRaised"; toStake: number }
    | { type: "botAccepted"; stake: number }
    | { type: "botFolded" }
    | { type: "handEnded"; winner: Seat; points: number }
    | { type: "gameEnded"; winner: Seat }

/** Both cards of a resolved trick, kept so the UI can linger on the reveal. */
export interface ResolvedTrick {
    playerCard: Card
    botCard: Card
    result: TrickResult
}

/** Builds the 40-card truco deck in a deterministic order (shuffle separately). */
export function buildDeck(): Card[] {
    const deck: Card[] = []
    for (const suit of MANILHA_SUIT_ORDER) {
        for (const rank of RANK_ORDER) {
            deck.push({ rank, suit })
        }
    }
    return deck
}

/** The manilha rank is the rank above the vira, wrapping 3 → 4. */
export function manilhaRankFor(viraRank: Rank): Rank {
    const index = RANK_ORDER.indexOf(viraRank)
    return RANK_ORDER[(index + 1) % RANK_ORDER.length]
}

/**
 * Total ordering used to resolve tricks. Plain cards score their rank index
 * (0..9) — equal ranks tie regardless of suit. Manilhas score 100 + suit
 * order, so any manilha beats any plain card and manilhas never tie.
 */
export function cardStrength(card: Card, manilhaRank: Rank): number {
    if (card.rank === manilhaRank) {
        return 100 + MANILHA_SUIT_ORDER.indexOf(card.suit)
    }
    return RANK_ORDER.indexOf(card.rank)
}

/** Next rung of the raise ladder, or null when the stake is already 12. */
export function nextStake(stake: number): number | null {
    const index = STAKE_LADDER.indexOf(stake)
    return index >= 0 && index < STAKE_LADDER.length - 1 ? STAKE_LADDER[index + 1] : null
}

/**
 * 0..1 hand-strength score the bot bets with: each card is worth its rank
 * index scaled to 0..0.75, or 0.85 + 0.05·suit for a manilha (so zap = 1.0).
 * The best card dominates (70%) with the rest as support (30%).
 */
export function handStrength(cards: Card[], manilhaRank: Rank): number {
    if (cards.length === 0) {
        return 0
    }
    const points = cards
        .map((card) =>
            card.rank === manilhaRank
                ? 0.85 + 0.05 * MANILHA_SUIT_ORDER.indexOf(card.suit)
                : RANK_ORDER.indexOf(card.rank) / 12,
        )
        .sort((a, b) => b - a)
    const support =
        points.length > 1 ? points.slice(1).reduce((sum, value) => sum + value, 0) / (points.length - 1) : 0
    return 0.7 * points[0] + 0.3 * support
}

// Bot decision thresholds — mirrored verbatim by the native engines.
const BOT_RERAISE_STRENGTH = 0.72
const BOT_ACCEPT_STRENGTH = 0.45
const BOT_MAO_DE_ONZE_STRENGTH = 0.5

export interface TrucoEngineOptions {
    /** Bluff rate 0..1 — the "Cara de pau" slider (honest → shameless). */
    bluff?: number
    /** Injectable RNG so tests are deterministic. */
    rng?: () => number
}

/**
 * The full game state machine. Mutating methods return the `TrucoEvent`s they
 * caused; renderers read the public fields afterwards. Turn timing (delays
 * before the bot acts, trick-reveal pauses) is the caller's job — the engine
 * is synchronous and never schedules anything.
 */
export class TrucoEngine {
    /** Bluff rate 0..1; safe to change between (or during) hands. */
    bluff: number

    playerScore = 0
    botScore = 0
    gameWinner: Seat | null = null

    phase: Phase = "handOver"
    playerHand: Card[] = []
    botHand: Card[] = []
    vira: Card = { rank: "4", suit: "diamonds" }
    manilhaRank: Rank = "5"

    /** Accepted stake for this hand (what a fold concedes right now). */
    stake = 1
    /** Pending raise awaiting the player's response (phase === "respond"). */
    proposedStake: number | null = null
    /** Who made the last accepted raise; that seat cannot raise again next. */
    raisedBy: Seat | null = null
    /** True on mão de onze hands: the raise ladder is locked. */
    trucoLocked = false

    /** Who led the first trick of this hand (the "mão"); alternates per hand. */
    handLeader: Seat = "player"
    /** Who leads the current trick (ties keep the same leader). */
    leader: Seat = "player"
    trickResults: TrickResult[] = []
    trickPlays: { player: Card | null; bot: Card | null } = { player: null, bot: null }
    lastTrick: ResolvedTrick | null = null
    handWinner: Seat | null = null
    /** Points the settled hand transferred (for the hand-over banner). */
    handPoints = 0

    private rng: () => number
    /** Alternates the mão between hands; startHand flips it. */
    private nextHandLeader: Seat = "player"

    constructor(options: TrucoEngineOptions = {}) {
        this.bluff = options.bluff ?? 0.35
        this.rng = options.rng ?? Math.random
    }

    /** Full match reset. Call startHand() afterwards to deal. */
    newGame(): TrucoEvent[] {
        this.playerScore = 0
        this.botScore = 0
        this.gameWinner = null
        this.nextHandLeader = "player"
        return this.startHand()
    }

    /**
     * Deals the next hand: shuffles, flips the vira, resets the stake, and
     * runs the mão de onze gate before anyone plays.
     */
    startHand(): TrucoEvent[] {
        if (this.gameWinner !== null) {
            return []
        }
        const deck = buildDeck()
        for (let i = deck.length - 1; i > 0; i -= 1) {
            const j = Math.floor(this.rng() * (i + 1))
            ;[deck[i], deck[j]] = [deck[j], deck[i]]
        }
        this.handLeader = this.nextHandLeader
        this.nextHandLeader = this.nextHandLeader === "player" ? "bot" : "player"
        this.resetHandState(deck.slice(0, 3), deck.slice(3, 6), deck[6])

        const events: TrucoEvent[] = [{ type: "handStarted" }]
        const playerAtEleven = this.playerScore === WINNING_SCORE - 1
        const botAtEleven = this.botScore === WINNING_SCORE - 1
        if (playerAtEleven && botAtEleven) {
            // Simplification (documented in PACK.md): both at 11 plays a
            // normal hand locked at 3 points.
            this.stake = 3
            this.trucoLocked = true
        } else if (playerAtEleven) {
            this.phase = "maoDeOnze"
        } else if (botAtEleven) {
            // The bot decides its own mão de onze immediately.
            const strength = handStrength(this.botHand, this.manilhaRank)
            if (strength >= BOT_MAO_DE_ONZE_STRENGTH || this.rng() < this.bluff) {
                this.stake = 3
                this.trucoLocked = true
                events.push(this.speak(this.pick(MAO_DE_ONZE_PLAY_LINES)))
            } else {
                events.push(this.speak(this.pick(FOLD_LINES)))
                events.push(...this.endHand("player", 1))
            }
        }
        return events
    }

    /** Test/remix hook: pin both hands and the vira, then play normally. */
    setHands(playerHand: Card[], botHand: Card[], vira: Card): void {
        this.resetHandState([...playerHand], [...botHand], vira)
    }

    /** Test/remix hook: set the score line (call before startHand/setHands). */
    setScores(playerScore: number, botScore: number): void {
        this.playerScore = playerScore
        this.botScore = botScore
    }

    /** Mão de onze choice for the player at 11: play at 3, or concede 1. */
    decideMaoDeOnze(play: boolean): TrucoEvent[] {
        if (this.phase !== "maoDeOnze") {
            return []
        }
        if (play) {
            this.stake = 3
            this.trucoLocked = true
            this.phase = this.leader === "player" ? "playerTurn" : "botTurn"
            return []
        }
        return this.endHand("bot", 1)
    }

    /** Whether `seat` could legally raise right now (their turn to act). */
    canRaise(seat: Seat): boolean {
        const myTurn = this.phase === (seat === "player" ? "playerTurn" : "botTurn")
        return myTurn && !this.trucoLocked && this.raisedBy !== seat && nextStake(this.stake) !== null
    }

    /** Player plays their hand card at `index` (phase must be playerTurn). */
    playCard(index: number): TrucoEvent[] {
        if (this.phase !== "playerTurn" || index < 0 || index >= this.playerHand.length) {
            return []
        }
        const [card] = this.playerHand.splice(index, 1)
        this.trickPlays.player = card
        if (this.trickPlays.bot !== null) {
            return this.resolveTrick()
        }
        this.phase = "botTurn"
        return []
    }

    /**
     * The bot takes its turn: it may call a raise (ending the action — the
     * player must respond), otherwise it plays a card.
     */
    botAct(): TrucoEvent[] {
        if (this.phase !== "botTurn") {
            return []
        }
        const strength = handStrength(this.botHand, this.manilhaRank)
        if (this.canRaise("bot")) {
            // Call proportionally to strength, plus a bluff kicker.
            const urge = Math.min(1, Math.max(0, (strength - 0.5) * 1.6)) * 0.8 + this.bluff * 0.25
            if (this.rng() < urge) {
                const proposed = nextStake(this.stake) as number
                this.proposedStake = proposed
                this.phase = "respond"
                return [this.speak(RAISE_CALL[proposed]), { type: "botRaised", toStake: proposed }]
            }
        }
        const card = this.chooseBotCard()
        this.botHand.splice(this.botHand.indexOf(card), 1)
        this.trickPlays.bot = card
        const events: TrucoEvent[] = [{ type: "botPlayed", card }]
        if (this.trickPlays.player !== null) {
            events.push(...this.resolveTrick())
        } else {
            this.phase = "playerTurn"
        }
        return events
    }

    /**
     * Player calls the next rung (Truco/Seis/Nove/Doze). The bot answers
     * immediately: fold (player wins the pre-raise stake), accept, or
     * re-raise (which puts the player in the "respond" phase).
     */
    playerCallRaise(): TrucoEvent[] {
        if (!this.canRaise("player")) {
            return []
        }
        const proposed = nextStake(this.stake) as number
        return this.botAnswerRaise(proposed)
    }

    /** Player answers a pending bot raise (phase must be "respond"). */
    respondToRaise(response: RaiseResponse): TrucoEvent[] {
        if (this.phase !== "respond" || this.proposedStake === null) {
            return []
        }
        const proposed = this.proposedStake
        if (response === "fold") {
            // "Correr": concede the stake that was in force before the raise.
            this.proposedStake = null
            return this.endHand("bot", this.stake)
        }
        // Accepting (or re-raising, which implies acceptance) locks in the
        // proposed stake; the bot made this raise so it cannot raise next.
        this.stake = proposed
        this.raisedBy = "bot"
        this.proposedStake = null
        if (response === "accept") {
            this.resumeAfterRaise()
            return []
        }
        const higher = nextStake(this.stake)
        if (higher === null) {
            this.resumeAfterRaise()
            return []
        }
        return this.botAnswerRaise(higher)
    }

    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------

    private resetHandState(playerHand: Card[], botHand: Card[], vira: Card): void {
        this.playerHand = playerHand
        this.botHand = botHand
        this.vira = vira
        this.manilhaRank = manilhaRankFor(vira.rank)
        this.stake = 1
        this.proposedStake = null
        this.raisedBy = null
        this.trucoLocked = false
        this.leader = this.handLeader
        this.trickResults = []
        this.trickPlays = { player: null, bot: null }
        this.lastTrick = null
        this.handWinner = null
        this.handPoints = 0
        this.phase = this.leader === "player" ? "playerTurn" : "botTurn"
    }

    /** The bot answers a raise proposed by the player (call or re-raise). */
    private botAnswerRaise(proposed: number): TrucoEvent[] {
        const strength = handStrength(this.botHand, this.manilhaRank)
        const bluffing = this.rng() < this.bluff * 0.5
        if (strength >= BOT_RERAISE_STRENGTH || (bluffing && this.rng() < 0.5)) {
            // Accept the player's raise; re-raise on top if the ladder allows.
            this.stake = proposed
            this.raisedBy = "player"
            const higher = nextStake(this.stake)
            if (higher !== null) {
                this.proposedStake = higher
                this.phase = "respond"
                return [this.speak(RAISE_CALL[higher]), { type: "botRaised", toStake: higher }]
            }
            this.resumeAfterRaise()
            return [this.speak(this.pick(ACCEPT_LINES)), { type: "botAccepted", stake: this.stake }]
        }
        if (strength >= BOT_ACCEPT_STRENGTH || bluffing) {
            this.stake = proposed
            this.raisedBy = "player"
            this.resumeAfterRaise()
            return [this.speak(this.pick(ACCEPT_LINES)), { type: "botAccepted", stake: this.stake }]
        }
        // Fold: the raiser wins the stake in force before this raise.
        const events: TrucoEvent[] = [this.speak(this.pick(FOLD_LINES)), { type: "botFolded" }]
        events.push(...this.endHand("player", this.stake))
        return events
    }

    /** After a raise settles, play resumes with whoever still has to act. */
    private resumeAfterRaise(): void {
        if (this.trickPlays.player !== null && this.trickPlays.bot === null) {
            this.phase = "botTurn"
        } else if (this.trickPlays.bot !== null && this.trickPlays.player === null) {
            this.phase = "playerTurn"
        } else {
            this.phase = this.leader === "player" ? "playerTurn" : "botTurn"
        }
    }

    /**
     * Bot card choice. Leading: strongest card with a strong hand, weakest
     * otherwise. Following: the cheapest card that wins the trick, else the
     * weakest card (dumping).
     */
    private chooseBotCard(): Card {
        const byStrength = [...this.botHand].sort(
            (a, b) => cardStrength(a, this.manilhaRank) - cardStrength(b, this.manilhaRank),
        )
        const playerCard = this.trickPlays.player
        if (playerCard === null) {
            const strength = handStrength(this.botHand, this.manilhaRank)
            return strength >= 0.55 ? byStrength[byStrength.length - 1] : byStrength[0]
        }
        const target = cardStrength(playerCard, this.manilhaRank)
        const winning = byStrength.find((card) => cardStrength(card, this.manilhaRank) > target)
        return winning ?? byStrength[0]
    }

    /** Resolves a completed trick and, when decisive, the hand and game. */
    private resolveTrick(): TrucoEvent[] {
        const playerCard = this.trickPlays.player as Card
        const botCard = this.trickPlays.bot as Card
        const playerPower = cardStrength(playerCard, this.manilhaRank)
        const botPower = cardStrength(botCard, this.manilhaRank)
        const result: TrickResult = playerPower > botPower ? "player" : botPower > playerPower ? "bot" : "tie"
        this.trickResults.push(result)
        this.lastTrick = { playerCard, botCard, result }
        this.trickPlays = { player: null, bot: null }

        const events: TrucoEvent[] = [{ type: "trickResolved", result }]
        const winner = this.handWinnerFromTricks()
        if (winner !== null) {
            events.push(...this.endHand(winner, this.stake))
            return events
        }
        // Next trick: the winner leads; a tie keeps the same leader.
        if (result !== "tie") {
            this.leader = result
        }
        this.phase = this.leader === "player" ? "playerTurn" : "botTurn"
        return events
    }

    /**
     * Truco Paulista hand resolution with the empate rules:
     * - two clean trick wins take the hand;
     * - once any trick has tied, the winner of the first non-tied trick
     *   takes the hand (tie-then-win, win-then-tie, and win/loss/tie alike);
     * - all three tricks tied: the hand goes to the mão (`handLeader`).
     * Returns null while the hand is still undecided.
     */
    private handWinnerFromTricks(): Seat | null {
        const results = this.trickResults
        const playerWins = results.filter((r) => r === "player").length
        const botWins = results.filter((r) => r === "bot").length
        const ties = results.filter((r) => r === "tie").length
        if (playerWins >= 2) {
            return "player"
        }
        if (botWins >= 2) {
            return "bot"
        }
        if (ties > 0) {
            const firstDecided = results.find((r) => r !== "tie")
            if (firstDecided !== undefined) {
                return firstDecided
            }
            if (results.length === 3) {
                return this.handLeader
            }
        }
        return null
    }

    /** Transfers points, checks for game over, and parks in handOver. */
    private endHand(winner: Seat, points: number): TrucoEvent[] {
        this.handWinner = winner
        this.handPoints = points
        if (winner === "player") {
            this.playerScore = Math.min(WINNING_SCORE, this.playerScore + points)
        } else {
            this.botScore = Math.min(WINNING_SCORE, this.botScore + points)
        }
        const events: TrucoEvent[] = [
            this.speak(this.pick(winner === "bot" ? HAND_WIN_LINES : HAND_LOSE_LINES)),
            { type: "handEnded", winner, points },
        ]
        if (this.playerScore >= WINNING_SCORE || this.botScore >= WINNING_SCORE) {
            this.gameWinner = this.playerScore >= WINNING_SCORE ? "player" : "bot"
            this.phase = "gameOver"
            events.push({ type: "gameEnded", winner: this.gameWinner })
        } else {
            this.phase = "handOver"
        }
        return events
    }

    private speak(line: string): TrucoEvent {
        return { type: "botSpoke", line }
    }

    private pick(lines: string[]): string {
        return lines[Math.min(lines.length - 1, Math.floor(this.rng() * lines.length))]
    }
}
