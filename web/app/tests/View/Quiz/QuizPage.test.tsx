import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { quizzes } from "../../../src/View/Quiz/content"
import QuizPage from "../../../src/View/Quiz/QuizPage"

const firstQuiz = quizzes[0]

/** Answer the current question with the given choice and advance. */
function answerCurrent(correct: boolean, last: boolean): void {
    const questionNumber = Number(screen.getByText(/^\d+ of \d+$/).textContent?.split(" ")[0])
    const question = firstQuiz.questions[questionNumber - 1]
    const choiceIndex = correct ? question.answerIndex : (question.answerIndex + 1) % question.choices.length
    fireEvent.click(screen.getByRole("button", { name: question.choices[choiceIndex] }))
    fireEvent.click(screen.getByRole("button", { name: last ? "See results" : "Next question" }))
}

describe("QuizPage", () => {
    beforeEach(() => {
        localStorage.clear()
    })

    afterEach(() => {
        cleanup()
    })

    it("lists every quiz with its question count", () => {
        render(<QuizPage />)
        for (const quiz of quizzes) {
            expect(screen.getByRole("heading", { name: quiz.title })).toBeTruthy()
        }
        expect(screen.getAllByText(/questions$/).length).toBe(quizzes.length)
        expect(screen.getAllByText("Not taken").length).toBe(quizzes.length)
    })

    it("reveals the right answer and the explanation after a wrong pick", () => {
        render(<QuizPage />)
        fireEvent.click(screen.getByRole("heading", { name: firstQuiz.title }))

        const question = firstQuiz.questions[0]
        const wrongIndex = (question.answerIndex + 1) % question.choices.length
        fireEvent.click(screen.getByRole("button", { name: question.choices[wrongIndex] }))

        if (question.explanation) {
            expect(screen.getByText(question.explanation)).toBeTruthy()
        }
        // Choices lock after answering.
        const correctButton = screen.getByRole("button", {
            name: question.choices[question.answerIndex],
        }) as HTMLButtonElement
        expect(correctButton.disabled).toBe(true)
        expect(screen.getByRole("button", { name: "Next question" })).toBeTruthy()
    })

    it("finishes a perfect run, saves the best, and lists it on the shelf", () => {
        render(<QuizPage />)
        fireEvent.click(screen.getByRole("heading", { name: firstQuiz.title }))

        const count = firstQuiz.questions.length
        for (let i = 0; i < count; i++) {
            answerCurrent(true, i === count - 1)
        }

        expect(screen.getByText("Perfect score")).toBeTruthy()
        expect(screen.getByText("★ New personal best")).toBeTruthy()

        fireEvent.click(screen.getByRole("button", { name: "Back to quizzes" }))
        expect(screen.getByText("Best 100%")).toBeTruthy()

        const saved = JSON.parse(localStorage.getItem("quizbot-best") ?? "{}")
        expect(saved[firstQuiz.id]).toEqual({ percent: 100, correct: count, total: count })
    })

    it("lists misses with their correct answers on the results screen", () => {
        render(<QuizPage />)
        fireEvent.click(screen.getByRole("heading", { name: firstQuiz.title }))

        const count = firstQuiz.questions.length
        // Miss the first question, ace the rest.
        for (let i = 0; i < count; i++) {
            answerCurrent(i !== 0, i === count - 1)
        }

        const missed = firstQuiz.questions[0]
        expect(screen.getByText(missed.prompt)).toBeTruthy()
        expect(screen.getByText(missed.choices[missed.answerIndex])).toBeTruthy()
    })

    it("does not overwrite a better saved score with a worse run", () => {
        localStorage.setItem(
            "quizbot-best",
            JSON.stringify({
                [firstQuiz.id]: {
                    percent: 100,
                    correct: firstQuiz.questions.length,
                    total: firstQuiz.questions.length,
                },
            }),
        )
        render(<QuizPage />)
        fireEvent.click(screen.getByRole("heading", { name: firstQuiz.title }))

        const count = firstQuiz.questions.length
        for (let i = 0; i < count; i++) {
            answerCurrent(false, i === count - 1)
        }

        expect(screen.queryByText("★ New personal best")).toBeNull()
        const saved = JSON.parse(localStorage.getItem("quizbot-best") ?? "{}")
        expect(saved[firstQuiz.id].percent).toBe(100)
    })
})
