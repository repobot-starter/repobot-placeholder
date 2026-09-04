import { contrastText, mixHex } from "../../theme/themeConfig"

/**
 * The marketing preset definitions and their brand/font overlay math, as a
 * plain runtime module. The static build (marketingTheme.css.ts) bakes
 * these into vanilla-extract theme classes; the live path
 * (themeHotUpdate.ts) re-runs the same resolution against an edited
 * repobot.theme.json and re-declares the brand-dependent variables over
 * the stale classes — one resolution, two consumers, so the preview can
 * never drift from what a rebuild would produce.
 *
 * (This cannot live in the .css.ts: vanilla-extract serializes that
 * module's exports at build time, and the per-preset `shadowCta` /
 * `backgroundPage` functions don't survive serialization.)
 */

/**
 * Style presets. Append-only: names are public vocabulary shared with the
 * setup architect — never rename or remove one that has shipped.
 */
export type MarketingPresetName =
    | "dark-dev"
    | "soft-saas"
    | "editorial"
    | "brutalist"
    | "warm-boutique"
    | "mono-utility"
    | "aurora-dark"
    | "luxe-light"
    | "atelier"
    | "heirloom"
    | "tourbook"
    | "monolith"
    | "lanternlight"
    | "sitework"
    | "brownstone"
    | "marquee"
    | "ballroom"
    | "picnic"
    | "chalk"
    | "hymnal"
    | "broadside"
    | "crt"
    | "handheld"
    | "lounge"
    | "retroware"

/** The two appearances every preset ships (theme contract `mode` picks). */
export type MarketingMode = "light" | "dark"

/**
 * A register's movement idiom — the ambition axis remix and section motion
 * read. `still` pages don't perform; `drift` washes breathe; `kinetic`
 * elements travel (marquees, filmstrips, tilts); `sweep` adds directed
 * light/beam movement. Lands on the page root as `data-marketing-motion`
 * so section styles opt in per idiom, and in the design manifest so the
 * platform can derive a register's energy.
 */
export type MarketingMotionIdiom = "still" | "drift" | "kinetic" | "sweep"

/**
 * Surface-treatment flags — the signatures a register wears beyond palette
 * and shape. Lands on the page root as a space-separated
 * `data-marketing-treatment` (target with `~=`), and in the design
 * manifest. `grain`: film-grain as identity, not just banding control;
 * `glow`: accent light blooms; `outline`: stroke-only display letterforms;
 * `hairline`: razor-thin frames instead of shadow elevation; `tilt`:
 * scrapbook rotation on media clusters; `scanline`: the CRT raster as a
 * fixed overlay of 1px rows in the register's own ink; `pixel`: a dithered
 * checker wash — the shading a four-shade LCD could actually do.
 */
export type MarketingTreatmentFlag = "grain" | "glow" | "outline" | "hairline" | "tilt" | "scanline" | "pixel"

// Font stacks mirror the self-hosted `repobot.theme.json` presets
// (see web/design-system/src/theme/themeConfig.ts FONT_PRESETS and
// web/app/src/fonts.css); every family degrades to a platform stack.
const SANS_FALLBACK = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
const SERIF_FALLBACK = "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif"
const MONO_FALLBACK = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace"
const INTER = `'Inter', ${SANS_FALLBACK}`
const MANROPE = `'Manrope', ${SANS_FALLBACK}`
const SOURCE_SERIF = `'Source Serif 4', ${SERIF_FALLBACK}`
const SPACE_GROTESK = `'Space Grotesk', ${SANS_FALLBACK}`
const PLEX_MONO = `'IBM Plex Mono', ${MONO_FALLBACK}`
const FRAUNCES = `'Fraunces', ${SERIF_FALLBACK}`
// Platform-native chrome stack (nothing to self-host): Tahoma/Verdana are
// the OS-dialog faces the retroware register's whole read depends on —
// they ship on every desktop platform and degrade to the sans stack.
const CHROME_SANS = `Tahoma, Verdana, Geneva, ${SANS_FALLBACK}`

/**
 * Film-grain tile (inline SVG turbulence): layered over large gradient
 * washes it kills banding and reads as printed texture instead of a screen
 * gradient. Opacity lives inside the SVG so the tile composites safely on
 * any wash; 160px repeat is small enough to stay non-directional.
 */
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E")`

/** The grain tile, shared with the backdrop art layers (MarketingBackdrop). */
export const grainTile = GRAIN

export interface PresetPalette {
    pageBg: string
    surface: string
    line: string
    text: string
    subtle: string
    /** The preset's art-direction accent; the customer brand wins over it. */
    accent: string
}

/**
 * One appearance of a preset: everything that must be re-authored when the
 * page ground flips between light and dark. Type, shape metrics, and layout
 * stay shared across modes — they ARE the preset; the palette, elevation
 * language, and wash are per-mode surface treatments.
 */
export interface PresetModeVariant {
    palette: PresetPalette
    shadowCard: string
    /** Receives the resolved accent for glow-style shadows. */
    shadowCta: (accent: string) => string
    /** Receives the resolved accent so page washes stay on brand. */
    backgroundPage: (accent: string) => string
}

export interface PresetDefinition {
    /**
     * The mode this preset's art direction was authored in — its lean.
     * Packs that pin a preset stamp this as the theme contract's `mode` at
     * compose time, so a fresh project opens in the preset's native
     * appearance; the Feel appearance toggle then always wins (it swaps to
     * the other authored variant, never a naive inversion).
     */
    nativeMode: MarketingMode
    fonts: { display: string; body: string }
    /**
     * Display-type voice. `scale` is the ambition axis: a multiplier the
     * big display moments (hero headlines, stat numerals) calc() against —
     * "1" is the classic scale, monumental registers push past 1.25 so the
     * type IS the layout instead of sitting in it.
     */
    display: { weight: string; tracking: string; accentStyle: string; transform: string; scale: string }
    shape: {
        radiusCard: string
        radiusControl: string
        borderWidth: string
    }
    /** Movement: the idiom (see MarketingMotionIdiom) + rise-on-load duration ("0ms" disables). */
    motion: { idiom: MarketingMotionIdiom; rise: string }
    /** Surface signatures (see MarketingTreatmentFlag); empty = quiet surfaces. */
    treatment: readonly MarketingTreatmentFlag[]
    maxWidth: string
    modes: { light: PresetModeVariant; dark: PresetModeVariant }
}

