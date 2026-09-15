#!/usr/bin/env node
// Verifies the kernel's non-game iOS view code stays inside the dialect the
// browser preview renderer (ios/WebPreview) can compile and render.
//
// The renderer IS the contract: the supported surface is parsed at runtime
// from the shim sources (public types and View-extension methods in
// ios/WebPreview/Sources/SwiftUI + the Foundation shim), so shipping a new
// shim capability automatically widens the lint. What this script hardcodes
// is the UNIVERSE of SwiftUI/Foundation names to check against — a name in
// the universe that the shim doesn't export is a violation; identifiers
// outside the universe (app types, stdlib methods) are ignored.
//
// Scope: ios/App/View/**/*.swift minus Games/ (games are out of preview
// scope by design: SpriteKit/Metal/etc.) minus the DEVICE_ONLY list below —
// screens that intentionally use device-only frameworks and never render in
// the browser preview. Adding a new device-only screen requires editing that
// list, which is the point: it makes leaving the preview dialect a reviewed
// decision instead of an accident.
//
// Run: node scripts/verify-ios-preview-dialect.mjs  (exit 1 on violations)
import { readdirSync, readFileSync } from "node:fs"
import { join, relative } from "node:path"

const REPO_ROOT = new URL("..", import.meta.url).pathname
const VIEW_ROOT = join(REPO_ROOT, "ios/App/View")
const SHIM_ROOT = join(REPO_ROOT, "ios/WebPreview/Sources")

// Screens that use device-only frameworks and are excluded from the preview
// dialect (they still build for device via Xcode). Framework named for the
// record; the whole file is skipped.
const DEVICE_ONLY = {
    "Settings/SettingsView.swift": "PhotosUI (avatar picker)",
    "SignIn/SignInView.swift": "AuthenticationServices (Sign in with Apple)",
}

// Frameworks preview-eligible files may import.
const ALLOWED_IMPORTS = new Set(["SwiftUI", "Foundation", "CoreGraphics"])

// ---------------------------------------------------------------------------
// SwiftUI universe: names this lint understands. Views/types first.
const SWIFTUI_TYPE_UNIVERSE = new Set([
    // Containers and structure
    "VStack",
    "HStack",
    "ZStack",
    "LazyVStack",
    "LazyHStack",
    "LazyVGrid",
    "LazyHGrid",
    "Grid",
    "GridRow",
    "GridItem",
    "Group",
    "ForEach",
    "Spacer",
    "Divider",
    "EmptyView",
    "AnyView",
    "ViewThatFits",
    "TupleView",
    // Scrolling and geometry
    "ScrollView",
    "ScrollViewReader",
    "GeometryReader",
    // Text and controls
    "Text",
    "TextField",
    "SecureField",
    "TextEditor",
    "Button",
    "Toggle",
    "Picker",
    "Slider",
    "Stepper",
    "DatePicker",
    "ProgressView",
    "Label",
    "Link",
    "ShareLink",
    "Menu",
    "ContextMenu",
    "Gauge",
    "ColorPicker",
    // Navigation and presentation
    "NavigationStack",
    "NavigationView",
    "NavigationLink",
    "NavigationSplitView",
    "TabView",
    "List",
    "Form",
    "Section",
    "OutlineGroup",
    "DisclosureGroup",
    "Table",
    "Alert",
    "ContentUnavailableView",
    // Media and drawing
    "Image",
    "AsyncImage",
    "Canvas",
    "TimelineView",
    "VideoPlayer",
    "Map",
    "SpriteView",
    "SceneView",
    "PhotosPicker",
    "SignInWithAppleButton",
    // Shapes and paint
    "Rectangle",
    "RoundedRectangle",
    "Capsule",
    "Circle",
    "Ellipse",
    "Path",
    "Color",
    "LinearGradient",
    "RadialGradient",
    "AngularGradient",
    "Gradient",
    "UnitPoint",
    "Angle",
    "StrokeStyle",
    // Text/layout support types
    "Font",
    "Alignment",
    "HorizontalAlignment",
    "VerticalAlignment",
    "Edge",
    "EdgeInsets",
    "Animation",
    "AnyTransition",
    "KeyEquivalent",
    "EventModifiers",
    "AccessibilityTraits",
    "DragGesture",
    "TapGesture",
    "LongPressGesture",
    "MagnificationGesture",
    "RotationGesture",
    // Property wrappers / data flow (constructed like types in code)
    "State",
    "Binding",
    "Environment",
    "EnvironmentObject",
    "StateObject",
    "ObservedObject",
    "FocusState",
    "AppStorage",
    "SceneStorage",
    "Namespace",
])

