/**
 * The quiz pack's engine: pure scoring and result logic, mirrored in
 * QuizEngine.swift and QuizEngine.kt so a score means the same thing on
 * every platform. No timers, no shuffling — questions run in content
 * order, so authors control pacing and the platforms stay in lockstep.
 */

export interface Question {
    prompt: string
    /** Two or more options; exactly one is right. */
    choices: string[]
    /** Index into choices of the correct answer. */
    answerIndex: number
    /** Shown after answering — the "huh, neat" line that makes it stick. */
    explanation?: string
}

/** One answered question: which choice was picked and whether it was right. */
export interface AnswerRecord {
    questionIndex: number
    choiceIndex: number
    correct: boolean
}

export function answerQuestion(question: Question, questionIndex: number, choiceIndex: number): AnswerRecord {
    return { questionIndex, choiceIndex, correct: choiceIndex === question.answerIndex }
}

export interface QuizResult {
    total: number
    correct: number
    /** 0..100, rounded to the nearest whole percent. */
    percent: number
}

export function summarize(records: AnswerRecord[], total: number): QuizResult {
    const correct = records.filter((record) => record.correct).length
    const percent = total === 0 ? 0 : Math.round((correct / total) * 100)
    return { total, correct, percent }
}

export interface ResultLabel {
    emoji: string
    title: string
    message: string
}

/** The verdict line on the results screen, by percent scored. */
export function resultLabel(percent: number): ResultLabel {
    if (percent === 100) {
        return {
            emoji: "🏆",
            title: "Perfect score",
            message: "Every single one. Take the rest of the day off.",
        }
    }
    if (percent >= 80) {
        return { emoji: "🎯", title: "Sharp", message: "Nearly flawless — one more run and it's a sweep." }
    }
    if (percent >= 60) {
        return {
            emoji: "👍",
            title: "Solid",
            message: "More right than wrong. The misses below are the good part.",
        }
    }
    if (percent >= 40) {
        return {
            emoji: "🌱",
            title: "Getting there",
            message: "A few landed. Read the misses and run it back.",
        }
    }
    return {
        emoji: "🧭",
        title: "Uncharted territory",
        message: "Everything below is new to learn — that's the fun kind of quiz.",
    }
}

/** Whether a finished run beats the saved best (strictly, so ties don't churn storage). */
export function isNewBest(previousPercent: number | undefined, percent: number): boolean {
    return previousPercent === undefined || percent > previousPercent
}
