// @State + @Environment for the spike. State boxes live on the heap and are
// shared by value-copies of the view struct; a mutation schedules a full
// re-render of the mounted root (no diffing — Phase 1 concern).
import Foundation

@propertyWrapper
public struct State<Value> {
  final class _Box {
    var value: Value
    init(_ value: Value) { self.value = value }
  }

  let box: _Box

  public init(wrappedValue: Value) { box = _Box(wrappedValue) }
  public init(initialValue: Value) { box = _Box(initialValue) }

  public init() where Value: ExpressibleByNilLiteral {
    box = _Box(nil)
  }

  public var wrappedValue: Value {
    get { box.value }
    nonmutating set {
      box.value = newValue
      _WebRuntime.scheduleRerender()
    }
  }

  public var projectedValue: Binding<Value> {
    Binding(
      get: { box.value },
      set: { newValue in
        box.value = newValue
        _WebRuntime.scheduleRerender()
      })
  }
}

@propertyWrapper
public struct Binding<Value> {
  let get: () -> Value
  let set: (Value) -> Void

  public init(get: @escaping () -> Value, set: @escaping (Value) -> Void) {
    self.get = get
    self.set = set
  }

  public var wrappedValue: Value {
    get { get() }
    nonmutating set { set(newValue) }
  }

  public var projectedValue: Binding<Value> { self }
}

// MARK: - Environment

public struct OpenURLAction {
  let handler: (URL) -> Void
  public init(handler: @escaping (URL) -> Void) { self.handler = handler }
  public func callAsFunction(_ url: URL) { handler(url) }
}

public struct EnvironmentValues {
  public var openURL = OpenURLAction { url in
    _WebRuntime.openExternalURL(url.absoluteString)
  }

  static var current = EnvironmentValues()
}

@propertyWrapper
public struct Environment<Value> {
  let keyPath: KeyPath<EnvironmentValues, Value>

  public init(_ keyPath: KeyPath<EnvironmentValues, Value>) {
    self.keyPath = keyPath
  }

  public var wrappedValue: Value {
    EnvironmentValues.current[keyPath: keyPath]
  }
}
