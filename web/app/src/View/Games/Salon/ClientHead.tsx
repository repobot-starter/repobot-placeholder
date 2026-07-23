import React from "react"
import { Accessory, Client, DYE_SWATCHES, HairLength, HairLook, HairTexture } from "./clients"
import * as styles from "./SalonPage.styles.css"

export const HEAD_VIEW_WIDTH = 320
export const HEAD_VIEW_HEIGHT = 360

const INK = "#4a3b45"
const SHIRT = "#b7e0f2"
const CX = 160
const SIDE_LEFT = 88
const SIDE_RIGHT = 232
const SIDE_TOP = 150
const DOME_TOP = 76
const BOTTOM_BY_LENGTH: Record<HairLength, number> = { short: 222, medium: 272, long: 324 }

/** How many scrubs (mouse passes or clicks) pop one wash bubble. */
export const SCRUBS_TO_POP = 2

export interface Bubble {
    id: number
    x: number
    y: number
    r: number
    scrubs: number
}

export interface Stray {
    id: number
    x: number
    y: number
    direction: 1 | -1
    snipped: boolean
}

export interface Sparkle {
    id: number
    x: number
    y: number
    size: number
    delayMs: number
}

/** Soap bubbles scattered over the hair for the wash station. */
export function randomBubbles(): Bubble[] {
    return Array.from({ length: 10 }, (_, id) => ({
        id,
        x: 104 + Math.random() * 112,
        y: 94 + Math.random() * 116,
        r: 13 + Math.random() * 8,
        scrubs: 0,
    }))
}

/** 2-3 stray strands poking out of the freshly cut silhouette. */
export function randomStrays(length: HairLength): Stray[] {
    const bottom = BOTTOM_BY_LENGTH[length]
    const count = 2 + Math.floor(Math.random() * 2)
    return Array.from({ length: count }, (_, index) => {
        const direction: 1 | -1 = index % 2 === 0 ? 1 : -1
        return {
            id: index,
            x: direction === 1 ? SIDE_RIGHT : SIDE_LEFT,
            y: 155 + Math.random() * Math.max(20, bottom - 180),
            direction,
            snipped: false,
        }
    })
}

/** Shine-spritz sparkles; fresh ids each call so the twinkle restarts. */
export function randomSparkles(count: number): Sparkle[] {
    const stamp = Date.now()
    return Array.from({ length: count }, (_, index) => ({
        id: stamp + index,
        x: 70 + Math.random() * 180,
        y: 56 + Math.random() * 210,
        size: 14 + Math.random() * 14,
        delayMs: Math.random() * 500,
    }))
}

interface HairLobe {
    cx: number
    cy: number
    rx: number
    ry: number
}

interface Hairdo {
    /** Main silhouette path behind the face. */
    back: string
    /** Fringe path drawn over the forehead. */
    front: string
    /** Extra blobs: updo bun or braid beads. */
    lobes: HairLobe[]
}

// Crown of the hair, shared by every hairdo: (SIDE_LEFT, SIDE_TOP) over the
// top of the head to (SIDE_RIGHT, SIDE_TOP).
const DOME =
    ` C ${SIDE_LEFT} 96 118 ${DOME_TOP} ${CX} ${DOME_TOP}` +
    ` C 202 ${DOME_TOP} ${SIDE_RIGHT} 96 ${SIDE_RIGHT} ${SIDE_TOP}`

const FRINGE =
    "M 98 150 C 100 104 124 88 160 88 C 196 88 220 104 222 150" +
    " Q 208 120 184 114 Q 174 134 160 132 Q 146 134 136 114 Q 112 120 98 150 Z"

