/**
 * A Leitner-box spaced-repetition scheduler — the flashcard pack's engine.
 * Pure and deterministic (the current day is always passed in), mirrored in
 * FlashScheduler.swift and FlashScheduler.kt so progress means the same
 * thing on every platform.
 *
 * Five boxes with doubling intervals: box 1 is due every day, box 5 every
 * 16 days. "Got it" promotes a card one box; "Again" sends it back to
 * box 1. A card in box 5 that you keep getting right stays mastered.
 */

export const BOX_COUNT = 5

/** Days between reviews for each box (index 0 = box 1). */
export const BOX_INTERVALS = [1, 2, 4, 8, 16]

export interface CardState {
    /** 1..BOX_COUNT. New cards start in box 1. */
    box: number
    /** Day index (days since epoch) of the last review; -1 = never reviewed. */
    lastReviewedDay: number
}

export type Grade = "again" | "good"

export function newCardState(): CardState {
    return { box: 1, lastReviewedDay: -1 }
}

/** Whether a card is due for review on the given day. */
export function isDue(state: CardState, today: number): boolean {
    if (state.lastReviewedDay < 0) return true // never reviewed
    return today >= state.lastReviewedDay + BOX_INTERVALS[state.box - 1]
}

/** Apply a review grade. "good" promotes one box (capped); "again" resets to box 1. */
export function review(state: CardState, grade: Grade, today: number): CardState {
    const box = grade === "good" ? Math.min(state.box + 1, BOX_COUNT) : 1
    return { box, lastReviewedDay: today }
}

/** Indices of the cards due today, in stable order. */
export function dueIndices(states: CardState[], today: number): number[] {
    return states
        .map((state, index) => ({ state, index }))
        .filter(({ state }) => isDue(state, today))
        .map(({ index }) => index)
}

export interface DeckProgress {
    total: number
    /** Cards that have reached the top box. */
    mastered: number
    /** Cards reviewed at least once. */
    seen: number
    due: number
}

export function deckProgress(states: CardState[], today: number): DeckProgress {
    return {
        total: states.length,
        mastered: states.filter((s) => s.box === BOX_COUNT).length,
        seen: states.filter((s) => s.lastReviewedDay >= 0).length,
        due: dueIndices(states, today).length,
    }
}

/** Days since the Unix epoch in local time — the scheduler's clock tick. */
export function dayIndex(date: Date): number {
    return Math.floor((date.getTime() - date.getTimezoneOffset() * 60_000) / 86_400_000)
}
