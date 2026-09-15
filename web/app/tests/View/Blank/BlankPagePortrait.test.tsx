import { act, cleanup, render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import BlankPage from "../../../src/View/Blank/BlankPage"

/**
 * The spaceboy starter must keep its subjects (the boy AND the moon) in
 * frame on phone-shaped viewports: the landscape 1440x900 art is
 * slice-cropped, so a narrow viewport switches the svg to the portrait
 * 720x1080 re-staging. The viewport aspect is observed via ResizeObserver
 * on the page root. Mirrors the workspace SpaceboyScene test (main repo,
 * web/app/tests/View/Dashboard/VibeSession/SpaceboyScene.test.tsx).
 */

type ResizeCallback = (entries: unknown[], observer: unknown) => void

let observedNodes: Element[]
let resizeCallbacks: ResizeCallback[]

class FakeResizeObserver {
    private readonly callback: ResizeCallback

    constructor(callback: ResizeCallback) {
        this.callback = callback
        resizeCallbacks.push(callback)
    }

    observe(node: Element): void {
        observedNodes.push(node)
    }

    disconnect(): void {}
    unobserve(): void {}
}

function setViewportSize(width: number, height: number): void {
    for (const node of observedNodes) {
        ;(node as HTMLElement).getBoundingClientRect = () =>
            ({ width, height, top: 0, left: 0, right: width, bottom: height, x: 0, y: 0 }) as DOMRect
    }
    act(() => {
        for (const callback of resizeCallbacks) {
            callback([], undefined)
        }
    })
}

describe("BlankPage portrait re-staging", () => {
    beforeEach(() => {
        observedNodes = []
        resizeCallbacks = []
        vi.stubGlobal("ResizeObserver", FakeResizeObserver)
    })

    afterEach(() => {
        cleanup()
        vi.unstubAllGlobals()
    })

    it("keeps the landscape composition on wide viewports", () => {
        const { container } = render(<BlankPage />)
        setViewportSize(1280, 800)
        expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 1440 900")
    })

    it("re-stages onto the portrait canvas in a phone-shaped viewport", () => {
        const { container } = render(<BlankPage />)
        setViewportSize(390, 844)
        const svg = container.querySelector("svg")
        expect(svg?.getAttribute("viewBox")).toBe("0 0 720 1080")
        // Both subjects sit inside the visible center band of a slice-cropped
        // 720x1080 world at the 390x844 aspect: x in [~112, ~608].
        const moonDisc = svg?.querySelector('circle[fill="url(#spaceboy-moon)"]')
        const cx = Number(moonDisc?.getAttribute("cx"))
        const r = Number(moonDisc?.getAttribute("r"))
        expect(cx - r).toBeGreaterThan(112)
        expect(cx + r).toBeLessThan(608)
    })

    it("returns to landscape when the viewport widens again", () => {
        const { container } = render(<BlankPage />)
        setViewportSize(390, 844)
        setViewportSize(1440, 900)
        expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 1440 900")
    })

    it("renders without ResizeObserver (defaults to landscape)", () => {
        vi.stubGlobal("ResizeObserver", undefined)
        const { container } = render(<BlankPage />)
        expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 1440 900")
    })

    it("switches exactly at the square threshold", () => {
        const { container } = render(<BlankPage />)
        setViewportSize(800, 900)
        expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 720 1080")
        setViewportSize(900, 900)
        expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 1440 900")
    })
})
