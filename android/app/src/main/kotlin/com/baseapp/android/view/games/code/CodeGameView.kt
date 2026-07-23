package com.baseapp.android.view.games.code

import android.content.Context
import android.content.SharedPreferences
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.baseapp.android.view.theme.LocalUiTheme
import kotlinx.coroutines.delay

/** Milliseconds between executed program steps (web `STEP_MS`). */
private const val STEP_MS = 350L

/**
 * SharedPreferences file holding unlocked level + stars earned per level —
 * the same name as the web localStorage key (`PROGRESS_KEY`).
 */
private const val PROGRESS_PREFS = "code.progress"

/** Range of the repeat-count stepper (web `REPEAT_TIMES_CHOICES` = 2..5). */
private val REPEAT_TIMES_RANGE = 2..5

/**
 * Blueprint tech-lab palette mirroring `CodePage.styles.css.ts`. Hardcoded
 * like the web page (and like PongGameView's field): the game keeps its own
 * dark lab look on both light and dark app themes.
 */
private object CodeColors {
    val navyDeep = Color(0xFF060B1E)
    val navy = Color(0xFF0C1631)
    val navyPanel = Color(0xFF101D40)
    val line = Color(0x5957E6FF) // rgba(87,230,255,0.35)
    val lineSoft = Color(0x1F57E6FF) // rgba(87,230,255,0.12)
    val cyan = Color(0xFF57E6FF)
    val text = Color(0xFFD7E8FF)
    val textDim = Color(0x8CD7E8FF) // rgba(215,232,255,0.55)
    val green = Color(0xFF34D873)
    val orange = Color(0xFFFFA64D)
    val purple = Color(0xFFA78BFA)
    val gold = Color(0xFFFFD166)
    val blockText = Color(0xFF08131F)
    val overlayScrim = Color(0xD1060B1E) // rgba(6,11,30,0.82)
}

/**
 * Saved progression: [unlocked] counts playable levels (1-based) and [stars]
 * holds the best star count per level — the same shape the web stores in
 * localStorage.
 */
private data class CodeProgress(
    val unlocked: Int,
    val stars: List<Int>,
) {
    fun starsFor(index: Int): Int = stars.getOrElse(index) { 0 }
}

private fun loadProgress(prefs: SharedPreferences): CodeProgress {
    val unlocked = prefs.getInt("unlocked", 1).coerceIn(1, CodeLevels.all.size)
    val stars = prefs.getString("stars", null)
        ?.split(",")
        ?.mapNotNull { it.toIntOrNull() }
        ?: emptyList()
    return CodeProgress(unlocked, stars)
}

private fun saveProgress(prefs: SharedPreferences, progress: CodeProgress) {
    prefs.edit()
        .putInt("unlocked", progress.unlocked)
        .putString("stars", progress.stars.joinToString(","))
        .apply()
}

/** End-of-run modal state: level cleared with N stars, or a failed outcome. */
private sealed class CodeOverlay {
    data class Clear(val stars: Int) : CodeOverlay()
    data class Fail(val outcome: CodeOutcome) : CodeOverlay()
}

private data class FailInfo(val title: String, val status: String, val note: String)

private fun failInfo(outcome: CodeOutcome): FailInfo = when (outcome) {
    CodeOutcome.BONK ->
        FailInfo("BONK! 🧱", "HIT A WALL.", "The robot smacked into a wall. Re-route it!")
    CodeOutcome.FELL ->
        FailInfo("SPLAT! 🕳️", "FELL IN A PIT.", "The robot fell. Steer around the holes!")
    else ->
        FailInfo(
            "OUT OF CODE!",
            "PROGRAM ENDED EARLY.",
            "The blocks ran out before the pet got fed. Add more!",
        )
}

private fun starRow(earned: Int): String = "★".repeat(earned) + "☆".repeat(3 - earned)

private fun facingDegrees(facing: CodeFacing): Float = when (facing) {
    CodeFacing.NORTH -> 0f
    CodeFacing.EAST -> 90f
    CodeFacing.SOUTH -> 180f
    CodeFacing.WEST -> 270f
}

private fun blockLabel(command: CodeCommand): String = when (command) {
    CodeCommand.MOVE -> "⬆️ MOVE"
    CodeCommand.TURN_LEFT -> "↩️ LEFT"
    CodeCommand.TURN_RIGHT -> "↪️ RIGHT"
}

