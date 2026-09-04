import AppGraphqlApi
import Foundation

/// Errors surfaced by the wasm GraphQL transport and response mapper.
/// The app-side conformance (WasmGraphQLClient) maps these onto the app's
/// GraphQLClientError so feature code sees the same error shapes as on device.
public enum WasmGraphQLError: Error, CustomStringConvertible {
  case missingOperationDefinition(operationName: String)
  case invalidResponse
  case httpFailure(statusCode: Int, details: String?)
  case networkFailure(String)
  case upstream(String)
  case decoding(String)

  public var description: String {
    switch self {
    case let .missingOperationDefinition(name):
      return "Operation \(name) has no document definition (persisted-ID-only operations are unsupported)."
    case .invalidResponse:
      return "Invalid response from GraphQL API."
    case let .httpFailure(statusCode, details):
      return "GraphQL request failed (\(statusCode)): \(details ?? "")"
    case let .networkFailure(message):
      return "Network failure: \(message)"
    case let .upstream(message):
      return message
    case let .decoding(message):
      return "Response decoding failed: \(message)"
    }
  }
}

/// Maps a raw GraphQL JSON response (as produced by JSONSerialization) onto
/// the generated Apollo model types.
///
/// This replaces the `GraphQLExecutor` + `GraphQLSelectionSetMapper` pair from
/// the `Apollo` package, which cannot compile to wasm (its target includes
/// URLSession networking). The mapping is driven by the generated selection
/// metadata (`__selections`), so models decode exactly the fields the
/// operation selected:
///
///   - scalars/enums/custom scalars convert via their `JSONDecodable` inits
///     and are stored as the exact concrete types the accessors cast to
///   - entity fields become nested `DataDict`s
///   - named fragment spreads and matching inline fragments are merged in and
///     recorded in `fulfilledFragments` so fragment accessors work
///   - `@include`/`@skip` conditions evaluate against the operation variables
public enum WasmGraphQLResponseMapper {
  public static func decode<Data: RootSelectionSet>(
    _ type: Data.Type,
    from json: [String: Any],
    variables: GraphQLOperation.Variables? = nil
  ) throws -> Data {
    let context = Context(
      objectType: { Data.Schema.objectType(forTypename: $0) },
      variables: variables
    )
    return Data(_dataDict: try entityDict(for: Data.self, json: json, context: context))
  }

  private struct Context {
    let objectType: (String) -> Object?
    let variables: GraphQLOperation.Variables?
  }

  private static func entityDict(
    for type: any ApolloAPI.SelectionSet.Type,
    json: [String: Any],
    context: Context
  ) throws -> DataDict {
    var data: [String: AnyHashable] = [:]
    var fulfilled: Set<ObjectIdentifier> = [ObjectIdentifier(type)]
    let typename = json["__typename"] as? String
    try apply(
      type.__selections,
      json: json,
      objectType: typename.flatMap(context.objectType),
      data: &data,
      fulfilled: &fulfilled,
      context: context
    )
    if data["__typename"] == nil {
      data["__typename"] = typename ?? type.__parentType.__typename
    }
    return DataDict(data: data, fulfilledFragments: fulfilled)
  }

  private static func apply(
    _ selections: [Selection],
    json: [String: Any],
    objectType: Object?,
    data: inout [String: AnyHashable],
    fulfilled: inout Set<ObjectIdentifier>,
    context: Context
  ) throws {
    for selection in selections {
      switch selection {
      case let .field(field):
        data[field.responseKey] = try value(
          json[field.responseKey],
          as: field.type,
          at: field.responseKey,
          context: context
        )

      case let .fragment(fragmentType):
        fulfilled.insert(ObjectIdentifier(fragmentType))
        try apply(
          fragmentType.__selections,
          json: json,
          objectType: objectType,
          data: &data,
          fulfilled: &fulfilled,
          context: context
        )

      case let .inlineFragment(inlineType):
        guard let objectType, inlineType.__parentType.canBeConverted(from: objectType) else {
          continue
        }
        fulfilled.insert(ObjectIdentifier(inlineType))
        try apply(
          inlineType.__selections,
          json: json,
          objectType: objectType,
          data: &data,
          fulfilled: &fulfilled,
          context: context
        )

      case let .conditional(conditions, conditionalSelections):
        guard conditions.evaluate(with: context.variables) else { continue }
        try apply(
          conditionalSelections,
          json: json,
          objectType: objectType,
          data: &data,
          fulfilled: &fulfilled,
          context: context
        )

      case .deferred:
        throw WasmGraphQLError.decoding("@defer is not supported by the web preview transport")
      }
    }
  }

  private static func value(
    _ raw: Any?,
    as outputType: Selection.Field.OutputType,
    at path: String,
    context: Context
  ) throws -> AnyHashable {
    guard let raw, !(raw is NSNull) else {
      guard outputType.isNullable else {
        throw WasmGraphQLError.decoding("null value for non-null field '\(path)'")
      }
      return DataDict._NullValue
    }

    switch outputType {
    case let .nonNull(inner):
      return try value(raw, as: inner, at: path, context: context)

    case let .list(inner):
      guard let array = raw as? [Any] else {
        throw WasmGraphQLError.decoding("expected list for field '\(path)'")
      }
      return try array.enumerated().map { index, element in
        try value(element, as: inner, at: "\(path)[\(index)]", context: context)
      }

    case let .scalar(scalarType):
      guard let jsonValue = raw as? AnyHashable else {
        throw WasmGraphQLError.decoding("unhashable scalar for field '\(path)'")
      }
      do {
        return try scalarType.init(_jsonValue: jsonValue)._asAnyHashable
      } catch {
        throw WasmGraphQLError.decoding("cannot convert '\(path)' to \(scalarType): \(error)")
      }

    case let .customScalar(scalarType):
      guard let jsonValue = raw as? AnyHashable else {
        throw WasmGraphQLError.decoding("unhashable scalar for field '\(path)'")
      }
      do {
        return try scalarType.init(_jsonValue: jsonValue)._asAnyHashable
      } catch {
        throw WasmGraphQLError.decoding("cannot convert '\(path)' to \(scalarType): \(error)")
      }

    case let .object(selectionSetType):
      guard let object = raw as? [String: Any] else {
        throw WasmGraphQLError.decoding("expected object for field '\(path)'")
      }
      return try entityDict(for: selectionSetType, json: object, context: context)
    }
  }
}
