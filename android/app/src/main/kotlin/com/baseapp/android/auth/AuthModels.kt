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

/**
 * Thrown by sign-in calls when the identity has two-factor authentication
 * enabled: the primary factor was accepted and the client now holds a
 * pending challenge that verifyMfaCode answers (mirrors web/core's
 * MfaRequiredError and the iOS MfaRequiredError).
 */
class MfaRequiredException :
    Exception("Enter the 6-digit code from your authenticator app.")

/** What TOTP enrollment hands back (mirrors web/core's MfaEnrollment). */
data class MfaEnrollment(
    /** The base32 TOTP secret, for manual entry into an authenticator app. */
    val secret: String,
    /**
     * The otpauth:// URI — opened directly on Android to enroll the
     * installed authenticator app (web renders it as a QR instead).
     */
    val otpauthUri: String,
)

data class AuthState(
    val session: AuthSession? = null,
    val hydratedUser: CurrentUserData? = null,
    val isHydratingUser: Boolean = false,
    /** True while a sign-in action (send code / verify / local sign-in) runs. */
    val isSigningIn: Boolean = false,
    /**
     * True while a sign-in awaits its second factor (see verifyMfaCode);
     * the sign-in screen shows the challenge view instead of signing in.
     */
    val isMfaChallengePending: Boolean = false,
    val lastError: String? = null,
    val successMessage: String? = null,
)
