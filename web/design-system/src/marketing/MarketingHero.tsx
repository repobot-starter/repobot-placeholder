import React from "react"
import { SectionBackdrop, type MarketingBackdrop } from "./MarketingBackdrop"
import { MarketingBrowserFrame } from "./MarketingBrowserFrame"
import { LeadCaptureFields, type MarketingLeadCaptureContent } from "./MarketingLeadForm"
import {
    marketingHref,
    splitAccentWord,
    type MarketingAccentPlacement,
    type MarketingCta,
    type MarketingMedia,
} from "./marketingContent"
import { MarketingImage, marketingImageProps } from "./MarketingImage"
import { marketingMediaStamp, marketingTextStamp } from "./marketingItemStamp"
import { MarketingArtPanel } from "./MarketingGlyph"
import * as styles from "./MarketingHero.styles.css"

export type MarketingHeroVariant =
    | "centered-stack"
    | "split-media"
    | "statement"
    | "form-first"
    | "product-frame"
    | "full-bleed-media"
    | "panel-collage"
    | "masthead-overlay"

export interface MarketingHeroContent {
    /** Optional pill above the headline (availability, launch status). */
    badge?: string
    /** One word gets the accent treatment (see `accent`); default: the last. */
    headline: string
    /**
     * Where the headline's accent lands: `last-word` (default — end on the
     * word that pops), `first-word` (editorial open), or `none` (pure
     * typography; brutalist/spec-sheet registers read cleaner bare).
     */
    accent?: MarketingAccentPlacement
    subheadline?: string
    primaryCta?: MarketingCta
    secondaryCta?: MarketingCta
    /** `split-media`/`product-frame` place it beside the copy; centered variants below. */
    media?: MarketingMedia
    /**
     * `full-bleed-media` only: several photographs on a slow crossfade
     * (~6s per frame). Wins over `media`; under reduced motion the first
     * frame holds. Image entries with `srcSet` stay responsive.
     */
    slides?: MarketingMedia[]
    /**
     * Full-bleed artwork behind the hero — copy renders over the scrim.
     * Ignored by `full-bleed-media`, where the photograph is the hero
     * itself rather than a backdrop.
     */
    backdrop?: MarketingBackdrop
    /** `form-first` only: lead capture rendered inside the hero. */
    form?: MarketingLeadCaptureContent
    /**
     * `panel-collage` only: up to two small product crops floating over the
     * framed media's edges (a stat card, an approval row) — the launch-page
     * collage. The first lands lower-left, the second upper-right.
     */
    fragments?: MarketingMedia[]
}

export interface MarketingHeroProps extends MarketingHeroContent {
    variant?: MarketingHeroVariant
    anchorId?: string
    /** `form-first` only, injected by the binder. */
    formJoined?: boolean
    onFormSubmit?: (email: string) => void
}

function HeroMedia({
    media,
    centered,
    seedHint,
}: {
    media: MarketingMedia
    centered: boolean
    seedHint?: string
}): React.ReactElement {
    const frame = centered ? `${styles.media} ${styles.mediaCentered}` : styles.media
    // Emoji and glyph media render as full-bleed generative art at hero
    // size — platform emoji and small centered marks both read as
    // placeholders in a media slot, so the panel carries seeded artwork.
    if (media.kind === "glyph" || media.kind === "emoji") {
        const seed = media.kind === "glyph" ? media.seed : `${seedHint ?? ""}${media.emoji}`
        return (
            <div className={frame} {...marketingMediaStamp("media", 0)}>
                <MarketingArtPanel seed={seed} className={styles.mediaImg} />
            </div>
        )
    }
    if (media.kind === "browser") {
        return (
            <div className={frame} {...marketingMediaStamp("media", 0)}>
                <MarketingBrowserFrame
                    src={media.src}
                    alt={media.alt}
                    url={media.url}
                    width={media.width}
                    height={media.height}
                    srcSet={media.srcSet}
                />
            </div>
        )
    }
    return (
        <div className={frame} {...marketingMediaStamp("media", 0)}>
            {/* Hero media is above the fold — eager, high-priority load. */}
            <MarketingImage className={styles.mediaImg} {...marketingImageProps(media)} priority />
        </div>
    )
}

