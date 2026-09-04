package com.baseapp.android.view.games.code

/**
 * Pure Kotlin port of the web CodeBot game logic
 * (`web/app/src/View/Games/Code/levels.ts` + `interpreter.ts`) so the exact
 * same puzzles and rules run on every platform and can be unit-tested on the
 * JVM. No Android or Compose imports here — rendering, editing, and input
 * live in `CodeGameView`.
 *
 * Levels are plain data and the interpreter turns a level + program into the
 * complete step-by-step trace, so the view just replays steps on a timer.
 */

/**
 * Direction the robot faces. Grid coordinates match the web game: x grows
 * right, y grows down, so NORTH points toward row 0. [dx]/[dy] are the tile
 * delta of one MOVE (web `DELTAS`).
 */
enum class CodeFacing(val dx: Int, val dy: Int) {
    NORTH(0, -1),
    EAST(1, 0),
    SOUTH(0, 1),
    WEST(-1, 0);

    /** Facing after a TURN LEFT (web `LEFT_OF`). */
    val turnedLeft: CodeFacing
        get() = when (this) {
            NORTH -> WEST
            WEST -> SOUTH
            SOUTH -> EAST
            EAST -> NORTH
        }

    /** Facing after a TURN RIGHT (web `RIGHT_OF`). */
    val turnedRight: CodeFacing
        get() = when (this) {
            NORTH -> EAST
            EAST -> SOUTH
            SOUTH -> WEST
            WEST -> NORTH
        }
}

/**
 * One CodeBot puzzle, ported verbatim from the web `Level` interface.
 *
 * Grids are ASCII maps read top-to-bottom, left-to-right. Tile legend:
 * - `.`  floor
 * - `#`  wall (moving into it bonks and stops the run)
 * - `O`  pit (moving onto it fails the run)
 * - `*`  bonus star
 * - `R`  robot start tile
 * - `P`  the hungry pet
 *
 * @property name Display name shown in the level picker and status bar.
 * @property pet Emoji for the pet waiting at the goal tile.
 * @property grid ASCII map; every row must be the same width.
 * @property facing Direction the robot faces at the start of every run.
 * @property slotLimit Maximum program size in slots (a repeat costs 1 slot + 1 per block inside).
 * @property par Fewest slots needed to feed the pet; finishing within par earns a star.
 * @property hint One-line nudge shown in the mission panel.
 */
data class CodeLevel(
    val name: String,
    val pet: String,
    val grid: List<String>,
    val facing: CodeFacing,
    val slotLimit: Int,
    val par: Int,
    val hint: String,
)

/**
 * The ten hand-built levels, byte-for-byte the web `LEVELS` table so both
 * platforms play identical puzzles. Adding a level = adding one entry here.
 */
object CodeLevels {
    val all: List<CodeLevel> = listOf(
        CodeLevel(
            name = "Straight Shot",
            pet = "🐶",
            grid = listOf(
                ".....",
                "R.*P.",
                ".....",
            ),
            facing = CodeFacing.EAST,
            slotLimit = 6,
            par = 3,
            hint = "MOVE walks one tile forward. Walk straight to the puppy!",
        ),
        CodeLevel(
            name = "Around the Bend",
            pet = "🐱",
            grid = listOf(
                ".....",
                "R....",
                "...*.",
                "...P.",
                ".....",
            ),
            facing = CodeFacing.EAST,
            slotLimit = 8,
            par = 6,
            hint = "TURN RIGHT spins the robot in place — it does not move.",
        ),
        CodeLevel(
            name = "Mind the Wall",
            pet = "🐰",
            grid = listOf(
                ".....",
                "R#.P.",
                ".*...",
                ".....",
            ),
            facing = CodeFacing.EAST,
            slotLimit = 12,
            par = 9,
            hint = "Walls stop the robot with a BONK. Go around, not through.",
        ),
        CodeLevel(
            name = "Pit Stop",
            pet = "🐶",
            grid = listOf(
                ".....",
                "R.O.P",
                "..*..",
                ".....",
            ),
            facing = CodeFacing.EAST,
            slotLimit = 12,
            par = 10,
            hint = "Pits swallow robots whole. Detour past the hole.",
        ),
        CodeLevel(
            name = "Long Hall",
            pet = "🐱",
            grid = listOf(
                "OOOOOOOO",
                "R.*..*.P",
                "OOOOOOOO",
            ),
            facing = CodeFacing.EAST,
            slotLimit = 5,
            par = 4,
            hint = "Too far to walk block-by-block. REPEAT ×5 with MOVE inside!",
        ),
        CodeLevel(
            name = "Square Dance",
            pet = "🐰",
            grid = listOf(
                "R.*.",
                "...*",
                "....",
                "P*..",
            ),
            facing = CodeFacing.EAST,
            slotLimit = 6,
            par = 5,
            hint = "The same corner, three times. Put a turn inside the REPEAT.",
        ),
        CodeLevel(
            name = "Zigzag Valley",
            pet = "🐶",
            grid = listOf(
                "R.O..",
                ".*...",
                "O.*..",
                "...*.",
                "....P",
            ),
            facing = CodeFacing.EAST,
            slotLimit = 6,
            par = 5,
            hint = "Down the staircase: MOVE, RIGHT, MOVE, LEFT... on REPEAT.",
        ),
        CodeLevel(
            name = "Wall Maze",
            pet = "🐱",
            grid = listOf(
                "R*.##",
                "##.##",
                "#..*.",
                "###O.",
                "##.OP",
            ),
            facing = CodeFacing.EAST,
            slotLimit = 8,
            par = 7,
            hint = "The maze zigzags the same way twice. Repeat the whole zig.",
        ),
        CodeLevel(
            name = "Star Circuit",
            pet = "🐰",
            grid = listOf(
                "R.*..",
                "O##..",
                "O##.*",
                "O###.",
                "P.*..",
            ),
            facing = CodeFacing.EAST,
            slotLimit = 7,
            par = 6,
            hint = "Three long straight legs around the edge — one REPEAT does it all.",
        ),
        CodeLevel(
            name = "Grand Finale",
            pet = "🐶",
            grid = listOf(
                "R..*...",
                ".O#O#O.",
                ".#O#O#.",
                ".O#O#O*",
                ".#O#O#.",
                ".O#O#O*",
                "##O#O#P",
            ),
            facing = CodeFacing.EAST,
            slotLimit = 8,
            par = 7,
            hint = "Two long halls with one corner. Two REPEATs beat thirteen MOVEs.",
        ),
    )
}

