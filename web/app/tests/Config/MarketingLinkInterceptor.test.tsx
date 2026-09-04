import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { afterEach, describe, expect, it } from "vitest"
import { MarketingLinkInterceptor } from "../../src/Config/MarketingLinkInterceptor"

/**
 * The interceptor promotes plain marketing `<a href>` clicks into SPA
 * navigations. The contract under test: same-origin links ride the router
 * (no full document reload — embedded previews never flash their loading
 * cover), while external links, new-tab links, downloads, and explicit
 * opt-outs stay native.
 */

function LocationProbe(): React.ReactElement {
    const location = useLocation()
    return <div data-testid="location">{`${location.pathname}${location.search}${location.hash}`}</div>
}

function renderHarness(anchors: React.ReactNode): void {
    render(
        <MemoryRouter initialEntries={["/"]}>
            <MarketingLinkInterceptor />
            <LocationProbe />
            <Routes>
                <Route path="*" element={<div>{anchors}</div>} />
            </Routes>
        </MemoryRouter>,
    )
}

function currentRouterPath(): string {
    return screen.getByTestId("location").textContent ?? ""
}

/**
 * Clicks and reports whether the interceptor claimed the event. The
 * recorder registers after the interceptor (bubble order on document), so
 * it sees the verdict — and it always preventDefaults itself, because a
 * genuinely native click would make jsdom attempt a real navigation and
 * corrupt window.location for every later test in this file.
 */
function clickClaimedBySpa(el: Element): boolean {
    let claimed = false
    const recorder = (event: MouseEvent): void => {
        claimed = event.defaultPrevented
        event.preventDefault()
    }
    document.addEventListener("click", recorder)
    try {
        fireEvent.click(el)
    } finally {
        document.removeEventListener("click", recorder)
    }
    return claimed
}

describe("MarketingLinkInterceptor", () => {
    afterEach(cleanup)

    it("routes a same-origin marketing link through the SPA router", () => {
        renderHarness(<a href="/work?tab=all#top">Work</a>)
        expect(clickClaimedBySpa(screen.getByText("Work"))).toBe(true)
        expect(currentRouterPath()).toBe("/work?tab=all#top")
    })

    it("leaves cross-origin links to the browser", () => {
        renderHarness(<a href="https://elsewhere.example.com/pricing">Away</a>)
        expect(clickClaimedBySpa(screen.getByText("Away"))).toBe(false)
        expect(currentRouterPath()).toBe("/")
    })

    it("leaves new-tab, download, and opted-out links native", () => {
        renderHarness(
            <>
                <a href="/a" target="_blank" rel="noreferrer">
                    NewTab
                </a>
                <a href="/b" download>
                    Download
                </a>
                <a href="/c" data-native-nav>
                    OptOut
                </a>
            </>,
        )
        for (const label of ["NewTab", "Download", "OptOut"]) {
            expect(clickClaimedBySpa(screen.getByText(label))).toBe(false)
        }
        expect(currentRouterPath()).toBe("/")
    })

    it("keeps modified clicks native (open-in-new-tab gestures)", () => {
        renderHarness(<a href="/work">Work</a>)
        let claimed = false
        const recorder = (event: MouseEvent): void => {
            claimed = event.defaultPrevented
            event.preventDefault()
        }
        document.addEventListener("click", recorder)
        try {
            fireEvent.click(screen.getByText("Work"), { metaKey: true })
        } finally {
            document.removeEventListener("click", recorder)
        }
        expect(claimed).toBe(false)
        expect(currentRouterPath()).toBe("/")
    })

    it("keeps same-path hash hops native for anchor scrolling", () => {
        // jsdom keeps window.location at "/", so a hash-only link targets
        // the current document — exactly the case native scrolling owns.
        renderHarness(<a href="/#faq">Faq</a>)
        expect(clickClaimedBySpa(screen.getByText("Faq"))).toBe(false)
        expect(currentRouterPath()).toBe("/")
    })

    it("reaches through nested markup to the enclosing anchor", () => {
        renderHarness(
            <a href="/about">
                <span>
                    <strong>About</strong>
                </span>
            </a>,
        )
        expect(clickClaimedBySpa(screen.getByText("About"))).toBe(true)
        expect(currentRouterPath()).toBe("/about")
    })
})
