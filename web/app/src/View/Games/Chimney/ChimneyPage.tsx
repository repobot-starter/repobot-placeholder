import React, { useEffect, useRef, useState } from "react"
import { readStoredNumber, writeStoredNumber } from "@base/core"
import { useAnimationFrameLoop } from "../../../Utils/useAnimationFrameLoop"
import {
    CHIMNEY_HEIGHT,
    CHIMNEY_LIP,
    CHIMNEY_WIDTH,
    ChimneyEngine,
    FIELD_HEIGHT,
    FIELD_WIDTH,
    PLAYER_HEIGHT,
    PLAYER_WIDTH,
    PLAYER_X,
} from "./engine"
import * as styles from "./ChimneyPage.styles.css"

const HIGH_SCORE_KEY = "chimneybot-high-score"

type Ending = "cooked" | "fell" | "bonked"

interface ChimneyHud {
    houses: number
    speed: number
}

const zeroHud: ChimneyHud = { houses: 0, speed: 0 }

const endingTitle: Record<Ending, string> = {
    cooked: "You got cooked",
    fell: "You fell",
    bonked: "Bonked",
}

const endingLine: Record<Ending, string> = {
    cooked: "Straight down the chimney and onto the family's dinner stove. Tonight's special: you.",
    fell: "You missed the next roof and dropped into the alley. The street is not a house.",
    bonked: "Face first into the bricks. The chimney won that one.",
}

/** Home surface for the `chimney` pack: a night-time rooftop runner. */
export default function ChimneyPage(): React.ReactElement {
    const [paused, setPaused] = useState(false)
    const [resetToken, setResetToken] = useState(0)
    const [hud, setHud] = useState<ChimneyHud>(zeroHud)
    const [ending, setEnding] = useState<{ kind: Ending; score: number } | null>(null)
    const [highScore, setHighScore] = useState(() => readStoredNumber(HIGH_SCORE_KEY, 0))

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
        setEnding(null)
        setPaused(false)
        setHud(zeroHud)
    }

    const handleEnding = (kind: Ending, score: number): void => {
        setEnding({ kind, score })
        if (score > highScore) {
            setHighScore(score)
            writeStoredNumber(HIGH_SCORE_KEY, score)
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.frame}>
                <header className={styles.header}>
                    <div className={styles.wordmarkBlock}>
                        <span className={styles.wordmark}>Chimney</span>
                        <span className={styles.tagline}>Jump house by house. Never land in a chimney.</span>
                    </div>
                    <div className={styles.headerActions}>
                        <button
                            className={styles.button}
                            onClick={() => setPaused((value) => !value)}
                            disabled={ending !== null}
                        >
                            {paused ? "Resume" : "Pause"}
                        </button>
                        <button className={styles.buttonPrimary} onClick={newGame}>
                            New run
                        </button>
                    </div>
                </header>

                <div className={styles.body}>
                    <main className={styles.streetArea}>
                        <div className={styles.viewport}>
                            <ChimneyField
                                paused={paused || ending !== null}
                                resetToken={resetToken}
                                onHud={setHud}
                                onEnding={handleEnding}
                            />
                            {ending !== null && (
                                <div className={styles.modal}>
                                    <div className={styles.modalTitle}>{endingTitle[ending.kind]}</div>
                                    <div className={styles.modalLine}>{endingLine[ending.kind]}</div>
                                    <div className={styles.modalScore}>
                                        Houses cleared {String(ending.score).padStart(6, "0")}
                                    </div>
                                    {ending.score >= highScore && ending.score > 0 && (
                                        <div className={styles.modalRecord}>New neighborhood record</div>
                                    )}
                                    <button className={styles.buttonPrimary} onClick={newGame}>
                                        Run it back
                                    </button>
                                </div>
                            )}
                            {paused && ending === null && (
                                <div className={styles.modal}>
                                    <div className={styles.modalTitle}>Paused</div>
                                    <button className={styles.buttonPrimary} onClick={() => setPaused(false)}>
                                        Back to the rooftops
                                    </button>
                                </div>
                            )}
                        </div>
                    </main>

                    <aside className={styles.rail}>
                        <section className={styles.panel}>
                            <span className={styles.panelLabel}>Run log</span>
                            <div className={styles.statGrid}>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Houses</span>
                                    <span className={styles.statValue}>
                                        {String(hud.houses).padStart(6, "0")}
                                    </span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Best run</span>
                                    <span className={styles.statValue}>
                                        {String(Math.max(highScore, hud.houses)).padStart(6, "0")}
                                    </span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Pace</span>
                                    <span className={styles.statValueSoft}>{Math.round(hud.speed)} u/s</span>
                                </div>
                            </div>
                        </section>

                        <section className={styles.panel}>
                            <span className={styles.panelLabel}>Controls</span>
                            <div className={styles.controlsList}>
                                <div>
                                    <span>Jump</span>
                                    <span>Space ↑ or tap</span>
                                </div>
                                <div>
                                    <span>Jump farther</span>
                                    <span>Hold</span>
                                </div>
                                <div>
                                    <span>Pause</span>
                                    <span>P</span>
                                </div>
                            </div>
                        </section>

                        <section className={styles.panel}>
                            <span className={styles.panelLabel}>House rules</span>
                            <p className={styles.copy}>
                                Every roof counts for one. Clear the gap, clear the chimney, keep running.
                            </p>
                            <p className={styles.copy}>
                                Land in a chimney and you drop straight onto the dinner stove. You get cooked.
                            </p>
                        </section>
                    </aside>
                </div>

                <footer className={styles.statusBar}>
                    <span>{ending !== null ? "Run over" : paused ? "Paused" : "Running"}</span>
                    <span>Space or tap to jump — hold to jump farther</span>
                    <span>Best {String(Math.max(highScore, hud.houses)).padStart(6, "0")}</span>
                </footer>
            </div>
        </div>
    )
}

