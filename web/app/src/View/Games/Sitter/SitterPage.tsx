import React, { useEffect, useRef, useState } from "react"
import { sounds } from "./audio"
import {
    ActiveMishap,
    BEST_PAY_KEY,
    DIFFICULTIES,
    FIRST_SPAWN_MS,
    Kid,
    KID_PANIC_MS,
    MAX_ACTIVE_MISHAPS,
    MISHAP_TIMER_MS,
    OVERFLOW_AT_REMAINING_MS,
    OVERFLOW_CLICKS,
    OVERFLOW_WINDOW_MS,
    ROOMS,
    RoomKey,
    SHIFT_LENGTH_MS,
    ShiftResult,
    SitterDifficulty,
    TOOLS,
    ToolKey,
    kidMoveDelayMs,
    pickMishapKind,
    pickRoom,
    randomSpot,
    scoreShift,
    spawnIntervalMs,
} from "./mishaps"
import * as styles from "./SitterPage.styles.css"

const TICK_MS = 100
const DIFFICULTY_KEYS: SitterDifficulty[] = ["chill", "normal", "chaos"]
const KID_EMOJI = ["🧒", "👧"]

type Phase = "idle" | "playing" | "rating"
type PlayFn = (sound: () => void) => void

interface OverflowState {
    stage: "waiting" | "active" | "shutOff" | "flooded"
    clicks: number
    startedAt: number
}

/** The whole live shift, mutated in place by the tick loop and click handlers. */
interface ShiftState {
    elapsedMs: number
    nextSpawnAt: number
    nextId: number
    mishaps: ActiveMishap[]
    kids: Kid[]
    fixes: number
    kidCare: number
    overflow: OverflowState
    holding: { id: number; heldMs: number } | null
    status: string
}

