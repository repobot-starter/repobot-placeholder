package com.baseapp.android

import com.baseapp.android.components.storage.AvatarApi
import com.baseapp.android.components.storage.AvatarUploadComponent
import com.baseapp.android.components.storage.AvatarUploadSlot
import com.baseapp.android.store.AvatarStore
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * State-machine tests for the avatar upload flow (web twin: AvatarCard's
 * uploadAvatar in SettingsPage.tsx) against a stubbed storage API:
 * create -> PUT -> finalize -> persist -> best-effort delete of the replaced
 * upload — mirroring the iOS AvatarUploadComponentTests.
 */
class AvatarUploadComponentTest {
    private val imageData = "jpeg-bytes".toByteArray()

    private fun makeComponent(
        api: StubAvatarApi,
        store: AvatarStore = AvatarStore(),
        onRefresh: () -> Unit = {},
    ) = AvatarUploadComponent(avatarStore = store, api = api, refreshUser = { onRefresh() })

    @Test
    fun happyPathRunsTheKernelLifecycleInOrderAndRefreshesTheUser() = runTest {
        val api = StubAvatarApi()
        val store = AvatarStore()
        var refreshed = false
        val component = makeComponent(api, store, onRefresh = { refreshed = true })

        val uploaded = component.uploadAvatar(
            userId = "user_1",
            previousUploadId = "upload_old",
            imageData = imageData,
            contentType = "image/jpeg",
        )

        assertTrue(uploaded)
        assertEquals(
            listOf(
                "createUpload(image/jpeg,${imageData.size})",
                "putUploadBytes(upload_1)",
                "finalizeUpload(upload_1)",
                "persistAvatar(user_1,upload_1)",
                "deleteUpload(upload_old)",
            ),
            api.calls,
        )
        assertTrue(refreshed)
        assertEquals(AvatarStore.Phase.Idle, store.state.value)
    }

    @Test
    fun firstUploadSkipsTheBestEffortDelete() = runTest {
        val api = StubAvatarApi()
        val component = makeComponent(api)

        val uploaded = component.uploadAvatar(
            userId = "user_1",
            previousUploadId = null,
            imageData = imageData,
            contentType = "image/jpeg",
        )

        assertTrue(uploaded)
        assertFalse(api.calls.any { it.startsWith("deleteUpload") })
    }

    @Test
    fun failedCleanupOfTheReplacedUploadDoesNotFailTheFlow() = runTest {
        val api = StubAvatarApi(deleteError = AvatarStubFailure())
        val store = AvatarStore()
        val component = makeComponent(api, store)

        val uploaded = component.uploadAvatar(
            userId = "user_1",
            previousUploadId = "upload_old",
            imageData = imageData,
            contentType = "image/jpeg",
        )

        // Web parity: a failed cleanup leaves an orphaned object, not a
        // broken avatar.
        assertTrue(uploaded)
        assertEquals(AvatarStore.Phase.Idle, store.state.value)
    }

    @Test
    fun putFailureStopsBeforeFinalizeAndReportsTheError() = runTest {
        val api = StubAvatarApi(putError = AvatarStubFailure())
        val store = AvatarStore()
        var refreshed = false
        val component = makeComponent(api, store, onRefresh = { refreshed = true })

        val uploaded = component.uploadAvatar(
            userId = "user_1",
            previousUploadId = "upload_old",
            imageData = imageData,
            contentType = "image/jpeg",
        )

        assertFalse(uploaded)
        assertFalse(api.calls.any { it.startsWith("finalizeUpload") })
        assertFalse(api.calls.any { it.startsWith("persistAvatar") })
        assertFalse(api.calls.any { it.startsWith("deleteUpload") })
        assertFalse(refreshed)
        assertEquals(AvatarStore.Phase.Failed("The storage backend is unavailable."), store.state.value)
        assertEquals("The storage backend is unavailable.", store.errorMessage)
    }

    @Test
    fun persistFailureReportsTheErrorAndKeepsThePreviousUpload() = runTest {
        val api = StubAvatarApi(persistError = AvatarStubFailure())
        val store = AvatarStore()
        val component = makeComponent(api, store)

        val uploaded = component.uploadAvatar(
            userId = "user_1",
            previousUploadId = "upload_old",
            imageData = imageData,
            contentType = "image/jpeg",
        )

        assertFalse(uploaded)
        assertFalse(api.calls.any { it.startsWith("deleteUpload") })
        assertFalse(store.isUploading)
        assertNotNull(store.errorMessage)
    }
}

private class AvatarStubFailure : Exception("The storage backend is unavailable.")

private class StubAvatarApi(
    private val putError: Exception? = null,
    private val persistError: Exception? = null,
    private val deleteError: Exception? = null,
) : AvatarApi {
    val calls = mutableListOf<String>()

    override suspend fun createUpload(contentType: String, sizeBytes: Int): AvatarUploadSlot {
        calls.add("createUpload($contentType,$sizeBytes)")
        return AvatarUploadSlot(
            uploadId = "upload_1",
            uploadUrl = "/upload?token=abc",
            headersJson = """{"Content-Type":"image/jpeg"}""",
        )
    }

    override suspend fun putUploadBytes(uploadUrl: String, headersJson: String, body: ByteArray) {
        calls.add("putUploadBytes(upload_1)")
        putError?.let { throw it }
    }

    override suspend fun finalizeUpload(uploadId: String) {
        calls.add("finalizeUpload($uploadId)")
    }

    override suspend fun persistAvatar(userId: String, uploadId: String) {
        calls.add("persistAvatar($userId,$uploadId)")
        persistError?.let { throw it }
    }

    override suspend fun deleteUpload(uploadId: String) {
        calls.add("deleteUpload($uploadId)")
        deleteError?.let { throw it }
    }
}