interface ChimneyFieldProps {
    paused: boolean
    resetToken: number
    onHud: (hud: ChimneyHud) => void
    onEnding: (kind: Ending, score: number) => void
}

// Monochrome night street: everything reads in shades of white on near-black.
const WALL_COLORS = ["#1a1a1e", "#1d1d22", "#17171b", "#202025"]
const ROOF_COLOR = "#2c2c32"
const BRICK = "#3a3a41"
const BRICK_DARK = "#4a4a52"
const WINDOW_LIT = "rgba(255, 255, 255, 0.34)"
const WINDOW_DARK = "rgba(255, 255, 255, 0.05)"
const RUNNER = "#fafafa"

/**
 * The street. requestAnimationFrame loop with the engine in a ref; the parent
 * owns HUD/overlays and receives per-frame telemetry plus the ending.
 * Controls: Space/↑/W or pointer down to jump; releasing early cuts the hop.
 */
function ChimneyField(props: ChimneyFieldProps): React.ReactElement {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const engineRef = useRef<ChimneyEngine | null>(null)
    if (!engineRef.current) {
        engineRef.current = new ChimneyEngine()
        engineRef.current.newGame()
    }
    const propsRef = useRef(props)
    propsRef.current = props

    useEffect(() => {
        if (props.resetToken > 0) {
            engineRef.current?.newGame()
        }
    }, [props.resetToken])

    useEffect(() => {
        const jumpKeys = [" ", "arrowup", "w", "spacebar"]
        const handleDown = (event: KeyboardEvent): void => {
            if (jumpKeys.includes(event.key.toLowerCase()) && !event.repeat) {
                event.preventDefault()
                engineRef.current?.pressJump()
            }
        }
        const handleUp = (event: KeyboardEvent): void => {
            if (jumpKeys.includes(event.key.toLowerCase())) {
                engineRef.current?.releaseJump()
            }
        }
        window.addEventListener("keydown", handleDown)
        window.addEventListener("keyup", handleUp)
        return () => {
            window.removeEventListener("keydown", handleDown)
            window.removeEventListener("keyup", handleUp)
        }
    }, [])

    useAnimationFrameLoop((dt) => {
        const ctx = canvasRef.current?.getContext("2d")
        if (!ctx) {
            return
        }
        const engine = engineRef.current!
        if (!propsRef.current.paused && !engine.isOver) {
            const events = engine.step(dt)
            propsRef.current.onHud({ houses: engine.housesCleared, speed: engine.speed })
            for (const event of events) {
                if (event.kind === "cooked" || event.kind === "fell" || event.kind === "bonked") {
                    propsRef.current.onEnding(event.kind, event.value)
                }
            }
        }
        draw(ctx, engine)
    })

    return (
        <canvas
            ref={canvasRef}
            width={FIELD_WIDTH}
            height={FIELD_HEIGHT}
            className={styles.street}
            onPointerDown={(event) => {
                event.preventDefault()
                engineRef.current?.pressJump()
            }}
            onPointerUp={() => engineRef.current?.releaseJump()}
            onPointerLeave={() => engineRef.current?.releaseJump()}
        />
    )
}

