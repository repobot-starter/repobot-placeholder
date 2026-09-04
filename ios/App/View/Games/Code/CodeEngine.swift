import Foundation

// Pure port of the web CodeBot game logic
// (`web/app/src/View/Games/Code/levels.ts` + `interpreter.ts`). No SwiftUI
// here: levels are plain data and the interpreter turns a level + program
// into a complete step-by-step trace, so the view just replays steps on a
// timer and the rules stay headlessly unit-testable — the same split as the
// web page.

// MARK: - Facing

/// Direction the robot faces. Grid coordinates match the web game: x grows
/// right, y grows down, so `.north` points toward row 0.
enum CodeFacing: String, Equatable {
  case north
  case east
  case south
  case west

  /// Horizontal tile delta of one MOVE in this facing (web `DELTAS`).
  var dx: Int {
    switch self {
    case .east: return 1
    case .west: return -1
    case .north, .south: return 0
    }
  }

  /// Vertical tile delta of one MOVE in this facing (web `DELTAS`).
  var dy: Int {
    switch self {
    case .north: return -1
    case .south: return 1
    case .east, .west: return 0
    }
  }

  /// Facing after a TURN LEFT (web `LEFT_OF`).
  var turnedLeft: CodeFacing {
    switch self {
    case .north: return .west
    case .west: return .south
    case .south: return .east
    case .east: return .north
    }
  }

  /// Facing after a TURN RIGHT (web `RIGHT_OF`).
  var turnedRight: CodeFacing {
    switch self {
    case .north: return .east
    case .east: return .south
    case .south: return .west
    case .west: return .north
    }
  }
}

// MARK: - Level data

/// One CodeBot puzzle, ported verbatim from the web `Level` interface.
///
/// Grids are ASCII maps read top-to-bottom, left-to-right. Tile legend:
/// - `.`  floor
/// - `#`  wall (moving into it bonks and stops the run)
/// - `O`  pit (moving onto it fails the run)
/// - `*`  bonus star
/// - `R`  robot start tile
/// - `P`  the hungry pet
struct CodeLevel: Equatable {
  /// Display name shown in the level picker and status bar.
  let name: String
  /// Emoji for the pet waiting at the goal tile.
  let pet: String
  /// ASCII map; every row must be the same width.
  let grid: [String]
  /// Direction the robot faces at the start of every run.
  let facing: CodeFacing
  /// Maximum program size in slots (a repeat costs 1 slot + 1 per block inside).
  let slotLimit: Int
  /// Fewest slots needed to feed the pet; finishing within par earns a star.
  let par: Int
  /// One-line nudge shown in the mission panel.
  let hint: String
}

/// The ten hand-built levels, byte-for-byte the web `LEVELS` table so both
/// platforms play identical puzzles. Adding a level = adding one entry here.
enum CodeLevels {
  static let all: [CodeLevel] = [
    CodeLevel(
      name: "Straight Shot",
      pet: "🐶",
      grid: [
        ".....",
        "R.*P.",
        ".....",
      ],
      facing: .east,
      slotLimit: 6,
      par: 3,
      hint: "MOVE walks one tile forward. Walk straight to the puppy!"
    ),
    CodeLevel(
      name: "Around the Bend",
      pet: "🐱",
      grid: [
        ".....",
        "R....",
        "...*.",
        "...P.",
        ".....",
      ],
      facing: .east,
      slotLimit: 8,
      par: 6,
      hint: "TURN RIGHT spins the robot in place — it does not move."
    ),
    CodeLevel(
      name: "Mind the Wall",
      pet: "🐰",
      grid: [
        ".....",
        "R#.P.",
        ".*...",
        ".....",
      ],
      facing: .east,
      slotLimit: 12,
      par: 9,
      hint: "Walls stop the robot with a BONK. Go around, not through."
    ),
    CodeLevel(
      name: "Pit Stop",
      pet: "🐶",
      grid: [
        ".....",
        "R.O.P",
        "..*..",
        ".....",
      ],
      facing: .east,
      slotLimit: 12,
      par: 10,
      hint: "Pits swallow robots whole. Detour past the hole."
    ),
    CodeLevel(
      name: "Long Hall",
      pet: "🐱",
      grid: [
        "OOOOOOOO",
        "R.*..*.P",
        "OOOOOOOO",
      ],
      facing: .east,
      slotLimit: 5,
      par: 4,
      hint: "Too far to walk block-by-block. REPEAT ×5 with MOVE inside!"
    ),
    CodeLevel(
      name: "Square Dance",
      pet: "🐰",
      grid: [
        "R.*.",
        "...*",
        "....",
        "P*..",
      ],
      facing: .east,
      slotLimit: 6,
      par: 5,
      hint: "The same corner, three times. Put a turn inside the REPEAT."
    ),
    CodeLevel(
      name: "Zigzag Valley",
      pet: "🐶",
      grid: [
        "R.O..",
        ".*...",
        "O.*..",
        "...*.",
        "....P",
      ],
      facing: .east,
      slotLimit: 6,
      par: 5,
      hint: "Down the staircase: MOVE, RIGHT, MOVE, LEFT... on REPEAT."
    ),
    CodeLevel(
      name: "Wall Maze",
      pet: "🐱",
      grid: [
        "R*.##",
        "##.##",
        "#..*.",
        "###O.",
        "##.OP",
      ],
      facing: .east,
      slotLimit: 8,
      par: 7,
      hint: "The maze zigzags the same way twice. Repeat the whole zig."
    ),
    CodeLevel(
      name: "Star Circuit",
      pet: "🐰",
      grid: [
        "R.*..",
        "O##..",
        "O##.*",
        "O###.",
        "P.*..",
      ],
      facing: .east,
      slotLimit: 7,
      par: 6,
      hint: "Three long straight legs around the edge — one REPEAT does it all."
    ),
    CodeLevel(
      name: "Grand Finale",
      pet: "🐶",
      grid: [
        "R..*...",
        ".O#O#O.",
        ".#O#O#.",
        ".O#O#O*",
        ".#O#O#.",
        ".O#O#O*",
        "##O#O#P",
      ],
      facing: .east,
      slotLimit: 8,
      par: 7,
      hint: "Two long halls with one corner. Two REPEATs beat thirteen MOVEs."
    ),
  ]
}

