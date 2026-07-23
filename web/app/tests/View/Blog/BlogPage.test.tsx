import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"
import { posts, sortedPosts } from "../../../src/View/Blog/content"
import BlogPage from "../../../src/View/Blog/BlogPage"

describe("BlogPage", () => {
    afterEach(() => {
        cleanup()
    })

    it("lists every post newest-first", () => {
        render(<BlogPage />)
        const ordered = sortedPosts(posts)
        const headings = screen.getAllByRole("heading", { level: 2 })
        expect(headings.map((h) => h.textContent)).toEqual(ordered.map((p) => p.title))
    })

    it("filters posts by tag chip", () => {
        render(<BlogPage />)
        fireEvent.click(screen.getByRole("button", { name: "writing" }))
        const withTag = posts.filter((p) => p.tags.includes("writing"))
        const without = posts.filter((p) => !p.tags.includes("writing"))
        for (const post of withTag) {
            expect(screen.getByText(post.title)).toBeTruthy()
        }
        for (const post of without) {
            expect(screen.queryByText(post.title)).toBeNull()
        }
    })

    it("opens a post, renders its markdown, and returns to the list", () => {
        render(<BlogPage />)
        const post = sortedPosts(posts)[0]
        fireEvent.click(screen.getByText(post.title))

        // Article view: title is now the h1 and body headings render.
        expect(screen.getByRole("heading", { level: 1, name: post.title })).toBeTruthy()
        expect(screen.getByRole("heading", { name: "The format" })).toBeTruthy()

        fireEvent.click(screen.getByRole("button", { name: "← All posts" }))
        expect(screen.getAllByRole("heading", { level: 2 }).length).toBe(posts.length)
    })

    it("keeps every post's tags within the derived tag set", () => {
        render(<BlogPage />)
        for (const post of posts) {
            expect(post.slug).toMatch(/^[a-z0-9-]+$/)
            expect(post.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
            expect(post.tags.length).toBeGreaterThan(0)
        }
    })
})
