package com.baseapp.android

import com.baseapp.android.view.games.code.CodeBlock
import com.baseapp.android.view.games.code.CodeCommand
import com.baseapp.android.view.games.code.CodeEngine
import com.baseapp.android.view.games.code.CodeFacing
import com.baseapp.android.view.games.code.CodeLevels
import com.baseapp.android.view.games.code.CodeOutcome
import com.baseapp.android.view.games.code.CodeStepEvent
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Exercises the pure CodeBot interpreter against the web `interpreter.ts`
 * rules it mirrors: move/turn semantics, repeat expansion, wall/pit/off-grid
 * failure, feeding + star scoring, the runaway-program cap, and the
 * integrity of the ten ported levels.
 */
class CodeEngineTest {
    /** Level 1 "Straight Shot": robot at (0,1) facing east, star (2,1), pet (3,1). */
    private val levelOne = CodeLevels.all[0]

    private fun move() = CodeBlock.Command(CodeCommand.MOVE)
    private fun turnLeft() = CodeBlock.Command(CodeCommand.TURN_LEFT)
    private fun turnRight() = CodeBlock.Command(CodeCommand.TURN_RIGHT)

    // Move / turn semantics

    @Test
    fun moveAdvancesOneTileInTheFacingDirection() {
        val result = CodeEngine.runProgram(levelOne, listOf(move()))

        assertEquals(1, result.steps.size)
        val step = result.steps[0]
        assertEquals(1, step.x)
        assertEquals(1, step.y)
        assertEquals(CodeFacing.EAST, step.facing)
        assertEquals(CodeStepEvent.MOVE, step.event)
        assertEquals(listOf(0), step.blockPath)
        // One move does not reach the pet, so the program runs out of code.
        assertEquals(CodeOutcome.OUT_OF_CODE, result.outcome)
    }

    @Test
    fun turnsRotateInPlaceWithoutMoving() {
        val result = CodeEngine.runProgram(
            levelOne,
            listOf(turnLeft(), turnRight(), turnRight()),
        )

        assertEquals(
            listOf(CodeStepEvent.TURN, CodeStepEvent.TURN, CodeStepEvent.TURN),
            result.steps.map { it.event },
        )
        // east → north → east → south, never leaving the start tile.
        assertEquals(
            listOf(CodeFacing.NORTH, CodeFacing.EAST, CodeFacing.SOUTH),
            result.steps.map { it.facing },
        )
        assertTrue(result.steps.all { it.x == 0 && it.y == 1 })
    }

    @Test
    fun moveFollowsCurrentFacing() {
        // Turn north then move: from (0,1) up to (0,0).
        val result = CodeEngine.runProgram(levelOne, listOf(turnLeft(), move()))

        assertEquals(0, result.steps[1].x)
        assertEquals(0, result.steps[1].y)
        assertEquals(CodeStepEvent.MOVE, result.steps[1].event)
    }

    // Repeat expansion

    @Test
    fun repeatBlocksExpandToTheRightStepSequence() {
        val flat = CodeEngine.flattenProgram(
            listOf(
                move(),
                CodeBlock.Repeat(times = 3, body = listOf(CodeCommand.MOVE, CodeCommand.TURN_RIGHT)),
                turnLeft(),
            ),
        )

        assertEquals(
            listOf(
                CodeCommand.MOVE,
                CodeCommand.MOVE, CodeCommand.TURN_RIGHT,
                CodeCommand.MOVE, CodeCommand.TURN_RIGHT,
                CodeCommand.MOVE, CodeCommand.TURN_RIGHT,
                CodeCommand.TURN_LEFT,
            ),
            flat.map { it.command },
        )
        // Body paths repeat [repeatIndex, bodyIndex] each turn (UI highlight loops).
        assertEquals(
            listOf(
                listOf(0),
                listOf(1, 0), listOf(1, 1),
                listOf(1, 0), listOf(1, 1),
                listOf(1, 0), listOf(1, 1),
                listOf(2),
            ),
            flat.map { it.blockPath },
        )
    }

