import React, { useRef, useState } from "react"
import { readStoredNumber, writeStoredNumber } from "@base/core"
import AsteroidGame, { AsteroidResult } from "./AsteroidGame"
import * as styles from "./AsteroidPage.styles.css"

const BEST_SCORE_KEY = "asteroid.best"

type Phase = "ready" | "playing" | "over"

/** Home surface for the `asteroid` pack: vector asteroids in wraparound space. */
export default function AsteroidPage(): React.ReactElement {
    const [phase, setPhase] = useState<Phase>("ready")
    const [paused, setPaused] = useState(false)
    const [soundOn, setSoundOn] = useState(true)
    const [resetToken, setResetToken] = useState(0)
    const [score, setScore] = useState(0)
    const [lives, setLives] = useState(3)
    const [wave, setWave] = useState(1)
    const [best, setBest] = useState(() => readStoredNumber(BEST_SCORE_KEY, 0))
    const [lastGame, setLastGame] = useState<AsteroidResult | null>(null)
    const touchKeys = useRef<Set<string>>(new Set())

    const startGame = (): void => {
        setResetToken((token) => token + 1)
        setPhase("playing")
        setPaused(false)
        setLastGame(null)
    }

    const handleGameOver = (result: AsteroidResult): void => {
        setPhase("over")
        setLastGame(result)
        if (result.score > best) {
            setBest(result.score)
            writeStoredNumber(BEST_SCORE_KEY, result.score)
        }
    }

    const touchHold = (action: string): Record<string, (event: React.PointerEvent) => void> => ({
        onPointerDown: (event) => {
            event.preventDefault()
            touchKeys.current.add(action)
        },
        onPointerUp: () => touchKeys.current.delete(action),
        onPointerLeave: () => touchKeys.current.delete(action),
        onPointerCancel: () => touchKeys.current.delete(action),
    })

    return (
        <div className={styles.page}>
            <div className={styles.console}>
                <header className={styles.header}>
                    <div className={styles.wordmarkBlock}>
                        <span className={styles.wordmark}>Asteroids</span>
                        <span className={styles.tagline}>Clear the field. Mind your momentum.</span>
                    </div>
                    <div className={styles.headerActions}>
                        <button
                            className={soundOn ? styles.button : styles.buttonMuted}
                            onClick={() => setSoundOn((value) => !value)}
                        >
                            {soundOn ? "Sound on" : "Sound off"}
                        </button>
                        <button
                            className={styles.button}
                            onClick={() => setPaused((value) => !value)}
                            disabled={phase !== "playing"}
                        >
                            {paused ? "Resume" : "Pause"}
                        </button>
                        <button className={styles.buttonPrimary} onClick={startGame}>
                            {phase === "playing" ? "Restart" : "New game"}
                        </button>
                    </div>
                </header>

                <main className={styles.arena}>
                    <AsteroidGame
                        running={phase === "playing"}
                        paused={paused}
                        soundOn={soundOn}
                        resetToken={resetToken}
                        touchKeys={touchKeys}
                        onScore={setScore}
                        onLives={setLives}
                        onWave={setWave}
                        onGameOver={handleGameOver}
                    />

                    <div className={styles.hud}>
                        <span className={styles.hudScore}>{String(score).padStart(5, "0")}</span>
                        <div className={styles.hudMeta}>
                            <span className={styles.hudLives}>
                                {Array.from({ length: Math.max(0, lives) }, (_, index) => (
                                    <span key={index}>▲</span>
                                ))}
                            </span>
                            <span>Wave {String(wave).padStart(2, "0")}</span>
                            <span>Best {String(Math.max(best, score)).padStart(5, "0")}</span>
                        </div>
                    </div>

                    {phase === "ready" && (
                        <div className={styles.overlay}>
                            <div className={styles.overlayTitle}>Asteroids</div>
                            <p className={styles.overlayHint}>
                                Thrust carries. Rocks split twice before they clear. Each wave brings more.
                            </p>
                            <button className={styles.buttonPrimary} onClick={startGame}>
                                Start
                            </button>
                            <span className={styles.overlayText}>Arrows or WASD — space to fire</span>
                        </div>
                    )}

                    {phase === "over" && (
                        <div className={styles.overlay}>
                            <div className={styles.overlayTitle}>Game over</div>
                            <span className={styles.overlayText}>
                                Score {String(lastGame?.score ?? 0).padStart(5, "0")} — wave{" "}
                                {lastGame?.wave ?? 1}
                                {lastGame !== null && lastGame.score >= best && lastGame.score > 0
                                    ? " — new best"
                                    : ""}
                            </span>
                            <button className={styles.buttonPrimary} onClick={startGame}>
                                Play again
                            </button>
                        </div>
                    )}

                    {paused && phase === "playing" && (
                        <div className={styles.overlay}>
                            <div className={styles.overlayTitle}>Paused</div>
                            <button className={styles.buttonPrimary} onClick={() => setPaused(false)}>
                                Resume
                            </button>
                        </div>
                    )}

                    <div className={styles.touchControls}>
                        <div className={styles.touchCluster}>
                            <button
                                className={styles.touchButton}
                                {...touchHold("left")}
                                aria-label="Turn left"
                            >
                                ⟲
                            </button>
                            <button
                                className={styles.touchButton}
                                {...touchHold("right")}
                                aria-label="Turn right"
                            >
                                ⟳
                            </button>
                        </div>
                        <div className={styles.touchCluster}>
                            <button
                                className={styles.touchButton}
                                {...touchHold("thrust")}
                                aria-label="Thrust"
                            >
                                ▲
                            </button>
                            <button className={styles.touchButton} {...touchHold("fire")} aria-label="Fire">
                                ●
                            </button>
                        </div>
                    </div>
                </main>

                <footer className={styles.statusBar}>
                    <span>
                        {phase === "over"
                            ? "Game over"
                            : paused
                              ? "Paused"
                              : phase === "ready"
                                ? "Ready"
                                : "In flight"}
                    </span>
                    <span>Turn — arrows or A/D · thrust — up or W · fire — space</span>
                    <span>Wave {String(wave).padStart(2, "0")}</span>
                </footer>
            </div>
        </div>
    )
}
