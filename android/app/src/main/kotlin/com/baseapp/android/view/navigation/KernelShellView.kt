package com.baseapp.android.view.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Settings
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import com.baseapp.android.components.appConfig
import com.baseapp.android.components.components
import com.baseapp.android.components.shell.ShellNavItem
import com.baseapp.android.components.shell.ShellNavSection
import com.baseapp.android.components.storage.StorageUploadClient
import com.baseapp.android.components.store
import com.baseapp.android.view.projects.ProjectsListView
import com.baseapp.android.view.settings.SettingsView
import com.baseapp.android.view.users.UsersListView
import kotlinx.coroutines.launch

private const val PROJECTS_ID = "/projects"
private const val USERS_ID = "/users"
private const val SETTINGS_ID = "/settings"

/** Mirrors the web `shellNavSections` and the iOS KernelShellView nav config. */
private val kernelNavSections = listOf(
    ShellNavSection(
        id = "workspace",
        items = listOf(
            ShellNavItem(id = PROJECTS_ID, label = "Projects", hotkey = "p"),
            ShellNavItem(id = USERS_ID, label = "Users", hotkey = "u"),
        ),
    ),
    ShellNavSection(
        id = "account",
        items = listOf(
            ShellNavItem(id = SETTINGS_ID, label = "Settings", hotkey = "s"),
        ),
    ),
)

/**
 * Signed-in shell for the kernel Identity exemplar: binds the shell nav
 * config and the destination views into the generic NavigationShellView.
 * Products edit the nav data and the content switch — not the shell chrome
 * (see docs/shell.md).
 */
@Composable
fun KernelShellView() {
    val scope = rememberCoroutineScope()
    val sessionState by store.sessionStore.state.collectAsState()
    var selectedItemId by remember { mutableStateOf(PROJECTS_ID) }

    NavigationShellView(
        title = appConfig.appName,
        sections = kernelNavSections,
        selectedItemId = selectedItemId,
        onSelect = { selectedItemId = it },
        profile = sessionState.hydratedUser?.let { user ->
            ShellProfile(
                label = user.displayName,
                sublabel = user.email,
                avatarUrl = kernelAvatarUrl(user.avatarUploadId),
                items = listOf(
                    ShellProfileMenuItem(
                        id = SETTINGS_ID,
                        label = "Account settings",
                        icon = Icons.Filled.Settings,
                        action = { selectedItemId = SETTINGS_ID },
                    ),
                ),
                onSignOut = { scope.launch { components.auth.signOut() } },
            )
        },
        iconForItemId = mapOf(
            PROJECTS_ID to Icons.Filled.Folder,
            USERS_ID to Icons.Filled.People,
            SETTINGS_ID to Icons.Filled.Settings,
        ),
    ) { itemId ->
        when (itemId) {
            USERS_ID -> UsersListView()
            SETTINGS_ID -> SettingsView()
            else -> ProjectsListView()
        }
    }
}

/**
 * PUBLIC avatar uploads serve from the storage kernel's stable file URL (web
 * twin: AppLayout's avatarUrl via buildPublicFileUrl; iOS twin:
 * KernelShellView.avatarURL).
 */
fun kernelAvatarUrl(avatarUploadId: String?): String? {
    if (avatarUploadId == null) {
        return null
    }
    val endpoint = StorageUploadClient.endpoint(appConfig.graphqlUrl) ?: return null
    return StorageUploadClient.publicFileUrl(endpoint, avatarUploadId)
}
