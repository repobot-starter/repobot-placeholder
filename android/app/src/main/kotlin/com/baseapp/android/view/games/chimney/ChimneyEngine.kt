package com.baseapp.android.view.games.chimney

import kotlin.math.max
import kotlin.math.min
import kotlin.random.Random

/**
 * Pure Kotlin port of the web ChimneyBot simulation
 * (`web/app/src/View/Games/Chimney/engine.ts`) so the exact same rules run on
 * every platform and can be unit-tested on the JVM. No Android or Compose
 * imports here — rendering and input live in `ChimneyGameView`.
 *
 * A night-time rooftop runner: the runner sprints across an endless street
 * of row houses, jumping house by house. Clear the gap and the chimney and
 * the run continues; land IN a chimney and you slide down onto the family's
 * dinner stove — you get cooked. Smack into a chimney or miss a roof and you
 * fall to the street.
 *
 * Jump is press/release ([pressJump]/[releaseJump]) so a tap hops and a hold
 * clears the wide gaps — the native twin of a held key.
 *
 * All coordinates are in field units (720x420, y growing downward); the view
 * scales the field to the device while preserving the aspect ratio. Time is
 * the engine's own [elapsed] clock, so identical steps always produce
 * identical states.
 *
 * Randomness (house width, gap, roof height, chimney spot) goes through an
 * injected [Random] so tests can pin every roll. The RNG call order in
 * `pushHouse` (width, gap, roof rise, chimney position — including the dummy
 * roll for narrow houses) and the collision order (facade wall, chimney,
 * roof landing, fall) match the web engine exactly.
 */
class ChimneyEngine(private val random: Random = Random.Default) {
    companion object {
        // Field geometry and tuning — must stay byte-for-byte in sync with
        // the web constants in engine.ts.

        /** Field units; the view scales the field to its canvas. */
        const val FIELD_WIDTH = 720f
        const val FIELD_HEIGHT = 420f

        /** The runner's fixed screen x; the world scrolls, the runner does not. */
        const val PLAYER_X = 168f
        const val PLAYER_WIDTH = 26f
        const val PLAYER_HEIGHT = 34f

        /** Ground speed at the first rooftop (units/s)… */
        const val RUN_SPEED_START = 180f

        /** …the ceiling it ramps to… */
        const val RUN_SPEED_MAX = 360f

        /** …and the ramp per second of running — the difficulty curve. */
        const val RUN_ACCELERATION = 4.5f

        const val GRAVITY = 1500f
        const val JUMP_VELOCITY = -600f

        /**
         * Releasing jump early multiplies any remaining upward velocity by
         * this, so a tap hops and a hold soars.
         */
        const val JUMP_CUT_FACTOR = 0.45f

        /** Grace window to jump after running off a roof edge (seconds). */
        const val COYOTE_TIME = 0.09f

        /** A jump pressed this long before landing still fires on touchdown. */
        const val JUMP_BUFFER = 0.12f

        /**
         * House geometry is generated in SECONDS of travel at the current
         * run speed, not fixed units: jump airtime is constant (gravity does
         * not ramp), so a gap that takes 0.5s to cross is equally hard at
         * every speed. This keeps the street fair forever while the world
         * visually rushes ever faster.
         */
        const val HOUSE_SECONDS_MIN = 0.95f
        const val HOUSE_SECONDS_MAX = 1.45f

        /** Tap-hop airtime is ~0.36s and a full-hold jump ~0.8s; gaps sit between. */
        const val GAP_SECONDS_MIN = 0.28f
        const val GAP_SECONDS_MAX = 0.52f

        /** Roof y band (down is +y): roofs step up/down between these levels. */
        const val ROOF_Y_MIN = 200f
        const val ROOF_Y_MAX = 300f

        /** Biggest upward step between consecutive roofs (keeps every jump makeable). */
        const val ROOF_RISE_MAX = 40f

        const val CHIMNEY_WIDTH = 36f
        const val CHIMNEY_HEIGHT = 30f

        /** Brick lip on each side of the opening. */
        const val CHIMNEY_LIP = 5f
        const val CHIMNEY_OPENING = CHIMNEY_WIDTH - CHIMNEY_LIP * 2f

        /**
         * Chimney keeps this margin (in seconds of travel) from the house
         * edges, so a landing arc always leaves room to touch down before
         * the bricks and set up the next jump — at any speed.
         */
        const val CHIMNEY_MARGIN_SECONDS = 0.35f

        /** The first houses of a run are chimney-free so the opening is a warm-up. */
        const val SAFE_HOUSES = 3
    }

