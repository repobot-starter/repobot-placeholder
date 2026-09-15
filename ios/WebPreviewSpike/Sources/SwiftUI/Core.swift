// The spike shim's core: a `View` protocol shaped exactly like SwiftUI's, a
// result builder, and structural views. Rendering is a naive recursive walk
// producing `_Node` trees that map to DOM elements (flex/grid layout — NOT
// SwiftUI's propose/respond sizing; Phase 1 replaces this).
@_exported import Foundation

public protocol View {
  associatedtype Body: View
  @ViewBuilder var body: Body { get }
}

extension Never: View {
  public var body: Never { fatalError("Never has no body") }
}

/// Internal render protocol: primitives produce nodes directly, composites
/// recurse through `body`.
public protocol _Primitive {
  func _render() -> [_Node]
}

extension View {
  public func _nodes() -> [_Node] {
    if let primitive = self as? _Primitive { return primitive._render() }
    return body._nodes()
  }
}

/// One DOM-element-to-be. Styles are raw CSS property/value pairs.
public struct _Node {
  public var tag = "div"
  public var style: [String: String] = [:]
  public var text: String? = nil
  public var children: [_Node] = []
  public var onClick: (() -> Void)? = nil
  /// Marks nodes carrying an `.alignmentGuide` — the spike's ZStack falls
  /// back to a wrapping flex row when it sees these (the FlowChips pattern).
  public var hasAlignmentGuide = false

  public init(tag: String = "div") { self.tag = tag }
}

@resultBuilder
public enum ViewBuilder {
  public static func buildBlock() -> EmptyView { EmptyView() }
  public static func buildBlock<V: View>(_ view: V) -> V { view }
  public static func buildBlock<each V: View>(_ views: repeat each V) -> TupleView<repeat each V> {
    TupleView((repeat each views))
  }
  public static func buildExpression<V: View>(_ view: V) -> V { view }
  public static func buildOptional<V: View>(_ view: V?) -> V? { view }
  public static func buildIf<V: View>(_ view: V?) -> V? { view }
  public static func buildEither<T: View, F: View>(first: T) -> _ConditionalView<T, F> {
    _ConditionalView(storage: .first(first))
  }
  public static func buildEither<T: View, F: View>(second: F) -> _ConditionalView<T, F> {
    _ConditionalView(storage: .second(second))
  }
}

public struct EmptyView: View, _Primitive {
  public init() {}
  public var body: Never { fatalError() }
  public func _render() -> [_Node] { [] }
}

public struct TupleView<each C: View>: View, _Primitive {
  let content: (repeat each C)
  public init(_ content: (repeat each C)) { self.content = content }
  public var body: Never { fatalError() }
  public func _render() -> [_Node] {
    var nodes: [_Node] = []
    for child in repeat each content { nodes += child._nodes() }
    return nodes
  }
}

public struct _ConditionalView<T: View, F: View>: View, _Primitive {
  enum Storage {
    case first(T)
    case second(F)
  }
  let storage: Storage
  public var body: Never { fatalError() }
  public func _render() -> [_Node] {
    switch storage {
    case .first(let view): return view._nodes()
    case .second(let view): return view._nodes()
    }
  }
}

extension Optional: View, _Primitive where Wrapped: View {
  public var body: Never { fatalError() }
  public func _render() -> [_Node] {
    switch self {
    case .some(let view): return view._nodes()
    case .none: return []
    }
  }
}

public struct ForEach<Data: RandomAccessCollection, ID, Content: View>: View, _Primitive {
  let data: Data
  let content: (Data.Element) -> Content

  public init(
    _ data: Data, id: KeyPath<Data.Element, ID>,
    @ViewBuilder content: @escaping (Data.Element) -> Content
  ) {
    self.data = data
    self.content = content
  }

  public var body: Never { fatalError() }
  public func _render() -> [_Node] { data.flatMap { content($0)._nodes() } }
}

extension ForEach where Data.Element: Identifiable, ID == Data.Element.ID {
  public init(_ data: Data, @ViewBuilder content: @escaping (Data.Element) -> Content) {
    self.data = data
    self.content = content
  }
}
