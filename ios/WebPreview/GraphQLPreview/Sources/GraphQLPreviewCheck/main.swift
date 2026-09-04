// Canned-response checks for the wasm GraphQL client, run through the REAL
// generated Apollo models (fragment spreads, enums, custom scalars, nullable
// fields, entity lists). Runs on the host toolchain (`swift run`) and under
// wasm in a browser, where it also verifies DataDict's AnyHashable casts
// behave on the wasm runtime. Prints GRAPHQL_CHECK PASS/FAIL.
//
// Append ?graphql=live to the hosting page URL to additionally attempt a
// live fetchCurrentUser against same-origin /graphql (requires a backend).
import AppGraphqlApi
import Foundation
import GraphQLPreview

#if arch(wasm32)
import JavaScriptEventLoop
import JavaScriptKit
#endif

struct CheckFailure: Error, CustomStringConvertible {
  let message: String
  var description: String { message }
}

func expect(_ condition: Bool, _ message: String) throws {
  if !condition { throw CheckFailure(message: message) }
}

func runCannedChecks() throws {
  // 1. GetCurrentUser — fragment spread, enum, custom scalars, null optional
  //    scalar, nested entity, fragment accessor.
  let currentUserEnvelope = #"""
  {"data": {"currentUser": {
    "__typename": "User",
    "id": "user-1",
    "email": "ada@example.com",
    "displayName": "Ada Dev",
    "status": "ACTIVE",
    "createdTime": "2026-01-01T00:00:00Z",
    "avatarUploadId": null,
    "account": {"__typename": "Account", "id": "acct-1", "name": "Dev Account"}
  }}}
  """#
  let current = try WasmGraphQLTransport.decodeEnvelope(currentUserEnvelope, for: GetCurrentUserQuery())
  try expect(current.currentUser.displayName == "Ada Dev", "displayName mismatch")
  try expect(current.currentUser.id == "user-1", "custom scalar Id mismatch")
  try expect(current.currentUser.status == .case(.active), "enum mismatch: \(current.currentUser.status)")
  try expect(current.currentUser.avatarUploadId == nil, "null optional should decode as nil")
  try expect(current.currentUser.account?.name == "Dev Account", "nested entity mismatch")
  try expect(
    current.currentUser.fragments.userFields.email == "ada@example.com",
    "fragment accessor mismatch"
  )

  // 2. GetUsers — variables serialization, entity list with a null element,
  //    nested fragment (PageInfoFields), non-null Bool + null String.
  let usersQuery = GetUsersQuery(
    input: UserConnectionInput(
      connection: ConnectionInput(
        pagination: PaginationInput(first: 2),
        sort: [SortOrderInput(fieldName: "displayName", direction: GraphQLEnum(SortDirection.asc))]
      )
    )
  )
  let body = try WasmGraphQLTransport.requestBody(for: usersQuery)
  try expect(body.contains(#""operationName":"GetUsers""#), "operationName missing from body")
  try expect(body.contains("query GetUsers"), "query document missing from body")
  try expect(body.contains(#""first":2"#), "variables missing from body: \(body)")
  try expect(body.contains("fragment UserFields"), "fragment definitions missing from body")

  let usersEnvelope = #"""
  {"data": {"users": {
    "__typename": "UserConnection",
    "nodes": [
      {
        "__typename": "User",
        "id": "user-1",
        "email": "ada@example.com",
        "displayName": "Ada Dev",
        "status": "ACTIVE",
        "createdTime": "2026-01-01T00:00:00Z",
        "avatarUploadId": "upload-9",
        "account": null
      },
      null
    ],
    "pageInfo": {"__typename": "PageInfo", "hasNextPage": true, "endCursor": null}
  }}}
  """#
  let users = try WasmGraphQLTransport.decodeEnvelope(usersEnvelope, for: usersQuery)
  try expect(users.users.nodes.count == 2, "expected 2 nodes")
  try expect(users.users.nodes[0]?.displayName == "Ada Dev", "node 0 mismatch")
  try expect(users.users.nodes[0]?.avatarUploadId == "upload-9", "non-null optional scalar mismatch")
  try expect(users.users.nodes[0]?.account == nil, "null entity should decode as nil")
  try expect(users.users.nodes[1] == nil, "null list element should decode as nil")
  try expect(users.users.pageInfo.hasNextPage == true, "pageInfo.hasNextPage mismatch")
  try expect(users.users.pageInfo.endCursor == nil, "null endCursor should decode as nil")

  // 3. Error envelope maps to .upstream with the server's message.
  do {
    _ = try WasmGraphQLTransport.decodeEnvelope(
      #"{"errors": [{"message": "boom"}]}"#,
      for: GetCurrentUserQuery()
    )
    throw CheckFailure(message: "error envelope should throw")
  } catch let error as WasmGraphQLError {
    guard case let .upstream(message) = error, message == "boom" else {
      throw CheckFailure(message: "expected .upstream(boom), got \(error)")
    }
  }
}

do {
  try runCannedChecks()
  print("GRAPHQL_CHECK PASS")
} catch {
  print("GRAPHQL_CHECK FAIL: \(error)")
  #if !arch(wasm32)
  exit(1)
  #endif
}

#if arch(wasm32)
JavaScriptEventLoop.installGlobalExecutor()

let client: any GraphQLClientProtocol = WasmGraphQLClient()

if let search = JSObject.global.location.object?.search.string, search.contains("graphql=live") {
  Task {
    do {
      let user = try await client.fetchCurrentUser()
      print("GRAPHQL_LIVE PASS: \(user.displayName)")
    } catch {
      print("GRAPHQL_LIVE FAIL: \(error)")
    }
  }
}
#endif
