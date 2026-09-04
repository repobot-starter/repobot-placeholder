import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import React from "react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import TestBillingPage from "../../../src/View/Billing/TestBillingPage"

const { subscriptionQueryMock, cancelSubscriptionMock, refetchMock } = vi.hoisted(() => ({
    subscriptionQueryMock: vi.fn(),
    cancelSubscriptionMock: vi.fn(),
    refetchMock: vi.fn(),
}))

vi.mock("../../../src/generated/graphql/types", () => ({
    useMySubscriptionQuery: (...args: unknown[]) => subscriptionQueryMock(...args),
    useCancelTestSubscriptionMutation: () => [cancelSubscriptionMock, { loading: false }],
}))

// The page gates on auth in-page; the tests act as a signed-in user.
vi.mock("../../../src/Config/Runtime", async () => {
    const { proxy } = await import("valtio")
    return { runtime: { store: { auth: proxy({ status: "signedIn" }) } } }
})

function renderBilling(): void {
    render(
        <MemoryRouter initialEntries={["/billing/test"]}>
            <TestBillingPage />
        </MemoryRouter>,
    )
}

describe("TestBillingPage", () => {
    beforeEach(() => {
        subscriptionQueryMock.mockReset()
        cancelSubscriptionMock.mockReset()
        refetchMock.mockReset()
        subscriptionQueryMock.mockReturnValue({
            data: {
                mySubscription: {
                    id: "sub_1",
                    status: "ACTIVE",
                    provider: "LOCAL",
                    productKey: "growth",
                    productName: "Growth plan",
                    amountTotal: 2900,
                    currency: "usd",
                    recurringInterval: "MONTH",
                    currentPeriodEnd: null,
                },
            },
            loading: false,
            error: undefined,
            refetch: refetchMock,
        })
    })

    afterEach(() => {
        cleanup()
    })

    it("renders the simulated billing portal, clearly labeled as a test", () => {
        renderBilling()
        expect(screen.getByText(/Test billing — no real subscription/)).toBeTruthy()
        expect(screen.getByRole("heading", { name: "Manage your subscription" })).toBeTruthy()
        expect(screen.getByText("Growth plan")).toBeTruthy()
        expect(screen.getByText("$29.00 / month")).toBeTruthy()
        expect(screen.getByText("ACTIVE")).toBeTruthy()
    })

    it("cancels the simulated subscription and refreshes", async () => {
        cancelSubscriptionMock.mockResolvedValue({
            data: { cancelTestSubscription: { id: "sub_1", status: "CANCELED" } },
        })
        renderBilling()

        fireEvent.click(screen.getByRole("button", { name: "Cancel subscription (test)" }))
        await waitFor(() => {
            expect(cancelSubscriptionMock).toHaveBeenCalledTimes(1)
        })
        await waitFor(() => {
            expect(refetchMock).toHaveBeenCalledTimes(1)
        })
    })

    it("shows an empty state when there is no subscription", () => {
        subscriptionQueryMock.mockReturnValue({
            data: { mySubscription: null },
            loading: false,
            error: undefined,
            refetch: refetchMock,
        })
        renderBilling()
        expect(screen.getByRole("heading", { name: "No subscription" })).toBeTruthy()
        expect(screen.getByText("← Back to settings")).toBeTruthy()
    })
})
