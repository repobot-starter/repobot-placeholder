// The preview build's `Foundation`: FoundationEssentials (no ICU — this is
// the ~34 MB binary-size lever measured in Phase 0/1) plus localStorage-
// backed UserDefaults and the tiny corelibs APIs the kernel dialect uses
// that FoundationEssentials doesn't carry (Scanner, CharacterSet, a few
// String methods). Kernel files' `import Foundation` lines resolve here
// unchanged; device builds are untouched.
@_exported import FoundationEssentials
import JavaScriptKit

// MARK: - UserDefaults → localStorage

/// UserDefaults-shaped persistence backed by the browser's localStorage.
/// Data values are stored base64-encoded under `swiftui-preview:<key>`.
public final class UserDefaults {
  public static let standard = UserDefaults()

  private func storageKey(_ key: String) -> String { "swiftui-preview:\(key)" }

  private var localStorage: JSObject? {
    JSObject.global.window.localStorage.object
  }

  public func data(forKey key: String) -> Data? {
    guard let raw = localStorage?.getItem?(storageKey(key)).string else { return nil }
    return Data(base64Encoded: raw)
  }

  public func set(_ value: Any?, forKey key: String) {
    guard let value else {
      removeObject(forKey: key)
      return
    }
    let encoded: String
    switch value {
    case let data as Data: encoded = data.base64EncodedString()
    case let int as Int: encoded = "i:\(int)"
    case let double as Double: encoded = "d:\(double)"
    case let bool as Bool: encoded = "b:\(bool)"
    case let string as String: encoded = "s:\(string)"
    default: encoded = "s:\(String(describing: value))"
    }
    _ = localStorage?.setItem?(storageKey(key), encoded)
  }

  public func object(forKey key: String) -> Any? {
    localStorage?.getItem?(storageKey(key)).string
  }

  public func string(forKey key: String) -> String? {
    guard let raw = localStorage?.getItem?(storageKey(key)).string else { return nil }
    return raw.hasPrefix("s:") ? String(raw.dropFirst(2)) : raw
  }

  public func integer(forKey key: String) -> Int {
    guard let raw = localStorage?.getItem?(storageKey(key)).string else { return 0 }
    if raw.hasPrefix("i:") { return Int(raw.dropFirst(2)) ?? 0 }
    return Int(raw) ?? 0
  }

  public func bool(forKey key: String) -> Bool {
    guard let raw = localStorage?.getItem?(storageKey(key)).string else { return false }
    return raw == "b:true" || raw == "true"
  }

  public func removeObject(forKey key: String) {
    _ = localStorage?.removeItem?(storageKey(key))
  }
}

// MARK: - Scanner (hex scanning only — what Color(hex:) needs)

public final class Scanner {
  private let scalars: [Unicode.Scalar]
  private var index = 0

  public init(string: String) {
    self.scalars = Array(string.unicodeScalars)
  }

  @discardableResult
  public func scanHexInt64(_ result: inout UInt64) -> Bool {
    var value: UInt64 = 0
    var consumed = 0
    // Skip optional 0x/0X prefix.
    if index + 1 < scalars.count, scalars[index] == "0",
      scalars[index + 1] == "x" || scalars[index + 1] == "X"
    {
      index += 2
    }
    while index < scalars.count, let digit = scalars[index].hexDigitValue {
      value = value &* 16 &+ UInt64(digit)
      index += 1
      consumed += 1
    }
    guard consumed > 0 else { return false }
    result = value
    return true
  }
}

extension Unicode.Scalar {
  fileprivate var hexDigitValue: Int? {
    switch self {
    case "0"..."9": return Int(value - 0x30)
    case "a"..."f": return Int(value - 0x61 + 10)
    case "A"..."F": return Int(value - 0x41 + 10)
    default: return nil
    }
  }
}

// MARK: - CharacterSet (ASCII-level subset)

/// Minimal CharacterSet: enough for the dialect's `.alphanumerics.inverted`
/// trimming. Membership is scalar-predicate based, ASCII-accurate; exotic
/// Unicode classes are approximated by Swift's Character properties.
public struct CharacterSet {
  let contains: (Unicode.Scalar) -> Bool
  let isInverted: Bool

  init(isInverted: Bool = false, contains: @escaping (Unicode.Scalar) -> Bool) {
    self.contains = contains
    self.isInverted = isInverted
  }

  public static let alphanumerics = CharacterSet { scalar in
    scalar.properties.isAlphabetic || ("0"..."9").contains(scalar)
  }

  public static let whitespaces = CharacterSet { $0.properties.isWhitespace }

  public static let whitespacesAndNewlines = CharacterSet {
    $0.properties.isWhitespace || $0 == "\n" || $0 == "\r"
  }

  public static let decimalDigits = CharacterSet { ("0"..."9").contains($0) }

