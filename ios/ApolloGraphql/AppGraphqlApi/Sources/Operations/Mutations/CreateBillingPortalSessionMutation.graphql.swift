// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public class CreateBillingPortalSessionMutation: GraphQLMutation {
  public static let operationName: String = "CreateBillingPortalSession"
  public static let operationDocument: ApolloAPI.OperationDocument = .init(
    definition: .init(
      #"mutation CreateBillingPortalSession($input: CreateBillingPortalSessionInput!) { createBillingPortalSession(input: $input) { __typename url } }"#
    ))

  public var input: CreateBillingPortalSessionInput

  public init(input: CreateBillingPortalSessionInput) {
    self.input = input
  }

  public var __variables: Variables? { ["input": input] }

  public struct Data: AppGraphqlApi.SelectionSet {
    public let __data: DataDict
    public init(_dataDict: DataDict) { __data = _dataDict }

    public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.Mutation }
    public static var __selections: [ApolloAPI.Selection] { [
      .field("createBillingPortalSession", CreateBillingPortalSession.self, arguments: ["input": .variable("input")]),
    ] }
    public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
      CreateBillingPortalSessionMutation.Data.self
    ] }

    /// A Billing Portal URL for the caller's subscription (the in-app test billing page in local mode).
    public var createBillingPortalSession: CreateBillingPortalSession { __data["createBillingPortalSession"] }

    /// CreateBillingPortalSession
    ///
    /// Parent Type: `BillingPortalSession`
    public struct CreateBillingPortalSession: AppGraphqlApi.SelectionSet {
      public let __data: DataDict
      public init(_dataDict: DataDict) { __data = _dataDict }

      public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.BillingPortalSession }
      public static var __selections: [ApolloAPI.Selection] { [
        .field("__typename", String.self),
        .field("url", String.self),
      ] }
      public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
        CreateBillingPortalSessionMutation.Data.CreateBillingPortalSession.self
      ] }

      /// Where to send the user to manage billing: Stripe's Billing Portal, or the in-app test billing page in local mode.
      public var url: String { __data["url"] }
    }
  }
}