private fun blockTint(command: CodeCommand): Color =
    if (command == CodeCommand.MOVE) CodeColors.green else CodeColors.orange

/**
 * Home surface for the `code` pack — the native twin of the web CodePage.
 * Purely client-side: all game rules live in [CodeEngine] so they stay
 * JVM-testable and in lockstep with the web game. This composable only edits
 * the program, replays the precomputed trace on a timer, and persists
 * progress to SharedPreferences. No network, no stores.
 */
@Composable
fun CodeGameView() {
    val theme = LocalUiTheme.current
    val context = LocalContext.current
    val prefs = remember {
        context.applicationContext.getSharedPreferences(PROGRESS_PREFS, Context.MODE_PRIVATE)
    }

    var progress by remember { mutableStateOf(loadProgress(prefs)) }
    var levelIndex by remember { mutableIntStateOf(0) }
    var program by remember { mutableStateOf(listOf<CodeBlock>()) }
    // While true, palette taps append inside the trailing repeat block.
    var openRepeat by remember { mutableStateOf(false) }
    var repeatTimes by remember { mutableIntStateOf(3) }
    var runResult by remember { mutableStateOf<CodeRunResult?>(null) }
    var stepIndex by remember { mutableIntStateOf(-1) }
    var running by remember { mutableStateOf(false) }
    var overlay by remember { mutableStateOf<CodeOverlay?>(null) }
    var status by remember { mutableStateOf("READY.") }

    val level = CodeLevels.all[levelIndex]
    val parsed = remember(levelIndex) { CodeEngine.parseLevel(level) }
    val usedSlots = CodeEngine.slotCount(program)
    val canAddBlock = !running && usedSlots < level.slotLimit
    val hasCommands = CodeEngine.flattenProgram(program).isNotEmpty()
    val currentStep = runResult?.steps?.getOrNull(stepIndex)

    fun resetRun() {
        running = false
        runResult = null
        stepIndex = -1
        overlay = null
        status = "READY."
    }

    fun selectLevel(index: Int) {
        if (index >= progress.unlocked) {
            return
        }
        levelIndex = index
        program = listOf()
        openRepeat = false
        resetRun()
    }

    /** Any edit invalidates the previous run, so the robot pops back to start. */
    fun editProgram(next: List<CodeBlock>) {
        if (running) {
            return
        }
        program = next
        runResult = null
        stepIndex = -1
        overlay = null
        status = "READY."
    }

    fun appendSimple(command: CodeCommand) {
        if (!canAddBlock) {
            return
        }
        val last = program.lastOrNull()
        if (openRepeat && last is CodeBlock.Repeat) {
            editProgram(program.dropLast(1) + last.copy(body = last.body + command))
        } else {
            editProgram(program + CodeBlock.Command(command))
        }
    }

    fun appendRepeat() {
        if (!canAddBlock || openRepeat) {
            return
        }
        editProgram(program + CodeBlock.Repeat(times = repeatTimes, body = listOf()))
        openRepeat = true
    }

    fun removeTopBlock(index: Int) {
        if (running) {
            return
        }
        if (program[index] is CodeBlock.Repeat) {
            openRepeat = false
        }
        editProgram(program.filterIndexed { i, _ -> i != index })
    }

    fun removeInnerBlock(repeatIndex: Int, bodyIndex: Int) {
        editProgram(
            program.mapIndexed { i, block ->
                if (i == repeatIndex && block is CodeBlock.Repeat) {
                    block.copy(body = block.body.filterIndexed { j, _ -> j != bodyIndex })
                } else {
                    block
                }
            },
        )
    }

    /**
     * After the final step: award stars, unlock the next level, show the
     * overlay — mirroring the web playback effect's settle branch.
     */
    fun settle(result: CodeRunResult) {
        running = false
        if (result.outcome == CodeOutcome.FED) {
            val earned = CodeEngine.scoreRun(level, program, result)
            val stars = MutableList(CodeLevels.all.size) { progress.starsFor(it) }
            stars[levelIndex] = maxOf(stars[levelIndex], earned)
            progress = CodeProgress(
                unlocked = maxOf(progress.unlocked, minOf(levelIndex + 2, CodeLevels.all.size)),
                stars = stars,
            )
            saveProgress(prefs, progress)
            overlay = CodeOverlay.Clear(earned)
            status = "LEVEL CLEAR! 💕"
        } else {
            overlay = CodeOverlay.Fail(result.outcome)
            status = failInfo(result.outcome).status
        }
    }

    fun handleRun() {
        openRepeat = false
        overlay = null
        runResult = CodeEngine.runProgram(level, program)
        stepIndex = -1
        running = true
        status = "RUNNING…"
    }

    /**
     * Manual single-step: computes the trace lazily on the first press, then
     * advances one step per press without starting the playback timer.
     */
    fun stepOnce() {
        if (running || !hasCommands) {
            return
        }
        if (runResult == null) {
            openRepeat = false
            overlay = null
            runResult = CodeEngine.runProgram(level, program)
            stepIndex = -1
            status = "STEPPING…"
        }
        val result = runResult ?: return
        val next = stepIndex + 1
        if (next < result.steps.size) {
            stepIndex = next
        } else {
            settle(result)
        }
    }

    // Playback: advance one step per tick; after the final step, settle the
    // run (the web equivalent is the setTimeout effect in CodePage).
    LaunchedEffect(running) {
        while (running) {
            delay(STEP_MS)
            val result = runResult ?: break
            val next = stepIndex + 1
            if (next < result.steps.size) {
                stepIndex = next
            } else {
                settle(result)
            }
        }
    }

    // Stars already picked up at the current playback position.
    val collectedStars = runResult?.steps
        ?.take(stepIndex + 1)
        ?.mapNotNull { it.collectedStar }
        ?.toSet()
        ?: emptySet()

    // Cumulative rotation so the robot never spins the long way around
    // (web `rotations`).
    var robotDegrees = facingDegrees(level.facing)
    runResult?.steps?.take(stepIndex + 1)?.forEach { step ->
        if (step.event == CodeStepEvent.TURN) {
            robotDegrees += if (step.command == CodeCommand.TURN_RIGHT) 90f else -90f
        }
    }

    val totalStarsEarned = CodeLevels.all.indices.sumOf { progress.starsFor(it) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CodeColors.navyDeep)
            .statusBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(theme.spacing.md),
        verticalArrangement = Arrangement.spacedBy(theme.spacing.md),
    ) {
        Text(
            text = "🤖 CODEBOT",
            color = CodeColors.cyan,
            fontSize = theme.typography.sizes.xl,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )

        // Level picker: locked levels show 🔒, played levels their best stars.
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm),
        ) {
            CodeLevels.all.forEachIndexed { index, entry ->
                val locked = index >= progress.unlocked
                LevelChip(
                    label = "${index + 1}. ${entry.name}",
                    detail = if (locked) "🔒" else starRow(progress.starsFor(index)),
                    isActive = index == levelIndex,
                    locked = locked,
                    onClick = { selectLevel(index) },
                )
            }
        }

        // Run controls.
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            ChunkyButton(label = "▶ RUN", tint = CodeColors.green, enabled = !running && hasCommands) {
                handleRun()
            }
            ChunkyButton(label = "➤ STEP", tint = CodeColors.cyan, enabled = !running && hasCommands) {
                stepOnce()
            }
            ChunkyButton(label = "⟲ RESET", tint = CodeColors.text, enabled = true) {
                resetRun()
            }
            Spacer(modifier = Modifier.weight(1f))
            Text(
                text = if (running) "● EXECUTING" else "○ IDLE",
                color = if (running) CodeColors.green else CodeColors.textDim,
                fontSize = theme.typography.sizes.xs,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
            )
        }

        // Board with the animated robot and end-of-run overlay.
        CodeBoard(
            level = level,
            parsed = parsed,
            currentStep = currentStep,
            robotDegrees = robotDegrees,
            collectedStars = collectedStars,
            overlay = overlay,
            hasNextLevel = levelIndex + 1 < CodeLevels.all.size,
            onNextLevel = { selectLevel(levelIndex + 1) },
            onReset = { resetRun() },
        )

        // Mission panel.
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(theme.radius.sm))
                .background(CodeColors.navyPanel)
                .padding(theme.spacing.sm),
            verticalArrangement = Arrangement.spacedBy(theme.spacing.xs),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                MissionText(text = "Feed ${level.pet}")
                MissionText(text = "Slots $usedSlots/${level.slotLimit}")
                MissionText(text = "Par ${level.par}")
                MissionText(text = "⭐ ${collectedStars.size}/${parsed.stars.size}")
            }
            Text(
                text = "💡 ${level.hint}",
                color = CodeColors.textDim,
                fontSize = theme.typography.sizes.xs,
                fontFamily = FontFamily.Monospace,
            )
        }

        // Program strip: tap a block to delete it.
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(
                text = "Program — $usedSlots/${level.slotLimit} slots · tap a block to delete",
                color = CodeColors.textDim,
                fontSize = theme.typography.sizes.xs,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
            )
            Text(
                text = "🗑 Clear",
                color = CodeColors.orange,
                fontSize = theme.typography.sizes.xs,
                fontFamily = FontFamily.Monospace,
                modifier = Modifier.clickable {
                    editProgram(listOf())
                    openRepeat = false
                },
            )
        }
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(theme.radius.sm))
                .background(CodeColors.navyPanel)
                .horizontalScroll(rememberScrollState())
                .padding(theme.spacing.sm),
            horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (program.isEmpty()) {
                Text(
                    text = "Tap blocks below to build your program…",
                    color = CodeColors.textDim,
                    fontSize = theme.typography.sizes.xs,
                    fontFamily = FontFamily.Monospace,
                )
            }
            program.forEachIndexed { index, block ->
                when (block) {
                    is CodeBlock.Command -> BlockChip(
                        label = blockLabel(block.command),
                        tint = blockTint(block.command),
                        active = running && currentStep?.blockPath == listOf(index),
                        onClick = { removeTopBlock(index) },
                    )
                    is CodeBlock.Repeat -> Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(theme.radius.sm))
                            .background(CodeColors.purple)
                            .padding(6.dp),
                        horizontalArrangement = Arrangement.spacedBy(theme.spacing.xs),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            text = "🔁 ×${block.times}",
                            color = CodeColors.blockText,
                            fontSize = theme.typography.sizes.xs,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            modifier = Modifier.clickable { removeTopBlock(index) },
                        )
                        if (block.body.isEmpty()) {
                            Text(
                                text = "…",
                                color = CodeColors.blockText,
                                fontSize = theme.typography.sizes.xs,
                                fontFamily = FontFamily.Monospace,
                            )
                        }
                        block.body.forEachIndexed { bodyIndex, child ->
                            BlockChip(
                                label = blockLabel(child),
                                tint = blockTint(child),
                                active = running &&
                                    currentStep?.blockPath == listOf(index, bodyIndex),
                                onClick = { removeInnerBlock(index, bodyIndex) },
                            )
                        }
                    }
                }
            }
        }

        // Palette: tap to add (into the open repeat while one is open).
        Text(
            text = "Palette — tap to add" + if (openRepeat) " (inside 🔁)" else "",
            color = CodeColors.textDim,
            fontSize = theme.typography.sizes.xs,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            CodeCommand.entries.forEach { command ->
                BlockChip(
                    label = blockLabel(command),
                    tint = blockTint(command),
                    active = false,
                    enabled = canAddBlock,
                    onClick = { appendSimple(command) },
                )
            }
            BlockChip(
                label = "🔁 REPEAT ×$repeatTimes",
                tint = CodeColors.purple,
                active = false,
                enabled = canAddBlock && !openRepeat,
                onClick = { appendRepeat() },
            )
            if (openRepeat) {
                BlockChip(
                    label = "✔ END 🔁",
                    tint = CodeColors.purple,
                    active = false,
                    onClick = { openRepeat = false },
                )
            }
            // Repeat-count stepper (web offers ×2..×5 choices).
            StepperButton(label = "−") {
                repeatTimes = (repeatTimes - 1).coerceIn(REPEAT_TIMES_RANGE)
            }
            Text(
                text = "×$repeatTimes",
                color = CodeColors.text,
                fontSize = theme.typography.sizes.sm,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
            )
            StepperButton(label = "+") {
                repeatTimes = (repeatTimes + 1).coerceIn(REPEAT_TIMES_RANGE)
            }
        }

        // Status bar.
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            StatusText(text = "● $status")
            StatusText(text = "LVL ${levelIndex + 1}/${CodeLevels.all.size}")
            StatusText(text = "⭐ $totalStarsEarned/${CodeLevels.all.size * 3}")
        }
    }
}

