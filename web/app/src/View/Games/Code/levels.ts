// Level data for CodeBot. Levels are pure data: adding a level = adding one
// entry to LEVELS. Grids are ASCII maps read top-to-bottom, left-to-right.
//
// Tile legend:
//   "."  floor
//   "#"  wall (moving into it bonks and stops the run)
//   "O"  pit (moving onto it fails the run)
//   "*"  bonus star
//   "R"  robot start tile
//   "P"  the hungry pet

export type Facing = "north" | "east" | "south" | "west"

export interface Level {
    /** Display name shown in the level picker and status bar. */
    name: string
    /** Emoji for the pet waiting at the goal tile. */
    pet: string
    /** ASCII map; every row must be the same width. */
    grid: string[]
    /** Direction the robot faces at the start of every run. */
    facing: Facing
    /** Maximum program size in slots (a repeat costs 1 slot + 1 per block inside). */
    slotLimit: number
    /** Fewest slots needed to feed the pet; finishing within par earns a star. */
    par: number
    /** One-line nudge shown in the mission panel. */
    hint: string
}

export const LEVELS: Level[] = [
    {
        name: "Straight Shot",
        pet: "🐶",
        // prettier-ignore
        grid: [
            ".....",
            "R.*P.",
            ".....",
        ],
        facing: "east",
        slotLimit: 6,
        par: 3,
        hint: "MOVE walks one tile forward. Walk straight to the puppy!",
    },
    {
        name: "Around the Bend",
        pet: "🐱",
        // prettier-ignore
        grid: [
            ".....",
            "R....",
            "...*.",
            "...P.",
            ".....",
        ],
        facing: "east",
        slotLimit: 8,
        par: 6,
        hint: "TURN RIGHT spins the robot in place — it does not move.",
    },
    {
        name: "Mind the Wall",
        pet: "🐰",
        // prettier-ignore
        grid: [
            ".....",
            "R#.P.",
            ".*...",
            ".....",
        ],
        facing: "east",
        slotLimit: 12,
        par: 9,
        hint: "Walls stop the robot with a BONK. Go around, not through.",
    },
    {
        name: "Pit Stop",
        pet: "🐶",
        // prettier-ignore
        grid: [
            ".....",
            "R.O.P",
            "..*..",
            ".....",
        ],
        facing: "east",
        slotLimit: 12,
        par: 10,
        hint: "Pits swallow robots whole. Detour past the hole.",
    },
    {
        name: "Long Hall",
        pet: "🐱",
        // prettier-ignore
        grid: [
            "OOOOOOOO",
            "R.*..*.P",
            "OOOOOOOO",
        ],
        facing: "east",
        slotLimit: 5,
        par: 4,
        hint: "Too far to walk block-by-block. REPEAT ×5 with MOVE inside!",
    },
    {
        name: "Square Dance",
        pet: "🐰",
        // prettier-ignore
        grid: [
            "R.*.",
            "...*",
            "....",
            "P*..",
        ],
        facing: "east",
        slotLimit: 6,
        par: 5,
        hint: "The same corner, three times. Put a turn inside the REPEAT.",
    },
    {
        name: "Zigzag Valley",
        pet: "🐶",
        // prettier-ignore
        grid: [
            "R.O..",
            ".*...",
            "O.*..",
            "...*.",
            "....P",
        ],
        facing: "east",
        slotLimit: 6,
        par: 5,
        hint: "Down the staircase: MOVE, RIGHT, MOVE, LEFT... on REPEAT.",
    },
    {
        name: "Wall Maze",
        pet: "🐱",
        // prettier-ignore
        grid: [
            "R*.##",
            "##.##",
            "#..*.",
            "###O.",
            "##.OP",
        ],
        facing: "east",
        slotLimit: 8,
        par: 7,
        hint: "The maze zigzags the same way twice. Repeat the whole zig.",
    },
    {
        name: "Star Circuit",
        pet: "🐰",
        // prettier-ignore
        grid: [
            "R.*..",
            "O##..",
            "O##.*",
            "O###.",
            "P.*..",
        ],
        facing: "east",
        slotLimit: 7,
        par: 6,
        hint: "Three long straight legs around the edge — one REPEAT does it all.",
    },
    {
        name: "Grand Finale",
        pet: "🐶",
        // prettier-ignore
        grid: [
            "R..*...",
            ".O#O#O.",
            ".#O#O#.",
            ".O#O#O*",
            ".#O#O#.",
            ".O#O#O*",
            "##O#O#P",
        ],
        facing: "east",
        slotLimit: 8,
        par: 7,
        hint: "Two long halls with one corner. Two REPEATs beat thirteen MOVEs.",
    },
]
