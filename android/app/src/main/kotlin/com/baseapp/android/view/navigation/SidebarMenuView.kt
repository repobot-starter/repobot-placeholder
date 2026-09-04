package com.baseapp.android.view.navigation

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.baseapp.android.components.shell.ShellNavItem
import com.baseapp.android.components.shell.ShellNavSection
import com.baseapp.android.view.kit.RemoteAvatarImage
import com.baseapp.android.view.theme.LocalUiTheme
import com.baseapp.android.view.theme.ThemeModeStore
import com.baseapp.android.view.theme.UiThemeMode
import java.util.Locale

/** Drill-up affordance rendered above the nav when inside a child nav level. */
data class ShellDrillUp(
    val label: String,
    val action: () -> Unit,
)

/** An app-supplied entry in the account menu (e.g. "Account settings"). */
data class ShellProfileMenuItem(
    val id: String,
    val label: String,
    val icon: ImageVector? = null,
    val action: () -> Unit,
)

/** The signed-in account shown in the drawer footer. */
data class ShellProfile(
    val label: String,
    val sublabel: String? = null,
    /** PUBLIC avatar upload's serving URL; initials render when null. */
    val avatarUrl: String? = null,
    /**
     * Rendered above the built-in theme toggle + sign out rows; what the
     * items do is the binder's concern (the shell stays domain-agnostic).
     */
    val items: List<ShellProfileMenuItem> = emptyList(),
    val onSignOut: (() -> Unit)? = null,
)

/**
 * The sidebar drawer: brand row, sectioned nav (badges, expandable children,
 * drill-up), and the account footer with theme + sign out — the native twin
 * of the web design-system AppShell sidebar. Purely presentational; nav data
 * and handlers are injected. Icons come from the binder via [iconForItemId].
 */
@Composable
fun SidebarMenuView(
    title: String,
    sections: List<ShellNavSection>,
    selectedItemId: String,
    onSelect: (ShellNavItem) -> Unit,
    drillUp: ShellDrillUp? = null,
    profile: ShellProfile? = null,
    iconForItemId: Map<String, ImageVector> = emptyMap(),
) {
    val theme = LocalUiTheme.current
    val expandedGroupIds = remember {
        mutableStateOf(
            sections
                .flatMap { it.items }
                .filter { item -> item.children.any { it.id == selectedItemId } }
                .map { it.id }
                .toSet(),
        )
    }

    Column(
        modifier = Modifier
            .fillMaxHeight()
            .background(theme.colors.surface)
            .statusBarsPadding()
            .navigationBarsPadding(),
    ) {
        Text(
            text = title,
            color = theme.colors.textPrimary,
            fontSize = theme.typography.sizes.lg,
            fontWeight = FontWeight.Bold,
            maxLines = 1,
            modifier = Modifier.padding(horizontal = theme.spacing.md, vertical = theme.spacing.md),
        )

        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = theme.spacing.sm),
        ) {
            drillUp?.let { DrillUpRow(it) }
            sections.forEachIndexed { index, section ->
                SectionView(
                    section = section,
                    isFirst = index == 0,
                    selectedItemId = selectedItemId,
                    expandedGroupIds = expandedGroupIds.value,
                    onToggleGroup = { id ->
                        expandedGroupIds.value =
                            if (id in expandedGroupIds.value) expandedGroupIds.value - id
                            else expandedGroupIds.value + id
                    },
                    onSelect = onSelect,
                    iconForItemId = iconForItemId,
                )
            }
        }

        profile?.let { AccountFooter(it) }
    }
}

@Composable
private fun DrillUpRow(drillUp: ShellDrillUp) {
    val theme = LocalUiTheme.current
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(theme.radius.md))
            .clickable(onClick = drillUp.action)
            .padding(horizontal = theme.spacing.sm, vertical = theme.spacing.xs),
    ) {
        Icon(
            imageVector = Icons.Filled.ChevronLeft,
            contentDescription = null,
            tint = theme.colors.textSecondary,
            modifier = Modifier.size(18.dp),
        )
        Text(
            text = drillUp.label,
            color = theme.colors.textSecondary,
            fontSize = theme.typography.sizes.sm,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(start = theme.spacing.sm),
        )
    }
}

