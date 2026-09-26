import { describe, expect, it } from "vitest"
import { homeLanding, servicesPageLanding } from "../../../src/View/Services/servicesLanding"
import { home, services } from "../../../src/View/Services/content"

const NOW = new Date(2026, 7, 25, 10, 30)

/**
 * Starting prices ride the `meta` slot. The services page always prints
 * them; the home craft grid prints them only when the content asks
 * (`home.servicePrices`) — the derived trades' home grids stay price-free.
 */
describe("services pricing", () => {
    it("prices every service on the services page", () => {
        const section = servicesPageLanding("").sections.find((entry) => entry.id === "services")
        const items = (section?.content as { items: { meta?: string }[] }).items
        expect(items.map((item) => item.meta)).toEqual(services.map((service) => service.priceNote))
    })

    // A home without the craft grid (home.serviceGrid off) has nothing to price.
    it.runIf(home.serviceGrid)("prices the home grid exactly when home.servicePrices is on", () => {
        const section = homeLanding("", NOW).sections.find((entry) => entry.id === "services")
        const cards = (section?.content as { cards: { meta?: string }[] }).cards
        expect(cards.map((card) => card.meta)).toEqual(
            services.map((service) => (home.servicePrices ? service.priceNote : undefined)),
        )
    })
})
