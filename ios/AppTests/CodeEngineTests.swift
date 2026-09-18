import XCTest
@testable import AppIOS

/// Exercises the pure CodeBot interpreter against the web `interpreter.ts`
/// rules it mirrors: move/turn semantics, repeat expansion, wall/pit/off-grid
/// failure, feeding + star scoring, the runaway-program cap, and the
/// integrity of the ten ported levels.
final class CodeEngineTests: XCTestCase {
  /// Level 1 "Straight Shot": robot at (0,1) facing east, star (2,1), pet (3,1).
  private var levelOne: CodeLevel { CodeLevels.all[0] }

  // MARK: - Move / turn semantics

  func testMoveAdvancesOneTileInTheFacingDirection() {
    let result = CodeInterpreter.runProgram(level: levelOne, program: [.command(.move)])

    XCTAssertEqual(result.steps.count, 1)
    let step = result.steps[0]
    XCTAssertEqual(step.x, 1)
    XCTAssertEqual(step.y, 1)
    XCTAssertEqual(step.facing, .east)
    XCTAssertEqual(step.event, .move)
    XCTAssertEqual(step.blockPath, [0])
    // One move does not reach the pet, so the program runs out of code.
    XCTAssertEqual(result.outcome, .outOfCode)
  }

  func testTurnsRotateInPlaceWithoutMoving() {
    let result = CodeInterpreter.runProgram(
      level: levelOne,
      program: [.command(.turnLeft), .command(.turnRight), .command(.turnRight)]
    )

    XCTAssertEqual(result.steps.map(\.event), [.turn, .turn, .turn])
    // east → north → east → south, never leaving the start tile.
    XCTAssertEqual(result.steps.map(\.facing), [.north, .east, .south])
    XCTAssertTrue(result.steps.allSatisfy { $0.x == 0 && $0.y == 1 })
  }

  func testMoveFollowsCurrentFacing() {
    // Turn north then move: from (0,1) up to (0,0).
    let result = CodeInterpreter.runProgram(
      level: levelOne,
      program: [.command(.turnLeft), .command(.move)]
    )

    XCTAssertEqual(result.steps[1].x, 0)
    XCTAssertEqual(result.steps[1].y, 0)
    XCTAssertEqual(result.steps[1].event, .move)
  }

  // MARK: - Repeat expansion

  func testRepeatBlocksExpandToTheRightStepSequence() {
    let flat = CodeInterpreter.flattenProgram([
      .command(.move),
      .repeatBlock(times: 3, body: [.move, .turnRight]),
      .command(.turnLeft),
    ])

    XCTAssertEqual(
      flat.map(\.command),
      [.move, .move, .turnRight, .move, .turnRight, .move, .turnRight, .turnLeft]
    )
    // Body paths repeat [repeatIndex, bodyIndex] each turn (UI highlight loops).
    XCTAssertEqual(
      flat.map(\.blockPath),
      [[0], [1, 0], [1, 1], [1, 0], [1, 1], [1, 0], [1, 1], [2]]
    )
  }

  func testRepeatProgramWalksTheGridCorrectly() {
    // Level 5 "Long Hall": pet 7 tiles east. REPEAT ×5 [MOVE] + MOVE + MOVE
    // is the par-4 solution and collects both bonus stars on the way.
    let longHall = CodeLevels.all[4]
    let program: [CodeBlock] = [
      .repeatBlock(times: 5, body: [.move]),
      .command(.move),
      .command(.move),
    ]

    let result = CodeInterpreter.runProgram(level: longHall, program: program)

    XCTAssertEqual(result.outcome, .fed)
    XCTAssertEqual(result.steps.count, 7)
    XCTAssertEqual(result.steps.last?.x, 7)
    XCTAssertEqual(result.starsCollected, 2)
    XCTAssertEqual(result.totalStars, 2)
    XCTAssertEqual(CodeInterpreter.scoreRun(level: longHall, program: program, result: result), 3)
  }

