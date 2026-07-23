import React, { useEffect, useRef } from "react"
import {
    BASELINE_MARGIN,
    BOARD_SIZE,
    BotLevel,
    CarromEngine,
    CarromMode,
    CarromPiece,
    PlayerIndex,
    POCKET_RADIUS,
    POCKETS,
    Point,
    STRIKER_RADIUS,
    StrikeSummary,
    baselineY,
} from "./engine"
import { sounds } from "./audio"
import * as styles from "./CarromPage.styles.css"

/** Pull-back distance (board units) that maps to a full-power flick. */
const MAX_PULL = 220
/** The bot "thinks" for this long before flicking, so turns read naturally. */
const BOT_DELAY_MS = 900
/** Pause on the board-over scrim before the next board racks itself. */
const NEXT_BOARD_DELAY_MS = 2600

/** Everything the page chrome needs to render trays, turn and score UI. */
export interface CarromHud {
    currentPlayer: PlayerIndex
    phase: string
    matchScore: [number, number]
    whitePocketed: number
    blackPocketed: number
    queenState: "onBoard" | "pendingCover" | "coveredBy0" | "coveredBy1"
}

interface CarromSettings {
    mode: CarromMode
    botLevel: BotLevel
    soundOn: boolean
    onHud?: (hud: CarromHud) => void
    onMessage?: (message: string) => void
    onBoardOver?: (winner: PlayerIndex, points: number) => void
    onMatchOver?: (winner: PlayerIndex) => void
}

interface AimState {
    /** Current drag point in board units (the finger pulling the sling back). */
    dragX: number
    dragY: number
}

interface SessionState {
    engine: CarromEngine
    aim: AimState | null
    botStrikeAt: number | null
    nextBoardAt: number | null
}

function playerName(player: PlayerIndex, mode: CarromMode): string {
    if (player === 0) {
        return "Player 1"
    }
    return mode === "bot" ? "Bot" : "Player 2"
}

/**
 * The board. Runs its own requestAnimationFrame loop over the pure
 * `CarromEngine` (fixed-timestep physics inside), renders everything on a
 * square canvas, and handles slingshot input: drag near the striker to aim
 * and set power, press elsewhere on the baseline to reposition the striker.
 * The parent owns mode/level/sound settings and receives HUD callbacks.
 */
export default function CarromGame(props: CarromSettings & { resetToken: number }): React.ReactElement {
    const { resetToken, ...settings } = props
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const sessionRef = useRef<SessionState | null>(null)
    const settingsRef = useRef<CarromSettings>(settings)
    settingsRef.current = settings

    // Full match reset whenever resetToken changes (New Match button).
    useEffect(() => {
        sessionRef.current = {
            engine: new CarromEngine(),
            aim: null,
            botStrikeAt: null,
            nextBoardAt: null,
        }
        settingsRef.current.onMessage?.("Player 1 breaks. Drag back from the striker to flick.")
        publishHud(sessionRef.current.engine, settingsRef.current)
    }, [resetToken])

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext("2d")
        if (!canvas || !ctx) {
            return
        }
        let frameId: number
        let lastTime = performance.now()

        const tick = (now: number): void => {
            frameId = requestAnimationFrame(tick)
            const dt = Math.min(0.05, (now - lastTime) / 1000)
            lastTime = now
            const session = sessionRef.current
            if (!session) {
                return
            }
            const config = settingsRef.current
            runBotAndBoardFlow(session, config, now)
            const events = session.engine.step(dt)
            for (const event of events) {
                handleEvent(event, session, config, now)
            }
            draw(ctx, session, config)
        }
        frameId = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frameId)
    }, [])

    const boardPoint = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
        const rect = event.currentTarget.getBoundingClientRect()
        return {
            x: ((event.clientX - rect.left) / rect.width) * BOARD_SIZE,
            y: ((event.clientY - rect.top) / rect.height) * BOARD_SIZE,
        }
    }

    const humanTurn = (session: SessionState): boolean =>
        session.engine.phase === "aiming" &&
        (settingsRef.current.mode === "2p" || session.engine.currentPlayer === 0)

    const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>): void => {
        const session = sessionRef.current
        if (!session || !humanTurn(session)) {
            return
        }
        event.currentTarget.setPointerCapture(event.pointerId)
        const point = boardPoint(event)
        const striker = session.engine.striker
        if (Math.hypot(point.x - striker.x, point.y - striker.y) <= STRIKER_RADIUS * 2.4) {
            session.aim = { dragX: point.x, dragY: point.y }
        } else if (Math.abs(point.y - baselineY(session.engine.currentPlayer)) < 44) {
            // Press along the baseline repositions the striker before the flick.
            session.engine.setStrikerX(point.x)
        }
    }

    const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>): void => {
        const session = sessionRef.current
        if (!session?.aim) {
            return
        }
        const point = boardPoint(event)
        session.aim.dragX = point.x
        session.aim.dragY = point.y
    }

    const handlePointerUp = (): void => {
        const session = sessionRef.current
        if (!session?.aim || !humanTurn(session)) {
            if (session) {
                session.aim = null
            }
            return
        }
        const { dirX, dirY, power } = aimVector(session)
        session.aim = null
        if (power > 0.06) {
            session.engine.strike(dirX, dirY, power)
        }
    }

    return (
        <canvas
            ref={canvasRef}
            width={BOARD_SIZE}
            height={BOARD_SIZE}
            className={styles.board}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        />
    )
}

