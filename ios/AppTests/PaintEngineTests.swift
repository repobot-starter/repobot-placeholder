import XCTest
@testable import AppIOS

/// Exercises the pure paint document model against the web PaintCanvas.tsx /
/// tools.ts rules it mirrors: brush stamping, tolerance flood fill bounded by
/// borders, undo/redo snapshot semantics with the 40-entry cap, shape and
/// sticker placement, and export buffer dimensions. Small documents keep the
/// pixel assertions readable.
final class PaintEngineTests: XCTestCase {
  private let red = PaintRGBA(r: 255, g: 0, b: 0)
  private let blue = PaintRGBA(r: 0, g: 0, b: 255)

  func testDocumentStartsAsOpaqueWhitePaper() {
    let engine = PaintEngine(width: 8, height: 8)

    for y in 0..<8 {
      for x in 0..<8 {
        XCTAssertEqual(engine.pixel(x: x, y: y), .white)
      }
    }
    XCTAssertFalse(engine.canUndo)
    XCTAssertFalse(engine.canRedo)
  }

  func testBrushStampWritesExpectedPixels() {
    let engine = PaintEngine(width: 20, height: 20)

    // A zero-length brush segment is a dot (the web taps stroke a 0.01px
    // segment): size 6 covers pixels within 3px of the center.
    engine.strokeSegment(
      tool: .brush, x0: 10, y0: 10, x1: 10, y1: 10, color: red, size: 6, opacity: 1
    )

    XCTAssertEqual(engine.pixel(x: 10, y: 10), red)
    XCTAssertEqual(engine.pixel(x: 8, y: 10), red)
    XCTAssertEqual(engine.pixel(x: 10, y: 12), red)
    // Outside the 3px radius the paper is untouched.
    XCTAssertEqual(engine.pixel(x: 14, y: 10), .white)
    XCTAssertEqual(engine.pixel(x: 0, y: 0), .white)
  }

  func testBrushOpacityBlendsWithThePaper() {
    let engine = PaintEngine(width: 10, height: 10)

    // 50% black over white must land mid-gray (straight source-over).
    engine.strokeSegment(
      tool: .brush, x0: 5, y0: 5, x1: 5, y1: 5,
      color: PaintRGBA(r: 0, g: 0, b: 0), size: 4, opacity: 0.5
    )

    let blended = engine.pixel(x: 5, y: 5)
    XCTAssertEqual(Double(blended.r), 127.5, accuracy: 1)
    XCTAssertEqual(blended.a, 255)
  }

  func testEraserPaintsWhiteAtWiderWidth() {
    let engine = PaintEngine(width: 30, height: 30)
    engine.floodFill(x: 0, y: 0, color: blue)  // paint everything blue

    // Eraser width is size * 1.6 (web strokeSegment): size 10 -> radius 8.
    engine.strokeSegment(
      tool: .eraser, x0: 15, y0: 15, x1: 15, y1: 15, color: red, size: 10, opacity: 0.2
    )

    // The passed color and opacity are ignored: the eraser is opaque white.
    XCTAssertEqual(engine.pixel(x: 15, y: 15), .white)
    XCTAssertEqual(engine.pixel(x: 15, y: 21), .white)  // inside 8px radius
    XCTAssertEqual(engine.pixel(x: 15, y: 25), blue)  // outside it
  }

  func testPencilUsesThinAlwaysOpaqueStroke() {
    // Web pencil width: max(1.5, size / 5) -> size 30 gives 6.
    XCTAssertEqual(PaintEngine.strokeWidth(tool: .pencil, size: 30), 6)
    XCTAssertEqual(PaintEngine.strokeWidth(tool: .pencil, size: 2), 1.5)

    let engine = PaintEngine(width: 20, height: 20)
    engine.strokeSegment(
      tool: .pencil, x0: 10, y0: 10, x1: 10, y1: 10, color: red, size: 30, opacity: 0.1
    )
    // Pencil ignores opacity (web forces globalAlpha = 1).
    XCTAssertEqual(engine.pixel(x: 10, y: 10), red)
  }

