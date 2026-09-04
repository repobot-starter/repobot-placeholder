import type { Preview } from "@storybook/react"
import { UiThemeProvider } from "../src/theme/UiThemeProvider"

const preview: Preview = {
    globalTypes: {
        themeMode: {
            description: "Design-system theme",
            toolbar: {
                title: "Theme",
                items: ["light", "dark"],
                dynamicTitle: true,
            },
        },
    },
    initialGlobals: {
        themeMode: "light",
    },
    decorators: [
        (Story, context) => {
            const mode = context.globals.themeMode === "dark" ? "dark" : "light"
            // UiThemeProvider prefers the persisted mode; align it with the toolbar.
            window.localStorage.setItem("base.themeMode", mode)
            return (
                <UiThemeProvider key={mode} defaultMode={mode}>
                    <div style={{ padding: 16 }}>
                        <Story />
                    </div>
                </UiThemeProvider>
            )
        },
    ],
}

export default preview
