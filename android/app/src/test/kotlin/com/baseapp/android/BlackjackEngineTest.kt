package com.baseapp.android

import com.baseapp.android.view.games.blackjack.BlackjackEngine
import com.baseapp.android.view.games.blackjack.BlackjackEngine.Card
import com.baseapp.android.view.games.blackjack.BlackjackEngine.HandResult
import com.baseapp.android.view.games.blackjack.BlackjackEngine.HandTotal
import com.baseapp.android.view.games.blackjack.BlackjackEngine.Phase
import com.baseapp.android.view.games.blackjack.BlackjackEngine.Rank
import com.baseapp.android.view.games.blackjack.BlackjackEngine.ResultKind
import com.baseapp.android.view.games.blackjack.BlackjackEngine.Suit
import kotlin.random.Random
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Exercises the pure blackjack engine against the web `cards.ts` /
 * `BlackjackPage.tsx` rules it mirrors: soft/hard hand valuation, the
 * dealer's stand-on-all-17s policy, 3:2 naturals, double down, pushes, the
 * 25% reshuffle point, and shuffle determinism under an injected RNG.
 */
class BlackjackEngineTest {
    // ------------------------------------------------------------------
    // Hand valuation
    // ------------------------------------------------------------------

    @Test
    fun handTotalsWithAces() {
        // Hard hand, no aces.
        assertEquals(HandTotal(17, soft = false), total(Rank.KING, Rank.SEVEN))

        // A+6 is soft 17: the ace still counts 11.
        assertEquals(HandTotal(17, soft = true), total(Rank.ACE, Rank.SIX))

        // A+6+9: the ace must demote to 1 to avoid busting — hard 16.
        assertEquals(HandTotal(16, soft = false), total(Rank.ACE, Rank.SIX, Rank.NINE))

        // Two aces: one stays 11, one demotes — soft 12.
        assertEquals(HandTotal(12, soft = true), total(Rank.ACE, Rank.ACE))

        // Three aces + 8: A+A+A+8 = 11+1+1+8 — soft 21.
        assertEquals(HandTotal(21, soft = true), total(Rank.ACE, Rank.ACE, Rank.ACE, Rank.EIGHT))

        // All aces demoted and still over 21 stays a bust total.
        assertEquals(HandTotal(23, soft = false), total(Rank.ACE, Rank.KING, Rank.QUEEN, Rank.TWO))
    }

    @Test
    fun blackjackIsExactlyTwoCardTwentyOne() {
        assertTrue(BlackjackEngine.isBlackjack(hand(Rank.ACE, Rank.KING)))
        // 21 in three cards is not a natural.
        assertFalse(BlackjackEngine.isBlackjack(hand(Rank.SEVEN, Rank.SEVEN, Rank.SEVEN)))
        assertFalse(BlackjackEngine.isBlackjack(hand(Rank.ACE, Rank.NINE)))
    }

    // ------------------------------------------------------------------
    // Dealer policy
    // ------------------------------------------------------------------

    @Test
    fun dealerDrawsToSeventeenThenStands() {
        // Player 20 vs dealer 2+4: the dealer must keep drawing while under
        // 17 (10 → 16, then 5 → 21) and stop the moment it reaches 17+.
        val engine = dealtEngine(
            bet = 10,
            playerRanks = listOf(Rank.TEN, Rank.QUEEN),
            dealerRanks = listOf(Rank.TWO, Rank.FOUR),
            shoeRanks = listOf(Rank.TEN, Rank.FIVE, Rank.NINE),
        )
        engine.stand()
        finishDealerTurn(engine)

        // Drew exactly 10 and 5 (the trailing 9 stays in the shoe).
        assertEquals(4, engine.dealerCards.size)
        assertEquals(21, BlackjackEngine.handTotal(engine.dealerCards).total)
    }

    @Test
    fun dealerStandsOnSoftSeventeen() {
        // Dealer A+6 is soft 17. The web draw condition is `total < 17`, so
        // the dealer stands — it must not draw the ten waiting in the shoe.
        val engine = dealtEngine(
            bet = 10,
            playerRanks = listOf(Rank.TEN, Rank.EIGHT),
            dealerRanks = listOf(Rank.ACE, Rank.SIX),
            shoeRanks = listOf(Rank.TEN),
        )
        engine.stand()
        finishDealerTurn(engine)

        assertEquals(2, engine.dealerCards.size)
        assertEquals(HandTotal(17, soft = true), BlackjackEngine.handTotal(engine.dealerCards))
        // Player 18 beats dealer soft 17.
        assertEquals(HandResult(ResultKind.WIN, 10.0), engine.result)
    }

