package com.baseapp.android.components.storage

import com.baseapp.android.components.appConfig
import com.baseapp.android.components.gql
import com.baseapp.android.graphql.UploadVisibilityValue
import com.baseapp.android.graphql.generated.type.CreateUploadFields
import com.baseapp.android.graphql.generated.type.CreateUploadInput
import com.baseapp.android.graphql.generated.type.DeleteUploadInput
import com.baseapp.android.graphql.generated.type.FinalizeUploadInput
import com.baseapp.android.graphql.generated.type.UpdateUserFields
import com.baseapp.android.graphql.generated.type.UpdateUserInput
import com.apollographql.apollo.api.Optional
import java.util.UUID

/**
 * A minted upload slot as a plain value (the createUpload mutation's
 * payload), so the upload flow and its tests never depend on generated
 * Apollo models.
 */
data class AvatarUploadSlot(
    val uploadId: String,
    val uploadUrl: String,
    val headersJson: String,
)

/**
 * The storage-kernel and Identity operations the avatar upload flow needs,
 * behind a small seam so AvatarUploadComponent's state machine is
 * unit-testable with a stubbed client (the twin of the iOS AvatarApi
 * protocol). The real implementation composes GraphQLClient and
 * StorageUploadClient.
 */
interface AvatarApi {
    suspend fun createUpload(contentType: String, sizeBytes: Int): AvatarUploadSlot
    suspend fun putUploadBytes(uploadUrl: String, headersJson: String, body: ByteArray)
    suspend fun finalizeUpload(uploadId: String)

    /** Persists the READY upload id on the user row (users.avatar_upload_id). */
    suspend fun persistAvatar(userId: String, uploadId: String)
    suspend fun deleteUpload(uploadId: String)
}

class GraphQLAvatarApi(
    private val uploadClient: StorageUploadClient = StorageUploadClient(),
) : AvatarApi {
    override suspend fun createUpload(contentType: String, sizeBytes: Int): AvatarUploadSlot {
        // Avatars are PUBLIC uploads: the shell renders them from the stable
        // /file/<id> serving URL (see docs/storage.md, the consumer exemplar).
        val slot = gql.createUpload(
            CreateUploadInput(
                idempotencyKey = UUID.randomUUID().toString(),
                fields = CreateUploadFields(
                    contentType = contentType,
                    sizeBytes = sizeBytes,
                    visibility = UploadVisibilityValue.PUBLIC,
                ),
            )
        )
        return AvatarUploadSlot(
            uploadId = slot.uploadId,
            uploadUrl = slot.uploadUrl,
            headersJson = slot.headersJson,
        )
    }

    override suspend fun putUploadBytes(uploadUrl: String, headersJson: String, body: ByteArray) {
        val endpoint = StorageUploadClient.endpoint(appConfig.graphqlUrl)
            ?: throw StorageUploadFailure.EndpointUnavailable()
        uploadClient.putUploadBytes(
            endpoint = endpoint,
            uploadUrl = uploadUrl,
            headersJson = headersJson,
            body = body,
        )
    }

    override suspend fun finalizeUpload(uploadId: String) {
        gql.finalizeUpload(FinalizeUploadInput(uploadId = uploadId))
    }

    override suspend fun persistAvatar(userId: String, uploadId: String) {
        gql.updateUser(
            UpdateUserInput(
                objectId = userId,
                idempotencyKey = UUID.randomUUID().toString(),
                fields = UpdateUserFields(avatarUploadId = Optional.present(uploadId)),
            )
        )
    }

    override suspend fun deleteUpload(uploadId: String) {
        gql.deleteUpload(DeleteUploadInput(uploadId = uploadId))
    }
}
