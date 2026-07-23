package com.baseapp.android.view.games.astro

import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.min
import kotlin.math.sin
import kotlin.random.Random

/**
 * Pure Kotlin port of the web AstroBot physics
 * (`web/app/src/View/Games/Astro/AstroGame.tsx` + `entities.ts`) so the exact
 * same rules run on every platform and can be unit-tested on the JVM. No
 * Android or Compose imports here — rendering and input live in
 * `AstroGameView`.
 *
 * Controls arrive as held-input flags ([isTurningLeft] etc.) — the native
 * twin of the web's pressed-keys set — so the view layer only translates
 * touches into booleans and never touches the rules.
 *
 * All coordinates are in field units (820x620, y growing downward); the view
 * scales the field to the device while preserving the aspect ratio. Time is
 * the engine's own [elapsed] clock (the web uses `performance.now()`), so
 * identical steps always produce identical states.
 *
 * Randomness (asteroid spawn position/speed/shape, debris spray) goes through
 * an injected [Random] so tests can make the simulation fully deterministic.
 */
class AstroEngine(private val random: Random = Random.Default) {
    /**
     * Asteroid size tiers: radius (px), base drift speed (px/s, scaled
     * 0.7–1.3x at spawn) and score — the web `radiusByTier` / `speedByTier` /
     * `SCORE_BY_TIER` tables exactly.
     */
    enum class Tier(val radius: Float, val speed: Float, val score: Int) {
        SMALL(15f, 110f, 100),
        MEDIUM(28f, 70f, 50),
        LARGE(46f, 40f, 20);

        /** Tier the two split children spawn at; null rocks vaporize outright. */
        val smaller: Tier?
            get() = when (this) {
                LARGE -> MEDIUM
                MEDIUM -> SMALL
                SMALL -> null
            }
    }

    /** The player ship; `angle` is the heading in radians (-π/2 points up). */
    class Ship(
        var x: Float,
        var y: Float,
        var angle: Float,
        var vx: Float = 0f,
        var vy: Float = 0f,
        /** Engine-clock time (s) the respawn shield drops. */
        var invulnerableUntil: Float = 0f,
        var thrusting: Boolean = false,
    )

    /**
     * One rock. `spin`/`rotation`/`lumps` are the baked-once lumpy silhouette
     * from the web `spawnAsteroidAt`, carried in the engine because they are
     * part of the deterministic RNG stream.
     */
    class Asteroid(
        var x: Float,
        var y: Float,
        var vx: Float,
        var vy: Float,
        val tier: Tier,
        val spin: Float,
        var rotation: Float = 0f,
        /** Radius multipliers (0.75–1.25) for each silhouette vertex. */
        val lumps: List<Float>,
    ) {
        val radius: Float get() = tier.radius
    }

    class Bullet(
        var x: Float,
        var y: Float,
        var vx: Float,
        var vy: Float,
        /** Engine-clock time (s) the bullet was fired. */
        val bornAt: Float,
    )

    /**
     * Explosion debris color family — the web passes literal hex colors into
     * `makeExplosion`; the engine only records which palette entry to use.
     */
    enum class ParticleKind { ASTEROID_DEBRIS, SHIP_DEBRIS }

    class Particle(
        var x: Float,
        var y: Float,
        var vx: Float,
        var vy: Float,
        /** Remaining life in seconds; the renderer uses it as the fade alpha. */
        var life: Float,
        val kind: ParticleKind,
    )

    /**
     * Discrete things that happened during one [step] — the native twin of
     * the web game's HUD/game-over callbacks. Null/empty fields mean
     * "nothing happened".
     */
    data class StepResult(
        val destroyedTiers: List<Tier> = emptyList(),
        /** Lives remaining after a ship-destroying hit, or null if unharmed. */
        val shipDestroyedLivesLeft: Int? = null,
        /** The new sector number when the field was cleared this step. */
        val sectorClearedLevel: Int? = null,
        val isGameOver: Boolean = false,
    )

    // Held inputs, set by the view every time a touch begins/ends. These are
    // the native equivalent of the web's `keys` set (←/→, ↑, space).
    var isTurningLeft = false
    var isTurningRight = false
    var isThrusting = false
    var isFiring = false

