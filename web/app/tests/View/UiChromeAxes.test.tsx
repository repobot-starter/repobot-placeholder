import { AuthCard, Dialog, EmptyState, ToastProvider, uiConfig, useToast } from "@base/design-system"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"

afterEach(cleanup)

/*
 * The Phase-2c chrome axes: each component takes the repobot.theme.json
 * `ui` preset as its default and accepts a per-instance prop override.
 * These tests pin the override switch for every variant and that the
 * default path lands on whatever this checkout's contract resolves —
 * never a hardcoded look (themed projects commit their own contract).
 */

describe("Dialog modal chrome (ui.modals.chrome)", () => {
    it("defaults to the contract's chrome", () => {
        render(
            <Dialog open onOpenChange={() => {}} title="Create record">
                <span>fields</span>
            </Dialog>,
        )
        expect(screen.getByRole("dialog").getAttribute("data-chrome")).toBe(uiConfig.modals.chrome)
    })

    it.each(["centered", "sheet", "takeover"] as const)("renders the %s chrome on request", (chrome) => {
        render(
            <Dialog open onOpenChange={() => {}} title="Create record" chrome={chrome}>
                <span>fields</span>
            </Dialog>,
        )
        const dialog = screen.getByRole("dialog")
        expect(dialog.getAttribute("data-chrome")).toBe(chrome)
        // Every chrome keeps the standard anatomy: title, close, body.
        expect(screen.getByText("Create record")).toBeTruthy()
        expect(screen.getByLabelText("Close")).toBeTruthy()
        expect(screen.getByText("fields")).toBeTruthy()
    })

    it("the page presentation ignores the chrome axis (its own treatment)", () => {
        render(
            <Dialog open onOpenChange={() => {}} title="Create record" presentation="page" chrome="sheet">
                <span>fields</span>
            </Dialog>,
        )
        expect(screen.getByRole("dialog").getAttribute("data-chrome")).toBeNull()
        // The page header leads with the X — sheet chrome must not rewire it.
        const close = screen.getByLabelText("Close")
        const title = screen.getByText("Create record")
        expect(close.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })
})

describe("AuthCard chrome (ui.auth.layout's bare treatment)", () => {
    it("wears the floating card by default", () => {
        const { container } = render(<AuthCard appName="Test App" />)
        expect(container.querySelector('[data-chrome="card"]')).toBeTruthy()
    })

    it("dissolves the card chrome when bare", () => {
        const { container } = render(<AuthCard appName="Test App" chrome="bare" />)
        expect(container.querySelector('[data-chrome="bare"]')).toBeTruthy()
        // The bare card still carries the whole flow: brand + email field.
        expect(screen.getByText("Test App")).toBeTruthy()
        expect(screen.getByLabelText("Email")).toBeTruthy()
    })
})

describe("EmptyState voice (ui.empty.voice)", () => {
    it("defaults to the contract's voice", () => {
        const { container } = render(<EmptyState title="No records yet" />)
        expect(container.firstElementChild?.getAttribute("data-voice")).toBe(uiConfig.empty.voice)
    })

    it("the standard voice shows the heading without a pictogram", () => {
        const { container } = render(
            <EmptyState title="No records yet" description="Create one to get started." voice="standard" />,
        )
        expect(container.querySelector("svg")).toBeNull()
        expect(screen.getByRole("heading", { name: "No records yet" })).toBeTruthy()
    })

    it("the illustrated voice frames the state and carries a hero pictogram", () => {
        const { container } = render(<EmptyState title="No records yet" voice="illustrated" />)
        expect(container.firstElementChild?.getAttribute("data-voice")).toBe("illustrated")
        // The fallback pictogram appears even when the caller passes no icon.
        expect(container.querySelector("svg")).toBeTruthy()
    })

    it("the quiet voice hides the pictogram even when one is passed", () => {
        const { container } = render(
            <EmptyState title="No records yet" voice="quiet" icon={<svg data-testid="pict" />} />,
        )
        expect(container.querySelector("svg")).toBeNull()
        expect(screen.getByRole("heading", { name: "No records yet" })).toBeTruthy()
    })

    it("the action-forward voice leads with the CTA, before the copy", () => {
        render(
            <EmptyState
                title="No records yet"
                description="Create one to get started."
                action={<button type="button">New record</button>}
                voice="actionForward"
            />,
        )
        const cta = screen.getByRole("button", { name: "New record" })
        const copy = screen.getByText("Create one to get started.")
        expect(cta.compareDocumentPosition(copy) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it("the standard voice keeps the CTA after the copy", () => {
        render(
            <EmptyState
                title="No records yet"
                description="Create one to get started."
                action={<button type="button">New record</button>}
                voice="standard"
            />,
        )
        const cta = screen.getByRole("button", { name: "New record" })
        const copy = screen.getByText("Create one to get started.")
        expect(copy.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })
})

function PublishOnClick(): React.ReactElement {
    const toast = useToast()
    return (
        <button type="button" onClick={() => toast.publish({ title: "Saved", description: "All good." })}>
            publish
        </button>
    )
}

function renderToastHost(props?: {
    position?: "bottomRight" | "topRight" | "bottomCenter"
    variant?: "edge" | "solid" | "soft"
}): HTMLElement {
    render(
        <ToastProvider position={props?.position} variant={props?.variant}>
            <PublishOnClick />
        </ToastProvider>,
    )
    fireEvent.click(screen.getByRole("button", { name: "publish" }))
    return screen.getByRole("region", { name: "Notifications" })
}

describe("Toast host (ui.toasts.position + ui.toasts.style)", () => {
    it("defaults to the contract's placement and dressing", () => {
        const viewport = renderToastHost()
        expect(viewport.getAttribute("data-position")).toBe(uiConfig.toasts.position)
        expect(viewport.querySelector('[role="status"]')?.getAttribute("data-style")).toBe(
            uiConfig.toasts.style,
        )
    })

    it.each(["bottomRight", "topRight", "bottomCenter"] as const)("stacks at %s on request", (position) => {
        const viewport = renderToastHost({ position })
        expect(viewport.getAttribute("data-position")).toBe(position)
    })

    it.each(["edge", "solid", "soft"] as const)("dresses cards as %s on request", (variant) => {
        const viewport = renderToastHost({ variant })
        const card = viewport.querySelector('[role="status"]')
        expect(card?.getAttribute("data-style")).toBe(variant)
        expect(screen.getByText("Saved")).toBeTruthy()
        expect(screen.getByText("All good.")).toBeTruthy()
    })
})
