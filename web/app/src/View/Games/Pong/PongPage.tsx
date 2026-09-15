import React, { useState } from "react"
import PongGame, { PongDifficulty, PongMode, PongResult } from "./PongGame"
import * as styles from "./PongPage.styles.css"

const DIFFICULTIES: PongDifficulty[] = ["easy", "medium", "hard", "impossible"]
const DIFFICULTY_LABELS: Record<PongDifficulty, string> = {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    impossible: "Impossible",
}

interface LastGame {
    winner: string
    score: string
    duration: string
}

/** Home surface for the `pong` pack: the classic paddle duel. */
export default function PongPage(): React.ReactElement {
    const [mode, setMode] = useState<PongMode>("1p")
    const [difficulty, setDifficulty] = useState<PongDifficulty>("hard")
    const [speed, setSpeed] = useState(1)
    const [soundOn, setSoundOn] = useState(true)
    const [paused, setPaused] = useState(false)
    const [resetToken, setResetToken] = useState(0)
    const [lastGame, setLastGame] = useState<LastGame | null>(null)
    const [status, setStatus] = useState("Ready")

    const newGame = (): void => {
        setResetToken((token) => token + 1)
        setPaused(false)
    }

    const handleGameOver = (result: PongResult): void => {
        const minutes = Math.floor(result.durationMs / 60000)
        const seconds = Math.round((result.durationMs % 60000) / 1000)
        setLastGame({
            winner: result.winner === "left" ? "Player one" : mode === "2p" ? "Player two" : "CPU",
            score: `${result.left}–${result.right}`,
            duration: `${minutes}:${String(seconds).padStart(2, "0")}`,
        })
    }

    return (
        <div className={styles.page}>
            <div className={styles.console}>
                <header className={styles.header}>
                    <div className={styles.wordmarkBlock}>
                        <span className={styles.wordmark}>Pong</span>
                        <span className={styles.tagline}>The original duel. First to seven takes it.</span>
                    </div>
                    <div className={styles.headerActions}>
                        <button
                            className={soundOn ? styles.button : styles.buttonMuted}
                            onClick={() => setSoundOn((value) => !value)}
                        >
                            {soundOn ? "Sound on" : "Sound off"}
                        </button>
                        <button className={styles.button} onClick={() => setPaused((value) => !value)}>
                            {paused ? "Resume" : "Pause"}
                        </button>
                        <button className={styles.buttonPrimary} onClick={newGame}>
                            New game
                        </button>
                    </div>
                </header>

                <main className={styles.arena}>
                    <PongGame
                        mode={mode}
                        difficulty={difficulty}
                        speed={speed}
                        soundOn={soundOn}
                        paused={paused}
                        resetToken={resetToken}
                        onScore={() => {}}
                        onGameOver={handleGameOver}
                        onStatus={setStatus}
                    />
                </main>

                <div className={styles.controls}>
                    <section className={styles.group}>
                        <span className={styles.groupLabel}>Mode</span>
                        <div className={styles.segmented}>
                            <button
                                className={mode === "1p" ? styles.segmentOn : styles.segment}
                                onClick={() => setMode("1p")}
                            >
                                Solo
                            </button>
                            <button
                                className={mode === "2p" ? styles.segmentOn : styles.segment}
                                onClick={() => setMode("2p")}
                            >
                                Two player
                            </button>
                        </div>
                    </section>

                    <section className={styles.group}>
                        <span className={styles.groupLabel}>Difficulty</span>
                        <div className={styles.segmented}>
                            {DIFFICULTIES.map((level) => (
                                <button
                                    key={level}
                                    className={difficulty === level ? styles.segmentOn : styles.segment}
                                    onClick={() => setDifficulty(level)}
                                    disabled={mode === "2p"}
                                >
                                    {DIFFICULTY_LABELS[level]}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className={styles.group}>
                        <span className={styles.groupLabel}>Speed</span>
                        <div className={styles.speedRow}>
                            <input
                                type="range"
                                min="60"
                                max="180"
                                value={speed * 100}
                                onChange={(event) => setSpeed(Number(event.target.value) / 100)}
                            />
                            <span className={styles.speedValue}>{speed.toFixed(1)}×</span>
                        </div>
                    </section>

                    <section className={styles.groupGrow}>
                        <span className={styles.groupLabel}>Last game</span>
                        {lastGame ? (
                            <div className={styles.statsRow}>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Winner</span>
                                    <span className={styles.statValue}>{lastGame.winner}</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Score</span>
                                    <span className={styles.statValue}>{lastGame.score}</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Time</span>
                                    <span className={styles.statValue}>{lastGame.duration}</span>
                                </div>
                            </div>
                        ) : (
                            <span className={styles.statEmpty}>No games played yet.</span>
                        )}
                    </section>
                </div>

                <footer className={styles.statusBar}>
                    <span>{paused ? "Paused" : status}</span>
                    <span>P1 · W/S or mouse — P2 · arrow keys</span>
                    <span>First to 7</span>
                </footer>
            </div>
        </div>
    )
}
