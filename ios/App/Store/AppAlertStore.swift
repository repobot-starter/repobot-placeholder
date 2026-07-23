import Foundation

@MainActor
final class AppAlertStore: ObservableObject {
  struct AlertMessage: Equatable {
    let id: String
    let message: String
    let isError: Bool
  }

  @Published var activeAlert: AlertMessage?
}
