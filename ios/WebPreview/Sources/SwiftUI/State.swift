// State runtime: @State, @Binding, ObservableObject/@Published.
//
// The view tree is rebuilt from the root each render, so view structs (and
// their property-wrapper instances) are reconstructed constantly. State
// survives because each @State is bound — just before its view's body
// runs — to a slot in a global store keyed by the view's structural path
// plus the property's label. That reproduces SwiftUI's structural-identity
// rule: same position in the tree ⇒ same state; changed position (e.g. a
// different if/else branch) ⇒ fresh state.
import Foundation

final class _StateStore {
  static let shared = _StateStore()
  private var slots: [String: Any] = [:]
  /// Keys touched during the current render pass; used to drop state for
  /// views that left the tree so branch switches get fresh state later.
  private var liveKeys: Set<String> = []

  func beginRenderPass() { liveKeys.removeAll(keepingCapacity: true) }

  func endRenderPass() {
    slots = slots.filter { liveKeys.contains($0.key) }
  }

  func value<T>(for key: String, default makeDefault: () -> T) -> T {
    liveKeys.insert(key)
    if let existing = slots[key] as? T { return existing }
    let fresh = makeDefault()
    slots[key] = fresh
    return fresh
  }

  func set(_ value: Any, for key: String) {
    slots[key] = value
  }
}

@propertyWrapper
public struct State<Value>: _DynamicProperty {
  final class Identity {
    var key: String?
    var local: Value
    init(local: Value) { self.local = local }
  }

  let identity: Identity

  public init(wrappedValue: Value) {
    identity = Identity(local: wrappedValue)
  }

  public init(initialValue: Value) {
    self.init(wrappedValue: initialValue)
  }

  public func _bind(key: String, environment: EnvironmentValues) {
    identity.key = key
    // Claim the slot (marks it live and seeds the initial value).
    _ = _StateStore.shared.value(for: key) { identity.local }
  }

  public var wrappedValue: Value {
    get {
      if let key = identity.key {
        return _StateStore.shared.value(for: key) { identity.local }
      }
      return identity.local
    }
    nonmutating set {
      if let key = identity.key {
        _StateStore.shared.set(newValue, for: key)
      } else {
        identity.local = newValue
      }
      _WebRuntime.scheduleRerender()
    }
  }

  public var projectedValue: Binding<Value> {
    Binding(
      get: { wrappedValue },
      set: { wrappedValue = $0 })
  }
}

extension State where Value: ExpressibleByNilLiteral {
  public init() {
    self.init(wrappedValue: nil)
  }
}

// MARK: - @AppStorage (UserDefaults shim → localStorage)

public protocol _AppStorageValue {
  static func _read(from defaults: UserDefaults, key: String) -> Self?
  func _write(to defaults: UserDefaults, key: String)
}

extension String: _AppStorageValue {
  public static func _read(from defaults: UserDefaults, key: String) -> String? {
    defaults.string(forKey: key)
  }
  public func _write(to defaults: UserDefaults, key: String) { defaults.set(self, forKey: key) }
}

extension Int: _AppStorageValue {
  public static func _read(from defaults: UserDefaults, key: String) -> Int? {
    defaults.object(forKey: key) == nil ? nil : defaults.integer(forKey: key)
  }
  public func _write(to defaults: UserDefaults, key: String) { defaults.set(self, forKey: key) }
}

extension Bool: _AppStorageValue {
  public static func _read(from defaults: UserDefaults, key: String) -> Bool? {
    defaults.object(forKey: key) == nil ? nil : defaults.bool(forKey: key)
  }
  public func _write(to defaults: UserDefaults, key: String) { defaults.set(self, forKey: key) }
}

extension Double: _AppStorageValue {
  public static func _read(from defaults: UserDefaults, key: String) -> Double? {
    guard let raw = defaults.string(forKey: key) else { return nil }
    return Double(raw)
  }
  public func _write(to defaults: UserDefaults, key: String) { defaults.set(self, forKey: key) }
}

/// Identity comes from the explicit storage key (not structural position),
/// exactly as on iOS; values live in the localStorage-backed UserDefaults.
@propertyWrapper
public struct AppStorage<Value: _AppStorageValue>: _DynamicProperty {
  let storageKey: String
  let defaultValue: Value

  public init(wrappedValue: Value, _ key: String, store: UserDefaults? = nil) {
    self.storageKey = key
    self.defaultValue = wrappedValue
  }

  public func _bind(key: String, environment: EnvironmentValues) {}

  public var wrappedValue: Value {
    get { Value._read(from: .standard, key: storageKey) ?? defaultValue }
    nonmutating set {
      newValue._write(to: .standard, key: storageKey)
      _WebRuntime.scheduleRerender()
    }
  }

  public var projectedValue: Binding<Value> {
    Binding(
      get: { wrappedValue },
      set: { wrappedValue = $0 })
  }
}

@propertyWrapper
public struct Binding<Value> {
  let getter: () -> Value
  let setter: (Value) -> Void

  public init(get: @escaping () -> Value, set: @escaping (Value) -> Void) {
    self.getter = get
    self.setter = set
  }

  public static func constant(_ value: Value) -> Binding<Value> {
    Binding(get: { value }, set: { _ in })
  }

  public var wrappedValue: Value {
    get { getter() }
    nonmutating set { setter(newValue) }
  }

  public var projectedValue: Binding<Value> { self }

  public subscript<Subject>(dynamicMember keyPath: WritableKeyPath<Value, Subject>)
    -> Binding<Subject>
  {
    Binding<Subject>(
      get: { wrappedValue[keyPath: keyPath] },
      set: { wrappedValue[keyPath: keyPath] = $0 })
  }
}

// MARK: - ObservableObject / @Published (OpenCombine-shaped, renderer-local)

public protocol ObservableObject: AnyObject {}

@propertyWrapper
public final class Published<Value> {
  private var value: Value

  public init(wrappedValue: Value) {
    self.value = wrappedValue
  }

  public var wrappedValue: Value {
    get { value }
    set {
      value = newValue
      _WebRuntime.scheduleRerender()
    }
  }

  public var projectedValue: Binding<Value> {
    Binding(
      get: { self.value },
      set: { self.wrappedValue = $0 })
  }
}

/// @StateObject: the object survives re-renders in the state store, like
/// @State (created once per structural identity).
@propertyWrapper
public struct StateObject<ObjectType: ObservableObject>: _DynamicProperty {
  final class Identity {
    var key: String?
    let make: () -> ObjectType
    lazy var local: ObjectType = make()
    init(make: @escaping () -> ObjectType) { self.make = make }
  }

  let identity: Identity

  public init(wrappedValue make: @autoclosure @escaping () -> ObjectType) {
    identity = Identity(make: make)
  }

  public func _bind(key: String, environment: EnvironmentValues) {
    identity.key = key
  }

  public var wrappedValue: ObjectType {
    if let key = identity.key {
      return _StateStore.shared.value(for: key) { identity.make() }
    }
    return identity.local
  }

  public var projectedValue: ObjectType { wrappedValue }
}

@propertyWrapper
public struct ObservedObject<ObjectType: ObservableObject>: _DynamicProperty {
  public var wrappedValue: ObjectType

  public init(wrappedValue: ObjectType) {
    self.wrappedValue = wrappedValue
  }

  public func _bind(key: String, environment: EnvironmentValues) {}

  public var projectedValue: ObjectType { wrappedValue }
}
