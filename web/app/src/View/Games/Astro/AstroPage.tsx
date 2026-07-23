import React, { useEffect, useState } from "react"
import AstroGame, { AstroHud, AstroResult } from "./AstroGame"
import * as styles from "./AstroPage.styles.css"

const HIGH_SCORE_KEY = "astrobot-high-score"

/** Home surface for the `astro` pack: neon asteroids shooter piloted by AstroBot. */
export default function AstroPage(): React.ReactElement {
    const [paused, setPaused] = useState(false)
    const [resetToken, setResetToken] = useState(0)
    const [hud, setHud] = useState<AstroHud>({ score: 0, lives: 3, level: 1 })
    const [gameOver, setGameOver] = useState<AstroResult | null>(null)
    const [highScore, setHighScore] = useState(() => Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0)
    const [clock, setClock] = useState(() => new Date())

    useEffect(() => {
        const interval = setInterval(() => setClock(new Date()), 1000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const handleKey = (event: KeyboardEvent): void => {
            if (event.key === "p" || event.key === "P") {
                event.preventDefault()
                setPaused((value) => !value)
            }
        }
        window.addEventListener("keydown", handleKey)
        return () => window.removeEventListener("keydown", handleKey)
    }, [])

    const newGame = (): void => {
        setResetToken((token) => token + 1)
        setGameOver(null)
        setPaused(false)
    }

    const handleGameOver = (result: AstroResult): void => {
        setGameOver(result)
        if (result.score > highScore) {
            setHighScore(result.score)
            localStorage.setItem(HIGH_SCORE_KEY, String(result.score))
        }
    }

    const shields = Math.max(0, hud.lives) / 3

    return (
        <div className={styles.page}>
            <div className={styles.cockpit}>
                <div className={styles.masthead}>
                    <span className={styles.logo}>ASTROBOT</span>
                    <span className={styles.mastheadPodOk}>● BOT ONLINE — SYSTEMS NOMINAL</span>
                    <span className={styles.mastheadPod}>HYPERDRIVE READY ▸</span>
                    <span className={styles.mastheadPodOk}>⚡ ENERGY CORE 100%</span>
                </div>

                <div className={styles.layout}>
                    <aside className={styles.side}>
                        <section className={styles.panel}>
                            <header>Status</header>
                            <div className={styles.readout}>
                                <label>Score</label>
                                <div className={styles.digitsCyan}>{String(hud.score).padStart(8, "0")}</div>
                            </div>
                            <div className={styles.readout}>
                                <label>High Score</label>
                                <div className={styles.digitsGreen}>
                                    {String(Math.max(highScore, hud.score)).padStart(8, "0")}
                                </div>
                            </div>
                            <div className={styles.readout}>
                                <label>Level</label>
                                <div className={styles.digitsAmber}>
                                    {String(hud.level).padStart(2, "0")} SECTOR{" "}
                                    {String.fromCharCode(64 + Math.min(26, hud.level))}
                                </div>
                            </div>
                            <div className={styles.readout}>
                                <label>Lives</label>
                                <div className={styles.digitsCyan}>
                                    {"🤖".repeat(Math.max(0, hud.lives)) || "—"}
                                </div>
                            </div>
                            <div className={styles.readout}>
                                <label>Shields</label>
                                <div className={styles.barTrack}>
                                    <div className={styles.barFill} style={{ width: `${shields * 100}%` }} />
                                </div>
                            </div>
                        </section>

                        <section className={styles.panel}>
                            <header>Controls</header>
                            <div className={styles.controlsGrid}>
                                <span>← → rotate</span>
                                <span>↑ thrust</span>
                                <span>SPACE shoot</span>
                                <span>P pause</span>
                            </div>
                        </section>
                    </aside>

                    <main className={styles.viewportColumn}>
                        <div className={styles.viewport}>
                            <AstroGame
                                paused={paused || Boolean(gameOver)}
                                resetToken={resetToken}
                                onHud={setHud}
                                onGameOver={handleGameOver}
                            />
                            {gameOver && (
                                <div className={styles.modal}>
                                    <div className={styles.modalTitle}>SHIP DESTROYED</div>
                                    <div className={styles.modalLine}>
                                        FINAL SCORE {String(gameOver.score).padStart(8, "0")}
                                    </div>
                                    {gameOver.score >= highScore && gameOver.score > 0 && (
                                        <div className={styles.modalLineNewRecord}>★ NEW RECORD ★</div>
                                    )}
                                    <button className={styles.btnGreen} onClick={newGame}>
                                        🤖 New Game
                                    </button>
                                </div>
                            )}
                            {paused && !gameOver && (
                                <div className={styles.modal}>
                                    <div className={styles.modalTitleAmber}>PAUSED</div>
                                    <button className={styles.btnAmber} onClick={() => setPaused(false)}>
                                        ▶ Resume
                                    </button>
                                </div>
                            )}
                            <div className={styles.viewportFooter}>
                                {hud.level > 1
                                    ? `⚠ SECTOR ${hud.level} — ASTEROID CLUSTER AHEAD`
                                    : "CLEAR SECTOR ALPHA — ELIMINATE ALL HOSTILES"}
                            </div>
                        </div>
                    </main>

                    <aside className={styles.side}>
                        <section className={styles.panel}>
                            <header>Mission</header>
                            <p className={styles.copy}>
                                Clear each sector of asteroids. Big rocks split — small ones score more.
                            </p>
                            <p className={styles.copy}>Sector bonus: +250.</p>
                        </section>

                        <section className={styles.panelButtons}>
                            <button className={styles.btnGreen} onClick={newGame}>
                                🤖 New Game
                            </button>
                            <button
                                className={styles.btnAmber}
                                onClick={() => setPaused((value) => !value)}
                                disabled={Boolean(gameOver)}
                            >
                                {paused ? "▶ Resume" : "❚❚ Pause"}
                            </button>
                        </section>

                        <section className={styles.panel}>
                            <header>Lore Entry</header>
                            <p className={styles.copy}>
                                "The deeper you go, the smarter they get. Stay sharp, AstroBot." 🤖
                            </p>
                        </section>
                    </aside>
                </div>

                <div className={styles.statusBar}>
                    <span>MISSION: CLEAR SECTOR {String.fromCharCode(64 + Math.min(26, hud.level))}</span>
                    <span>
                        STARDATE {clock.toLocaleDateString()} · {clock.toLocaleTimeString()}
                    </span>
                </div>
            </div>
        </div>
    )
}
