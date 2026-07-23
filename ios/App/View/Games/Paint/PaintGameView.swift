import SwiftUI
import UIKit

/// The retro desktop palette from the web `PaintPage.styles.css.ts`. The
/// paint window keeps this identity on both light and dark app themes, like
/// the Pong field keeps its arcade look; the surrounding chrome uses theme
/// tokens.
private enum PaintColors {
  static let bg = Color(hex: "#b8b2c7")
  static let frame = Color(hex: "#efece4")
  static let frameDark = Color(hex: "#d8d4c8")
  static let ink = Color(hex: "#1d1a26")
  static let accent = Color(hex: "#c7bfe8")
  static let paper = Color(hex: "#fffdf7")
}

/// The six tools from the web `TOOLS` array (same glyphs and labels).
private enum PaintTool: String, CaseIterable, Identifiable {
  case brush
  case pencil
  case eraser
  case fill
  case shape
  case sticker

  var id: String { rawValue }

  var glyph: String {
    switch self {
    case .brush: return "🖌️"
    case .pencil: return "✏️"
    case .eraser: return "🩹"
    case .fill: return "🪣"
    case .shape: return "⬜"
    case .sticker: return "⭐"
    }
  }

  var label: String {
    switch self {
    case .brush: return "Brush"
    case .pencil: return "Pencil"
    case .eraser: return "Eraser"
    case .fill: return "Fill"
    case .shape: return "Shape"
    case .sticker: return "Sticker"
    }
  }
}

/// Web `STICKERS`, `SWATCHES`, and `TIPS` arrays, verbatim.
private let stickers = ["⭐", "❤️", "⚡", "☁️", "🌸", "🤖", "🌈", "🎈"]

private let swatches: [[String]] = [
  [
    "#d32f2f", "#e64a19", "#f9a825", "#7cb342", "#00897b", "#1976d2",
    "#3949ab", "#8e24aa", "#d81b60", "#6d4c41", "#546e7a", "#e0e0e0",
  ],
  [
    "#ef9a9a", "#ffcc80", "#fff59d", "#c5e1a5", "#80cbc4", "#90caf9",
    "#9fa8da", "#ce93d8", "#f48fb1", "#bcaaa4", "#b0bec5", "#000000",
  ],
]

private let tips = [
  "Tip: Pick the Fill bucket to flood an area with color",
  "Tip: Stickers stamp where you tap — resize them with the Size slider",
  "Tip: Undo has your back — experiment freely!",
  "Tip: Drag with the Shape tool to preview before it lands",
]

/// Home surface for the `paint` pack — the native twin of the web
/// `PaintPage`. Purely client-side: paint projects have no backend, so this
/// view must never touch stores, components, or the network.
///
/// All document mutations go through [PaintEngine]; this view only renders
/// the pixel buffer on a `Canvas`, maps touches into document coordinates,
/// and provides the retro window chrome (toolbar, tool strip, sliders,
/// sticker tray, swatch palette, status bar).
struct PaintGameView: View {
  @Environment(\.uiThemeTokens) private var theme

  /// Reference-typed document state: the engine, gesture bookkeeping, and
  /// the cached CGImage so drags don't re-encode an unchanged buffer.
  @State private var session = PaintSession()
  @State private var tool: PaintTool = .brush
  @State private var shapeKind: PaintShapeKind = .line
  @State private var colorHex = "#3949ab"
  @State private var brushSize: Double = 14
  @State private var brushOpacity: Double = 1
  @State private var sticker = "⭐"
  /// Bumped after every engine mutation; this is what tells SwiftUI to
  /// redraw the paper and refresh undo/redo button states.
  @State private var documentRevision = 0
  /// Live shape-drag preview (the web's overlay canvas).
  @State private var shapePreview: ShapePreview?
  @State private var tipIndex = 0
  @State private var isConfirmingNew = false
  /// Temp-file URL handed to the share sheet after a Save.
  @State private var exportURL: URL?
  @State private var isSharePresented = false

