// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public struct CreateProjectInput: InputObject {
  public private(set) var __data: InputDict

  public init(_ data: InputDict) {
    __data = data
  }

  public init(
    idempotencyKey: String,
    fields: CreateProjectFields
  ) {
    __data = InputDict([
      "idempotencyKey": idempotencyKey,
      "fields": fields
    ])
  }

  public var idempotencyKey: String {
    get { __data["idempotencyKey"] }
    set { __data["idempotencyKey"] = newValue }
  }

  public var fields: CreateProjectFields {
    get { __data["fields"] }
    set { __data["fields"] = newValue }
  }
}
