import Foundation

/// Stroke-capable tools. Width/alpha rules per tool mirror the web
/// `strokeSegment` (`web/app/src/View/Games/Paint/PaintCanvas.tsx`):
/// brush = full size at the chosen opacity, pencil = thin and always opaque,
/// eraser = 1.6x size painting the paper white.
enum PaintStrokeTool {
  case brush
  case pencil
  case eraser
}

/// Shapes the shape tool can stamp — the web `ShapeKind` union.
enum PaintShapeKind: String, CaseIterable, Identifiable {
  case line
  case rect
  case ellipse

  var id: String { rawValue }
}

/// A straight-alpha (non-premultiplied) RGBA color, the same 4-tuple the web
/// `hexToRgba` produces for flood fill.
struct PaintRGBA: Equatable {
  var r: UInt8
  var g: UInt8
  var b: UInt8
  var a: UInt8

  static let white = PaintRGBA(r: 255, g: 255, b: 255)

  init(r: UInt8, g: UInt8, b: UInt8, a: UInt8 = 255) {
    self.r = r
    self.g = g
    self.b = b
    self.a = a
  }

  /// Parse `#rrggbb` exactly like the web `hexToRgba` (alpha is always 255).
  /// Malformed channels fall back to 0.
  init(hex: String) {
    let value = hex.hasPrefix("#") ? String(hex.dropFirst()) : hex
    func channel(_ offset: Int) -> UInt8 {
      guard value.count >= offset + 2 else { return 0 }
      let lower = value.index(value.startIndex, offsetBy: offset)
      let upper = value.index(lower, offsetBy: 2)
      return UInt8(value[lower..<upper], radix: 16) ?? 0
    }
    self.init(r: channel(0), g: channel(2), b: channel(4))
  }
}

/// A small straight-alpha RGBA raster (row-major, 4 bytes per pixel) used to
/// stamp stickers. The engine stays free of text APIs: the view rasterizes
/// the emoji glyph with platform text rendering and hands the pixels in.
struct PaintBitmap {
  let width: Int
  let height: Int
  /// `width * height * 4` bytes of straight (non-premultiplied) RGBA.
  let pixels: [UInt8]
}

/// Pure port of the web paint document model
/// (`web/app/src/View/Games/Paint/PaintCanvas.tsx` + `tools.ts`). No SwiftUI
/// here: the engine owns a width x height straight-RGBA pixel buffer plus the
/// undo/redo stacks, and exposes the same operations the web canvas performs
/// (brush/pencil/eraser segments, scanline flood fill, shape stamping,
/// sticker stamping, clear). Rendering, gestures, and PNG encoding live in
/// `PaintGameView`.
///
/// Semantics kept byte-for-byte with the web version:
/// - The paper starts white and stays fully opaque (the eraser paints white).
/// - `snapshot()` is called once at the start of a user action, before any
///   mutation; history is capped at 40 entries and any snapshot clears redo.
/// - Flood fill is the same scanline algorithm with per-channel tolerance 32.
/// - Stroke widths: brush = size, pencil = max(1.5, size / 5), eraser =
///   size * 1.6; only the brush honors opacity.
///
/// Intentional divergence: the web strokes through Canvas2D, which
/// anti-aliases edges; this engine rasterizes hard-edged round-capped
/// segments (a pixel paints when its center falls inside the stroke capsule).
final class PaintEngine {
  // Document geometry and rules — must stay in sync with the web constants.
  static let canvasWidth = 960
  static let canvasHeight = 640
  /// Web `MAX_HISTORY`: the undo stack keeps at most this many snapshots,
  /// dropping the oldest first.
  static let maxHistory = 40
  /// Web flood-fill default tolerance (per channel), so anti-aliased edges
  /// don't leave halos.
  static let fillTolerance = 32
  /// Web sticker stamping draws the emoji at `size * 3` px font.
  static let stickerFontScale: Double = 3

  let width: Int
  let height: Int

  /// Row-major straight-RGBA pixel buffer (`width * height * 4` bytes). This
  /// is the PNG-exportable document: alpha is always 255.
  private(set) var pixels: [UInt8]

