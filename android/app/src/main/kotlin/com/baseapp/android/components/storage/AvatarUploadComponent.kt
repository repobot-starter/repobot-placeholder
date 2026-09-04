package com.baseapp.android.components.storage

import com.baseapp.android.store.AvatarStore
import com.baseapp.android.util.AvatarImageProcessing

/**
 * The storage kernel's consumer-exemplar workflow, mirroring the web
 * AvatarCard in SettingsPage.tsx (and the iOS AvatarUploadComponent): mint an
 * upload slot -> PUT the bytes -> finalize -> persist the upload id on the
 * user row -> best-effort delete of the replaced avatar. State transitions go
 * through AvatarStore; the refreshed user (shell profile, settings) comes
 * from the injected rehydration hook.
 */
class AvatarUploadComponent(
    private val avatarStore: AvatarStore,
    private val api: AvatarApi,
    /**
     * Re-fetches the hydrated user after the avatar is persisted so the shell
     * profile and settings re-render (components.auth.refreshHydratedUser).
     */
    private val refreshUser: suspend () -> Unit,
) {
    /**
     * Uploads a photo picked from the library: downscales and JPEG-compresses
     * it (AvatarImageProcessing), then runs the upload flow.
     */
    suspend fun uploadPickedImage(
        userId: String,
        previousUploadId: String?,
        rawImageData: ByteArray,
    ): Boolean {
        val jpegData = AvatarImageProcessing.jpegBytes(rawImageData) ?: run {
            avatarStore.setPhase(AvatarStore.Phase.Failed("The selected image could not be read."))
            return false
        }
        return uploadAvatar(
            userId = userId,
            previousUploadId = previousUploadId,
            imageData = jpegData,
            contentType = AvatarImageProcessing.CONTENT_TYPE,
        )
    }

    /**
     * Uploads a new avatar. Returns true when the avatar was persisted.
     * previousUploadId is the avatar being replaced; deleting it is best
     * effort — a failed cleanup leaves an orphaned object, not a broken
     * avatar (web parity).
     */
    suspend fun uploadAvatar(
        userId: String,
        previousUploadId: String?,
        imageData: ByteArray,
        contentType: String,
    ): Boolean {
        if (avatarStore.isUploading) {
            return false
        }
        avatarStore.setPhase(AvatarStore.Phase.Uploading)
        return try {
            val slot = api.createUpload(contentType = contentType, sizeBytes = imageData.size)
            api.putUploadBytes(
                uploadUrl = slot.uploadUrl,
                headersJson = slot.headersJson,
                body = imageData,
            )
            api.finalizeUpload(uploadId = slot.uploadId)
            api.persistAvatar(userId = userId, uploadId = slot.uploadId)
            if (previousUploadId != null) {
                try {
                    api.deleteUpload(uploadId = previousUploadId)
                } catch (_: Exception) {
                    // Best effort — see above.
                }
            }
            refreshUser()
            avatarStore.setPhase(AvatarStore.Phase.Idle)
            true
        } catch (error: Exception) {
            avatarStore.setPhase(
                AvatarStore.Phase.Failed(error.message ?: "The avatar upload failed.")
            )
            false
        }
    }
}
