import React, { useRef, useState } from "react"
import PaintCanvas, { PaintCanvasHandle, PaintHistory, PaintTool } from "./PaintCanvas"
import { ShapeKind } from "./tools"
import * as styles from "./PaintPage.styles.css"

const TOOLS: { id: PaintTool; label: string; glyph: string }[] = [
    { id: "brush", label: "Brush", glyph: "🖌️" },
    { id: "pencil", label: "Pencil", glyph: "✏️" },
    { id: "eraser", label: "Eraser", glyph: "🩹" },
    { id: "fill", label: "Fill", glyph: "🪣" },
    { id: "shape", label: "Shape", glyph: "⬜" },
    { id: "sticker", label: "Sticker", glyph: "⭐" },
]

const SHAPES: { id: ShapeKind; label: string }[] = [
    { id: "line", label: "Line" },
    { id: "rect", label: "Rect" },
    { id: "ellipse", label: "Oval" },
]

const STICKERS = ["⭐", "❤️", "⚡", "☁️", "🌸", "🤖", "🌈", "🎈"]

const SWATCHES = [
    [
        "#d32f2f",
        "#e64a19",
        "#f9a825",
        "#7cb342",
        "#00897b",
        "#1976d2",
        "#3949ab",
        "#8e24aa",
        "#d81b60",
        "#6d4c41",
        "#546e7a",
        "#e0e0e0",
    ],
    [
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
        "#b0bec5",
        "#000000",
    ],
]

const TIPS = [
    "Tip: Pick the Fill bucket to flood an area with color",
    "Tip: Stickers stamp where you click — resize them with the Size slider",
    "Tip: Undo has your back — experiment freely!",
    "Tip: Drag with the Shape tool to preview before it lands",
]

/** Home surface for the `paint` pack: retro paint studio with brushes, fill, shapes, and stickers. */
export default function PaintPage(): React.ReactElement {
    const canvasRef = useRef<PaintCanvasHandle>(null)
    const [tool, setTool] = useState<PaintTool>("brush")
    const [shapeKind, setShapeKind] = useState<ShapeKind>("line")
    const [color, setColor] = useState("#3949ab")
    const [size, setSize] = useState(14)
    const [opacity, setOpacity] = useState(1)
    const [sticker, setSticker] = useState("⭐")
    const [history, setHistory] = useState<PaintHistory>({ canUndo: false, canRedo: false })
    const [tipIndex, setTipIndex] = useState(0)

    const handleNew = (): void => {
        if (window.confirm("Start a new painting? The current canvas will be cleared.")) {
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
            <div className={styles.window}>
                <div className={styles.titleBar}>
                    <span className={styles.titleBarBox} />
                    <span className={styles.titleBarLines} />
                    <span className={styles.titleText}>PaintBot — Untitled Project</span>
                    <span className={styles.titleBarLines} />
                    <span className={styles.titleBarBox} />
                </div>

                <div className={styles.toolbar}>
                    <button className={styles.chunky} onClick={handleNew}>
                        New
                    </button>
                    <button
                        className={styles.chunky}
                        onClick={() => canvasRef.current?.savePng("paintbot.png")}
                    >
                        Save
                    </button>
                    <span className={styles.toolbarDivider} />
                    <button
                        className={styles.chunky}
                        disabled={!history.canUndo}
                        onClick={() => canvasRef.current?.undo()}
                    >
                        Undo
                    </button>
                    <button
                        className={styles.chunky}
                        disabled={!history.canRedo}
                        onClick={() => canvasRef.current?.redo()}
                    >
                        Redo
                    </button>
                    {tool === "shape" && (
                        <>
                            <span className={styles.toolbarDivider} />
                            {SHAPES.map((shape) => (
                                <button
                                    key={shape.id}
                                    className={shapeKind === shape.id ? styles.chunkyActive : styles.chunky}
                                    onClick={() => setShapeKind(shape.id)}
                                >
                                    {shape.label}
                                </button>
                            ))}
                        </>
                    )}
                </div>

                <div className={styles.workspace}>
                    <div className={styles.toolPalette}>
                        {TOOLS.map((entry) => (
                            <button
                                key={entry.id}
                                className={tool === entry.id ? styles.toolActive : styles.tool}
                                onClick={() => setTool(entry.id)}
                                title={entry.label}
                            >
                                <span className={styles.toolGlyph}>{entry.glyph}</span>
                                <span className={styles.toolLabel}>{entry.label}</span>
                            </button>
                        ))}
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
                            <div className={styles.panelHeading}>Brush Settings</div>
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

                <div className={styles.paletteBar}>
                    <span className={styles.currentColor} style={{ background: color }} />
                    <div className={styles.swatchGrid}>
                        {SWATCHES.map((row, rowIndex) => (
                            <div key={rowIndex} className={styles.swatchRow}>
                                {row.map((value) => (
                                    <button
                                        key={value}
                                        className={color === value ? styles.swatchActive : styles.swatch}
                                        style={{ background: value }}
                                        onClick={() => setColor(value)}
                                        title={value}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                    <input
                        type="color"
                        className={styles.colorPicker}
                        value={color}
                        onChange={(event) => setColor(event.target.value)}
                        title="Custom color"
                    />
                </div>

                <div className={styles.statusBar}>
                    <span>{TIPS[tipIndex]}</span>
                    <span>Canvas: 960 × 640</span>
                </div>
            </div>
        </div>
    )
}
