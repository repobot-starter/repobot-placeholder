// Pure blackjack table logic: shoe building, hand valuation, and the tweakable
// house rules. Everything a remix is likely to touch lives in the constants below.

/** Number of 52-card decks shuffled together into the shoe. */
export const DECK_COUNT = 6

/** The shoe is reshuffled once fewer than this fraction of its cards remain. */
export const RESHUFFLE_FRACTION = 0.25

/** Dealer draws until reaching this total, then stands (on all 17s, soft included). */
export const DEALER_STANDS_ON = 17

/** A natural blackjack pays this multiple of the bet (3:2). */
export const BLACKJACK_PAYOUT = 1.5

/** Bankroll granted to new players (and by the "house credit" reset). */
export const STARTING_BANKROLL = 500

/** Chip buttons offered for building a bet. */
export const CHIP_DENOMINATIONS = [5, 25, 100]

/** localStorage key the bankroll persists under between sessions. */
export const BANKROLL_STORAGE_KEY = "blackjack.bankroll"

export type Suit = "♠" | "♥" | "♦" | "♣"
export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K"

export interface Card {
    rank: Rank
    suit: Suit
}

export type ResultKind = "blackjack" | "win" | "push" | "bust" | "lose"

/** Outcome of a settled hand; `net` is the profit (negative on a loss). */
export interface HandResult {
    kind: ResultKind
    net: number
}

export interface HandTotal {
    total: number
    /** True when an ace is currently counted as 11 (e.g. A+6 is "soft 17"). */
    soft: boolean
}

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"]
const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

/** Builds a freshly shuffled shoe of `DECK_COUNT` decks. */
export function buildShoe(): Card[] {
    const shoe: Card[] = []
    for (let deck = 0; deck < DECK_COUNT; deck += 1) {
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                shoe.push({ rank, suit })
            }
        }
    }
    // Fisher-Yates shuffle.
    for (let i = shoe.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shoe[i], shoe[j]] = [shoe[j], shoe[i]]
    }
    return shoe
}

export function isRed(card: Card): boolean {
    return card.suit === "♥" || card.suit === "♦"
}

function rankValue(rank: Rank): number {
    if (rank === "A") {
        return 11
    }
    if (rank === "K" || rank === "Q" || rank === "J") {
        return 10
    }
    return Number(rank)
}

/** Best total for a hand, counting aces as 11 where possible without busting. */
export function handTotal(cards: Card[]): HandTotal {
    let total = 0
    let elevenAces = 0
    for (const card of cards) {
        total += rankValue(card.rank)
        if (card.rank === "A") {
            elevenAces += 1
        }
    }
    while (total > 21 && elevenAces > 0) {
        total -= 10
        elevenAces -= 1
    }
    return { total, soft: elevenAces > 0 }
}

/** Human-friendly total, e.g. "17" or "soft 17". */
export function formatTotal(cards: Card[]): string {
    const { total, soft } = handTotal(cards)
    return soft ? `soft ${total}` : String(total)
}

/** A natural: 21 from the first two cards. */
export function isBlackjack(cards: Card[]): boolean {
    return cards.length === 2 && handTotal(cards).total === 21
}

/** Formats a dollar amount, keeping cents only when needed (3:2 payouts on odd bets). */
export function formatMoney(amount: number): string {
    return Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`
}
