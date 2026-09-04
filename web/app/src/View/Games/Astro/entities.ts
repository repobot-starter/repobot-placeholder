// Entity factories and helpers for AstroGame.

export interface Star {
    x: number
    y: number
    depth: number
}

export interface Ship {
    x: number
    y: number
    angle: number
    vx: number
    vy: number
    radius: number
    invulnerableUntil: number
    thrusting: boolean
}

export type AsteroidTier = 1 | 2 | 3

export interface Asteroid {
    x: number
    y: number
    vx: number
    vy: number
    tier: AsteroidTier
    radius: number
    spin: number
    rotation: number
    lumps: number[]
}

export interface Bullet {
    x: number
    y: number
    vx: number
    vy: number
    bornAt: number
}

export interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    life: number
    color: string
}

export function makeStars(width: number, height: number, count = 90): Star[] {
    return Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        depth: 0.3 + Math.random() * 0.7,
    }))
}

export function makeShip(width: number, height: number): Ship {
    return {
        x: width / 2,
        y: height / 2,
        angle: -Math.PI / 2,
        vx: 0,
        vy: 0,
        radius: 14,
        invulnerableUntil: performance.now() + 2000,
        thrusting: false,
    }
}

export function makeAsteroid(
    width: number,
    height: number,
    tier: AsteroidTier,
    avoid?: { x: number; y: number },
): Asteroid {
    let x
    let y
    // Keep spawns away from the ship.
    do {
        x = Math.random() * width
        y = Math.random() * height
    } while (avoid && Math.hypot(x - avoid.x, y - avoid.y) < 160)
    return spawnAsteroidAt(x, y, tier)
}

export function spawnAsteroidAt(x: number, y: number, tier: AsteroidTier): Asteroid {
    const radiusByTier: Record<AsteroidTier, number> = { 3: 46, 2: 28, 1: 15 }
    const speedByTier: Record<AsteroidTier, number> = { 3: 40, 2: 70, 1: 110 }
    const angle = Math.random() * Math.PI * 2
    const speed = speedByTier[tier] * (0.7 + Math.random() * 0.6)
    const pointCount = 9 + Math.floor(Math.random() * 4)
    return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        tier,
        radius: radiusByTier[tier],
        spin: (Math.random() - 0.5) * 1.6,
        rotation: 0,
        // Lumpy silhouette baked once per asteroid.
        lumps: Array.from({ length: pointCount }, () => 0.75 + Math.random() * 0.5),
    }
}

export function makeBullet(ship: Ship): Bullet {
    const BULLET_SPEED = 460
    return {
        x: ship.x + Math.cos(ship.angle) * ship.radius,
        y: ship.y + Math.sin(ship.angle) * ship.radius,
        vx: ship.vx + Math.cos(ship.angle) * BULLET_SPEED,
        vy: ship.vy + Math.sin(ship.angle) * BULLET_SPEED,
        bornAt: performance.now(),
    }
}

export function makeExplosion(x: number, y: number, color: string): Particle[] {
    return Array.from({ length: 14 }, () => {
        const angle = Math.random() * Math.PI * 2
        const speed = 40 + Math.random() * 140
        return {
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.5 + Math.random() * 0.4,
            color,
        }
    })
}

export function wrap(entity: { x: number; y: number }, width: number, height: number, margin = 0): void {
    if (entity.x < -margin) {
        entity.x = width + margin
    }
    if (entity.x > width + margin) {
        entity.x = -margin
    }
    if (entity.y < -margin) {
        entity.y = height + margin
    }
    if (entity.y > height + margin) {
        entity.y = -margin
    }
}
