package com.baseapp.android

import com.baseapp.android.view.quiz.QuizContent
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Guards the quiz data the pack ships with: best scores are keyed by quiz
 * id, and every answerIndex must point at a real choice.
 */
class QuizContentTest {
    @Test
    fun `every quiz has identity and questions`() {
        assertTrue(QuizContent.quizzes.isNotEmpty())
        for (quiz in QuizContent.quizzes) {
            assertTrue(quiz.id.isNotBlank())
            assertTrue(quiz.title.isNotBlank())
            assertTrue(quiz.emoji.isNotBlank())
            assertTrue(quiz.description.isNotBlank())
            assertTrue("quiz ${quiz.id} needs questions", quiz.questions.isNotEmpty())
        }
    }

    @Test
    fun `quiz ids are unique`() {
        val ids = QuizContent.quizzes.map { it.id }
        assertEquals(ids.size, ids.toSet().size)
    }

    @Test
    fun `every answerIndex points at a real choice`() {
        for (quiz in QuizContent.quizzes) {
            for (question in quiz.questions) {
                assertTrue(question.choices.size >= 2)
                assertTrue(
                    "${quiz.id}: ${question.prompt}",
                    question.answerIndex in question.choices.indices,
                )
            }
        }
    }

    @Test
    fun `choices are unique within each question`() {
        for (quiz in QuizContent.quizzes) {
            for (question in quiz.questions) {
                assertEquals(
                    "${quiz.id}: ${question.prompt}",
                    question.choices.size,
                    question.choices.toSet().size,
                )
            }
        }
    }
}
