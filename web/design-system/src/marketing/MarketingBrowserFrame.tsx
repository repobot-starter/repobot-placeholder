import React from "react"
import type { MarketingImageSource } from "./marketingContent"
import { MarketingImage } from "./MarketingImage"
import * as styles from "./MarketingBrowserFrame.styles.css"

export interface MarketingBrowserFrameProps {
    /** Servable screenshot path, e.g. `/showcase/waypoint-dashboard.png`. */
    src: string
    alt: string
    /** Address-bar text, e.g. `waypoint.app/overview`; omitted → dots only. */
    url?: string
    /** Intrinsic screenshot dimensions — reserves the box before load. */
    width?: number
    height?: number
    /** Pre-generated size variants (`npm run image -- responsive`). */
    srcSet?: MarketingImageSource[]
}

/**
 * A screenshot in CSS browser chrome — the self-referential product shot.
 * The frame (bar, dots, address pill) is all tokens, so it follows the
 * page's marketing preset; only the screenshot itself is an asset. Sections
 * reach it through the `browser` media kind rather than importing it.
 */
export function MarketingBrowserFrame({
    src,
    alt,
    url,
    width,
    height,
    srcSet,
}: MarketingBrowserFrameProps): React.ReactElement {
    return (
        <figure className={styles.frame}>
            <div className={styles.bar} aria-hidden>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
                {url !== undefined ? <span className={styles.addressPill}>{url}</span> : null}
            </div>
            <MarketingImage
                className={styles.img}
                src={src}
                alt={alt}
                width={width}
                height={height}
                srcSet={srcSet}
            />
        </figure>
    )
}