/** Slingshot math: pulling away from the striker shoots the opposite way. */
function aimVector(session: SessionState): { dirX: number; dirY: number; power: number } {
    const striker = session.engine.striker
    const aim = session.aim
    if (!aim) {
        return { dirX: 0, dirY: 0, power: 0 }
    }
    const pullX = aim.dragX - striker.x
    const pullY = aim.dragY - striker.y
    const pull = Math.hypot(pullX, pullY)
    return {
        dirX: -pullX,
        dirY: -pullY,
        power: Math.min(1, pull / MAX_PULL),
    }
}

function publishHud(engine: CarromEngine, config: CarromSettings): void {
    let queenState: CarromHud["queenState"] = "onBoard"
    if (engine.queenOwner === 0) {
        queenState = "coveredBy0"
    } else if (engine.queenOwner === 1) {
        queenState = "coveredBy1"
    } else if (engine.queenPendingBy !== null) {
        queenState = "pendingCover"
    }
    config.onHud?.({
        currentPlayer: engine.currentPlayer,
        phase: engine.phase,
        matchScore: [engine.matchScore[0], engine.matchScore[1]],
        whitePocketed: engine.pocketedCount("white"),
        blackPocketed: engine.pocketedCount("black"),
        queenState,
    })
}

/** Schedules the bot's flick and auto-racks the next board after a win. */
function runBotAndBoardFlow(session: SessionState, config: CarromSettings, now: number): void {
    const engine = session.engine
    if (config.mode === "bot" && engine.phase === "aiming" && engine.currentPlayer === 1) {
        if (session.botStrikeAt === null) {
            session.botStrikeAt = now + BOT_DELAY_MS
        } else if (now >= session.botStrikeAt) {
            session.botStrikeAt = null
            engine.botStrike(config.botLevel)
        }
    } else {
        session.botStrikeAt = null
    }

    if (engine.phase === "boardOver") {
        if (session.nextBoardAt === null) {
            session.nextBoardAt = now + NEXT_BOARD_DELAY_MS
        } else if (now >= session.nextBoardAt) {
            session.nextBoardAt = null
            engine.nextBoard()
            config.onMessage?.(`New board. ${playerName(engine.currentPlayer, config.mode)} breaks.`)
            publishHud(engine, config)
        }
    } else {
        session.nextBoardAt = null
    }
}

