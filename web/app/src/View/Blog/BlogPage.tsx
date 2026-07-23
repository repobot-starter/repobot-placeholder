import React, { useEffect, useMemo, useState } from "react"
import { allTags, author, blog, posts, sortedPosts, type BlogPost } from "./content"
import { parseMarkdown, readingTimeMinutes, type Block, type Inline } from "./markdown"
import * as styles from "./BlogPage.styles.css"

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
                {post.tags.map((tag) => (
                    <span key={tag} className={styles.postTag}>
                        {tag}
                    </span>
                ))}
            </div>
            <div className={styles.articleBody}>
                {blocks.map((block, index) => (
                    <BlockView key={index} block={block} />
                ))}
            </div>
            <footer className={styles.footer}>
                <strong>{author.name}</strong> — {author.bio}
            </footer>
        </article>
    )
}

export default function BlogPage(): React.ReactElement {
    const [activeTag, setActiveTag] = useState<string | null>(null)
    const [openSlug, setOpenSlug] = useState<string | null>(null)

    const ordered = useMemo(() => sortedPosts(posts), [])
    const tags = useMemo(() => allTags(ordered), [ordered])
    const visible = activeTag ? ordered.filter((post) => post.tags.includes(activeTag)) : ordered
    const openPost = openSlug ? ordered.find((post) => post.slug === openSlug) : undefined

    useEffect(() => {
        window.scrollTo({ top: 0 })
    }, [openSlug])

    return (
        <div className={styles.page}>
            <div className={styles.frame}>
                {openPost ? (
                    <ArticleView post={openPost} onBack={() => setOpenSlug(null)} />
                ) : (
                    <>
                        <header className={styles.masthead}>
                            <h1 className={styles.blogTitle}>{blog.title}</h1>
                            <p className={styles.tagline}>{blog.tagline}</p>
                            <div className={styles.authorRow}>
                                <div className={styles.avatar} aria-hidden>
                                    {author.initials}
                                </div>
                                <div>
                                    <div className={styles.authorName}>{author.name}</div>
                                    <div className={styles.authorRole}>{author.role}</div>
                                </div>
                            </div>
                        </header>
                        <div className={styles.tagRow}>
                            <button
                                type="button"
                                className={`${styles.tagChip} ${activeTag === null ? styles.tagChipActive : ""}`}
                                onClick={() => setActiveTag(null)}
                            >
                                All
                            </button>
                            {tags.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    className={`${styles.tagChip} ${activeTag === tag ? styles.tagChipActive : ""}`}
                                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                        <div className={styles.postList}>
                            {visible.map((post, index) => (
                                <button
                                    key={post.slug}
                                    type="button"
                                    className={styles.postCard}
                                    style={{ animationDelay: `${index * 60}ms` }}
                                    onClick={() => setOpenSlug(post.slug)}
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
                        </div>
                        <footer className={styles.footer}>
                            {blog.title} — written by {author.name}. Built with Repobot.
                        </footer>
                    </>
                )}
            </div>
        </div>
    )
}
