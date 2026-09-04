// The #Preview macro: kernel files carry Xcode previews; they expand to
// nothing in the web preview build.
@freestanding(declaration)
public macro Preview(@ViewBuilder _ content: () -> any View) =
  #externalMacro(module: "SwiftUIShimMacros", type: "PreviewMacro")

@freestanding(declaration)
public macro Preview(_ name: String, @ViewBuilder _ content: () -> any View) =
  #externalMacro(module: "SwiftUIShimMacros", type: "PreviewMacro")
