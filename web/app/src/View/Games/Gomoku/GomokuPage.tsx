import React, { useEffect, useMemo, useState } from "react"
import {
    BOARD_SIZE,
    BotLevel,
    cellAt,
    colOf,
    emptyBoard,
    findBotMove,
    findWinLine,
    isBoardFull,
    rowOf,
    Stone,
} from "./engine"
import * as styles from "./GomokuPage.styles.css"

const LEVELS: BotLevel[] = ["easy", "medium", "hard"]
const BOT_THINK_DELAY_MS = 300

/** Star-point (hoshi) rows/columns of a 15x15 goban. */
const STAR_LINES = [3, 7, 11]
const STAR_CELLS = new Set(STAR_LINES.flatMap((row) => STAR_LINES.map((col) => cellAt(row, col))))

/** localStorage key the win/draw tally persists under between sessions. */
const STATS_KEY = "gomokubot-stats"

type GomokuMode = "1p" | "2p"

interface Stats {
    blackWins: number
    whiteWins: number
    draws: number
}

function loadStats(): Stats {
    try {
        const raw = window.localStorage.getItem(STATS_KEY)
        if (raw) {
            const saved = JSON.parse(raw) as Stats
            if (
                typeof saved.blackWins === "number" &&
                typeof saved.whiteWins === "number" &&
                typeof saved.draws === "number"
            ) {
                return saved
            }
        }
    } catch {
        // Corrupt storage falls through to a fresh tally.
    }
    return { blackWins: 0, whiteWins: 0, draws: 0 }
}

