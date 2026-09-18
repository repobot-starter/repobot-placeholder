package com.baseapp.android.view.games.cabin

import kotlin.math.abs
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.random.Random

/**
 * Pure Kotlin port of the web CabinBot simulation
 * (`web/app/src/View/Games/Cabin/flight.ts`) so the exact same rules run on
 * every platform and can be unit-tested on the JVM. No Android or Compose
 * imports here — rendering and input live in `CabinGameView`.
 *
 * All durations are tracked in milliseconds internally (the web's unit, so
 * every `TUNING` number ports verbatim); [step] takes seconds to match the
 * frame-loop convention of the other native engines.
 *
 * Randomness (face shuffle, event trigger times, request spawning, runner
 * hops, special-passenger picks) goes through an injected [Random] so tests
 * can seed the simulation and make it fully deterministic.
 */
class CabinEngine(
    difficulty: Difficulty = Difficulty.CREW,
    private val random: Random = Random.Default,
) {
    /**
     * Difficulty levels. [spawnIntervalMs] mirrors the web
     * `TUNING.spawnIntervalMs` table exactly so the request pressure ramps
     * identically on both platforms.
     */
    enum class Difficulty(val spawnIntervalMs: Double) {
        TRAINEE(5200.0),
        CREW(3800.0),
        CAPTAIN(2600.0),
    }

    /** Flight arc phases — same four states as the web `FlightPhase`. */
    enum class Phase { IDLE, BOARDING, CRUISE, LANDED }

    /**
     * The five galley items, in the web `GALLEY_ITEMS` display order. Emoji
     * and labels are the web values verbatim so the tray reads the same.
     */
    enum class Item(val emoji: String, val label: String) {
        PRETZELS("🥨", "Pretzels"),
        DRINK("🥤", "Drink"),
        HEADPHONES("🎧", "Headphones"),
        BLANKET("🧣", "Blanket"),
        AIRSICK("🤢", "Airsick Bag"),
    }

    /** Special passenger roles (`SpecialRole` on the web). */
    enum class Role { NONE, CELEBRITY, RUNNER, GRANDMA }

    /** Brief face override after a serve/grumble. */
    enum class Mood { HAPPY, UPSET }

    /**
     * Discrete things that happened during one [step] — the native twin of
     * the web `SoundCue` return channel. The renderer can use these for
     * sounds or haptics; tests use them to assert on game flow.
     */
    enum class Cue { POP, REQUEST, SERVE, GRUMBLE, INTERCOM, SPARKLE, LANDING }

    /** The three scripted mid-flight events (`ScheduledEvent` on the web). */
    enum class EventKind { CELEBRITY, RUNNER, GRANDMA }

    /** One scheduled event with its randomized trigger time within the cruise. */
    class ScheduledEvent(val kind: EventKind, val atMs: Double) {
        var fired: Boolean = false
            internal set
    }

    /** An open request over a seat, draining from [totalMs] toward failure. */
    class SeatRequest(val item: Item, val totalMs: Double) {
        var remainingMs: Double = totalMs
            internal set
    }

    /** Result of holding an item up to a seat (`ServeResult` on the web). */
    data class ServeResult(val correct: Boolean, val cues: List<Cue>)

    /**
     * One seated passenger. Mutable (like the web's plain objects) so the
     * tick functions can update roster members in place.
     */
    class Passenger internal constructor(
        val id: Int,
        val row: Int,
        val seat: Int,
        face: String,
        val boardAtMs: Double,
    ) {
        var face: String = face
            internal set
        var happiness: Double = Tuning.START_HAPPINESS
            internal set
        var boarded: Boolean = false
            internal set
        var request: SeatRequest? = null
            internal set
        var role: Role = Role.NONE
            internal set

        /** Celebrity/grandma: how many of their special demands are complete. */
        var demandsServed: Int = 0
            internal set

        /** Runner: true while dashing around the aisle instead of sitting. */
        var running: Boolean = false
            internal set
        var grabCount: Int = 0
            internal set

        /** Runner: aisle position as a fraction of cabin depth (0 = front row). */
        var aislePos: Double = 0.0
            internal set
        var hopCooldownMs: Double = 0.0
            internal set

        /** Grandma: still owes the player a press-and-hold chat. */
        var needsChat: Boolean = false
            internal set
        var chatting: Boolean = false
            internal set
        var chatMs: Double = 0.0
            internal set

        /** Brief face override after a serve/grumble. */
        var mood: Mood? = null
            internal set
        var moodMs: Double = 0.0
            internal set
    }

    /**
     * Every gameplay number in one place — must stay byte-for-byte in sync
     * with the web `TUNING` object in `flight.ts`.
     */
    object Tuning {
        const val BOARDING_MS = 5000.0
        const val CRUISE_MS = 120000.0
        const val CRUISE_ALTITUDE_FT = 35000.0

        /** Ms spent climbing to (and descending from) cruise altitude, inside CRUISE_MS. */
        const val CLIMB_MS = 20000.0
        const val START_HAPPINESS = 70.0
        const val REQUEST_PATIENCE_MS = 10000.0
        const val SERVED_HAPPINESS = 12.0
        const val EXPIRED_HAPPINESS = -15.0
        const val WRONG_ITEM_HAPPINESS = -8.0

        /** Spawn interval multiplier by the end of the cruise (lower = more hectic finale). */
        const val END_OF_FLIGHT_SPAWN_FACTOR = 0.45

        /** How long an intercom announcement and a mood face stay on screen. */
        const val ANNOUNCEMENT_MS = 4500.0
        const val MOOD_MS = 900.0
        const val CELEBRITY_PATIENCE_MS = 6000.0
        const val CELEBRITY_HAPPINESS_BONUS = 30.0
        const val CELEBRITY_HAPPINESS_PENALTY = -25.0
        const val CELEBRITY_FLASH_MS = 900.0
        const val RUNNER_GRABS_TO_CALM = 3
        const val RUNNER_HOP_INTERVAL_MS = 1300.0
        const val RUNNER_NEARBY_DRAIN_PER_SEC = 2.5
        const val GRANDMA_CHAT_MS = 3000.0
        const val GRANDMA_PATIENCE_MS = 20000.0
        const val GRANDMA_HAPPINESS_BONUS = 24.0
        const val GRANDMA_COOKIE_BOOST = 10.0
        const val GRANDMA_GLOW_MS = 1600.0
    }

    var phase: Phase = Phase.IDLE
        private set
    var difficulty: Difficulty = difficulty
        private set

    /** Elapsed ms within the current phase. */
    var elapsedMs: Double = 0.0
        private set
    var passengers: List<Passenger> = emptyList()
        private set
    var events: List<ScheduledEvent> = emptyList()
        private set
    var spawnCooldownMs: Double = 1500.0
        private set
    var served: Int = 0
        private set
    var missed: Int = 0
        private set
    var announcement: String? = null
        private set
    var announcementMs: Double = 0.0
        private set

    /** Countdown overlays: paparazzi camera flash and grandma's cookie glow. */
    var paparazziMs: Double = 0.0
        private set
    var cookieGlowMs: Double = 0.0
        private set

    /** Final 1-5 rating, computed on landing. */
    var stars: Int = 0
        private set

    init {
        newFlight(difficulty)
    }

    /**
     * Fresh flight in the idle phase with a full, shuffled roster — the web
     * `createFlight`. The three special events get their randomized trigger
     * times here (celebrity 15-35s, runner 45-70s, grandma 78-96s of cruise).
     */
    fun newFlight(difficulty: Difficulty) {
        this.difficulty = difficulty
        phase = Phase.IDLE
        elapsedMs = 0.0
        spawnCooldownMs = 1500.0
        served = 0
        missed = 0
        announcement = null
        announcementMs = 0.0
        paparazziMs = 0.0
        cookieGlowMs = 0.0
        stars = 0

        // Fisher–Yates through the injected RNG (the web leans on an unstable
        // sort comparator; the intent — a fresh random cabin — is identical).
        val faces = FACES.toMutableList()
        for (index in faces.size - 1 downTo 1) {
            val swap = randomIndex(index + 1)
            val held = faces[index]
            faces[index] = faces[swap]
            faces[swap] = held
        }

        val seatCount = ROWS * SEATS_PER_ROW
        passengers = List(seatCount) { id ->
            Passenger(
                id = id,
                row = id / SEATS_PER_ROW,
                seat = id % SEATS_PER_ROW,
                face = faces[id],
                boardAtMs = 300.0 + (id.toDouble() / seatCount) * (Tuning.BOARDING_MS - 800.0),
            )
        }
        events = listOf(
            ScheduledEvent(EventKind.CELEBRITY, 15000.0 + random.nextDouble() * 20000.0),
            ScheduledEvent(EventKind.RUNNER, 45000.0 + random.nextDouble() * 25000.0),
            ScheduledEvent(EventKind.GRANDMA, 78000.0 + random.nextDouble() * 18000.0),
        )
    }

    /** Push back from the gate: starts the boarding phase. */
    fun beginBoarding() {
        phase = Phase.BOARDING
        elapsedMs = 0.0
    }

    /** Average happiness of everyone on board, 0-100 (rounded like the web). */
    fun cabinHappiness(): Int {
        val boarded = passengers.filter { it.boarded }
        if (boarded.isEmpty()) {
            return Tuning.START_HAPPINESS.roundToInt()
        }
        return (boarded.sumOf { it.happiness } / boarded.size).roundToInt()
    }

    /** Current altitude for the status-bar ticker (climb, cruise, descend). */
    fun altitudeFt(): Int {
        if (phase != Phase.CRUISE) {
            return 0
        }
        if (elapsedMs < Tuning.CLIMB_MS) {
            return (Tuning.CRUISE_ALTITUDE_FT * (elapsedMs / Tuning.CLIMB_MS)).roundToInt()
        }
        if (elapsedMs > Tuning.CRUISE_MS - Tuning.CLIMB_MS) {
            val remaining = (Tuning.CRUISE_MS - elapsedMs).coerceAtLeast(0.0)
            return (Tuning.CRUISE_ALTITUDE_FT * (remaining / Tuning.CLIMB_MS)).roundToInt()
        }
        return Tuning.CRUISE_ALTITUDE_FT.roundToInt()
    }

    /** Overall 🛫→🛬 progress across boarding + cruise, 0-1. */
    fun flightProgress(): Double {
        val total = Tuning.BOARDING_MS + Tuning.CRUISE_MS
        return when (phase) {
            Phase.IDLE -> 0.0
            Phase.LANDED -> 1.0
            Phase.BOARDING -> min(1.0, elapsedMs / total)
            Phase.CRUISE -> min(1.0, (Tuning.BOARDING_MS + elapsedMs) / total)
        }
    }

    /**
     * Advance the simulation by [dtSeconds]. Mirrors the web `tickFlight`
     * tick-for-tick (boarding pops, spawn ramp, patience drain, scripted
     * events, runner chaos, grandma chat, landing) and returns the sound
     * cues that fired so the caller can react.
     */
    fun step(dtSeconds: Double): List<Cue> {
        val cues = mutableListOf<Cue>()
        if (phase == Phase.IDLE || phase == Phase.LANDED) {
            return cues
        }
        val dtMs = dtSeconds * 1000.0
        elapsedMs += dtMs
        tickTimers(dtMs)

        if (phase == Phase.BOARDING) {
            for (passenger in passengers) {
                if (!passenger.boarded && elapsedMs >= passenger.boardAtMs) {
                    passenger.boarded = true
                    cues.add(Cue.POP)
                }
            }
            if (elapsedMs >= Tuning.BOARDING_MS) {
                passengers.forEach { it.boarded = true }
                phase = Phase.CRUISE
                elapsedMs = 0.0
                announce("📢 Doors closed, climbing to cruise. Snack service begins!")
                cues.add(Cue.INTERCOM)
            }
            return cues
        }

        tickSpawns(dtMs, cues)
        tickRequests(dtMs, cues)
        tickEvents(cues)
        tickRunner(dtMs)
        tickChat(dtMs, cues)

        if (elapsedMs >= Tuning.CRUISE_MS) {
            land()
            cues.add(Cue.LANDING)
        }
        return cues
    }

    /**
     * Hold pretzels/a drink/etc. up to a seat. Correct item: +12 happiness
     * and a score; wrong item: -8 happiness and a grumble — web `serveItem`.
     */
    fun serveItem(passengerId: Int, item: Item): ServeResult {
        val passenger = passengers.firstOrNull { it.id == passengerId }
        if (phase != Phase.CRUISE || passenger == null || !passenger.boarded || passenger.running) {
            return ServeResult(correct = false, cues = emptyList())
        }
        val request = passenger.request ?: return ServeResult(correct = false, cues = emptyList())
        if (request.item != item) {
            adjustHappiness(passenger, Tuning.WRONG_ITEM_HAPPINESS)
            setMood(passenger, Mood.UPSET)
            return ServeResult(correct = false, cues = listOf(Cue.GRUMBLE))
        }

        passenger.request = null
        served += 1
        adjustHappiness(passenger, Tuning.SERVED_HAPPINESS)
        setMood(passenger, Mood.HAPPY)
        val cues = mutableListOf(Cue.SERVE)

        if (passenger.role == Role.CELEBRITY) {
            passenger.demandsServed += 1
            if (passenger.demandsServed >= 2) {
                adjustHappiness(passenger, Tuning.CELEBRITY_HAPPINESS_BONUS)
                passenger.role = Role.NONE
                announce("📢 Autograph secured! The celebrity adores this airline ⭐")
                cues.add(Cue.SPARKLE)
            } else {
                passenger.request =
                    SeatRequest(randomItem(exclude = item), Tuning.CELEBRITY_PATIENCE_MS)
                cues.add(Cue.REQUEST)
            }
        } else if (passenger.role == Role.GRANDMA) {
            passenger.demandsServed = 1
            if (!passenger.needsChat) {
                completeGrandma(passenger, cues)
            }
        }
        return ServeResult(correct = true, cues = cues)
    }

    /** One grab attempt at the runner; three grabs calms them back into their seat. */
    fun grabRunner(passengerId: Int): List<Cue> {
        val passenger = passengers.firstOrNull { it.id == passengerId }
        if (phase != Phase.CRUISE || passenger == null || !passenger.running) {
            return emptyList()
        }
        passenger.grabCount += 1
        if (passenger.grabCount >= Tuning.RUNNER_GRABS_TO_CALM) {
            passenger.running = false
            passenger.role = Role.NONE
            setMood(passenger, Mood.HAPPY)
            announce("📢 Runner calmed and buckled back in. Nice save, crew!")
            return listOf(Cue.SERVE, Cue.SPARKLE)
        }
        return listOf(Cue.POP)
    }

    /** Begin the press-and-hold chat with grandma (released via [stopChatting]). */
    fun startChat(passengerId: Int) {
        val passenger = passengers.firstOrNull { it.id == passengerId } ?: return
        if (phase == Phase.CRUISE && passenger.role == Role.GRANDMA && passenger.needsChat) {
            passenger.chatting = true
        }
    }

    /** Release every held chat (call on touch-up anywhere). */
    fun stopChatting() {
        passengers.forEach { it.chatting = false }
    }

    /** Seat label like "3B" for a row/seat index pair. */
    fun seatLabel(row: Int, seat: Int): String = "${row + 1}${"ABCD"[seat]}"

    // Test hooks ----------------------------------------------------------

    /** Test hook: plant a request directly to set up serve/expiry scenarios. */
    internal fun setRequest(
        passengerId: Int,
        item: Item,
        patienceMs: Double = Tuning.REQUEST_PATIENCE_MS,
    ) {
        passengers.firstOrNull { it.id == passengerId }?.request = SeatRequest(item, patienceMs)
    }

    /** Test hook: pin every passenger's happiness for star-threshold assertions. */
    internal fun setUniformHappiness(value: Double) {
        passengers.forEach { it.happiness = value }
    }

    /** Test hook: land immediately so star math can be asserted in isolation. */
    internal fun landNow() {
        land()
    }

    // Ticks ---------------------------------------------------------------

    private fun tickTimers(dtMs: Double) {
        if (announcement != null) {
            announcementMs -= dtMs
            if (announcementMs <= 0) {
                announcement = null
            }
        }
        paparazziMs = (paparazziMs - dtMs).coerceAtLeast(0.0)
        cookieGlowMs = (cookieGlowMs - dtMs).coerceAtLeast(0.0)
        for (passenger in passengers) {
            if (passenger.mood != null) {
                passenger.moodMs -= dtMs
                if (passenger.moodMs <= 0) {
                    passenger.mood = null
                }
            }
        }
    }

    private fun tickSpawns(dtMs: Double, cues: MutableList<Cue>) {
        spawnCooldownMs -= dtMs
        if (spawnCooldownMs > 0) {
            return
        }
        val idle = passengers.filter {
            it.boarded && !it.running && it.role == Role.NONE && it.request == null
        }
        if (idle.isNotEmpty()) {
            val passenger = idle[randomIndex(idle.size)]
            passenger.request = SeatRequest(randomItem(exclude = null), Tuning.REQUEST_PATIENCE_MS)
            cues.add(Cue.REQUEST)
        }
        // Spawn interval shrinks linearly through the flight so the finale is hectic.
        val progress = min(1.0, elapsedMs / Tuning.CRUISE_MS)
        val factor = 1.0 - progress * (1.0 - Tuning.END_OF_FLIGHT_SPAWN_FACTOR)
        spawnCooldownMs = difficulty.spawnIntervalMs * factor
    }

    private fun tickRequests(dtMs: Double, cues: MutableList<Cue>) {
        for (passenger in passengers) {
            val request = passenger.request ?: continue
            request.remainingMs -= dtMs
            if (request.remainingMs > 0) {
                continue
            }
            passenger.request = null
            missed += 1
            adjustHappiness(passenger, Tuning.EXPIRED_HAPPINESS)
            setMood(passenger, Mood.UPSET)
            cues.add(Cue.GRUMBLE)
            if (passenger.role == Role.CELEBRITY) {
                adjustHappiness(passenger, Tuning.CELEBRITY_HAPPINESS_PENALTY)
                passenger.role = Role.NONE
                paparazziMs = Tuning.CELEBRITY_FLASH_MS
                announce("📢 The celebrity is fuming — paparazzi caught everything! 📸")
            } else if (passenger.role == Role.GRANDMA) {
                passenger.role = Role.NONE
                passenger.needsChat = false
                passenger.chatting = false
                announce("📢 Grandma dozed off without her blanket... the cookies stay in her bag.")
            }
        }
    }

    private fun tickEvents(cues: MutableList<Cue>) {
        for (event in events) {
            if (event.fired || elapsedMs < event.atMs) {
                continue
            }
            event.fired = true
            cues.add(Cue.INTERCOM)
            when (event.kind) {
                EventKind.CELEBRITY -> fireCelebrity()
                EventKind.RUNNER -> fireRunner()
                EventKind.GRANDMA -> fireGrandma()
            }
        }
    }

    private fun tickRunner(dtMs: Double) {
        val runner = passengers.firstOrNull { it.running } ?: return
        runner.hopCooldownMs -= dtMs
        if (runner.hopCooldownMs <= 0) {
            runner.aislePos = random.nextDouble()
            runner.hopCooldownMs = Tuning.RUNNER_HOP_INTERVAL_MS
        }
        // Passengers within a row of the runner get rattled while the chaos lasts.
        val runnerRow = runner.aislePos * (ROWS - 1)
        val drain = Tuning.RUNNER_NEARBY_DRAIN_PER_SEC * dtMs / 1000.0
        for (passenger in passengers) {
            if (
                passenger.id != runner.id &&
                passenger.boarded &&
                abs(passenger.row - runnerRow) <= 1.0
            ) {
                adjustHappiness(passenger, -drain)
            }
        }
    }

    private fun tickChat(dtMs: Double, cues: MutableList<Cue>) {
        for (passenger in passengers) {
            if (passenger.role != Role.GRANDMA || !passenger.needsChat || !passenger.chatting) {
                continue
            }
            passenger.chatMs += dtMs
            if (passenger.chatMs < Tuning.GRANDMA_CHAT_MS) {
                continue
            }
            passenger.needsChat = false
            passenger.chatting = false
            setMood(passenger, Mood.HAPPY)
            cues.add(Cue.SERVE)
            if (passenger.demandsServed >= 1) {
                completeGrandma(passenger, cues)
            }
        }
    }

    // Scripted events -----------------------------------------------------

    private fun fireCelebrity() {
        val candidates = passengers.filter { it.row == 0 && it.role == Role.NONE && !it.running }
        val passenger =
            if (candidates.isEmpty()) passengers[0] else candidates[randomIndex(candidates.size)]
        passenger.role = Role.CELEBRITY
        passenger.face = "🕶️"
        passenger.demandsServed = 0
        passenger.request = SeatRequest(randomItem(exclude = null), Tuning.CELEBRITY_PATIENCE_MS)
        announce("📢 A celebrity just boarded seat ${seatLabel(passenger.row, passenger.seat)}! ⭐")
    }

    private fun fireRunner() {
        val candidates = passengers.filter { it.boarded && it.role == Role.NONE && it.request == null }
        val passenger =
            if (candidates.isEmpty()) passengers[0] else candidates[randomIndex(candidates.size)]
        passenger.role = Role.RUNNER
        passenger.running = true
        passenger.grabCount = 0
        passenger.request = null
        passenger.aislePos = random.nextDouble()
        passenger.hopCooldownMs = Tuning.RUNNER_HOP_INTERVAL_MS
        announce("📢 Passenger on the loose in the aisle! Tap them 3 times to calm them 🏃")
    }

    private fun fireGrandma() {
        val candidates = passengers.filter { it.boarded && it.role == Role.NONE && !it.running }
        val passenger =
            if (candidates.isEmpty()) passengers[0] else candidates[randomIndex(candidates.size)]
        passenger.role = Role.GRANDMA
        passenger.face = "👵"
        passenger.demandsServed = 0
        passenger.needsChat = true
        passenger.chatMs = 0.0
        passenger.request = SeatRequest(Item.BLANKET, Tuning.GRANDMA_PATIENCE_MS)
        announce(
            "📢 Sweet grandma in ${seatLabel(passenger.row, passenger.seat)} needs a blanket and a chat 👵",
        )
    }

    private fun completeGrandma(passenger: Passenger, cues: MutableList<Cue>) {
        passenger.role = Role.NONE
        adjustHappiness(passenger, Tuning.GRANDMA_HAPPINESS_BONUS)
        // Cookies for the whole cabin — the web boosts everyone, grandma included.
        passengers.forEach { adjustHappiness(it, Tuning.GRANDMA_COOKIE_BOOST) }
        cookieGlowMs = Tuning.GRANDMA_GLOW_MS
        announce("📢 Grandma is delighted — cookies for the whole cabin! 🍪")
        cues.add(Cue.SPARKLE)
    }

    // Helpers --------------------------------------------------------------

    private fun land() {
        phase = Phase.LANDED
        val happiness = cabinHappiness()
        stars = when {
            happiness >= 90 -> 5
            happiness >= 75 -> 4
            happiness >= 55 -> 3
            happiness >= 35 -> 2
            else -> 1
        }
        announcement = null
        for (passenger in passengers) {
            passenger.running = false
            passenger.chatting = false
            passenger.request = null
        }
    }

    private fun announce(message: String) {
        announcement = message
        announcementMs = Tuning.ANNOUNCEMENT_MS
    }

    /**
     * Random galley item, optionally excluding one kind (celebrity follow-ups
     * never repeat the item just served) — the web `randomItem`.
     */
    private fun randomItem(exclude: Item?): Item {
        val pool = Item.entries.filter { it != exclude }
        return pool[randomIndex(pool.size)]
    }

    private fun randomIndex(count: Int): Int =
        (random.nextDouble() * count).toInt().coerceAtMost(count - 1)

    private fun adjustHappiness(passenger: Passenger, delta: Double) {
        passenger.happiness = (passenger.happiness + delta).coerceIn(0.0, 100.0)
    }

    private fun setMood(passenger: Passenger, mood: Mood) {
        passenger.mood = mood
        passenger.moodMs = Tuning.MOOD_MS
    }

    companion object {
        const val ROWS = 5
        const val SEATS_PER_ROW = 4

        /** One face per seat; shuffled every flight so the cabin always looks fresh. */
        private val FACES = listOf(
            "🧑", "👵", "🧒", "👨‍🦱", "👩‍🎤", "👨‍💼", "👩‍🦰", "🧔", "👱‍♀️", "👴",
            "👦", "👩‍🦱", "🧕", "👨‍🎨", "👧", "🧓", "👨‍🦰", "👩", "🙎‍♂️", "👩‍💼",
        )
    }
}
