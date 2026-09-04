import React, { useEffect, useRef, useState } from "react"
import { readStoredNumber, writeStoredNumber } from "@base/core"
import { useAnimationFrameLoop } from "../../../Utils/useAnimationFrameLoop"
import {
    CAR_LENGTH,
    CAR_WIDTH,
    FIELD_HEIGHT,
    FIELD_WIDTH,
    LANE_COUNT,
    LANE_WIDTH,
    PLAYER_Y,
    RaceEngine,
    ROAD_LEFT,
    ROAD_WIDTH,
    UNITS_PER_METER,
} from "./engine"
import * as styles from "./RacePage.styles.css"

const HIGH_SCORE_KEY = "racebot-high-score"

/** km/h shown on the speedo: field units/s ÷ UNITS_PER_METER × 3.6. */
const KPH_PER_UNIT = 3.6 / UNITS_PER_METER

interface RaceHud {
    score: number
    kph: number
    distance: number
    overtakes: number
    nitro: number
}

const zeroHud: RaceHud = { score: 0, kph: 0, distance: 0, overtakes: 0, nitro: 1 }

/** Home surface for the `race` pack: a three-lane night highway racer. */
export default function RacePage(): React.ReactElement {
    const [paused, setPaused] = useState(false)
    const [resetToken, setResetToken] = useState(0)
    const [hud, setHud] = useState<RaceHud>(zeroHud)
    const [finalScore, setFinalScore] = useState<number | null>(null)
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
        setFinalScore(null)
        setPaused(false)
        setHud(zeroHud)
    }

    const handleCrash = (score: number): void => {
        setFinalScore(score)
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
                        <span className={styles.wordmark}>Race</span>
                        <span className={styles.tagline}>
                            Three lanes, endless traffic. Every overtake pays.
                        </span>
                    </div>
                    <div className={styles.headerActions}>
                        <button
                            className={styles.button}
                            onClick={() => setPaused((value) => !value)}
                            disabled={finalScore !== null}
                        >
                            {paused ? "Resume" : "Pause"}
                        </button>
                        <button className={styles.buttonPrimary} onClick={newGame}>
                            New run
                        </button>
                    </div>
                </header>

                <div className={styles.body}>
                    <main className={styles.roadArea}>
                        <div className={styles.viewport}>
                            <RaceField
                                paused={paused || finalScore !== null}
                                resetToken={resetToken}
                                onHud={setHud}
                                onCrash={handleCrash}
                            />
                            {finalScore !== null && (
                                <div className={styles.modal}>
                                    <div className={styles.modalTitle}>Wrecked</div>
                                    <div className={styles.modalLine}>
                                        Score {String(finalScore).padStart(8, "0")}
                                    </div>
                                    {finalScore >= highScore && finalScore > 0 && (
                                        <div className={styles.modalRecord}>New best run</div>
                                    )}
                                    <button className={styles.buttonPrimary} onClick={newGame}>
                                        Race again
                                    </button>
                                </div>
                            )}
                            {paused && finalScore === null && (
                                <div className={styles.modal}>
                                    <div className={styles.modalTitle}>Paused</div>
                                    <button className={styles.buttonPrimary} onClick={() => setPaused(false)}>
                                        Back to the road
                                    </button>
                                </div>
                            )}
                        </div>
                    </main>

                    <aside className={styles.rail}>
                        <section className={styles.panel}>
                            <span className={styles.panelLabel}>Telemetry</span>
                            <div className={styles.statGrid}>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Score</span>
                                    <span className={styles.statValue}>
                                        {String(hud.score).padStart(8, "0")}
                                    </span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Best run</span>
                                    <span className={styles.statValue}>
                                        {String(Math.max(highScore, hud.score)).padStart(8, "0")}
                                    </span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Speed</span>
                                    <span className={styles.statValueSoft}>{Math.round(hud.kph)} km/h</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Distance</span>
                                    <span className={styles.statValueSoft}>{Math.floor(hud.distance)} m</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Overtakes</span>
                                    <span className={styles.statValueSoft}>{hud.overtakes}</span>
                                </div>
                                <div className={styles.statWide}>
                                    <span className={styles.statLabel}>Nitro</span>
                                    <div className={styles.barTrack}>
                                        <div
                                            className={styles.barFill}
                                            style={{ width: `${hud.nitro * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className={styles.panel}>
                            <span className={styles.panelLabel}>Controls</span>
                            <div className={styles.controlsList}>
                                <div>
                                    <span>Change lane</span>
                                    <span>← → or A D</span>
                                </div>
                                <div>
                                    <span>Nitro</span>
                                    <span>↑ W or shift</span>
                                </div>
                                <div>
                                    <span>Pause</span>
                                    <span>P</span>
                                </div>
                            </div>
                        </section>

                        <section className={styles.panel}>
                            <span className={styles.panelLabel}>Race brief</span>
                            <p className={styles.copy}>
                                Traffic never ends — the run does. Weave lanes, ride the nitro, and cash every
                                overtake for +50.
                            </p>
                        </section>
                    </aside>
                </div>

                <footer className={styles.statusBar}>
                    <span>{finalScore !== null ? "Wrecked" : paused ? "Paused" : "Running"}</span>
                    <span>Arrows to steer — shift for nitro</span>
                    <span>Overtake +50</span>
                </footer>
            </div>
        </div>
    )
}

interface RaceFieldProps {
    paused: boolean
    resetToken: number
    onHud: (hud: RaceHud) => void
    onCrash: (score: number) => void
}

/** Monochrome traffic by `kind`; the player car is always the bright one. */
const TRAFFIC_COLORS = ["#6e6e75", "#8f8f96", "#55555b", "#7c7c83"]
const PLAYER_COLOR = "#fafafa"

/**
 * The road. requestAnimationFrame loop with the engine in a ref; the parent
 * owns HUD/overlays and receives per-frame telemetry plus the crash.
 * Controls: ←/→ (or A/D) tap to change lane, ↑/W/Shift holds nitro.
 */
function RaceField(props: RaceFieldProps): React.ReactElement {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const engineRef = useRef<RaceEngine | null>(null)
    if (!engineRef.current) {
        engineRef.current = new RaceEngine()
    }
    const propsRef = useRef(props)
    propsRef.current = props

    useEffect(() => {
        engineRef.current?.newGame()
    }, [props.resetToken])

    useEffect(() => {
        const steerKeys: Record<string, "left" | "right"> = {
            arrowleft: "left",
            a: "left",
            arrowright: "right",
            d: "right",
        }
        const nitroKeys = ["arrowup", "w", "shift"]
        const handleDown = (event: KeyboardEvent): void => {
            const key = event.key.toLowerCase()
            const engine = engineRef.current
            if (!engine) {
                return
            }
            if (steerKeys[key] && !event.repeat) {
                event.preventDefault()
                if (steerKeys[key] === "left") {
                    engine.steerLeft()
                } else {
                    engine.steerRight()
                }
            }
            if (nitroKeys.includes(key)) {
                event.preventDefault()
                engine.isBoosting = true
            }
        }
        const handleUp = (event: KeyboardEvent): void => {
            if (nitroKeys.includes(event.key.toLowerCase())) {
                engineRef.current!.isBoosting = false
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
            propsRef.current.onHud({
                score: engine.score,
                kph: engine.effectiveSpeed * KPH_PER_UNIT,
                distance: engine.distanceMeters,
                overtakes: engine.overtakes,
                nitro: engine.nitro,
            })
            const crash = events.find((event) => event.kind === "crash")
            if (crash) {
                propsRef.current.onCrash(crash.value)
            }
        }
        draw(ctx, engine)
    })

    return <canvas ref={canvasRef} width={FIELD_WIDTH} height={FIELD_HEIGHT} className={styles.road} />
}

function draw(ctx: CanvasRenderingContext2D, engine: RaceEngine): void {
    // Night shoulders around a slightly lifted asphalt strip.
    ctx.fillStyle = "#0c0c0d"
    ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT)
    ctx.fillStyle = "#111112"
    ctx.fillRect(ROAD_LEFT, 0, ROAD_WIDTH, FIELD_HEIGHT)

    // Everything painted on the road scrolls by total distance traveled.
    const scroll = engine.distanceMeters * UNITS_PER_METER

    // Rumble strips on both road edges.
    const stripePeriod = 48
    const stripeOffset = scroll % stripePeriod
    for (let y = -stripePeriod; y < FIELD_HEIGHT + stripePeriod; y += stripePeriod) {
        const stripeY = y + stripeOffset
        const even = Math.floor((y - stripeOffset) / stripePeriod) % 2 === 0
        ctx.fillStyle = even ? "rgba(255, 255, 255, 0.55)" : "rgba(255, 255, 255, 0.12)"
        ctx.fillRect(ROAD_LEFT - 8, stripeY, 6, stripePeriod / 2)
        ctx.fillRect(ROAD_LEFT + ROAD_WIDTH + 2, stripeY, 6, stripePeriod / 2)
    }

    // Dashed lane dividers.
    const dashPeriod = 68
    const dashOffset = scroll % dashPeriod
    ctx.fillStyle = "rgba(255, 255, 255, 0.14)"
    for (let lane = 1; lane < LANE_COUNT; lane += 1) {
        const x = ROAD_LEFT + LANE_WIDTH * lane
        for (let y = -dashPeriod; y < FIELD_HEIGHT + dashPeriod; y += dashPeriod) {
            ctx.fillRect(x - 2, y + dashOffset, 4, 40)
        }
    }

    // Nitro speed streaks (deterministic from scroll so pausing freezes them).
    if (engine.isNitroActive) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)"
        for (let index = 0; index < 7; index += 1) {
            const x = ROAD_LEFT + ((index * 47 + Math.floor(scroll / 3) * 13) % ROAD_WIDTH)
            const y = (index * 131 + scroll * 2.4) % FIELD_HEIGHT
            ctx.fillRect(x, FIELD_HEIGHT - y, 2, 34)
        }
    }

    // Traffic (tail lights face the player — everyone drives the same way).
    for (const car of engine.traffic) {
        drawCar(ctx, car.x, car.y, TRAFFIC_COLORS[car.kind % TRAFFIC_COLORS.length]!, false)
    }

    // Player car with the nitro flame behind the rear bumper.
    if (engine.isNitroActive) {
        ctx.beginPath()
        ctx.moveTo(engine.playerX - 10, PLAYER_Y + CAR_LENGTH - 4)
        ctx.lineTo(engine.playerX, PLAYER_Y + CAR_LENGTH + 26 + (scroll % 9))
        ctx.lineTo(engine.playerX + 10, PLAYER_Y + CAR_LENGTH - 4)
        ctx.closePath()
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)"
        ctx.fill()
    }
    drawCar(ctx, engine.playerX, PLAYER_Y, PLAYER_COLOR, true)
}

/** One car: flat rounded body, cabin glass, and head/tail lights. */
function drawCar(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    topY: number,
    color: string,
    isPlayer: boolean,
): void {
    const left = centerX - CAR_WIDTH / 2
    ctx.save()
    ctx.fillStyle = color
    roundedRect(ctx, left, topY, CAR_WIDTH, CAR_LENGTH, 12)
    ctx.fill()

    // Cabin glass.
    ctx.fillStyle = "rgba(10, 10, 10, 0.8)"
    roundedRect(ctx, left + 8, topY + (isPlayer ? 18 : CAR_LENGTH - 52), CAR_WIDTH - 16, 34, 7)
    ctx.fill()

    // Player shows headlights up the road; traffic shows tail lights.
    ctx.fillStyle = isPlayer ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.35)"
    const lightY = isPlayer ? topY + 2 : topY + CAR_LENGTH - 6
    ctx.fillRect(left + 6, lightY, 12, 4)
    ctx.fillRect(left + CAR_WIDTH - 18, lightY, 12, 4)
    ctx.restore()
}

function roundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
): void {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.arcTo(x + width, y, x + width, y + height, radius)
    ctx.arcTo(x + width, y + height, x, y + height, radius)
    ctx.arcTo(x, y + height, x, y, radius)
    ctx.arcTo(x, y, x + width, y, radius)
    ctx.closePath()
}
