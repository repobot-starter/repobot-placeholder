package com.baseapp.android.view

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.People
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.baseapp.android.components.components
import com.baseapp.android.components.store
import com.baseapp.android.view.projects.ProjectsListView
import com.baseapp.android.view.theme.LocalUiTheme
import com.baseapp.android.view.users.UsersListView
import kotlinx.coroutines.launch

/**
 * Signed-in shell. Tabs mirror the web kernel's exemplar routes: /projects,
 * /users, plus an account tab for the current session.
 */
@Composable
fun MainTabView() {
    val theme = LocalUiTheme.current
    var selectedTab by remember { mutableIntStateOf(0) }

    Scaffold(
        containerColor = theme.colors.appBg,
        bottomBar = {
            NavigationBar(containerColor = theme.colors.surface) {
                val itemColors = NavigationBarItemDefaults.colors(
                    selectedIconColor = theme.colors.accent,
                    selectedTextColor = theme.colors.accent,
                    unselectedIconColor = theme.colors.textSecondary,
                    unselectedTextColor = theme.colors.textSecondary,
                    indicatorColor = theme.colors.surfaceAlt,
                )
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Filled.Folder, contentDescription = null) },
                    label = { Text("Projects") },
                    colors = itemColors,
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(Icons.Filled.People, contentDescription = null) },
                    label = { Text("Users") },
                    colors = itemColors,
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = { Icon(Icons.Filled.AccountCircle, contentDescription = null) },
                    label = { Text("Account") },
                    colors = itemColors,
                )
            }
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
        ) {
            when (selectedTab) {
                0 -> ProjectsListView()
                1 -> UsersListView()
                else -> AccountView()
            }
        }
    }
}

@Composable
private fun AccountView() {
    val theme = LocalUiTheme.current
    val scope = rememberCoroutineScope()
    val sessionState by store.sessionStore.state.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(theme.colors.appBg)
            .padding(16.dp),
    ) {
        sessionState.hydratedUser?.let { user ->
            Text(
                text = "Signed in as",
                color = theme.colors.textSecondary,
                fontSize = theme.typography.sizes.xs,
                modifier = Modifier.padding(bottom = 8.dp),
            )
            Text(
                text = user.displayName,
                color = theme.colors.textPrimary,
                fontSize = theme.typography.sizes.md,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                text = user.email,
                color = theme.colors.textSecondary,
                fontSize = theme.typography.sizes.sm,
                modifier = Modifier.padding(bottom = 12.dp),
            )
            user.account?.let { account ->
                Text(
                    text = "Account: ${account.name}",
                    color = theme.colors.textSecondary,
                    fontSize = theme.typography.sizes.sm,
                    modifier = Modifier.padding(bottom = 12.dp),
                )
            }
        }

        Text(
            text = "Sign out",
            color = theme.colors.statusError,
            fontSize = theme.typography.sizes.md,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier
                .fillMaxWidth()
                .clickable { scope.launch { components.auth.signOut() } }
                .padding(vertical = 12.dp),
        )
    }
}
