package com.baseapp.android.view.kit

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.baseapp.android.view.theme.LocalUiTheme

/**
 * The one shared loading treatment for page-level loading states (root
 * hydration, workspace bootstrap). Any full-screen loader should render this
 * header so the app never mixes spinner styles.
 */
@Composable
fun AppLoadingHeader(message: String, detail: String? = null) {
    val theme = LocalUiTheme.current
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(20.dp),
    ) {
        CircularProgressIndicator(color = theme.colors.accent)
        Text(
            text = message,
            color = theme.colors.textPrimary,
            fontSize = theme.typography.sizes.lg,
            fontWeight = FontWeight.SemiBold,
            textAlign = TextAlign.Center,
        )
        if (detail != null) {
            Text(
                text = detail,
                color = theme.colors.textSecondary,
                fontSize = theme.typography.sizes.sm,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 32.dp),
            )
        }
    }
}

/** Full-screen variant of the shared loader. */
@Composable
fun AppLoadingStateView(message: String, detail: String? = null) {
    val theme = LocalUiTheme.current
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(theme.colors.appBg),
        contentAlignment = Alignment.Center,
    ) {
        AppLoadingHeader(message = message, detail = detail)
    }
}