/** Vertical hair edge at `x`; curly scallops or wavy S-curves bulge `outward`. */
function texturedV(x: number, fromY: number, toY: number, texture: HairTexture, outward: number): string {
    if (texture !== "curly" && texture !== "waves") {
        return ` L ${x} ${toY}`
    }
    const step = texture === "curly" ? 20 : 36
    const amp = texture === "curly" ? 14 : 9
    const dir = fromY < toY ? 1 : -1
    let d = ""
    let y = fromY
    let flip = 1
    while (dir > 0 ? y < toY : y > toY) {
        const next = dir > 0 ? Math.min(y + step, toY) : Math.max(y - step, toY)
        const offset = texture === "waves" ? amp * outward * flip : amp * outward
        d += ` Q ${x + offset} ${(y + next) / 2} ${x} ${next}`
        flip = -flip
        y = next
    }
    return d
}

/** Bottom hair edge at height `y`, walking from `fromX` to `toX`. */
function texturedH(y: number, fromX: number, toX: number, texture: HairTexture): string {
    if (texture !== "curly" && texture !== "waves") {
        return ` Q ${CX} ${y + 16} ${toX} ${y}`
    }
    const step = texture === "curly" ? 22 : 40
    const amp = texture === "curly" ? 15 : 10
    const dir = fromX < toX ? 1 : -1
    let d = ""
    let x = fromX
    let flip = 1
    while (dir > 0 ? x < toX : x > toX) {
        const next = dir > 0 ? Math.min(x + step, toX) : Math.max(x - step, toX)
        const offset = texture === "waves" ? amp * flip : amp
        d += ` Q ${(x + next) / 2} ${y + offset} ${next} ${y}`
        flip = -flip
        x = next
    }
    return d
}

/** A short cap of hair hugging the head, used by updo and braids. */
function capPath(bottomY: number): string {
    return (
        `M ${SIDE_LEFT} ${bottomY} L ${SIDE_LEFT} ${SIDE_TOP}` +
        DOME +
        ` L ${SIDE_RIGHT} ${bottomY} Q ${CX} ${bottomY + 18} ${SIDE_LEFT} ${bottomY} Z`
    )
}

/** THE hair function: turns a {length, texture} pair into SVG shapes. */
export function buildHairdo(look: Pick<HairLook, "length" | "texture">): Hairdo {
    const { length, texture } = look
    if (texture === "updo") {
        const bunRadius = { short: 18, medium: 24, long: 30 }[length]
        return {
            back: capPath(196),
            front: FRINGE,
            lobes: [{ cx: CX, cy: 58, rx: bunRadius, ry: bunRadius * 0.85 }],
        }
    }
    if (texture === "braids") {
        const bottom = BOTTOM_BY_LENGTH[length]
        const lobes: HairLobe[] = []
        for (const side of [-1, 1] as const) {
            let index = 0
            for (let y = 208; y <= bottom; y += 24) {
                lobes.push({ cx: CX + side * 62 + side * (index % 2 === 0 ? 4 : -4), cy: y, rx: 12, ry: 14 })
                index += 1
            }
        }
        return { back: capPath(206), front: FRINGE, lobes }
    }
    const bottom = BOTTOM_BY_LENGTH[length]
    let d = `M ${SIDE_LEFT} ${bottom}`
    d += texturedV(SIDE_LEFT, bottom, SIDE_TOP, texture, -1)
    d += DOME
    d += texturedV(SIDE_RIGHT, SIDE_TOP, bottom, texture, 1)
    d += texturedH(bottom, SIDE_RIGHT, SIDE_LEFT, texture)
    return { back: d + " Z", front: FRINGE, lobes: [] }
}

// Zigzag tangle strands overlaid while the hair is still messy.
const TANGLES = [
    "M 100 120 l 14 10 l -10 12 l 16 9 l -12 12",
    "M 196 108 l -14 12 l 15 8 l -12 13 l 16 8",
    "M 92 210 l 12 14 l -14 10 l 13 14 l -11 12 l 14 12",
    "M 226 200 l -12 14 l 14 11 l -13 13 l 12 12 l -14 12",
    "M 148 90 l 12 10 l -14 8 l 12 10",
]

const ACCESSORY_GLYPHS: Record<
    Exclude<Accessory, "none">,
    { glyph: string; x: number; y: number; size: number }
