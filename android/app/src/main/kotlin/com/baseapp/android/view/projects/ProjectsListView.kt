package com.baseapp.android.view.projects

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.baseapp.android.components.components
import com.baseapp.android.graphql.ProjectRowData
import com.baseapp.android.graphql.ProjectStatusValue
import com.baseapp.android.view.kit.PrimaryActionButton
import com.baseapp.android.view.kit.SearchField
import com.baseapp.android.view.theme.LocalUiTheme
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProjectsListView() {
    val theme = LocalUiTheme.current
    val scope = rememberCoroutineScope()
    val page = components.projectsPage

    val rows by page.rows.collectAsState()
    val searchQuery by page.searchQuery.collectAsState()
    val pagerState by page.pager.state.collectAsState()
    var isCreateSheetPresented by remember { mutableStateOf(false) }
    val sheetState = rememberModalBottomSheetState()

    LaunchedEffect(Unit) {
        page.refresh(withLoading = true)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(theme.colors.appBg),
    ) {
        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(12.dp),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
            modifier = Modifier.weight(1f),
        ) {
            item {
                SearchField(
                    placeholder = "Find project...",
                    value = searchQuery,
                    onValueChange = { page.setSearchQuery(it) },
                )
            }

            if (rows.isEmpty() && !pagerState.loading) {
                item {
                    Text(
                        text = "No projects yet. Create your first one below.",
                        color = theme.colors.textSecondary,
                        fontSize = theme.typography.sizes.sm,
                        textAlign = TextAlign.Center,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 32.dp),
                    )
                }
            }

            items(rows, key = { it.id }) { project ->
                ProjectCard(project)
            }

            if (pagerState.hasNextPage) {
                item {
                    Text(
                        text = "Load more projects",
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

        PrimaryActionButton(
            title = "+ New Project",
            loadingTitle = "",
            isLoading = false,
            isEnabled = true,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
        ) {
            isCreateSheetPresented = true
        }
    }

    if (isCreateSheetPresented) {
        ModalBottomSheet(
            onDismissRequest = { isCreateSheetPresented = false },
            sheetState = sheetState,
            containerColor = theme.colors.appBg,
        ) {
            ProjectCreateView(
                onCreated = { isCreateSheetPresented = false },
            )
        }
    }
}

@Composable
private fun ProjectCard(project: ProjectRowData) {
    val theme = LocalUiTheme.current
    Column(
        verticalArrangement = Arrangement.spacedBy(10.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(theme.radius.md))
            .background(theme.colors.surface)
            .border(1.dp, theme.colors.border, RoundedCornerShape(theme.radius.md))
            .padding(12.dp),
    ) {
        Row(verticalAlignment = androidx.compose.ui.Alignment.Top) {
            Text(
                text = project.name,
                color = theme.colors.textPrimary,
                fontSize = theme.typography.sizes.md,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f),
            )
            StatusBadge(project.status)
        }

        project.description?.takeIf { it.isNotEmpty() }?.let { description ->
            Text(
                text = description,
                color = theme.colors.textSecondary,
                fontSize = theme.typography.sizes.xs,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
        }

        Text(
            text = "Created by ${project.createdBy.displayName}",
            color = theme.colors.textSecondary,
            fontSize = theme.typography.sizes.xs,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

@Composable
private fun StatusBadge(status: ProjectStatusValue) {
    val theme = LocalUiTheme.current
    val isActive = status == ProjectStatusValue.ACTIVE
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(theme.radius.pill))
            .background(theme.colors.surfaceAlt)
            .border(1.dp, theme.colors.border, RoundedCornerShape(theme.radius.pill))
            .padding(horizontal = 8.dp, vertical = 4.dp),
    ) {
        Text(
            text = if (isActive) "Active" else "Archived",
            color = if (isActive) theme.colors.statusSuccess else theme.colors.textSecondary,
            fontSize = theme.typography.sizes.xs,
            fontWeight = FontWeight.Medium,
        )
    }
}
