package com.baseapp.android.view.navigation

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.baseapp.android.components.shell.ShellNavSection
import com.baseapp.android.components.shell.ShellNavigation
import com.baseapp.android.view.theme.LocalUiTheme

/**
 * The application shell: a top bar with a menu button plus a slide-over
 * sidebar drawer over the content — the native twin of the web design-system
 * AppShell (see docs/shell.md). Generic over the shell nav schema
 * (ShellNavModels.kt); apps bind it with their nav config and a content
 * host, like KernelShellView does for the Identity exemplar.
 */
@Composable
fun NavigationShellView(
    title: String,
    sections: List<ShellNavSection>,
    selectedItemId: String,
    onSelect: (String) -> Unit,
    drillUp: ShellDrillUp? = null,
    profile: ShellProfile? = null,
    iconForItemId: Map<String, ImageVector> = emptyMap(),
    content: @Composable (String) -> Unit,
) {
    val theme = LocalUiTheme.current
    var isSidebarOpen by remember { mutableStateOf(false) }
    val drawerWidth = 300.dp
    val drawerOffset by animateDpAsState(
        targetValue = if (isSidebarOpen) 0.dp else -(drawerWidth + 24.dp),
        animationSpec = tween(durationMillis = 200),
        label = "drawerOffset",
    )

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(theme.colors.appBg),
        ) {
            TopBar(
                label = ShellNavigation.flattenItems(sections)
                    .firstOrNull { it.id == selectedItemId }
                    ?.label ?: title,
                onMenuClick = { isSidebarOpen = true },
            )
            Box(modifier = Modifier.weight(1f)) {
                content(selectedItemId)
            }
        }

        AnimatedVisibility(visible = isSidebarOpen, enter = fadeIn(), exit = fadeOut()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(theme.colors.overlayBackdrop)
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null,
                    ) { isSidebarOpen = false },
            )
        }

        Box(
            modifier = Modifier
                .fillMaxHeight()
                .width(drawerWidth)
                .offset(x = drawerOffset),
        ) {
            SidebarMenuView(
                title = title,
                sections = sections,
                selectedItemId = selectedItemId,
                onSelect = { item ->
                    isSidebarOpen = false
                    onSelect(item.id)
                },
                drillUp = drillUp?.let { drillUpConfig ->
                    ShellDrillUp(drillUpConfig.label) {
                        isSidebarOpen = false
                        drillUpConfig.action()
                    }
                },
                profile = profile?.let { profileConfig ->
                    // Menu-item actions typically navigate, so close the drawer first.
                    profileConfig.copy(
                        items = profileConfig.items.map { item ->
                            item.copy(action = {
                                isSidebarOpen = false
                                item.action()
                            })
                        },
                    )
                },
                iconForItemId = iconForItemId,
            )
        }
    }
}

@Composable
private fun TopBar(label: String, onMenuClick: () -> Unit) {
    val theme = LocalUiTheme.current
    Column(modifier = Modifier.background(theme.colors.surface)) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .height(48.dp)
                .padding(horizontal = theme.spacing.sm),
        ) {
            Icon(
                imageVector = Icons.Filled.Menu,
                contentDescription = "Open navigation",
                tint = theme.colors.textPrimary,
                modifier = Modifier
                    .size(36.dp)
                    .clickable(onClick = onMenuClick)
                    .padding(6.dp),
            )
            Text(
                text = label,
                color = theme.colors.textPrimary,
                fontSize = theme.typography.sizes.md,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
                modifier = Modifier.padding(start = theme.spacing.sm),
            )
        }
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(theme.colors.border),
        )
    }
}