> = {
    bow: { glyph: "🎀", x: 206, y: 122, size: 30 },
    flower: { glyph: "💐", x: 112, y: 122, size: 28 },
    clip: { glyph: "⭐", x: 200, y: 106, size: 24 },
    tiara: { glyph: "👑", x: 160, y: 72, size: 34 },
}

interface ClientHeadProps {
    client: Client
    look: HairLook
    /** 0 = freshly washed, 1 = just walked in off the street. */
    messiness: number
    /** Bump to replay the dye shimmer on the hair. */
    shimmerToken: number
    bubbles?: Bubble[]
    onScrub?: (id: number) => void
    strays?: Stray[]
    onSnip?: (id: number) => void
    sparkles?: Sparkle[]
}

/**
 * The client in the mirror: an SVG face plus hair built by `buildHairdo`.
 * Purely presentational — wash bubbles, stray strands, and sparkles are
 * passed in and interactions are reported through callbacks.
 */
export default function ClientHead(props: ClientHeadProps): React.ReactElement {
    const { client, look, messiness, shimmerToken, bubbles, onScrub, strays, onSnip, sparkles } = props
    const hairdo = buildHairdo(look)
    const dye = DYE_SWATCHES[look.color]
    // Dull, dry walk-in hair gradually regains its lustre as messiness drops.
    const dullness = { filter: `saturate(${1 - 0.5 * messiness}) brightness(${1 - 0.1 * messiness})` }
    const hairClass = shimmerToken > 0 ? styles.hairShimmer : undefined

    const hairShapes = (
        <>
            <path d={hairdo.back} fill={dye.fill} stroke={INK} strokeWidth={3} />
            {hairdo.lobes.map((lobe, index) => (
                <ellipse
                    key={index}
                    cx={lobe.cx}
                    cy={lobe.cy}
                    rx={lobe.rx}
                    ry={lobe.ry}
                    fill={dye.fill}
                    stroke={INK}
                    strokeWidth={3}
                />
            ))}
            <path
                d="M 112 124 Q 122 92 154 84"
                fill="none"
                stroke={dye.highlight}
                strokeWidth={10}
                strokeLinecap="round"
                opacity={0.75}
            />
        </>
    )

    return (
        <svg viewBox={`0 0 ${HEAD_VIEW_WIDTH} ${HEAD_VIEW_HEIGHT}`} className={styles.headSvg}>
            <g key={`back-${shimmerToken}`} className={hairClass} style={dullness}>
                {hairShapes}
            </g>

            <rect
                x={146}
                y={226}
                width={28}
                height={38}
                fill={client.skinTone}
                stroke={INK}
                strokeWidth={3}
            />
            <path
                d="M 104 322 Q 104 260 160 260 Q 216 260 216 322 Z"
                fill={SHIRT}
                stroke={INK}
                strokeWidth={3}
            />

            <ellipse cx={CX} cy={172} rx={62} ry={72} fill={client.skinTone} stroke={INK} strokeWidth={3} />
            {([-1, 1] as const).map((side) => (
                <g key={side}>
                    <path
                        d={`M ${CX + side * 24 - 10} 150 Q ${CX + side * 24} 144 ${CX + side * 24 + 10} 150`}
                        fill="none"
                        stroke={INK}
                        strokeWidth={3}
                        strokeLinecap="round"
                    />
                    <ellipse
                        cx={CX + side * 24}
                        cy={166}
                        rx={9}
                        ry={10}
                        fill="#ffffff"
                        stroke={INK}
                        strokeWidth={2}
                    />
                    <circle cx={CX + side * 24} cy={168} r={4.5} fill={client.eyeColor} />
                    <circle cx={CX + side * 24 - 2} cy={165} r={1.6} fill="#ffffff" />
                    <circle cx={CX + side * 32} cy={192} r={7} fill="#f7a8bd" opacity={0.5} />
                </g>
            ))}
            <path
                d="M 160 176 q 4 8 -2 12"
                fill="none"
                stroke={INK}
                strokeWidth={2.5}
                strokeLinecap="round"
            />
            {client.smile === "wide" ? (
                <path d="M 140 198 Q 160 222 180 198 Q 160 208 140 198 Z" fill="#a3505f" />
            ) : (
                <path
                    d="M 146 200 Q 160 211 174 200"
                    fill="none"
                    stroke={INK}
                    strokeWidth={3}
                    strokeLinecap="round"
                />
            )}

            <g key={`front-${shimmerToken}`} className={hairClass} style={dullness}>
                <path d={hairdo.front} fill={dye.fill} stroke={INK} strokeWidth={3} />
            </g>

            {messiness > 0.02 ? (
                <g
                    opacity={messiness}
                    stroke="rgba(0, 0, 0, 0.35)"
                    strokeWidth={3}
                    fill="none"
                    strokeLinejoin="round"
                >
                    {TANGLES.map((d) => (
                        <path key={d} d={d} />
                    ))}
                </g>
            ) : null}

            {messiness > 0.45 ? (
                client.debris === "leaf" ? (
                    <text x={204} y={152} fontSize={24} textAnchor="middle">
                        🍂
                    </text>
                ) : (
                    <g>
                        <circle cx={120} cy={198} r={9} fill="#ff8fc0" stroke={INK} strokeWidth={2} />
                        <circle cx={117} cy={195} r={2.5} fill="#ffffff" opacity={0.8} />
                    </g>
                )
            ) : null}

            {look.accessory !== "none" ? (
                <text
                    x={ACCESSORY_GLYPHS[look.accessory].x}
                    y={ACCESSORY_GLYPHS[look.accessory].y}
                    fontSize={ACCESSORY_GLYPHS[look.accessory].size}
                    textAnchor="middle"
                >
                    {ACCESSORY_GLYPHS[look.accessory].glyph}
                </text>
            ) : null}

            {strays?.map((stray) => {
                const strand =
                    `M ${stray.x} ${stray.y}` +
                    ` q ${12 * stray.direction} -10 ${26 * stray.direction} -6` +
                    ` q ${10 * stray.direction} 2 ${16 * stray.direction} 10`
                return (
                    <g
                        key={stray.id}
                        className={stray.snipped ? styles.straySnipped : styles.stray}
                        onClick={stray.snipped ? undefined : () => onSnip?.(stray.id)}
                    >
                        <path
                            d={strand}
                            fill="none"
                            stroke={dye.fill}
                            strokeWidth={4}
                            strokeLinecap="round"
                        />
                        <path d={strand} fill="none" stroke="transparent" strokeWidth={20} />
                        {!stray.snipped ? (
                            <text
                                x={stray.x + 36 * stray.direction}
                                y={stray.y - 10}
                                fontSize={20}
                                textAnchor="middle"
                                className={styles.strayScissors}
                            >
                                ✂️
                            </text>
                        ) : null}
                    </g>
                )
            })}

            {bubbles?.map((bubble) => {
                const r = bubble.r * (1 - 0.2 * bubble.scrubs)
                return (
                    <g
                        key={bubble.id}
                        className={styles.bubble}
                        onMouseEnter={() => onScrub?.(bubble.id)}
                        onClick={() => onScrub?.(bubble.id)}
                    >
                        <circle
                            cx={bubble.x}
                            cy={bubble.y}
                            r={r}
                            fill="rgba(214, 242, 255, 0.8)"
                            stroke="#8fcdea"
                            strokeWidth={2}
                        />
                        <circle
                            cx={bubble.x - r / 3}
                            cy={bubble.y - r / 3}
                            r={r / 4}
                            fill="#ffffff"
                            opacity={0.9}
                        />
                    </g>
                )
            })}

            {sparkles?.map((sparkle) => (
                <text
                    key={sparkle.id}
                    x={sparkle.x}
                    y={sparkle.y}
                    fontSize={sparkle.size}
                    fill="#ffd76e"
                    textAnchor="middle"
                    className={styles.sparkleStar}
                    style={{ animationDelay: `${sparkle.delayMs}ms` }}
                >
                    ✦
                </text>
            ))}
        </svg>
    )
}
