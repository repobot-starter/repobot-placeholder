package com.baseapp.android

import com.baseapp.android.view.games.astro.AstroEngine
import kotlin.random.Random
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Exercises the pure game engine against the web AstroGame.tsx rules it
 * mirrors: bullet hits split asteroids by tier, toroidal ship wrapping,
 * lives with a respawn invulnerability window, sector progression on a
 * clear field, and per-tier scoring.
 */
class AstroEngineTest {
    /** Small enough that entity movement within one frame is negligible. */
    private val dt = 0.001f

    private fun engine(): AstroEngine = AstroEngine(random = Random(seed = 7))

    @Test
    fun bulletDestroysLargeAsteroidAndSplitsIntoTwoMediums() {
        val engine = engine()
        engine.removeAllAsteroids()
        engine.addAsteroid(x = 200f, y = 200f, tier = AstroEngine.Tier.LARGE)
        engine.addBullet(x = 200f, y = 200f)

        val result = engine.step(dt)

        assertEquals(listOf(AstroEngine.Tier.LARGE), result.destroyedTiers)
        assertEquals(2, engine.asteroids.size)
        engine.asteroids.forEach { child ->
            assertEquals(AstroEngine.Tier.MEDIUM, child.tier)
            assertEquals(AstroEngine.Tier.MEDIUM.radius, child.radius, 0.001f)
            // Children spawn where the parent died.
            assertEquals(200f, child.x, 1f)
            assertEquals(200f, child.y, 1f)
        }
        // The bullet is consumed by the hit.
        assertTrue(engine.bullets.isEmpty())
        assertEquals(AstroEngine.Tier.LARGE.score, engine.score)
    }

    @Test
    fun mediumSplitsIntoSmallsAndSmallVaporizes() {
        val engine = engine()
        engine.removeAllAsteroids()
        // Far-away filler rock keeps the field non-empty so no sector-clear
        // respawn muddies the assertions.
        engine.addAsteroid(x = 700f, y = 500f, tier = AstroEngine.Tier.LARGE)

        engine.addAsteroid(x = 200f, y = 200f, tier = AstroEngine.Tier.MEDIUM)
        engine.addBullet(x = 200f, y = 200f)
        engine.step(dt)
        val smalls = engine.asteroids.filter { it.tier == AstroEngine.Tier.SMALL }
        assertEquals(2, smalls.size)

        // Now shoot both smalls: they vaporize without children.
        smalls.forEach { engine.addBullet(x = it.x, y = it.y) }
        engine.step(dt)
        assertEquals(1, engine.asteroids.size)
        assertTrue(engine.asteroids.all { it.tier == AstroEngine.Tier.LARGE })
    }

    @Test
    fun scoringPerAsteroidSize() {
        assertEquals(20, scoreDelta(AstroEngine.Tier.LARGE))
        assertEquals(50, scoreDelta(AstroEngine.Tier.MEDIUM))
        assertEquals(100, scoreDelta(AstroEngine.Tier.SMALL))
    }

    @Test
    fun shipWrapsAroundEdges() {
        val engine = engine()

        // Off the right edge (margin = ship radius 14): reappears at -margin.
        engine.placeShip(x = AstroEngine.FIELD_WIDTH + 13.9f, y = 300f, vx = 200f)
        engine.step(0.05f)
        assertEquals(-AstroEngine.SHIP_RADIUS, engine.ship.x, 0.001f)

        // Off the left edge: reappears at width + margin.
        engine.placeShip(x = -13.9f, y = 300f, vx = -200f)
        engine.step(0.05f)
        assertEquals(AstroEngine.FIELD_WIDTH + AstroEngine.SHIP_RADIUS, engine.ship.x, 0.001f)

        // Off the bottom edge: reappears above the top.
        engine.placeShip(x = 400f, y = AstroEngine.FIELD_HEIGHT + 13.9f, vy = 200f)
        engine.step(0.05f)
        assertEquals(-AstroEngine.SHIP_RADIUS, engine.ship.y, 0.001f)
    }

