package com.baseapp.android.view.flash

import java.util.Calendar
import java.util.Date

/**
 * A Leitner-box spaced-repetition scheduler — the flashcard pack's engine.
 * Pure and deterministic (the current day is always passed in), mirrored
 * from the web pack's scheduler.ts and iOS FlashScheduler.swift so progress
 * means the same thing on every platform.
 *
 * Five boxes with doubling intervals: box 1 is due every day, box 5 every
 * 16 days. "Got it" promotes a card one box; "Again" sends it back to
 * box 1. A card in box 5 that you keep getting right stays mastered.
 */
object FlashScheduler {
    const val BOX_COUNT = 5

    /** Days between reviews for each box (index 0 = box 1). */
    val BOX_INTERVALS = listOf(1, 2, 4, 8, 16)

    data class CardState(
        /** 1..BOX_COUNT. New cards start in box 1. */
        val box: Int,
        /** Day index (days since epoch) of the last review; -1 = never reviewed. */
        val lastReviewedDay: Int,
    )

    enum class Grade { AGAIN, GOOD }

    fun newCardState(): CardState = CardState(box = 1, lastReviewedDay = -1)

    /** Whether a card is due for review on the given day. */
    fun isDue(state: CardState, today: Int): Boolean {
        if (state.lastReviewedDay < 0) return true // never reviewed
        return today >= state.lastReviewedDay + BOX_INTERVALS[state.box - 1]
    }

    /** Apply a review grade. GOOD promotes one box (capped); AGAIN resets to box 1. */
    fun review(state: CardState, grade: Grade, today: Int): CardState {
        val box = if (grade == Grade.GOOD) minOf(state.box + 1, BOX_COUNT) else 1
        return CardState(box = box, lastReviewedDay = today)
    }

    /** Indices of the cards due today, in stable order. */
    fun dueIndices(states: List<CardState>, today: Int): List<Int> =
        states.withIndex().filter { isDue(it.value, today) }.map { it.index }

    data class DeckProgress(
        val total: Int,
        /** Cards that have reached the top box. */
        val mastered: Int,
        /** Cards reviewed at least once. */
        val seen: Int,
        val due: Int,
    )

    fun deckProgress(states: List<CardState>, today: Int): DeckProgress = DeckProgress(
        total = states.size,
        mastered = states.count { it.box == BOX_COUNT },
        seen = states.count { it.lastReviewedDay >= 0 },
        due = dueIndices(states, today).size,
    )

    /** Days since the Unix epoch in local time — the scheduler's clock tick. */
    fun dayIndex(date: Date): Int {
        val calendar = Calendar.getInstance()
        calendar.time = date
        val offsetMs = calendar.get(Calendar.ZONE_OFFSET) + calendar.get(Calendar.DST_OFFSET)
        return Math.floorDiv(date.time + offsetMs, 86_400_000L).toInt()
    }
}
