import { articleJsonLd, buildCanonicalUrl } from "@base/core"
import { MarketingPage, MarketingShell } from "@ui"
import React, { useEffect, useMemo } from "react"
import { useLocation, useSearchParams } from "react-router-dom"
import { projectManifest } from "../../Config/projectManifest"
import { defaultShareImage, JsonLd, PageMeta } from "../../Seo/PageMeta"
import { author, blog, posts, sortedPosts, type BlogPost } from "./content"
import { parseMarkdown, readingTimeMinutes, type Block, type Inline } from "./markdown"
import * as styles from "./BlogPage.styles.css"

/**
 * The blog template: a logo-only masthead (the `MarketingShell` nav's
 * `logo-only` variant), a typography-first list of the posts themselves —
 * date, title, opening summary, the whole row a click target — and a
 * one-line attribution footer (`blog.attribution` in content.ts). No hero,
 * no about link, no read-more buttons: the writing is the design.
 *
 * The open post lives in the URL (`?post=<slug>`), so every article has a
 * shareable, crawlable address wherever the blog is mounted (`/` when the
 * pack is active, `/blog` otherwise). Each view declares its document meta
 * through the SEO kernel, and open posts emit schema.org Article JSON-LD
 * from the same content fields (docs/seo.md).
 */

function formatDate(iso: string): string {
    const [year, month, day] = iso.split("-").map(Number)
    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })
}

function InlineSpan({ inline }: { inline: Inline }): React.ReactElement {
    switch (inline.kind) {
        case "bold":
            return <strong>{inline.text}</strong>
        case "italic":
            return <em>{inline.text}</em>
        case "code":
            return <code className={styles.inlineCode}>{inline.text}</code>
        case "link":
            return (
                <a className={styles.bodyLink} href={inline.href} target="_blank" rel="noreferrer">
                    {inline.text}
                </a>
            )
        default:
            return <>{inline.text}</>
    }
}

function Inlines({ inlines }: { inlines: Inline[] }): React.ReactElement {
    return (
        <>
            {inlines.map((inline, index) => (
                <InlineSpan key={index} inline={inline} />
            ))}
        </>
    )
}

function BlockView({ block }: { block: Block }): React.ReactElement {
    switch (block.kind) {
        case "heading": {
            const Tag = block.level === 1 ? "h2" : block.level === 2 ? "h3" : "h4"
            return (
                <Tag className={styles.bodyHeading}>
                    <Inlines inlines={block.inlines} />
                </Tag>
            )
        }
        case "quote":
            return (
                <blockquote className={styles.bodyQuote}>
                    <Inlines inlines={block.inlines} />
                </blockquote>
            )
        case "code":
            return <pre className={styles.bodyCode}>{block.text}</pre>
        case "list": {
            const items = block.items.map((item, index) => (
                <li key={index}>
                    <Inlines inlines={item} />
                </li>
            ))
            return block.ordered ? (
                <ol className={styles.bodyList}>{items}</ol>
            ) : (
                <ul className={styles.bodyList}>{items}</ul>
            )
        }
        case "divider":
            return <hr className={styles.bodyDivider} />
        default:
            return (
                <p className={styles.bodyParagraph}>
                    <Inlines inlines={block.inlines} />
                </p>
            )
    }
}

function ArticleView({ post, onBack }: { post: BlogPost; onBack: () => void }): React.ReactElement {
    const blocks = useMemo(() => parseMarkdown(post.body), [post])
    return (
        <article className={styles.article}>
            <button type="button" className={styles.backLink} onClick={onBack}>
                ← All posts
            </button>
            <h1 className={styles.articleTitle}>{post.title}</h1>
            <div className={styles.postMeta}>
                <span>{formatDate(post.date)}</span>
                <span>·</span>
                <span>{readingTimeMinutes(post.body)} min read</span>
            </div>
            <div className={styles.articleBody}>
                {blocks.map((block, index) => (
                    <BlockView key={index} block={block} />
                ))}
            </div>
            <footer className={styles.byline}>
                <strong>{author.name}</strong> — {author.bio}
            </footer>
        </article>
    )
}

export default function BlogPage(): React.ReactElement {
    const [searchParams, setSearchParams] = useSearchParams()
    const location = useLocation()
    const openSlug = searchParams.get("post")

    const ordered = useMemo(() => sortedPosts(posts), [])
    const openPost = openSlug !== null ? ordered.find((post) => post.slug === openSlug) : undefined

    useEffect(() => {
        window.scrollTo({ top: 0 })
    }, [openSlug])

    // Per-view document meta (docs/seo.md): the index carries the blog's
    // identity; an open post carries its own title/summary as an article,
    // canonicalized to its shareable `?post=` URL.
    const canonicalPath =
        openPost !== undefined ? `${location.pathname}?post=${openPost.slug}` : location.pathname
    const shareImage = defaultShareImage()

    // The committed brand logo (stamped during setup) replaces the text
    // wordmark automatically, same as every manifest-driven marketing nav.
    const brandLogo = projectManifest.marketing.brand?.logo
    return (
        <MarketingPage preset="editorial" overrides={{ "--marketing-layout-maxWidth": "720px" }}>
            {openPost !== undefined ? (
                <>
                    <PageMeta
                        title={openPost.title}
                        siteName={blog.title}
                        description={openPost.summary}
                        type="article"
                        path={canonicalPath}
                    />
                    <JsonLd
                        data={articleJsonLd({
                            headline: openPost.title,
                            datePublished: openPost.date,
                            authorName: author.name,
                            description: openPost.summary,
                            url: buildCanonicalUrl(window.location.origin, canonicalPath),
                            ...(shareImage !== undefined
                                ? { image: buildCanonicalUrl(window.location.origin, shareImage) }
                                : {}),
                        })}
                    />
                </>
            ) : (
                <PageMeta
                    title={blog.title}
                    siteName={blog.title}
                    description={blog.description}
                    path={canonicalPath}
                />
            )}
            <MarketingShell
                nav={{
                    variant: "logo-only",
                    content: {
                        logo: {
                            name: blog.title,
                            ...(brandLogo !== undefined ? { imageSrc: brandLogo } : {}),
                        },
                    },
                }}
                footer={{ variant: "simple", content: { note: blog.attribution } }}
            >
                {openPost ? (
                    <ArticleView post={openPost} onBack={() => setSearchParams({})} />
                ) : (
                    <main className={styles.postList}>
                        {ordered.map((post, index) => (
                            <button
                                key={post.slug}
                                type="button"
                                className={styles.postRow}
                                style={{ animationDelay: `${index * 60}ms` }}
                                onClick={() => setSearchParams({ post: post.slug })}
                            >
                                <div className={styles.postMeta}>
                                    <span>{formatDate(post.date)}</span>
                                    <span>·</span>
                                    <span>{readingTimeMinutes(post.body)} min read</span>
                                </div>
                                <h2 className={styles.postTitle}>{post.title}</h2>
                                <p className={styles.postSummary}>{post.summary}</p>
                            </button>
                        ))}
                    </main>
                )}
            </MarketingShell>
        </MarketingPage>
    )
}
