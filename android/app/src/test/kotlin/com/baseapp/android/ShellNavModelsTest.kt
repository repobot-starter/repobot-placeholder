package com.baseapp.android

import com.baseapp.android.components.shell.ShellNavItem
import com.baseapp.android.components.shell.ShellNavSection
import com.baseapp.android.components.shell.ShellNavigation
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Parity tests for ShellNavigation against web/core's ShellNavigation.ts
 * (iOS: ShellNavModelsTests.swift): same route-id flattening, active-item
 * resolution (exact match, longest prefix on segment boundaries, fallback),
 * hotkey-map, and badge-merge semantics.
 */
class ShellNavModelsTest {
    private val sections = listOf(
        ShellNavSection(
            id = "workspace",
            items = listOf(
                ShellNavItem(id = "/projects", label = "Projects", hotkey = "p"),
                ShellNavItem(
                    id = "/users",
                    label = "Users",
                    hotkey = " U ",
                    children = listOf(
                        ShellNavItem(id = "/users/admins", label = "Admins"),
                        ShellNavItem(id = "/users?role=guest", label = "Guests"),
                    ),
                ),
            ),
        ),
        ShellNavSection(
            id = "tools",
            title = "Tools",
            items = listOf(
                ShellNavItem(id = "open-chat", label = "Chat", hotkey = "p"),
                ShellNavItem(id = "/reports", label = "Reports", hotkey = "rr"),
            ),
        ),
    )

    private val routeIds = ShellNavigation.routeIds(sections)

    @Test
    fun routeIdsIncludeChildrenAndExcludeNonRouteIds() {
        assertEquals(
            listOf("/projects", "/users", "/users/admins", "/users?role=guest", "/reports"),
            routeIds,
        )
    }

    @Test
    fun prefersExactPathnameSearchMatch() {
        assertEquals(
            "/users?role=guest",
            ShellNavigation.resolveActiveItemId("/users", "?role=guest", routeIds, "/projects"),
        )
    }

    @Test
    fun fallsBackToMostSpecificPathPrefix() {
        assertEquals(
            "/users/admins",
            ShellNavigation.resolveActiveItemId("/users/admins/42", "", routeIds, "/projects"),
        )
        assertEquals(
            "/users",
            ShellNavigation.resolveActiveItemId("/users", "", routeIds, "/projects"),
        )
    }

    @Test
    fun prefersPlainRouteOverQueryVariantForDeepLinks() {
        assertEquals(
            "/users",
            ShellNavigation.resolveActiveItemId("/users/other", "", routeIds, "/projects"),
        )
    }

    @Test
    fun onlyMatchesPrefixesOnSegmentBoundaries() {
        assertEquals(
            "/projects",
            ShellNavigation.resolveActiveItemId("/usersextra", "", routeIds, "/projects"),
        )
    }

    @Test
    fun returnsFallbackWhenNothingMatches() {
        assertEquals(
            "/projects",
            ShellNavigation.resolveActiveItemId("/settings", "", routeIds, "/projects"),
        )
    }

    @Test
    fun hotkeyMapLowercasesTrimsFirstWinsIgnoresMultiChar() {
        assertEquals(
            mapOf("p" to "/projects", "u" to "/users"),
            ShellNavigation.hotkeyMap(sections),
        )
    }

    @Test
    fun appliesBadgesToItemsAndChildrenPreservingExisting() {
        val withExisting = listOf(
            ShellNavSection(
                id = "workspace",
                items = listOf(
                    ShellNavItem(id = "/projects", label = "Projects", badgeText = "1"),
                    ShellNavItem(
                        id = "/users",
                        label = "Users",
                        children = listOf(ShellNavItem(id = "/users/admins", label = "Admins")),
                    ),
                ),
            ),
        )
        val merged = ShellNavigation.applyBadges(
            withExisting,
            mapOf("/users" to "7", "/users/admins" to "2"),
        )
        assertEquals("1", merged[0].items[0].badgeText)
        assertEquals("7", merged[0].items[1].badgeText)
        assertEquals("2", merged[0].items[1].children[0].badgeText)
    }
}