  /// Bumped on every visible mutation so renderers can cache the converted
  /// platform image and regenerate only when the document actually changed.
  private(set) var revision = 0

  private var undoStack: [[UInt8]] = []
  private var redoStack: [[UInt8]] = []

  var canUndo: Bool { !undoStack.isEmpty }
  var canRedo: Bool { !redoStack.isEmpty }
  /// Number of undo snapshots currently held (capped at `maxHistory`).
  var undoDepth: Int { undoStack.count }

  /// The default document is the web's 960x640 paper; tests pass smaller
  /// sizes so pixel-level assertions stay fast and readable.
  init(width: Int = PaintEngine.canvasWidth, height: Int = PaintEngine.canvasHeight) {
    self.width = width
    self.height = height
    self.pixels = [UInt8](repeating: 255, count: width * height * 4)
  }

  /// Stroke width per tool — the web `strokeSegment` lineWidth table.
  static func strokeWidth(tool: PaintStrokeTool, size: Double) -> Double {
    switch tool {
    case .brush: return size
    case .pencil: return max(1.5, size / 5)
    case .eraser: return size * 1.6
    }
  }

  // MARK: - History

  /// Push the current buffer onto the undo stack (call once at the start of
  /// a user action, before mutating — the web snapshots on pointer down).
  /// Caps history at `maxHistory` and clears redo, exactly like the web.
  func snapshot() {
    undoStack.append(pixels)
    if undoStack.count > Self.maxHistory {
      undoStack.removeFirst()
    }
    redoStack.removeAll()
  }

  /// Restore the previous snapshot, moving the current buffer to redo.
  func undo() {
    guard let previous = undoStack.popLast() else { return }
    redoStack.append(pixels)
    pixels = previous
    revision += 1
  }

  /// Re-apply an undone buffer, moving the current one back to undo.
  func redo() {
    guard let next = redoStack.popLast() else { return }
    undoStack.append(pixels)
    pixels = next
    revision += 1
  }

  /// "New painting": snapshot then repaint the paper white (web `clear()`),
  /// so the wipe itself is undoable.
  func clear() {
    snapshot()
    for i in pixels.indices {
      pixels[i] = 255
    }
    revision += 1
  }

  // MARK: - Strokes

  /// Stamp one round-capped segment of a drag stroke. A zero-length segment
  /// paints a dot, which is how a plain tap draws (the web nudges the end
  /// point by 0.01px for the same effect).
  func strokeSegment(
    tool: PaintStrokeTool,
    x0: Double, y0: Double,
    x1: Double, y1: Double,
    color: PaintRGBA,
    size: Double,
    opacity: Double
  ) {
    let strokeColor: PaintRGBA
    let alpha: Double
    switch tool {
    case .brush:
      strokeColor = color
      alpha = opacity
    case .pencil:
      strokeColor = color
      alpha = 1
    case .eraser:
      strokeColor = .white
      alpha = 1
    }
    fillCapsule(
      x0: x0, y0: y0, x1: x1, y1: y1,
      strokeWidth: Self.strokeWidth(tool: tool, size: size),
      color: strokeColor,
      alpha: alpha
    )
    revision += 1
  }

  // MARK: - Flood fill

