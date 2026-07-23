import { describe, expect, it } from "vitest"
import {
    answerQuestion,
    isNewBest,
    resultLabel,
    summarize,
    type Question,
} from "../../../src/View/Quiz/engine"

const question: Question = {
    prompt: "2 + 2?",
    choices: ["3", "4", "5"],
    answerIndex: 1,
}

describe("answerQuestion", () => {
    it("marks the right choice correct and the rest wrong", () => {
        expect(answerQuestion(question, 0, 1)).toEqual({
            questionIndex: 0,
            choiceIndex: 1,
            correct: true,
        })
        expect(answerQuestion(question, 0, 2).correct).toBe(false)
    })
})

describe("summarize", () => {
    it("counts correct answers and rounds the percent", () => {
        const records = [
            answerQuestion(question, 0, 1),
            answerQuestion(question, 1, 0),
            answerQuestion(question, 2, 1),
        ]
        expect(summarize(records, 3)).toEqual({ total: 3, correct: 2, percent: 67 })
    })

    it("handles an empty quiz without dividing by zero", () => {
        expect(summarize([], 0)).toEqual({ total: 0, correct: 0, percent: 0 })
    })

    it("scores an abandoned run against the full quiz length", () => {
        const records = [answerQuestion(question, 0, 1)]
        expect(summarize(records, 4).percent).toBe(25)
    })
})

describe("resultLabel", () => {
    it("steps through the tiers by percent", () => {
        expect(resultLabel(100).title).toBe("Perfect score")
        expect(resultLabel(80).title).toBe("Sharp")
        expect(resultLabel(60).title).toBe("Solid")
        expect(resultLabel(40).title).toBe("Getting there")
        expect(resultLabel(0).title).toBe("Uncharted territory")
    })

    it("does not hand out the trophy below 100", () => {
        expect(resultLabel(99).title).not.toBe("Perfect score")
    })
})

describe("isNewBest", () => {
    it("treats a first run as a best", () => {
        expect(isNewBest(undefined, 0)).toBe(true)
    })

    it("requires strictly beating the previous best", () => {
        expect(isNewBest(75, 88)).toBe(true)
        expect(isNewBest(75, 75)).toBe(false)
        expect(isNewBest(75, 50)).toBe(false)
    })
})
