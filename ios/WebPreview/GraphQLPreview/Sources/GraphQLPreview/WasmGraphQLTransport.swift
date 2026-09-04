import AppGraphqlApi
import Foundation

#if arch(wasm32)
import JavaScriptEventLoop
import JavaScriptKit
#endif

/// GraphQL over the browser's fetch(), for the wasm preview build.
///
/// Mirrors the device client's request shape (see the app's GraphQLClient +
/// AuthorizationInterceptor): POST JSON {operationName, query, variables}
/// with Accept/Content-Type application/json and optional Bearer auth. The
/// endpoint is same-origin by default — the preview pod serves the wasm
/// bundle and proxies /graphql, so cookies/CORS never come into play. In
/// sandboxes, `authToken` supplies the dev JWT.
///
/// Requires `JavaScriptEventLoop.installGlobalExecutor()` once at startup.
public struct WasmGraphQLTransport {
  public var endpoint: String
  public var authToken: () -> String?

  public init(endpoint: String = "/graphql", authToken: @escaping () -> String? = { nil }) {
    self.endpoint = endpoint
    self.authToken = authToken
  }

  /// Serialized {operationName, query, variables} request body — split out so
  /// it is testable on the host toolchain, where JavaScriptKit has no runtime.
  public static func requestBody<Operation: GraphQLOperation>(
    for operation: Operation
  ) throws -> String {
    guard let definition = Operation.definition else {
      throw WasmGraphQLError.missingOperationDefinition(operationName: Operation.operationName)
    }
    var body: [String: Any] = [
      "operationName": Operation.operationName,
      "query": definition.queryDocument,
    ]
    if let variables = operation.__variables {
      body["variables"] = variables._jsonEncodableObject._jsonObject
    }
    let data = try JSONSerialization.data(withJSONObject: body)
    guard let string = String(data: data, encoding: .utf8) else {
      throw WasmGraphQLError.invalidResponse
    }
    return string
  }

  /// Decodes a raw GraphQL response envelope ({data, errors}) into the
  /// operation's Data model. Also host-testable.
  public static func decodeEnvelope<Operation: GraphQLOperation>(
    _ text: String,
    for operation: Operation
  ) throws -> Operation.Data {
    guard
      let data = text.data(using: .utf8),
      let envelope = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else {
      throw WasmGraphQLError.invalidResponse
    }
    if let errors = envelope["errors"] as? [[String: Any]],
       let message = errors.first?["message"] as? String {
      throw WasmGraphQLError.upstream(message)
    }
    guard let dataJSON = envelope["data"] as? [String: Any] else {
      throw WasmGraphQLError.invalidResponse
    }
    return try WasmGraphQLResponseMapper.decode(
      Operation.Data.self,
      from: dataJSON,
      variables: operation.__variables
    )
  }

  #if arch(wasm32)
  public func execute<Operation: GraphQLOperation>(
    _ operation: Operation
  ) async throws -> Operation.Data {
    let bodyString = try Self.requestBody(for: operation)

    let headers = JSObject.global.Object.function!.new()
    headers["Content-Type"] = .string("application/json")
    headers["Accept"] = .string("application/json")
    if let token = authToken() {
      headers["Authorization"] = .string("Bearer \(token)")
    }
    let options = JSObject.global.Object.function!.new()
    options["method"] = .string("POST")
    options["headers"] = .object(headers)
    options["body"] = .string(bodyString)

    let fetchFunction = JSObject.global.fetch.function!
    let response: JSValue
    do {
      response = try await JSPromise(fetchFunction(endpoint, options).object!)!.value
    } catch {
      throw WasmGraphQLError.networkFailure(String(describing: error))
    }
    guard let responseObject = response.object else {
      throw WasmGraphQLError.invalidResponse
    }
    let status = Int(responseObject.status.number ?? -1)
    let text = (try? await JSPromise(responseObject.text!().object!)!.value.string) ?? ""
    guard (200..<300).contains(status) else {
      throw WasmGraphQLError.httpFailure(statusCode: status, details: text.isEmpty ? nil : text)
    }
    return try Self.decodeEnvelope(text, for: operation)
  }
  #endif
}