    /** One row house on the street. */
    class House(
        /** Left edge in world units. */
        val x: Float,
        val width: Float,
        /** Roof line y (down is +y). */
        val roofY: Float,
        /** Chimney left edge relative to the house's left, or null (warm-up). */
        val chimneyOffset: Float?,
        /** Sequential index; index 0 is the first house of the run. */
        val index: Int,
        /** Whether this house has paid its "cleared" score. */
        var cleared: Boolean = false,
    )

    /** The web ChimneyEventKind: one score beat or one of the three endings. */
    enum class EventKind { HOP, COOKED, FELL, BONKED }

    /**
     * Discrete thing that happened during one [step] — the native twin of
     * the web ChimneyEvent. [value] is the houses cleared so far (hop) or
     * the final score (terminal events).
     */
    data class Event(val kind: EventKind, val value: Int)

    val houses = mutableListOf<House>()

    /** World-space x of the runner's left edge (the camera follows it). */
    var playerWorldX = 0f
        private set

    /** Runner top y. */
    var playerY = 0f
        private set

    /** Vertical velocity (down is +). */
    var velocityY = 0f
        private set

    var speed = RUN_SPEED_START
        private set

    var housesCleared = 0
        private set

    var isOver = false
        private set

    /** How the run ended (never [EventKind.HOP]); null while running. */
    var ending: EventKind? = null
        private set

    /** Engine clock in seconds. */
    var elapsed = 0f
        private set

    private var isOnRoof = true
    private var coyoteRemaining = COYOTE_TIME
    private var jumpBufferRemaining = 0f
    private var isJumpHeld = false

    /** World x where the most recently generated house ends (next spawn x). */
    private var frontier = 0f
    private var nextHouseIndex = 0

    val score: Int
        get() = housesCleared

    /** Full reset (the web "Restart Run" path). */
    fun newGame() {
        houses.clear()
        frontier = 0f
        nextHouseIndex = 0
        speed = RUN_SPEED_START
        housesCleared = 0
        isOver = false
        ending = null
        elapsed = 0f
        velocityY = 0f
        isOnRoof = true
        coyoteRemaining = COYOTE_TIME
        jumpBufferRemaining = 0f
        isJumpHeld = false

        // The opening house starts under the runner's feet with no gap
        // before it, so every run begins mid-stride on a safe roof.
        pushHouse(isFirst = true)
        playerWorldX = houses[0].x + 40f
        playerY = houses[0].roofY - PLAYER_HEIGHT
        ensureHouses()
    }

    fun pressJump() {
        if (isOver) {
            return
        }
        isJumpHeld = true
        if (isOnRoof || coyoteRemaining > 0f) {
            velocityY = JUMP_VELOCITY
            isOnRoof = false
            coyoteRemaining = 0f
        } else {
            jumpBufferRemaining = JUMP_BUFFER
        }
    }

    fun releaseJump() {
        isJumpHeld = false
        if (velocityY < 0f) {
            velocityY *= JUMP_CUT_FACTOR
        }
    }

