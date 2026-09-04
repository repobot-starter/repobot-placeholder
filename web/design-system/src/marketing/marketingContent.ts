/**
 * Content primitives shared across marketing sections. These shapes are part
 * of the landing kernel's public vocabulary (docs/landing-kernel-spec.md §8):
 * plain data, so a whole page can live in one typed config file.
 */

/** A link target: an on-page anchor (section type name) or an external href. */
export interface MarketingCta {
    label: string
    /** Anchor id of a section on the page, e.g. "pricing" or "lead-form". */
    anchor?: string
    /** External/absolute target; wins over `anchor` when both are set. */
    href?: string
}

/**
 * One pre-generated size variant of an image (`npm run image -- responsive`
 * emits these): the file and its pixel width, for the browser's `srcset`
 * selection.
 */
export interface MarketingImageSource {
    src: string
    width: number
}

/**
 * Zero-asset-first media slot: a seeded generative mark (`glyph` — accent-
 * keyed artwork drawn from the seed, the house alternative to stock icons
 * and emoji), an emoji seed, a real image, or a screenshot presented in CSS
 * browser chrome (`browser` — the self-referential product shot; `url` is
 * the address-bar text).
 *
 * `glyph` and `emoji` render identically: an icon-scale geometric mark in
 * small slots, a full-bleed gradient art panel (MarketingArtPanel) in
 * media-sized slots. Raw platform emoji are never rendered — they read as
 * template filler — so an `emoji` value only differentiates the artwork's
 * seed. Prefer `glyph` seeded by the item's title in new content.
 *
 * Image kinds carry optional intrinsic `width`/`height` (the browser
 * reserves the box before the file arrives — no layout shift) and an
 * optional `srcSet` of pre-generated size variants so phones never download
 * desktop-sized files. Photography-grade pages should always provide both;
 * `npm run image -- responsive` emits ready-to-paste entries.
 */
export type MarketingMedia =
    | { kind: "glyph"; seed: string }
    | { kind: "emoji"; emoji: string }
    | {
          kind: "image"
          src: string
          alt: string
          width?: number
          height?: number
          srcSet?: MarketingImageSource[]
      }
    | {
          kind: "browser"
          src: string
          alt: string
          url?: string
          width?: number
          height?: number
          srcSet?: MarketingImageSource[]
      }

/**
 * Static builds can mount the app under a subpath (template demos live at
 * /games/<pack>/); marketing sections render plain anchors that bypass the
 * router's basename, so root-relative hrefs get the Vite base prefixed here.
 * Deployed products serve at "/", where this is a no-op.
 */
const BASE_PATH = ((import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? "/").replace(/\/$/, "")

export function marketingHref(cta: MarketingCta): string {
    const target = cta.href ?? (cta.anchor !== undefined ? `#${cta.anchor}` : "#")
    return target.startsWith("/") ? `${BASE_PATH}${target}` : target
}

/** Base-aware home link for logo lockups. */
export function marketingHomeHref(): string {
    return BASE_PATH === "" ? "/" : `${BASE_PATH}/`
}

/** Base-aware asset path for root-relative media srcs (see marketingHref). */
export function marketingSrc(src: string): string {
    return src.startsWith("/") ? `${BASE_PATH}${src}` : src
}

/**
 * Where a headline's accent treatment lands. `last-word` is the house
 * default ("end the sentence on the word you want to pop"); `first-word`
 * opens on the accent (an editorial lean); `none` leaves the headline as
 * pure typography — brutalist and spec-sheet registers read cleaner bare.
 */
export type MarketingAccentPlacement = "last-word" | "first-word" | "none"

/**
 * The accent-word convention: one word of the headline gets the accent
 * treatment, so art direction is a side effect of writing one good sentence.
 * Placement is a style choice (`MarketingAccentPlacement`); the default
 * keeps the original grammar — the last word pops.
 */
export function splitAccentWord(
    headline: string,
    placement: MarketingAccentPlacement = "last-word",
): { lead: string; accentWord: string; trail: string } {
    const trimmed = headline.trim()
    const words = trimmed.split(" ")
    if (placement === "none" || words.length <= 1) {
        // A one-word headline accented in full reads as a logo, not a
        // sentence — bare type is the honest rendering either way.
        return { lead: trimmed, accentWord: "", trail: "" }
    }
    if (placement === "first-word") {
        return { lead: "", accentWord: words[0] ?? "", trail: words.slice(1).join(" ") }
    }
    return {
        lead: words.slice(0, -1).join(" "),
        accentWord: words[words.length - 1] ?? "",
        trail: "",
    }
}