/** CSS browser chrome around the media — the zero-asset product frame. */
function HeroProductFrame({
    media,
    seedHint,
}: {
    media: MarketingMedia
    seedHint?: string
}): React.ReactElement {
    if (media.kind === "emoji" || media.kind === "glyph") {
        const seed = media.kind === "glyph" ? media.seed : `${seedHint ?? ""}${media.emoji}`
        return (
            <div className={styles.productFrame}>
                <div className={styles.productFrameBar} aria-hidden>
                    <span className={styles.productFrameDot} />
                    <span className={styles.productFrameDot} />
                    <span className={styles.productFrameDot} />
                </div>
                {/* The frame supplies the chrome; the art fills the viewport. */}
                <MarketingArtPanel seed={seed} />
            </div>
        )
    }
    return (
        <MarketingBrowserFrame
            src={media.src}
            alt={media.alt}
            url={media.kind === "browser" ? media.url : undefined}
            width={media.width}
            height={media.height}
            srcSet={media.srcSet}
        />
    )
}

/** A full-bleed slide: a photograph (or art panel) painted edge to edge. */
function FullBleedSlide({
    media,
    index,
    active,
    priority,
    seedHint,
}: {
    media: MarketingMedia
    index: number
    active: boolean
    priority: boolean
    seedHint?: string
}): React.ReactElement {
    const frame = active ? `${styles.fullBleedSlide} ${styles.fullBleedSlideActive}` : styles.fullBleedSlide
    if (media.kind === "glyph" || media.kind === "emoji") {
        const seed = media.kind === "glyph" ? media.seed : `${seedHint ?? ""}${media.emoji}`
        return (
            <div className={frame} aria-hidden={!active} {...marketingMediaStamp("slides", index)}>
                <MarketingArtPanel seed={seed} className={styles.fullBleedImg} />
            </div>
        )
    }
    return (
        <div className={frame} aria-hidden={!active} {...marketingMediaStamp("slides", index)}>
            <MarketingImage
                className={styles.fullBleedImg}
                {...marketingImageProps(media)}
                priority={priority}
            />
        </div>
    )
}

/**
 * `full-bleed-media`: the photograph is the hero. Viewport-wide and most of
 * the viewport tall; copy floats low over a dark grade; several `slides`
 * crossfade slowly. Under reduced motion the first frame holds.
 *
 * `masthead-overlay` (the `masthead` flag) is its type-dominant reading:
 * the same photograph, but the headline grows to masthead scale — display
 * type AS the layout, filling the frame's width over the image — with the
 * badge set as a small kicker above it. The register's own display voice
 * (case, family, scale) decides whether it reads as an expedition cover or
 * a wedding marquee.
 */
