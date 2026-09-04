package com.baseapp.android.components.shell

/**
 * The shell navigation contract — the Android twin of
 * `web/core/src/Shell/ShellNavTypes.ts` + `ShellNavigation.ts` (iOS:
 * `Components/Shell/ShellNavModels.swift`). Change all three together; the
 * matching/hotkey semantics are pinned by ShellNavModelsTest and the web
 * parity tests. Icons are platform-native here (Compose ImageVectors),
 * supplied by the binder.
 */
data class ShellNavItem(
    /**
     * Stable id; route items use their web path (e.g. "/projects") so the IA
     * stays mirrored across platforms.
     */
    val id: String,
    val label: String,
    val badgeText: String? = null,
    /** Single character; bound to the platform's nav chord on hardware keyboards. */
    val hotkey: String? = null,
    /** Nested children rendered as an expandable group under the parent row. */
    val children: List<ShellNavItem> = emptyList(),
)

data class ShellNavSection(
    val id: String,
    /** Optional uppercase heading; null renders as a plain separator. */
    val title: String? = null,
    val items: List<ShellNavItem>,
)

/**
 * One rung of a drill-down hierarchy (e.g. organization → project). Flat apps
 * use a single level; hierarchical apps switch the active level and the shell
 * renders a drill-up row back to the parent.
 */
data class ShellNavLevel(
    val id: String,
    val sections: List<ShellNavSection>,
    val parentLevelId: String? = null,
    /** Label of the drill-up row shown when parentLevelId is set. */
    val drillUpLabel: String? = null,
)

object ShellNavigation {
    fun flattenItems(sections: List<ShellNavSection>): List<ShellNavItem> =
        sections.flatMap { section -> section.items.flatMap { listOf(it) + it.children } }

    /** Ids that are navigable routes (by convention, ids starting with "/"). */
    fun routeIds(sections: List<ShellNavSection>): List<String> =
        flattenItems(sections).map { it.id }.filter { it.startsWith("/") }

    /**
     * Resolves which nav item is active for the current location: an exact
     * pathname+search match wins, otherwise the route id with the most
     * specific (longest) path part that prefixes the pathname on a segment
     * boundary, otherwise the fallback. Ids with a query string rank behind
     * their plain route at equal path length, so deep links land on the
     * route item.
     */
    fun resolveActiveItemId(
        pathname: String,
        search: String,
        navRouteIds: List<String>,
        fallbackId: String,
    ): String {
        val currentRouteId = pathname + search
        navRouteIds.firstOrNull { it == currentRouteId }?.let { return it }
        val bySpecificity = navRouteIds.sortedWith(
            compareByDescending<String> { it.substringBefore("?").length }.thenBy { it.length },
        )
        return bySpecificity.firstOrNull { id ->
            val idPath = id.substringBefore("?")
            pathname == idPath || pathname.startsWith("$idPath/")
        } ?: fallbackId
    }

    /** Returns new sections with badge text merged onto matching item ids (children included). */
    fun applyBadges(
        sections: List<ShellNavSection>,
        badgeTextById: Map<String, String>,
    ): List<ShellNavSection> =
        sections.map { section ->
            section.copy(
                items = section.items.map { item ->
                    item.copy(
                        badgeText = badgeTextById[item.id] ?: item.badgeText,
                        children = item.children.map { child ->
                            child.copy(badgeText = badgeTextById[child.id] ?: child.badgeText)
                        },
                    )
                },
            )
        }

    /**
     * Maps lowercase hotkey characters to item ids, first declaration wins.
     * Multi-character hotkeys are ignored — the chord is owned by the
     * platform, the schema only names the key.
     */
    fun hotkeyMap(sections: List<ShellNavSection>): Map<String, String> {
        val idByKey = linkedMapOf<String, String>()
        for (item in flattenItems(sections)) {
            val key = item.hotkey?.trim()?.lowercase() ?: continue
            if (key.length == 1 && key !in idByKey) {
                idByKey[key] = item.id
            }
        }
        return idByKey
    }
}
