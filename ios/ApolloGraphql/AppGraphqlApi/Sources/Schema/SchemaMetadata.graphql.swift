// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public protocol SelectionSet: ApolloAPI.SelectionSet & ApolloAPI.RootSelectionSet
where Schema == AppGraphqlApi.SchemaMetadata {}

public protocol InlineFragment: ApolloAPI.SelectionSet & ApolloAPI.InlineFragment
where Schema == AppGraphqlApi.SchemaMetadata {}

public protocol MutableSelectionSet: ApolloAPI.MutableRootSelectionSet
where Schema == AppGraphqlApi.SchemaMetadata {}

public protocol MutableInlineFragment: ApolloAPI.MutableSelectionSet & ApolloAPI.InlineFragment
where Schema == AppGraphqlApi.SchemaMetadata {}

public enum SchemaMetadata: ApolloAPI.SchemaMetadata {
  public static let configuration: any ApolloAPI.SchemaConfiguration.Type = SchemaConfiguration.self

  private static let objectTypeMap: [String: ApolloAPI.Object] = [
    "Account": AppGraphqlApi.Objects.Account,
    "AiVoiceSession": AppGraphqlApi.Objects.AiVoiceSession,
    "BillingPortalSession": AppGraphqlApi.Objects.BillingPortalSession,
    "CheckoutSession": AppGraphqlApi.Objects.CheckoutSession,
    "Mutation": AppGraphqlApi.Objects.Mutation,
    "PageInfo": AppGraphqlApi.Objects.PageInfo,
    "PaymentSubscription": AppGraphqlApi.Objects.PaymentSubscription,
    "Project": AppGraphqlApi.Objects.Project,
    "ProjectConnection": AppGraphqlApi.Objects.ProjectConnection,
    "PushDevice": AppGraphqlApi.Objects.PushDevice,
    "Query": AppGraphqlApi.Objects.Query,
    "Upload": AppGraphqlApi.Objects.Upload,
    "UploadSlot": AppGraphqlApi.Objects.UploadSlot,
    "User": AppGraphqlApi.Objects.User,
    "UserConnection": AppGraphqlApi.Objects.UserConnection
  ]

  public static func objectType(forTypename typename: String) -> ApolloAPI.Object? {
    objectTypeMap[typename]
  }
}

public enum Objects {}
public enum Interfaces {}
public enum Unions {}
