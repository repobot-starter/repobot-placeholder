package com.baseapp.android.auth

import android.content.Context
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

interface SessionStorage {
    fun loadSession(): AuthSession?
    fun persistSession(session: AuthSession)
    fun clearSession()
}

class SharedPreferencesSessionStorage(context: Context) : SessionStorage {
    private val preferences =
        context.applicationContext.getSharedPreferences("base.android.auth", Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true }

    override fun loadSession(): AuthSession? {
        val raw = preferences.getString(SESSION_KEY, null) ?: return null
        return try {
            json.decodeFromString<AuthSession>(raw)
        } catch (_: Exception) {
            null
        }
    }

    override fun persistSession(session: AuthSession) {
        preferences.edit().putString(SESSION_KEY, json.encodeToString(session)).apply()
    }

    override fun clearSession() {
        preferences.edit().remove(SESSION_KEY).apply()
    }

    private companion object {
        const val SESSION_KEY = "base.android.auth.session"
    }
}
