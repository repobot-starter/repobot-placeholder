package com.baseapp.android.graphql

import com.apollographql.apollo.ApolloClient
import com.apollographql.apollo.api.ApolloResponse
import com.apollographql.apollo.api.Mutation
import com.apollographql.apollo.api.Operation
import com.apollographql.apollo.api.Query
import com.apollographql.apollo.exception.ApolloHttpException
import com.apollographql.apollo.exception.ApolloNetworkException
import com.baseapp.android.auth.SessionProviding
import com.baseapp.android.config.AppConfig
import com.baseapp.android.graphql.generated.CreateProjectMutation
import com.baseapp.android.graphql.generated.GetCurrentUserQuery
import com.baseapp.android.graphql.generated.GetProjectsQuery
import com.baseapp.android.graphql.generated.GetUsersQuery
import com.baseapp.android.graphql.generated.UpdateProjectMutation
import com.baseapp.android.graphql.generated.type.CreateProjectInput
import com.baseapp.android.graphql.generated.type.ProjectConnectionInput
import com.baseapp.android.graphql.generated.type.UpdateProjectInput
import com.baseapp.android.graphql.generated.type.UserConnectionInput

/**
 * Apollo Kotlin wrapper mirroring the iOS GraphQLClient: every request goes
 * out with a fresh (refreshed-if-needed) bearer token from the session
 * provider, and transport/GraphQL errors are normalized into
 * GraphQLClientException so components can apply one error policy.
 */
class GraphQLClient(
    config: AppConfig,
    private val sessionProvider: SessionProviding,
    apolloClient: ApolloClient? = null,
) : GraphQLApi {

    private val apollo: ApolloClient = apolloClient ?: ApolloClient.Builder()
        .serverUrl(config.graphqlUrl)
        .build()

    // --- Identity ---

    override suspend fun fetchCurrentUser(): CurrentUserData {
        val data = fetchQuery(GetCurrentUserQuery())
        return data.currentUser.userFields
    }

    override suspend fun fetchUsers(input: UserConnectionInput): UsersConnectionData {
        val data = fetchQuery(GetUsersQuery(input))
        return data.users
    }

    // --- Project ---

    override suspend fun fetchProjects(input: ProjectConnectionInput): ProjectsConnectionData {
        val data = fetchQuery(GetProjectsQuery(input))
        return data.projects
    }

    override suspend fun createProject(input: CreateProjectInput): CreatedProjectData {
        val data = performMutation(CreateProjectMutation(input))
        return data.createProject.projectFields
    }

    override suspend fun updateProject(input: UpdateProjectInput): UpdatedProjectData {
        val data = performMutation(UpdateProjectMutation(input))
        return data.updateProject.projectFields
    }

    // --- Request machinery ---

    private suspend fun <D : Query.Data> fetchQuery(query: Query<D>): D {
        val session = sessionProvider.validSession() ?: throw GraphQLClientException.Unauthenticated
        val response = apollo.query(query)
            .addHttpHeader("Authorization", "Bearer ${session.accessToken}")
            .execute()
        return unwrap(response)
    }

    private suspend fun <D : Mutation.Data> performMutation(mutation: Mutation<D>): D {
        val session = sessionProvider.validSession() ?: throw GraphQLClientException.Unauthenticated
        val response = apollo.mutation(mutation)
            .addHttpHeader("Authorization", "Bearer ${session.accessToken}")
            .execute()
        return unwrap(response)
    }

    private fun <D : Operation.Data> unwrap(response: ApolloResponse<D>): D {
        response.exception?.let { throw mapTransportError(it) }
        val errorMessage = response.errors?.firstOrNull()?.message
        if (errorMessage != null) {
            throw GraphQLClientException.Upstream(errorMessage)
        }
        return response.data ?: throw GraphQLClientException.InvalidResponse
    }

    /**
     * Preserves the HTTP status code for non-2xx responses so callers can
     * distinguish auth failures (401/403) from transient server errors.
     */
    private fun mapTransportError(exception: Exception): GraphQLClientException = when (exception) {
        is GraphQLClientException -> exception
        is ApolloHttpException -> GraphQLClientException.HttpFailure(
            statusCode = exception.statusCode,
            details = exception.message,
        )
        is ApolloNetworkException -> GraphQLClientException.NetworkFailure(
            exception.message ?: "Network request failed."
        )
        else -> GraphQLClientException.Upstream(exception.message ?: "GraphQL request failed.")
    }
}
