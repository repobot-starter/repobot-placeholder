package com.baseapp.android.graphql

import com.baseapp.android.graphql.generated.type.CreateProjectInput
import com.baseapp.android.graphql.generated.type.ProjectConnectionInput
import com.baseapp.android.graphql.generated.type.UpdateProjectInput
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

    // Project
    suspend fun fetchProjects(input: ProjectConnectionInput): ProjectsConnectionData
    suspend fun createProject(input: CreateProjectInput): CreatedProjectData
    suspend fun updateProject(input: UpdateProjectInput): UpdatedProjectData
}
