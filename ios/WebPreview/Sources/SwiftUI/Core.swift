// Core view protocol, ViewBuilder, structural views, and the build pass
// that turns a view tree into layout nodes.
//
// Identity model: every view gets a structural path ("/QuizView/b/2/t/…")
// assembled from type names, tuple indices, conditional branches, and
// ForEach ids. @State lives in a global store keyed by that path, so child
// views keep state across re-renders even though their structs are
// reconstructed each pass (SwiftUI's structural-identity rule).
// Real SwiftUI re-exports Foundation and the geometry vocabulary; kernel
// files rely on it. Both resolve to the preview shims here.
@_exported import CoreGraphics
@_exported import Foundation

// MARK: - View protocol

public protocol View {
  associatedtype Body: View
  @ViewBuilder var body: Body { get }
}

extension Never: View {
  public var body: Never { fatalError("Never has no body") }
}

/// Views the renderer knows how to lay out directly (leaf or container
/// primitives). Everything else is composite and reduced through `body`.
public protocol _PrimitiveView {
  func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode]
}

extension View where Body == Never {
  public var body: Never { fatalError("\(Self.self) is a primitive view") }
}

// MARK: - Build context

public struct _BuildContext {
  public var environment: EnvironmentValues
  public var path: String
  /// Collects side-channel registrations (onAppear/task/onChange) made
  /// during the build; the runtime drains it after each render.
  public let effects: _EffectRegistry

  init(environment: EnvironmentValues, path: String, effects: _EffectRegistry) {
    self.environment = environment
    self.path = path
    self.effects = effects
  }
}

public final class _EffectRegistry {
  struct Appear {
    let path: String
    let isTask: Bool
    let action: () -> Void
  }
  struct Change {
    let path: String
    let newValue: Any
    let isEqualToPrevious: (Any) -> Bool
    let perform: () -> Void
  }
  var appears: [Appear] = []
  var changes: [Change] = []
}

// MARK: - Build entry point

public func _buildNodes<V: View>(_ view: V, _ ctx: inout _BuildContext) -> [_LayoutNode] {
  if let primitive = view as? _PrimitiveView {
    return primitive._primitiveNodes(&ctx)
  }
  var childCtx = ctx
  childCtx.path += "/\(_shortTypeName(V.self))"
  _bindDynamicProperties(view, childCtx)
  let body = view.body
  return _buildNodes(body, &childCtx)
}

func _shortTypeName(_ type: Any.Type) -> String {
  let full = String(describing: type)
  // Drop generic payloads to keep paths compact but still identity-bearing.
  if let angle = full.firstIndex(of: "<") {
    return String(full[..<angle])
  }
  return full
}

/// Binds @State / @Environment / @EnvironmentObject before `body` runs.
/// Mirror gives copies of the property-wrapper structs, but each wrapper
/// carries a class box shared with the original, so binding through the
/// copy reaches the live view.
func _bindDynamicProperties<V>(_ view: V, _ ctx: _BuildContext) {
  let mirror = Mirror(reflecting: view)
  for (index, child) in mirror.children.enumerated() {
    if let property = child.value as? _DynamicProperty {
      let label = child.label ?? "_\(index)"
      property._bind(key: "\(ctx.path).\(label)", environment: ctx.environment)
    }
  }
}

public protocol _DynamicProperty {
  func _bind(key: String, environment: EnvironmentValues)
}

// MARK: - ViewBuilder

@resultBuilder
public enum ViewBuilder {
  public static func buildBlock() -> EmptyView { EmptyView() }
  public static func buildBlock<V: View>(_ v: V) -> V { v }

  public static func buildBlock<each V: View>(_ v: repeat each V) -> TupleView<(repeat each V)> {
    TupleView((repeat each v))
  }

  public static func buildIf<V: View>(_ v: V?) -> V? { v }
  public static func buildOptional<V: View>(_ v: V?) -> V? { v }