  /// Classic scanline flood fill with a per-channel tolerance so
  /// anti-aliased edges don't leave halos — a direct port of the web
  /// `floodFill` in `tools.ts`, including the early-outs (out-of-bounds
  /// start, or the target already being exactly the fill color).
  func floodFill(x: Double, y: Double, color fill: PaintRGBA, tolerance: Int = PaintEngine.fillTolerance) {
    let x0 = Int(x.rounded(.down))
    let y0 = Int(y.rounded(.down))
    guard x0 >= 0, y0 >= 0, x0 < width, y0 < height else { return }

    let startIdx = (y0 * width + x0) * 4
    let target = (
      pixels[startIdx], pixels[startIdx + 1], pixels[startIdx + 2], pixels[startIdx + 3]
    )
    if target == (fill.r, fill.g, fill.b, fill.a) {
      return
    }

    func matches(_ idx: Int) -> Bool {
      abs(Int(pixels[idx]) - Int(target.0)) <= tolerance
        && abs(Int(pixels[idx + 1]) - Int(target.1)) <= tolerance
        && abs(Int(pixels[idx + 2]) - Int(target.2)) <= tolerance
        && abs(Int(pixels[idx + 3]) - Int(target.3)) <= tolerance
    }

    func paint(_ idx: Int) {
      pixels[idx] = fill.r
      pixels[idx + 1] = fill.g
      pixels[idx + 2] = fill.b
      pixels[idx + 3] = fill.a
    }

    var stack: [(Int, Int)] = [(x0, y0)]
    while let (x, y) = stack.popLast() {
      var west = x
      var east = x
      while west > 0, matches((y * width + west - 1) * 4) {
        west -= 1
      }
      while east < width - 1, matches((y * width + east + 1) * 4) {
        east += 1
      }
      for i in west...east {
        let idx = (y * width + i) * 4
        guard matches(idx) else { continue }
        paint(idx)
        if y > 0, matches(((y - 1) * width + i) * 4) {
          stack.append((i, y - 1))
        }
        if y < height - 1, matches(((y + 1) * width + i) * 4) {
          stack.append((i, y + 1))
        }
      }
    }
    revision += 1
  }

  // MARK: - Shapes

  /// Stroke a line, rectangle, or ellipse between two drag corner points —
  /// the web `drawShape`, always fully opaque with round caps/joins. Rects
  /// stroke their four edges; ellipses stroke a dense polyline around the
  /// perimeter, so corners and curves get the same rounded treatment as
  /// Canvas2D's `lineJoin: "round"`.
  func stampShape(
    kind: PaintShapeKind,
    x0: Double, y0: Double,
    x1: Double, y1: Double,
    color: PaintRGBA,
    lineWidth: Double
  ) {
    switch kind {
    case .line:
      fillCapsule(x0: x0, y0: y0, x1: x1, y1: y1, strokeWidth: lineWidth, color: color, alpha: 1)
    case .rect:
      let minX = min(x0, x1)
      let maxX = max(x0, x1)
      let minY = min(y0, y1)
      let maxY = max(y0, y1)
      fillCapsule(x0: minX, y0: minY, x1: maxX, y1: minY, strokeWidth: lineWidth, color: color, alpha: 1)
      fillCapsule(x0: maxX, y0: minY, x1: maxX, y1: maxY, strokeWidth: lineWidth, color: color, alpha: 1)
      fillCapsule(x0: maxX, y0: maxY, x1: minX, y1: maxY, strokeWidth: lineWidth, color: color, alpha: 1)
      fillCapsule(x0: minX, y0: maxY, x1: minX, y1: minY, strokeWidth: lineWidth, color: color, alpha: 1)
    case .ellipse:
      let cx = (x0 + x1) / 2
      let cy = (y0 + y1) / 2
      let rx = abs(x1 - x0) / 2
      let ry = abs(y1 - y0) / 2
      // Segment count grows with the radii so big ellipses stay smooth.
      let steps = max(24, Int(((rx + ry) / 2).rounded(.up)))
      var previousX = cx + rx
      var previousY = cy
      for i in 1...steps {
        let angle = Double(i) / Double(steps) * 2 * .pi
        let nextX = cx + cos(angle) * rx
        let nextY = cy + sin(angle) * ry
        fillCapsule(
          x0: previousX, y0: previousY, x1: nextX, y1: nextY,
          strokeWidth: lineWidth, color: color, alpha: 1
        )
        previousX = nextX
        previousY = nextY
      }
    }
    revision += 1
  }

  // MARK: - Stickers