    @Test
    fun dealerStandsOnHardSeventeenAndWinsShowdown() {
        val engine = dealtEngine(
            bet = 10,
            playerRanks = listOf(Rank.NINE, Rank.SEVEN),
            dealerRanks = listOf(Rank.TEN, Rank.SEVEN),
            shoeRanks = listOf(Rank.FIVE),
        )
        engine.stand()
        finishDealerTurn(engine)

        assertEquals(2, engine.dealerCards.size)
        assertEquals(HandResult(ResultKind.LOSE, -10.0), engine.result)
        assertEquals(490.0, engine.bankroll, 0.0)
    }

    // ------------------------------------------------------------------
    // Payouts
    // ------------------------------------------------------------------

    @Test
    fun blackjackPaysThreeToTwo() {
        // Player A+K natural vs dealer 20: pays 3:2 — a $10 stake returns $25.
        val engine = dealtEngine(
            bet = 10,
            playerRanks = listOf(Rank.ACE, Rank.KING),
            dealerRanks = listOf(Rank.TEN, Rank.QUEEN),
            shoeRanks = emptyList(),
        )

        assertEquals(Phase.SETTLED, engine.phase)
        assertEquals(HandResult(ResultKind.BLACKJACK, 15.0), engine.result)
        assertEquals(515.0, engine.bankroll, 0.0)
    }

    @Test
    fun blackjackOnOddBetPaysFractionalCents() {
        // The web allows fractional payouts (a $5 chip is odd for 3:2): a $5
        // natural nets $7.50.
        val engine = dealtEngine(
            bet = 5,
            playerRanks = listOf(Rank.ACE, Rank.QUEEN),
            dealerRanks = listOf(Rank.NINE, Rank.EIGHT),
            shoeRanks = emptyList(),
        )

        assertEquals(HandResult(ResultKind.BLACKJACK, 7.5), engine.result)
        assertEquals(507.5, engine.bankroll, 0.0)
    }

    @Test
    fun dealerNaturalBeatsDealtTwentyOne() {
        // A player 21 that is not a natural still loses to a dealer natural.
        val engine = dealtEngine(
            bet = 20,
            playerRanks = listOf(Rank.TEN, Rank.NINE),
            dealerRanks = listOf(Rank.ACE, Rank.KING),
            shoeRanks = emptyList(),
        )

        assertEquals(Phase.SETTLED, engine.phase)
        assertEquals(HandResult(ResultKind.LOSE, -20.0), engine.result)
    }

    @Test
    fun bothNaturalsPush() {
        val engine = dealtEngine(
            bet = 20,
            playerRanks = listOf(Rank.ACE, Rank.KING),
            dealerRanks = listOf(Rank.ACE, Rank.QUEEN),
            shoeRanks = emptyList(),
        )

        assertEquals(HandResult(ResultKind.PUSH, 0.0), engine.result)
        assertEquals(500.0, engine.bankroll, 0.0)
    }

    @Test
    fun pushReturnsBet() {
        // Player 18 vs dealer 18: the stake comes back, bankroll unchanged.
        val engine = dealtEngine(
            bet = 25,
            playerRanks = listOf(Rank.TEN, Rank.EIGHT),
            dealerRanks = listOf(Rank.TEN, Rank.EIGHT),
            shoeRanks = emptyList(),
        )
        engine.stand()
        finishDealerTurn(engine)

        assertEquals(HandResult(ResultKind.PUSH, 0.0), engine.result)
        assertEquals(500.0, engine.bankroll, 0.0)
        assertEquals(1, engine.stats.pushes)
    }

    @Test
    fun bustLosesImmediatelyWithoutDealerDraw() {
        val engine = dealtEngine(
            bet = 10,
            playerRanks = listOf(Rank.TEN, Rank.SIX),
            dealerRanks = listOf(Rank.TWO, Rank.THREE),
            shoeRanks = listOf(Rank.KING, Rank.NINE),
        )
        engine.hit()

        // 10+6+K busts: settled on the spot, dealer keeps two cards.
        assertEquals(Phase.SETTLED, engine.phase)
        assertEquals(HandResult(ResultKind.BUST, -10.0), engine.result)
        assertEquals(2, engine.dealerCards.size)
        assertFalse(engine.holeHidden)
    }

