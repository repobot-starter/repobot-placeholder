import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { links, profile, socials, themes } from "../../../src/View/Link/content"
import LinkPage from "../../../src/View/Link/LinkPage"

describe("LinkPage", () => {
    beforeEach(() => {
        localStorage.clear()
    })

    afterEach(() => {
        cleanup()
    })

    it("renders the profile and every link from content.ts", () => {
        render(<LinkPage />)

        expect(screen.getByRole("heading", { name: profile.name })).toBeTruthy()
        expect(screen.getByText(profile.bio)).toBeTruthy()
        for (const link of links) {
            const row = screen.getByRole("link", { name: new RegExp(link.label) })
            expect(row.getAttribute("href")).toBe(link.url)
            // Outbound links must not leak the opener window.
            expect(row.getAttribute("rel")).toContain("noreferrer")
        }
        for (const social of socials) {
            expect(screen.getByRole("link", { name: social.label })).toBeTruthy()
        }
    })

    it("persists the picked theme across mounts", () => {
        render(<LinkPage />)

        const second = themes[1]
        fireEvent.click(screen.getByRole("button", { name: `${second.label} theme` }))
        expect(localStorage.getItem("linkbot-theme")).toBe(second.key)

        cleanup()
        render(<LinkPage />)
        const swatch = screen.getByRole("button", { name: `${second.label} theme` })
        expect(swatch.getAttribute("aria-pressed")).toBe("true")
    })

    it("keeps every content URL on https", () => {
        for (const entry of [...links, ...socials]) {
            expect(entry.url.startsWith("https://")).toBe(true)
        }
    })
})
