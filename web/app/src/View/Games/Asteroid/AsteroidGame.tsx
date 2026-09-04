import React, { useEffect, useRef } from "react"
import { useAnimationFrameLoop } from "../../../Utils/useAnimationFrameLoop"
import { sounds } from "./audio"
import * as styles from "./AsteroidPage.styles.css"

export const FIELD_WIDTH = 800
export const FIELD_HEIGHT = 600

const SHIP_RADIUS = 13
const TURN_SPEED = 3.6 // rad/s
const THRUST = 260 // px/s^2
const DRAG = 0.35 // fraction of velocity shed per second
const MAX_SPEED = 420
const BULLET_SPEED = 520
const BULLET_LIFE_MS = 900
const FIRE_COOLDOWN_MS = 180
const RESPAWN_DELAY_MS = 1200
const INVULNERABLE_MS = 2200
const START_LIVES = 3
const FIRST_WAVE_ROCKS = 4

// Radius, score, and how many children a rock splits into.
const ROCK_TIERS = [
    { radius: 44, score: 20, children: 2 },
    { radius: 25, score: 50, children: 2 },
    { radius: 13, score: 100, children: 0 },
]

export interface AsteroidResult {
    score: number
    wave: number
}

interface AsteroidSettings {
    running: boolean
    paused: boolean
    soundOn: boolean
    onScore?: (score: number) => void
    onLives?: (lives: number) => void
    onWave?: (wave: number) => void
    onGameOver?: (result: AsteroidResult) => void
}

interface Rock {
    x: number
    y: number
    vx: number
    vy: number
    tier: number
    spin: number
    angle: number
    /** Vertex radii as fractions of the tier radius; gives each rock its shape. */
    shape: number[]
}

interface Bullet {
    x: number
    y: number
    vx: number
    vy: number
    bornAt: number
}

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    bornAt: number
    lifeMs: number
}

interface GameState {
    shipX: number
    shipY: number
    shipVx: number
    shipVy: number
    shipAngle: number
    alive: boolean
    respawnAt: number
    invulnerableUntil: number
    lives: number
    score: number
    wave: number
    rocks: Rock[]
    bullets: Bullet[]
    particles: Particle[]
    lastFireAt: number
    over: boolean
    keys: Set<string>
}

function makeRock(x: number, y: number, tier: number): Rock {
    const speed = 30 + Math.random() * 50 + tier * 22
    const heading = Math.random() * Math.PI * 2
    const vertexCount = 10 + Math.floor(Math.random() * 3)
    return {
        x,
        y,
        vx: Math.cos(heading) * speed,
        vy: Math.sin(heading) * speed,
        tier,
        spin: (Math.random() - 0.5) * 1.6,
        angle: Math.random() * Math.PI * 2,
        shape: Array.from({ length: vertexCount }, () => 0.72 + Math.random() * 0.36),
    }
}

/** Spawns a wave of large rocks away from the ship so respawns are fair. */
function spawnWave(game: GameState, count: number): void {
    for (let i = 0; i < count; i++) {
        let x = 0
        let y = 0
        do {
            x = Math.random() * FIELD_WIDTH
            y = Math.random() * FIELD_HEIGHT
        } while (Math.hypot(x - game.shipX, y - game.shipY) < 180)
        game.rocks.push(makeRock(x, y, 0))
    }
}

function freshGame(): GameState {
    const game: GameState = {
        shipX: FIELD_WIDTH / 2,
        shipY: FIELD_HEIGHT / 2,
        shipVx: 0,
        shipVy: 0,
        shipAngle: -Math.PI / 2,
        alive: true,
        respawnAt: 0,
        invulnerableUntil: performance.now() + INVULNERABLE_MS,
        lives: START_LIVES,
        score: 0,
        wave: 1,
        rocks: [],
        bullets: [],
        particles: [],
        lastFireAt: 0,
        over: false,
        keys: new Set(),
    }
    spawnWave(game, FIRST_WAVE_ROCKS)
    return game
}

function wrap(value: number, max: number): number {
    return value < 0 ? value + max : value >= max ? value - max : value
}

/**
 * The playfield. Runs its own requestAnimationFrame loop over a mutable game
 * state ref; the parent owns start/pause/game-over UI and receives
 * score/lives/wave callbacks. Keyboard: arrows or WASD to steer, space to
 * fire. The page overlays touch controls that feed the same key set.
 */