// MARK: - Blocks

/// A single command the robot can execute (web `CommandBlock["kind"]`).
enum CodeCommand: String, CaseIterable, Equatable {
  case move
  case turnLeft
  case turnRight
}

/// One block in a program: either a plain command or a repeat that runs its
/// body `times` times. Like the web, repeats hold commands only — exactly one
/// level of nesting.
enum CodeBlock: Equatable {
  case command(CodeCommand)
  case repeatBlock(times: Int, body: [CodeCommand])
}

// MARK: - Run trace

/// What happened on one executed step (web `StepEvent`).
enum CodeStepEvent: Equatable {
  case move
  case turn
  case star
  case feed
  case bonk
  case fall
}

/// Robot state after one command has executed, plus what happened.
/// `blockPath` is `[index]` for a top-level block or `[repeatIndex, bodyIndex]`
/// for a block inside a repeat, used by the UI to highlight the active block.
struct CodeStep: Equatable {
  let blockPath: [Int]
  let command: CodeCommand
  let x: Int
  let y: Int
  let facing: CodeFacing
  let event: CodeStepEvent
  /// Tile key ("x,y") of a bonus star collected on this step, if any.
  var collectedStar: String? = nil
}

/// How a run ended (web `Outcome`).
enum CodeOutcome: Equatable {
  case fed
  case bonk
  case fell
  case outOfCode
}

/// Complete result of executing a program against a level.
struct CodeRunResult: Equatable {
  let steps: [CodeStep]
  let outcome: CodeOutcome
  let starsCollected: Int
  let totalStars: Int
}

/// Level grid parsed into lookup sets (web `ParsedLevel`).
struct CodeParsedLevel: Equatable {
  var width: Int
  var height: Int
  var startX: Int
  var startY: Int
  var facing: CodeFacing
  var petX: Int
  var petY: Int
  var walls: Set<String>
  var pits: Set<String>
  /// Tile keys ("x,y") of every bonus star on the map.
  var stars: [String]
}

/// One entry of the unrolled program (web `FlatCommand`).
struct CodeFlatCommand: Equatable {
  let command: CodeCommand
  let blockPath: [Int]
}

// MARK: - Interpreter

/// Pure functions mirroring the web `interpreter.ts` exports one-for-one.
enum CodeInterpreter {
  /// Defensive execution cap. The web UI cannot build runaway programs (its
  /// repeat count tops out at ×5 and slots at 12, ≤ 60 flat commands), but
  /// the engine accepts arbitrary repeat counts, so a run halts as
  /// `.outOfCode` after this many executed steps. Never reachable from
  /// programs the UI can build, so behavior stays identical to web.
  static let maxRunSteps = 1000

  static func tileKey(_ x: Int, _ y: Int) -> String {
    "\(x),\(y)"
  }

  /// Slots a program occupies: 1 per block, and a repeat also pays 1 per
  /// body block (web `slotCount`).
  static func slotCount(_ program: [CodeBlock]) -> Int {
    program.reduce(0) { total, block in
      switch block {
      case .command: return total + 1
      case .repeatBlock(_, let body): return total + 1 + body.count
      }
    }
  }

