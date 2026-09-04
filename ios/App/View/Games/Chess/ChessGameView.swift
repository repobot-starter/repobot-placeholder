import SwiftUI

/// Unicode glyphs for every piece, by color — the same glyphs as the web
/// `PIECE_GLYPHS` table.
private func chessGlyph(_ piece: ChessPiece) -> String {
  switch (piece.color, piece.type) {
  case (.white, .king): return "♔"
  case (.white, .queen): return "♕"
  case (.white, .rook): return "♖"
  case (.white, .bishop): return "♗"
  case (.white, .knight): return "♘"
  case (.white, .pawn): return "♙"
  case (.black, .king): return "♚"
  case (.black, .queen): return "♛"
  case (.black, .rook): return "♜"
  case (.black, .bishop): return "♝"
  case (.black, .knight): return "♞"
  case (.black, .pawn): return "♟"
  }
}

/// Board palette mirroring the web `ChessPage.styles.css.ts` wood colors. The
/// board keeps its own look on both light and dark app themes (why: the web
/// board is hardcoded wood too — it is part of the game's identity).
private enum ChessPalette {
  static let woodLight = Color(hex: "#f0d9b5")
  static let woodDark = Color(hex: "#b58863")
  static let selected = Color(hex: "#ffeb3b").opacity(0.45)
  static let lastMove = Color(hex: "#ffd54f").opacity(0.42)
  static let check = Color(hex: "#ff3c32").opacity(0.65)
  static let marker = Color(hex: "#1e1810").opacity(0.35)
  static let pieceWhite = Color(hex: "#faf4e4")
  static let pieceBlack = Color(hex: "#211812")
  static let boardBorder = Color(hex: "#26221a")
  static let overlayScrim = Color(hex: "#26221a").opacity(0.72)
  static let overlayText = Color(hex: "#7cf29c")
}

private enum ChessMode: String, CaseIterable, Identifiable {
  case onePlayer = "1P vs Bot"
  case twoPlayer = "2P Local"

  var id: String { rawValue }
}

/// One played ply: the move, its SAN, and the position after it. Undo just
/// drops entries, exactly like the web page's `PlyRecord` history.
private struct ChessPly: Equatable {
  let move: ChessMove
  let san: String
  let state: ChessGameState
}

/// Home surface for the `chess` pack — the native twin of the web `ChessPage`.
/// Purely client-side: chess projects have no backend, so this view must
/// never touch stores, components, or the network.
///
/// All rules live in `ChessEngine`; this view only holds interaction state
/// (selection, history, mode/difficulty) and renders the board, move list,
/// captured trays, and the promotion picker. Bot moves are searched off the
/// main actor so the hard bot never blocks the UI.
struct ChessGameView: View {
  @Environment(\.uiThemeTokens) private var theme

  @State private var plies: [ChessPly] = []
  @State private var selected: Int?
  @State private var mode: ChessMode = .onePlayer
  @State private var difficulty: ChessBotDifficulty = .medium
  @State private var flipEachTurn = false
  /// All promotion candidates for the square the player just tapped; non-nil
  /// while the promotion picker dialog is up.
  @State private var promotionChoices: [ChessMove]?
  @State private var isBotThinking = false

  private let start = ChessEngine.initialState()

  private var current: ChessGameState {
    plies.last?.state ?? start
  }

  private var outcome: ChessOutcome? {
    ChessEngine.getOutcome(current)
  }

  private var inCheck: Bool {
    ChessEngine.isInCheck(current, color: current.turn)
  }

  private var isBotTurn: Bool {
    mode == .onePlayer && current.turn == .black && outcome == nil
  }

  private var targets: [ChessMove] {
    guard let selected else { return [] }
    return ChessEngine.legalMoves(current, from: selected)
  }

  private var lastMove: ChessMove? {
    plies.last?.move
  }

  private var checkSquare: Int? {
    guard inCheck else { return nil }
    return current.board.firstIndex { $0?.type == .king && $0?.color == current.turn }
  }

