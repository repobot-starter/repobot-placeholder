import SwiftUI

/// Local theme preference. The kernel schema has no user theme field; the app
/// follows the system appearance. If you add a persisted preference, extend
/// this enum and store it in a profile store.
enum ThemePreference: Equatable {
  case light
  case dark
  case system
}

enum UiThemeMode: Equatable {
  case light
  case dark
}

struct UiThemeTokens: Equatable {
  struct Typography: Equatable {
    struct Sizes: Equatable {
      let xs: CGFloat
      let sm: CGFloat
      let md: CGFloat
      let lg: CGFloat
      let xl: CGFloat
    }
    struct Weights: Equatable {
      let regular: Font.Weight
      let medium: Font.Weight
      let semibold: Font.Weight
      let bold: Font.Weight
    }
    /// repobot.theme.json `fontFamily` preset key (via GeneratedTheme).
    let fontPreset: String
    let sizes: Sizes
    let lineTight: CGFloat
    let lineNormal: CGFloat
    let lineRelaxed: CGFloat
    let weights: Weights

    /// Body font for the contract's preset: bundled custom family (TTFs in
    /// App/Fonts, declared via Info.plist UIAppFonts) or a system design.
    func font(size: CGFloat, weight: Font.Weight = .regular) -> Font {
      if let family = ThemeFontResolver.customFamily {
        return Font.custom(family, size: size).weight(weight)
      }
      return Font.system(size: size, weight: weight, design: ThemeFontResolver.systemDesign)
    }
  }

  struct Colors: Equatable {
    let appBg: Color
    let surface: Color
    let surfaceAlt: Color
    let textPrimary: Color
    let textSecondary: Color
    let border: Color
    let hover: Color
    let accent: Color
    let accentText: Color
    let overlayBackdrop: Color
    let shadowSm: Color
    let shadowMd: Color
    let shadowLg: Color
    let shadowXl: Color
    let statusSuccess: Color
    let statusError: Color
    let statusWarning: Color
    let statusInfo: Color
    let statusSuccessBg: Color
    let statusErrorBg: Color
    let statusWarningBg: Color
    let statusInfoBg: Color
  }

  struct Spacing: Equatable {
    let xxs: CGFloat
    let xs: CGFloat
    let sm: CGFloat
    let md: CGFloat
    let lg: CGFloat
    let xl: CGFloat
  }

  struct Radius: Equatable {
    let sm: CGFloat
    let md: CGFloat
    let lg: CGFloat
    let pill: CGFloat
  }

  let mode: UiThemeMode
  let typography: Typography
  let colors: Colors
  let spacing: Spacing
  let radius: Radius
}

/// Maps the repobot.theme.json `fontFamily` preset to what iOS can render.
/// Web resolves the same presets to CSS stacks (themeConfig.ts); the custom
/// families ship as variable TTFs in App/Fonts.
enum ThemeFontResolver {
  static let preset = GeneratedTheme.fontFamily

  /// Bundled family name for web-font presets, nil for system designs.
  static var customFamily: String? {
    switch preset {
    case "inter": return "Inter"
    case "manrope": return "Manrope"
    case "source-serif": return "Source Serif 4"
    case "space-grotesk": return "Space Grotesk"
    case "plex-mono": return "IBM Plex Mono"
    default: return nil
    }
  }

  /// System font design for the built-in presets.
  static var systemDesign: Font.Design {
    switch preset {
    case "serif": return .serif
    case "rounded": return .rounded
    case "mono": return .monospaced
    default: return .default
    }
  }
}

extension View {
  /// Applies the contract's font family to all otherwise-unstyled text.
  /// Sizes stay untouched for the built-in presets (design-only); custom
  /// families anchor to the body text style so Dynamic Type still scales.
  @ViewBuilder
  func themedFontFamily() -> some View {
    if let family = ThemeFontResolver.customFamily {
      font(.custom(family, size: 17, relativeTo: .body))
    } else if ThemeFontResolver.systemDesign != .default {
      fontDesign(ThemeFontResolver.systemDesign)
    } else {
      self
    }
  }
}

enum ThemeResolver {
  static func resolveMode(preference: ThemePreference, systemColorScheme: ColorScheme) -> UiThemeMode {
    switch preference {
    case .light:
      return .light
    case .dark:
      return .dark
    case .system:
      return systemColorScheme == .dark ? .dark : .light
    }
  }
}

