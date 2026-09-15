import { AuthNotice } from "@base/design-system"
import { cleanup, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"

afterEach(() => {
    cleanup()
})

// Deploys without an auth backend render this notice instead of AuthCard's
// forms (VITE_AUTH_MODE === "disabled" in LoginPage): an honest "not set up"
// with the owner's next step, never a sign-in flow that silently simulates.
describe("AuthNotice", () => {
    it("renders the notice headline, owner action, and home link", () => {
        render(
            <AuthNotice
                appName="Repobot"
                title="Sign-in isn't set up for this site yet"
                body="Site owner? Open this project in Repobot and ask the agent to add authentication."
                linkLabel="Back to home"
                linkHref="/"
            />,
        )
        expect(screen.getByRole("heading", { name: /Sign-in isn't set up/ })).toBeTruthy()
        expect(screen.getByText(/ask the agent to add authentication/)).toBeTruthy()
        const link = screen.getByRole("link", { name: "Back to home" })
        expect(link.getAttribute("href")).toBe("/")
        // No sign-in affordances: the notice carries no form fields at all.
        expect(screen.queryByRole("textbox")).toBeNull()
        expect(screen.queryByRole("button")).toBeNull()
    })

    it("hides the brand row and link when not provided", () => {
        render(<AuthNotice brand={null} title="Sign-in isn't set up" body="No accounts here." />)
        expect(screen.queryByRole("link")).toBeNull()
    })
})
