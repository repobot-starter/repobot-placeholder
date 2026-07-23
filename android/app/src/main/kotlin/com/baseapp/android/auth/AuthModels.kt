package com.baseapp.android.auth

import com.baseapp.android.graphql.CurrentUserData
import kotlinx.serialization.Serializable

@Serializable
data class AuthSession(
    val accessToken: String,
    val refreshToken: String? = null,
    /** Epoch milliseconds; null when the token never expires (local dev JWT). */
    val expiresAtEpochMs: Long? = null,
    val email: String? = null,
)

data class AuthState(
    val session: AuthSession? = null,
    val hydratedUser: CurrentUserData? = null,
    val isHydratingUser: Boolean = false,
    /** True while a sign-in action (send code / verify / local sign-in) runs. */
    val isSigningIn: Boolean = false,
    val lastError: String? = null,
    val successMessage: String? = null,
)