  /// RFC 3986 query-allowed characters (matches Foundation's set).
  public static let urlQueryAllowed = CharacterSet { scalar in
    switch scalar {
    case "a"..."z", "A"..."Z", "0"..."9",
      "-", ".", "_", "~",
      "!", "$", "&", "'", "(", ")", "*", "+", ",", ";", "=",
      ":", "@", "/", "?":
      return true
    default:
      return false
    }
  }

  public var inverted: CharacterSet {
    let base = contains
    return CharacterSet(isInverted: !isInverted) { !base($0) }
  }

  public func containsScalar(_ scalar: Unicode.Scalar) -> Bool { contains(scalar) }
}

// MARK: - Calendar / TimeZone / Locale (ICU-free via the browser's Date)
//
// FoundationInternationalization implements these on top of ~34 MB of ICU
// data. The browser already knows the user's timezone and calendar, so the
// preview delegates to JS Date instead. Gregorian only; component semantics
// match Foundation (weekday 1 = Sunday).

public struct Calendar: Sendable {
  public enum Component: Sendable {
    case year, month, day, weekday, hour, minute, second
  }

  public static var current: Calendar { Calendar() }
  public init() {}

  public func component(_ component: Component, from date: Date) -> Int {
    let js = JSObject.global.Date.function!.new(date.timeIntervalSince1970 * 1000)
    switch component {
    case .year: return Int(js.getFullYear!().number ?? 0)
    case .month: return Int(js.getMonth!().number ?? 0) + 1
    case .day: return Int(js.getDate!().number ?? 1)
    case .weekday: return Int(js.getDay!().number ?? 0) + 1
    case .hour: return Int(js.getHours!().number ?? 0)
    case .minute: return Int(js.getMinutes!().number ?? 0)
    case .second: return Int(js.getSeconds!().number ?? 0)
    }
  }
}

public struct TimeZone: Sendable {
  public static var current: TimeZone { TimeZone() }
  public init() {}

  public func secondsFromGMT(for date: Date = Date()) -> Int {
    let js = JSObject.global.Date.function!.new(date.timeIntervalSince1970 * 1000)
    return -Int(js.getTimezoneOffset!().number ?? 0) * 60
  }
}

/// Identifier-only stand-in: the preview always formats as en_US, which is
/// what the kernel's fixed-format call sites request anyway.
public struct Locale: Hashable, Sendable {
  public let identifier: String
  public init(identifier: String) { self.identifier = identifier }
}

// MARK: - DateFormatter (fixed-format subset, en_US month names)

/// Supports what the kernel dialect uses: parsing "yyyy-MM-dd" and formatting
/// with dateStyle .long/.medium ("January 1, 2026"). Dates parse/format in
/// UTC so a parse→format round trip is stable regardless of browser zone.
public final class DateFormatter {
  public enum Style: Sendable {
    case none, short, medium, long, full
  }

  public var dateFormat: String?
  public var dateStyle: Style = .none
  public var timeStyle: Style = .none
  public var locale: Locale?

  public init() {}

  static let monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ]

  public func date(from string: String) -> Date? {
    guard dateFormat == "yyyy-MM-dd" else { return nil }
    let parts = string.split(separator: "-")
    guard parts.count == 3,
      let year = Int(parts[0]), let month = Int(parts[1]), let day = Int(parts[2]),
      (1...12).contains(month), (1...31).contains(day)
    else { return nil }
    return Date(timeIntervalSince1970: Double(Self.daysFromCivil(year: year, month: month, day: day)) * 86400)
  }

  public func string(from date: Date) -> String {
    let (year, month, day) = Self.civilFromDays(Int((date.timeIntervalSince1970 / 86400).rounded(.down)))
    switch (dateStyle, dateFormat) {
    case (_, "yyyy-MM-dd"):
      return "\(year)-\(pad2(month))-\(pad2(day))"
    case (.long, _), (.full, _), (.medium, _):
      return "\(Self.monthNames[month - 1]) \(day), \(year)"
    case (.short, _):
      return "\(month)/\(day)/\(year)"
    default:
      return "\(year)-\(pad2(month))-\(pad2(day))"
    }
  }

  private func pad2(_ value: Int) -> String {
    value < 10 ? "0\(value)" : "\(value)"
  }

  /// Days since 1970-01-01 for a proleptic Gregorian civil date
  /// (Howard Hinnant's days_from_civil).
  static func daysFromCivil(year: Int, month: Int, day: Int) -> Int {
    let y = month <= 2 ? year - 1 : year
    let era = (y >= 0 ? y : y - 399) / 400
    let yoe = y - era * 400
    let doy = (153 * (month + (month > 2 ? -3 : 9)) + 2) / 5 + day - 1
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy
    return era * 146_097 + doe - 719_468
  }

  static func civilFromDays(_ days: Int) -> (year: Int, month: Int, day: Int) {
    let z = days + 719_468
    let era = (z >= 0 ? z : z - 146_096) / 146_097
    let doe = z - era * 146_097
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146_096) / 365
    let y = yoe + era * 400
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100)
    let mp = (5 * doy + 2) / 153
    let day = doy - (153 * mp + 2) / 5 + 1
    let month = mp < 10 ? mp + 3 : mp - 9
    return (month <= 2 ? y + 1 : y, month, day)
  }
}

