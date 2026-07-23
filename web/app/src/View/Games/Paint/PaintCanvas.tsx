import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import { ShapeKind, drawShape, emojiCursor, floodFill, hexToRgba, ringCursor } from "./tools"
import * as styles from "./PaintPage.styles.css"

export const CANVAS_WIDTH = 960
export const CANVAS_HEIGHT = 640
const MAX_HISTORY = 40

export type PaintTool = "brush" | "pencil" | "eraser" | "fill" | "shape" | "sticker"

export interface PaintHistory {
    canUndo: boolean
    canRedo: boolean
}

export interface PaintCanvasHandle {
    undo: () => void
    redo: () => void
    clear: () => void
    savePng: (filename: string) => void
}

interface PaintCanvasProps {
    tool: PaintTool
    shapeKind: ShapeKind
    color: string
    size: number
    opacity: number
    sticker: string
    onStrokeEnd?: () => void
    onHistoryChange?: (history: PaintHistory) => void
}

interface CanvasState {
    drawing: boolean
    startX: number
    startY: number
    lastX: number
    lastY: number
    undoStack: ImageData[]
    redoStack: ImageData[]
}

/**
 * The drawing surface. Two stacked canvases: the paper (committed pixels)
 * and an overlay used for live shape previews. The parent controls the
 * active tool/color/size and calls undo/redo/clear/savePng via the ref.
 */
