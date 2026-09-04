package com.baseapp.android

import com.baseapp.android.view.games.paint.PaintEngine
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Exercises the pure paint document model against the web PaintCanvas.tsx /
 * tools.ts rules it mirrors: brush stamping, tolerance flood fill bounded by
 * borders, undo/redo snapshot semantics with the 40-entry cap, shape and
 * sticker placement, and export buffer dimensions. Small documents keep the
 * pixel assertions readable.
 */
class PaintEngineTest {
    private val white = PaintEngine.Rgba.WHITE
    private val red = PaintEngine.Rgba(255, 0, 0)
    private val blue = PaintEngine.Rgba(0, 0, 255)

    @Test
    fun documentStartsAsOpaqueWhitePaper() {
        val engine = PaintEngine(width = 8, height = 8)

        for (y in 0 until 8) {
            for (x in 0 until 8) {
                assertEquals(white, engine.pixel(x, y))
            }
        }
        assertFalse(engine.canUndo)
        assertFalse(engine.canRedo)
    }

    @Test
    fun brushStampWritesExpectedPixels() {
        val engine = PaintEngine(width = 20, height = 20)

        // A zero-length brush segment is a dot (the web taps stroke a 0.01px
        // segment): size 6 covers pixels within 3px of the center.
        engine.strokeSegment(
            PaintEngine.StrokeTool.BRUSH, 10f, 10f, 10f, 10f, red, size = 6f, opacity = 1f,
        )

        assertEquals(red, engine.pixel(10, 10))
        assertEquals(red, engine.pixel(8, 10))
        assertEquals(red, engine.pixel(10, 12))
        // Outside the 3px radius the paper is untouched.
        assertEquals(white, engine.pixel(14, 10))
        assertEquals(white, engine.pixel(0, 0))
    }

    @Test
    fun brushOpacityBlendsWithThePaper() {
        val engine = PaintEngine(width = 10, height = 10)

        // 50% black over white must land mid-gray (straight source-over).
        engine.strokeSegment(
            PaintEngine.StrokeTool.BRUSH, 5f, 5f, 5f, 5f,
            PaintEngine.Rgba(0, 0, 0), size = 4f, opacity = 0.5f,
        )

        val blended = engine.pixel(5, 5)
        assertEquals(127.5f, blended.r.toFloat(), 1f)
        assertEquals(255, blended.a)
    }

    @Test
    fun eraserPaintsWhiteAtWiderWidth() {
        val engine = PaintEngine(width = 30, height = 30)
        engine.floodFill(0f, 0f, blue) // paint everything blue

        // Eraser width is size * 1.6 (web strokeSegment): size 10 -> radius 8.
        engine.strokeSegment(
            PaintEngine.StrokeTool.ERASER, 15f, 15f, 15f, 15f, red, size = 10f, opacity = 0.2f,
        )

        // The passed color and opacity are ignored: the eraser is opaque white.
        assertEquals(white, engine.pixel(15, 15))
        assertEquals(white, engine.pixel(15, 21)) // inside the 8px radius
        assertEquals(blue, engine.pixel(15, 25)) // outside it
    }

    @Test
    fun pencilUsesThinAlwaysOpaqueStroke() {
        // Web pencil width: max(1.5, size / 5) -> size 30 gives 6.
        assertEquals(6f, PaintEngine.strokeWidth(PaintEngine.StrokeTool.PENCIL, 30f), 0.001f)
        assertEquals(1.5f, PaintEngine.strokeWidth(PaintEngine.StrokeTool.PENCIL, 2f), 0.001f)

        val engine = PaintEngine(width = 20, height = 20)
        engine.strokeSegment(
            PaintEngine.StrokeTool.PENCIL, 10f, 10f, 10f, 10f, red, size = 30f, opacity = 0.1f,
        )
        // Pencil ignores opacity (web forces globalAlpha = 1).
        assertEquals(red, engine.pixel(10, 10))
    }

