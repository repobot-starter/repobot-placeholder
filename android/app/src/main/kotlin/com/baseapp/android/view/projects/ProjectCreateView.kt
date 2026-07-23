package com.baseapp.android.view.projects

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.baseapp.android.components.components
import com.baseapp.android.view.kit.LabeledTextField
import com.baseapp.android.view.kit.PrimaryActionButton
import com.baseapp.android.view.theme.LocalUiTheme
import kotlinx.coroutines.launch

@Composable
fun ProjectCreateView(onCreated: (() -> Unit)? = null) {
    val theme = LocalUiTheme.current
    val scope = rememberCoroutineScope()

    var name by remember { mutableStateOf("") }
    var descriptionText by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }

    val canSubmit = name.trim().isNotEmpty()

    fun submit() {
        if (isSubmitting) {
            return
        }
        isSubmitting = true
        scope.launch {
            try {
                val didCreate = components.project.createProject(
                    name = name,
                    description = descriptionText.ifEmpty { null },
                )
                if (didCreate) {
                    onCreated?.invoke()
                }
            } finally {
                isSubmitting = false
            }
        }
    }

    Column(
        verticalArrangement = Arrangement.spacedBy(20.dp),
        modifier = Modifier
            .fillMaxWidth()
            .padding(24.dp),
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(
                text = "Create a project",
                color = theme.colors.textPrimary,
                fontSize = theme.typography.sizes.xl,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = "Projects organize your team's work.",
                color = theme.colors.textSecondary,
                fontSize = theme.typography.sizes.sm,
            )
        }

        LabeledTextField(
            title = "Project name",
            placeholder = "Enter project name",
            value = name,
            onValueChange = { name = it },
            isRequired = true,
        )

        LabeledTextField(
            title = "Description",
            placeholder = "What is this project about?",
            value = descriptionText,
            onValueChange = { descriptionText = it },
        )

        PrimaryActionButton(
            title = "Create project",
            loadingTitle = "Creating...",
            isLoading = isSubmitting,
            isEnabled = canSubmit,
        ) {
            submit()
        }
    }
}
