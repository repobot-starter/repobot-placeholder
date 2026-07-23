import Foundation

/// The auth method registry, mirroring web/core's AuthMethods.ts: one place
/// that names every sign-in method the kernel knows how to render and wire.
/// Products opt into methods via the AUTH_METHODS config value
/// (comma-separated), so adding a method to a product is config — not code
/// spread across three platforms.
enum AuthMethod: String, CaseIterable {
  case emailCode = "email-code"
  case password
  case google
  case anonymous
}

/// Parses the configured method list into a deduped, validated array,
/// preserving the configured order (which is also the render order of the
/// sign-in surface). Unknown names are ignored. Falls back to email codes —
/// the one method every provisioned project supports with zero extra setup.
func resolveAuthMethods(methodsValue: String?) -> [AuthMethod] {
  var resolved: [AuthMethod] = []
  for raw in (methodsValue ?? "").split(separator: ",", omittingEmptySubsequences: false) {
    let name = raw.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    guard let method = AuthMethod(rawValue: name), !resolved.contains(method) else {
      continue
    }
    resolved.append(method)
  }
  if resolved.isEmpty {
    resolved.append(.emailCode)
  }
  return resolved
}
