package com.baseapp.android.view.games.hanafuda

import kotlin.random.Random

/**
 * Pure Kotlin port of the web Koi-Koi engine
 * (`web/app/src/View/Games/Hanafuda/engine.ts`): the 48-card hanafuda deck,
 * dealing, the turn/match state machine, yaku evaluation, round scoring,
 * and the bot AI. No Android or Compose imports here — rendering and input
 * live in `HanafudaGameView`, so the rules stay JVM-testable.
 *
 * The deck layout, yaku table, scoring house rules, and bot heuristics must
 * stay in sync with the web engine (and the iOS `HanafudaEngine.swift`) so
 * all three platforms play identically.
 *
 * Randomness (the shuffle) goes through an injected [Random] so tests can
 * make every deal fully deterministic (or bypass it with [dealArranged]).
 */
class HanafudaEngine(
    private val random: Random = Random.Default,
) {
    /** One of the four hanafuda card categories. */
    enum class Kind { BRIGHT, ANIMAL, RIBBON, CHAFF }

    /** Ribbon flavor: red with poetry, plain red, or blue. */
    enum class RibbonColor { POETRY, PLAIN, BLUE }

    /**
     * One card. [id] is stable 0..47 as `(month - 1) * 4 + slot` — the same
     * numbering as the web; [month] runs 1 (pine) through 12 (paulownia).
     */
    data class Card(
        val id: Int,
        val month: Int,
        val kind: Kind,
        val name: String,
        val ribbon: RibbonColor? = null,
    )

    enum class Seat {
        PLAYER,
        BOT;

        val opponent: Seat
            get() = if (this == PLAYER) BOT else PLAYER
    }

    /** A scored combination and its point value. */
    data class Yaku(val key: String, val label: String, val points: Int)

    /**
     * What the UI should show / ask for next — mirrors the web `Phase`:
     * pick a hand card, resolve a two-way field choice for the played or
     * flipped card, answer the koi-koi/shobu prompt, let the bot act, or
     * sit on a terminal round/match screen.
     */
    enum class Phase {
        SELECT_HAND,
        CHOOSE_FIELD_FOR_HAND,
        CHOOSE_FIELD_FOR_DRAW,
        DECISION,
        BOT_TURN,
        ROUND_OVER,
        MATCH_OVER,
    }

    /** Everything that happened in one completed turn, for logs and toasts. */
    data class TurnReport(
        val seat: Seat,
        val played: Card,
        /** Cards moved to the capture pile by the hand play (empty on a discard). */
        val playedCaptured: List<Card>,
        val drawn: Card? = null,
        val drawnCaptured: List<Card> = emptyList(),
        /** Yaku newly formed this turn (score strictly improved). */
        val newYaku: List<Yaku> = emptyList(),
        /** "koikoi" or "shobu" when the bot formed a yaku and decided its own fate. */
        val botDecision: String? = null,
    )

    data class RoundResult(
        val round: Int,
        val winner: Seat?,
        val yaku: List<Yaku>,
        val basePoints: Int,
        val score: Int,
    )

    private data class BotPlay(val card: Card, val targets: List<Card>)

    var round: Int = 1
        private set

    /** The dealer leads; the player deals odd rounds (round 1 first). */
    var dealer: Seat = Seat.PLAYER
        private set

    /** Internal-settable so tests can drive the decision path directly. */
    var phase: Phase = Phase.SELECT_HAND
        internal set

    var turn: Seat = Seat.PLAYER
        private set

    var deck: List<Card> = emptyList()
        private set
    var field: List<Card> = emptyList()
        private set
    var playerHand: List<Card> = emptyList()
        private set
    var botHand: List<Card> = emptyList()
        private set
    var playerCaptured: List<Card> = emptyList()
        private set
    var botCaptured: List<Card> = emptyList()
        private set

    /** Whether each seat has called koi-koi this round (drives doubling). */
    var playerCalledKoiKoi: Boolean = false
        internal set
    var botCalledKoiKoi: Boolean = false
        internal set

    /** Yaku points at the seat's last decision — used to detect *new* yaku. */
    private var playerBankedPoints = 0
    private var botBankedPoints = 0

    /** Per-round scores banked so far. */
    var playerScores: List<Int> = emptyList()
        private set
    var botScores: List<Int> = emptyList()
        private set
    var results: List<RoundResult> = emptyList()
        private set

    /** Set at match end; null in a decided match means it drew. */
    var matchWinner: Seat? = null
        private set
    var isMatchDecided: Boolean = false
        private set

    /** The most recently completed turn, for the UI log / toasts. */
    var lastReport: TurnReport? = null
        private set

    /** Hand card awaiting a two-way field choice. */
    var pendingHandCard: Card? = null
        private set

    /** Flipped deck card awaiting a two-way field choice. */
    var pendingDrawnCard: Card? = null
        private set

    /** In-progress report accumulated across the choice sub-phases. */
    private var draftReport: TurnReport? = null

    val playerTotal: Int get() = playerScores.sum()
    val botTotal: Int get() = botScores.sum()

    init {
        startMatch()
    }

    fun hand(seat: Seat): List<Card> = if (seat == Seat.PLAYER) playerHand else botHand

    fun captured(seat: Seat): List<Card> = if (seat == Seat.PLAYER) playerCaptured else botCaptured

    fun startMatch() {
        round = 1
        playerScores = emptyList()
        botScores = emptyList()
        results = emptyList()
        matchWinner = null
        isMatchDecided = false
        startRound()
    }

    /** Deals 8/8/8 and hands the lead to the round's dealer. */
    fun startRound() {
        dealer = if (round % 2 == 1) Seat.PLAYER else Seat.BOT
        deck = FULL_DECK.shuffled(random)
        dealFromDeck()
    }

    fun startNextRound() {
        if (phase != Phase.ROUND_OVER) {
            return
        }
        round += 1
        startRound()
    }

    /** Field cards the given card would capture (same month). */
    fun fieldMatches(card: Card): List<Card> = field.filter { it.month == card.month }

    /**
     * Test hook: replaces the shuffled deal with an arranged one. [arranged]
     * is consumed front-first: 8 player hand, 8 bot hand, 8 field, 24 draw.
     */
    internal fun dealArranged(arranged: List<Card>) {
        deck = arranged
        dealFromDeck()
    }

    /**
     * Test hook: injects a capture pile mid-round so yaku/scoring paths can
     * be exercised without scripting every turn.
     */
    internal fun setCaptured(cards: List<Card>, seat: Seat) {
        if (seat == Seat.PLAYER) {
            playerCaptured = cards
        } else {
            botCaptured = cards
        }
    }

    /**
     * Player plays a hand card. If it matches exactly two field cards the
     * engine parks in [Phase.CHOOSE_FIELD_FOR_HAND] until
     * [resolveFieldChoice] names one; otherwise the play (and then the deck
     * flip) resolve immediately.
     */
    fun playHandCard(cardId: Int) {
        if (phase != Phase.SELECT_HAND || turn != Seat.PLAYER) {
            return
        }
        val card = playerHand.find { it.id == cardId } ?: return
        val matches = fieldMatches(card)
        if (matches.size == 2) {
            playerHand = playerHand - card
            pendingHandCard = card
            phase = Phase.CHOOSE_FIELD_FOR_HAND
            return
        }
        playerHand = playerHand - card
        val capturedNow = placeCard(Seat.PLAYER, card, matches)
        beginDraft(Seat.PLAYER, card, capturedNow)
        flipDeckCard(Seat.PLAYER)
    }

    /** Resolves a two-way field choice for either the hand play or the flip. */
    fun resolveFieldChoice(fieldCardId: Int) {
        val handPending = pendingHandCard
        val drawPending = pendingDrawnCard
        if (phase == Phase.CHOOSE_FIELD_FOR_HAND && handPending != null) {
            val target = field.find { it.id == fieldCardId } ?: return
            if (target.month != handPending.month) {
                return
            }
            pendingHandCard = null
            val capturedNow = placeCard(Seat.PLAYER, handPending, listOf(target))
            beginDraft(Seat.PLAYER, handPending, capturedNow)
            flipDeckCard(Seat.PLAYER)
        } else if (phase == Phase.CHOOSE_FIELD_FOR_DRAW && drawPending != null) {
            val target = field.find { it.id == fieldCardId } ?: return
            if (target.month != drawPending.month) {
                return
            }
            pendingDrawnCard = null
            val capturedNow = placeCard(Seat.PLAYER, drawPending, listOf(target))
            draftReport = draftReport?.copy(drawn = drawPending, drawnCaptured = capturedNow)
            finishTurn(Seat.PLAYER)
        }
    }

    /** Player elects to keep going after forming a yaku. */
    fun declareKoiKoi() {
        if (phase != Phase.DECISION) {
            return
        }
        playerCalledKoiKoi = true
        playerBankedPoints = yakuPoints(evaluateYaku(playerCaptured))
        passTurn(Seat.PLAYER)
    }

    /** Player banks the round. */
    fun declareShobu() {
        if (phase != Phase.DECISION) {
            return
        }
        endRound(Seat.PLAYER)
    }

    /**
     * Runs the bot's whole turn: pick the best play, resolve any two-way
     * choice greedily, flip the deck card, then make its own koi-koi/shobu
     * call. Returns the report (also stored in [lastReport]).
     */
    fun botTakeTurn(): TurnReport? {
        if (phase != Phase.BOT_TURN || turn != Seat.BOT) {
            return null
        }
        val play = chooseBotPlay(botHand, field, botCaptured, playerCaptured)
        botHand = botHand - play.card
        val capturedNow = placeCard(Seat.BOT, play.card, play.targets)
        beginDraft(Seat.BOT, play.card, capturedNow)
        flipDeckCard(Seat.BOT)
        return lastReport
    }

    // -- Internals -----------------------------------------------------------

    private fun dealFromDeck() {
        playerHand = deck.take(HAND_SIZE)
        botHand = deck.drop(HAND_SIZE).take(HAND_SIZE)
        field = deck.drop(HAND_SIZE * 2).take(FIELD_SIZE)
        deck = deck.drop(HAND_SIZE * 2 + FIELD_SIZE)
        playerCaptured = emptyList()
        botCaptured = emptyList()
        playerCalledKoiKoi = false
        botCalledKoiKoi = false
        playerBankedPoints = 0
        botBankedPoints = 0
        pendingHandCard = null
        pendingDrawnCard = null
        draftReport = null
        lastReport = null
        turn = dealer
        phase = if (dealer == Seat.PLAYER) Phase.SELECT_HAND else Phase.BOT_TURN
    }

    private fun beginDraft(seat: Seat, played: Card, playedCaptured: List<Card>) {
        draftReport = TurnReport(seat = seat, played = played, playedCaptured = playedCaptured)
    }

    /**
     * Places a card against the chosen field targets: captures the pair (or
     * all four on a triple month match), or lays the card on the field.
     * Returns the cards that entered the capture pile.
     */
    private fun placeCard(seat: Seat, card: Card, targets: List<Card>): List<Card> {
        if (targets.isEmpty()) {
            field = field + card
            return emptyList()
        }
        // A triple month match sweeps all three field cards with the fourth.
        val taken = if (targets.size >= 3) fieldMatches(card) else listOf(targets[0])
        field = field.filter { fieldCard -> taken.none { it.id == fieldCard.id } }
        val capturedNow = listOf(card) + taken
        if (seat == Seat.PLAYER) {
            playerCaptured = playerCaptured + capturedNow
        } else {
            botCaptured = botCaptured + capturedNow
        }
        return capturedNow
    }

    /** Flips the top deck card and resolves it (or parks on a player choice). */
    private fun flipDeckCard(seat: Seat) {
        val drawn = deck.firstOrNull()
        if (drawn == null || draftReport == null) {
            finishTurn(seat)
            return
        }
        deck = deck.drop(1)
        val matches = fieldMatches(drawn)
        if (matches.size == 2) {
            if (seat == Seat.PLAYER) {
                pendingDrawnCard = drawn
                phase = Phase.CHOOSE_FIELD_FOR_DRAW
                return
            }
            // Bot resolves its own choice greedily: take the richer card.
            val best = matches.maxByOrNull {
                captureValue(it, botCaptured) + denyValue(it, playerCaptured)
            }!!
            val capturedNow = placeCard(seat, drawn, listOf(best))
            draftReport = draftReport?.copy(drawn = drawn, drawnCaptured = capturedNow)
            finishTurn(seat)
            return
        }
        val capturedNow = placeCard(seat, drawn, matches)
        draftReport = draftReport?.copy(drawn = drawn, drawnCaptured = capturedNow)
        finishTurn(seat)
    }

    /**
     * Closes out a turn: detect newly formed yaku, run the decision (player
     * prompt / bot heuristic), and otherwise pass play or end a drawn round.
     */
    private fun finishTurn(seat: Seat) {
        var report = draftReport ?: return
        draftReport = null
        val yaku = evaluateYaku(captured(seat))
        val points = yakuPoints(yaku)
        val banked = if (seat == Seat.PLAYER) playerBankedPoints else botBankedPoints
        if (points > banked) {
            report = report.copy(newYaku = yaku)
            if (hand(seat).isEmpty()) {
                // No cards left to koi-koi with: the yaku auto-banks.
                if (seat == Seat.BOT) {
                    report = report.copy(botDecision = "shobu")
                }
                lastReport = report
                endRound(seat)
                return
            }
            if (seat == Seat.PLAYER) {
                lastReport = report
                phase = Phase.DECISION
                return
            }
            val decision = chooseBotDecision(points, botHand.size, botCaptured, playerCaptured)
            report = report.copy(botDecision = decision)
            lastReport = report
            if (decision == "shobu") {
                endRound(Seat.BOT)
                return
            }
            botCalledKoiKoi = true
            botBankedPoints = points
            passTurn(seat)
            return
        }
        lastReport = report
        passTurn(seat)
    }

    private fun passTurn(seat: Seat) {
        if (playerHand.isEmpty() && botHand.isEmpty()) {
            endRound(null)
            return
        }
        val next = seat.opponent
        turn = next
        phase = if (next == Seat.PLAYER) Phase.SELECT_HAND else Phase.BOT_TURN
    }

    /** Banks the round for [winner] (null = drawn round) and advances phases. */
    private fun endRound(winner: Seat?) {
        val result: RoundResult
        if (winner != null) {
            val yaku = evaluateYaku(captured(winner))
            val basePoints = yakuPoints(yaku)
            val opponentKoiKoi =
                if (winner == Seat.PLAYER) botCalledKoiKoi else playerCalledKoiKoi
            val score = roundScore(basePoints, opponentKoiKoi)
            playerScores = playerScores + if (winner == Seat.PLAYER) score else 0
            botScores = botScores + if (winner == Seat.BOT) score else 0
            result = RoundResult(round, winner, yaku, basePoints, score)
        } else {
            playerScores = playerScores + 0
            botScores = botScores + 0
            result = RoundResult(round, null, emptyList(), 0, 0)
        }
        results = results + result
        if (round >= TOTAL_ROUNDS) {
            matchWinner = when {
                playerTotal > botTotal -> Seat.PLAYER
                botTotal > playerTotal -> Seat.BOT
                else -> null
            }
            isMatchDecided = true
            phase = Phase.MATCH_OVER
        } else {
            phase = Phase.ROUND_OVER
        }
    }

    companion object {
        /** Rounds in a full match; the dealer alternates every round. */
        const val TOTAL_ROUNDS = 6

        /** Cards dealt to each hand and to the field (the classic 8/8/8 deal). */
        const val HAND_SIZE = 8
        const val FIELD_SIZE = 8

        /** Winning with this many points or more doubles the round score. */
        const val BIG_HAND_THRESHOLD = 7

        // Ids of the cards individual yaku care about — slot 0 of each month.
        const val CRANE_ID = 0
        const val CURTAIN_ID = 8
        const val MOON_ID = 28
        const val RAIN_MAN_ID = 40
        const val PHOENIX_ID = 44
        const val SAKE_CUP_ID = 32
        const val BOAR_ID = 24
        const val DEER_ID = 36
        const val BUTTERFLIES_ID = 20

        /**
         * The full 48-card deck in id order: the canonical composition of 5
         * brights, 9 animals, 10 ribbons, and 24 chaff — including the
         * willow (November) oddities and the paulownia (December) extra
         * chaff. Must match the web `DECK` table card for card.
         */
        val FULL_DECK: List<Card> = buildDeck()

        private fun buildDeck(): List<Card> {
            data class Slot(val kind: Kind, val name: String, val ribbon: RibbonColor? = null)

            val months: List<List<Slot>> = listOf(
                listOf( // January — Pine
                    Slot(Kind.BRIGHT, "Crane and Sun"),
                    Slot(Kind.RIBBON, "Pine Poetry Ribbon", RibbonColor.POETRY),
                    Slot(Kind.CHAFF, "Pine Chaff"),
                    Slot(Kind.CHAFF, "Pine Chaff"),
                ),
                listOf( // February — Plum
                    Slot(Kind.ANIMAL, "Bush Warbler"),
                    Slot(Kind.RIBBON, "Plum Poetry Ribbon", RibbonColor.POETRY),
                    Slot(Kind.CHAFF, "Plum Chaff"),
                    Slot(Kind.CHAFF, "Plum Chaff"),
                ),
                listOf( // March — Cherry
                    Slot(Kind.BRIGHT, "Flower-Viewing Curtain"),
                    Slot(Kind.RIBBON, "Cherry Poetry Ribbon", RibbonColor.POETRY),
                    Slot(Kind.CHAFF, "Cherry Chaff"),
                    Slot(Kind.CHAFF, "Cherry Chaff"),
                ),
                listOf( // April — Wisteria
                    Slot(Kind.ANIMAL, "Cuckoo"),
                    Slot(Kind.RIBBON, "Wisteria Ribbon", RibbonColor.PLAIN),
                    Slot(Kind.CHAFF, "Wisteria Chaff"),
                    Slot(Kind.CHAFF, "Wisteria Chaff"),
                ),
                listOf( // May — Iris
                    Slot(Kind.ANIMAL, "Eight-Plank Bridge"),
                    Slot(Kind.RIBBON, "Iris Ribbon", RibbonColor.PLAIN),
                    Slot(Kind.CHAFF, "Iris Chaff"),
                    Slot(Kind.CHAFF, "Iris Chaff"),
                ),
                listOf( // June — Peony
                    Slot(Kind.ANIMAL, "Butterflies"),
                    Slot(Kind.RIBBON, "Peony Blue Ribbon", RibbonColor.BLUE),
                    Slot(Kind.CHAFF, "Peony Chaff"),
                    Slot(Kind.CHAFF, "Peony Chaff"),
                ),
                listOf( // July — Clover
                    Slot(Kind.ANIMAL, "Boar"),
                    Slot(Kind.RIBBON, "Clover Ribbon", RibbonColor.PLAIN),
                    Slot(Kind.CHAFF, "Clover Chaff"),
                    Slot(Kind.CHAFF, "Clover Chaff"),
                ),
                listOf( // August — Pampas
                    Slot(Kind.BRIGHT, "Full Moon"),
                    Slot(Kind.ANIMAL, "Geese in Flight"),
                    Slot(Kind.CHAFF, "Pampas Chaff"),
                    Slot(Kind.CHAFF, "Pampas Chaff"),
                ),
                listOf( // September — Chrysanthemum
                    Slot(Kind.ANIMAL, "Sake Cup"),
                    Slot(Kind.RIBBON, "Chrysanthemum Blue Ribbon", RibbonColor.BLUE),
                    Slot(Kind.CHAFF, "Chrysanthemum Chaff"),
                    Slot(Kind.CHAFF, "Chrysanthemum Chaff"),
                ),
                listOf( // October — Maple
                    Slot(Kind.ANIMAL, "Deer"),
                    Slot(Kind.RIBBON, "Maple Blue Ribbon", RibbonColor.BLUE),
                    Slot(Kind.CHAFF, "Maple Chaff"),
                    Slot(Kind.CHAFF, "Maple Chaff"),
                ),
                listOf( // November — Willow
                    Slot(Kind.BRIGHT, "Rain Man"),
                    Slot(Kind.ANIMAL, "Swallow"),
                    Slot(Kind.RIBBON, "Willow Ribbon", RibbonColor.PLAIN),
                    Slot(Kind.CHAFF, "Lightning"),
                ),
                listOf( // December — Paulownia
                    Slot(Kind.BRIGHT, "Phoenix"),
                    Slot(Kind.CHAFF, "Paulownia Chaff"),
                    Slot(Kind.CHAFF, "Paulownia Chaff"),
                    Slot(Kind.CHAFF, "Paulownia Chaff"),
                ),
            )
            return months.flatMapIndexed { monthIndex, slots ->
                slots.mapIndexed { slotIndex, slot ->
                    Card(
                        id = monthIndex * 4 + slotIndex,
                        month = monthIndex + 1,
                        kind = slot.kind,
                        name = slot.name,
                        ribbon = slot.ribbon,
                    )
                }
            }
        }

        // -- Yaku evaluation (must mirror the web `evaluateYaku` exactly) ----

        /**
         * Evaluates every yaku in a pile of captured cards. Bright yaku are
         * mutually exclusive (only the best applies); akatan/aotan stack
         * with the tan count, and the sake cup counts as an animal only
         * (house rule, see PACK.md).
         */
        fun evaluateYaku(captured: List<Card>): List<Yaku> {
            val yaku = mutableListOf<Yaku>()
            val ids = captured.map { it.id }.toSet()

            val brights = captured.count { it.kind == Kind.BRIGHT }
            val hasRain = RAIN_MAN_ID in ids
            val dryBrights = brights - if (hasRain) 1 else 0
            when {
                brights == 5 -> yaku += Yaku("goko", "Goko (Five Brights)", 15)
                brights == 4 && !hasRain -> yaku += Yaku("shiko", "Shiko (Four Brights)", 8)
                brights == 4 -> yaku += Yaku("ame-shiko", "Ame-Shiko (Rainy Four Brights)", 7)
                dryBrights == 3 -> yaku += Yaku("sanko", "Sanko (Three Brights)", 6)
            }

            if (CURTAIN_ID in ids && SAKE_CUP_ID in ids) {
                yaku += Yaku("hanami-zake", "Hanami-zake (Flower Viewing)", 5)
            }
            if (MOON_ID in ids && SAKE_CUP_ID in ids) {
                yaku += Yaku("tsukimi-zake", "Tsukimi-zake (Moon Viewing)", 5)
            }
            if (BOAR_ID in ids && DEER_ID in ids && BUTTERFLIES_ID in ids) {
                yaku += Yaku("inoshikacho", "Ino-Shika-Cho (Boar, Deer, Butterfly)", 5)
            }

            val ribbons = captured.filter { it.kind == Kind.RIBBON }
            val poetry = ribbons.count { it.ribbon == RibbonColor.POETRY }
            val blue = ribbons.count { it.ribbon == RibbonColor.BLUE }
            if (poetry == 3) {
                yaku += Yaku("akatan", "Akatan (Poetry Ribbons)", 5)
            }
            if (blue == 3) {
                yaku += Yaku("aotan", "Aotan (Blue Ribbons)", 5)
            }
            if (ribbons.size >= 5) {
                yaku += Yaku("tan", "Tan (Ribbons)", 1 + (ribbons.size - 5))
            }

            val animals = captured.count { it.kind == Kind.ANIMAL }
            if (animals >= 5) {
                yaku += Yaku("tane", "Tane (Animals)", 1 + (animals - 5))
            }

            val chaff = captured.count { it.kind == Kind.CHAFF }
            if (chaff >= 10) {
                yaku += Yaku("kasu", "Kasu (Chaff)", 1 + (chaff - 10))
            }

            return yaku
        }

        fun yakuPoints(yaku: List<Yaku>): Int = yaku.sumOf { it.points }

        /**
         * Final round score for a winner holding [points] yaku points.
         * House rules (see PACK.md): 7+ points doubles, and winning after
         * the *opponent* called koi-koi doubles again; the multipliers
         * stack. The winner's own koi-koi carries no extra multiplier.
         */
        fun roundScore(points: Int, opponentCalledKoiKoi: Boolean): Int {
            var score = points
            if (points >= BIG_HAND_THRESHOLD) {
                score *= 2
            }
            if (opponentCalledKoiKoi) {
                score *= 2
            }
            return score
        }

        // -- Bot AI (must mirror the web heuristics exactly) ------------------

        /**
         * How much capturing [card] advances the pile: a base value per
         * kind plus bonuses for every partially-collected yaku the card
         * belongs to.
         */
        fun captureValue(card: Card, captured: List<Card>): Int {
            val ids = captured.map { it.id }.toSet()
            var value = when (card.kind) {
                Kind.BRIGHT -> 10
                Kind.ANIMAL -> 4
                Kind.RIBBON -> 3
                Kind.CHAFF -> 1
            }

            if (card.kind == Kind.BRIGHT) {
                value += captured.count { it.kind == Kind.BRIGHT } * 3
            }
            if (card.id == SAKE_CUP_ID) {
                value += 4 // hanami/tsukimi hinge card
                if (CURTAIN_ID in ids || MOON_ID in ids) {
                    value += 5
                }
            }
            if ((card.id == CURTAIN_ID || card.id == MOON_ID) && SAKE_CUP_ID in ids) {
                value += 5
            }
            val trio = listOf(BOAR_ID, DEER_ID, BUTTERFLIES_ID)
            if (card.id in trio) {
                value += trio.count { it in ids } * 3
            }
            if (card.ribbon == RibbonColor.POETRY || card.ribbon == RibbonColor.BLUE) {
                value += captured.count { it.ribbon == card.ribbon } * 2
            }
            return value
        }

        /**
         * Denial bonus: how much the *player* would want this card, judged
         * from their public capture pile.
         */
        fun denyValue(card: Card, playerCaptured: List<Card>): Int {
            val value = captureValue(card, playerCaptured)
            val baseline = captureValue(card, emptyList())
            return maxOf(0, value - baseline)
        }

        /**
         * Picks the bot's hand play: the capture maximizing advance +
         * denial, or — with no capture available — the discard that risks
         * the least.
         */
        private fun chooseBotPlay(
            hand: List<Card>,
            field: List<Card>,
            botCaptured: List<Card>,
            playerCaptured: List<Card>,
        ): BotPlay {
            var best: BotPlay? = null
            var bestValue = Int.MIN_VALUE
            for (card in hand) {
                val matches = field.filter { it.month == card.month }
                if (matches.isEmpty()) {
                    continue
                }
                if (matches.size >= 3) {
                    val value = matches.fold(captureValue(card, botCaptured)) { sum, target ->
                        sum + captureValue(target, botCaptured) + denyValue(target, playerCaptured)
                    }
                    if (value > bestValue) {
                        bestValue = value
                        best = BotPlay(card, matches)
                    }
                    continue
                }
                for (target in matches) {
                    val value = captureValue(card, botCaptured) +
                        captureValue(target, botCaptured) +
                        denyValue(target, playerCaptured)
                    if (value > bestValue) {
                        bestValue = value
                        best = BotPlay(card, listOf(target))
                    }
                }
            }
            best?.let { return it }

            // No captures: discard the card whose loss (own value + what it
            // could hand the player) is smallest.
            var discard = hand[0]
            var discardRisk = Int.MAX_VALUE
            for (card in hand) {
                val risk = captureValue(card, botCaptured) + denyValue(card, playerCaptured)
                if (risk < discardRisk) {
                    discardRisk = risk
                    discard = card
                }
            }
            return BotPlay(discard, emptyList())
        }

        /**
         * One capture away from a listed yaku? Used both for the bot's own
         * ambition (keep going) and to read the player as a threat.
         */
        fun isCloseToYaku(captured: List<Card>): Boolean {
            val ids = captured.map { it.id }.toSet()
            val dryBrights = captured.count { it.kind == Kind.BRIGHT && it.id != RAIN_MAN_ID }
            val poetry = captured.count { it.ribbon == RibbonColor.POETRY }
            val blue = captured.count { it.ribbon == RibbonColor.BLUE }
            val ribbons = captured.count { it.kind == Kind.RIBBON }
            val animals = captured.count { it.kind == Kind.ANIMAL }
            val chaff = captured.count { it.kind == Kind.CHAFF }
            val trioHeld = listOf(BOAR_ID, DEER_ID, BUTTERFLIES_ID).count { it in ids }
            val hasSake = SAKE_CUP_ID in ids
            return dryBrights == 2 ||
                poetry == 2 ||
                blue == 2 ||
                trioHeld == 2 ||
                ribbons == 4 ||
                animals == 4 ||
                chaff == 9 ||
                (hasSake && (CURTAIN_ID !in ids || MOON_ID !in ids)) ||
                (!hasSake && (CURTAIN_ID in ids || MOON_ID in ids))
        }

        /**
         * The bot's koi-koi/shobu call after forming a yaku: bank big hands
         * and threatened positions; press on only with cards in hand and a
         * bigger yaku in sight.
         */
        fun chooseBotDecision(
            points: Int,
            handSize: Int,
            botCaptured: List<Card>,
            playerCaptured: List<Card>,
        ): String {
            if (points >= BIG_HAND_THRESHOLD) {
                return "shobu"
            }
            if (handSize <= 1) {
                return "shobu"
            }
            if (isCloseToYaku(playerCaptured)) {
                return "shobu"
            }
            return if (isCloseToYaku(botCaptured)) "koikoi" else "shobu"
        }
    }
}
