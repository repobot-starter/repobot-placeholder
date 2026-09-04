// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public class RegisterPushDeviceMutation: GraphQLMutation {
  public static let operationName: String = "RegisterPushDevice"
  public static let operationDocument: ApolloAPI.OperationDocument = .init(
    definition: .init(
      #"mutation RegisterPushDevice($input: RegisterPushDeviceInput!) { registerPushDevice(input: $input) { __typename id platform endpoint rotatedTime } }"#
    ))

  public var input: RegisterPushDeviceInput

  public init(input: RegisterPushDeviceInput) {
    self.input = input
  }

  public var __variables: Variables? { ["input": input] }

  public struct Data: AppGraphqlApi.SelectionSet {
    public let __data: DataDict
    public init(_dataDict: DataDict) { __data = _dataDict }

    public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.Mutation }
    public static var __selections: [ApolloAPI.Selection] { [
      .field("registerPushDevice", RegisterPushDevice.self, arguments: ["input": .variable("input")]),
    ] }
    public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
      RegisterPushDeviceMutation.Data.self
    ] }

    /// Registers (or rotates) a push destination for the caller, upserting on endpoint.
    public var registerPushDevice: RegisterPushDevice { __data["registerPushDevice"] }

    /// RegisterPushDevice
    ///
    /// Parent Type: `PushDevice`
    public struct RegisterPushDevice: AppGraphqlApi.SelectionSet {
      public let __data: DataDict
      public init(_dataDict: DataDict) { __data = _dataDict }

      public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.PushDevice }
      public static var __selections: [ApolloAPI.Selection] { [
        .field("__typename", String.self),
        .field("id", AppGraphqlApi.Id.self),
        .field("platform", GraphQLEnum<AppGraphqlApi.PushDevicePlatform>.self),
        .field("endpoint", String.self),
        .field("rotatedTime", AppGraphqlApi.Instant.self),
      ] }
      public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
        RegisterPushDeviceMutation.Data.RegisterPushDevice.self
      ] }

      public var id: AppGraphqlApi.Id { __data["id"] }
      public var platform: GraphQLEnum<AppGraphqlApi.PushDevicePlatform> { __data["platform"] }
      /// The transport identity: the Web Push subscription endpoint (native device tokens in C1b).
      public var endpoint: String { __data["endpoint"] }
      /// Bumped every time the endpoint is (re-)registered.
      public var rotatedTime: AppGraphqlApi.Instant { __data["rotatedTime"] }
    }
  }
}