/** A single command the robot can execute (web `CommandBlock["kind"]`). */
enum class CodeCommand { MOVE, TURN_LEFT, TURN_RIGHT }

/**
 * One block in a program: either a plain command or a repeat that runs its
 * body [Repeat.times] times. Like the web, repeats hold commands only —
 * exactly one level of nesting.
 */
sealed class CodeBlock {
    data class Command(val command: CodeCommand) : CodeBlock()
    data class Repeat(val times: Int, val body: List<CodeCommand>) : CodeBlock()
}

/** What happened on one executed step (web `StepEvent`). */
enum class CodeStepEvent { MOVE, TURN, STAR, FEED, BONK, FALL }

/**
 * Robot state after one command has executed, plus what happened.
 * [blockPath] is `[index]` for a top-level block or `[repeatIndex, bodyIndex]`
 * for a block inside a repeat, used by the UI to highlight the active block.
 * [collectedStar] is the tile key ("x,y") of a bonus star collected on this
 * step, if any.
 */
data class CodeStep(
    val blockPath: List<Int>,
    val command: CodeCommand,
    val x: Int,
    val y: Int,
    val facing: CodeFacing,
    val event: CodeStepEvent,
    val collectedStar: String? = null,
)

/** How a run ended (web `Outcome`). */
enum class CodeOutcome { FED, BONK, FELL, OUT_OF_CODE }

/** Complete result of executing a program against a level. */
data class CodeRunResult(
    val steps: List<CodeStep>,
    val outcome: CodeOutcome,
    val starsCollected: Int,
    val totalStars: Int,
)

/**
 * Level grid parsed into lookup sets (web `ParsedLevel`). [stars] holds the
 * tile keys ("x,y") of every bonus star on the map.
 */
data class CodeParsedLevel(
    val width: Int,
    val height: Int,
    val startX: Int,
    val startY: Int,
    val facing: CodeFacing,
    val petX: Int,
    val petY: Int,
    val walls: Set<String>,
    val pits: Set<String>,
    val stars: List<String>,
)

/** One entry of the unrolled program (web `FlatCommand`). */
data class CodeFlatCommand(
    val command: CodeCommand,
    val blockPath: List<Int>,
)

/** Pure functions mirroring the web `interpreter.ts` exports one-for-one. */
object CodeEngine {
    /**
     * Defensive execution cap. The web UI cannot build runaway programs (its
     * repeat count tops out at ×5 and slots at 12, ≤ 60 flat commands), but
     * the engine accepts arbitrary repeat counts, so a run halts as
     * [CodeOutcome.OUT_OF_CODE] after this many executed steps. Never
     * reachable from programs the UI can build, so behavior stays identical
     * to web.
     */
    const val MAX_RUN_STEPS = 1000

    fun tileKey(x: Int, y: Int): String = "$x,$y"

    /**
     * Slots a program occupies: 1 per block, and a repeat also pays 1 per
     * body block (web `slotCount`).
     */
    fun slotCount(program: List<CodeBlock>): Int = program.sumOf { block ->
        when (block) {
            is CodeBlock.Command -> 1
            is CodeBlock.Repeat -> 1 + block.body.size
        }
    }

