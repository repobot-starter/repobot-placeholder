import { UiThemeProvider } from "@base/design-system"
import { cleanup, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"
import ThemeGalleryPage from "../../../src/View/ThemeGallery/ThemeGalleryPage"

/** The page uses ThemeToggle, which requires the app's theme provider. */
function renderPage(): void {
    render(
        <UiThemeProvider>
            <ThemeGalleryPage />
        </UiThemeProvider>,
    )
}

describe("ThemeGalleryPage", () => {
    afterEach(() => {
        cleanup()
    })

    it("renders the token, primitive, and composed sections", () => {
        renderPage()
        expect(screen.getByRole("heading", { name: "Theme" })).toBeTruthy()
        expect(screen.getByRole("heading", { name: "Tokens" })).toBeTruthy()
        expect(screen.getByRole("heading", { name: "Primitives" })).toBeTruthy()
        expect(screen.getByRole("heading", { name: "Composed" })).toBeTruthy()
    })

    it("surfaces the current contract values so agents can confirm edits", () => {
        renderPage()
        expect(screen.getByText(/^brand #/)).toBeTruthy()
        expect(screen.getByText(/^radius /)).toBeTruthy()
        expect(screen.getByText(/^density /)).toBeTruthy()
    })

    it("renders every button variant with live tokens", () => {
        renderPage()
        for (const label of ["Primary", "Secondary", "Ghost", "Danger"]) {
            expect(screen.getByRole("button", { name: label })).toBeTruthy()
        }
    })
})
