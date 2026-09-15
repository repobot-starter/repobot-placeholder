package com.baseapp.android.update

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.OkHttpClient
import okhttp3.Request

/**
 * The self-update loop for sideloaded dev builds ("Test On A Real Device"):
 * the platform stamps a per-build update-channel URL into the APK's config,
 * and on every launch the app asks it whether the project has a newer
 * build. A newer build surfaces as an in-app banner whose one tap
 * downloads and installs it — the store-less twin of a TestFlight update.
 *
 * Everything here is best-effort: an unreachable channel (offline, torn
 * down project, expired platform) silently leaves the app as it is.
 */

/** The channel's verdict, as served by the platform's /check endpoint. */
@Serializable
data class UpdateVerdict(
    val outcome: String,
    val buildId: String? = null,
    val downloadUrl: String? = null,
    val finishedAt: String? = null,
)

data class AvailableUpdate(
    val buildId: String,
    /** Short-lived signed APK URL — download promptly, re-check when stale. */
    val downloadUrl: String,
)

class UpdateChannelClient(
    private val checkUrl: String,
    private val httpClient: OkHttpClient = OkHttpClient(),
) {
    private val json = Json { ignoreUnknownKeys = true }

    /** One poll of the channel; null means "no update" for any reason. */
    suspend fun check(): AvailableUpdate? = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder().url(checkUrl).get().build()
            httpClient.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext null
                }
                val body = response.body?.string() ?: return@withContext null
                val verdict = json.decodeFromString<UpdateVerdict>(body)
                if (
                    verdict.outcome == "update_available" &&
                    verdict.buildId != null &&
                    verdict.downloadUrl != null
                ) {
                    AvailableUpdate(buildId = verdict.buildId, downloadUrl = verdict.downloadUrl)
                } else {
                    null
                }
            }
        } catch (_: Exception) {
            null
        }
    }
}

/** What the update banner renders; DOWNLOADING/INSTALLING disable its button. */
enum class UpdatePhase { IDLE, DOWNLOADING, INSTALLING, FAILED }

/**
 * App-wide update state: checked once per launch, consumed by the banner
 * overlay in RootView. Object (not per-screen state) because the banner
 * floats above whatever surface the pack renders.
 */
object UpdateStore {
    private val availableFlow = MutableStateFlow<AvailableUpdate?>(null)
    private val phaseFlow = MutableStateFlow(UpdatePhase.IDLE)
    private val dismissedFlow = MutableStateFlow(false)

    val available: StateFlow<AvailableUpdate?> = availableFlow.asStateFlow()
    val phase: StateFlow<UpdatePhase> = phaseFlow.asStateFlow()
    val dismissed: StateFlow<Boolean> = dismissedFlow.asStateFlow()

    suspend fun checkOnce(updateChannelUrl: String?) {
        if (updateChannelUrl.isNullOrEmpty() || availableFlow.value != null) {
            return
        }
        availableFlow.value = UpdateChannelClient(updateChannelUrl).check()
    }

    fun setPhase(phase: UpdatePhase) {
        phaseFlow.value = phase
    }

    /** Hides the banner until the next launch (the check re-offers then). */
    fun dismiss() {
        dismissedFlow.value = true
    }
}