  var body: some View {
    VStack(spacing: 0) {
      titleBar
      toolbar
      toolStrip
      paper
        .padding(theme.spacing.md)
      settingsPanel
      paletteBar
      statusBar
    }
    .background(PaintColors.frame)
    .clipShape(RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous))
    .overlay(
      RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
        .stroke(PaintColors.ink, lineWidth: 2)
    )
    .padding(theme.spacing.md)
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(theme.colors.appBg)
    .alert("Start a new painting?", isPresented: $isConfirmingNew) {
      Button("Clear Canvas", role: .destructive) {
        session.engine.clear()
        documentRevision += 1
      }
      Button("Cancel", role: .cancel) {}
    } message: {
      Text("The current canvas will be cleared.")
    }
    .sheet(isPresented: $isSharePresented) {
      if let exportURL {
        PaintShareSheet(items: [exportURL])
      }
    }
  }

  // MARK: - Chrome

  /// Pinstriped retro title bar, like the web window header.
  private var titleBar: some View {
    HStack(spacing: 10) {
      titleBarBox
      titleBarLines
      Text("PaintBot — Untitled")
        .font(.system(size: theme.typography.sizes.md, weight: .heavy))
        .foregroundStyle(PaintColors.ink)
        .lineLimit(1)
      titleBarLines
      titleBarBox
    }
    .padding(.horizontal, 12)
    .padding(.vertical, 7)
    .background(PaintColors.frame)
    .overlay(alignment: .bottom) { inkDivider }
  }

  private var titleBarBox: some View {
    Rectangle()
      .fill(PaintColors.frame)
      .frame(width: 14, height: 14)
      .overlay(Rectangle().stroke(PaintColors.ink, lineWidth: 2))
  }

  private var titleBarLines: some View {
    VStack(spacing: 3) {
      ForEach(0..<3, id: \.self) { _ in
        Rectangle().fill(PaintColors.ink).frame(height: 1)
      }
    }
    .frame(maxWidth: .infinity)
  }

  private var inkDivider: some View {
    Rectangle().fill(PaintColors.ink).frame(height: 2)
  }

  /// New / Save / Undo / Redo, plus the shape picker while the shape tool is
  /// active — the web top toolbar.
  private var toolbar: some View {
    ScrollView(.horizontal, showsIndicators: false) {
      HStack(spacing: theme.spacing.sm) {
        chunkyButton("New") { isConfirmingNew = true }
        chunkyButton("Save") { exportPNG() }
        toolbarDivider
        chunkyButton("Undo", disabled: !session.engine.canUndo) {
          session.engine.undo()
          documentRevision += 1
        }
        chunkyButton("Redo", disabled: !session.engine.canRedo) {
          session.engine.redo()
          documentRevision += 1
        }
        if tool == .shape {
          toolbarDivider
          ForEach(PaintShapeKind.allCases) { kind in
            chunkyButton(shapeLabel(kind), active: shapeKind == kind) {
              shapeKind = kind
            }
          }
        }
      }
      .padding(.horizontal, 12)
      .padding(.vertical, 8)
    }
    .background(PaintColors.frameDark)
    .overlay(alignment: .bottom) { inkDivider }
  }

  private func shapeLabel(_ kind: PaintShapeKind) -> String {
    switch kind {
    case .line: return "Line"
    case .rect: return "Rect"
    case .ellipse: return "Oval"
    }
  }

  private var toolbarDivider: some View {
    Rectangle()
      .fill(Color(hex: "#8f8aa0"))
      .frame(width: 2, height: 22)
  }

  /// The six tool buttons. The web stacks them vertically beside the canvas;
  /// on a phone a horizontal strip above the paper fits better.
  private var toolStrip: some View {
    ScrollView(.horizontal, showsIndicators: false) {
      HStack(spacing: theme.spacing.xs) {
        ForEach(PaintTool.allCases) { entry in
          Button {
            tool = entry
          } label: {
            VStack(spacing: 2) {
              Text(entry.glyph).font(.system(size: 20))
              Text(entry.label)
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(PaintColors.ink)
            }
            .frame(width: 58)
            .padding(.vertical, 6)
            .background(tool == entry ? PaintColors.accent : PaintColors.frame)
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            .overlay(
              RoundedRectangle(cornerRadius: 8, style: .continuous)
                .stroke(PaintColors.ink, lineWidth: 2)
            )
          }
        }
      }
      .padding(.horizontal, 12)
      .padding(.vertical, 8)
    }
    .background(PaintColors.frame)
    .overlay(alignment: .bottom) { inkDivider }
  }

  // MARK: - Paper

  /// The document canvas: draws the engine's pixel buffer scaled to fit,
  /// plus the live shape preview, and maps drags back into the fixed
  /// 960x640 document space (same mapping as the web `canvasPoint`).
  private var paper: some View {
    GeometryReader { proxy in
      let scale = proxy.size.width / CGFloat(session.engine.width)

      Canvas { context, size in
        // Reading the revision here re-runs this closure on every mutation.
        _ = documentRevision
        if let image = session.paperImage() {
          context.draw(
            Image(decorative: image, scale: 1),
            in: CGRect(origin: .zero, size: size)
          )
        }
        if let preview = shapePreview {
          drawShapePreview(preview, context: context, scale: scale)
        }
      }
      .gesture(
        DragGesture(minimumDistance: 0)
          .onChanged { value in
            handleDragChanged(value, scale: scale)
          }
          .onEnded { value in
            handleDragEnded(value, scale: scale)
          }
      )
    }
    .aspectRatio(
      CGFloat(session.engine.width) / CGFloat(session.engine.height),
      contentMode: .fit
    )
    .background(PaintColors.paper)
    .overlay(Rectangle().stroke(PaintColors.ink, lineWidth: 2))
  }

  /// Live shape feedback while dragging — the web overlay canvas redrawn
  /// each move. Drawn in display space with round caps like the engine.
  private func drawShapePreview(
    _ preview: ShapePreview, context: GraphicsContext, scale: CGFloat
  ) {
    let start = CGPoint(x: preview.startX * scale, y: preview.startY * scale)
    let end = CGPoint(x: preview.currentX * scale, y: preview.currentY * scale)
    var path = Path()
    switch shapeKind {
    case .line:
      path.move(to: start)
      path.addLine(to: end)
    case .rect:
      path.addRect(CGRect(
        x: min(start.x, end.x),
        y: min(start.y, end.y),
        width: abs(end.x - start.x),
        height: abs(end.y - start.y)
      ))
    case .ellipse:
      path.addEllipse(in: CGRect(
        x: min(start.x, end.x),
        y: min(start.y, end.y),
        width: abs(end.x - start.x),
        height: abs(end.y - start.y)
      ))
    }
    context.stroke(
      path,
      with: .color(Color(hex: colorHex)),
      style: StrokeStyle(lineWidth: brushSize * scale, lineCap: .round, lineJoin: .round)
    )
  }

  // MARK: - Input

  private func documentPoint(_ location: CGPoint, scale: CGFloat) -> (x: Double, y: Double) {
    (Double(location.x / scale), Double(location.y / scale))
  }

  /// Pointer-down + move handling, mirroring the web `handlePointerDown` /
  /// `handlePointerMove`: every action snapshots first; fill and sticker
  /// fire once on the down; strokes paint a dot then follow the finger;
  /// shapes only preview until release.
  private func handleDragChanged(_ value: DragGesture.Value, scale: CGFloat) {
    let engine = session.engine
    let point = documentPoint(value.location, scale: scale)

    if !session.gestureActive {
      session.gestureActive = true
      session.tapConsumed = false
      let start = documentPoint(value.startLocation, scale: scale)
      engine.snapshot()

      switch tool {
      case .fill:
        engine.floodFill(x: start.x, y: start.y, color: PaintRGBA(hex: colorHex))
        advanceTip()
        session.tapConsumed = true
      case .sticker:
        if let bitmap = session.stickerBitmap(glyph: sticker, fontSize: brushSize * PaintEngine.stickerFontScale) {
          engine.stampSticker(bitmap, centerX: start.x, centerY: start.y)
        }
        advanceTip()
        session.tapConsumed = true
      case .shape:
        shapePreview = ShapePreview(
          startX: start.x, startY: start.y, currentX: start.x, currentY: start.y
        )
      case .brush, .pencil, .eraser:
        // Dot for a simple tap (web strokes a 0.01px segment).
        engine.strokeSegment(
          tool: strokeTool, x0: start.x, y0: start.y, x1: start.x, y1: start.y,
          color: PaintRGBA(hex: colorHex), size: brushSize, opacity: brushOpacity
        )
      }
      session.lastX = start.x
      session.lastY = start.y
      documentRevision += 1
      return
    }

    guard !session.tapConsumed else { return }

    if tool == .shape {
      shapePreview?.currentX = point.x
      shapePreview?.currentY = point.y
    } else {
      engine.strokeSegment(
        tool: strokeTool, x0: session.lastX, y0: session.lastY, x1: point.x, y1: point.y,
        color: PaintRGBA(hex: colorHex), size: brushSize, opacity: brushOpacity
      )
      documentRevision += 1
    }
    session.lastX = point.x
    session.lastY = point.y
  }

  /// Pointer-up: commit the previewed shape onto the paper (web
  /// `handlePointerUp`) and rotate the status-bar tip.
  private func handleDragEnded(_ value: DragGesture.Value, scale: CGFloat) {
    session.gestureActive = false
    guard !session.tapConsumed else { return }

    if tool == .shape, let preview = shapePreview {
      let point = documentPoint(value.location, scale: scale)
      session.engine.stampShape(
        kind: shapeKind,
        x0: preview.startX, y0: preview.startY, x1: point.x, y1: point.y,
        color: PaintRGBA(hex: colorHex), lineWidth: brushSize
      )
      shapePreview = nil
      documentRevision += 1
    }
    advanceTip()
  }

  /// The engine's stroke-tool twin of the UI tool (only valid for the three
  /// stroke tools).
  private var strokeTool: PaintStrokeTool {
    switch tool {
    case .pencil: return .pencil
    case .eraser: return .eraser
    default: return .brush
    }
  }

  private func advanceTip() {
    tipIndex = (tipIndex + 1) % tips.count
  }

  // MARK: - Panels

  /// Size/opacity sliders and the sticker tray (the web right-hand panel).
  private var settingsPanel: some View {
    VStack(spacing: theme.spacing.sm) {
      sliderRow(label: "Size", value: $brushSize, range: 2...60, display: "\(Int(brushSize))")
      sliderRow(
        label: "Opacity", value: $brushOpacity, range: 0.1...1,
        display: "\(Int((brushOpacity * 100).rounded()))%"
      )
      HStack(spacing: theme.spacing.xs) {
        ForEach(stickers, id: \.self) { value in
          Button {
            sticker = value
            tool = .sticker
          } label: {
            Text(value)
              .font(.system(size: 18))
              .frame(maxWidth: .infinity)
              .padding(.vertical, 5)
              .background(
                tool == .sticker && sticker == value ? PaintColors.accent : PaintColors.paper
              )
              .clipShape(RoundedRectangle(cornerRadius: 7, style: .continuous))
              .overlay(
                RoundedRectangle(cornerRadius: 7, style: .continuous)
                  .stroke(PaintColors.ink, lineWidth: 2)
              )
          }
        }
      }
    }
    .padding(.horizontal, 12)
    .padding(.vertical, 8)
    .background(PaintColors.frameDark)
    .overlay(alignment: .bottom) { inkDivider }
  }

  private func sliderRow(
    label: String, value: Binding<Double>, range: ClosedRange<Double>, display: String
  ) -> some View {
    HStack(spacing: theme.spacing.sm) {
      Text(label)
        .font(.system(size: 12, weight: .bold))
        .foregroundStyle(PaintColors.ink)
        .frame(width: 52, alignment: .leading)
      Slider(value: value, in: range)
        .tint(PaintColors.ink)
      Text(display)
        .font(.system(size: 12, weight: .bold).monospacedDigit())
        .foregroundStyle(PaintColors.ink)
        .frame(width: 38, alignment: .trailing)
    }
  }

  /// Current-color chip plus the two swatch rows (the web bottom palette).
  private var paletteBar: some View {
    HStack(spacing: theme.spacing.md) {
      RoundedRectangle(cornerRadius: 7, style: .continuous)
        .fill(Color(hex: colorHex))
        .frame(width: 38, height: 38)
        .overlay(
          RoundedRectangle(cornerRadius: 7, style: .continuous)
            .stroke(PaintColors.ink, lineWidth: 2)
        )
      VStack(spacing: 4) {
        ForEach(swatches, id: \.self) { row in
          HStack(spacing: 4) {
            ForEach(row, id: \.self) { value in
              Button {
                colorHex = value
              } label: {
                RoundedRectangle(cornerRadius: 4, style: .continuous)
                  .fill(Color(hex: value))
                  .frame(height: 16)
                  .frame(maxWidth: .infinity)
                  .overlay(
                    RoundedRectangle(cornerRadius: 4, style: .continuous)
                      .stroke(PaintColors.ink, lineWidth: colorHex == value ? 3 : 2)
                  )
              }
            }
          }
        }
      }
    }
    .padding(.horizontal, 12)
    .padding(.vertical, 8)
    .background(PaintColors.frame)
    .overlay(alignment: .bottom) { inkDivider }
  }

  private var statusBar: some View {
    HStack {
      Text(tips[tipIndex])
        .lineLimit(1)
      Spacer()
      Text("Canvas: \(session.engine.width) × \(session.engine.height)")
    }
    .font(.system(size: 11, weight: .bold))
    .foregroundStyle(PaintColors.ink)
    .padding(.horizontal, 12)
    .padding(.vertical, 5)
    .background(PaintColors.frameDark)
  }

  private func chunkyButton(
    _ label: String, active: Bool = false, disabled: Bool = false, action: @escaping () -> Void
  ) -> some View {
    Button(action: action) {
      Text(label)
        .font(.system(size: theme.typography.sizes.sm, weight: .bold))
        .foregroundStyle(PaintColors.ink)
        .padding(.horizontal, 14)
        .padding(.vertical, 5)
        .background(active ? PaintColors.accent : PaintColors.frame)
        .clipShape(RoundedRectangle(cornerRadius: 7, style: .continuous))
        .overlay(
          RoundedRectangle(cornerRadius: 7, style: .continuous)
            .stroke(PaintColors.ink, lineWidth: 2)
        )
        .opacity(disabled ? 0.4 : 1)
    }
    .disabled(disabled)
  }

  // MARK: - Export

  /// Encode the document as a PNG in the temp directory and hand it to the
  /// share sheet — the native counterpart of the web's download link. The
  /// user can pick "Save Image" there; no photo-library permission plumbing
  /// lives in the app.
  private func exportPNG() {
    guard let data = session.encodePNG() else { return }
    let url = FileManager.default.temporaryDirectory.appendingPathComponent("paintbot.png")
    do {
      try data.write(to: url, options: .atomic)
      exportURL = url
      isSharePresented = true
    } catch {
      // A temp-dir write failing is not actionable; just skip the sheet.
    }
  }
}

