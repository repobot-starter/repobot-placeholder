// Inline SVG art for all 48 hanafuda cards in traditional flat style:
// black ink, crimson, white, and gold on cream, with the customary purple
// for wisteria/iris and deep blue for the aotan ribbons. Every card is a
// composition of its month's flora plus the slot's special motif, so each
// is visually distinct and month-recognizable at a glance.
//
// Pure presentation — no engine imports beyond the card model, no assets,
// no network. The frame/viewBox is shared; month motifs are `<g>` builders.

import React from "react"
import { HanafudaCard } from "./engine"

// Card faces are drawn in a 120x192 viewBox (the classic narrow hanafuda
// proportion) and scaled by the page via CSS.
export const CARD_W = 120
export const CARD_H = 192

const INK = "#221c18"
const RED = "#b53228"
const RED_DEEP = "#8e241d"
const GOLD = "#d9a441"
const GOLD_PALE = "#eccb84"
const CREAM = "#f4ecd6"
const WHITE = "#fbf7ec"
const PURPLE = "#7c5fa8"
const BLUE = "#3e4a8c"

interface FaceProps {
    card: HanafudaCard
    /** Extra class for the root svg (sizing hooks live in the page styles). */
    className?: string
}

/** One full card face: frame, month flora, and the slot's special motif. */
export function HanafudaCardFace({ card, className }: FaceProps): React.ReactElement {
    const slot = card.id % 4
    return (
        <svg
            viewBox={`0 0 ${CARD_W} ${CARD_H}`}
            className={className}
            role="img"
            aria-label={`${card.name} (month ${card.month})`}
        >
            <rect x={0} y={0} width={CARD_W} height={CARD_H} rx={10} fill={INK} />
            <rect x={4} y={4} width={CARD_W - 8} height={CARD_H - 8} rx={7} fill={CREAM} />
            {monthArt(card.month, slot)}
        </svg>
    )
}

/** The shared card back: black lacquer with a gold blossom roundel. */
export function HanafudaCardBack({ className }: { className?: string }): React.ReactElement {
    return (
        <svg viewBox={`0 0 ${CARD_W} ${CARD_H}`} className={className} role="img" aria-label="Card back">
            <rect x={0} y={0} width={CARD_W} height={CARD_H} rx={10} fill={INK} />
            <rect
                x={6}
                y={6}
                width={CARD_W - 12}
                height={CARD_H - 12}
                rx={6}
                fill="none"
                stroke={GOLD}
                strokeWidth={1.5}
                opacity={0.7}
            />
            <g fill={GOLD} opacity={0.85}>
                {[0, 72, 144, 216, 288].map((angle) => (
                    <ellipse
                        key={angle}
                        cx={60}
                        cy={82}
                        rx={7}
                        ry={13}
                        transform={`rotate(${angle} 60 96)`}
                    />
                ))}
                <circle cx={60} cy={96} r={5} fill={RED} />
            </g>
        </svg>
    )
}

function monthArt(month: number, slot: number): React.ReactElement {
    switch (month) {
        case 1:
            return <PineCard slot={slot} />
        case 2:
            return <PlumCard slot={slot} />
        case 3:
            return <CherryCard slot={slot} />
        case 4:
            return <WisteriaCard slot={slot} />
        case 5:
            return <IrisCard slot={slot} />
        case 6:
            return <PeonyCard slot={slot} />
        case 7:
            return <CloverCard slot={slot} />
        case 8:
            return <PampasCard slot={slot} />
        case 9:
            return <ChrysanthemumCard slot={slot} />
        case 10:
            return <MapleCard slot={slot} />
        case 11:
            return <WillowCard slot={slot} />
        default:
            return <PaulowniaCard slot={slot} />
    }
}

// ---------------------------------------------------------------------------
// Shared motifs
// ---------------------------------------------------------------------------

/** Mirrors the second chaff of a month so the duplicates read as a pair. */
function Flip({ on, children }: { on: boolean; children: React.ReactNode }): React.ReactElement {
    return on ? <g transform={`scale(-1,1) translate(${-CARD_W},0)`}>{children}</g> : <g>{children}</g>
}

interface RibbonProps {
    color: "poetry" | "plain" | "blue"
}

/** The tanzaku ribbon: a curving vertical strip pinned near the left edge. */
function RibbonStrip({ color }: RibbonProps): React.ReactElement {
    const fill = color === "blue" ? BLUE : RED
    return (
        <g>
            <path
                d={`M 30 26
                    C 24 62, 36 96, 28 132
                    C 25 146, 27 158, 32 166
                    L 52 160
                    C 47 150, 46 140, 48 128
                    C 54 94, 44 62, 50 30 Z`}
                fill={fill}
                stroke={INK}
                strokeWidth={2}
            />
            {color === "poetry" && (
                // Suggestion of the あかよろし calligraphy.
                <path
                    d="M 38 44 C 42 52, 36 58, 40 66 C 44 74, 37 82, 41 92 C 44 100, 38 108, 42 118 C 45 128, 39 136, 42 146"
                    fill="none"
                    stroke={WHITE}
                    strokeWidth={2.4}
                    strokeLinecap="round"
                />
            )}
            {color === "blue" && (
                <path d="M 39 42 L 39 150" fill="none" stroke={GOLD_PALE} strokeWidth={1.4} opacity={0.6} />
            )}
        </g>
    )
}

