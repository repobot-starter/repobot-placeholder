// Spike entry point: mount the kernel's real FolioView (compiled unmodified
// from ios/App/View/Folio/) into the DOM.
import SwiftUI

_WebRuntime.mount(FolioView())
