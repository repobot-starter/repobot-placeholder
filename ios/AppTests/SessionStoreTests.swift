import XCTest
import ApolloAPI
import AppGraphqlApi
@testable import AppIOS

@MainActor
final class SessionStoreTests: XCTestCase {
  func testInitialStateIsSignedOut() {
    let store = SessionStore()

    XCTAssertNil(store.state.session)
    XCTAssertNil(store.state.hydratedUser)
    XCTAssertFalse(store.isAuthenticated)
    XCTAssertFalse(store.hasHydratedUser)
  }

  func testSetSessionMarksAuthenticated() {
    let store = SessionStore()

    store.setSession(makeSession(email: "person@example.com"))

    XCTAssertTrue(store.isAuthenticated)
    XCTAssertFalse(store.hasHydratedUser)
  }

  func testHydratedUserFlagsFollowStateMutations() {
    let store = SessionStore()

    store.setHydratedUser(makeHydratedUser(id: "user_1", email: "person@example.com"))

    XCTAssertTrue(store.hasHydratedUser)
  }

  func testReportErrorAndSuccessAreMutuallyExclusive() {
    let store = SessionStore()

    store.reportError("boom")
    XCTAssertEqual(store.state.lastError, "boom")
    XCTAssertNil(store.state.successMessage)

    store.reportSuccess("done")
    XCTAssertNil(store.state.lastError)
    XCTAssertEqual(store.state.successMessage, "done")

    store.clearStatusMessages()
    XCTAssertNil(store.state.lastError)
    XCTAssertNil(store.state.successMessage)
  }

  func testResetForSignOutClearsSessionState() {
    let store = SessionStore()
    store.setSession(makeSession(email: "person@example.com"))
    store.setHydratedUser(makeHydratedUser(id: "user_1", email: "person@example.com"))
    store.setHydratingUser(true)
    store.reportError("stale error")

    store.resetForSignOut()

    XCTAssertNil(store.state.session)
    XCTAssertNil(store.state.hydratedUser)
    XCTAssertFalse(store.state.isHydratingUser)
    XCTAssertNil(store.state.lastError)
  }
}

// MARK: - Test data

private func makeSession(email: String) -> AuthSession {
  AuthSession(accessToken: "token", refreshToken: nil, expiresAt: nil, email: email)
}

private func makeHydratedUser(id: String, email: String) -> CurrentUserData {
  let data: [String: AnyHashable] = [
    "__typename": "User",
    "id": id,
    "email": email,
    "displayName": "Person User",
    "status": "ACTIVE",
    "createdTime": "2026-07-18T00:00:00.000Z",
    "account": NSNull(),
  ]
  return CurrentUserData(unsafelyWithData: data)
}
