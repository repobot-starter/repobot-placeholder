import Foundation

struct AuthSession: Equatable, Codable {
  let accessToken: String
  let refreshToken: String?
  let expiresAt: Date?
  let email: String?
}

struct AuthState: Equatable {
  var session: AuthSession?
  var hydratedUser: CurrentUserData?
  var isHydratingUser: Bool
  /// True while a sign-in action (send code / verify / local sign-in) runs.
  var isSigningIn: Bool
  var lastError: String?
  var successMessage: String?
}
