import SwiftUI

/// Seconds between executed program steps (web `STEP_MS` = 350ms; also the
/// robot's slide/turn animation time).
private let codeStepSeconds: Double = 0.35
/// Point size of one board tile (web `TILE_PX`, sized down for phone widths —
/// the widest level is 8 tiles).
private let codeTilePoints: CGFloat = 42
/// UserDefaults key holding unlocked level + stars earned per level — the
/// same key name as the web localStorage entry (`PROGRESS_KEY`).
private let codeProgressKey = "code.progress"
/// Range of the repeat-count stepper (web `REPEAT_TIMES_CHOICES` = 2...5).
private let codeRepeatTimesRange = 2...5

/// Blueprint tech-lab palette mirroring `CodePage.styles.css.ts`. Hardcoded
/// like the web page (and like PongGameView's field): the game keeps its own
/// dark lab look on both light and dark app themes.
private enum CodeColors {
  static let navyDeep = Color(hex: "#060b1e")
  static let navy = Color(hex: "#0c1631")
  static let navyPanel = Color(hex: "#101d40")
  static let line = Color(hex: "#57e6ff").opacity(0.35)
  static let lineSoft = Color(hex: "#57e6ff").opacity(0.12)
  static let cyan = Color(hex: "#57e6ff")
  static let text = Color(hex: "#d7e8ff")
  static let textDim = Color(hex: "#d7e8ff").opacity(0.55)
  static let green = Color(hex: "#34d873")
  static let orange = Color(hex: "#ffa64d")
  static let purple = Color(hex: "#a78bfa")
  static let gold = Color(hex: "#ffd166")
}

/// Saved progression: `unlocked` counts playable levels (1-based) and `stars`
/// holds the best star count per level — the same JSON shape the web writes
/// to localStorage under the same key.
struct CodeProgress: Codable, Equatable {
  var unlocked: Int
  var stars: [Int]
}

/// End-of-run modal state: level cleared with N stars, or a failed outcome.
private enum CodeOverlay: Equatable {
  case clear(stars: Int)
  case fail(CodeOutcome)
}

/// Home surface for the `code` pack — the native twin of the web `CodePage`.
/// Purely client-side: code projects have no backend, so this view must never
/// touch stores, components, or the network. All game rules live in
/// `CodeEngine.swift`; this view only edits the program, replays the
/// precomputed trace on a timer, and persists progress to UserDefaults.
struct CodeGameView: View {
  @Environment(\.uiThemeTokens) private var theme

  @State private var levelIndex = 0
  @State private var progress = CodeGameView.loadProgress()
  @State private var program: [CodeBlock] = []
  /// While true, palette taps append inside the trailing repeat block.
  @State private var openRepeat = false
  @State private var repeatTimes = 3
  @State private var run: CodeRunResult?
  @State private var stepIndex = -1
  @State private var running = false
  @State private var overlay: CodeOverlay?
  @State private var status = "READY."

  /// Playback clock; ticks are ignored unless a run is animating.
  private let ticker = Timer.publish(every: codeStepSeconds, on: .main, in: .common).autoconnect()

  private var level: CodeLevel { CodeLevels.all[levelIndex] }
  private var parsed: CodeParsedLevel { CodeInterpreter.parseLevel(level) }
  private var usedSlots: Int { CodeInterpreter.slotCount(program) }
  private var canAddBlock: Bool { !running && usedSlots < level.slotLimit }
  private var hasCommands: Bool { !CodeInterpreter.flattenProgram(program).isEmpty }

  private var currentStep: CodeStep? {
    guard let run, stepIndex >= 0, stepIndex < run.steps.count else { return nil }
    return run.steps[stepIndex]
  }

