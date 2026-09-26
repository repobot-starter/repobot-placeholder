import { MarketingPricing, type MarketingPricingTier } from "@ui"
import { cleanup, render } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"

/**
 * The pricing section's `currency`: tier prices print in the section's
 * ISO 4217 currency ("eur" → "€9,000") across the tier-driven variants,
 * and an absent currency keeps the kernel's dollar default.
 */

const tiers: MarketingPricingTier[] = [
    { name: "La giornata", monthly: 9000, yearlyPerMonth: 9000, description: "The day.", features: ["Film"] },
    {
        name: "Il weekend",
        monthly: 14500,
        yearlyPerMonth: 14500,
        description: "Three days.",
        features: ["Two"],
    },
]

afterEach(cleanup)

describe("MarketingPricing currency", () => {
    it("prints tier prices in the section's currency", () => {
        const { container } = render(
            <MarketingPricing variant="tiers" period="" currency="eur" tiers={tiers} />,
        )
        expect(container.textContent).toContain("€9,000")
        expect(container.textContent).toContain("€14,500")
        expect(container.textContent).not.toContain("$")
    })

    it("carries the currency onto tickets and tier-derived price lists", () => {
        const tickets = render(<MarketingPricing variant="tickets" period="" currency="eur" tiers={tiers} />)
        expect(tickets.container.textContent).toContain("€9,000")
        cleanup()
        const board = render(<MarketingPricing variant="price-list" period="" currency="eur" tiers={tiers} />)
        expect(board.container.textContent).toContain("€14,500")
    })

    it("defaults to dollars", () => {
        const { container } = render(<MarketingPricing variant="tiers" period="" tiers={tiers} />)
        expect(container.textContent).toContain("$9,000")
    })
})