// Modifier/method universe: `.name(` occurrences checked against the shim.
const SWIFTUI_MODIFIER_UNIVERSE = new Set([
    // Text styling
    "font",
    "fontWeight",
    "fontDesign",
    "bold",
    "italic",
    "underline",
    "strikethrough",
    "kerning",
    "tracking",
    "monospaced",
    "monospacedDigit",
    "lineLimit",
    "lineSpacing",
    "multilineTextAlignment",
    "truncationMode",
    "textCase",
    "minimumScaleFactor",
    "baselineOffset",
    "textSelection",
    // Color and decoration
    "foregroundStyle",
    "foregroundColor",
    "tint",
    "background",
    "overlay",
    "border",
    "shadow",
    "opacity",
    "blur",
    "brightness",
    "contrast",
    "saturation",
    "grayscale",
    "hueRotation",
    "colorInvert",
    "blendMode",
    "mask",
    "clipShape",
    "clipped",
    "cornerRadius",
    "compositingGroup",
    "drawingGroup",
    // Layout
    "frame",
    "padding",
    "offset",
    "position",
    "fixedSize",
    "layoutPriority",
    "alignmentGuide",
    "zIndex",
    "aspectRatio",
    "scaledToFit",
    "scaledToFill",
    "containerRelativeFrame",
    "ignoresSafeArea",
    "safeAreaInset",
    "coordinateSpace",
    "contentShape",
    // Effects and transforms
    "scaleEffect",
    "rotationEffect",
    "rotation3DEffect",
    "transformEffect",
    "projectionEffect",
    "matchedGeometryEffect",
    "geometryGroup",
    // Interaction
    "onTapGesture",
    "onLongPressGesture",
    "gesture",
    "simultaneousGesture",
    "highPriorityGesture",
    "disabled",
    "allowsHitTesting",
    "hidden",
    "keyboardShortcut",
    "onHover",
    "hoverEffect",
    "focusable",
    "focused",
    "submitLabel",
    "onSubmit",
    "onDrag",
    "onDrop",
    "draggable",
    "dropDestination",
    "refreshable",
    "swipeActions",
    // Lifecycle and state
    "onAppear",
    "onDisappear",
    "onChange",
    "task",
    "id",
    "tag",
    "environment",
    "environmentObject",
    "transaction",
    "animation",
    "transition",
    // Control configuration
    "buttonStyle",
    "textFieldStyle",
    "toggleStyle",
    "pickerStyle",
    "labelStyle",
    "progressViewStyle",
    "listStyle",
    "menuStyle",
    "gaugeStyle",
    "controlSize",
    "keyboardType",
    "textInputAutocapitalization",
    "autocorrectionDisabled",
    "textContentType",
    // Scrolling
    "scrollIndicators",
    "scrollDisabled",
    "scrollTargetBehavior",
    "scrollPosition",
    "scrollClipDisabled",
    "defaultScrollAnchor",
    // Navigation and presentation
    "navigationTitle",
    "navigationBarTitleDisplayMode",
    "navigationBarHidden",
    "navigationDestination",
    "toolbar",
    "toolbarBackground",
    "sheet",
    "fullScreenCover",
    "popover",
    "alert",
    "confirmationDialog",
    "presentationDetents",
    "presentationDragIndicator",
    "interactiveDismissDisabled",
    "badge",
    "listRowBackground",
    "listRowSeparator",
    "listRowInsets",
    "searchable",
    "statusBarHidden",
    "persistentSystemOverlays",
    "tabItem",
    // Accessibility
    "accessibilityLabel",
    "accessibilityHidden",
    "accessibilityAddTraits",
    "accessibilityValue",
    "accessibilityHint",
    "accessibilityIdentifier",
    "accessibilityElement",
    "accessibilitySortPriority",
    // Symbols and content
    "symbolRenderingMode",
    "symbolEffect",
    "symbolVariant",
    "imageScale",
    "contentTransition",
    "sensoryFeedback",
    "resizable",
    "interpolation",
    "renderingMode",
    "antialiased",
    // Shape methods
    "fill",
    "stroke",
    "strokeBorder",
    "trim",
    "rotation",
    "scale",
    // Foundation formatting on values inside view code (never shimmed:
    // FormatStyle is ICU-backed)
    "formatted",
    "localizedString",
    "localizedStandardCompare",
    "localizedCaseInsensitiveContains",
    "loadTransferable",
])

// Foundation i18n/device types that must never appear in preview-eligible
// code UNLESS the Foundation shim exports a replacement (checked below).
const FOUNDATION_TYPE_UNIVERSE = new Set([
    "DateFormatter",
    "NumberFormatter",
    "ISO8601DateFormatter",
    "DateComponentsFormatter",
    "RelativeDateTimeFormatter",
    "ByteCountFormatter",
    "MeasurementFormatter",
    "PersonNameComponentsFormatter",
    "ListFormatter",
    "Calendar",
    "TimeZone",
    "Locale",
    "Scanner",
    "CharacterSet",
    "NSRegularExpression",
    "Measurement",
    "UnitLength",
    "NotificationCenter",
    "FileManager",
    "Process",
    "Bundle",
    "URLSession",
    "Timer",
])

