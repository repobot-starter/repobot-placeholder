import Foundation

/// The shell navigation contract — the iOS twin of
/// `web/core/src/Shell/ShellNavTypes.ts` + `ShellNavigation.ts` (Android:
/// `components/shell/ShellNavModels.kt`). Change all three together; the
/// matching/hotkey semantics are pinned by ShellNavigationTests and the web
/// parity tests. Icons are platform-native here (SF Symbol names).
struct ShellNavItem: Identifiable, Equatable {
  /// Stable id; route items use their web path (e.g. "/projects") so the IA
  /// stays mirrored across platforms.
  let id: String
  let label: String
  var systemImage: String? = nil
  var badgeText: String? = nil
  /// Single character; bound to Cmd+Shift+<key> on hardware keyboards.
  var hotkey: String? = nil
  /// Nested children rendered as an expandable group under the parent row.
  var children: [ShellNavItem] = []
}

struct ShellNavSection: Identifiable, Equatable {
  let id: String
  /// Optional uppercase heading; nil renders as a plain separator.
  var title: String? = nil
  var items: [ShellNavItem]
}

/// One rung of a drill-down hierarchy (e.g. organization → project). Flat
/// apps use a single level; hierarchical apps switch the active level and the
/// shell renders a drill-up row back to the parent.
struct ShellNavLevel: Identifiable, Equatable {
  let id: String
  var sections: [ShellNavSection]
  var parentLevelId: String? = nil
  /// Label of the drill-up row shown when parentLevelId is set.
  var drillUpLabel: String? = nil
}

enum ShellNavigation {
  static func flattenItems(_ sections: [ShellNavSection]) -> [ShellNavItem] {
    sections.flatMap { section in
      section.items.flatMap { [$0] + $0.children }
    }
  }

  /// Ids that are navigable routes (by convention, ids starting with "/").
  static func routeIds(_ sections: [ShellNavSection]) -> [String] {
    flattenItems(sections).map(\.id).filter { $0.hasPrefix("/") }
  }

  /// Resolves which nav item is active for the current location: an exact
  /// pathname+search match wins, otherwise the route id with the most
  /// specific (longest) path part that prefixes the pathname on a segment
  /// boundary, otherwise the fallback. Ids with a query string rank behind
  /// their plain route at equal path length, so deep links land on the
  /// route item.
  static func resolveActiveItemId(
    pathname: String,
    search: String,
    navRouteIds: [String],
    fallbackId: String
  ) -> String {
    let currentRouteId = pathname + search
    if let exactMatch = navRouteIds.first(where: { $0 == currentRouteId }) {
      return exactMatch
    }
    func pathOf(_ id: String) -> String {
      id.components(separatedBy: "?").first ?? id
    }
    let bySpecificity = navRouteIds.sorted { left, right in
      let leftPath = pathOf(left).count
      let rightPath = pathOf(right).count
      if leftPath != rightPath {
        return leftPath > rightPath
      }
      return left.count < right.count
    }
    let prefixMatch = bySpecificity.first { id in
      let idPath = pathOf(id)
      return pathname == idPath || pathname.hasPrefix(idPath + "/")
    }
    return prefixMatch ?? fallbackId
  }

  /// Returns new sections with badge text merged onto matching item ids
  /// (children included).
  static func applyBadges(
    _ sections: [ShellNavSection],
    badgeTextById: [String: String]
  ) -> [ShellNavSection] {
    sections.map { section in
      var next = section
      next.items = section.items.map { item in
        var nextItem = item
        nextItem.badgeText = badgeTextById[item.id] ?? item.badgeText
        nextItem.children = item.children.map { child in
          var nextChild = child
          nextChild.badgeText = badgeTextById[child.id] ?? child.badgeText
          return nextChild
        }
        return nextItem
      }
      return next
    }
  }

  /// Maps lowercase hotkey characters to item ids, first declaration wins.
  /// Multi-character hotkeys are ignored — the chord is owned by the
  /// platform, the schema only names the key.
  static func hotkeyMap(_ sections: [ShellNavSection]) -> [String: String] {
    var idByKey: [String: String] = [:]
    for item in flattenItems(sections) {
      guard
        let key = item.hotkey?.trimmingCharacters(in: .whitespaces).lowercased(),
        key.count == 1,
        idByKey[key] == nil
      else { continue }
      idByKey[key] = item.id
    }
    return idByKey
  }
}
