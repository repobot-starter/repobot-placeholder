package com.baseapp.android.components

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import com.baseapp.android.graphql.PushDevicePlatformValue
import com.baseapp.android.graphql.generated.type.RegisterPushDeviceInput
import com.baseapp.android.graphql.generated.type.UnregisterPushDeviceInput
import com.baseapp.android.store.AppAlertStore
import com.baseapp.android.store.PushStore
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.messaging.FirebaseMessaging
import java.util.UUID
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.suspendCancellableCoroutine

/**
 * The push kernel's Android client: notification permission + FCM device-token
 * registration, posted through the same `registerPushDevice` mutation the web
 * and iOS clients use (the FCM token is the endpoint; there is no subscription
 * JSON on native). iOS twin: PushComponent.swift — including its rule that
 * permission is requested only on explicit enable, never at launch.
 *
 * The kernel cannot commit a tenant google-services.json, so FirebaseApp is
 * initialized manually from the stamped FCM_* config (AppConfig.fcm); when
 * that config is absent, push is unavailable and the Settings card hides
 * itself.
 */
class PushComponent(
    private val pushStore: PushStore,
    context: Context,
) {
    private val context = context.applicationContext
    private val preferences =
        context.applicationContext.getSharedPreferences("base.android.push", Context.MODE_PRIVATE)

    /** False when the build carries no FCM config (push not provisioned). */
    val isAvailable: Boolean get() = appConfig.fcm != null

    init {
        pushStore.setAvailable(isAvailable)
        pushStore.setRegistered(registeredToken() != null)
        if (isAvailable) {
            // Initialize eagerly so FCM callbacks (token rotation, message
            // delivery) work from process start, not just after an enable.
            ensureFirebaseApp()
        }
    }

    /**
     * The last device token registered with the backend, kept so disable can
     * unregister the exact endpoint and rotations can re-register silently.
     */
    fun registeredToken(): String? = preferences.getString(TOKEN_KEY, null)

    /**
     * Recomputes the permanently-denied state without prompting (safe at any
     * time). Pre-33 there is no runtime permission to block on.
     */
    fun refreshPermission(activity: ComponentActivity?) {
        if (Build.VERSION.SDK_INT < 33) {
            pushStore.setPermissionBlocked(false)
            return
        }
        val hasRequested = preferences.getBoolean(REQUESTED_PERMISSION_KEY, false)
        val blocked = !hasNotificationsPermission() && hasRequested &&
            activity?.shouldShowRequestPermissionRationale(Manifest.permission.POST_NOTIFICATIONS) == false
        pushStore.setPermissionBlocked(blocked)
    }

    /**
     * The explicit enable: request POST_NOTIFICATIONS (Android 13+, first
     * time), then fetch the FCM token and register it as this user's device.
     */
    suspend fun enableNotifications(activity: ComponentActivity) {
        if (!isAvailable || pushStore.state.value.isBusy) {
            return
        }
        pushStore.setBusy(true)
        try {
            if (Build.VERSION.SDK_INT >= 33 && !hasNotificationsPermission()) {
                val granted = requestNotificationsPermission(activity)
                preferences.edit().putBoolean(REQUESTED_PERMISSION_KEY, true).apply()
                if (!granted) {
                    // After a denial, a suppressed rationale means the system
                    // will not prompt again — only Settings can recover.
                    pushStore.setPermissionBlocked(
                        !activity.shouldShowRequestPermissionRationale(
                            Manifest.permission.POST_NOTIFICATIONS,
                        )
                    )
                    return
                }
            }
            pushStore.setPermissionBlocked(false)
            registerToken(fetchToken())
        } catch (_: Exception) {
            showError("Could not enable notifications. Try again.")
        } finally {
            pushStore.setBusy(false)
        }
    }

    /**
     * Deletes the registration server-side first (mirroring the web and iOS
     * clients), so the backend never keeps a destination the user turned off.
     */
    suspend fun disableNotifications() {
        val token = registeredToken()
        if (token == null) {
            pushStore.setRegistered(false)
            return
        }
        pushStore.setBusy(true)
        try {
            gql.unregisterPushDevice(UnregisterPushDeviceInput(endpoint = token))
            preferences.edit().remove(TOKEN_KEY).apply()
            pushStore.setRegistered(false)
        } catch (_: Exception) {
            showError("Could not turn off notifications. Try again.")
        } finally {
            pushStore.setBusy(false)
        }
    }

    /**
     * FCM rotated the token (AppMessagingService.onNewToken): re-register
     * silently, but only when a token was registered before — rotation must
     * never opt a user in. Best-effort by design (same posture as iOS).
     */
    suspend fun handleTokenRotation(newToken: String) {
        val previous = registeredToken() ?: return
        if (previous == newToken) {
            return
        }
        try {
            registerToken(newToken)
        } catch (_: Exception) {
            // The next explicit enable or rotation converges.
        }
    }

    private suspend fun registerToken(token: String) {
        gql.registerPushDevice(
            RegisterPushDeviceInput(
                platform = PushDevicePlatformValue.ANDROID,
                endpoint = token,
                // Native tokens ride the endpoint column; the subscription
                // JSON is a Web Push concept (backend validates it for WEB only).
                subscriptionJson = "{}",
            )
        )
        preferences.edit().putString(TOKEN_KEY, token).apply()
        pushStore.setRegistered(true)
    }

    private suspend fun fetchToken(): String {
        check(ensureFirebaseApp()) { "Firebase is not configured." }
        return suspendCancellableCoroutine { continuation ->
            FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
                if (!continuation.isActive) {
                    return@addOnCompleteListener
                }
                if (task.isSuccessful) {
                    continuation.resume(task.result)
                } else {
                    continuation.resumeWithException(
                        task.exception ?: IllegalStateException("FCM token fetch failed."),
                    )
                }
            }
        }
    }

    /** Idempotent manual FirebaseApp init from the stamped FCM_* config. */
    private fun ensureFirebaseApp(): Boolean {
        val fcm = appConfig.fcm ?: return false
        if (FirebaseApp.getApps(context).isNotEmpty()) {
            return true
        }
        return try {
            FirebaseApp.initializeApp(
                context,
                FirebaseOptions.Builder()
                    .setProjectId(fcm.projectId)
                    .setApplicationId(fcm.applicationId)
                    .setApiKey(fcm.apiKey)
                    .setGcmSenderId(fcm.senderId)
                    .build(),
            )
            true
        } catch (_: Exception) {
            false
        }
    }

    private fun hasNotificationsPermission(): Boolean =
        context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED

    /**
     * One-shot POST_NOTIFICATIONS request through the activity's result
     * registry (usable outside composition, unlike the remembered launcher).
     */
    private suspend fun requestNotificationsPermission(activity: ComponentActivity): Boolean =
        suspendCancellableCoroutine { continuation ->
            lateinit var launcher: ActivityResultLauncher<String>
            launcher = activity.activityResultRegistry.register(
                "push-permission-${UUID.randomUUID()}",
                ActivityResultContracts.RequestPermission(),
            ) { granted ->
                launcher.unregister()
                if (continuation.isActive) {
                    continuation.resume(granted)
                }
            }
            continuation.invokeOnCancellation { launcher.unregister() }
            launcher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }

    private fun showError(message: String) {
        store.appAlertStore.setActiveAlert(
            AppAlertStore.AlertMessage(id = "push-error-$message", message = message, isError = true)
        )
    }

    private companion object {
        const val TOKEN_KEY = "registeredToken"
        const val REQUESTED_PERMISSION_KEY = "hasRequestedPermission"
    }
}
