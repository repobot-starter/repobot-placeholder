import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin"
import type { StorybookConfig } from "@storybook/react-vite"

const config: StorybookConfig = {
    stories: ["../src/**/*.stories.tsx"],
    framework: {
        name: "@storybook/react-vite",
        options: {},
    },
    core: {
        disableTelemetry: true,
    },
    async viteFinal(viteConfig) {
        viteConfig.plugins = [...(viteConfig.plugins ?? []), vanillaExtractPlugin()]
        return viteConfig
    },
}

export default config
