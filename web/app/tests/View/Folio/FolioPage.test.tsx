import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it } from "vitest"
import { allTags, profile, projects } from "../../../src/View/Folio/content"
import FolioPage from "../../../src/View/Folio/FolioPage"

describe("FolioPage (landing kernel)", () => {
    afterEach(() => {
        cleanup()
    })

    it("renders the hero and every project from content.ts", () => {
        render(
            <MemoryRouter>
                <FolioPage />
            </MemoryRouter>,
        )

        expect(screen.getByRole("heading", { name: profile.statement })).toBeTruthy()
        for (const project of projects) {
            const card = screen.getByRole("link", { name: project.title })
            expect(card.getAttribute("href")).toBe(project.url)
        }
        // Contact CTAs are mailto links on the profile email.
        const mailtos = screen
            .getAllByRole("link")
            .filter((link) => (link.getAttribute("href") ?? "").startsWith("mailto:"))
        expect(mailtos.length).toBeGreaterThan(0)
        for (const link of mailtos) {
            expect(link.getAttribute("href")).toBe(`mailto:${profile.email}`)
        }
    })

    it("narrows the grid when a tag chip is selected and restores via All", () => {
        render(
            <MemoryRouter>
                <FolioPage />
            </MemoryRouter>,
        )

        const tag = allTags()[0]
        const inTag = projects.filter((project) => project.tags.includes(tag))
        const outOfTag = projects.find((project) => !project.tags.includes(tag))
        if (!outOfTag) throw new Error("fixture needs a project outside the first tag")

        fireEvent.click(screen.getByRole("button", { name: tag }))
        for (const project of inTag) {
            expect(screen.getByRole("link", { name: project.title })).toBeTruthy()
        }
        expect(screen.queryByRole("link", { name: outOfTag.title })).toBeNull()

        // The "All" chip clears the filter.
        fireEvent.click(screen.getByRole("button", { name: "All" }))
        expect(screen.getByRole("link", { name: outOfTag.title })).toBeTruthy()
    })

    it("derives unique tag chips covering every project tag", () => {
        const tags = allTags()
        expect(new Set(tags).size).toBe(tags.length)
        const everyTag = new Set(projects.flatMap((project) => project.tags))
        expect(new Set(tags)).toEqual(everyTag)
    })
})
