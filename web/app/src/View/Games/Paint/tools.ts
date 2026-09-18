// Canvas drawing helpers shared by PaintCanvas.

// Browsers cap custom cursors (Chrome: 128px); stay safely under it.
const MAX_CURSOR_PX = 120

export type ShapeKind = "line" | "rect" | "ellipse"

export type Rgba = [number, number, number, number]

interface EmojiCursorOptions {
    size?: number
    hotspotX?: number
    hotspotY?: number
    centered?: boolean
}

/**
 * Render an emoji into a small canvas and return a CSS cursor value so the
 * pointer looks like the active tool. Hotspot is where the "tip" of the
 * glyph should land (e.g. a bucket pouring from its lower edge). When
 * `centered` is true the hotspot is the middle of the glyph.
 */
export function emojiCursor(glyph: string, options: EmojiCursorOptions = {}): string {
    const { size = 28, hotspotX, hotspotY, centered = false } = options
    const px = Math.max(12, Math.min(MAX_CURSOR_PX, Math.round(size)))
    const canvas = document.createElement("canvas")
    canvas.width = px
    canvas.height = px
    const ctx = canvas.getContext("2d")
    if (!ctx) {
        return "crosshair"
    }
    ctx.font = `${px - 4}px serif`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(glyph, px / 2, px / 2 + 1)
    const hx = centered ? px / 2 : (hotspotX ?? px / 2)
    const hy = centered ? px / 2 : (hotspotY ?? px / 2)
    return `url(${canvas.toDataURL("image/png")}) ${Math.round(hx)} ${Math.round(hy)}, crosshair`
}

/**
 * Cursor that previews the stroke footprint: a ring matching the on-screen
 * stroke diameter (filled with the current color at low alpha), a center
 * dot for precision, and an optional small tool badge at the top-right.
 * The hotspot is the ring center, so paint lands exactly inside the ring.
 */
export function ringCursor(options: {
    diameter: number
    color?: string
    opacity?: number
    badge?: string
}): string {
    const { diameter, color = "#1d1a26", opacity = 1, badge } = options
    const badgeSize = badge ? 16 : 0
    const pad = 2
    const d = Math.max(4, Math.min(MAX_CURSOR_PX - badgeSize - pad * 2, Math.round(diameter)))
    const size = d + badgeSize + pad * 2
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")
    if (!ctx) {
        return "crosshair"
    }

    const cx = pad + d / 2
    const cy = pad + badgeSize + d / 2

    ctx.beginPath()
    ctx.arc(cx, cy, d / 2, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.globalAlpha = Math.min(0.35, opacity * 0.35)
    ctx.fill()
    ctx.globalAlpha = 1

    // Two-tone ring so it stays visible on any background.
    ctx.beginPath()
    ctx.arc(cx, cy, d / 2, 0, Math.PI * 2)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)"
    ctx.lineWidth = 2.5
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(cx, cy, d / 2, 0, Math.PI * 2)
    ctx.strokeStyle = "rgba(29, 26, 38, 0.9)"
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(cx, cy, 1, 0, Math.PI * 2)
    ctx.fillStyle = "rgba(29, 26, 38, 0.9)"
    ctx.fill()

    if (badge) {
        ctx.font = `${badgeSize}px serif`
        ctx.textAlign = "right"
        ctx.textBaseline = "top"
        ctx.fillText(badge, size - 1, 0)
    }

    return `url(${canvas.toDataURL("image/png")}) ${Math.round(cx)} ${Math.round(cy)}, crosshair`
}

export function hexToRgba(hex: string): Rgba {
    const value = hex.replace("#", "")
    return [
        parseInt(value.slice(0, 2), 16),
        parseInt(value.slice(2, 4), 16),
        parseInt(value.slice(4, 6), 16),
        255,
    ]
}

/**
 * Classic scanline flood fill with a small tolerance so anti-aliased edges
 * don't leave halos. Mutates and returns the ImageData.
 */
export function floodFill(
    imageData: ImageData,
    startX: number,
    startY: number,
    fillRgba: Rgba,
    tolerance = 32,
): ImageData {
    const { width, height, data } = imageData
    const x0 = Math.floor(startX)
    const y0 = Math.floor(startY)
    if (x0 < 0 || y0 < 0 || x0 >= width || y0 >= height) {
        return imageData
    }

    const startIdx = (y0 * width + x0) * 4
    const target: Rgba = [data[startIdx], data[startIdx + 1], data[startIdx + 2], data[startIdx + 3]]
    if (colorsMatch(target, fillRgba, 0)) {
        return imageData
    }

    const matches = (idx: number): boolean =>
        colorsMatch([data[idx], data[idx + 1], data[idx + 2], data[idx + 3]], target, tolerance)

    const paint = (idx: number): void => {
        data[idx] = fillRgba[0]
        data[idx + 1] = fillRgba[1]
        data[idx + 2] = fillRgba[2]
        data[idx + 3] = fillRgba[3]
    }

    const stack: [number, number][] = [[x0, y0]]
    while (stack.length > 0) {
        const next = stack.pop()
        if (!next) {
            break
        }
        const [x, y] = next
        let west = x
        let east = x
        while (west > 0 && matches((y * width + west - 1) * 4)) {
            west--
        }
        while (east < width - 1 && matches((y * width + east + 1) * 4)) {
            east++
        }
        for (let i = west; i <= east; i++) {
            const idx = (y * width + i) * 4
            if (!matches(idx)) {
                continue
            }
            paint(idx)
            if (y > 0 && matches(((y - 1) * width + i) * 4)) {
                stack.push([i, y - 1])
            }
            if (y < height - 1 && matches(((y + 1) * width + i) * 4)) {
                stack.push([i, y + 1])
            }
        }
    }
    return imageData
}

function colorsMatch(a: Rgba, b: Rgba, tolerance: number): boolean {
    return (
        Math.abs(a[0] - b[0]) <= tolerance &&
        Math.abs(a[1] - b[1]) <= tolerance &&
        Math.abs(a[2] - b[2]) <= tolerance &&
        Math.abs(a[3] - b[3]) <= tolerance
    )
}

/** Stroke a line, rectangle, or ellipse between two corner points. */
export function drawShape(
    ctx: CanvasRenderingContext2D,
    kind: ShapeKind,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    color: string,
    lineWidth: number,
): void {
    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.beginPath()
    if (kind === "line") {
        ctx.moveTo(x0, y0)
        ctx.lineTo(x1, y1)
    } else if (kind === "rect") {
        ctx.rect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0))
    } else {
        ctx.ellipse(
            (x0 + x1) / 2,
            (y0 + y1) / 2,
            Math.abs(x1 - x0) / 2,
            Math.abs(y1 - y0) / 2,
            0,
            0,
            Math.PI * 2,
        )
    }
    ctx.stroke()
    ctx.restore()
}
