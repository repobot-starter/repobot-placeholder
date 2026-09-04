import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ScrollReset } from "../../src/Config/ScrollReset"

/**
 * The contract under test: a router PUSH to a new location starts at the
 * top of the page (SPA navigations otherwise keep the previous page's
 * scroll position), an anchor-carrying navigation scrolls its target into
 * view instead, and back/forward (POP) is left entirely to the browser's
 * own scroll restoration.
 */

function Navigator(): React.ReactElement {
    const navigate = useNavigate()
    return (
        <>
            <button onClick={() => void navigate("/work")}>GoWork</button>
            <button onClick={() => void navigate("/work#team")}>GoTeam</button>
            <button onClick={() => void navigate(-1)}>GoBack</button>
        </>
    )
}

function renderHarness(): void {
    render(
        <MemoryRouter initialEntries={["/"]}>
            <ScrollReset />
            <Navigator />
            <Routes>
                <Route path="/" element={<div>Home</div>} />
                <Route
                    path="/work"
                    element={
                        <div>
                            Work
                            <div id="team">Team</div>
                        </div>
                    }
                />
            </Routes>
        </MemoryRouter>,
    )
}

describe("ScrollReset", () => {
    beforeEach(() => {
        // jsdom implements neither; the assertions are the calls themselves.
        window.scrollTo = vi.fn()
        Element.prototype.scrollIntoView = vi.fn()
    })

    afterEach(cleanup)

    it("scrolls to the top on a PUSH to a new page", () => {
        renderHarness()
        expect(window.scrollTo).not.toHaveBeenCalled()
        fireEvent.click(screen.getByText("GoWork"))
        expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
    })

    it("scrolls an anchor-carrying navigation to its target, not the top", () => {
        renderHarness()
        fireEvent.click(screen.getByText("GoTeam"))
        expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
        expect(window.scrollTo).not.toHaveBeenCalled()
    })

    it("leaves back/forward (POP) to the browser's scroll restoration", () => {
        renderHarness()
        fireEvent.click(screen.getByText("GoWork"))
        vi.mocked(window.scrollTo).mockClear()
        fireEvent.click(screen.getByText("GoBack"))
        expect(window.scrollTo).not.toHaveBeenCalled()
    })
})
