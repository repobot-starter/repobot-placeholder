import { MarketingPricing, type MarketingPricingTier } from "@base/design-system"
import { cleanup, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"

function tier(name: string, price: number): MarketingPricingTier {
    return { name, monthly: price, yearlyPerMonth: price, description: "", features: [] }
}

describe("MarketingPricing tier prices", () => {
    afterEach(cleanup)

    it("groups thousands, keeps small whole prices bare and shows cents only when present", () => {
        render(
            <MarketingPricing
                period=""
                tiers={[
                    tier("Starter", 0),
                    tier("Small", 29),
                    tier("Half", 9.5),
                    tier("Big", 5800),
                    tier("Huge", 12400),
                ]}
            />,
        )
        expect(screen.getByText("Free")).toBeTruthy()
        expect(screen.getByText("$29")).toBeTruthy()
        expect(screen.getByText("$9.50")).toBeTruthy()
        expect(screen.getByText("$5,800")).toBeTruthy()
        expect(screen.getByText("$12,400")).toBeTruthy()
    })
})
