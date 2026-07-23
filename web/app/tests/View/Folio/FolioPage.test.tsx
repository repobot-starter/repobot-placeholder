import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"
import { allTags, profile, projects } from "../../../src/View/Folio/content"
import FolioPage from "../../../src/View/Folio/FolioPage"

describe("FolioPage", () => {
    afterEach(() => {
        cleanup()
    })

    it("renders the hero and every project from content.ts", () => {
        render(<FolioPage />)

        expect(screen.getByRole("heading", { name: profile.statement })).toBeTruthy()
        for (const project of projects) {
            const card = screen.getByRole("link", { name: new RegExp(project.title) })
            expect(card.getAttribute("href")).toBe(project.url)
        }
        // Contact CTA is a mailto link on the profile email.
        const mailtos = screen
            .getAllByRole("link")
            .filter((link) => link.getAttribute("href") === `mailto:${profile.email}`)
        expect(mailtos.length).toBeGreaterThan(0)
    })

    it("narrows the grid when a tag chip is selected and restores on re-click", () => {
        render(<FolioPage />)

        const tag = allTags()[0]
        const inTag = projects.filter((project) => project.tags.includes(tag))
        const outOfTag = projects.find((project) => !project.tags.includes(tag))
        if (!outOfTag) throw new Error("fixture needs a project outside the first tag")

        fireEvent.click(screen.getByRole("button", { name: tag }))
        for (const project of inTag) {
            expect(screen.getByRole("link", { name: new RegExp(project.title) })).toBeTruthy()
        }
        expect(screen.queryByRole("link", { name: new RegExp(outOfTag.title) })).toBeNull()

        // Clicking the active chip clears the filter.
        fireEvent.click(screen.getByRole("button", { name: tag }))
        expect(screen.getByRole("link", { name: new RegExp(outOfTag.title) })).toBeTruthy()
    })

    it("derives unique tag chips covering every project tag", () => {
        const tags = allTags()
        expect(new Set(tags).size).toBe(tags.length)
        const everyTag = new Set(projects.flatMap((project) => project.tags))
        expect(new Set(tags)).toEqual(everyTag)
    })
})
