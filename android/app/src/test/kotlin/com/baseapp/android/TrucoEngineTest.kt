package com.baseapp.android

import com.baseapp.android.view.games.truco.TrucoEngine
import com.baseapp.android.view.games.truco.TrucoEngine.Card
import com.baseapp.android.view.games.truco.TrucoEngine.Rank
import com.baseapp.android.view.games.truco.TrucoEngine.Suit
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Exercises the pure Truco engine against the web engine.ts rules it mirrors:
 * manilha ordering, plain-rank comparison, the empate rules, the raise
 * ladder, fold stakes, mão de onze, and the win-at-12 game end.
 *
 * The engine takes an injectable random source; a constant 0.99 makes every
 * test deterministic: the shuffle is the identity ((0.99·(i+1)).toInt() == i),
 * the bot never spontaneously raises (its urge caps at 0.8), and with
 * bluff = 0 it never bluffs.
 */
class TrucoEngineTest {
    private fun engine(bluff: Double = 0.0): TrucoEngine =
        TrucoEngine(bluff = bluff, random = { 0.99 })

    @Test
    fun manilhaBeatsEverythingAndRanksBySuit() {
        // Vira 4 → manilha is 5 (the rank above the vira); wrap: vira 3 → 4.
        assertEquals(Rank.FIVE, TrucoEngine.manilhaRankFor(Rank.FOUR))
        assertEquals(Rank.FOUR, TrucoEngine.manilhaRankFor(Rank.THREE))

        val manilha = Rank.FIVE
        val zap = TrucoEngine.cardStrength(Card(Rank.FIVE, Suit.CLUBS), manilha)
        val copas = TrucoEngine.cardStrength(Card(Rank.FIVE, Suit.HEARTS), manilha)
        val espadas = TrucoEngine.cardStrength(Card(Rank.FIVE, Suit.SPADES), manilha)
        val ouros = TrucoEngine.cardStrength(Card(Rank.FIVE, Suit.DIAMONDS), manilha)

        // Suit ladder among manilhas: clubs > hearts > spades > diamonds.
        assertTrue(zap > copas)
        assertTrue(copas > espadas)
        assertTrue(espadas > ouros)

        // The weakest manilha still beats the strongest plain card (a 3).
        val bestPlain = TrucoEngine.cardStrength(Card(Rank.THREE, Suit.CLUBS), manilha)
        assertTrue(ouros > bestPlain)
    }

    @Test
    fun plainCardRankOrder() {
        // With manilha Q out of the way: 4 < 5 < 6 < 7 < J < K < A < 2 < 3.
        val manilha = Rank.QUEEN
        val ascending = listOf(
            Rank.FOUR, Rank.FIVE, Rank.SIX, Rank.SEVEN,
            Rank.JACK, Rank.KING, Rank.ACE, Rank.TWO, Rank.THREE,
        )
        val strengths = ascending.map { TrucoEngine.cardStrength(Card(it, Suit.SPADES), manilha) }
        assertEquals(strengths.sorted(), strengths)
        assertEquals(strengths.size, strengths.toSet().size)

        // Plain cards of equal rank tie regardless of suit.
        assertEquals(
            TrucoEngine.cardStrength(Card(Rank.KING, Suit.CLUBS), manilha),
            TrucoEngine.cardStrength(Card(Rank.KING, Suit.DIAMONDS), manilha),
        )
    }

    @Test
    fun tiedFirstTrickIsDecidedByTheSecond() {
        val engine = engine()
        engine.newGame()
        // Vira 7♥ → manilha Q. The bot holds only plain 3s, so trick one
        // (3 vs 3) must tie, and the player's zap (Q♣) decides trick two.
        engine.setHands(
            playerHand = listOf(
                Card(Rank.THREE, Suit.SPADES),
                Card(Rank.QUEEN, Suit.CLUBS),
                Card(Rank.FIVE, Suit.DIAMONDS),
            ),
            botHand = listOf(
                Card(Rank.THREE, Suit.HEARTS),
                Card(Rank.THREE, Suit.DIAMONDS),
                Card(Rank.THREE, Suit.CLUBS),
            ),
            vira = Card(Rank.SEVEN, Suit.HEARTS),
        )

        engine.playCard(0)
        var events = engine.botAct()
        assertTrue(events.contains(TrucoEngine.Event.TrickResolved(TrucoEngine.TrickResult.TIE)))
        assertEquals(listOf(TrucoEngine.TrickResult.TIE), engine.trickResults)
        assertNull(engine.handWinner)
        // A tie keeps the same leader, so the player acts again.
        assertEquals(TrucoEngine.Phase.PLAYER_TURN, engine.phase)

        // Trick two: the zap manilha beats any plain 3 → hand over immediately.
        engine.playCard(0)
        events = engine.botAct()
        assertTrue(events.contains(TrucoEngine.Event.TrickResolved(TrucoEngine.TrickResult.PLAYER)))
        assertTrue(events.contains(TrucoEngine.Event.HandEnded(TrucoEngine.Seat.PLAYER, 1)))
        assertEquals(1, engine.playerScore)
        assertEquals(TrucoEngine.Phase.HAND_OVER, engine.phase)
    }

