package com.baseapp.android.view.kit

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import com.baseapp.android.view.theme.LocalUiTheme

@Composable
fun LabeledTextField(
    title: String,
    placeholder: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    keyboardType: KeyboardType = KeyboardType.Text,
    isRequired: Boolean = false,
    visualTransformation: VisualTransformation = VisualTransformation.None,
) {
    val theme = LocalUiTheme.current
    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = if (isRequired) "$title*" else title,
            color = theme.colors.textPrimary,
            fontSize = theme.typography.sizes.sm,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(bottom = 12.dp),
        )
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(theme.radius.md))
                .background(theme.colors.surfaceAlt)
                .border(1.dp, theme.colors.border, RoundedCornerShape(theme.radius.md))
                .padding(horizontal = 12.dp, vertical = 11.dp),
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
                keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
                visualTransformation = visualTransformation,
                textStyle = TextStyle(
                    color = theme.colors.textPrimary,
                    fontSize = theme.typography.sizes.sm,
                ),
                cursorBrush = SolidColor(theme.colors.accent),
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}
