import path from "node:path"
import { fileURLToPath } from "node:url"
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    // vanilla-extract compiles the *.styles.css.ts files the views import;
    // without it every component test fails at import time.
    plugins: [react(), vanillaExtractPlugin()],
    resolve: {
        dedupe: ["react", "react-dom"],
        alias: {
            // The component registry (eject seam) — see src/Theme/ui.ts.
            "@ui": path.resolve(dirname, "src/Theme/ui.ts"),
        },
    },
    test: {
        include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
        environment: "happy-dom",
        coverage: {
            enabled: false,
        },
    },
})
