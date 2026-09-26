import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"
import { blog, posts, sortedPosts } from "../../../src/View/Blog/content"
import BlogPage from "../../../src/View/Blog/BlogPage"

// The masthead reads the live project manifest, which is customer data —
// setup stamps `brand.logo` into repobot.project.json, swapping the text
// wordmark for the committed logo image. Pin a manifest fixture so this
// suite tests both branches deterministically instead of asserting the
// template's unbranded state (which failed agent gates in every branded
// project and pushed setup agents to drop the logo just to get green).
const mockManifest = vi.hoisted(() => ({
    marketing: {
        preset: "editorial",
        pages: [] as unknown[],
        brand: undefined as { logo?: string } | undefined,
    },
    dashboard: { destinations: [] as unknown[] },
}))
vi.mock("../../../src/Config/projectManifest", async (importOriginal) => ({
    ...(await importOriginal<object>()),
    projectManifest: mockManifest,
}))

// The open post lives in the URL (`?post=<slug>`), so the page needs a
// router; MemoryRouter stands in for the app's BrowserRouter.
function renderBlog(initialPath = "/blog") {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <BlogPage />
        </MemoryRouter>,
    )
}

describe("BlogPage", () => {
    afterEach(() => {
        cleanup()
        mockManifest.marketing.brand = undefined
    })

    it("lists every post newest-first", () => {
        renderBlog()
        const ordered = sortedPosts(posts)
        const headings = screen.getAllByRole("heading", { level: 2 })
        expect(headings.map((h) => h.textContent)).toEqual(ordered.map((p) => p.title))
    })

    it("renders a logo-only masthead and the attribution footer, nothing else", () => {
        renderBlog()
        // The nav is the blog's name as a home link — no other nav links.
        const nav = screen.getByRole("navigation", { name: "Site" })
        expect(nav.textContent).toBe(blog.title)
        // The footer is exactly the configured attribution line, link-free.
        expect(screen.getByText(blog.attribution)).toBeTruthy()
        expect(screen.getByRole("contentinfo").querySelector("a")).toBeNull()
    })

    it("swaps the masthead text for the committed brand logo once stamped", () => {
        mockManifest.marketing.brand = { logo: "/brand/logo-transparent.png" }
        renderBlog()
        const nav = screen.getByRole("navigation", { name: "Site" })
        const image = nav.querySelector("img")
        expect(image?.getAttribute("alt")).toBe(blog.title)
        expect(image?.getAttribute("src")).toContain("/brand/logo-transparent.png")
    })

    it("opens a post, renders its markdown, and returns to the list", () => {
        renderBlog()
        const post = sortedPosts(posts)[0]
        fireEvent.click(screen.getByText(post.title))

        // Article view: title is now the h1 and body headings render.
        expect(screen.getByRole("heading", { level: 1, name: post.title })).toBeTruthy()
        expect(screen.getByRole("heading", { name: "The format" })).toBeTruthy()

        fireEvent.click(screen.getByRole("button", { name: "← All posts" }))
        expect(screen.getAllByRole("heading", { level: 2 }).length).toBe(posts.length)
    })

    it("opens a post directly from its ?post= URL", () => {
        const post = sortedPosts(posts)[1]
        renderBlog(`/blog?post=${post.slug}`)
        expect(screen.getByRole("heading", { level: 1, name: post.title })).toBeTruthy()
    })

    it("keeps well-formed post metadata", () => {
        renderBlog()
        for (const post of posts) {
            expect(post.slug).toMatch(/^[a-z0-9-]+$/)
            expect(post.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
            expect(post.tags.length).toBeGreaterThan(0)
        }
    })

    it("declares the blog's document meta on the index", () => {
        renderBlog()
        expect(document.title).toBe(blog.title)
        const description = document.head.querySelector<HTMLMetaElement>('meta[name="description"]')
        expect(description?.content).toBe(blog.description)
        expect(document.head.querySelector<HTMLMetaElement>('meta[property="og:type"]')?.content).toBe(
            "website",
        )
    })

    it("declares per-post meta with the post's canonical ?post= URL", () => {
        const post = sortedPosts(posts)[0]
        renderBlog(`/blog?post=${post.slug}`)
        expect(document.title).toBe(`${post.title} — ${blog.title}`)
        const description = document.head.querySelector<HTMLMetaElement>('meta[name="description"]')
        expect(description?.content).toBe(post.summary)
        expect(document.head.querySelector<HTMLMetaElement>('meta[property="og:type"]')?.content).toBe(
            "article",
        )
        const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
        expect(canonical?.href).toBe(`${window.location.origin}/blog?post=${post.slug}`)
    })

    it("emits valid Article JSON-LD for an open post", () => {
        const post = sortedPosts(posts)[0]
        renderBlog(`/blog?post=${post.slug}`)
        const script = document.querySelector('script[type="application/ld+json"]')
        expect(script).not.toBeNull()
        const parsed = JSON.parse(script?.textContent ?? "") as Record<string, unknown>
        expect(parsed["@context"]).toBe("https://schema.org")
        expect(parsed["@type"]).toBe("Article")
        expect(parsed.headline).toBe(post.title)
        expect(parsed.datePublished).toBe(post.date)
        expect(parsed.author).toMatchObject({ "@type": "Person" })
        expect(parsed.url).toBe(`${window.location.origin}/blog?post=${post.slug}`)
    })

    it("emits no Article JSON-LD on the index", () => {
        renderBlog()
        expect(document.querySelector('script[type="application/ld+json"]')).toBeNull()
    })
})