// ---------------------------------------------------------------------------
// Parse the shim: everything it exports is supported.
function collectShimSurface() {
    const types = new Set()
    const methods = new Set()
    const shimFiles = []
    for (const dir of ["SwiftUI", "Foundation", "CoreGraphics"]) {
        const root = join(SHIM_ROOT, dir)
        for (const entry of readdirSync(root, { recursive: true })) {
            if (entry.toString().endsWith(".swift")) shimFiles.push(join(root, entry.toString()))
        }
    }
    for (const file of shimFiles) {
        const source = readFileSync(file, "utf8")
        for (const match of source.matchAll(
            /public (?:struct|enum|final class|class|protocol|typealias) (\w+)/g,
        )) {
            types.add(match[1])
        }
        // Any public func counts as a supported method/modifier; static
        // factory members (Font.custom, Animation.easeInOut, …) are methods too.
        for (const match of source.matchAll(/public (?:static )?func (\w+)\s*[(<]/g)) {
            methods.add(match[1])
        }
        // Property-style API surfaced as vars (e.g. `public var inverted`).
        for (const match of source.matchAll(/public (?:static )?(?:var|let) (\w+)/g)) {
            methods.add(match[1])
        }
    }
    return { types, methods }
}

// Types declared anywhere in the app's iOS tree shadow universe names
// (e.g. MenuContent's own `Section` struct); uses of those are app types,
// not SwiftUI.
function collectLocalTypes(files) {
    const local = new Set()
    for (const { source } of files) {
        for (const match of source.matchAll(/(?:struct|enum|final class|class|actor) (\w+)/g)) {
            local.add(match[1])
        }
    }
    return local
}

function listSwiftFiles(root) {
    const files = []
    for (const entry of readdirSync(root, { recursive: true })) {
        const path = entry.toString()
        if (!path.endsWith(".swift")) continue
        if (path.startsWith("Games/") || path.includes("/Games/")) continue
        files.push({
            path,
            source: readFileSync(join(root, path), "utf8"),
        })
    }
    return files
}

function stripCommentsAndStrings(source) {
    return source
        .replace(/\/\/[^\n]*/g, "")
        .replace(/"""[\s\S]*?"""/g, '""')
        .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
}

// ---------------------------------------------------------------------------
const shim = collectShimSurface()
const allFiles = listSwiftFiles(VIEW_ROOT)
const localTypes = collectLocalTypes(allFiles)
const violations = []
const skipped = []

for (const { path, source } of allFiles) {
    if (DEVICE_ONLY[path]) {
        skipped.push(`${path} (device-only: ${DEVICE_ONLY[path]})`)
        continue
    }
    const code = stripCommentsAndStrings(source)
    const lines = code.split("\n")

    lines.forEach((line, index) => {
        const where = `ios/App/View/${path}:${index + 1}`

        for (const match of line.matchAll(/^\s*import (\w+)/g)) {
            if (!ALLOWED_IMPORTS.has(match[1])) {
                violations.push(
                    `${where}: import ${match[1]} — device-only framework; ` +
                        `add the file to DEVICE_ONLY or drop the dependency`,
                )
            }
        }

        // Type constructions / static member access: Name( or Name { or Name.
        for (const match of line.matchAll(/\b([A-Z]\w*)\s*[({.]/g)) {
            const name = match[1]
            if (localTypes.has(name)) continue
            const inSwiftUIUniverse = SWIFTUI_TYPE_UNIVERSE.has(name)
            const inFoundationUniverse = FOUNDATION_TYPE_UNIVERSE.has(name)
            if (!inSwiftUIUniverse && !inFoundationUniverse) continue
            if (!shim.types.has(name)) {
                const kind = inFoundationUniverse
                    ? "Foundation API with no shim replacement"
                    : "unsupported view/type"
                violations.push(`${where}: ${name} — ${kind} (renderer contract: ios/WebPreview)`)
            }
        }

        // Modifier / method calls.
        for (const match of line.matchAll(/\.(\w+)\s*\(/g)) {
            const name = match[1]
            if (!SWIFTUI_MODIFIER_UNIVERSE.has(name)) continue
            if (!shim.methods.has(name)) {
                violations.push(
                    `${where}: .${name}( — unsupported modifier (renderer contract: ios/WebPreview)`,
                )
            }
        }
    })
}

const checked = allFiles.length - skipped.length
if (violations.length > 0) {
    console.error(`iOS preview dialect check FAILED (${violations.length} violation(s)):\n`)
    for (const violation of violations) console.error(`  ${violation}`)
    console.error(
        `\nThe browser preview renderer (ios/WebPreview) does not support these.` +
            `\nEither use a supported equivalent (see ios/WebPreview/README.md), extend` +
            `\nthe shim, or — for genuinely device-only screens — add the file to the` +
            `\nDEVICE_ONLY list in scripts/verify-ios-preview-dialect.mjs.`,
    )
    process.exit(1)
}

console.log(
    `iOS preview dialect check passed: ${checked} non-game view files inside the dialect` +
        (skipped.length > 0
            ? `; ${skipped.length} device-only file(s) skipped:\n  ${skipped.join("\n  ")}`
            : "."),
)
