import { UiThemeProvider, darkTheme, lightTheme, useUiTheme } from "@base/design-system"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"

function ModeSwitch(): React.ReactElement {
    const { mode, toggleMode } = useUiTheme()
    return (
        <button type="button" onClick={toggleMode}>
            mode: {mode}
        </button>
    )
}

afterEach(() => {
    cleanup()
    window.localStorage.clear()
})

// The theme-scope invariant: overlays that portal to <body> (Radix Dialog,
// Select, DropdownMenu — and the global error modal / fullscreen table focus
// built on them) resolve theme tokens only because UiThemeProvider stamps
// the active theme class on <body> as well as its own wrapper. If this
// stamping ever regresses, every portaled surface silently renders unthemed.
describe("UiThemeProvider theme scope", () => {
    it("stamps the active theme class on document.body for portaled content", () => {
        const { unmount } = render(
            <UiThemeProvider defaultMode="dark">
                <span>content</span>
            </UiThemeProvider>,
        )
        expect(document.body.classList.contains(darkTheme)).toBe(true)

        // Unmount cleans the stamp up — a preview/iframe remount must not
        // accumulate stale theme classes.
        unmount()
        expect(document.body.classList.contains(darkTheme)).toBe(false)
        expect(document.body.classList.contains(lightTheme)).toBe(false)
    })

    it("swaps the body class when the mode changes", () => {
        render(
            <UiThemeProvider defaultMode="light">
                <ModeSwitch />
            </UiThemeProvider>,
        )
        expect(document.body.classList.contains(lightTheme)).toBe(true)

        fireEvent.click(screen.getByRole("button"))
        expect(screen.getByRole("button").textContent).toBe("mode: dark")
        expect(document.body.classList.contains(darkTheme)).toBe(true)
        expect(document.body.classList.contains(lightTheme)).toBe(false)
    })
})
