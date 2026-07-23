import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import React from "react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import ShopPage from "../../../src/View/Shop/ShopPage"
import { shopContent } from "../../../src/View/Shop/shopContent"

const { productQueryMock, createSessionMock, assignMock } = vi.hoisted(() => ({
    productQueryMock: vi.fn(),
    createSessionMock: vi.fn(),
    assignMock: vi.fn(),
}))

vi.mock("../../../src/generated/graphql/types", () => ({
    useShopProductQuery: (...args: unknown[]) => productQueryMock(...args),
    useCreateCheckoutSessionMutation: () => [createSessionMock, { loading: false }],
}))

function renderShop(): void {
    render(
        <MemoryRouter>
            <ShopPage />
        </MemoryRouter>,
    )
}

describe("ShopPage", () => {
    beforeEach(() => {
        productQueryMock.mockReset()
        createSessionMock.mockReset()
        assignMock.mockReset()
        Object.defineProperty(window, "location", {
            configurable: true,
            value: { ...window.location, origin: "http://localhost:5173", assign: assignMock },
        })
        productQueryMock.mockReturnValue({
            data: {
                shopProduct: {
                    key: "book",
                    name: shopContent.bookTitle,
                    tagline: "tagline",
                    priceMinorUnits: 2400,
                    currency: "usd",
                },
            },
            loading: false,
        })
    })

    afterEach(() => {
        cleanup()
    })

    it("renders the storefront with the server-side price", () => {
        renderShop()
        // level 1 disambiguates from the h2 rendered on the CSS cover art.
        expect(screen.getByRole("heading", { name: shopContent.bookTitle, level: 1 })).toBeTruthy()
        expect(screen.getByText(`a novel by ${shopContent.authorName}`)).toBeTruthy()
        // Price comes from the shopProduct query, never from client content.
        expect(screen.getByText("$24.00")).toBeTruthy()
        expect(screen.getByRole("heading", { name: "What readers are saying" })).toBeTruthy()
    })

    it("starts checkout from the buy button and follows the returned URL", async () => {
        createSessionMock.mockResolvedValue({
            data: {
                createCheckoutSession: {
                    id: "csn_1",
                    checkoutUrl: "http://localhost:5173/checkout/test?session=csn_1",
                },
            },
        })
        renderShop()

        fireEvent.click(screen.getAllByRole("button", { name: "Buy the book" })[0]!)
        await waitFor(() => {
            expect(createSessionMock).toHaveBeenCalledTimes(1)
        })
        const input = createSessionMock.mock.calls[0]![0].variables.input
        expect(input.fields.origin).toBe("http://localhost:5173")
        expect(input.idempotencyKey.length).toBeGreaterThan(0)
        expect(assignMock).toHaveBeenCalledWith("http://localhost:5173/checkout/test?session=csn_1")
    })

    it("shows an error instead of redirecting when checkout cannot start", async () => {
        createSessionMock.mockRejectedValue(new Error("Checkout is unavailable."))
        renderShop()

        fireEvent.click(screen.getAllByRole("button", { name: "Buy the book" })[0]!)
        await waitFor(() => {
            expect(screen.getByText("Checkout is unavailable.")).toBeTruthy()
        })
        expect(assignMock).not.toHaveBeenCalled()
    })
})
