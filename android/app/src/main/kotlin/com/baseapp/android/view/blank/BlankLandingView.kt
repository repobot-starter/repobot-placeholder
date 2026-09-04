package com.baseapp.android.view.blank

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.baseapp.android.view.theme.LocalUiTheme

/**
 * Home surface for the `blank` (no template) pack — the native twin of
 * `web/app/src/View/Blank/BlankPage.tsx`. Client-only packs never deploy a
 * backend, so this view uses no stores, components, or network: just a mark
 * and the invitation to start creating. The web logo asset is not bundled in
 * the Android app, so a Material sparkle icon stands in as the app mark.
 */
@Composable
fun BlankLandingView() {
    val theme = LocalUiTheme.current
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(theme.colors.appBg),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(theme.spacing.lg),
        ) {
            Icon(
                imageVector = Icons.Filled.AutoAwesome,
                contentDescription = null,
                tint = theme.colors.accent,
                modifier = Modifier.size(56.dp),
            )
            Text(
                text = "Chat with the agent to start creating.",
                color = theme.colors.textSecondary,
                fontSize = theme.typography.sizes.lg,
                textAlign = TextAlign.Center,
            )
        }
    }
}
