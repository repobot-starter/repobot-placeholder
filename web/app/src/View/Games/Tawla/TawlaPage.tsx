import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
    BAR,
    BotLevel,
    findBotTurn,
    formatMove,
    GameResult,
    legalTurns,
    MATCH_TARGET,
    maxTurnLength,
    Move,
    nextMoves,
    OFF,
    opponent,
    pipCount,
    initialPosition,
    Player,
    Position,
    positionAfter,
    rollDie,
    rollOpening,
    Turn,
    winResult,
} from "./engine"
import * as styles from "./TawlaPage.styles.css"

const LEVELS: BotLevel[] = ["easy", "medium", "hard"]

// Pacing of the table choreography (ms).
const ROLL_ANIMATION_MS = 450
const BOT_ROLL_DELAY_MS = 700
const BOT_MOVE_STEP_MS = 550
const BLOCKED_PAUSE_MS = 1300
const COMMIT_PAUSE_MS = 650

/** localStorage key the lifetime match tally persists under. */
const STATS_KEY = "tawlabot-stats"

type TawlaMode = "1p" | "2p"

type Phase = "awaitRoll" | "rolling" | "moving" | "gameOver" | "matchOver"

interface Tally {
    white: number
    black: number
}

interface LogEntry {
    who: string
    text: string
}

/** Board columns from White's perspective: point numbers left to right. */
const TOP_LEFT_INDICES = [12, 13, 14, 15, 16, 17] // points 13-18
const TOP_RIGHT_INDICES = [18, 19, 20, 21, 22, 23] // points 19-24
const BOTTOM_LEFT_INDICES = [11, 10, 9, 8, 7, 6] // points 12-7
const BOTTOM_RIGHT_INDICES = [5, 4, 3, 2, 1, 0] // points 6-1

/** Which 3x3 cells hold a pip for each die face. */
const DIE_PIP_CELLS: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
}

const RESULT_LABEL: Record<GameResult["kind"], string> = {
    single: "GAME",
    gammon: "GAMMON! 2 POINTS",
    backgammon: "BACKGAMMON! 3 POINTS",
}

function loadTally(): Tally {
    try {
        const raw = window.localStorage.getItem(STATS_KEY)
        if (raw) {
            const saved = JSON.parse(raw) as Tally
            if (typeof saved.white === "number" && typeof saved.black === "number") {
                return saved
            }
        }
    } catch {
        // Corrupt storage falls through to a fresh tally.
    }
    return { white: 0, black: 0 }
}

/**
 * Home surface for the `tawla` pack: backgammon the café way — full western
 * rules against a three-level bot or a friend on the same table, played as a
 * match to five points with gammon and backgammon scoring.
 */
