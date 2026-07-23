import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
    applyMove,
    applyRoll,
    Cell,
    chooseBotMove,
    createGame,
    GameState,
    HOME_PROGRESS,
    homeColumnCells,
    legalMoves,
    MoveOption,
    RING_CELLS,
    RING_LAST_PROGRESS,
    ringIndexFor,
    SEAT_COLORS,
    SeatColor,
    SeatKind,
    START_RING_INDEX,
    STAR_RING_INDEXES,
    yardCells,
    YARD_ORIGINS,
} from "./engine"
import * as styles from "./LudoPage.styles.css"

const STATS_KEY = "ludobot-stats"

/** SVG geometry: the 15x15 grid rendered on a 600x600 viewBox. */
const CELL = 40
const BOARD = CELL * 15

const BOT_ROLL_DELAY_MS = 750
const BOT_MOVE_DELAY_MS = 620
const DIE_FLICKS = 8
const DIE_FLICK_MS = 55

const SEAT_KINDS: SeatKind[] = ["human", "bot", "off"]
const SEAT_KIND_LABELS: Record<SeatKind, string> = { human: "Human", bot: "Bot", off: "Off" }
const DEFAULT_SEATS: SeatKind[] = ["human", "bot", "bot", "bot"]

const SEAT_FILL: Record<SeatColor, { main: string; dark: string }> = {
    red: { main: "#e0453a", dark: "#9c2b22" },
    green: { main: "#2fa24c", dark: "#1d6c32" },
    yellow: { main: "#f2b705", dark: "#a97f06" },
    blue: { main: "#2f6fd0", dark: "#1e4b90" },
}

/** Which of the 9 pip slots (3x3, row-major) light up for each die face. */
const PIP_LAYOUTS: Record<number, number[]> = {
    1: [4],
    2: [2, 6],
    3: [2, 4, 6],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
}

/** Pixel offsets that fan out tokens sharing one square. */
const STACK_OFFSETS = [
    [0, 0],
    [-7, -7],
    [7, -7],
    [-7, 7],
    [7, 7],
    [0, -9],
    [0, 9],
    [-9, 0],
]

/** Where each seat's finished tokens rest, inside the center triangles. */
const FINISH_ANCHORS: Cell[] = [
    { col: 6.1, row: 7 },
    { col: 7, row: 6.1 },
    { col: 7.9, row: 7 },
    { col: 7, row: 7.9 },
]

type WinsTally = Record<SeatColor, number>

function loadStats(): WinsTally {
    try {
        const raw = localStorage.getItem(STATS_KEY)
        if (raw) {
            const parsed = JSON.parse(raw) as Partial<WinsTally>
            return {
                red: parsed.red ?? 0,
                green: parsed.green ?? 0,
                yellow: parsed.yellow ?? 0,
                blue: parsed.blue ?? 0,
            }
        }
    } catch {
        // Corrupt storage falls through to a fresh tally.
    }
    return { red: 0, green: 0, yellow: 0, blue: 0 }
}

function centerOf(cell: Cell): { x: number; y: number } {
    return { x: (cell.col + 0.5) * CELL, y: (cell.row + 0.5) * CELL }
}

/** Board cell a token occupies for rendering (yard, ring, column, or center). */
function tokenCell(seat: number, token: number, progress: number): Cell {
    if (progress === -1) {
        return yardCells(seat)[token]
    }
    if (progress <= RING_LAST_PROGRESS) {
        return RING_CELLS[ringIndexFor(seat, progress)]
    }
    if (progress < HOME_PROGRESS) {
        return homeColumnCells(seat)[progress - RING_LAST_PROGRESS - 1]
    }
    return FINISH_ANCHORS[seat]
}

/** "10 o'clock"-style points string for a five-point star. */
function starPoints(cx: number, cy: number, outer: number, inner: number): string {
    const points: string[] = []
    for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? outer : inner
        const angle = (Math.PI / 5) * i - Math.PI / 2
        points.push(`${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`)
    }
    return points.join(" ")
}

function seatLabel(seats: SeatKind[], seat: number): string {
    return `${SEAT_COLORS[seat]} (${SEAT_KIND_LABELS[seats[seat]].toLowerCase()})`
}

function describeRoll(prev: GameState, next: GameState, value: number): string {
    const who = seatLabel(prev.seats, prev.current)
    if (next.dice !== null) {
        return value === 6
            ? `${who} rolled a 6 — move a token, then roll again.`
            : `${who} rolled a ${value}.`
    }
    if (next.current === prev.current) {
        return `${who} rolled a 6 but has no move — roll again.`
    }
    if (value === 6) {
        return `Three sixes in a row! ${who} forfeits the turn.`
    }
    return `${who} rolled a ${value} — no legal move, turn passes.`
}