    @Test
    fun raiseLadderStakes() {
        assertEquals(3, TrucoEngine.nextStake(1))
        assertEquals(6, TrucoEngine.nextStake(3))
        assertEquals(9, TrucoEngine.nextStake(6))
        assertEquals(12, TrucoEngine.nextStake(9))
        assertNull(TrucoEngine.nextStake(12))

        val engine = engine()
        engine.newGame()
        // Bot hand strength 0.955 (zap + copas manilhas + a 3): it always
        // re-raises, walking the ladder without any randomness.
        engine.setHands(
            playerHand = listOf(
                Card(Rank.FOUR, Suit.DIAMONDS),
                Card(Rank.FIVE, Suit.DIAMONDS),
                Card(Rank.SIX, Suit.DIAMONDS),
            ),
            botHand = listOf(
                Card(Rank.QUEEN, Suit.CLUBS),
                Card(Rank.QUEEN, Suit.HEARTS),
                Card(Rank.THREE, Suit.DIAMONDS),
            ),
            vira = Card(Rank.SEVEN, Suit.HEARTS),
        )

        // Player: "Truco!" (3). Bot accepts and re-raises to 6.
        var events = engine.playerCallRaise()
        assertTrue(events.contains(TrucoEngine.Event.BotRaised(6)))
        assertEquals(3, engine.stake)
        assertEquals(6, engine.proposedStake)
        assertEquals(TrucoEngine.Phase.RESPOND, engine.phase)

        // Player: re-raise 6 → 9. Bot re-raises to 12.
        events = engine.respondToRaise(TrucoEngine.RaiseResponse.RAISE)
        assertTrue(events.contains(TrucoEngine.Event.BotRaised(12)))
        assertEquals(9, engine.stake)
        assertEquals(12, engine.proposedStake)

        // Player accepts Doze: the hand is now worth 12 and play resumes.
        engine.respondToRaise(TrucoEngine.RaiseResponse.ACCEPT)
        assertEquals(12, engine.stake)
        assertNull(engine.proposedStake)
        assertEquals(TrucoEngine.Phase.PLAYER_TURN, engine.phase)
        // The ladder is exhausted: nobody can raise above 12.
        assertFalse(engine.canRaise(TrucoEngine.Seat.PLAYER))
    }

    @Test
    fun foldAwardsTheCurrentStake() {
        // Bot folds to "Truco!": the player wins the pre-raise stake (1).
        val weakBot = engine()
        weakBot.newGame()
        weakBot.setHands(
            playerHand = listOf(
                Card(Rank.THREE, Suit.SPADES),
                Card(Rank.TWO, Suit.SPADES),
                Card(Rank.ACE, Suit.SPADES),
            ),
            botHand = listOf(
                Card(Rank.FOUR, Suit.DIAMONDS),
                Card(Rank.FIVE, Suit.HEARTS),
                Card(Rank.SIX, Suit.DIAMONDS),
            ),
            vira = Card(Rank.SEVEN, Suit.HEARTS),
        )
        val events = weakBot.playerCallRaise()
        assertTrue(events.contains(TrucoEngine.Event.BotFolded))
        assertTrue(events.contains(TrucoEngine.Event.HandEnded(TrucoEngine.Seat.PLAYER, 1)))
        assertEquals(1, weakBot.playerScore)
        assertEquals(0, weakBot.botScore)

        // Player folds to the bot's re-raise to 6: the bot wins the accepted 3.
        val strongBot = engine()
        strongBot.newGame()
        strongBot.setHands(
            playerHand = listOf(
                Card(Rank.FOUR, Suit.DIAMONDS),
                Card(Rank.FIVE, Suit.DIAMONDS),
                Card(Rank.SIX, Suit.DIAMONDS),
            ),
            botHand = listOf(
                Card(Rank.QUEEN, Suit.CLUBS),
                Card(Rank.QUEEN, Suit.HEARTS),
                Card(Rank.THREE, Suit.DIAMONDS),
            ),
            vira = Card(Rank.SEVEN, Suit.HEARTS),
        )
        strongBot.playerCallRaise() // Truco → bot re-raises to 6, stake now 3.
        assertEquals(3, strongBot.stake)
        strongBot.respondToRaise(TrucoEngine.RaiseResponse.FOLD)
        assertEquals(3, strongBot.botScore)
        assertEquals(TrucoEngine.Phase.HAND_OVER, strongBot.phase)
    }