  func testFloodFillFillsBoundedRegionAndStopsAtBorders() {
    let engine = PaintEngine(width: 16, height: 16)

    // A 1px-wide blue box from (4,4) to (11,11), drawn as exact pixels so
    // the boundary is airtight.
    for i in 4...11 {
      engine.strokeSegment(tool: .brush, x0: Double(i) + 0.5, y0: 4.5, x1: Double(i) + 0.5, y1: 4.5, color: blue, size: 1, opacity: 1)
      engine.strokeSegment(tool: .brush, x0: Double(i) + 0.5, y0: 11.5, x1: Double(i) + 0.5, y1: 11.5, color: blue, size: 1, opacity: 1)
      engine.strokeSegment(tool: .brush, x0: 4.5, y0: Double(i) + 0.5, x1: 4.5, y1: Double(i) + 0.5, color: blue, size: 1, opacity: 1)
      engine.strokeSegment(tool: .brush, x0: 11.5, y0: Double(i) + 0.5, x1: 11.5, y1: Double(i) + 0.5, color: blue, size: 1, opacity: 1)
    }

    engine.floodFill(x: 8, y: 8, color: red)

    // Inside the box: filled.
    XCTAssertEqual(engine.pixel(x: 8, y: 8), red)
    XCTAssertEqual(engine.pixel(x: 5, y: 5), red)
    XCTAssertEqual(engine.pixel(x: 10, y: 10), red)
    // The border itself is far outside the 32-per-channel tolerance of the
    // white target, so it survives.
    XCTAssertEqual(engine.pixel(x: 4, y: 8), blue)
    XCTAssertEqual(engine.pixel(x: 8, y: 11), blue)
    // Outside the box: untouched.
    XCTAssertEqual(engine.pixel(x: 0, y: 0), .white)
    XCTAssertEqual(engine.pixel(x: 13, y: 8), .white)
  }

  func testFloodFillToleranceAbsorbsNearTargetPixels() {
    let engine = PaintEngine(width: 4, height: 1)

    // An off-white pixel within the default 32 tolerance gets filled; a
    // darker one beyond it does not.
    engine.strokeSegment(
      tool: .brush, x0: 1.5, y0: 0.5, x1: 1.5, y1: 0.5,
      color: PaintRGBA(r: 240, g: 240, b: 240), size: 1, opacity: 1
    )
    engine.strokeSegment(
      tool: .brush, x0: 2.5, y0: 0.5, x1: 2.5, y1: 0.5,
      color: PaintRGBA(r: 180, g: 180, b: 180), size: 1, opacity: 1
    )

    engine.floodFill(x: 0, y: 0, color: red)

    XCTAssertEqual(engine.pixel(x: 0, y: 0), red)
    XCTAssertEqual(engine.pixel(x: 1, y: 0), red)
    XCTAssertEqual(engine.pixel(x: 2, y: 0), PaintRGBA(r: 180, g: 180, b: 180))
    XCTAssertEqual(engine.pixel(x: 3, y: 0), .white)
  }

  func testFloodFillIgnoresOutOfBoundsAndNoOpTargets() {
    let engine = PaintEngine(width: 4, height: 4)

    engine.floodFill(x: -1, y: 2, color: red)
    engine.floodFill(x: 2, y: 99, color: red)
    // Filling white with white is the web's exact-match early-out.
    engine.floodFill(x: 2, y: 2, color: .white)

    XCTAssertEqual(engine.pixel(x: 2, y: 2), .white)
    XCTAssertEqual(engine.revision, 0)
  }

  func testUndoRestoresPriorBufferAndRedoReappliesIt() {
    let engine = PaintEngine(width: 8, height: 8)

    engine.snapshot()  // pointer down
    engine.strokeSegment(tool: .brush, x0: 4, y0: 4, x1: 4, y1: 4, color: red, size: 4, opacity: 1)
    XCTAssertTrue(engine.canUndo)

    engine.undo()
    XCTAssertEqual(engine.pixel(x: 4, y: 4), .white)
    XCTAssertFalse(engine.canUndo)
    XCTAssertTrue(engine.canRedo)

    engine.redo()
    XCTAssertEqual(engine.pixel(x: 4, y: 4), red)

    // A fresh snapshot clears redo, like the web.
    engine.undo()
    engine.snapshot()
    XCTAssertFalse(engine.canRedo)
  }

  func testUndoHistoryIsCappedAtWebMaxHistory() {
    let engine = PaintEngine(width: 4, height: 4)

    for _ in 0..<(PaintEngine.maxHistory + 10) {
      engine.snapshot()
    }

    XCTAssertEqual(engine.undoDepth, PaintEngine.maxHistory)
  }

  func testClearIsUndoable() {
    let engine = PaintEngine(width: 8, height: 8)
    engine.snapshot()
    engine.strokeSegment(tool: .brush, x0: 4, y0: 4, x1: 4, y1: 4, color: red, size: 4, opacity: 1)

    engine.clear()
    XCTAssertEqual(engine.pixel(x: 4, y: 4), .white)

    engine.undo()
    XCTAssertEqual(engine.pixel(x: 4, y: 4), red)
  }

