import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import React from "react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import TestCheckoutPage from "../../../src/View/Shop/TestCheckoutPage"

const { sessionQueryMock, completeSessionMock } = vi.hoisted(() => ({
    sessionQueryMock: vi.fn(),
    completeSessionMock: vi.fn(),
}))

vi.mock("../../../src/generated/graphql/types", () => ({
    useCheckoutSessionQuery: (...args: unknown[]) => sessionQueryMock(...args),
    useCompleteTestCheckoutSessionMutation: () => [completeSessionMock, { loading: false }],
}))

function renderCheckout(initialEntry: string): void {
    render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
                <Route path="/checkout/test" element={<TestCheckoutPage />} />
                <Route path="/checkout/success" element={<h1>Order confirmed</h1>} />
            </Routes>
        </MemoryRouter>,
    )
}

describe("TestCheckoutPage", () => {
    beforeEach(() => {
        sessionQueryMock.mockReset()
        completeSessionMock.mockReset()
        sessionQueryMock.mockReturnValue({
            data: {
                checkoutSession: {
                    id: "csn_1",
                    provider: "LOCAL",
                    status: "PENDING",
                    checkoutUrl: "http://localhost:5173/checkout/test?session=csn_1",
                    productName: "The Lighthouse Letters",
                    amountTotal: 2400,
                    currency: "usd",
                },
            },
            loading: false,
            error: undefined,
        })
    })

    afterEach(() => {
        cleanup()
    })

    it("renders the simulated checkout, clearly labeled as a test", () => {
        renderCheckout("/checkout/test?session=csn_1")
        expect(screen.getByText(/Test checkout — no real payment/)).toBeTruthy()
        expect(screen.getByRole("heading", { name: "Complete your order" })).toBeTruthy()
        expect(screen.getByText("The Lighthouse Letters")).toBeTruthy()
        expect(screen.getByText("$24.00")).toBeTruthy()
        // The mock card field makes it obvious nothing real is charged.
        expect(screen.getByText("4242 4242 4242 4242")).toBeTruthy()
    })

    it("completes the session on Pay and navigates to the success page", async () => {
        completeSessionMock.mockResolvedValue({
            data: { completeTestCheckoutSession: { id: "csn_1", status: "PAID" } },
        })
        renderCheckout("/checkout/test?session=csn_1")

        fireEvent.click(screen.getByRole("button", { name: "Pay (test)" }))
        await waitFor(() => {
            expect(completeSessionMock).toHaveBeenCalledTimes(1)
        })
        expect(completeSessionMock.mock.calls[0]![0].variables.input.sessionId).toBe("csn_1")
        await waitFor(() => {
            expect(screen.getByRole("heading", { name: "Order confirmed" })).toBeTruthy()
        })
    })

    it("shows a not-found state when the session parameter is missing", () => {
        sessionQueryMock.mockReturnValue({ data: undefined, loading: false, error: undefined })
        renderCheckout("/checkout/test")
        expect(screen.getByRole("heading", { name: "Checkout not found" })).toBeTruthy()
        expect(screen.getByText("← Back to the shop")).toBeTruthy()
    })
})