// ---------------------------------------------------------------------------
// January — Pine (crane bright, poetry ribbon, 2 chaff)
// ---------------------------------------------------------------------------

function PineBoughs(): React.ReactElement {
    return (
        <g>
            {/* Spiky pine clusters in ink with gold needles. */}
            {[
                { x: 34, y: 150 },
                { x: 78, y: 162 },
                { x: 58, y: 132 },
            ].map(({ x, y }, i) => (
                <g key={i}>
                    <path
                        d={`M ${x} ${y} l -20 14 l 8 -1 l -12 12 l 24 -6 l 0 12 l 8 -14 l 14 10 l -4 -16 l 14 2 l -18 -14 Z`}
                        fill={INK}
                    />
                    <path
                        d={`M ${x - 10} ${y + 8} l 10 -6 l 10 7`}
                        fill="none"
                        stroke={GOLD}
                        strokeWidth={1.6}
                    />
                </g>
            ))}
            <path d="M 20 184 L 100 184" stroke={INK} strokeWidth={3} />
        </g>
    )
}

function PineCard({ slot }: { slot: number }): React.ReactElement {
    if (slot === 0) {
        // Crane and Sun: white crane, red sun disc, pine at the base.
        return (
            <g>
                <circle cx={82} cy={44} r={22} fill={RED} />
                <PineBoughs />
                <g>
                    <path
                        d="M 38 138 C 30 112, 40 84, 60 76 C 76 70, 88 78, 88 90 C 88 102, 76 106, 68 102 C 74 116, 68 130, 56 138 Z"
                        fill={WHITE}
                        stroke={INK}
                        strokeWidth={2.5}
                    />
                    <path
                        d="M 60 76 C 54 66, 56 54, 66 48 L 72 56 C 66 60, 64 68, 66 74 Z"
                        fill={WHITE}
                        stroke={INK}
                        strokeWidth={2.5}
                    />
                    <circle cx={67} cy={53} r={2} fill={INK} />
                    <path d="M 66 48 L 78 42 L 70 54 Z" fill={RED_DEEP} />
                    <path d="M 44 132 L 40 152 M 54 136 L 54 154" stroke={INK} strokeWidth={2.5} />
                    <path d="M 42 108 C 52 116, 66 116, 76 108" fill="none" stroke={INK} strokeWidth={2} />
                </g>
            </g>
        )
    }
    if (slot === 1) {
        return (
            <g>
                <PineBoughs />
                <RibbonStrip color="poetry" />
            </g>
        )
    }
    return (
        <Flip on={slot === 3}>
            <PineBoughs />
            <path
                d="M 62 24 l -18 12 l 7 0 l -11 10 l 22 -5 l 0 10 l 7 -12 l 12 8 l -3 -13 l 12 1 l -16 -11 Z"
                fill={INK}
            />
        </Flip>
    )
}

// ---------------------------------------------------------------------------
// February — Plum (bush warbler animal, poetry ribbon, 2 chaff)
// ---------------------------------------------------------------------------

function PlumBranch(): React.ReactElement {
    const blossom = (x: number, y: number, r: number): React.ReactElement => (
        <g key={`${x}-${y}`}>
            {[0, 72, 144, 216, 288].map((angle) => (
                <circle
                    key={angle}
                    cx={x + r * Math.cos((angle * Math.PI) / 180)}
                    cy={y + r * Math.sin((angle * Math.PI) / 180)}
                    r={r * 0.72}
                    fill={RED}
                />
            ))}
            <circle cx={x} cy={y} r={r * 0.5} fill={WHITE} />
        </g>
    )
    return (
        <g>
            <path
                d="M 14 176 C 40 150, 44 120, 38 88 C 36 74, 42 60, 56 52 M 38 96 C 56 92, 72 98, 82 112 M 40 128 C 58 130, 70 140, 76 154"
                fill="none"
                stroke={INK}
                strokeWidth={5}
                strokeLinecap="round"
            />
            {blossom(58, 46, 8)}
            {blossom(88, 116, 7)}
            {blossom(80, 158, 6.5)}
            {blossom(30, 108, 5.5)}
        </g>
    )
}

function PlumCard({ slot }: { slot: number }): React.ReactElement {
    if (slot === 0) {
        // Bush warbler: a plump gold bird perched on the branch.
        return (
            <g>
                <PlumBranch />
                <g>
                    <ellipse cx={72} cy={70} rx={17} ry={13} fill={GOLD} stroke={INK} strokeWidth={2.5} />
                    <circle cx={86} cy={62} r={8} fill={GOLD} stroke={INK} strokeWidth={2.5} />
                    <circle cx={88.5} cy={60} r={1.8} fill={INK} />
                    <path d="M 93 63 L 101 65 L 93 67 Z" fill={INK} />
                    <path
                        d="M 58 74 C 50 78, 46 84, 46 90 L 58 82 Z"
                        fill={GOLD}
                        stroke={INK}
                        strokeWidth={2}
                    />
                    <path d="M 70 83 L 68 92 M 76 83 L 76 92" stroke={INK} strokeWidth={2} />
                </g>
            </g>
        )
    }
    if (slot === 1) {
        return (
            <g>
                <PlumBranch />
                <RibbonStrip color="poetry" />
            </g>
        )
    }
    return (
        <Flip on={slot === 3}>
            <PlumBranch />
        </Flip>
    )
}

