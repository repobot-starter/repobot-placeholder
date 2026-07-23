package com.baseapp.android.view.games.paint

import android.graphics.Bitmap
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.baseapp.android.view.theme.LocalUiTheme
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * The retro desktop palette from the web `PaintPage.styles.css.ts`. The
 * paint window keeps this identity on both light and dark app themes, like
 * the Pong field keeps its arcade look; the surrounding chrome uses theme
 * tokens.
 */
private object PaintColors {
    val frame = Color(0xFFEFECE4)
    val frameDark = Color(0xFFD8D4C8)
    val ink = Color(0xFF1D1A26)
    val ridge = Color(0xFF8F8AA0)
    val accent = Color(0xFFC7BFE8)
    val paper = Color(0xFFFFFDF7)
}

/** The six tools from the web `TOOLS` array (same glyphs and labels). */
private enum class PaintTool(val glyph: String, val label: String) {
    BRUSH("🖌️", "Brush"),
    PENCIL("✏️", "Pencil"),
    ERASER("🩹", "Eraser"),
    FILL("🪣", "Fill"),
    SHAPE("⬜", "Shape"),
    STICKER("⭐", "Sticker"),
}

/** Web `STICKERS`, `SWATCHES`, and `TIPS` arrays, verbatim. */
private val STICKERS = listOf("⭐", "❤️", "⚡", "☁️", "🌸", "🤖", "🌈", "🎈")

private val SWATCHES = listOf(
    listOf(
        "#d32f2f", "#e64a19", "#f9a825", "#7cb342", "#00897b", "#1976d2",
        "#3949ab", "#8e24aa", "#d81b60", "#6d4c41", "#546e7a", "#e0e0e0",
    ),
    listOf(
        "#ef9a9a", "#ffcc80", "#fff59d", "#c5e1a5", "#80cbc4", "#90caf9",
        "#9fa8da", "#ce93d8", "#f48fb1", "#bcaaa4", "#b0bec5", "#000000",
    ),
)

private val TIPS = listOf(
    "Tip: Pick the Fill bucket to flood an area with color",
    "Tip: Stickers stamp where you tap — resize them with the Size slider",
    "Tip: Undo has your back — experiment freely!",
    "Tip: Drag with the Shape tool to preview before it lands",
)

/** Compose color for a `#rrggbb` swatch string. */
private fun swatchColor(hex: String): Color {
    val value = hex.removePrefix("#").toLongOrNull(radix = 16) ?: 0L
    return Color(0xFF000000L or value)
}

/**
 * Home surface for the `paint` pack — the native twin of the web PaintPage.
 * Rendering and touch input only: the document model (pixels, tools, flood
 * fill, undo) lives in [PaintEngine] so it stays JVM-testable and in
 * lockstep with the web app. No network, no stores.
 *
 * PNG export is intentionally absent on Android: sharing a file through an
 * Intent chooser requires a FileProvider, and this app's AndroidManifest
 * does not configure one. Adding one would mean touching the manifest,
 * which native game packs must not do.
 */