  var body: some View {
    ScrollView {
      VStack(spacing: theme.spacing.md) {
        header
        levelPicker
        controls
        board
        missionPanel
        programSection
        paletteSection
        statusBar
      }
      .padding(theme.spacing.md)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(CodeColors.navyDeep)
    .onReceive(ticker) { _ in advancePlayback() }
  }

  // MARK: - Sections

  private var header: some View {
    Text("🤖 CODEBOT")
      .font(.system(size: theme.typography.sizes.xl, weight: .bold, design: .monospaced))
      .foregroundStyle(CodeColors.cyan)
      .frame(maxWidth: .infinity, alignment: .leading)
  }

  /// One chip per level: locked levels show 🔒, played levels their best stars.
  private var levelPicker: some View {
    ScrollView(.horizontal, showsIndicators: false) {
      HStack(spacing: theme.spacing.sm) {
        ForEach(CodeLevels.all.indices, id: \.self) { index in
          levelChip(index: index)
        }
      }
    }
  }

  private func levelChip(index: Int) -> some View {
    let locked = index >= progress.unlocked
    let earned = index < progress.stars.count ? progress.stars[index] : 0
    return Button {
      selectLevel(index)
    } label: {
      VStack(spacing: 2) {
        Text("\(index + 1). \(CodeLevels.all[index].name)")
          .font(.system(size: theme.typography.sizes.xs, weight: .bold, design: .monospaced))
        Text(locked ? "🔒" : starRow(earned))
          .font(.system(size: theme.typography.sizes.xs, design: .monospaced))
          .foregroundStyle(CodeColors.gold)
      }
      .foregroundStyle(index == levelIndex ? CodeColors.cyan : CodeColors.text)
      .padding(.horizontal, 10)
      .padding(.vertical, 6)
      .background(
        RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
          .fill(index == levelIndex ? CodeColors.navyPanel : CodeColors.navy)
          .overlay(
            RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
              .stroke(index == levelIndex ? CodeColors.line : CodeColors.lineSoft, lineWidth: 1)
          )
      )
      .opacity(locked ? 0.45 : 1)
    }
    .disabled(locked)
    .buttonStyle(.plain)
  }

  private var controls: some View {
    HStack(spacing: theme.spacing.sm) {
      chunkyButton("▶ RUN", tint: CodeColors.green, disabled: running || !hasCommands) {
        handleRun()
      }
      chunkyButton("➤ STEP", tint: CodeColors.cyan, disabled: running || !hasCommands) {
        stepOnce()
      }
      chunkyButton("⟲ RESET", tint: CodeColors.text, disabled: false) {
        resetRun()
      }
      Spacer()
      Text(running ? "● EXECUTING" : "○ IDLE")
        .font(.system(size: theme.typography.sizes.xs, weight: .bold, design: .monospaced))
        .foregroundStyle(running ? CodeColors.green : CodeColors.textDim)
    }
  }

  // MARK: - Board

  private var board: some View {
    let parsedLevel = parsed
    return ZStack(alignment: .topLeading) {
      gridTiles
      robotView(parsedLevel: parsedLevel)
      if currentStep?.event == .feed {
        Text("💕")
          .font(.system(size: 20))
          .offset(
            x: CGFloat(parsedLevel.petX) * codeTilePoints + codeTilePoints / 2 - 10,
            y: CGFloat(parsedLevel.petY) * codeTilePoints - 8
          )
      }
    }
    .padding(theme.spacing.sm)
    .background(
      RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
        .fill(CodeColors.navy)
        .overlay(
          RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
            .stroke(CodeColors.line, lineWidth: 1)
        )
    )
    .overlay(overlayView)
    .frame(maxWidth: .infinity)
  }

  private var gridTiles: some View {
    let collected = collectedStars
    return VStack(spacing: 0) {
      ForEach(Array(level.grid.enumerated()), id: \.offset) { y, row in
        HStack(spacing: 0) {
          ForEach(Array(row.enumerated()), id: \.offset) { x, tileChar in
            tileView(char: tileChar, x: x, y: y, collected: collected)
          }
        }
      }
    }
  }

  private func tileView(char: Character, x: Int, y: Int, collected: Set<String>) -> some View {
    let key = CodeInterpreter.tileKey(x, y)
    let content: String
    switch char {
    case "#": content = "🧱"
    case "O": content = "🕳️"
    case "*": content = collected.contains(key) ? "" : "⭐"
    case "P": content = level.pet
    default: content = ""
    }
    return Text(content)
      .font(.system(size: 22))
      .frame(width: codeTilePoints, height: codeTilePoints)
      .background(char == "#" ? CodeColors.lineSoft : Color.clear)
      .border(CodeColors.lineSoft, width: 0.5)
  }

  private func robotView(parsedLevel: CodeParsedLevel) -> some View {
    let x = currentStep?.x ?? parsedLevel.startX
    let y = currentStep?.y ?? parsedLevel.startY
    let fell = currentStep?.event == .fall
    return VStack(spacing: -6) {
      Text("▲")
        .font(.system(size: 9, weight: .bold))
        .foregroundStyle(CodeColors.cyan)
      Text("🤖")
        .font(.system(size: 24))
    }
    .frame(width: codeTilePoints, height: codeTilePoints)
    .rotationEffect(.degrees(robotDegrees))
    .opacity(fell ? 0.25 : 1)
    .offset(x: CGFloat(x) * codeTilePoints, y: CGFloat(y) * codeTilePoints)
    .animation(.easeInOut(duration: codeStepSeconds), value: stepIndex)
    .animation(.easeInOut(duration: codeStepSeconds), value: run == nil)
  }

  /// Cumulative rotation so the robot never spins the long way around
  /// (web `rotations`).
  private var robotDegrees: Double {
    var degrees = facingDegrees(level.facing)
    guard let run, stepIndex >= 0 else { return degrees }
    for index in 0...min(stepIndex, run.steps.count - 1) {
      let step = run.steps[index]
      if step.event == .turn {
        degrees += step.command == .turnRight ? 90 : -90
      }
    }
    return degrees
  }

  /// Stars already picked up at the current playback position.
  private var collectedStars: Set<String> {
    var keys = Set<String>()
    if let run {
      for index in 0..<max(0, min(stepIndex + 1, run.steps.count)) {
        if let collected = run.steps[index].collectedStar {
          keys.insert(collected)
        }
      }
    }
    return keys
  }

  @ViewBuilder private var overlayView: some View {
    if let overlay {
      VStack(spacing: theme.spacing.md) {
        switch overlay {
        case .clear(let stars):
          Text("LEVEL CLEAR! \(level.pet)💕")
            .font(.system(size: theme.typography.sizes.lg, weight: .bold, design: .monospaced))
            .foregroundStyle(CodeColors.green)
          Text(starRow(stars))
            .font(.system(size: 30))
            .foregroundStyle(CodeColors.gold)
          if levelIndex + 1 < CodeLevels.all.count {
            chunkyButton("NEXT ▶", tint: CodeColors.green, disabled: false) {
              selectLevel(levelIndex + 1)
            }
          } else {
            Text("All pets fed. You are a real programmer now! 🎓")
              .font(.system(size: theme.typography.sizes.sm, design: .monospaced))
              .foregroundStyle(CodeColors.text)
              .multilineTextAlignment(.center)
          }
          chunkyButton("⟲ REPLAY", tint: CodeColors.text, disabled: false) {
            resetRun()
          }
        case .fail(let outcome):
          Text(failInfo(outcome).title)
            .font(.system(size: theme.typography.sizes.lg, weight: .bold, design: .monospaced))
            .foregroundStyle(CodeColors.orange)
          Text(failInfo(outcome).note)
            .font(.system(size: theme.typography.sizes.sm, design: .monospaced))
            .foregroundStyle(CodeColors.text)
            .multilineTextAlignment(.center)
          chunkyButton("⟲ TRY AGAIN", tint: CodeColors.text, disabled: false) {
            resetRun()
          }
        }
      }
      .padding(theme.spacing.lg)
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      .background(Color(hex: "#060b1e").opacity(0.82))
      .clipShape(RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous))
    }
  }

