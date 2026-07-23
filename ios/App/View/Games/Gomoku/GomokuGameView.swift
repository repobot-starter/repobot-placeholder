import SwiftUI

/// Home surface for the `gomoku` pack — the native twin of the web
/// `GomokuPage`. Purely client-side: gomoku projects have no backend, so this
/// view must never touch stores, components, or the network.
///
/// Vs-bot only (the web 2P hotseat mode is dropped on mobile — tap-to-place
/// with the same three bot levels covers the core game). The human plays
/// black and always moves first; all rules live in `GomokuEngine`.
///
/// A single `Canvas` renders the whole goban (wood, grid, star points,
/// stones, markers) like the web board, so a tap only re-renders once via the
/// `moveCount` state bump.
struct GomokuGameView: View {
  @Environment(\.uiThemeTokens) private var theme

  /// Reference-typed game state; SwiftUI re-renders via `moveCount`.
  @State private var engine = GomokuEngine()
  @State private var level: GomokuBotLevel = .medium
  /// Bumped after every board mutation so the Canvas invalidates.
  @State private var moveCount = 0
  @State private var botThinking = false

  var body: some View {
    VStack(spacing: theme.spacing.lg) {
      Text("GOMOKUBOT")
        .font(.system(size: theme.typography.sizes.xl, weight: .bold, design: .monospaced))
        .foregroundStyle(theme.colors.textPrimary)
        .padding(.top, theme.spacing.lg)

      GomokuBoardView(engine: engine, moveCount: moveCount, onTapCell: handleTap)
        .aspectRatio(1, contentMode: .fit)
        .padding(.horizontal, theme.spacing.md)

      Text(statusText)
        .font(.system(size: theme.typography.sizes.sm, weight: .bold, design: .monospaced))
        .foregroundStyle(theme.colors.textPrimary)

      controls

      Text("Tap an intersection to place a stone · Five in a row wins")
        .font(.system(size: theme.typography.sizes.xs, design: .monospaced))
        .foregroundStyle(theme.colors.textSecondary)

      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(theme.colors.appBg)
    .onChange(of: level) { _, newValue in
      engine.level = newValue
    }
  }

  private var statusText: String {
    if let winner = engine.winner {
      return winner == .black ? "YOU WIN — FIVE IN A ROW" : "BOT WINS — FIVE IN A ROW"
    }
    if engine.isDraw {
      return "DRAW — BOARD FULL"
    }
    return botThinking ? "BOT THINKING…" : "YOUR MOVE (BLACK)"
  }

  private var controls: some View {
    VStack(spacing: theme.spacing.md) {
      HStack(spacing: theme.spacing.md) {
        Button {
          engine.newGame()
          botThinking = false
          moveCount = engine.moves.count
        } label: {
          Label("New Game", systemImage: "arrow.counterclockwise")
        }
        .buttonStyle(GomokuChunkyButtonStyle())

        Button {
          engine.undoPair()
          moveCount = engine.moves.count
        } label: {
          Label("Undo", systemImage: "arrow.uturn.backward")
        }
        .buttonStyle(GomokuChunkyButtonStyle())
        .disabled(engine.moves.isEmpty || botThinking)
      }

      Picker("Bot Level", selection: $level) {
        ForEach(GomokuBotLevel.allCases) { option in
          Text(option.rawValue.capitalized).tag(option)
        }
      }
      .pickerStyle(.segmented)
      .padding(.horizontal, theme.spacing.md)
    }
  }

  private func handleTap(cell: Int) {
    guard !botThinking, engine.turn == .black, engine.place(cell: cell) else { return }
    moveCount = engine.moves.count
    guard !engine.isOver else { return }

    // Bot reply: deferred so the player's stone paints first, like the web.
    botThinking = true
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
      engine.playBotMove()
      botThinking = false
      moveCount = engine.moves.count
    }
  }
}

/// Chunky retro button consistent with the web page's toolbar buttons.
private struct GomokuChunkyButtonStyle: ButtonStyle {
  @Environment(\.uiThemeTokens) private var theme

  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(.system(size: theme.typography.sizes.sm, weight: .bold, design: .monospaced))
      .foregroundStyle(theme.colors.textPrimary)
      .padding(.horizontal, 14)
      .padding(.vertical, 9)
      .background(
        RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
          .fill(configuration.isPressed ? theme.colors.hover : theme.colors.surfaceAlt)
          .overlay(
            RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
              .stroke(theme.colors.border, lineWidth: 1)
          )
      )
  }
}