  func testSlotCountChargesRepeatBodies() {
    // A repeat costs 1 slot plus 1 per body block, like the web slotCount.
    XCTAssertEqual(
      CodeInterpreter.slotCount([
        .command(.move),
        .repeatBlock(times: 4, body: [.move, .turnLeft]),
      ]),
      4
    )
    XCTAssertEqual(CodeInterpreter.slotCount([]), 0)
  }

  // MARK: - Collisions

  func testHittingAWallBonksAndFailsTheRun() {
    // Level 3 "Mind the Wall" has a wall directly east of the start.
    let wallLevel = CodeLevels.all[2]
    let program: [CodeBlock] = [.command(.move), .command(.move)]

    let result = CodeInterpreter.runProgram(level: wallLevel, program: program)

    XCTAssertEqual(result.outcome, .bonk)
    // The bonk step keeps the robot on its current tile (web behavior) and
    // no further commands execute.
    XCTAssertEqual(result.steps.count, 1)
    XCTAssertEqual(result.steps[0].event, .bonk)
    XCTAssertEqual(result.steps[0].x, 0)
    XCTAssertEqual(result.steps[0].y, 1)
    XCTAssertEqual(CodeInterpreter.scoreRun(level: wallLevel, program: program, result: result), 0)
  }

  func testMovingOntoAPitFallsAndFailsTheRun() {
    // Level 4 "Pit Stop" has a pit two tiles east of the start.
    let pitLevel = CodeLevels.all[3]
    let result = CodeInterpreter.runProgram(
      level: pitLevel,
      program: [.command(.move), .command(.move)]
    )

    XCTAssertEqual(result.outcome, .fell)
    XCTAssertEqual(result.steps.count, 2)
    // The fall step moves the robot onto the pit tile (web animates it in).
    XCTAssertEqual(result.steps[1].event, .fall)
    XCTAssertEqual(result.steps[1].x, 2)
    XCTAssertEqual(result.steps[1].y, 1)
  }

  func testWalkingOffTheGridFalls() {
    // Two left turns face west; one move walks off the left edge.
    let result = CodeInterpreter.runProgram(
      level: levelOne,
      program: [.command(.turnLeft), .command(.turnLeft), .command(.move)]
    )

    XCTAssertEqual(result.outcome, .fell)
    XCTAssertEqual(result.steps.last?.event, .fall)
    XCTAssertEqual(result.steps.last?.x, -1)
  }

  // MARK: - Scoring

  func testLevelOneOptimalProgramEarnsThreeStars() {
    // MOVE MOVE MOVE: 3 slots (== par), crosses the bonus star, feeds the pet.
    let program: [CodeBlock] = [.command(.move), .command(.move), .command(.move)]

    let result = CodeInterpreter.runProgram(level: levelOne, program: program)

    XCTAssertEqual(result.outcome, .fed)
    XCTAssertEqual(result.steps.map(\.event), [.move, .star, .feed])
    XCTAssertEqual(result.steps[1].collectedStar, "2,1")
    XCTAssertEqual(result.starsCollected, 1)
    XCTAssertEqual(result.totalStars, 1)
    XCTAssertEqual(CodeInterpreter.scoreRun(level: levelOne, program: program, result: result), 3)
  }

  func testProgramOverParLosesTheParStar() {
    // Two wasted turns push the program to 5 slots, over level 1's par of 3.
    let program: [CodeBlock] = [
      .command(.turnLeft), .command(.turnRight),
      .command(.move), .command(.move), .command(.move),
    ]

    let result = CodeInterpreter.runProgram(level: levelOne, program: program)

    XCTAssertEqual(result.outcome, .fed)
    XCTAssertEqual(result.starsCollected, result.totalStars)
    XCTAssertEqual(CodeInterpreter.scoreRun(level: levelOne, program: program, result: result), 2)
  }