// MARK: - String corelibs conveniences missing from FoundationEssentials

extension String {
  /// printf-style formatting without ICU. Supports the dialect's usage:
  /// %d/%i/%ld (with zero-padding like %02d), %@, %s, %f/%.Nf, %%.
  public init(format: String, _ arguments: Any...) {
    var result = ""
    var argumentIndex = 0
    var characters = Substring(format)

    func nextArgument() -> Any? {
      defer { argumentIndex += 1 }
      return argumentIndex < arguments.count ? arguments[argumentIndex] : nil
    }

    while let percent = characters.firstIndex(of: "%") {
      result += characters[..<percent]
      var spec = characters[characters.index(after: percent)...]
      guard let first = spec.first else { break }
      if first == "%" {
        result += "%"
        characters = spec.dropFirst()
        continue
      }
      // Flags/width: only zero-padded widths appear in the dialect.
      var padZero = false
      var width = 0
      var precision = -1
      if spec.first == "0" { padZero = true; spec = spec.dropFirst() }
      while let digit = spec.first?.wholeNumberValue, digit >= 0, digit <= 9, spec.first != "." {
        width = width * 10 + digit
        spec = spec.dropFirst()
      }
      if spec.first == "." {
        spec = spec.dropFirst()
        precision = 0
        while let digit = spec.first?.wholeNumberValue, digit >= 0, digit <= 9 {
          precision = precision * 10 + digit
          spec = spec.dropFirst()
        }
      }
      while spec.first == "l" { spec = spec.dropFirst() }
      guard let conversion = spec.first else { break }
      spec = spec.dropFirst()

      var rendered: String
      switch conversion {
      case "d", "i", "u":
        let value: Int
        switch nextArgument() {
        case let int as Int: value = int
        case let int32 as Int32: value = Int(int32)
        case let int64 as Int64: value = Int(int64)
        case let uint as UInt: value = Int(uint)
        case let double as Double: value = Int(double)
        default: value = 0
        }
        rendered = String(value)
        if padZero, value >= 0, rendered.count < width {
          rendered = String(repeating: "0", count: width - rendered.count) + rendered
        }
      case "f", "F":
        let value: Double
        switch nextArgument() {
        case let double as Double: value = double
        case let float as Float: value = Double(float)
        case let int as Int: value = Double(int)
        default: value = 0
        }
        let digits = precision < 0 ? 6 : precision
        var scale = 1.0
        for _ in 0..<digits { scale *= 10 }
        let scaled = (value * scale).rounded()
        if digits == 0 {
          rendered = String(Int(scaled))
        } else {
          let whole = Int(scaled / scale)
          var fraction = String(abs(Int(scaled.truncatingRemainder(dividingBy: scale))))
          if fraction.count < digits {
            fraction = String(repeating: "0", count: digits - fraction.count) + fraction
          }
          rendered = "\(whole).\(fraction)"
        }
      case "@", "s":
        rendered = nextArgument().map { String(describing: $0) } ?? ""
      case "x":
        let value = (nextArgument() as? Int) ?? 0
        rendered = String(value, radix: 16)
        if padZero, rendered.count < width {
          rendered = String(repeating: "0", count: width - rendered.count) + rendered
        }
      default:
        rendered = ""
      }
      result += rendered
      characters = spec
    }
    result += characters
    self = result
  }
}

extension String {
  public func trimmingCharacters(in set: CharacterSet) -> String {
    var view = Substring(self)
    while let first = view.unicodeScalars.first, set.contains(first) {
      view = view.dropFirst()
    }
    while let last = view.unicodeScalars.last, set.contains(last) {
      view = view.dropLast()
    }
    return String(view)
  }

  public func addingPercentEncoding(withAllowedCharacters set: CharacterSet) -> String? {
    var result = ""
    for scalar in unicodeScalars {
      if set.contains(scalar) {
        result.unicodeScalars.append(scalar)
      } else {
        let hexDigits = Array("0123456789ABCDEF")
        for byte in String(scalar).utf8 {
          result.append("%")
          result.append(hexDigits[Int(byte >> 4)])
          result.append(hexDigits[Int(byte & 0x0F)])
        }
      }
    }
    return result
  }

  public func replacingOccurrences(of target: String, with replacement: String) -> String {
    guard !target.isEmpty else { return self }
    var result = ""
    var index = startIndex
    while index < endIndex {
      if self[index...].hasPrefix(target) {
        result += replacement
        index = self.index(index, offsetBy: target.count)
      } else {
        result.append(self[index])
        index = self.index(after: index)
      }
    }
    return result
  }
}
