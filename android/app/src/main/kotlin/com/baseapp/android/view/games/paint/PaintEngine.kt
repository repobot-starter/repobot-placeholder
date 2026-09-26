package com.baseapp.android.view.games.paint

import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.cos
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sin

/**
 * Pure Kotlin port of the web paint document model
 * (`web/app/src/View/Games/Paint/PaintCanvas.tsx` + `tools.ts`) so the exact
 * same document rules run on every platform and can be unit-tested on the
 * JVM. No Android or Compose imports here — rendering, touch input, and
 * bitmap/PNG conversion live in `PaintGameView`.
 *
 * The engine owns a width x height straight-RGBA pixel buffer (row-major,
 * 4 bytes per pixel) plus the undo/redo stacks, and exposes the operations
 * the web canvas performs: brush/pencil/eraser stroke segments, scanline
 * flood fill, shape stamping, sticker stamping, and clear.
 *
 * Semantics kept byte-for-byte with the web version:
 * - The paper starts white and stays fully opaque (the eraser paints white).
 * - [snapshot] is called once at the start of a user action, before any
 *   mutation; history is capped at 40 entries and any snapshot clears redo.
 * - Flood fill is the same scanline algorithm with per-channel tolerance 32.
 * - Stroke widths: brush = size, pencil = max(1.5, size / 5), eraser =
 *   size * 1.6; only the brush honors opacity.
 *
 * Intentional divergence: the web strokes through Canvas2D, which
 * anti-aliases edges; this engine rasterizes hard-edged round-capped
 * segments (a pixel paints when its center falls inside the stroke capsule).
 */