@Composable
fun PaintGameView() {
    val theme = LocalUiTheme.current
    val session = remember { PaintSession() }
    var tool by remember { mutableStateOf(PaintTool.BRUSH) }
    var shapeKind by remember { mutableStateOf(PaintEngine.ShapeKind.LINE) }
    var colorHex by remember { mutableStateOf("#3949ab") }
    var brushSize by remember { mutableFloatStateOf(14f) }
    var brushOpacity by remember { mutableFloatStateOf(1f) }
    var sticker by remember { mutableStateOf("⭐") }
    // Bumped after every engine mutation; reading it in the canvas and the
    // toolbar is what drives redraw and undo/redo enablement.
    var documentRevision by remember { mutableIntStateOf(0) }
    var shapePreview by remember { mutableStateOf<ShapePreview?>(null) }
    var tipIndex by remember { mutableIntStateOf(0) }
    var isConfirmingNew by remember { mutableStateOf(false) }

    // The gesture handler reads tool settings from the session so the
    // pointerInput closure never captures stale compose state (the web
    // keeps a propsRef for exactly the same reason).
    session.tool = tool
    session.shapeKind = shapeKind
    session.color = PaintEngine.Rgba.fromHex(colorHex)
    session.size = brushSize
    session.opacity = brushOpacity
    session.sticker = sticker
    session.onDocumentChanged = { documentRevision += 1 }
    session.onShapePreviewChanged = { shapePreview = it }
    session.onStrokeEnd = { tipIndex = (tipIndex + 1) % TIPS.size }

    if (isConfirmingNew) {
        AlertDialog(
            onDismissRequest = { isConfirmingNew = false },
            title = { Text("Start a new painting?") },
            text = { Text("The current canvas will be cleared.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        session.engine.clear()
                        documentRevision += 1
                        isConfirmingNew = false
                    },
                ) { Text("Clear Canvas") }
            },
            dismissButton = {
                TextButton(onClick = { isConfirmingNew = false }) { Text("Cancel") }
            },
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(theme.colors.appBg)
            .statusBarsPadding()
            .padding(theme.spacing.md)
            .verticalScroll(rememberScrollState()),
    ) {
        Column(
            modifier = Modifier
                .clip(RoundedCornerShape(theme.radius.md))
                .border(2.dp, PaintColors.ink, RoundedCornerShape(theme.radius.md))
                .background(PaintColors.frame),
        ) {
            TitleBar()
            InkDivider()

            // Toolbar: New / Undo / Redo, plus the shape picker while the
            // shape tool is active (the web top toolbar, minus Save — see
            // the composable doc comment).
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(PaintColors.frameDark)
                    .horizontalScroll(rememberScrollState())
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                ChunkyButton(label = "New", onClick = { isConfirmingNew = true })
                ToolbarDivider()
                ChunkyButton(
                    label = "Undo",
                    // documentRevision is read throughout this composable, so
                    // engine.canUndo/canRedo re-evaluate after every mutation.
                    enabled = session.engine.canUndo,
                    onClick = {
                        session.engine.undo()
                        documentRevision += 1
                    },
                )
                ChunkyButton(
                    label = "Redo",
                    enabled = session.engine.canRedo,
                    onClick = {
                        session.engine.redo()
                        documentRevision += 1
                    },
                )
                if (tool == PaintTool.SHAPE) {
                    ToolbarDivider()
                    ShapeButton("Line", PaintEngine.ShapeKind.LINE, shapeKind) { shapeKind = it }
                    ShapeButton("Rect", PaintEngine.ShapeKind.RECT, shapeKind) { shapeKind = it }
                    ShapeButton("Oval", PaintEngine.ShapeKind.ELLIPSE, shapeKind) { shapeKind = it }
                }
            }
            InkDivider()

            // Tool strip: the web stacks tools beside the canvas; a
            // horizontal strip above the paper fits phones better.
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(PaintColors.frame)
                    .horizontalScroll(rememberScrollState())
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(theme.spacing.xs),
            ) {
                PaintTool.entries.forEach { entry ->
                    ToolButton(entry = entry, isActive = tool == entry) { tool = entry }
                }
            }
            InkDivider()

            PaperCanvas(
                session = session,
                documentRevision = documentRevision,
                shapePreview = shapePreview,
                previewColor = swatchColor(colorHex),
                previewShapeKind = shapeKind,
                previewStrokeWidth = brushSize,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(theme.spacing.md),
            )
            InkDivider()

            // Brush settings + sticker tray (the web right-hand panel).
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(PaintColors.frameDark)
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(theme.spacing.xs),
            ) {
                SliderRow(
                    label = "Size",
                    value = brushSize,
                    range = 2f..60f,
                    display = "${brushSize.roundToInt()}",
                    onChange = { brushSize = it },
                )
                SliderRow(
                    label = "Opacity",
                    value = brushOpacity,
                    range = 0.1f..1f,
                    display = "${(brushOpacity * 100).roundToInt()}%",
                    onChange = { brushOpacity = it },
                )
                Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.xs)) {
                    STICKERS.forEach { value ->
                        StickerButton(
                            glyph = value,
                            isActive = tool == PaintTool.STICKER && sticker == value,
                            onClick = {
                                sticker = value
                                tool = PaintTool.STICKER
                            },
                        )
                    }
                }
            }
            InkDivider()

            // Current-color chip plus the two swatch rows (bottom palette).
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(PaintColors.frame)
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(theme.spacing.md),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    modifier = Modifier
                        .width(38.dp)
                        .height(38.dp)
                        .clip(RoundedCornerShape(7.dp))
                        .background(swatchColor(colorHex))
                        .border(2.dp, PaintColors.ink, RoundedCornerShape(7.dp)),
                )
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    SWATCHES.forEach { row ->
                        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            row.forEach { value ->
                                SwatchButton(
                                    hex = value,
                                    isActive = colorHex == value,
                                    onClick = { colorHex = value },
                                )
                            }
                        }
                    }
                }
            }
            InkDivider()

            // Status bar with the rotating tips, like the web.
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(PaintColors.frameDark)
                    .padding(horizontal = 12.dp, vertical = 5.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text(
                    text = TIPS[tipIndex],
                    color = PaintColors.ink,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    modifier = Modifier.weight(1f, fill = false),
                )
                Text(
                    text = "${PaintEngine.CANVAS_WIDTH} × ${PaintEngine.CANVAS_HEIGHT}",
                    color = PaintColors.ink,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(start = 12.dp),
                )
            }
        }
    }
}

