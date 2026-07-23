import React, { useMemo, useState } from "react"
import { app, decks, type Deck } from "./content"
import {
    dayIndex,
    deckProgress,
    dueIndices,
    newCardState,
    review,
    type CardState,
    type Grade,
} from "./scheduler"
import * as styles from "./FlashPage.styles.css"

const STORAGE_KEY = "flashbot-progress"

type SavedProgress = Record<string, Record<string, CardState>>

function loadProgress(): SavedProgress {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? (JSON.parse(raw) as SavedProgress) : {}
    } catch {
        return {}
    }
}

function saveProgress(progress: SavedProgress): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

/** Card states for a deck, keyed by card front (stable across content edits). */
function statesForDeck(progress: SavedProgress, deck: Deck): CardState[] {
    const saved = progress[deck.id] ?? {}
    return deck.cards.map((card) => saved[card.front] ?? newCardState())
}

function StudySession({ deck, onExit }: { deck: Deck; onExit: () => void }): React.ReactElement {
    const today = dayIndex(new Date())
    const [progress, setProgress] = useState<SavedProgress>(loadProgress)
    const [queue, setQueue] = useState<number[]>(() => dueIndices(statesForDeck(loadProgress(), deck), today))
    const [flipped, setFlipped] = useState(false)
    const [reviewed, setReviewed] = useState(0)
    const [missed, setMissed] = useState(0)

    const states = statesForDeck(progress, deck)
    const currentIndex = queue[0]
    const card = currentIndex === undefined ? undefined : deck.cards[currentIndex]

    const grade = (value: Grade): void => {
        if (currentIndex === undefined) return
        const nextState = review(states[currentIndex], value, today)
        const nextProgress: SavedProgress = {
            ...progress,
            [deck.id]: {
                ...(progress[deck.id] ?? {}),
                [deck.cards[currentIndex].front]: nextState,
            },
        }
        saveProgress(nextProgress)
        setProgress(nextProgress)
        setReviewed((count) => count + 1)
        if (value === "again") {
            setMissed((count) => count + 1)
            // Missed cards come back at the end of this session.
            setQueue((current) => [...current.slice(1), currentIndex])
        } else {
            setQueue((current) => current.slice(1))
        }
        setFlipped(false)
    }

    if (!card) {
        const summary = deckProgress(states, today)
        return (
            <div className={styles.summary}>
                <div className={styles.summaryEmoji}>{reviewed > 0 ? "🎉" : "🌤️"}</div>
                <h2 className={styles.summaryTitle}>{reviewed > 0 ? "Session complete" : "All caught up"}</h2>
                <p className={styles.summaryText}>
                    {reviewed > 0
                        ? "Every due card reviewed. The boxes will bring them back right on time."
                        : "Nothing is due in this deck today — come back tomorrow."}
                </p>
                <div className={styles.summaryStats}>
                    <div className={styles.statBlock}>
                        <div className={styles.statNumber}>{reviewed}</div>
                        <div className={styles.statLabel}>reviews</div>
                    </div>
                    <div className={styles.statBlock}>
                        <div className={styles.statNumber}>{missed}</div>
                        <div className={styles.statLabel}>misses</div>
                    </div>
                    <div className={styles.statBlock}>
                        <div className={styles.statNumber}>
                            {summary.mastered}/{summary.total}
                        </div>
                        <div className={styles.statLabel}>mastered</div>
                    </div>
                </div>
                <div className={styles.gradeRow}>
                    <button type="button" className={styles.goodButton} onClick={onExit}>
                        Back to decks
                    </button>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className={styles.studyHeader}>
                <button type="button" className={styles.backLink} onClick={onExit}>
                    ← {deck.title}
                </button>
                <span className={styles.sessionCount}>{queue.length} to go</span>
            </div>
            <div className={styles.cardScene}>
                <div
                    className={`${styles.studyCard} ${flipped ? styles.studyCardFlipped : ""}`}
                    onClick={() => setFlipped((f) => !f)}
                    role="button"
                    aria-label={flipped ? "Show question" : "Reveal answer"}
                >
                    <div className={styles.cardFront}>
                        <span className={styles.faceLabel}>Question</span>
                        <span className={styles.faceText}>{card.front}</span>
                        <span className={styles.flipNudge}>Tap to reveal</span>
                    </div>
                    <div className={styles.cardBack}>
                        <span className={styles.faceLabelBack}>Answer</span>
                        <span className={styles.faceText}>{card.back}</span>
                        {card.hint ? <span className={styles.faceHint}>{card.hint}</span> : null}
                    </div>
                </div>
            </div>
            <div className={styles.gradeRow}>
                <button
                    type="button"
                    className={styles.againButton}
                    disabled={!flipped}
                    onClick={() => grade("again")}
                >
                    Again
                </button>
                <button
                    type="button"
                    className={styles.goodButton}
                    disabled={!flipped}
                    onClick={() => grade("good")}
                >
                    Got it
                </button>
            </div>
        </>
    )
}

export default function FlashPage(): React.ReactElement {
    const [openDeckId, setOpenDeckId] = useState<string | null>(null)
    // Bump to re-read progress after a study session ends.
    const [refresh, setRefresh] = useState(0)

    const today = dayIndex(new Date())
    const progress = useMemo(() => loadProgress(), [openDeckId, refresh])
    const openDeck = openDeckId ? decks.find((deck) => deck.id === openDeckId) : undefined

    return (
        <div className={styles.page}>
            <div className={styles.frame}>
                {openDeck ? (
                    <StudySession
                        deck={openDeck}
                        onExit={() => {
                            setOpenDeckId(null)
                            setRefresh((n) => n + 1)
                        }}
                    />
                ) : (
                    <>
                        <header className={styles.masthead}>
                            <h1 className={styles.wordmark}>{app.title}</h1>
                            <p className={styles.tagline}>{app.tagline}</p>
                        </header>
                        <div className={styles.deckList}>
                            {decks.map((deck, index) => {
                                const summary = deckProgress(statesForDeck(progress, deck), today)
                                const percent =
                                    summary.total === 0
                                        ? 0
                                        : Math.round((summary.mastered / summary.total) * 100)
                                return (
                                    <button
                                        key={deck.id}
                                        type="button"
                                        className={styles.deckCard}
                                        style={{ animationDelay: `${index * 70}ms` }}
                                        onClick={() => setOpenDeckId(deck.id)}
                                    >
                                        <span className={styles.deckEmoji} aria-hidden>
                                            {deck.emoji}
                                        </span>
                                        <span className={styles.deckText}>
                                            <h2 className={styles.deckTitle}>{deck.title}</h2>
                                            <p className={styles.deckDescription}>{deck.description}</p>
                                            <span className={styles.progressTrack}>
                                                <span
                                                    className={styles.progressFill}
                                                    style={{ width: `${percent}%`, display: "block" }}
                                                />
                                            </span>
                                            <div className={styles.deckMeta}>
                                                {summary.mastered} of {summary.total} mastered
                                            </div>
                                        </span>
                                        {summary.due > 0 ? (
                                            <span className={styles.dueBadge}>{summary.due} due</span>
                                        ) : (
                                            <span className={styles.doneBadge}>Done today</span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                        <footer className={styles.footer}>
                            Spaced repetition, five boxes, no streak guilt. Built with Repobot.
                        </footer>
                    </>
                )}
            </div>
        </div>
    )
}