  /// Reads the ASCII grid into lookup sets. Level data is trusted; no
  /// validation (web `parseLevel`).
  static func parseLevel(_ level: CodeLevel) -> CodeParsedLevel {
    var parsed = CodeParsedLevel(
      width: level.grid[0].count,
      height: level.grid.count,
      startX: 0,
      startY: 0,
      facing: level.facing,
      petX: 0,
      petY: 0,
      walls: [],
      pits: [],
      stars: []
    )
    for (y, row) in level.grid.enumerated() {
      for (x, tile) in row.enumerated() {
        switch tile {
        case "#":
          parsed.walls.insert(tileKey(x, y))
        case "O":
          parsed.pits.insert(tileKey(x, y))
        case "*":
          parsed.stars.append(tileKey(x, y))
        case "R":
          parsed.startX = x
          parsed.startY = y
        case "P":
          parsed.petX = x
          parsed.petY = y
        default:
          break
        }
      }
    }
    return parsed
  }

  /// Unrolls repeats into the linear command sequence the robot will execute
  /// (web `flattenProgram`). Each turn of a repeat re-emits the body with the
  /// same `[repeatIndex, bodyIndex]` paths so the UI highlight loops.
  static func flattenProgram(_ program: [CodeBlock]) -> [CodeFlatCommand] {
    var flat: [CodeFlatCommand] = []
    for (index, block) in program.enumerated() {
      switch block {
      case .command(let command):
        flat.append(CodeFlatCommand(command: command, blockPath: [index]))
      case .repeatBlock(let times, let body):
        for _ in 0..<max(0, times) {
          for (bodyIndex, child) in body.enumerated() {
            flat.append(CodeFlatCommand(command: child, blockPath: [index, bodyIndex]))
          }
        }
      }
    }
    return flat
  }

  /// Executes a program against a level and returns the full trace (web
  /// `runProgram`). The run ends on the first terminal event: feeding the pet
  /// (`.fed`), hitting a wall (`.bonk`), falling into a pit or off the grid
  /// (`.fell`), or running out of blocks before reaching the pet
  /// (`.outOfCode`).
  static func runProgram(level: CodeLevel, program: [CodeBlock]) -> CodeRunResult {
    let parsed = parseLevel(level)
    var x = parsed.startX
    var y = parsed.startY
    var facing = parsed.facing
    var collected = Set<String>()
    var steps: [CodeStep] = []

    func finish(_ outcome: CodeOutcome) -> CodeRunResult {
      CodeRunResult(
        steps: steps,
        outcome: outcome,
        starsCollected: collected.count,
        totalStars: parsed.stars.count
      )
    }

    for flat in flattenProgram(program) {
      if steps.count >= maxRunSteps {
        return finish(.outOfCode)
      }
      let command = flat.command
      let blockPath = flat.blockPath

      if command == .turnLeft || command == .turnRight {
        facing = command == .turnLeft ? facing.turnedLeft : facing.turnedRight
        steps.append(
          CodeStep(blockPath: blockPath, command: command, x: x, y: y, facing: facing, event: .turn)
        )
        continue
      }

      let nextX = x + facing.dx
      let nextY = y + facing.dy
      let nextKey = tileKey(nextX, nextY)
      let offGrid = nextX < 0 || nextY < 0 || nextX >= parsed.width || nextY >= parsed.height

      if !offGrid && parsed.walls.contains(nextKey) {
        steps.append(
          CodeStep(blockPath: blockPath, command: command, x: x, y: y, facing: facing, event: .bonk)
        )
        return finish(.bonk)
      }
      if offGrid || parsed.pits.contains(nextKey) {
        steps.append(
          CodeStep(
            blockPath: blockPath, command: command, x: nextX, y: nextY, facing: facing, event: .fall
          )
        )
        return finish(.fell)
      }

      x = nextX
      y = nextY
      if x == parsed.petX && y == parsed.petY {
        steps.append(
          CodeStep(blockPath: blockPath, command: command, x: x, y: y, facing: facing, event: .feed)
        )
        return finish(.fed)
      }
      if parsed.stars.contains(nextKey) && !collected.contains(nextKey) {
        collected.insert(nextKey)
        steps.append(
          CodeStep(
            blockPath: blockPath, command: command, x: x, y: y, facing: facing, event: .star,
            collectedStar: nextKey
          )
        )
      } else {
        steps.append(
          CodeStep(blockPath: blockPath, command: command, x: x, y: y, facing: facing, event: .move)
        )
      }
    }
    return finish(.outOfCode)
  }

  /// Stars earned by a finished run: 1 for feeding the pet, +1 for collecting
  /// every bonus star along the way, +1 for a program within par (web
  /// `scoreRun`).
  static func scoreRun(level: CodeLevel, program: [CodeBlock], result: CodeRunResult) -> Int {
    guard result.outcome == .fed else {
      return 0
    }
    var stars = 1
    if result.starsCollected == result.totalStars {
      stars += 1
    }
    if slotCount(program) <= level.par {
      stars += 1
    }
    return stars
  }
}