export default function AsteroidGame(
    props: AsteroidSettings & { resetToken: number; touchKeys: React.MutableRefObject<Set<string>> },
): React.ReactElement {
    const { resetToken, touchKeys, ...settings } = props
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const gameRef = useRef<GameState>(freshGame())
    const settingsRef = useRef<AsteroidSettings>(settings)
    settingsRef.current = settings

    useEffect(() => {
        gameRef.current = freshGame()
        settingsRef.current.onScore?.(0)
        settingsRef.current.onLives?.(START_LIVES)
        settingsRef.current.onWave?.(1)
    }, [resetToken])

    useEffect(() => {
        const KEYS: Record<string, string> = {
            arrowleft: "left",
            a: "left",
            arrowright: "right",
            d: "right",
            arrowup: "thrust",
            w: "thrust",
            " ": "fire",
        }
        const handle = (down: boolean) => (event: KeyboardEvent) => {
            const action = KEYS[event.key.toLowerCase()]
            if (!action) {
                return
            }
            event.preventDefault()
            if (down) {
                gameRef.current.keys.add(action)
            } else {
                gameRef.current.keys.delete(action)
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

    useAnimationFrameLoop((dt, now) => {
        const ctx = canvasRef.current?.getContext("2d")
        const game = gameRef.current
        if (!ctx) {
            return
        }
        if (settingsRef.current.running && !settingsRef.current.paused && !game.over) {
            step(game, settingsRef.current, touchKeys.current, Math.min(dt, 0.05), now)
        }
        draw(ctx, game, now)
    })

    return <canvas ref={canvasRef} width={FIELD_WIDTH} height={FIELD_HEIGHT} className={styles.playfield} />
}

function explode(game: GameState, x: number, y: number, count: number, now: number): void {
    for (let i = 0; i < count; i++) {
        const heading = Math.random() * Math.PI * 2
        const speed = 40 + Math.random() * 160
        game.particles.push({
            x,
            y,
            vx: Math.cos(heading) * speed,
            vy: Math.sin(heading) * speed,
            bornAt: now,
            lifeMs: 350 + Math.random() * 450,
        })
    }
}

function splitRock(game: GameState, index: number, play: typeof sounds | null, now: number): void {
    const rock = game.rocks[index]
    const tier = ROCK_TIERS[rock.tier]
    game.score += tier.score
    explode(game, rock.x, rock.y, rock.tier === 0 ? 14 : 8, now)
    if (rock.tier === 0) {
        play?.breakLarge()
    } else {
        play?.breakSmall()
    }
    const children: Rock[] = []
    for (let i = 0; i < tier.children; i++) {
        children.push(makeRock(rock.x, rock.y, rock.tier + 1))
    }
    game.rocks.splice(index, 1, ...children)
}

function step(
    game: GameState,
    settings: AsteroidSettings,
    touchKeys: Set<string>,
    dt: number,
    now: number,
): void {
    const play = settings.soundOn ? sounds : null
    const pressed = (action: string): boolean => game.keys.has(action) || touchKeys.has(action)

    // Ship
    if (game.alive) {
        if (pressed("left")) {
            game.shipAngle -= TURN_SPEED * dt
        }
        if (pressed("right")) {
            game.shipAngle += TURN_SPEED * dt
        }
        if (pressed("thrust")) {
            game.shipVx += Math.cos(game.shipAngle) * THRUST * dt
            game.shipVy += Math.sin(game.shipAngle) * THRUST * dt
            if (Math.random() < 0.3) {
                play?.thrust()
            }
            // Exhaust puffs from the tail.
            game.particles.push({
                x: game.shipX - Math.cos(game.shipAngle) * SHIP_RADIUS,
                y: game.shipY - Math.sin(game.shipAngle) * SHIP_RADIUS,
                vx: -Math.cos(game.shipAngle) * 90 + (Math.random() - 0.5) * 40,
                vy: -Math.sin(game.shipAngle) * 90 + (Math.random() - 0.5) * 40,
                bornAt: now,
                lifeMs: 220,
            })
        }
        const speed = Math.hypot(game.shipVx, game.shipVy)
        if (speed > MAX_SPEED) {
            game.shipVx *= MAX_SPEED / speed
            game.shipVy *= MAX_SPEED / speed
        }
        const drag = Math.max(0, 1 - DRAG * dt)
        game.shipVx *= drag
        game.shipVy *= drag
        game.shipX = wrap(game.shipX + game.shipVx * dt, FIELD_WIDTH)
        game.shipY = wrap(game.shipY + game.shipVy * dt, FIELD_HEIGHT)

        if (pressed("fire") && now - game.lastFireAt >= FIRE_COOLDOWN_MS) {
            game.lastFireAt = now
            game.bullets.push({
                x: game.shipX + Math.cos(game.shipAngle) * SHIP_RADIUS,
                y: game.shipY + Math.sin(game.shipAngle) * SHIP_RADIUS,
                vx: Math.cos(game.shipAngle) * BULLET_SPEED + game.shipVx * 0.3,
                vy: Math.sin(game.shipAngle) * BULLET_SPEED + game.shipVy * 0.3,
                bornAt: now,
            })
            play?.fire()
        }
    } else if (!game.over && now >= game.respawnAt) {
        game.alive = true
        game.shipX = FIELD_WIDTH / 2
        game.shipY = FIELD_HEIGHT / 2
        game.shipVx = 0
        game.shipVy = 0
        game.shipAngle = -Math.PI / 2
        game.invulnerableUntil = now + INVULNERABLE_MS
    }

    // Bullets
    game.bullets = game.bullets.filter((bullet) => now - bullet.bornAt < BULLET_LIFE_MS)
    for (const bullet of game.bullets) {
        bullet.x = wrap(bullet.x + bullet.vx * dt, FIELD_WIDTH)
        bullet.y = wrap(bullet.y + bullet.vy * dt, FIELD_HEIGHT)
    }

    // Rocks
    for (const rock of game.rocks) {
        rock.x = wrap(rock.x + rock.vx * dt, FIELD_WIDTH)
        rock.y = wrap(rock.y + rock.vy * dt, FIELD_HEIGHT)
        rock.angle += rock.spin * dt
    }

    // Particles
    game.particles = game.particles.filter((particle) => now - particle.bornAt < particle.lifeMs)
    for (const particle of game.particles) {
        particle.x += particle.vx * dt
        particle.y += particle.vy * dt
    }

    // Bullet ↔ rock collisions
    for (let b = game.bullets.length - 1; b >= 0; b--) {
        const bullet = game.bullets[b]
        for (let r = game.rocks.length - 1; r >= 0; r--) {
            const rock = game.rocks[r]
            if (Math.hypot(bullet.x - rock.x, bullet.y - rock.y) <= ROCK_TIERS[rock.tier].radius) {
                game.bullets.splice(b, 1)
                splitRock(game, r, play, now)
                settings.onScore?.(game.score)
                break
            }
        }
    }

    // Ship ↔ rock collisions
    if (game.alive && now >= game.invulnerableUntil) {
        for (const rock of game.rocks) {
            const hit =
                Math.hypot(game.shipX - rock.x, game.shipY - rock.y) <=
                ROCK_TIERS[rock.tier].radius + SHIP_RADIUS * 0.7
            if (hit) {
                game.alive = false
                game.lives -= 1
                explode(game, game.shipX, game.shipY, 22, now)
                play?.crash()
                settings.onLives?.(game.lives)
                if (game.lives <= 0) {
                    game.over = true
                    settings.onGameOver?.({ score: game.score, wave: game.wave })
                } else {
                    game.respawnAt = now + RESPAWN_DELAY_MS
                }
                break
            }
        }
    }

    // Next wave once the field is clear
    if (game.rocks.length === 0 && !game.over) {
        game.wave += 1
        spawnWave(game, FIRST_WAVE_ROCKS + game.wave - 1)
        play?.wave()
        settings.onWave?.(game.wave)
    }
}

function draw(ctx: CanvasRenderingContext2D, game: GameState, now: number): void {
    ctx.fillStyle = "#111112"
    ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT)

    // Rocks: hairline irregular polygons
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)"
    ctx.lineWidth = 1.5
    for (const rock of game.rocks) {
        const radius = ROCK_TIERS[rock.tier].radius
        ctx.beginPath()
        rock.shape.forEach((fraction, index) => {
            const theta = rock.angle + (index / rock.shape.length) * Math.PI * 2
            const px = rock.x + Math.cos(theta) * radius * fraction
            const py = rock.y + Math.sin(theta) * radius * fraction
            if (index === 0) {
                ctx.moveTo(px, py)
            } else {
                ctx.lineTo(px, py)
            }
        })
        ctx.closePath()
        ctx.stroke()
    }

    // Bullets
    ctx.fillStyle = "#ffffff"
    for (const bullet of game.bullets) {
        ctx.beginPath()
        ctx.arc(bullet.x, bullet.y, 2.2, 0, Math.PI * 2)
        ctx.fill()
    }

    // Particles fade out over their life
    for (const particle of game.particles) {
        const age = (now - particle.bornAt) / particle.lifeMs
        ctx.fillStyle = `rgba(255, 255, 255, ${(0.6 * (1 - age)).toFixed(3)})`
        ctx.fillRect(particle.x - 1, particle.y - 1, 2, 2)
    }

    // Ship: a stroked triangle; blinks while invulnerable
    if (game.alive) {
        const blinking = now < game.invulnerableUntil && Math.floor(now / 140) % 2 === 0
        if (!blinking) {
            ctx.strokeStyle = "#fafafa"
            ctx.lineWidth = 1.8
            ctx.save()
            ctx.translate(game.shipX, game.shipY)
            ctx.rotate(game.shipAngle)
            ctx.beginPath()
            ctx.moveTo(SHIP_RADIUS, 0)
            ctx.lineTo(-SHIP_RADIUS * 0.75, SHIP_RADIUS * 0.66)
            ctx.lineTo(-SHIP_RADIUS * 0.4, 0)
            ctx.lineTo(-SHIP_RADIUS * 0.75, -SHIP_RADIUS * 0.66)
            ctx.closePath()
            ctx.stroke()
            ctx.restore()
        }
    }
}