function summaryMessage(summary: StrikeSummary, config: CarromSettings): string {
    const shooter = playerName(summary.shooter, config.mode)
    const next = playerName((1 - summary.shooter) as PlayerIndex, config.mode)
    if (summary.foul) {
        return `Foul! ${shooter} sank the striker — a coin returns. ${next} to play.`
    }
    if (summary.queenOutcome === "covered") {
        return `${shooter} covered the queen! ${summary.keptTurn ? `${shooter} shoots again.` : `${next} to play.`}`
    }
    if (summary.queenOutcome === "pending") {
        return `${shooter} pocketed the queen — cover it on the next strike!`
    }
    if (summary.queenOutcome === "returned") {
        return `No cover — the queen returns to center. ${next} to play.`
    }
    if (summary.keptTurn) {
        return `${shooter} pockets ${summary.ownPocketed} — shoots again.`
    }
    return `${next} to play.`
}

function handleEvent(
    event: ReturnType<CarromEngine["step"]>[number],
    session: SessionState,
    config: CarromSettings,
    now: number,
): void {
    const play = config.soundOn ? sounds : null
    switch (event.type) {
        case "collision":
            play?.click(Math.min(1, event.speed / 900))
            break
        case "wall":
            play?.cushion(Math.min(1, event.speed / 900))
            break
        case "pocket":
            if (event.piece === "striker") {
                play?.foul()
            } else {
                play?.pocket()
            }
            break
        case "strikeResolved":
            config.onMessage?.(summaryMessage(event.summary, config))
            publishHud(session.engine, config)
            break
        case "boardOver":
            session.nextBoardAt = now + NEXT_BOARD_DELAY_MS
            play?.win()
            config.onBoardOver?.(event.winner, event.points)
            config.onMessage?.(
                `${playerName(event.winner, config.mode)} clears the board for ${event.points} point${event.points === 1 ? "" : "s"}!`,
            )
            publishHud(session.engine, config)
            break
        case "matchOver":
            config.onMatchOver?.(event.winner)
            config.onMessage?.(`${playerName(event.winner, config.mode)} wins the match!`)
            publishHud(session.engine, config)
            break
    }
}

// MARK: Rendering

const WOOD_LIGHT = "#e8c48a"
const WOOD_MID = "#dcb271"
const WOOD_LINE = "#8a5a28"
const FRAME = "#5b3a1c"
const POCKET_COLOR = "#241408"
const WHITE_COIN = "#f5e9d0"

