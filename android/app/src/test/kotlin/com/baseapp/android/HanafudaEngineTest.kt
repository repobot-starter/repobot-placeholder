package com.baseapp.android

import com.baseapp.android.view.games.hanafuda.HanafudaEngine
import kotlin.random.Random
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Exercises the pure Koi-Koi engine against the web engine.ts rules it
 * mirrors: deck composition, the 8/8/8 deal, month-match capture, yaku
 * evaluation, and the koi-koi doubling house rules. Shuffling goes through
 * an injected [Random] (or is bypassed with `dealArranged`), so every test
 * is deterministic.
 */
class HanafudaEngineTest {

    // -- Deck composition -----------------------------------------------------

    @Test
    fun deckHasCanonicalComposition() {
        val deck = HanafudaEngine.FULL_DECK

        assertEquals(48, deck.size)
        assertEquals(5, deck.count { it.kind == HanafudaEngine.Kind.BRIGHT })
        assertEquals(9, deck.count { it.kind == HanafudaEngine.Kind.ANIMAL })
        assertEquals(10, deck.count { it.kind == HanafudaEngine.Kind.RIBBON })
        assertEquals(24, deck.count { it.kind == HanafudaEngine.Kind.CHAFF })

        // Four cards per month, ids stable at (month-1)*4 + slot.
        for (month in 1..12) {
            assertEquals(4, deck.count { it.month == month })
        }
        assertEquals((0 until 48).toList(), deck.map { it.id })

        // Ribbon split: 3 poetry, 3 blue, 4 plain.
        assertEquals(3, deck.count { it.ribbon == HanafudaEngine.RibbonColor.POETRY })
        assertEquals(3, deck.count { it.ribbon == HanafudaEngine.RibbonColor.BLUE })
        assertEquals(4, deck.count { it.ribbon == HanafudaEngine.RibbonColor.PLAIN })

        // The willow oddities and the paulownia extra chaff.
        val willow = deck.filter { it.month == 11 }
        assertEquals(
            listOf(
                HanafudaEngine.Kind.BRIGHT,
                HanafudaEngine.Kind.ANIMAL,
                HanafudaEngine.Kind.RIBBON,
                HanafudaEngine.Kind.CHAFF,
            ),
            willow.map { it.kind },
        )
        val paulownia = deck.filter { it.month == 12 }
        assertEquals(3, paulownia.count { it.kind == HanafudaEngine.Kind.CHAFF })
    }

    // -- Deal shape -------------------------------------------------------------

    @Test
    fun dealIsEightEightEight() {
        val engine = HanafudaEngine(random = Random(seed = 7))

        assertEquals(8, engine.playerHand.size)
        assertEquals(8, engine.botHand.size)
        assertEquals(8, engine.field.size)
        assertEquals(24, engine.deck.size)

        // The player deals (and leads) round 1.
        assertEquals(HanafudaEngine.Seat.PLAYER, engine.dealer)
        assertEquals(HanafudaEngine.Seat.PLAYER, engine.turn)
        assertEquals(HanafudaEngine.Phase.SELECT_HAND, engine.phase)
    }

    // -- Month matching capture ---------------------------------------------------

    @Test
    fun playingAMatchingCardCapturesBothAndFlipsTheDeck() {
        val engine = HanafudaEngine(random = Random(seed = 7))
        engine.dealArranged(arrangedDeck())

        // The crane (id 0, month 1) matches the single pine ribbon (id 1)
        // on the field; the flip (Pine Chaff id 2) then finds no pine left
        // on the field and lands there instead.
        engine.playHandCard(0)

        assertEquals(listOf(0, 1), engine.playerCaptured.map { it.id }.sorted())
        assertEquals(7, engine.playerHand.size)
        // 8 field - 1 captured + 1 flipped discard = 8.
        assertEquals(8, engine.field.size)
        assertTrue(engine.field.any { it.id == 2 })
        assertEquals(23, engine.deck.size)
        // Crane + ribbon is no yaku, so the turn passes to the bot.
        assertEquals(HanafudaEngine.Seat.BOT, engine.turn)
        assertEquals(HanafudaEngine.Phase.BOT_TURN, engine.phase)
    }