/** Shape-drag preview state (document coordinates). */
private data class ShapePreview(
    val startX: Float,
    val startY: Float,
    val currentX: Float,
    val currentY: Float,
)

/**
 * Document state that must survive recomposition without triggering it: the
 * engine, the tool settings mirrored from compose state (the web propsRef),
 * in-flight gesture bookkeeping, and render caches. Compose invalidation is
 * driven explicitly through the view's documentRevision counter.
 */
private class PaintSession {
    val engine = PaintEngine()

    // Mirrored tool settings, refreshed on every recomposition.
    var tool: PaintTool = PaintTool.BRUSH
    var shapeKind: PaintEngine.ShapeKind = PaintEngine.ShapeKind.LINE
    var color: PaintEngine.Rgba = PaintEngine.Rgba.fromHex("#3949ab")
    var size: Float = 14f
    var opacity: Float = 1f
    var sticker: String = "⭐"
    var onDocumentChanged: () -> Unit = {}
    var onShapePreviewChanged: (ShapePreview?) -> Unit = {}
    var onStrokeEnd: () -> Unit = {}

    // Gesture bookkeeping (the web CanvasState).
    private var tapConsumed = false
    private var shapeStartX = 0f
    private var shapeStartY = 0f
    private var lastX = 0f
    private var lastY = 0f

    private var cachedImage: ImageBitmap? = null
    private var cachedRevision = -1
    private val stickerCache = mutableMapOf<String, PaintEngine.StickerBitmap>()

    /** The engine's stroke-tool twin of the UI tool (stroke tools only). */
    private val strokeTool: PaintEngine.StrokeTool
        get() = when (tool) {
            PaintTool.PENCIL -> PaintEngine.StrokeTool.PENCIL
            PaintTool.ERASER -> PaintEngine.StrokeTool.ERASER
            else -> PaintEngine.StrokeTool.BRUSH
        }

