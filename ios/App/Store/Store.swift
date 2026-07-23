import Foundation
import SwiftUI

@MainActor
final class AppStore: ObservableObject {
  let appAlertStore: AppAlertStore
  let sessionStore: SessionStore
  let aiChatStore: AiChatStore
  let aiVoiceStore: AiVoiceStore

  init() {
    self.appAlertStore = AppAlertStore()
    self.sessionStore = SessionStore()
    self.aiChatStore = AiChatStore()
    self.aiVoiceStore = AiVoiceStore()
  }
}
