import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import PublishedFreeFooter from "../../../src/View/Site/PublishedFreeFooter"

const TAG_ID = "repobot-site-config"

function setOverlay(payload?: unknown): void {
    document.getElementById(TAG_ID)?.remove()
    if (payload === undefined) {
        return
    }
    const tag = document.createElement("script")
    tag.id = TAG_ID
    tag.type = "application/json"
    tag.textContent = JSON.stringify(payload)
    document.head.appendChild(tag)
}

describe("PublishedFreeFooter", () => {
    beforeEach(() => {
        setOverlay(undefined)
    })

    afterEach(() => {
        cleanup()
        setOverlay(undefined)
    })

    it("renders on published FREE overlays", () => {
        setOverlay({ "repobot.publish.json": { showSpaceboyFooter: true, templateTier: "FREE" } })
        render(<PublishedFreeFooter />)
        const link = screen.getByRole("link", { name: "Made with Spaceboy" })
        expect(link.getAttribute("href")).toBe("https://spaceboy.ai")
    })

    it("does not render for published paid overlays", () => {
        setOverlay({ "repobot.publish.json": { showSpaceboyFooter: false, templateTier: "BASIC" } })
        render(<PublishedFreeFooter />)
        expect(screen.queryByRole("link", { name: "Made with Spaceboy" })).toBeNull()
    })

    it("does not render without an overlay (preview/workspace)", () => {
        render(<PublishedFreeFooter />)
        expect(screen.queryByRole("link", { name: "Made with Spaceboy" })).toBeNull()
    })
})