enum ThemeCatalog {
  static func uiTokens(mode: UiThemeMode) -> UiThemeTokens {
    let typography = UiThemeTokens.Typography(
      fontPreset: GeneratedTheme.fontFamily,
      sizes: .init(xs: 12, sm: 13, md: 14, lg: 16, xl: 20),
      lineTight: 1.25,
      lineNormal: 1.4,
      lineRelaxed: 1.55,
      weights: .init(regular: .regular, medium: .medium, semibold: .semibold, bold: .bold)
    )
    // Spacing/radius scales and brand accents come from GeneratedTheme.swift,
    // regenerated from repobot.theme.json (`npm run codegen`) so all platforms
    // share the contract's brand. Neutral surfaces stay native-tuned below.
    let spacing = UiThemeTokens.Spacing(
      xxs: GeneratedTheme.spaceXxs,
      xs: GeneratedTheme.spaceXs,
      sm: GeneratedTheme.spaceSm,
      md: GeneratedTheme.spaceMd,
      lg: GeneratedTheme.spaceLg,
      xl: GeneratedTheme.spaceXl
    )
    let radius = UiThemeTokens.Radius(
      sm: GeneratedTheme.radiusSm,
      md: GeneratedTheme.radiusMd,
      lg: GeneratedTheme.radiusLg,
      pill: GeneratedTheme.radiusPill
    )
    switch mode {
    case .dark:
      return UiThemeTokens(
        mode: mode,
        typography: typography,
        colors: .init(
          appBg: Color(hex: "#080b14"),
          surface: Color(hex: "#0f1524"),
          surfaceAlt: Color(hex: "#161f34"),
          textPrimary: Color(hex: "#f4f7ff"),
          textSecondary: Color(hex: "#aeb8ce"),
          border: Color(hex: "#2a3550"),
          hover: Color(hex: "#1b2640"),
          accent: Color(hex: GeneratedTheme.accentDark),
          accentText: Color(hex: GeneratedTheme.accentTextDark),
          overlayBackdrop: Color(rgba: "rgba(0, 0, 0, 0.44)"),
          shadowSm: Color(rgba: "rgba(0, 0, 0, 0.16)"),
          shadowMd: Color(rgba: "rgba(0, 0, 0, 0.18)"),
          shadowLg: Color(rgba: "rgba(0, 0, 0, 0.24)"),
          shadowXl: Color(rgba: "rgba(0, 0, 0, 0.24)"),
          statusSuccess: Color(hex: "#86efac"),
          statusError: Color(hex: "#fca5a5"),
          statusWarning: Color(hex: "#fcd34d"),
          statusInfo: Color(hex: "#93c5fd"),
          statusSuccessBg: Color(rgba: "rgba(34, 197, 94, 0.22)"),
          statusErrorBg: Color(rgba: "rgba(239, 68, 68, 0.22)"),
          statusWarningBg: Color(rgba: "rgba(245, 158, 11, 0.22)"),
          statusInfoBg: Color(rgba: "rgba(59, 130, 246, 0.24)")
        ),
        spacing: spacing,
        radius: radius
      )
    case .light:
      return UiThemeTokens(
        mode: mode,
        typography: typography,
        colors: .init(
          appBg: Color(hex: "#ffffff"),
          surface: Color(hex: "#ffffff"),
          surfaceAlt: Color(hex: "#f0f0f0"),
          textPrimary: Color(hex: "#171717"),
          textSecondary: Color(hex: "#6b6b6b"),
          border: Color(hex: "#e5e5e5"),
          hover: Color(hex: "#efefef"),
          accent: Color(hex: GeneratedTheme.accentLight),
          accentText: Color(hex: GeneratedTheme.accentTextLight),
          overlayBackdrop: Color(rgba: "rgba(0, 0, 0, 0.34)"),
          shadowSm: Color(rgba: "rgba(0, 0, 0, 0.06)"),
          shadowMd: Color(rgba: "rgba(0, 0, 0, 0.08)"),
          shadowLg: Color(rgba: "rgba(0, 0, 0, 0.12)"),
          shadowXl: Color(rgba: "rgba(0, 0, 0, 0.14)"),
          statusSuccess: Color(hex: "#166534"),
          statusError: Color(hex: "#991b1b"),
          statusWarning: Color(hex: "#92400e"),
          statusInfo: Color(hex: "#1e40af"),
          statusSuccessBg: Color(rgba: "rgba(34, 197, 94, 0.58)"),
          statusErrorBg: Color(rgba: "rgba(239, 68, 68, 0.58)"),
          statusWarningBg: Color(rgba: "rgba(245, 158, 11, 0.58)"),
          statusInfoBg: Color(rgba: "rgba(59, 130, 246, 0.58)")
        ),
        spacing: spacing,
        radius: radius
      )
    }
  }
}

private struct UiThemeTokensEnvironmentKey: EnvironmentKey {
  // Light is the default, matching web (signed-out pages render light).
  static let defaultValue = ThemeCatalog.uiTokens(mode: .light)
}

extension EnvironmentValues {
  var uiThemeTokens: UiThemeTokens {
    get { self[UiThemeTokensEnvironmentKey.self] }
    set { self[UiThemeTokensEnvironmentKey.self] = newValue }
  }
}
