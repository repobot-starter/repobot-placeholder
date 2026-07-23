import React, { useEffect, useRef, useState } from "react"
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
    cooked: "YOU GOT COOKED",
    fell: "YOU FELL",
    bonked: "BONKED",
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
        setEnding(null)
        setPaused(false)
        setHud(zeroHud)
    }

    const handleEnding = (kind: Ending, score: number): void => {
        setEnding({ kind, score })
        if (score > highScore) {
            setHighScore(score)
            localStorage.setItem(HIGH_SCORE_KEY, String(score))
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.cabinet}>
                <div className={styles.masthead}>
                    <span className={styles.logo}>CHIMNEYBOT</span>
                    <span className={styles.mastheadPodOk}>● ROOFTOPS CLEAR — WIND CALM</span>
                    <span className={styles.mastheadPod}>DISTRICT: STOVEPIPE ROW ▸</span>
                    <span className={styles.mastheadPodOk}>🌙 NIGHT SHIFT</span>
                </div>

                <div className={styles.layout}>
                    <aside className={styles.side}>
                        <section className={styles.panel}>
                            <header>Run Log</header>
                            <div className={styles.readout}>
                                <label>Houses</label>
                                <div className={styles.digitsAmber}>
                                    {String(hud.houses).padStart(6, "0")}
                                </div>
                            </div>
                            <div className={styles.readout}>
                                <label>Best Run</label>
                                <div className={styles.digitsMint}>
                                    {String(Math.max(highScore, hud.houses)).padStart(6, "0")}
                                </div>
                            </div>
                            <div className={styles.readout}>
                                <label>Pace</label>
                                <div className={styles.digitsEmber}>{Math.round(hud.speed)} U/S</div>
                            </div>
                        </section>

                        <section className={styles.panel}>
                            <header>Controls</header>
                            <div className={styles.controlsGrid}>
                                <span>SPACE / ↑ / tap — jump</span>
                                <span>hold to jump farther</span>
                                <span>P pause</span>
                            </div>
                        </section>
                    </aside>

                    <main className={styles.viewportColumn}>
                        <div className={styles.viewport}>
                            <ChimneyField
                                paused={paused || ending !== null}
                                resetToken={resetToken}
                                onHud={setHud}
                                onEnding={handleEnding}
                            />
                            {ending !== null && (
                                <div className={styles.modal}>
                                    {ending.kind === "cooked" && (
                                        <div className={styles.stoveScene}>🏠🔥🍲</div>
                                    )}
                                    <div className={styles.modalTitle}>{endingTitle[ending.kind]}</div>
                                    <div className={styles.modalLine}>{endingLine[ending.kind]}</div>
                                    <div className={styles.modalLine}>
                                        HOUSES CLEARED {String(ending.score).padStart(6, "0")}
                                    </div>
                                    {ending.score >= highScore && ending.score > 0 && (
                                        <div className={styles.modalLineNewRecord}>
                                            ★ NEW NEIGHBORHOOD RECORD ★
                                        </div>
                                    )}
                                    <button className={styles.btnMint} onClick={newGame}>
                                        🤖 Run It Back
                                    </button>
                                </div>
                            )}
                            {paused && ending === null && (
                                <div className={styles.modal}>
                                    <div className={styles.modalTitleAmber}>CATCHING BREATH</div>
                                    <button className={styles.btnAmber} onClick={() => setPaused(false)}>
                                        ▶ Back to the Rooftops
                                    </button>
                                </div>
                            )}
                            <div className={styles.viewportFooter}>
                                {hud.speed > 300
                                    ? "⚠ FULL SPRINT — MIND THE CHIMNEYS"
                                    : "JUMP HOUSE BY HOUSE — NEVER LAND IN A CHIMNEY"}
                            </div>
                        </div>
                    </main>

                    <aside className={styles.side}>
                        <section className={styles.panel}>
                            <header>House Rules</header>
                            <p className={styles.copy}>
                                Every roof counts for one. Clear the gap, clear the chimney, keep running.
                            </p>
                            <p className={styles.copy}>
                                Land in a chimney and you drop straight onto the dinner stove. You get cooked.
                            </p>
                        </section>

                        <section className={styles.panelButtons}>
                            <button className={styles.btnMint} onClick={newGame}>
                                🤖 Restart Run
                            </button>
                            <button
                                className={styles.btnAmber}
                                onClick={() => setPaused((value) => !value)}
                                disabled={ending !== null}
                            >
                                {paused ? "▶ Resume" : "❚❚ Catch Breath"}
                            </button>
                        </section>

                        <section className={styles.panel}>
                            <header>Rooftop Radio</header>
                            <p className={styles.copy}>
                                "Smells like soup from up here. Do NOT check where it's coming from,
                                ChimneyBot." 🤖
                            </p>
                        </section>
                    </aside>
                </div>

                <div className={styles.statusBar}>
                    <span>SESSION: NIGHT RUN — STOVEPIPE ROW</span>
                    <span>
                        ROOF CLOCK {clock.toLocaleDateString()} · {clock.toLocaleTimeString()}
                    </span>
                </div>
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

const SKY_TOP = "#0a1030"
const SKY_BOTTOM = "#1a2247"
const MOON = "#fdf3c9"
const WALL_COLORS = ["#33405f", "#3c3357", "#2f4a55", "#45384f"]
const ROOF_COLOR = "#1c2338"
const BRICK = "#a2543c"
const BRICK_DARK = "#7c3f2d"
const WINDOW_LIT = "#ffd98a"
const WINDOW_DARK = "#131a30"
const ROBOT = "#8df2b6"

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
                propsRef.current.onHud({ houses: engine.housesCleared, speed: engine.speed })
                for (const event of events) {
                    if (event.kind === "cooked" || event.kind === "fell" || event.kind === "bonked") {
                        propsRef.current.onEnding(event.kind, event.value)
                    }
                }
            }
            draw(ctx, engine)
        }
        frameId = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frameId)
    }, [])

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
    const sky = ctx.createLinearGradient(0, 0, 0, FIELD_HEIGHT)
    sky.addColorStop(0, SKY_TOP)
    sky.addColorStop(1, SKY_BOTTOM)
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT)

    // Stars: fixed star field, slow parallax so pausing freezes it.
    ctx.fillStyle = "rgba(253, 243, 201, 0.7)"
    for (let index = 0; index < 40; index += 1) {
        const x = (index * 173 + 61 - camera * 0.08) % FIELD_WIDTH
        const starX = x < 0 ? x + FIELD_WIDTH : x
        const starY = (index * 97 + 23) % 170
        ctx.fillRect(starX, starY, index % 5 === 0 ? 2 : 1, index % 5 === 0 ? 2 : 1)
    }

    // Moon.
    ctx.beginPath()
    ctx.arc(FIELD_WIDTH - 92, 66, 26, 0, Math.PI * 2)
    ctx.fillStyle = MOON
    ctx.shadowColor = MOON
    ctx.shadowBlur = 24
    ctx.fill()
    ctx.shadowBlur = 0

    // Distant skyline, half-speed parallax.
    ctx.fillStyle = "rgba(16, 22, 46, 0.9)"
    for (let index = 0; index < 12; index += 1) {
        const width = 90 + (index % 4) * 34
        const height = 70 + (index % 5) * 26
        const x = (index * 160 - camera * 0.4) % (FIELD_WIDTH + 240)
        const towerX = x < -width ? x + FIELD_WIDTH + 240 : x
        ctx.fillRect(towerX - 120, FIELD_HEIGHT - height - 60, width, height + 60)
    }

    // Street glow at the bottom of the canyon.
    const glow = ctx.createLinearGradient(0, FIELD_HEIGHT - 70, 0, FIELD_HEIGHT)
    glow.addColorStop(0, "rgba(255, 190, 85, 0)")
    glow.addColorStop(1, "rgba(255, 190, 85, 0.22)")
    ctx.fillStyle = glow
    ctx.fillRect(0, FIELD_HEIGHT - 70, FIELD_WIDTH, 70)

    // Houses.
    for (const house of engine.houses) {
        const screenX = house.x - camera
        if (screenX > FIELD_WIDTH || screenX + house.width < 0) {
            continue
        }
        drawHouse(ctx, screenX, house.roofY, house.width, house.index, house.chimneyOffset, camera)
    }

    // The runner robot.
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
        ctx.fillStyle = "#0a0d18"
        ctx.fillRect(chimneyX + CHIMNEY_LIP, chimneyTop + 2, CHIMNEY_WIDTH - CHIMNEY_LIP * 2, 6)

        // Smoke drifts on world position so it freezes when paused.
        const drift = (chimneyX + camera) * 0.7
        ctx.fillStyle = "rgba(223, 228, 255, 0.28)"
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
    ctx.shadowColor = ROBOT
    ctx.shadowBlur = 10

    // Body.
    ctx.fillStyle = ROBOT
    ctx.fillRect(x, y + 8, PLAYER_WIDTH, PLAYER_HEIGHT - 14)
    // Head.
    ctx.fillRect(x + 3, y, PLAYER_WIDTH - 6, 10)
    ctx.shadowBlur = 0
    // Eye, looking ahead.
    ctx.fillStyle = "#08130f"
    ctx.fillRect(x + PLAYER_WIDTH - 10, y + 3, 5, 4)
    // Legs: mid-air tuck vs alternating stride from world distance.
    ctx.fillStyle = ROBOT
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