function draw(ctx: CanvasRenderingContext2D, session: SessionState, config: CarromSettings): void {
    const engine = session.engine
    drawBoard(ctx)
    for (const pocket of POCKETS) {
        ctx.fillStyle = POCKET_COLOR
        ctx.beginPath()
        ctx.arc(pocket.x, pocket.y, POCKET_RADIUS, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = "rgba(0, 0, 0, 0.35)"
        ctx.lineWidth = 3
        ctx.stroke()
    }

    for (const piece of engine.pieces) {
        if (piece.onBoard && piece.kind !== "striker") {
            drawCoin(ctx, piece)
        }
    }
    if (engine.striker.onBoard && engine.phase !== "boardOver" && engine.phase !== "matchOver") {
        drawStriker(ctx, engine.striker)
    }

    if (engine.phase === "aiming") {
        drawBaselineHighlight(ctx, engine.currentPlayer)
        if (session.aim) {
            drawAimOverlay(ctx, session)
        }
    }

    if (engine.phase === "boardOver" || engine.phase === "matchOver") {
        drawScrim(ctx, engine, config)
    }
}

/** Warm plywood field, frame, rosettes, center circles and baselines. */
function drawBoard(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createRadialGradient(
        BOARD_SIZE / 2,
        BOARD_SIZE / 2,
        60,
        BOARD_SIZE / 2,
        BOARD_SIZE / 2,
        BOARD_SIZE * 0.75,
    )
    gradient.addColorStop(0, WOOD_LIGHT)
    gradient.addColorStop(1, WOOD_MID)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE)

    // Subtle horizontal grain.
    ctx.strokeStyle = "rgba(138, 90, 40, 0.08)"
    ctx.lineWidth = 1
    for (let y = 14; y < BOARD_SIZE; y += 22) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.bezierCurveTo(BOARD_SIZE * 0.3, y + 4, BOARD_SIZE * 0.7, y - 4, BOARD_SIZE, y)
        ctx.stroke()
    }

    // Frame edge.
    ctx.strokeStyle = FRAME
    ctx.lineWidth = 10
    ctx.strokeRect(5, 5, BOARD_SIZE - 10, BOARD_SIZE - 10)

    // Center circles and rosette.
    const center = BOARD_SIZE / 2
    ctx.strokeStyle = WOOD_LINE
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(center, center, 78, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(center, center, 16, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = "rgba(138, 90, 40, 0.25)"
    for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4
        ctx.beginPath()
        ctx.ellipse(
            center + Math.cos(angle) * 46,
            center + Math.sin(angle) * 46,
            18,
            7,
            angle,
            0,
            Math.PI * 2,
        )
        ctx.fill()
    }

    // Diagonal arrows from each pocket toward the center rosette.
    ctx.strokeStyle = WOOD_LINE
    ctx.lineWidth = 2
    for (const pocket of POCKETS) {
        const dirX = Math.sign(center - pocket.x)
        const dirY = Math.sign(center - pocket.y)
        ctx.beginPath()
        ctx.moveTo(pocket.x + dirX * 44, pocket.y + dirY * 44)
        ctx.lineTo(pocket.x + dirX * 150, pocket.y + dirY * 150)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(pocket.x + dirX * 160, pocket.y + dirY * 160, 10, 0, Math.PI * 2)
        ctx.stroke()
    }

    // Baselines (double rails with end rings) on all four sides. Only the
    // top and bottom rails are playable; the side pair is decorative, as on
    // a real board.
    const railGap = 9
    for (const y of [baselineY(0), baselineY(1)]) {
        for (const offset of [-railGap, railGap]) {
            ctx.beginPath()
            ctx.moveTo(BASELINE_MARGIN, y + offset)
            ctx.lineTo(BOARD_SIZE - BASELINE_MARGIN, y + offset)
            ctx.stroke()
        }
        for (const x of [BASELINE_MARGIN, BOARD_SIZE - BASELINE_MARGIN]) {
            ctx.beginPath()
            ctx.arc(x, y, railGap + 4, 0, Math.PI * 2)
            ctx.stroke()
        }
    }
    for (const x of [baselineY(1), baselineY(0)]) {
        for (const offset of [-railGap, railGap]) {
            ctx.beginPath()
            ctx.moveTo(x + offset, BASELINE_MARGIN)
            ctx.lineTo(x + offset, BOARD_SIZE - BASELINE_MARGIN)
            ctx.stroke()
        }
        for (const y of [BASELINE_MARGIN, BOARD_SIZE - BASELINE_MARGIN]) {
            ctx.beginPath()
            ctx.arc(x, y, railGap + 4, 0, Math.PI * 2)
            ctx.stroke()
        }
    }
}

