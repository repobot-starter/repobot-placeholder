import {
    applyShellNavBadges,
    buildShellHotkeyMap,
    getShellNavRouteIds,
    resolveActiveShellNavItemId,
    type ShellNavSection,
} from "@base/core"
import { describe, expect, it } from "vitest"

// Parity contract: the iOS (ShellNavModelsTests.swift) and Android
// (ShellNavModelsTest.kt) ports assert these same cases, so the three
// platforms resolve the shell nav schema identically.

const sections: ShellNavSection[] = [
    {
        id: "workspace",
        items: [
            { id: "/projects", label: "Projects", hotkey: "p" },
            {
                id: "/users",
                label: "Users",
                hotkey: " U ",
                children: [
                    { id: "/users/admins", label: "Admins" },
                    { id: "/users?role=guest", label: "Guests" },
                ],
            },
        ],
    },
    {
        id: "tools",
        title: "Tools",
        items: [
            { id: "open-chat", label: "Chat", hotkey: "p" },
            { id: "/reports", label: "Reports", hotkey: "rr" },
        ],
    },
]

const routeIds = getShellNavRouteIds(sections)

describe("getShellNavRouteIds", () => {
    it("includes children and excludes non-route ids", () => {
        expect(routeIds).toEqual(["/projects", "/users", "/users/admins", "/users?role=guest", "/reports"])
    })
})

describe("resolveActiveShellNavItemId", () => {
    it("prefers an exact pathname+search match", () => {
        expect(resolveActiveShellNavItemId("/users", "?role=guest", routeIds, "/projects")).toBe(
            "/users?role=guest",
        )
    })

    it("falls back to the most specific path prefix", () => {
        expect(resolveActiveShellNavItemId("/users/admins/42", "", routeIds, "/projects")).toBe(
            "/users/admins",
        )
        expect(resolveActiveShellNavItemId("/users", "", routeIds, "/projects")).toBe("/users")
    })

    it("prefers the plain route over its query variant for deep links", () => {
        expect(resolveActiveShellNavItemId("/users/other", "", routeIds, "/projects")).toBe("/users")
    })

    it("only matches prefixes on segment boundaries", () => {
        expect(resolveActiveShellNavItemId("/usersextra", "", routeIds, "/projects")).toBe("/projects")
    })

    it("returns the fallback when nothing matches", () => {
        expect(resolveActiveShellNavItemId("/settings", "", routeIds, "/projects")).toBe("/projects")
    })
})

describe("buildShellHotkeyMap", () => {
    it("lowercases and trims keys, keeps the first declaration, ignores multi-char keys", () => {
        expect(buildShellHotkeyMap(sections)).toEqual({ p: "/projects", u: "/users" })
    })
})

describe("applyShellNavBadges", () => {
    it("merges badges onto matching items and children, preserving existing badges", () => {
        const withExisting: ShellNavSection[] = [
            {
                id: "workspace",
                items: [
                    { id: "/projects", label: "Projects", badgeText: "1" },
                    { id: "/users", label: "Users", children: [{ id: "/users/admins", label: "Admins" }] },
                ],
            },
        ]
        const merged = applyShellNavBadges(withExisting, { "/users": "7", "/users/admins": "2" })
        expect(merged[0].items[0].badgeText).toBe("1")
        expect(merged[0].items[1].badgeText).toBe("7")
        expect(merged[0].items[1].children?.[0].badgeText).toBe("2")
    })
})
