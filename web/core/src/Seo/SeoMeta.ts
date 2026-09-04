/**
 * Pure helpers for the SEO kernel (docs/seo.md): document-title composition,
 * canonical URLs, and JSON-LD builders. Platform-mirrorable plain functions —
 * the React binder that renders the tags is `web/app/src/Seo/PageMeta.tsx`.
 */

/**
 * Compose the document title from a page title and the site name:
 * "Pricing — Fieldbook". Either side may be absent (a home page usually IS
 * the site name); duplicates collapse so "Fieldbook — Fieldbook" can't ship.
 */
export function composeDocumentTitle(pageTitle: string | undefined, siteName: string | undefined): string {
    const title = pageTitle?.trim() ?? ""
    const site = siteName?.trim() ?? ""
    if (title === "" || title === site) {
        return site !== "" ? site : title
    }
    if (site === "") {
        return title
    }
    return `${title} — ${site}`
}

/**
 * Absolute canonical URL for a route: the deployed origin plus the declared
 * path (which may carry a meaningful query, e.g. a blog post's `?post=slug`).
 * The origin comes from the running page (`window.location.origin`), so the
 * canonical always matches the host the site is actually served from —
 * custom domains included — with zero configuration.
 */
export function buildCanonicalUrl(origin: string, path: string): string {
    return new URL(path, origin).toString()
}

export interface ArticleJsonLdInput {
    headline: string
    /** ISO date, e.g. "2026-06-18". */
    datePublished: string
    authorName: string
    description?: string
    /** Absolute canonical URL of the article. */
    url?: string
    /** Absolute URL of the article's share image. */
    image?: string
}

/** A schema.org Article object for a `<script type="application/ld+json">` tag. */
export function articleJsonLd(input: ArticleJsonLdInput): Record<string, unknown> {
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: input.headline,
        datePublished: input.datePublished,
        author: { "@type": "Person", name: input.authorName },
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.url !== undefined ? { url: input.url, mainEntityOfPage: input.url } : {}),
        ...(input.image !== undefined ? { image: [input.image] } : {}),
    }
}

/**
 * Serialize a JSON-LD object for embedding in a script tag. `<` is escaped
 * so content can never break out of the tag (`</script>` injection).
 */
export function serializeJsonLd(data: Record<string, unknown>): string {
    return JSON.stringify(data).replace(/</g, "\\u003c")
}
