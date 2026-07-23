import React, { useEffect, useRef } from "react"
import * as styles from "./SnakePage.styles.css"

export const GRID_COLS = 28
export const GRID_ROWS = 22
const CELL = 24
export const BOARD_WIDTH = GRID_COLS * CELL
export const BOARD_HEIGHT = GRID_ROWS * CELL

const CELLS_PER_LEVEL = 5
const BASE_TICK_MS = 150
const TICK_DECREASE_PER_LEVEL = 12
const MIN_TICK_MS = 55

export interface SnakeScore {
    score: number
    level: number
}

interface Cell {
    x: number
    y: number
}

interface Food extends Cell {
    kind: string
}

interface SnakeSettings {
    paused: boolean
    onScore?: (score: SnakeScore) => void
    onGameOver?: (result: SnakeScore) => void
}

interface GameState {
    snake: Cell[]
    direction: Cell
    nextDirection: Cell
    food: Food
    score: number
    cellsEaten: number
    level: number
    over: boolean
    lastTick: number
    startedAt: number
}

/**
 * The playfield. Fixed-timestep grid game driven by requestAnimationFrame;
 * game state lives in refs. The parent owns pause/game-over UI and receives
 * score/level/game-over callbacks. Controls: arrows or WASD.
 */
export default function SnakeGame(props: SnakeSettings & { resetToken: number }): React.ReactElement {
    const { resetToken, ...settings } = props
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const gameRef = useRef<GameState | null>(null)
    const settingsRef = useRef<SnakeSettings>(settings)
    settingsRef.current = settings

    useEffect(() => {
        const middleRow = Math.floor(GRID_ROWS / 2)
        const snake: Cell[] = [
            { x: 8, y: middleRow },
            { x: 7, y: middleRow },
            { x: 6, y: middleRow },
        ]
        gameRef.current = {
            snake,
            direction: { x: 1, y: 0 },
            nextDirection: { x: 1, y: 0 },
            food: spawnFood({ snake }),
            score: 0,
            cellsEaten: 0,
            level: 1,
            over: false,
            lastTick: 0,
            startedAt: performance.now(),
        }
        settingsRef.current.onScore?.({ score: 0, level: 1 })
    }, [resetToken])

    useEffect(() => {
        const DIRECTIONS: Record<string, Cell | undefined> = {
            arrowup: { x: 0, y: -1 },
            w: { x: 0, y: -1 },
            arrowdown: { x: 0, y: 1 },
            s: { x: 0, y: 1 },
            arrowleft: { x: -1, y: 0 },
            a: { x: -1, y: 0 },
            arrowright: { x: 1, y: 0 },
            d: { x: 1, y: 0 },
        }
        const handleKeyDown = (event: KeyboardEvent): void => {
            const direction = DIRECTIONS[event.key.toLowerCase()]
            const game = gameRef.current
            if (!direction || !game) {
                return
            }
            event.preventDefault()
            // Disallow reversing straight into yourself.
            if (direction.x === -game.direction.x && direction.y === -game.direction.y) {
                return
            }
            game.nextDirection = direction
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [])

    useEffect(() => {
        const ctx = canvasRef.current?.getContext("2d")
        if (!ctx) {
            return
        }
        let frameId: number

        const tick = (now: number): void => {
            frameId = requestAnimationFrame(tick)
            const game = gameRef.current
            if (!game) {
                return
            }
            const tickMs = Math.max(MIN_TICK_MS, BASE_TICK_MS - (game.level - 1) * TICK_DECREASE_PER_LEVEL)
            if (!settingsRef.current.paused && !game.over && now - game.lastTick >= tickMs) {
                game.lastTick = now
                step(game, settingsRef.current)
            }
            draw(ctx, game)
        }
        frameId = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frameId)
    }, [])

    return <canvas ref={canvasRef} width={BOARD_WIDTH} height={BOARD_HEIGHT} className={styles.board} />
}

function spawnFood(game: Pick<GameState, "snake">): Food {
    const kinds = ["⚡", "💾", "🔋", "💎"]
    while (true) {
        const cell: Food = {
            x: Math.floor(Math.random() * GRID_COLS),
            y: Math.floor(Math.random() * GRID_ROWS),
            kind: kinds[Math.floor(Math.random() * kinds.length)],
        }
        if (!game.snake.some((segment) => segment.x === cell.x && segment.y === cell.y)) {
            return cell
        }
    }
}

function step(game: GameState, settings: SnakeSettings): void {
    game.direction = game.nextDirection
    const head: Cell = {
        x: game.snake[0].x + game.direction.x,
        y: game.snake[0].y + game.direction.y,
    }

    const hitWall = head.x < 0 || head.y < 0 || head.x >= GRID_COLS || head.y >= GRID_ROWS
    const hitSelf = game.snake.some((segment) => segment.x === head.x && segment.y === head.y)
    if (hitWall || hitSelf) {
        game.over = true
        settings.onGameOver?.({ score: game.score, level: game.level })
        return
    }

    game.snake.unshift(head)

    if (head.x === game.food.x && head.y === game.food.y) {
        game.cellsEaten += 1
        game.score += 100 * game.level
        if (game.cellsEaten % CELLS_PER_LEVEL === 0) {
            game.level += 1
        }
        game.food = spawnFood(game)
        settings.onScore?.({ score: game.score, level: game.level })
    } else {
        game.snake.pop()
    }
}

function draw(ctx: CanvasRenderingContext2D, game: GameState): void {
    ctx.fillStyle = "#020b04"
    ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT)

    // Phosphor grid
    ctx.strokeStyle = "rgba(66, 245, 120, 0.08)"
    ctx.lineWidth = 1
    for (let x = 0; x <= GRID_COLS; x++) {
        ctx.beginPath()
        ctx.moveTo(x * CELL + 0.5, 0)
        ctx.lineTo(x * CELL + 0.5, BOARD_HEIGHT)
        ctx.stroke()
    }
    for (let y = 0; y <= GRID_ROWS; y++) {
        ctx.beginPath()
        ctx.moveTo(0, y * CELL + 0.5)
        ctx.lineTo(BOARD_WIDTH, y * CELL + 0.5)
        ctx.stroke()
    }

    // Food
    ctx.font = `${CELL - 4}px serif`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(game.food.kind, game.food.x * CELL + CELL / 2, game.food.y * CELL + CELL / 2 + 1)

    // Snake: glowing rounded segments, head with bot face
    game.snake.forEach((segment, index) => {
        const isHead = index === 0
        const inset = isHead ? 1 : 2
        ctx.fillStyle = isHead ? "#b8ffd0" : "#42f578"
        ctx.shadowColor = "#42f578"
        ctx.shadowBlur = isHead ? 14 : 8
        roundRect(
            ctx,
            segment.x * CELL + inset,
            segment.y * CELL + inset,
            CELL - inset * 2,
            CELL - inset * 2,
            isHead ? 7 : 8,
        )
        ctx.fill()
        ctx.shadowBlur = 0
        if (isHead) {
            ctx.fillStyle = "#020b04"
            const cx = segment.x * CELL + CELL / 2
            const cy = segment.y * CELL + CELL / 2
            ctx.fillRect(cx - 6, cy - 3, 4, 4)
            ctx.fillRect(cx + 2, cy - 3, 4, 4)
            ctx.fillRect(cx - 4, cy + 3, 8, 2)
        }
    })
}

function roundRect(
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