    /**
     * Reads the ASCII grid into lookup sets. Level data is trusted; no
     * validation (web `parseLevel`).
     */
    fun parseLevel(level: CodeLevel): CodeParsedLevel {
        var startX = 0
        var startY = 0
        var petX = 0
        var petY = 0
        val walls = mutableSetOf<String>()
        val pits = mutableSetOf<String>()
        val stars = mutableListOf<String>()
        level.grid.forEachIndexed { y, row ->
            row.forEachIndexed { x, tile ->
                when (tile) {
                    '#' -> walls.add(tileKey(x, y))
                    'O' -> pits.add(tileKey(x, y))
                    '*' -> stars.add(tileKey(x, y))
                    'R' -> {
                        startX = x
                        startY = y
                    }
                    'P' -> {
                        petX = x
                        petY = y
                    }
                }
            }
        }
        return CodeParsedLevel(
            width = level.grid[0].length,
            height = level.grid.size,
            startX = startX,
            startY = startY,
            facing = level.facing,
            petX = petX,
            petY = petY,
            walls = walls,
            pits = pits,
            stars = stars,
        )
    }

    /**
     * Unrolls repeats into the linear command sequence the robot will execute
     * (web `flattenProgram`). Each turn of a repeat re-emits the body with
     * the same `[repeatIndex, bodyIndex]` paths so the UI highlight loops.
     */
    fun flattenProgram(program: List<CodeBlock>): List<CodeFlatCommand> {
        val flat = mutableListOf<CodeFlatCommand>()
        program.forEachIndexed { index, block ->
            when (block) {
                is CodeBlock.Command ->
                    flat.add(CodeFlatCommand(block.command, listOf(index)))
                is CodeBlock.Repeat ->
                    repeat(block.times.coerceAtLeast(0)) {
                        block.body.forEachIndexed { bodyIndex, child ->
                            flat.add(CodeFlatCommand(child, listOf(index, bodyIndex)))
                        }
                    }
            }
        }
        return flat
    }

    /**
     * Executes a program against a level and returns the full trace (web
     * `runProgram`). The run ends on the first terminal event: feeding the
     * pet ([CodeOutcome.FED]), hitting a wall ([CodeOutcome.BONK]), falling
     * into a pit or off the grid ([CodeOutcome.FELL]), or running out of
     * blocks before reaching the pet ([CodeOutcome.OUT_OF_CODE]).
     */
    fun runProgram(level: CodeLevel, program: List<CodeBlock>): CodeRunResult {
        val parsed = parseLevel(level)
        var x = parsed.startX
        var y = parsed.startY
        var facing = parsed.facing
        val collected = mutableSetOf<String>()
        val steps = mutableListOf<CodeStep>()

        fun finish(outcome: CodeOutcome) = CodeRunResult(
            steps = steps,
            outcome = outcome,
            starsCollected = collected.size,
            totalStars = parsed.stars.size,
        )

        for ((command, blockPath) in flattenProgram(program)) {
            if (steps.size >= MAX_RUN_STEPS) {
                return finish(CodeOutcome.OUT_OF_CODE)
            }

            if (command == CodeCommand.TURN_LEFT || command == CodeCommand.TURN_RIGHT) {
                facing = if (command == CodeCommand.TURN_LEFT) facing.turnedLeft else facing.turnedRight
                steps.add(CodeStep(blockPath, command, x, y, facing, CodeStepEvent.TURN))
                continue
            }

            val nextX = x + facing.dx
            val nextY = y + facing.dy
            val nextKey = tileKey(nextX, nextY)
            val offGrid = nextX < 0 || nextY < 0 || nextX >= parsed.width || nextY >= parsed.height

            if (!offGrid && parsed.walls.contains(nextKey)) {
                steps.add(CodeStep(blockPath, command, x, y, facing, CodeStepEvent.BONK))
                return finish(CodeOutcome.BONK)
            }
            if (offGrid || parsed.pits.contains(nextKey)) {
                steps.add(CodeStep(blockPath, command, nextX, nextY, facing, CodeStepEvent.FALL))
                return finish(CodeOutcome.FELL)
            }

            x = nextX
            y = nextY
            if (x == parsed.petX && y == parsed.petY) {
                steps.add(CodeStep(blockPath, command, x, y, facing, CodeStepEvent.FEED))
                return finish(CodeOutcome.FED)
            }
            if (parsed.stars.contains(nextKey) && !collected.contains(nextKey)) {
                collected.add(nextKey)
                steps.add(
                    CodeStep(blockPath, command, x, y, facing, CodeStepEvent.STAR, collectedStar = nextKey),
                )
            } else {
                steps.add(CodeStep(blockPath, command, x, y, facing, CodeStepEvent.MOVE))
            }
        }
        return finish(CodeOutcome.OUT_OF_CODE)
    }

    /**
     * Stars earned by a finished run: 1 for feeding the pet, +1 for
     * collecting every bonus star along the way, +1 for a program within par
     * (web `scoreRun`).
     */
    fun scoreRun(level: CodeLevel, program: List<CodeBlock>, result: CodeRunResult): Int {
        if (result.outcome != CodeOutcome.FED) {
            return 0
        }
        var stars = 1
        if (result.starsCollected == result.totalStars) {
            stars += 1
        }
        if (slotCount(program) <= level.par) {
            stars += 1
        }
        return stars
    }
}
