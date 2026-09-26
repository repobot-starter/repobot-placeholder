package com.baseapp.android.update

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.baseapp.android.view.theme.LocalUiTheme
import kotlinx.coroutines.launch

/**
 * The "newer build is ready" banner, floated over whatever surface the
 * pack renders (RootView mounts it above every home surface — games and
 * client-only packs update too). One tap downloads and installs; the
 * system shows its own confirmation sheet before anything changes.
 */
@Composable
fun UpdateBannerOverlay() {
    val available by UpdateStore.available.collectAsState()
    val phase by UpdateStore.phase.collectAsState()
    val dismissed by UpdateStore.dismissed.collectAsState()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    Box(modifier = Modifier.fillMaxWidth()) {
        AnimatedVisibility(
            visible = available != null && !dismissed,
            enter = slideInVertically { it } + fadeIn(),
            exit = slideOutVertically { it } + fadeOut(),
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .navigationBarsPadding()
                .padding(horizontal = 12.dp)
                .padding(bottom = 8.dp),
        ) {
            available?.let { update ->
                UpdateBanner(
                    phase = phase,
                    onUpdate = {
                        scope.launch { UpdateInstaller.downloadAndInstall(context, update) }
                    },
                    onDismiss = { UpdateStore.dismiss() },
                )
            }
        }
    }
}

@Composable
private fun UpdateBanner(phase: UpdatePhase, onUpdate: () -> Unit, onDismiss: () -> Unit) {
    val theme = LocalUiTheme.current
    val isBusy = phase == UpdatePhase.DOWNLOADING || phase == UpdatePhase.INSTALLING
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(theme.colors.surface)
            .border(1.dp, theme.colors.accent, RoundedCornerShape(14.dp))
            .padding(horizontal = 14.dp, vertical = 12.dp),
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = "A newer build is ready",
                color = theme.colors.textPrimary,
                fontSize = theme.typography.sizes.sm,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                text = when (phase) {
                    UpdatePhase.DOWNLOADING -> "Downloading…"
                    UpdatePhase.INSTALLING -> "Installing — Android will ask to confirm."
                    UpdatePhase.FAILED -> "Update failed. Tap to try again."
                    UpdatePhase.IDLE -> "Update this app to the latest build of your project."
                },
                color = theme.colors.textSecondary,
                fontSize = theme.typography.sizes.xs,
            )
        }
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .clip(RoundedCornerShape(10.dp))
                .background(if (isBusy) theme.colors.surfaceAlt else theme.colors.accent)
                .clickable(enabled = !isBusy, onClick = onUpdate)
                .padding(horizontal = 14.dp, vertical = 8.dp),
        ) {
            Text(
                text = if (isBusy) "Working…" else "Update",
                color = if (isBusy) theme.colors.textSecondary else theme.colors.accentText,
                fontSize = theme.typography.sizes.sm,
                fontWeight = FontWeight.SemiBold,
            )
        }
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .padding(start = 8.dp)
                .size(24.dp)
                .clip(CircleShape)
                .background(theme.colors.surfaceAlt)
                .clickable(onClick = onDismiss),
        ) {
            Icon(
                imageVector = Icons.Filled.Close,
                contentDescription = "Dismiss update banner",
                tint = theme.colors.textSecondary,
                modifier = Modifier.size(12.dp),
            )
        }
    }
}
