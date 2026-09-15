import React from "react"
import { type MarketingMedia } from "./marketingContent"
import { MarketingImage, marketingImageProps } from "./MarketingImage"
import { MarketingArtPanel } from "./MarketingGlyph"
import * as styles from "./MarketingBlogList.styles.css"

export type MarketingBlogListVariant = "cards" | "list"

export interface MarketingBlogPost {
    title: string
    date?: string
    excerpt?: string
    href: string
    media?: MarketingMedia
}

export interface MarketingBlogListContent {
    kicker?: string
    title?: string
    posts: MarketingBlogPost[]
}

export interface MarketingBlogListProps extends MarketingBlogListContent {
    variant?: MarketingBlogListVariant
    anchorId?: string
}

// Emoji and glyph media render as full-bleed generative art at this size —
// platform emoji and small centered marks both read as placeholders in a
// media slot, so the panel carries seeded artwork instead.
function PostMedia({ media, seedHint }: { media: MarketingMedia; seedHint?: string }): React.ReactElement {
    if (media.kind === "glyph" || media.kind === "emoji") {
        const seed = media.kind === "glyph" ? media.seed : `${seedHint ?? ""}${media.emoji}`
        return <MarketingArtPanel seed={seed} className={styles.mediaImg} />
    }
    return (
        <MarketingImage
            className={styles.mediaImg}
            {...marketingImageProps(media)}
            sizes="(min-width: 980px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
    )
}

/**
 * The post index: proof the lights are on. `cards` gives each post a media
 * slot on a grid; `list` is a rule-separated editorial column.
 */
export function MarketingBlogList({
    variant = "cards",
    anchorId,
    kicker,
    title,
    posts,
}: MarketingBlogListProps): React.ReactElement {
    return (
        <section id={anchorId} className={styles.wrap} aria-label={title ?? "Blog"}>
            {kicker !== undefined ? <span className={styles.kicker}>{kicker}</span> : null}
            {title !== undefined ? <h2 className={styles.title}>{title}</h2> : null}
            {variant === "list" ? (
                <div className={styles.list}>
                    {posts.map((post) => (
                        <article key={post.href} className={styles.listRow}>
                            {post.date !== undefined ? (
                                <span className={styles.date}>{post.date}</span>
                            ) : null}
                            <h3 className={styles.postTitle}>
                                <a className={styles.postLink} href={post.href}>
                                    {post.title}
                                </a>
                            </h3>
                            {post.excerpt !== undefined ? (
                                <p className={styles.excerpt}>{post.excerpt}</p>
                            ) : null}
                        </article>
                    ))}
                </div>
            ) : (
                <div className={styles.grid}>
                    {posts.map((post) => (
                        <article key={post.href} className={styles.card}>
                            {post.media !== undefined ? (
                                <PostMedia media={post.media} seedHint={post.title} />
                            ) : null}
                            {post.date !== undefined ? (
                                <span className={styles.date}>{post.date}</span>
                            ) : null}
                            <h3 className={styles.postTitle}>
                                <a className={styles.postLink} href={post.href}>
                                    {post.title}
                                </a>
                            </h3>
                            {post.excerpt !== undefined ? (
                                <p className={styles.excerpt}>{post.excerpt}</p>
                            ) : null}
                        </article>
                    ))}
                </div>
            )}
        </section>
    )
}