function HeroFullBleed({
    anchorId,
    badge,
    headline,
    accent,
    subheadline,
    primaryCta,
    secondaryCta,
    media,
    slides,
    masthead = false,
}: MarketingHeroProps & { masthead?: boolean }): React.ReactElement {
    const frames = React.useMemo(
        () => (slides !== undefined && slides.length > 0 ? slides : media !== undefined ? [media] : []),
        [slides, media],
    )
    const [active, setActive] = React.useState(0)

    React.useEffect(() => {
        if (frames.length < 2) {
            return
        }
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return
        }
        const timer = window.setInterval(() => {
            setActive((current) => (current + 1) % frames.length)
        }, 6000)
        return () => window.clearInterval(timer)
    }, [frames.length])

    const { lead, accentWord, trail } = splitAccentWord(headline, accent)
    return (
        <header id={anchorId} className={styles.fullBleed}>
            {frames.map((frame, index) => (
                <FullBleedSlide
                    key={index}
                    media={frame}
                    index={index}
                    active={index === active}
                    priority={index === 0}
                    seedHint={headline}
                />
            ))}
            <div className={styles.fullBleedScrim} aria-hidden />
            <div className={styles.fullBleedInner}>
                {badge !== undefined ? (
                    <span
                        className={masthead ? styles.mastheadKicker : styles.fullBleedBadge}
                        {...marketingTextStamp("badge")}
                    >
                        {badge}
                    </span>
                ) : null}
                <h1
                    className={`${styles.headline} ${masthead ? styles.mastheadHeadline : styles.fullBleedHeadline}`}
                    {...marketingTextStamp("headline")}
                >
                    {lead}
                    {accentWord !== "" ? (
                        <>
                            {lead !== "" ? " " : null}
                            <span className={styles.accentWord}>{accentWord}</span>
                        </>
                    ) : null}
                    {trail !== "" ? ` ${trail}` : null}
                </h1>
                {subheadline !== undefined ? (
                    <p
                        className={`${styles.subheadline} ${styles.fullBleedSubheadline}`}
                        {...marketingTextStamp("subheadline")}
                    >
                        {subheadline}
                    </p>
                ) : null}
                {primaryCta || secondaryCta ? (
                    <div className={styles.ctaRow}>
                        {primaryCta ? (
                            <a
                                className={styles.primary}
                                href={marketingHref(primaryCta)}
                                {...marketingTextStamp("primaryCta.label")}
                            >
                                {primaryCta.label}
                            </a>
                        ) : null}
                        {secondaryCta ? (
                            <a
                                className={styles.fullBleedSecondary}
                                href={marketingHref(secondaryCta)}
                                {...marketingTextStamp("secondaryCta.label")}
                            >
                                {secondaryCta.label}
                            </a>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </header>
    )
}

/**
 * `panel-collage`: centered copy over the product in CSS browser chrome,
 * with up to two small product crops floating over the frame's edges — the
 * flagship-launch collage. Fragments are plain image media (crops of real
 * UI) with their own card chrome supplied here.
 */
function HeroPanelCollage({
    media,
    fragments,
    headline,
}: {
    media: MarketingMedia
    fragments: MarketingMedia[]
    headline: string
}): React.ReactElement {
    return (
        <div className={styles.collage}>
            <div className={styles.collageFrame}>
                <HeroProductFrame media={media} seedHint={headline} />
            </div>
            {fragments.slice(0, 2).map((fragment, index) =>
                fragment.kind === "image" || fragment.kind === "browser" ? (
                    <div
                        key={index}
                        className={index === 0 ? styles.collageFragmentLeft : styles.collageFragmentRight}
                        {...marketingMediaStamp("fragments", index)}
                    >
                        <MarketingImage
                            className={styles.collageFragmentImg}
                            {...marketingImageProps(fragment)}
                            priority
                        />
                    </div>
                ) : null,
            )}
        </div>
    )
}

/**
 * The landing hero. Variants: `centered-stack` (copy and CTAs centered),
 * `split-media` (copy beside a visual), `statement` (oversized editorial
 * sentence, left-aligned), `form-first` (centered copy over lead capture),
 * `product-frame` (copy beside the media in CSS browser chrome),
 * `full-bleed-media` (the photograph is the hero; copy floats over it),
 * `panel-collage` (centered copy over the framed product with floating
 * UI-crop fragments — the flagship-launch collage), `masthead-overlay`
 * (full-bleed photograph under a masthead-scale headline — the type-led
 * reading of the photographic hero).
 */
export function MarketingHero({
    variant = "centered-stack",
    anchorId,
    badge,
    headline,
    accent,
    subheadline,
    primaryCta,
    secondaryCta,
    media,
    slides,
    backdrop,
    form,
    formJoined = false,
    onFormSubmit,
    fragments,
}: MarketingHeroProps): React.ReactElement {
    if (variant === "full-bleed-media" || variant === "masthead-overlay") {
        return (
            <HeroFullBleed
                anchorId={anchorId}
                badge={badge}
                headline={headline}
                accent={accent}
                subheadline={subheadline}
                primaryCta={primaryCta}
                secondaryCta={secondaryCta}
                media={media}
                slides={slides}
                masthead={variant === "masthead-overlay"}
            />
        )
    }
    const centered = variant === "centered-stack" || variant === "form-first" || variant === "panel-collage"
    const { lead, accentWord, trail } = splitAccentWord(headline, accent)

    const headlineClass = [
        styles.headline,
        centered ? styles.headlineCentered : "",
        variant === "statement" ? styles.headlineStatement : "",
    ]
        .filter(Boolean)
        .join(" ")

    const copy = (
        <>
            {badge !== undefined ? (
                <span className={styles.badge} {...marketingTextStamp("badge")}>
                    {badge}
                </span>
            ) : null}
            <h1 className={headlineClass} {...marketingTextStamp("headline")}>
                {lead}
                {accentWord !== "" ? (
                    <>
                        {lead !== "" ? " " : null}
                        <span className={styles.accentWord}>{accentWord}</span>
                    </>
                ) : null}
                {trail !== "" ? ` ${trail}` : null}
            </h1>
            {subheadline !== undefined ? (
                <p
                    className={
                        centered ? `${styles.subheadline} ${styles.subheadlineCentered}` : styles.subheadline
                    }
                    {...marketingTextStamp("subheadline")}
                >
                    {subheadline}
                </p>
            ) : null}
            {variant === "form-first" && form && onFormSubmit ? (
                <div className={styles.formSlot}>
                    <LeadCaptureFields
                        placeholder={form.placeholder}
                        cta={form.cta}
                        confirmation={form.confirmation}
                        joined={formJoined}
                        onSubmit={onFormSubmit}
                    />
                </div>
            ) : primaryCta || secondaryCta ? (
                <div className={centered ? `${styles.ctaRow} ${styles.ctaRowCentered}` : styles.ctaRow}>
                    {primaryCta ? (
                        <a
                            className={styles.primary}
                            href={marketingHref(primaryCta)}
                            {...marketingTextStamp("primaryCta.label")}
                        >
                            {primaryCta.label}
                        </a>
                    ) : null}
                    {secondaryCta ? (
                        <a
                            className={styles.secondary}
                            href={marketingHref(secondaryCta)}
                            {...marketingTextStamp("secondaryCta.label")}
                        >
                            {secondaryCta.label}
                        </a>
                    ) : null}
                </div>
            ) : null}
        </>
    )

    // With a backdrop the anchor id moves to the bleed wrapper, so on-page
    // nav links land on the full art-directed band, not the inner column.
    const headerId = backdrop ? undefined : anchorId
    const body =
        variant === "split-media" || variant === "product-frame" ? (
            <header id={headerId} className={styles.split}>
                <div>{copy}</div>
                {media ? (
                    variant === "product-frame" ? (
                        <HeroProductFrame media={media} seedHint={headline} />
                    ) : (
                        <HeroMedia media={media} centered={false} seedHint={headline} />
                    )
                ) : (
                    <div />
                )}
            </header>
        ) : variant === "panel-collage" ? (
            <header id={headerId} className={styles.centered}>
                {copy}
                {media ? (
                    <HeroPanelCollage media={media} fragments={fragments ?? []} headline={headline} />
                ) : null}
            </header>
        ) : (
            <header id={headerId} className={variant === "statement" ? styles.statement : styles.centered}>
                {copy}
                {media ? <HeroMedia media={media} centered={centered} seedHint={headline} /> : null}
            </header>
        )

    if (backdrop) {
        return (
            <SectionBackdrop backdrop={backdrop} anchorId={anchorId} priority>
                {body}
            </SectionBackdrop>
        )
    }
    return body
}
