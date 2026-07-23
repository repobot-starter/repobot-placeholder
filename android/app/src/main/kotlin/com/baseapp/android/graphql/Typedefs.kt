package com.baseapp.android.graphql

// Keep generated GraphQL types behind local aliases so feature code does not
// depend directly on generated package paths. Rows are the shared fragment
// models (Apollo Kotlin's operationBased codegen exposes fragments as their
// own data classes).
typealias CurrentUserData = com.baseapp.android.graphql.generated.fragment.UserFields
typealias UserRowData = com.baseapp.android.graphql.generated.fragment.UserFields
typealias ProjectRowData = com.baseapp.android.graphql.generated.fragment.ProjectFields
typealias UsersConnectionData = com.baseapp.android.graphql.generated.GetUsersQuery.Users
typealias ProjectsConnectionData = com.baseapp.android.graphql.generated.GetProjectsQuery.Projects
typealias CreatedProjectData = com.baseapp.android.graphql.generated.fragment.ProjectFields
typealias UpdatedProjectData = com.baseapp.android.graphql.generated.fragment.ProjectFields
typealias ProjectStatusValue = com.baseapp.android.graphql.generated.type.ProjectStatus
typealias UserStatusValue = com.baseapp.android.graphql.generated.type.UserStatus
typealias SortDirectionValue = com.baseapp.android.graphql.generated.type.SortDirection