function describeMove(prev: GameState, next: GameState, move: MoveOption): string {
    const who = seatLabel(prev.seats, prev.current)
    const parts: string[] = []
    if (move.captures) {
        parts.push(`${who} captures — back to the yard!`)
    }
    if (move.to === HOME_PROGRESS) {
        parts.push(`${who} brings a token home!`)
    }
    if (next.placings.length > prev.placings.length && next.placings.includes(prev.current)) {
        parts.push(`${SEAT_COLORS[prev.current]} finishes #${next.placings.indexOf(prev.current) + 1}!`)
    }
    if (!next.over && next.current === prev.current && next.dice === null) {
        parts.push("Six! Roll again.")
    }
    return parts.join(" ") || `${who} moves ${move.to - Math.max(move.from, 0)} squares.`
}

/**
 * Home surface for the `ludo` pack: the classic four-color race on a felt
 * table. Seats are configurable (human/bot/off, 2-4 racers, full local
 * hotseat), the rules live in the pure `engine.ts`, and match wins persist in
 * localStorage. Fully client-side: no network, no assets — the board is
 * inline SVG.
 */
export default function LudoPage(): React.ReactElement {
    const [seats, setSeats] = useState<SeatKind[]>(DEFAULT_SEATS)
    const [game, setGame] = useState<GameState | null>(null)
    const [rolling, setRolling] = useState(false)
    const [dieFace, setDieFace] = useState(6)
    const [note, setNote] = useState("Set up the seats, then start the game.")
    const [stats, setStats] = useState<WinsTally>(loadStats)

    // Latest game for timer callbacks (roll animation, bot delays).
    const gameRef = useRef(game)
    gameRef.current = game
    const flickTimer = useRef<number | null>(null)

    useEffect(() => {
        return () => {
            if (flickTimer.current !== null) {
                window.clearTimeout(flickTimer.current)
            }
        }
    }, [])

    /** Board shown before the first start: all tokens waiting in the yards. */
    const preview = useMemo(() => createGame(seats), [seats])
    const shown = game ?? preview
    const moves = useMemo(() => (game ? legalMoves(game) : []), [game])
    const humanTurn = game !== null && !game.over && game.seats[game.current] === "human"

    const recordWinIfOver = useCallback((prev: GameState, next: GameState): void => {
        if (!prev.over && next.over && next.placings.length > 0) {
            const winner = SEAT_COLORS[next.placings[0]]
            setStats((tally) => {
                const updated = { ...tally, [winner]: tally[winner] + 1 }
                localStorage.setItem(STATS_KEY, JSON.stringify(updated))
                return updated
            })
        }
    }, [])

    const playMove = useCallback(
        (token: number): void => {
            const prev = gameRef.current
            if (!prev || prev.over || prev.dice === null) {
                return
            }
            const move = legalMoves(prev).find((option) => option.token === token)
            if (!move) {
                return
            }
            const next = applyMove(prev, token)
            setGame(next)
            setNote(
                next.over
                    ? `${SEAT_COLORS[next.placings[0]]} wins the match!`
                    : describeMove(prev, next, move),
            )
            recordWinIfOver(prev, next)
        },
        [recordWinIfOver],
    )

    /** Shakes the die for a few flicks, then commits a real 1..6 roll. */
    const startRoll = useCallback((): void => {
        const state = gameRef.current
        if (!state || state.over || state.dice !== null || rolling) {
            return
        }
        setRolling(true)
        const value = 1 + Math.floor(Math.random() * 6)
        let flicks = DIE_FLICKS
        const flick = (): void => {
            flicks -= 1
            if (flicks > 0) {
                setDieFace(1 + Math.floor(Math.random() * 6))
                flickTimer.current = window.setTimeout(flick, DIE_FLICK_MS)
                return
            }
            setDieFace(value)
            setRolling(false)
            const prev = gameRef.current
            if (!prev) {
                return
            }
            const next = applyRoll(prev, value)
            setGame(next)
            setNote(describeRoll(prev, next, value))
        }
        flick()
    }, [rolling])

    // Bot turns: roll after a beat, then pick a move after another beat, so
    // hotseat players can follow along.
    useEffect(() => {
        if (!game || game.over || rolling || game.seats[game.current] !== "bot") {
            return
        }
        if (game.dice === null) {
            const timer = window.setTimeout(startRoll, BOT_ROLL_DELAY_MS)
            return () => window.clearTimeout(timer)
        }
        const timer = window.setTimeout(() => {
            const prev = gameRef.current
            if (prev && prev.dice !== null) {
                const token = chooseBotMove(prev, Math.random)
                if (token !== null) {
                    playMove(token)
                }
            }
        }, BOT_MOVE_DELAY_MS)
        return () => window.clearTimeout(timer)
    }, [game, rolling, startRoll, playMove])

    const racerCount = seats.filter((kind) => kind !== "off").length

    const startGame = (): void => {
        setGame(createGame(seats))
        setNote(
            `${SEAT_COLORS[seats.findIndex((kind) => kind !== "off")]} rolls first. Roll a 6 to leave the yard!`,
        )
    }

    const backToSetup = (): void => {
        setGame(null)
        setNote("Set up the seats, then start the game.")
    }

    const cycleSeat = (seat: number, kind: SeatKind): void => {
        setSeats((prev) => prev.map((existing, index) => (index === seat ? kind : existing)))
    }

    // -----------------------------------------------------------------------
    // Board pieces
    // -----------------------------------------------------------------------

    const boardChrome = (
        <>
            {/* Yards */}
            {SEAT_COLORS.map((color, seat) => {
                const origin = YARD_ORIGINS[seat]
                return (
                    <g key={`yard-${color}`}>
                        <rect
                            x={origin.col * CELL}
                            y={origin.row * CELL}
                            width={6 * CELL}
                            height={6 * CELL}
                            rx={10}
                            fill={SEAT_FILL[color].main}
                            stroke={SEAT_FILL[color].dark}
                            strokeWidth={3}
                        />
                        <rect
                            x={(origin.col + 1) * CELL}
                            y={(origin.row + 1) * CELL}
                            width={4 * CELL}
                            height={4 * CELL}
                            rx={8}
                            fill="#f8f2e3"
                            stroke={SEAT_FILL[color].dark}
                            strokeWidth={2}
                        />
                        {yardCells(seat).map((cell, spot) => {
                            const { x, y } = centerOf(cell)
                            return (
                                <circle
                                    key={spot}
                                    cx={x}
                                    cy={y}
                                    r={15}
                                    fill="none"
                                    stroke={SEAT_FILL[color].dark}
                                    strokeWidth={2}
                                    strokeDasharray="3 3"
                                />
                            )
                        })}
                    </g>
                )
            })}

            {/* Track */}
            {RING_CELLS.map((cell, index) => {
                const startSeat = START_RING_INDEX.indexOf(index)
                const fill = startSeat >= 0 ? SEAT_FILL[SEAT_COLORS[startSeat]].main : "#fffaf0"
                return (
                    <rect
                        key={`ring-${index}`}
                        x={cell.col * CELL}
                        y={cell.row * CELL}
                        width={CELL}
                        height={CELL}
                        fill={fill}
                        stroke="#2b2015"
                        strokeOpacity={0.35}
                    />
                )
            })}
            {[...STAR_RING_INDEXES].map((index) => {
                const { x, y } = centerOf(RING_CELLS[index])
                return (
                    <polygon
                        key={`star-${index}`}
                        className={styles.starGlyph}
                        points={starPoints(x, y, 13, 5.5)}
                    />
                )
            })}

            {/* Home columns */}
            {SEAT_COLORS.map((color, seat) =>
                homeColumnCells(seat).map((cell, step) => (
                    <rect
                        key={`col-${color}-${step}`}
                        x={cell.col * CELL}
                        y={cell.row * CELL}
                        width={CELL}
                        height={CELL}
                        fill={SEAT_FILL[color].main}
                        stroke={SEAT_FILL[color].dark}
                        strokeOpacity={0.6}
                    />
                )),
            )}

            {/* Center: four triangles pointing home */}
            <rect
                x={6 * CELL}
                y={6 * CELL}
                width={3 * CELL}
                height={3 * CELL}
                fill="#fffaf0"
                stroke="#2b2015"
                strokeOpacity={0.35}
            />
            <polygon
                points={`${6 * CELL},${6 * CELL} ${6 * CELL},${9 * CELL} ${7.5 * CELL},${7.5 * CELL}`}
                fill={SEAT_FILL.red.main}
            />
            <polygon
                points={`${6 * CELL},${6 * CELL} ${9 * CELL},${6 * CELL} ${7.5 * CELL},${7.5 * CELL}`}
                fill={SEAT_FILL.green.main}
            />
            <polygon
                points={`${9 * CELL},${6 * CELL} ${9 * CELL},${9 * CELL} ${7.5 * CELL},${7.5 * CELL}`}
                fill={SEAT_FILL.yellow.main}
            />
            <polygon
                points={`${6 * CELL},${9 * CELL} ${9 * CELL},${9 * CELL} ${7.5 * CELL},${7.5 * CELL}`}
                fill={SEAT_FILL.blue.main}
            />
        </>
    )

    // Fan out tokens that share a square so stacks stay visible. Off seats
    // have no tokens on the board.
    const occupancy = new Map<string, number>()
    const renderTokens = SEAT_COLORS.flatMap((color, seat) => {
        if (shown.seats[seat] === "off") {
            return []
        }
        return shown.tokens[seat].map((progress, token) => {
            const cell = tokenCell(seat, token, progress)
            const base = centerOf(cell)
            const key = `${cell.col}|${cell.row}`
            const stackIndex = occupancy.get(key) ?? 0
            occupancy.set(key, stackIndex + 1)
            const [dx, dy] = STACK_OFFSETS[Math.min(stackIndex, STACK_OFFSETS.length - 1)]
            const movable =
                humanTurn && !rolling && moves.some((move) => move.token === token) && seat === shown.current
            return {
                color,
                seat,
                token,
                x: base.x + dx,
                y: base.y + dy,
                finished: progress === HOME_PROGRESS,
                movable,
            }
        })
    })

    const hintCells =
        humanTurn && !rolling ? moves.map((move) => tokenCell(shown.current, move.token, move.to)) : []

    const currentColor = SEAT_COLORS[shown.current]

    return (
        <div className={styles.page}>
            <div className={styles.table}>
                <div className={styles.titleBar}>
                    <span>🎲 LudoBot</span>
                    <span className={styles.titleTag}>The classic four-color race</span>
                </div>

                <div className={styles.layout}>
                    <div className={styles.boardArena}>
                        <svg
                            className={styles.board}
                            viewBox={`0 0 ${BOARD} ${BOARD}`}
                            role="img"
                            aria-label="Ludo board"
                        >
                            {boardChrome}
                            {hintCells.map((cell, index) => {
                                const { x, y } = centerOf(cell)
                                return (
                                    <circle
                                        key={`hint-${index}`}
                                        className={styles.hintRing}
                                        cx={x}
                                        cy={y}
                                        r={16}
                                    />
                                )
                            })}
                            {renderTokens.map(({ color, seat, token, x, y, finished, movable }) => (
                                <g
                                    key={`token-${color}-${token}`}
                                    className={
                                        movable ? `${styles.token} ${styles.tokenClickable}` : styles.token
                                    }
                                    transform={`translate(${x}, ${y})`}
                                    onClick={movable ? () => playMove(token) : undefined}
                                >
                                    {movable && <circle className={styles.tokenHalo} r={17} />}
                                    <circle
                                        r={finished ? 9 : 13}
                                        fill={SEAT_FILL[SEAT_COLORS[seat]].main}
                                        stroke={SEAT_FILL[SEAT_COLORS[seat]].dark}
                                        strokeWidth={2.5}
                                    />
                                    <circle
                                        r={finished ? 3 : 4.5}
                                        cx={-3}
                                        cy={-4}
                                        fill="#ffffff"
                                        opacity={0.4}
                                    />
                                </g>
                            ))}
                        </svg>

                        {game === null && (
                            <div className={styles.overlay}>
                                <div className={styles.overlayCard}>
                                    <div className={styles.overlayTitle}>🎲 LudoBot</div>
                                    <div>
                                        Roll sixes, capture rivals, and bring all four tokens home first.
                                    </div>
                                    <div className={styles.overlayButtons}>
                                        <button
                                            className={styles.primaryBtn}
                                            onClick={startGame}
                                            disabled={racerCount < 2}
                                        >
                                            ▶ Start game
                                        </button>
                                    </div>
                                    {racerCount < 2 && (
                                        <div className={styles.mutedRow}>
                                            Turn on at least two seats to play.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {game?.over && (
                            <div className={styles.overlay}>
                                <div className={styles.overlayCard}>
                                    <div className={styles.overlayTitle}>
                                        🏆 {SEAT_COLORS[game.placings[0]].toUpperCase()} WINS
                                    </div>
                                    {game.placings.map((seat, place) => (
                                        <div key={seat} className={styles.listRow}>
                                            <span>{["🥇", "🥈", "🥉", "4️⃣"][place]}</span>
                                            <span className={styles.swatch[SEAT_COLORS[seat]]} />
                                            <span>{seatLabel(game.seats, seat)}</span>
                                        </div>
                                    ))}
                                    <div className={styles.overlayButtons}>
                                        <button className={styles.primaryBtn} onClick={startGame}>
                                            ⟳ Play again
                                        </button>
                                        <button className={styles.woodBtn} onClick={backToSetup}>
                                            Change seats
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <aside className={styles.side}>
                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Turn</header>
                            <div className={styles.panelBody}>
                                <div className={styles.turnChip}>
                                    <span className={styles.swatch[currentColor]} />
                                    <span>
                                        {game === null
                                            ? "Waiting to start"
                                            : game.over
                                              ? "Match over"
                                              : seatLabel(game.seats, game.current)}
                                    </span>
                                </div>
                                <div className={styles.diceRow}>
                                    <button
                                        className={
                                            rolling ? `${styles.die} ${styles.dieRolling}` : styles.die
                                        }
                                        onClick={startRoll}
                                        disabled={
                                            !humanTurn || rolling || (game !== null && game.dice !== null)
                                        }
                                        aria-label="Roll the die"
                                    >
                                        {Array.from({ length: 9 }, (_, slot) => (
                                            <span
                                                key={slot}
                                                className={styles.pip}
                                                style={{
                                                    opacity: PIP_LAYOUTS[dieFace].includes(slot) ? 1 : 0,
                                                }}
                                            />
                                        ))}
                                    </button>
                                    <div className={styles.diceHint}>
                                        {humanTurn && game.dice === null && !rolling
                                            ? "Tap the die to roll!"
                                            : humanTurn && game.dice !== null
                                              ? "Tap a glowing token to move."
                                              : "Bots roll on their own."}
                                    </div>
                                </div>
                                <div className={styles.note}>{note}</div>
                            </div>
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Seats</header>
                            <div className={styles.panelBody}>
                                {SEAT_COLORS.map((color, seat) => (
                                    <div key={color} className={styles.seatRow}>
                                        <span className={styles.swatch[color]} />
                                        <span className={styles.seatName}>{color}</span>
                                        <span className={styles.segmented}>
                                            {SEAT_KINDS.map((kind) => (
                                                <button
                                                    key={kind}
                                                    className={
                                                        seats[seat] === kind
                                                            ? styles.segmentOn
                                                            : styles.segment
                                                    }
                                                    onClick={() => cycleSeat(seat, kind)}
                                                    disabled={game !== null && !game.over}
                                                >
                                                    {SEAT_KIND_LABELS[kind]}
                                                </button>
                                            ))}
                                        </span>
                                    </div>
                                ))}
                                {game === null ? (
                                    <button
                                        className={styles.primaryBtn}
                                        onClick={startGame}
                                        disabled={racerCount < 2}
                                    >
                                        ▶ Start game
                                    </button>
                                ) : (
                                    <button className={styles.woodBtn} onClick={backToSetup}>
                                        ⟳ New game
                                    </button>
                                )}
                            </div>
                        </section>

                        {game !== null && game.placings.length > 0 && !game.over && (
                            <section className={styles.panel}>
                                <header className={styles.panelHeader}>Placings</header>
                                <div className={styles.panelBody}>
                                    {game.placings.map((seat, place) => (
                                        <div key={seat} className={styles.listRow}>
                                            <span>{["🥇", "🥈", "🥉"][place] ?? `${place + 1}.`}</span>
                                            <span className={styles.swatch[SEAT_COLORS[seat]]} />
                                            <span>{SEAT_COLORS[seat]}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Match wins</header>
                            <div className={styles.panelBody}>
                                {SEAT_COLORS.map((color) => (
                                    <div key={color} className={styles.listRow}>
                                        <span className={styles.swatch[color]} />
                                        <span>{color}</span>
                                        <span className={styles.listValue}>{stats[color]}</span>
                                    </div>
                                ))}
                                <div className={styles.mutedRow}>Wins are saved on this device.</div>
                            </div>
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>How to play</header>
                            <div className={styles.panelBody}>
                                <div className={styles.mutedRow}>
                                    Roll a 6 to leave the yard — a 6 always earns another roll.
                                </div>
                                <div className={styles.mutedRow}>
                                    Land on a rival to send it home; stars and start squares are safe.
                                </div>
                                <div className={styles.mutedRow}>
                                    The home stretch needs exact rolls. Three sixes forfeit the turn!
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>

                <div className={styles.statusBar}>
                    <span>LudoBot · local hotseat</span>
                    <span>
                        {game === null
                            ? "SETTING UP"
                            : game.over
                              ? "MATCH OVER"
                              : `${currentColor.toUpperCase()} TO ${game.dice === null ? "ROLL" : "MOVE"}`}
                    </span>
                    <span>{racerCount} racers</span>
                </div>
            </div>
        </div>
    )
}
