package com.baseapp.android.util

import android.content.Context
import android.content.SharedPreferences
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

/**
 * Thin SharedPreferences helpers for pack-local persistence (best scores,
 * saved progress) — the native mirror of the web `DeviceStorage` module in
 * `web/core/src/Storage/DeviceStorage.ts`. Each pack keeps its own prefs
 * file name and keys; corrupt or missing entries fall back instead of
 * throwing.
 */
object DeviceStorage {
    val json = Json { ignoreUnknownKeys = true }

    fun prefs(context: Context, name: String): SharedPreferences =
        context.applicationContext.getSharedPreferences(name, Context.MODE_PRIVATE)

    /** Reads a JSON-encoded value; a missing or undecodable entry yields [fallback]. */
    inline fun <reified T> readJson(context: Context, prefsName: String, key: String, fallback: T): T {
        val raw = prefs(context, prefsName).getString(key, null) ?: return fallback
        return try {
            json.decodeFromString(raw)
        } catch (_: Exception) {
            fallback
        }
    }

    /** Writes a value as a JSON string. */
    inline fun <reified T> writeJson(context: Context, prefsName: String, key: String, value: T) {
        prefs(context, prefsName).edit().putString(key, json.encodeToString(value)).apply()
    }

    /** Reads an integer; a missing entry yields [fallback]. */
    fun readNumber(context: Context, prefsName: String, key: String, fallback: Int): Int =
        prefs(context, prefsName).getInt(key, fallback)

    /** Writes an integer. */
    fun writeNumber(context: Context, prefsName: String, key: String, value: Int) {
        prefs(context, prefsName).edit().putInt(key, value).apply()
    }
}
