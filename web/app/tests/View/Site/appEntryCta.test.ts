import { describe, expect, it, vi } from "vitest"
import type { MarketingPageEntry } from "../../../src/Config/projectManifest"
import { landingConfigForPage } from "../../../src/View/Site/blueprints"

// The discoverability contract (field defect): a project that declares
// dashboard destinations must surface its app from the marketing chrome —
// the derived shell's nav CTA points at the first destination, and the
// simple footer carries the same link. Without this, a scaffolded dashboard
// was reachable only by typing its route into the address bar.
const mockManifest = vi.hoisted(() => ({
    marketing: {
        preset: "dark-dev",
        pages: [] as unknown[],
        brand: undefined as { logo?: string } | undefined,
        shell: undefined as object | undefined,
    },
    dashboard: { destinations: [] as { id: string; path: string; label: string }[] },
}))
vi.mock("../../../src/Config/projectManifest", async (importOriginal) => ({
    ...(await importOriginal<object>()),
    projectManifest: mockManifest,
}))
// Packs with hand-authored site chrome (packSiteChrome) keep their own
// affordance — that override is BY DESIGN and wins over the derived shell,
// so on a composed tree (compose gate runs this suite with the pack active)
// the derived path would never be exercised. Neutralize pack chrome here:
// this suite pins the DERIVED shell's contract only.
vi.mock("../../../src/View/Site/packShell", async (importOriginal) => ({
    ...(await importOriginal<object>()),
    packSiteChrome: () => undefined,
}))

const homePage: MarketingPageEntry = {
    id: "home",
    path: "/",
    title: "Home",
    blueprint: "landing",
}

function shellOf(page: MarketingPageEntry) {
    const shell = landingConfigForPage(page).shell
    if (shell === undefined) throw new Error("derived config must carry a shell")
    return shell
}

describe("app entry in the derived marketing shell", () => {
    it("points the nav CTA at the first declared dashboard destination", () => {
        mockManifest.dashboard.destinations = [
            { id: "dashboard", path: "/dashboard", label: "Dashboard" },
            { id: "invoices", path: "/invoices", label: "Invoices" },
        ]
        const shell = shellOf(homePage)
        expect(shell.nav?.content?.cta).toEqual({ label: "Dashboard", href: "/dashboard" })
        const footerLinks = (shell.footer?.content as { links?: { label: string; href: string }[] })?.links
        expect(footerLinks).toContainEqual({ label: "Dashboard", href: "/dashboard" })
        mockManifest.dashboard.destinations = []
    })

    it("keeps the lead-form CTA when no destinations are declared", () => {
        const shell = shellOf(homePage)
        expect(shell.nav?.content?.cta?.href).not.toBe("/dashboard")
        expect(shell.nav?.content?.cta?.label).toBeTypeOf("string")
    })
})
