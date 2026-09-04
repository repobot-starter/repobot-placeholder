package com.baseapp.android.view.theme

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

/**
 * Persisted theme mode ("light" | "dark" | "system"), written by the shell's
 * account menu and read by RootView. Mirrors the web localStorage key and the
 * iOS @AppStorage key of the same name.
 */
object ThemeModeStore {
    private const val PREFS_NAME = "base.settings"
    private const val KEY = "base.themeMode"

    private val _mode = MutableStateFlow("system")
    val mode: StateFlow<String> = _mode

    fun hydrate(context: Context) {
        _mode.value =
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .getString(KEY, "system") ?: "system"
    }

    fun setMode(context: Context, value: String) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY, value)
            .apply()
        _mode.value = value
    }
}