/** Home surface for the `sitter` pack: babysitting chaos — keep the kids happy and the house tidy before the parents get home. */
export default function SitterPage(): React.ReactElement {
    const [phase, setPhase] = useState<Phase>("idle")
    const [difficulty, setDifficulty] = useState<SitterDifficulty>("normal")
    const [soundOn, setSoundOn] = useState(true)
    const [selectedTool, setSelectedTool] = useState<ToolKey | null>(null)
    const [shiftNumber, setShiftNumber] = useState(1)
    const [result, setResult] = useState<ShiftResult | null>(null)
    const [bestPay, setBestPay] = useState(() => Number(window.localStorage.getItem(BEST_PAY_KEY) ?? 0))
    const [, setRenderTick] = useState(0)

    const shiftRef = useRef<ShiftState | null>(null)
    // Mirrors reactive values so the interval closure always sees the latest.
    const stateRef = useRef({ difficulty, shiftNumber, soundOn, bestPay })
    stateRef.current = { difficulty, shiftNumber, soundOn, bestPay }

    const play: PlayFn = (sound) => {
        if (stateRef.current.soundOn) {
            sound()
        }
    }

    // Game clock: advances the shift 10 times a second while playing.
    useEffect(() => {
        if (phase !== "playing") {
            return
        }
        const finishShift = (shift: ShiftState): void => {
            const leftoverMesses = shift.mishaps.filter((mishap) => mishap.isMess).length
            const shiftResult = scoreShift({
                fixes: shift.fixes,
                kidCare: shift.kidCare,
                leftoverMishaps: shift.mishaps.length - leftoverMesses,
                leftoverMesses,
                flooded: shift.overflow.stage === "flooded",
            })
            setResult(shiftResult)
            setPhase("rating")
            if (stateRef.current.soundOn) {
                sounds.chime()
            }
            if (shiftResult.pay > stateRef.current.bestPay) {
                setBestPay(shiftResult.pay)
                window.localStorage.setItem(BEST_PAY_KEY, String(shiftResult.pay))
            }
        }
        const id = window.setInterval(() => {
            const shift = shiftRef.current
            if (!shift) {
                return
            }
            const playInTick: PlayFn = (sound) => {
                if (stateRef.current.soundOn) {
                    sound()
                }
            }
            const over = tickShift(
                shift,
                stateRef.current.difficulty,
                stateRef.current.shiftNumber,
                playInTick,
            )
            if (over) {
                finishShift(shift)
            }
            setRenderTick((tick) => tick + 1)
        }, TICK_MS)
        return () => window.clearInterval(id)
    }, [phase])

    // Releasing the pointer anywhere cancels an in-progress hug.
    useEffect(() => {
        if (phase !== "playing") {
            return
        }
        const cancelHold = (): void => {
            const shift = shiftRef.current
            if (shift?.holding) {
                shift.holding = null
                setRenderTick((tick) => tick + 1)
            }
        }
        window.addEventListener("pointerup", cancelHold)
        return () => window.removeEventListener("pointerup", cancelHold)
    }, [phase])

    const startShift = (): void => {
        shiftRef.current = makeShift()
        setSelectedTool(null)
        setResult(null)
        setPhase("playing")
        play(sounds.doorbell)
    }

    const babysitAgain = (): void => {
        setShiftNumber((count) => count + 1)
        startShift()
    }

    const handleMishapPointerDown = (mishap: ActiveMishap): void => {
        const shift = shiftRef.current
        if (!shift || phase !== "playing") {
            return
        }
        const tool = TOOLS.find((candidate) => candidate.key === selectedTool)
        if (!tool) {
            shift.status = "PICK A TOOL FROM THE TRAY FIRST!"
            play(sounds.buzz)
        } else if (tool.key !== mishap.kind.tool) {
            shift.status = `${tool.emoji} WON'T FIX THAT! THE KIDS GIGGLE AT YOU.`
            play(sounds.buzz)
            window.setTimeout(() => play(sounds.giggle), 180)
        } else if (mishap.kind.holdMs > 0) {
            shift.holding = { id: mishap.id, heldMs: 0 }
            shift.status = `HOLD THE ${tool.label.toUpperCase()}...`
        } else {
            mishap.clicksDone += 1
            if (mishap.clicksDone >= mishap.kind.clicksToFix) {
                fixMishap(shift, mishap, play)
            } else {
                shift.status = `${mishap.kind.emoji} ${mishap.kind.clicksToFix - mishap.clicksDone} MORE TO TIDY...`
                play(sounds.plink)
            }
        }
        setRenderTick((tick) => tick + 1)
    }

    const handleOverflowClick = (): void => {
        const shift = shiftRef.current
        if (!shift || phase !== "playing" || shift.overflow.stage !== "active") {
            return
        }
        shift.overflow.clicks += 1
        if (shift.overflow.clicks >= OVERFLOW_CLICKS) {
            shift.overflow = { ...shift.overflow, stage: "shutOff" }
            shift.fixes += 1
            shift.status = "TUB SHUT OFF! CRISIS AVERTED."
            play(sounds.plink)
        } else {
            shift.status = `SHUT OFF THE TAP! ${OVERFLOW_CLICKS - shift.overflow.clicks} MORE!`
            play(sounds.plink)
        }
        setRenderTick((tick) => tick + 1)
    }

    const shift = shiftRef.current
    const remainingMs =
        phase === "playing" && shift
            ? Math.max(0, SHIFT_LENGTH_MS - shift.elapsedMs)
            : phase === "rating"
              ? 0
              : SHIFT_LENGTH_MS
    const status =
        phase === "playing" && shift
            ? shift.status
            : phase === "rating"
              ? "SHIFT OVER. THE PARENTS ARE HOME."
              : "READY. PICK A DIFFICULTY AND RING THE BELL."
    const bathFlooded = shift?.overflow.stage === "flooded"

    const renderMishap = (mishap: ActiveMishap): React.ReactElement => {
        const hold = shift?.holding && shift.holding.id === mishap.id ? shift.holding : null
        const age = shift ? shift.elapsedMs - mishap.spawnedAt : 0
        const severity = Math.min(1, age / MISHAP_TIMER_MS)
        // Severity/hold rings are conic-gradients — truly dynamic, so inline.
        const ring = hold
            ? `conic-gradient(#2f8f83 ${(hold.heldMs / mishap.kind.holdMs) * 360}deg, rgba(74, 56, 38, 0.18) 0deg)`
            : `conic-gradient(hsl(${45 - severity * 40} 85% 52%) ${severity * 360}deg, rgba(74, 56, 38, 0.18) 0deg)`
        const clicksLeft = mishap.kind.clicksToFix - mishap.clicksDone
        return (
            <button
                key={mishap.id}
                className={mishap.isMess ? styles.mishapMess : styles.mishap}
                style={{
                    left: `${mishap.x}%`,
                    top: `${mishap.y}%`,
                    ...(mishap.isMess ? {} : { background: ring }),
                }}
                onPointerDown={() => handleMishapPointerDown(mishap)}
                title={`${mishap.kind.label} — needs ${mishap.kind.tool.toUpperCase()}`}
            >
                <span className={styles.mishapInner}>
                    {mishap.kind.emoji}
                    {mishap.kind.clicksToFix > 1 && (
                        <span className={styles.mishapPips}>{"●".repeat(clicksLeft)}</span>
                    )}
                </span>
            </button>
        )
    }

    return (
        <div className={styles.page}>
            <div className={styles.console}>
                <div className={styles.titleBar}>
                    <span>🤖 SitterBot</span>
                    <span className={styles.titleControls}>
                        <span className={styles.titleBtn}>_</span>
                        <span className={styles.titleBtn}>□</span>
                        <span className={styles.titleBtn}>✕</span>
                    </span>
                </div>

                <div className={styles.toolbar}>
                    <button className={styles.chunky} onClick={startShift} disabled={phase === "playing"}>
                        🔔 Start Shift
                    </button>
                    {DIFFICULTY_KEYS.map((level) => (
                        <button
                            key={level}
                            className={difficulty === level ? styles.chunkyLit : styles.chunky}
                            onClick={() => setDifficulty(level)}
                            disabled={phase === "playing"}
                        >
                            {DIFFICULTIES[level].label}
                        </button>
                    ))}
                    <button
                        className={soundOn ? styles.chunkyLit : styles.chunky}
                        onClick={() => setSoundOn((value) => !value)}
                    >
                        {soundOn ? "🔊 Sound" : "🔇 Sound"}
                    </button>
                    <span className={styles.toolbarSpacer} />
                    <span className={styles.payBadge}>💰 BEST PAY ${bestPay}</span>
                </div>

                <div className={styles.houseWrap}>
                    {shift?.overflow.stage === "active" && (
                        <div className={styles.uhOhBanner}>UH OH! THE TUB IS OVERFLOWING — CLICK IT ×5!</div>
                    )}

                    <div className={styles.houseGrid}>
                        {ROOMS.map((room) => (
                            <div
                                key={room.key}
                                className={
                                    bathFlooded && room.key === "bathroom" ? styles.roomFlooded : styles.room
                                }
                            >
                                <header className={styles.roomLabel}>
                                    {room.emoji} {room.name}
                                </header>
                                {room.furniture.map((item, index) => (
                                    <span
                                        key={index}
                                        className={styles.furniture}
                                        style={{ left: `${item.x}%`, top: `${item.y}%` }}
                                    >
                                        {item.emoji}
                                    </span>
                                ))}
                                {bathFlooded && room.key === "bathroom" && (
                                    <span className={styles.floodMark}>💦</span>
                                )}
                                {shift?.kids
                                    .filter((kid) => kid.room === room.key)
                                    .map((kid) => (
                                        <div
                                            key={kid.id}
                                            className={styles.kid}
                                            style={{ left: `${kid.x}%`, top: `${kid.y}%` }}
                                        >
                                            <span key={kid.hopToken} className={styles.kidHop}>
                                                {kid.emoji}
                                            </span>
                                        </div>
                                    ))}
                                {shift?.mishaps
                                    .filter((mishap) => mishap.room === room.key)
                                    .map(renderMishap)}
                                {room.key === "bathroom" && shift?.overflow.stage === "active" && (
                                    <button
                                        className={styles.overflowBadge}
                                        onPointerDown={handleOverflowClick}
                                    >
                                        🛁💦
                                        <span className={styles.overflowCount}>
                                            {OVERFLOW_CLICKS - shift.overflow.clicks} CLICKS!
                                        </span>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {phase === "idle" && (
                        <div className={styles.overlay}>
                            <div className={styles.overlayCard}>
                                <div className={styles.parentsRow}>🧒 🤖 👧</div>
                                <h2 className={styles.overlayTitle}>BABYSITTING NIGHT</h2>
                                <p className={styles.overlayText}>
                                    The parents are out for two hours (okay, two minutes). Pick the right tool
                                    from the tray, then click each mishap before it hardens into a MESS. Hug
                                    the criers, feed the hungry, and whatever you do — watch that bathtub.
                                </p>
                                <button className={styles.chunky} onClick={startShift}>
                                    🔔 Start Shift
                                </button>
                            </div>
                        </div>
                    )}

                    {phase === "rating" && result && (
                        <div className={styles.overlay}>
                            <div className={styles.overlayCard}>
                                <div className={styles.parentsRow}>🚗 🔑 🚪</div>
                                <h2 className={styles.overlayTitle}>THE PARENTS ARE HOME!</h2>
                                <div className={styles.stars}>
                                    {"★".repeat(result.stars) + "☆".repeat(5 - result.stars)}
                                </div>
                                <div className={styles.ratingStats}>
                                    <span>🧹 Tidiness {result.tidiness}%</span>
                                    <span>😊 Happiness {result.happiness}%</span>
                                </div>
                                <div className={styles.paycheck}>PAYCHECK: ${result.pay}</div>
                                {result.pay >= bestPay && result.pay > 0 && (
                                    <p className={styles.overlayText}>New best paycheck! 🎉</p>
                                )}
                                <button className={styles.chunky} onClick={babysitAgain}>
                                    🔔 Babysit again
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.toolTray}>
                    {TOOLS.map((tool) => (
                        <button
                            key={tool.key}
                            className={selectedTool === tool.key ? styles.toolBtnActive : styles.toolBtn}
                            onClick={() => setSelectedTool(tool.key)}
                        >
                            <span className={styles.toolEmoji}>{tool.emoji}</span>
                            <span>{tool.label.toUpperCase()}</span>
                        </button>
                    ))}
                </div>

                <div className={styles.statusBar}>
                    <span>
                        ● SHIFT {shiftNumber} · {DIFFICULTIES[difficulty].label.toUpperCase()}
                    </span>
                    <span className={styles.statusMiddle}>{status}</span>
                    <span
                        className={
                            phase === "playing" && remainingMs <= 15_000
                                ? styles.countdownUrgent
                                : styles.countdown
                        }
                    >
                        PARENTS HOME IN {formatClock(remainingMs)}
                    </span>
                </div>
            </div>
        </div>
    )
}

function makeShift(): ShiftState {
    return {
        elapsedMs: 0,
        nextSpawnAt: FIRST_SPAWN_MS,
        nextId: 1,
        mishaps: [],
        kids: makeKids(),
        fixes: 0,
        kidCare: 0,
        overflow: { stage: "waiting", clicks: 0, startedAt: 0 },
        holding: null,
        status: "SHIFT STARTED. KEEP AN EYE ON THE KIDS!",
    }
}

function makeKids(): Kid[] {
    return KID_EMOJI.map((emoji, index) => ({
        id: index,
        emoji,
        room: pickRoom(),
        ...randomSpot(),
        hopToken: 0,
        nextMoveAt: 1500 + Math.random() * 2500,
    }))
}

function moveKid(kid: Kid, elapsedMs: number): void {
    const otherRooms = ROOMS.filter((room) => room.key !== kid.room)
    kid.room = otherRooms[Math.floor(Math.random() * otherRooms.length)].key
    const spot = randomSpot()
    kid.x = spot.x
    kid.y = spot.y
    kid.hopToken += 1
    kid.nextMoveAt = elapsedMs + kidMoveDelayMs()
}

function spawnMishap(shift: ShiftState, difficulty: SitterDifficulty, shiftNumber: number): void {
    const kind = pickMishapKind()
    const room = pickRoom()
    shift.mishaps.push({
        id: shift.nextId,
        kind,
        room,
        ...randomSpot(),
        spawnedAt: shift.elapsedMs,
        clicksDone: 0,
        isMess: false,
    })
    shift.nextId += 1
    shift.status = `${kind.emoji} ${kind.label.toUpperCase()} IN THE ${roomName(room).toUpperCase()}!`
    const jitter = 0.75 + Math.random() * 0.5
    shift.nextSpawnAt = shift.elapsedMs + spawnIntervalMs(shift.elapsedMs, difficulty, shiftNumber) * jitter
}

function fixMishap(shift: ShiftState, mishap: ActiveMishap, play: PlayFn): void {
    shift.mishaps = shift.mishaps.filter((candidate) => candidate.id !== mishap.id)
    shift.fixes += 1
    if (mishap.kind.kidCare) {
        shift.kidCare += 1
    }
    if (shift.holding?.id === mishap.id) {
        shift.holding = null
    }
    shift.status = `${mishap.kind.emoji} FIXED! NICE SAVE.`
    play(sounds.plink)
}

/** Advances the shift by one tick. Returns true when the parents arrive. */
function tickShift(
    shift: ShiftState,
    difficulty: SitterDifficulty,
    shiftNumber: number,
    play: PlayFn,
): boolean {
    shift.elapsedMs += TICK_MS
    const remainingMs = SHIFT_LENGTH_MS - shift.elapsedMs

    for (const kid of shift.kids) {
        if (shift.elapsedMs >= kid.nextMoveAt) {
            moveKid(kid, shift.elapsedMs)
        }
    }

    if (shift.elapsedMs >= shift.nextSpawnAt) {
        if (shift.mishaps.length < MAX_ACTIVE_MISHAPS) {
            spawnMishap(shift, difficulty, shiftNumber)
        } else {
            // House is full — try again shortly.
            shift.nextSpawnAt = shift.elapsedMs + 1000
        }
    }

    for (const mishap of shift.mishaps) {
        if (!mishap.isMess && shift.elapsedMs - mishap.spawnedAt >= MISHAP_TIMER_MS) {
            mishap.isMess = true
            shift.status = `${mishap.kind.emoji} TURNED INTO A MESS! THE KIDS ARE GOING WILD!`
            play(sounds.mess)
            // Messes rile the kids up: everyone scatters to a new room soon.
            for (const kid of shift.kids) {
                kid.nextMoveAt = Math.min(kid.nextMoveAt, shift.elapsedMs + Math.random() * KID_PANIC_MS)
            }
        }
    }

    const holding = shift.holding
    if (holding) {
        holding.heldMs += TICK_MS
        const mishap = shift.mishaps.find((candidate) => candidate.id === holding.id)
        if (!mishap) {
            shift.holding = null
        } else if (holding.heldMs >= mishap.kind.holdMs) {
            fixMishap(shift, mishap, play)
        }
    }

    if (shift.overflow.stage === "waiting" && remainingMs <= OVERFLOW_AT_REMAINING_MS) {
        shift.overflow = { stage: "active", clicks: 0, startedAt: shift.elapsedMs }
        shift.status = "UH OH! THE BATHTUB IS OVERFLOWING!"
        play(sounds.alarm)
    } else if (
        shift.overflow.stage === "active" &&
        shift.elapsedMs - shift.overflow.startedAt >= OVERFLOW_WINDOW_MS
    ) {
        shift.overflow = { ...shift.overflow, stage: "flooded" }
        shift.status = "THE BATHROOM FLOODED! 💦"
        play(sounds.mess)
    }

    return remainingMs <= 0
}

function roomName(key: RoomKey): string {
    return ROOMS.find((room) => room.key === key)?.name ?? key
}

function formatClock(ms: number): string {
    const totalSeconds = Math.ceil(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${String(seconds).padStart(2, "0")}`
}