    /**
     * Pointer down, mirroring the web `handlePointerDown`: every action
     * snapshots first; fill and sticker fire once and consume the gesture;
     * strokes paint a dot; shapes start a preview.
     */
    fun pointerDown(x: Float, y: Float) {
        engine.snapshot()
        tapConsumed = false
        when (tool) {
            PaintTool.FILL -> {
                engine.floodFill(x, y, color)
                onStrokeEnd()
                tapConsumed = true
            }
            PaintTool.STICKER -> {
                stickerBitmap(sticker, size * PaintEngine.STICKER_FONT_SCALE)?.let {
                    engine.stampSticker(it, x, y)
                }
                onStrokeEnd()
                tapConsumed = true
            }
            PaintTool.SHAPE -> {
                shapeStartX = x
                shapeStartY = y
                onShapePreviewChanged(ShapePreview(x, y, x, y))
            }
            else -> {
                // Dot for a simple tap (web strokes a 0.01px segment).
                engine.strokeSegment(strokeTool, x, y, x, y, color, size, opacity)
            }
        }
        lastX = x
        lastY = y
        onDocumentChanged()
    }

    /** Pointer move: extend the stroke or update the shape preview. */
    fun pointerMove(x: Float, y: Float) {
        if (tapConsumed) {
            return
        }
        if (tool == PaintTool.SHAPE) {
            onShapePreviewChanged(ShapePreview(shapeStartX, shapeStartY, x, y))
        } else {
            engine.strokeSegment(strokeTool, lastX, lastY, x, y, color, size, opacity)
            onDocumentChanged()
        }
        lastX = x
        lastY = y
    }

    /** Pointer up: commit the previewed shape (web `handlePointerUp`). */
    fun pointerUp() {
        if (tapConsumed) {
            tapConsumed = false
            return
        }
        if (tool == PaintTool.SHAPE) {
            engine.stampShape(
                shapeKind, shapeStartX, shapeStartY, lastX, lastY, color, size,
            )
            onShapePreviewChanged(null)
            onDocumentChanged()
        }
        onStrokeEnd()
    }

    /**
     * The engine buffer as an ImageBitmap, re-encoded only when the
     * document actually changed since the last frame.
     */
    fun paperImage(): ImageBitmap {
        val current = cachedImage
        if (cachedRevision == engine.revision && current != null) {
            return current
        }
        val pixels = engine.pixels
        val argb = IntArray(engine.width * engine.height)
        for (i in argb.indices) {
            val o = i * 4
            argb[i] = (pixels[o + 3] shl 24) or
                (pixels[o] shl 16) or
                (pixels[o + 1] shl 8) or
                pixels[o + 2]
        }
        val bitmap = Bitmap.createBitmap(engine.width, engine.height, Bitmap.Config.ARGB_8888)
        bitmap.setPixels(argb, 0, engine.width, 0, 0, engine.width, engine.height)
        val image = bitmap.asImageBitmap()
        cachedImage = image
        cachedRevision = engine.revision
        return image
    }

    /**
     * Rasterize an emoji glyph for the engine to stamp, cached per
     * glyph+size (the web draws stickers with `fillText` at `size * 3`px).
     * Android text rendering stays here so the engine remains pure pixels.
     */
    private fun stickerBitmap(glyph: String, fontSize: Float): PaintEngine.StickerBitmap? {
        val key = "$glyph-${fontSize.roundToInt()}"
        stickerCache[key]?.let { return it }

        val paint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG)
        paint.textSize = fontSize
        val metrics = paint.fontMetrics
        val width = ceil(paint.measureText(glyph)).toInt()
        val height = ceil(metrics.descent - metrics.ascent).toInt()
        if (width <= 0 || height <= 0) {
            return null
        }
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        android.graphics.Canvas(bitmap).drawText(glyph, 0f, -metrics.ascent, paint)

        // getPixels returns non-premultiplied ARGB, which is exactly the
        // straight-alpha RGBA the engine blends with.
        val argb = IntArray(width * height)
        bitmap.getPixels(argb, 0, width, 0, 0, width, height)
        val rgba = IntArray(width * height * 4)
        for (i in argb.indices) {
            val c = argb[i]
            rgba[i * 4] = (c shr 16) and 0xFF
            rgba[i * 4 + 1] = (c shr 8) and 0xFF
            rgba[i * 4 + 2] = c and 0xFF
            rgba[i * 4 + 3] = c ushr 24
        }
        val result = PaintEngine.StickerBitmap(width, height, rgba)
        stickerCache[key] = result
        return result
    }
}

