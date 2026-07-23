package com.baseapp.android.query

data class ConnectionPage<Item>(
    val items: List<Item>,
    val endCursor: String?,
    val hasNextPage: Boolean,
)

fun nilIfEmpty(value: String): String? {
    val trimmed = value.trim()
    return trimmed.ifEmpty { null }
}
