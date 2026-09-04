import Foundation

struct AuthSession: Equatable, Codable {
  let accessToken: String
  let refreshToken: String?
  let expiresAt: Date?
  let email: String?
}

/// Thrown by sign-in calls when the identity has two-factor authentication
/// enabled: the primary factor was accepted and the client now holds a
/// pending challenge that verifyMfaCode answers (mirrors web/core's
/// MfaRequiredError).
struct MfaRequiredError: Error, LocalizedError {
  var errorDescription: String? {
    "Enter the 6-digit code from your authenticator app."
  }
}

/// What TOTP enrollment hands back (mirrors web/core's MfaEnrollment).
struct MfaEnrollment: Equatable {
  /// The base32 TOTP secret, for manual entry into an authenticator app.
  let secret: String
  /// The otpauth:// URI — opened directly on iOS to enroll the installed
  /// authenticator app (web renders it as a QR instead).
  let otpauthUri: String
}

struct AuthState: Equatable {
  var session: AuthSession?
  var hydratedUser: CurrentUserData?
  var isHydratingUser: Bool
  /// True while a sign-in action (send code / verify / local sign-in) runs.
  var isSigningIn: Bool
  /// True while a sign-in awaits its second factor (see verifyMfaCode);
  /// the sign-in screen shows the challenge view instead of signing in.
  var isMfaChallengePending: Bool
  var lastError: String?
  var successMessage: String?
}
