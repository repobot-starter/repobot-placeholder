// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public class CreateAiVoiceSessionMutation: GraphQLMutation {
  public static let operationName: String = "CreateAiVoiceSession"
  public static let operationDocument: ApolloAPI.OperationDocument = .init(
    definition: .init(
      #"mutation CreateAiVoiceSession { createAiVoiceSession { __typename clientSecret expiresAt model voice } }"#
    ))

  public init() {}

  public struct Data: AppGraphqlApi.SelectionSet {
    public let __data: DataDict
    public init(_dataDict: DataDict) { __data = _dataDict }

    public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.Mutation }
    public static var __selections: [ApolloAPI.Selection] { [
      .field("createAiVoiceSession", CreateAiVoiceSession.self),
    ] }
    public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
      CreateAiVoiceSessionMutation.Data.self
    ] }

    public var createAiVoiceSession: CreateAiVoiceSession { __data["createAiVoiceSession"] }

    /// CreateAiVoiceSession
    ///
    /// Parent Type: `AiVoiceSession`
    public struct CreateAiVoiceSession: AppGraphqlApi.SelectionSet {
      public let __data: DataDict
      public init(_dataDict: DataDict) { __data = _dataDict }

      public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.AiVoiceSession }
      public static var __selections: [ApolloAPI.Selection] { [
        .field("__typename", String.self),
        .field("clientSecret", String.self),
        .field("expiresAt", AppGraphqlApi.Instant?.self),
        .field("model", String.self),
        .field("voice", String.self),
      ] }
      public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
        CreateAiVoiceSessionMutation.Data.CreateAiVoiceSession.self
      ] }

      /// Short-lived secret the native app opens its OpenAI Realtime WebSocket with.
      public var clientSecret: String { __data["clientSecret"] }
      /// When the client secret expires; reconnect by minting a new session.
      public var expiresAt: AppGraphqlApi.Instant? { __data["expiresAt"] }
      /// The realtime model to pass when connecting, e.g. "gpt-realtime-2".
      public var model: String { __data["model"] }
      /// The voice the session speaks with.
      public var voice: String { __data["voice"] }
    }
  }
}