/**
 * The document canvas: draws the engine's pixel buffer scaled to fit, plus
 * the live shape preview, and maps touches back into the fixed 960x640
 * document space (same mapping as the web `canvasPoint`).
 */
@Composable
private fun PaperCanvas(
    session: PaintSession,
    documentRevision: Int,
    shapePreview: ShapePreview?,
    previewColor: Color,
    previewShapeKind: PaintEngine.ShapeKind,
    previewStrokeWidth: Float,
    modifier: Modifier = Modifier,
) {
    Canvas(
        modifier = modifier
            .aspectRatio(PaintEngine.CANVAS_WIDTH.toFloat() / PaintEngine.CANVAS_HEIGHT)
            .background(PaintColors.paper)
            .border(2.dp, PaintColors.ink)
            .pointerInput(session) {
                // Down/move/up tracked manually (like the Pong field) so
                // plain taps register immediately — drag detectors would
                // swallow them behind touch slop.
                awaitPointerEventScope {
                    var pressed = false
                    while (true) {
                        val event = awaitPointerEvent()
                        val change = event.changes.firstOrNull() ?: continue
                        val scale = size.width.toFloat() / PaintEngine.CANVAS_WIDTH
                        val x = change.position.x / scale
                        val y = change.position.y / scale
                        if (change.pressed && !pressed) {
                            pressed = true
                            session.pointerDown(x, y)
                        } else if (change.pressed) {
                            session.pointerMove(x, y)
                        } else if (pressed) {
                            pressed = false
                            session.pointerUp()
                        }
                        change.consume()
                    }
                }
            },
    ) {
        // Reading the revision invalidates the canvas after every mutation;
        // the engine itself is not snapshot state.
        @Suppress("UNUSED_EXPRESSION")
        documentRevision

        val documentScale = size.width / PaintEngine.CANVAS_WIDTH
        scale(scale = documentScale, pivot = Offset.Zero) {
            drawImage(session.paperImage())

            // Live shape feedback while dragging — the web overlay canvas.
            shapePreview?.let { preview ->
                val stroke = Stroke(
                    width = previewStrokeWidth,
                    cap = StrokeCap.Round,
                    join = StrokeJoin.Round,
                )
                when (previewShapeKind) {
                    PaintEngine.ShapeKind.LINE -> drawLine(
                        color = previewColor,
                        start = Offset(preview.startX, preview.startY),
                        end = Offset(preview.currentX, preview.currentY),
                        strokeWidth = previewStrokeWidth,
                        cap = StrokeCap.Round,
                    )
                    PaintEngine.ShapeKind.RECT -> drawRect(
                        color = previewColor,
                        topLeft = Offset(
                            min(preview.startX, preview.currentX),
                            min(preview.startY, preview.currentY),
                        ),
                        size = Size(
                            abs(preview.currentX - preview.startX),
                            abs(preview.currentY - preview.startY),
                        ),
                        style = stroke,
                    )
                    PaintEngine.ShapeKind.ELLIPSE -> drawOval(
                        color = previewColor,
                        topLeft = Offset(
                            min(preview.startX, preview.currentX),
                            min(preview.startY, preview.currentY),
                        ),
                        size = Size(
                            abs(preview.currentX - preview.startX),
                            abs(preview.currentY - preview.startY),
                        ),
                        style = stroke,
                    )
                }
            }
        }
    }
}

/** Pinstriped retro title bar, like the web window header. */
@Composable
private fun TitleBar() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(PaintColors.frame)
            .padding(horizontal = 12.dp, vertical = 7.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        TitleBarBox()
        TitleBarLines(modifier = Modifier.weight(1f))
        Text(
            text = "PaintBot — Untitled",
            color = PaintColors.ink,
            fontSize = 14.sp,
            fontWeight = FontWeight.Black,
            maxLines = 1,
        )
        TitleBarLines(modifier = Modifier.weight(1f))
        TitleBarBox()
    }
}

