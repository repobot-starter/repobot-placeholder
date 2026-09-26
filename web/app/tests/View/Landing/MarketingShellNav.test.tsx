import { marketingShellNavVariants, type LandingConfig, type MarketingShellNavVariant } from "@ui"
import { navigationConfig } from "@base/design-system"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"
import { LandingRenderer } from "../../../src/View/Landing/LandingRenderer"

/**
 * Every shell nav variant must render its chrome: the logo is always a way
 * home, links stay reachable (inline rows, or the burger's fullscreen
 * overlay), and `logo-only` renders the mark alone. Guards the append-only
 * variant vocabulary (docs/landing.md "Page chrome").
 *
 * A committed contract that DECLARES `navigation.variant` (the design
 * panel's Site navigation choice) outranks every per-page pin — that's the
 * MarketingShell contract, so under such a contract every case renders the
 * declared variant and the assertions must follow it (theme-agnostic gate).
 */

function configFor(variant: MarketingShellNavVariant): LandingConfig {
    return {
        style: { preset: "soft-saas" },
        shell: {
            nav: {
                variant,
                content: {
                    logo: { name: "Northwind" },
                    links: [
                        { label: "Pricing", href: "/pricing" },
                        { label: "FAQ", href: "/faq" },
                    ],
                    cta: { label: "Get started", href: "/signup" },
                },
            },
        },
        sections: [],
    }
}

describe("MarketingShell nav variants", () => {
    afterEach(() => {
        cleanup()
    })

    it("covers the full append-only vocabulary", () => {
        expect(marketingShellNavVariants).toEqual([
            "inline",
            "centered",
            "burger-overlay",
            "full-width",
            "split",
            "pill-links",
            "logo-only",
        ])
    })

    for (const variant of marketingShellNavVariants) {
        it(`renders the ${variant} nav with the logo as a home link`, () => {
            render(<LandingRenderer config={configFor(variant)} />)
            expect(screen.getByRole("link", { name: "Northwind — home" })).toBeTruthy()

            // A declared contract variant overrides the page's pin.
            const rendered = navigationConfig.declared ? navigationConfig.variant : variant

            if (rendered === "logo-only") {
                // The mark alone: links, CTA, and the burger are all ignored.
                expect(screen.queryByRole("link", { name: "Pricing" })).toBeNull()
                expect(screen.queryByRole("link", { name: "Get started" })).toBeNull()
                expect(screen.queryByRole("button", { name: "Open menu" })).toBeNull()
                return
            }

            if (rendered === "burger-overlay") {
                // Links live in the fullscreen overlay behind the burger.
                expect(screen.queryByRole("link", { name: "Pricing" })).toBeNull()
                fireEvent.click(screen.getByRole("button", { name: "Open menu" }))
                expect(screen.getByRole("link", { name: "Pricing" })).toBeTruthy()
                expect(screen.getByRole("link", { name: "Get started" })).toBeTruthy()
                return
            }

            expect(screen.getByRole("link", { name: "Pricing" })).toBeTruthy()
            expect(screen.getByRole("link", { name: "FAQ" })).toBeTruthy()
            expect(screen.getByRole("link", { name: "Get started" })).toBeTruthy()
        })
    }
})