@Composable
private fun SectionView(
    section: ShellNavSection,
    isFirst: Boolean,
    selectedItemId: String,
    expandedGroupIds: Set<String>,
    onToggleGroup: (String) -> Unit,
    onSelect: (ShellNavItem) -> Unit,
    iconForItemId: Map<String, ImageVector>,
) {
    val theme = LocalUiTheme.current
    val sectionTitle = section.title
    if (sectionTitle != null) {
        Text(
            text = sectionTitle.uppercase(Locale.getDefault()),
            color = theme.colors.textSecondary,
            fontSize = theme.typography.sizes.xs,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(
                start = theme.spacing.sm,
                top = theme.spacing.md,
                bottom = theme.spacing.xxs,
            ),
        )
    } else if (!isFirst) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = theme.spacing.sm, vertical = theme.spacing.xs)
                .height(1.dp)
                .background(theme.colors.border),
        )
    }
    section.items.forEach { item ->
        NavRow(
            item = item,
            isChild = false,
            isSelected = selectedItemId == item.id,
            isExpanded = item.id in expandedGroupIds,
            onClick = {
                if (item.children.isNotEmpty()) onToggleGroup(item.id) else onSelect(item)
            },
            iconForItemId = iconForItemId,
        )
        AnimatedVisibility(visible = item.children.isNotEmpty() && item.id in expandedGroupIds) {
            Column {
                item.children.forEach { child ->
                    NavRow(
                        item = child,
                        isChild = true,
                        isSelected = selectedItemId == child.id,
                        isExpanded = false,
                        onClick = { onSelect(child) },
                        iconForItemId = iconForItemId,
                    )
                }
            }
        }
    }
}

@Composable
private fun NavRow(
    item: ShellNavItem,
    isChild: Boolean,
    isSelected: Boolean,
    isExpanded: Boolean,
    onClick: () -> Unit,
    iconForItemId: Map<String, ImageVector>,
) {
    val theme = LocalUiTheme.current
    val contentColor = if (isSelected) theme.colors.accent else theme.colors.textSecondary
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .padding(start = if (isChild) theme.spacing.xl else 0.dp)
            .clip(RoundedCornerShape(theme.radius.md))
            .background(if (isSelected) theme.colors.accent.copy(alpha = 0.12f) else theme.colors.surface)
            .clickable(onClick = onClick)
            .padding(horizontal = theme.spacing.sm, vertical = theme.spacing.xs + 2.dp),
    ) {
        iconForItemId[item.id]?.let { icon ->
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = contentColor,
                modifier = Modifier
                    .size(20.dp)
                    .padding(end = 2.dp),
            )
            Spacer(modifier = Modifier.size(theme.spacing.sm))
        }
        Text(
            text = item.label,
            color = contentColor,
            fontSize = theme.typography.sizes.sm,
            fontWeight = FontWeight.SemiBold,
            maxLines = 1,
            modifier = Modifier.weight(1f),
        )
        val badgeText = item.badgeText
        if (!badgeText.isNullOrEmpty() && badgeText != "0") {
            Text(
                text = badgeText,
                color = theme.colors.accent,
                fontSize = theme.typography.sizes.xs,
                fontWeight = FontWeight.Bold,
                modifier = Modifier
                    .clip(RoundedCornerShape(theme.radius.pill))
                    .background(theme.colors.accent.copy(alpha = 0.14f))
                    .padding(horizontal = theme.spacing.xs, vertical = 1.dp),
            )
        }
        if (item.children.isNotEmpty()) {
            Icon(
                imageVector = Icons.Filled.KeyboardArrowDown,
                contentDescription = null,
                tint = theme.colors.textSecondary,
                modifier = Modifier
                    .size(16.dp)
                    .rotate(if (isExpanded) 180f else 0f),
            )
        }
    }
}

