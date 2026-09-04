package com.baseapp.android

import com.baseapp.android.view.quiz.QuizEngine
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Mirrors the web pack's engine.test.ts and iOS QuizEngineTests so quiz
 * scoring means the same thing on every platform.
 */
class QuizEngineTest {
    private val question = QuizEngine.Question(
        prompt = "2 + 2?",
        choices = listOf("3", "4", "5"),
        answerIndex = 1,
    )

    @Test
    fun `answerQuestion marks correctness`() {
        val right = QuizEngine.answerQuestion(question, questionIndex = 0, choiceIndex = 1)
        assertTrue(right.correct)
        assertEquals(0, right.questionIndex)
        assertEquals(1, right.choiceIndex)

        assertFalse(QuizEngine.answerQuestion(question, questionIndex = 0, choiceIndex = 2).correct)
    }

    @Test
    fun `summarize counts correct answers and rounds the percent`() {
        val records = listOf(
            QuizEngine.answerQuestion(question, questionIndex = 0, choiceIndex = 1),
            QuizEngine.answerQuestion(question, questionIndex = 1, choiceIndex = 0),
            QuizEngine.answerQuestion(question, questionIndex = 2, choiceIndex = 1),
        )
        assertEquals(
            QuizEngine.QuizResult(total = 3, correct = 2, percent = 67),
            QuizEngine.summarize(records, total = 3),
        )
    }

    @Test
    fun `summarize handles an empty quiz`() {
        assertEquals(
            QuizEngine.QuizResult(total = 0, correct = 0, percent = 0),
            QuizEngine.summarize(emptyList(), total = 0),
        )
    }

    @Test
    fun `summarize scores an abandoned run against the full quiz length`() {
        val records = listOf(QuizEngine.answerQuestion(question, questionIndex = 0, choiceIndex = 1))
        assertEquals(25, QuizEngine.summarize(records, total = 4).percent)
    }

    @Test
    fun `resultLabel steps through the tiers`() {
        assertEquals("Perfect score", QuizEngine.resultLabel(100).title)
        assertEquals("Sharp", QuizEngine.resultLabel(99).title)
        assertEquals("Sharp", QuizEngine.resultLabel(80).title)
        assertEquals("Solid", QuizEngine.resultLabel(60).title)
        assertEquals("Getting there", QuizEngine.resultLabel(40).title)
        assertEquals("Uncharted territory", QuizEngine.resultLabel(0).title)
    }

    @Test
    fun `isNewBest requires strictly beating the previous best`() {
        assertTrue(QuizEngine.isNewBest(previousPercent = null, percent = 0))
        assertTrue(QuizEngine.isNewBest(previousPercent = 75, percent = 88))
        assertFalse(QuizEngine.isNewBest(previousPercent = 75, percent = 75))
        assertFalse(QuizEngine.isNewBest(previousPercent = 75, percent = 50))
    }
}