    /**
     * Advance the simulation. Mirrors the web `step` frame-for-frame: ramp
     * the run speed, move the runner, apply gravity, land on roofs, detect
     * the three endings (cooked in a chimney, bonked on a chimney wall,
     * fell in a gap), and keep the street generated ahead of the camera.
     */
    fun step(dt: Float): List<Event> {
        if (isOver) {
            return emptyList()
        }
        val events = mutableListOf<Event>()
        elapsed += dt
        speed = min(RUN_SPEED_MAX, speed + RUN_ACCELERATION * dt)

        val previousFeet = playerY + PLAYER_HEIGHT
        val previousWorldX = playerWorldX
        playerWorldX += speed * dt
        velocityY += GRAVITY * dt
        playerY += velocityY * dt

        val feet = playerY + PLAYER_HEIGHT

        // Running into a taller facade: the wall stops the runner, who then
        // slides down the bricks into the alley (gravity finishes the run).
        val wall = houses.firstOrNull { candidate ->
            previousWorldX + PLAYER_WIDTH <= candidate.x &&
                playerWorldX + PLAYER_WIDTH > candidate.x &&
                feet > candidate.roofY + 4f
        }
        if (wall != null) {
            playerWorldX = wall.x - PLAYER_WIDTH
        }

        val left = playerWorldX
        val right = playerWorldX + PLAYER_WIDTH
        val centerX = left + PLAYER_WIDTH / 2f
        val house = houseUnder(left, right)

        // Chimney checks come first: the chimney owns its slice of the roof.
        val chimneyOffset = house?.chimneyOffset
        if (house != null && chimneyOffset != null) {
            val chimneyLeft = house.x + chimneyOffset
            val chimneyRight = chimneyLeft + CHIMNEY_WIDTH
            val chimneyTop = house.roofY - CHIMNEY_HEIGHT
            val openingLeft = chimneyLeft + CHIMNEY_LIP
            val openingRight = chimneyRight - CHIMNEY_LIP
            val overlapsChimney = right > chimneyLeft && left < chimneyRight

            if (velocityY > 0f && previousFeet <= chimneyTop && feet >= chimneyTop && overlapsChimney) {
                if (centerX >= openingLeft && centerX <= openingRight) {
                    // Cooked: dropped straight down the flue, onto the stove.
                    isOver = true
                    ending = EventKind.COOKED
                    events.add(Event(EventKind.COOKED, score))
                    return events
                }
                // Caught the brick rim: stand on the chimney like a mini
                // roof. Still counts as making the house.
                playerY = chimneyTop - PLAYER_HEIGHT
                velocityY = 0f
                isOnRoof = true
                coyoteRemaining = COYOTE_TIME
                if (!house.cleared && house.index > 0) {
                    house.cleared = true
                    housesCleared += 1
                    events.add(Event(EventKind.HOP, housesCleared))
                }
                ensureHouses()
                return events
            }

            // Bonked: running face-first into the brick side while below the
            // chimney's rim. The runner drops where they stand.
            if (
                previousWorldX + PLAYER_WIDTH <= chimneyLeft &&
                right > chimneyLeft &&
                feet > chimneyTop + 4f
            ) {
                isOver = true
                ending = EventKind.BONKED
                events.add(Event(EventKind.BONKED, score))
                return events
            }
        }

        // Landing: falling onto (or running along) a roof snaps the feet to
        // the roof line. Only the roof the feet actually crossed counts.
        if (house != null && velocityY >= 0f && previousFeet <= house.roofY && feet >= house.roofY) {
            playerY = house.roofY - PLAYER_HEIGHT
            velocityY = 0f
            isOnRoof = true
            coyoteRemaining = COYOTE_TIME
            if (jumpBufferRemaining > 0f) {
                jumpBufferRemaining = 0f
                velocityY = JUMP_VELOCITY
                isOnRoof = false
                if (!isJumpHeld) {
                    velocityY *= JUMP_CUT_FACTOR
                }
            }
            if (!house.cleared && house.index > 0) {
                house.cleared = true
                housesCleared += 1
                events.add(Event(EventKind.HOP, housesCleared))
            }
        } else if (isOnRoof && (house == null || feet < house.roofY - 1f)) {
            // Ran off an edge: start falling with the coyote window open.
            isOnRoof = false
        }

        if (!isOnRoof) {
            coyoteRemaining = max(0f, coyoteRemaining - dt)
        }
        jumpBufferRemaining = max(0f, jumpBufferRemaining - dt)

        // Fell: past every roof line, into the street between the houses.
        if (playerY + PLAYER_HEIGHT > FIELD_HEIGHT) {
            isOver = true
            ending = EventKind.FELL
            events.add(Event(EventKind.FELL, score))
            return events
        }

        ensureHouses()
        return events
    }

