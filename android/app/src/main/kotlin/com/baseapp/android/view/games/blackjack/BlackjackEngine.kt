package com.baseapp.android.view.games.blackjack

import kotlin.math.max
import kotlin.random.Random

/**
 * Pure Kotlin port of the web blackjack table
 * (`web/app/src/View/Games/Blackjack/cards.ts` plus the game flow in
 * `BlackjackPage.tsx`) so the exact same rules run on every platform and can
 * be unit-tested on the JVM. No Android or Compose imports here — rendering,
 * pacing, and persistence live in `BlackjackGameView`.
 *
 * Rules, in lockstep with the web constants: six-deck shoe reshuffled once
 * 25% or fewer cards remain, dealer stands on all 17s (soft included — the
 * draw condition is `total < 17`, and a soft 17 already totals 17), natural
 * blackjack pays 3:2, double down on the first two cards doubles the bet and
 * draws exactly one card.
 *
 * Randomness (the Fisher-Yates shuffle) goes through an injected [Random] so
 * tests can make deals fully deterministic.
 */
class BlackjackEngine(
    /** Opening cash; the view passes the persisted value. */
    bankroll: Double = STARTING_BANKROLL,
    private val random: Random = Random.Default,
) {
    /** Card suits; [symbol] is the glyph the web renders on each card face. */
    enum class Suit(val symbol: String) {
        SPADES("♠"),
        HEARTS("♥"),
        DIAMONDS("♦"),
        CLUBS("♣");

        /** Hearts and diamonds print red, like the web `isRed`. */
        val isRed: Boolean
            get() = this == HEARTS || this == DIAMONDS
    }

    /**
     * Card ranks in the order the web builds each deck (A first, K last); the
     * build order makes shuffles reproducible across platforms under the same
     * RNG sequence. [value] is the blackjack value — aces count 11 here and
     * are demoted to 1 by [handTotal] when the hand would otherwise bust.
     */
    enum class Rank(val symbol: String, val value: Int) {
        ACE("A", 11),
        TWO("2", 2),
        THREE("3", 3),
        FOUR("4", 4),
        FIVE("5", 5),
        SIX("6", 6),
        SEVEN("7", 7),
        EIGHT("8", 8),
        NINE("9", 9),
        TEN("10", 10),
        JACK("J", 10),
        QUEEN("Q", 10),
        KING("K", 10),
    }

    data class Card(val rank: Rank, val suit: Suit) {
        val isRed: Boolean
            get() = suit.isRed
    }

    /**
     * Best total for a hand plus whether an ace is currently counted as 11
     * (e.g. A+6 is "soft 17") — the web `HandTotal`.
     */
    data class HandTotal(val total: Int, val soft: Boolean)

    enum class ResultKind { BLACKJACK, WIN, PUSH, BUST, LOSE }

    /** Outcome of a settled hand; [net] is the profit (negative on a loss). */
    data class HandResult(val kind: ResultKind, val net: Double)

    /**
     * Where the hand currently is. The web also has a transient "dealing"
     * phase for its deal choreography; the engine settles synchronously and
     * leaves pacing (card-by-card reveals, dealer draw delays) to the view.
     */
    enum class Phase { BETTING, PLAYER, DEALER, SETTLED }

    /** Per-session table stats, the native twin of the web stats panel. */
    data class SessionStats(
        val hands: Int = 0,
        val wins: Int = 0,
        val pushes: Int = 0,
        val biggestWin: Double = 0.0,
    )

    /**
     * Cash on hand. Fractional cents appear only from 3:2 payouts on odd bets
     * (e.g. a $5 natural pays $7.50), exactly like the web.
     */
    var bankroll: Double = bankroll
        private set

    /** Current wager. Doubles in place on double down, like the web `bet`. */
    var bet: Int = 0
        private set
    var phase: Phase = Phase.BETTING
        private set
    var playerCards: List<Card> = emptyList()
        private set
    var dealerCards: List<Card> = emptyList()
        private set

    /** While true the dealer's second card renders face-down. */
    var holeHidden: Boolean = true
        private set
    var result: HandResult? = null
        private set
    var stats: SessionStats = SessionStats()
        private set

    /**
     * Incremented on every reshuffle; the view watches it to flash the
     * "shuffling the shoe" note, tests use it to assert the reshuffle point.
     */
    var shuffleCount: Int = 0
        private set

    /**
     * Cards remaining; drawn from the end like the web `shoe.pop()`. Starts
     * empty so the very first draw triggers a shuffle, mirroring the web ref.
     */
    private var shoe: MutableList<Card> = mutableListOf()

    val shoeCount: Int
        get() = shoe.size

    /** Web `broke`: nothing left to bet with — offer the house credit reset. */
    val isBroke: Boolean
        get() = bankroll == 0.0 && bet == 0

    /**
     * Web `canDouble`: first decision of the hand, and the bankroll can cover
     * a second stake of the same size.
     */
    val canDouble: Boolean
        get() = phase == Phase.PLAYER && playerCards.size == 2 && bankroll >= bet

    // ------------------------------------------------------------------
    // Betting
    // ------------------------------------------------------------------

    /**
     * Adds a chip to the wager. Ignored unless betting and the bankroll
     * covers the raised bet — the conditions that disable the web chips.
     */
    fun addChip(denomination: Int) {
        if (phase != Phase.BETTING || bet + denomination > bankroll) {
            return
        }
        bet += denomination
    }

    fun clearBet() {
        if (phase != Phase.BETTING) {
            return
        }
        bet = 0
    }

    /** Web "house credit": resets an empty bankroll to the starting stake. */
    fun takeHouseCredit() {
        if (phase != Phase.BETTING || !isBroke) {
            return
        }
        bankroll = STARTING_BANKROLL
    }

    // ------------------------------------------------------------------
    // Hand flow
    // ------------------------------------------------------------------

    /**
     * Takes the bet and deals in casino order: player, dealer up, player,
     * dealer hole. Naturals settle immediately (hole revealed); otherwise the
     * hand moves to the player's decision.
     */
    fun deal() {
        if (phase != Phase.BETTING || bet == 0) {
            return
        }
        bankroll -= bet
        result = null
        holeHidden = true

        val first = drawCard()
        val upcard = drawCard()
        val second = drawCard()
        val hole = drawCard()
        playerCards = listOf(first, second)
        dealerCards = listOf(upcard, hole)

        if (isBlackjack(playerCards) || isBlackjack(dealerCards)) {
            holeHidden = false
            settle()
        } else {
            phase = Phase.PLAYER
        }
    }

    /**
     * Draws one card. Busting settles immediately against the dealer's dealt
     * hand (the dealer never draws into a busted player, like web
     * `settleBust`); landing exactly on 21 auto-stands into the dealer turn.
     */
    fun hit() {
        if (phase != Phase.PLAYER) {
            return
        }
        playerCards = playerCards + drawCard()
        val total = handTotal(playerCards).total
        if (total > 21) {
            holeHidden = false
            settle()
        } else if (total == 21) {
            beginDealerTurn()
        }
    }

    fun stand() {
        if (phase != Phase.PLAYER) {
            return
        }
        beginDealerTurn()
    }

    /**
     * Doubles the wager (taking the second stake from the bankroll) and draws
     * exactly one card: a bust settles immediately, anything else auto-stands.
     */
    fun doubleDown() {
        if (!canDouble) {
            return
        }
        bankroll -= bet
        bet *= 2
        playerCards = playerCards + drawCard()
        if (handTotal(playerCards).total > 21) {
            holeHidden = false
            settle()
        } else {
            beginDealerTurn()
        }
    }

    /**
     * One dealer action, so the view can pace the draws like the web's timed
     * choreography: draws a card while under [DEALER_STANDS_ON] (17 — soft
     * 17s stand because they already total 17) and returns true; otherwise
     * settles the hand and returns false. Call in a loop to finish the turn.
     */
    fun dealerStep(): Boolean {
        if (phase != Phase.DEALER) {
            return false
        }
        if (handTotal(dealerCards).total < DEALER_STANDS_ON) {
            dealerCards = dealerCards + drawCard()
            return true
        }
        settle()
        return false
    }

    /** Clears the table back to the betting phase (web `newHand`). */
    fun newHand() {
        if (phase != Phase.SETTLED) {
            return
        }
        playerCards = emptyList()
        dealerCards = emptyList()
        result = null
        holeHidden = true
        bet = 0
        phase = Phase.BETTING
    }

    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------

    /**
     * Test hook: replace the shoe outright. Cards are drawn from the END of
     * the list (like the web `shoe.pop()`), so append the desired draw order
     * reversed. Keep more than [RESHUFFLE_AT] cards to avoid a reshuffle.
     */
    internal fun setShoe(cards: List<Card>) {
        shoe = cards.toMutableList()
    }

    /**
     * Draws the next card, rebuilding and reshuffling the shoe first when
     * [RESHUFFLE_AT] (25% of the shoe) or fewer cards remain — web `drawCard`.
     */
    private fun drawCard(): Card {
        if (shoe.size <= RESHUFFLE_AT) {
            shoe = buildShoe()
            shuffleCount += 1
        }
        return shoe.removeAt(shoe.size - 1)
    }

    /**
     * Builds a freshly shuffled six-deck shoe. Deck construction order and
     * the Fisher-Yates loop (with `floor(random * (i + 1))`) match the web
     * `buildShoe` exactly so identical RNG sequences yield identical shoes.
     */
    private fun buildShoe(): MutableList<Card> {
        val cards = ArrayList<Card>(SHOE_SIZE)
        repeat(DECK_COUNT) {
            for (suit in Suit.entries) {
                for (rank in Rank.entries) {
                    cards.add(Card(rank, suit))
                }
            }
        }
        for (i in cards.size - 1 downTo 1) {
            val j = (random.nextDouble() * (i + 1)).toInt()
            val swap = cards[i]
            cards[i] = cards[j]
            cards[j] = swap
        }
        return cards
    }

    private fun beginDealerTurn() {
        phase = Phase.DEALER
        holeHidden = false
    }

    /**
     * Pays out the hand and updates the session stats — a straight port of
     * the web `settle`, including the both-naturals-push fallthrough.
     */
    private fun settle() {
        val playerTotal = handTotal(playerCards).total
        val dealerTotal = handTotal(dealerCards).total
        val playerNatural = isBlackjack(playerCards)
        val dealerNatural = isBlackjack(dealerCards)
        val wagered = bet.toDouble()

        val kind: ResultKind
        var payout = 0.0
        if (playerTotal > 21) {
            kind = ResultKind.BUST
        } else if (playerNatural && !dealerNatural) {
            kind = ResultKind.BLACKJACK
            payout = wagered + wagered * BLACKJACK_PAYOUT
        } else if (dealerNatural && !playerNatural) {
            kind = ResultKind.LOSE
        } else if (dealerTotal > 21 || playerTotal > dealerTotal) {
            kind = ResultKind.WIN
            payout = wagered * 2
        } else if (playerTotal == dealerTotal) {
            kind = ResultKind.PUSH
            payout = wagered
        } else {
            kind = ResultKind.LOSE
        }

        val net = payout - wagered
        bankroll += payout
        result = HandResult(kind, net)
        stats = SessionStats(
            hands = stats.hands + 1,
            wins = stats.wins + if (net > 0) 1 else 0,
            pushes = stats.pushes + if (kind == ResultKind.PUSH) 1 else 0,
            biggestWin = max(stats.biggestWin, net),
        )
        phase = Phase.SETTLED
    }

    companion object {
        // House rules — must stay byte-for-byte in sync with the web cards.ts.
        const val DECK_COUNT = 6
        const val SHOE_SIZE = DECK_COUNT * 52
        const val RESHUFFLE_FRACTION = 0.25

        /** The shoe is rebuilt before a draw once this many or fewer remain. */
        val RESHUFFLE_AT = (SHOE_SIZE * RESHUFFLE_FRACTION).toInt()
        const val DEALER_STANDS_ON = 17

        /** A natural pays this multiple of the bet on top of the stake. */
        const val BLACKJACK_PAYOUT = 1.5
        const val STARTING_BANKROLL = 500.0
        val CHIP_DENOMINATIONS = listOf(5, 25, 100)

        /**
         * Persistence key — same name as the web's localStorage key so both
         * platforms describe the same concept (stored in SharedPreferences).
         */
        const val BANKROLL_STORAGE_KEY = "blackjack.bankroll"

        /**
         * Best total for a hand, counting aces as 11 where possible without
         * busting — a straight port of the web `handTotal`.
         */
        fun handTotal(cards: List<Card>): HandTotal {
            var total = 0
            var elevenAces = 0
            for (card in cards) {
                total += card.rank.value
                if (card.rank == Rank.ACE) {
                    elevenAces += 1
                }
            }
            while (total > 21 && elevenAces > 0) {
                total -= 10
                elevenAces -= 1
            }
            return HandTotal(total, soft = elevenAces > 0)
        }

        /** A natural: 21 from the first two cards. */
        fun isBlackjack(cards: List<Card>): Boolean =
            cards.size == 2 && handTotal(cards).total == 21

        /** Human-friendly total, e.g. "17" or "soft 17" (web `formatTotal`). */
        fun formatTotal(cards: List<Card>): String {
            val (total, soft) = handTotal(cards)
            return if (soft) "soft $total" else total.toString()
        }

        /**
         * Formats a dollar amount, keeping cents only when needed — 3:2
         * payouts on odd bets are the one source of cents (web `formatMoney`).
         */
        fun formatMoney(amount: Double): String =
            if (amount % 1.0 == 0.0) {
                "$${amount.toLong()}"
            } else {
                "$" + String.format(java.util.Locale.US, "%.2f", amount)
            }
    }
}