/// Shape-drag preview state (document coordinates).
private struct ShapePreview {
  let startX: Double
  let startY: Double
  var currentX: Double
  var currentY: Double
}

/// Document state that must survive view updates without triggering them:
/// the engine, in-flight gesture bookkeeping, and render caches. SwiftUI
/// invalidation is driven explicitly through the view's `documentRevision`.
private final class PaintSession {
  let engine = PaintEngine()

  // Gesture bookkeeping (the web CanvasState).
  var gestureActive = false
  /// True when the down event fully handled the action (fill/sticker), so
  /// the rest of the drag is ignored like the web's early returns.
  var tapConsumed = false
  var lastX: Double = 0
  var lastY: Double = 0

  private var cachedImage: CGImage?
  private var cachedRevision = -1
  private var stickerCache: [String: PaintBitmap] = [:]

  /// The engine buffer as a CGImage, re-encoded only when the document
  /// actually changed since the last frame.
  func paperImage() -> CGImage? {
    if cachedRevision == engine.revision, let cachedImage {
      return cachedImage
    }
    cachedImage = Self.makeImage(
      pixels: engine.exportPixels(), width: engine.width, height: engine.height
    )
    cachedRevision = engine.revision
    return cachedImage
  }

  /// PNG for export — dimensions are exactly the engine's document size.
  func encodePNG() -> Data? {
    guard let image = Self.makeImage(
      pixels: engine.exportPixels(), width: engine.width, height: engine.height
    ) else { return nil }
    return UIImage(cgImage: image).pngData()
  }