  // MARK: - Mission / status

  private var missionPanel: some View {
    VStack(alignment: .leading, spacing: theme.spacing.xs) {
      HStack {
        Text("Feed \(level.pet)")
        Spacer()
        Text("Slots \(usedSlots)/\(level.slotLimit)")
        Spacer()
        Text("Par \(level.par)")
        Spacer()
        Text("⭐ \(collectedStars.count)/\(parsed.stars.count)")
      }
      .font(.system(size: theme.typography.sizes.xs, weight: .bold, design: .monospaced))
      .foregroundStyle(CodeColors.text)
      Text("💡 \(level.hint)")
        .font(.system(size: theme.typography.sizes.xs, design: .monospaced))
        .foregroundStyle(CodeColors.textDim)
    }
    .padding(theme.spacing.sm)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(
      RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
        .fill(CodeColors.navyPanel)
    )
  }

  private var statusBar: some View {
    HStack {
      Text("● \(status)")
      Spacer()
      Text("LVL \(levelIndex + 1)/\(CodeLevels.all.count) · \(level.name.uppercased())")
      Spacer()
      Text("⭐ \(totalStarsEarned)/\(CodeLevels.all.count * 3)")
    }
    .font(.system(size: theme.typography.sizes.xs, design: .monospaced))
    .foregroundStyle(CodeColors.textDim)
  }

