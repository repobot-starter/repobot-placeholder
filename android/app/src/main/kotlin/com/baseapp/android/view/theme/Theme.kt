package com.baseapp.android.view.theme

import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.ExperimentalTextApi
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.baseapp.android.R

/**
 * Local theme preference. The kernel schema has no user theme field; the app
 * follows the system appearance. If you add a persisted preference, extend
 * this enum and store it in a profile store.
 */
enum class ThemePreference { LIGHT, DARK, SYSTEM }

enum class UiThemeMode { LIGHT, DARK }

data class UiThemeTokens(
    val mode: UiThemeMode,
    val typography: Typography,
    val colors: Colors,
    val spacing: Spacing,
    val radius: Radius,
) {
    data class Typography(
        /** Resolved from the repobot.theme.json `fontFamily` preset. */
        val fontFamily: FontFamily,
        val sizes: Sizes,
    ) {
        data class Sizes(
            val xs: TextUnit,
            val sm: TextUnit,
            val md: TextUnit,
            val lg: TextUnit,
            val xl: TextUnit,
        )
    }

    data class Colors(
        val appBg: Color,
        val surface: Color,
        val surfaceAlt: Color,
        val textPrimary: Color,
        val textSecondary: Color,
        val border: Color,
        val hover: Color,
        val accent: Color,
        val accentText: Color,
        val overlayBackdrop: Color,
        val statusSuccess: Color,
        val statusError: Color,
        val statusWarning: Color,
        val statusInfo: Color,
    )

    data class Spacing(
        val xxs: Dp,
        val xs: Dp,
        val sm: Dp,
        val md: Dp,
        val lg: Dp,
        val xl: Dp,
    )

    data class Radius(
        val sm: Dp,
        val md: Dp,
        val lg: Dp,
        val pill: Dp,
    )
}

/**
 * Maps the repobot.theme.json `fontFamily` preset to a Compose FontFamily.
 * Web resolves the same presets to CSS stacks (themeConfig.ts); the custom
 * families ship as TTFs in res/font (OFL — licenses in assets/font-licenses).
 * RootView provides the family app-wide via ProvideTextStyle.
 */
object ThemeFontResolver {
    /** Variable-font family across the UI's weight range. */
    @OptIn(ExperimentalTextApi::class)
    private fun variable(resId: Int, vararg weights: Int): FontFamily =
        FontFamily(
            weights.map { weight ->
                Font(
                    resId = resId,
                    weight = FontWeight(weight),
                    variationSettings = FontVariation.Settings(FontVariation.weight(weight)),
                )
            },
        )

    val family: FontFamily = when (GeneratedTheme.FONT_FAMILY) {
        "serif" -> FontFamily.Serif
        "mono" -> FontFamily.Monospace
        "inter" -> variable(R.font.inter, 400, 500, 600, 700)
        "manrope" -> variable(R.font.manrope, 400, 500, 600, 700)
        "source-serif" -> variable(R.font.source_serif4, 400, 500, 600, 700)
        "space-grotesk" -> variable(R.font.space_grotesk, 400, 500, 600, 700)
        "plex-mono" -> FontFamily(
            Font(R.font.ibm_plex_mono_regular, weight = FontWeight.Normal),
            Font(R.font.ibm_plex_mono_semibold, weight = FontWeight.SemiBold),
        )
        // "system" and "rounded" (no Android equivalent) use the platform font.
        else -> FontFamily.Default
    }
}

object ThemeResolver {
    fun resolveMode(preference: ThemePreference, systemIsDark: Boolean): UiThemeMode =
        when (preference) {
            ThemePreference.LIGHT -> UiThemeMode.LIGHT
            ThemePreference.DARK -> UiThemeMode.DARK
            ThemePreference.SYSTEM -> if (systemIsDark) UiThemeMode.DARK else UiThemeMode.LIGHT
        }
}

object ThemeCatalog {
    fun uiTokens(mode: UiThemeMode): UiThemeTokens {
        val typography = UiThemeTokens.Typography(
            fontFamily = ThemeFontResolver.family,
            sizes = UiThemeTokens.Typography.Sizes(
                xs = 12.sp, sm = 13.sp, md = 14.sp, lg = 16.sp, xl = 20.sp,
            ),
        )
        // Spacing/radius scales and brand accents come from GeneratedTheme.kt,
        // regenerated from repobot.theme.json (`npm run codegen`) so all
        // platforms share the contract's brand. Neutral surfaces stay
        // native-tuned below.
        val spacing = UiThemeTokens.Spacing(
            xxs = GeneratedTheme.SPACE_XXS.dp,
            xs = GeneratedTheme.SPACE_XS.dp,
            sm = GeneratedTheme.SPACE_SM.dp,
            md = GeneratedTheme.SPACE_MD.dp,
            lg = GeneratedTheme.SPACE_LG.dp,
            xl = GeneratedTheme.SPACE_XL.dp,
        )
        val radius = UiThemeTokens.Radius(
            sm = GeneratedTheme.RADIUS_SM.dp,
            md = GeneratedTheme.RADIUS_MD.dp,
            lg = GeneratedTheme.RADIUS_LG.dp,
            pill = GeneratedTheme.RADIUS_PILL.dp,
        )
        return when (mode) {
            UiThemeMode.DARK -> UiThemeTokens(
                mode = mode,
                typography = typography,
                colors = UiThemeTokens.Colors(
                    appBg = Color(0xFF080B14),
                    surface = Color(0xFF0F1524),
                    surfaceAlt = Color(0xFF161F34),
                    textPrimary = Color(0xFFF4F7FF),
                    textSecondary = Color(0xFFAEB8CE),
                    border = Color(0xFF2A3550),
                    hover = Color(0xFF1B2640),
                    accent = Color(GeneratedTheme.ACCENT_DARK),
                    accentText = Color(GeneratedTheme.ACCENT_TEXT_DARK),
                    overlayBackdrop = Color(0f, 0f, 0f, 0.44f),
                    statusSuccess = Color(0xFF86EFAC),
                    statusError = Color(0xFFFCA5A5),
                    statusWarning = Color(0xFFFCD34D),
                    statusInfo = Color(0xFF93C5FD),
                ),
                spacing = spacing,
                radius = radius,
            )
            UiThemeMode.LIGHT -> UiThemeTokens(
                mode = mode,
                typography = typography,
                colors = UiThemeTokens.Colors(
                    appBg = Color(0xFFFFFFFF),
                    surface = Color(0xFFFFFFFF),
                    surfaceAlt = Color(0xFFF0F0F0),
                    textPrimary = Color(0xFF171717),
                    textSecondary = Color(0xFF6B6B6B),
                    border = Color(0xFFE5E5E5),
                    hover = Color(0xFFEFEFEF),
                    accent = Color(GeneratedTheme.ACCENT_LIGHT),
                    accentText = Color(GeneratedTheme.ACCENT_TEXT_LIGHT),
                    overlayBackdrop = Color(0f, 0f, 0f, 0.34f),
                    statusSuccess = Color(0xFF166534),
                    statusError = Color(0xFF991B1B),
                    statusWarning = Color(0xFF92400E),
                    statusInfo = Color(0xFF1E40AF),
                ),
                spacing = spacing,
                radius = radius,
            )
        }
    }
}

// Light is the default, matching web (signed-out pages render light).
val LocalUiTheme = staticCompositionLocalOf { ThemeCatalog.uiTokens(UiThemeMode.LIGHT) }