  func testMissingBonusStarsLosesTheBonusStar() {
    // Level 2 "Around the Bend": detour around the star at (3,2) and enter
    // the pet tile from the west. 7 slots (> par 6) and 0/1 stars → 1 star.
    let bendLevel = CodeLevels.all[1]
    let program: [CodeBlock] = [
      .command(.move), .command(.move),
      .command(.turnRight), .command(.move), .command(.move),
      .command(.turnLeft), .command(.move),
    ]

    let result = CodeInterpreter.runProgram(level: bendLevel, program: program)

    XCTAssertEqual(result.outcome, .fed)
    XCTAssertEqual(result.starsCollected, 0)
    XCTAssertEqual(result.totalStars, 1)
    XCTAssertEqual(CodeInterpreter.scoreRun(level: bendLevel, program: program, result: result), 1)
  }

  func testRunningOutOfBlocksScoresZero() {
    let program: [CodeBlock] = [.command(.move)]
    let result = CodeInterpreter.runProgram(level: levelOne, program: program)

    XCTAssertEqual(result.outcome, .outOfCode)
    XCTAssertEqual(CodeInterpreter.scoreRun(level: levelOne, program: program, result: result), 0)
  }

  // MARK: - Step limit

  func testStepLimitHaltsRunawayPrograms() {
    // A repeat far beyond anything the UI can build (its stepper tops out at
    // ×5) must halt at the engine cap instead of tracing forever.
    let program: [CodeBlock] = [.repeatBlock(times: 100_000, body: [.turnLeft])]

    let result = CodeInterpreter.runProgram(level: levelOne, program: program)

    XCTAssertEqual(result.outcome, .outOfCode)
    XCTAssertEqual(result.steps.count, CodeInterpreter.maxRunSteps)
  }

  // MARK: - Level data integrity

  func testAllTenLevelsAreWellFormed() {
    XCTAssertEqual(CodeLevels.all.count, 10)

    for level in CodeLevels.all {
      let flatGrid = level.grid.joined()
      // Uniform row widths.
      XCTAssertTrue(
        level.grid.allSatisfy { $0.count == level.grid[0].count },
        "\(level.name): ragged grid"
      )
      // Exactly one robot start and one pet.
      XCTAssertEqual(flatGrid.filter { $0 == "R" }.count, 1, "\(level.name): robot count")
      XCTAssertEqual(flatGrid.filter { $0 == "P" }.count, 1, "\(level.name): pet count")
      // Only legend characters.
      XCTAssertTrue(
        flatGrid.allSatisfy { ".#O*RP".contains($0) },
        "\(level.name): unknown tile"
      )
      // A star must be earnable for staying within par.
      XCTAssertGreaterThan(level.par, 0, "\(level.name): par")
      XCTAssertLessThanOrEqual(level.par, level.slotLimit, "\(level.name): par > slot limit")
    }
  }

  func testEveryPetIsReachableFromTheRobotStart() {
    for level in CodeLevels.all {
      let parsed = CodeInterpreter.parseLevel(level)
      // Breadth-first search over walkable tiles (anything but walls/pits).
      var queue = [(parsed.startX, parsed.startY)]
      var seen: Set<String> = [CodeInterpreter.tileKey(parsed.startX, parsed.startY)]
      var reached = false
      while !queue.isEmpty {
        let (x, y) = queue.removeFirst()
        if x == parsed.petX && y == parsed.petY {
          reached = true
          break
        }
        for (dx, dy) in [(1, 0), (-1, 0), (0, 1), (0, -1)] {
          let nx = x + dx
          let ny = y + dy
          let key = CodeInterpreter.tileKey(nx, ny)
          guard nx >= 0, ny >= 0, nx < parsed.width, ny < parsed.height,
                !seen.contains(key),
                !parsed.walls.contains(key),
                !parsed.pits.contains(key) else { continue }
          seen.insert(key)
          queue.append((nx, ny))
        }
      }
      XCTAssertTrue(reached, "\(level.name): pet is unreachable")
    }
  }
}
