import React, { useEffect, useRef, useState } from "react"
import { sounds } from "./audio"
import * as styles from "./CabinPage.styles.css"
import {
    CABIN_ROWS,
    CabinDifficulty,
    FlightPhase,
    GALLEY_ITEMS,
    ItemKind,
    Passenger,
    SEATS_PER_ROW,
    SoundCue,
    TUNING,
    altitudeFt,
    beginBoarding,
    cabinHappiness,
    createFlight,
    flightProgress,
    grabRunner,
    itemEmoji,
    seatLabel,
    serveItem,
    startChat,
    stopChatting,
    tickFlight,
} from "./flight"

const DIFFICULTIES: CabinDifficulty[] = ["trainee", "crew", "captain"]
const BEST_RATING_KEY = "cabin.bestRating"
const WINDOW_COUNT = 8

const PHASE_LABELS: Record<FlightPhase, string> = {
    idle: "AT GATE.",
    boarding: "BOARDING.",
    cruise: "CRUISING.",
    landed: "LANDED.",
}

function loadBestRating(): number {
    const raw = window.localStorage.getItem(BEST_RATING_KEY)
    const value = raw === null ? 0 : Number(raw)
    return Number.isFinite(value) ? value : 0
}

function barColor(fraction: number): string {
    if (fraction >= 0.6) {
        return styles.dynamicColors.good
    }
    return fraction >= 0.3 ? styles.dynamicColors.warn : styles.dynamicColors.bad
}

function starString(stars: number): string {
    return "★".repeat(stars) + "☆".repeat(5 - stars)
}

