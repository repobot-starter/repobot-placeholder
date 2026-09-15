import React, { useEffect, useRef } from "react"
import { useAnimationFrameLoop } from "../../../Utils/useAnimationFrameLoop"
import { sounds } from "./audio"
import * as styles from "./PongPage.styles.css"

export const FIELD_WIDTH = 800
export const FIELD_HEIGHT = 560
const PADDLE_HEIGHT = 90
const PADDLE_WIDTH = 12
const PADDLE_MARGIN = 24
const BALL_SIZE = 12
const PLAYER_PADDLE_SPEED = 420
const WIN_SCORE = 7

export type PongMode = "1p" | "2p"
export type PongDifficulty = "easy" | "medium" | "hard" | "impossible"

export interface PongResult {
    winner: "left" | "right"
    left: number
    right: number
    durationMs: number
}

interface PongSettings {
    mode: PongMode
    difficulty: PongDifficulty
    speed: number
    soundOn: boolean
    paused: boolean
    onScore?: (score: { left: number; right: number }) => void
    onGameOver?: (result: PongResult) => void
    onStatus?: (status: string) => void
}

interface Ball {
    x: number
    y: number
    vx: number
    vy: number
}

interface GameState {
    leftY: number
    rightY: number
    leftScore: number
    rightScore: number
    ball: Ball
    rallyHits: number
    over: boolean
    keys: Set<string>
    mouseY: number | null
    startedAt: number
}

// Bot tracking speed (px/s) and how far ahead it predicts, per difficulty.
const BOT_LEVELS: Record<PongDifficulty, { speed: number; jitter: number }> = {
    easy: { speed: 180, jitter: 60 },
    medium: { speed: 280, jitter: 34 },
    hard: { speed: 380, jitter: 16 },
    impossible: { speed: 620, jitter: 0 },
}

/**
 * The playfield. Runs its own requestAnimationFrame loop; the parent owns
 * settings (mode, difficulty, speed multiplier, sound, pause) and receives
 * score/game-over callbacks. Player 1: W/S or mouse. Player 2: arrow keys.
 */
export default function PongGame(props: PongSettings & { resetToken: number }): React.ReactElement {
    const { resetToken, ...settings } = props
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const gameRef = useRef<GameState | null>(null)
    const settingsRef = useRef<PongSettings>(settings)
    settingsRef.current = settings

    // Full match reset whenever resetToken changes (New Game).
    useEffect(() => {
        gameRef.current = {
            leftY: FIELD_HEIGHT / 2,
            rightY: FIELD_HEIGHT / 2,
            leftScore: 0,
            rightScore: 0,
            ball: { x: FIELD_WIDTH / 2, y: FIELD_HEIGHT / 2, vx: 0, vy: 0 },
            rallyHits: 0,
            over: false,
            keys: new Set(),
            mouseY: null,
            startedAt: performance.now(),
        }
        serveBall(gameRef.current, Math.random() < 0.5 ? 1 : -1)
        settingsRef.current.onScore?.({ left: 0, right: 0 })
        settingsRef.current.onStatus?.("Ready")
    }, [resetToken])

    useEffect(() => {
        const handleKey = (down: boolean) => (event: KeyboardEvent) => {
            const keys = gameRef.current?.keys
            if (!keys) {
                return
            }
            if (["w", "s", "W", "S", "ArrowUp", "ArrowDown"].includes(event.key)) {
                event.preventDefault()
                if (down) {
                    keys.add(event.key.toLowerCase())
                } else {
                    keys.delete(event.key.toLowerCase())
                }
            }
        }
        const downHandler = handleKey(true)
        const upHandler = handleKey(false)
        window.addEventListener("keydown", downHandler)
        window.addEventListener("keyup", upHandler)
        return () => {
            window.removeEventListener("keydown", downHandler)
            window.removeEventListener("keyup", upHandler)
        }
    }, [])

    useAnimationFrameLoop((dt) => {
        const ctx = canvasRef.current?.getContext("2d")
        const game = gameRef.current
        if (!ctx || !game) {
            return
        }
        if (!settingsRef.current.paused && !game.over) {
            step(game, settingsRef.current, dt)
        }
        draw(ctx, game, settingsRef.current)
    })

    const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>): void => {
        const canvas = canvasRef.current
        const game = gameRef.current
        if (!canvas || !game) {
            return
        }
        const rect = canvas.getBoundingClientRect()
        game.mouseY = ((event.clientY - rect.top) / rect.height) * FIELD_HEIGHT
    }

    return (
        <canvas
            ref={canvasRef}
            width={FIELD_WIDTH}
            height={FIELD_HEIGHT}
            className={styles.playfield}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
                if (gameRef.current) {
                    gameRef.current.mouseY = null
                }
            }}
        />
    )
}

