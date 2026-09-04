// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public struct UpdateProjectInput: InputObject {
  public private(set) var __data: InputDict

  public init(_ data: InputDict) {
    __data = data
  }

  public init(
    objectId: Id,
    idempotencyKey: String,
    fields: UpdateProjectFields
  ) {
    __data = InputDict([
      "objectId": objectId,
      "idempotencyKey": idempotencyKey,
      "fields": fields
    ])
  }

  public var objectId: Id {
    get { __data["objectId"] }
    set { __data["objectId"] = newValue }
  }

  public var idempotencyKey: String {
    get { __data["idempotencyKey"] }
    set { __data["idempotencyKey"] = newValue }
  }

  public var fields: UpdateProjectFields {
    get { __data["fields"] }
    set { __data["fields"] = newValue }
  }
}