/// The goban: draws wood, grid lines, star points, stones, the last-move
/// marker, and the winning-line glow with the web board's palette. Taps are
/// mapped back to the nearest intersection.
private struct GomokuBoardView: View {
  let engine: GomokuEngine
  /// Only read to invalidate the Canvas when the parent bumps it.
  let moveCount: Int
  let onTapCell: (Int) -> Void

  /// Star-point (hoshi) rows/columns of a 15x15 goban.
  private static let starLines = [3, 7, 11]

  var body: some View {
    GeometryReader { proxy in
      let side = min(proxy.size.width, proxy.size.height)
      let cellSize = side / CGFloat(GomokuEngine.boardSize)

      Canvas { context, _ in
        _ = moveCount
        draw(context: context, side: side, cellSize: cellSize)
      }
      .gesture(
        DragGesture(minimumDistance: 0)
          .onEnded { value in
            let col = Int(value.location.x / cellSize)
            let row = Int(value.location.y / cellSize)
            guard (0..<GomokuEngine.boardSize).contains(row),
                  (0..<GomokuEngine.boardSize).contains(col)
            else { return }
            onTapCell(GomokuEngine.cellAt(row: row, col: col))
          }
      )
    }
    .background(Color(hex: "#deb26a"))
    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    .overlay(
      RoundedRectangle(cornerRadius: 8, style: .continuous)
        .stroke(Color(hex: "#b98a45"), lineWidth: 2)
    )
  }

  private func center(of cell: Int, cellSize: CGFloat) -> CGPoint {
    CGPoint(
      x: (CGFloat(GomokuEngine.colOf(cell)) + 0.5) * cellSize,
      y: (CGFloat(GomokuEngine.rowOf(cell)) + 0.5) * cellSize
    )
  }

  private func draw(context: GraphicsContext, side: CGFloat, cellSize: CGFloat) {
    let gridColor = Color(hex: "#3b2812").opacity(0.75)
    let inset = cellSize / 2
    let far = side - inset

    // Grid lines: intersections sit at cell centers, like the web board.
    var grid = Path()
    for index in 0..<GomokuEngine.boardSize {
      let offset = (CGFloat(index) + 0.5) * cellSize
      grid.move(to: CGPoint(x: inset, y: offset))
      grid.addLine(to: CGPoint(x: far, y: offset))
      grid.move(to: CGPoint(x: offset, y: inset))
      grid.addLine(to: CGPoint(x: offset, y: far))
    }
    context.stroke(grid, with: .color(gridColor), lineWidth: 1)

    // Star points (hoshi).
    for row in Self.starLines {
      for col in Self.starLines where engine.board[GomokuEngine.cellAt(row: row, col: col)] == nil {
        let point = center(of: GomokuEngine.cellAt(row: row, col: col), cellSize: cellSize)
        let radius = cellSize * 0.09
        context.fill(
          Path(ellipseIn: CGRect(
            x: point.x - radius, y: point.y - radius, width: radius * 2, height: radius * 2
          )),
          with: .color(gridColor)
        )
      }
    }

    // Stones with a subtle drop shadow, then the win glow / last-move marker.
    let winCells = Set(engine.winLine ?? [])
    let stoneRadius = cellSize * 0.42
    for cell in 0..<GomokuEngine.cellCount {
      guard let stone = engine.board[cell] else { continue }
      let point = center(of: cell, cellSize: cellSize)
      let rect = CGRect(
        x: point.x - stoneRadius, y: point.y - stoneRadius,
        width: stoneRadius * 2, height: stoneRadius * 2
      )

      context.fill(
        Path(ellipseIn: rect.offsetBy(dx: cellSize * 0.04, dy: cellSize * 0.06)),
        with: .color(Color(hex: "#1e1004").opacity(0.45))
      )
      context.fill(
        Path(ellipseIn: rect),
        with: .radialGradient(
          Gradient(colors: stone == .black
            ? [Color(hex: "#5c5c60"), Color(hex: "#0a0a0c")]
            : [Color.white, Color(hex: "#c9c2ae")]),
          center: CGPoint(x: point.x - stoneRadius * 0.35, y: point.y - stoneRadius * 0.4),
          startRadius: 0,
          endRadius: stoneRadius * 1.6
        )
      )

      if winCells.contains(cell) {
        context.stroke(
          Path(ellipseIn: rect.insetBy(dx: -cellSize * 0.05, dy: -cellSize * 0.05)),
          with: .color(Color(hex: "#ffd97a")),
          lineWidth: cellSize * 0.08
        )
      } else if cell == engine.lastMove {
        let radius = cellSize * 0.1
        context.fill(
          Path(ellipseIn: CGRect(
            x: point.x - radius, y: point.y - radius, width: radius * 2, height: radius * 2
          )),
          with: .color(Color(hex: "#e05c3a"))
        )
      }
    }
  }
}
