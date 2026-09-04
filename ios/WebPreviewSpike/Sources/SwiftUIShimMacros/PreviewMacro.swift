import SwiftCompilerPlugin
import SwiftSyntax
import SwiftSyntaxMacros

/// `#Preview { … }` in kernel files expands to nothing on wasm — previews are
/// an Xcode affordance and the browser demo has its own entry point.
public struct PreviewMacro: DeclarationMacro {
  public static func expansion(
    of node: some FreestandingMacroExpansionSyntax,
    in context: some MacroExpansionContext
  ) throws -> [DeclSyntax] {
    []
  }
}

@main
struct SwiftUIShimMacrosPlugin: CompilerPlugin {
  let providingMacros: [Macro.Type] = [PreviewMacro.self]
}