  var body: some View {
    VStack(spacing: theme.spacing.md) {
      Text("CHESSBOT")
        .font(.system(size: theme.typography.sizes.xl, weight: .bold, design: .monospaced))
        .foregroundStyle(theme.colors.textPrimary)
        .padding(.top, theme.spacing.lg)

      toolbar

      ChessBoardView(
        state: current,
        selected: selected,
        targets: targets,
        lastMove: lastMove,
        checkSquare: checkSquare,
        flipped: mode == .twoPlayer && flipEachTurn && current.turn == .black,
        onTap: handleSquareTap
      )
      .aspectRatio(1, contentMode: .fit)
      .padding(.horizontal, theme.spacing.md)
      .overlay(promotionOverlay)
      .overlay(outcomeOverlay)

      Text(statusText)
        .font(.system(size: theme.typography.sizes.xs, weight: .bold, design: .monospaced))
        .foregroundStyle(inCheck && outcome == nil ? theme.colors.statusError : theme.colors.textSecondary)

      ScrollView {
        VStack(spacing: theme.spacing.md) {
          controls
          movesPanel
          capturedPanel
        }
        .padding(.horizontal, theme.spacing.md)
        .padding(.bottom, theme.spacing.lg)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(theme.colors.appBg)
    // Bot reply: keyed on the ply count so every player move schedules
    // exactly one search; the short sleep mirrors the web BOT_THINK_DELAY_MS
    // so the player's move paints first.
    .task(id: botTaskKey) {
      guard isBotTurn else { return }
      isBotThinking = true
      defer { isBotThinking = false }
      try? await Task.sleep(nanoseconds: 350_000_000)
      let state = current
      let level = difficulty
      let move = await Task.detached(priority: .userInitiated) {
        ChessEngine.findBotMove(state, difficulty: level)
      }.value
      guard !Task.isCancelled, let move else { return }
      play(move)
    }
  }

  /// Changing any of these re-evaluates whether the bot should move.
  private var botTaskKey: String {
    "\(plies.count)-\(mode.rawValue)-\(difficulty.rawValue)"
  }

  private var statusText: String {
    switch outcome {
    case .checkmate:
      return "CHECKMATE — \(current.turn == .white ? "BLACK" : "WHITE") WINS"
    case .stalemate:
      return "STALEMATE — DRAW"
    case .insufficientMaterial:
      return "DRAW — INSUFFICIENT MATERIAL"
    case nil:
      let prefix = inCheck ? "CHECK — " : ""
      let turn = current.turn == .white ? "WHITE" : "BLACK"
      let suffix = isBotThinking ? " · BOT THINKING…" : ""
      return "\(prefix)\(turn) TO MOVE\(suffix)"
    }
  }

  // MARK: - Interaction

  private func handleSquareTap(_ square: Int) {
    guard outcome == nil, !isBotTurn, promotionChoices == nil else { return }
    if selected != nil {
      let candidates = targets.filter { $0.to == square }
      if !candidates.isEmpty {
        if candidates.count > 1 {
          // Promotions generate all four pieces; let the player pick one
          // (the web template auto-queens — the picker is the native upgrade).
          promotionChoices = candidates
        } else {
          play(candidates[0])
        }
        return
      }
    }
    if let piece = current.board[square], piece.color == current.turn, square != selected {
      selected = square
    } else {
      selected = nil
    }
  }

  private func play(_ move: ChessMove) {
    let san = ChessEngine.moveToSan(current, move)
    let next = ChessEngine.applyMove(current, move)
    plies.append(ChessPly(move: move, san: san, state: next))
    selected = nil
    promotionChoices = nil
  }

  private func newGame() {
    plies = []
    selected = nil
    promotionChoices = nil
  }

  /// Undo reverts a full player+bot pair in 1P so it is the player's turn again.
  private func undo() {
    selected = nil
    promotionChoices = nil
    guard let afterLast = plies.last?.state else { return }
    let drop = mode == .onePlayer && afterLast.turn == .white && plies.count >= 2 ? 2 : 1
    plies.removeLast(drop)
  }

  // MARK: - Sections

  private var toolbar: some View {
    HStack(spacing: theme.spacing.md) {
      Button {
        newGame()
      } label: {
        Label("New Game", systemImage: "arrow.counterclockwise")
      }
      .buttonStyle(ChessChunkyButtonStyle())

      Button {
        undo()
      } label: {
        Label("Undo", systemImage: "arrow.uturn.backward")
      }
      .buttonStyle(ChessChunkyButtonStyle())
      .disabled(plies.isEmpty || isBotThinking)
      .opacity(plies.isEmpty || isBotThinking ? 0.45 : 1)
    }
  }

  private var controls: some View {
    VStack(spacing: theme.spacing.sm) {
      Picker("Mode", selection: $mode) {
        ForEach(ChessMode.allCases) { value in
          Text(value.rawValue).tag(value)
        }
      }
      .pickerStyle(.segmented)

      Picker("Difficulty", selection: $difficulty) {
        ForEach(ChessBotDifficulty.allCases) { level in
          Text(level.rawValue.capitalized).tag(level)
        }
      }
      .pickerStyle(.segmented)
      .disabled(mode == .twoPlayer)
      .opacity(mode == .twoPlayer ? 0.45 : 1)

      if mode == .twoPlayer {
        Toggle(isOn: $flipEachTurn) {
          Text("Flip board each turn")
            .font(.system(size: theme.typography.sizes.sm, weight: .semibold, design: .monospaced))
            .foregroundStyle(theme.colors.textPrimary)
        }
      }

      Text("Tap a piece, then a highlighted square")
        .font(.system(size: theme.typography.sizes.xs, design: .monospaced))
        .foregroundStyle(theme.colors.textSecondary)
    }
  }

  private var movesPanel: some View {
    VStack(alignment: .leading, spacing: theme.spacing.xs) {
      panelHeader("Moves")
      if plies.isEmpty {
        Text("No moves yet. White starts!")
          .font(.system(size: theme.typography.sizes.xs, design: .monospaced))
          .foregroundStyle(theme.colors.textSecondary)
      } else {
        ScrollViewReader { proxy in
          ScrollView {
            VStack(alignment: .leading, spacing: 2) {
              ForEach(moveRows, id: \.number) { row in
                HStack(spacing: theme.spacing.sm) {
                  Text("\(row.number).")
                    .foregroundStyle(theme.colors.textSecondary)
                    .frame(width: 30, alignment: .leading)
                  Text(row.white)
                    .frame(width: 72, alignment: .leading)
                  Text(row.black)
                  Spacer(minLength: 0)
                }
                .font(.system(size: theme.typography.sizes.sm, weight: .semibold, design: .monospaced))
                .foregroundStyle(theme.colors.textPrimary)
                .id(row.number)
              }
            }
          }
          .frame(maxHeight: 140)
          .onChange(of: plies.count) { _, _ in
            if let last = moveRows.last {
              proxy.scrollTo(last.number, anchor: .bottom)
            }
          }
        }
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(theme.spacing.md)
    .background(panelBackground)
  }

  private var capturedPanel: some View {
    VStack(alignment: .leading, spacing: theme.spacing.xs) {
      panelHeader("Captured")
      trayLabel("White took")
      trayText(captures.byWhite, color: .black)
      trayLabel("Black took")
      trayText(captures.byBlack, color: .white)
      Text(materialText)
        .font(.system(size: theme.typography.sizes.sm, weight: .bold, design: .monospaced))
        .foregroundStyle(theme.colors.textPrimary)
        .padding(.top, theme.spacing.xxs)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(theme.spacing.md)
    .background(panelBackground)
  }

  private func panelHeader(_ title: String) -> some View {
    Text(title.uppercased())
      .font(.system(size: theme.typography.sizes.xs, weight: .bold, design: .monospaced))
      .foregroundStyle(theme.colors.accent)
  }

  private func trayLabel(_ text: String) -> some View {
    Text(text.uppercased())
      .font(.system(size: 10, weight: .bold, design: .monospaced))
      .foregroundStyle(theme.colors.textSecondary)
  }

  private func trayText(_ pieces: [ChessPieceType], color: ChessColor) -> some View {
    Text(pieces.isEmpty ? "—" : pieces.map { chessGlyph(ChessPiece(type: $0, color: color)) }.joined())
      .font(.system(size: 20))
      .foregroundStyle(theme.colors.textPrimary)
      .frame(minHeight: 24, alignment: .leading)
  }

  private var panelBackground: some View {
    RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
      .fill(theme.colors.surfaceAlt)
      .overlay(
        RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
          .stroke(theme.colors.border, lineWidth: 1)
      )
  }

  // MARK: - Overlays

  @ViewBuilder private var promotionOverlay: some View {
    if let choices = promotionChoices {
      ZStack {
        ChessPalette.overlayScrim
        VStack(spacing: theme.spacing.md) {
          Text("PROMOTE TO")
            .font(.system(size: theme.typography.sizes.md, weight: .bold, design: .monospaced))
            .foregroundStyle(ChessPalette.overlayText)
          HStack(spacing: theme.spacing.md) {
            ForEach(choices, id: \.promotion) { choice in
              Button {
                play(choice)
              } label: {
                Text(chessGlyph(ChessPiece(type: choice.promotion ?? .queen, color: current.turn)))
                  .font(.system(size: 44))
                  .frame(width: 64, height: 64)
                  .background(
                    RoundedRectangle(cornerRadius: theme.radius.sm, style: .continuous)
                      .fill(ChessPalette.woodLight)
                  )
              }
            }
          }
          Button {
            promotionChoices = nil
          } label: {
            Text("Cancel")
              .font(.system(size: theme.typography.sizes.sm, weight: .semibold, design: .monospaced))
              .foregroundStyle(ChessPalette.overlayText)
          }
        }
      }
      .clipShape(RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous))
      .padding(.horizontal, theme.spacing.md)
    }
  }

  @ViewBuilder private var outcomeOverlay: some View {
    if let outcome {
      ZStack {
        ChessPalette.overlayScrim
        VStack(spacing: theme.spacing.sm) {
          Text(overlayTitle(outcome))
            .font(.system(size: 26, weight: .bold, design: .monospaced))
            .foregroundStyle(ChessPalette.overlayText)
            .multilineTextAlignment(.center)
          Text("PRESS NEW GAME")
            .font(.system(size: theme.typography.sizes.sm, weight: .semibold, design: .monospaced))
            .foregroundStyle(ChessPalette.overlayText)
        }
      }
      .clipShape(RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous))
      .padding(.horizontal, theme.spacing.md)
      .allowsHitTesting(false)
    }
  }

  private func overlayTitle(_ outcome: ChessOutcome) -> String {
    switch outcome {
    case .checkmate:
      return "CHECKMATE\n\(current.turn == .white ? "BLACK" : "WHITE") WINS"
    case .stalemate:
      return "STALEMATE\nDRAW"
    case .insufficientMaterial:
      return "DRAW\nINSUFFICIENT MATERIAL"
    }
  }

  // MARK: - Derived history data

  private var moveRows: [(number: Int, white: String, black: String)] {
    var rows: [(number: Int, white: String, black: String)] = []
    var index = 0
    while index < plies.count {
      let black = index + 1 < plies.count ? plies[index + 1].san : ""
      rows.append((number: index / 2 + 1, white: plies[index].san, black: black))
      index += 2
    }
    return rows
  }

  private var captures: (byWhite: [ChessPieceType], byBlack: [ChessPieceType]) {
    var byWhite: [ChessPieceType] = []
    var byBlack: [ChessPieceType] = []
    for (index, ply) in plies.enumerated() {
      if let captured = ply.move.captured {
        if index % 2 == 0 {
          byWhite.append(captured)
        } else {
          byBlack.append(captured)
        }
      }
    }
    return (byWhite, byBlack)
  }

  private var materialText: String {
    let value = { (list: [ChessPieceType]) in list.reduce(0) { $0 + $1.centipawns } }
    let diff = Int((Double(value(captures.byWhite) - value(captures.byBlack)) / 100).rounded())
    if diff == 0 { return "Material even" }
    return diff > 0 ? "White +\(diff)" : "Black +\(-diff)"
  }
}

/// Chunky retro button consistent with the web page's toolbar buttons.
private struct ChessChunkyButtonStyle: ButtonStyle {
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

/// The 8x8 board: wood squares, Unicode pieces, move-target markers, and
/// last-move / check highlights. Purely presentational — all rules live in
/// `ChessEngine` and all interaction state in the parent, mirroring the web
/// `ChessBoard` component.
private struct ChessBoardView: View {
  let state: ChessGameState
  let selected: Int?
  let targets: [ChessMove]
  let lastMove: ChessMove?
  let checkSquare: Int?
  let flipped: Bool
  let onTap: (Int) -> Void

  var body: some View {
    GeometryReader { proxy in
      let squareSize = proxy.size.width / 8
      VStack(spacing: 0) {
        ForEach(0..<8, id: \.self) { row in
          HStack(spacing: 0) {
            ForEach(0..<8, id: \.self) { col in
              squareView(row: row, col: col, size: squareSize)
            }
          }
        }
      }
      .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
      .overlay(
        RoundedRectangle(cornerRadius: 8, style: .continuous)
          .stroke(ChessPalette.boardBorder, lineWidth: 2)
      )
    }
  }

  private func squareView(row: Int, col: Int, size: CGFloat) -> some View {
    let rank = flipped ? row : 7 - row
    let file = flipped ? 7 - col : col
    let square = rank * 8 + file
    let piece = state.board[square]
    let isLight = (file + rank) % 2 == 1
    let target = targets.first { $0.to == square }
    let isLastMoveSquare = lastMove.map { $0.from == square || $0.to == square } ?? false

    return ZStack {
      (isLight ? ChessPalette.woodLight : ChessPalette.woodDark)
      if selected == square {
        ChessPalette.selected
      } else if isLastMoveSquare {
        ChessPalette.lastMove
      }
      if checkSquare == square {
        Circle()
          .fill(ChessPalette.check)
          .frame(width: size * 0.9, height: size * 0.9)
          .blur(radius: size * 0.12)
      }
      if let piece {
        Text(chessGlyph(piece))
          .font(.system(size: size * 0.72))
          .foregroundStyle(piece.color == .white ? ChessPalette.pieceWhite : ChessPalette.pieceBlack)
          .shadow(
            color: piece.color == .white ? .black.opacity(0.5) : .white.opacity(0.25),
            radius: 1, x: 0, y: 1
          )
      }
      if let target {
        if target.captured != nil {
          Circle()
            .stroke(ChessPalette.marker, lineWidth: size * 0.08)
            .frame(width: size * 0.86, height: size * 0.86)
        } else {
          Circle()
            .fill(ChessPalette.marker)
            .frame(width: size * 0.3, height: size * 0.3)
        }
      }
      if col == 0 || row == 7 {
        coordinates(rank: rank, file: file, showRank: col == 0, showFile: row == 7, size: size)
      }
    }
    .frame(width: size, height: size)
    .contentShape(Rectangle())
    .onTapGesture {
      onTap(square)
    }
  }

  private func coordinates(rank: Int, file: Int, showRank: Bool, showFile: Bool, size: CGFloat) -> some View {
    let fileNames = ["a", "b", "c", "d", "e", "f", "g", "h"]
    let color = ChessPalette.boardBorder.opacity(0.55)
    return ZStack(alignment: .topLeading) {
      Color.clear
      if showRank {
        Text("\(rank + 1)")
          .font(.system(size: size * 0.18, weight: .bold, design: .monospaced))
          .foregroundStyle(color)
          .padding(2)
          .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
      }
      if showFile {
        Text(fileNames[file])
          .font(.system(size: size * 0.18, weight: .bold, design: .monospaced))
          .foregroundStyle(color)
          .padding(2)
          .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)
      }
    }
  }
}
