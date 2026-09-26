// Preview entry point. Kernel screen files (symlinked in Kernel/) compile
// unmodified into this target; ?screen=<name> picks which one to mount.
import Foundation
import JavaScriptKit
import SwiftUI

let search = JSObject.global.location.search.string ?? ""
let screen: String = {
  for pair in search.dropFirst().split(separator: "&") {
    let parts = pair.split(separator: "=", maxSplits: 1)
    if parts.count == 2, parts[0] == "screen" {
      return String(parts[1])
    }
  }
  return "folio"
}()

switch screen {
case "quiz":
  _WebRuntime.mount(QuizView())
case "menu":
  _WebRuntime.mount(MenuView())
default:
  _WebRuntime.mount(FolioView())
}