// ---------------------------------------------------------------------------
// March — Cherry (curtain bright, poetry ribbon, 2 chaff)
// ---------------------------------------------------------------------------

function CherryBlossoms(): React.ReactElement {
    const bloom = (x: number, y: number, r: number): React.ReactElement => (
        <g key={`${x}-${y}`}>
            {[18, 90, 162, 234, 306].map((angle) => (
                <ellipse
                    key={angle}
                    cx={x + r * Math.cos((angle * Math.PI) / 180)}
                    cy={y + r * Math.sin((angle * Math.PI) / 180)}
                    rx={r * 0.78}
                    ry={r * 0.62}
                    fill={WHITE}
                    stroke={RED}
                    strokeWidth={1.6}
                    transform={`rotate(${angle} ${x + r * Math.cos((angle * Math.PI) / 180)} ${y + r * Math.sin((angle * Math.PI) / 180)})`}
                />
            ))}
            <circle cx={x} cy={y} r={r * 0.36} fill={GOLD} />
        </g>
    )
    return (
        <g>
            <path
                d="M 100 16 C 78 34, 52 40, 30 38 M 66 34 C 66 52, 58 64, 46 72"
                fill="none"
                stroke={INK}
                strokeWidth={4.5}
                strokeLinecap="round"
            />
            {bloom(34, 44, 9)}
            {bloom(68, 40, 10)}
            {bloom(50, 74, 8)}
            {bloom(92, 30, 7.5)}
        </g>
    )
}

function CherryCard({ slot }: { slot: number }): React.ReactElement {
    if (slot === 0) {
        // The flower-viewing curtain (maku) under the blossom canopy.
        return (
            <g>
                <CherryBlossoms />
                <g>
                    <path
                        d="M 16 96 L 104 96 L 104 176 C 82 184, 38 184, 16 176 Z"
                        fill={RED}
                        stroke={INK}
                        strokeWidth={2.5}
                    />
                    {[30, 52, 74, 96].map((x) => (
                        <path
                            key={x}
                            d={`M ${x} 96 C ${x - 3} 124, ${x + 3} 152, ${x - 2} 178`}
                            stroke={WHITE}
                            strokeWidth={7}
                            fill="none"
                        />
                    ))}
                    <path d="M 16 96 L 104 96" stroke={GOLD} strokeWidth={4} />
                    <path d="M 16 104 L 104 104" stroke={INK} strokeWidth={2} />
                </g>
            </g>
        )
    }
    if (slot === 1) {
        return (
            <g>
                <CherryBlossoms />
                <RibbonStrip color="poetry" />
            </g>
        )
    }
    return (
        <Flip on={slot === 3}>
            <CherryBlossoms />
            <path
                d="M 40 120 C 60 112, 84 116, 96 130 M 30 150 C 52 140, 82 142, 98 158"
                fill="none"
                stroke={RED}
                strokeWidth={2}
                opacity={0.5}
            />
        </Flip>
    )
}

// ---------------------------------------------------------------------------
// April — Wisteria (cuckoo animal, plain ribbon, 2 chaff)
// ---------------------------------------------------------------------------

function WisteriaDrape(): React.ReactElement {
    const raceme = (x: number, y: number, length: number): React.ReactElement => (
        <g key={`${x}-${y}`}>
            <path
                d={`M ${x} ${y} C ${x + 4} ${y + length / 2}, ${x - 4} ${y + length}, ${x} ${y + length + 8}`}
                stroke={INK}
                strokeWidth={2}
                fill="none"
            />
            {[0.15, 0.35, 0.55, 0.75, 0.92].map((t) => (
                <ellipse
                    key={t}
                    cx={x + (t % 0.4 > 0.2 ? 5 : -5)}
                    cy={y + length * t}
                    rx={7}
                    ry={5}
                    fill={PURPLE}
                    stroke={INK}
                    strokeWidth={1.2}
                />
            ))}
        </g>
    )
    return (
        <g>
            <path
                d="M 12 22 C 44 14, 82 16, 108 26"
                fill="none"
                stroke={INK}
                strokeWidth={5}
                strokeLinecap="round"
            />
            {raceme(30, 28, 92)}
            {raceme(60, 26, 116)}
            {raceme(88, 30, 76)}
        </g>
    )
}

function WisteriaCard({ slot }: { slot: number }): React.ReactElement {
    if (slot === 0) {
        // Cuckoo darting past a gold crescent moon.
        return (
            <g>
                <WisteriaDrape />
                <path d="M 96 130 A 20 20 0 1 1 78 100 A 16 16 0 0 0 96 130 Z" fill={GOLD} />
                <g>
                    <path
                        d="M 26 148 C 40 138, 58 136, 70 144 C 62 148, 56 150, 52 156 C 46 152, 34 150, 26 148 Z"
                        fill={INK}
                    />
                    <path d="M 70 144 C 80 140, 88 142, 92 146 L 78 150 Z" fill={INK} />
                    <path d="M 26 148 C 18 144, 14 138, 14 132 L 34 142 Z" fill={INK} />
                    <circle cx={84} cy={145.5} r={1.6} fill={WHITE} />
                </g>
            </g>
        )
    }
    if (slot === 1) {
        return (
            <g>
                <WisteriaDrape />
                <RibbonStrip color="plain" />
            </g>
        )
    }
    return (
        <Flip on={slot === 3}>
            <WisteriaDrape />
        </Flip>
    )
}

