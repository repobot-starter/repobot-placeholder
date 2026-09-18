import React from "react"
import { grainTile, marketing } from "./theme/marketingTheme.css"

/**
 * Seeded generative mark — the kernel's answer to stock icons. Generic
 * feather-stroke icons and raw emoji read as template filler and cheapen a
 * layout; a glyph is a small abstract geometric composition derived
 * deterministically from its seed (usually the feature or card title), so
 * every item gets a unique, custom-artwork mark with zero assets. Colors
 * ride the marketing tokens, so glyphs follow the preset and the customer
 * brand automatically.
 *
 * The seed fully determines the drawing: same seed, same mark, on every
 * render and every deploy — glyphs are stable brand elements, not
 * decoration that reshuffles.
 */

/** FNV-1a over the seed; all composition choices derive from this. */
function hashSeed(seed: string): number {
    let hash = 0x811c9dc5
    for (let index = 0; index < seed.length; index += 1) {
        hash ^= seed.charCodeAt(index)
        hash = Math.imul(hash, 0x01000193)
    }
    return hash >>> 0
}

interface GlyphInk {
    accent: string
    soft: string
    line: string
}

/** Each motif draws in a 48x48 box; `pick` selects secondary geometry. */
type Motif = (ink: GlyphInk, pick: number) => React.ReactElement

const STROKE = 2.6

