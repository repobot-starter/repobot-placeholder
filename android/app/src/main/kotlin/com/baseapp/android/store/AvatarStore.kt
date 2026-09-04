package com.baseapp.android.store

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * State for the Settings avatar upload flow (storage-kernel twin). State
 * only — the upload workflow lives in AvatarUploadComponent. Mirrors the iOS
 * AvatarStore.
 */
class AvatarStore {
    sealed class Phase {
        data object Idle : Phase()
        data object Uploading : Phase()
        data class Failed(val message: String) : Phase()
    }

    private val _state = MutableStateFlow<Phase>(Phase.Idle)
    val state: StateFlow<Phase> = _state.asStateFlow()

    val isUploading: Boolean get() = _state.value == Phase.Uploading

    val errorMessage: String? get() = (_state.value as? Phase.Failed)?.message

    fun setPhase(value: Phase) {
        _state.value = value
    }
}