    @Test
    fun discardingANonMatchingCardAddsItToTheField() {
        val engine = HanafudaEngine(random = Random(seed = 7))
        engine.dealArranged(arrangedDeck())

        // The Bush Warbler (id 4, month 2): no February card on the field,
        // so the hand play discards. The flip (Pine Chaff id 2) then pairs
        // with the pine ribbon (id 1) still sitting on the field.
        engine.playHandCard(4)

        assertTrue(engine.lastReport!!.playedCaptured.isEmpty())
        assertTrue(engine.field.any { it.id == 4 })
        assertEquals(listOf(1, 2), engine.playerCaptured.map { it.id }.sorted())
        assertEquals(HanafudaEngine.Seat.BOT, engine.turn)
    }

    // -- Yaku evaluation --------------------------------------------------------

    @Test
    fun sankoRequiresThreeDryBrights() {
        val crane = card(HanafudaEngine.CRANE_ID)
        val curtain = card(HanafudaEngine.CURTAIN_ID)
        val moon = card(HanafudaEngine.MOON_ID)
        val rain = card(HanafudaEngine.RAIN_MAN_ID)
        val phoenix = card(HanafudaEngine.PHOENIX_ID)

        val sanko = HanafudaEngine.evaluateYaku(listOf(crane, curtain, moon))
        assertEquals(listOf("sanko"), sanko.map { it.key })
        assertEquals(6, sanko[0].points)

        // Rain Man does not count toward sanko: three brights including him
        // score nothing on the bright track.
        assertTrue(HanafudaEngine.evaluateYaku(listOf(crane, curtain, rain)).isEmpty())

        // Four with rain is ame-shiko (7); four dry is shiko (8); five goko.
        assertEquals(
            listOf(7),
            HanafudaEngine.evaluateYaku(listOf(crane, curtain, moon, rain)).map { it.points },
        )
        assertEquals(
            listOf(8),
            HanafudaEngine.evaluateYaku(listOf(crane, curtain, moon, phoenix)).map { it.points },
        )
        assertEquals(
            listOf(15),
            HanafudaEngine.evaluateYaku(listOf(crane, curtain, moon, rain, phoenix))
                .map { it.points },
        )
    }

    @Test
    fun hanamiZakeIsCurtainPlusSakeCup() {
        val yaku = HanafudaEngine.evaluateYaku(
            listOf(card(HanafudaEngine.CURTAIN_ID), card(HanafudaEngine.SAKE_CUP_ID)),
        )
        assertEquals(listOf("hanami-zake"), yaku.map { it.key })
        assertEquals(5, yaku[0].points)

        // Adding the moon stacks tsukimi-zake on top.
        val both = HanafudaEngine.evaluateYaku(
            listOf(
                card(HanafudaEngine.CURTAIN_ID),
                card(HanafudaEngine.SAKE_CUP_ID),
                card(HanafudaEngine.MOON_ID),
            ),
        )
        assertTrue(both.any { it.key == "hanami-zake" })
        assertTrue(both.any { it.key == "tsukimi-zake" })
    }

    @Test
    fun akatanIsThePoetryRibbons() {
        // Ids 1, 5, 9: the pine/plum/cherry poetry ribbons.
        val yaku = HanafudaEngine.evaluateYaku(listOf(card(1), card(5), card(9)))
        assertEquals(listOf("akatan"), yaku.map { it.key })
        assertEquals(5, yaku[0].points)

        // Two of them are not enough.
        assertTrue(HanafudaEngine.evaluateYaku(listOf(card(1), card(5))).isEmpty())
    }

