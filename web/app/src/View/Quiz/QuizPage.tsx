import React, { useMemo, useState } from "react"
import { app, quizzes, type Quiz } from "./content"
import { answerQuestion, isNewBest, resultLabel, summarize, type AnswerRecord } from "./engine"
import * as styles from "./QuizPage.styles.css"

const STORAGE_KEY = "quizbot-best"

/** Best finished run per quiz id: percent plus the fraction behind it. */
type BestScores = Record<string, { percent: number; correct: number; total: number }>

function loadBest(): BestScores {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? (JSON.parse(raw) as BestScores) : {}
    } catch {
        return {}
    }
}

function saveBest(best: BestScores): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(best))
}

function QuizRun({ quiz, onExit }: { quiz: Quiz; onExit: () => void }): React.ReactElement {
    const [records, setRecords] = useState<AnswerRecord[]>([])
    const [picked, setPicked] = useState<number | null>(null)
    const [finished, setFinished] = useState(false)
    const [newBest, setNewBest] = useState(false)

    const questionIndex = records.length - (picked === null ? 0 : 1)
    const question = quiz.questions[questionIndex]

    const pick = (choiceIndex: number): void => {
        if (picked !== null) return
        setPicked(choiceIndex)
        setRecords((current) => [...current, answerQuestion(question, questionIndex, choiceIndex)])
    }

    const advance = (): void => {
        const done = records.length === quiz.questions.length
        setPicked(null)
        if (done) {
            const result = summarize(records, quiz.questions.length)
            const best = loadBest()
            if (isNewBest(best[quiz.id]?.percent, result.percent)) {
                saveBest({
                    ...best,
                    [quiz.id]: {
                        percent: result.percent,
                        correct: result.correct,
                        total: result.total,
                    },
                })
                setNewBest(true)
            }
            setFinished(true)
        }
    }

    const restart = (): void => {
        setRecords([])
        setPicked(null)
        setFinished(false)
        setNewBest(false)
    }

    if (finished) {
        const result = summarize(records, quiz.questions.length)
        const label = resultLabel(result.percent)
        const misses = records.filter((record) => !record.correct)
        return (
            <div className={styles.results}>
                <div className={styles.resultsEmoji}>{label.emoji}</div>
                <h2 className={styles.resultsTitle}>{label.title}</h2>
                <p className={styles.resultsText}>{label.message}</p>
                <div className={styles.scoreRow}>
                    <div className={styles.statBlock}>
                        <div className={styles.statNumber}>
                            {result.correct}/{result.total}
                        </div>
                        <div className={styles.statLabel}>correct</div>
                    </div>
                    <div className={styles.statBlock}>
                        <div className={styles.statNumber}>{result.percent}%</div>
                        <div className={styles.statLabel}>score</div>
                    </div>
                </div>
                {newBest ? <div className={styles.newBestNote}>★ New personal best</div> : null}
                {misses.length > 0 ? (
                    <div className={styles.missList}>
                        {misses.map((record) => {
                            const missed = quiz.questions[record.questionIndex]
                            return (
                                <div key={record.questionIndex} className={styles.missItem}>
                                    <span className={styles.missPrompt}>{missed.prompt}</span>
                                    <span className={styles.missAnswer}>
                                        {missed.choices[missed.answerIndex]}
                                    </span>
                                    {missed.explanation ? <> — {missed.explanation}</> : null}
                                </div>
                            )
                        })}
                    </div>
                ) : null}
                <div className={styles.resultsButtons}>
                    <button type="button" className={styles.ghostButton} onClick={restart}>
                        Run it back
                    </button>
                    <button type="button" className={styles.nextButton} onClick={onExit}>
                        Back to quizzes
                    </button>
                </div>
            </div>
        )
    }

    const answered = picked !== null
    const lastQuestion = questionIndex === quiz.questions.length - 1
    const progressPercent = ((questionIndex + (answered ? 1 : 0)) / quiz.questions.length) * 100

    return (
        <>
            <div className={styles.runHeader}>
                <button type="button" className={styles.backLink} onClick={onExit}>
                    ← {quiz.title}
                </button>
                <span className={styles.runCount}>
                    {questionIndex + 1} of {quiz.questions.length}
                </span>
            </div>
            <div className={styles.progressTrack}>
                <span
                    className={styles.progressFill}
                    style={{ width: `${progressPercent}%`, display: "block" }}
                />
            </div>
            <div className={styles.questionCard}>
                <h2 className={styles.prompt}>{question.prompt}</h2>
                <div className={styles.choiceList}>
                    {question.choices.map((choice, choiceIndex) => {
                        const isCorrect = choiceIndex === question.answerIndex
                        const isPicked = choiceIndex === picked
                        let choiceClass = styles.choice
                        if (answered) {
                            if (isCorrect) choiceClass += ` ${styles.choiceCorrect}`
                            else if (isPicked) choiceClass += ` ${styles.choiceWrong}`
                            else choiceClass += ` ${styles.choiceDimmed}`
                        }
                        return (
                            <button
                                key={choice}
                                type="button"
                                className={choiceClass}
                                disabled={answered}
                                onClick={() => pick(choiceIndex)}
                            >
                                {choice}
                            </button>
                        )
                    })}
                </div>
                {answered && question.explanation ? (
                    <div className={styles.explanation}>{question.explanation}</div>
                ) : null}
                {answered ? (
                    <div className={styles.nextRow}>
                        <button type="button" className={styles.nextButton} onClick={advance}>
                            {lastQuestion ? "See results" : "Next question"}
                        </button>
                    </div>
                ) : null}
            </div>
        </>
    )
}

export default function QuizPage(): React.ReactElement {
    const [openQuizId, setOpenQuizId] = useState<string | null>(null)
    // Bump to re-read best scores after a run ends.
    const [refresh, setRefresh] = useState(0)

    const best = useMemo(() => loadBest(), [openQuizId, refresh])
    const openQuiz = openQuizId ? quizzes.find((quiz) => quiz.id === openQuizId) : undefined

    return (
        <div className={styles.page}>
            <div className={styles.frame}>
                {openQuiz ? (
                    <QuizRun
                        quiz={openQuiz}
                        onExit={() => {
                            setOpenQuizId(null)
                            setRefresh((n) => n + 1)
                        }}
                    />
                ) : (
                    <>
                        <header className={styles.masthead}>
                            <h1 className={styles.wordmark}>{app.title}</h1>
                            <p className={styles.tagline}>{app.tagline}</p>
                        </header>
                        <div className={styles.quizList}>
                            {quizzes.map((quiz, index) => {
                                const bestRun = best[quiz.id]
                                return (
                                    <button
                                        key={quiz.id}
                                        type="button"
                                        className={styles.quizCard}
                                        style={{ animationDelay: `${index * 70}ms` }}
                                        onClick={() => setOpenQuizId(quiz.id)}
                                    >
                                        <span className={styles.quizEmoji} aria-hidden>
                                            {quiz.emoji}
                                        </span>
                                        <span className={styles.quizText}>
                                            <h2 className={styles.quizTitle}>{quiz.title}</h2>
                                            <p className={styles.quizDescription}>{quiz.description}</p>
                                            <span className={styles.quizMeta}>
                                                {quiz.questions.length} questions
                                            </span>
                                        </span>
                                        {bestRun ? (
                                            <span className={styles.bestBadge}>Best {bestRun.percent}%</span>
                                        ) : (
                                            <span className={styles.newBadge}>Not taken</span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                        <footer className={styles.footer}>
                            Instant feedback, no lifelines, misses explained. Built with Repobot.
                        </footer>
                    </>
                )}
            </div>
        </div>
    )
}