const motifs: Motif[] = [
    // Orbits: nested rings with a satellite dot on the outer path.
    (ink, pick) => {
        const angle = (pick % 8) * (Math.PI / 4)
        const dotX = 24 + Math.cos(angle) * 16
        const dotY = 24 + Math.sin(angle) * 16
        return (
            <>
                <circle cx={24} cy={24} r={16} fill="none" stroke={ink.line} strokeWidth={STROKE} />
                <circle cx={24} cy={24} r={8} fill={ink.soft} stroke={ink.accent} strokeWidth={STROKE} />
                <circle cx={dotX} cy={dotY} r={4.5} fill={ink.accent} />
            </>
        )
    },
    // Arcs: three nested quarter-sweeps radiating from a corner.
    (ink, pick) => {
        const flip = pick % 2 === 0
        const transform = flip ? undefined : "scale(-1,1) translate(-48,0)"
        return (
            <g transform={transform}>
                <path
                    d="M8 40 A32 32 0 0 1 40 8"
                    fill="none"
                    stroke={ink.accent}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                />
                <path
                    d="M8 29 A21 21 0 0 1 29 8"
                    fill="none"
                    stroke={ink.line}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                />
                <path
                    d="M8 18 A10 10 0 0 1 18 8"
                    fill="none"
                    stroke={ink.accent}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                />
                <circle cx={11} cy={37} r={3.5} fill={ink.accent} />
            </g>
        )
    },
    // Bloom: four overlapping petal discs around the center.
    (ink, pick) => {
        const rotate = (pick % 4) * 45
        return (
            <g transform={`rotate(${rotate} 24 24)`}>
                <circle cx={24} cy={15} r={9} fill={ink.soft} stroke={ink.accent} strokeWidth={2} />
                <circle cx={33} cy={24} r={9} fill="none" stroke={ink.line} strokeWidth={2} />
                <circle cx={24} cy={33} r={9} fill="none" stroke={ink.line} strokeWidth={2} />
                <circle cx={15} cy={24} r={9} fill="none" stroke={ink.accent} strokeWidth={2} />
                <circle cx={24} cy={24} r={3} fill={ink.accent} />
            </g>
        )
    },
    // Bars: three rounded strokes of stepped length, rotated as a group.
    (ink, pick) => {
        const rotate = pick % 2 === 0 ? 0 : 90
        return (
            <g transform={`rotate(${rotate} 24 24)`}>
                <line
                    x1={12}
                    y1={36}
                    x2={12}
                    y2={22}
                    stroke={ink.line}
                    strokeWidth={5}
                    strokeLinecap="round"
                />
                <line
                    x1={24}
                    y1={36}
                    x2={24}
                    y2={12}
                    stroke={ink.accent}
                    strokeWidth={5}
                    strokeLinecap="round"
                />
                <line
                    x1={36}
                    y1={36}
                    x2={36}
                    y2={17}
                    stroke={ink.line}
                    strokeWidth={5}
                    strokeLinecap="round"
                />
                <circle cx={36} cy={10} r={3.5} fill={ink.accent} />
            </g>
        )
    },
    // Stack: three rounded squares stepping along the diagonal.
    (ink, pick) => {
        const flip = pick % 2 === 0
        const transform = flip ? undefined : "scale(-1,1) translate(-48,0)"
        return (
            <g transform={transform}>
                <rect
                    x={6}
                    y={6}
                    width={20}
                    height={20}
                    rx={6}
                    fill="none"
                    stroke={ink.line}
                    strokeWidth={STROKE}
                />
                <rect
                    x={14}
                    y={14}
                    width={20}
                    height={20}
                    rx={6}
                    fill={ink.soft}
                    stroke={ink.accent}
                    strokeWidth={STROKE}
                />
                <rect
                    x={22}
                    y={22}
                    width={20}
                    height={20}
                    rx={6}
                    fill="none"
                    stroke={ink.accent}
                    strokeWidth={STROKE}
                />
            </g>
        )
    },
    // Wave: two offset flowing paths under a rising dot.
    (ink, pick) => {
        const dotX = 12 + (pick % 3) * 12
        return (
            <>
                <path
                    d="M6 28c6-8 12-8 18 0s12 8 18 0"
                    fill="none"
                    stroke={ink.accent}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                />
                <path
                    d="M6 38c6-8 12-8 18 0s12 8 18 0"
                    fill="none"
                    stroke={ink.line}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                />
                <circle cx={dotX} cy={13} r={4.5} fill={ink.accent} />
            </>
        )
    },
    // Field: a dot lattice with one accent disc breaking the grid.
    (ink, pick) => {
        const highlight = pick % 9
        const dots: React.ReactElement[] = []
        for (let row = 0; row < 3; row += 1) {
            for (let column = 0; column < 3; column += 1) {
                const index = row * 3 + column
                const cx = 12 + column * 12
                const cy = 12 + row * 12
                dots.push(
                    index === highlight ? (
                        <circle key={index} cx={cx} cy={cy} r={6} fill={ink.accent} />
                    ) : (
                        <circle key={index} cx={cx} cy={cy} r={2.5} fill={ink.line} />
                    ),
                )
            }
        }
        return <>{dots}</>
    },
    // Shard: a rounded wedge with a counterweight disc.
    (ink, pick) => {
        const rotate = (pick % 4) * 90
        return (
            <g transform={`rotate(${rotate} 24 24)`}>
                <path
                    d="M12 38 L12 16 Q12 10 18 12 L36 20 Q41 22 37 26 L18 41 Q12 45 12 38 Z"
                    fill={ink.soft}
                    stroke={ink.accent}
                    strokeWidth={STROKE}
                    strokeLinejoin="round"
                />
                <circle cx={36} cy={11} r={4.5} fill={ink.accent} />
            </g>
        )
    },
]

export interface MarketingGlyphProps {
    /** Determines the drawing; use the item's title so marks stay stable. */
    seed: string
    size?: number
    /**
     * Ink override for surfaces outside the marketing theme (bespoke pack
     * pages with their own palettes). Defaults to the marketing tokens, so
     * marketing-section callers never pass it.
     */
    ink?: { accent: string; soft: string; line: string }
}

export function MarketingGlyph({
    seed,
    size = 48,
    ink: inkOverride,
}: MarketingGlyphProps): React.ReactElement {
    const hash = hashSeed(seed)
    const motif = motifs[hash % motifs.length]!
    const pick = Math.floor(hash / motifs.length)
    const ink: GlyphInk = inkOverride ?? {
        accent: marketing.color.accent,
        soft: marketing.color.accentSoft,
        line: marketing.color.line,
    }
    return (
        <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" focusable="false">
            {motif(ink, pick)}
        </svg>
    )
}

// --------------------------------------------------------------- art panel