function serveBall(game: GameState, direction: number): void {
    const angle = (Math.random() * 0.5 - 0.25) * Math.PI
    game.ball = {
        x: FIELD_WIDTH / 2,
        y: FIELD_HEIGHT / 2,
        vx: Math.cos(angle) * direction,
        vy: Math.sin(angle),
    }
    game.rallyHits = 0
}

function ballSpeed(game: GameState, settings: PongSettings): number {
    const base = 260 * settings.speed
    return base + game.rallyHits * 18
}

function step(game: GameState, settings: PongSettings, dt: number): void {
    const play = settings.soundOn ? sounds : null

    // Player 1 (left): mouse wins if present, otherwise W/S.
    if (game.mouseY !== null) {
        game.leftY = game.mouseY
    } else {
        if (game.keys.has("w")) {
            game.leftY -= PLAYER_PADDLE_SPEED * dt
        }
        if (game.keys.has("s")) {
            game.leftY += PLAYER_PADDLE_SPEED * dt
        }
    }

    // Player 2 (right): arrows in 2P, bot in 1P.
    if (settings.mode === "2p") {
        if (game.keys.has("arrowup")) {
            game.rightY -= PLAYER_PADDLE_SPEED * dt
        }
        if (game.keys.has("arrowdown")) {
            game.rightY += PLAYER_PADDLE_SPEED * dt
        }
    } else {
        const bot = BOT_LEVELS[settings.difficulty]
        // Only chase when the ball is coming at the bot; drift home otherwise.
        const target = game.ball.vx > 0 ? game.ball.y + (Math.random() - 0.5) * bot.jitter : FIELD_HEIGHT / 2
        const delta = target - game.rightY
        const move = Math.sign(delta) * Math.min(Math.abs(delta), bot.speed * dt)
        game.rightY += move
    }

    const half = PADDLE_HEIGHT / 2
    game.leftY = Math.max(half, Math.min(FIELD_HEIGHT - half, game.leftY))
    game.rightY = Math.max(half, Math.min(FIELD_HEIGHT - half, game.rightY))

    // Ball
    const speed = ballSpeed(game, settings)
    const ball = game.ball
    ball.x += ball.vx * speed * dt
    ball.y += ball.vy * speed * dt

    if (ball.y < BALL_SIZE / 2 || ball.y > FIELD_HEIGHT - BALL_SIZE / 2) {
        ball.vy *= -1
        ball.y = Math.max(BALL_SIZE / 2, Math.min(FIELD_HEIGHT - BALL_SIZE / 2, ball.y))
        play?.wall()
    }

    const bounceOffPaddle = (paddleY: number): void => {
        // Hit position controls the return angle, like the arcade original.
        const offset = (ball.y - paddleY) / (PADDLE_HEIGHT / 2)
        const angle = offset * 0.75
        const direction = ball.vx > 0 ? -1 : 1
        ball.vx = Math.cos(angle) * direction
        ball.vy = Math.sin(angle)
        game.rallyHits += 1
        play?.paddle()
    }

    const leftEdge = PADDLE_MARGIN + PADDLE_WIDTH
    const rightEdge = FIELD_WIDTH - PADDLE_MARGIN - PADDLE_WIDTH
    if (
        ball.vx < 0 &&
        ball.x - BALL_SIZE / 2 <= leftEdge &&
        ball.x > PADDLE_MARGIN &&
        Math.abs(ball.y - game.leftY) <= PADDLE_HEIGHT / 2 + BALL_SIZE / 2
    ) {
        ball.x = leftEdge + BALL_SIZE / 2
        bounceOffPaddle(game.leftY)
    }
    if (
        ball.vx > 0 &&
        ball.x + BALL_SIZE / 2 >= rightEdge &&
        ball.x < FIELD_WIDTH - PADDLE_MARGIN &&
        Math.abs(ball.y - game.rightY) <= PADDLE_HEIGHT / 2 + BALL_SIZE / 2
    ) {
        ball.x = rightEdge - BALL_SIZE / 2
        bounceOffPaddle(game.rightY)
    }

    // Scoring
    if (ball.x < -BALL_SIZE || ball.x > FIELD_WIDTH + BALL_SIZE) {
        const leftScored = ball.x > FIELD_WIDTH
        if (leftScored) {
            game.leftScore += 1
        } else {
            game.rightScore += 1
        }
        settings.onScore?.({ left: game.leftScore, right: game.rightScore })
        play?.score()

        if (game.leftScore >= WIN_SCORE || game.rightScore >= WIN_SCORE) {
            game.over = true
            const winner = game.leftScore > game.rightScore ? "left" : "right"
            settings.onGameOver?.({
                winner,
                left: game.leftScore,
                right: game.rightScore,
                durationMs: performance.now() - game.startedAt,
            })
            play?.win()
        } else {
            serveBall(game, leftScored ? -1 : 1)
        }
    }

    settings.onStatus?.(`Ball speed ${Math.round(speed / 40)}`)
}

