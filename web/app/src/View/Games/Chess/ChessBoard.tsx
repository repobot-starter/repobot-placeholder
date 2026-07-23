import React from "react"
import { Color, GameState, Move, PieceType, squareName } from "./engine"
import * as styles from "./ChessPage.styles.css"

/** Unicode glyphs for every piece, by color. */
export const PIECE_GLYPHS: Record<Color, Record<PieceType, string>> = {
    white: { king: "♔", queen: "♕", rook: "♖", bishop: "♗", knight: "♘", pawn: "♙" },
    black: { king: "♚", queen: "♛", rook: "♜", bishop: "♝", knight: "♞", pawn: "♟" },
}

interface ChessBoardProps {
    state: GameState
    /** Currently selected square, or null. */
    selected: number | null
    /** Legal moves from the selected square (drawn as dots / capture rings). */
    targets: Move[]
    lastMove: Move | null
    /** Square of a king currently in check (glows red), or null. */
    checkSquare: number | null
    /** Render from black's point of view. */
    flipped: boolean
    /** Total plies played; keys the piece "pop" animation on the last move. */
    plyCount: number
    onSquareClick: (square: number) => void
}

/**
 * The 8x8 board: a DOM grid of buttons with wood squares, Unicode pieces,
 * move-target markers, and last-move / check highlights. Purely presentational
 * — all rules live in `engine.ts` and all interaction state in the parent.
 */
export default function ChessBoard(props: ChessBoardProps): React.ReactElement {
    const { state, selected, targets, lastMove, checkSquare, flipped, plyCount, onSquareClick } = props

    const squares: React.ReactElement[] = []
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const rank = flipped ? row : 7 - row
            const file = flipped ? 7 - col : col
            const square = rank * 8 + file
            const piece = state.board[square]
            const isLight = (file + rank) % 2 === 1
            const target = targets.find((move) => move.to === square)
            const justMoved = lastMove !== null && lastMove.to === square

            const classes = [isLight ? styles.squareLight : styles.squareDark]
            if (selected === square) {
                classes.push(styles.squareSelected)
            } else if (lastMove && (lastMove.from === square || lastMove.to === square)) {
                classes.push(styles.squareLastMove)
            }
            if (checkSquare === square) {
                classes.push(styles.squareCheck)
            }

            squares.push(
                <button
                    key={square}
                    className={classes.join(" ")}
                    onClick={() => onSquareClick(square)}
                    aria-label={
                        piece ? `${piece.color} ${piece.type} on ${squareName(square)}` : squareName(square)
                    }
                >
                    {piece && (
                        <span
                            key={justMoved ? `pop-${plyCount}` : "idle"}
                            className={
                                (piece.color === "white" ? styles.pieceWhite : styles.pieceBlack) +
                                (justMoved ? ` ${styles.piecePop}` : "")
                            }
                        >
                            {PIECE_GLYPHS[piece.color][piece.type]}
                        </span>
                    )}
                    {target &&
                        (target.captured ? (
                            <span className={styles.captureRing} />
                        ) : (
                            <span className={styles.moveDot} />
                        ))}
                    {col === 0 && <span className={styles.coordRank}>{rank + 1}</span>}
                    {row === 7 && <span className={styles.coordFile}>{"abcdefgh"[file]}</span>}
                </button>,
            )
        }
    }

    return <div className={styles.board}>{squares}</div>
}
