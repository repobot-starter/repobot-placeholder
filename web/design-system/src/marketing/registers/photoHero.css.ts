import { globalStyle } from "@vanilla-extract/css"
import * as hero from "../MarketingHero.styles.css"

/*
 * The photo-hero guard. These treatments restyle the hero's copy for the
 * paper-ground heroes their own registers wear (split, statement,
 * invitation): page ink on the headline, a surface fill on the secondary
 * button. Remixed onto a page whose hero is a photograph (full-bleed-media,
 * masthead-overlay), that ink lands on the scrim, and a surface-filled
 * button takes the frame's white label with it. Inside the photographic
 * frame the copy is white in every register, as the hero's own base
 * styles set it; the treatment keeps its type, shape and ornament.
 *
 * Treatments whose registers author a photographic hero of their own
 * (sport, pulp, two-ink, metallic, …) style that frame deliberately and
 * are not listed.
 */
const GUARDED = [
    "transit",
    "sleeve",
    "wall-label",
    "candy",
    "pop",
    "colorblock",
    "atomic",
    "zine",
    "mirrorball",
    "taped",
    "lariat",
    "sunburst",
].map((name) => `[data-marketing-treatment~="${name}"] ${hero.fullBleed}`)

const within = (target: string): string => GUARDED.map((frame) => `${frame} ${target}`).join(", ")

globalStyle(within(hero.headline), {
    color: "#ffffff", // theme-exempt: copy over a photographic scrim is white in every theme
})
// colorblock inks its accent word with the page text under a paint stripe;
// over the photograph the word goes white and keeps the stripe.
globalStyle(`[data-marketing-treatment~="colorblock"] ${hero.fullBleed} ${hero.accentWord}`, {
    color: "#ffffff", // theme-exempt: copy over a photographic scrim is white in every theme
})
globalStyle(within(hero.subheadline), {
    color: "rgba(255, 255, 255, 0.85)", // theme-exempt: copy over a photographic scrim is white in every theme
})
globalStyle(`${within(hero.fullBleedSecondary)}, ${within(`${hero.fullBleedSecondary}:hover`)}`, {
    color: "#ffffff", // theme-exempt: copy over a photographic scrim is white in every theme
    background: "rgba(8, 10, 14, 0.32)", // theme-exempt: a smoked-glass plate over the photograph, not a theme surface
    borderColor: "rgba(255, 255, 255, 0.6)", // theme-exempt: copy over a photographic scrim is white in every theme
    boxShadow: "none",
})
