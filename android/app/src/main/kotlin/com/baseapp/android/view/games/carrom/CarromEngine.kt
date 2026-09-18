package com.baseapp.android.view.games.carrom

import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.exp
import kotlin.math.hypot
import kotlin.math.ln
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin
import kotlin.math.sqrt
import kotlin.random.Random

/**
 * Pure Kotlin port of the web carrom simulation
 * (`web/app/src/View/Games/Carrom/engine.ts`) so the exact same physics and
 * rules run on every platform and can be unit-tested on the JVM. No Android
 * or Compose imports here — rendering and input live in `CarromGameView`.
 *
 * Physics: exponential friction, elastic circle-circle and circle-wall
 * collisions, pocket capture, all on a fixed 1/240s substep so the sim is
 * deterministic regardless of frame rate. Rules: alternate turns, keep the
 * turn by pocketing your own color, queen requires cover, striker fouls,
 * board scoring, match to 25.
 *
 * Every constant below must stay in sync with the web engine; randomness
 * (only the bot's aim error) goes through the injected [random] so tests
 * are fully deterministic. Coordinates are board units (600x600, y growing
 * downward); the view scales the board to the device.
 */
class CarromEngine(
    private val random: Random = Random.Default,
) {
    /**
     * Bot aim/power gaussian error per level — the same table as the web
     * BOT_LEVELS so the bot plays identically on both apps.
     */
    enum class BotLevel(val aimStdDev: Double, val powerStdDev: Double) {
        EASY(0.1, 0.14),
        MEDIUM(0.05, 0.08),
        HARD(0.018, 0.04),
    }

    enum class PieceKind { WHITE, BLACK, QUEEN, STRIKER }

    enum class Phase { AIMING, ROLLING, BOARD_OVER, MATCH_OVER }

    /** Queen fate for one settled strike, if it was involved at all. */
    enum class QueenOutcome { COVERED, PENDING, RETURNED }

    /** One circular rigid body on the board. */
    data class Piece(
        val id: Int,
        val kind: PieceKind,
        var x: Double,
        var y: Double,
        var vx: Double,
        var vy: Double,
        val radius: Double,
        val mass: Double,
        /** false once the piece has been pocketed. */
        var onBoard: Boolean = true,
    )

    /** What one settled strike amounted to — drives messages and tests. */
    data class StrikeSummary(
        val shooter: Int,
        val foul: Boolean,
        val keptTurn: Boolean,
        val ownPocketed: Int,
        val opponentPocketed: Int,
        val queenOutcome: QueenOutcome?,
    )

    /** Discrete things that happened during one [step] call. */
    sealed class Event {
        data class Collision(val speed: Double) : Event()
        data class Wall(val speed: Double) : Event()
        data class Pocket(val piece: PieceKind) : Event()
        data class StrikeResolved(val summary: StrikeSummary) : Event()
        data class BoardOver(val winner: Int, val points: Int) : Event()
        data class MatchOver(val winner: Int) : Event()
    }

    var pieces: MutableList<Piece> = mutableListOf()
        private set
    var phase: Phase = Phase.AIMING
        private set
    var currentPlayer: Int = 0
        private set
    var matchScore: IntArray = intArrayOf(0, 0)
        private set

    /** Who covered the queen this board, if anyone. */
    var queenOwner: Int? = null
        private set

    /** Player who pocketed the queen and still owes a cover. */
    var queenPendingBy: Int? = null
        private set
    var lastSummary: StrikeSummary? = null
        private set
    var boardWinner: Int? = null
        private set
    var matchWinner: Int? = null
        private set

    private var accumulator = 0.0
    private var pocketedThisStrike: MutableList<PieceKind> = mutableListOf()
    private var strikerPocketedThisStrike = false

    val striker: Piece get() = pieces[STRIKER_ID]
    val queen: Piece get() = pieces[QUEEN_ID]

    init {
        newMatch()
    }

    /** How many coins of a kind have been pocketed so far this board. */
    fun pocketedCount(kind: PieceKind): Int =
        pieces.count { it.kind == kind && !it.onBoard }

    /** Full match reset: scores to zero, fresh board, player 0 breaks. */
    fun newMatch() {
        matchScore = intArrayOf(0, 0)
        matchWinner = null
        setupBoard(breaker = 0)
    }

    /** Rack the next board after a board ends; the board winner breaks. */
    fun nextBoard() {
        if (phase != Phase.BOARD_OVER) {
            return
        }
        setupBoard(breaker = boardWinner ?: 0)
    }

    /** Slide the striker along the current shooter's baseline (aiming only). */
    fun setStrikerX(x: Double) {
        if (phase != Phase.AIMING) {
            return
        }
        striker.x = x.coerceIn(BASELINE_MARGIN, BOARD_SIZE - BASELINE_MARGIN)
        striker.y = baselineY(currentPlayer)
    }

    /**
     * Flick the striker: direction (any length) plus power in [0, 1] mapped
     * onto [MIN_SHOT_SPEED, MAX_SHOT_SPEED]. Begins the rolling phase.
     */
    fun strike(dirX: Double, dirY: Double, power01: Double) {
        if (phase != Phase.AIMING) {
            return
        }
        val length = hypot(dirX, dirY)
        if (length < 1e-6) {
            return
        }
        val speed = MIN_SHOT_SPEED + power01.coerceIn(0.0, 1.0) * (MAX_SHOT_SPEED - MIN_SHOT_SPEED)
        striker.vx = dirX / length * speed
        striker.vy = dirY / length * speed
        pocketedThisStrike = mutableListOf()
        strikerPocketedThisStrike = false
        phase = Phase.ROLLING
    }

    /**
     * Advance the simulation by [dt] seconds of real time. Internally runs
     * fixed [PHYSICS_STEP] substeps (deterministic regardless of frame
     * rate) and returns every discrete event that occurred.
     */
    fun step(dt: Double): List<Event> {
        val events = mutableListOf<Event>()
        accumulator += min(dt, 0.1)
        while (accumulator >= PHYSICS_STEP) {
            accumulator -= PHYSICS_STEP
            substep(PHYSICS_STEP, events)
        }
        return events
    }

    /**
     * Plan and immediately play the bot's shot (call while phase is
     * [Phase.AIMING] and it is the bot's turn). Aim error shrinks with level.
     */
    fun botStrike(level: BotLevel) {
        if (phase != Phase.AIMING) {
            return
        }
        val (x, angle, power01) = planBotShot(level)
        setStrikerX(x)
        strike(cos(angle), sin(angle), power01)
    }

    // Test hooks

    /** Teleport a piece — sets up collision/pocket scenarios in tests. */
    internal fun placePiece(id: Int, x: Double, y: Double, vx: Double = 0.0, vy: Double = 0.0) {
        pieces[id].x = x
        pieces[id].y = y
        pieces[id].vx = vx
        pieces[id].vy = vy
    }

    /** Mark a piece as already pocketed, as if by earlier play this board. */
    internal fun pocketForTesting(id: Int) {
        pieces[id].onBoard = false
    }

    /** Force the rolling phase so tests can drive physics without a flick. */
    internal fun beginRollingForTesting() {
        pocketedThisStrike = mutableListOf()
        strikerPocketedThisStrike = false
        phase = Phase.ROLLING
    }

    /** Id of the first on-board piece of a kind (for test targeting). */
    internal fun firstPieceId(kind: PieceKind): Int? =
        pieces.firstOrNull { it.kind == kind && it.onBoard }?.id

    // Board setup

    private fun setupBoard(breaker: Int) {
        pieces = mutableListOf()
        queenOwner = null
        queenPendingBy = null
        lastSummary = null
        boardWinner = null
        currentPlayer = breaker
        phase = Phase.AIMING
        accumulator = 0.0
        pocketedThisStrike = mutableListOf()
        strikerPocketedThisStrike = false

        pieces.add(
            Piece(
                id = STRIKER_ID, kind = PieceKind.STRIKER,
                x = CENTER, y = baselineY(breaker), vx = 0.0, vy = 0.0,
                radius = STRIKER_RADIUS, mass = STRIKER_MASS,
            ),
        )
        pieces.add(makeCoin(QUEEN_ID, PieceKind.QUEEN, CENTER, CENTER))

        // Classic rack: queen center, inner ring of 6 (alternating, 3+3),
        // outer ring of 12 (alternating, 6+6) → 9 white + 9 black.
        var id = 2
        for (i in 0 until 6) {
            val angle = -PI / 2 + i * PI / 3
            val kind = if (i % 2 == 0) PieceKind.WHITE else PieceKind.BLACK
            pieces.add(
                makeCoin(id++, kind, CENTER + cos(angle) * RACK_SPACING, CENTER + sin(angle) * RACK_SPACING),
            )
        }
        for (i in 0 until 12) {
            val angle = -PI / 2 + PI / 12 + i * PI / 6
            val kind = if (i % 2 == 0) PieceKind.BLACK else PieceKind.WHITE
            pieces.add(
                makeCoin(
                    id++, kind,
                    CENTER + cos(angle) * RACK_SPACING * 2,
                    CENTER + sin(angle) * RACK_SPACING * 2,
                ),
            )
        }
    }

    private fun makeCoin(id: Int, kind: PieceKind, x: Double, y: Double): Piece =
        Piece(id = id, kind = kind, x = x, y = y, vx = 0.0, vy = 0.0, radius = COIN_RADIUS, mass = COIN_MASS)

    // Physics

    private fun substep(h: Double, events: MutableList<Event>) {
        // Integrate + exponential friction; snap to rest below REST_SPEED.
        val damping = exp(-FRICTION * h)
        for (piece in pieces) {
            if (!piece.onBoard) {
                continue
            }
            piece.x += piece.vx * h
            piece.y += piece.vy * h
            piece.vx *= damping
            piece.vy *= damping
            if (hypot(piece.vx, piece.vy) < REST_SPEED) {
                piece.vx = 0.0
                piece.vy = 0.0
            }
        }

        // Elastic circle-circle collisions with positional correction.
        for (i in pieces.indices) {
            if (!pieces[i].onBoard) {
                continue
            }
            for (j in i + 1 until pieces.size) {
                if (pieces[j].onBoard) {
                    collide(pieces[i], pieces[j], events)
                }
            }
        }

        // Walls (axis-aligned, energy scaled by RESTITUTION_WALL).
        for (piece in pieces) {
            if (!piece.onBoard) {
                continue
            }
            val r = piece.radius
            if (piece.x < r) {
                piece.x = r
                if (piece.vx < 0) {
                    events.add(Event.Wall(abs(piece.vx)))
                    piece.vx = -piece.vx * RESTITUTION_WALL
                }
            } else if (piece.x > BOARD_SIZE - r) {
                piece.x = BOARD_SIZE - r
                if (piece.vx > 0) {
                    events.add(Event.Wall(piece.vx))
                    piece.vx = -piece.vx * RESTITUTION_WALL
                }
            }
            if (piece.y < r) {
                piece.y = r
                if (piece.vy < 0) {
                    events.add(Event.Wall(abs(piece.vy)))
                    piece.vy = -piece.vy * RESTITUTION_WALL
                }
            } else if (piece.y > BOARD_SIZE - r) {
                piece.y = BOARD_SIZE - r
                if (piece.vy > 0) {
                    events.add(Event.Wall(piece.vy))
                    piece.vy = -piece.vy * RESTITUTION_WALL
                }
            }
        }

        // Pocket capture: a piece whose center enters a pocket circle drops.
        for (piece in pieces) {
            if (!piece.onBoard) {
                continue
            }
            for ((pocketX, pocketY) in POCKETS) {
                if (hypot(piece.x - pocketX, piece.y - pocketY) < POCKET_RADIUS) {
                    piece.onBoard = false
                    piece.vx = 0.0
                    piece.vy = 0.0
                    if (piece.kind == PieceKind.STRIKER) {
                        strikerPocketedThisStrike = true
                    } else {
                        pocketedThisStrike.add(piece.kind)
                    }
                    events.add(Event.Pocket(piece.kind))
                    break
                }
            }
        }

        // A strike is over once every remaining body is at rest.
        if (phase == Phase.ROLLING) {
            val settled = pieces.all { !it.onBoard || (it.vx == 0.0 && it.vy == 0.0) }
            if (settled) {
                resolveStrike(events)
            }
        }
    }

    private fun collide(a: Piece, b: Piece, events: MutableList<Event>) {
        val dx = b.x - a.x
        val dy = b.y - a.y
        val dist = hypot(dx, dy)
        val minDist = a.radius + b.radius
        if (dist >= minDist || dist < 1e-9) {
            return
        }
        val nx = dx / dist
        val ny = dy / dist
        val invA = 1 / a.mass
        val invB = 1 / b.mass
        val invTotal = invA + invB

        // Separate the overlap in proportion to inverse mass.
        val overlap = minDist - dist
        a.x -= nx * overlap * (invA / invTotal)
        a.y -= ny * overlap * (invA / invTotal)
        b.x += nx * overlap * (invB / invTotal)
        b.y += ny * overlap * (invB / invTotal)

        // Impulse along the normal (bodies are frictionless disks).
        val relVel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny
        if (relVel >= 0) {
            return
        }
        val impulse = -(1 + RESTITUTION_BODY) * relVel / invTotal
        a.vx -= impulse * invA * nx
        a.vy -= impulse * invA * ny
        b.vx += impulse * invB * nx
        b.vy += impulse * invB * ny
        events.add(Event.Collision(abs(relVel)))
    }

    // Rules

    private fun resolveStrike(events: MutableList<Event>) {
        val shooter = currentPlayer
        val own = colorOf(shooter)
        val opponent = colorOf(1 - shooter)
        val ownPocketed = pocketedThisStrike.count { it == own }
        val opponentPocketed = pocketedThisStrike.count { it == opponent }
        val queenPocketed = pocketedThisStrike.contains(PieceKind.QUEEN)
        val foul = strikerPocketedThisStrike

        var queenOutcome: QueenOutcome? = null
        var keptTurn = false

        if (foul) {
            // Foul: one of the shooter's pocketed coins returns to center,
            // any queen involvement is undone, and the turn passes.
            returnCoinToBoard(own)
            if (queenPocketed || queenPendingBy == shooter) {
                respotQueen()
                queenPendingBy = null
                queenOutcome = QueenOutcome.RETURNED
            }
        } else if (queenPocketed) {
            if (ownPocketed > 0) {
                queenOwner = shooter
                queenOutcome = QueenOutcome.COVERED
            } else {
                // Cover owed on the shooter's next strike.
                queenPendingBy = shooter
                queenOutcome = QueenOutcome.PENDING
            }
            // Taking the queen always earns another strike (needed to cover).
            keptTurn = true
        } else if (queenPendingBy == shooter) {
            if (ownPocketed > 0) {
                queenOwner = shooter
                queenOutcome = QueenOutcome.COVERED
            } else {
                respotQueen()
                queenOutcome = QueenOutcome.RETURNED
            }
            queenPendingBy = null
            keptTurn = ownPocketed > 0
        } else {
            keptTurn = ownPocketed > 0
        }

        val summary = StrikeSummary(
            shooter = shooter,
            foul = foul,
            keptTurn = keptTurn && !foul,
            ownPocketed = ownPocketed,
            opponentPocketed = opponentPocketed,
            queenOutcome = queenOutcome,
        )
        lastSummary = summary
        events.add(Event.StrikeResolved(summary))

        // Win check for both players (a strike can clear either color).
        for (player in intArrayOf(shooter, 1 - shooter)) {
            if (pocketedCount(colorOf(player)) == COINS_PER_PLAYER) {
                // A pending queen at the moment of clearing counts as uncovered.
                if (queenPendingBy == player) {
                    respotQueen()
                    queenPendingBy = null
                }
                endBoard(player, events)
                return
            }
        }

        if (!summary.keptTurn) {
            currentPlayer = 1 - shooter
        }
        respotStriker()
        phase = Phase.AIMING
        pocketedThisStrike = mutableListOf()
        strikerPocketedThisStrike = false
    }

    private fun endBoard(winner: Int, events: MutableList<Event>) {
        val loserColor = colorOf(1 - winner)
        val remaining = COINS_PER_PLAYER - pocketedCount(loserColor)
        val points = remaining + if (queenOwner == winner) QUEEN_POINTS else 0
        matchScore[winner] += points
        boardWinner = winner
        events.add(Event.BoardOver(winner, points))
        if (matchScore[winner] >= MATCH_TARGET) {
            matchWinner = winner
            phase = Phase.MATCH_OVER
            events.add(Event.MatchOver(winner))
        } else {
            phase = Phase.BOARD_OVER
        }
    }

    /** Foul penalty: put one of the shooter's pocketed coins back near center. */
    private fun returnCoinToBoard(kind: PieceKind) {
        val coin = pieces.firstOrNull { it.kind == kind && !it.onBoard } ?: return
        val (x, y) = findFreeSpot()
        coin.x = x
        coin.y = y
        coin.vx = 0.0
        coin.vy = 0.0
        coin.onBoard = true
    }

    private fun respotQueen() {
        val (x, y) = findFreeSpot()
        queen.x = x
        queen.y = y
        queen.vx = 0.0
        queen.vy = 0.0
        queen.onBoard = true
    }

    private fun respotStriker() {
        striker.x = CENTER
        striker.y = baselineY(currentPlayer)
        striker.vx = 0.0
        striker.vy = 0.0
        striker.onBoard = true
    }

    /** Center if free, else deterministic concentric-ring search outward. */
    private fun findFreeSpot(): Pair<Double, Double> {
        fun isFree(x: Double, y: Double): Boolean = pieces.all { piece ->
            !piece.onBoard || hypot(piece.x - x, piece.y - y) > piece.radius + COIN_RADIUS + 1
        }
        if (isFree(CENTER, CENTER)) {
            return CENTER to CENTER
        }
        for (ring in 1..8) {
            val radius = RACK_SPACING * ring
            for (i in 0 until 12) {
                val angle = i * PI / 6
                val x = CENTER + cos(angle) * radius
                val y = CENTER + sin(angle) * radius
                if (isFree(x, y)) {
                    return x to y
                }
            }
        }
        return CENTER to CENTER
    }

    // Bot

    /**
     * Pick the best (target coin, pocket, baseline position) by simple
     * line-of-sight scoring, then perturb angle and power by the level's
     * gaussian error — the same planner as the web engine.
     */
    private fun planBotShot(level: BotLevel): Triple<Double, Double, Double> {
        val shooter = currentPlayer
        val own = colorOf(shooter)
        val baseY = baselineY(shooter)
        val candidates = pieces.filter { it.onBoard && (it.kind == own || it.kind == PieceKind.QUEEN) }

        var bestScore = Double.NEGATIVE_INFINITY
        var bestX = 0.0
        var bestAngle = 0.0
        var bestTravel = 0.0
        var found = false

        for (coin in candidates) {
            for ((pocketX, pocketY) in POCKETS) {
                val toPocketX = pocketX - coin.x
                val toPocketY = pocketY - coin.y
                val pocketDist = hypot(toPocketX, toPocketY)
                if (pocketDist < 1e-6) {
                    continue
                }
                val px = toPocketX / pocketDist
                val py = toPocketY / pocketDist
                // Ghost position: where the striker's center must be at
                // impact to knock the coin straight at the pocket.
                val ghostX = coin.x - px * (STRIKER_RADIUS + coin.radius)
                val ghostY = coin.y - py * (STRIKER_RADIUS + coin.radius)
                if (pathBlocked(coin.x, coin.y, pocketX, pocketY, coin.radius - 2, intArrayOf(coin.id, STRIKER_ID))) {
                    continue
                }
                for (sample in 0..14) {
                    val x = BASELINE_MARGIN + (BOARD_SIZE - 2 * BASELINE_MARGIN) * sample / 14
                    val shotX = ghostX - x
                    val shotY = ghostY - baseY
                    val shotDist = hypot(shotX, shotY)
                    if (shotDist < STRIKER_RADIUS) {
                        continue
                    }
                    // Alignment: the striker must push the coin pocketward.
                    val align = shotX / shotDist * px + shotY / shotDist * py
                    if (align < 0.3) {
                        continue
                    }
                    if (pathBlocked(x, baseY, ghostX, ghostY, STRIKER_RADIUS - 1, intArrayOf(coin.id, STRIKER_ID))) {
                        continue
                    }
                    val travel = shotDist + pocketDist
                    val queenBonus =
                        if (coin.kind == PieceKind.QUEEN && pocketedCount(own) > 0) 0.3 else 0.0
                    val score = align * 2 - travel / (BOARD_SIZE * 2) + queenBonus
                    if (!found || score > bestScore) {
                        found = true
                        bestScore = score
                        bestX = x
                        bestAngle = atan2(shotY, shotX)
                        bestTravel = travel
                    }
                }
            }
        }

        if (found) {
            val angle = bestAngle + gaussian() * level.aimStdDev
            val power01 = max(
                0.25,
                min(1.0, (260 + bestTravel * 1.9) / MAX_SHOT_SPEED + gaussian() * level.powerStdDev),
            )
            return Triple(bestX, angle, power01)
        }

        // Fallback: smash toward the nearest candidate (or board center).
        val target = candidates.minByOrNull { hypot(it.x - CENTER, it.y - baseY) }
        val tx = target?.x ?: CENTER
        val ty = target?.y ?: CENTER
        val angle = atan2(ty - baseY, tx - CENTER) + gaussian() * level.aimStdDev
        return Triple(CENTER, angle, 0.7)
    }

    /** Segment sweep test: does a disk of [radius] moving a→b hit any piece? */
    private fun pathBlocked(
        ax: Double,
        ay: Double,
        bx: Double,
        by: Double,
        radius: Double,
        excludeIds: IntArray,
    ): Boolean {
        val abx = bx - ax
        val aby = by - ay
        val lengthSq = abx * abx + aby * aby
        for (piece in pieces) {
            if (!piece.onBoard || excludeIds.contains(piece.id)) {
                continue
            }
            val t = if (lengthSq == 0.0) {
                0.0
            } else {
                (((piece.x - ax) * abx + (piece.y - ay) * aby) / lengthSq).coerceIn(0.0, 1.0)
            }
            val cx = ax + abx * t
            val cy = ay + aby * t
            if (hypot(piece.x - cx, piece.y - cy) < radius + piece.radius) {
                return true
            }
        }
        return false
    }

    /** Standard normal via Box-Muller on the injected RNG (two draws). */
    private fun gaussian(): Double {
        val u1 = 1 - random.nextDouble()
        val u2 = random.nextDouble()
        return sqrt(-2 * ln(u1)) * cos(2 * PI * u2)
    }

    companion object {
        // Geometry & physics — must stay in sync with the web constants.
        const val BOARD_SIZE = 600.0
        const val COIN_RADIUS = 12.0
        const val STRIKER_RADIUS = 16.0
        const val POCKET_RADIUS = 24.0
        const val POCKET_INSET = 30.0

        /** Exponential velocity damping coefficient (per second). */
        const val FRICTION = 1.8
        const val RESTITUTION_BODY = 0.92
        const val RESTITUTION_WALL = 0.78

        /** Below this speed (units/s) a body snaps to rest. */
        const val REST_SPEED = 6.0
        const val COIN_MASS = 1.0
        const val STRIKER_MASS = 1.5
        const val MAX_SHOT_SPEED = 1500.0
        const val MIN_SHOT_SPEED = 90.0
        const val BASELINE_OFFSET = 90.0
        const val BASELINE_MARGIN = 110.0
        const val PHYSICS_STEP = 1.0 / 240.0
        const val COINS_PER_PLAYER = 9
        const val QUEEN_POINTS = 3
        const val MATCH_TARGET = 25

        const val STRIKER_ID = 0
        const val QUEEN_ID = 1
        const val CENTER = BOARD_SIZE / 2

        /** Coin spacing in the opening rack, slightly over one diameter. */
        const val RACK_SPACING = 24.6

        /** The four corner pocket centers, in board units. */
        val POCKETS: List<Pair<Double, Double>> = listOf(
            POCKET_INSET to POCKET_INSET,
            BOARD_SIZE - POCKET_INSET to POCKET_INSET,
            POCKET_INSET to BOARD_SIZE - POCKET_INSET,
            BOARD_SIZE - POCKET_INSET to BOARD_SIZE - POCKET_INSET,
        )

        /** Player 0 flicks white from the bottom baseline; player 1 black from the top. */
        fun colorOf(player: Int): PieceKind = if (player == 0) PieceKind.WHITE else PieceKind.BLACK

        /** The y coordinate of a player's striker baseline. */
        fun baselineY(player: Int): Double =
            if (player == 0) BOARD_SIZE - BASELINE_OFFSET else BASELINE_OFFSET
    }
}
