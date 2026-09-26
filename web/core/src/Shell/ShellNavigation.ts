/**
 * Pure helpers over the shell nav schema: active-item resolution, badge
 * injection, and the hotkey map. Platform-agnostic by design — the iOS and
 * Android twins implement the same semantics, pinned by the parity tests
 * (web/app/tests/Shell/ShellNavigation.test.ts and its native siblings).
 */
import type { ShellNavItem, ShellNavSection } from "./ShellNavTypes"

function flattenItems<TIcon>(sections: readonly ShellNavSection<TIcon>[]): ShellNavItem<TIcon>[] {
    return sections.flatMap((section) => section.items.flatMap((item) => [item, ...(item.children ?? [])]))
}

/** Ids that are navigable routes (by convention, ids starting with "/"). */
export function getShellNavRouteIds(sections: readonly ShellNavSection<unknown>[]): string[] {
    return flattenItems(sections)
        .map((item) => item.id)
        .filter((id) => id.startsWith("/"))
}

/**
 * Resolves which nav item is active for the current location: an exact
 * pathname+search match wins, otherwise the route id with the most specific
 * (longest) path part that prefixes the pathname on a segment boundary,
 * otherwise the fallback. Ids with a query string rank behind their plain
 * route at equal path length, so deep links land on the route item.
 */
export function resolveActiveShellNavItemId(
    pathname: string,
    search: string,
    navRouteIds: readonly string[],
    fallbackId: string,
): string {
    const currentRouteId = `${pathname}${search}`
    const exactMatch = navRouteIds.find((id) => id === currentRouteId)
    if (exactMatch) {
        return exactMatch
    }
    const pathOf = (id: string): string => id.split("?")[0]
    const bySpecificity = [...navRouteIds].sort(
        (left, right) => pathOf(right).length - pathOf(left).length || left.length - right.length,
    )
    return (
        bySpecificity.find((id) => {
            const idPath = pathOf(id)
            return pathname === idPath || pathname.startsWith(`${idPath}/`)
        }) ?? fallbackId
    )
}

export type ShellNavBadgeTextById = Readonly<Record<string, string | undefined>>

/** Returns new sections with badgeText merged onto matching item ids (children included). */
export function applyShellNavBadges<TIcon>(
    sections: readonly ShellNavSection<TIcon>[],
    badgeTextById: ShellNavBadgeTextById,
): ShellNavSection<TIcon>[] {
    return sections.map((section) => ({
        ...section,
        items: section.items.map((item) => ({
            ...item,
            badgeText: badgeTextById[item.id] ?? item.badgeText,
            children: item.children?.map((child) => ({
                ...child,
                badgeText: badgeTextById[child.id] ?? child.badgeText,
            })),
        })),
    }))
}

/**
 * Maps lowercase hotkey characters to item ids, first declaration wins.
 * Multi-character hotkeys are ignored — the chord is owned by the platform,
 * the schema only names the key.
 */
export function buildShellHotkeyMap(sections: readonly ShellNavSection<unknown>[]): Record<string, string> {
    const idByKey: Record<string, string> = {}
    for (const item of flattenItems(sections)) {
        const key = item.hotkey?.trim().toLowerCase()
        if (key && key.length === 1 && idByKey[key] === undefined) {
            idByKey[key] = item.id
        }
    }
    return idByKey
}