  public static func buildEither<T: View, F: View>(first: T) -> _ConditionalView<T, F> {
    _ConditionalView(storage: .first(first))
  }
  public static func buildEither<T: View, F: View>(second: F) -> _ConditionalView<T, F> {
    _ConditionalView(storage: .second(second))
  }

  public static func buildExpression<V: View>(_ v: V) -> V { v }
  public static func buildLimitedAvailability<V: View>(_ v: V) -> AnyView { AnyView(v) }
}

// MARK: - Structural views

public struct EmptyView: View, _PrimitiveView {
  public typealias Body = Never
  public init() {}
  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] { [] }
}

public struct TupleView<T>: View, _PrimitiveView {
  public typealias Body = Never
  public let value: T
  public init(_ value: T) { self.value = value }

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    var nodes: [_LayoutNode] = []
    for (index, child) in Mirror(reflecting: value).children.enumerated() {
      guard let childView = child.value as? any View else { continue }
      var childCtx = ctx
      childCtx.path += "/\(index)"
      nodes.append(contentsOf: _buildAny(childView, &childCtx))
    }
    return nodes
  }
}

func _buildAny(_ view: any View, _ ctx: inout _BuildContext) -> [_LayoutNode] {
  func open<V: View>(_ v: V) -> [_LayoutNode] { _buildNodes(v, &ctx) }
  return open(view)
}

public struct _ConditionalView<TrueContent: View, FalseContent: View>: View, _PrimitiveView {
  public typealias Body = Never
  enum Storage {
    case first(TrueContent)
    case second(FalseContent)
  }
  let storage: Storage

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    var childCtx = ctx
    switch storage {
    case .first(let view):
      childCtx.path += "/t"
      return _buildNodes(view, &childCtx)
    case .second(let view):
      childCtx.path += "/f"
      return _buildNodes(view, &childCtx)
    }
  }
}

extension Optional: View, _PrimitiveView where Wrapped: View {
  public typealias Body = Never
  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    guard let view = self else { return [] }
    var childCtx = ctx
    childCtx.path += "/some"
    return _buildNodes(view, &childCtx)
  }
}

public struct AnyView: View, _PrimitiveView {
  public typealias Body = Never
  let wrapped: any View
  public init<V: View>(_ view: V) { self.wrapped = view }

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    var childCtx = ctx
    childCtx.path += "/any"
    return _buildAny(wrapped, &childCtx)
  }
}

public struct Group<Content: View>: View, _PrimitiveView {
  public typealias Body = Never
  let content: Content
  public init(@ViewBuilder content: () -> Content) { self.content = content() }

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    _buildNodes(content, &ctx)
  }
}

// MARK: - ForEach

public struct ForEach<Data: RandomAccessCollection, ID, Content: View>: View, _PrimitiveView {
  public typealias Body = Never
  let data: Data
  let idFor: (Data.Element) -> String
  let content: (Data.Element) -> Content

  public func _primitiveNodes(_ ctx: inout _BuildContext) -> [_LayoutNode] {
    var nodes: [_LayoutNode] = []
    for element in data {
      var childCtx = ctx
      childCtx.path += "/[\(idFor(element))]"
      nodes.append(contentsOf: _buildNodes(content(element), &childCtx))
    }
    return nodes
  }
}

extension ForEach where ID == Data.Element.ID, Data.Element: Identifiable {
  public init(_ data: Data, @ViewBuilder content: @escaping (Data.Element) -> Content) {
    self.data = data
    self.idFor = { String(describing: $0.id) }
    self.content = content
  }
}

extension ForEach {
  public init(
    _ data: Data, id: KeyPath<Data.Element, ID>,
    @ViewBuilder content: @escaping (Data.Element) -> Content
  ) {
    self.data = data
    self.idFor = { String(describing: $0[keyPath: id]) }
    self.content = content
  }
}

extension ForEach where Data == Range<Int>, ID == Int {
  public init(_ data: Range<Int>, @ViewBuilder content: @escaping (Int) -> Content) {
    self.data = data
    self.idFor = { String($0) }
    self.content = content
  }
}
