import {
    Button,
    Label,
    Select,
    marketingPresetNames,
    type LandingConfig,
    type MarketingPresetName,
} from "@ui"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { fixtureBlueprintConfig, fixturePages, showcaseConfig } from "./fixtures"
import * as styles from "./MarketingGalleryPage.styles.css"

/**
 * Live gallery for the landing kernel's marketing presets — the marketing
 * sibling of /theme. Every view renders through the real `LandingRenderer`,
 * so what you see is exactly what a generated site ships: the showcase page
 * wears real-looking copy (presets can't be judged on lorem), and the
 * blueprint views show the untouched skeletons a fresh project starts from.
 *
 * Compare mode puts all presets side by side; the override knobs write
 * `--marketing-*` variables through `LandingConfig.style.overrides` — the
 * same mechanism agents use — and the JSON readout below them is
 * copy-paste-ready for a page config. Iterating on a preset itself?
 * Edit web/design-system/src/marketing/theme/marketingTheme.css.ts and this
 * page hot-reloads.
 */

/** Design-space width each preview renders at before scaling to its tile. */
const PREVIEW_WIDTH = 1280
/** How much page (in design pixels) a compare tile shows — hero through proof. */
const PREVIEW_HEIGHT = 1900

const GALLERY_PAGE_OPTIONS = [
    { value: "showcase", label: "Showcase (rich copy)" },
    ...fixturePages.map((page) => ({
        value: page.id,
        label: `Blueprint: ${page.blueprint}`,
    })),
]

