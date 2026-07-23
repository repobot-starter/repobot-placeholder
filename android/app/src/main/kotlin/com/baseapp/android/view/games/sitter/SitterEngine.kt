package com.baseapp.android.view.games.sitter

import kotlin.math.pow
import kotlin.math.roundToInt

/**
 * Pure Kotlin port of the web SitterBot simulation
 * (`web/app/src/View/Games/Sitter/SitterPage.tsx` + `mishaps.ts`) so the exact
 * same rules run on every platform and can be unit-tested on the JVM. No
 * Android or Compose imports here — rendering and input live in
 * `SitterGameView`.
 *
 * The web ticks the shift at a fixed 100ms; this engine accepts any `dt`, so
 * callers may either replicate the web tick (dt = 0.1) or step per frame —
 * all timing thresholds are expressed in elapsed milliseconds either way.
 *
 * Randomness (mishap kind/room/spot, kid wandering, spawn jitter) goes
 * through an injected `() -> Double` in [0, 1) — the web's `Math.random` —
 * so tests can make the simulation fully deterministic.
 */
class SitterEngine(
    var difficulty: Difficulty = Difficulty.NORMAL,
    private val random: () -> Double = { kotlin.random.Random.nextDouble() },
) {
    /** The four rooms of the house, in the web's 2×2 grid order. */
    enum class RoomKey { LIVING, KITCHEN, BEDROOM, BATHROOM }

    /**
     * Decorative furniture inside a room. [x]/[y] are percent offsets within
     * the room panel, exactly like the web CSS positioning.
     */
    data class FurnitureItem(val emoji: String, val x: Double, val y: Double)

    data class Room(
        val key: RoomKey,
        val name: String,
        val emoji: String,
        val furniture: List<FurnitureItem>,
    )

    /** The six tools in the tray. Each mishap is fixed by exactly one tool. */
    enum class ToolKey { MOP, HUG, SNACK, TIDY, SPONGE, REMOTE }

    data class Tool(val key: ToolKey, val emoji: String, val label: String)

    enum class MishapKey { JUICE, CRYING, HUNGRY, TOYS, CRAYON, TV }

    /**
     * A kind of mishap — the web `MishapKind` table row. [tool] is the one
     * tool that fixes it; [clicksToFix] taps are needed (toys vanish one per
     * tap); a positive [holdMs] means press-and-hold instead of tapping;
     * [weight] is the relative spawn weight; [kidCare] mishaps feed the
     * happiness score when fixed.
     */
    data class MishapKind(
        val key: MishapKey,
        val emoji: String,
        val label: String,
        val tool: ToolKey,
        val clicksToFix: Int,
        val holdMs: Double,
        val weight: Double,
        val kidCare: Boolean,
    )

    /**
     * Spawn pacing per difficulty: the interval ramps from start to end over
     * the shift. Values mirror the web `DIFFICULTIES` table.
     */
    enum class Difficulty(val label: String, val spawnStartMs: Double, val spawnEndMs: Double) {
        CHILL("Chill", 7_000.0, 4_200.0),
        NORMAL("Normal", 5_500.0, 3_000.0),
        CHAOS("Chaos", 4_000.0, 2_000.0),
    }

    /**
     * A live mishap sitting in a room, waiting for the right tool — the web
     * `ActiveMishap`. [spawnedAtMs] drives the severity ring; [isMess] means
     * it escalated past its timer: permanent unless fixed, counts double.
     */
    data class Mishap(
        val id: Int,
        val kind: MishapKind,
        val room: RoomKey,
        val x: Double,
        val y: Double,
        val spawnedAtMs: Double,
        var clicksDone: Int = 0,
        var isMess: Boolean = false,
    )

    /**
     * A kid wandering the house — the web `Kid`. [hopToken] bumps on each
     * move so the hop animation replays; [nextMoveAtMs] is the shift-elapsed
     * time of the next wander.
     */
    data class Kid(
        val id: Int,
        val emoji: String,
        var room: RoomKey,
        var x: Double,
        var y: Double,
        var hopToken: Int = 0,
        var nextMoveAtMs: Double,
    )

    /** The scripted bathtub overflow's lifecycle (web `OverflowState.stage`). */
    enum class OverflowStage { WAITING, ACTIVE, SHUT_OFF, FLOODED }

    /** End-of-shift tallies handed to [scoreShift] (web `ShiftReport`). */
    data class ShiftReport(
        val fixes: Int,
        /** Hugs given + snacks served. */
        val kidCare: Int,
        /** Unfixed mishaps still within their timer when the parents arrive. */
        val leftoverMishaps: Int,
        /** Unfixed escalated messes (count double). */
        val leftoverMesses: Int,
        val flooded: Boolean,
    )

    /** What the parents decide (web `ShiftResult`). */
    data class ShiftResult(val stars: Int, val pay: Int, val tidiness: Int, val happiness: Int)

    /**
     * Discrete things that happened during one [step] — the native twin of
     * the web game's status/sound side effects. The renderer can use these
     * for sounds or haptics; tests use them to assert on game flow.
     */
    sealed class Event {
        data class MishapSpawned(val key: MishapKey, val room: RoomKey) : Event()
        data class MishapBecameMess(val id: Int) : Event()
        /** A press-and-hold fix (the hug) completed during this step. */
        data class MishapFixed(val key: MishapKey) : Event()
        object OverflowStarted : Event()
        object BathroomFlooded : Event()
        data class ShiftEnded(val result: ShiftResult) : Event()
    }

    /**
     * What a tool tap on a mishap did — mirrors the web
     * `handleMishapPointerDown` branches one-for-one.
     */
    sealed class TapOutcome {
        object NoToolSelected : TapOutcome()
        object WrongTool : TapOutcome()
        /** A multi-tap fix (toys) advanced but is not done yet. */
        data class Progressed(val clicksLeft: Int) : TapOutcome()
        /** A press-and-hold fix (the hug) started; keep holding. */
        object HoldStarted : TapOutcome()
        object Fixed : TapOutcome()
    }

    // ---- Public state -----------------------------------------------------

    /**
     * 1 on the first shift; "Babysit again" increments it, which speeds up
     * spawns via [REPLAY_SPAWN_FACTOR] exactly like the web.
     */
    var shiftNumber: Int = 1
        private set
    var isPlaying: Boolean = false
        private set

    /** The parents' verdict once the shift ends; null while playing/idle. */
    var result: ShiftResult? = null
        private set

    var elapsedMs: Double = 0.0
        private set
    val mishaps = mutableListOf<Mishap>()
    val kids = mutableListOf<Kid>()
    var fixes: Int = 0
        private set
    var kidCare: Int = 0
        private set
    var overflowStage: OverflowStage = OverflowStage.WAITING
        private set
    var overflowClicksDone: Int = 0
        private set
    var holdingMishapId: Int? = null
        private set
    var holdHeldMs: Double = 0.0
        private set

    /**
     * The web status-bar line, kept in the engine so both platforms show the
     * exact same copy.
     */
    var statusMessage: String = "READY. PICK A DIFFICULTY AND RING THE BELL."
        private set

    val remainingMs: Double
        get() = (SHIFT_LENGTH_MS - elapsedMs).coerceAtLeast(0.0)

    /** Fraction of `holdMs` completed for the currently held mishap (0..1). */
    val holdProgress: Double
        get() {
            val id = holdingMishapId ?: return 0.0
            val mishap = mishaps.firstOrNull { it.id == id } ?: return 0.0
            if (mishap.kind.holdMs <= 0) {
                return 0.0
            }
            return (holdHeldMs / mishap.kind.holdMs).coerceAtMost(1.0)
        }

    private var nextSpawnAtMs: Double = FIRST_SPAWN_MS
    private var nextId = 1
    private var overflowStartedAtMs = 0.0

    // ---- Shift lifecycle --------------------------------------------------

    /**
     * Ring the doorbell: reset everything and start a fresh shift
     * (web `makeShift` + `startShift`).
     */
    fun startShift() {
        elapsedMs = 0.0
        nextSpawnAtMs = FIRST_SPAWN_MS
        nextId = 1
        mishaps.clear()
        kids.clear()
        kids.addAll(makeKids())
        fixes = 0
        kidCare = 0
        overflowStage = OverflowStage.WAITING
        overflowClicksDone = 0
        overflowStartedAtMs = 0.0
        holdingMishapId = null
        holdHeldMs = 0.0
        result = null
        isPlaying = true
        statusMessage = "SHIFT STARTED. KEEP AN EYE ON THE KIDS!"
    }

    /** Replay: the next shift spawns mishaps [REPLAY_SPAWN_FACTOR]× faster. */
    fun babysitAgain() {
        shiftNumber += 1
        startShift()
    }

    /**
     * Advance the simulation by [dtSeconds]. Mirrors the web `tickShift`
     * step-for-step: kids wander, mishaps spawn, fresh mishaps escalate into
     * messes (scattering the kids), holds progress, the scripted overflow
     * fires/floods, and the shift ends when the parents arrive. Returns the
     * discrete events that occurred so the caller can react.
     */
    fun step(dtSeconds: Double): List<Event> {
        if (!isPlaying) {
            return emptyList()
        }
        val events = mutableListOf<Event>()

        elapsedMs += dtSeconds * 1_000
        val remaining = SHIFT_LENGTH_MS - elapsedMs

        // Kids wander between rooms on their own clocks.
        for (kid in kids) {
            if (elapsedMs >= kid.nextMoveAtMs) {
                moveKid(kid)
            }
        }

        // Spawning: one attempt per step, retry in 1s when the house is full.
        if (elapsedMs >= nextSpawnAtMs) {
            if (mishaps.size < MAX_ACTIVE_MISHAPS) {
                val spawned = spawnMishap()
                events.add(Event.MishapSpawned(spawned.kind.key, spawned.room))
            } else {
                nextSpawnAtMs = elapsedMs + 1_000
            }
        }

        // Escalation: past the timer a mishap hardens into a permanent MESS
        // and the kids scatter to new rooms within the panic window.
        for (mishap in mishaps) {
            if (!mishap.isMess && elapsedMs - mishap.spawnedAtMs >= MISHAP_TIMER_MS) {
                mishap.isMess = true
                statusMessage = "${mishap.kind.emoji} TURNED INTO A MESS! THE KIDS ARE GOING WILD!"
                events.add(Event.MishapBecameMess(mishap.id))
                for (kid in kids) {
                    kid.nextMoveAtMs =
                        minOf(kid.nextMoveAtMs, elapsedMs + random() * KID_PANIC_MS)
                }
            }
        }

        // Press-and-hold fixes (the hug) progress while the finger stays down.
        val holdingId = holdingMishapId
        if (holdingId != null) {
            holdHeldMs += dtSeconds * 1_000
            val mishap = mishaps.firstOrNull { it.id == holdingId }
            if (mishap == null) {
                holdingMishapId = null
                holdHeldMs = 0.0
            } else if (holdHeldMs >= mishap.kind.holdMs) {
                fixMishap(mishap)
                events.add(Event.MishapFixed(mishap.kind.key))
            }
        }

        // The scripted mid-shift emergency: at the 1:00 mark the tub starts
        // overflowing; ignore it for 8s and the bathroom floods.
        if (overflowStage == OverflowStage.WAITING && remaining <= OVERFLOW_AT_REMAINING_MS) {
            overflowStage = OverflowStage.ACTIVE
            overflowClicksDone = 0
            overflowStartedAtMs = elapsedMs
            statusMessage = "UH OH! THE BATHTUB IS OVERFLOWING!"
            events.add(Event.OverflowStarted)
        } else if (
            overflowStage == OverflowStage.ACTIVE &&
            elapsedMs - overflowStartedAtMs >= OVERFLOW_WINDOW_MS
        ) {
            overflowStage = OverflowStage.FLOODED
            statusMessage = "THE BATHROOM FLOODED! 💦"
            events.add(Event.BathroomFlooded)
        }

        if (remaining <= 0) {
            events.add(Event.ShiftEnded(finishShift()))
        }

        return events
    }

    // ---- Player input -----------------------------------------------------

    /**
     * Apply the selected tool to a mishap — the web `handleMishapPointerDown`
     * branch-for-branch. Returns null if the mishap no longer exists.
     */
    fun applyTool(toolKey: ToolKey?, mishapId: Int): TapOutcome? {
        if (!isPlaying) {
            return null
        }
        val mishap = mishaps.firstOrNull { it.id == mishapId } ?: return null
        if (toolKey == null) {
            statusMessage = "PICK A TOOL FROM THE TRAY FIRST!"
            return TapOutcome.NoToolSelected
        }
        val tool = toolFor(toolKey)
        if (tool.key != mishap.kind.tool) {
            statusMessage = "${tool.emoji} WON'T FIX THAT! THE KIDS GIGGLE AT YOU."
            return TapOutcome.WrongTool
        }
        if (mishap.kind.holdMs > 0) {
            holdingMishapId = mishap.id
            holdHeldMs = 0.0
            statusMessage = "HOLD THE ${tool.label.uppercase()}..."
            return TapOutcome.HoldStarted
        }
        mishap.clicksDone += 1
        if (mishap.clicksDone >= mishap.kind.clicksToFix) {
            fixMishap(mishap)
            return TapOutcome.Fixed
        }
        val clicksLeft = mishap.kind.clicksToFix - mishap.clicksDone
        statusMessage = "${mishap.kind.emoji} $clicksLeft MORE TO TIDY..."
        return TapOutcome.Progressed(clicksLeft)
    }

    /** Lifting the finger anywhere cancels an in-progress hug (web pointerup). */
    fun releaseHold() {
        holdingMishapId = null
        holdHeldMs = 0.0
    }

    /** One tap on the overflowing tub. Returns true when this tap shut it off. */
    fun tapOverflow(): Boolean {
        if (!isPlaying || overflowStage != OverflowStage.ACTIVE) {
            return false
        }
        overflowClicksDone += 1
        if (overflowClicksDone >= OVERFLOW_CLICKS) {
            overflowStage = OverflowStage.SHUT_OFF
            fixes += 1
            statusMessage = "TUB SHUT OFF! CRISIS AVERTED."
            return true
        }
        statusMessage = "SHUT OFF THE TAP! ${OVERFLOW_CLICKS - overflowClicksDone} MORE!"
        return false
    }

    // ---- Test hooks ---------------------------------------------------------

    /**
     * Test hook: drop a specific mishap into a specific room, bypassing the
     * weighted spawn roll (like Pong's `placeBall`). Returns the new mishap id.
     */
    internal fun forceSpawn(key: MishapKey, room: RoomKey): Int {
        val kind = MISHAP_KINDS.first { it.key == key }
        val mishap = Mishap(
            id = nextId,
            kind = kind,
            room = room,
            x = 12 + random() * 70,
            y = 34 + random() * 44,
            spawnedAtMs = elapsedMs,
        )
        mishaps.add(mishap)
        nextId += 1
        return mishap.id
    }

    // ---- Private helpers ----------------------------------------------------

    private fun finishShift(): ShiftResult {
        val leftoverMesses = mishaps.count { it.isMess }
        val shiftResult = scoreShift(
            ShiftReport(
                fixes = fixes,
                kidCare = kidCare,
                leftoverMishaps = mishaps.size - leftoverMesses,
                leftoverMesses = leftoverMesses,
                flooded = overflowStage == OverflowStage.FLOODED,
            ),
        )
        result = shiftResult
        isPlaying = false
        statusMessage = "SHIFT OVER. THE PARENTS ARE HOME."
        return shiftResult
    }

    private fun makeKids(): List<Kid> =
        KID_EMOJI.mapIndexed { index, emoji ->
            Kid(
                id = index,
                emoji = emoji,
                room = pickRoom(),
                x = 12 + random() * 70,
                y = 34 + random() * 44,
                nextMoveAtMs = 1_500 + random() * 2_500,
            )
        }

    /** Hop the kid to a random *different* room (web `moveKid`). */
    private fun moveKid(kid: Kid) {
        val otherRooms = ROOMS.filter { it.key != kid.room }
        kid.room = otherRooms[(random() * otherRooms.size).toInt()].key
        kid.x = 12 + random() * 70
        kid.y = 34 + random() * 44
        kid.hopToken += 1
        kid.nextMoveAtMs = elapsedMs + KID_MOVE_MIN_MS + random() * (KID_MOVE_MAX_MS - KID_MOVE_MIN_MS)
    }

    private fun spawnMishap(): Mishap {
        val kind = pickMishapKind()
        val room = pickRoom()
        val mishap = Mishap(
            id = nextId,
            kind = kind,
            room = room,
            x = 12 + random() * 70,
            y = 34 + random() * 44,
            spawnedAtMs = elapsedMs,
        )
        mishaps.add(mishap)
        nextId += 1
        statusMessage =
            "${kind.emoji} ${kind.label.uppercase()} IN THE ${roomName(room).uppercase()}!"
        val jitter = 0.75 + random() * 0.5
        nextSpawnAtMs = elapsedMs + spawnIntervalMs(elapsedMs, difficulty, shiftNumber) * jitter
        return mishap
    }

    /** Remove a fixed mishap, credit the fix (and kid care), clear any hold. */
    private fun fixMishap(mishap: Mishap) {
        mishaps.removeAll { it.id == mishap.id }
        fixes += 1
        if (mishap.kind.kidCare) {
            kidCare += 1
        }
        if (holdingMishapId == mishap.id) {
            holdingMishapId = null
            holdHeldMs = 0.0
        }
        statusMessage = "${mishap.kind.emoji} FIXED! NICE SAVE."
    }

    /** Weighted random mishap kind (web `pickMishapKind`). */
    private fun pickMishapKind(): MishapKind {
        val totalWeight = MISHAP_KINDS.sumOf { it.weight }
        var roll = random() * totalWeight
        for (kind in MISHAP_KINDS) {
            roll -= kind.weight
            if (roll <= 0) {
                return kind
            }
        }
        return MISHAP_KINDS[0]
    }

    private fun pickRoom(): RoomKey = ROOMS[(random() * ROOMS.size).toInt()].key

    companion object {
        // Shift tuning — must stay byte-for-byte in sync with the web
        // constants in `mishaps.ts`.
        const val SHIFT_LENGTH_MS = 120_000.0
        /** How long a mishap wobbles before it hardens into a MESS. */
        const val MISHAP_TIMER_MS = 12_000.0
        const val MAX_ACTIVE_MISHAPS = 8
        /** The first mishap of a shift arrives this soon. */
        const val FIRST_SPAWN_MS = 2_500.0

        /**
         * The scripted bathtub overflow: trigger time, taps to shut off,
         * time before flood.
         */
        const val OVERFLOW_AT_REMAINING_MS = 60_000.0
        const val OVERFLOW_CLICKS = 5
        const val OVERFLOW_WINDOW_MS = 8_000.0

        const val KID_MOVE_MIN_MS = 3_000.0
        const val KID_MOVE_MAX_MS = 6_000.0
        /** After a mishap escalates into a mess, kids scatter within this window. */
        const val KID_PANIC_MS = 900.0

        /** Each replay ("Babysit again") multiplies spawn intervals by this. */
        const val REPLAY_SPAWN_FACTOR = 0.92
        const val MIN_SPAWN_MS = 1_500.0

        // Scoring.
        const val UNFIXED_PENALTY = 8
        /** Escalated messes count double against tidiness. */
        const val MESS_PENALTY = 16
        const val FLOOD_PENALTY = 25
        const val BASE_PAY_PER_STAR = 12
        const val TIP_PER_FIX = 1

        /**
         * SharedPreferences key for the best paycheck — the same name as the
         * web's localStorage key so the two stores match in spirit.
         */
        const val BEST_PAY_KEY = "sitter.bestPay"

        /** Overall score (0-100) needed for each star count, checked top down. */
        val STAR_THRESHOLDS: List<Pair<Int, Double>> = listOf(
            5 to 90.0,
            4 to 72.0,
            3 to 52.0,
            2 to 30.0,
            1 to 0.0,
        )

        val KID_EMOJI = listOf("🧒", "👧")

        /** The four rooms with their furniture — web `ROOMS` verbatim. */
        val ROOMS: List<Room> = listOf(
            Room(
                RoomKey.LIVING, "Living Room", "🛋️",
                listOf(
                    FurnitureItem("🛋️", 22.0, 66.0),
                    FurnitureItem("🖼️", 50.0, 26.0),
                    FurnitureItem("🪴", 82.0, 34.0),
                    FurnitureItem("📻", 78.0, 72.0),
                ),
            ),
            Room(
                RoomKey.KITCHEN, "Kitchen", "🍳",
                listOf(
                    FurnitureItem("🍳", 24.0, 32.0),
                    FurnitureItem("🫖", 74.0, 30.0),
                    FurnitureItem("🍽️", 50.0, 70.0),
                    FurnitureItem("🧁", 82.0, 66.0),
                ),
            ),
            Room(
                RoomKey.BEDROOM, "Bedroom", "🛏️",
                listOf(
                    FurnitureItem("🛏️", 26.0, 64.0),
                    FurnitureItem("🌙", 76.0, 26.0),
                    FurnitureItem("📚", 82.0, 66.0),
                    FurnitureItem("🧦", 52.0, 30.0),
                ),
            ),
            Room(
                RoomKey.BATHROOM, "Bathroom", "🛁",
                listOf(
                    FurnitureItem("🛁", 26.0, 66.0),
                    FurnitureItem("🚿", 22.0, 28.0),
                    FurnitureItem("🪥", 72.0, 28.0),
                    FurnitureItem("🧻", 80.0, 68.0),
                ),
            ),
        )

        /** The tool tray — web `TOOLS` verbatim. */
        val TOOLS: List<Tool> = listOf(
            Tool(ToolKey.MOP, "🧹", "Mop"),
            Tool(ToolKey.HUG, "🤗", "Hug"),
            Tool(ToolKey.SNACK, "🍎", "Snack"),
            Tool(ToolKey.TIDY, "🧺", "Tidy"),
            Tool(ToolKey.SPONGE, "🧽", "Sponge"),
            Tool(ToolKey.REMOTE, "🎮", "Remote"),
        )

        /**
         * The mishap table — web `MISHAP_KINDS` verbatim (tools, click
         * counts, hold durations, spawn weights, kid-care flags).
         */
        val MISHAP_KINDS: List<MishapKind> = listOf(
            MishapKind(MishapKey.JUICE, "🧃", "Juice spill", ToolKey.MOP, 1, 0.0, 3.0, false),
            MishapKind(MishapKey.CRYING, "😭", "Crying kid", ToolKey.HUG, 1, 2_000.0, 2.0, true),
            MishapKind(MishapKey.HUNGRY, "🍪", "Hungry kid", ToolKey.SNACK, 1, 0.0, 2.0, true),
            MishapKind(MishapKey.TOYS, "🧸", "Toy explosion", ToolKey.TIDY, 3, 0.0, 2.0, false),
            MishapKind(MishapKey.CRAYON, "🖍️", "Crayon on the wall", ToolKey.SPONGE, 1, 0.0, 2.0, false),
            MishapKind(MishapKey.TV, "📺", "TV blasting", ToolKey.REMOTE, 1, 0.0, 2.0, false),
        )

        fun kindFor(key: MishapKey): MishapKind = MISHAP_KINDS.first { it.key == key }

        fun toolFor(key: ToolKey): Tool = TOOLS.first { it.key == key }

        fun roomName(key: RoomKey): String =
            ROOMS.firstOrNull { it.key == key }?.name ?: key.name

        /**
         * Current gap between spawns: ramps down over the shift, faster on
         * replays. Mirrors the web `spawnIntervalMs`.
         */
        fun spawnIntervalMs(elapsedMs: Double, difficulty: Difficulty, shiftNumber: Int): Double {
            val progress = (elapsedMs / SHIFT_LENGTH_MS).coerceIn(0.0, 1.0)
            val base =
                difficulty.spawnStartMs + (difficulty.spawnEndMs - difficulty.spawnStartMs) * progress
            val replaySpeedup = REPLAY_SPAWN_FACTOR.pow(shiftNumber - 1)
            return (base * replaySpeedup).coerceAtLeast(MIN_SPAWN_MS)
        }

        /**
         * End-of-shift rating: tidiness loses 8 per leftover mishap, 16 per
         * mess, 25 for a flood; happiness starts at 40 and gains 15 per
         * kid-care fix and 3 per fix; overall = 60% tidiness + 40% happiness
         * → stars → pay. Mirrors the web `scoreShift` exactly.
         */
        fun scoreShift(report: ShiftReport): ShiftResult {
            val tidiness = (
                100.0 -
                    report.leftoverMishaps * UNFIXED_PENALTY -
                    report.leftoverMesses * MESS_PENALTY -
                    (if (report.flooded) FLOOD_PENALTY else 0)
                ).coerceIn(0.0, 100.0)
            val happiness =
                (40.0 + report.kidCare * 15 + report.fixes * 3).coerceIn(0.0, 100.0)
            val overall = tidiness * 0.6 + happiness * 0.4
            val stars = STAR_THRESHOLDS.firstOrNull { overall >= it.second }?.first ?: 1
            val pay = stars * BASE_PAY_PER_STAR + report.fixes * TIP_PER_FIX
            return ShiftResult(
                stars = stars,
                pay = pay,
                tidiness = tidiness.roundToInt(),
                happiness = happiness.roundToInt(),
            )
        }
    }
}
