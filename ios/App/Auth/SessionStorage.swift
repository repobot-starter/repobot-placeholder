import Foundation

protocol SessionStorage {
  func loadSession() -> AuthSession?
  func persistSession(_ session: AuthSession)
  func clearSession()
}

final class UserDefaultsSessionStorage: SessionStorage {
  private enum Constants {
    static let key = "base.ios.auth.session"
  }

  private let defaults: UserDefaults

  init(defaults: UserDefaults = .standard) {
    self.defaults = defaults
  }

  func loadSession() -> AuthSession? {
    guard let data = defaults.data(forKey: Constants.key) else {
      return nil
    }
    return try? JSONDecoder().decode(AuthSession.self, from: data)
  }

  func persistSession(_ session: AuthSession) {
    guard let data = try? JSONEncoder().encode(session) else {
      return
    }
    defaults.set(data, forKey: Constants.key)
  }

  func clearSession() {
    defaults.removeObject(forKey: Constants.key)
  }
}