/**
 * Full-bleed generative artwork for media-sized slots — the panel-scale
 * counterpart to the icon-scale glyph. A small mark centered on a tinted
 * rectangle reads as a placeholder at media size, so the panel is instead a
 * dense iridescent gradient field in the same visual language as the
 * backdrop art (MarketingBackdrop): accent-led blooms with two companion
 * hues over a graded ground, a diagonal sheen, film grain on top. The seed
 * picks the bloom layout, companion pair, and grade angle, so every item
 * gets its own composition while the whole page stays in one palette.
 * Deterministic per seed, accent-keyed through the marketing tokens, zero
 * assets.
 */

/** Ellipse geometry for the three blooms, seed-picked as a set. */
const BLOOM_LAYOUTS: readonly [string, string, string][] = [
    ["120% 95% at 14% 6%", "95% 85% at 88% 30%", "110% 95% at 50% 112%"],
    ["120% 95% at 86% 4%", "100% 90% at 6% 48%", "110% 100% at 68% 114%"],
    ["115% 90% at 50% -12%", "95% 90% at -6% 82%", "100% 90% at 106% 74%"],
    ["120% 100% at 18% 112%", "95% 85% at 92% 88%", "110% 90% at 72% -16%"],
]

/**
 * Companion hues, blended with the accent so the pair stays on brand
 * whatever the customer's accent is (same anchors the presets use).
 */
const COMPANIONS: readonly [string, string][] = [
    ["#38bdf8", "#f472b6"], // sky / pink — theme-exempt: art-directed hue anchors, blended toward the accent
    ["#8b5cf6", "#fb923c"], // violet / amber — theme-exempt: art-directed hue anchors, blended toward the accent
    ["#22d3ee", "#a78bfa"], // cyan / lavender — theme-exempt: art-directed hue anchors, blended toward the accent
    ["#f472b6", "#fbbf24"], // pink / gold — theme-exempt: art-directed hue anchors, blended toward the accent
]

export interface MarketingArtPanelProps {
    /** Determines the composition; use the item's title so art stays stable. */
    seed: string
    /** Panel geometry (border, radius, margins) from the section's media class. */
    className?: string
    /** CSS aspect-ratio; the default suits landscape media slots. */
    ratio?: string
}

export function MarketingArtPanel({
    seed,
    className,
    ratio = "8 / 5",
}: MarketingArtPanelProps): React.ReactElement {
    // Distinct hash domain from the icon glyph so an item's panel art and
    // small mark vary independently.
    const hash = hashSeed(`panel::${seed}`)
    const layout = BLOOM_LAYOUTS[hash % BLOOM_LAYOUTS.length]!
    const [companionA, companionB] = COMPANIONS[(hash >>> 2) % COMPANIONS.length]!
    const angle = 128 + ((hash >>> 4) % 6) * 17
    const accent = marketing.color.accent
    const surface = marketing.color.surface
    // Companions are pulled toward the accent before fading to transparent,
    // so the field reads as one brand palette rather than three colors.
    const hueA = `color-mix(in srgb, color-mix(in srgb, ${companionA} 70%, ${accent}) 62%, transparent)`
    const hueB = `color-mix(in srgb, color-mix(in srgb, ${companionB} 70%, ${accent}) 52%, transparent)`
    const lead = `color-mix(in srgb, ${accent} 80%, transparent)`
    // The ground stays close to the surface color — the blooms carry the
    // color. A stronger accent grade here muddies dark presets (yellow into
    // navy reads khaki).
    const backgroundImage = [
        grainTile,
        `linear-gradient(${angle}deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0) 42%)`,
        `radial-gradient(${layout[0]}, ${lead}, transparent 64%)`,
        `radial-gradient(${layout[1]}, ${hueA}, transparent 62%)`,
        `radial-gradient(${layout[2]}, ${hueB}, transparent 66%)`,
        `linear-gradient(${angle}deg, color-mix(in srgb, ${accent} 14%, ${surface}), ${surface})`,
    ].join(", ")
    return (
        <div
            className={className}
            style={{ width: "100%", aspectRatio: ratio, backgroundImage, display: "block" }}
            aria-hidden
        />
    )
}
