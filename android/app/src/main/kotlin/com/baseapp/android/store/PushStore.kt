package com.baseapp.android.store

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * State-only push-notification container (see
 * KOTLIN_ANDROID_STORE_COMPONENT_PATTERN.md); PushComponent owns the logic.
 * Twin of the iOS PushComponent's published state.
 */
class PushStore {
    data class PushState(
        /** False when the build carries no FCM config (push not provisioned). */
        val isAvailable: Boolean = false,
        /** True when a device token has been registered with the backend. */
        val isRegistered: Boolean = false,
        val isBusy: Boolean = false,
        /**
         * POST_NOTIFICATIONS was requested and permanently denied — the only
         * recovery is the system notification settings.
         */
        val isPermissionBlocked: Boolean = false,
    )

    private val _state = MutableStateFlow(PushState())
    val state: StateFlow<PushState> = _state.asStateFlow()

    fun setAvailable(isAvailable: Boolean) {
        _state.value = _state.value.copy(isAvailable = isAvailable)
    }

    fun setRegistered(isRegistered: Boolean) {
        _state.value = _state.value.copy(isRegistered = isRegistered)
    }

    fun setBusy(isBusy: Boolean) {
        _state.value = _state.value.copy(isBusy = isBusy)
    }

    fun setPermissionBlocked(isBlocked: Boolean) {
        _state.value = _state.value.copy(isPermissionBlocked = isBlocked)
    }
}