@Composable
private fun TitleBarBox() {
    Box(
        modifier = Modifier
            .width(14.dp)
            .height(14.dp)
            .background(PaintColors.frame)
            .border(2.dp, PaintColors.ink),
    )
}

@Composable
private fun TitleBarLines(modifier: Modifier = Modifier) {
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(3.dp)) {
        repeat(3) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(1.dp)
                    .background(PaintColors.ink),
            )
        }
    }
}

@Composable
private fun InkDivider() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(2.dp)
            .background(PaintColors.ink),
    )
}

@Composable
private fun ToolbarDivider() {
    Box(
        modifier = Modifier
            .width(2.dp)
            .height(22.dp)
            .background(PaintColors.ridge),
    )
}

/** Chunky bordered button echoing the web toolbar's `chunky` style. */
@Composable
private fun ChunkyButton(
    label: String,
    isActive: Boolean = false,
    enabled: Boolean = true,
    onClick: () -> Unit,
) {
    val shape = RoundedCornerShape(7.dp)
    Box(
        modifier = Modifier
            .clip(shape)
            .background(if (isActive) PaintColors.accent else PaintColors.frame)
            .border(2.dp, PaintColors.ink, shape)
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 5.dp),
    ) {
        Text(
            text = label,
            color = PaintColors.ink.copy(alpha = if (enabled) 1f else 0.4f),
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
        )
    }
}

@Composable
private fun ShapeButton(
    label: String,
    kind: PaintEngine.ShapeKind,
    selected: PaintEngine.ShapeKind,
    onSelect: (PaintEngine.ShapeKind) -> Unit,
) {
    ChunkyButton(label = label, isActive = kind == selected, onClick = { onSelect(kind) })
}

@Composable
private fun ToolButton(entry: PaintTool, isActive: Boolean, onClick: () -> Unit) {
    val shape = RoundedCornerShape(8.dp)
    Column(
        modifier = Modifier
            .clip(shape)
            .background(if (isActive) PaintColors.accent else PaintColors.frame)
            .border(2.dp, PaintColors.ink, shape)
            .clickable(onClick = onClick)
            .width(58.dp)
            .padding(vertical = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        Text(text = entry.glyph, fontSize = 20.sp)
        Text(
            text = entry.label,
            color = PaintColors.ink,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
        )
    }
}

@Composable
private fun RowScope.StickerButton(glyph: String, isActive: Boolean, onClick: () -> Unit) {
    val shape = RoundedCornerShape(7.dp)
    Box(
        modifier = Modifier
            .weight(1f)
            .clip(shape)
            .background(if (isActive) PaintColors.accent else PaintColors.paper)
            .border(2.dp, PaintColors.ink, shape)
            .clickable(onClick = onClick)
            .padding(vertical = 5.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(text = glyph, fontSize = 18.sp)
    }
}

@Composable
private fun RowScope.SwatchButton(hex: String, isActive: Boolean, onClick: () -> Unit) {
    val shape = RoundedCornerShape(4.dp)
    Box(
        modifier = Modifier
            .weight(1f)
            .height(16.dp)
            .clip(shape)
            .background(swatchColor(hex))
            .border(if (isActive) 3.dp else 2.dp, PaintColors.ink, shape)
            .clickable(onClick = onClick),
    )
}

/** Label + slider + value readout (the web sliderRow grid). */
@Composable
private fun SliderRow(
    label: String,
    value: Float,
    range: ClosedFloatingPointRange<Float>,
    display: String,
    onChange: (Float) -> Unit,
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(
            text = label,
            color = PaintColors.ink,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.width(52.dp),
        )
        Slider(
            value = value,
            onValueChange = onChange,
            valueRange = range,
            colors = SliderDefaults.colors(
                thumbColor = PaintColors.ink,
                activeTrackColor = PaintColors.ink,
                inactiveTrackColor = PaintColors.ridge,
            ),
            modifier = Modifier.weight(1f),
        )
        Text(
            text = display,
            color = PaintColors.ink,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.width(38.dp),
        )
    }
}