    /** The house whose roof span overlaps the runner's footprint, if any. */
    private fun houseUnder(left: Float, right: Float): House? {
        // Prefer the house under the runner's center of mass so an edge
        // straddle resolves to the roof most of the runner stands on.
        val center = (left + right) / 2f
        return houses.firstOrNull { center >= it.x && center < it.x + it.width }
            ?: houses.firstOrNull { right > it.x && left < it.x + it.width }
    }

    /** Keep the street generated one screen past the camera's right edge. */
    private fun ensureHouses() {
        while (frontier < playerWorldX + FIELD_WIDTH * 1.5f) {
            pushHouse(isFirst = false)
        }
        // Drop houses fully behind the camera.
        houses.removeAll { it.x + it.width <= playerWorldX - FIELD_WIDTH }
    }

    /**
     * Generate the next house (RNG order: width, gap, roof rise, chimney
     * position — matching the web engine). All horizontal sizes are rolled
     * in seconds of travel at the current speed, so the street stays fair
     * as the run accelerates. The first house of a run starts at the
     * frontier with no gap; warm-up houses skip the chimney.
     */
    private fun pushHouse(isFirst: Boolean) {
        val width =
            speed * (HOUSE_SECONDS_MIN + random.nextFloat() * (HOUSE_SECONDS_MAX - HOUSE_SECONDS_MIN))
        val gap = if (isFirst) {
            0f
        } else {
            speed * (GAP_SECONDS_MIN + random.nextFloat() * (GAP_SECONDS_MAX - GAP_SECONDS_MIN))
        }

        val previousRoof = houses.lastOrNull()?.roofY ?: ((ROOF_Y_MIN + ROOF_Y_MAX) / 2f)
        // Roofs step anywhere down, but at most ROOF_RISE_MAX up.
        val lowestAllowed = max(ROOF_Y_MIN, previousRoof - ROOF_RISE_MAX)
        val roofY = if (isFirst) {
            previousRoof
        } else {
            lowestAllowed + random.nextFloat() * (ROOF_Y_MAX - lowestAllowed)
        }

        val index = nextHouseIndex
        nextHouseIndex += 1

        var chimneyOffset: Float? = null
        val margin = speed * CHIMNEY_MARGIN_SECONDS
        val chimneySpan = width - margin * 2f - CHIMNEY_WIDTH
        if (index >= SAFE_HOUSES && chimneySpan > 0f) {
            chimneyOffset = margin + random.nextFloat() * chimneySpan
        } else if (index >= SAFE_HOUSES) {
            // Roll anyway so narrow houses keep the RNG stream aligned
            // across platforms, then center the chimney.
            random.nextFloat()
            chimneyOffset = max(0f, (width - CHIMNEY_WIDTH) / 2f)
        }

        houses.add(
            House(
                x = frontier + gap,
                width = width,
                roofY = roofY,
                chimneyOffset = chimneyOffset,
                index = index,
                cleared = index == 0,
            ),
        )
        frontier += gap + width
    }

    // Test hooks -----------------------------------------------------------

    /** Test hook: replace the generated street with an exact layout. */
    fun setHouses(layout: List<House>) {
        houses.clear()
        houses.addAll(layout)
        frontier = Float.MAX_VALUE
    }

    /** Test hook: place the runner at an exact spot with a velocity. */
    fun placeRunner(worldX: Float, y: Float, velocityY: Float, onRoof: Boolean) {
        playerWorldX = worldX
        playerY = y
        this.velocityY = velocityY
        isOnRoof = onRoof
    }
}