    /**
     * Engine clock in seconds, advanced by [step]. Replaces the web's
     * `performance.now()` so the simulation stays pure and step-driven.
     * (Declared before [ship]: `freshShip()` reads it.)
     */
    var elapsed: Float = 0f
        private set

    var ship: Ship = freshShip()
        private set

    private val mutableAsteroids = mutableListOf<Asteroid>()
    val asteroids: List<Asteroid> get() = mutableAsteroids

    private val mutableBullets = mutableListOf<Bullet>()
    val bullets: List<Bullet> get() = mutableBullets

    private val mutableParticles = mutableListOf<Particle>()
    val particles: List<Particle> get() = mutableParticles

    var score: Int = 0
        private set
    var lives: Int = STARTING_LIVES
        private set
    var level: Int = 1
        private set
    var isOver: Boolean = false
        private set

    private var lastShotAt = Float.NEGATIVE_INFINITY

    val isShipInvulnerable: Boolean get() = elapsed < ship.invulnerableUntil

    init {
        startLevel(1)
    }

    /** Full reset; the web equivalent is the resetToken effect. */
    fun newGame() {
        elapsed = 0f
        score = 0
        lives = STARTING_LIVES
        isOver = false
        mutableBullets.clear()
        mutableParticles.clear()
        lastShotAt = Float.NEGATIVE_INFINITY
        ship = freshShip()
        startLevel(1)
    }

    /**
     * Advance the simulation by [dtSeconds] (clamped to 50ms like the web
     * loop, so a background pause never produces a huge tunnel-through
     * step). Mirrors the web `step` frame-for-frame: turn, thrust, drag,
     * move+wrap ship, fire, move bullets/asteroids/particles,
     * bullet↔asteroid hits (with splitting), asteroid↔ship collision, and
     * the next-sector check.
     */
    fun step(dtSeconds: Float): StepResult {
        if (isOver) {
            return StepResult()
        }
        val dt = min(dtSeconds, MAX_STEP_SECONDS)
        elapsed += dt
        val now = elapsed

        // Ship: rotate, thrust, drag, integrate, wrap (margin = ship radius).
        if (isTurningLeft) {
            ship.angle -= TURN_SPEED * dt
        }
        if (isTurningRight) {
            ship.angle += TURN_SPEED * dt
        }
        if (isThrusting) {
            ship.vx += cos(ship.angle) * THRUST * dt
            ship.vy += sin(ship.angle) * THRUST * dt
        }
        ship.vx *= 1 - DRAG * dt
        ship.vy *= 1 - DRAG * dt
        ship.x += ship.vx * dt
        ship.y += ship.vy * dt
        ship.thrusting = isThrusting
        ship.x = wrapX(ship.x, SHIP_RADIUS)
        ship.y = wrapY(ship.y, SHIP_RADIUS)

        // Fire from the nose, inheriting ship velocity (web makeBullet).
        if (isFiring && now - lastShotAt > FIRE_COOLDOWN_SECONDS) {
            lastShotAt = now
            mutableBullets.add(
                Bullet(
                    x = ship.x + cos(ship.angle) * SHIP_RADIUS,
                    y = ship.y + sin(ship.angle) * SHIP_RADIUS,
                    vx = ship.vx + cos(ship.angle) * BULLET_SPEED,
                    vy = ship.vy + sin(ship.angle) * BULLET_SPEED,
                    bornAt = now,
                ),
            )
        }

        // Bullets: expire, move, wrap (no margin, like web).
        mutableBullets.removeAll { now - it.bornAt >= BULLET_LIFE_SECONDS }
        for (bullet in mutableBullets) {
            bullet.x += bullet.vx * dt
            bullet.y += bullet.vy * dt
            bullet.x = wrapX(bullet.x, 0f)
            bullet.y = wrapY(bullet.y, 0f)
        }

        // Asteroids: drift, spin, wrap (margin = own radius).
        for (asteroid in mutableAsteroids) {
            asteroid.x += asteroid.vx * dt
            asteroid.y += asteroid.vy * dt
            asteroid.rotation += asteroid.spin * dt
            asteroid.x = wrapX(asteroid.x, asteroid.radius)
            asteroid.y = wrapY(asteroid.y, asteroid.radius)
        }

        // Particles: age out, survivors drift (web filters then moves).
        for (particle in mutableParticles) {
            particle.life -= dt
        }
        mutableParticles.removeAll { it.life <= 0f }
        for (particle in mutableParticles) {
            particle.x += particle.vx * dt
            particle.y += particle.vy * dt
        }

        // Bullet -> asteroid hits: the first overlapping bullet is consumed,
        // the rock scores and splits until SMALL (two children per split).
        val destroyedTiers = mutableListOf<Tier>()
        val survivors = mutableListOf<Asteroid>()
        for (asteroid in mutableAsteroids) {
            val hit = mutableBullets.firstOrNull {
                hypot(it.x - asteroid.x, it.y - asteroid.y) < asteroid.radius
            }
            if (hit == null) {
                survivors.add(asteroid)
                continue
            }
            mutableBullets.remove(hit)
            score += asteroid.tier.score
            spawnExplosion(asteroid.x, asteroid.y, ParticleKind.ASTEROID_DEBRIS)
            destroyedTiers.add(asteroid.tier)
            asteroid.tier.smaller?.let { childTier ->
                survivors.add(spawnAsteroidAt(asteroid.x, asteroid.y, childTier))
                survivors.add(spawnAsteroidAt(asteroid.x, asteroid.y, childTier))
            }
        }
        mutableAsteroids.clear()
        mutableAsteroids.addAll(survivors)

        // Asteroid -> ship collision (web pads the hit circle by -4 px to be
        // forgiving). Skipped entirely while the respawn shield is up.
        var shipDestroyedLivesLeft: Int? = null
        if (!isShipInvulnerable) {
            val collided = mutableAsteroids.any {
                hypot(it.x - ship.x, it.y - ship.y) < it.radius + SHIP_RADIUS - 4f
            }
            if (collided) {
                lives -= 1
                spawnExplosion(ship.x, ship.y, ParticleKind.SHIP_DEBRIS)
                if (lives <= 0) {
                    isOver = true
                    return StepResult(
                        destroyedTiers = destroyedTiers,
                        shipDestroyedLivesLeft = 0,
                        isGameOver = true,
                    )
                }
                shipDestroyedLivesLeft = lives
                ship = freshShip()
            }
        }

        // Field clear: next sector spawns immediately plus the +250 bonus.
        var sectorClearedLevel: Int? = null
        if (mutableAsteroids.isEmpty()) {
            startLevel(level + 1)
            score += SECTOR_BONUS
            sectorClearedLevel = level
        }

        return StepResult(
            destroyedTiers = destroyedTiers,
            shipDestroyedLivesLeft = shipDestroyedLivesLeft,
            sectorClearedLevel = sectorClearedLevel,
        )
    }