/**
 * The level grid plus the animated robot. Tiles are laid out as rows of
 * fixed-size boxes; the robot is an overlay whose offset/rotation animate
 * over [STEP_MS], matching the web's CSS transitions.
 */
@Composable
private fun CodeBoard(
    level: CodeLevel,
    parsed: CodeParsedLevel,
    currentStep: CodeStep?,
    robotDegrees: Float,
    collectedStars: Set<String>,
    overlay: CodeOverlay?,
    hasNextLevel: Boolean,
    onNextLevel: () -> Unit,
    onReset: () -> Unit,
) {
    val theme = LocalUiTheme.current
    BoxWithConstraints(modifier = Modifier.fillMaxWidth()) {
        val tile = minOf(maxWidth / parsed.width, 52.dp)
        val boardWidth = tile * parsed.width
        val boardHeight = tile * parsed.height

        val robotTileX = currentStep?.x ?: parsed.startX
        val robotTileY = currentStep?.y ?: parsed.startY
        val animX by animateFloatAsState(
            targetValue = robotTileX.toFloat(),
            animationSpec = tween(STEP_MS.toInt()),
        )
        val animY by animateFloatAsState(
            targetValue = robotTileY.toFloat(),
            animationSpec = tween(STEP_MS.toInt()),
        )
        val animDegrees by animateFloatAsState(
            targetValue = robotDegrees,
            animationSpec = tween(STEP_MS.toInt()),
        )

        Box(
            modifier = Modifier
                .width(boardWidth)
                .height(boardHeight)
                .align(Alignment.Center)
                .clip(RoundedCornerShape(theme.radius.sm))
                .background(CodeColors.navy)
                .border(1.dp, CodeColors.line, RoundedCornerShape(theme.radius.sm)),
        ) {
            Column {
                level.grid.forEachIndexed { y, row ->
                    Row {
                        row.forEachIndexed { x, tileChar ->
                            val key = CodeEngine.tileKey(x, y)
                            val content = when (tileChar) {
                                '#' -> "🧱"
                                'O' -> "🕳️"
                                '*' -> if (collectedStars.contains(key)) "" else "⭐"
                                'P' -> level.pet
                                else -> ""
                            }
                            Box(
                                modifier = Modifier
                                    .size(tile)
                                    .background(
                                        if (tileChar == '#') CodeColors.lineSoft else Color.Transparent,
                                    )
                                    .border(0.5.dp, CodeColors.lineSoft),
                                contentAlignment = Alignment.Center,
                            ) {
                                Text(text = content, fontSize = 20.sp)
                            }
                        }
                    }
                }
            }

            // The robot (▲ marks its facing). Fades out when it falls.
            Column(
                modifier = Modifier
                    .size(tile)
                    .offset(x = tile * animX, y = tile * animY)
                    .rotate(animDegrees)
                    .alpha(if (currentStep?.event == CodeStepEvent.FALL) 0.25f else 1f),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(text = "▲", color = CodeColors.cyan, fontSize = 8.sp, fontWeight = FontWeight.Bold)
                Text(text = "🤖", fontSize = 22.sp)
            }

            if (currentStep?.event == CodeStepEvent.FEED) {
                Text(
                    text = "💕",
                    fontSize = 18.sp,
                    modifier = Modifier.offset(
                        x = tile * parsed.petX.toFloat(),
                        y = tile * parsed.petY.toFloat() - 8.dp,
                    ),
                )
            }

            overlay?.let { current ->
                BoardOverlay(
                    overlay = current,
                    pet = level.pet,
                    hasNextLevel = hasNextLevel,
                    onNextLevel = onNextLevel,
                    onReset = onReset,
                )
            }
        }
    }
}

