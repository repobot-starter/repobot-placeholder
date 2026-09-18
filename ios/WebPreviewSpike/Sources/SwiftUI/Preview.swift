// No-op #Preview so kernel files with Xcode preview blocks compile unmodified.
@freestanding(declaration)
public macro Preview(_ name: String? = nil, body: @escaping () -> any View) =
  #externalMacro(module: "SwiftUIShimMacros", type: "PreviewMacro")