  /// Rasterize an emoji glyph for the engine to stamp, cached per
  /// glyph+size. UIKit text rendering stays here so the engine remains
  /// pure pixels.
  func stickerBitmap(glyph: String, fontSize: Double) -> PaintBitmap? {
    let key = "\(glyph)-\(Int(fontSize.rounded()))"
    if let cached = stickerCache[key] {
      return cached
    }
    guard let bitmap = Self.rasterizeGlyph(glyph, fontSize: CGFloat(fontSize)) else {
      return nil
    }
    stickerCache[key] = bitmap
    return bitmap
  }

  /// Wrap a straight-RGBA buffer in a CGImage. Alpha is always 255, so
  /// premultiplied-last is byte-identical to straight alpha.
  private static func makeImage(pixels: [UInt8], width: Int, height: Int) -> CGImage? {
    guard let provider = CGDataProvider(data: Data(pixels) as CFData) else {
      return nil
    }
    return CGImage(
      width: width,
      height: height,
      bitsPerComponent: 8,
      bitsPerPixel: 32,
      bytesPerRow: width * 4,
      space: CGColorSpaceCreateDeviceRGB(),
      bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue),
      provider: provider,
      decode: nil,
      shouldInterpolate: false,
      intent: .defaultIntent
    )
  }

  /// Draw an emoji into a transparent RGBA buffer (the web draws stickers
  /// with `fillText` at `size * 3`px). Un-premultiplies so the engine can
  /// source-over blend with straight alpha.
  private static func rasterizeGlyph(_ glyph: String, fontSize: CGFloat) -> PaintBitmap? {
    let attributes: [NSAttributedString.Key: Any] = [
      .font: UIFont.systemFont(ofSize: fontSize)
    ]
    let bounds = (glyph as NSString).size(withAttributes: attributes)
    let width = Int(bounds.width.rounded(.up))
    let height = Int(bounds.height.rounded(.up))
    guard width > 0, height > 0 else { return nil }

    var pixels = [UInt8](repeating: 0, count: width * height * 4)
    let drawn = pixels.withUnsafeMutableBytes { raw -> Bool in
      guard let context = CGContext(
        data: raw.baseAddress,
        width: width,
        height: height,
        bitsPerComponent: 8,
        bytesPerRow: width * 4,
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
      ) else { return false }
      // Flip into UIKit's top-left origin before handing the context to
      // NSString drawing.
      context.translateBy(x: 0, y: CGFloat(height))
      context.scaleBy(x: 1, y: -1)
      UIGraphicsPushContext(context)
      (glyph as NSString).draw(at: .zero, withAttributes: attributes)
      UIGraphicsPopContext()
      return true
    }
    guard drawn else { return nil }

    // Un-premultiply so PaintEngine's straight-alpha blend is exact.
    for i in stride(from: 0, to: pixels.count, by: 4) {
      let alpha = Int(pixels[i + 3])
      if alpha > 0, alpha < 255 {
        pixels[i] = UInt8(min(255, Int(pixels[i]) * 255 / alpha))
        pixels[i + 1] = UInt8(min(255, Int(pixels[i + 1]) * 255 / alpha))
        pixels[i + 2] = UInt8(min(255, Int(pixels[i + 2]) * 255 / alpha))
      }
    }
    return PaintBitmap(width: width, height: height, pixels: pixels)
  }
}

/// UIActivityViewController wrapper for the Save flow (share/export the PNG;
/// the sheet's own "Save Image" action covers the photo library).
private struct PaintShareSheet: UIViewControllerRepresentable {
  let items: [Any]

  func makeUIViewController(context: Context) -> UIActivityViewController {
    UIActivityViewController(activityItems: items, applicationActivities: nil)
  }

  func updateUIViewController(_ controller: UIActivityViewController, context: Context) {}
}
