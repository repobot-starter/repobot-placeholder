import React, { useEffect, useRef } from "react"
import {
    Asteroid,
    AsteroidTier,
    Bullet,
    Particle,
    Ship,
    Star,
    makeAsteroid,
    makeBullet,
    makeExplosion,
    makeShip,
    makeStars,
    spawnAsteroidAt,
    wrap,
} from "./entities"
import * as styles from "./AstroPage.styles.css"

export const SPACE_WIDTH = 820
export const SPACE_HEIGHT = 620

const TURN_SPEED = 3.6
const THRUST = 300
const DRAG = 0.4
const FIRE_COOLDOWN_MS = 180
const BULLET_LIFE_MS = 1100
const STARTING_LIVES = 3
const SCORE_BY_TIER: Record<AsteroidTier, number> = { 3: 20, 2: 50, 1: 100 }

export interface AstroHud {
    score: number
    lives: number
    level: number
}

export interface AstroResult {
    score: number
    level: number
}

interface AstroSettings {
    paused: boolean
    onHud?: (hud: AstroHud) => void
    onGameOver?: (result: AstroResult) => void
}

interface GameState {
    ship: Ship
    stars: Star[]
    asteroids: Asteroid[]
    bullets: Bullet[]
    particles: Particle[]
    keys: Set<string>
    score: number
    lives: number
    level: number
    over: boolean
    lastShotAt: number
}

/**
 * The space field. requestAnimationFrame loop with state in refs; the parent
 * owns HUD/overlays and receives score/lives/level/game-over callbacks.
 * Controls: left/right rotate, up thrusts, space shoots.
 */
export default function AstroGame(props: AstroSettings & { resetToken: number }): React.ReactElement {
    const { resetToken, ...settings } = props
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const gameRef = useRef<GameState | null>(null)
    const settingsRef = useRef<AstroSettings>(settings)
    settingsRef.current = settings

    useEffect(() => {
        const game: GameState = {
            ship: makeShip(SPACE_WIDTH, SPACE_HEIGHT),
            stars: makeStars(SPACE_WIDTH, SPACE_HEIGHT),
            asteroids: [],
            bullets: [],
            particles: [],
            keys: new Set(),
            score: 0,
            lives: STARTING_LIVES,
            level: 1,
            over: false,
            lastShotAt: 0,
        }
        startLevel(game, 1)
        gameRef.current = game
        settingsRef.current.onHud?.({ score: 0, lives: STARTING_LIVES, level: 1 })
    }, [resetToken])

    useEffect(() => {
        const relevant = ["arrowleft", "arrowright", "arrowup", " ", "a", "d", "w"]
        const handle = (down: boolean) => (event: KeyboardEvent) => {
            const key = event.key.toLowerCase()
            const keys = gameRef.current?.keys
            if (!keys || !relevant.includes(key)) {
                return
            }
            event.preventDefault()
            if (down) {
                keys.add(key)
            } else {
                keys.delete(key)
            }
        }
        const downHandler = handle(true)
        const upHandler = handle(false)
        window.addEventListener("keydown", downHandler)
        window.addEventListener("keyup", upHandler)
        return () => {
            window.removeEventListener("keydown", downHandler)
            window.removeEventListener("keyup", upHandler)
        }
    }, [])

    useEffect(() => {
        const ctx = canvasRef.current?.getContext("2d")
        if (!ctx) {
            return
        }
        let frameId: number
        let lastTime = performance.now()

        const tick = (now: number): void => {
            frameId = requestAnimationFrame(tick)
            const dt = Math.min(0.05, (now - lastTime) / 1000)
            lastTime = now
            const game = gameRef.current
            if (!game) {
                return
            }
            if (!settingsRef.current.paused && !game.over) {
                step(game, settingsRef.current, dt, now)
            }
            draw(ctx, game, now)
        }
        frameId = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frameId)
    }, [])

    return <canvas ref={canvasRef} width={SPACE_WIDTH} height={SPACE_HEIGHT} className={styles.space} />
}

function startLevel(game: GameState, level: number): void {
    game.level = level
    game.asteroids = Array.from({ length: 2 + level }, () =>
        makeAsteroid(SPACE_WIDTH, SPACE_HEIGHT, 3, game.ship),
    )
}

