import React, { useEffect, useRef, useState } from "react"
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
    try {
        const raw = localStorage.getItem(HIGH_SCORES_KEY)
        return raw ? (JSON.parse(raw) as HighScoreEntry[]) : []
    } catch {
        return []
    }
}

/** Home surface for the `snake` pack: grid snake on a green-phosphor terminal. */
export default function SnakePage(): React.ReactElement {
    const [paused, setPaused] = useState(false)
    const [resetToken, setResetToken] = useState(0)
    const [score, setScore] = useState(0)
    const [level, setLevel] = useState(1)
    const [gameOver, setGameOver] = useState<GameOverState | null>(null)
    const [highScores, setHighScores] = useState<HighScoreEntry[]>(loadHighScores)
    const [initials, setInitials] = useState("BOT")
    const [log, setLog] = useState<string[]>(["SnakeBot online.", "All systems nominal."])
    const logCounter = useRef(0)

    const appendLog = (line: string): void => {
        logCounter.current += 1
        setLog((entries) => [...entries.slice(-4), line])
    }

    const newGame = (): void => {
        setResetToken((token) => token + 1)
        setGameOver(null)
        setPaused(false)
        appendLog("Entering the mainframe grid.")
    }

    const handleScore = ({ score: nextScore, level: nextLevel }: SnakeScore): void => {
        if (nextScore > score) {
            appendLog(`Energy cell collected. +${nextScore - score}`)
        }
        if (nextLevel > level) {
            appendLog(`Level up! Speed increased to ${nextLevel}.`)
        }
        setScore(nextScore)
        setLevel(nextLevel)
    }

    const handleGameOver = (result: SnakeScore): void => {
        setGameOver(result)
        appendLog(`Crash detected. Final score ${result.score}.`)
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
        localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(next))
        setGameOver({ ...gameOver, saved: true })
        appendLog(`High score recorded for ${entry.name}.`)
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
                <div className={styles.titleBar}>
                    <span>🤖 SnakeBot</span>
                    <span className={styles.titleControls}>
                        <span className={styles.titleBtn}>_</span>
                        <span className={styles.titleBtn}>□</span>
                        <span className={styles.titleBtn}>✕</span>
                    </span>
                </div>

                <div className={styles.layout}>
                    <aside className={styles.side}>
                        <section className={styles.panel}>
                            <header>/// System Status ///</header>
                            <div className={styles.readout}>
                                <label>Score</label>
                                <div className={styles.sevenSeg}>{String(score).padStart(6, "0")}</div>
                            </div>
                            <div className={styles.readout}>
                                <label>High Score</label>
                                <div className={styles.sevenSegDim}>
                                    {String(Math.max(best, score)).padStart(6, "0")}
                                </div>
                            </div>
                            <div className={styles.readout}>
                                <label>Level</label>
                                <div className={styles.sevenSeg}>{String(level).padStart(2, "0")}</div>
                            </div>
                            <div className={styles.readout}>
                                <label>Speed</label>
                                <div className={styles.speedBlocks}>
                                    {Array.from({ length: 10 }, (_, index) => (
                                        <span
                                            key={index}
                                            className={
                                                index < Math.min(10, level) ? styles.blockOn : styles.block
                                            }
                                        />
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section className={styles.panel}>
                            <header>/// Mission Control ///</header>
                            <p className={styles.copy}>
                                Objective: collect energy cells, avoid walls and your own tail.
                            </p>
                            <p className={styles.copy}>
                                Tip: higher level = higher score multiplier. Don't crash!
                            </p>
                        </section>

                        <section className={styles.panel}>
                            <header>/// System Log ///</header>
                            <div className={styles.log}>
                                {log.map((line, index) => (
                                    <div key={index}>&gt; {line}</div>
                                ))}
                            </div>
                        </section>
                    </aside>

                    <main className={styles.screenArea}>
                        <div className={styles.screenHeading}>
                            <span>SECTOR 5.1 // MAINFRAME GRID</span>
                            <span>⚡ ONLINE</span>
                        </div>
                        <div className={styles.screen}>
                            <SnakeGame
                                paused={paused || Boolean(gameOver)}
                                resetToken={resetToken}
                                onScore={handleScore}
                                onGameOver={handleGameOver}
                            />
                            <div className={styles.crtOverlay} />
                            {gameOver && (
                                <div className={styles.modal}>
                                    <div className={styles.modalTitle}>SYSTEM CRASH</div>
                                    <div className={styles.modalScore}>
                                        SCORE {String(gameOver.score).padStart(6, "0")}
                                    </div>
                                    {qualifies && !gameOver.saved ? (
                                        <div className={styles.initialsRow}>
                                            <input
                                                value={initials}
                                                maxLength={12}
                                                onChange={(event) => setInitials(event.target.value)}
                                                aria-label="Your name for the high score table"
                                            />
                                            <button className={styles.chunky} onClick={saveHighScore}>
                                                Record
                                            </button>
                                        </div>
                                    ) : null}
                                    <button className={styles.chunkyPrimary} onClick={newGame}>
                                        ⟳ Restart
                                    </button>
                                </div>
                            )}
                            {paused && !gameOver && (
                                <div className={styles.modal}>
                                    <div className={styles.modalTitle}>PAUSED</div>
                                    <button className={styles.chunkyPrimary} onClick={() => setPaused(false)}>
                                        ▶ Resume
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className={styles.controlsRow}>
                            <button className={styles.chunkyPrimary} onClick={newGame}>
                                Start Game
                            </button>
                            <button
                                className={styles.chunky}
                                onClick={() => setPaused((value) => !value)}
                                disabled={Boolean(gameOver)}
                            >
                                {paused ? "▶ Resume" : "❚❚ Pause"}
                            </button>
                            <span className={styles.hint}>Arrows / WASD to steer · Space to pause</span>
                        </div>
                    </main>

                    <aside className={styles.side}>
                        <section className={styles.panel}>
                            <header>/// High Scores ///</header>
                            <ol className={styles.scores}>
                                {highScores.length === 0 && (
                                    <li className={styles.copy}>No scores yet. Be first!</li>
                                )}
                                {highScores.map((entry, index) => (
                                    <li key={index}>
                                        <span>
                                            {index + 1}. {entry.name}
                                        </span>
                                        <span>{String(entry.score).padStart(6, "0")}</span>
                                    </li>
                                ))}
                            </ol>
                        </section>

                        <section className={styles.panel}>
                            <header>/// SnakeBot 88-B ///</header>
                            <div className={styles.botCard}>
                                <div className={styles.botFace}>🤖</div>
                                <div className={styles.botStats}>
                                    {["AGI", "CPU", "PWR", "SHD"].map((stat, index) => (
                                        <div key={stat} className={styles.botStat}>
                                            <span>{stat}</span>
                                            <span className={styles.speedBlocksSmall}>
                                                {Array.from({ length: 5 }, (_, blockIndex) => (
                                                    <span
                                                        key={blockIndex}
                                                        className={
                                                            blockIndex < 4 - (index % 2)
                                                                ? styles.blockOn
                                                                : styles.block
                                                        }
                                                    />
                                                ))}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>

                <div className={styles.statusBar}>
                    <span>Welcome, Operator.</span>
                    <span>SnakeBot v1.88 © Robotic Systems Inc.</span>
                    <span>{paused ? "PAUSED" : gameOver ? "CRASHED" : "RUNNING"}</span>
                </div>
            </div>
        </div>
    )
}
