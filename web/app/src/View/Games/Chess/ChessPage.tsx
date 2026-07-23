import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { sounds } from "./audio"
import ChessBoard, { PIECE_GLYPHS } from "./ChessBoard"
import {
    applyMove,
    BotDifficulty,
    findBotMove,
    GameState,
    getOutcome,
    initialState,
    isInCheck,
    legalMoves,
    Move,
    moveToSan,
    PIECE_VALUES,
    PieceType,
} from "./engine"
import * as styles from "./ChessPage.styles.css"

const DIFFICULTIES: BotDifficulty[] = ["easy", "medium", "hard"]
const BOT_THINK_DELAY_MS = 350

type ChessMode = "1p" | "2p"

interface PlyRecord {
    move: Move
    san: string
    /** Position after the move. */
    state: GameState
}

/** Home surface for the `chess` pack: full-rules chess against a bot or a friend. */
export default function ChessPage(): React.ReactElement {
    const start = useMemo(() => initialState(), [])
    const [plies, setPlies] = useState<PlyRecord[]>([])
    const [selected, setSelected] = useState<number | null>(null)
    const [mode, setMode] = useState<ChessMode>("1p")
    const [difficulty, setDifficulty] = useState<BotDifficulty>("medium")
    const [soundOn, setSoundOn] = useState(true)
    const [flipEachTurn, setFlipEachTurn] = useState(false)
    const moveScrollRef = useRef<HTMLDivElement>(null)

    const current = plies.length > 0 ? plies[plies.length - 1].state : start
    const outcome = useMemo(() => getOutcome(current), [current])
    const inCheck = useMemo(() => isInCheck(current, current.turn), [current])
    const botTurn = mode === "1p" && current.turn === "black" && outcome === null

    const targets = useMemo(
        () => (selected === null ? [] : legalMoves(current).filter((move) => move.from === selected)),
        [current, selected],
    )
    const lastMove = plies.length > 0 ? plies[plies.length - 1].move : null
    const checkSquare = inCheck
        ? current.board.findIndex((piece) => piece?.type === "king" && piece.color === current.turn)
        : null

    const playMove = useCallback(
        (move: Move): void => {
            const san = moveToSan(current, move)
            const next = applyMove(current, move)
            if (soundOn) {
                if (getOutcome(next) !== null) {
                    sounds.gameOver()
                } else if (isInCheck(next, next.turn)) {
                    sounds.check()
                } else if (move.captured) {
                    sounds.capture()
                } else {
                    sounds.move()
                }
            }
            setPlies((prev) => [...prev, { move, san, state: next }])
            setSelected(null)
        },
        [current, soundOn],
    )

    // Bot reply: deferred with a timeout so the player's move paints first.
    useEffect(() => {
        if (!botTurn) {
            return
        }
        const timer = setTimeout(() => {
            const move = findBotMove(current, difficulty)
            if (move) {
                playMove(move)
            }
        }, BOT_THINK_DELAY_MS)
        return () => clearTimeout(timer)
    }, [botTurn, current, difficulty, playMove])

    useEffect(() => {
        const node = moveScrollRef.current
        if (node) {
            node.scrollTop = node.scrollHeight
        }
    }, [plies.length])

    const handleSquareClick = (square: number): void => {
        if (outcome !== null || botTurn) {
            return
        }
        if (selected !== null) {
            const candidates = targets.filter((move) => move.to === square)
            if (candidates.length > 0) {
                // Promotions generate all four pieces; the template auto-queens.
                playMove(candidates.find((move) => move.promotion === "queen") ?? candidates[0])
                return
            }
        }
        const piece = current.board[square]
        if (piece && piece.color === current.turn && square !== selected) {
            setSelected(square)
        } else {
            setSelected(null)
        }
    }

    const newGame = (): void => {
        setPlies([])
        setSelected(null)
    }

    // Undo reverts a full player+bot pair in 1P so it is the player's turn again.
    const undo = (): void => {
        setSelected(null)
        setPlies((prev) => {
            if (prev.length === 0) {
                return prev
            }
            const afterLast = prev[prev.length - 1].state
            const drop = mode === "1p" && afterLast.turn === "white" && prev.length >= 2 ? 2 : 1
            return prev.slice(0, prev.length - drop)
        })
    }

    const captures = useMemo(() => {
        const byWhite: PieceType[] = []
        const byBlack: PieceType[] = []
        plies.forEach((ply, index) => {
            if (ply.move.captured) {
                ;(index % 2 === 0 ? byWhite : byBlack).push(ply.move.captured)
            }
        })
        const value = (list: PieceType[]): number => list.reduce((sum, type) => sum + PIECE_VALUES[type], 0)
        return { byWhite, byBlack, diff: Math.round((value(byWhite) - value(byBlack)) / 100) }
    }, [plies])

    const moveRows = useMemo(() => {
        const rows: { number: number; white: string; black: string }[] = []
        for (let i = 0; i < plies.length; i += 2) {
            rows.push({ number: i / 2 + 1, white: plies[i].san, black: plies[i + 1]?.san ?? "" })
        }
        return rows
    }, [plies])

    const statusText =
        outcome === "checkmate"
            ? `CHECKMATE — ${current.turn === "white" ? "BLACK" : "WHITE"} WINS`
            : outcome === "stalemate"
              ? "STALEMATE — DRAW"
              : outcome === "insufficient-material"
                ? "DRAW — INSUFFICIENT MATERIAL"
                : `${inCheck ? "CHECK — " : ""}${current.turn.toUpperCase()} TO MOVE`

    return (
        <div className={styles.page}>
            <div className={styles.console}>
                <div className={styles.titleBar}>
                    <span>🤖 ChessBot</span>
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
                    <button className={styles.chunky} onClick={undo} disabled={plies.length === 0}>
                        ↩ Undo
                    </button>
                    <button
                        className={soundOn ? styles.chunkyLit : styles.chunky}
                        onClick={() => setSoundOn((value) => !value)}
                    >
                        {soundOn ? "🔊 Sound" : "🔇 Sound"}
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
                                <input type="radio" checked={mode === "1p"} onChange={() => setMode("1p")} />1
                                Player 👤
                            </label>
                            <label className={styles.radioRow}>
                                <input type="radio" checked={mode === "2p"} onChange={() => setMode("2p")} />2
                                Player 👥
                            </label>
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Difficulty</header>
                            {DIFFICULTIES.map((level) => (
                                <label key={level} className={styles.radioRow}>
                                    <input
                                        type="radio"
                                        checked={difficulty === level}
                                        onChange={() => setDifficulty(level)}
                                        disabled={mode === "2p"}
                                    />
                                    <span className={styles.capitalize}>{level}</span>
                                </label>
                            ))}
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Board</header>
                            <label className={styles.radioRow}>
                                <input
                                    type="checkbox"
                                    checked={flipEachTurn}
                                    onChange={() => setFlipEachTurn((value) => !value)}
                                    disabled={mode === "1p"}
                                />
                                Flip each turn 🔄
                            </label>
                        </section>

                        <section className={styles.panelBrand}>
                            <div className={styles.brandName}>CHESSBOT</div>
                            <div className={styles.brandTag}>Every move calculated. 🤖</div>
                        </section>
                    </aside>

                    <main className={styles.boardColumn}>
                        <div className={styles.boardArena}>
                            <ChessBoard
                                state={current}
                                selected={selected}
                                targets={targets}
                                lastMove={lastMove}
                                checkSquare={checkSquare === -1 ? null : checkSquare}
                                flipped={mode === "2p" && flipEachTurn && current.turn === "black"}
                                plyCount={plies.length}
                                onSquareClick={handleSquareClick}
                            />
                        </div>
                        <div className={styles.controlsHint}>
                            Click a piece, then a highlighted square · Pawns auto-promote to queens
                        </div>
                    </main>

                    <aside className={styles.panelColumn}>
                        <section className={styles.panelGrow}>
                            <header className={styles.panelHeader}>Moves</header>
                            <div ref={moveScrollRef} className={styles.moveScroll}>
                                {moveRows.length === 0 ? (
                                    <p className={styles.muted}>No moves yet. White starts!</p>
                                ) : (
                                    moveRows.map((row) => (
                                        <div key={row.number} className={styles.moveRow}>
                                            <span className={styles.moveNumber}>{row.number}.</span>
                                            <span>{row.white}</span>
                                            <span>{row.black}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Captured</header>
                            <div className={styles.trayLabel}>White took</div>
                            <div className={styles.tray}>
                                {captures.byWhite.map((type, index) => (
                                    <span key={index}>{PIECE_GLYPHS.black[type]}</span>
                                ))}
                            </div>
                            <div className={styles.trayLabel}>Black took</div>
                            <div className={styles.tray}>
                                {captures.byBlack.map((type, index) => (
                                    <span key={index}>{PIECE_GLYPHS.white[type]}</span>
                                ))}
                            </div>
                            <div className={styles.materialDiff}>
                                {captures.diff === 0
                                    ? "Material even"
                                    : captures.diff > 0
                                      ? `White +${captures.diff}`
                                      : `Black +${-captures.diff}`}
                            </div>
                        </section>
                    </aside>
                </div>

                <div className={styles.statusBar}>
                    <span>● {botTurn ? "THINKING." : "READY."}</span>
                    <span>{statusText}</span>
                    <span>{mode === "1p" ? `VS BOT · ${difficulty.toUpperCase()}` : "2P LOCAL"}</span>
                </div>
            </div>
        </div>
    )
}