function step(game: GameState, settings: AstroSettings, dt: number, now: number): void {
    const { ship, keys } = game

    if (keys.has("arrowleft") || keys.has("a")) {
        ship.angle -= TURN_SPEED * dt
    }
    if (keys.has("arrowright") || keys.has("d")) {
        ship.angle += TURN_SPEED * dt
    }
    const thrusting = keys.has("arrowup") || keys.has("w")
    if (thrusting) {
        ship.vx += Math.cos(ship.angle) * THRUST * dt
        ship.vy += Math.sin(ship.angle) * THRUST * dt
    }
    ship.vx *= 1 - DRAG * dt
    ship.vy *= 1 - DRAG * dt
    ship.x += ship.vx * dt
    ship.y += ship.vy * dt
    ship.thrusting = thrusting
    wrap(ship, SPACE_WIDTH, SPACE_HEIGHT, ship.radius)

    if (keys.has(" ") && now - game.lastShotAt > FIRE_COOLDOWN_MS) {
        game.lastShotAt = now
        game.bullets.push(makeBullet(ship))
    }

    game.bullets = game.bullets.filter((bullet) => now - bullet.bornAt < BULLET_LIFE_MS)
    for (const bullet of game.bullets) {
        bullet.x += bullet.vx * dt
        bullet.y += bullet.vy * dt
        wrap(bullet, SPACE_WIDTH, SPACE_HEIGHT)
    }

    for (const asteroid of game.asteroids) {
        asteroid.x += asteroid.vx * dt
        asteroid.y += asteroid.vy * dt
        asteroid.rotation += asteroid.spin * dt
        wrap(asteroid, SPACE_WIDTH, SPACE_HEIGHT, asteroid.radius)
    }

    game.particles = game.particles.filter((particle) => (particle.life -= dt) > 0)
    for (const particle of game.particles) {
        particle.x += particle.vx * dt
        particle.y += particle.vy * dt
    }

    // Bullet -> asteroid hits (asteroids split until tier 1)
    const survivors: Asteroid[] = []
    for (const asteroid of game.asteroids) {
        const hitIndex = game.bullets.findIndex(
            (bullet) => Math.hypot(bullet.x - asteroid.x, bullet.y - asteroid.y) < asteroid.radius,
        )
        if (hitIndex === -1) {
            survivors.push(asteroid)
            continue
        }
        game.bullets.splice(hitIndex, 1)
        game.score += SCORE_BY_TIER[asteroid.tier]
        game.particles.push(...makeExplosion(asteroid.x, asteroid.y, "#ff9d5c"))
        if (asteroid.tier > 1) {
            const smallerTier = (asteroid.tier - 1) as AsteroidTier
            survivors.push(
                spawnAsteroidAt(asteroid.x, asteroid.y, smallerTier),
                spawnAsteroidAt(asteroid.x, asteroid.y, smallerTier),
            )
        }
    }
    game.asteroids = survivors

    // Asteroid -> ship collision
    const invulnerable = now < game.ship.invulnerableUntil
    if (!invulnerable) {
        const collision = game.asteroids.find(
            (asteroid) =>
                Math.hypot(asteroid.x - ship.x, asteroid.y - ship.y) < asteroid.radius + ship.radius - 4,
        )
        if (collision) {
            game.lives -= 1
            game.particles.push(...makeExplosion(ship.x, ship.y, "#57c8ff"))
            if (game.lives <= 0) {
                game.over = true
                settings.onGameOver?.({ score: game.score, level: game.level })
            } else {
                game.ship = makeShip(SPACE_WIDTH, SPACE_HEIGHT)
            }
        }
    }

    if (game.asteroids.length === 0) {
        startLevel(game, game.level + 1)
        game.score += 250
    }

    settings.onHud?.({ score: game.score, lives: game.lives, level: game.level })
}

function draw(ctx: CanvasRenderingContext2D, game: GameState, now: number): void {
    ctx.fillStyle = "#05030f"
    ctx.fillRect(0, 0, SPACE_WIDTH, SPACE_HEIGHT)

    // Parallax starfield drifts slowly
    for (const star of game.stars) {
        const drift = (now / 1000) * 4 * star.depth
        const x = (star.x + drift) % SPACE_WIDTH
        ctx.fillStyle = `rgba(255, 255, 255, ${0.25 + star.depth * 0.55})`
        ctx.fillRect(x, star.y, star.depth > 0.75 ? 2 : 1, star.depth > 0.75 ? 2 : 1)
    }

    // Asteroids: lumpy neon outlines
    for (const asteroid of game.asteroids) {
        ctx.save()
        ctx.translate(asteroid.x, asteroid.y)
        ctx.rotate(asteroid.rotation)
        ctx.beginPath()
        asteroid.lumps.forEach((lump, index) => {
            const angle = (index / asteroid.lumps.length) * Math.PI * 2
            const radius = asteroid.radius * lump
            const px = Math.cos(angle) * radius
            const py = Math.sin(angle) * radius
            if (index === 0) {
                ctx.moveTo(px, py)
            } else {
                ctx.lineTo(px, py)
            }
        })
        ctx.closePath()
        ctx.strokeStyle = "#b98cff"
        ctx.lineWidth = 2
        ctx.shadowColor = "#b98cff"
        ctx.shadowBlur = 10
        ctx.stroke()
        ctx.restore()
    }

    // Bullets
    ctx.fillStyle = "#7cf29c"
    ctx.shadowColor = "#7cf29c"
    ctx.shadowBlur = 8
    for (const bullet of game.bullets) {
        ctx.fillRect(bullet.x - 2, bullet.y - 2, 4, 4)
    }
    ctx.shadowBlur = 0

    // Particles
    for (const particle of game.particles) {
        ctx.globalAlpha = Math.max(0, particle.life)
        ctx.fillStyle = particle.color
        ctx.fillRect(particle.x, particle.y, 3, 3)
    }
    ctx.globalAlpha = 1

    // Ship (blinks while invulnerable)
    const ship = game.ship
    const invulnerable = now < ship.invulnerableUntil
    if (!game.over && (!invulnerable || Math.floor(now / 120) % 2 === 0)) {
        ctx.save()
        ctx.translate(ship.x, ship.y)
        ctx.rotate(ship.angle + Math.PI / 2)
        if (ship.thrusting) {
            ctx.beginPath()
            ctx.moveTo(-5, 14)
            ctx.lineTo(0, 24 + Math.random() * 8)
            ctx.lineTo(5, 14)
            ctx.closePath()
            ctx.fillStyle = "#ffb347"
            ctx.shadowColor = "#ffb347"
            ctx.shadowBlur = 12
            ctx.fill()
        }
        ctx.beginPath()
        ctx.moveTo(0, -16)
        ctx.lineTo(11, 13)
        ctx.lineTo(0, 7)
        ctx.lineTo(-11, 13)
        ctx.closePath()
        ctx.strokeStyle = "#57c8ff"
        ctx.lineWidth = 2
        ctx.shadowColor = "#57c8ff"
        ctx.shadowBlur = 12
        ctx.stroke()
        ctx.restore()
    }
}
