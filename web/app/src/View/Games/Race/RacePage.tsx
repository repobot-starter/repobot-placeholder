import React, { useEffect, useRef, useState } from "react"
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

/** Home surface for the `race` pack: a neon three-lane highway racer. */
export default function RacePage(): React.ReactElement {
    const [paused, setPaused] = useState(false)
    const [resetToken, setResetToken] = useState(0)
    const [hud, setHud] = useState<RaceHud>(zeroHud)
    const [finalScore, setFinalScore] = useState<number | null>(null)
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
        setFinalScore(null)
        setPaused(false)
        setHud(zeroHud)
    }

    const handleCrash = (score: number): void => {
        setFinalScore(score)
        if (score > highScore) {
            setHighScore(score)
            localStorage.setItem(HIGH_SCORE_KEY, String(score))
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.cockpit}>
                <div className={styles.masthead}>
                    <span className={styles.logo}>RACEBOT</span>
                    <span className={styles.mastheadPodOk}>● PIT WALL ONLINE — TELEMETRY NOMINAL</span>
                    <span className={styles.mastheadPod}>TRACK: NEON EXPRESSWAY ▸</span>
                    <span className={styles.mastheadPodOk}>⛽ FUEL 100%</span>
                </div>

                <div className={styles.layout}>
                    <aside className={styles.side}>
                        <section className={styles.panel}>
                            <header>Telemetry</header>
                            <div className={styles.readout}>
                                <label>Score</label>
                                <div className={styles.digitsCyan}>{String(hud.score).padStart(8, "0")}</div>
                            </div>
                            <div className={styles.readout}>
                                <label>Best Run</label>
                                <div className={styles.digitsGreen}>
                                    {String(Math.max(highScore, hud.score)).padStart(8, "0")}
                                </div>
                            </div>
                            <div className={styles.readout}>
                                <label>Speed</label>
                                <div className={styles.digitsAmber}>{Math.round(hud.kph)} KM/H</div>
                            </div>
                            <div className={styles.readout}>
                                <label>Distance</label>
                                <div className={styles.digitsCyan}>{Math.floor(hud.distance)} M</div>
                            </div>
                            <div className={styles.readout}>
                                <label>Overtakes</label>
                                <div className={styles.digitsGreen}>{hud.overtakes}</div>
                            </div>
                            <div className={styles.readout}>
                                <label>Nitro</label>
                                <div className={styles.barTrack}>
                                    <div
                                        className={styles.barFill}
                                        style={{ width: `${hud.nitro * 100}%` }}
                                    />
                                </div>
                            </div>
                        </section>

                        <section className={styles.panel}>
                            <header>Controls</header>
                            <div className={styles.controlsGrid}>
                                <span>← → change lane</span>
                                <span>↑ / SHIFT nitro</span>
                                <span>P pause</span>
                            </div>
                        </section>
                    </aside>

                    <main className={styles.viewportColumn}>
                        <div className={styles.viewport}>
                            <RaceField
                                paused={paused || finalScore !== null}
                                resetToken={resetToken}
                                onHud={setHud}
                                onCrash={handleCrash}
                            />
                            {finalScore !== null && (
                                <div className={styles.modal}>
                                    <div className={styles.modalTitle}>WRECKED</div>
                                    <div className={styles.modalLine}>
                                        FINAL SCORE {String(finalScore).padStart(8, "0")}
                                    </div>
                                    {finalScore >= highScore && finalScore > 0 && (
                                        <div className={styles.modalLineNewRecord}>★ NEW LAP RECORD ★</div>
                                    )}
                                    <button className={styles.btnGreen} onClick={newGame}>
                                        🤖 Restart Race
                                    </button>
                                </div>
                            )}
                            {paused && finalScore === null && (
                                <div className={styles.modal}>
                                    <div className={styles.modalTitleAmber}>PIT STOP</div>
                                    <button className={styles.btnAmber} onClick={() => setPaused(false)}>
                                        ▶ Back to the Track
                                    </button>
                                </div>
                            )}
                            <div className={styles.viewportFooter}>
                                {hud.kph > 300
                                    ? "⚠ NITRO BURN — WATCH THE BUMPERS"
                                    : "WEAVE THROUGH TRAFFIC — EVERY OVERTAKE PAYS +50"}
                            </div>
                        </div>
                    </main>

                    <aside className={styles.side}>
                        <section className={styles.panel}>
                            <header>Race Brief</header>
                            <p className={styles.copy}>
                                Traffic never ends — the run does. Weave lanes, ride the nitro, and cash every
                                overtake.
                            </p>
                            <p className={styles.copy}>Overtake bonus: +50.</p>
                        </section>

                        <section className={styles.panelButtons}>
                            <button className={styles.btnGreen} onClick={newGame}>
                                🤖 Restart Race
                            </button>
                            <button
                                className={styles.btnAmber}
                                onClick={() => setPaused((value) => !value)}
                                disabled={finalScore !== null}
                            >
                                {paused ? "▶ Resume" : "❚❚ Pit Stop"}
                            </button>
                        </section>

                        <section className={styles.panel}>
                            <header>Pit Radio</header>
                            <p className={styles.copy}>
                                "Box box? Negative. Send it down the middle lane, RaceBot." 🤖
                            </p>
                        </section>
                    </aside>
                </div>

                <div className={styles.statusBar}>
                    <span>SESSION: NIGHT RUN — NEON EXPRESSWAY</span>
                    <span>
                        RACE CLOCK {clock.toLocaleDateString()} · {clock.toLocaleTimeString()}
                    </span>
                </div>
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

/** Traffic paint jobs by `kind`; the player car is always cyan. */
const TRAFFIC_COLORS = ["#ff6b81", "#ffd166", "#b98cff", "#7cf29c"]
const PLAYER_COLOR = "#57c8ff"
const NITRO_COLOR = "#ffb347"

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

    useEffect(() => {
        const ctx = canvasRef.current?.getContext("2d")
        if (!ctx) {
            return
        }
        let frameId: number
        let lastTime = performance.now()

        const tick = (now: number): void => {
            frameId = requestAnimationFrame(tick)
            const dt = Math.min(0.05, (now - lastTime) / 1000)
            lastTime = now
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
        }
        frameId = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frameId)
    }, [])

    return <canvas ref={canvasRef} width={FIELD_WIDTH} height={FIELD_HEIGHT} className={styles.road} />
}