    @Test
    fun collisionCostsALifeWithInvulnerabilityWindow() {
        val engine = engine()
        engine.removeAllAsteroids()
        // Park a rock right on the ship.
        engine.addAsteroid(
            x = AstroEngine.FIELD_WIDTH / 2f,
            y = AstroEngine.FIELD_HEIGHT / 2f,
            tier = AstroEngine.Tier.LARGE,
        )

        // Fresh ships carry a 2s shield: overlapping is harmless at first.
        val shielded = engine.step(dt)
        assertEquals(AstroEngine.STARTING_LIVES, engine.lives)
        assertNull(shielded.shipDestroyedLivesLeft)

        // Drop the shield: the same overlap now costs a life and respawns
        // the ship at center.
        engine.endInvulnerability()
        val result = engine.step(dt)
        assertEquals(AstroEngine.STARTING_LIVES - 1, engine.lives)
        assertEquals(AstroEngine.STARTING_LIVES - 1, result.shipDestroyedLivesLeft)
        assertEquals(AstroEngine.FIELD_WIDTH / 2f, engine.ship.x, 0.001f)
        assertEquals(AstroEngine.FIELD_HEIGHT / 2f, engine.ship.y, 0.001f)

        // The respawned ship has a fresh shield, so it survives the still-
        // overlapping rock on the very next frame.
        assertTrue(engine.isShipInvulnerable)
        engine.step(dt)
        assertEquals(AstroEngine.STARTING_LIVES - 1, engine.lives)
    }

    @Test
    fun losingLastLifeEndsTheGame() {
        val engine = engine()
        engine.removeAllAsteroids()
        engine.addAsteroid(
            x = AstroEngine.FIELD_WIDTH / 2f,
            y = AstroEngine.FIELD_HEIGHT / 2f,
            tier = AstroEngine.Tier.LARGE,
        )

        var last = AstroEngine.StepResult()
        repeat(AstroEngine.STARTING_LIVES) {
            engine.endInvulnerability()
            last = engine.step(dt)
        }

        assertEquals(0, engine.lives)
        assertTrue(engine.isOver)
        assertTrue(last.isGameOver)

        // A finished game is inert: further steps change nothing.
        val after = engine.step(dt)
        assertFalse(after.isGameOver)
        assertEquals(0, engine.lives)
    }

    @Test
    fun waveAdvancesWhenFieldIsClear() {
        val engine = engine()
        assertEquals(1, engine.level)
        // Sector 1 spawns 2 + 1 large rocks.
        assertEquals(3, engine.asteroids.size)

        engine.removeAllAsteroids()
        val result = engine.step(dt)

        assertEquals(2, result.sectorClearedLevel)
        assertEquals(2, engine.level)
        // Sector 2 spawns 2 + 2 fresh large rocks, plus the +250 bonus.
        assertEquals(4, engine.asteroids.size)
        assertTrue(engine.asteroids.all { it.tier == AstroEngine.Tier.LARGE })
        assertEquals(AstroEngine.SECTOR_BONUS, engine.score)
    }

    @Test
    fun bulletsExpireAfterLifetime() {
        val engine = engine()
        engine.removeAllAsteroids()
        engine.addAsteroid(x = 700f, y = 500f, tier = AstroEngine.Tier.LARGE) // keep the field busy
        engine.addBullet(x = 100f, y = 100f)

        // Just before the 1.1s lifetime: still flying.
        repeat(21) { engine.step(0.05f) }
        assertEquals(1, engine.bullets.size)

        // Past the lifetime: culled.
        repeat(3) { engine.step(0.05f) }
        assertTrue(engine.bullets.isEmpty())
    }

    // Destroys a single rock of [tier] (with a far-away filler so the field
    // never empties) and returns the score it awarded.
    private fun scoreDelta(tier: AstroEngine.Tier): Int {
        val engine = engine()
        engine.removeAllAsteroids()
        engine.addAsteroid(x = 700f, y = 500f, tier = AstroEngine.Tier.LARGE)
        engine.addAsteroid(x = 200f, y = 200f, tier = tier)
        engine.addBullet(x = 200f, y = 200f)
        val before = engine.score
        engine.step(dt)
        return engine.score - before
    }
}
