import XCTest
@testable import AppIOS

/// Parity tests for ShellNavigation against web/core's ShellNavigation.ts
/// (Android: ShellNavModelsTest.kt): same route-id flattening, active-item
/// resolution (exact match, longest prefix on segment boundaries, fallback),
/// hotkey-map, and badge-merge semantics.
final class ShellNavModelsTests: XCTestCase {
  private let sections: [ShellNavSection] = [
    ShellNavSection(
      id: "workspace",
      items: [
        ShellNavItem(id: "/projects", label: "Projects", hotkey: "p"),
        ShellNavItem(
          id: "/users",
          label: "Users",
          hotkey: " U ",
          children: [
            ShellNavItem(id: "/users/admins", label: "Admins"),
            ShellNavItem(id: "/users?role=guest", label: "Guests"),
          ]
        ),
      ]
    ),
    ShellNavSection(
      id: "tools",
      title: "Tools",
      items: [
        ShellNavItem(id: "open-chat", label: "Chat", hotkey: "p"),
        ShellNavItem(id: "/reports", label: "Reports", hotkey: "rr"),
      ]
    ),
  ]

  private var routeIds: [String] {
    ShellNavigation.routeIds(sections)
  }

  func testRouteIdsIncludeChildrenAndExcludeNonRouteIds() {
    XCTAssertEqual(
      routeIds,
      ["/projects", "/users", "/users/admins", "/users?role=guest", "/reports"]
    )
  }

  func testPrefersExactPathnameSearchMatch() {
    XCTAssertEqual(
      ShellNavigation.resolveActiveItemId(
        pathname: "/users", search: "?role=guest", navRouteIds: routeIds, fallbackId: "/projects"
      ),
      "/users?role=guest"
    )
  }

  func testFallsBackToMostSpecificPathPrefix() {
    XCTAssertEqual(
      ShellNavigation.resolveActiveItemId(
        pathname: "/users/admins/42", search: "", navRouteIds: routeIds, fallbackId: "/projects"
      ),
      "/users/admins"
    )
    XCTAssertEqual(
      ShellNavigation.resolveActiveItemId(
        pathname: "/users", search: "", navRouteIds: routeIds, fallbackId: "/projects"
      ),
      "/users"
    )
  }

  func testPrefersPlainRouteOverQueryVariantForDeepLinks() {
    XCTAssertEqual(
      ShellNavigation.resolveActiveItemId(
        pathname: "/users/other", search: "", navRouteIds: routeIds, fallbackId: "/projects"
      ),
      "/users"
    )
  }

  func testOnlyMatchesPrefixesOnSegmentBoundaries() {
    XCTAssertEqual(
      ShellNavigation.resolveActiveItemId(
        pathname: "/usersextra", search: "", navRouteIds: routeIds, fallbackId: "/projects"
      ),
      "/projects"
    )
  }

  func testReturnsFallbackWhenNothingMatches() {
    XCTAssertEqual(
      ShellNavigation.resolveActiveItemId(
        pathname: "/settings", search: "", navRouteIds: routeIds, fallbackId: "/projects"
      ),
      "/projects"
    )
  }

  func testHotkeyMapLowercasesTrimsFirstWinsIgnoresMultiChar() {
    XCTAssertEqual(
      ShellNavigation.hotkeyMap(sections),
      ["p": "/projects", "u": "/users"]
    )
  }

  func testAppliesBadgesToItemsAndChildrenPreservingExisting() {
    let withExisting = [
      ShellNavSection(
        id: "workspace",
        items: [
          ShellNavItem(id: "/projects", label: "Projects", badgeText: "1"),
          ShellNavItem(
            id: "/users",
            label: "Users",
            children: [ShellNavItem(id: "/users/admins", label: "Admins")]
          ),
        ]
      )
    ]
    let merged = ShellNavigation.applyBadges(
      withExisting,
      badgeTextById: ["/users": "7", "/users/admins": "2"]
    )
    XCTAssertEqual(merged[0].items[0].badgeText, "1")
    XCTAssertEqual(merged[0].items[1].badgeText, "7")
    XCTAssertEqual(merged[0].items[1].children[0].badgeText, "2")
  }
}