/** Level-clear / failure modal drawn over the board (web `overlay`). */
@Composable
private fun BoxScope.BoardOverlay(
    overlay: CodeOverlay,
    pet: String,
    hasNextLevel: Boolean,
    onNextLevel: () -> Unit,
    onReset: () -> Unit,
) {
    val theme = LocalUiTheme.current
    Column(
        modifier = Modifier
            .matchParentSize()
            .background(CodeColors.overlayScrim)
            .padding(theme.spacing.md),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(theme.spacing.sm, Alignment.CenterVertically),
    ) {
        when (overlay) {
            is CodeOverlay.Clear -> {
                Text(
                    text = "LEVEL CLEAR! $pet💕",
                    color = CodeColors.green,
                    fontSize = theme.typography.sizes.lg,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                )
                Text(
                    text = starRow(overlay.stars),
                    color = CodeColors.gold,
                    fontSize = 28.sp,
                )
                Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm)) {
                    if (hasNextLevel) {
                        ChunkyButton(label = "NEXT ▶", tint = CodeColors.green, enabled = true) {
                            onNextLevel()
                        }
                    }
                    ChunkyButton(label = "⟲ REPLAY", tint = CodeColors.text, enabled = true) {
                        onReset()
                    }
                }
                if (!hasNextLevel) {
                    Text(
                        text = "All pets fed. You are a real programmer now! 🎓",
                        color = CodeColors.text,
                        fontSize = theme.typography.sizes.sm,
                        fontFamily = FontFamily.Monospace,
                        textAlign = TextAlign.Center,
                    )
                }
            }
            is CodeOverlay.Fail -> {
                val info = failInfo(overlay.outcome)
                Text(
                    text = info.title,
                    color = CodeColors.orange,
                    fontSize = theme.typography.sizes.lg,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                )
                Text(
                    text = info.note,
                    color = CodeColors.text,
                    fontSize = theme.typography.sizes.sm,
                    fontFamily = FontFamily.Monospace,
                    textAlign = TextAlign.Center,
                )
                ChunkyButton(label = "⟲ TRY AGAIN", tint = CodeColors.text, enabled = true) {
                    onReset()
                }
            }
        }
    }
}