// ---------------------------------------------------------------------------
// May — Iris (eight-plank bridge animal, plain ribbon, 2 chaff)
// ---------------------------------------------------------------------------

function IrisStand(): React.ReactElement {
    const flower = (x: number, y: number): React.ReactElement => (
        <g key={`${x}-${y}`}>
            <path
                d={`M ${x} ${y} C ${x - 8} ${y - 8}, ${x - 8} ${y - 18}, ${x} ${y - 22} C ${x + 8} ${y - 18}, ${x + 8} ${y - 8}, ${x} ${y} Z`}
                fill={PURPLE}
                stroke={INK}
                strokeWidth={1.6}
            />
            <path
                d={`M ${x} ${y - 6} C ${x - 12} ${y - 2}, ${x - 14} ${y + 6}, ${x - 10} ${y + 10} C ${x - 4} ${y + 6}, ${x - 2} ${y}, ${x} ${y - 6} Z`}
                fill={PURPLE}
                stroke={INK}
                strokeWidth={1.6}
            />
            <path
                d={`M ${x} ${y - 6} C ${x + 12} ${y - 2}, ${x + 14} ${y + 6}, ${x + 10} ${y + 10} C ${x + 4} ${y + 6}, ${x + 2} ${y}, ${x} ${y - 6} Z`}
                fill={PURPLE}
                stroke={INK}
                strokeWidth={1.6}
            />
            <path d={`M ${x} ${y - 14} L ${x} ${y - 8}`} stroke={GOLD} strokeWidth={2.4} />
        </g>
    )
    return (
        <g>
            {[
                [34, 60],
                [66, 44],
                [92, 68],
            ].map(([x, y]) => (
                <g key={`${x}`}>
                    <path d={`M ${x} ${y} L ${x - 2} 150`} stroke={INK} strokeWidth={3} />
                    {flower(x, y)}
                </g>
            ))}
            <path
                d="M 20 150 C 30 96, 26 70, 18 52 M 48 150 C 58 108, 56 84, 50 66 M 82 150 C 90 116, 92 96, 86 82"
                fill="none"
                stroke={INK}
                strokeWidth={3.4}
                strokeLinecap="round"
            />
        </g>
    )
}

function IrisCard({ slot }: { slot: number }): React.ReactElement {
    if (slot === 0) {
        // The yatsuhashi zigzag plank bridge across the foreground.
        return (
            <g>
                <IrisStand />
                <g>
                    <path
                        d="M 6 142 L 74 132 L 78 146 L 10 156 Z"
                        fill={GOLD_PALE}
                        stroke={INK}
                        strokeWidth={2.5}
                    />
                    <path
                        d="M 52 152 L 116 140 L 119 154 L 56 166 Z"
                        fill={GOLD_PALE}
                        stroke={INK}
                        strokeWidth={2.5}
                    />
                    <path
                        d="M 24 145 L 24 158 M 44 142 L 44 155 M 72 148 L 72 161 M 96 144 L 96 157"
                        stroke={INK}
                        strokeWidth={2}
                    />
                </g>
            </g>
        )
    }
    if (slot === 1) {
        return (
            <g>
                <IrisStand />
                <RibbonStrip color="plain" />
            </g>
        )
    }
    return (
        <Flip on={slot === 3}>
            <IrisStand />
        </Flip>
    )
}

// ---------------------------------------------------------------------------
// June — Peony (butterflies animal, blue ribbon, 2 chaff)
// ---------------------------------------------------------------------------

function PeonyBlooms(): React.ReactElement {
    const bloom = (x: number, y: number, r: number): React.ReactElement => (
        <g key={`${x}-${y}`}>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                <ellipse
                    key={angle}
                    cx={x + r * 0.8 * Math.cos((angle * Math.PI) / 180)}
                    cy={y + r * 0.8 * Math.sin((angle * Math.PI) / 180)}
                    rx={r * 0.62}
                    ry={r * 0.44}
                    fill={RED}
                    stroke={RED_DEEP}
                    strokeWidth={1}
                    transform={`rotate(${angle} ${x + r * 0.8 * Math.cos((angle * Math.PI) / 180)} ${y + r * 0.8 * Math.sin((angle * Math.PI) / 180)})`}
                />
            ))}
            <circle cx={x} cy={y} r={r * 0.4} fill={GOLD} />
        </g>
    )
    return (
        <g>
            <path
                d="M 40 176 C 44 150, 42 132, 36 118 M 76 176 C 74 156, 78 140, 84 128"
                fill="none"
                stroke={INK}
                strokeWidth={3.4}
                strokeLinecap="round"
            />
            <path d="M 36 140 C 24 138, 16 144, 12 152 C 24 154, 32 150, 36 144 Z" fill={INK} />
            <path d="M 80 148 C 92 146, 102 150, 106 158 C 94 160, 84 156, 80 152 Z" fill={INK} />
            {bloom(38, 104, 15)}
            {bloom(86, 116, 13)}
        </g>
    )
}