const PaintCanvas = forwardRef<PaintCanvasHandle, PaintCanvasProps>(function PaintCanvas(
    { tool, shapeKind, color, size, opacity, sticker, onStrokeEnd, onHistoryChange },
    ref,
) {
    const stackRef = useRef<HTMLDivElement>(null)
    const paperRef = useRef<HTMLCanvasElement>(null)
    const overlayRef = useRef<HTMLCanvasElement>(null)
    // Ratio of on-screen pixels to logical canvas pixels; the cursor preview
    // has to match what the stroke will actually look like on screen.
    const [displayScale, setDisplayScale] = useState(1)
    const stateRef = useRef<CanvasState>({
        drawing: false,
        startX: 0,
        startY: 0,
        lastX: 0,
        lastY: 0,
        undoStack: [],
        redoStack: [],
    })
    // Keep the latest props visible to pointer handlers without re-binding them.
    const propsRef = useRef<Omit<PaintCanvasProps, "onHistoryChange">>({
        tool,
        shapeKind,
        color,
        size,
        opacity,
        sticker,
        onStrokeEnd,
    })
    propsRef.current = { tool, shapeKind, color, size, opacity, sticker, onStrokeEnd }

    useEffect(() => {
        const ctx = paperRef.current?.getContext("2d")
        if (!ctx) {
            return
        }
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    }, [])

    useEffect(() => {
        const element = stackRef.current
        if (!element) {
            return
        }
        const observer = new ResizeObserver(() => {
            setDisplayScale(element.getBoundingClientRect().width / CANVAS_WIDTH)
        })
        observer.observe(element)
        return () => observer.disconnect()
    }, [])

    const cursor = useMemo(() => {
        // Stroke widths below match strokeSegment so the preview is truthful.
        switch (tool) {
            case "brush":
                return ringCursor({ diameter: size * displayScale, color, opacity, badge: "🖌️" })
            case "pencil":
                return ringCursor({
                    diameter: Math.max(1.5, size / 5) * displayScale,
                    color,
                    badge: "✏️",
                })
            case "eraser":
                return ringCursor({
                    diameter: size * 1.6 * displayScale,
                    color: "#ffffff",
                    badge: "🩹",
                })
            case "shape":
                return ringCursor({ diameter: size * displayScale, color, badge: "⬜" })
            case "fill":
                return emojiCursor("🪣", { hotspotX: 14, hotspotY: 24 })
            case "sticker":
                // Sticker cursor is the sticker itself at its stamped size.
                return emojiCursor(sticker, { size: size * 3 * displayScale, centered: true })
            default:
                return "crosshair"
        }
    }, [tool, sticker, color, size, opacity, displayScale])

    const notifyHistory = (): void => {
        const { undoStack, redoStack } = stateRef.current
        onHistoryChange?.({ canUndo: undoStack.length > 0, canRedo: redoStack.length > 0 })
    }

    const snapshot = (): void => {
        const ctx = paperRef.current?.getContext("2d")
        if (!ctx) {
            return
        }
        const state = stateRef.current
        state.undoStack.push(ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT))
        if (state.undoStack.length > MAX_HISTORY) {
            state.undoStack.shift()
        }
        state.redoStack = []
        notifyHistory()
    }

    useImperativeHandle(ref, () => ({
        undo() {
            const state = stateRef.current
            const ctx = paperRef.current?.getContext("2d")
            if (state.undoStack.length === 0 || !ctx) {
                return
            }
            state.redoStack.push(ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT))
            const imageData = state.undoStack.pop()
            if (imageData) {
                ctx.putImageData(imageData, 0, 0)
            }
            notifyHistory()
        },
        redo() {
            const state = stateRef.current
            const ctx = paperRef.current?.getContext("2d")
            if (state.redoStack.length === 0 || !ctx) {
                return
            }
            state.undoStack.push(ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT))
            const imageData = state.redoStack.pop()
            if (imageData) {
                ctx.putImageData(imageData, 0, 0)
            }
            notifyHistory()
        },
        clear() {
            const ctx = paperRef.current?.getContext("2d")
            if (!ctx) {
                return
            }
            snapshot()
            ctx.fillStyle = "#ffffff"
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        },
        savePng(filename: string) {
            const canvas = paperRef.current
            if (!canvas) {
                return
            }
            const link = document.createElement("a")
            link.download = filename
            link.href = canvas.toDataURL("image/png")
            link.click()
        },
    }))

    const canvasPoint = (
        overlay: HTMLCanvasElement,
        event: React.PointerEvent<HTMLCanvasElement>,
    ): { x: number; y: number } => {
        const rect = overlay.getBoundingClientRect()
        return {
            x: ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
            y: ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
        }
    }

    const strokeSegment = (
        ctx: CanvasRenderingContext2D,
        x0: number,
        y0: number,
        x1: number,
        y1: number,
    ): void => {
        const {
            tool: activeTool,
            color: activeColor,
            size: brushSize,
            opacity: brushOpacity,
        } = propsRef.current
        ctx.save()
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        if (activeTool === "eraser") {
            ctx.strokeStyle = "#ffffff"
            ctx.lineWidth = brushSize * 1.6
            ctx.globalAlpha = 1
        } else if (activeTool === "pencil") {
            ctx.strokeStyle = activeColor
            ctx.lineWidth = Math.max(1.5, brushSize / 5)
            ctx.globalAlpha = 1
        } else {
            ctx.strokeStyle = activeColor
            ctx.lineWidth = brushSize
            ctx.globalAlpha = brushOpacity
        }
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(x1, y1)
        ctx.stroke()
        ctx.restore()
    }

    const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>): void => {
        event.preventDefault()
        const overlay = overlayRef.current
        const ctx = paperRef.current?.getContext("2d")
        if (!overlay || !ctx) {
            return
        }
        overlay.setPointerCapture(event.pointerId)
        const { x, y } = canvasPoint(overlay, event)
        const {
            tool: activeTool,
            color: activeColor,
            size: brushSize,
            sticker: activeSticker,
        } = propsRef.current
        const state = stateRef.current

        snapshot()

        if (activeTool === "fill") {
            const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
            floodFill(imageData, x, y, hexToRgba(activeColor))
            ctx.putImageData(imageData, 0, 0)
            propsRef.current.onStrokeEnd?.()
            return
        }

        if (activeTool === "sticker") {
            ctx.save()
            ctx.font = `${brushSize * 3}px serif`
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillText(activeSticker, x, y)
            ctx.restore()
            propsRef.current.onStrokeEnd?.()
            return
        }

        state.drawing = true
        state.startX = x
        state.startY = y
        state.lastX = x
        state.lastY = y

        if (activeTool === "brush" || activeTool === "pencil" || activeTool === "eraser") {
            // Dot for a simple click.
            strokeSegment(ctx, x, y, x + 0.01, y + 0.01)
        }
    }

    const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>): void => {
        const state = stateRef.current
        if (!state.drawing) {
            return
        }
        const overlay = overlayRef.current
        const paperCtx = paperRef.current?.getContext("2d")
        if (!overlay || !paperCtx) {
            return
        }
        const { x, y } = canvasPoint(overlay, event)
        const {
            tool: activeTool,
            shapeKind: activeShape,
            color: activeColor,
            size: brushSize,
        } = propsRef.current

        if (activeTool === "shape") {
            const overlayCtx = overlay.getContext("2d")
            if (overlayCtx) {
                overlayCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
                drawShape(overlayCtx, activeShape, state.startX, state.startY, x, y, activeColor, brushSize)
            }
        } else {
            strokeSegment(paperCtx, state.lastX, state.lastY, x, y)
        }
        state.lastX = x
        state.lastY = y
    }

    const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>): void => {
        const state = stateRef.current
        if (!state.drawing) {
            return
        }
        state.drawing = false
        const {
            tool: activeTool,
            shapeKind: activeShape,
            color: activeColor,
            size: brushSize,
        } = propsRef.current

        if (activeTool === "shape") {
            const overlay = overlayRef.current
            const paperCtx = paperRef.current?.getContext("2d")
            if (!overlay || !paperCtx) {
                return
            }
            const { x, y } = canvasPoint(overlay, event)
            overlay.getContext("2d")?.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
            drawShape(paperCtx, activeShape, state.startX, state.startY, x, y, activeColor, brushSize)
        }
        propsRef.current.onStrokeEnd?.()
    }

    return (
        <div className={styles.canvasStack} ref={stackRef}>
            <canvas ref={paperRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
            <canvas
                ref={overlayRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className={styles.overlay}
                style={{ cursor }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            />
        </div>
    )
})

export default PaintCanvas