    @Test
    fun floodFillFillsBoundedRegionAndStopsAtBorders() {
        val engine = PaintEngine(width = 16, height = 16)

        // A 1px-wide blue box from (4,4) to (11,11), drawn as exact pixels
        // so the boundary is airtight.
        for (i in 4..11) {
            paintPixel(engine, i, 4, blue)
            paintPixel(engine, i, 11, blue)
            paintPixel(engine, 4, i, blue)
            paintPixel(engine, 11, i, blue)
        }

        engine.floodFill(8f, 8f, red)

        // Inside the box: filled.
        assertEquals(red, engine.pixel(8, 8))
        assertEquals(red, engine.pixel(5, 5))
        assertEquals(red, engine.pixel(10, 10))
        // The border itself is far outside the 32-per-channel tolerance of
        // the white target, so it survives.
        assertEquals(blue, engine.pixel(4, 8))
        assertEquals(blue, engine.pixel(8, 11))
        // Outside the box: untouched.
        assertEquals(white, engine.pixel(0, 0))
        assertEquals(white, engine.pixel(13, 8))
    }

    @Test
    fun floodFillToleranceAbsorbsNearTargetPixels() {
        val engine = PaintEngine(width = 4, height = 1)

        // An off-white pixel within the default 32 tolerance gets filled; a
        // darker one beyond it does not.
        paintPixel(engine, 1, 0, PaintEngine.Rgba(240, 240, 240))
        paintPixel(engine, 2, 0, PaintEngine.Rgba(180, 180, 180))

        engine.floodFill(0f, 0f, red)

        assertEquals(red, engine.pixel(0, 0))
        assertEquals(red, engine.pixel(1, 0))
        assertEquals(PaintEngine.Rgba(180, 180, 180), engine.pixel(2, 0))
        assertEquals(white, engine.pixel(3, 0))
    }

    @Test
    fun floodFillIgnoresOutOfBoundsAndNoOpTargets() {
        val engine = PaintEngine(width = 4, height = 4)

        engine.floodFill(-1f, 2f, red)
        engine.floodFill(2f, 99f, red)
        // Filling white with white is the web's exact-match early-out.
        engine.floodFill(2f, 2f, white)

        assertEquals(white, engine.pixel(2, 2))
        assertEquals(0, engine.revision)
    }

    @Test
    fun undoRestoresPriorBufferAndRedoReappliesIt() {
        val engine = PaintEngine(width = 8, height = 8)

        engine.snapshot() // pointer down
        paintPixel(engine, 4, 4, red)
        assertTrue(engine.canUndo)

        engine.undo()
        assertEquals(white, engine.pixel(4, 4))
        assertFalse(engine.canUndo)
        assertTrue(engine.canRedo)

        engine.redo()
        assertEquals(red, engine.pixel(4, 4))

        // A fresh snapshot clears redo, like the web.
        engine.undo()
        engine.snapshot()
        assertFalse(engine.canRedo)
    }

    @Test
    fun undoHistoryIsCappedAtWebMaxHistory() {
        val engine = PaintEngine(width = 4, height = 4)

        repeat(PaintEngine.MAX_HISTORY + 10) {
            engine.snapshot()
        }

        assertEquals(PaintEngine.MAX_HISTORY, engine.undoDepth)
    }

    @Test
    fun clearIsUndoable() {
        val engine = PaintEngine(width = 8, height = 8)
        engine.snapshot()
        paintPixel(engine, 4, 4, red)

        engine.clear()
        assertEquals(white, engine.pixel(4, 4))

        engine.undo()
        assertEquals(red, engine.pixel(4, 4))
    }

