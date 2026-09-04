// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public class UnregisterPushDeviceMutation: GraphQLMutation {
  public static let operationName: String = "UnregisterPushDevice"
  public static let operationDocument: ApolloAPI.OperationDocument = .init(
    definition: .init(
      #"mutation UnregisterPushDevice($input: UnregisterPushDeviceInput!) { unregisterPushDevice(input: $input) }"#
    ))

  public var input: UnregisterPushDeviceInput

  public init(input: UnregisterPushDeviceInput) {
    self.input = input
  }

  public var __variables: Variables? { ["input": input] }

  public struct Data: AppGraphqlApi.SelectionSet {
    public let __data: DataDict
    public init(_dataDict: DataDict) { __data = _dataDict }

    public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.Mutation }
    public static var __selections: [ApolloAPI.Selection] { [
      .field("unregisterPushDevice", Bool.self, arguments: ["input": .variable("input")]),
    ] }
    public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
      UnregisterPushDeviceMutation.Data.self
    ] }

    /// Removes the caller's registration for the endpoint; true when one was removed.
    public var unregisterPushDevice: Bool { __data["unregisterPushDevice"] }
  }
}
