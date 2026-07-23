import React, { useState } from "react"
import PongGame, { PongDifficulty, PongMode, PongResult } from "./PongGame"
import * as styles from "./PongPage.styles.css"

const DIFFICULTIES: PongDifficulty[] = ["easy", "medium", "hard", "impossible"]

interface LastGame {
    winner: string
    score: string
    duration: string
}

/** Home surface for the `pong` pack: classic paddle duel against a bot. */
export default function PongPage(): React.ReactElement {
    const [mode, setMode] = useState<PongMode>("1p")
    const [difficulty, setDifficulty] = useState<PongDifficulty>("hard")
    const [speed, setSpeed] = useState(1)
    const [soundOn, setSoundOn] = useState(true)
    const [paused, setPaused] = useState(false)
    const [resetToken, setResetToken] = useState(0)
    const [lastGame, setLastGame] = useState<LastGame | null>(null)
    const [status, setStatus] = useState("READY.")

    const newGame = (): void => {
        setResetToken((token) => token + 1)
        setPaused(false)
    }

    const handleGameOver = (result: PongResult): void => {
        const minutes = Math.floor(result.durationMs / 60000)
        const seconds = Math.round((result.durationMs % 60000) / 1000)
        setLastGame({
            winner: result.winner === "left" ? "Player" : mode === "2p" ? "Player 2" : "Bot",
            score: `${String(result.left).padStart(2, "0")} - ${String(result.right).padStart(2, "0")}`,
            duration: `${minutes}:${String(seconds).padStart(2, "0")}`,
        })
    }

    return (
        <div className={styles.page}>
            <div className={styles.console}>
                <div className={styles.titleBar}>
                    <span>🤖 PongBot</span>
                    <span className={styles.titleControls}>
                        <span className={styles.titleBtn}>_</span>
                        <span className={styles.titleBtn}>□</span>
                        <span className={styles.titleBtn}>✕</span>
                    </span>
                </div>

                <div className={styles.toolbar}>
                    <button className={styles.chunky} onClick={newGame}>
                        ⟳ New Game
                    </button>
                    <button className={styles.chunky} onClick={() => setPaused((value) => !value)}>
                        {paused ? "▶ Resume" : "❚❚ Pause"}
                    </button>
                    <button
                        className={soundOn ? styles.chunkyLit : styles.chunky}
                        onClick={() => setSoundOn((value) => !value)}
                    >
                        {soundOn ? "🔊 Sound" : "🔇 Sound"}
                    </button>
                    <span className={styles.toolbarSpacer} />
                    <span className={mode === "1p" ? styles.botBadgeOn : styles.botBadge}>
                        {mode === "1p" ? "● BOT ACTIVE" : "○ BOT IDLE"}
                    </span>
                </div>

                <div className={styles.layout}>
                    <aside className={styles.panelColumn}>
                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Game Mode</header>
                            <label className={styles.radioRow}>
                                <input type="radio" checked={mode === "1p"} onChange={() => setMode("1p")} />1
                                Player 👤
                            </label>
                            <label className={styles.radioRow}>
                                <input type="radio" checked={mode === "2p"} onChange={() => setMode("2p")} />2
                                Player 👥
                            </label>
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Difficulty</header>
                            {DIFFICULTIES.map((level) => (
                                <label key={level} className={styles.radioRow}>
                                    <input
                                        type="radio"
                                        checked={difficulty === level}
                                        onChange={() => setDifficulty(level)}
                                        disabled={mode === "2p"}
                                    />
                                    <span className={styles.capitalize}>{level}</span>
                                </label>
                            ))}
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Speed</header>
                            <div className={styles.speedRow}>
                                <span>🐢</span>
                                <input
                                    type="range"
                                    min="60"
                                    max="180"
                                    value={speed * 100}
                                    onChange={(event) => setSpeed(Number(event.target.value) / 100)}
                                />
                                <span>🐇</span>
                            </div>
                        </section>

                        <section className={styles.panelBrand}>
                            <div className={styles.brandName}>PONGBOT</div>
                            <div className={styles.brandTag}>Classic by nature. Retro by design. 🤖</div>
                        </section>
                    </aside>

                    <main className={styles.screenBezel}>
                        <div className={styles.crt}>
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
                            <div className={styles.scanlines} />
                        </div>
                        <div className={styles.controlsHint}>Player 1: W/S or mouse · Player 2: ↑/↓</div>
                    </main>

                    <aside className={styles.panelColumn}>
                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Last Game</header>
                            {lastGame ? (
                                <dl className={styles.stats}>
                                    <div>
                                        <dt>🏆 Winner</dt>
                                        <dd>{lastGame.winner}</dd>
                                    </div>
                                    <div>
                                        <dt>Score</dt>
                                        <dd>{lastGame.score}</dd>
                                    </div>
                                    <div>
                                        <dt>⏱ Duration</dt>
                                        <dd>{lastGame.duration}</dd>
                                    </div>
                                </dl>
                            ) : (
                                <p className={styles.muted}>No games yet. First to 7 wins!</p>
                            )}
                        </section>
                    </aside>
                </div>

                <div className={styles.statusBar}>
                    <span>● {paused ? "PAUSED." : "READY."}</span>
                    <span>{status}</span>
                    <span>FIRST TO 7</span>
                </div>
            </div>
        </div>
    )
}
