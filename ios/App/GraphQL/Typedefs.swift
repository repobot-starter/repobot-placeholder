import AppGraphqlApi
import Foundation

// Keep generated GraphQL selection types behind local aliases so feature code
// does not depend directly on generated module paths.
typealias CurrentUserData = GetCurrentUserQuery.Data.CurrentUser
typealias UpdatedUserData = UpdateUserMutation.Data.UpdateUser
typealias UsersConnectionData = GetUsersQuery.Data.Users
typealias UserRowData = GetUsersQuery.Data.Users.Node
typealias ProjectsConnectionData = GetProjectsQuery.Data.Projects
typealias ProjectRowData = GetProjectsQuery.Data.Projects.Node
typealias CreatedProjectData = CreateProjectMutation.Data.CreateProject
typealias UpdatedProjectData = UpdateProjectMutation.Data.UpdateProject
typealias AiVoiceSessionData = CreateAiVoiceSessionMutation.Data.CreateAiVoiceSession
typealias PaymentSubscriptionData = MySubscriptionQuery.Data.MySubscription
typealias BillingPortalSessionData = CreateBillingPortalSessionMutation.Data.CreateBillingPortalSession
typealias SubscriptionCheckoutSessionData = CreateSubscriptionCheckoutSessionMutation.Data.CreateSubscriptionCheckoutSession
typealias UploadSlotData = CreateUploadMutation.Data.CreateUpload
typealias FinalizedUploadData = FinalizeUploadMutation.Data.FinalizeUpload
typealias PushDeviceData = RegisterPushDeviceMutation.Data.RegisterPushDevice
typealias PushDevicePlatformValue = AppGraphqlApi.PushDevicePlatform
typealias ProjectStatusValue = AppGraphqlApi.ProjectStatus
typealias UserStatusValue = AppGraphqlApi.UserStatus
typealias SubscriptionStatusValue = AppGraphqlApi.SubscriptionStatus
typealias SubscriptionIntervalValue = AppGraphqlApi.SubscriptionInterval

extension CurrentUserData {
  var stringId: String { String(id) }
}
