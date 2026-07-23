import XCTest
@testable import AppIOS

/// Parity tests for resolveAuthMethods against web/core's AuthMethods.ts:
/// same parsing semantics (trim, lowercase, ignore unknown, dedupe, preserve
/// configured order, default to email codes).
final class AuthMethodsTests: XCTestCase {
  func testDefaultsToEmailCodeWhenNil() {
    XCTAssertEqual(resolveAuthMethods(methodsValue: nil), [.emailCode])
  }

  func testDefaultsToEmailCodeWhenEmpty() {
    XCTAssertEqual(resolveAuthMethods(methodsValue: ""), [.emailCode])
    XCTAssertEqual(resolveAuthMethods(methodsValue: "   "), [.emailCode])
    XCTAssertEqual(resolveAuthMethods(methodsValue: ","), [.emailCode])
  }

  func testDefaultsToEmailCodeWhenOnlyGarbage() {
    XCTAssertEqual(resolveAuthMethods(methodsValue: "magic-beans, saml"), [.emailCode])
  }

  func testPreservesConfiguredOrder() {
    XCTAssertEqual(
      resolveAuthMethods(methodsValue: "google, email-code"),
      [.google, .emailCode]
    )
    XCTAssertEqual(
      resolveAuthMethods(methodsValue: "password,email-code,anonymous"),
      [.password, .emailCode, .anonymous]
    )
  }

  func testDedupesRepeatedMethods() {
    XCTAssertEqual(
      resolveAuthMethods(methodsValue: "google,google,email-code,google"),
      [.google, .emailCode]
    )
  }

  func testIgnoresUnknownNamesAmongKnownOnes() {
    XCTAssertEqual(
      resolveAuthMethods(methodsValue: "facebook, google, magic-beans, anonymous"),
      [.google, .anonymous]
    )
  }

  func testToleratesWhitespaceAndCase() {
    XCTAssertEqual(
      resolveAuthMethods(methodsValue: "  GOOGLE ,\tEmail-Code , PASSWORD  "),
      [.google, .emailCode, .password]
    )
  }

  func testAcceptsEveryKnownMethod() {
    XCTAssertEqual(
      resolveAuthMethods(methodsValue: "email-code,password,google,anonymous"),
      AuthMethod.allCases
    )
  }
}