function drawCoin(ctx: CanvasRenderingContext2D, piece: CarromPiece): void {
    const palette =
        piece.kind === "queen"
            ? { fill: "#b3232a", rim: "#7d1218", dot: "#e8b04b" }
            : piece.kind === "white"
              ? { fill: WHITE_COIN, rim: "#c8b48d", dot: "#a58f63" }
              : { fill: "#3d2a1e", rim: "#241811", dot: "#7a5c40" }
    ctx.fillStyle = "rgba(0, 0, 0, 0.22)"
    ctx.beginPath()
    ctx.arc(piece.x + 2, piece.y + 3, piece.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = palette.fill
    ctx.beginPath()
    ctx.arc(piece.x, piece.y, piece.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = palette.rim
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.strokeStyle = palette.dot
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(piece.x, piece.y, piece.radius * 0.55, 0, Math.PI * 2)
    ctx.stroke()
}

function drawStriker(ctx: CanvasRenderingContext2D, striker: CarromPiece): void {
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)"
    ctx.beginPath()
    ctx.arc(striker.x + 2, striker.y + 4, striker.radius, 0, Math.PI * 2)
    ctx.fill()
    const gradient = ctx.createRadialGradient(
        striker.x - 5,
        striker.y - 5,
        2,
        striker.x,
        striker.y,
        striker.radius,
    )
    gradient.addColorStop(0, "#fdf7ec")
    gradient.addColorStop(1, "#d8cdb4")
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(striker.x, striker.y, striker.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = "#4a6fa5"
    ctx.lineWidth = 2.5
    ctx.stroke()
    // Six-point star inlay.
    ctx.strokeStyle = "#4a6fa5"
    ctx.lineWidth = 1.4
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3
        ctx.moveTo(striker.x, striker.y)
        ctx.lineTo(
            striker.x + Math.cos(angle) * striker.radius * 0.7,
            striker.y + Math.sin(angle) * striker.radius * 0.7,
        )
    }
    ctx.stroke()
}

function drawBaselineHighlight(ctx: CanvasRenderingContext2D, player: PlayerIndex): void {
    const y = baselineY(player)
    ctx.fillStyle = "rgba(74, 111, 165, 0.12)"
    ctx.fillRect(BASELINE_MARGIN - 14, y - 22, BOARD_SIZE - 2 * (BASELINE_MARGIN - 14), 44)
}

/** Slingshot band, aim guide for the first bounce, and the power meter. */
function drawAimOverlay(ctx: CanvasRenderingContext2D, session: SessionState): void {
    const striker = session.engine.striker
    const aim = session.aim
    if (!aim) {
        return
    }
    const { dirX, dirY, power } = aimVector(session)
    if (power <= 0) {
        return
    }

    // Elastic band back to the finger.
    ctx.strokeStyle = "rgba(60, 40, 20, 0.55)"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(striker.x, striker.y)
    ctx.lineTo(aim.dragX, aim.dragY)
    ctx.stroke()

    // Guide to the first obstacle, reflecting once off a wall.
    const guide = session.engine.computeAimGuide(dirX, dirY)
    if (guide.length >= 2) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.75)"
        ctx.lineWidth = 2
        ctx.setLineDash([8, 8])
        ctx.beginPath()
        ctx.moveTo(guide[0].x, guide[0].y)
        for (const point of guide.slice(1)) {
            ctx.lineTo(point.x, point.y)
        }
        ctx.stroke()
        ctx.setLineDash([])
        const tip = guide[guide.length - 1]
        ctx.fillStyle = "rgba(255, 255, 255, 0.75)"
        ctx.beginPath()
        ctx.arc(tip.x, tip.y, 4, 0, Math.PI * 2)
        ctx.fill()
    }

    // Power arc around the striker.
    ctx.strokeStyle = power > 0.85 ? "#c0392b" : "#2e7d32"
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.arc(striker.x, striker.y, STRIKER_RADIUS + 8, -Math.PI / 2, -Math.PI / 2 + power * Math.PI * 2)
    ctx.stroke()
}

function drawScrim(ctx: CanvasRenderingContext2D, engine: CarromEngine, config: CarromSettings): void {
    ctx.fillStyle = "rgba(36, 20, 8, 0.62)"
    ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE)
    ctx.fillStyle = "#f5e9d0"
    ctx.textAlign = "center"
    ctx.font = "700 34px Georgia, serif"
    const winner = engine.matchWinner ?? engine.boardWinner ?? 0
    const title =
        engine.phase === "matchOver"
            ? `${playerName(winner, config.mode).toUpperCase()} WINS THE MATCH!`
            : `${playerName(winner, config.mode).toUpperCase()} TAKES THE BOARD`
    ctx.fillText(title, BOARD_SIZE / 2, BOARD_SIZE / 2 - 12)
    ctx.font = "600 18px Georgia, serif"
    ctx.fillText(
        engine.phase === "matchOver"
            ? `Final ${engine.matchScore[0]} — ${engine.matchScore[1]}. Press New Match.`
            : `Score ${engine.matchScore[0]} — ${engine.matchScore[1]}. Racking the next board…`,
        BOARD_SIZE / 2,
        BOARD_SIZE / 2 + 26,
    )
}