  private var totalStarsEarned: Int {
    progress.stars.reduce(0, +)
  }

  // MARK: - Program strip

  private var programSection: some View {
    VStack(alignment: .leading, spacing: theme.spacing.xs) {
      HStack {
        Text("Program — \(usedSlots)/\(level.slotLimit) slots · tap a block to delete")
          .font(.system(size: theme.typography.sizes.xs, weight: .bold, design: .monospaced))
          .foregroundStyle(CodeColors.textDim)
        Spacer()
        Button("🗑 Clear") {
          editProgram { $0 = [] }
          openRepeat = false
        }
        .font(.system(size: theme.typography.sizes.xs, design: .monospaced))
        .foregroundStyle(CodeColors.orange)
      }
      ScrollView(.horizontal, showsIndicators: false) {
        HStack(spacing: theme.spacing.sm) {
          if program.isEmpty {
            Text("Tap blocks below to build your program…")
              .font(.system(size: theme.typography.sizes.xs, design: .monospaced))
              .foregroundStyle(CodeColors.textDim)
          }
          ForEach(Array(program.enumerated()), id: \.offset) { index, block in
            programChip(block: block, index: index)
          }
        }
        .padding(theme.spacing.sm)
      }
      .frame(minHeight: 52)
      .background(
        RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
          .fill(CodeColors.navyPanel)
      )
    }
  }

  @ViewBuilder private func programChip(block: CodeBlock, index: Int) -> some View {
    switch block {
    case .command(let command):
      blockChip(
        label: blockLabel(command),
        tint: blockTint(command),
        active: isActiveBlock([index])
      ) {
        removeTopBlock(index)
      }
    case .repeatBlock(let times, let body):
      HStack(spacing: theme.spacing.xs) {
        Button {
          removeTopBlock(index)
        } label: {
          Text("🔁 ×\(times)")
            .font(.system(size: theme.typography.sizes.xs, weight: .bold, design: .monospaced))
            .foregroundStyle(CodeColors.navyDeep)
        }
        .buttonStyle(.plain)
        if body.isEmpty {
          Text("…")
            .font(.system(size: theme.typography.sizes.xs, design: .monospaced))
            .foregroundStyle(CodeColors.navyDeep)
        }
        ForEach(Array(body.enumerated()), id: \.offset) { bodyIndex, child in
          blockChip(
            label: blockLabel(child),
            tint: blockTint(child),
            active: isActiveBlock([index, bodyIndex])
          ) {
            removeInnerBlock(repeatIndex: index, bodyIndex: bodyIndex)
          }
        }
      }
      .padding(6)
      .background(
        RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
          .fill(CodeColors.purple)
      )
    }
  }

  // MARK: - Palette