function draw(ctx: CanvasRenderingContext2D, engine: RaceEngine): void {
    // Night asphalt with grass shoulders.
    ctx.fillStyle = "#08130a"
    ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT)
    ctx.fillStyle = "#14141d"
    ctx.fillRect(ROAD_LEFT, 0, ROAD_WIDTH, FIELD_HEIGHT)

    // Everything painted on the road scrolls by total distance traveled.
    const scroll = engine.distanceMeters * UNITS_PER_METER

    // Rumble strips on both road edges.
    const stripePeriod = 48
    const stripeOffset = scroll % stripePeriod
    for (let y = -stripePeriod; y < FIELD_HEIGHT + stripePeriod; y += stripePeriod) {
        const stripeY = y + stripeOffset
        const even = Math.floor((y - stripeOffset) / stripePeriod) % 2 === 0
        ctx.fillStyle = even ? "#ff6b81" : "#f4f4f8"
        ctx.fillRect(ROAD_LEFT - 10, stripeY, 10, stripePeriod / 2)
        ctx.fillRect(ROAD_LEFT + ROAD_WIDTH, stripeY, 10, stripePeriod / 2)
    }

    // Dashed lane dividers.
    const dashPeriod = 68
    const dashOffset = scroll % dashPeriod
    ctx.fillStyle = "#3c3c52"
    for (let lane = 1; lane < LANE_COUNT; lane += 1) {
        const x = ROAD_LEFT + LANE_WIDTH * lane
        for (let y = -dashPeriod; y < FIELD_HEIGHT + dashPeriod; y += dashPeriod) {
            ctx.fillRect(x - 3, y + dashOffset, 6, 40)
        }
    }

    // Nitro speed streaks (deterministic from scroll so pausing freezes them).
    if (engine.isNitroActive) {
        ctx.fillStyle = "rgba(255, 179, 71, 0.35)"
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
        ctx.fillStyle = NITRO_COLOR
        ctx.shadowColor = NITRO_COLOR
        ctx.shadowBlur = 14
        ctx.fill()
        ctx.shadowBlur = 0
    }
    drawCar(ctx, engine.playerX, PLAYER_Y, PLAYER_COLOR, true)
}

/** One car: glowing rounded body, cabin glass, and head/tail lights. */
function drawCar(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    topY: number,
    color: string,
    isPlayer: boolean,
): void {
    const left = centerX - CAR_WIDTH / 2
    ctx.save()
    ctx.shadowColor = color
    ctx.shadowBlur = 12
    ctx.fillStyle = color
    roundedRect(ctx, left, topY, CAR_WIDTH, CAR_LENGTH, 12)
    ctx.fill()
    ctx.shadowBlur = 0

    // Cabin glass.
    ctx.fillStyle = "rgba(8, 10, 18, 0.78)"
    roundedRect(ctx, left + 8, topY + (isPlayer ? 18 : CAR_LENGTH - 52), CAR_WIDTH - 16, 34, 7)
    ctx.fill()

    // Player shows headlights up the road; traffic shows tail lights.
    ctx.fillStyle = isPlayer ? "#fdf6c9" : "#ff3b30"
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