function PeonyCard({ slot }: { slot: number }): React.ReactElement {
    if (slot === 0) {
        // A pair of gold butterflies above the blooms.
        const butterfly = (x: number, y: number, scale: number): React.ReactElement => (
            <g key={`${x}`} transform={`translate(${x} ${y}) scale(${scale})`}>
                <path
                    d="M 0 0 C -14 -12, -26 -8, -22 4 C -19 12, -8 10, 0 4 Z"
                    fill={GOLD}
                    stroke={INK}
                    strokeWidth={2}
                />
                <path
                    d="M 0 0 C 14 -12, 26 -8, 22 4 C 19 12, 8 10, 0 4 Z"
                    fill={GOLD}
                    stroke={INK}
                    strokeWidth={2}
                />
                <path
                    d="M -18 6 C -12 12, -4 12, 0 6 M 18 6 C 12 12, 4 12, 0 6"
                    fill={RED}
                    stroke={INK}
                    strokeWidth={1.4}
                />
                <ellipse cx={0} cy={3} rx={2.4} ry={6} fill={INK} />
                <path d="M -2 -3 L -6 -10 M 2 -3 L 6 -10" stroke={INK} strokeWidth={1.4} fill="none" />
            </g>
        )
        return (
            <g>
                <PeonyBlooms />
                {butterfly(58, 38, 1)}
                {butterfly(88, 66, 0.7)}
            </g>
        )
    }
    if (slot === 1) {
        return (
            <g>
                <PeonyBlooms />
                <RibbonStrip color="blue" />
            </g>
        )
    }
    return (
        <Flip on={slot === 3}>
            <PeonyBlooms />
        </Flip>
    )
}

// ---------------------------------------------------------------------------
// July — Clover (boar animal, plain ribbon, 2 chaff)
// ---------------------------------------------------------------------------

function CloverSprigs(): React.ReactElement {
    const sprig = (x: number, y: number, lean: number): React.ReactElement => (
        <g key={`${x}-${y}`}>
            <path
                d={`M ${x} ${y} C ${x + lean} ${y - 24}, ${x + lean * 2} ${y - 44}, ${x + lean * 2.4} ${y - 60}`}
                fill="none"
                stroke={INK}
                strokeWidth={2.6}
            />
            {[0.3, 0.55, 0.8].map((t) => (
                <g key={t}>
                    <ellipse
                        cx={x + lean * 2.4 * t - 6}
                        cy={y - 60 * t}
                        rx={6}
                        ry={4}
                        fill={RED_DEEP}
                        transform={`rotate(-30 ${x + lean * 2.4 * t - 6} ${y - 60 * t})`}
                    />
                    <ellipse
                        cx={x + lean * 2.4 * t + 6}
                        cy={y - 60 * t - 4}
                        rx={6}
                        ry={4}
                        fill={INK}
                        transform={`rotate(30 ${x + lean * 2.4 * t + 6} ${y - 60 * t - 4})`}
                    />
                </g>
            ))}
        </g>
    )
    return (
        <g>
            {sprig(26, 176, 8)}
            {sprig(56, 180, -4)}
            {sprig(88, 176, 6)}
        </g>
    )
}

function CloverCard({ slot }: { slot: number }): React.ReactElement {
    if (slot === 0) {
        // The boar bedded down among the clover.
        return (
            <g>
                <CloverSprigs />
                <g>
                    <path
                        d="M 18 108 C 20 86, 42 74, 64 78 C 84 82, 98 92, 100 104 C 102 116, 92 124, 78 124 L 34 124 C 24 122, 17 116, 18 108 Z"
                        fill={INK}
                    />
                    <path d="M 96 96 C 104 94, 110 98, 112 104 C 108 108, 100 108, 96 104 Z" fill={INK} />
                    <circle cx={98} cy={99} r={1.8} fill={WHITE} />
                    <path d="M 104 108 L 112 106" stroke={WHITE} strokeWidth={1.6} />
                    <path
                        d="M 36 124 L 36 132 M 56 124 L 56 132 M 76 124 L 76 132"
                        stroke={INK}
                        strokeWidth={3}
                    />
                    <path
                        d="M 30 92 C 40 84, 56 82, 68 86"
                        fill="none"
                        stroke={GOLD}
                        strokeWidth={1.6}
                        opacity={0.8}
                    />
                </g>
            </g>
        )
    }
    if (slot === 1) {
        return (
            <g>
                <CloverSprigs />
                <RibbonStrip color="plain" />
            </g>
        )
    }
    return (
        <Flip on={slot === 3}>
            <CloverSprigs />
        </Flip>
    )
}

// ---------------------------------------------------------------------------
// August — Pampas (moon bright, geese animal, 2 chaff)
// ---------------------------------------------------------------------------

function PampasHill({ withSky }: { withSky: boolean }): React.ReactElement {
    return (
        <g>
            {withSky && <rect x={4} y={4} width={CARD_W - 8} height={CARD_H - 8} rx={7} fill={RED_DEEP} />}
            <path d="M 4 128 C 34 104, 86 104, 116 128 L 116 188 L 4 188 Z" fill={INK} />
            {[16, 34, 52, 70, 88, 104].map((x) => (
                <path
                    key={x}
                    d={`M ${x} 128 C ${x + 4} 116, ${x + 2} 106, ${x + 8} 98`}
                    fill="none"
                    stroke={withSky ? GOLD_PALE : INK}
                    strokeWidth={2}
                    strokeLinecap="round"
                />
            ))}
        </g>
    )
}

