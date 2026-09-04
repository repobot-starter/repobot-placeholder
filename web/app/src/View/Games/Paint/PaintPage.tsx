import React, { useRef, useState } from "react"
import PaintCanvas, { PaintCanvasHandle, PaintHistory, PaintTool } from "./PaintCanvas"
import { ShapeKind } from "./tools"
import * as styles from "./PaintPage.styles.css"

const TOOLS: { id: PaintTool; label: string }[] = [
    { id: "brush", label: "Brush" },
    { id: "pencil", label: "Pencil" },
    { id: "eraser", label: "Eraser" },
    { id: "fill", label: "Fill" },
    { id: "shape", label: "Shape" },
    { id: "sticker", label: "Sticker" },
]

const SHAPES: { id: ShapeKind; label: string }[] = [
    { id: "line", label: "Line" },
    { id: "rect", label: "Rect" },
    { id: "ellipse", label: "Oval" },
]

const STICKERS = ["⭐", "❤️", "⚡", "☁️", "🌸", "🦋", "🌈", "🎈"]

const SWATCHES = [
    "#0a0a0a",
    "#52525b",
    "#a1a1aa",
    "#e4e4e7",
    "#d32f2f",
    "#e64a19",
    "#f9a825",
    "#7cb342",
    "#00897b",
    "#1976d2",
    "#3949ab",
    "#8e24aa",
    "#d81b60",
    "#ef9a9a",
    "#ffcc80",
    "#fff59d",
    "#c5e1a5",
    "#80cbc4",
    "#90caf9",
    "#9fa8da",
    "#ce93d8",
    "#f48fb1",
    "#bcaaa4",
    "#6d4c41",
]

const TIPS = [
    "Fill floods any closed region with the current color",
    "Stickers stamp where you click — scale them with the size slider",
    "Undo has your back. Experiment.",
    "Drag with the shape tool to preview before it lands",
]