const FONT_OPTIONS = [
    { value: "", label: "Preset default" },
    { value: "'Inter', ui-sans-serif, system-ui, sans-serif", label: "Inter" },
    { value: "'Manrope', ui-sans-serif, system-ui, sans-serif", label: "Manrope" },
    { value: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif", label: "Space Grotesk" },
    { value: "'Source Serif 4', ui-serif, Georgia, serif", label: "Source Serif 4" },
    { value: "'IBM Plex Mono', ui-monospace, monospace", label: "IBM Plex Mono" },
]

/** Dark text on light accents, light text on dark ones (WCAG-ish luminance cut). */
function contrastText(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 150 ? "#15171e" : "#ffffff"
}

function isPresetName(value: string | null): value is MarketingPresetName {
    return marketingPresetNames.includes(value as MarketingPresetName)
}

/**
 * A whole marketing page scaled into a tile: rendered at desktop width,
 * shrunk with a transform to the measured tile width. Inert on purpose —
 * clicking anywhere on the tile selects the preset instead.
 */
function ScaledPreview({ config }: { config: LandingConfig }): React.ReactElement {
    const viewportRef = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(0.3)
    useEffect(() => {
        const viewport = viewportRef.current
        if (viewport === null) {
            return
        }
        const measure = (): void => setScale(viewport.clientWidth / PREVIEW_WIDTH)
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(viewport)
        return () => observer.disconnect()
    }, [])
    return (
        <div
            ref={viewportRef}
            className={styles.previewViewport}
            style={{ height: `${Math.round(PREVIEW_HEIGHT * scale)}px` }}
        >
            <div
                className={styles.previewCanvas}
                style={{ width: `${PREVIEW_WIDTH}px`, transform: `scale(${scale})` }}
            >
                <LandingRenderer config={config} leadStorageKey="marketing-gallery-lead" />
            </div>
        </div>
    )
}

export default function MarketingGalleryPage(): React.ReactElement {
    const [searchParams, setSearchParams] = useSearchParams()
    const pageParam = searchParams.get("page")
    const galleryPage = GALLERY_PAGE_OPTIONS.some((option) => option.value === pageParam)
        ? (pageParam as string)
        : "showcase"
    const presetParam = searchParams.get("preset")
    const preset: MarketingPresetName = isPresetName(presetParam) ? presetParam : "soft-saas"
    const compare = searchParams.get("view") !== "single"

    const setParams = (updates: Record<string, string>): void => {
        const next = new URLSearchParams(searchParams)
        for (const [key, value] of Object.entries(updates)) {
            next.set(key, value)
        }
        setSearchParams(next, { replace: true })
    }

    // Override knobs — kept out of the URL: they're a scratchpad, and the
    // JSON readout below is the take-away.
    const [accent, setAccent] = useState<string | undefined>(undefined)
    const [displayFont, setDisplayFont] = useState("")
    const [washOff, setWashOff] = useState(false)

    const overrides = useMemo(() => {
        const entries: Record<string, string> = {}
        if (accent !== undefined) {
            entries["--marketing-color-accent"] = accent
            entries["--marketing-color-onAccent"] = contrastText(accent)
            entries["--marketing-color-accentSoft"] = `color-mix(in srgb, ${accent} 16%, transparent)`
        }
        if (displayFont !== "") {
            entries["--marketing-font-display"] = displayFont
        }
        if (washOff) {
            entries["--marketing-background-page"] = "none"
        }
        return Object.keys(entries).length > 0 ? entries : undefined
    }, [accent, displayFont, washOff])

    const configFor = (presetName: MarketingPresetName): LandingConfig => {
        if (galleryPage === "showcase") {
            return showcaseConfig(presetName, overrides)
        }
        const page = fixturePages.find((entry) => entry.id === galleryPage) ?? fixturePages[0]!
        return fixtureBlueprintConfig(page, presetName, overrides)
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Marketing presets</h1>
                    <p className={styles.subtitle}>
                        Every tile is the real landing kernel — pick a page, compare presets, and tune
                        overrides. App-side tokens live at <a href="/theme">/theme</a>.
                    </p>
                </div>
                <div className={styles.controls}>
                    <div className={styles.controlStack}>
                        <Label htmlFor="gallery-page">Page</Label>
                        <Select
                            id="gallery-page"
                            value={galleryPage}
                            onValueChange={(value) => setParams({ page: value })}
                            options={GALLERY_PAGE_OPTIONS}
                        />
                    </div>
                    <div className={styles.controlStack}>
                        <Label htmlFor="gallery-view">View</Label>
                        <Select
                            id="gallery-view"
                            value={compare ? "compare" : "single"}
                            onValueChange={(value) => setParams({ view: value })}
                            options={[
                                { value: "compare", label: "Compare all" },
                                { value: "single", label: "Single preset" },
                            ]}
                        />
                    </div>
                    {!compare && (
                        <div className={styles.controlStack}>
                            <Label htmlFor="gallery-preset">Preset</Label>
                            <Select
                                id="gallery-preset"
                                value={preset}
                                onValueChange={(value) => setParams({ preset: value })}
                                options={marketingPresetNames.map((name) => ({
                                    value: name,
                                    label: name,
                                }))}
                            />
                        </div>
                    )}
                    <div className={styles.controlStack}>
                        <Label htmlFor="gallery-accent">Accent</Label>
                        <div className={styles.inlineControl}>
                            <input
                                id="gallery-accent"
                                className={styles.colorInput}
                                type="color"
                                value={accent ?? "#635bff"}
                                onChange={(event) => setAccent(event.target.value)}
                            />
                            {accent !== undefined && (
                                <Button variant="ghost" size="sm" onClick={() => setAccent(undefined)}>
                                    Reset
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className={styles.controlStack}>
                        <Label htmlFor="gallery-font">Display font</Label>
                        <Select
                            id="gallery-font"
                            value={displayFont}
                            onValueChange={setDisplayFont}
                            options={FONT_OPTIONS}
                        />
                    </div>
                    <div className={styles.controlStack}>
                        <Label htmlFor="gallery-wash">Page wash</Label>
                        <Select
                            id="gallery-wash"
                            value={washOff ? "off" : "preset"}
                            onValueChange={(value) => setWashOff(value === "off")}
                            options={[
                                { value: "preset", label: "Preset default" },
                                { value: "off", label: "None" },
                            ]}
                        />
                    </div>
                </div>
                {overrides !== undefined && (
                    <div className={styles.overridesReadout}>
                        <span className={styles.overridesLabel}>
                            style.overrides — paste into a LandingConfig:
                        </span>
                        <pre className={styles.overridesJson}>{JSON.stringify(overrides, null, 2)}</pre>
                    </div>
                )}
            </header>
            {compare ? (
                <div className={styles.compareGrid}>
                    {marketingPresetNames.map((name) => (
                        <button
                            key={name}
                            type="button"
                            className={styles.compareTile}
                            onClick={() => setParams({ preset: name, view: "single" })}
                            title={`Open ${name} full size`}
                        >
                            <span className={styles.tileLabel}>{name}</span>
                            <ScaledPreview config={configFor(name)} />
                        </button>
                    ))}
                </div>
            ) : (
                <div className={styles.singleFrame}>
                    <LandingRenderer config={configFor(preset)} leadStorageKey="marketing-gallery-lead" />
                </div>
            )}
        </div>
    )
}
