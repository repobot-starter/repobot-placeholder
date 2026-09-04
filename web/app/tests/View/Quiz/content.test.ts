import { describe, expect, it } from "vitest"
import { quizzes } from "../../../src/View/Quiz/content"

describe("quiz content", () => {
    it("ships at least one quiz, each with questions", () => {
        expect(quizzes.length).toBeGreaterThan(0)
        for (const quiz of quizzes) {
            expect(quiz.id).not.toBe("")
            expect(quiz.title).not.toBe("")
            expect(quiz.questions.length).toBeGreaterThan(0)
        }
    })

    it("keeps quiz ids unique (they key saved best scores)", () => {
        const ids = quizzes.map((quiz) => quiz.id)
        expect(new Set(ids).size).toBe(ids.length)
    })

    it("points every answerIndex at a real choice", () => {
        for (const quiz of quizzes) {
            for (const question of quiz.questions) {
                expect(question.choices.length).toBeGreaterThanOrEqual(2)
                expect(question.answerIndex).toBeGreaterThanOrEqual(0)
                expect(question.answerIndex).toBeLessThan(question.choices.length)
            }
        }
    })

    it("keeps choices unique within each question", () => {
        for (const quiz of quizzes) {
            for (const question of quiz.questions) {
                expect(new Set(question.choices).size).toBe(question.choices.length)
            }
        }
    })
})
