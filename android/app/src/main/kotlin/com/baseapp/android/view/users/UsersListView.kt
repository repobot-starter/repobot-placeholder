package com.baseapp.android.view.users

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.baseapp.android.components.components
import com.baseapp.android.graphql.UserRowData
import com.baseapp.android.graphql.UserStatusValue
import com.baseapp.android.view.kit.SearchField
import com.baseapp.android.view.theme.LocalUiTheme
import kotlinx.coroutines.launch

@Composable
fun UsersListView() {
    val theme = LocalUiTheme.current
    val scope = rememberCoroutineScope()
    val page = components.usersPage

    val rows by page.rows.collectAsState()
    val searchQuery by page.searchQuery.collectAsState()
    val pagerState by page.pager.state.collectAsState()

    LaunchedEffect(Unit) {
        page.refresh(withLoading = true)
    }

    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(12.dp),
        contentPadding = PaddingValues(16.dp),
        modifier = Modifier
            .fillMaxSize()
            .background(theme.colors.appBg),
    ) {
        item {
            SearchField(
                placeholder = "Find user...",
                value = searchQuery,
                onValueChange = { page.setSearchQuery(it) },
            )
        }

        if (rows.isEmpty() && !pagerState.loading) {
            item {
                Text(
                    text = "No users found.",
                    color = theme.colors.textSecondary,
                    fontSize = theme.typography.sizes.sm,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 32.dp),
                )
            }
        }

        items(rows, key = { it.id }) { user ->
            UserCard(user)
        }

        if (pagerState.hasNextPage) {
            item {
                Text(
                    text = "Load more users",
                    color = theme.colors.accent,
                    fontSize = theme.typography.sizes.sm,
                    fontWeight = FontWeight.SemiBold,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { scope.launch { page.loadNextPage() } }
                        .padding(vertical = 8.dp),
                )
            }
        }
    }
}

@Composable
private fun UserCard(user: UserRowData) {
    val theme = LocalUiTheme.current
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(theme.radius.md))
            .background(theme.colors.surface)
            .border(1.dp, theme.colors.border, RoundedCornerShape(theme.radius.md))
            .padding(12.dp),
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .size(38.dp)
                .clip(CircleShape)
                .background(theme.colors.surfaceAlt),
        ) {
            Text(
                text = initialsOf(user.displayName),
                color = theme.colors.textSecondary,
                fontSize = theme.typography.sizes.sm,
                fontWeight = FontWeight.SemiBold,
            )
        }

        Column(
            verticalArrangement = Arrangement.spacedBy(3.dp),
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 12.dp),
        ) {
            Text(
                text = user.displayName,
                color = theme.colors.textPrimary,
                fontSize = theme.typography.sizes.md,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                text = user.email,
                color = theme.colors.textSecondary,
                fontSize = theme.typography.sizes.xs,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }

        if (user.status == UserStatusValue.DISABLED) {
            Text(
                text = "Disabled",
                color = theme.colors.statusWarning,
                fontSize = theme.typography.sizes.xs,
                fontWeight = FontWeight.Medium,
            )
        }
    }
}

private fun initialsOf(displayName: String): String {
    val parts = displayName
        .split(" ")
        .filter { it.isNotEmpty() }
        .take(2)
        .mapNotNull { it.firstOrNull()?.toString() }
    return if (parts.isEmpty()) "?" else parts.joinToString("").uppercase()
}
