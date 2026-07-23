// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public struct PageInfoFields: AppGraphqlApi.SelectionSet, Fragment {
  public static var fragmentDefinition: StaticString {
    #"fragment PageInfoFields on PageInfo { __typename hasNextPage endCursor }"#
  }

  public let __data: DataDict
  public init(_dataDict: DataDict) { __data = _dataDict }

  public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.PageInfo }
  public static var __selections: [ApolloAPI.Selection] { [
    .field("__typename", String.self),
    .field("hasNextPage", Bool.self),
    .field("endCursor", String?.self),
  ] }
  public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
    PageInfoFields.self
  ] }

  public var hasNextPage: Bool { __data["hasNextPage"] }
  public var endCursor: String? { __data["endCursor"] }
}
