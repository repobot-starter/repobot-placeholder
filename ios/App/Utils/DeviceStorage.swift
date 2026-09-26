import Foundation

/// Thin UserDefaults helpers for pack-local persistence (best scores, saved
/// progress) — the native mirror of the web `DeviceStorage` module in
/// `web/core/src/Storage/DeviceStorage.ts`. Values are JSON-encoded `Data`
/// (or plain integers), and corrupt or missing entries fall back instead of
/// throwing.
enum DeviceStorage {
  /// Reads a JSON-encoded value; a missing or undecodable entry yields `fallback`.
  static func readJSON<Value: Decodable>(key: String, fallback: Value) -> Value {
    guard let data = UserDefaults.standard.data(forKey: key),
      let decoded = try? JSONDecoder().decode(Value.self, from: data)
    else { return fallback }
    return decoded
  }

  /// Writes a value as JSON-encoded `Data`; silently a no-op if encoding fails.
  static func writeJSON<Value: Encodable>(key: String, value: Value) {
    if let data = try? JSONEncoder().encode(value) {
      UserDefaults.standard.set(data, forKey: key)
    }
  }

  /// Reads an integer; a missing entry yields `fallback`.
  static func readNumber(key: String, fallback: Int) -> Int {
    guard UserDefaults.standard.object(forKey: key) != nil else { return fallback }
    return UserDefaults.standard.integer(forKey: key)
  }

  /// Writes an integer.
  static func writeNumber(key: String, value: Int) {
    UserDefaults.standard.set(value, forKey: key)
  }
}
