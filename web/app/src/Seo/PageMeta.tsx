import { buildCanonicalUrl, composeDocumentTitle, serializeJsonLd } from "@base/core"
import React from "react"
import { useLocation } from "react-router-dom"
import { projectManifest } from "../Config/projectManifest"

/**
 * The SEO kernel's one meta surface (docs/seo.md): a page declares its meta
 * by rendering `<PageMeta …/>`, and React 19's native head hoisting applies
 * the `<title>`, `<meta>`, and `<link rel="canonical">` tags — swapped
 * automatically on route change as the rendered page changes. Document meta
 * is never hand-set anywhere else (`document.title` writes in app code are
 * an ESLint error).
 *
 * Fallbacks, so a page with only a title still ships complete tags:
 * - Site name: `repobot.project.json` `marketing.siteName`, else the
 *   manifest home page's title. The document title composes as
 *   "Page — Site" and collapses duplicates.
 * - Share image: `marketing.brand.social` (the committed social/OG card,
 *   expected at `web/app/public/brand/social.png`), else `marketing.brand.logo`.
 * - Canonical URL: the running origin plus the current route (declared
 *   `path` wins when given), so custom domains need no configuration.
 */
export interface PageMetaProps {
    /** The page's own title; composed with the site name for the document title. */
    title?: string
    /** Meta + Open Graph description. Omitted tags are omitted, never emptied. */
    description?: string
    /**
     * Route path (plus any meaningful query) for the canonical URL, e.g.
     * "/pricing" or "/blog?post=slug". Defaults to the current location.
     */
    path?: string
    /** Servable path or absolute URL for og:image; defaults to the brand social asset. */
    image?: string
    /** Open Graph object type; "article" for blog posts and the like. */
    type?: "website" | "article"
    /** Robots hints, e.g. "noindex, nofollow". Omitted = indexable. */
    robots?: string
    /**
     * Override the manifest-derived site name (a pack rendering its own
     * brand, e.g. the blog's masthead title, passes it here).
     */
    siteName?: string
}

/** The manifest-derived site name: `marketing.siteName`, else the home page's title. */
export function siteNameFromManifest(): string | undefined {
    const { marketing } = projectManifest
    return marketing.siteName ?? marketing.pages.find((page) => page.path === "/")?.title
}

/** The manifest-derived default share image: the brand social card, else the logo. */
export function defaultShareImage(): string | undefined {
    const brand = projectManifest.marketing.brand
    return brand?.social ?? brand?.logo
}

export function PageMeta({
    title,
    description,
    path,
    image,
    type = "website",
    robots,
    siteName,
}: PageMetaProps): React.ReactElement {
    const location = useLocation()
    const origin = window.location.origin
    const resolvedSiteName = siteName ?? siteNameFromManifest()
    const documentTitle = composeDocumentTitle(title, resolvedSiteName)
    const canonical = buildCanonicalUrl(origin, path ?? `${location.pathname}${location.search}`)
    const resolvedImage = image ?? defaultShareImage()
    const imageUrl = resolvedImage !== undefined ? buildCanonicalUrl(origin, resolvedImage) : undefined
    const ogTitle = title ?? resolvedSiteName ?? documentTitle
    return (
        <>
            {documentTitle !== "" && <title>{documentTitle}</title>}
            <link rel="canonical" href={canonical} />
            {description !== undefined && <meta name="description" content={description} />}
            {robots !== undefined && <meta name="robots" content={robots} />}
            {ogTitle !== "" && <meta property="og:title" content={ogTitle} />}
            {description !== undefined && <meta property="og:description" content={description} />}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={canonical} />
            {imageUrl !== undefined && <meta property="og:image" content={imageUrl} />}
            {resolvedSiteName !== undefined && <meta property="og:site_name" content={resolvedSiteName} />}
            <meta name="twitter:card" content={imageUrl !== undefined ? "summary_large_image" : "summary"} />
            {ogTitle !== "" && <meta name="twitter:title" content={ogTitle} />}
            {description !== undefined && <meta name="twitter:description" content={description} />}
            {imageUrl !== undefined && <meta name="twitter:image" content={imageUrl} />}
        </>
    )
}

/**
 * Structured data (JSON-LD) as content: render with a built object from
 * `@base/core` (e.g. `articleJsonLd`). Serialized with `<` escaped so the
 * payload can never break out of the script tag.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }): React.ReactElement {
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />
}
