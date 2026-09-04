package com.baseapp.android.store

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class AppAlertStore {
    data class AlertMessage(
        val id: String,
        val message: String,
        val isError: Boolean,
    )

    private val _activeAlert = MutableStateFlow<AlertMessage?>(null)
    val activeAlert: StateFlow<AlertMessage?> = _activeAlert.asStateFlow()

    fun setActiveAlert(alert: AlertMessage?) {
        _activeAlert.value = alert
    }
}