export const marketingPresetDefinitions: Record<MarketingPresetName, PresetDefinition> = {
    // Launch-pack lineage: near-black page, one saturated accent. The wash
    // is a three-bloom aurora under film grain — fixed pixel geometry so
    // the color lives where the hero is, whatever the page's height.
    "dark-dev": {
        nativeMode: "dark",
        fonts: { display: MANROPE, body: INTER },
        display: { weight: "800", tracking: "-0.03em", accentStyle: "normal", transform: "none", scale: "1" },
        shape: {
            radiusCard: "16px",
            radiusControl: "12px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "480ms" },
        treatment: ["grain", "glow"],
        maxWidth: "1080px",
        modes: {
            dark: {
                palette: {
                    pageBg: "#090d1d",
                    surface: "#131a34",
                    line: "#28305a",
                    text: "#eef0fb",
                    subtle: "#9aa3c7",
                    accent: "#f5b83d",
                },
                // Inset hairline highlight + deep drop: glass panels instead
                // of flat rectangles on the dark page.
                shadowCard: "inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 20px 48px rgba(2, 6, 22, 0.5)",
                shadowCta: (accent) => `0 0 36px color-mix(in srgb, ${accent} 30%, transparent)`,
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `radial-gradient(1100px 520px at 82% -140px, color-mix(in srgb, ${accent} 20%, transparent), transparent 60%), ` +
                    "radial-gradient(900px 480px at -10% 22%, rgba(93, 111, 255, 0.16), transparent 55%), " +
                    "radial-gradient(1000px 620px at 55% 115%, rgba(168, 85, 247, 0.10), transparent 60%)",
            },
            // Daylight developer register: indigo-tinted paper, the amber
            // accent deepened to hold contrast on white, the same aurora
            // geometry at print-light opacities.
            light: {
                palette: {
                    pageBg: "#f7f8fd",
                    surface: "#ffffff",
                    line: "#dbe0f2",
                    text: "#111635",
                    subtle: "#5a628c",
                    accent: "#b47708",
                },
                shadowCard: "0 1px 2px rgba(17, 22, 53, 0.05), 0 18px 44px rgba(17, 22, 53, 0.10)",
                shadowCta: (accent) => `0 8px 24px color-mix(in srgb, ${accent} 28%, transparent)`,
                backgroundPage: (accent) =>
                    `radial-gradient(1100px 520px at 82% -140px, color-mix(in srgb, ${accent} 10%, transparent), transparent 60%), ` +
                    "radial-gradient(900px 480px at -10% 22%, rgba(93, 111, 255, 0.08), transparent 55%), " +
                    "radial-gradient(1000px 620px at 55% 115%, rgba(168, 85, 247, 0.05), transparent 60%)",
            },
        },
    },
    // Repobot-marketing lineage: light and friendly, now wearing a proper
    // iridescent aurora (accent + cyan + pink blooms) instead of a single
    // shy radial — the wash is the preset's signature, not an apology.
    "soft-saas": {
        nativeMode: "light",
        fonts: { display: MANROPE, body: MANROPE },
        display: {
            weight: "800",
            tracking: "-0.025em",
            accentStyle: "normal",
            transform: "none",
            scale: "1",
        },
        shape: {
            radiusCard: "18px",
            radiusControl: "12px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "480ms" },
        treatment: ["glow"],
        maxWidth: "1120px",
        modes: {
            light: {
                palette: {
                    pageBg: "#ffffff",
                    surface: "#ffffff",
                    line: "#dfe4f3",
                    text: "#0f1c3a",
                    subtle: "#5a6687",
                    accent: "#635bff",
                },
                // Two-layer elevation: a crisp contact shadow plus a wide
                // soft one — cards float instead of smudging.
                shadowCard: "0 1px 2px rgba(24, 36, 72, 0.05), 0 18px 50px rgba(24, 36, 72, 0.13)",
                shadowCta: (accent) => `0 10px 28px color-mix(in srgb, ${accent} 32%, transparent)`,
                backgroundPage: (accent) =>
                    `radial-gradient(1100px 520px at 50% -160px, color-mix(in srgb, ${accent} 18%, transparent), transparent 62%), ` +
                    "radial-gradient(820px 420px at 88% -60px, rgba(56, 189, 248, 0.14), transparent 55%), " +
                    "radial-gradient(760px 420px at 6% 4%, rgba(236, 121, 187, 0.10), transparent 52%)",
            },
            // Night SaaS: deep navy ground, the same friendly aurora glowing
            // instead of blushing, glass cards with an inset highlight.
            dark: {
                palette: {
                    pageBg: "#0d1226",
                    surface: "#161c3a",
                    line: "#2a3158",
                    text: "#eef1fc",
                    subtle: "#99a2c6",
                    accent: "#7d76ff",
                },
                shadowCard: "inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 20px 50px rgba(3, 6, 24, 0.5)",
                shadowCta: (accent) => `0 10px 32px color-mix(in srgb, ${accent} 40%, transparent)`,
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `radial-gradient(1100px 520px at 50% -160px, color-mix(in srgb, ${accent} 26%, transparent), transparent 62%), ` +
                    "radial-gradient(820px 420px at 88% -60px, rgba(56, 189, 248, 0.16), transparent 55%), " +
                    "radial-gradient(760px 420px at 6% 4%, rgba(236, 121, 187, 0.12), transparent 52%)",
            },
        },
    },
    // Folio lineage: paper-and-ink, serif display, rules instead of cards.
    editorial: {
        nativeMode: "light",
        fonts: { display: SOURCE_SERIF, body: INTER },
        display: { weight: "600", tracking: "-0.01em", accentStyle: "italic", transform: "none", scale: "1" },
        shape: {
            radiusCard: "4px",
            radiusControl: "6px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "480ms" },
        treatment: [],
        maxWidth: "920px",
        modes: {
            light: {
                palette: {
                    pageBg: "#faf7f2",
                    surface: "#ffffff",
                    line: "#e0d9cd",
                    text: "#1c1a17",
                    subtle: "#6b645a",
                    accent: "#b4552d",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                // The faintest warm crown at the top of the paper — felt as
                // stock, not seen as a gradient. Rules and type stay the
                // whole show.
                backgroundPage: (accent) =>
                    `radial-gradient(140% 46% at 50% 0%, color-mix(in srgb, ${accent} 6%, transparent), transparent 70%)`,
            },
            // Lamplit reading: warm near-black stock, ivory ink, the
            // terracotta accent brightened a step — the same rules-and-type
            // restraint, printed in negative.
            dark: {
                palette: {
                    pageBg: "#181411",
                    surface: "#201b17",
                    line: "#3a332a",
                    text: "#f0ebe3",
                    subtle: "#a89d8e",
                    accent: "#e0784a",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: (accent) =>
                    `radial-gradient(140% 46% at 50% 0%, color-mix(in srgb, ${accent} 8%, transparent), transparent 70%)`,
            },
        },
    },
    // The anti-median-page statement: zero radius, hard ink borders, no
    // shadows, uppercase display type on stark paper.
    brutalist: {
        nativeMode: "light",
        fonts: { display: SPACE_GROTESK, body: INTER },
        display: {
            weight: "700",
            tracking: "0.01em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            // Full commitment: double-weight ink rules and hard offset
            // shadows. Half-hearted brutalism reads as unstyled; this reads
            // as a decision.
            borderWidth: "2px",
        },
        motion: { idiom: "still", rise: "480ms" },
        treatment: [],
        maxWidth: "1000px",
        modes: {
            light: {
                palette: {
                    // Pure white, not bone: 1-bit ink-on-white is the whole
                    // statement, and the heritage System 7 Look reads truest
                    // against it.
                    pageBg: "#ffffff",
                    surface: "#ffffff",
                    line: "#17170f",
                    text: "#17170f",
                    subtle: "#55554b",
                    accent: "#2c1fe0",
                },
                shadowCard: "8px 8px 0 #17170f",
                shadowCta: () => "4px 4px 0 #17170f",
                backgroundPage: () => "none",
            },
            // The negative print: ink paper, paper rules, the hard offset
            // shadows now cast in bone — brutalism doesn't soften at night,
            // it inverts.
            dark: {
                palette: {
                    pageBg: "#14140e",
                    surface: "#1d1d15",
                    line: "#eeede2",
                    text: "#eeede2",
                    subtle: "#a5a496",
                    accent: "#8b81ff",
                },
                shadowCard: "8px 8px 0 #eeede2",
                shadowCta: () => "4px 4px 0 #eeede2",
                backgroundPage: () => "none",
            },
        },
    },
    // Menu/salon lineage: cream-and-terracotta warmth, serif display, pill
    // controls, big soft-shadowed radius.
    "warm-boutique": {
        nativeMode: "light",
        fonts: { display: SOURCE_SERIF, body: MANROPE },
        display: { weight: "700", tracking: "-0.01em", accentStyle: "normal", transform: "none", scale: "1" },
        shape: {
            radiusCard: "22px",
            radiusControl: "999px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "480ms" },
        treatment: ["glow"],
        maxWidth: "1060px",
        modes: {
            light: {
                palette: {
                    pageBg: "#faf3ea",
                    surface: "#fffdf9",
                    line: "#ecdcc8",
                    text: "#42302a",
                    subtle: "#8c7563",
                    accent: "#c25e3e",
                },
                shadowCard: "0 2px 6px rgba(116, 74, 48, 0.08), 0 22px 48px rgba(116, 74, 48, 0.15)",
                shadowCta: (accent) => `0 8px 22px color-mix(in srgb, ${accent} 30%, transparent)`,
                // Terracotta bloom on one shoulder, honey on the other: the
                // page feels sunlit instead of merely beige.
                backgroundPage: (accent) =>
                    `radial-gradient(1000px 460px at 12% -120px, color-mix(in srgb, ${accent} 16%, transparent), transparent 58%), ` +
                    "radial-gradient(900px 480px at 96% -40px, rgba(233, 178, 106, 0.20), transparent 55%)",
            },
            // Candlelit boutique: espresso ground, cream type, terracotta
            // warmed a step — the same sunlit shoulders, now embers.
            dark: {
                palette: {
                    pageBg: "#221610",
                    surface: "#2c1e16",
                    line: "#4a382b",
                    text: "#f5ebe0",
                    subtle: "#bfa691",
                    accent: "#e07a52",
                },
                shadowCard: "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 22px 48px rgba(12, 6, 2, 0.5)",
                shadowCta: (accent) => `0 8px 26px color-mix(in srgb, ${accent} 36%, transparent)`,
                backgroundPage: (accent) =>
                    `radial-gradient(1000px 460px at 12% -120px, color-mix(in srgb, ${accent} 14%, transparent), transparent 58%), ` +
                    "radial-gradient(900px 480px at 96% -40px, rgba(233, 178, 106, 0.10), transparent 55%)",
            },
        },
    },
    // Terminal/spec-sheet minimalism: mono display type, thin rules, no
    // decoration; the accent works only in links, CTAs, and numbers.
    "mono-utility": {
        nativeMode: "light",
        fonts: { display: PLEX_MONO, body: INTER },
        display: { weight: "600", tracking: "-0.02em", accentStyle: "normal", transform: "none", scale: "1" },
        shape: {
            radiusCard: "4px",
            radiusControl: "4px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "480ms" },
        treatment: ["hairline"],
        maxWidth: "940px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f7f7f4",
                    surface: "#fdfdfb",
                    line: "#d8d8d0",
                    text: "#1b1d1b",
                    subtle: "#61665e",
                    accent: "#0f7b3f",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                // Barely-there graph paper: the spec-sheet identity made
                // literal. Hairlines at 2.8% ink stay invisible until you
                // look for them.
                backgroundPage: () =>
                    "repeating-linear-gradient(0deg, rgba(27, 29, 27, 0.028) 0 1px, transparent 1px 28px), " +
                    "repeating-linear-gradient(90deg, rgba(27, 29, 27, 0.028) 0 1px, transparent 1px 28px)",
            },
            // The terminal itself: near-black phosphor ground, the green
            // brightened to CRT legibility, graph paper ruled in faint
            // phosphor instead of ink.
            dark: {
                palette: {
                    pageBg: "#101312",
                    surface: "#171b19",
                    line: "#2c332e",
                    text: "#e6ece7",
                    subtle: "#8f9a91",
                    accent: "#34c375",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () =>
                    "repeating-linear-gradient(0deg, rgba(230, 236, 231, 0.030) 0 1px, transparent 1px 28px), " +
                    "repeating-linear-gradient(90deg, rgba(230, 236, 231, 0.030) 0 1px, transparent 1px 28px)",
            },
        },
    },
    // The molten flagship: true-black neutral page (not navy), a single
    // iridescent ribbon of violet-cyan-pink blooms sweeping the hero under
    // film grain, glass cards. The Stripe-Sessions register — for products
    // that want "edge of gorgeous" rather than "friendly SaaS".
    "aurora-dark": {
        nativeMode: "dark",
        fonts: { display: MANROPE, body: INTER },
        display: {
            weight: "800",
            tracking: "-0.035em",
            accentStyle: "normal",
            transform: "none",
            scale: "1",
        },
        shape: {
            radiusCard: "20px",
            radiusControl: "14px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "480ms" },
        treatment: ["grain", "glow"],
        maxWidth: "1120px",
        modes: {
            dark: {
                palette: {
                    pageBg: "#08080d",
                    surface: "#121218",
                    line: "#26262f",
                    text: "#f4f4f8",
                    subtle: "#9b9ba9",
                    accent: "#8b5cf6",
                },
                shadowCard: "inset 0 1px 0 rgba(255, 255, 255, 0.07), 0 24px 60px rgba(0, 0, 0, 0.55)",
                shadowCta: (accent) => `0 0 44px color-mix(in srgb, ${accent} 38%, transparent)`,
                // The ribbon: a diagonal chain of blooms sweeping down across
                // the hero — accent into cyan into pink — reads as one molten
                // band.
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `radial-gradient(820px 460px at 4% 320px, color-mix(in srgb, ${accent} 32%, transparent), transparent 64%), ` +
                    "radial-gradient(860px 440px at 42% 120px, rgba(56, 189, 248, 0.20), transparent 62%), " +
                    "radial-gradient(800px 420px at 82% -60px, rgba(244, 114, 182, 0.20), transparent 60%), " +
                    "radial-gradient(900px 560px at 50% 118%, rgba(99, 102, 241, 0.10), transparent 60%)",
            },
            // Daybreak aurora: gallery-white ground with the same molten
            // ribbon at watercolor strength, the violet deepened to hold
            // ink-grade contrast.
            light: {
                palette: {
                    pageBg: "#fbfbfd",
                    surface: "#ffffff",
                    line: "#e5e5ef",
                    text: "#121218",
                    subtle: "#636370",
                    accent: "#7443f0",
                },
                shadowCard: "0 2px 5px rgba(18, 18, 24, 0.06), 0 24px 60px rgba(18, 18, 24, 0.10)",
                shadowCta: (accent) => `0 10px 32px color-mix(in srgb, ${accent} 30%, transparent)`,
                backgroundPage: (accent) =>
                    `radial-gradient(820px 460px at 4% 320px, color-mix(in srgb, ${accent} 12%, transparent), transparent 64%), ` +
                    "radial-gradient(860px 440px at 42% 120px, rgba(56, 189, 248, 0.10), transparent 62%), " +
                    "radial-gradient(800px 420px at 82% -60px, rgba(244, 114, 182, 0.10), transparent 60%), " +
                    "radial-gradient(900px 560px at 50% 118%, rgba(99, 102, 241, 0.06), transparent 60%)",
            },
        },
    },
    // The light flagship: Stripe-homepage register — near-white ground,
    // deep ink type set tight, hairline rules, crisp two-layer elevation,
    // and an iridescent band grazing the top edge. Polished-fintech, not
    // friendly-pastel; sits deliberately apart from soft-saas.
    "luxe-light": {
        nativeMode: "light",
        fonts: { display: MANROPE, body: INTER },
        display: { weight: "800", tracking: "-0.03em", accentStyle: "normal", transform: "none", scale: "1" },
        shape: {
            radiusCard: "12px",
            radiusControl: "8px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "480ms" },
        treatment: ["glow"],
        maxWidth: "1120px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f8f9fc",
                    surface: "#ffffff",
                    line: "#e3e7f2",
                    text: "#0a1733",
                    subtle: "#5b6478",
                    accent: "#0f6fff",
                },
                shadowCard: "0 2px 5px rgba(50, 50, 93, 0.08), 0 24px 60px rgba(50, 50, 93, 0.10)",
                shadowCta: (accent) => `0 8px 24px color-mix(in srgb, ${accent} 34%, transparent)`,
                backgroundPage: (accent) =>
                    `radial-gradient(720px 340px at 8% -40px, color-mix(in srgb, ${accent} 20%, transparent), transparent 62%), ` +
                    "radial-gradient(760px 340px at 38% -120px, rgba(139, 92, 246, 0.16), transparent 60%), " +
                    "radial-gradient(720px 320px at 66% -180px, rgba(244, 114, 182, 0.13), transparent 58%), " +
                    "radial-gradient(700px 300px at 92% -240px, rgba(255, 184, 108, 0.13), transparent 56%)",
            },
            // After-hours fintech: deep boardroom navy, the blue lifted to
            // signal on dark, the same iridescent band grazing the top edge.
            dark: {
                palette: {
                    pageBg: "#0a0f1f",
                    surface: "#121a33",
                    line: "#233052",
                    text: "#eef1fb",
                    subtle: "#8d96b4",
                    accent: "#4d94ff",
                },
                shadowCard: "inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 24px 60px rgba(2, 6, 20, 0.55)",
                shadowCta: (accent) => `0 8px 28px color-mix(in srgb, ${accent} 42%, transparent)`,
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `radial-gradient(720px 340px at 8% -40px, color-mix(in srgb, ${accent} 24%, transparent), transparent 62%), ` +
                    "radial-gradient(760px 340px at 38% -120px, rgba(139, 92, 246, 0.18), transparent 60%), " +
                    "radial-gradient(720px 320px at 66% -180px, rgba(244, 114, 182, 0.14), transparent 58%), " +
                    "radial-gradient(700px 300px at 92% -240px, rgba(255, 184, 108, 0.12), transparent 56%)",
            },
        },
    },
    // The gallery-quiet register: near-white walls, ink type set light and
    // tracked in small caps, hairline rules, zero radius, no wash — the
    // page recedes so photographs carry every square inch of color.
    // Built for photography/portfolio sites (the Pixieset-class look); the
    // near-ink accent renders CTAs as quiet black buttons rather than a
    // brand shout.
    atelier: {
        nativeMode: "light",
        fonts: { display: INTER, body: INTER },
        display: {
            weight: "500",
            tracking: "0.06em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "480ms" },
        treatment: ["hairline"],
        maxWidth: "1160px",
        modes: {
            light: {
                palette: {
                    pageBg: "#fdfdfb",
                    surface: "#ffffff",
                    line: "#e7e5e0",
                    text: "#1b1a18",
                    subtle: "#807a72",
                    accent: "#211f1c",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
            // The dim gallery: charcoal walls, bone type, the near-ink
            // accent flipped to near-paper — CTAs become quiet white
            // buttons, photographs still carry all the color.
            dark: {
                palette: {
                    pageBg: "#141413",
                    surface: "#1b1b19",
                    line: "#2f2e2b",
                    text: "#ecebe8",
                    subtle: "#9c968d",
                    accent: "#e9e7e2",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
        },
    },
    // The romantic-editorial register: wedding-stationery warmth where
    // atelier is gallery chill. Fraunces serif display set roman-quiet with
    // an italic accent word, warm ivory ground with champagne hairlines, a
    // deep botanical-green accent (garden foliage, not florist purple), and
    // a narrow measure with generous air — the page reads as an invitation
    // suite, not a white-wall gallery.
    // Built for wedding/event studios and other keepsake trades; imagery
    // still carries the color, but the paper itself is warm instead of
    // receding to near-white.
    heirloom: {
        nativeMode: "light",
        fonts: { display: FRAUNCES, body: INTER },
        display: { weight: "500", tracking: "-0.01em", accentStyle: "italic", transform: "none", scale: "1" },
        shape: {
            // A stationery card's barely-eased corner: softer than atelier's
            // hard zero, nowhere near boutique roundness.
            radiusCard: "2px",
            radiusControl: "2px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "480ms" },
        treatment: [],
        // The narrowest measure of the image-led registers: whitespace is
        // the pacing, so the column stays close and the margins breathe.
        maxWidth: "980px",
        modes: {
            light: {
                palette: {
                    pageBg: "#faf6ee",
                    surface: "#fffdf8",
                    line: "#e8ddcb",
                    text: "#322820",
                    subtle: "#8b7d6a",
                    accent: "#46583c",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                // A champagne crown and one warm shoulder at print-light
                // opacity — felt as warm stock, never seen as a gradient;
                // rules and serif type stay the whole show.
                backgroundPage: (accent) =>
                    `radial-gradient(130% 44% at 50% 0%, color-mix(in srgb, ${accent} 6%, transparent), transparent 70%), ` +
                    "radial-gradient(900px 420px at 85% -80px, rgba(214, 178, 120, 0.12), transparent 55%)",
            },
            // Candlelit reading of the same suite: umber ground, ivory ink,
            // the green lifted to pressed sage so it reads against the dark
            // paper — the crown glows instead of blushing.
            dark: {
                palette: {
                    pageBg: "#1a1410",
                    surface: "#221a15",
                    line: "#3b3128",
                    text: "#f2e9dc",
                    subtle: "#a8988a",
                    accent: "#a9bd97",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `radial-gradient(130% 44% at 50% 0%, color-mix(in srgb, ${accent} 9%, transparent), transparent 70%), ` +
                    "radial-gradient(900px 420px at 85% -80px, rgba(214, 178, 120, 0.08), transparent 55%)",
            },
        },
    },
    // The expedition register: a photographer's tour book, not a gallery
    // wall. Ink on plain paper under visible grain — strictly black and
    // white, so the photographs are the only color on the page — with a
    // condensed-energy uppercase masthead voice (Space Grotesk at bold);
    // the page reads as a field journal from someone mid-adventure.
    // Kinetic: filmstrips travel, media clusters tilt like taped-in
    // prints. Where atelier recedes so photographs can whisper, tourbook
    // runs alongside them shouting.
    tourbook: {
        nativeMode: "dark",
        fonts: { display: SPACE_GROTESK, body: INTER },
        display: {
            weight: "700",
            tracking: "0.015em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1.12",
        },
        shape: {
            // Prints have corners; radius would read as UI, not paper.
            radiusCard: "2px",
            radiusControl: "4px",
            borderWidth: "1px",
        },
        motion: { idiom: "kinetic", rise: "520ms" },
        treatment: ["grain", "tilt"],
        maxWidth: "1180px",
        modes: {
            light: {
                palette: {
                    pageBg: "#fafafa",
                    surface: "#ffffff",
                    line: "#dfdfdf",
                    text: "#141414",
                    subtle: "#6e6e6e",
                    accent: "#141414",
                },
                // A print lifted off the page: crisp contact edge plus a
                // soft throw — photographs sit ON the paper, not in glass.
                shadowCard: "0 2px 5px rgba(20, 20, 20, 0.12), 0 16px 36px rgba(20, 20, 20, 0.13)",
                shadowCta: () => "none",
                // Grain over the whole sheet — the treatment IS the paper —
                // with one shadowed shoulder; the ink stays in type and
                // tape, never in the wash.
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    "radial-gradient(1000px 480px at 88% -100px, rgba(20, 20, 20, 0.05), transparent 56%)",
            },
            // Night leg of the tour — the register's native face: a true-black
            // darkroom ground, white ink, the same monochrome conviction; the
            // photographs are the only light in the room.
            dark: {
                palette: {
                    pageBg: "#000000",
                    surface: "#101010",
                    line: "#2e2e2e",
                    text: "#f4f4f4",
                    subtle: "#9c9c9c",
                    accent: "#ffffff",
                },
                shadowCard: "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 18px 40px rgba(0, 0, 0, 0.5)",
                shadowCta: () => "none",
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    "radial-gradient(1000px 480px at 88% -100px, rgba(255, 255, 255, 0.05), transparent 56%)",
            },
        },
    },
    // The severe register: strict black and white, zero accent hue — the
    // Blackbox move, where monumental type and implied movement carry
    // everything color usually does. Display type past the scale ceiling,
    // stroke-only letterforms on the headline's accent word, razor hairline
    // frames instead of elevation, and a diagonal light beam swept through
    // the ground. The accent token resolves to ink-on-ground, so CTAs are
    // hard white (or black) plates; charts read as white line-work. Both
    // modes are true inversions of each other — the toggle is part of the
    // art direction, not an accommodation.
    monolith: {
        nativeMode: "dark",
        fonts: { display: SPACE_GROTESK, body: INTER },
        display: {
            weight: "700",
            tracking: "-0.04em",
            accentStyle: "normal",
            transform: "none",
            scale: "1.3",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        motion: { idiom: "sweep", rise: "620ms" },
        treatment: ["grain", "outline", "hairline"],
        maxWidth: "1200px",
        modes: {
            dark: {
                palette: {
                    pageBg: "#000000",
                    surface: "#0c0c0c",
                    line: "#2a2a2a",
                    text: "#ffffff",
                    subtle: "#9c9c9c",
                    accent: "#ffffff",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                // One diagonal beam through true black under grain: the
                // static trace of the sweep idiom (the motion layer animates
                // it; without JavaScript this is what remains).
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    "linear-gradient(115deg, transparent 40%, rgba(255, 255, 255, 0.055) 50%, transparent 60%)",
            },
            // The negative: gallery-white ground, ink type, the beam cast
            // in graphite — an inversion, not a softening.
            light: {
                palette: {
                    pageBg: "#fbfbfb",
                    surface: "#ffffff",
                    line: "#dcdcdc",
                    text: "#0a0a0a",
                    subtle: "#5e5e5e",
                    accent: "#0a0a0a",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () =>
                    "linear-gradient(115deg, transparent 40%, rgba(10, 10, 10, 0.035) 50%, transparent 60%)",
            },
        },
    },
    // The nighttime-celebration register: a barn party in full swing —
    // string lights against a midnight sky, "a little bit louder now".
    // Staid monochrome: true-black ground, white ink, zero accent hue —
    // the photographs carry all the color of the night. Fraunces display
    // with an italic accent word over pill controls that read as festival
    // wristbands. Kinetic like tourbook (tilted polaroid clusters,
    // traveling strips) but glowing instead of taped: the white blooms in
    // the wash are the bulbs overhead. Where heirloom is the keepsake
    // after the day, lanternlight is the night itself.
    lanternlight: {
        nativeMode: "dark",
        fonts: { display: FRAUNCES, body: INTER },
        display: {
            weight: "550",
            tracking: "-0.015em",
            accentStyle: "italic",
            transform: "none",
            scale: "1.12",
        },
        shape: {
            radiusCard: "6px",
            // Wristband pills: CTAs and controls curve fully — celebratory
            // against the stationery flatness of the cards.
            radiusControl: "999px",
            borderWidth: "1px",
        },
        motion: { idiom: "kinetic", rise: "560ms" },
        treatment: ["grain", "glow", "tilt"],
        maxWidth: "1040px",
        modes: {
            dark: {
                palette: {
                    // True black: the night fully dark, so the ground never
                    // reads as a washed charcoal beside the photographs.
                    pageBg: "#000000",
                    surface: "#121212",
                    line: "#2e2e2e",
                    text: "#f4f4f4",
                    subtle: "#9a9a9a",
                    accent: "#f4f4f4",
                },
                shadowCard: "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 18px 44px rgba(0, 0, 0, 0.55)",
                // Bulb glow, not tech glow: soft and close.
                shadowCta: (accent) => `0 0 30px color-mix(in srgb, ${accent} 42%, transparent)`,
                // String lights over the dance floor: faint white blooms at
                // the crown under grain — bare bulbs against a black night,
                // quiet enough that the ground stays black.
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `radial-gradient(720px 380px at 18% -90px, color-mix(in srgb, ${accent} 10%, transparent), transparent 60%), ` +
                    "radial-gradient(640px 340px at 80% -70px, rgba(255, 255, 255, 0.05), transparent 58%)",
            },
            // The morning after on the same field: plain white ground, ink
            // type, the bulbs now daylight.
            light: {
                palette: {
                    pageBg: "#fafafa",
                    surface: "#ffffff",
                    line: "#e2e2e2",
                    text: "#1a1a1a",
                    subtle: "#767676",
                    accent: "#1a1a1a",
                },
                shadowCard: "0 2px 5px rgba(26, 26, 26, 0.07), 0 18px 44px rgba(26, 26, 26, 0.11)",
                shadowCta: (accent) => `0 8px 24px color-mix(in srgb, ${accent} 30%, transparent)`,
                backgroundPage: (accent) =>
                    `radial-gradient(720px 380px at 18% -90px, color-mix(in srgb, ${accent} 8%, transparent), transparent 60%), ` +
                    "radial-gradient(640px 340px at 80% -70px, rgba(26, 26, 26, 0.05), transparent 58%)",
            },
        },
    },
    // The trades register: the plan table, not the café counter. Warm
    // work paper ruled in a faint site-plan grid, deep ink type set as
    // stenciled uppercase signage (Space Grotesk at bold, tracked open),
    // and one safety-orange accent — the color of cones, vests, and
    // "call now". Grain reads as jobsite dust on the sheet; cards lift
    // like spec sheets clipped to a board. Still: the work is heavy, the
    // page doesn't perform. Where warm-boutique is sunlit hospitality
    // and brutalist is an art statement, sitework is licensed-and-
    // insured confidence — built for contractors, plumbers, electricians,
    // landscapers, and the rest of the trades.
    sitework: {
        nativeMode: "light",
        fonts: { display: SPACE_GROTESK, body: INTER },
        display: {
            weight: "700",
            tracking: "0.02em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1.12",
        },
        shape: {
            // Squared like cut lumber, eased just past brutalism: signage,
            // not an art piece.
            radiusCard: "4px",
            radiusControl: "6px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "480ms" },
        treatment: ["grain"],
        maxWidth: "1120px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f6f4ef",
                    surface: "#ffffff",
                    line: "#ddd7c9",
                    text: "#181611",
                    subtle: "#645d4f",
                    accent: "#c2410c",
                },
                // A spec sheet lifted off the clipboard: crisp contact edge
                // plus a modest throw — sturdy, never floaty.
                shadowCard: "0 1px 3px rgba(24, 22, 17, 0.10), 0 14px 32px rgba(24, 22, 17, 0.12)",
                shadowCta: (accent) => `0 6px 18px color-mix(in srgb, ${accent} 32%, transparent)`,
                // The site plan made literal: a 44px plan grid at 3% ink
                // (larger cells than mono-utility's graph paper — a drawing
                // sheet, not an engineer's pad) under grain, with one
                // safety-orange bloom at the crown.
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    "repeating-linear-gradient(0deg, rgba(24, 22, 17, 0.03) 0 1px, transparent 1px 44px), " +
                    "repeating-linear-gradient(90deg, rgba(24, 22, 17, 0.03) 0 1px, transparent 1px 44px), " +
                    `radial-gradient(1000px 460px at 90% -120px, color-mix(in srgb, ${accent} 10%, transparent), transparent 58%)`,
            },
            // The night shift: floodlit yard — warm asphalt-ink ground,
            // bone type, the orange lifted to vest brightness, the same
            // plan grid ruled in faint bone.
            dark: {
                palette: {
                    pageBg: "#161511",
                    surface: "#1e1c17",
                    line: "#38352b",
                    text: "#f1efe9",
                    subtle: "#a29b8b",
                    accent: "#ff8a3d",
                },
                shadowCard: "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 18px 40px rgba(0, 0, 0, 0.5)",
                shadowCta: (accent) => `0 6px 22px color-mix(in srgb, ${accent} 38%, transparent)`,
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    "repeating-linear-gradient(0deg, rgba(241, 239, 233, 0.03) 0 1px, transparent 1px 44px), " +
                    "repeating-linear-gradient(90deg, rgba(241, 239, 233, 0.03) 0 1px, transparent 1px 44px), " +
                    `radial-gradient(1000px 460px at 90% -120px, color-mix(in srgb, ${accent} 12%, transparent), transparent 58%)`,
            },
        },
    },
    // The residential register: the listing sheet from a good agency.
    // Limestone paper, deep navy ink set in a quiet serif (weight, not
    // shout — the display barely scales), and one brick accent the color
    // of the facades themselves. Grain reads as stone; cards sit like
    // mounted photographs with soft, believable shadows. Where sitework
    // is the trades' clipboard and heirloom is the wedding's stationery,
    // brownstone is the open-house folder on a good street — photography
    // does the persuading, the type just introduces it.
    brownstone: {
        nativeMode: "light",
        fonts: { display: SOURCE_SERIF, body: INTER },
        display: {
            weight: "600",
            tracking: "-0.01em",
            accentStyle: "italic",
            transform: "none",
            scale: "1.04",
        },
        shape: {
            // Eased like worn masonry edges: neither the trades' cut
            // lumber nor SaaS pill-roundness.
            radiusCard: "8px",
            radiusControl: "8px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "560ms" },
        treatment: ["grain"],
        maxWidth: "1120px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f7f3ec",
                    surface: "#fffdf8",
                    line: "#e0d8c8",
                    text: "#212d43",
                    subtle: "#5f6b80",
                    accent: "#9c4a2f",
                },
                // A mounted listing photograph: crisp contact edge and a
                // gentle throw — gallery weight, never floaty.
                shadowCard: "0 1px 2px rgba(33, 45, 67, 0.06), 0 16px 40px rgba(33, 45, 67, 0.10)",
                shadowCta: (accent) => `0 8px 22px color-mix(in srgb, ${accent} 30%, transparent)`,
                // Late light on a limestone street: one brick bloom at the
                // crown, one cool navy wash opposite, under stone grain.
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `radial-gradient(920px 440px at 86% -110px, color-mix(in srgb, ${accent} 9%, transparent), transparent 58%), ` +
                    "radial-gradient(720px 380px at 6% -70px, rgba(33, 45, 67, 0.06), transparent 55%)",
            },
            // The same street after the lamps come on: night-navy ground,
            // ivory ink, the brick lifted to lamplit terracotta.
            dark: {
                palette: {
                    pageBg: "#151b28",
                    surface: "#1c2333",
                    line: "#303a4e",
                    text: "#ece7dc",
                    subtle: "#9aa3b5",
                    accent: "#d98a64",
                },
                shadowCard: "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 18px 42px rgba(0, 0, 0, 0.5)",
                shadowCta: (accent) => `0 8px 24px color-mix(in srgb, ${accent} 36%, transparent)`,
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `radial-gradient(920px 440px at 86% -110px, color-mix(in srgb, ${accent} 12%, transparent), transparent 58%), ` +
                    "radial-gradient(720px 380px at 6% -70px, rgba(236, 231, 220, 0.05), transparent 55%)",
            },
        },
    },
    // The stage-night register: the house lights down, the marquee lit.
    // True-black ground, plain white ink, and heavy Fraunces caps set like
    // playbill lettering — the seventies rock bill, not the wedding's
    // stationery. Strictly monochrome: the accent resolves to the ink
    // itself, so the photographs are the only color and the only warmth on
    // the page. Kinetic like tourbook (filmstrips travel), grain pushed
    // like Tri-X. Where lanternlight is the party under bulbs and tourbook
    // is the field journal, marquee is the show itself.
    marquee: {
        nativeMode: "dark",
        fonts: { display: FRAUNCES, body: INTER },
        display: {
            weight: "750",
            tracking: "0.03em",
            accentStyle: "italic",
            transform: "uppercase",
            scale: "1.2",
        },
        shape: {
            // Ticket-stub squared: prints and stubs have corners.
            radiusCard: "2px",
            radiusControl: "3px",
            borderWidth: "1px",
        },
        motion: { idiom: "kinetic", rise: "560ms" },
        treatment: ["grain", "glow"],
        maxWidth: "1180px",
        modes: {
            dark: {
                palette: {
                    // True black: the house fully dark so the photographs
                    // are the only light on the page.
                    pageBg: "#000000",
                    surface: "#121212",
                    line: "#2e2e2e",
                    // Plain white ink — no tungsten cream; the photographs
                    // carry every degree of warmth.
                    text: "#f5f5f5",
                    subtle: "#9e9e9e",
                    // Achromatic on purpose: the wash machinery collapses
                    // accentSoft to the black ground (no gray bands).
                    accent: "#f2f2f2",
                },
                shadowCard: "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 18px 44px rgba(0, 0, 0, 0.6)",
                // White spill off the marquee bulbs: close, not tech glow.
                shadowCta: (accent) => `0 0 28px color-mix(in srgb, ${accent} 38%, transparent)`,
                // No haze, no beams: pure black between frames, grain only.
                backgroundPage: () => GRAIN,
            },
            // The tour program under daylight: plain white stock, the same
            // playbill caps in black ink — the morning-after read of the
            // same show, as strictly monochrome as the night.
            light: {
                palette: {
                    pageBg: "#fafafa",
                    surface: "#ffffff",
                    line: "#e0e0e0",
                    text: "#161616",
                    subtle: "#6e6e6e",
                    accent: "#161616",
                },
                shadowCard: "0 2px 5px rgba(0, 0, 0, 0.10), 0 16px 36px rgba(0, 0, 0, 0.12)",
                shadowCta: () => "none",
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    "radial-gradient(940px 480px at 50% -140px, rgba(0, 0, 0, 0.05), transparent 62%)",
            },
        },
    },
    // The black-tie register: the evening itself — a candlelit ballroom,
    // not a tech product's dark mode. Warm near-black ground (candle smoke,
    // never blue), gold-foil accent the color of the invitation's engraving,
    // Fraunces display past the scale ceiling with the italic flourish, and
    // one slow spotlight beam swept through the dark under grain. Hairline
    // gold frames instead of elevation — engraved stationery, not glass.
    // Where lanternlight is the barn party under string lights and heirloom
    // is the invitation on morning paper, ballroom is 8 PM in the grand
    // room: built for galas, milestone evenings, and New Year's weddings.
    ballroom: {
        nativeMode: "dark",
        fonts: { display: FRAUNCES, body: INTER },
        display: {
            weight: "600",
            tracking: "-0.02em",
            accentStyle: "italic",
            transform: "none",
            scale: "1.2",
        },
        shape: {
            // Engraved card corners: sharp enough to read as print, a hair
            // off brutalism's statement zero.
            radiusCard: "2px",
            radiusControl: "2px",
            borderWidth: "1px",
        },
        motion: { idiom: "sweep", rise: "620ms" },
        treatment: ["grain", "glow", "hairline"],
        maxWidth: "1040px",
        modes: {
            dark: {
                palette: {
                    pageBg: "#0c0a07",
                    surface: "#151109",
                    line: "#352b18",
                    text: "#f6f1e4",
                    subtle: "#a3987f",
                    accent: "#d4a72c",
                },
                shadowCard: "none",
                // Candle glow, close and warm — never a neon bloom.
                shadowCta: (accent) => `0 0 32px color-mix(in srgb, ${accent} 36%, transparent)`,
                // The spotlight: one gold bloom at the crown and one slow
                // diagonal beam through the smoke, under grain — the static
                // trace of the sweep idiom.
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `radial-gradient(900px 460px at 50% -140px, color-mix(in srgb, ${accent} 16%, transparent), transparent 60%), ` +
                    `linear-gradient(115deg, transparent 42%, color-mix(in srgb, ${accent} 7%, transparent) 50%, transparent 58%)`,
            },
            // The morning rehearsal: champagne paper, ink type, the gold
            // deepened to hold engraving contrast — the same room with the
            // curtains open.
            light: {
                palette: {
                    // White stock, not champagne: the engraved card is
                    // printed on bright white and the gold does the talking.
                    pageBg: "#ffffff",
                    surface: "#ffffff",
                    line: "#e6dcc2",
                    text: "#241d10",
                    subtle: "#77694b",
                    accent: "#9a7514",
                },
                shadowCard: "none",
                shadowCta: (accent) => `0 8px 22px color-mix(in srgb, ${accent} 28%, transparent)`,
                backgroundPage: () => "none",
            },
        },
    },
    // The backyard-party register: a reunion picnic in full afternoon —
    // sunny cream paper, one tomato-red accent the color of the gingham
    // cooler, marigold and sky washes, big rounded cards and full-pill
    // controls that read as name tags. Kinetic like tourbook but grinning
    // instead of expeditionary: photo clusters tilt like snapshots passed
    // around the table. Where warm-boutique is the café counter and
    // lanternlight is the night's glow, picnic is 2 PM on the lawn —
    // built for reunions, birthdays, and the parties between weddings.
    picnic: {
        nativeMode: "light",
        fonts: { display: MANROPE, body: INTER },
        display: {
            weight: "800",
            tracking: "-0.02em",
            accentStyle: "normal",
            transform: "none",
            scale: "1.08",
        },
        shape: {
            radiusCard: "20px",
            // Name-tag pills: every control curves fully.
            radiusControl: "999px",
            borderWidth: "1px",
        },
        motion: { idiom: "kinetic", rise: "520ms" },
        treatment: ["tilt", "glow"],
        maxWidth: "1080px",
        modes: {
            light: {
                palette: {
                    pageBg: "#fdf7ec",
                    surface: "#ffffff",
                    line: "#f0dfc2",
                    text: "#3a2a1c",
                    subtle: "#8a7458",
                    accent: "#e0472e",
                },
                // A snapshot lifted off the picnic table: crisp contact
                // edge plus a friendly throw.
                shadowCard: "0 2px 5px rgba(90, 55, 20, 0.08), 0 20px 44px rgba(90, 55, 20, 0.13)",
                shadowCta: (accent) => `0 8px 24px color-mix(in srgb, ${accent} 32%, transparent)`,
                // Full afternoon: a marigold bloom overhead and a sky-blue
                // shoulder — the lawn, not a screen gradient.
                backgroundPage: (accent) =>
                    `radial-gradient(1000px 480px at 18% -120px, rgba(240, 173, 46, 0.20), transparent 58%), ` +
                    `radial-gradient(880px 440px at 94% -60px, rgba(94, 170, 220, 0.14), transparent 55%), ` +
                    `radial-gradient(760px 400px at 55% 115%, color-mix(in srgb, ${accent} 7%, transparent), transparent 60%)`,
            },
            // The bonfire after dark: toasted-brown ground, cream type, the
            // tomato lifted to ember orange, the marigold now firelight.
            dark: {
                palette: {
                    pageBg: "#1c130c",
                    surface: "#271a11",
                    line: "#46331f",
                    text: "#f7ede0",
                    subtle: "#b39c82",
                    accent: "#ff8c66",
                },
                shadowCard: "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 20px 44px rgba(0, 0, 0, 0.5)",
                shadowCta: (accent) => `0 8px 26px color-mix(in srgb, ${accent} 38%, transparent)`,
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `radial-gradient(1000px 480px at 18% -120px, rgba(240, 173, 46, 0.12), transparent 58%), ` +
                    `radial-gradient(760px 400px at 55% 115%, color-mix(in srgb, ${accent} 10%, transparent), transparent 60%)`,
            },
        },
    },
    // The training-floor register: black rubber and gym chalk, nothing
    // else. Near-black neutral ground, chalk-bone ink, Space Grotesk set
    // as stenciled uppercase signage tracked open — the whiteboard wall,
    // not a fitness app. Strictly monochrome: the accent resolves to the
    // chalk itself, so CTAs are hard chalk plates and the photography
    // (high-contrast black and white) is the only tonal drama. Grain reads
    // as chalk dust; hairlines rule the schedule wall; still motion — the
    // work is heavy, the page doesn't perform. Where monolith is the
    // monumental tech statement, chalk is a room you train in.
    chalk: {
        nativeMode: "dark",
        fonts: { display: SPACE_GROTESK, body: INTER },
        display: {
            weight: "700",
            tracking: "0.05em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1.16",
        },
        shape: {
            // Squared like a bumper plate's edge; radius would read as app
            // chrome, not signage.
            radiusCard: "2px",
            radiusControl: "2px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "520ms" },
        treatment: ["grain", "hairline"],
        maxWidth: "1140px",
        modes: {
            dark: {
                palette: {
                    pageBg: "#111110",
                    surface: "#181817",
                    line: "#2e2e2c",
                    text: "#f0eee7",
                    subtle: "#8f8d85",
                    accent: "#f0eee7",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                // Chalk dust under one worklight: grain over near-black
                // with the faintest bone bloom at the crown — monochrome
                // light, never a color wash.
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    "radial-gradient(940px 440px at 50% -160px, rgba(240, 238, 231, 0.05), transparent 60%)",
            },
            // The morning session: the whiteboard wall in daylight — warm
            // paper ground, ink signage, the same rules and restraint.
            light: {
                palette: {
                    pageBg: "#f4f2ec",
                    surface: "#fbfaf6",
                    line: "#d9d6cc",
                    text: "#181815",
                    subtle: "#6d6b62",
                    accent: "#181815",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    "radial-gradient(940px 440px at 50% -160px, rgba(24, 24, 21, 0.04), transparent 60%)",
            },
        },
    },
    // The midnight-service register: the sanctuary with the house lights
    // down — a church that gathers like a venue, not a parish office.
    // Warm near-black ground under grain, bone ink set as monumental
    // uppercase signage (Space Grotesk past the scale ceiling), hairline
    // rules instead of elevation, and one candle-amber accent — the color
    // of stage wash and votive flame — that lives in CTAs and one slow
    // diagonal beam through the dark, like light through the west window.
    // Reverence through boldness: the computed badge, the setlist of
    // service times, and the open table stay; the bone paper doesn't.
    // Built for churches and congregations reaching a young city —
    // deliberately apart from ballroom's gala gold (engraved stationery)
    // and marquee's playbill (the photographs there are the show; here
    // the type preaches).
    hymnal: {
        nativeMode: "dark",
        fonts: { display: SPACE_GROTESK, body: INTER },
        display: {
            weight: "700",
            tracking: "0.02em",
            accentStyle: "normal",
            transform: "uppercase",
            // Past the monumental ceiling: the headline is the marquee.
            scale: "1.3",
        },
        shape: {
            // Squared like cut stone — signage, not UI chrome.
            radiusCard: "2px",
            radiusControl: "2px",
            borderWidth: "1px",
        },
        motion: { idiom: "sweep", rise: "560ms" },
        treatment: ["grain", "glow", "hairline"],
        // A wide room: monumental type needs the nave, not the pamphlet
        // column the old order-of-service reading kept.
        maxWidth: "1140px",
        modes: {
            dark: {
                palette: {
                    pageBg: "#0e0c09",
                    surface: "#171411",
                    line: "#332d24",
                    text: "#f4efe4",
                    subtle: "#a3988a",
                    accent: "#ff9e2c",
                },
                shadowCard: "none",
                // Candle spill, close and warm — never a neon bloom.
                shadowCta: (accent) => `0 0 30px color-mix(in srgb, ${accent} 34%, transparent)`,
                // One amber crown over the crowd and the beam through the
                // dark under grain — the static trace of the sweep idiom.
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `radial-gradient(1000px 480px at 50% -160px, color-mix(in srgb, ${accent} 13%, transparent), transparent 60%), ` +
                    `linear-gradient(115deg, transparent 42%, color-mix(in srgb, ${accent} 6%, transparent) 50%, transparent 58%)`,
            },
            // The same room with the doors open at noon: warm white walls,
            // ink signage, the amber deepened to hold on daylight — an
            // inversion of the night service, not a retreat to bone paper.
            light: {
                palette: {
                    pageBg: "#faf7f1",
                    surface: "#ffffff",
                    line: "#e2dbcb",
                    text: "#181510",
                    subtle: "#6e6553",
                    accent: "#a16207",
                },
                shadowCard: "none",
                shadowCta: (accent) => `0 8px 24px color-mix(in srgb, ${accent} 26%, transparent)`,
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `radial-gradient(1000px 480px at 50% -160px, color-mix(in srgb, ${accent} 7%, transparent), transparent 60%)`,
            },
        },
    },
    // The gig-poster register: the sheet stapled to the venue door, printed
    // loud. Aged poster paper under a halftone dot screen (the print
    // texture made literal), ink hairline rules, and display caps pushed
    // past the monumental ceiling — the type IS the layout, the way a
    // broadside names the band bigger than the photograph. One oxblood
    // accent, the color of a two-ink print run — never a candy hue. Still:
    // posters don't perform; the scale does. Where tourbook is the
    // photographer's field journal running beside the pictures and marquee
    // (the stage-night register) is the show itself, broadside is the
    // PRINTED ARTIFACT — type-forward where those are photo-forward, built
    // for bands, venues, tours, and record releases.
    broadside: {
        nativeMode: "light",
        fonts: { display: SPACE_GROTESK, body: INTER },
        display: {
            weight: "800",
            tracking: "0.01em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1.35",
        },
        shape: {
            // Print has corners; a radius would read as UI, not paper.
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "480ms" },
        treatment: ["grain", "outline", "hairline"],
        maxWidth: "1200px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f4efe4",
                    surface: "#fbf8f0",
                    line: "#c9c2b0",
                    text: "#1a1712",
                    subtle: "#6d665a",
                    accent: "#a63a2c",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                // The halftone screen: a 6px dot matrix at 3.5% ink over
                // grain — the page reads as a print run, not a gradient —
                // with the faintest warm crown where the masthead sits.
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='6'%3E%3Ccircle cx='1.5' cy='1.5' r='0.85' fill='%231a1712' opacity='0.035'/%3E%3C/svg%3E"), ` +
                    `radial-gradient(140% 42% at 50% 0%, color-mix(in srgb, ${accent} 6%, transparent), transparent 70%)`,
            },
            // The night bill: the same sheet printed in negative — ink
            // ground, bone type, the oxblood lifted to hold against the
            // dark paper, the dot screen ruled in faint bone.
            dark: {
                palette: {
                    pageBg: "#16130e",
                    surface: "#1e1a14",
                    line: "#3d372c",
                    text: "#f0e9da",
                    subtle: "#a29885",
                    accent: "#d05a41",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='6'%3E%3Ccircle cx='1.5' cy='1.5' r='0.85' fill='%23f0e9da' opacity='0.03'/%3E%3C/svg%3E"), ` +
                    `radial-gradient(140% 42% at 50% 0%, color-mix(in srgb, ${accent} 9%, transparent), transparent 70%)`,
            },
        },
    },
    // The phosphor terminal: the CRT itself, not a spec sheet. Pure-black
    // ground, mono type throughout, hairline rules, and the scanline
    // treatment (the raster made literal) under an accent glow. Accent-
    // agnostic on purpose: the brand overlay supplies the phosphor's color
    // — mint green for one machine, amber for another — so ONE register
    // carries every tube. Dark-native; the light variant is the morning
    // printout, the same session tractor-fed onto fanfold paper.
    // (Heritage lineage: the platform's "terminal" and "the-terminal"
    // dashboard skins — see repobot's theme/tokens.ts heritage catalog.)
    crt: {
        nativeMode: "dark",
        fonts: { display: PLEX_MONO, body: PLEX_MONO },
        display: { weight: "600", tracking: "0em", accentStyle: "normal", transform: "none", scale: "1" },
        shape: {
            radiusCard: "2px",
            radiusControl: "2px",
            borderWidth: "1px",
        },
        // Terminals repaint, they don't animate: still idiom, no rise.
        motion: { idiom: "still", rise: "0ms" },
        treatment: ["scanline", "glow"],
        maxWidth: "960px",
        modes: {
            dark: {
                palette: {
                    // True black, like the reference tube. Surfaces stay a
                    // hair off pure black — on a terminal, panels are
                    // borders on the screen, not lifted cards.
                    pageBg: "#000000",
                    surface: "#0a0a0a",
                    line: "#262626",
                    text: "#e8e8e2",
                    subtle: "#8f948c",
                    accent: "#a2d49a",
                },
                shadowCard: "none",
                // Phosphor bloom, close to the glass.
                shadowCta: (accent) => `0 0 28px color-mix(in srgb, ${accent} 42%, transparent)`,
                // The tube's own light: an accent haze at the crown and a
                // faint full-screen phosphor cast — the scanline overlay
                // (treatment CSS) rules the raster over it.
                backgroundPage: (accent) =>
                    `radial-gradient(1100px 640px at 50% -180px, color-mix(in srgb, ${accent} 10%, transparent), transparent 62%), ` +
                    `radial-gradient(140% 90% at 50% 40%, color-mix(in srgb, ${accent} 4%, transparent), transparent 75%)`,
            },
            // The paper printout: the same session on fanfold stock —
            // tractor-feed ruling instead of raster rows, the phosphor
            // deepened to ribbon-ink green.
            light: {
                palette: {
                    pageBg: "#f6f5ee",
                    surface: "#fdfcf6",
                    line: "#d8d6c8",
                    text: "#1d1f1c",
                    subtle: "#67695f",
                    accent: "#186b3a",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: (accent) =>
                    "repeating-linear-gradient(0deg, rgba(29, 31, 28, 0.03) 0 1px, transparent 1px 26px), " +
                    `radial-gradient(140% 44% at 50% 0%, color-mix(in srgb, ${accent} 5%, transparent), transparent 70%)`,
            },
        },
    },
    // The handheld LCD, the way the unlit glass actually read: a LIGHT
    // pea-green ground with olive ink — four desaturated greens, never
    // neon. Mono type set as chunky uppercase, hard zero radius,
    // double-weight rules, and the pixel treatment's dithered checker
    // wash. Light-native on purpose — the dark-only translation was the
    // identity loss this register exists to repair. The dark variant is
    // the backlit mod: the same four shades inverted, ink glass and pale
    // pixels.
    handheld: {
        nativeMode: "light",
        fonts: { display: PLEX_MONO, body: PLEX_MONO },
        display: {
            weight: "700",
            tracking: "0.02em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            // Chunky like the shell's molding: the pixel read needs rules
            // you can count.
            borderWidth: "2px",
        },
        // The hardware had no tweens: still idiom, no rise.
        motion: { idiom: "still", rise: "0ms" },
        treatment: ["pixel"],
        maxWidth: "1000px",
        modes: {
            light: {
                palette: {
                    pageBg: "#c4cfa1",
                    surface: "#b4bf90",
                    line: "#5c6847",
                    text: "#333b27",
                    subtle: "#5c6847",
                    accent: "#4a5238",
                },
                // The screen was flat glass: no elevation anywhere; ink
                // plates read as pressed buttons on their own.
                shadowCard: "none",
                shadowCta: () => "none",
                // The LCD's own pixel lattice at whisper opacity — the
                // dither wash rides in the pixel treatment overlay.
                backgroundPage: () =>
                    "repeating-linear-gradient(0deg, rgba(51, 59, 39, 0.05) 0 1px, transparent 1px 3px), " +
                    "repeating-linear-gradient(90deg, rgba(51, 59, 39, 0.05) 0 1px, transparent 1px 3px)",
            },
            // The backlit mod: ink glass, the pea-green now the light
            // itself — pale pixels glowing out of dark olive.
            dark: {
                palette: {
                    pageBg: "#1e2418",
                    surface: "#28301f",
                    line: "#49543a",
                    text: "#c4cfa1",
                    subtle: "#8d9a70",
                    accent: "#c4cfa1",
                },
                shadowCard: "none",
                shadowCta: (accent) => `0 0 22px color-mix(in srgb, ${accent} 30%, transparent)`,
                backgroundPage: () =>
                    "repeating-linear-gradient(0deg, rgba(196, 207, 161, 0.04) 0 1px, transparent 1px 3px), " +
                    "repeating-linear-gradient(90deg, rgba(196, 207, 161, 0.04) 0 1px, transparent 1px 3px)",
            },
        },
    },
    // The night lounge: near-black NEUTRAL ground (#121212 — not dark-dev's
    // navy ink), flat charcoal panels, pill-round cards and controls, and
    // one saturated accent that blooms — the glow is the only light in the
    // room. Dark-native; the light variant is the daytime session, the
    // same lounge with the house lights up. (The Jade Look's Spotify
    // lineage, restored from the dark-dev aurora it was flattened onto.)
    lounge: {
        nativeMode: "dark",
        fonts: { display: MANROPE, body: INTER },
        display: {
            weight: "800",
            tracking: "-0.03em",
            accentStyle: "normal",
            transform: "none",
            scale: "1",
        },
        shape: {
            radiusCard: "24px",
            radiusControl: "999px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "480ms" },
        treatment: ["glow"],
        maxWidth: "1080px",
        modes: {
            dark: {
                palette: {
                    pageBg: "#121212",
                    surface: "#1d1d1d",
                    line: "#2e2e2e",
                    text: "#ffffff",
                    subtle: "#a7a7a7",
                    accent: "#1db954",
                },
                // Flat panels over a deep throw — the lounge's cards sit in
                // the dark, they don't turn to glass.
                shadowCard: "0 12px 32px rgba(0, 0, 0, 0.45)",
                shadowCta: (accent) => `0 0 34px color-mix(in srgb, ${accent} 36%, transparent)`,
                // One accent bloom at the crown and the faintest white
                // spill opposite: stage light on a neutral black room,
                // never an aurora.
                backgroundPage: (accent) =>
                    `radial-gradient(1000px 520px at 16% -140px, color-mix(in srgb, ${accent} 16%, transparent), transparent 60%), ` +
                    "radial-gradient(900px 480px at 92% 110%, rgba(255, 255, 255, 0.03), transparent 55%)",
            },
            // Daytime session: warm-neutral paper, the green deepened to
            // hold ink-grade contrast, the same bloom at print strength.
            light: {
                palette: {
                    pageBg: "#f6f6f4",
                    surface: "#ffffff",
                    line: "#e2e2de",
                    text: "#121212",
                    subtle: "#6b6b66",
                    accent: "#169c46",
                },
                shadowCard: "0 1px 3px rgba(18, 18, 18, 0.06), 0 16px 40px rgba(18, 18, 18, 0.10)",
                shadowCta: (accent) => `0 8px 24px color-mix(in srgb, ${accent} 30%, transparent)`,
                backgroundPage: (accent) =>
                    `radial-gradient(1000px 520px at 16% -140px, color-mix(in srgb, ${accent} 9%, transparent), transparent 60%)`,
            },
        },
    },
    // The silver machine: bevel-chrome retroware. Desktop silver ground,
    // window-chrome surfaces, hard edges, zero radius, and the bevel
    // carried in inset outset-shadows instead of elevation. The key trick:
    // the page ground IS the desktop — backgroundPage derives from the
    // accent (the dark-dev pattern), so ONE register yields the teal
    // desktop, navy web chrome, green card felt, or toy-red plastic as
    // accent-driven washes; the Looks supply the accent. Light-native;
    // dark is the high-contrast scheme, the same chrome with the lights
    // off.
    retroware: {
        nativeMode: "light",
        fonts: { display: CHROME_SANS, body: CHROME_SANS },
        display: {
            weight: "700",
            tracking: "0em",
            accentStyle: "normal",
            transform: "none",
            scale: "1",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        // Windows didn't tween: still idiom, no rise.
        motion: { idiom: "still", rise: "0ms" },
        treatment: [],
        maxWidth: "1040px",
        modes: {
            light: {
                palette: {
                    pageBg: "#c0c0c0",
                    surface: "#d4d0c8",
                    line: "#808080",
                    text: "#000000",
                    subtle: "#3d3d3d",
                    accent: "#000080",
                },
                // The period bevel: light from the top-left, shade to the
                // bottom-right, one hard drop — panels sit proud like
                // dialogs, never float.
                shadowCard:
                    "inset -1px -1px 0 #808080, inset 1px 1px 0 #ffffff, 2px 2px 0 rgba(0, 0, 0, 0.25)",
                shadowCta: (accent) =>
                    `inset -1px -1px 0 color-mix(in srgb, #000000 40%, ${accent}), ` +
                    `inset 1px 1px 0 color-mix(in srgb, #ffffff 45%, ${accent}), ` +
                    "2px 2px 0 rgba(0, 0, 0, 0.3)",
                // The desktop wash: strong accent behind the hero, fading
                // toward working silver — teal for one Look, navy for
                // another, felt green or toy red for the rest.
                backgroundPage: (accent) =>
                    `linear-gradient(180deg, color-mix(in srgb, ${accent} 46%, #c0c0c0) 0px, ` +
                    `color-mix(in srgb, ${accent} 30%, #c0c0c0) 420px, ` +
                    `color-mix(in srgb, ${accent} 10%, #c0c0c0) 100%)`,
            },
            // The high-contrast scheme: charcoal chrome, bone type, the
            // same bevel grammar cut in black and half-light.
            dark: {
                palette: {
                    pageBg: "#1f1f1f",
                    surface: "#2b2b28",
                    line: "#565650",
                    text: "#f0f0ea",
                    subtle: "#a6a6a0",
                    accent: "#6f9edb",
                },
                shadowCard:
                    "inset -1px -1px 0 #000000, inset 1px 1px 0 #4c4c46, 2px 2px 0 rgba(0, 0, 0, 0.5)",
                shadowCta: (accent) =>
                    `inset -1px -1px 0 color-mix(in srgb, #000000 45%, ${accent}), ` +
                    `inset 1px 1px 0 color-mix(in srgb, #ffffff 30%, ${accent}), ` +
                    "2px 2px 0 rgba(0, 0, 0, 0.55)",
                backgroundPage: (accent) =>
                    `linear-gradient(180deg, color-mix(in srgb, ${accent} 30%, #1f1f1f) 0px, ` +
                    `color-mix(in srgb, ${accent} 16%, #1f1f1f) 420px, ` +
                    `color-mix(in srgb, ${accent} 6%, #1f1f1f) 100%)`,
            },
        },
    },
}

/** The variables of a preset that depend on the customer's brand or font —
 * everything a live repobot.theme.json edit can change on a marketing page. */
export interface PresetOverlay {
    accent: string
    accentSoft: string
    onAccent: string
    fontDisplay: string
    fontBody: string
    shadowCta: string
    backgroundPage: string
}

/**
 * The customer overlay, resolved (packs/README.md order: customer brand >
 * preset palette) for one appearance of a preset. `brand`/`font` are the
 * pack-overlay shapes from themeConfig (`packBrand` / `packFont`, or their
 * pure `resolvePack*` twins) — null means "keep the preset's own art
 * direction". `mode` is the RESOLVED appearance (the theme contract's mode
 * with "system" already settled), never the preset's native lean: the Feel
 * appearance toggle always wins.
 */
/**
 * A hueless accent (equal RGB channels — the monochrome registers' ink-on-
 * ground move) has no soft tint to give: mixing white into black just
 * manufactures gray, and a gray band on an ink-and-paper page reads as a
 * smudge, not a wash. Monochrome registers collapse accentSoft to the page
 * ground and let hairlines and type carry the structure.
 */
function achromatic(hex: string): boolean {
    const channels = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim())
    return channels !== null && channels[1] === channels[2] && channels[2] === channels[3]
}

export function resolvePresetOverlay(
    definition: PresetDefinition,
    mode: MarketingMode,
    brand: { accent: string; accentDark: string } | null,
    font: string | null,
): PresetOverlay {
    const variant = definition.modes[mode]
    const dark = mode === "dark"
    const accent = (dark ? brand?.accentDark : brand?.accent) ?? variant.palette.accent
    return {
        accent,
        accentSoft: achromatic(accent)
            ? variant.palette.pageBg
            : mixHex(accent, variant.palette.pageBg, dark ? 0.78 : 0.86),
        onAccent: contrastText(accent),
        fontDisplay: font ?? definition.fonts.display,
        fontBody: font ?? definition.fonts.body,
        shadowCta: variant.shadowCta(accent),
        backgroundPage: variant.backgroundPage(accent),
    }
}