/** Chunky monospace control button echoing the web console's toolbar. */
@Composable
private fun ChunkyButton(
    label: String,
    tint: Color,
    enabled: Boolean,
    onClick: () -> Unit,
) {
    val theme = LocalUiTheme.current
    val shape = RoundedCornerShape(theme.radius.sm)
    Box(
        modifier = Modifier
            .clip(shape)
            .background(CodeColors.navyPanel)
            .border(1.dp, CodeColors.line, shape)
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 8.dp)
            .alpha(if (enabled) 1f else 0.4f),
    ) {
        Text(
            text = label,
            color = tint,
            fontSize = theme.typography.sizes.sm,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
    }
}

/** Candy-colored command block chip (palette and program strip). */
@Composable
private fun BlockChip(
    label: String,
    tint: Color,
    active: Boolean,
    enabled: Boolean = true,
    onClick: () -> Unit,
) {
    val theme = LocalUiTheme.current
    val shape = RoundedCornerShape(theme.radius.sm)
    Box(
        modifier = Modifier
            .clip(shape)
            .background(tint)
            .border(2.dp, if (active) CodeColors.gold else Color.Transparent, shape)
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 8.dp)
            .alpha(if (enabled) 1f else 0.4f),
    ) {
        Text(
            text = label,
            color = CodeColors.blockText,
            fontSize = theme.typography.sizes.xs,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
    }
}