    @Test
    fun repeatProgramWalksTheGridCorrectly() {
        // Level 5 "Long Hall": pet 7 tiles east. REPEAT ×5 [MOVE] + MOVE + MOVE
        // is the par-4 solution and collects both bonus stars on the way.
        val longHall = CodeLevels.all[4]
        val program = listOf(
            CodeBlock.Repeat(times = 5, body = listOf(CodeCommand.MOVE)),
            move(),
            move(),
        )

        val result = CodeEngine.runProgram(longHall, program)

        assertEquals(CodeOutcome.FED, result.outcome)
        assertEquals(7, result.steps.size)
        assertEquals(7, result.steps.last().x)
        assertEquals(2, result.starsCollected)
        assertEquals(2, result.totalStars)
        assertEquals(3, CodeEngine.scoreRun(longHall, program, result))
    }

    @Test
    fun slotCountChargesRepeatBodies() {
        // A repeat costs 1 slot plus 1 per body block, like the web slotCount.
        assertEquals(
            4,
            CodeEngine.slotCount(
                listOf(
                    move(),
                    CodeBlock.Repeat(times = 4, body = listOf(CodeCommand.MOVE, CodeCommand.TURN_LEFT)),
                ),
            ),
        )
        assertEquals(0, CodeEngine.slotCount(emptyList()))
    }

    // Collisions

    @Test
    fun hittingAWallBonksAndFailsTheRun() {
        // Level 3 "Mind the Wall" has a wall directly east of the start.
        val wallLevel = CodeLevels.all[2]
        val program = listOf(move(), move())

        val result = CodeEngine.runProgram(wallLevel, program)

        assertEquals(CodeOutcome.BONK, result.outcome)
        // The bonk step keeps the robot on its current tile (web behavior)
        // and no further commands execute.
        assertEquals(1, result.steps.size)
        assertEquals(CodeStepEvent.BONK, result.steps[0].event)
        assertEquals(0, result.steps[0].x)
        assertEquals(1, result.steps[0].y)
        assertEquals(0, CodeEngine.scoreRun(wallLevel, program, result))
    }

    @Test
    fun movingOntoAPitFallsAndFailsTheRun() {
        // Level 4 "Pit Stop" has a pit two tiles east of the start.
        val pitLevel = CodeLevels.all[3]
        val result = CodeEngine.runProgram(pitLevel, listOf(move(), move()))

        assertEquals(CodeOutcome.FELL, result.outcome)
        assertEquals(2, result.steps.size)
        // The fall step moves the robot onto the pit tile (web animates it in).
        assertEquals(CodeStepEvent.FALL, result.steps[1].event)
        assertEquals(2, result.steps[1].x)
        assertEquals(1, result.steps[1].y)
    }

    @Test
    fun walkingOffTheGridFalls() {
        // Two left turns face west; one move walks off the left edge.
        val result = CodeEngine.runProgram(levelOne, listOf(turnLeft(), turnLeft(), move()))

        assertEquals(CodeOutcome.FELL, result.outcome)
        assertEquals(CodeStepEvent.FALL, result.steps.last().event)
        assertEquals(-1, result.steps.last().x)
    }

    // Scoring

    @Test
    fun levelOneOptimalProgramEarnsThreeStars() {
        // MOVE MOVE MOVE: 3 slots (== par), crosses the bonus star, feeds the pet.
        val program = listOf(move(), move(), move())

        val result = CodeEngine.runProgram(levelOne, program)

        assertEquals(CodeOutcome.FED, result.outcome)
        assertEquals(
            listOf(CodeStepEvent.MOVE, CodeStepEvent.STAR, CodeStepEvent.FEED),
            result.steps.map { it.event },
        )
        assertEquals("2,1", result.steps[1].collectedStar)
        assertEquals(1, result.starsCollected)
        assertEquals(1, result.totalStars)
        assertEquals(3, CodeEngine.scoreRun(levelOne, program, result))
    }

