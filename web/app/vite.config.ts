import path from "node:path"
import { fileURLToPath } from "node:url"
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    plugins: [react(), vanillaExtractPlugin()],
    server: {
        port: 5173,
    },
    resolve: {
        // @base/core and @base/design-system are source-consumed workspace
        // packages; dedupe so only one React instance is ever bundled.
        dedupe: ["react", "react-dom"],
        alias: {
            // The component registry (eject seam) — see src/Theme/ui.ts.
            "@ui": path.resolve(dirname, "src/Theme/ui.ts"),
        },
    },
})
