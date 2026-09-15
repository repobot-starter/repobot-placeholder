package com.baseapp.android.view.kit

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import com.baseapp.android.view.theme.LocalUiTheme

@Composable
fun SearchField(
    placeholder: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val theme = LocalUiTheme.current
    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(theme.radius.md))
            .background(theme.colors.surface)
            .border(1.dp, theme.colors.border, RoundedCornerShape(theme.radius.md))
            .padding(horizontal = 12.dp, vertical = 10.dp),
    ) {
        if (value.isEmpty()) {
            Text(
                text = placeholder,
                color = theme.colors.textSecondary,
                fontSize = theme.typography.sizes.sm,
            )
        }
        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            singleLine = true,
            textStyle = TextStyle(
                color = theme.colors.textPrimary,
                fontSize = theme.typography.sizes.sm,
            ),
            cursorBrush = SolidColor(theme.colors.accent),
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