export default function TawlaPage(): React.ReactElement {
    const [mode, setMode] = useState<TawlaMode>("1p")
    const [level, setLevel] = useState<BotLevel>("medium")
    // Position at the start of the current turn; moves-in-progress live in `prefix`.
    const [position, setPosition] = useState<Position>(initialPosition)
    const [mover, setMover] = useState<Player | null>(null)
    const [dice, setDice] = useState<[number, number] | null>(null)
    const [turns, setTurns] = useState<Turn[]>([])
    const [prefix, setPrefix] = useState<Move[]>([])
    const [selected, setSelected] = useState<number | null>(null)
    const [phase, setPhase] = useState<Phase>("awaitRoll")
    const [result, setResult] = useState<GameResult | null>(null)
    const [score, setScore] = useState<Tally>({ white: 0, black: 0 })
    const [tally, setTally] = useState<Tally>(loadTally)
    const [log, setLog] = useState<LogEntry[]>([])

    const timersRef = useRef<number[]>([])
    const logScrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const timers = timersRef.current
        return () => timers.forEach((id) => window.clearTimeout(id))
    }, [])

    useEffect(() => {
        const node = logScrollRef.current
        if (node) {
            node.scrollTop = node.scrollHeight
        }
    }, [log.length])

    const schedule = useCallback((callback: () => void, delayMs: number): void => {
        timersRef.current.push(window.setTimeout(callback, delayMs))
    }, [])

    const appendLog = useCallback((who: string, text: string): void => {
        setLog((previous) => [...previous, { who, text }])
    }, [])

    const isBotSeat = useCallback(
        (player: Player | null): boolean => mode === "1p" && player === "black",
        [mode],
    )

    const seatName = useCallback(
        (player: Player): string =>
            mode === "1p" ? (player === "white" ? "You" : "Bot") : player === "white" ? "White" : "Black",
        [mode],
    )

    /** Ends the current turn: settles a win or hands the dice to the opponent. */
    const finishTurn = useCallback(
        (final: Position, moverNow: Player): void => {
            const gameResult = winResult(final)
            setPosition(final)
            setDice(null)
            setTurns([])
            setPrefix([])
            setSelected(null)
            if (gameResult === null) {
                setMover(opponent(moverNow))
                setPhase("awaitRoll")
                return
            }
            const nextScore: Tally = {
                ...score,
                [gameResult.winner]: score[gameResult.winner] + gameResult.points,
            }
            setScore(nextScore)
            setResult(gameResult)
            appendLog(
                seatName(gameResult.winner),
                `${RESULT_LABEL[gameResult.kind].toLowerCase()} — +${gameResult.points}`,
            )
            if (nextScore[gameResult.winner] >= MATCH_TARGET) {
                setPhase("matchOver")
                const nextTally: Tally = {
                    ...tally,
                    [gameResult.winner]: tally[gameResult.winner] + 1,
                }
                setTally(nextTally)
                window.localStorage.setItem(STATS_KEY, JSON.stringify(nextTally))
            } else {
                setPhase("gameOver")
            }
        },
        [appendLog, score, seatName, tally],
    )

    /** Rolls for `moverNow` (null = the opening roll-off) with a shake animation. */
    const rollNow = useCallback(
        (moverNow: Player | null): void => {
            let rolled: [number, number]
            let roller: Player
            if (moverNow === null) {
                const opening = rollOpening()
                roller = opening.starter
                rolled = [opening.whiteDie, opening.blackDie]
                appendLog(
                    "Table",
                    `opening roll ${opening.whiteDie}-${opening.blackDie}, ${seatName(roller)} start${roller === "white" && mode === "1p" ? "" : "s"}`,
                )
            } else {
                roller = moverNow
                rolled = [rollDie(), rollDie()]
            }
            setMover(roller)
            setDice(rolled)
            setPhase("rolling")
            schedule(() => {
                const legal = legalTurns(position, roller, rolled)
                if (legal.length === 0) {
                    appendLog(seatName(roller), `rolled ${rolled[0]}-${rolled[1]} — blocked, turn passes`)
                    setPhase("moving")
                    schedule(() => finishTurn(position, roller), BLOCKED_PAUSE_MS)
                    return
                }
                setTurns(legal)
                setPhase("moving")
            }, ROLL_ANIMATION_MS)
        },
        [appendLog, finishTurn, mode, position, schedule, seatName],
    )

    // Bot seat: roll automatically, then play the chosen turn checker by checker.
    useEffect(() => {
        if (!isBotSeat(mover) || result !== null) {
            return
        }
        if (phase === "awaitRoll") {
            const timer = window.setTimeout(() => rollNow(mover), BOT_ROLL_DELAY_MS)
            return () => window.clearTimeout(timer)
        }
        if (phase !== "moving" || dice === null || turns.length === 0) {
            return
        }
        const turn = findBotTurn(position, "black", dice, level)
        if (turn === null) {
            return
        }
        appendLog(
            seatName("black"),
            `rolled ${dice[0]}-${dice[1]}: ${turn.moves.map((move) => formatMove("black", move)).join(" ")}`,
        )
        const timers = turn.moves.map((_, index) =>
            window.setTimeout(
                () => setPrefix(turn.moves.slice(0, index + 1)),
                (index + 1) * BOT_MOVE_STEP_MS,
            ),
        )
        timers.push(
            window.setTimeout(
                () => finishTurn(turn.result, "black"),
                turn.moves.length * BOT_MOVE_STEP_MS + COMMIT_PAUSE_MS,
            ),
        )
        return () => timers.forEach((id) => window.clearTimeout(id))
    }, [
        appendLog,
        dice,
        finishTurn,
        isBotSeat,
        level,
        mover,
        phase,
        position,
        result,
        rollNow,
        seatName,
        turns,
    ])

    // Position currently on the table: start-of-turn position plus the moves played so far.
    const shown = useMemo(
        () => (mover === null ? position : positionAfter(position, mover, prefix)),
        [mover, position, prefix],
    )

    const humanTurn = phase === "moving" && mover !== null && !isBotSeat(mover)
    const legalNext = useMemo(() => (humanTurn ? nextMoves(turns, prefix) : []), [humanTurn, turns, prefix])
    const sources = useMemo(() => {
        const froms: number[] = []
        for (const move of legalNext) {
            if (!froms.includes(move.from)) {
                froms.push(move.from)
            }
        }
        return froms
    }, [legalNext])
    const destinations = useMemo(
        () => (selected === null ? [] : legalNext.filter((move) => move.from === selected)),
        [legalNext, selected],
    )

    const playHumanMove = (move: Move): void => {
        if (mover === null) {
            return
        }
        const nextPrefix = [...prefix, move]
        setPrefix(nextPrefix)
        setSelected(null)
        if (nextPrefix.length === maxTurnLength(turns)) {
            appendLog(
                seatName(mover),
                `rolled ${dice?.[0]}-${dice?.[1]}: ${nextPrefix.map((played) => formatMove(mover, played)).join(" ")}`,
            )
            schedule(() => finishTurn(positionAfter(position, mover, nextPrefix), mover), COMMIT_PAUSE_MS)
        }
    }

    const handlePointClick = (index: number): void => {
        if (!humanTurn) {
            return
        }
        const candidate = destinations.find((move) => move.to === index)
        if (candidate) {
            playHumanMove(candidate)
            return
        }
        if (sources.includes(index)) {
            setSelected(index === selected ? null : index)
        } else {
            setSelected(null)
        }
    }

    const handleBarClick = (player: Player): void => {
        if (humanTurn && player === mover && sources.includes(BAR)) {
            setSelected(selected === BAR ? null : BAR)
        }
    }

    const handleOffClick = (player: Player): void => {
        if (!humanTurn || player !== mover) {
            return
        }
        const candidates = destinations.filter((move) => move.to === OFF)
        if (candidates.length === 0) {
            return
        }
        // Prefer the exact die so the higher one stays free for a longer move.
        candidates.sort((a, b) => a.die - b.die)
        playHumanMove(candidates[0])
    }

    const undoMove = (): void => {
        setPrefix((previous) => previous.slice(0, -1))
        setSelected(null)
    }

    const newGame = (fullMatch: boolean): void => {
        timersRef.current.forEach((id) => window.clearTimeout(id))
        timersRef.current = []
        setPosition(initialPosition())
        setMover(null)
        setDice(null)
        setTurns([])
        setPrefix([])
        setSelected(null)
        setResult(null)
        setPhase("awaitRoll")
        if (fullMatch) {
            setScore({ white: 0, black: 0 })
            setLog([])
        }
    }

    // Dice faces (four for doubles) with used-up markers derived from the prefix.
    const diceFaces = useMemo(() => {
        if (dice === null) {
            return []
        }
        const faces = dice[0] === dice[1] ? [dice[0], dice[0], dice[0], dice[0]] : [dice[0], dice[1]]
        const remaining = prefix.map((move) => move.die)
        return faces.map((value) => {
            const used = remaining.indexOf(value)
            if (used >= 0) {
                remaining.splice(used, 1)
                return { value, used: true }
            }
            return { value, used: false }
        })
    }, [dice, prefix])

    const whitePips = pipCount(shown, "white")
    const blackPips = pipCount(shown, "black")
    const botThinking = isBotSeat(mover) && (phase === "moving" || phase === "rolling")
    const canRoll = phase === "awaitRoll" && result === null && !isBotSeat(mover)
    const mustEnter = humanTurn && mover !== null && shown.bar[mover] > 0

    const statusText =
        phase === "matchOver" && result
            ? `${seatName(result.winner).toUpperCase()} WINS THE MATCH ${score[result.winner]}–${score[opponent(result.winner)]}`
            : phase === "gameOver" && result
              ? `${seatName(result.winner).toUpperCase()} — ${RESULT_LABEL[result.kind]}`
              : phase === "rolling"
                ? "ROLLING..."
                : phase === "moving"
                  ? isBotSeat(mover)
                      ? "BOT PLAYS..."
                      : mustEnter
                        ? "ENTER FROM THE BAR"
                        : "PLAY YOUR DICE"
                  : mover === null
                    ? "ROLL FOR THE START"
                    : `${seatName(mover).toUpperCase()} TO ROLL`

    const renderPoint = (index: number, isTop: boolean, column: number): React.ReactElement => {
        const signedCount = shown.points[index]
        const owner: Player | null = signedCount > 0 ? "white" : signedCount < 0 ? "black" : null
        const count = Math.abs(signedCount)
        const isDestination = destinations.some((move) => move.to === index)
        const clickable = humanTurn && (isDestination || sources.includes(index))
        const triangleClass = isTop
            ? index % 2 === 0
                ? styles.triangleDownDark
                : styles.triangleDownLight
            : index % 2 === 0
              ? styles.triangleUpLight
              : styles.triangleUpDark
        const visible = Math.min(count, 5)
        return (
            <button
                key={index}
                className={`${styles.point} ${clickable ? styles.pointClickable : ""}`}
                style={{ gridColumn: column + 1, gridRow: isTop ? 1 : 3 }}
                onClick={() => handlePointClick(index)}
                aria-label={`Point ${index + 1}`}
            >
                <span className={triangleClass} />
                {isDestination && <span className={styles.pointHighlight} />}
                {selected === index && <span className={styles.pointSelected} />}
                <span className={styles.stack} style={{ flexDirection: isTop ? "column" : "column-reverse" }}>
                    {Array.from({ length: visible }, (_, checkerIndex) => (
                        <span
                            key={checkerIndex}
                            className={owner === "white" ? styles.checkerLight : styles.checkerDark}
                        >
                            {checkerIndex === visible - 1 && count > 5 ? count : ""}
                        </span>
                    ))}
                </span>
                <span className={styles.pointNumberLabel} style={isTop ? { top: "1%" } : { bottom: "1%" }}>
                    {index + 1}
                </span>
            </button>
        )
    }

    const renderBarWell = (player: Player): React.ReactElement => {
        const count = shown.bar[player]
        const active = humanTurn && player === mover && sources.includes(BAR)
        return (
            <button
                className={active ? styles.barWellActive : styles.barWell}
                onClick={() => handleBarClick(player)}
                aria-label={`${player} bar`}
            >
                {Array.from({ length: Math.min(count, 4) }, (_, index) => (
                    <span
                        key={index}
                        className={`${styles.barChecker} ${player === "white" ? styles.checkerLight : styles.checkerDark}`}
                    >
                        {index === Math.min(count, 4) - 1 && count > 4 ? count : ""}
                    </span>
                ))}
            </button>
        )
    }

    const renderOffTray = (player: Player): React.ReactElement => {
        const active = humanTurn && player === mover && destinations.some((move) => move.to === OFF)
        return (
            <button
                className={active ? styles.offTrayActive : styles.offTray}
                onClick={() => handleOffClick(player)}
                aria-label={`${player} borne off`}
            >
                <span className={styles.offCount}>{shown.off[player]}</span>
                <span className={styles.offLabel}>{player === "white" ? "WHITE" : "BLACK"}</span>
                <span className={styles.offLabel}>OFF</span>
            </button>
        )
    }

    return (
        <div className={styles.page}>
            <div className={styles.console}>
                <div className={styles.titleBar}>
                    <span>☕ TawlaBot</span>
                    <span className={styles.titleTag}>the café classic — first to {MATCH_TARGET} points</span>
                </div>

                <div className={styles.toolbar}>
                    <button className={styles.chunky} onClick={() => newGame(true)}>
                        ⟳ New Match
                    </button>
                    <button
                        className={styles.chunky}
                        onClick={() => newGame(false)}
                        disabled={phase === "matchOver"}
                    >
                        ▸ Restart Game
                    </button>
                    <button
                        className={styles.chunky}
                        onClick={undoMove}
                        disabled={!humanTurn || prefix.length === 0 || prefix.length === maxTurnLength(turns)}
                    >
                        ↩ Undo Move
                    </button>
                    <span className={styles.toolbarSpacer} />
                    <span className={mode === "1p" ? styles.botBadgeOn : styles.botBadge}>
                        {botThinking ? "● BOT THINKING…" : mode === "1p" ? "● BOT ACTIVE" : "○ HOTSEAT"}
                    </span>
                </div>

                <div className={styles.layout}>
                    <aside className={styles.panelColumn}>
                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Game Mode</header>
                            <label className={styles.radioRow}>
                                <input type="radio" checked={mode === "1p"} onChange={() => setMode("1p")} />
                                Vs Bot ☕
                            </label>
                            <label className={styles.radioRow}>
                                <input type="radio" checked={mode === "2p"} onChange={() => setMode("2p")} />
                                Two Player 👥
                            </label>
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Bot Level</header>
                            {LEVELS.map((option) => (
                                <label key={option} className={styles.radioRow}>
                                    <input
                                        type="radio"
                                        checked={level === option}
                                        onChange={() => setLevel(option)}
                                        disabled={mode === "2p"}
                                    />
                                    <span className={styles.capitalize}>{option}</span>
                                </label>
                            ))}
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Match to {MATCH_TARGET}</header>
                            <div className={styles.statRow}>
                                <span>⚪ {seatName("white")}</span>
                                <span className={styles.statValue}>{score.white}</span>
                            </div>
                            <div className={styles.statRow}>
                                <span>⚫ {seatName("black")}</span>
                                <span className={styles.statValue}>{score.black}</span>
                            </div>
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Café Tally</header>
                            <div className={styles.statRow}>
                                <span>⚪ Matches</span>
                                <span className={styles.statValue}>{tally.white}</span>
                            </div>
                            <div className={styles.statRow}>
                                <span>⚫ Matches</span>
                                <span className={styles.statValue}>{tally.black}</span>
                            </div>
                        </section>

                        <section className={styles.panelBrand}>
                            <div className={styles.brandName}>TAWLABOT</div>
                            <div className={styles.brandTag}>Race the pips, hit the blots. ☕</div>
                        </section>
                    </aside>

                    <main className={styles.boardColumn}>
                        <div className={styles.boardArena}>
                            <div className={styles.boardWrap}>
                                <div className={styles.board}>
                                    <div className={styles.half}>
                                        {TOP_LEFT_INDICES.map((index, column) =>
                                            renderPoint(index, true, column),
                                        )}
                                        {BOTTOM_LEFT_INDICES.map((index, column) =>
                                            renderPoint(index, false, column),
                                        )}
                                    </div>
                                    <div className={styles.bar}>
                                        {renderBarWell("black")}
                                        {renderBarWell("white")}
                                    </div>
                                    <div className={styles.half}>
                                        {TOP_RIGHT_INDICES.map((index, column) =>
                                            renderPoint(index, true, column),
                                        )}
                                        {BOTTOM_RIGHT_INDICES.map((index, column) =>
                                            renderPoint(index, false, column),
                                        )}
                                    </div>
                                    <div className={styles.offColumn}>
                                        {renderOffTray("black")}
                                        {renderOffTray("white")}
                                    </div>
                                </div>
                                {(phase === "gameOver" || phase === "matchOver") && result && (
                                    <div className={styles.overlay}>
                                        <div className={styles.overlayTitle}>
                                            {phase === "matchOver"
                                                ? `${seatName(result.winner)} wins the match!`
                                                : `${seatName(result.winner)} wins — ${RESULT_LABEL[result.kind]}`}
                                        </div>
                                        <div className={styles.overlaySub}>
                                            {phase === "matchOver"
                                                ? `Final score ${score.white}–${score.black}. Another round of coffee?`
                                                : `Score ${score.white}–${score.black} · first to ${MATCH_TARGET}`}
                                        </div>
                                        <button
                                            className={styles.rollButton}
                                            onClick={() => newGame(phase === "matchOver")}
                                        >
                                            {phase === "matchOver" ? "☕ New Match" : "Next Game ▸"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.diceTray}>
                            {canRoll ? (
                                <button className={styles.rollButton} onClick={() => rollNow(mover)}>
                                    🎲 {mover === null ? "Roll for Start" : `Roll — ${seatName(mover)}`}
                                </button>
                            ) : (
                                diceFaces.map((face, index) => (
                                    <span
                                        key={index}
                                        className={
                                            phase === "rolling"
                                                ? styles.dieRolling
                                                : face.used
                                                  ? styles.dieUsed
                                                  : styles.die
                                        }
                                    >
                                        {Array.from({ length: 9 }, (_, cell) => (
                                            <span
                                                key={cell}
                                                className={
                                                    DIE_PIP_CELLS[face.value].includes(cell)
                                                        ? styles.pip
                                                        : styles.pipHidden
                                                }
                                            />
                                        ))}
                                    </span>
                                ))
                            )}
                        </div>
                        <div className={styles.controlsHint}>
                            Tap a checker, then a glowing point · White plays toward the lower right · Doubles
                            play four moves
                        </div>
                    </main>

                    <aside className={styles.panelColumn}>
                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Pip Count</header>
                            <div className={styles.statRow}>
                                <span>⚪ {seatName("white")}</span>
                                <span className={styles.statValue}>{whitePips}</span>
                            </div>
                            <div className={styles.statRow}>
                                <span>⚫ {seatName("black")}</span>
                                <span className={styles.statValue}>{blackPips}</span>
                            </div>
                            <div className={styles.muted}>
                                {whitePips === blackPips
                                    ? "Dead even race"
                                    : whitePips < blackPips
                                      ? `⚪ leads by ${blackPips - whitePips}`
                                      : `⚫ leads by ${whitePips - blackPips}`}
                            </div>
                        </section>

                        <section className={styles.panelGrow}>
                            <header className={styles.panelHeader}>Table Talk</header>
                            <div ref={logScrollRef} className={styles.logScroll}>
                                {log.length === 0 ? (
                                    <p className={styles.muted}>Roll for the start — highest die leads.</p>
                                ) : (
                                    log.map((entry, index) => (
                                        <div key={index} className={styles.logRow}>
                                            <span className={styles.logWho}>{entry.who}</span>
                                            <span>{entry.text}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>House Rules</header>
                            <div className={styles.muted}>Play both dice when you can</div>
                            <div className={styles.muted}>One die only? The higher plays</div>
                            <div className={styles.muted}>Blots hit go to the bar</div>
                            <div className={styles.muted}>Bear off with all 15 home</div>
                            <div className={styles.muted}>Gammon ×2 · Backgammon ×3</div>
                        </section>
                    </aside>
                </div>

                <div className={styles.statusBar}>
                    <span>● {botThinking ? "BREWING." : "READY."}</span>
                    <span>{statusText}</span>
                    <span>{mode === "1p" ? `VS BOT · ${level.toUpperCase()}` : "2P HOTSEAT"}</span>
                </div>
            </div>
        </div>
    )
}