@Composable
private fun AccountFooter(profile: ShellProfile) {
    val theme = LocalUiTheme.current
    val context = LocalContext.current
    var isMenuOpen by remember { mutableStateOf(false) }

    Column(modifier = Modifier.padding(theme.spacing.sm)) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(theme.colors.border),
        )

        AnimatedVisibility(visible = isMenuOpen) {
            Column {
                val isLight = theme.mode == UiThemeMode.LIGHT
                profile.items.forEach { item ->
                    AccountMenuRow(
                        icon = item.icon ?: Icons.Filled.Settings,
                        label = item.label,
                        onClick = item.action,
                    )
                }
                AccountMenuRow(
                    icon = if (isLight) Icons.Filled.DarkMode else Icons.Filled.LightMode,
                    label = if (isLight) "Dark mode" else "Light mode",
                    onClick = { ThemeModeStore.setMode(context, if (isLight) "dark" else "light") },
                )
                profile.onSignOut?.let { onSignOut ->
                    AccountMenuRow(
                        icon = Icons.AutoMirrored.Filled.Logout,
                        label = "Sign out",
                        onClick = onSignOut,
                    )
                }
            }
        }

        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(theme.radius.md))
                .clickable { isMenuOpen = !isMenuOpen }
                .padding(horizontal = theme.spacing.sm, vertical = theme.spacing.xs),
        ) {
            val avatarInitials: @Composable () -> Unit = {
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .size(28.dp)
                        .clip(CircleShape)
                        .background(theme.colors.accent.copy(alpha = 0.14f)),
                ) {
                    Text(
                        text = initialsOf(profile.label),
                        color = theme.colors.accent,
                        fontSize = theme.typography.sizes.xs,
                        fontWeight = FontWeight.Bold,
                    )
                }
            }
            val avatarUrl = profile.avatarUrl
            if (avatarUrl != null) {
                RemoteAvatarImage(url = avatarUrl, size = 28.dp, placeholder = avatarInitials)
            } else {
                avatarInitials()
            }
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(start = theme.spacing.sm),
            ) {
                Text(
                    text = profile.label,
                    color = theme.colors.textPrimary,
                    fontSize = theme.typography.sizes.sm,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                )
                profile.sublabel?.let { sublabel ->
                    Text(
                        text = sublabel,
                        color = theme.colors.textSecondary,
                        fontSize = theme.typography.sizes.xs,
                        maxLines = 1,
                    )
                }
            }
            Icon(
                imageVector = Icons.Filled.KeyboardArrowUp,
                contentDescription = null,
                tint = theme.colors.textSecondary,
                modifier = Modifier
                    .size(16.dp)
                    .rotate(if (isMenuOpen) 180f else 0f),
            )
        }
    }
}

@Composable
private fun AccountMenuRow(icon: ImageVector, label: String, onClick: () -> Unit) {
    val theme = LocalUiTheme.current
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(theme.radius.md))
            .clickable(onClick = onClick)
            .padding(horizontal = theme.spacing.sm, vertical = theme.spacing.xs + 2.dp),
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = theme.colors.textPrimary,
            modifier = Modifier.size(18.dp),
        )
        Text(
            text = label,
            color = theme.colors.textPrimary,
            fontSize = theme.typography.sizes.sm,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(start = theme.spacing.sm),
        )
    }
}

private fun initialsOf(label: String): String {
    val parts = label.split(' ', '@', '.', '_', '-').filter { it.isNotEmpty() }
    if (parts.isEmpty()) return "?"
    if (parts.size == 1) return parts[0].take(2).uppercase(Locale.getDefault())
    return "${parts[0].first()}${parts[1].first()}".uppercase(Locale.getDefault())
}