    /** Fresh centered ship with the 2s shield (web `makeShip`). */
    private fun freshShip(): Ship = Ship(
        x = FIELD_WIDTH / 2f,
        y = FIELD_HEIGHT / 2f,
        angle = (-PI / 2).toFloat(),
        invulnerableUntil = elapsed + RESPAWN_INVULNERABILITY_SECONDS,
    )

    /**
     * Populate a sector: `2 + level` large rocks kept away from the ship
     * (web `startLevel` + `makeAsteroid`). The web rejection-samples with an
     * unbounded do/while; we cap the attempts so a pathological RNG can
     * never hang the engine.
     */
    private fun startLevel(newLevel: Int) {
        level = newLevel
        mutableAsteroids.clear()
        repeat(2 + newLevel) {
            var x = random.nextFloat() * FIELD_WIDTH
            var y = random.nextFloat() * FIELD_HEIGHT
            var attempts = 0
            while (hypot(x - ship.x, y - ship.y) < SAFE_SPAWN_DISTANCE && attempts < 100) {
                x = random.nextFloat() * FIELD_WIDTH
                y = random.nextFloat() * FIELD_HEIGHT
                attempts += 1
            }
            mutableAsteroids.add(spawnAsteroidAt(x, y, Tier.LARGE))
        }
    }