    @Test
    fun shapeStampStrokesOutlineNotFill() {
        val engine = PaintEngine(width = 40, height = 40)

        engine.stampShape(
            PaintEngine.ShapeKind.RECT, 10f, 10f, 30f, 30f, blue, lineWidth = 2f,
        )

        // Edges painted, interior and exterior untouched.
        assertEquals(blue, engine.pixel(20, 10))
        assertEquals(blue, engine.pixel(10, 20))
        assertEquals(white, engine.pixel(20, 20))
        assertEquals(white, engine.pixel(2, 2))

        // Ellipse: perimeter pixels painted, center clear.
        val oval = PaintEngine(width = 40, height = 40)
        oval.stampShape(
            PaintEngine.ShapeKind.ELLIPSE, 10f, 10f, 30f, 30f, blue, lineWidth = 2f,
        )
        assertEquals(blue, oval.pixel(20, 10)) // top of the ellipse
        assertEquals(blue, oval.pixel(30, 20)) // right of the ellipse
        assertEquals(white, oval.pixel(20, 20))
    }

    @Test
    fun shapeStampClipsSafelyOutsideTheDocument() {
        val engine = PaintEngine(width = 20, height = 20)

        // Corners far outside the paper must not crash and must paint the
        // in-bounds part of the outline.
        engine.stampShape(
            PaintEngine.ShapeKind.LINE, -50f, 10f, 70f, 10f, red, lineWidth = 4f,
        )

        assertEquals(red, engine.pixel(0, 10))
        assertEquals(red, engine.pixel(19, 10))
        assertEquals(white, engine.pixel(10, 0))
    }

    @Test
    fun stickerPlacementIsCenteredAndClipped() {
        val engine = PaintEngine(width = 20, height = 20)
        // A solid 4x4 red "glyph" standing in for a rasterized emoji.
        val solid = PaintEngine.StickerBitmap(
            width = 4,
            height = 4,
            pixels = IntArray(4 * 4 * 4) { i ->
                when (i % 4) {
                    0 -> 255
                    3 -> 255
                    else -> 0
                }
            },
        )

        engine.snapshot()
        engine.stampSticker(solid, centerX = 10f, centerY = 10f)

        // Centered on (10,10): covers 8..11 in both axes.
        assertEquals(red, engine.pixel(8, 8))
        assertEquals(red, engine.pixel(11, 11))
        assertEquals(white, engine.pixel(7, 8))
        assertEquals(white, engine.pixel(12, 11))

        // Stamping at the corner clips the off-paper half without crashing.
        engine.stampSticker(solid, centerX = 0f, centerY = 0f)
        assertEquals(red, engine.pixel(0, 0))
        assertEquals(red, engine.pixel(1, 1))
        assertEquals(white, engine.pixel(2, 2))

        // Transparent sticker pixels leave the paper alone.
        val hollow = PaintEngine.StickerBitmap(2, 2, IntArray(2 * 2 * 4))
        engine.stampSticker(hollow, centerX = 16f, centerY = 16f)
        assertEquals(white, engine.pixel(16, 16))
    }

    @Test
    fun exportBufferMatchesDocumentDimensions() {
        val engine = PaintEngine()
        assertEquals(960, engine.width)
        assertEquals(640, engine.height)
        assertEquals(960 * 640 * 4, engine.exportPixels().size)

        val small = PaintEngine(width = 12, height = 7)
        assertEquals(12 * 7 * 4, small.exportPixels().size)
        // The export is straight RGBA with a fully opaque alpha channel.
        assertEquals(255, small.exportPixels()[3])
    }

    @Test
    fun hexParsingMatchesWebHexToRgba() {
        assertEquals(PaintEngine.Rgba(0x39, 0x49, 0xab), PaintEngine.Rgba.fromHex("#3949ab"))
        assertEquals(white, PaintEngine.Rgba.fromHex("ffffff"))
        assertEquals(PaintEngine.Rgba(0, 0, 0), PaintEngine.Rgba.fromHex("#000000"))
    }

    /** Paint exactly one pixel with a size-1 brush dot at its center. */
    private fun paintPixel(engine: PaintEngine, x: Int, y: Int, color: PaintEngine.Rgba) {
        engine.strokeSegment(
            PaintEngine.StrokeTool.BRUSH,
            x + 0.5f, y + 0.5f, x + 0.5f, y + 0.5f,
            color, size = 1f, opacity = 1f,
        )
    }
}
