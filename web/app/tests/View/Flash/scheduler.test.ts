import { describe, expect, it } from "vitest"
import {
    BOX_COUNT,
    BOX_INTERVALS,
    dayIndex,
    deckProgress,
    dueIndices,
    isDue,
    newCardState,
    review,
    type CardState,
} from "../../../src/View/Flash/scheduler"

describe("review", () => {
    it("promotes one box on good and caps at the top box", () => {
        let state = newCardState()
        for (let expected = 2; expected <= BOX_COUNT; expected++) {
            state = review(state, "good", 100)
            expect(state.box).toBe(expected)
        }
        state = review(state, "good", 100)
        expect(state.box).toBe(BOX_COUNT) // capped
    })

    it("resets to box 1 on again, from any box", () => {
        const high: CardState = { box: 4, lastReviewedDay: 90 }
        expect(review(high, "again", 100)).toEqual({ box: 1, lastReviewedDay: 100 })
    })
})

describe("isDue", () => {
    it("treats never-reviewed cards as due", () => {
        expect(isDue(newCardState(), 0)).toBe(true)
    })

    it("applies doubling intervals per box", () => {
        expect(BOX_INTERVALS).toEqual([1, 2, 4, 8, 16])
        const box3: CardState = { box: 3, lastReviewedDay: 100 }
        expect(isDue(box3, 103)).toBe(false)
        expect(isDue(box3, 104)).toBe(true) // 100 + interval 4
    })
})

describe("dueIndices and deckProgress", () => {
    const states: CardState[] = [
        newCardState(), // never seen -> due
        { box: 1, lastReviewedDay: 100 }, // due at 101
        { box: 5, lastReviewedDay: 100 }, // mastered, due at 116
        { box: 2, lastReviewedDay: 100 }, // due at 102
    ]

    it("returns due cards in stable order", () => {
        expect(dueIndices(states, 101)).toEqual([0, 1])
        expect(dueIndices(states, 116)).toEqual([0, 1, 2, 3])
    })

    it("summarizes totals, mastered, seen, and due", () => {
        expect(deckProgress(states, 101)).toEqual({
            total: 4,
            mastered: 1,
            seen: 3,
            due: 2,
        })
    })
})

describe("dayIndex", () => {
    it("increments across a local midnight", () => {
        const before = dayIndex(new Date(2026, 6, 22, 23, 59))
        const after = dayIndex(new Date(2026, 6, 23, 0, 1))
        expect(after - before).toBe(1)
    })
})
