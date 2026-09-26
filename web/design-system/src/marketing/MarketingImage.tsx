import React from "react"
import { marketingSrc, type MarketingImageSource } from "./marketingContent"

export interface MarketingImageProps {
    src: string
    alt: string
    /** Intrinsic pixel dimensions — lets the browser reserve the box before load. */
    width?: number
    height?: number
    /** Pre-generated size variants (`npm run image -- responsive`). */
    srcSet?: MarketingImageSource[]
    /**
     * Layout hint for `srcSet` selection, e.g. "(min-width: 980px) 33vw,
     * 100vw". Defaults to the full viewport — safe (never blurry), at worst
     * over-fetching for small slots.
     */
    sizes?: string
    /**
     * Above-the-fold art (hero, backdrop): loads eagerly at high fetch
     * priority. Everything else lazy-loads.
     */
    priority?: boolean
    className?: string
    style?: React.CSSProperties
    /** Purely decorative images (e.g. an unlabeled backdrop). */
    ariaHidden?: boolean
}

/**
 * Lifts the image fields shared by the `image`/`browser` media kinds into
 * MarketingImage props — the one-liner every section's media helper uses.
 */
export function marketingImageProps(media: {
    src: string
    alt: string
    width?: number
    height?: number
    srcSet?: MarketingImageSource[]
}): Pick<MarketingImageProps, "src" | "alt" | "width" | "height" | "srcSet"> {
    return {
        src: media.src,
        alt: media.alt,
        width: media.width,
        height: media.height,
        srcSet: media.srcSet,
    }
}

/**
 * The kernel's one `<img>`: base-aware src, responsive `srcset`, intrinsic
 * dimensions for layout-shift-free loading, and lazy loading by default.
 * Every marketing section renders image media through this so the whole
 * page inherits the same loading discipline.
 */
export function MarketingImage({
    src,
    alt,
    width,
    height,
    srcSet,
    sizes,
    priority = false,
    className,
    style,
    ariaHidden,
}: MarketingImageProps): React.ReactElement {
    const srcSetAttr =
        srcSet !== undefined && srcSet.length > 0
            ? srcSet.map((source) => `${marketingSrc(source.src)} ${source.width}w`).join(", ")
            : undefined
    return (
        <img
            className={className}
            style={style}
            src={marketingSrc(src)}
            srcSet={srcSetAttr}
            sizes={srcSetAttr !== undefined ? (sizes ?? "100vw") : undefined}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
            aria-hidden={ariaHidden === true ? true : undefined}
        />
    )
}