/** Home surface for the `gomoku` pack: five-in-a-row on a 15x15 goban against a bot or a friend. */
export default function GomokuPage(): React.ReactElement {
    // The board is derived from the move list so undo is just slicing it.
    const [moves, setMoves] = useState<number[]>([])
    const [mode, setMode] = useState<GomokuMode>("1p")
    const [level, setLevel] = useState<BotLevel>("medium")
    const [stats, setStats] = useState<Stats>(loadStats)

    const board = useMemo(() => {
        const next = emptyBoard()
        moves.forEach((cell, index) => {
            next[cell] = index % 2 === 0 ? "black" : "white"
        })
        return next
    }, [moves])

    const turn: Stone = moves.length % 2 === 0 ? "black" : "white"
    const lastMove = moves.length > 0 ? moves[moves.length - 1] : null
    const winLine = useMemo(
        () => (lastMove === null ? null : findWinLine(board, lastMove)),
        [board, lastMove],
    )
    const winner: Stone | null = winLine && lastMove !== null ? board[lastMove] : null
    const isDraw = winner === null && isBoardFull(board)
    const gameOver = winner !== null || isDraw
    // The human always plays black in 1P; white is the bot.
    const botTurn = mode === "1p" && turn === "white" && !gameOver

    // Bot reply: deferred with a timeout so the player's stone paints first.
    useEffect(() => {
        if (!botTurn) {
            return
        }
        const timer = setTimeout(() => {
            const cell = findBotMove(board, "white", level)
            if (cell !== null) {
                setMoves((prev) => [...prev, cell])
            }
        }, BOT_THINK_DELAY_MS)
        return () => clearTimeout(timer)
    }, [botTurn, board, level])

    // Record each finished game exactly once (keyed on the move that ended it).
    useEffect(() => {
        if (!gameOver) {
            return
        }
        setStats((prev) => {
            const next: Stats = {
                blackWins: prev.blackWins + (winner === "black" ? 1 : 0),
                whiteWins: prev.whiteWins + (winner === "white" ? 1 : 0),
                draws: prev.draws + (isDraw ? 1 : 0),
            }
            window.localStorage.setItem(STATS_KEY, JSON.stringify(next))
            return next
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameOver])

    const handleCellClick = (cell: number): void => {
        if (gameOver || botTurn || board[cell] !== null) {
            return
        }
        setMoves((prev) => [...prev, cell])
    }

    const newGame = (): void => {
        setMoves([])
    }

    // Undo reverts a full human+bot pair in 1P so it is the player's turn again.
    const undo = (): void => {
        setMoves((prev) => {
            if (prev.length === 0) {
                return prev
            }
            const drop = mode === "1p" && prev.length % 2 === 0 ? 2 : 1
            return prev.slice(0, prev.length - drop)
        })
    }

    const resetStats = (): void => {
        const fresh: Stats = { blackWins: 0, whiteWins: 0, draws: 0 }
        window.localStorage.setItem(STATS_KEY, JSON.stringify(fresh))
        setStats(fresh)
    }

    const switchMode = (nextMode: GomokuMode): void => {
        setMode(nextMode)
        setMoves([])
    }

    const winCells = useMemo(() => new Set(winLine ?? []), [winLine])

    const statusText = winner
        ? `${winner.toUpperCase()} WINS — FIVE IN A ROW`
        : isDraw
          ? "DRAW — BOARD FULL"
          : `${turn.toUpperCase()} TO MOVE`

    return (
        <div className={styles.page}>
            <div className={styles.console}>
                <div className={styles.titleBar}>
                    <span>🤖 GomokuBot</span>
                    <span className={styles.titleControls}>
                        <span className={styles.titleBtn}>_</span>
                        <span className={styles.titleBtn}>□</span>
                        <span className={styles.titleBtn}>✕</span>
                    </span>
                </div>

                <div className={styles.toolbar}>
                    <button className={styles.chunky} onClick={newGame}>
                        ⟳ New Game
                    </button>
                    <button className={styles.chunky} onClick={undo} disabled={moves.length === 0 || botTurn}>
                        ↩ Undo
                    </button>
                    <span className={styles.toolbarSpacer} />
                    <span className={mode === "1p" ? styles.botBadgeOn : styles.botBadge}>
                        {botTurn ? "● BOT THINKING…" : mode === "1p" ? "● BOT ACTIVE" : "○ BOT IDLE"}
                    </span>
                </div>

                <div className={styles.layout}>
                    <aside className={styles.panelColumn}>
                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Game Mode</header>
                            <label className={styles.radioRow}>
                                <input
                                    type="radio"
                                    checked={mode === "1p"}
                                    onChange={() => switchMode("1p")}
                                />
                                Vs Bot 🤖
                            </label>
                            <label className={styles.radioRow}>
                                <input
                                    type="radio"
                                    checked={mode === "2p"}
                                    onChange={() => switchMode("2p")}
                                />
                                2P Hotseat 👥
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
                            <header className={styles.panelHeader}>Score Tally</header>
                            <div className={styles.tallyRow}>
                                <span>⚫ Black</span>
                                <span className={styles.tallyValue}>{stats.blackWins}</span>
                            </div>
                            <div className={styles.tallyRow}>
                                <span>⚪ White</span>
                                <span className={styles.tallyValue}>{stats.whiteWins}</span>
                            </div>
                            <div className={styles.tallyRow}>
                                <span>🤝 Draws</span>
                                <span className={styles.tallyValue}>{stats.draws}</span>
                            </div>
                            <div className={styles.radioRow}>
                                <button className={styles.chunky} onClick={resetStats}>
                                    Reset
                                </button>
                            </div>
                        </section>

                        <section className={styles.panelBrand}>
                            <div className={styles.brandName}>GOMOKUBOT</div>
                            <div className={styles.brandTag}>Five in a row wins. 🤖</div>
                        </section>
                    </aside>

                    <main className={styles.boardColumn}>
                        <div className={styles.boardArena}>
                            <div className={styles.goban}>
                                <div className={styles.grid}>
                                    {board.map((stone, cell) => {
                                        const row = rowOf(cell)
                                        const col = colOf(cell)
                                        return (
                                            <button
                                                key={cell}
                                                className={styles.cell}
                                                onClick={() => handleCellClick(cell)}
                                                disabled={gameOver || botTurn || stone !== null}
                                                aria-label={`Row ${row + 1}, column ${col + 1}`}
                                            >
                                                <span
                                                    className={styles.lineH}
                                                    style={{
                                                        left: col === 0 ? "50%" : 0,
                                                        right: col === BOARD_SIZE - 1 ? "50%" : 0,
                                                    }}
                                                />
                                                <span
                                                    className={styles.lineV}
                                                    style={{
                                                        top: row === 0 ? "50%" : 0,
                                                        bottom: row === BOARD_SIZE - 1 ? "50%" : 0,
                                                    }}
                                                />
                                                {STAR_CELLS.has(cell) && stone === null && (
                                                    <span className={styles.starPoint} />
                                                )}
                                                {stone === null && !gameOver && !botTurn && (
                                                    <span
                                                        className={
                                                            turn === "black"
                                                                ? styles.hoverHint
                                                                : styles.hoverHintWhite
                                                        }
                                                    />
                                                )}
                                                {stone !== null && (
                                                    <span
                                                        className={
                                                            stone === "black"
                                                                ? styles.stoneBlack
                                                                : styles.stoneWhite
                                                        }
                                                    />
                                                )}
                                                {winCells.has(cell) && <span className={styles.winGlow} />}
                                                {cell === lastMove && !winCells.has(cell) && (
                                                    <span className={styles.lastMoveDot} />
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className={styles.controlsHint}>
                            Click an intersection to place a stone · Black moves first · Five or more in a row
                            wins
                        </div>
                    </main>
                </div>

                <div className={styles.statusBar}>
                    <span>● {botTurn ? "THINKING." : "READY."}</span>
                    <span>{statusText}</span>
                    <span>
                        MOVE {moves.length} ·{" "}
                        {mode === "1p" ? `VS BOT · ${level.toUpperCase()}` : "2P HOTSEAT"}
                    </span>
                </div>
            </div>
        </div>
    )
}
