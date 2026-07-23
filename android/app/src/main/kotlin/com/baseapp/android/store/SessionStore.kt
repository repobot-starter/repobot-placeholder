package com.baseapp.android.store

import com.baseapp.android.auth.AuthSession
import com.baseapp.android.auth.AuthState
import com.baseapp.android.graphql.CurrentUserData
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/** State-only session container (see KOTLIN_ANDROID_STORE_COMPONENT_PATTERN.md). */
class SessionStore {
    private val _state = MutableStateFlow(AuthState())
    val state: StateFlow<AuthState> = _state.asStateFlow()

    val isAuthenticated: Boolean get() = _state.value.session != null
    val hasHydratedUser: Boolean get() = _state.value.hydratedUser != null
    val session: AuthSession? get() = _state.value.session

    fun reportError(message: String) {
        _state.value = _state.value.copy(lastError = message, successMessage = null)
    }

    fun reportSuccess(message: String) {
        _state.value = _state.value.copy(lastError = null, successMessage = message)
    }

    fun clearStatusMessages() {
        _state.value = _state.value.copy(lastError = null, successMessage = null)
    }

    // --- State mutators used by components ---

    fun setSession(session: AuthSession?) {
        _state.value = _state.value.copy(session = session)
    }

    fun setHydratedUser(user: CurrentUserData?) {
        _state.value = _state.value.copy(hydratedUser = user)
    }

    fun setHydratingUser(isHydrating: Boolean) {
        _state.value = _state.value.copy(isHydratingUser = isHydrating)
    }

    fun setSigningIn(isSigningIn: Boolean) {
        _state.value = _state.value.copy(isSigningIn = isSigningIn)
    }

    fun resetForSignOut() {
        _state.value = AuthState()
    }
}
