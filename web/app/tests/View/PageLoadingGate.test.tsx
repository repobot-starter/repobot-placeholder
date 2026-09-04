import { PageLoadingGate } from "@base/design-system"
import { act, cleanup, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

beforeEach(() => {
    vi.useFakeTimers()
})

afterEach(() => {
    cleanup()
    vi.useRealTimers()
})

describe("PageLoadingGate", () => {
    it("gate style holds the whole page behind a spinner, then presents everything", () => {
        const { rerender } = render(
            <PageLoadingGate loading style="gate" minVisibleMs={300}>
                <span>page content</span>
            </PageLoadingGate>,
        )
        expect(screen.getByRole("status")).toBeTruthy()
        expect(screen.queryByText("page content")).toBeNull()

        // Data resolves quickly — the spinner still holds for its minimum
        // visible window so fast responses don't flash.
        act(() => vi.advanceTimersByTime(50))
        rerender(
            <PageLoadingGate loading={false} style="gate" minVisibleMs={300}>
                <span>page content</span>
            </PageLoadingGate>,
        )
        expect(screen.queryByText("page content")).toBeNull()

        act(() => vi.advanceTimersByTime(300))
        expect(screen.getByText("page content")).toBeTruthy()
        expect(screen.queryByRole("status")).toBeNull()
    })

    it("gate style skips the hold when the spinner already showed long enough", () => {
        const { rerender } = render(
            <PageLoadingGate loading style="gate" minVisibleMs={300}>
                <span>page content</span>
            </PageLoadingGate>,
        )
        act(() => vi.advanceTimersByTime(500))
        rerender(
            <PageLoadingGate loading={false} style="gate" minVisibleMs={300}>
                <span>page content</span>
            </PageLoadingGate>,
        )
        expect(screen.getByText("page content")).toBeTruthy()
    })

    it("progressive style renders content immediately without a skeleton", () => {
        render(
            <PageLoadingGate loading style="progressive">
                <span>page content</span>
            </PageLoadingGate>,
        )
        // Regions skeleton themselves; the gate never blocks the layout.
        expect(screen.getByText("page content")).toBeTruthy()
    })

    it("progressive style swaps a provided skeleton for the content", () => {
        const { rerender } = render(
            <PageLoadingGate loading style="progressive" minVisibleMs={0} skeleton={<span>placeholder</span>}>
                <span>page content</span>
            </PageLoadingGate>,
        )
        expect(screen.getByText("placeholder")).toBeTruthy()
        expect(screen.queryByText("page content")).toBeNull()

        rerender(
            <PageLoadingGate
                loading={false}
                style="progressive"
                minVisibleMs={0}
                skeleton={<span>placeholder</span>}
            >
                <span>page content</span>
            </PageLoadingGate>,
        )
        expect(screen.getByText("page content")).toBeTruthy()
    })
})
