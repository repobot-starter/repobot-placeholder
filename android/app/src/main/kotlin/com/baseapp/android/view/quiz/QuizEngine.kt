package com.baseapp.android.view.quiz

import kotlin.math.roundToInt

/**
 * The quiz pack's engine: pure scoring and result logic, mirrored from the
 * web pack's engine.ts (and QuizEngine.swift on iOS) so a score means the
 * same thing on every platform. No timers, no shuffling — questions run in
 * content order.
 */
object QuizEngine {
    data class Question(
        val prompt: String,
        /** Two or more options; exactly one is right. */
        val choices: List<String>,
        /** Index into choices of the correct answer. */
        val answerIndex: Int,
        /** Shown after answering — the "huh, neat" line that makes it stick. */
        val explanation: String? = null,
    )

    /** One answered question: which choice was picked and whether it was right. */
    data class AnswerRecord(
        val questionIndex: Int,
        val choiceIndex: Int,
        val correct: Boolean,
    )

    fun answerQuestion(question: Question, questionIndex: Int, choiceIndex: Int): AnswerRecord =
        AnswerRecord(
            questionIndex = questionIndex,
            choiceIndex = choiceIndex,
            correct = choiceIndex == question.answerIndex,
        )

    data class QuizResult(
        val total: Int,
        val correct: Int,
        /** 0..100, rounded to the nearest whole percent. */
        val percent: Int,
    )

    fun summarize(records: List<AnswerRecord>, total: Int): QuizResult {
        val correct = records.count { it.correct }
        val percent = if (total == 0) 0 else (correct.toDouble() / total * 100).roundToInt()
        return QuizResult(total = total, correct = correct, percent = percent)
    }

    data class ResultLabel(
        val emoji: String,
        val title: String,
        val message: String,
    )

    /** The verdict line on the results screen, by percent scored. */
    fun resultLabel(percent: Int): ResultLabel = when {
        percent == 100 -> ResultLabel(
            emoji = "🏆",
            title = "Perfect score",
            message = "Every single one. Take the rest of the day off.",
        )
        percent >= 80 -> ResultLabel(
            emoji = "🎯",
            title = "Sharp",
            message = "Nearly flawless — one more run and it's a sweep.",
        )
        percent >= 60 -> ResultLabel(
            emoji = "👍",
            title = "Solid",
            message = "More right than wrong. The misses below are the good part.",
        )
        percent >= 40 -> ResultLabel(
            emoji = "🌱",
            title = "Getting there",
            message = "A few landed. Read the misses and run it back.",
        )
        else -> ResultLabel(
            emoji = "🧭",
            title = "Uncharted territory",
            message = "Everything below is new to learn — that's the fun kind of quiz.",
        )
    }

    /** Whether a finished run beats the saved best (strictly, so ties don't churn storage). */
    fun isNewBest(previousPercent: Int?, percent: Int): Boolean =
        previousPercent == null || percent > previousPercent
}
