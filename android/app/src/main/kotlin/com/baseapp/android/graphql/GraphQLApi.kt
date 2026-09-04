package com.baseapp.android.graphql

import com.baseapp.android.graphql.generated.type.CreateBillingPortalSessionInput
import com.baseapp.android.graphql.generated.type.CreateProjectInput
import com.baseapp.android.graphql.generated.type.CreateSubscriptionCheckoutSessionInput
import com.baseapp.android.graphql.generated.type.CreateUploadInput
import com.baseapp.android.graphql.generated.type.DeleteUploadInput
import com.baseapp.android.graphql.generated.type.FinalizeUploadInput
import com.baseapp.android.graphql.generated.type.ProjectConnectionInput
import com.baseapp.android.graphql.generated.type.RegisterPushDeviceInput
import com.baseapp.android.graphql.generated.type.UnregisterPushDeviceInput
import com.baseapp.android.graphql.generated.type.UpdateProjectInput
import com.baseapp.android.graphql.generated.type.UpdateUserInput
import com.baseapp.android.graphql.generated.type.UserConnectionInput

sealed class GraphQLClientException(override val message: String) : Exception(message) {
    object Unauthenticated : GraphQLClientException("You must be signed in.") {
        private fun readResolve(): Any = Unauthenticated
    }

    object InvalidResponse : GraphQLClientException("Invalid response from GraphQL API.") {
        private fun readResolve(): Any = InvalidResponse
    }

    class HttpFailure(val statusCode: Int, details: String?) : GraphQLClientException(
        if (details.isNullOrEmpty()) {
            "GraphQL request failed ($statusCode)."
        } else {
            "GraphQL request failed ($statusCode): $details"
        }
    )

    class NetworkFailure(message: String) : GraphQLClientException(message)

    class Upstream(message: String) : GraphQLClientException(message)
}

/**
 * One method per operation, mirroring the exemplar Identity and Project
 * domains (and the iOS GraphQLClientProtocol). When you add a domain, extend
 * this interface alongside a new operations wrapper in graphql/operations/.
 */
interface GraphQLApi {
    // Identity
    suspend fun fetchCurrentUser(): CurrentUserData
    suspend fun fetchUsers(input: UserConnectionInput): UsersConnectionData
    suspend fun updateUser(input: UpdateUserInput): UpdatedUserData

    // Project
    suspend fun fetchProjects(input: ProjectConnectionInput): ProjectsConnectionData
    suspend fun createProject(input: CreateProjectInput): CreatedProjectData
    suspend fun updateProject(input: UpdateProjectInput): UpdatedProjectData

    // Payments kernel (Settings Billing card + subscribe flow twins)
    suspend fun fetchMySubscription(productKey: String?): PaymentSubscriptionData?
    /** Returns the Billing Portal URL (Stripe's portal, or the in-app test billing page in local mode). */
    suspend fun createBillingPortalSession(input: CreateBillingPortalSessionInput): String
    suspend fun createSubscriptionCheckoutSession(
        input: CreateSubscriptionCheckoutSessionInput,
    ): CheckoutSessionData

    // Storage kernel (avatar upload twin)
    suspend fun createUpload(input: CreateUploadInput): UploadSlotData
    suspend fun finalizeUpload(input: FinalizeUploadInput)
    suspend fun deleteUpload(input: DeleteUploadInput)

    // Push kernel (authenticated: a registration always belongs to an app user)
    suspend fun registerPushDevice(input: RegisterPushDeviceInput): PushDeviceData
    suspend fun unregisterPushDevice(input: UnregisterPushDeviceInput): Boolean
}