function PampasCard({ slot }: { slot: number }): React.ReactElement {
    if (slot === 0) {
        // The full moon: huge white disc on a crimson sky over the black hill.
        return (
            <g>
                <PampasHill withSky />
                <circle cx={60} cy={62} r={34} fill={WHITE} stroke={GOLD} strokeWidth={2} />
            </g>
        )
    }
    if (slot === 1) {
        // Geese in flight across the dusk sky.
        const goose = (x: number, y: number, scale: number): React.ReactElement => (
            <path
                key={`${x}`}
                d={`M ${x} ${y} c ${-8 * scale} ${-7 * scale}, ${-16 * scale} ${-5 * scale}, ${-20 * scale} ${2 * scale} c ${7 * scale} ${-2 * scale}, ${13 * scale} ${-1 * scale}, ${20 * scale} ${2 * scale} c ${7 * scale} ${-3 * scale}, ${13 * scale} ${-4 * scale}, ${20 * scale} ${-2 * scale} c ${-4 * scale} ${-7 * scale}, ${-12 * scale} ${-9 * scale}, ${-20 * scale} ${-2 * scale} Z`}
                fill={INK}
            />
        )
        return (
            <g>
                <PampasHill withSky={false} />
                {goose(50, 40, 1)}
                {goose(80, 62, 0.8)}
                {goose(38, 74, 0.65)}
            </g>
        )
    }
    return (
        <Flip on={slot === 3}>
            <PampasHill withSky={false} />
            <path
                d="M 24 88 C 34 72, 34 56, 28 44 M 60 84 C 68 68, 68 54, 62 40 M 94 90 C 102 76, 102 62, 96 50"
                fill="none"
                stroke={INK}
                strokeWidth={2.4}
                strokeLinecap="round"
            />
        </Flip>
    )
}

// ---------------------------------------------------------------------------
// September — Chrysanthemum (sake cup animal, blue ribbon, 2 chaff)
// ---------------------------------------------------------------------------

function ChrysanthemumBed(): React.ReactElement {
    const mum = (x: number, y: number, r: number, fill: string): React.ReactElement => (
        <g key={`${x}-${y}`}>
            {Array.from({ length: 12 }, (_, i) => i * 30).map((angle) => (
                <ellipse
                    key={angle}
                    cx={x + r * 0.75 * Math.cos((angle * Math.PI) / 180)}
                    cy={y + r * 0.75 * Math.sin((angle * Math.PI) / 180)}
                    rx={r * 0.55}
                    ry={r * 0.2}
                    fill={fill}
                    stroke={INK}
                    strokeWidth={0.8}
                    transform={`rotate(${angle} ${x + r * 0.75 * Math.cos((angle * Math.PI) / 180)} ${y + r * 0.75 * Math.sin((angle * Math.PI) / 180)})`}
                />
            ))}
            <circle cx={x} cy={y} r={r * 0.3} fill={GOLD} />
        </g>
    )
    return (
        <g>
            <path d="M 34 176 L 38 128 M 78 176 L 74 132" stroke={INK} strokeWidth={3} />
            {mum(38, 116, 13, WHITE)}
            {mum(76, 122, 11, RED)}
            {mum(58, 148, 9, WHITE)}
        </g>
    )
}

function ChrysanthemumCard({ slot }: { slot: number }): React.ReactElement {
    if (slot === 0) {
        // The sake cup: red lacquer bowl, gold interior with the 寿 mark.
        return (
            <g>
                <ChrysanthemumBed />
                <g>
                    <ellipse
                        cx={60}
                        cy={54}
                        rx={34}
                        ry={13}
                        fill={GOLD_PALE}
                        stroke={INK}
                        strokeWidth={2.5}
                    />
                    <path
                        d="M 26 54 C 26 72, 40 82, 60 82 C 80 82, 94 72, 94 54 L 94 58 C 94 74, 80 86, 60 86 C 40 86, 26 74, 26 58 Z"
                        fill={RED}
                        stroke={INK}
                        strokeWidth={2.5}
                    />
                    <path
                        d="M 48 78 L 72 78 L 76 90 L 44 90 Z"
                        fill={RED_DEEP}
                        stroke={INK}
                        strokeWidth={2}
                    />
                    <path
                        d="M 52 50 L 68 50 M 60 44 L 60 62 M 53 58 L 67 58"
                        stroke={RED_DEEP}
                        strokeWidth={2.4}
                        strokeLinecap="round"
                    />
                </g>
            </g>
        )
    }
    if (slot === 1) {
        return (
            <g>
                <ChrysanthemumBed />
                <RibbonStrip color="blue" />
            </g>
        )
    }
    return (
        <Flip on={slot === 3}>
            <ChrysanthemumBed />
        </Flip>
    )
}

// ---------------------------------------------------------------------------
// October — Maple (deer animal, blue ribbon, 2 chaff)
// ---------------------------------------------------------------------------

