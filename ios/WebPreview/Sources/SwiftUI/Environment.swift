// EnvironmentValues, @Environment, @EnvironmentObject, and the built-in
// environment keys the renderer itself consumes (font, foreground style,
// text attributes, disabled…). Custom keys — like the kernel's theme —
// work through the standard EnvironmentKey protocol.
import CoreGraphics
import Foundation
import JavaScriptKit

public protocol EnvironmentKey {
  associatedtype Value
  static var defaultValue: Value { get }
}

public struct EnvironmentValues {
  var custom: [ObjectIdentifier: Any] = [:]
  var objects: [ObjectIdentifier: any ObservableObject] = [:]

  // Renderer-consumed values.
  var font: Font = .body
  var foregroundCSS: String = "#000000"
  var textAlignmentCSS: String = "left"
  var lineSpacing: CGFloat = 0
  var kerning: CGFloat = 0
  var lineLimit: Int? = nil
  var isDisabled: Bool = false
  var tintCSS: String? = nil
  var truncationCSS: String = "ellipsis"

  public init() {}

  public subscript<K: EnvironmentKey>(key: K.Type) -> K.Value {
    get { custom[ObjectIdentifier(key)] as? K.Value ?? K.defaultValue }
    set { custom[ObjectIdentifier(key)] = newValue }
  }

  // Public mirrors for the keys kernel code reads via @Environment.
  public var openURL: OpenURLAction {
    OpenURLAction()
  }

  public var colorScheme: ColorScheme {
    get { self[ColorSchemeKey.self] }
    set { self[ColorSchemeKey.self] = newValue }
  }

  public var dismiss: DismissAction {
    DismissAction()
  }
}

enum ColorSchemeKey: EnvironmentKey {
  static let defaultValue = ColorScheme.light
}

public enum ColorScheme: Hashable, Sendable {
  case light
  case dark
}

public struct OpenURLAction {
  public func callAsFunction(_ url: URL) {
    _ = JSObject.global.window.open(url.absoluteString, "_blank")
  }
}

public struct DismissAction {
  public func callAsFunction() {}
}

@propertyWrapper
public struct Environment<Value>: _DynamicProperty {
  final class Box {
    var value: Value?
  }

  let keyPath: KeyPath<EnvironmentValues, Value>
  let box = Box()

  public init(_ keyPath: KeyPath<EnvironmentValues, Value>) {
    self.keyPath = keyPath
  }

  public func _bind(key: String, environment: EnvironmentValues) {
    box.value = environment[keyPath: keyPath]
  }

  public var wrappedValue: Value {
    if let value = box.value { return value }
    return EnvironmentValues()[keyPath: keyPath]
  }
}

@propertyWrapper
public struct EnvironmentObject<ObjectType: ObservableObject>: _DynamicProperty {
  final class Box {
    var value: ObjectType?
  }

  let box = Box()

  public init() {}

  public func _bind(key: String, environment: EnvironmentValues) {
    box.value = environment.objects[ObjectIdentifier(ObjectType.self)] as? ObjectType
  }

  public var wrappedValue: ObjectType {
    guard let value = box.value else {
      fatalError("No \(ObjectType.self) found: attach one with .environmentObject(_:)")
    }
    return value
  }

  public var projectedValue: ObjectType { wrappedValue }
}
