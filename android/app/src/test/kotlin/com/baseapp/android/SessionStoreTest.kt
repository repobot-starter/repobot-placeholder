package com.baseapp.android

import com.baseapp.android.auth.AuthSession
import com.baseapp.android.store.SessionStore
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SessionStoreTest {
    @Test
    fun startsSignedOut() {
        val sessionStore = SessionStore()
        assertFalse(sessionStore.isAuthenticated)
        assertFalse(sessionStore.hasHydratedUser)
        assertNull(sessionStore.session)
    }

    @Test
    fun setSessionMarksAuthenticated() {
        val sessionStore = SessionStore()
        sessionStore.setSession(AuthSession(accessToken = "token"))
        assertTrue(sessionStore.isAuthenticated)
        assertEquals("token", sessionStore.session?.accessToken)
    }

    @Test
    fun errorAndSuccessMessagesAreMutuallyExclusive() {
        val sessionStore = SessionStore()
        sessionStore.reportError("bad")
        assertEquals("bad", sessionStore.state.value.lastError)
        assertNull(sessionStore.state.value.successMessage)

        sessionStore.reportSuccess("good")
        assertNull(sessionStore.state.value.lastError)
        assertEquals("good", sessionStore.state.value.successMessage)

        sessionStore.clearStatusMessages()
        assertNull(sessionStore.state.value.lastError)
        assertNull(sessionStore.state.value.successMessage)
    }

    @Test
    fun resetForSignOutClearsEverything() {
        val sessionStore = SessionStore()
        sessionStore.setSession(AuthSession(accessToken = "token"))
        sessionStore.setSigningIn(true)
        sessionStore.reportError("boom")

        sessionStore.resetForSignOut()

        assertFalse(sessionStore.isAuthenticated)
        assertFalse(sessionStore.state.value.isSigningIn)
        assertNull(sessionStore.state.value.lastError)
    }
}