function draw(ctx: CanvasRenderingContext2D, engine: ChimneyEngine): void {
    const camera = engine.playerWorldX - PLAYER_X

    // Night sky.
    ctx.fillStyle = "#0c0c0d"
    ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT)

    // Stars: fixed star field, slow parallax so pausing freezes it.
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)"
    for (let index = 0; index < 40; index += 1) {
        const x = (index * 173 + 61 - camera * 0.08) % FIELD_WIDTH
        const starX = x < 0 ? x + FIELD_WIDTH : x
        const starY = (index * 97 + 23) % 170
        ctx.fillRect(starX, starY, index % 5 === 0 ? 2 : 1, index % 5 === 0 ? 2 : 1)
    }

    // Moon.
    ctx.beginPath()
    ctx.arc(FIELD_WIDTH - 92, 66, 26, 0, Math.PI * 2)
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)"
    ctx.fill()

    // Distant skyline, half-speed parallax.
    ctx.fillStyle = "rgba(255, 255, 255, 0.035)"
    for (let index = 0; index < 12; index += 1) {
        const width = 90 + (index % 4) * 34
        const height = 70 + (index % 5) * 26
        const x = (index * 160 - camera * 0.4) % (FIELD_WIDTH + 240)
        const towerX = x < -width ? x + FIELD_WIDTH + 240 : x
        ctx.fillRect(towerX - 120, FIELD_HEIGHT - height - 60, width, height + 60)
    }

    // Houses.
    for (const house of engine.houses) {
        const screenX = house.x - camera
        if (screenX > FIELD_WIDTH || screenX + house.width < 0) {
            continue
        }
        drawHouse(ctx, screenX, house.roofY, house.width, house.index, house.chimneyOffset, camera)
    }

    // The runner.
    drawRunner(ctx, engine)
}

function drawHouse(
    ctx: CanvasRenderingContext2D,
    x: number,
    roofY: number,
    width: number,
    index: number,
    chimneyOffset: number | null,
    camera: number,
): void {
    // Facade.
    ctx.fillStyle = WALL_COLORS[index % WALL_COLORS.length]!
    ctx.fillRect(x, roofY, width, FIELD_HEIGHT - roofY)

    // Roof cap.
    ctx.fillStyle = ROOF_COLOR
    ctx.fillRect(x - 3, roofY - 6, width + 6, 8)

    // Windows: a deterministic grid, most lit warm, some dark.
    const cols = Math.max(1, Math.floor((width - 24) / 42))
    const rows = Math.max(1, Math.floor((FIELD_HEIGHT - roofY - 30) / 52))
    for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
            const lit = (index * 7 + row * 3 + col * 5) % 4 !== 0
            ctx.fillStyle = lit ? WINDOW_LIT : WINDOW_DARK
            ctx.fillRect(x + 14 + col * 42, roofY + 18 + row * 52, 20, 26)
        }
    }

    // Chimney with its dark opening and a drifting smoke puff.
    if (chimneyOffset !== null) {
        const chimneyX = x + chimneyOffset
        const chimneyTop = roofY - CHIMNEY_HEIGHT
        ctx.fillStyle = BRICK
        ctx.fillRect(chimneyX, chimneyTop, CHIMNEY_WIDTH, CHIMNEY_HEIGHT)
        ctx.fillStyle = BRICK_DARK
        ctx.fillRect(chimneyX - 2, chimneyTop, CHIMNEY_WIDTH + 4, 5)
        // The opening — the part that cooks you.
        ctx.fillStyle = "#050506"
        ctx.fillRect(chimneyX + CHIMNEY_LIP, chimneyTop + 2, CHIMNEY_WIDTH - CHIMNEY_LIP * 2, 6)

        // Smoke drifts on world position so it freezes when paused.
        const drift = (chimneyX + camera) * 0.7
        ctx.fillStyle = "rgba(255, 255, 255, 0.16)"
        for (let puff = 0; puff < 3; puff += 1) {
            const wobble = Math.sin((drift + puff * 40) / 26) * 6
            ctx.beginPath()
            ctx.arc(
                chimneyX + CHIMNEY_WIDTH / 2 + wobble,
                chimneyTop - 12 - puff * 16,
                5 + puff * 2,
                0,
                Math.PI * 2,
            )
            ctx.fill()
        }
    }
}

function drawRunner(ctx: CanvasRenderingContext2D, engine: ChimneyEngine): void {
    const x = PLAYER_X
    const y = engine.playerY
    ctx.save()

    // Body.
    ctx.fillStyle = RUNNER
    ctx.fillRect(x, y + 8, PLAYER_WIDTH, PLAYER_HEIGHT - 14)
    // Head.
    ctx.fillRect(x + 3, y, PLAYER_WIDTH - 6, 10)
    // Eye, looking ahead.
    ctx.fillStyle = "#0a0a0a"
    ctx.fillRect(x + PLAYER_WIDTH - 10, y + 3, 5, 4)
    // Legs: mid-air tuck vs alternating stride from world distance.
    ctx.fillStyle = RUNNER
    if (engine.velocityY !== 0) {
        ctx.fillRect(x + 3, y + PLAYER_HEIGHT - 6, 8, 6)
        ctx.fillRect(x + PLAYER_WIDTH - 11, y + PLAYER_HEIGHT - 8, 8, 6)
    } else {
        const stride = Math.floor(engine.playerWorldX / 18) % 2 === 0
        ctx.fillRect(x + (stride ? 2 : 6), y + PLAYER_HEIGHT - 6, 7, 6)
        ctx.fillRect(x + (stride ? PLAYER_WIDTH - 9 : PLAYER_WIDTH - 13), y + PLAYER_HEIGHT - 6, 7, 6)
    }
    ctx.restore()
}