/** Home surface for the `cabin` pack: flight-attendant time management — serve the cabin, land with 5 stars. */
export default function CabinPage(): React.ReactElement {
    const [difficulty, setDifficulty] = useState<CabinDifficulty>("crew")
    const [soundOn, setSoundOn] = useState(true)
    const [heldItem, setHeldItem] = useState<ItemKind | null>(null)
    const [bestRating, setBestRating] = useState(loadBestRating)
    const [flightToken, setFlightToken] = useState(0)
    const [, setFrame] = useState(0)
    const flightRef = useRef(createFlight("crew"))
    const mousePosRef = useRef({ x: -100, y: -100 })
    const soundOnRef = useRef(soundOn)
    soundOnRef.current = soundOn
    const bestRatingRef = useRef(bestRating)
    bestRatingRef.current = bestRating

    const playCues = (cues: SoundCue[]): void => {
        if (soundOnRef.current) {
            cues.forEach((cue) => sounds[cue]())
        }
    }

    const startFlight = (): void => {
        flightRef.current = createFlight(difficulty)
        beginBoarding(flightRef.current)
        setHeldItem(null)
        setFlightToken((token) => token + 1)
    }

    // Simulation loop: one requestAnimationFrame loop per flight, stopping itself on landing.
    useEffect(() => {
        if (flightToken === 0) {
            return
        }
        let frameId = 0
        let lastTime = performance.now()
        const tick = (now: number): void => {
            const dtMs = Math.min(100, now - lastTime)
            lastTime = now
            const flight = flightRef.current
            const cues = tickFlight(flight, dtMs)
            if (soundOnRef.current) {
                cues.forEach((cue) => sounds[cue]())
            }
            if (flight.phase === "landed" && flight.stars > bestRatingRef.current) {
                window.localStorage.setItem(BEST_RATING_KEY, String(flight.stars))
                setBestRating(flight.stars)
            }
            setFrame((frame) => frame + 1)
            if (flight.phase !== "landed") {
                frameId = requestAnimationFrame(tick)
            }
        }
        frameId = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frameId)
    }, [flightToken])

    // Grandma's chat is click-and-hold; releasing the mouse anywhere ends it.
    useEffect(() => {
        const releaseChat = (): void => stopChatting(flightRef.current)
        window.addEventListener("mouseup", releaseChat)
        return () => window.removeEventListener("mouseup", releaseChat)
    }, [])

    const flight = flightRef.current
    const flightActive = flight.phase === "boarding" || flight.phase === "cruise"
    const happiness = cabinHappiness(flight)
    const progress = flightProgress(flight)
    const runner = flight.passengers.find((passenger) => passenger.running)

    const handleSeatMouseDown = (passenger: Passenger): void => {
        if (flight.phase !== "cruise") {
            return
        }
        if (heldItem) {
            const result = serveItem(flight, passenger.id, heldItem)
            playCues(result.cues)
            if (result.correct) {
                setHeldItem(null)
            }
        } else if (passenger.role === "grandma" && passenger.needsChat) {
            startChat(flight, passenger.id)
        }
    }

    // The cruise loop re-renders every frame, so the held-item indicator just reads this ref.
    const handleSceneMouseMove = (event: React.MouseEvent<HTMLElement>): void => {
        const rect = event.currentTarget.getBoundingClientRect()
        mousePosRef.current = {
            x: event.clientX - rect.left + 14,
            y: event.clientY - rect.top + 8,
        }
    }

    const renderSeat = (row: number, seat: number): React.ReactElement => {
        const passenger = flight.passengers[row * SEATS_PER_ROW + seat]
        const away = !passenger.boarded || passenger.running
        if (away) {
            return (
                <div key={passenger.id} className={styles.seatEmpty} title={seatLabel(row, seat)}>
                    <span className={styles.passengerFace}>💺</span>
                </div>
            )
        }
        const face = passenger.mood === "happy" ? "😄" : passenger.mood === "upset" ? "😠" : passenger.face
        const chatDeg = Math.min(360, (passenger.chatMs / TUNING.grandma.chatMs) * 360)
        return (
            <div
                key={passenger.id}
                className={styles.seat}
                title={seatLabel(row, seat)}
                onMouseDown={() => handleSeatMouseDown(passenger)}
            >
                {passenger.request && (
                    <span className={styles.bubble}>
                        <span className={styles.bubbleEmoji}>{itemEmoji(passenger.request.item)}</span>
                        <span className={styles.patienceTrack}>
                            <span
                                className={styles.patienceFill}
                                style={{
                                    width: `${(passenger.request.remainingMs / passenger.request.totalMs) * 100}%`,
                                    background: barColor(
                                        passenger.request.remainingMs / passenger.request.totalMs,
                                    ),
                                }}
                            />
                        </span>
                    </span>
                )}
                {passenger.role === "celebrity" && <span className={styles.roleBadge}>⭐</span>}
                {passenger.role === "grandma" && passenger.needsChat && (
                    <span
                        className={styles.chatRing}
                        style={{
                            background: `conic-gradient(${styles.dynamicColors.brand} ${chatDeg}deg, ${styles.dynamicColors.fuselage} 0deg)`,
                        }}
                    >
                        💬
                    </span>
                )}
                <span className={styles.passengerFace}>{face}</span>
                <span className={styles.happinessTrack}>
                    <span
                        className={styles.happinessFill}
                        style={{
                            width: `${passenger.happiness}%`,
                            background: barColor(passenger.happiness / 100),
                        }}
                    />
                </span>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            <div className={styles.console}>
                <div className={styles.titleBar}>
                    <span>🤖 CabinBot</span>
                    <span className={styles.titleControls}>
                        <span className={styles.titleBtn}>_</span>
                        <span className={styles.titleBtn}>□</span>
                        <span className={styles.titleBtn}>✕</span>
                    </span>
                </div>

                <div className={styles.toolbar}>
                    <button className={styles.chunky} onClick={startFlight}>
                        🛫 Start Flight
                    </button>
                    {DIFFICULTIES.map((level) => (
                        <button
                            key={level}
                            className={difficulty === level ? styles.chunkyLit : styles.chunky}
                            onClick={() => setDifficulty(level)}
                            disabled={flightActive}
                        >
                            <span className={styles.capitalize}>{level}</span>
                        </button>
                    ))}
                    <button
                        className={soundOn ? styles.chunkyLit : styles.chunky}
                        onClick={() => setSoundOn((value) => !value)}
                    >
                        {soundOn ? "🔊 Sound" : "🔇 Sound"}
                    </button>
                    <span className={styles.toolbarSpacer} />
                    <span className={styles.bestBadge}>
                        BEST {bestRating > 0 ? starString(bestRating) : "— NO FLIGHTS YET"}
                    </span>
                </div>

                <div className={styles.progressRow}>
                    <span>🛫</span>
                    <span className={styles.progressTrack}>
                        <span className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
                        <span className={styles.progressPlane} style={{ left: `${progress * 100}%` }}>
                            ✈️
                        </span>
                    </span>
                    <span>🛬</span>
                </div>

                <main className={styles.sceneWrap} onMouseMove={handleSceneMouseMove}>
                    <div className={styles.windowsRow}>
                        {Array.from({ length: WINDOW_COUNT }, (_, index) => (
                            <span key={index} className={styles.windowPane}>
                                <span className={styles.cloud} style={{ animationDelay: `${index * -1.1}s` }}>
                                    ☁️
                                </span>
                                <span
                                    className={styles.cloud}
                                    style={{ animationDelay: `${index * -1.7 - 3.5}s`, top: 15 }}
                                >
                                    ☁️
                                </span>
                            </span>
                        ))}
                    </div>

                    <div className={styles.cabin}>
                        {Array.from({ length: CABIN_ROWS }, (_, row) => (
                            <div key={row} className={styles.cabinRow}>
                                {renderSeat(row, 0)}
                                {renderSeat(row, 1)}
                                <span className={styles.aisle}>{row + 1}</span>
                                {renderSeat(row, 2)}
                                {renderSeat(row, 3)}
                            </div>
                        ))}
                        {runner && (
                            <button
                                key={runner.grabCount}
                                className={styles.runner}
                                style={{ top: `${6 + runner.aislePos * 82}%` }}
                                onMouseDown={() => playCues(grabRunner(flight, runner.id))}
                            >
                                🏃
                            </button>
                        )}
                    </div>

                    {flight.announcement && (
                        <div className={styles.intercomBanner}>{flight.announcement}</div>
                    )}
                    {flight.paparazziMs > 0 && (
                        <div
                            className={styles.paparazziFlash}
                            style={{ opacity: flight.paparazziMs / TUNING.celebrity.flashMs }}
                        />
                    )}
                    {flight.cookieGlowMs > 0 && (
                        <div
                            className={styles.cookieGlow}
                            style={{ opacity: flight.cookieGlowMs / TUNING.grandma.glowMs }}
                        />
                    )}

                    {flight.phase === "idle" && (
                        <div className={styles.overlay}>
                            <div className={styles.overlayCard}>
                                <div className={styles.overlayTitle}>✈️ Welcome aboard!</div>
                                <p className={styles.muted}>
                                    Passengers pop requests over their seats. Grab the right item from the
                                    galley tray, click the seat to serve it, and keep the whole cabin smiling
                                    until touchdown.
                                </p>
                                <button className={styles.chunky} onClick={startFlight}>
                                    🛫 Start Flight
                                </button>
                            </div>
                        </div>
                    )}

                    {flight.phase === "landed" && (
                        <div className={styles.overlay}>
                            <div className={styles.overlayCard}>
                                <div className={styles.overlayTitle}>🛬 Landed!</div>
                                <div className={styles.stars}>{starString(flight.stars)}</div>
                                <dl className={styles.overlayStats}>
                                    <div>
                                        <dt>SERVED</dt>
                                        <dd>{flight.served}</dd>
                                    </div>
                                    <div>
                                        <dt>MISSED</dt>
                                        <dd>{flight.missed}</dd>
                                    </div>
                                    <div>
                                        <dt>CABIN</dt>
                                        <dd>{happiness}%</dd>
                                    </div>
                                </dl>
                                {flight.stars >= bestRating && flight.stars > 0 && (
                                    <p className={styles.muted}>🏅 Best rating so far!</p>
                                )}
                                <button className={styles.chunky} onClick={startFlight}>
                                    ⟳ Fly Again
                                </button>
                            </div>
                        </div>
                    )}

                    {heldItem && flight.phase === "cruise" && (
                        <div
                            className={styles.heldCursor}
                            style={{
                                transform: `translate(${mousePosRef.current.x}px, ${mousePosRef.current.y}px)`,
                            }}
                        >
                            {itemEmoji(heldItem)}
                        </div>
                    )}
                </main>

                <div className={styles.galley}>
                    <span className={styles.galleyLabel}>GALLEY</span>
                    {GALLEY_ITEMS.map((item) => (
                        <button
                            key={item.kind}
                            className={heldItem === item.kind ? styles.trayItemHeld : styles.trayItem}
                            onClick={() => setHeldItem((held) => (held === item.kind ? null : item.kind))}
                            disabled={flight.phase !== "cruise"}
                        >
                            <span className={styles.trayEmoji}>{item.emoji}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                    <span className={styles.toolbarSpacer} />
                    <span className={styles.happinessMeter}>
                        <span>{happiness >= 60 ? "😊" : happiness >= 30 ? "😐" : "😡"}</span>
                        <span className={styles.meterTrack}>
                            <span
                                className={styles.meterFill}
                                style={{ width: `${happiness}%`, background: barColor(happiness / 100) }}
                            />
                        </span>
                        <span>{happiness}%</span>
                    </span>
                </div>

                <div className={styles.statusBar}>
                    <span>● {PHASE_LABELS[flight.phase]}</span>
                    <span>ALT {altitudeFt(flight).toLocaleString("en-US")} FT</span>
                    <span>
                        SERVED {flight.served} · MISSED {flight.missed}
                    </span>
                </div>
            </div>
        </div>
    )
}