  private var paletteSection: some View {
    VStack(alignment: .leading, spacing: theme.spacing.xs) {
      Text("Palette — tap to add\(openRepeat ? " (inside 🔁)" : "")")
        .font(.system(size: theme.typography.sizes.xs, weight: .bold, design: .monospaced))
        .foregroundStyle(CodeColors.textDim)
      ScrollView(.horizontal, showsIndicators: false) {
        HStack(spacing: theme.spacing.sm) {
          ForEach(CodeCommand.allCases, id: \.self) { command in
            blockChip(label: blockLabel(command), tint: blockTint(command), active: false) {
              appendSimple(command)
            }
            .disabled(!canAddBlock)
            .opacity(canAddBlock ? 1 : 0.4)
          }
          blockChip(label: "🔁 REPEAT ×\(repeatTimes)", tint: CodeColors.purple, active: false) {
            appendRepeat()
          }
          .disabled(!canAddBlock || openRepeat)
          .opacity(canAddBlock && !openRepeat ? 1 : 0.4)
          if openRepeat {
            blockChip(label: "✔ END 🔁", tint: CodeColors.purple, active: false) {
              openRepeat = false
            }
          }
          Stepper(value: $repeatTimes, in: codeRepeatTimesRange) {
            Text("×\(repeatTimes)")
              .font(.system(size: theme.typography.sizes.sm, weight: .bold, design: .monospaced))
              .foregroundStyle(CodeColors.text)
          }
          .fixedSize()
        }
        .padding(.vertical, theme.spacing.xs)
      }
    }
  }

  // MARK: - Reusable chips

  private func blockChip(
    label: String,
    tint: Color,
    active: Bool,
    action: @escaping () -> Void
  ) -> some View {
    Button(action: action) {
      Text(label)
        .font(.system(size: theme.typography.sizes.xs, weight: .bold, design: .monospaced))
        .foregroundStyle(Color(hex: "#08131f"))
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(
          RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
            .fill(tint)
            .overlay(
              RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
                .stroke(active ? CodeColors.gold : Color.clear, lineWidth: 2)
            )
        )
    }
    .buttonStyle(.plain)
  }

  private func chunkyButton(
    _ label: String,
    tint: Color,
    disabled: Bool,
    action: @escaping () -> Void
  ) -> some View {
    Button(action: action) {
      Text(label)
        .font(.system(size: theme.typography.sizes.sm, weight: .bold, design: .monospaced))
        .foregroundStyle(tint)
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(
          RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
            .fill(CodeColors.navyPanel)
            .overlay(
              RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
                .stroke(CodeColors.line, lineWidth: 1)
            )
        )
        .opacity(disabled ? 0.4 : 1)
    }
    .disabled(disabled)
    .buttonStyle(.plain)
  }

  // MARK: - Labels

  private func blockLabel(_ command: CodeCommand) -> String {
    switch command {
    case .move: return "⬆️ MOVE"
    case .turnLeft: return "↩️ LEFT"
    case .turnRight: return "↪️ RIGHT"
    }
  }

  private func blockTint(_ command: CodeCommand) -> Color {
    command == .move ? CodeColors.green : CodeColors.orange
  }

  private func starRow(_ earned: Int) -> String {
    String(repeating: "★", count: earned) + String(repeating: "☆", count: 3 - earned)
  }

  private func facingDegrees(_ facing: CodeFacing) -> Double {
    switch facing {
    case .north: return 0
    case .east: return 90
    case .south: return 180
    case .west: return 270
    }
  }

  private func failInfo(_ outcome: CodeOutcome) -> (title: String, status: String, note: String) {
    switch outcome {
    case .bonk:
      return ("BONK! 🧱", "HIT A WALL.", "The robot smacked into a wall. Re-route it!")
    case .fell:
      return ("SPLAT! 🕳️", "FELL IN A PIT.", "The robot fell. Steer around the holes!")
    default:
      return (
        "OUT OF CODE!", "PROGRAM ENDED EARLY.",
        "The blocks ran out before the pet got fed. Add more!"
      )
    }
  }

  private func isActiveBlock(_ path: [Int]) -> Bool {
    running && currentStep?.blockPath == path
  }

  // MARK: - Program editing

  /// Any edit invalidates the previous run, so the robot pops back to start.
  private func editProgram(_ mutate: (inout [CodeBlock]) -> Void) {
    guard !running else { return }
    mutate(&program)
    run = nil
    stepIndex = -1
    overlay = nil
    status = "READY."
  }

