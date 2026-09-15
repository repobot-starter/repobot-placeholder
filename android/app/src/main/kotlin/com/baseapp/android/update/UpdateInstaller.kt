package com.baseapp.android.update

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.os.Build
import java.io.File
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request

/**
 * Installs a newer build of this app over itself with a PackageInstaller
 * session: download the signed APK to app-private cache, stream it into a
 * session, commit. Android verifies the signature matches the installed
 * app (the platform signs every project with its per-project keystore) and
 * asks the user to confirm — the system's own "Update this app?" sheet,
 * surfaced via UpdateInstallReceiver.
 */
object UpdateInstaller {
    suspend fun downloadAndInstall(context: Context, update: AvailableUpdate) {
        UpdateStore.setPhase(UpdatePhase.DOWNLOADING)
        val apk = try {
            download(context, update)
        } catch (_: Exception) {
            UpdateStore.setPhase(UpdatePhase.FAILED)
            return
        }
        UpdateStore.setPhase(UpdatePhase.INSTALLING)
        try {
            commitSession(context, apk)
        } catch (_: Exception) {
            UpdateStore.setPhase(UpdatePhase.FAILED)
        } finally {
            apk.delete()
        }
    }

    private suspend fun download(context: Context, update: AvailableUpdate): File =
        withContext(Dispatchers.IO) {
            val target = File(context.cacheDir, "update-${update.buildId}.apk")
            val request = Request.Builder().url(update.downloadUrl).get().build()
            OkHttpClient().newCall(request).execute().use { response ->
                check(response.isSuccessful) { "Download failed: HTTP ${response.code}" }
                val body = checkNotNull(response.body) { "Empty download body" }
                target.outputStream().use { output ->
                    body.byteStream().copyTo(output)
                }
            }
            target
        }

    private suspend fun commitSession(context: Context, apk: File) =
        withContext(Dispatchers.IO) {
            val installer = context.packageManager.packageInstaller
            val params = PackageInstaller.SessionParams(
                PackageInstaller.SessionParams.MODE_FULL_INSTALL,
            ).apply {
                setAppPackageName(context.packageName)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_REQUIRED)
                }
            }
            val sessionId = installer.createSession(params)
            installer.openSession(sessionId).use { session ->
                session.openWrite("app.apk", 0, apk.length()).use { output ->
                    apk.inputStream().use { input -> input.copyTo(output) }
                    session.fsync(output)
                }
                // Explicit component: mutable PendingIntents with implicit
                // intents are rejected on Android 12+.
                val intent = Intent(context, UpdateInstallReceiver::class.java)
                val flags = PendingIntent.FLAG_UPDATE_CURRENT or
                    (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0)
                val statusReceiver = PendingIntent.getBroadcast(context, sessionId, intent, flags)
                session.commit(statusReceiver.intentSender)
            }
        }

    /**
     * Receives PackageInstaller status for the committed session. The one
     * status that needs handling is PENDING_USER_ACTION: launch the
     * system's confirmation sheet. Success never arrives from the app's
     * point of view — the process is replaced by the new build.
     */
    class UpdateInstallReceiver : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            when (intent.getIntExtra(PackageInstaller.EXTRA_STATUS, Int.MIN_VALUE)) {
                PackageInstaller.STATUS_PENDING_USER_ACTION -> {
                    val confirm: Intent? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        intent.getParcelableExtra(Intent.EXTRA_INTENT, Intent::class.java)
                    } else {
                        @Suppress("DEPRECATION")
                        intent.getParcelableExtra(Intent.EXTRA_INTENT)
                    }
                    confirm?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    if (confirm != null) {
                        context.startActivity(confirm)
                    }
                }
                PackageInstaller.STATUS_SUCCESS -> Unit
                Int.MIN_VALUE -> Unit
                else -> UpdateStore.setPhase(UpdatePhase.FAILED)
            }
        }
    }
}
