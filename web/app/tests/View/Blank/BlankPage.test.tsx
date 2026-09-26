import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import BlankPage from "../../../src/View/Blank/BlankPage"

describe("BlankPage (spaceboy starter)", () => {
    it("renders the crayon rocket scene with no copy", () => {
        const { container } = render(<BlankPage />)
        expect(
            screen.getByRole("img", { name: "A crayon rocket looping through the night sky" }),
        ).toBeTruthy()
        // The scene is copy-free: no wordmark, headline, or prompt chip.
        expect(container.querySelector("h1")).toBeNull()
        expect(container.textContent?.trim()).toBe("")
    })
})