    @Test
    fun kasuCountsOnePointPlusOnePerExtraChaff() {
        // Ten chaff cards: 1 point; every extra adds one.
        val tenChaff = listOf(2, 3, 6, 7, 10, 11, 14, 15, 18, 19).map(::card)
        val ten = HanafudaEngine.evaluateYaku(tenChaff)
        assertEquals(listOf("kasu"), ten.map { it.key })
        assertEquals(1, ten[0].points)

        val twelve = HanafudaEngine.evaluateYaku(tenChaff + listOf(card(22), card(23)))
        assertEquals(3, twelve[0].points)

        // Nine chaff is nothing.
        assertTrue(HanafudaEngine.evaluateYaku(tenChaff.dropLast(1)).isEmpty())
    }

    // -- Koi-koi scoring house rules ------------------------------------------------

    @Test
    fun koiKoiThenBiggerWinAppliesStandardScoring() {
        val engine = HanafudaEngine(random = Random(seed = 7))
        engine.dealArranged(arrangedDeck())

        // The player forms akatan (5 points) and calls koi-koi...
        engine.setCaptured(listOf(card(1), card(5), card(9)), HanafudaEngine.Seat.PLAYER)
        engine.phase = HanafudaEngine.Phase.DECISION
        engine.declareKoiKoi()
        assertTrue(engine.playerCalledKoiKoi)
        assertEquals(HanafudaEngine.Seat.BOT, engine.turn)

        // ...then grows the hand to 7 points (akatan 5 + tan with 6 ribbons
        // 2) and banks. Own koi-koi carries no penalty; 7+ doubles → 14.
        engine.setCaptured(
            listOf(card(1), card(5), card(9), card(13), card(17), card(25)),
            HanafudaEngine.Seat.PLAYER,
        )
        engine.phase = HanafudaEngine.Phase.DECISION
        engine.declareShobu()

        assertEquals(HanafudaEngine.Seat.PLAYER, engine.results.last().winner)
        assertEquals(7, engine.results.last().basePoints)
        assertEquals(14, engine.results.last().score)
        assertEquals(listOf(14), engine.playerScores)
        assertEquals(listOf(0), engine.botScores)
    }

    @Test
    fun winningAfterOpponentsKoiKoiDoubles() {
        val engine = HanafudaEngine(random = Random(seed = 7))
        engine.dealArranged(arrangedDeck())

        // The bot called koi-koi earlier in the round; the player banks
        // akatan (5 points): 5 x 2 = 10. Below 7, so no big-hand double.
        engine.botCalledKoiKoi = true
        engine.setCaptured(listOf(card(1), card(5), card(9)), HanafudaEngine.Seat.PLAYER)
        engine.phase = HanafudaEngine.Phase.DECISION
        engine.declareShobu()

        assertEquals(5, engine.results.last().basePoints)
        assertEquals(10, engine.results.last().score)
    }

    @Test
    fun roundScoreMultipliersStack() {
        // Plain hands score face value.
        assertEquals(5, HanafudaEngine.roundScore(5, opponentCalledKoiKoi = false))
        // 7+ doubles.
        assertEquals(14, HanafudaEngine.roundScore(7, opponentCalledKoiKoi = false))
        // Opponent's koi-koi doubles.
        assertEquals(10, HanafudaEngine.roundScore(5, opponentCalledKoiKoi = true))
        // Both multipliers stack: 8 → 16 → 32.
        assertEquals(32, HanafudaEngine.roundScore(8, opponentCalledKoiKoi = true))
    }

    // -- Helpers ------------------------------------------------------------------

    private fun card(id: Int): HanafudaEngine.Card = HanafudaEngine.FULL_DECK[id]

    /**
     * A fixed 48-card arrangement (front-first: player hand, bot hand,
     * field, draw pile) giving the player a known single pine match.
     */
    private fun arrangedDeck(): List<HanafudaEngine.Card> {
        val playerHand = listOf(0, 4, 5, 6, 7, 10, 12, 16)
        val botHand = listOf(44, 45, 46, 47, 40, 41, 42, 43)
        val field = listOf(1, 9, 13, 17, 24, 28, 32, 36)
        val dealt = (playerHand + botHand + field).toSet()
        val draw = listOf(2, 3) + (0 until 48).filter { it !in dealt && it != 2 && it != 3 }
        return (playerHand + botHand + field + draw).map(::card)
    }
}
