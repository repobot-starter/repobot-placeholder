// Pure program interpreter for CodeBot. No React, no timers, no DOM: given a
// level and a program it returns the complete step-by-step trace, so the page
// just replays steps on a timer and the logic stays separately testable.

import { Facing, Level } from "./levels"

/** A single command block the robot can execute. */
export interface CommandBlock {
    kind: "move" | "turnLeft" | "turnRight"
}

/** A repeat block: runs its body `times` times (one level of nesting only). */
export interface RepeatBlock {
    kind: "repeat"
    times: number
    body: CommandBlock[]
}

export type Block = CommandBlock | RepeatBlock

/** Slots a program occupies: 1 per block, and a repeat also pays 1 per body block. */
export function slotCount(program: Block[]): number {
    return program.reduce((total, block) => total + (block.kind === "repeat" ? 1 + block.body.length : 1), 0)
}

/**
 * Path to a block in the program: [index] for a top-level block, or
 * [repeatIndex, bodyIndex] for a block inside a repeat. Used by the UI to
 * highlight whichever block is currently executing.
 */
export type BlockPath = number[]

export type StepEvent = "move" | "turn" | "star" | "feed" | "bonk" | "fall"

/** Robot state after one command has executed, plus what happened. */
export interface Step {
    blockPath: BlockPath
    command: CommandBlock["kind"]
    x: number
    y: number
    facing: Facing
    event: StepEvent
    /** Tile key ("x,y") of a bonus star collected on this step, if any. */
    collectedStar?: string
}

export type Outcome = "fed" | "bonk" | "fell" | "outOfCode"

export interface RunResult {
    steps: Step[]
    outcome: Outcome
    starsCollected: number
    totalStars: number
}

export interface ParsedLevel {
    width: number
    height: number
    startX: number
    startY: number
    facing: Facing
    petX: number
    petY: number
    walls: Set<string>
    pits: Set<string>
    /** Tile keys ("x,y") of every bonus star on the map. */
    stars: string[]
}

export function tileKey(x: number, y: number): string {
    return `${x},${y}`
}

/** Reads the ASCII grid into lookup sets. Level data is trusted; no validation. */
export function parseLevel(level: Level): ParsedLevel {
    const parsed: ParsedLevel = {
        width: level.grid[0].length,
        height: level.grid.length,
        startX: 0,
        startY: 0,
        facing: level.facing,
        petX: 0,
        petY: 0,
        walls: new Set(),
        pits: new Set(),
        stars: [],
    }
    level.grid.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
            const tile = row[x]
            if (tile === "#") {
                parsed.walls.add(tileKey(x, y))
            } else if (tile === "O") {
                parsed.pits.add(tileKey(x, y))
            } else if (tile === "*") {
                parsed.stars.push(tileKey(x, y))
            } else if (tile === "R") {
                parsed.startX = x
                parsed.startY = y
            } else if (tile === "P") {
                parsed.petX = x
                parsed.petY = y
            }
        }
    })
    return parsed
}

const DELTAS: Record<Facing, { dx: number; dy: number }> = {
    north: { dx: 0, dy: -1 },
    east: { dx: 1, dy: 0 },
    south: { dx: 0, dy: 1 },
    west: { dx: -1, dy: 0 },
}

const LEFT_OF: Record<Facing, Facing> = {
    north: "west",
    west: "south",
    south: "east",
    east: "north",
}

const RIGHT_OF: Record<Facing, Facing> = {
    north: "east",
    east: "south",
    south: "west",
    west: "north",
}

interface FlatCommand {
    command: CommandBlock["kind"]
    blockPath: BlockPath
}

/** Unrolls repeats into the linear command sequence the robot will execute. */
export function flattenProgram(program: Block[]): FlatCommand[] {
    const flat: FlatCommand[] = []
    program.forEach((block, index) => {
        if (block.kind === "repeat") {
            for (let turn = 0; turn < block.times; turn++) {
                block.body.forEach((child, bodyIndex) => {
                    flat.push({ command: child.kind, blockPath: [index, bodyIndex] })
                })
            }
        } else {
            flat.push({ command: block.kind, blockPath: [index] })
        }
    })
    return flat
}

/**
 * Executes a program against a level and returns the full trace. The run ends
 * on the first terminal event: feeding the pet ("fed"), hitting a wall
 * ("bonk"), falling into a pit or off the grid ("fell"), or running out of
 * blocks before reaching the pet ("outOfCode").
 */
export function runProgram(level: Level, program: Block[]): RunResult {
    const parsed = parseLevel(level)
    let x = parsed.startX
    let y = parsed.startY
    let facing = parsed.facing
    const collected = new Set<string>()
    const steps: Step[] = []

    const finish = (outcome: Outcome): RunResult => ({
        steps,
        outcome,
        starsCollected: collected.size,
        totalStars: parsed.stars.length,
    })

    for (const { command, blockPath } of flattenProgram(program)) {
        if (command === "turnLeft" || command === "turnRight") {
            facing = command === "turnLeft" ? LEFT_OF[facing] : RIGHT_OF[facing]
            steps.push({ blockPath, command, x, y, facing, event: "turn" })
            continue
        }

        const nextX = x + DELTAS[facing].dx
        const nextY = y + DELTAS[facing].dy
        const nextKey = tileKey(nextX, nextY)
        const offGrid = nextX < 0 || nextY < 0 || nextX >= parsed.width || nextY >= parsed.height

        if (!offGrid && parsed.walls.has(nextKey)) {
            steps.push({ blockPath, command, x, y, facing, event: "bonk" })
            return finish("bonk")
        }
        if (offGrid || parsed.pits.has(nextKey)) {
            steps.push({ blockPath, command, x: nextX, y: nextY, facing, event: "fall" })
            return finish("fell")
        }

        x = nextX
        y = nextY
        if (x === parsed.petX && y === parsed.petY) {
            steps.push({ blockPath, command, x, y, facing, event: "feed" })
            return finish("fed")
        }
        if (parsed.stars.includes(nextKey) && !collected.has(nextKey)) {
            collected.add(nextKey)
            steps.push({ blockPath, command, x, y, facing, event: "star", collectedStar: nextKey })
        } else {
            steps.push({ blockPath, command, x, y, facing, event: "move" })
        }
    }
    return finish("outOfCode")
}

/**
 * Stars earned by a finished run: 1 for feeding the pet, +1 for collecting
 * every bonus star along the way, +1 for a program within par.
 */
export function scoreRun(level: Level, program: Block[], result: RunResult): number {
    if (result.outcome !== "fed") {
        return 0
    }
    let stars = 1
    if (result.starsCollected === result.totalStars) {
        stars += 1
    }
    if (slotCount(program) <= level.par) {
        stars += 1
    }
    return stars
}
