package com.baseapp.android.auth

/**
 * The auth method registry, mirroring web/core's AuthMethods.ts: one place
 * that names every sign-in method the kernel knows how to render and wire.
 * Templates opt into methods via the AUTH_METHODS config value
 * (comma-separated), so adding a method to a product is config — not code
 * spread across three platforms.
 */
enum class AuthMethod(val key: String) {
    EMAIL_CODE("email-code"),
    PASSWORD("password"),
    GOOGLE("google"),
    ANONYMOUS("anonymous");

    companion object {
        fun fromKey(key: String): AuthMethod? = entries.firstOrNull { it.key == key }
    }
}

/**
 * Parses the configured method list into a deduped, validated list,
 * preserving the configured order (which is also the render order of the
 * sign-in surface). Unknown names are ignored. Falls back to email codes —
 * the one method every provisioned project supports with zero extra setup.
 */
fun resolveAuthMethods(methodsValue: String?): List<AuthMethod> {
    val resolved = mutableListOf<AuthMethod>()
    for (raw in (methodsValue ?: "").split(",")) {
        val method = AuthMethod.fromKey(raw.trim().lowercase())
        if (method != null && method !in resolved) {
            resolved.add(method)
        }
    }
    if (resolved.isEmpty()) {
        resolved.add(AuthMethod.EMAIL_CODE)
    }
    return resolved
}