    // ------------------------------------------------------------------
    // Double down
    // ------------------------------------------------------------------

    @Test
    fun doubleDownDoublesBetAndDrawsExactlyOneCard() {
        // Player 5+6 doubles: bet 10 → 20, one card (9 → 20), then the
        // dealer plays out and loses with 19.
        val engine = dealtEngine(
            bet = 10,
            playerRanks = listOf(Rank.FIVE, Rank.SIX),
            dealerRanks = listOf(Rank.TEN, Rank.SIX),
            shoeRanks = listOf(Rank.NINE, Rank.THREE, Rank.KING),
        )
        assertTrue(engine.canDouble)
        engine.doubleDown()

        assertEquals(20, engine.bet)
        assertEquals(3, engine.playerCards.size)
        // No further player actions: the hand went straight to the dealer.
        assertNotEquals(Phase.PLAYER, engine.phase)

        finishDealerTurn(engine)
        // Dealer 16 draws the 3 → 19; player 20 wins a doubled stake.
        assertEquals(HandResult(ResultKind.WIN, 20.0), engine.result)
        assertEquals(520.0, engine.bankroll, 0.0)
    }

    @Test
    fun doubleDownBustSettlesImmediatelyAndLosesDoubledBet() {
        val engine = dealtEngine(
            bet = 10,
            playerRanks = listOf(Rank.EIGHT, Rank.SEVEN),
            dealerRanks = listOf(Rank.TEN, Rank.SIX),
            shoeRanks = listOf(Rank.KING),
        )
        engine.doubleDown()

        assertEquals(Phase.SETTLED, engine.phase)
        assertEquals(3, engine.playerCards.size)
        assertEquals(HandResult(ResultKind.BUST, -20.0), engine.result)
        assertEquals(480.0, engine.bankroll, 0.0)
    }

    @Test
    fun doubleDownRequiresTwoCardsAndCoveringBankroll() {
        // After a hit the double option is gone, like the web canDouble.
        val engine = dealtEngine(
            bet = 10,
            playerRanks = listOf(Rank.TWO, Rank.THREE),
            dealerRanks = listOf(Rank.TEN, Rank.SIX),
            shoeRanks = listOf(Rank.FOUR, Rank.FIVE, Rank.SIX),
        )
        engine.hit()
        assertFalse(engine.canDouble)

        // A bet the bankroll cannot match twice also cannot double: bankroll
        // 500, bet 500 → after dealing the bankroll is 0 < bet.
        val broke = BlackjackEngine(bankroll = 500.0)
        repeat(5) { broke.addChip(100) }
        broke.setShoe(fullDrawShoe(listOf(Rank.TWO, Rank.THREE, Rank.TEN, Rank.SIX)))
        broke.deal()
        assertEquals(Phase.PLAYER, broke.phase)
        assertFalse(broke.canDouble)
    }

    // ------------------------------------------------------------------
    // Shoe & determinism
    // ------------------------------------------------------------------

    @Test
    fun shoeReshufflesAtQuarterRemaining() {
        // 25% of the six-deck shoe: floor(312 * 0.25) = 78 cards.
        assertEquals(78, BlackjackEngine.RESHUFFLE_AT)

        // First draw of a session: the empty shoe reshuffles immediately
        // (the web's shoe ref also starts empty for exactly this reason).
        val fresh = BlackjackEngine(random = Random(seed = 1))
        fresh.addChip(5)
        fresh.deal()
        assertEquals(1, fresh.shuffleCount)
        assertEquals(BlackjackEngine.SHOE_SIZE - 4, fresh.shoeCount)

        // A shoe holding more than RESHUFFLE_AT cards through the whole deal
        // must NOT reshuffle: 78 + 1 filler cards under 4 scripted draws.
        val above = BlackjackEngine(random = Random(seed = 1))
        above.addChip(5)
        above.setShoe(
            List(BlackjackEngine.RESHUFFLE_AT + 1) { filler() } +
                hand(Rank.SIX, Rank.TEN, Rank.FIVE, Rank.NINE).reversed(),
        )
        above.deal()
        assertEquals(0, above.shuffleCount)
        assertEquals(BlackjackEngine.RESHUFFLE_AT + 1, above.shoeCount)

        // At exactly RESHUFFLE_AT cards the next draw rebuilds the shoe first.
        val at = BlackjackEngine(random = Random(seed = 1))
        at.addChip(5)
        at.setShoe(List(BlackjackEngine.RESHUFFLE_AT) { filler() })
        at.deal()
        assertEquals(1, at.shuffleCount)
        assertEquals(BlackjackEngine.SHOE_SIZE - 4, at.shoeCount)
    }