/** Small −/+ button for the repeat-count stepper. */
@Composable
private fun StepperButton(label: String, onClick: () -> Unit) {
    val theme = LocalUiTheme.current
    val shape = RoundedCornerShape(theme.radius.sm)
    Box(
        modifier = Modifier
            .clip(shape)
            .background(CodeColors.navyPanel)
            .border(1.dp, CodeColors.line, shape)
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 6.dp),
    ) {
        Text(
            text = label,
            color = CodeColors.cyan,
            fontSize = theme.typography.sizes.sm,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
    }
}

@Composable
private fun MissionText(text: String) {
    val theme = LocalUiTheme.current
    Text(
        text = text,
        color = CodeColors.text,
        fontSize = theme.typography.sizes.xs,
        fontWeight = FontWeight.Bold,
        fontFamily = FontFamily.Monospace,
    )
}

@Composable
private fun StatusText(text: String) {
    val theme = LocalUiTheme.current
    Text(
        text = text,
        color = CodeColors.textDim,
        fontSize = theme.typography.sizes.xs,
        fontFamily = FontFamily.Monospace,
    )
}

@Composable
private fun LevelChip(
    label: String,
    detail: String,
    isActive: Boolean,
    locked: Boolean,
    onClick: () -> Unit,
) {
    val theme = LocalUiTheme.current
    val shape = RoundedCornerShape(theme.radius.sm)
    Column(
        modifier = Modifier
            .clip(shape)
            .background(if (isActive) CodeColors.navyPanel else CodeColors.navy)
            .border(1.dp, if (isActive) CodeColors.line else CodeColors.lineSoft, shape)
            .clickable(enabled = !locked, onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 6.dp)
            .alpha(if (locked) 0.45f else 1f),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = label,
            color = if (isActive) CodeColors.cyan else CodeColors.text,
            fontSize = theme.typography.sizes.xs,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
        Text(
            text = detail,
            color = CodeColors.gold,
            fontSize = theme.typography.sizes.xs,
            fontFamily = FontFamily.Monospace,
        )
    }
}
