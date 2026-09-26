import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"
import { person, roles } from "../../../src/View/Resume/content"
import ResumePage from "../../../src/View/Resume/ResumePage"

describe("ResumePage (landing kernel)", () => {
    afterEach(() => {
        cleanup()
        vi.restoreAllMocks()
    })

    it("renders the name, every role, and the links band from content.ts", () => {
        render(
            <MemoryRouter>
                <ResumePage />
            </MemoryRouter>,
        )
        expect(screen.getByRole("heading", { name: `${person.name}.` })).toBeTruthy()
        for (const role of roles) {
            expect(screen.getByText(`${role.title} — ${role.company}`)).toBeTruthy()
        }
        // The links band delivers the link-in-bio pairing as real hrefs.
        const mailtos = screen
            .getAllByRole("link")
            .filter((link) => (link.getAttribute("href") ?? "").startsWith("mailto:"))
        expect(mailtos.length).toBeGreaterThan(0)
    })

    it("turns the Download résumé anchor into window.print()", () => {
        const print = vi.fn()
        vi.stubGlobal("print", print)
        render(
            <MemoryRouter>
                <ResumePage />
            </MemoryRouter>,
        )
        const cta = screen
            .getAllByRole("link")
            .find((link) => (link.getAttribute("href") ?? "").endsWith("#print"))
        expect(cta).toBeTruthy()
        fireEvent.click(cta as HTMLElement)
        expect(print).toHaveBeenCalledTimes(1)
    })
})