  /// Composite a pre-rasterized sticker glyph, centered on the tap point,
  /// straight-alpha source-over like the web `fillText` stamp. Parts hanging
  /// off the paper are clipped.
  func stampSticker(_ bitmap: PaintBitmap, centerX: Double, centerY: Double) {
    let left = Int((centerX - Double(bitmap.width) / 2).rounded())
    let top = Int((centerY - Double(bitmap.height) / 2).rounded())
    for sy in 0..<bitmap.height {
      let dy = top + sy
      guard dy >= 0, dy < height else { continue }
      for sx in 0..<bitmap.width {
        let dx = left + sx
        guard dx >= 0, dx < width else { continue }
        let s = (sy * bitmap.width + sx) * 4
        let sourceAlpha = Double(bitmap.pixels[s + 3]) / 255
        guard sourceAlpha > 0 else { continue }
        blend(
          index: (dy * width + dx) * 4,
          color: PaintRGBA(r: bitmap.pixels[s], g: bitmap.pixels[s + 1], b: bitmap.pixels[s + 2]),
          alpha: sourceAlpha
        )
      }
    }
    revision += 1
  }

  // MARK: - Reading the document

  /// The color at a pixel (for tests and color sampling). Must be in bounds.
  func pixel(x: Int, y: Int) -> PaintRGBA {
    precondition(x >= 0 && x < width && y >= 0 && y < height, "pixel out of bounds")
    let idx = (y * width + x) * 4
    return PaintRGBA(r: pixels[idx], g: pixels[idx + 1], b: pixels[idx + 2], a: pixels[idx + 3])
  }

  /// A copy of the raw RGBA buffer, ready to wrap in a platform image for
  /// PNG export (the web's `canvas.toDataURL("image/png")` equivalent).
  func exportPixels() -> [UInt8] {
    pixels
  }

  // MARK: - Rasterization

  /// Paint every pixel whose center lies within `strokeWidth / 2` of the
  /// segment — a hard-edged capsule, i.e. a Canvas2D stroke with round caps.
  private func fillCapsule(
    x0: Double, y0: Double,
    x1: Double, y1: Double,
    strokeWidth: Double,
    color: PaintRGBA,
    alpha: Double
  ) {
    let radius = strokeWidth / 2
    guard radius > 0, alpha > 0 else { return }
    let minPX = max(0, Int((min(x0, x1) - radius).rounded(.down)))
    let maxPX = min(width - 1, Int((max(x0, x1) + radius).rounded(.up)))
    let minPY = max(0, Int((min(y0, y1) - radius).rounded(.down)))
    let maxPY = min(height - 1, Int((max(y0, y1) + radius).rounded(.up)))
    guard minPX <= maxPX, minPY <= maxPY else { return }

    let dx = x1 - x0
    let dy = y1 - y0
    let lengthSquared = dx * dx + dy * dy
    let radiusSquared = radius * radius

    for py in minPY...maxPY {
      let centerY = Double(py) + 0.5
      for px in minPX...maxPX {
        let centerX = Double(px) + 0.5
        // Distance from the pixel center to the segment.
        var t = 0.0
        if lengthSquared > 0 {
          t = max(0, min(1, ((centerX - x0) * dx + (centerY - y0) * dy) / lengthSquared))
        }
        let offsetX = x0 + t * dx - centerX
        let offsetY = y0 + t * dy - centerY
        if offsetX * offsetX + offsetY * offsetY <= radiusSquared {
          blend(index: (py * width + px) * 4, color: color, alpha: alpha)
        }
      }
    }
  }

  /// Straight-alpha source-over onto the (always opaque) paper:
  /// `out = src * alpha + dst * (1 - alpha)`, matching Canvas2D with
  /// `globalAlpha` on an opaque backing store.
  private func blend(index: Int, color: PaintRGBA, alpha: Double) {
    if alpha >= 1 {
      pixels[index] = color.r
      pixels[index + 1] = color.g
      pixels[index + 2] = color.b
      pixels[index + 3] = 255
      return
    }
    let inverse = 1 - alpha
    pixels[index] = UInt8((Double(color.r) * alpha + Double(pixels[index]) * inverse).rounded())
    pixels[index + 1] = UInt8((Double(color.g) * alpha + Double(pixels[index + 1]) * inverse).rounded())
    pixels[index + 2] = UInt8((Double(color.b) * alpha + Double(pixels[index + 2]) * inverse).rounded())
    pixels[index + 3] = 255
  }
}