  func testShapeStampStrokesOutlineNotFill() {
    let engine = PaintEngine(width: 40, height: 40)

    engine.stampShape(kind: .rect, x0: 10, y0: 10, x1: 30, y1: 30, color: blue, lineWidth: 2)

    // Edges painted, interior and exterior untouched.
    XCTAssertEqual(engine.pixel(x: 20, y: 10), blue)
    XCTAssertEqual(engine.pixel(x: 10, y: 20), blue)
    XCTAssertEqual(engine.pixel(x: 20, y: 20), .white)
    XCTAssertEqual(engine.pixel(x: 2, y: 2), .white)

    // Ellipse: perimeter pixels painted, center clear.
    let oval = PaintEngine(width: 40, height: 40)
    oval.stampShape(kind: .ellipse, x0: 10, y0: 10, x1: 30, y1: 30, color: blue, lineWidth: 2)
    XCTAssertEqual(oval.pixel(x: 20, y: 10), blue)  // top of the ellipse
    XCTAssertEqual(oval.pixel(x: 30, y: 20), blue)  // right of the ellipse
    XCTAssertEqual(oval.pixel(x: 20, y: 20), .white)
  }

  func testShapeStampClipsSafelyOutsideTheDocument() {
    let engine = PaintEngine(width: 20, height: 20)

    // Corners far outside the paper must not crash and must paint the
    // in-bounds part of the outline.
    engine.stampShape(kind: .line, x0: -50, y0: 10, x1: 70, y1: 10, color: red, lineWidth: 4)

    XCTAssertEqual(engine.pixel(x: 0, y: 10), red)
    XCTAssertEqual(engine.pixel(x: 19, y: 10), red)
    XCTAssertEqual(engine.pixel(x: 10, y: 0), .white)
  }

  func testStickerPlacementIsCenteredAndClipped() {
    let engine = PaintEngine(width: 20, height: 20)
    // A solid 4x4 red "glyph" standing in for a rasterized emoji.
    let bitmap = PaintBitmap(
      width: 4, height: 4,
      pixels: (0..<16).flatMap { _ in [255, 0, 0, 255] }.map { UInt8($0) }
    )

    engine.snapshot()
    engine.stampSticker(bitmap, centerX: 10, centerY: 10)

    // Centered on (10,10): covers 8...11 in both axes.
    XCTAssertEqual(engine.pixel(x: 8, y: 8), red)
    XCTAssertEqual(engine.pixel(x: 11, y: 11), red)
    XCTAssertEqual(engine.pixel(x: 7, y: 8), .white)
    XCTAssertEqual(engine.pixel(x: 12, y: 11), .white)

    // Stamping at the corner clips the off-paper half without crashing.
    engine.stampSticker(bitmap, centerX: 0, centerY: 0)
    XCTAssertEqual(engine.pixel(x: 0, y: 0), red)
    XCTAssertEqual(engine.pixel(x: 1, y: 1), red)
    XCTAssertEqual(engine.pixel(x: 2, y: 2), .white)

    // Transparent sticker pixels leave the paper alone.
    let hollow = PaintBitmap(width: 2, height: 2, pixels: [UInt8](repeating: 0, count: 16))
    engine.stampSticker(hollow, centerX: 16, centerY: 16)
    XCTAssertEqual(engine.pixel(x: 16, y: 16), .white)
  }

  func testExportBufferMatchesDocumentDimensions() {
    let engine = PaintEngine()
    XCTAssertEqual(engine.width, 960)
    XCTAssertEqual(engine.height, 640)
    XCTAssertEqual(engine.exportPixels().count, 960 * 640 * 4)

    let small = PaintEngine(width: 12, height: 7)
    XCTAssertEqual(small.exportPixels().count, 12 * 7 * 4)
    // The export is straight RGBA with a fully opaque alpha channel.
    XCTAssertEqual(small.exportPixels()[3], 255)
  }

  func testHexParsingMatchesWebHexToRgba() {
    XCTAssertEqual(PaintRGBA(hex: "#3949ab"), PaintRGBA(r: 0x39, g: 0x49, b: 0xab))
    XCTAssertEqual(PaintRGBA(hex: "ffffff"), .white)
    XCTAssertEqual(PaintRGBA(hex: "#000000"), PaintRGBA(r: 0, g: 0, b: 0))
  }
}
