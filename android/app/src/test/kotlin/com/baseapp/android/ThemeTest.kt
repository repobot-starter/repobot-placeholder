package com.baseapp.android

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.baseapp.android.view.theme.GeneratedTheme
import com.baseapp.android.view.theme.ThemeCatalog
import com.baseapp.android.view.theme.ThemePreference
import com.baseapp.android.view.theme.ThemeResolver
import com.baseapp.android.view.theme.UiThemeMode
import org.junit.Assert.assertEquals
import org.junit.Test

class ThemeTest {
    @Test
    fun themeResolverMapsThemePreferencesToModes() {
        assertEquals(UiThemeMode.DARK, ThemeResolver.resolveMode(ThemePreference.DARK, systemIsDark = false))
        assertEquals(UiThemeMode.LIGHT, ThemeResolver.resolveMode(ThemePreference.LIGHT, systemIsDark = true))
        assertEquals(UiThemeMode.DARK, ThemeResolver.resolveMode(ThemePreference.SYSTEM, systemIsDark = true))
        assertEquals(UiThemeMode.LIGHT, ThemeResolver.resolveMode(ThemePreference.SYSTEM, systemIsDark = false))
    }

    @Test
    fun themeCatalogMatchesWebDarkAndLightAnchorValues() {
        val dark = ThemeCatalog.uiTokens(UiThemeMode.DARK)
        val light = ThemeCatalog.uiTokens(UiThemeMode.LIGHT)

        // Scales flow from GeneratedTheme (repobot.theme.json via codegen).
        assertEquals(GeneratedTheme.SPACE_XL.dp, dark.spacing.xl)
        assertEquals(GeneratedTheme.RADIUS_MD.dp, dark.radius.md)

        assertEquals(UiThemeMode.LIGHT, light.mode)
        // Literal brand anchors from repobot.theme.json (primary #1f6feb,
        // primaryDark #90caf9), NOT the GeneratedTheme constants — asserting
        // against the generated values would be circular and could never
        // catch the codegen output drifting from the contract (the staleness
        // the iOS parity test caught). Matches the iOS anchor assertions.
        assertEquals(Color(0xFF90CAF9), dark.colors.accent)
        assertEquals(Color(0xFF1F6FEB), light.colors.accent)

        // Guards drift between the platforms' palettes.
        assertEquals(Color(0xFF080B14), dark.colors.appBg)
        assertEquals(Color(0xFFFFFFFF), light.colors.appBg)
        assertEquals(Color(0xFF171717), light.colors.textPrimary)
    }
}