  private func appendSimple(_ command: CodeCommand) {
    guard canAddBlock else { return }
    editProgram { program in
      if openRepeat, case .repeatBlock(let times, let body) = program.last {
        program[program.count - 1] = .repeatBlock(times: times, body: body + [command])
      } else {
        program.append(.command(command))
      }
    }
  }

  private func appendRepeat() {
    guard canAddBlock, !openRepeat else { return }
    editProgram { $0.append(.repeatBlock(times: repeatTimes, body: [])) }
    openRepeat = true
  }

  private func removeTopBlock(_ index: Int) {
    guard !running, program.indices.contains(index) else { return }
    if case .repeatBlock = program[index] {
      openRepeat = false
    }
    editProgram { $0.remove(at: index) }
  }

  private func removeInnerBlock(repeatIndex: Int, bodyIndex: Int) {
    guard !running, program.indices.contains(repeatIndex) else { return }
    editProgram { program in
      if case .repeatBlock(let times, var body) = program[repeatIndex],
         body.indices.contains(bodyIndex) {
        body.remove(at: bodyIndex)
        program[repeatIndex] = .repeatBlock(times: times, body: body)
      }
    }
  }

  // MARK: - Run control

  private func handleRun() {
    openRepeat = false
    overlay = nil
    run = CodeInterpreter.runProgram(level: level, program: program)
    stepIndex = -1
    running = true
    status = "RUNNING…"
  }

  /// Manual single-step: computes the trace lazily on the first press, then
  /// advances one step per press without starting the playback timer.
  private func stepOnce() {
    guard !running, hasCommands else { return }
    if run == nil {
      openRepeat = false
      overlay = nil
      run = CodeInterpreter.runProgram(level: level, program: program)
      stepIndex = -1
      status = "STEPPING…"
    }
    guard let result = run else { return }
    let next = stepIndex + 1
    if next < result.steps.count {
      stepIndex = next
    } else {
      settle(result)
    }
  }

  private func advancePlayback() {
    guard running, let result = run else { return }
    let next = stepIndex + 1
    if next < result.steps.count {
      stepIndex = next
    } else {
      settle(result)
    }
  }

  /// After the final step: award stars, unlock the next level, show the
  /// overlay — mirroring the web playback effect's settle branch.
  private func settle(_ result: CodeRunResult) {
    running = false
    if result.outcome == .fed {
      let earned = CodeInterpreter.scoreRun(level: level, program: program, result: result)
      var stars = progress.stars
      while stars.count < CodeLevels.all.count {
        stars.append(0)
      }
      stars[levelIndex] = max(stars[levelIndex], earned)
      progress = CodeProgress(
        unlocked: max(progress.unlocked, min(levelIndex + 2, CodeLevels.all.count)),
        stars: stars
      )
      CodeGameView.saveProgress(progress)
      overlay = .clear(stars: earned)
      status = "LEVEL CLEAR! 💕"
    } else {
      overlay = .fail(result.outcome)
      status = failInfo(result.outcome).status
    }
  }

  private func resetRun() {
    running = false
    run = nil
    stepIndex = -1
    overlay = nil
    status = "READY."
  }

  private func selectLevel(_ index: Int) {
    guard index < progress.unlocked else { return }
    levelIndex = index
    program = []
    openRepeat = false
    resetRun()
  }

  // MARK: - Persistence

  /// Loads saved progress; a corrupt or missing save starts fresh, like the
  /// web `loadProgress`.
  static func loadProgress() -> CodeProgress {
    if let data = UserDefaults.standard.data(forKey: codeProgressKey),
       let saved = try? JSONDecoder().decode(CodeProgress.self, from: data) {
      return CodeProgress(
        unlocked: max(1, min(saved.unlocked, CodeLevels.all.count)),
        stars: saved.stars
      )
    }
    return CodeProgress(unlocked: 1, stars: [])
  }

  static func saveProgress(_ progress: CodeProgress) {
    if let data = try? JSONEncoder().encode(progress) {
      UserDefaults.standard.set(data, forKey: codeProgressKey)
    }
  }
}