    @Test
    fun injectedRandomMakesDealsDeterministic() {
        // Two engines fed identically-seeded RNGs must shuffle identical
        // shoes and therefore deal identical hands.
        val first = BlackjackEngine(random = Random(seed = 42))
        val second = BlackjackEngine(random = Random(seed = 42))
        for (engine in listOf(first, second)) {
            engine.addChip(25)
            engine.deal()
        }
        assertEquals(first.playerCards, second.playerCards)
        assertEquals(first.dealerCards, second.dealerCards)

        // A different seed produces a different deal (overwhelmingly likely
        // for any two of the 312! shoe orders; fixed seeds keep this stable).
        val third = BlackjackEngine(random = Random(seed = 7))
        third.addChip(25)
        third.deal()
        assertNotEquals(
            first.playerCards + first.dealerCards,
            third.playerCards + third.dealerCards,
        )
    }

    @Test
    fun bankrollArithmeticAcrossBetting() {
        val engine = BlackjackEngine()

        // Chips accumulate and clamp to the bankroll.
        engine.addChip(100)
        engine.addChip(100)
        assertEquals(200, engine.bet)
        engine.addChip(100)
        engine.addChip(100)
        engine.addChip(100)
        // A sixth $100 chip would exceed the $500 bankroll and is ignored.
        engine.addChip(100)
        assertEquals(500, engine.bet)
        engine.clearBet()
        assertEquals(0, engine.bet)

        // The stake leaves the bankroll at deal time.
        engine.addChip(25)
        engine.setShoe(fullDrawShoe(listOf(Rank.TWO, Rank.THREE, Rank.TEN, Rank.SIX)))
        engine.deal()
        assertEquals(475.0, engine.bankroll, 0.0)
        assertEquals(0, engine.shuffleCount)
    }

    @Test
    fun houseCreditRestoresStartingBankroll() {
        val engine = BlackjackEngine(bankroll = 0.0)
        assertTrue(engine.isBroke)
        engine.takeHouseCredit()
        assertEquals(BlackjackEngine.STARTING_BANKROLL, engine.bankroll, 0.0)
        assertFalse(engine.isBroke)
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private fun card(rank: Rank, suit: Suit = Suit.SPADES): Card = Card(rank, suit)

    private fun filler(): Card = Card(Rank.TWO, Suit.CLUBS)

    private fun hand(vararg ranks: Rank): List<Card> = ranks.map { card(it) }

    private fun total(vararg ranks: Rank): HandTotal =
        BlackjackEngine.handTotal(hand(*ranks))

    /**
     * Builds a shoe that deals [draws] in order, padded with filler twos so
     * the draw count never crosses the reshuffle point. The engine pops from
     * the END of the shoe (web `shoe.pop()`), so the draw order is reversed
     * onto the padding.
     */
    private fun fullDrawShoe(draws: List<Rank>): List<Card> =
        List(BlackjackEngine.SHOE_SIZE - draws.size) { filler() } +
            draws.reversed().map { card(it) }

    /**
     * Engine mid-hand: bet placed and cards dealt exactly as scripted —
     * player [playerRanks], dealer [dealerRanks], with [shoeRanks] next up.
     */
    private fun dealtEngine(
        bet: Int,
        playerRanks: List<Rank>,
        dealerRanks: List<Rank>,
        shoeRanks: List<Rank>,
    ): BlackjackEngine {
        val engine = BlackjackEngine()
        repeat(bet / 5) { engine.addChip(5) }
        // Deal order is player, dealer up, player, dealer hole.
        val dealt = listOf(playerRanks[0], dealerRanks[0], playerRanks[1], dealerRanks[1])
        engine.setShoe(fullDrawShoe(dealt + shoeRanks))
        engine.deal()
        return engine
    }

    /** Runs the dealer's paced draw loop to completion, like the view does. */
    private fun finishDealerTurn(engine: BlackjackEngine) {
        while (engine.phase == Phase.DEALER) {
            engine.dealerStep()
        }
    }
}