/** Home surface for the `paint` pack: a paint studio with brushes, fill, shapes, and stickers. */
export default function PaintPage(): React.ReactElement {
    const canvasRef = useRef<PaintCanvasHandle>(null)
    const [tool, setTool] = useState<PaintTool>("brush")
    const [shapeKind, setShapeKind] = useState<ShapeKind>("line")
    const [color, setColor] = useState("#0a0a0a")
    const [size, setSize] = useState(14)
    const [opacity, setOpacity] = useState(1)
    const [sticker, setSticker] = useState("⭐")
    const [history, setHistory] = useState<PaintHistory>({ canUndo: false, canRedo: false })
    const [tipIndex, setTipIndex] = useState(0)

    const handleNew = (): void => {
        if (window.confirm("Clear the canvas and start fresh?")) {
            canvasRef.current?.clear()
        }
    }

    const handleStrokeEnd = (): void => setTipIndex((index) => (index + 1) % TIPS.length)

    const pickSticker = (value: string): void => {
        setSticker(value)
        setTool("sticker")
    }

    return (
        <div className={styles.page}>
            <div className={styles.studio}>
                <header className={styles.header}>
                    <div className={styles.wordmarkBlock}>
                        <span className={styles.wordmark}>Paint</span>
                        <span className={styles.tagline}>Untitled canvas</span>
                    </div>
                    <div className={styles.headerActions}>
                        <button
                            className={styles.button}
                            disabled={!history.canUndo}
                            onClick={() => canvasRef.current?.undo()}
                        >
                            Undo
                        </button>
                        <button
                            className={styles.button}
                            disabled={!history.canRedo}
                            onClick={() => canvasRef.current?.redo()}
                        >
                            Redo
                        </button>
                        <span className={styles.actionDivider} />
                        <button className={styles.button} onClick={handleNew}>
                            New
                        </button>
                        <button
                            className={styles.buttonPrimary}
                            onClick={() => canvasRef.current?.savePng("painting.png")}
                        >
                            Save
                        </button>
                    </div>
                </header>

                <div className={styles.workspace}>
                    <div className={styles.toolRail}>
                        {TOOLS.map((entry) => (
                            <button
                                key={entry.id}
                                className={tool === entry.id ? styles.toolActive : styles.tool}
                                onClick={() => setTool(entry.id)}
                            >
                                {entry.label}
                            </button>
                        ))}
                        {tool === "shape" && (
                            <>
                                <span className={styles.railDivider} />
                                <span className={styles.railLabel}>Shape</span>
                                {SHAPES.map((shape) => (
                                    <button
                                        key={shape.id}
                                        className={shapeKind === shape.id ? styles.toolActive : styles.tool}
                                        onClick={() => setShapeKind(shape.id)}
                                    >
                                        {shape.label}
                                    </button>
                                ))}
                            </>
                        )}
                    </div>

                    <div className={styles.canvasArea}>
                        <PaintCanvas
                            ref={canvasRef}
                            tool={tool}
                            shapeKind={shapeKind}
                            color={color}
                            size={size}
                            opacity={opacity}
                            sticker={sticker}
                            onStrokeEnd={handleStrokeEnd}
                            onHistoryChange={setHistory}
                        />
                    </div>

                    <div className={styles.sidePanel}>
                        <div className={styles.panelSection}>
                            <div className={styles.panelHeading}>Stroke</div>
                            <div className={styles.strokePreview}>
                                <svg viewBox="0 0 160 36" preserveAspectRatio="none">
                                    <path
                                        d="M6 26 C 40 6, 70 34, 100 16 S 150 14, 154 20"
                                        fill="none"
                                        stroke={color}
                                        strokeWidth={Math.max(2, size / 2)}
                                        strokeLinecap="round"
                                        opacity={opacity}
                                    />
                                </svg>
                            </div>
                            <label className={styles.sliderRow}>
                                <span>Size</span>
                                <input
                                    type="range"
                                    min="2"
                                    max="60"
                                    value={size}
                                    onChange={(event) => setSize(Number(event.target.value))}
                                />
                                <span className={styles.sliderValue}>{size}</span>
                            </label>
                            <label className={styles.sliderRow}>
                                <span>Opacity</span>
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    value={Math.round(opacity * 100)}
                                    onChange={(event) => setOpacity(Number(event.target.value) / 100)}
                                />
                                <span className={styles.sliderValue}>{Math.round(opacity * 100)}%</span>
                            </label>
                        </div>

                        <div className={styles.panelSection}>
                            <div className={styles.panelHeading}>Color</div>
                            <div className={styles.swatchGrid}>
                                {SWATCHES.map((value) => (
                                    <button
                                        key={value}
                                        className={color === value ? styles.swatchActive : styles.swatch}
                                        style={{ background: value }}
                                        onClick={() => setColor(value)}
                                        title={value}
                                    />
                                ))}
                            </div>
                            <div className={styles.colorRow}>
                                <span className={styles.currentColor} style={{ background: color }} />
                                <input
                                    type="color"
                                    className={styles.colorPicker}
                                    value={color}
                                    onChange={(event) => setColor(event.target.value)}
                                    title="Custom color"
                                />
                                <span className={styles.colorHint}>{color}</span>
                            </div>
                        </div>

                        <div className={styles.panelSection}>
                            <div className={styles.panelHeading}>Stickers</div>
                            <div className={styles.stickerRow}>
                                {STICKERS.map((value) => (
                                    <button
                                        key={value}
                                        className={
                                            tool === "sticker" && sticker === value
                                                ? styles.stickerActive
                                                : styles.sticker
                                        }
                                        onClick={() => pickSticker(value)}
                                    >
                                        {value}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <footer className={styles.statusBar}>
                    <span>{TIPS[tipIndex]}</span>
                    <span>Canvas 960 × 640</span>
                </footer>
            </div>
        </div>
    )
}
