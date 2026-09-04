package com.baseapp.android.view.kit

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.baseapp.android.view.theme.LocalUiTheme

@Composable
fun PrimaryActionButton(
    title: String,
    loadingTitle: String,
    isLoading: Boolean,
    isEnabled: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    val theme = LocalUiTheme.current
    val isInteractive = isEnabled && !isLoading
    Row(
        modifier = modifier
            .fillMaxWidth()
            .alpha(if (isInteractive) 1f else 0.45f)
            .clip(RoundedCornerShape(theme.radius.md))
            .background(theme.colors.accent)
            .clickable(enabled = isInteractive, onClick = onClick)
            .padding(vertical = 12.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier
                    .size(16.dp)
                    .padding(end = 0.dp),
                color = theme.colors.accentText,
                strokeWidth = 2.dp,
            )
            Text(
                text = " $loadingTitle",
                color = theme.colors.accentText,
                fontSize = theme.typography.sizes.md,
                fontWeight = FontWeight.SemiBold,
            )
        } else {
            Text(
                text = title,
                color = theme.colors.accentText,
                fontSize = theme.typography.sizes.md,
                fontWeight = FontWeight.SemiBold,
            )
        }
    }
}