function MapleLeaves(): React.ReactElement {
    const leaf = (x: number, y: number, scale: number, fill: string): React.ReactElement => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y}) scale(${scale})`}>
            <path
                d="M 0 -12 L 3 -4 L 11 -8 L 7 0 L 13 6 L 4 5 L 3 14 L 0 7 L -3 14 L -4 5 L -13 6 L -7 0 L -11 -8 L -3 -4 Z"
                fill={fill}
                stroke={RED_DEEP}
                strokeWidth={1}
            />
        </g>
    )
    return (
        <g>
            <path
                d="M 108 18 C 84 34, 60 38, 34 34 M 70 36 C 74 56, 68 74, 56 86"
                fill="none"
                stroke={INK}
                strokeWidth={4}
                strokeLinecap="round"
            />
            {leaf(36, 44, 1.1, RED)}
            {leaf(70, 48, 0.9, RED)}
            {leaf(54, 78, 1, GOLD)}
            {leaf(94, 34, 0.8, RED)}
        </g>
    )
}

function MapleCard({ slot }: { slot: number }): React.ReactElement {
    if (slot === 0) {
        // The deer, head turned back beneath the maple.
        return (
            <g>
                <MapleLeaves />
                <g>
                    <path
                        d="M 30 156 C 28 134, 40 118, 62 116 C 80 114, 94 122, 96 134 C 98 146, 90 154, 78 156 Z"
                        fill={GOLD}
                        stroke={INK}
                        strokeWidth={2.5}
                    />
                    <path
                        d="M 88 124 C 96 116, 98 106, 94 98 C 88 100, 82 108, 82 118 Z"
                        fill={GOLD}
                        stroke={INK}
                        strokeWidth={2.5}
                    />
                    <path
                        d="M 92 100 L 86 84 M 92 100 L 98 86 M 89 92 L 82 88 M 95 92 L 102 90"
                        stroke={INK}
                        strokeWidth={2.2}
                        fill="none"
                    />
                    <circle cx={90} cy={104} r={1.8} fill={INK} />
                    <path
                        d="M 40 156 L 40 170 M 56 156 L 56 170 M 72 156 L 74 170"
                        stroke={INK}
                        strokeWidth={2.6}
                    />
                    <circle cx={52} cy={132} r={2.4} fill={WHITE} />
                    <circle cx={64} cy={140} r={2.4} fill={WHITE} />
                </g>
            </g>
        )
    }
    if (slot === 1) {
        return (
            <g>
                <MapleLeaves />
                <RibbonStrip color="blue" />
            </g>
        )
    }
    return (
        <Flip on={slot === 3}>
            <MapleLeaves />
            <path
                d="M 30 130 C 50 122, 80 124, 98 136 M 24 158 C 48 148, 82 150, 102 164"
                fill="none"
                stroke={RED}
                strokeWidth={2}
                opacity={0.5}
            />
        </Flip>
    )
}

// ---------------------------------------------------------------------------
// November — Willow (rain man bright, swallow animal, plain ribbon,
// lightning chaff)
// ---------------------------------------------------------------------------

function WillowStrands(): React.ReactElement {
    return (
        <g>
            <path
                d="M 18 10 C 40 26, 54 24, 84 12"
                fill="none"
                stroke={INK}
                strokeWidth={5}
                strokeLinecap="round"
            />
            {[24, 44, 64, 84, 100].map((x, i) => (
                <path
                    key={x}
                    d={`M ${x} ${14 + i * 2} C ${x - 6} 60, ${x + 6} 110, ${x - 4} 156`}
                    fill="none"
                    stroke={i % 2 === 0 ? INK : GOLD}
                    strokeWidth={2.4}
                    strokeLinecap="round"
                />
            ))}
        </g>
    )
}

function WillowCard({ slot }: { slot: number }): React.ReactElement {
    if (slot === 0) {
        // The Rain Man (Ono no Michikaze) with umbrella, frog, and rain.
        return (
            <g>
                <WillowStrands />
                {[10, 34, 58, 82, 106].map((x) => (
                    <path
                        key={x}
                        d={`M ${x} 20 L ${x - 10} 60 M ${x + 4} 70 L ${x - 6} 110`}
                        stroke={BLUE}
                        strokeWidth={1.6}
                        opacity={0.7}
                    />
                ))}
                <g>
                    <path
                        d="M 20 84 C 34 68, 66 68, 80 84 L 50 86 Z"
                        fill={GOLD}
                        stroke={INK}
                        strokeWidth={2.4}
                    />
                    <path d="M 50 84 L 50 100" stroke={INK} strokeWidth={2.6} />
                    <path
                        d="M 34 100 C 34 92, 44 88, 52 90 C 62 92, 66 100, 64 112 C 62 126, 56 138, 48 144 C 38 138, 33 122, 34 100 Z"
                        fill={RED}
                        stroke={INK}
                        strokeWidth={2.4}
                    />
                    <circle cx={49} cy={97} r={6} fill={WHITE} stroke={INK} strokeWidth={2} />
                    <path d="M 40 144 L 38 156 M 54 142 L 56 154" stroke={INK} strokeWidth={2.6} />
                    <g>
                        <ellipse cx={92} cy={162} rx={9} ry={6} fill={GOLD} stroke={INK} strokeWidth={2} />
                        <circle cx={87} cy={158} r={1.4} fill={INK} />
                        <path d="M 84 168 L 82 172 M 98 168 L 101 172" stroke={INK} strokeWidth={2} />
                    </g>
                    <path d="M 12 176 L 108 176" stroke={BLUE} strokeWidth={3} opacity={0.7} />
                </g>
            </g>
        )
    }
    if (slot === 1) {
        // The swallow darting through the strands.
        return (
            <g>
                <WillowStrands />
                <g>
                    <path
                        d="M 40 96 C 52 88, 68 88, 78 96 C 70 99, 64 100, 60 106 C 54 101, 46 98, 40 96 Z"
                        fill={INK}
                    />
                    <path d="M 78 96 C 88 92, 96 94, 100 98 L 84 102 Z" fill={RED} />
                    <path d="M 40 96 C 30 92, 24 84, 24 76 L 34 84 L 30 74 L 42 88 Z" fill={INK} />
                    <circle cx={91} cy={97} r={1.6} fill={WHITE} />
                    <path d="M 60 106 L 56 118 M 60 106 L 66 116" stroke={INK} strokeWidth={2} />
                </g>
            </g>
        )
    }
    if (slot === 2) {
        return (
            <g>
                <WillowStrands />
                <RibbonStrip color="plain" />
            </g>
        )
    }
    // The lightning chaff: near-black card with gold storm zigzags.
    return (
        <g>
            <rect x={4} y={4} width={CARD_W - 8} height={CARD_H - 8} rx={7} fill={INK} />
            <path
                d="M 84 4 L 52 64 L 76 64 L 36 140 L 66 140 L 44 188"
                fill="none"
                stroke={GOLD}
                strokeWidth={7}
                strokeLinejoin="round"
            />
            <path
                d="M 108 40 C 92 52, 92 70, 104 80"
                fill="none"
                stroke={WHITE}
                strokeWidth={4}
                strokeLinecap="round"
            />
            <path
                d="M 14 96 C 26 104, 26 120, 16 130"
                fill="none"
                stroke={WHITE}
                strokeWidth={4}
                strokeLinecap="round"
            />
        </g>
    )
}

// ---------------------------------------------------------------------------
// December — Paulownia (phoenix bright, 3 chaff)
// ---------------------------------------------------------------------------

function PaulowniaCrown({ tall }: { tall: boolean }): React.ReactElement {
    const y = tall ? 150 : 132
    return (
        <g>
            {[
                { x: 32, s: 1 },
                { x: 62, s: 1.2 },
                { x: 92, s: 0.9 },
            ].map(({ x, s }) => (
                <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
                    <path d="M 0 0 C -16 -2, -24 8, -22 20 L 22 20 C 24 8, 16 -2, 0 0 Z" fill={INK} />
                    <path
                        d="M 0 -2 L 0 -26 M -8 -4 L -12 -22 M 8 -4 L 12 -22"
                        stroke={GOLD}
                        strokeWidth={2.4}
                        fill="none"
                    />
                    {[-12, 0, 12].map((dx) => (
                        <circle key={dx} cx={dx} cy={dx === 0 ? -28 : -24} r={3.2} fill={GOLD} />
                    ))}
                </g>
            ))}
        </g>
    )
}

function PaulowniaCard({ slot }: { slot: number }): React.ReactElement {
    if (slot === 0) {
        // The phoenix: gold body, red crest, sweeping tail.
        return (
            <g>
                <PaulowniaCrown tall />
                <g>
                    <path
                        d="M 30 96 C 38 74, 62 64, 82 72 C 96 78, 100 92, 92 102 C 84 110, 70 110, 62 104 C 56 112, 44 114, 34 108 Z"
                        fill={GOLD}
                        stroke={INK}
                        strokeWidth={2.5}
                    />
                    <path
                        d="M 82 72 C 88 62, 96 58, 104 60 C 100 66, 96 70, 92 74 Z"
                        fill={GOLD}
                        stroke={INK}
                        strokeWidth={2}
                    />
                    <path
                        d="M 96 58 L 92 46 M 100 59 L 102 46 M 104 62 L 110 52"
                        stroke={RED}
                        strokeWidth={2.6}
                        strokeLinecap="round"
                    />
                    <circle cx={96} cy={65} r={1.8} fill={INK} />
                    <path
                        d="M 34 108 C 18 116, 10 132, 12 148 C 22 138, 30 128, 40 122 M 44 112 C 34 126, 30 142, 34 156 C 42 144, 48 132, 54 124"
                        fill="none"
                        stroke={RED}
                        strokeWidth={3}
                        strokeLinecap="round"
                    />
                    <path d="M 52 84 C 60 78, 72 78, 80 84" fill="none" stroke={INK} strokeWidth={2} />
                </g>
            </g>
        )
    }
    return (
        <Flip on={slot === 2}>
            <PaulowniaCrown tall={false} />
            {slot === 3 ? (
                // The third chaff traditionally has a gold band ("December sky").
                <rect x={4} y={4} width={CARD_W - 8} height={40} fill={GOLD_PALE} opacity={0.85} />
            ) : (
                <path
                    d="M 24 40 C 44 30, 76 30, 96 40"
                    fill="none"
                    stroke={INK}
                    strokeWidth={2.4}
                    opacity={0.5}
                />
            )}
        </Flip>
    )
}
