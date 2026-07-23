package com.baseapp.android

import com.baseapp.android.auth.AuthMethod
import com.baseapp.android.auth.resolveAuthMethods
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Parity tests for resolveAuthMethods against web/core's AuthMethods.ts:
 * trim, lowercase, ignore unknown names, dedupe, preserve configured order,
 * default to email codes.
 */
class AuthMethodsTest {
    @Test
    fun defaultsToEmailCodeWhenValueIsNull() {
        assertEquals(listOf(AuthMethod.EMAIL_CODE), resolveAuthMethods(null))
    }

    @Test
    fun defaultsToEmailCodeWhenValueIsEmpty() {
        assertEquals(listOf(AuthMethod.EMAIL_CODE), resolveAuthMethods(""))
        assertEquals(listOf(AuthMethod.EMAIL_CODE), resolveAuthMethods("   "))
    }

    @Test
    fun defaultsToEmailCodeWhenValueIsGarbage() {
        assertEquals(listOf(AuthMethod.EMAIL_CODE), resolveAuthMethods("saml, ldap, ,,magic"))
    }

    @Test
    fun preservesConfiguredOrder() {
        assertEquals(
            listOf(AuthMethod.GOOGLE, AuthMethod.EMAIL_CODE),
            resolveAuthMethods("google, email-code"),
        )
        assertEquals(
            listOf(AuthMethod.PASSWORD, AuthMethod.GOOGLE, AuthMethod.ANONYMOUS),
            resolveAuthMethods("password,google,anonymous"),
        )
    }

    @Test
    fun dedupesRepeatedMethods() {
        assertEquals(
            listOf(AuthMethod.GOOGLE, AuthMethod.EMAIL_CODE),
            resolveAuthMethods("google, email-code, google, email-code"),
        )
    }

    @Test
    fun ignoresUnknownNamesButKeepsKnownOnes() {
        assertEquals(
            listOf(AuthMethod.PASSWORD, AuthMethod.GOOGLE),
            resolveAuthMethods("password, saml, google, magic-link"),
        )
    }

    @Test
    fun toleratesWhitespaceAndMixedCase() {
        assertEquals(
            listOf(AuthMethod.EMAIL_CODE, AuthMethod.GOOGLE),
            resolveAuthMethods("  Email-Code ,  GOOGLE  "),
        )
    }

    @Test
    fun resolvesEveryKnownMethodKey() {
        assertEquals(
            listOf(
                AuthMethod.EMAIL_CODE,
                AuthMethod.PASSWORD,
                AuthMethod.GOOGLE,
                AuthMethod.ANONYMOUS,
            ),
            resolveAuthMethods("email-code,password,google,anonymous"),
        )
    }
}
