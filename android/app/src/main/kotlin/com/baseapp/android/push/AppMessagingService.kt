package com.baseapp.android.push

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.pm.PackageManager
import android.os.Build
import com.baseapp.android.R
import com.baseapp.android.components.AppComponents
import com.baseapp.android.components.components
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

/**
 * FCM entry points: token rotation (re-register the backend device row) and
 * foreground/data message display. iOS twin: PushAppDelegate — the platform
 * callback adaptor that forwards into PushComponent.
 */
class AppMessagingService : FirebaseMessagingService() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }

    /**
     * FCM rotated the token. Only meaningful when the app has run (FCM can
     * cold-start this process before MainActivity wires the component tree —
     * then there is no session to re-register with; the next launch converges).
     */
    override fun onNewToken(token: String) {
        if (!AppComponents.isInitialized) {
            return
        }
        scope.launch {
            components.push.handleTokenRotation(token)
        }
    }

    /**
     * Posts a local notification for messages delivered to the app (foreground
     * notification messages and data-only messages; background notification
     * messages are rendered by the system tray without reaching this).
     */
    override fun onMessageReceived(message: RemoteMessage) {
        val title = message.notification?.title ?: message.data["title"]
        val body = message.notification?.body ?: message.data["body"]
        if (title == null && body == null) {
            return
        }
        if (
            Build.VERSION.SDK_INT >= 33 &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            return
        }

        val manager = getSystemService(NotificationManager::class.java) ?: return
        manager.createNotificationChannel(
            NotificationChannel(CHANNEL_ID, "Notifications", NotificationManager.IMPORTANCE_DEFAULT)
        )

        val contentIntent = packageManager.getLaunchIntentForPackage(packageName)?.let { intent ->
            PendingIntent.getActivity(
                this,
                0,
                intent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
            )
        }
        val notification = Notification.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title ?: getString(R.string.app_name))
            .setContentText(body)
            .setAutoCancel(true)
            .apply { contentIntent?.let(::setContentIntent) }
            .build()
        manager.notify(message.messageId?.hashCode() ?: System.currentTimeMillis().toInt(), notification)
    }

    private companion object {
        const val CHANNEL_ID = "default"
    }
}
