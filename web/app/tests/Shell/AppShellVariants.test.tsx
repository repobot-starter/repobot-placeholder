import {
    AppShell,
    appShellContentModes,
    appShellLayouts,
    configuredDefaultMode,
    themeConfig,
    UiThemeProvider,
    type AppShellLayout,
    type AppShellNavSection,
    type UiThemeMode,
} from "@ui"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

/**
 * Every shell layout must render its chrome: nav items stay reachable where
 * the variant has nav, the top bar appears exactly where the variant puts
 * it, the logo rail's collapse hides everything except the brand mark, and
 * the profile modal always offers the account options, theme picker, and
 * sign out. Guards the append-only variant vocabulary (docs/shell.md
 * "Shell variants"), the way MarketingShellNav.test.tsx guards the
 * marketing nav's.
 *
 * Contract-relative, like themeConfig.test.ts: projects commit their own
 * repobot.theme.json during setup, so anything the contract controls (the
 * default mode, shell variant, content mode) is asserted against the
 * committed contract — never a specific kernel default, which would fail
 * in every themed project.
 */

/** The initially-active mode, resolved the way UiThemeProvider resolves the
 * contract ("system" follows prefers-color-scheme; happy-dom reports light). */
function expectedDefaultMode(): UiThemeMode {
    if (configuredDefaultMode === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    return configuredDefaultMode
}

const sections: AppShellNavSection[] = [
    {
        id: "workspace",
        items: [
            { id: "/projects", label: "Projects", badgeText: "3" },
            { id: "/users", label: "Users" },
        ],
    },
    {
        id: "account",
        title: "Account",
        items: [{ id: "/settings", label: "Settings" }],
    },
]

function renderShell(
    layout: AppShellLayout,
    overrides?: Partial<React.ComponentProps<typeof AppShell>>,
): ReturnType<typeof render> {
    return render(
        <UiThemeProvider>
            <AppShell
                layout={layout}
                title="Northwind"
                sections={sections}
                activeItemId="/projects"
                onItemSelect={() => {}}
                profile={{
                    label: "Dev User",
                    sublabel: "dev@local.test",
                    items: [{ id: "settings", label: "Account settings", onSelect: () => {} }],
                    onSignOut: () => {},
                }}
                {...overrides}
            >
                <p>Page body</p>
            </AppShell>
        </UiThemeProvider>,
    )
}

describe("AppShell variants", () => {
    afterEach(() => {
        cleanup()
        window.localStorage.clear()
    })

    it("covers the full append-only vocabulary", () => {
        expect(appShellLayouts).toEqual([
            "sidebar",
            "top-nav",
            "minimal",
            "sidebar-inset",
            "sidebar-topbar",
            "sidebar-only",
            "logo-rail",
        ])
        expect(appShellContentModes).toEqual(["full", "centered", "flush"])
    })

    const sidebarFamily: AppShellLayout[] = [
        "sidebar",
        "sidebar-inset",
        "sidebar-topbar",
        "sidebar-only",
        "logo-rail",
    ]

    for (const layout of sidebarFamily) {
        it(`renders the ${layout} rail with reachable nav and a collapse toggle`, () => {
            renderShell(layout)
            expect(screen.getByRole("button", { name: "Projects" })).toBeTruthy()
            expect(screen.getByRole("button", { name: "Users" })).toBeTruthy()
            expect(screen.getByRole("button", { name: "Collapse navigation" })).toBeTruthy()
            expect(screen.getByText("Page body")).toBeTruthy()
        })
    }

    it("renders the top-nav bar with flattened items and no sidebar", () => {
        const { container } = renderShell("top-nav")
        expect(screen.getByRole("button", { name: "Projects" })).toBeTruthy()
        expect(container.querySelector("aside")).toBeNull()
        expect(screen.queryByRole("button", { name: "Collapse navigation" })).toBeNull()
    })

    it("renders minimal with brand and profile but no nav", () => {
        const { container } = renderShell("minimal")
        expect(screen.queryByRole("button", { name: "Projects" })).toBeNull()
        expect(container.querySelector("aside")).toBeNull()
        expect(screen.getByRole("button", { name: "Account: Dev User" })).toBeTruthy()
    })

    it("keeps collapsed icon-rail items reachable by their labels", () => {
        renderShell("sidebar", { collapsed: true })
        // Labels fade out visually but the buttons keep their accessible names.
        expect(screen.getByRole("button", { name: "Projects" })).toBeTruthy()
        expect(screen.getByRole("button", { name: "Expand navigation" })).toBeTruthy()
    })

    it("marks the active item with aria-current", () => {
        renderShell("sidebar")
        expect(screen.getByRole("button", { name: "Projects" }).getAttribute("aria-current")).toBe("page")
        expect(screen.getByRole("button", { name: "Users" }).getAttribute("aria-current")).toBeNull()
    })

    it("collapses logo-rail to nothing but the brand mark", () => {
        renderShell("logo-rail", { collapsed: true })
        // The rail's nav and profile leave the accessibility tree entirely…
        expect(screen.queryByRole("button", { name: "Projects" })).toBeNull()
        expect(screen.queryByRole("button", { name: "Account: Dev User" })).toBeNull()
        // …while the brand mark stays as the way back.
        expect(screen.getByRole("button", { name: "Expand navigation" })).toBeTruthy()
    })

    it("puts the top bar above the rail for sidebar-topbar (banner owns the profile)", () => {
        const { container } = renderShell("sidebar-topbar")
        const banner = container.querySelector("header")
        const aside = container.querySelector("aside")
        expect(banner).toBeTruthy()
        // The banner spans the viewport: the sidebar hangs beneath it, so
        // the banner's column contains the rail.
        expect(banner!.parentElement!.contains(aside)).toBe(true)
        // Profile lives in the banner, not the rail.
        const profileTrigger = screen.getByRole("button", { name: "Account: Dev User" })
        expect(banner!.contains(profileTrigger)).toBe(true)
        expect(aside!.contains(profileTrigger)).toBe(false)
    })

    it("renders sidebar-only without any top bar", () => {
        const { container } = renderShell("sidebar-only")
        expect(container.querySelector("header")).toBeNull()
        // The profile (with its theme picker) still lives in the rail.
        expect(screen.getByRole("button", { name: "Account: Dev User" })).toBeTruthy()
    })

    it("keeps a top bar over the content for sidebar and sidebar-inset", () => {
        for (const layout of ["sidebar", "sidebar-inset"] as const) {
            const { container, unmount } = renderShell(layout)
            const header = container.querySelector("header")
            const aside = container.querySelector("aside")
            expect(header, layout).toBeTruthy()
            // The bar sits inside the content column, beside the rail — its
            // column does not contain the sidebar.
            expect(header!.parentElement!.contains(aside), layout).toBe(false)
            unmount()
        }
    })

    it("opens the profile modal with account options, theme picker, and sign out", () => {
        const onSettings = vi.fn()
        const onSignOut = vi.fn()
        renderShell("sidebar", {
            profile: {
                label: "Dev User",
                sublabel: "dev@local.test",
                items: [{ id: "settings", label: "Account settings", onSelect: onSettings }],
                onSignOut,
            },
        })
        fireEvent.click(screen.getByRole("button", { name: "Account: Dev User" }))
        // The identity renders twice: the footer trigger and the modal header.
        expect(screen.getAllByText("dev@local.test").length).toBe(2)
        expect(screen.getByText("Theme")).toBeTruthy()

        // The theme picker checkmarks the contract's default mode and
        // switches on select.
        const defaultMode = expectedDefaultMode()
        const activeRow = screen.getByRole("button", { name: defaultMode === "dark" ? "Dark" : "Light" })
        const otherRow = screen.getByRole("button", { name: defaultMode === "dark" ? "Light" : "Dark" })
        expect(activeRow.getAttribute("aria-pressed")).toBe("true")
        fireEvent.click(otherRow)
        expect(otherRow.getAttribute("aria-pressed")).toBe("true")
        expect(activeRow.getAttribute("aria-pressed")).toBe("false")

        fireEvent.click(screen.getByRole("button", { name: "Account settings" }))
        expect(onSettings).toHaveBeenCalledTimes(1)

        // Selecting an item closes the modal; reopen for sign out.
        fireEvent.click(screen.getByRole("button", { name: "Account: Dev User" }))
        fireEvent.click(screen.getByRole("button", { name: "Sign out" }))
        expect(onSignOut).toHaveBeenCalledTimes(1)
    })

    for (const mode of appShellContentModes) {
        it(`stamps the ${mode} content mode on the content region`, () => {
            const { container } = renderShell("sidebar", { contentMode: mode })
            expect(container.querySelector("main")!.getAttribute("data-content-mode")).toBe(mode)
        })
    }

    it("defaults the layout and content mode from the theme contract", () => {
        // Absent props resolve through the committed repobot.theme.json —
        // whatever shell the project chose at setup. Sidebar-family
        // variants render a rail (<aside>); top-nav and minimal do not.
        const { container } = renderShell(undefined as unknown as AppShellLayout)
        const expectsRail = (sidebarFamily as readonly string[]).includes(themeConfig.shell.variant)
        expect(container.querySelector("aside") !== null).toBe(expectsRail)
        expect(container.querySelector("main")!.getAttribute("data-content-mode")).toBe(
            themeConfig.shell.content,
        )
    })
})
