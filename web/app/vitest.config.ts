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
        // No real sockets from tests, ever — see the setup file for the
        // SIGABRT story this prevents.
        setupFiles: ["tests/setupNoNetwork.ts"],
        // Child-process forks, NOT worker threads. Threads bought ~15% suite
        // time by sharing one process — and that sharing let a single native
        // abort (happy-dom teardown racing in-flight work under load) kill
        // the ENTIRE run as an unreportable SIGABRT. It did exactly that to
        // template publish gates mid-deploy, twice, while the same suite
        // passed standalone. Forks contain a crash to one worker and 15% of
        // 17s is not worth an irreproducible red gate.
        pool: "forks",
        // Capped: agent quality gates run on shared workspace pods where a
        // worker-per-core vitest starves the pod's health probes (kubelet
        // then kills the pod mid-run). The suite is small; two is plenty.
        maxWorkers: 2,
        minWorkers: 1,
        coverage: {
            enabled: false,
        },
    },
})
