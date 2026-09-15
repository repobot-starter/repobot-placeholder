package com.baseapp.android.graphql

// Keep generated GraphQL types behind local aliases so feature code does not
// depend directly on generated package paths. Rows are the shared fragment
// models (Apollo Kotlin's operationBased codegen exposes fragments as their
// own data classes).
typealias CurrentUserData = com.baseapp.android.graphql.generated.fragment.UserFields
typealias UpdatedUserData = com.baseapp.android.graphql.generated.fragment.UserFields
typealias UserRowData = com.baseapp.android.graphql.generated.fragment.UserFields
typealias ProjectRowData = com.baseapp.android.graphql.generated.fragment.ProjectFields
typealias UsersConnectionData = com.baseapp.android.graphql.generated.GetUsersQuery.Users
typealias ProjectsConnectionData = com.baseapp.android.graphql.generated.GetProjectsQuery.Projects
typealias CreatedProjectData = com.baseapp.android.graphql.generated.fragment.ProjectFields
typealias UpdatedProjectData = com.baseapp.android.graphql.generated.fragment.ProjectFields
typealias ProjectStatusValue = com.baseapp.android.graphql.generated.type.ProjectStatus
typealias UserStatusValue = com.baseapp.android.graphql.generated.type.UserStatus
typealias SortDirectionValue = com.baseapp.android.graphql.generated.type.SortDirection

// Payments kernel (Settings Billing card + subscribe flow twins).
typealias PaymentSubscriptionData = com.baseapp.android.graphql.generated.fragment.PaymentSubscriptionFields
typealias CheckoutSessionData = com.baseapp.android.graphql.generated.fragment.CheckoutSessionFields
typealias SubscriptionStatusValue = com.baseapp.android.graphql.generated.type.SubscriptionStatus
typealias SubscriptionIntervalValue = com.baseapp.android.graphql.generated.type.SubscriptionInterval

// Storage kernel (avatar upload twin).
typealias UploadSlotData = com.baseapp.android.graphql.generated.CreateUploadMutation.CreateUpload
typealias UploadVisibilityValue = com.baseapp.android.graphql.generated.type.UploadVisibility

// Push kernel (Settings Notifications card twin).
typealias PushDeviceData = com.baseapp.android.graphql.generated.RegisterPushDeviceMutation.RegisterPushDevice
typealias PushDevicePlatformValue = com.baseapp.android.graphql.generated.type.PushDevicePlatform