    /**
     * Web `spawnAsteroidAt`: random heading, 0.7–1.3x tier speed, random
     * spin and a baked lumpy silhouette of 9–12 vertices. RNG call order
     * matches the web factory so seeded runs stay comparable.
     */
    private fun spawnAsteroidAt(x: Float, y: Float, tier: Tier): Asteroid {
        val angle = random.nextFloat() * PI.toFloat() * 2f
        val speed = tier.speed * (0.7f + random.nextFloat() * 0.6f)
        val pointCount = 9 + (random.nextFloat() * 4f).toInt()
        return Asteroid(
            x = x,
            y = y,
            vx = cos(angle) * speed,
            vy = sin(angle) * speed,
            tier = tier,
            spin = (random.nextFloat() - 0.5f) * 1.6f,
            lumps = List(pointCount) { 0.75f + random.nextFloat() * 0.5f },
        )
    }

    /** Web `makeExplosion`: 14 debris sparks with random spread and lifetime. */
    private fun spawnExplosion(x: Float, y: Float, kind: ParticleKind) {
        repeat(14) {
            val angle = random.nextFloat() * PI.toFloat() * 2f
            val speed = 40f + random.nextFloat() * 140f
            mutableParticles.add(
                Particle(
                    x = x,
                    y = y,
                    vx = cos(angle) * speed,
                    vy = sin(angle) * speed,
                    life = 0.5f + random.nextFloat() * 0.4f,
                    kind = kind,
                ),
            )
        }
    }

    /** Toroidal wrap for the x axis with a per-entity margin (web `wrap`). */
    private fun wrapX(x: Float, margin: Float): Float = when {
        x < -margin -> FIELD_WIDTH + margin
        x > FIELD_WIDTH + margin -> -margin
        else -> x
    }

    /** Toroidal wrap for the y axis with a per-entity margin (web `wrap`). */
    private fun wrapY(y: Float, margin: Float): Float = when {
        y < -margin -> FIELD_HEIGHT + margin
        y > FIELD_HEIGHT + margin -> -margin
        else -> y
    }

    // Test hooks (internal, like PongEngine.placeBall): build exact scenarios.

    /**
     * Test hook: clear the rock field. (The next [step] will treat an empty
     * field as a cleared sector.)
     */
    internal fun removeAllAsteroids() {
        mutableAsteroids.clear()
    }

    /** Test hook: spawn a rock at an exact spot with an exact velocity. */
    internal fun addAsteroid(x: Float, y: Float, tier: Tier, vx: Float = 0f, vy: Float = 0f) {
        val asteroid = spawnAsteroidAt(x, y, tier)
        asteroid.vx = vx
        asteroid.vy = vy
        mutableAsteroids.add(asteroid)
    }

    /** Test hook: place a live bullet directly. */
    internal fun addBullet(x: Float, y: Float, vx: Float = 0f, vy: Float = 0f) {
        mutableBullets.add(Bullet(x, y, vx, vy, bornAt = elapsed))
    }

    /** Test hook: teleport the ship. */
    internal fun placeShip(x: Float, y: Float, vx: Float = 0f, vy: Float = 0f) {
        ship.x = x
        ship.y = y
        ship.vx = vx
        ship.vy = vy
    }

    /** Test hook: drop the respawn shield immediately. */
    internal fun endInvulnerability() {
        ship.invulnerableUntil = -1f
    }

    companion object {
        // Field geometry and tuning — must stay byte-for-byte in sync with
        // the web constants in AstroGame.tsx / entities.ts.
        const val FIELD_WIDTH = 820f
        const val FIELD_HEIGHT = 620f
        const val TURN_SPEED = 3.6f
        const val THRUST = 300f
        const val DRAG = 0.4f

        /** Web FIRE_COOLDOWN_MS = 180. */
        const val FIRE_COOLDOWN_SECONDS = 0.18f

        /** Web BULLET_LIFE_MS = 1100. */
        const val BULLET_LIFE_SECONDS = 1.1f
        const val BULLET_SPEED = 460f
        const val STARTING_LIVES = 3
        const val SHIP_RADIUS = 14f

        /** Fresh ships are safe for 2s (web `makeShip`: now + 2000). */
        const val RESPAWN_INVULNERABILITY_SECONDS = 2f

        /** Bonus for clearing a sector. */
        const val SECTOR_BONUS = 250

        /** New rocks never spawn within this distance of the ship (web: 160). */
        const val SAFE_SPAWN_DISTANCE = 160f
        const val MAX_STEP_SECONDS = 0.05f
    }
}
