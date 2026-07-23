package com.baseapp.android.view.games.truco

import kotlin.math.max
import kotlin.math.min

/**
 * Pure Kotlin port of the web Truco Paulista engine
 * (`web/app/src/View/Games/Truco/engine.ts`) so the exact same rules run on
 * every platform and can be unit-tested on the JVM. No Android or Compose
 * imports here — rendering and input live in `TrucoGameView`.
 *
 * The rank tables, empate rules, raise ladder, and every bot threshold must
 * stay byte-for-byte in sync with the web engine; change them together.
 *
 * Randomness (shuffle, bot decisions, table-talk lines) goes through an
 * injected `() -> Double` so tests can make the game fully deterministic.
 */
class TrucoEngine(
    /** Bluff rate 0..1 — the "Cara de pau" slider (honest → shameless). */
    var bluff: Double = 0.35,
    private val random: () -> Double = { Math.random() },
) {
    /**
     * Suits in manilha order (weakest to strongest): ouros ♦ < espadas ♠ <
     * copas ♥ < zap ♣. The ordinal IS the manilha suit ranking.
     */
    enum class Suit(val symbol: String) {
        DIAMONDS("♦"),
        SPADES("♠"),
        HEARTS("♥"),
        CLUBS("♣");

        val isRed: Boolean
            get() = this == DIAMONDS || this == HEARTS
    }

    /**
     * The 10 truco ranks (no 8/9/10 in the 40-card deck). The ordinal is the
     * plain-card strength order — 4 5 6 7 Q J K A 2 3.
     */
    enum class Rank(val label: String) {
        FOUR("4"),
        FIVE("5"),
        SIX("6"),
        SEVEN("7"),
        QUEEN("Q"),
        JACK("J"),
        KING("K"),
        ACE("A"),
        TWO("2"),
        THREE("3");

        /** The rank above this one, wrapping 3 → 4 (how the vira picks the manilha). */
        val next: Rank
            get() = entries[(ordinal + 1) % entries.size]
    }

    data class Card(val rank: Rank, val suit: Suit)

    enum class Seat {
        PLAYER,
        BOT;

        val other: Seat
            get() = if (this == PLAYER) BOT else PLAYER
    }

    /** Outcome of one trick: a winner, or a tie ("empate"). */
    enum class TrickResult { PLAYER, BOT, TIE }

    enum class Phase {
        /** Player sits at 11: choose play (worth 3) or fold (bot +1). */
        MAO_DE_ONZE,
        PLAYER_TURN,
        BOT_TURN,

        /** The bot raised: player must accept / re-raise / fold. */
        RESPOND,

        /** Hand settled: call [startHand] for the next deal. */
        HAND_OVER,

        /** Someone reached 12: call [newGame]. */
        GAME_OVER,
    }

    enum class RaiseResponse { ACCEPT, RAISE, FOLD }

    /**
     * Discrete things an action caused — the native twin of the web engine's
     * `TrucoEvent` union. The view uses these for speech bubbles; tests use
     * them to assert on game flow.
     */
    sealed class Event {
        object HandStarted : Event()
        data class BotSpoke(val line: String) : Event()
        data class BotPlayed(val card: Card) : Event()
        data class TrickResolved(val result: TrickResult) : Event()
        data class BotRaised(val toStake: Int) : Event()
        data class BotAccepted(val stake: Int) : Event()
        object BotFolded : Event()
        data class HandEnded(val winner: Seat, val points: Int) : Event()
        data class GameEnded(val winner: Seat) : Event()
    }

    /** Both cards of a resolved trick, kept so the view can linger on the reveal. */
    data class ResolvedTrick(val playerCard: Card, val botCard: Card, val result: TrickResult)

    var playerScore: Int = 0
        private set
    var botScore: Int = 0
        private set
    var gameWinner: Seat? = null
        private set

    var phase: Phase = Phase.HAND_OVER
        private set
    var playerHand: List<Card> = emptyList()
        private set
    var botHand: List<Card> = emptyList()
        private set
    var vira: Card = Card(Rank.FOUR, Suit.DIAMONDS)
        private set
    var manilhaRank: Rank = Rank.FIVE
        private set

    /** Accepted stake for this hand (what a fold concedes right now). */
    var stake: Int = 1
        private set

    /** Pending raise awaiting the player's response (phase == RESPOND). */
    var proposedStake: Int? = null
        private set

    /** Who made the last accepted raise; that seat cannot raise again next. */
    var raisedBy: Seat? = null
        private set

    /** True on mão de onze hands: the raise ladder is locked. */
    var trucoLocked: Boolean = false
        private set

    /** Who led the first trick of this hand (the "mão"); alternates per hand. */
    var handLeader: Seat = Seat.PLAYER
        private set

    /** Who leads the current trick (ties keep the same leader). */
    var leader: Seat = Seat.PLAYER
        private set
    var trickResults: List<TrickResult> = emptyList()
        private set
    var playerTrickCard: Card? = null
        private set
    var botTrickCard: Card? = null
        private set
    var lastTrick: ResolvedTrick? = null
        private set
    var handWinner: Seat? = null
        private set

    /** Points the settled hand transferred (for the hand-over banner). */
    var handPoints: Int = 0
        private set

    /** Alternates the mão between hands; [startHand] flips it. */
    private var nextHandLeader: Seat = Seat.PLAYER

    // ------------------------------------------------------------------
    // Actions
    // ------------------------------------------------------------------

    /** Full match reset, then deals the first hand. */
    fun newGame(): List<Event> {
        playerScore = 0
        botScore = 0
        gameWinner = null
        nextHandLeader = Seat.PLAYER
        return startHand()
    }

    /**
     * Deals the next hand: shuffles, flips the vira, resets the stake, and
     * runs the mão de onze gate before anyone plays.
     */
    fun startHand(): List<Event> {
        if (gameWinner != null) {
            return emptyList()
        }
        val deck = buildDeck().toMutableList()
        // Fisher-Yates through the injected RNG, matching the web shuffle.
        for (i in deck.size - 1 downTo 1) {
            val j = min((random() * (i + 1)).toInt(), i)
            val swap = deck[i]
            deck[i] = deck[j]
            deck[j] = swap
        }
        handLeader = nextHandLeader
        nextHandLeader = nextHandLeader.other
        resetHandState(deck.subList(0, 3).toList(), deck.subList(3, 6).toList(), deck[6])

        val events = mutableListOf<Event>(Event.HandStarted)
        val playerAtEleven = playerScore == WINNING_SCORE - 1
        val botAtEleven = botScore == WINNING_SCORE - 1
        if (playerAtEleven && botAtEleven) {
            // Simplification (documented in PACK.md): both at 11 plays a
            // normal hand locked at 3 points.
            stake = 3
            trucoLocked = true
        } else if (playerAtEleven) {
            phase = Phase.MAO_DE_ONZE
        } else if (botAtEleven) {
            // The bot decides its own mão de onze immediately.
            val strength = handStrength(botHand, manilhaRank)
            if (strength >= BOT_MAO_DE_ONZE_STRENGTH || random() < bluff) {
                stake = 3
                trucoLocked = true
                events.add(Event.BotSpoke(pick(MAO_DE_ONZE_PLAY_LINES)))
            } else {
                events.add(Event.BotSpoke(pick(FOLD_LINES)))
                events.addAll(endHand(Seat.PLAYER, 1))
            }
        }
        return events
    }

    /** Test/remix hook: pin both hands and the vira, then play normally. */
    fun setHands(playerHand: List<Card>, botHand: List<Card>, vira: Card) {
        resetHandState(playerHand.toList(), botHand.toList(), vira)
    }

    /** Test/remix hook: set the score line (call before startHand/setHands). */
    fun setScores(player: Int, bot: Int) {
        playerScore = player
        botScore = bot
    }

    /** Mão de onze choice for the player at 11: play at 3, or concede 1. */
    fun decideMaoDeOnze(play: Boolean): List<Event> {
        if (phase != Phase.MAO_DE_ONZE) {
            return emptyList()
        }
        if (play) {
            stake = 3
            trucoLocked = true
            phase = if (leader == Seat.PLAYER) Phase.PLAYER_TURN else Phase.BOT_TURN
            return emptyList()
        }
        return endHand(Seat.BOT, 1)
    }

    /** Whether [seat] could legally raise right now (their turn to act). */
    fun canRaise(seat: Seat): Boolean {
        val myTurn = phase == (if (seat == Seat.PLAYER) Phase.PLAYER_TURN else Phase.BOT_TURN)
        return myTurn && !trucoLocked && raisedBy != seat && nextStake(stake) != null
    }

    /** Player plays their hand card at [index] (phase must be PLAYER_TURN). */
    fun playCard(index: Int): List<Event> {
        if (phase != Phase.PLAYER_TURN || index !in playerHand.indices) {
            return emptyList()
        }
        val card = playerHand[index]
        playerHand = playerHand.filterIndexed { i, _ -> i != index }
        playerTrickCard = card
        if (botTrickCard != null) {
            return resolveTrick()
        }
        phase = Phase.BOT_TURN
        return emptyList()
    }

    /**
     * The bot takes its turn: it may call a raise (ending the action — the
     * player must respond), otherwise it plays a card.
     */
    fun botAct(): List<Event> {
        if (phase != Phase.BOT_TURN) {
            return emptyList()
        }
        val strength = handStrength(botHand, manilhaRank)
        if (canRaise(Seat.BOT)) {
            // Call proportionally to strength, plus a bluff kicker.
            val urge = min(1.0, max(0.0, (strength - 0.5) * 1.6)) * 0.8 + bluff * 0.25
            val proposed = nextStake(stake)
            if (random() < urge && proposed != null) {
                proposedStake = proposed
                phase = Phase.RESPOND
                return listOf(
                    Event.BotSpoke(RAISE_CALL.getValue(proposed)),
                    Event.BotRaised(proposed),
                )
            }
        }
        val card = chooseBotCard()
        botHand = botHand - card
        botTrickCard = card
        val events = mutableListOf<Event>(Event.BotPlayed(card))
        if (playerTrickCard != null) {
            events.addAll(resolveTrick())
        } else {
            phase = Phase.PLAYER_TURN
        }
        return events
    }

    /**
     * Player calls the next rung (Truco/Seis/Nove/Doze). The bot answers
     * immediately: fold (player wins the pre-raise stake), accept, or
     * re-raise (which puts the player in the RESPOND phase).
     */
    fun playerCallRaise(): List<Event> {
        if (!canRaise(Seat.PLAYER)) {
            return emptyList()
        }
        val proposed = nextStake(stake) ?: return emptyList()
        return botAnswerRaise(proposed)
    }

    /** Player answers a pending bot raise (phase must be RESPOND). */
    fun respondToRaise(response: RaiseResponse): List<Event> {
        val proposed = proposedStake
        if (phase != Phase.RESPOND || proposed == null) {
            return emptyList()
        }
        if (response == RaiseResponse.FOLD) {
            // "Correr": concede the stake that was in force before the raise.
            proposedStake = null
            return endHand(Seat.BOT, stake)
        }
        // Accepting (or re-raising, which implies acceptance) locks in the
        // proposed stake; the bot made this raise so it cannot raise next.
        stake = proposed
        raisedBy = Seat.BOT
        proposedStake = null
        if (response == RaiseResponse.ACCEPT) {
            resumeAfterRaise()
            return emptyList()
        }
        val higher = nextStake(stake)
        if (higher == null) {
            resumeAfterRaise()
            return emptyList()
        }
        return botAnswerRaise(higher)
    }

    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------

    private fun resetHandState(playerHand: List<Card>, botHand: List<Card>, vira: Card) {
        this.playerHand = playerHand
        this.botHand = botHand
        this.vira = vira
        manilhaRank = manilhaRankFor(vira.rank)
        stake = 1
        proposedStake = null
        raisedBy = null
        trucoLocked = false
        leader = handLeader
        trickResults = emptyList()
        playerTrickCard = null
        botTrickCard = null
        lastTrick = null
        handWinner = null
        handPoints = 0
        phase = if (leader == Seat.PLAYER) Phase.PLAYER_TURN else Phase.BOT_TURN
    }

    /** The bot answers a raise proposed by the player (call or re-raise). */
    private fun botAnswerRaise(proposed: Int): List<Event> {
        val strength = handStrength(botHand, manilhaRank)
        val bluffing = random() < bluff * 0.5
        if (strength >= BOT_RERAISE_STRENGTH || (bluffing && random() < 0.5)) {
            // Accept the player's raise; re-raise on top if the ladder allows.
            stake = proposed
            raisedBy = Seat.PLAYER
            val higher = nextStake(stake)
            if (higher != null) {
                proposedStake = higher
                phase = Phase.RESPOND
                return listOf(
                    Event.BotSpoke(RAISE_CALL.getValue(higher)),
                    Event.BotRaised(higher),
                )
            }
            resumeAfterRaise()
            return listOf(Event.BotSpoke(pick(ACCEPT_LINES)), Event.BotAccepted(stake))
        }
        if (strength >= BOT_ACCEPT_STRENGTH || bluffing) {
            stake = proposed
            raisedBy = Seat.PLAYER
            resumeAfterRaise()
            return listOf(Event.BotSpoke(pick(ACCEPT_LINES)), Event.BotAccepted(stake))
        }
        // Fold: the raiser wins the stake in force before this raise.
        val events = mutableListOf<Event>(Event.BotSpoke(pick(FOLD_LINES)), Event.BotFolded)
        events.addAll(endHand(Seat.PLAYER, stake))
        return events
    }

    /** After a raise settles, play resumes with whoever still has to act. */
    private fun resumeAfterRaise() {
        phase = when {
            playerTrickCard != null && botTrickCard == null -> Phase.BOT_TURN
            botTrickCard != null && playerTrickCard == null -> Phase.PLAYER_TURN
            leader == Seat.PLAYER -> Phase.PLAYER_TURN
            else -> Phase.BOT_TURN
        }
    }

    /**
     * Bot card choice. Leading: strongest card with a strong hand, weakest
     * otherwise. Following: the cheapest card that wins the trick, else the
     * weakest card (dumping). Same heuristic as the web `chooseBotCard`.
     */
    private fun chooseBotCard(): Card {
        val byStrength = botHand.sortedBy { cardStrength(it, manilhaRank) }
        val playerCard = playerTrickCard
            ?: return if (handStrength(botHand, manilhaRank) >= 0.55) {
                byStrength.last()
            } else {
                byStrength.first()
            }
        val target = cardStrength(playerCard, manilhaRank)
        return byStrength.firstOrNull { cardStrength(it, manilhaRank) > target }
            ?: byStrength.first()
    }

    /** Resolves a completed trick and, when decisive, the hand and game. */
    private fun resolveTrick(): List<Event> {
        val playerCard = playerTrickCard ?: return emptyList()
        val botCard = botTrickCard ?: return emptyList()
        val playerPower = cardStrength(playerCard, manilhaRank)
        val botPower = cardStrength(botCard, manilhaRank)
        val result = when {
            playerPower > botPower -> TrickResult.PLAYER
            botPower > playerPower -> TrickResult.BOT
            else -> TrickResult.TIE
        }
        trickResults = trickResults + result
        lastTrick = ResolvedTrick(playerCard, botCard, result)
        playerTrickCard = null
        botTrickCard = null

        val events = mutableListOf<Event>(Event.TrickResolved(result))
        val winner = handWinnerFromTricks()
        if (winner != null) {
            events.addAll(endHand(winner, stake))
            return events
        }
        // Next trick: the winner leads; a tie keeps the same leader.
        if (result == TrickResult.PLAYER) {
            leader = Seat.PLAYER
        } else if (result == TrickResult.BOT) {
            leader = Seat.BOT
        }
        phase = if (leader == Seat.PLAYER) Phase.PLAYER_TURN else Phase.BOT_TURN
        return events
    }

    /**
     * Truco Paulista hand resolution with the empate rules (see the web
     * `handWinnerFromTricks` and PACK.md):
     * - two clean trick wins take the hand;
     * - once any trick has tied, the winner of the first non-tied trick
     *   takes the hand;
     * - all three tricks tied: the hand goes to the mão ([handLeader]).
     * Returns null while the hand is still undecided.
     */
    private fun handWinnerFromTricks(): Seat? {
        val playerWins = trickResults.count { it == TrickResult.PLAYER }
        val botWins = trickResults.count { it == TrickResult.BOT }
        val ties = trickResults.count { it == TrickResult.TIE }
        if (playerWins >= 2) {
            return Seat.PLAYER
        }
        if (botWins >= 2) {
            return Seat.BOT
        }
        if (ties > 0) {
            val firstDecided = trickResults.firstOrNull { it != TrickResult.TIE }
            if (firstDecided != null) {
                return if (firstDecided == TrickResult.PLAYER) Seat.PLAYER else Seat.BOT
            }
            if (trickResults.size == 3) {
                return handLeader
            }
        }
        return null
    }

    /** Transfers points, checks for game over, and parks in HAND_OVER. */
    private fun endHand(winner: Seat, points: Int): List<Event> {
        handWinner = winner
        handPoints = points
        if (winner == Seat.PLAYER) {
            playerScore = min(WINNING_SCORE, playerScore + points)
        } else {
            botScore = min(WINNING_SCORE, botScore + points)
        }
        val events = mutableListOf<Event>(
            Event.BotSpoke(pick(if (winner == Seat.BOT) HAND_WIN_LINES else HAND_LOSE_LINES)),
            Event.HandEnded(winner, points),
        )
        if (playerScore >= WINNING_SCORE || botScore >= WINNING_SCORE) {
            val champion = if (playerScore >= WINNING_SCORE) Seat.PLAYER else Seat.BOT
            gameWinner = champion
            phase = Phase.GAME_OVER
            events.add(Event.GameEnded(champion))
        } else {
            phase = Phase.HAND_OVER
        }
        return events
    }

    private fun pick(lines: List<String>): String =
        lines[min(lines.size - 1, (random() * lines.size).toInt())]

    companion object {
        /** The raise ladder: 1 (hand) → 3 (Truco) → 6 (Seis) → 9 (Nove) → 12 (Doze). */
        val STAKE_LADDER = listOf(1, 3, 6, 9, 12)

        /** First to this many points wins (and triggers mão de onze at 11). */
        const val WINNING_SCORE = 12

        /** Portuguese announcement for each raised stake. */
        val RAISE_CALL = mapOf(3 to "Truco!", 6 to "Seis!", 9 to "Nove!", 12 to "Doze!")

        // Table-talk lines — same strings as the web engine.
        private val ACCEPT_LINES = listOf("Cai dentro!", "Bora, então!", "Segura essa!")
        private val FOLD_LINES = listOf("Corro!", "Tô fora...", "Fica pra ti.")
        private val HAND_WIN_LINES = listOf("É nóis!", "O boteco é meu!", "Mais uma pro bot!")
        private val HAND_LOSE_LINES = listOf("Ah, não...", "Sorte sua, hein.", "Essa doeu.")
        private val MAO_DE_ONZE_PLAY_LINES = listOf("Na mão de onze eu vou!", "Confia no bot.")

        // Bot decision thresholds — mirrored verbatim from the web engine.
        private const val BOT_RERAISE_STRENGTH = 0.72
        private const val BOT_ACCEPT_STRENGTH = 0.45
        private const val BOT_MAO_DE_ONZE_STRENGTH = 0.5

        /** Builds the 40-card truco deck in a deterministic order. */
        fun buildDeck(): List<Card> =
            Suit.entries.flatMap { suit -> Rank.entries.map { rank -> Card(rank, suit) } }

        /** The manilha rank is the rank above the vira, wrapping 3 → 4. */
        fun manilhaRankFor(viraRank: Rank): Rank = viraRank.next

        /**
         * Total ordering used to resolve tricks. Plain cards score their rank
         * ordinal (0..9) — equal ranks tie regardless of suit. Manilhas score
         * 100 + suit ordinal, so any manilha beats any plain card and
         * manilhas never tie.
         */
        fun cardStrength(card: Card, manilhaRank: Rank): Int =
            if (card.rank == manilhaRank) 100 + card.suit.ordinal else card.rank.ordinal

        /** Next rung of the raise ladder, or null when the stake is already 12. */
        fun nextStake(stake: Int): Int? {
            val index = STAKE_LADDER.indexOf(stake)
            return if (index in 0 until STAKE_LADDER.size - 1) STAKE_LADDER[index + 1] else null
        }

        /**
         * 0..1 hand-strength score the bot bets with: each card is worth its
         * rank ordinal scaled to 0..0.75, or 0.85 + 0.05·suit for a manilha
         * (zap = 1.0). The best card dominates (70%) with the rest as support
         * (30%) — the same formula as the web `handStrength`.
         */
        fun handStrength(cards: List<Card>, manilhaRank: Rank): Double {
            if (cards.isEmpty()) {
                return 0.0
            }
            val points = cards
                .map { card ->
                    if (card.rank == manilhaRank) {
                        0.85 + 0.05 * card.suit.ordinal
                    } else {
                        card.rank.ordinal / 12.0
                    }
                }
                .sortedDescending()
            val support = if (points.size > 1) points.drop(1).average() else 0.0
            return 0.7 * points[0] + 0.3 * support
        }
    }
}