    @Test
    fun programOverParLosesTheParStar() {
        // Two wasted turns push the program to 5 slots, over level 1's par of 3.
        val program = listOf(turnLeft(), turnRight(), move(), move(), move())

        val result = CodeEngine.runProgram(levelOne, program)

        assertEquals(CodeOutcome.FED, result.outcome)
        assertEquals(result.totalStars, result.starsCollected)
        assertEquals(2, CodeEngine.scoreRun(levelOne, program, result))
    }

    @Test
    fun missingBonusStarsLosesTheBonusStar() {
        // Level 2 "Around the Bend": detour around the star at (3,2) and enter
        // the pet tile from the west. 7 slots (> par 6) and 0/1 stars → 1 star.
        val bendLevel = CodeLevels.all[1]
        val program = listOf(
            move(), move(),
            turnRight(), move(), move(),
            turnLeft(), move(),
        )

        val result = CodeEngine.runProgram(bendLevel, program)

        assertEquals(CodeOutcome.FED, result.outcome)
        assertEquals(0, result.starsCollected)
        assertEquals(1, result.totalStars)
        assertEquals(1, CodeEngine.scoreRun(bendLevel, program, result))
    }

    @Test
    fun runningOutOfBlocksScoresZero() {
        val program = listOf(move())
        val result = CodeEngine.runProgram(levelOne, program)

        assertEquals(CodeOutcome.OUT_OF_CODE, result.outcome)
        assertEquals(0, CodeEngine.scoreRun(levelOne, program, result))
    }

    // Step limit

    @Test
    fun stepLimitHaltsRunawayPrograms() {
        // A repeat far beyond anything the UI can build (its stepper tops out
        // at ×5) must halt at the engine cap instead of tracing forever.
        val program = listOf(CodeBlock.Repeat(times = 100_000, body = listOf(CodeCommand.TURN_LEFT)))

        val result = CodeEngine.runProgram(levelOne, program)

        assertEquals(CodeOutcome.OUT_OF_CODE, result.outcome)
        assertEquals(CodeEngine.MAX_RUN_STEPS, result.steps.size)
    }

    // Level data integrity

    @Test
    fun allTenLevelsAreWellFormed() {
        assertEquals(10, CodeLevels.all.size)

        CodeLevels.all.forEach { level ->
            val flatGrid = level.grid.joinToString("")
            // Uniform row widths.
            assertTrue(
                "${level.name}: ragged grid",
                level.grid.all { it.length == level.grid[0].length },
            )
            // Exactly one robot start and one pet.
            assertEquals("${level.name}: robot count", 1, flatGrid.count { it == 'R' })
            assertEquals("${level.name}: pet count", 1, flatGrid.count { it == 'P' })
            // Only legend characters.
            assertTrue(
                "${level.name}: unknown tile",
                flatGrid.all { ".#O*RP".contains(it) },
            )
            // A star must be earnable for staying within par.
            assertTrue("${level.name}: par", level.par > 0)
            assertTrue("${level.name}: par > slot limit", level.par <= level.slotLimit)
        }
    }

    @Test
    fun everyPetIsReachableFromTheRobotStart() {
        CodeLevels.all.forEach { level ->
            val parsed = CodeEngine.parseLevel(level)
            // Breadth-first search over walkable tiles (anything but walls/pits).
            val queue = mutableListOf(parsed.startX to parsed.startY)
            val seen = mutableSetOf(CodeEngine.tileKey(parsed.startX, parsed.startY))
            var reached = false
            while (queue.isNotEmpty()) {
                val (x, y) = queue.removeAt(0)
                if (x == parsed.petX && y == parsed.petY) {
                    reached = true
                    break
                }
                listOf(1 to 0, -1 to 0, 0 to 1, 0 to -1).forEach { (dx, dy) ->
                    val nx = x + dx
                    val ny = y + dy
                    val key = CodeEngine.tileKey(nx, ny)
                    if (
                        nx >= 0 && ny >= 0 && nx < parsed.width && ny < parsed.height &&
                        !seen.contains(key) &&
                        !parsed.walls.contains(key) &&
                        !parsed.pits.contains(key)
                    ) {
                        seen.add(key)
                        queue.add(nx to ny)
                    }
                }
            }
            assertTrue("${level.name}: pet is unreachable", reached)
        }
    }
}
