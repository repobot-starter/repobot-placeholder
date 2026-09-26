import React, { useEffect, useState } from "react"
import { readStoredJson, writeStoredJson } from "@base/core"
import SnakeGame, { SnakeScore } from "./SnakeGame"
import * as styles from "./SnakePage.styles.css"

const HIGH_SCORES_KEY = "snakebot-high-scores"
const MAX_HIGH_SCORES = 10

interface HighScoreEntry {
    name: string
    score: number
}

interface GameOverState extends SnakeScore {
    saved?: boolean
}

function loadHighScores(): HighScoreEntry[] {
    return readStoredJson<HighScoreEntry[]>(HIGH_SCORES_KEY, [])
}

/** Home surface for the `snake` pack: grid snake with levels and local high scores. */
export default function SnakePage(): React.ReactElement {
    const [paused, setPaused] = useState(false)
    const [resetToken, setResetToken] = useState(0)
    const [score, setScore] = useState(0)
    const [level, setLevel] = useState(1)
    const [gameOver, setGameOver] = useState<GameOverState | null>(null)
    const [highScores, setHighScores] = useState<HighScoreEntry[]>(loadHighScores)
    const [initials, setInitials] = useState("")

    const newGame = (): void => {
        setResetToken((token) => token + 1)
        setGameOver(null)
        setPaused(false)
    }

    const handleScore = ({ score: nextScore, level: nextLevel }: SnakeScore): void => {
        setScore(nextScore)
        setLevel(nextLevel)
    }

    const qualifies =
        gameOver !== null &&
        gameOver.score > 0 &&
        (highScores.length < MAX_HIGH_SCORES || gameOver.score > highScores[highScores.length - 1].score)

    const saveHighScore = (): void => {
        if (!gameOver) {
            return
        }
        const entry: HighScoreEntry = {
            name: (initials || "???").toUpperCase().slice(0, 12),
            score: gameOver.score,
        }
        const next = [...highScores, entry].sort((a, b) => b.score - a.score).slice(0, MAX_HIGH_SCORES)
        setHighScores(next)
        writeStoredJson(HIGH_SCORES_KEY, next)
        setGameOver({ ...gameOver, saved: true })
    }

    const best = highScores[0]?.score ?? 0

    useEffect(() => {
        const handleSpace = (event: KeyboardEvent): void => {
            if (event.key === " " || event.key === "p" || event.key === "P") {
                event.preventDefault()
                setPaused((value) => !value)
            }
        }
        window.addEventListener("keydown", handleSpace)
        return () => window.removeEventListener("keydown", handleSpace)
    }, [])

    return (
        <div className={styles.page}>
            <div className={styles.frame}>
                <header className={styles.header}>
                    <div className={styles.wordmarkBlock}>
                        <span className={styles.wordmark}>Snake</span>
                        <span className={styles.tagline}>Eat, grow, and keep out of your own way.</span>
                    </div>
                    <div className={styles.headerActions}>
                        <button
                            className={styles.button}
                            onClick={() => setPaused((value) => !value)}
                            disabled={Boolean(gameOver)}
                        >
                            {paused ? "Resume" : "Pause"}
                        </button>
                        <button className={styles.buttonPrimary} onClick={newGame}>
                            New game
                        </button>
                    </div>
                </header>

                <div className={styles.body}>
                    <main className={styles.screenArea}>
                        <div className={styles.screen}>
                            <SnakeGame
                                paused={paused || Boolean(gameOver)}
                                resetToken={resetToken}
                                onScore={handleScore}
                                onGameOver={setGameOver}
                            />
                            {gameOver && (
                                <div className={styles.modal}>
                                    <div className={styles.modalTitle}>Game over</div>
                                    <div className={styles.modalScore}>
                                        Score {String(gameOver.score).padStart(6, "0")}
                                    </div>
                                    {qualifies && !gameOver.saved ? (
                                        <div className={styles.initialsRow}>
                                            <input
                                                value={initials}
                                                maxLength={12}
                                                placeholder="Your name"
                                                onChange={(event) => setInitials(event.target.value)}
                                                aria-label="Your name for the high score table"
                                            />
                                            <button className={styles.button} onClick={saveHighScore}>
                                                Record
                                            </button>
                                        </div>
                                    ) : null}
                                    <button className={styles.buttonPrimary} onClick={newGame}>
                                        Play again
                                    </button>
                                </div>
                            )}
                            {paused && !gameOver && (
                                <div className={styles.modal}>
                                    <div className={styles.modalTitle}>Paused</div>
                                    <button className={styles.buttonPrimary} onClick={() => setPaused(false)}>
                                        Resume
                                    </button>
                                </div>
                            )}
                        </div>
                    </main>

                    <aside className={styles.rail}>
                        <section className={styles.panel}>
                            <span className={styles.panelLabel}>Round</span>
                            <div className={styles.statGrid}>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Score</span>
                                    <span className={styles.statValue}>{String(score).padStart(6, "0")}</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Best</span>
                                    <span className={styles.statValue}>
                                        {String(Math.max(best, score)).padStart(6, "0")}
                                    </span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Level</span>
                                    <span className={styles.statValue}>{String(level).padStart(2, "0")}</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Speed</span>
                                    <span className={styles.speedTrack}>
                                        {Array.from({ length: 10 }, (_, index) => (
                                            <span
                                                key={index}
                                                className={
                                                    index < Math.min(10, level)
                                                        ? styles.blockOn
                                                        : styles.block
                                                }
                                            />
                                        ))}
                                    </span>
                                </div>
                            </div>
                        </section>

                        <section className={styles.panelScores}>
                            <span className={styles.panelLabel}>High scores</span>
                            {highScores.length === 0 ? (
                                <span className={styles.scoresEmpty}>
                                    The table is open. Set the first score.
                                </span>
                            ) : (
                                <ol className={styles.scores}>
                                    {highScores.map((entry, index) => (
                                        <li key={index}>
                                            <span>
                                                {String(index + 1).padStart(2, "0")} {entry.name}
                                            </span>
                                            <span>{String(entry.score).padStart(6, "0")}</span>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </section>
                    </aside>
                </div>

                <footer className={styles.statusBar}>
                    <span>{gameOver ? "Game over" : paused ? "Paused" : "Running"}</span>
                    <span>Arrows or WASD to steer — space to pause</span>
                    <span>Level {String(level).padStart(2, "0")}</span>
                </footer>
            </div>
        </div>
    )
}