    @Test
    fun maoDeOnzePlayLocksStakeAtThree() {
        val engine = engine()
        engine.setScores(player = 11, bot = 5)
        engine.startHand()
        assertEquals(TrucoEngine.Phase.MAO_DE_ONZE, engine.phase)

        engine.decideMaoDeOnze(play = true)
        assertEquals(3, engine.stake)
        // No truco calls on a mão de onze hand.
        assertEquals(TrucoEngine.Phase.PLAYER_TURN, engine.phase)
        assertFalse(engine.canRaise(TrucoEngine.Seat.PLAYER))
        assertTrue(engine.playerCallRaise().isEmpty())
    }

    @Test
    fun maoDeOnzeFoldConcedesOnePoint() {
        val engine = engine()
        engine.setScores(player = 11, bot = 5)
        engine.startHand()

        val events = engine.decideMaoDeOnze(play = false)
        assertTrue(events.contains(TrucoEngine.Event.HandEnded(TrucoEngine.Seat.BOT, 1)))
        assertEquals(6, engine.botScore)
        assertEquals(TrucoEngine.Phase.HAND_OVER, engine.phase)
    }

    @Test
    fun botFoldsItsOwnWeakMaoDeOnze() {
        // With random() == 0.99 the shuffle is the identity, dealing the bot
        // 7♦ Q♦ J♦ (strength 0.38 < 0.5) — with bluff 0 it must fold,
        // handing the player 1 point.
        val engine = engine()
        engine.setScores(player = 5, bot = 11)
        val events = engine.startHand()
        assertTrue(events.contains(TrucoEngine.Event.HandEnded(TrucoEngine.Seat.PLAYER, 1)))
        assertEquals(6, engine.playerScore)
        assertEquals(TrucoEngine.Phase.HAND_OVER, engine.phase)
    }

    @Test
    fun winningHandAtElevenReachesTwelveAndEndsTheGame() {
        val engine = engine()
        engine.newGame()
        engine.setScores(player = 11, bot = 0)
        // Two manilhas take two straight tricks against a plain bot hand.
        engine.setHands(
            playerHand = listOf(
                Card(Rank.QUEEN, Suit.CLUBS),
                Card(Rank.QUEEN, Suit.HEARTS),
                Card(Rank.FOUR, Suit.DIAMONDS),
            ),
            botHand = listOf(
                Card(Rank.FOUR, Suit.SPADES),
                Card(Rank.FIVE, Suit.SPADES),
                Card(Rank.SIX, Suit.SPADES),
            ),
            vira = Card(Rank.SEVEN, Suit.HEARTS),
        )

        engine.playCard(0)
        engine.botAct()
        assertEquals(listOf(TrucoEngine.TrickResult.PLAYER), engine.trickResults)

        engine.playCard(0)
        val events = engine.botAct()
        assertTrue(events.contains(TrucoEngine.Event.HandEnded(TrucoEngine.Seat.PLAYER, 1)))
        assertTrue(events.contains(TrucoEngine.Event.GameEnded(TrucoEngine.Seat.PLAYER)))
        assertEquals(TrucoEngine.WINNING_SCORE, engine.playerScore)
        assertEquals(TrucoEngine.Seat.PLAYER, engine.gameWinner)
        assertEquals(TrucoEngine.Phase.GAME_OVER, engine.phase)

        // A finished game is inert until newGame().
        assertTrue(engine.startHand().isEmpty())
        assertTrue(engine.playCard(0).isEmpty())
    }
}