function draw(ctx: CanvasRenderingContext2D, game: GameState, settings: PongSettings): void {
    ctx.fillStyle = "#111112"
    ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT)

    // Center dashed line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.14)"
    ctx.lineWidth = 2
    ctx.setLineDash([8, 14])
    ctx.beginPath()
    ctx.moveTo(FIELD_WIDTH / 2, 14)
    ctx.lineTo(FIELD_WIDTH / 2, FIELD_HEIGHT - 14)
    ctx.stroke()
    ctx.setLineDash([])

    // Scores
    ctx.font = "600 56px 'IBM Plex Mono', monospace"
    ctx.textAlign = "center"
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)"
    ctx.fillText(String(game.leftScore).padStart(2, "0"), FIELD_WIDTH * 0.3, 82)
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)"
    ctx.fillText(String(game.rightScore).padStart(2, "0"), FIELD_WIDTH * 0.7, 82)
    ctx.font = "600 11px 'IBM Plex Mono', monospace"
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)"
    ctx.fillText("P L A Y E R", FIELD_WIDTH * 0.3, 34)
    ctx.fillText(settings.mode === "2p" ? "P L A Y E R  2" : "C P U", FIELD_WIDTH * 0.7, 34)

    // Paddles
    ctx.fillStyle = "#fafafa"
    ctx.fillRect(PADDLE_MARGIN, game.leftY - PADDLE_HEIGHT / 2, PADDLE_WIDTH, PADDLE_HEIGHT)
    ctx.fillStyle = "#8f8f96"
    ctx.fillRect(
        FIELD_WIDTH - PADDLE_MARGIN - PADDLE_WIDTH,
        game.rightY - PADDLE_HEIGHT / 2,
        PADDLE_WIDTH,
        PADDLE_HEIGHT,
    )

    // Ball with a short motion trail
    const ball = game.ball
    ctx.fillStyle = "rgba(255, 255, 255, 0.22)"
    ctx.beginPath()
    ctx.arc(ball.x - ball.vx * 14, ball.y - ball.vy * 14, BALL_SIZE / 2.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = "#ffffff"
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, BALL_SIZE / 2, 0, Math.PI * 2)
    ctx.fill()

    if (game.over) {
        ctx.fillStyle = "rgba(10, 10, 10, 0.82)"
        ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT)
        ctx.fillStyle = "#fafafa"
        ctx.font = "600 34px 'IBM Plex Mono', monospace"
        const winner =
            game.leftScore > game.rightScore
                ? "PLAYER WINS"
                : settings.mode === "2p"
                  ? "PLAYER TWO WINS"
                  : "CPU WINS"
        ctx.fillText(winner.split("").join(" "), FIELD_WIDTH / 2, FIELD_HEIGHT / 2 - 8)
        ctx.font = "600 12px 'IBM Plex Mono', monospace"
        ctx.fillStyle = "rgba(255, 255, 255, 0.45)"
        ctx.fillText("N E W  G A M E  T O  P L A Y  A G A I N", FIELD_WIDTH / 2, FIELD_HEIGHT / 2 + 34)
    } else if (settings.paused) {
        ctx.fillStyle = "rgba(10, 10, 10, 0.72)"
        ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT)
        ctx.fillStyle = "#fafafa"
        ctx.font = "600 26px 'IBM Plex Mono', monospace"
        ctx.fillText("P A U S E D", FIELD_WIDTH / 2, FIELD_HEIGHT / 2)
    }
}