class PaintEngine(
    val width: Int = CANVAS_WIDTH,
    val height: Int = CANVAS_HEIGHT,
) {
    /**
     * Stroke-capable tools. Width/alpha rules per tool mirror the web
     * `strokeSegment`.
     */
    enum class StrokeTool { BRUSH, PENCIL, ERASER }

    /** Shapes the shape tool can stamp — the web `ShapeKind` union. */
    enum class ShapeKind { LINE, RECT, ELLIPSE }

    /**
     * A straight-alpha RGBA color, the same 4-tuple the web `hexToRgba`
     * produces for flood fill. Channels are 0..255.
     */
    data class Rgba(val r: Int, val g: Int, val b: Int, val a: Int = 255) {
        companion object {
            val WHITE = Rgba(255, 255, 255)

            /** Parse `#rrggbb` exactly like the web `hexToRgba` (alpha 255). */
            fun fromHex(hex: String): Rgba {
                val value = hex.removePrefix("#")
                fun channel(offset: Int): Int =
                    value.drop(offset).take(2).toIntOrNull(radix = 16) ?: 0
                return Rgba(channel(0), channel(2), channel(4))
            }
        }
    }

    /**
     * A small straight-RGBA raster used to stamp stickers. The engine stays
     * free of text APIs: the view rasterizes the emoji glyph with platform
     * text rendering and hands the pixels in (4 bytes per pixel, values
     * 0..255 stored in an IntArray for JVM-test convenience).
     */
    class StickerBitmap(val width: Int, val height: Int, val pixels: IntArray)

    /**
     * Row-major straight-RGBA pixel buffer (`width * height * 4` bytes,
     * each entry 0..255). This is the PNG-exportable document: alpha is
     * always 255. Treat as read-only outside the engine.
     */
    var pixels: IntArray = IntArray(width * height * 4) { 255 }
        private set

    /**
     * Bumped on every visible mutation so renderers can cache the converted
     * platform bitmap and regenerate only when the document changed.
     */
    var revision: Int = 0
        private set

    private val undoStack = ArrayDeque<IntArray>()
    private val redoStack = ArrayDeque<IntArray>()

    val canUndo: Boolean get() = undoStack.isNotEmpty()
    val canRedo: Boolean get() = redoStack.isNotEmpty()

    /** Number of undo snapshots currently held (capped at [MAX_HISTORY]). */
    val undoDepth: Int get() = undoStack.size

    // ---- History -----------------------------------------------------------

    /**
     * Push the current buffer onto the undo stack (call once at the start of
     * a user action, before mutating — the web snapshots on pointer down).
     * Caps history at [MAX_HISTORY] and clears redo, exactly like the web.
     */
    fun snapshot() {
        undoStack.add(pixels.copyOf())
        if (undoStack.size > MAX_HISTORY) {
            undoStack.removeAt(0)
        }
        redoStack.clear()
    }

    /** Restore the previous snapshot, moving the current buffer to redo. */
    fun undo() {
        val previous = undoStack.removeLastOrNull() ?: return
        redoStack.add(pixels)
        pixels = previous
        revision += 1
    }

    /** Re-apply an undone buffer, moving the current one back to undo. */
    fun redo() {
        val next = redoStack.removeLastOrNull() ?: return
        undoStack.add(pixels)
        pixels = next
        revision += 1
    }

    /**
     * "New painting": snapshot then repaint the paper white (web `clear()`),
     * so the wipe itself is undoable.
     */
    fun clear() {
        snapshot()
        pixels = IntArray(width * height * 4) { 255 }
        revision += 1
    }

    // ---- Strokes -----------------------------------------------------------

    /**
     * Stamp one round-capped segment of a drag stroke. A zero-length segment
     * paints a dot, which is how a plain tap draws (the web nudges the end
     * point by 0.01px for the same effect).
     */
    fun strokeSegment(
        tool: StrokeTool,
        x0: Float,
        y0: Float,
        x1: Float,
        y1: Float,
        color: Rgba,
        size: Float,
        opacity: Float,
    ) {
        val (strokeColor, alpha) = when (tool) {
            StrokeTool.BRUSH -> color to opacity
            StrokeTool.PENCIL -> color to 1f
            StrokeTool.ERASER -> Rgba.WHITE to 1f
        }
        fillCapsule(x0, y0, x1, y1, strokeWidth(tool, size), strokeColor, alpha)
        revision += 1
    }

    // ---- Flood fill --------------------------------------------------------

    /**
     * Classic scanline flood fill with a per-channel tolerance so
     * anti-aliased edges don't leave halos — a direct port of the web
     * `floodFill` in `tools.ts`, including the early-outs (out-of-bounds
     * start, or the target already being exactly the fill color).
     */
    fun floodFill(x: Float, y: Float, fill: Rgba, tolerance: Int = FILL_TOLERANCE) {
        val x0 = floor(x).toInt()
        val y0 = floor(y).toInt()
        if (x0 < 0 || y0 < 0 || x0 >= width || y0 >= height) {
            return
        }

        val startIdx = (y0 * width + x0) * 4
        val tr = pixels[startIdx]
        val tg = pixels[startIdx + 1]
        val tb = pixels[startIdx + 2]
        val ta = pixels[startIdx + 3]
        if (tr == fill.r && tg == fill.g && tb == fill.b && ta == fill.a) {
            return
        }

        fun matches(idx: Int): Boolean =
            abs(pixels[idx] - tr) <= tolerance &&
                abs(pixels[idx + 1] - tg) <= tolerance &&
                abs(pixels[idx + 2] - tb) <= tolerance &&
                abs(pixels[idx + 3] - ta) <= tolerance

        fun paint(idx: Int) {
            pixels[idx] = fill.r
            pixels[idx + 1] = fill.g
            pixels[idx + 2] = fill.b
            pixels[idx + 3] = fill.a
        }

        val stack = ArrayDeque<Int>()
        stack.add(y0 * width + x0)
        while (stack.isNotEmpty()) {
            val cell = stack.removeAt(stack.lastIndex)
            val cy = cell / width
            val cx = cell % width
            var west = cx
            var east = cx
            while (west > 0 && matches((cy * width + west - 1) * 4)) {
                west -= 1
            }
            while (east < width - 1 && matches((cy * width + east + 1) * 4)) {
                east += 1
            }
            for (i in west..east) {
                val idx = (cy * width + i) * 4
                if (!matches(idx)) {
                    continue
                }
                paint(idx)
                if (cy > 0 && matches(((cy - 1) * width + i) * 4)) {
                    stack.add((cy - 1) * width + i)
                }
                if (cy < height - 1 && matches(((cy + 1) * width + i) * 4)) {
                    stack.add((cy + 1) * width + i)
                }
            }
        }
        revision += 1
    }

    // ---- Shapes ------------------------------------------------------------

    /**
     * Stroke a line, rectangle, or ellipse between two drag corner points —
     * the web `drawShape`, always fully opaque with round caps/joins. Rects
     * stroke their four edges; ellipses stroke a dense polyline around the
     * perimeter.
     */
    fun stampShape(
        kind: ShapeKind,
        x0: Float,
        y0: Float,
        x1: Float,
        y1: Float,
        color: Rgba,
        lineWidth: Float,
    ) {
        when (kind) {
            ShapeKind.LINE -> fillCapsule(x0, y0, x1, y1, lineWidth, color, 1f)
            ShapeKind.RECT -> {
                val minX = min(x0, x1)
                val maxX = max(x0, x1)
                val minY = min(y0, y1)
                val maxY = max(y0, y1)
                fillCapsule(minX, minY, maxX, minY, lineWidth, color, 1f)
                fillCapsule(maxX, minY, maxX, maxY, lineWidth, color, 1f)
                fillCapsule(maxX, maxY, minX, maxY, lineWidth, color, 1f)
                fillCapsule(minX, maxY, minX, minY, lineWidth, color, 1f)
            }
            ShapeKind.ELLIPSE -> {
                val cx = (x0 + x1) / 2f
                val cy = (y0 + y1) / 2f
                val rx = abs(x1 - x0) / 2f
                val ry = abs(y1 - y0) / 2f
                // Segment count grows with the radii so big ellipses stay smooth.
                val steps = max(24, ceil((rx + ry) / 2f).toInt())
                var previousX = cx + rx
                var previousY = cy
                for (i in 1..steps) {
                    val angle = i.toFloat() / steps * 2f * Math.PI.toFloat()
                    val nextX = cx + cos(angle) * rx
                    val nextY = cy + sin(angle) * ry
                    fillCapsule(previousX, previousY, nextX, nextY, lineWidth, color, 1f)
                    previousX = nextX
                    previousY = nextY
                }
            }
        }
        revision += 1
    }

    // ---- Stickers ----------------------------------------------------------

    /**
     * Composite a pre-rasterized sticker glyph, centered on the tap point,
     * straight-alpha source-over like the web `fillText` stamp. Parts
     * hanging off the paper are clipped.
     */
    fun stampSticker(bitmap: StickerBitmap, centerX: Float, centerY: Float) {
        val left = (centerX - bitmap.width / 2f).roundToInt()
        val top = (centerY - bitmap.height / 2f).roundToInt()
        for (sy in 0 until bitmap.height) {
            val dy = top + sy
            if (dy < 0 || dy >= height) {
                continue
            }
            for (sx in 0 until bitmap.width) {
                val dx = left + sx
                if (dx < 0 || dx >= width) {
                    continue
                }
                val s = (sy * bitmap.width + sx) * 4
                val sourceAlpha = bitmap.pixels[s + 3] / 255f
                if (sourceAlpha <= 0f) {
                    continue
                }
                blend(
                    index = (dy * width + dx) * 4,
                    r = bitmap.pixels[s],
                    g = bitmap.pixels[s + 1],
                    b = bitmap.pixels[s + 2],
                    alpha = sourceAlpha,
                )
            }
        }
        revision += 1
    }

    // ---- Reading the document ----------------------------------------------

    /** The color at a pixel (for tests and color sampling). Must be in bounds. */
    fun pixel(x: Int, y: Int): Rgba {
        require(x in 0 until width && y in 0 until height) { "pixel out of bounds" }
        val idx = (y * width + x) * 4
        return Rgba(pixels[idx], pixels[idx + 1], pixels[idx + 2], pixels[idx + 3])
    }

    /**
     * A copy of the raw RGBA buffer, ready to wrap in a platform bitmap for
     * PNG export (the web's `canvas.toDataURL("image/png")` equivalent).
     */
    fun exportPixels(): IntArray = pixels.copyOf()

    // ---- Rasterization -----------------------------------------------------

    /**
     * Paint every pixel whose center lies within `strokeWidth / 2` of the
     * segment — a hard-edged capsule, i.e. a Canvas2D stroke with round caps.
     */
    private fun fillCapsule(
        x0: Float,
        y0: Float,
        x1: Float,
        y1: Float,
        strokeWidth: Float,
        color: Rgba,
        alpha: Float,
    ) {
        val radius = strokeWidth / 2f
        if (radius <= 0f || alpha <= 0f) {
            return
        }
        val minPX = max(0, floor(min(x0, x1) - radius).toInt())
        val maxPX = min(width - 1, ceil(max(x0, x1) + radius).toInt())
        val minPY = max(0, floor(min(y0, y1) - radius).toInt())
        val maxPY = min(height - 1, ceil(max(y0, y1) + radius).toInt())
        if (minPX > maxPX || minPY > maxPY) {
            return
        }

        val dx = x1 - x0
        val dy = y1 - y0
        val lengthSquared = dx * dx + dy * dy
        val radiusSquared = radius * radius

        for (py in minPY..maxPY) {
            val centerY = py + 0.5f
            for (px in minPX..maxPX) {
                val centerX = px + 0.5f
                // Distance from the pixel center to the segment.
                val t = if (lengthSquared > 0f) {
                    (((centerX - x0) * dx + (centerY - y0) * dy) / lengthSquared)
                        .coerceIn(0f, 1f)
                } else {
                    0f
                }
                val offsetX = x0 + t * dx - centerX
                val offsetY = y0 + t * dy - centerY
                if (offsetX * offsetX + offsetY * offsetY <= radiusSquared) {
                    blend((py * width + px) * 4, color.r, color.g, color.b, alpha)
                }
            }
        }
    }

    /**
     * Straight-alpha source-over onto the (always opaque) paper:
     * `out = src * alpha + dst * (1 - alpha)`, matching Canvas2D with
     * `globalAlpha` on an opaque backing store.
     */
    private fun blend(index: Int, r: Int, g: Int, b: Int, alpha: Float) {
        if (alpha >= 1f) {
            pixels[index] = r
            pixels[index + 1] = g
            pixels[index + 2] = b
            pixels[index + 3] = 255
            return
        }
        val inverse = 1f - alpha
        pixels[index] = (r * alpha + pixels[index] * inverse).roundToInt()
        pixels[index + 1] = (g * alpha + pixels[index + 1] * inverse).roundToInt()
        pixels[index + 2] = (b * alpha + pixels[index + 2] * inverse).roundToInt()
        pixels[index + 3] = 255
    }

    companion object {
        // Document geometry and rules — must stay in sync with the web constants.
        const val CANVAS_WIDTH = 960
        const val CANVAS_HEIGHT = 640

        /**
         * Web `MAX_HISTORY`: the undo stack keeps at most this many
         * snapshots, dropping the oldest first.
         */
        const val MAX_HISTORY = 40

        /**
         * Web flood-fill default tolerance (per channel), so anti-aliased
         * edges don't leave halos.
         */
        const val FILL_TOLERANCE = 32

        /** Web sticker stamping draws the emoji at `size * 3` px font. */
        const val STICKER_FONT_SCALE = 3f

        /** Stroke width per tool — the web `strokeSegment` lineWidth table. */
        fun strokeWidth(tool: StrokeTool, size: Float): Float = when (tool) {
            StrokeTool.BRUSH -> size
            StrokeTool.PENCIL -> max(1.5f, size / 5f)
            StrokeTool.ERASER -> size * 1.6f
        }
    }
}
